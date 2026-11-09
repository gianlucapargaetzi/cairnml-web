// Width independence check: every table must span from the side nav to the window edge and cards must start at the
// page gutter, at every window width. Usage: node fit-check.js [widths=1000,1600,3440,10000] <path>...
// Prints one line per block; "FLAG" marks a table with a gap, a centred block or horizontal page scroll.
const {open, settle} = require('./lib');
const BASE = process.env.CAIRNML_URL || 'http://localhost/cairnml';
const args = process.argv.slice(2);
const widths = (/^[\d,]+$/.test(args[0] || '') ? args.shift() : '1000,1600,3440,10000').split(',').map(Number);
const paths = args;
const measure = () => {
  const vis = el => { const b = el.getBoundingClientRect(); const cs = getComputedStyle(el); return b.width > 40 && b.height > 20 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
  const nav = document.querySelector('sm-side-nav'); const left0 = nav ? Math.round(nav.getBoundingClientRect().right) : 64;
  const W = innerWidth; const out = [];
  const kinds = {table: 'sm-table, .p-datatable, sm-simple-table-2', cards: '.sm-card-list-layout, .cards-grid', empty: 'sm-empty-state'};
  for (const [kind, sel] of Object.entries(kinds)) for (const el of [...document.querySelectorAll(sel)].filter(vis)) {
    if (el.closest('as-split, .settings-content, sm-settings')) continue; // a table inside a pane is sized by its pane
    if (el.parentElement && el.parentElement.closest(sel) === el.parentElement.closest(sel) && el.parentElement.closest(sel) && el.parentElement.closest(sel) !== el) continue; // nested: the outer one counts
    const b = el.getBoundingClientRect(); const first = el.querySelector('sm-project-card, .card, tr, .p-datatable-row, sm-card');
    out.push({kind, tag: el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : ''), x: Math.round(b.x), r: Math.round(b.right), leftGap: Math.round(b.x - left0), rightGap: Math.round(W - b.right), w: Math.round(b.width)});
  }
  // Any other block that sits centred with an empty band on both sides: a max-width with auto margins.
  const main = document.querySelector('router-outlet ~ *, main, .main-content, sm-layout .content') || document.body;
  const seen = [];
  for (const el of document.querySelectorAll('body *')) {
    if (!vis(el) || el.closest('sm-side-nav, sm-header, mat-dialog-container, .cdk-overlay-container, sm-empty-state, .settings-page, .p-datatable-tbody, mat-form-field, svg, canvas')) continue;
    const b = el.getBoundingClientRect();
    const lg = b.x - left0, rg = W - b.right;
    if (b.width < 360 || lg < 40 || Math.abs(lg - rg) > 2 || b.top > innerHeight * 0.9) continue;
    if (seen.some(s => s.contains(el))) continue;
    seen.push(el);
    out.push({kind: 'centred', tag: el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className ? '.' + el.className.split(' ')[0] : ''), x: Math.round(b.x), r: Math.round(b.right), leftGap: Math.round(lg), rightGap: Math.round(rg), w: Math.round(b.width)});
  }
  return {W, scrollX: document.documentElement.scrollWidth > W + 1, blocks: out};
};
(async () => {
  let bad = 0;
  for (const w of widths) {
    const {browser, page} = await open({width: w, height: 900});
    for (const p of paths) {
      await page.goto(BASE + p, {waitUntil: 'load'}).catch(() => {}); await settle(page, 2500);
      const m = await page.evaluate(measure);
      for (const b of m.blocks) {
        const flags = [];
        if (b.kind === 'table' && (Math.abs(b.leftGap) > 1 || Math.abs(b.rightGap) > 1)) flags.push('TABLE-GAP');
        if (b.kind === 'centred') flags.push('CENTRED-BLOCK');
        else if (b.kind !== 'empty' && b.leftGap > 24 && Math.abs(b.leftGap - b.rightGap) <= 2) flags.push('CENTRED');
        if (b.kind === 'cards' && b.leftGap > 24) flags.push('CARDS-INSET');
        if (flags.length) bad++;
        console.log(`${flags.length ? 'FLAG ' : 'ok   '} w=${String(w).padEnd(5)} ${p.padEnd(44)} ${b.kind.padEnd(6)} ${b.tag.slice(0, 28).padEnd(28)} left=${b.leftGap} right=${b.rightGap} ${flags.join(',')}`);
      }
      if (m.scrollX) { bad++; console.log(`FLAG  w=${w} ${p} horizontal page scroll`); }
    }
    await browser.close();
  }
  console.log(bad ? `${bad} flagged` : 'no flags');
})().catch(e => { console.error('ERR', e.message.split('\n')[0]); process.exit(1); });
