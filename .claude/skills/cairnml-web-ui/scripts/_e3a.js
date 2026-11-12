const {open} = require('./_chk');
(async () => {
  const {b, p} = await open('testuser01');
  await p.go('settings/access');
  await p.shot('e3-access-empty');
  const add = p.getByRole('button', {name: /add credential/i}).first();
  console.log('add button', await add.count());
  await add.click(); await p.waitForTimeout(1200); await p.shot('e3-add-dialog');
  console.log('DIALOG:', (await p.locator('mat-dialog-container').innerText()).replace(/\n+/g,' | ').slice(0, 500));
  console.log('inputs', await p.locator('mat-dialog-container input').count(), await p.locator('mat-dialog-container input[type=file]').count());
  await b.close();
})();
