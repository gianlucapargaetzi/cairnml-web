const {open} = require('./_chk');
(async () => {
  const {b, p} = await open('testuser01');
  const id = require('fs').readFileSync('/tmp/claude-1000/clone1.txt', 'utf8').trim();
  console.log('dequeue', (await p.api('tasks.dequeue', {task: id})).status);
  const t = (await p.api('tasks.get_by_id', {task: id})).data.data.task; const pid = t.project.id || t.project;
  await p.go(`projects/${pid}/tasks/${id}/execution`, 3500);
  await p.mouse.click(1484, 180); await p.waitForTimeout(700); await p.locator('[role=menuitem]', {hasText: 'Enqueue'}).first().click(); await p.waitForTimeout(1200);
  const q = p.locator('mat-dialog-container input').first(); await q.click(); await q.fill(''); await q.type('parg-nb'); await p.waitForTimeout(1000);
  await p.shot('e4-enqueue-queue-choice');
  console.log('OPTIONS:', await p.locator('mat-option').allInnerTexts());
  await p.locator('mat-option', {hasText: 'parg-nb-f4cad6'}).first().click(); await p.waitForTimeout(500);
  await p.locator('mat-dialog-container').getByRole('button', {name: /enqueue/i}).last().click(); await p.waitForTimeout(3000);
  const t2 = (await p.api('tasks.get_by_id', {task: id})).data.data.task;
  console.log('status', t2.status, 'queue', JSON.stringify(t2.execution && t2.execution.queue));
  await b.close();
})();
