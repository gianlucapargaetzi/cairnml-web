// Checks the plot card of the overview board: add one, set it up in its settings dialog, and look at every chart type.
// node scripts/plot-check.js [project-id]
const {open} = require('./_chk');
const PROJECT = process.argv[2] || 'faea3b436d8444ea801852b286ce3b35';
let failures = 0;
const check = (ok, what, detail = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + what + (detail ? '  ' + detail : '')); if (!ok) failures++; };
const pick = async (p, id, text) => { await p.click(`[data-id=${id}]`); await p.waitForTimeout(300); await p.locator('mat-option', {hasText: text}).first().click(); await p.waitForTimeout(400); };

(async () => {
  const {b, p} = await open('testuser01', 1600, 1100);
  await p.go(`projects/${PROJECT}/overview`, 5000);
  // the same corner radius on every card, whatever its type and size
  const radii = await p.evaluate(() => [...document.querySelectorAll('sm-board-card .card')].map(e => getComputedStyle(e).borderTopLeftRadius));
  check(new Set(radii).size === 1, 'every card has the same corner radius', JSON.stringify([...new Set(radii)]));
  await p.click('[data-id=boardEditToggle]'); await p.waitForTimeout(500);
  await p.click('[data-id=boardAddCard]'); await p.waitForTimeout(500);
  await p.click('[data-id="addCardType-plot"]'); await p.click('[data-id=AddCardButton]'); await p.waitForTimeout(1500);
  const card = p.locator('[data-card-type=plot]').last();
  check(await card.locator('[data-id=plotChart]').count() > 0, 'a new plot card shows the default plot (runs per day)');
  await p.shot('plot-default');
  // set it up: min of loss / train over the runs of the task "branch demo", as a line
  await card.locator('[data-id=boardCardEdit]').click(); await p.waitForTimeout(1200);
  await pick(p, 'plotSource', 'loss / train');
  await pick(p, 'plotRuns', 'branch demo');
  await p.shot('plot-settings');
  const views = await p.evaluate(() => 0); void views;
  await p.click('[data-id=ApplyCardSettingsButton]'); await p.waitForTimeout(2500);
  check(await card.locator('[data-id=cardTitle]').innerText().then(t => /loss \/ train/.test(t)), 'the plot is the one that was set up', await card.locator('[data-id=cardTitle]').innerText());
  check(await card.locator('canvas').count() > 0, 'a chart is drawn');
  await p.shot('plot-evolution');
  // every view of a scalar
  for (const [view, expectKind] of [['The curve of the best run', 'canvas'], ['The curves of the newest runs', 'canvas'], ['How the runs are distributed', 'canvas']]) {
    await card.locator('[data-id=boardCardEdit]').click(); await p.waitForTimeout(1000);
    await pick(p, 'plotView', view);
    await p.click('[data-id=ApplyCardSettingsButton]'); await p.waitForTimeout(2500);
    check(await card.locator(expectKind).count() > 0 && await card.locator('[data-id=plotEmpty]').count() === 0, `view "${view}" draws`);
    await p.shot('plot-' + view.replace(/[^a-z]+/gi, '-').toLowerCase());
  }
  // a single number and a donut
  await card.locator('[data-id=boardCardEdit]').click(); await p.waitForTimeout(1000);
  await pick(p, 'plotView', 'How it changed over the runs'); await pick(p, 'plotChartType', 'A single number');
  await p.click('[data-id=ApplyCardSettingsButton]'); await p.waitForTimeout(2200);
  check(await card.locator('[data-id=plotNumber]').count() > 0, 'the single number is shown', await card.locator('[data-id=plotNumber]').innerText().catch(() => ''));
  await card.locator('[data-id=boardCardEdit]').click(); await p.waitForTimeout(1000);
  await pick(p, 'plotSource', 'Status of the runs');
  await p.click('[data-id=ApplyCardSettingsButton]'); await p.waitForTimeout(2200);
  check(await card.locator('sm-donut').count() > 0, 'the status of the runs is a donut');
  await p.shot('plot-donut');
  // a metric that the runs no longer have is an empty card, not an error
  await card.locator('[data-id=boardCardRemove]').click(); await p.waitForTimeout(600);
  await p.api('projects.set_overview_board', {project: PROJECT, version: (await p.api('projects.get_overview_board', {project: PROJECT})).data.data.board.version, cards: [
    {id: 'gone', type: 'plot', x: 0, y: 0, w: 3, h: 12, settings: {source: {kind: 'scalar', metric: 'nothing', variant: 'here'}, runs: {scope: 'project'}, view: 'evolution', statistic: 'min', chart: 'line'}},
    {id: 'garbage', type: 'plot', x: 3, y: 0, w: 3, h: 12, settings: {source: 5, view: 'sideways', chart: 'cake'}}]});
  await p.reload(); await p.waitForTimeout(5000);
  check(await p.locator('[data-id=plotEmpty]').count() >= 1, 'a plot of a metric the runs do not have is an empty card');
  check(await p.locator('[data-id=plotChart]').count() >= 1, 'garbage settings fall back to the default plot');
  await p.shot('plot-gone');
  console.log(failures ? `\n${failures} check(s) FAILED` : '\nall checks passed');
  await b.close();
  process.exit(failures ? 1 : 0);
})();
