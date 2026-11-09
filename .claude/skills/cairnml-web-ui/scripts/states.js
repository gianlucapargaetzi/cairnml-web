// usage: node states.js <outdir> [width=1600] [height=900] [light|dark] [setup|run|cleanup]
// Content states of the list pages: empty, one row, many rows (200 tasks, 30 projects), an 80-character name, an API error,
// and the scroll behaviour (the page header and the toolbar must stay). setup creates the data, cleanup deletes it.
const fs = require('fs');
const {open, settle} = require('./lib');
const {measurePage} = require('./measure');
const out = process.argv[2] || 'states';
const width = +(process.argv[3] || 1600), height = +(process.argv[4] || 900), dark = process.argv[5] === 'dark';
const MODE = process.argv[6] || 'run';
const BASE = 'http://localhost/cairnml';
const IDS = 'state-ids.json';
fs.mkdirSync(out + '/shots', {recursive: true});

const apiFor = page => (service, body) => page.evaluate(async ([s, b]) => {
  const r = await fetch(`/cairnml/api/v2.40/${s}`, {method: 'POST', credentials: 'include', headers: {'Content-Type': 'application/json', 'X-Cairnml-Client': 'ui-audit'}, body: JSON.stringify(b)});
  const j = await r.json().catch(() => ({}));
  return {status: r.status, data: j.data};
}, [service, body]);

(async () => {
  const {browser, page} = await open({width, height, dark});
  await page.goto(BASE + '/dashboard'); await settle(page, 2000);
  const api = apiFor(page);

  if (MODE === 'setup') {
    const ids = {projects: [], emptyProject: null, bulkProject: null};
    const e = await api('projects.create', {name: 'ui-audit-empty', description: 'no content'});
    if (!e.data || !e.data.id) throw new Error('setup failed (session expired? run login.js): ' + e.status);
    ids.emptyProject = e.data.id; ids.projects.push(e.data.id);
    const b = await api('projects.create', {name: 'ui-audit-bulk', description: '200 tasks'});
    ids.bulkProject = b.data.id; ids.projects.push(b.data.id);
    for (let i = 0; i < 200; i += 10) {
      await Promise.all([...Array(10).keys()].map(k => api('tasks.create', {name: `ui-audit-bulk-${i + k}`, type: 'training', project: b.data.id})));
    }
    for (let i = 0; i < 30; i++) { const p = await api('projects.create', {name: `ui-audit-p-${i}`, description: 'card'}); ids.projects.push(p.data.id); }
    fs.writeFileSync(IDS, JSON.stringify(ids));
    console.log('state data created', ids.projects.length, 'projects');
    await browser.close(); return;
  }
  if (MODE === 'cleanup') {
    const ids = JSON.parse(fs.readFileSync(IDS));
    for (const id of ids.projects) await api('projects.delete', {project: id, force: true, delete_contents: true});
    console.log('state data deleted', ids.projects.length);
    await browser.close(); return;
  }

  const ids = JSON.parse(fs.readFileSync(IDS));
  const seed = JSON.parse(fs.readFileSync('seed-ids.json'));
  const results = [];
  const run = async (name, url, opts = {}) => {
    try {
      if (opts.fail) await page.route('**/cairnml/api/**', r => /(projects|tasks|models|reports|datasets|queues|workers)\.(get_all|get_all_ex|visible)/.test(r.request().url()) ? r.fulfill({status: 500, contentType: 'application/json', body: '{"meta":{"result_code":500,"result_msg":"forced error"}}'}) : r.continue());
      await page.goto(BASE + '/' + url); await settle(page, opts.wait || 2500);
      const m = await page.evaluate(measurePage);
      const probe = () => page.evaluate(() => {
        const r = s => { const e = [...document.querySelectorAll(s)].find(x => x.getBoundingClientRect().height > 0); if (!e) return null; const b = e.getBoundingClientRect(); return {y: Math.round(b.y), h: Math.round(b.height)}; };
        return {pageHeader: r('sm-page-header'), toolbar: r('sm-projects-header, sm-reports-header, sm-experiment-header, .queues-header'), empty: r('sm-empty-state'), table: r('sm-table'), noData: /No data to show/.test(document.body.innerText), cards: document.querySelectorAll('sm-project-card, sm-card, sm-pipeline-card, sm-report-card').length, hscroll: document.documentElement.scrollWidth > innerWidth + 1};
      });
      const before = await probe();
      await page.screenshot({path: `${out}/shots/${name}.png`});
      let after = null;
      if (opts.scroll) {
        await page.mouse.move(width / 2, height / 2 + 100); await page.mouse.wheel(0, 900); await page.waitForTimeout(700);
        after = await probe(); await page.screenshot({path: `${out}/shots/${name}_scrolled.png`});
      }
      results.push({name, url, before, after, hasHorizontalScroll: m.hasHorizontalScroll});
      console.log('STATE', name, JSON.stringify({before, after}).slice(0, 400));
    } catch (e) { console.log('FAILED', name, e.message.split('\n')[0]); }
    if (opts.fail) await page.unroute('**/cairnml/api/**');
  };

  await run('projects_many', 'projects', {scroll: true});
  await run('tasks_many', `projects/${ids.bulkProject}/tasks`, {scroll: true, wait: 4000});
  await run('tasks_empty', `projects/${ids.emptyProject}/tasks`);
  await run('models_empty', `projects/${ids.emptyProject}/models`);
  await run('tasks_long_name', `projects/${seed.projects[0]}/tasks`);
  await run('models_one', `projects/${seed.projects[0]}/models`);
  await run('reports_one', 'reports');
  await run('pipelines_empty', 'pipelines');
  await run('repositories_empty', 'datasets/repositories');
  await run('datasets_one', 'datasets/datasets');
  await run('queues_one', 'workers-and-queues/queues');
  await run('agents_empty', 'workers-and-queues/workers');
  await run('access', 'settings/access');
  await run('error_projects', 'projects', {fail: true});
  await run('error_tasks', `projects/${seed.projects[0]}/tasks`, {fail: true});
  await run('error_datasets', 'datasets/datasets', {fail: true});
  await run('error_queues', 'workers-and-queues/queues', {fail: true});
  fs.writeFileSync(out + '/states.json', JSON.stringify(results, null, 1));
  console.log('DONE states', results.length);
  await browser.close();
})().catch(e => { console.error('ERR', e.message.split('\n')[0]); process.exit(1); });
