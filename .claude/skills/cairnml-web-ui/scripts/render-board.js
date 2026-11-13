// Renders the overview board with one card of every type, in view mode, edit mode and the add-card and settings dialogs.
// node scripts/render-board.js [project-id]   (screenshots go to ui-evidence/examples/)
const {open} = require('./_chk');
const PROJECT = process.argv[2] || 'faea3b436d8444ea801852b286ce3b35';
(async () => {
  const {b, p} = await open('testuser01', 1600, 3000);
  await p.go(`projects/${PROJECT}/overview`, 3000);
  const ds = (await p.api('repositories.get_all', {project: PROJECT})).data.data.repositories.find(r => r.roles.includes('dataset'));
  const version = (await p.api('projects.get_overview_board', {project: PROJECT})).data.data.board?.version ?? 0;
  const card = (id, type, x, y, w, h, settings = {}) => ({id, type, x, y, w, h, settings});
  await p.api('projects.set_overview_board', {project: PROJECT, version, cards: [
    card('t', 'divider', 0, 0, 6, 1, {title: 'How are we doing?'}),
    card('s', 'project-state', 0, 1, 3, 8), card('c', 'contributions', 3, 1, 3, 16),
    card('pg', 'progress', 0, 9, 3, 8, {task: null, metric: {metric: 'loss', variant: 'train'}, goal: 'min'}),
    card('pl', 'plot', 0, 17, 6, 12),
    card('d2', 'divider', 0, 29, 6, 1, {title: 'Data and machines'}),
    card('ds', 'dataset-content', 0, 30, 2, 12, {dataset: ds ? ds.id : null}),
    card('ag', 'agents', 2, 30, 2, 4), card('rp', 'repositories', 4, 30, 2, 8),
    card('rt', 'recent-tasks', 0, 42, 6, 16), card('ms', 'metric-snapshot', 0, 58, 6, 12), card('de', 'description', 0, 70, 6, 16)]});
  await p.reload(); await p.waitForTimeout(7000);
  await p.screenshot({path: '/home/parg/Documents/mlops/ui-evidence/examples/board-all-cards.png', fullPage: true});
  await p.click('[data-id=boardEditToggle]'); await p.waitForTimeout(800);
  await p.screenshot({path: '/home/parg/Documents/mlops/ui-evidence/examples/board-edit-mode.png', fullPage: true});
  await p.click('[data-id=boardAddCard]'); await p.waitForTimeout(600); await p.shot('board-add-card-dialog');
  await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  await p.locator('[data-card-type=plot]').first().locator('[data-id=boardCardEdit]').click(); await p.waitForTimeout(1200); await p.shot('board-plot-settings');
  await b.close();
})();
