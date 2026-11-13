// Checks the dataset content, agents and repositories cards of the overview board: put them on a board and look at them.
// node scripts/ds-check.js [project-id]
const {open} = require('./_chk');
const PROJECT = process.argv[2] || 'faea3b436d8444ea801852b286ce3b35';
let failures = 0;
const check = (ok, what, detail = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + what + (detail ? '  ' + detail : '')); if (!ok) failures++; };
(async () => {
  const {b, p} = await open('testuser01', 1600, 1100);
  await p.go(`projects/${PROJECT}/overview`, 3000);
  const repos = (await p.api('repositories.get_all', {project: PROJECT})).data.data.repositories;
  const ds = repos.find(r => r.roles.includes('dataset'));
  console.log('repos', repos.map(r => r.name + ':' + r.roles), 'dataset', ds && ds.name);
  const version = (await p.api('projects.get_overview_board', {project: PROJECT})).data.data.board?.version ?? 0;
  const saved = await p.api('projects.set_overview_board', {project: PROJECT, version, cards: [
    {id: 'd1', type: 'dataset-content', x: 0, y: 0, w: 3, h: 12, settings: {dataset: ds ? ds.id : null}},
    {id: 'd2', type: 'dataset-content', x: 3, y: 0, w: 3, h: 12, settings: {dataset: null}},
    {id: 'a1', type: 'agents', x: 0, y: 12, w: 3, h: 12, settings: {}},
    {id: 'r1', type: 'repositories', x: 3, y: 12, w: 3, h: 12, settings: {}}]});
  console.log('saved', saved.status);
  await p.reload(); await p.waitForTimeout(6000);
  check(await p.locator('[data-id=datasetNone]').count() === 1, 'a dataset card without a dataset says so');
  const chart = await p.locator('[data-id=datasetChart]').count(), nm = await p.locator('[data-id=datasetNoManifest]').count(), err = await p.locator('[data-id=datasetError]').count();
  check(chart + nm === 1 && err === 0, 'the dataset card draws or says there is no manifest', `chart=${chart} noManifest=${nm} error=${err}`);
  check(await p.locator('[data-id=agentsError]').count() === 0, 'the agents card has no error', await p.locator('sm-agents-card').innerText());
  check(await p.locator('[data-id=repositoriesError]').count() === 0, 'the repositories card has no error', (await p.locator('sm-repositories-card').innerText()).replace(/\n/g, ' | '));
  await p.shot('data-cards');
  // settings: choose the dataset in the card's settings
  await p.click('[data-id=boardEditToggle]'); await p.waitForTimeout(500);
  await p.locator('[data-card-type=dataset-content]').nth(1).locator('[data-id=boardCardEdit]').click(); await p.waitForTimeout(1200);
  await p.click('[data-id=datasetChoice]'); await p.waitForTimeout(400);
  check(await p.locator('mat-option').count() >= 1, 'the settings list the datasets of the project');
  await p.shot('data-settings');
  await b.close();
  process.exit(failures ? 1 : 0);
})();
