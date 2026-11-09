// usage: node gap-report.js <audit.json> [--md]
const fs = require('fs');
const data = JSON.parse(fs.readFileSync(process.argv[2]));
const md = process.argv.includes('--md');
const f = n => (n === undefined || n === null ? '-' : Math.round(n));
const rows = [];
for (const p of data.pages) {
  if (!p.viewport) continue;
  const tools = (p.blocks || []).filter(b => ['sm-projects-header', '.queues-header'].includes(b.sel));
  const search = (p.blocks || []).filter(b => ['sm-common-search', 'sm-search'].includes(b.sel))[0];
  const tool = tools[0];
  const tables = (p.blocks || []).filter(b => ['sm-table', '.p-datatable', 'table', 'as-split'].includes(b.sel));
  const cards = (p.blocks || []).filter(b => ['sm-queue-stats', 'sm-project-card', 'sm-card', 'sm-report-card', 'sm-pipeline-card', 'mat-expansion-panel', '.card', 'sm-empty-state'].includes(b.sel));
  const t = tables[0];
  rows.push({
    page: p.name || p.path, url: (p.url || p.finalUrl || '').slice(0, 40),
    sub: p.pageHeader ? `${f(p.pageHeader.h)}` : 'none',
    trail: (p.trail || []).join(' / ').slice(0, 30) || '-',
    tabs: p.tabsOffset === undefined ? '-' : `off${f(p.tabsOffset)}`,
    title: p.pageTitle ? `${p.pageTitle.text.slice(0, 18)} x${f(p.pageTitle.rect.x)} y${f(p.pageTitle.rect.y)} ${p.pageTitle.fontSize}` : '-',
    toolbar: tool ? `y${f(tool.y)} h${f(tool.h)}` : (search ? `search y${f(search.y)}` : '-'),
    table: t ? `L${f(t.leftGap)} R${f(t.rightGap)} top${f(t.topGap)}` : '-',
    block: cards[0] ? `${cards[0].sel} L${f(cards[0].leftGap)} R${f(cards[0].rightGap)} top${f(cards[0].topGap)}` : '-',
    hscroll: p.hasHorizontalScroll ? 'YES' : '',
  });
}
const cols = ['page', 'sub', 'title', 'trail', 'tabs', 'toolbar', 'table', 'block', 'hscroll'];
if (md) {
  console.log('| ' + cols.join(' | ') + ' |'); console.log('|' + cols.map(() => '---').join('|') + '|');
  for (const r of rows) console.log('| ' + cols.map(c => r[c]).join(' | ') + ' |');
} else {
  for (const r of rows) console.log(cols.map(c => String(r[c]).padEnd(c === 'page' ? 36 : 22)).join(''));
}
