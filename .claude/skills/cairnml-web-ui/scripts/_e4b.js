const {open} = require('./_chk');
const Q = 'parg-nb-f4cad6';
async function taskPage(p, idPrefix) {
  const t = (await p.api('tasks.get_all_ex', {only_fields: ['id', 'project', 'name', 'status'], order_by: ['-created']})).data.data.tasks.find(x => x.id.startsWith(idPrefix));
  const pid = t.project.id || t.project;
  await p.go(`projects/${pid}/tasks/${t.id}/execution`, 3500);
  return {t, pid};
}
async function menu(p, item) { await p.mouse.click(1484, 180); await p.waitForTimeout(700); await p.locator('[role=menuitem]', {hasText: item}).first().click(); await p.waitForTimeout(1200); }
(async () => {
  const {b, p} = await open('testuser01');
  const {pid} = await taskPage(p, '160ac9');
  await menu(p, 'Clone'); await p.shot('e4-clone-dialog');
  console.log('CLONE DIALOG:', (await p.locator('mat-dialog-container').innerText()).replace(/\n+/g, ' | ').slice(0, 260));
  await p.locator('mat-dialog-container').getByRole('button', {name: /^clone$/i}).click(); await p.waitForTimeout(3000);
  console.log('after clone url:', p.url().replace('http://localhost/cairnml/', ''));
  const clone = (await p.api('tasks.get_all_ex', {only_fields: ['id', 'status', 'name'], order_by: ['-created']})).data.data.tasks[0];
  console.log('clone', clone.id.slice(0, 6), clone.status);
  await p.go(`projects/${pid}/tasks/${clone.id}/execution`, 3500);
  await menu(p, 'Enqueue'); await p.shot('e4-enqueue-dialog');
  await p.locator('mat-dialog-container').getByRole('button', {name: /enqueue/i}).last().click(); await p.waitForTimeout(3000);
  await p.shot('e4-enqueued');
  console.log('after enqueue dialogs:', await p.locator('mat-dialog-container').count(), 'status:', (await p.api('tasks.get_by_id', {task: clone.id})).data.data.task.status);
  require('fs').writeFileSync('/tmp/claude-1000/clone1.txt', clone.id);
  await b.close();
})();
