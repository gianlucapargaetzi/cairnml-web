// Checks the one header of the application on every page (run it for every UI change; needs seed-ids.json from seed.js):
//   node shell-check.js <outdir> [width height]
// Per page: header height (64), title (line 1), trail (line 2), tab centring offset (0), symbol-only buttons, side-nav action
// stack, content bottom (= window bottom), header overflow, horizontal scroll. Writes <outdir>/<page>.png and shell-check.json.
const fs = require('fs');
const path = require('path');
const {open, settle} = require('./lib');
const ids = JSON.parse(fs.readFileSync('seed-ids.json', 'utf8'));
const pid = ids.projects[0], t0 = ids.tasks[0], t1 = ids.tasks[1], rid = ids.reports[0], mid = ids.models[0];
const OUT = process.argv[2] || 'shell-check';
const W = +process.argv[3] || 1600, H = +process.argv[4] || 900;
fs.mkdirSync(OUT, {recursive: true});
const PAGES = [
  ['dashboard', '/dashboard'], ['projects', '/projects'], ['project_overview', `/projects/${pid}/overview`],
  ['project_workloads', `/projects/${pid}/workloads?period=604800`], ['project_folders', `/projects/${pid}/folders`],
  ['project_tasks', `/projects/${pid}/tasks`], ['project_models', `/projects/${pid}/models`], ['project_settings', `/projects/${pid}/settings`],
  ['all_tasks', '/projects/*/tasks'], ['task_detail', `/projects/${pid}/tasks/${t0}/execution`],
  ['model_detail', `/projects/${pid}/models/${mid}/general`], ['compare', `/projects/${pid}/compare-tasks;ids=${t0},${t1}/details`],
  ['pipelines', '/pipelines'], ['reports', '/reports'], ['report_detail', `/reports/${pid}/${rid}`],
  ['datasets', '/datasets/datasets'], ['repositories', '/datasets/repositories'], ['agents', '/workers-and-queues/workers'],
  ['queues', '/workers-and-queues/queues'], ['endpoints', '/endpoints/active'], ['settings_profile', '/settings/profile'],
  ['settings_devices', '/settings/devices'], ['settings_access', '/settings/access'], ['settings_storage', '/settings/storage-credentials'],
];
function measure() {
  const h = document.querySelector('sm-header');
  const r = el => el.getBoundingClientRect();
  if (!h) return {noHeader: true};
  const hr = r(h), hc = h.querySelector('.header-container');
  const out = {headerH: Math.round(hr.height), title: h.querySelector('.title-text')?.textContent.trim(), trail: [...h.querySelectorAll('.trail-part')].map(e => e.textContent.trim()).join(' / ')};
  const tabs = h.querySelector('sm-header-navbar-tabs .mat-mdc-tab-header');
  if (tabs && tabs.textContent.trim()) { const t = r(tabs); out.tabsOffset = Math.round(t.left + t.width / 2 - (hr.left + hr.width / 2)); }
  out.buttons = [...h.querySelectorAll('.header-actions button')].filter(b => b.offsetWidth).map(b => ({tip: b.getAttribute('data-tip') || b.getAttribute('aria-label'), text: b.classList.contains('header-action') || b.classList.contains('mat-mdc-icon-button') ? '' : b.innerText.trim()}));
  out.textButtons = out.buttons.filter(b => b.text).map(b => b.text);
  out.headerOverflow = hc.scrollWidth > hc.clientWidth + 1;
  out.hscroll = document.documentElement.scrollWidth > innerWidth + 1;
  const host = document.querySelector('router-outlet.main-router')?.nextElementSibling;
  out.contentBottom = host ? Math.round(r(host).bottom) : null;
  const sa = document.querySelector('sm-side-nav-actions');
  out.sideStack = sa ? [...sa.querySelectorAll('.nav-action')].map(e => Math.round(r(e).top)) : null;
  return out;
}
(async () => {
  const {browser, page} = await open({width: W, height: H});
  const rows = [];
  for (const [name, url] of PAGES) {
    await page.goto('http://localhost/cairnml' + url); await settle(page, 2600);
    const m = await page.evaluate(measure);
    await page.screenshot({path: path.join(OUT, `${name}.png`)});
    const problems = [];
    if (m.noHeader) problems.push('no header');
    else {
      if (m.headerH !== 64) problems.push(`header ${m.headerH}px`);
      if (m.tabsOffset !== undefined && m.tabsOffset !== 0) problems.push(`tabs off centre by ${m.tabsOffset}px`);
      if (!m.title) problems.push('no title'); if (!m.trail) problems.push('no trail');
      if (m.textButtons.length) problems.push('text buttons in the header: ' + m.textButtons.join(', '));
      if (m.headerOverflow) problems.push('header overflows'); if (m.hscroll) problems.push('horizontal scroll');
      if (m.contentBottom !== H) problems.push(`content ends at ${m.contentBottom}, window is ${H}`);
    }
    rows.push({name, ...m, problems});
    console.log(name.padEnd(20), problems.length ? 'PROBLEMS: ' + problems.join('; ') : 'ok', '|', m.title, '|', m.trail);
  }
  fs.writeFileSync(path.join(OUT, 'shell-check.json'), JSON.stringify(rows, null, 1));
  await browser.close();
})();
