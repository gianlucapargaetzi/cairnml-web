const fs = require('fs');
const {open, settle} = require('./lib');
(async () => {
  const {browser, page} = await open();
  await page.goto('http://localhost/cairnml/dashboard'); await settle(page, 2500);
  const api = (service, body) => page.evaluate(async ([s, b]) => {
    const r = await fetch(`/cairnml/api/v2.40/${s}`, {method: 'POST', credentials: 'include', headers: {'Content-Type': 'application/json', 'X-Cairnml-Client': 'ui-audit'}, body: JSON.stringify(b || {})});
    const j = await r.json().catch(() => ({}));
    return {status: r.status, data: j.data, msg: j.meta && j.meta.result_msg};
  }, [service, body]);
  const ids = {projects: [], tasks: [], models: [], reports: [], datasets: []};
  const must = async (what, service, body) => { const r = await api(service, body); if (r.status >= 300) console.log('FAIL', what, r.status, r.msg); return r; };

  const p1 = await must('project', 'projects.create', {name: 'ui-audit', description: 'created by the UI audit'});
  const p2 = await must('nested', 'projects.create', {name: 'ui-audit/nested', description: 'nested'});
  const pid = p1.data && p1.data.id, nid = p2.data && p2.data.id;
  [pid, nid].forEach(i => i && ids.projects.push(i));
  const long = 'ui-audit-' + 'a-very-long-task-name-'.repeat(4).slice(0, 71);
  const specs = [
    {name: 'ui-audit-short', project: pid, end: 'completed'},
    {name: long, project: pid, end: 'completed'},
    {name: 'ui-audit-failed', project: pid, end: 'failed'},
    {name: 'ui-audit-draft', project: pid, end: 'none'},
    {name: 'ui-audit-queued', project: pid, end: 'queued'},
    {name: 'ui-audit-nested-task', project: nid, end: 'completed'},
  ];
  for (const s of specs) {
    const t = await must('task ' + s.name, 'tasks.create', {name: s.name, type: 'training', project: s.project});
    const id = t.data && t.data.id; if (!id) continue; ids.tasks.push(id);
    await must('hp', 'tasks.edit_hyper_params', {task: id, hyperparams: [{section: 'General', name: 'lr', value: '0.001'}, {section: 'General', name: 'batch_size', value: '32'}, {section: 'Args', name: 'epochs', value: '10'}]});
    if (s.end === 'completed' || s.end === 'failed') {
      await must('started', 'tasks.started', {task: id});
      const now = Date.now();
      const events = [];
      for (let i = 0; i < 20; i++) events.push({type: 'training_stats_scalar', task: id, iter: i, timestamp: now + i, metric: 'loss', variant: 'train', value: 1 / (i + 1)});
      for (let i = 0; i < 20; i++) events.push({type: 'training_stats_scalar', task: id, iter: i, timestamp: now + 100 + i, metric: 'accuracy', variant: 'val', value: i / 20});
      events.push({type: 'log', task: id, timestamp: now, level: 'info', worker: 'ui-audit', msg: 'ui-audit log line'});
      await must('events', 'events.add_batch', events);
      await must('artifact', 'tasks.add_or_update_artifacts', {task: id, artifacts: [{key: 'ui-audit-artifact', type: 'custom', mode: 'output', uri: 'file:///tmp/ui-audit.txt'}]});
      await must(s.end, s.end === 'completed' ? 'tasks.completed' : 'tasks.failed', {task: id, force: true});
    }
    if (s.end === 'queued') await must('enqueue', 'tasks.enqueue', {task: id, queue_name: 'default'});
  }
  const m = await must('model', 'models.create', {name: 'ui-audit-model', uri: 'file:///tmp/ui-audit-model.bin', framework: 'PyTorch', project: pid, task: ids.tasks[0]});
  if (m.data && m.data.id) ids.models.push(m.data.id);
  const rp = await must('report', 'reports.create', {name: 'ui-audit-report', project: pid});
  if (rp.data && rp.data.id) ids.reports.push(rp.data.id);
  const ds = await must('dataset', 'datasets.add', {kind: 'repo', url: 'https://github.com/gianlucapargaetzi/ui-audit-data', visibility: 'user'});
  if (ds.data && ds.data.dataset && ds.data.dataset.id) ids.datasets.push(ds.data.dataset.id);
  fs.writeFileSync('seed-ids.json', JSON.stringify(ids, null, 1));
  console.log('seeded', Object.fromEntries(Object.entries(ids).map(([k, v]) => [k, v.length])));
  await browser.close();
})().catch(e => { console.error('ERR', e.message.split('\n')[0]); process.exit(1); });
