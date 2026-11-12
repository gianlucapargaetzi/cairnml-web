const {open} = require('./_chk');
const P = 'faea3b436d8444ea801852b286ce3b35';
(async () => {
  const {b, p} = await open('testuser01', 1600, 900);
  const sets = [
    [{id: 'gone', type: 'plot', x: 0, y: 0, w: 3, h: 12, settings: {source: {kind: 'scalar', metric: 'nothing', variant: 'here'}, runs: {scope: 'project'}, view: 'evolution', statistic: 'min', chart: 'line'}},
     {id: 'garbage', type: 'plot', x: 3, y: 0, w: 3, h: 12, settings: {source: 5, view: 'sideways', chart: 'cake'}}],
    [{id: 'a', type: 'plot', x: 0, y: 0, w: 3, h: 12, settings: {}}, {id: 'b', type: 'plot', x: 3, y: 0, w: 3, h: 12, settings: {}}],
  ];
  for (const cards of sets) {
    const v = (await p.api('projects.get_overview_board', {project: P})).data.data.board.version;
    const r = await p.api('projects.set_overview_board', {project: P, version: v, cards});
    const errs = []; p.removeAllListeners('pageerror'); p.on('pageerror', e => errs.push(e.message.slice(0, 160) + ' || ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
    await p.go(`projects/${P}/overview`, 5000);
    console.log(cards.map(c => c.id).join('+'), 'save', r.status, 'boundary', await p.locator('[data-id=errorBoundary]').count(), errs[0] || '');
  }
  await b.close();
})();
