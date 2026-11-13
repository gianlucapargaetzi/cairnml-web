// Checks that a new card fits its height to its content: add the content cards through the UI and measure each card.
// node scripts/fit-check.js [project-id]
const {open} = require('./_chk');
const PROJECT = process.argv[2] || 'faea3b436d8444ea801852b286ce3b35';
let failures = 0;
const check = (ok, what, detail = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + what + (detail ? '  ' + detail : '')); if (!ok) failures++; };
(async () => {
  const {b, p} = await open('testuser01', 1600, 2400);
  await p.go(`projects/${PROJECT}/overview`, 3000);
  const version = (await p.api('projects.get_overview_board', {project: PROJECT})).data.data.board?.version ?? 0;
  await p.api('projects.set_overview_board', {project: PROJECT, version, cards: [{id: 'd', type: 'divider', x: 0, y: 0, w: 6, h: 1, settings: {title: 'Fit check'}}]});
  await p.reload(); await p.waitForTimeout(3000);
  await p.click('[data-id=boardEditToggle]'); await p.waitForTimeout(500);
  const tile = await p.evaluate(() => document.querySelector('sm-board-grid').getBoundingClientRect().width / 6);
  for (const type of ['agents', 'repositories', 'progress', 'project-state', 'contributions', 'description']) {
    await p.click('[data-id=boardAddCard]'); await p.waitForTimeout(400);
    await p.click(`[data-id="addCardType-${type}"]`); await p.click('[data-id=AddCardButton]'); await p.waitForTimeout(4500);
    const m = await p.evaluate(t => { const el = document.querySelector(`[data-card-type=${t}]`); const c = el.querySelector('.card'); return {h: el.getBoundingClientRect().height, scroll: c.scrollHeight, client: c.clientHeight}; }, type);
    const tiles = m.h / tile;
    check(m.scroll <= m.client + 24, `${type}: nothing is cut off (the old panels keep a 24px margin below them)`, JSON.stringify(m));
    check(tiles < 4.4, `${type}: ${tiles.toFixed(2)} tiles high, not much more than its content`);
  }
  await p.shot('fit-check');
  console.log(failures ? `\n${failures} check(s) FAILED` : '\nall checks passed');
  await b.close();
  process.exit(failures ? 1 : 0);
})();
