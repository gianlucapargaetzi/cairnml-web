// usage: node crawl.js <outdir> [width=1600] [height=900] [light|dark] [pages|dialogs]
const fs = require('fs');
const {open, settle} = require('./lib');
const {measurePage, measureOverlay} = require('./measure');
const out = process.argv[2] || 'run';
const MODE = process.argv[6] || 'pages'; // pages | dialogs
const width = +(process.argv[3] || 1600), height = +(process.argv[4] || 900), dark = process.argv[5] === 'dark';
const BASE = 'http://localhost/cairnml';
const ids = JSON.parse(fs.readFileSync('seed-ids.json'));
const pid = ids.projects[0];
const slug = s => s.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '').toLowerCase().slice(0, 90) || 'root';
const UNSAFE = /(delete|remove|revoke|clear|reset|archive|abort|stop|terminate|dequeue|publish|discard|logout|log out|sign out|disable|enqueue now|restore)/i;
const results = {meta: {width, height, dark}, pages: [], overlays: []};
fs.mkdirSync(`${out}/shots`, {recursive: true});

(async () => {
  const {browser, page} = await open({width, height, dark});
  const visit = async (url, ms = 2800) => { await page.goto(url.startsWith('http') ? url : `${BASE}/${url}`).catch(() => {}); await settle(page, ms); };
  const snap = async (name, note) => {
    const file = slug(name);
    await page.screenshot({path: `${out}/shots/${file}.png`});
    const m = await page.evaluate(measurePage).catch(() => ({}));
    m.name = name; m.file = file; m.url = page.url().replace(BASE, ''); m.note = note || '';
    results.pages.push(m);
    console.log('PAGE', name, '->', m.url.slice(0, 90));
    return m;
  };
  const tabsOf = async (sel) => page.$$eval(sel, els => els.filter(e => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0; }).map(e => (e.innerText || '').trim()));
  const clickTabs = async (prefix, sel) => {
    const labels = await tabsOf(sel);
    for (let i = 0; i < labels.length; i++) {
      try {
        const els = (await page.$$(sel)).filter(Boolean);
        const vis = [];
        for (const e of els) if (await e.isVisible().catch(() => false)) vis.push(e);
        if (!vis[i]) continue;
        await vis[i].click({timeout: 3000});
        await settle(page, 1800);
        await snap(`${prefix}__tab_${labels[i] || i}`);
      } catch (e) { /* tab not clickable */ }
    }
  };
  const overlayShots = async (prefix, openerLabel) => {
    // wait until the overlay stops moving: a dialog measured mid-animation is scaled (a 36px close button reads as 29px)
    let last = '';
    for (let i = 0; i < 16; i++) {
      await page.waitForTimeout(350);
      const m = await page.evaluate(measureOverlay).catch(() => null);
      const key = JSON.stringify(m && (m.close || m.rect));
      if (key === last) break;
      last = key;
    }
    const o = await page.evaluate(measureOverlay).catch(() => null);
    if (!o) return null;
    o.page = prefix; o.opener = openerLabel; o.file = slug(`dlg__${prefix}__${openerLabel}`);
    await page.screenshot({path: `${out}/shots/${o.file}.png`});
    results.overlays.push(o);
    console.log('  OVERLAY', o.kind, 'from', JSON.stringify(openerLabel), o.paneClass || '');
    return o;
  };
  // open every safe control of the current page; menus are walked one level deeper
  const exploreOverlays = async (prefix, url) => {
    const describe = () => page.$$eval('button, a.mat-mdc-button-base, [role="menuitem"], .mat-mdc-menu-item', els => els.filter(e => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0 && !e.closest('thead, .p-datatable-thead, sm-table-filter-sort, sm-main-pages-header-filter, sm-header-navbar-tabs, mat-tab-header'); }).map((e, i) => ({i, text: ((e.innerText || '') || e.getAttribute('aria-label') || e.getAttribute('data-id') || e.title || '').trim().replace(/\s+/g, ' ').slice(0, 40)})));
    const cands = await describe();
    const seen = new Set();
    for (const c of cands.slice(0, 40)) {
      if (!c.text || seen.has(c.text) || UNSAFE.test(c.text) || /^(recent|name|filter|sort|my work|all work|grid|list|view)\b/i.test(c.text)) continue;
      seen.add(c.text);
      try {
        const handles = [];
        for (const e of await page.$$('button, a.mat-mdc-button-base, [role="menuitem"], .mat-mdc-menu-item')) if (await e.isVisible().catch(() => false)) handles.push(e);
        if (!handles[c.i]) continue;
        const before = page.url();
        await handles[c.i].click({timeout: 2000});
        await page.waitForTimeout(600);
        let o = await overlayShots(prefix, c.text);
        if (o && o.kind === 'popup') {
          // a menu: open each safe item once
          const items = await page.$$eval('.mat-mdc-menu-item, [role="menuitem"], sm-menu-item', els => els.filter(e => e.getBoundingClientRect().width > 0).map((e, i) => ({i, text: (e.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 40)})));
          for (const it of items.slice(0, 12)) {
            if (!it.text || UNSAFE.test(it.text)) continue;
            try {
              await handles[c.i].click({timeout: 2000}).catch(() => {});
              await page.waitForTimeout(500);
              const mi = (await page.$$('.mat-mdc-menu-item, [role="menuitem"], sm-menu-item'))[it.i];
              if (!mi) continue;
              await mi.click({timeout: 2000});
              await page.waitForTimeout(900);
              await overlayShots(prefix, `${c.text} > ${it.text}`);
            } catch (e) {}
            await page.keyboard.press('Escape').catch(() => {});
            await page.waitForTimeout(300);
            if (await page.$('.mat-mdc-dialog-container')) await page.keyboard.press('Escape').catch(() => {});
            if (page.url() !== before) await visit(url, 1800);
          }
        }
        await page.keyboard.press('Escape').catch(() => {});
        await page.waitForTimeout(300);
        if (await page.$('.mat-mdc-dialog-container')) { await page.keyboard.press('Escape').catch(() => {}); await page.waitForTimeout(300); }
        if (page.url() !== before) await visit(url, 1800);
      } catch (e) { await page.keyboard.press('Escape').catch(() => {}); }
    }
  };
  const full = async (name, url, opts = {}) => {
    try {
      if (url) await visit(url);
      if (MODE === 'dialogs') { await exploreOverlays(name, page.url()); return; }
      const m = await snap(name);
      const here = page.url();
      if (opts.tabs !== false && m.headerTabs && m.headerTabs.labels.length > 1) {
        await clickTabs(name, 'sm-header-navbar-tabs .mdc-tab');
        await visit(here, 1800);
      }
    } catch (e) { console.log('FAILED', name, e.message.split('\n')[0]); }
  };

  const pages = [
    ['dashboard', 'dashboard'], ['projects', 'projects'], ['project_overview', `projects/${pid}/overview`], ['project_workloads', `projects/${pid}/workloads`],
    ['project_folders', `projects/${pid}/folders`], ['project_tasks', `projects/${pid}/tasks`], ['project_models', `projects/${pid}/models`],
    ['project_settings', `projects/${pid}/settings`], ['all_overview', 'projects/*/overview'], ['all_tasks', 'projects/*/tasks'], ['all_models', 'projects/*/models'],
    ['pipelines', 'pipelines'], ['pipelines_project', `pipelines/${pid}/pipelines`], ['datasets_datasets', 'datasets/datasets'], ['datasets_repositories', 'datasets/repositories'],
    ['reports', 'reports'], ['agents', 'workers-and-queues/workers'], ['queues', 'workers-and-queues/queues'], ['endpoints', 'endpoints/active'], ['endpoints_loading', 'endpoints/loading'],
    ['settings_profile', 'settings/profile'], ['settings_workspace', 'settings/workspace'], ['settings_webapp_configuration', 'settings/webapp-configuration'],
    ['settings_devices', 'settings/devices'], ['settings_access', 'settings/access'], ['settings_storage_cleanup', 'settings/storage-credentials'], ['not_found', '404'],
  ];
  for (const [name, url] of pages) await full(name, url);

  // drill-downs: a task, a model, compare, a report, a queue, a dataset
  const rowClick = async (sel = '.p-datatable-tbody tr, sm-table tbody tr, table tbody tr') => {
    const rows = await page.$$(sel);
    for (const r of rows) { if (await r.isVisible().catch(() => false)) { await r.click({position: {x: 200, y: 10}, timeout: 3000}).catch(() => {}); return true; } }
    return false;
  };
  try {
    await visit(`projects/${pid}/tasks`);
    if (await rowClick()) { await settle(page, 2500); await full('task_detail', null, {tabs: false}); await clickTabs('task_detail', 'sm-experiment-info-navbar .mdc-tab, sm-experiment-info-navbar a, .experiment-info-navbar a, [class*="info-navbar"] .mdc-tab'); }
  } catch (e) { console.log('FAILED task detail', e.message.split('\n')[0]); }
  try {
    await visit(`projects/${pid}/models`);
    if (await rowClick()) { await settle(page, 2500); await full('model_detail', null, {tabs: false}); await clickTabs('model_detail', '[class*="info-navbar"] .mdc-tab, sm-model-info .mdc-tab, .mat-mdc-tab-link'); }
  } catch (e) { console.log('FAILED model detail', e.message.split('\n')[0]); }
  try {
    await visit(`projects/${pid}/tasks`);
    const header = await page.$('.p-datatable-thead .p-checkbox, thead .p-checkbox, thead mat-checkbox, thead input[type=checkbox]');
    if (header) await header.click({timeout: 2000}).catch(() => {});
    await page.waitForTimeout(800);
    await snap('tasks_selected');
    for (const e of await page.$$('button')) { const t = ((await e.innerText().catch(() => '')) || '').trim(); if (/^compare/i.test(t) && await e.isVisible()) { await e.click().catch(() => {}); break; } }
    await settle(page, 3000);
    await full('compare', null, {tabs: false});
    await clickTabs('compare', '.mdc-tab, .mat-mdc-tab-link');
  } catch (e) { console.log('FAILED compare', e.message.split('\n')[0]); }
  try {
    await visit('reports');
    const card = await page.$('sm-report-card, .report-card, sm-card');
    if (card) { await card.click({timeout: 3000}).catch(() => {}); await settle(page, 3000); await full('report_detail', null, {tabs: false}); }
  } catch (e) { console.log('FAILED report', e.message.split('\n')[0]); }
  try {
    await visit('workers-and-queues/queues');
    if (await rowClick()) { await settle(page, 2000); await full('queue_detail', null, {tabs: false}); await clickTabs('queue_detail', 'sm-queue-info .mdc-tab, .mat-mdc-tab-link, mat-tab-group .mdc-tab'); }
  } catch (e) { console.log('FAILED queue', e.message.split('\n')[0]); }
  try {
    await visit('datasets/datasets');
    if (await rowClick()) { await settle(page, 2000); await full('dataset_detail', null, {tabs: false}); await clickTabs('dataset_detail', 'sm-dataset-browser .mdc-tab, mat-tab-group .mdc-tab'); }
  } catch (e) { console.log('FAILED dataset', e.message.split('\n')[0]); }
  // header controls: search, help, user menu
  for (const [name, sel] of [['header_search', 'sm-header button[aria-label*="earch"], sm-header .al-ico-search, sm-header button:nth-of-type(1)'], ['header_help', 'sm-header button:nth-of-type(2)'], ['header_user', 'sm-header .menu-trigger']]) {
    try { await visit('dashboard', 1800); const el = await page.$(sel); if (el) { await el.click({timeout: 2000}); await page.waitForTimeout(900); await overlayShots('header', name); await snap(`${name}_open`); } } catch (e) {}
  }
  fs.writeFileSync(`${out}/audit.json`, JSON.stringify(results, null, 1));
  console.log('DONE pages:', results.pages.length, 'overlays:', results.overlays.length);
  await browser.close();
})().catch(e => { console.error('ERR', e.message.split('\n')[0]); process.exit(1); });
