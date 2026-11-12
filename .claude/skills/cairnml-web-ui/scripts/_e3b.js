const {open} = require('./_chk');
const S = process.argv[2];
async function add(p, name, file) {
  await p.getByRole('button', {name: /add credential/i}).first().click(); await p.waitForTimeout(1000);
  const inputs = p.locator('mat-dialog-container input[type=text], mat-dialog-container input:not([type=file])');
  await inputs.nth(0).fill(name); await inputs.nth(1).fill('5709920');
  await p.locator('mat-dialog-container input[type=file]').setInputFiles(file); await p.waitForTimeout(500);
  await p.locator('mat-dialog-container').getByRole('button', {name: /^add credential$/i}).click(); await p.waitForTimeout(4000);
}
(async () => {
  const {b, p} = await open('testuser01');
  await p.go('settings/access');
  await add(p, 'wrong key', S + '/wrong.pem');
  console.log('WRONG KEY DIALOG STILL OPEN:', await p.locator('mat-dialog-container').count(), (await p.locator('mat-dialog-container').innerText().catch(()=>'')).replace(/\n+/g,' | ').slice(-200));
  await p.shot('e3-wrong-key');
  await p.keyboard.press('Escape'); await p.waitForTimeout(500);
  console.log('creds after wrong:', JSON.stringify((await p.api('user_access.get_all')).data.data.credentials.map(c => c.name)));
  await add(p, 'my github app', '/home/parg/Documents/mlops/cairnml.2026-11-11.private-key.pem'.replace('cairnml.', 'cairnml-test.'));
  await p.go('settings/access'); await p.shot('e3-access-added');
  console.log('ACCESS:', (await p.text()).replace(/.*Add credential/, '').slice(0, 400));
  console.log('creds:', JSON.stringify((await p.api('user_access.get_all')).data.data.credentials));
  await b.close();
})();
