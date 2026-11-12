const {open} = require('./_chk');
const P = 'faea3b436d8444ea801852b286ce3b35';
const cases = {
  gone: {source: {kind: 'scalar', metric: 'nothing', variant: 'here'}, runs: {scope: 'project'}, view: 'evolution', statistic: 'min', chart: 'line'},
  garbage: {source: 5, view: 'sideways', chart: 'cake'},
  empty: {},
};
(async () => {
  const {b, p} = await open('testuser01', 1600, 900);
  for (const [name, settings] of Object.entries(cases)) {
    const v = (await p.api('projects.get_overview_board', {project: P})).data.data.board.version;
    await p.api('projects.set_overview_board', {project: P, version: v, cards: [{id: 'c', type: 'plot', x: 0, y: 0, w: 3, h: 12, settings}]});
    const errs = []; p.removeAllListeners('pageerror'); p.on('pageerror', e => errs.push(e.message.slice(0, 120)));
    await p.go(`projects/${P}/overview`, 4500);
    console.log(name, 'boundary', await p.locator('[data-id=errorBoundary]').count(), 'plotEmpty', await p.locator('[data-id=plotEmpty]').count(), 'chart', await p.locator('[data-id=plotChart]').count(), errs[0] || '');
  }
  await b.close();
})();
