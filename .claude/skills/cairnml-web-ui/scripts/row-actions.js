// Measures the icon buttons in the table rows of the given pages: size, icon centring, vertical position in the row and
// the gap between the last button and the table's right edge. Compare with "Row actions" in docs/design-system/components/tables.md.
// Usage: node row-actions.js /settings/access /datasets ...   (needs state.json from login.js)
const {open, settle} = require('./lib');
const BASE = process.env.CAIRNML_URL || 'http://localhost/cairnml';
(async () => {
  const {browser, page} = await open();
  for (const path of process.argv.slice(2)) {
    await page.goto(BASE + path, {waitUntil: 'load'}); await settle(page, 3000);
    const rows = await page.evaluate(() => [...document.querySelectorAll('button.mat-mdc-icon-button')].flatMap(b => {
      const row = b.closest('tr, .p-datatable-row, [role=row]'); if (!row) return [];
      const table = b.closest('table, sm-table, .p-datatable') || row.parentElement;
      const r = b.getBoundingClientRect(), rr = row.getBoundingClientRect(), tr = table.getBoundingClientRect();
      const i = b.querySelector('mat-icon'), ir = i && i.getBoundingClientRect();
      const n = v => Math.round(v * 10) / 10;
      return [{id: b.dataset.id || b.getAttribute('aria-label'), button: [n(r.width), n(r.height)], icon: ir && [n(ir.width), n(ir.height)],
        iconOffset: ir && [n(ir.x + ir.width / 2 - r.x - r.width / 2), n(ir.y + ir.height / 2 - r.y - r.height / 2)],
        rowOffset: n(r.y + r.height / 2 - rr.y - rr.height / 2), rightGap: Math.round(tr.right - r.right),
        tooltip: b.getAttribute('ng-reflect-message') || b.dataset.tip || '', aria: b.getAttribute('aria-label') || ''}];
    }));
    console.log('##', path); rows.forEach(r => console.log(JSON.stringify(r)));
  }
  await browser.close();
})().catch(e => { console.error('ERR', e.message.split('\n')[0]); process.exit(1); });
