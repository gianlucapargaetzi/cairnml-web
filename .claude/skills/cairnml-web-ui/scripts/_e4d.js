const {open} = require('./_chk');
(async () => {
  const {b, p} = await open('testuser01');
  await p.go('datasets');
  const row = p.locator('sm-table tbody tr', {hasText: 'cairnml-private-demo'}).first(); await row.click(); await p.waitForTimeout(1500);
  console.log('BEFORE:', (await p.text()).replace(/.*Credentials \|/, 'Credentials |').slice(0, 260));
  // step 5: delete own credential row
  await p.click('[data-id=deleteCredentialButton]'); await p.waitForTimeout(800);
  await p.locator('mat-dialog-container').getByRole('button', {name: /^delete$/i}).click(); await p.waitForTimeout(2500);
  await p.locator('sm-table tbody tr', {hasText: 'cairnml-private-demo'}).first().click(); await p.waitForTimeout(1200);
  console.log('AFTER DELETE:', (await p.text()).replace(/.*Access: \|/, 'Access: |').slice(0, 300)); await p.shot('e4-step5-red');
  // clone + enqueue -> warning
  const t = (await p.api('tasks.get_all_ex', {only_fields: ['id', 'project'], order_by: ['-created']})).data.data.tasks[0]; const pid = t.project.id || t.project;
  await p.go(`projects/${pid}/tasks/${t.id}/execution`, 3500);
  await p.mouse.click(1484, 180); await p.waitForTimeout(700); await p.locator('[role=menuitem]', {hasText: 'Clone'}).first().click(); await p.waitForTimeout(1000);
  await p.locator('mat-dialog-container').getByRole('button', {name: /^clone$/i}).click(); await p.waitForTimeout(3000);
  const clone = (await p.api('tasks.get_all_ex', {only_fields: ['id', 'project', 'status'], order_by: ['-created']})).data.data.tasks[0];
  await p.go(`projects/${pid}/tasks/${clone.id}/execution`, 3500);
  await p.mouse.click(1484, 180); await p.waitForTimeout(700); await p.locator('[role=menuitem]', {hasText: 'Enqueue'}).first().click(); await p.waitForTimeout(1200);
  const q = p.locator('mat-dialog-container input').first(); await q.click(); await q.fill('parg-nb'); await p.waitForTimeout(800); await p.locator('mat-option', {hasText: 'parg-nb-f4cad6'}).first().click();
  await p.locator('mat-dialog-container').getByRole('button', {name: /enqueue/i}).last().click(); await p.waitForTimeout(2500); await p.shot('e4-step5-warning');
  console.log('WARNING:', (await p.locator('mat-dialog-container').innerText()).replace(/\n+/g, ' | ').slice(0, 300), '| clone status', (await p.api('tasks.get_by_id', {task: clone.id})).data.data.task.status);
  await p.getByRole('button', {name: 'Assign credentials'}).click(); await p.waitForTimeout(1200);
  await p.locator('mat-dialog-container mat-select').first().click(); await p.getByRole('option', {name: /my github app/}).click();
  await p.locator('mat-dialog-container').getByRole('button', {name: /set credential/i}).click(); await p.waitForTimeout(3500);
  await p.shot('e4-step5-after-assign');
  console.log('AFTER ASSIGN dialogs:', await p.locator('mat-dialog-container').count(), 'status', (await p.api('tasks.get_by_id', {task: clone.id})).data.data.task.status);
  require('fs').writeFileSync('/tmp/claude-1000/clone2.txt', clone.id);
  await b.close();
})();
