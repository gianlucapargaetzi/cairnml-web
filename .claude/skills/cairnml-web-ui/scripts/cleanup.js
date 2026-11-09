const fs = require('fs');
const {open, settle} = require('./lib');
// Deletes exactly the ui-audit data that seed.js recorded in seed-ids.json.
(async () => {
  const ids = JSON.parse(fs.readFileSync('seed-ids.json'));
  const {browser, page} = await open();
  await page.goto('http://localhost/cairnml/dashboard'); await settle(page, 2500);
  const api = (service, body) => page.evaluate(async ([s, b]) => {
    const r = await fetch(`/cairnml/api/v2.40/${s}`, {method: 'POST', credentials: 'include', headers: {'Content-Type': 'application/json', 'X-Cairnml-Client': 'ui-audit'}, body: JSON.stringify(b || {})});
    const j = await r.json().catch(() => ({}));
    return {status: r.status, data: j.data, msg: j.meta && j.meta.result_msg};
  }, [service, body]);
  for (const id of ids.datasets) console.log('dataset', id, (await api('datasets.delete', {id})).status);
  for (const id of ids.projects.slice().reverse()) console.log('project', id, (await api('projects.delete', {project: id, force: true, delete_contents: true})).status);
  await browser.close();
})().catch(e => { console.error('ERR', e.message.split('\n')[0]); process.exit(1); });
