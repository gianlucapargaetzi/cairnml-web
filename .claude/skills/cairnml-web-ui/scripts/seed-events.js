const fs = require('fs');
const {open, settle} = require('./lib');
(async () => {
  const ids = JSON.parse(fs.readFileSync('seed-ids.json'));
  const {browser, page} = await open();
  await page.goto('http://localhost/cairnml/dashboard'); await settle(page, 2500);
  const lines = (task) => {
    const now = Date.now(), ev = [];
    for (let i = 0; i < 20; i++) ev.push({type: 'training_stats_scalar', task, iter: i, timestamp: now + i, metric: 'loss', variant: 'train', value: 1 / (i + 1)});
    for (let i = 0; i < 20; i++) ev.push({type: 'training_stats_scalar', task, iter: i, timestamp: now + 100 + i, metric: 'accuracy', variant: 'val', value: i / 20});
    ev.push({type: 'log', task, timestamp: now, level: 'info', worker: 'ui-audit', msg: 'ui-audit log line'});
    return ev.map(e => JSON.stringify(e)).join('\n');
  };
  for (const task of ids.tasks.slice(0, 3).concat(ids.tasks.slice(5))) {
    const r = await page.evaluate(async ([t, body]) => {
      const res = await fetch('/cairnml/api/v2.40/events.add_batch', {method: 'POST', credentials: 'include', headers: {'Content-Type': 'application/json-lines', 'X-Cairnml-Client': 'ui-audit'}, body});
      const j = await res.json().catch(() => ({}));
      return {status: res.status, msg: j.meta && j.meta.result_msg};
    }, [task, lines(task)]);
    console.log(task.slice(0, 8), r.status, r.msg || '');
  }
  await browser.close();
})().catch(e => { console.error('ERR', e.message.split('\n')[0]); process.exit(1); });
