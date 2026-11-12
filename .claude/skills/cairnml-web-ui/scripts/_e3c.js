const {open} = require('./_chk');
(async () => {
  const {b, p} = await open('testuser01');
  await p.go('datasets');
  await p.click('[data-id=addRepository]'); await p.waitForTimeout(900);
  await p.click('[data-id=addRepositoryType]'); await p.getByRole('option', {name: 'Code repository'}).click();
  await p.fill('[data-id=addRepositoryUrl]', 'https://github.com/gianlucapargaetzi/cairnml-private-demo');
  await p.click('[data-id=addRepositoryProject]'); await p.getByRole('option', {name: 'examples'}).click();
  await p.shot('e3-add-repo-dialog');
  await p.click('[data-id=AddRepositoryButton]'); await p.waitForTimeout(3500);
  const row = p.locator('sm-table tbody tr', {hasText: 'cairnml-private-demo'}).first();
  await row.click(); await p.waitForTimeout(1500); await p.shot('e3-private-red');
  console.log('BEFORE:', (await p.text()).replace(/.*Repository \|/, 'Repository |').slice(0, 420));
  console.log('trash disabled:', await row.locator('[data-id=deleteRepositoryButton]').isDisabled());
  // assign by the lock in the credentials table
  await p.click('[data-id=reassignCredentialButton]'); await p.waitForTimeout(1200); await p.shot('e3-assign-dialog');
  await p.locator('mat-dialog-container mat-select').first().click(); await p.getByRole('option', {name: /my github app/}).click();
  await p.locator('mat-dialog-container').getByRole('button', {name: /set credential/i}).click(); await p.waitForTimeout(4000);
  const row2 = p.locator('sm-table tbody tr', {hasText: 'cairnml-private-demo'}).first(); await row2.click(); await p.waitForTimeout(1500);
  await p.shot('e3-private-green');
  console.log('AFTER:', (await p.text()).replace(/.*Repository \|/, 'Repository |').slice(0, 520));
  await b.close();
})();
