function measurePage() {
  const round = n => Math.round(n * 10) / 10;
  const rect = el => { const b = el.getBoundingClientRect(); return {x: round(b.x), y: round(b.y), w: round(b.width), h: round(b.height), r: round(b.right), b: round(b.bottom)}; };
  const vis = el => { const b = el.getBoundingClientRect(); const cs = getComputedStyle(el); return b.width > 0 && b.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && cs.opacity !== '0'; };
  const all = sel => [...document.querySelectorAll(sel)].filter(vis);
  const one = sel => all(sel)[0];
  const style = (el, props) => { const cs = getComputedStyle(el); return Object.fromEntries(props.map(p => [p, cs[p]])); };
  const out = {viewport: {w: innerWidth, h: innerHeight}, scroll: {w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight}};
  const sn = one('sm-side-nav'); if (sn) out.sideNav = rect(sn);
  const hd = one('sm-header'); if (hd) out.header = rect(hd);
  const tabs = one('sm-header-navbar-tabs'); if (tabs) out.headerTabs = {rect: rect(tabs), labels: all('sm-header-navbar-tabs .mdc-tab').map(t => t.innerText.trim())};
  // The header of the application is the only header (64px): title block, centred tabs, symbol-only page buttons.
  if (hd) {
    out.pageHeader = out.header; // kept under this name for gap-report.js
    const t1 = hd.querySelector('.title-text') || hd;
    out.pageTitle = {text: t1.innerText.trim().slice(0, 60), rect: rect(t1), ...style(t1, ['fontSize', 'fontWeight', 'color'])};
    out.trail = [...hd.querySelectorAll('.trail-part')].map(t => t.innerText.trim());
    const tg = hd.querySelector('sm-header-navbar-tabs .mat-mdc-tab-header, sm-header-navbar-tabs mat-tab-group');
    if (tg && tg.textContent.trim()) { const t = tg.getBoundingClientRect(); out.tabsOffset = round((t.left + t.width / 2) - (hd.getBoundingClientRect().left + hd.getBoundingClientRect().width / 2)); }
    out.pageHeaderActions = [...hd.querySelectorAll('.header-actions button, .header-actions a.mat-mdc-button-base')].filter(vis).map(b => ({text: (b.getAttribute('data-tip') || b.getAttribute('aria-label') || b.innerText).trim().slice(0, 30), symbolOnly: !b.innerText.trim() || b.classList.contains('header-action'), ...rect(b)}));
    const sa = one('sm-side-nav-actions'); if (sa) out.sideActions = [...sa.querySelectorAll('.nav-action')].map(e => rect(e).y);
  }
  const top = out.pageHeader ? out.pageHeader.b : (out.header ? out.header.b : 0);
  const left0 = out.sideNav ? out.sideNav.r : 64;
  const blocks = [];
  const sels = ['sm-table', '.p-datatable', 'table', 'as-split', 'sm-projects-header', '.queues-header', 'sm-queue-stats', '.sm-card-list-layout', 'sm-empty-state', 'mat-tab-group:not(sm-header-navbar-tabs mat-tab-group)', 'sm-section-header', 'sm-common-search', 'sm-search', 'mat-expansion-panel', 'sm-project-card', 'sm-card', 'sm-report-card', 'sm-pipeline-card', '.card'];
  for (const sel of sels) for (const el of all(sel).slice(0, 4)) {
    const b = rect(el);
    if (b.y + b.h < top - 1) continue;
    blocks.push({sel, ...b, leftGap: round(b.x - left0), rightGap: round(innerWidth - b.r), topGap: round(b.y - top)});
  }
  out.blocks = blocks;
  const heads = all('h1, h2, h3, .section-title, .card-title').filter(h => rect(h).b > top).slice(0, 6).map(h => ({text: h.innerText.trim().slice(0, 40), ...rect(h), ...style(h, ['fontSize', 'fontWeight', 'color'])}));
  out.headings = heads;
  out.buttons = all('button.mat-mdc-unelevated-button, a.mat-mdc-unelevated-button, button.mat-mdc-outlined-button, button.mat-mdc-raised-button').map(b => ({text: b.innerText.trim().slice(0, 30), ...rect(b), kind: b.className.includes('unelevated') ? 'flat' : (b.className.includes('outlined') ? 'stroked' : 'other')}));
  out.hasHorizontalScroll = document.documentElement.scrollWidth > innerWidth + 1;
  return out;
}

function measureOverlay() {
  const round = n => Math.round(n * 10) / 10;
  const rect = el => { const b = el.getBoundingClientRect(); return {x: round(b.x), y: round(b.y), w: round(b.width), h: round(b.height), r: round(b.right), b: round(b.bottom)}; };
  const vis = el => { const b = el.getBoundingClientRect(); const cs = getComputedStyle(el); return b.width > 0 && b.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
  const style = (el, props) => { const cs = getComputedStyle(el); return Object.fromEntries(props.map(p => [p, cs[p]])); };
  const d = [...document.querySelectorAll('.mat-mdc-dialog-container')].filter(vis).pop();
  if (!d) {
    const panes = [...document.querySelectorAll('.cdk-overlay-pane')].filter(vis);
    if (!panes.length) return null;
    const p = panes[panes.length - 1];
    return {kind: 'popup', cls: p.className.toString().slice(0, 80), rect: rect(p), text: p.innerText.trim().slice(0, 120)};
  }
  const pane = d.closest('.cdk-overlay-pane');
  const out = {kind: 'dialog', paneClass: pane ? pane.className.toString().replace(/mat-mdc-dialog-panel|cdk-overlay-pane/g, '').trim() : '', rect: rect(d), viewport: {w: innerWidth, h: innerHeight}, padding: style(d, ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'borderRadius', 'backgroundColor'])};
  const t = d.querySelector('sm-dialog-template');
  out.template = !!t;
  const h = d.querySelector('.header, .dialog-header, h1, h2, .title');
  if (h) out.title = {text: h.innerText.trim().slice(0, 60), ...rect(h), ...style(h, ['fontSize', 'fontWeight', 'color', 'textAlign'])};
  const icon = d.querySelector('.al-icon, mat-icon, .dialog-icon, img');
  if (icon) out.icon = rect(icon);
  const close = d.querySelector('[mat-dialog-close], .close, button[aria-label="Close"], .al-ico-dialog-x');
  if (close) out.close = rect(close);
  out.buttons = [...d.querySelectorAll('button')].filter(vis).map(b => ({text: b.innerText.trim().slice(0, 30), ...rect(b), kind: b.className.includes('unelevated') ? 'flat' : (b.className.includes('outlined') ? 'stroked' : 'other')}));
  out.fields = [...d.querySelectorAll('mat-form-field')].filter(vis).map(f => ({label: (f.querySelector('mat-label')||{innerText:''}).innerText.trim().slice(0, 24), ...rect(f)}));
  out.tabs = [...d.querySelectorAll('.mdc-tab')].filter(vis).map(t => t.innerText.trim());
  out.text = d.innerText.trim().slice(0, 200).replace(/\n+/g, ' | ');
  return out;
}


module.exports = {measurePage, measureOverlay};
