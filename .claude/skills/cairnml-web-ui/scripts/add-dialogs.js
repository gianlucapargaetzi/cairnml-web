// Opens every "Add ..." dialog from its real button, screenshots it and measures the form: field width against the
// dialog's content width, and the gap between the last field and the action row. Usage: node add-dialogs.js <tag> [width]
const {open, settle} = require('./lib');
const fs = require('fs');
const ids = JSON.parse(fs.readFileSync('seed-ids.json'));
const tag = process.argv[2] || 'run', width = +(process.argv[3] || 1600);
const outDir = process.env.EVIDENCE_DIR || require('path').join(__dirname, '../../../../../ui-evidence');
fs.mkdirSync(outDir + '/dialogs', {recursive: true});
const B = 'http://localhost/cairnml';
const measure = () => {
  const d = document.querySelector('mat-dialog-container'); if (!d) return null;
  const r = e => { const b = e.getBoundingClientRect(); return {x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height), b: Math.round(b.bottom), r: Math.round(b.right)}; };
  const content = d.querySelector('.mat-mdc-dialog-content, .content, .form, form') || d;
  const fields = [...d.querySelectorAll('mat-form-field')].map(r);
  const actions = [...d.querySelectorAll('.actions, mat-dialog-actions')].filter(e => e.getBoundingClientRect().height > 0).map(r)[0];
  const lastField = fields[fields.length - 1];
  const alertEl = d.querySelector('sm-inline-alert, .meta, .intro');
  const afterAlert = alertEl ? (() => { const a = alertEl.getBoundingClientRect(); const next = [...d.querySelectorAll('mat-form-field, .form, form')].map(e => e.getBoundingClientRect()).filter(b => b.top >= a.bottom - 1).sort((x, y) => x.top - y.top)[0]; return next ? Math.round(next.top - a.bottom) : null; })() : null;
  const dlg = d.getBoundingClientRect(); const actionsEl = [...d.querySelectorAll('.actions, mat-dialog-actions')].find(e => e.getBoundingClientRect().height > 0);
  const bottomGap = actionsEl ? Math.round(dlg.bottom - actionsEl.getBoundingClientRect().bottom) : null;
  const fieldToActions = lastField && actionsEl ? Math.round(actionsEl.getBoundingClientRect().top - (d.querySelectorAll('mat-form-field')[fields.length - 1].querySelector('.mat-mdc-form-field-subscript-wrapper') ? d.querySelectorAll('mat-form-field')[fields.length - 1].querySelector('.mat-mdc-form-field-flex').getBoundingClientRect().bottom : lastField.b)) : null;
  const inner = d.querySelector('sm-dialog-template') ? r(d.querySelector('sm-dialog-template')) : r(d);
  return {afterAlert, bottomGap, fieldToActions, dialog: r(d), fields: fields.map(f => ({w: f.w, x: f.x, r: f.r})), template: inner, gapFieldToActions: lastField && actions ? actions.y - lastField.b : null,
    fieldRightInset: lastField ? inner.r - lastField.r : null, fieldLeftInset: lastField ? lastField.x - inner.x : null};
};
(async () => {
  const {browser, page} = await open({width, height: 900});
  const shot = async (name) => {
    await page.waitForTimeout(900);
    const m = await page.evaluate(measure);
    const el = await page.$('mat-dialog-container');
    if (el) await el.screenshot({path: `${outDir}/dialogs/${name}-${tag}.png`});
    console.log(name.padEnd(22), JSON.stringify(m && {fields: m.fields.map(f => f.w), template: m.template.w, gap: m.gapFieldToActions, toActions: m.fieldToActions, afterNote: m.afterAlert, bottom: m.bottomGap, left: m.fieldLeftInset, right: m.fieldRightInset}));
    await page.keyboard.press('Escape'); await page.waitForTimeout(500);
    const still = await page.$('mat-dialog-container'); if (still) { await page.mouse.click(5, 5); await page.waitForTimeout(400); }
  };
  const click = async (sel) => { const e = await page.$(sel); if (!e) { console.log('MISSING', sel); return false; } await e.click(); return true; };
  const go = async (path) => { await page.goto(B + path, {waitUntil: 'load'}); await settle(page, 3000); };
  await go(`/projects/${ids.projects[0]}/settings`);
  for (const [name, sel] of [['project-credentials', '[data-id=addProjectCredentialButton]'], ['project-datasets', '[data-id=addProjectDatasetButton]'], ['project-queues', '[data-id=addProjectQueueButton]'], ['project-member', '[data-id=addMemberButton]']]) {
    if (await click(sel)) await shot(name);
  }
  await go('/workers-and-queues/queues');
  const row = await page.$('tbody tr'); if (row) await row.click(); await page.waitForTimeout(1200);
  for (const t of await page.$$('[role=tab]')) { if (/users/i.test(await t.textContent())) { await t.click(); break; } } await page.waitForTimeout(1200);
  if (await click('[data-id=addQueueUserButton]')) await shot('queue-user');
  await go('/datasets/datasets');
  const add = await page.$('[data-tip="Add dataset"], [aria-label="Add dataset"]'); if (add) { await add.click(); await shot('dataset'); } else console.log('MISSING add dataset');
  await go('/datasets/repositories');
  const addr = await page.$('[data-tip="Add repository"], [aria-label="Add repository"]'); if (addr) { await addr.click(); await shot('repository'); } else console.log('MISSING add repository');
  await go('/dashboard');
  const np = await page.$('[data-id="New Project"], button:has-text("New project")'); if (np) { await np.click(); await shot('create-project'); } else console.log('MISSING new project');
  await go('/reports');
  const nr = await page.$('[data-tip="Create report"], [aria-label="Create report"], [aria-label="New report"], button:has-text("New report")'); if (nr) { await nr.click(); await shot('create-report'); } else console.log('MISSING new report');
  await go(`/projects/${ids.projects[0]}/folders`);
  const ir = await page.$('[data-id=importRunButton], [aria-label="Import run"], button:has-text("Import run")'); if (ir) { await ir.click(); await shot('import-run'); } else console.log('MISSING import run');
  await go('/settings/access');
  if (await click('[data-id=addCredentialButton]')) await shot('credential');
  if (await click('[data-id=shareAccessButton]')) await shot('share-access');
  await browser.close();
})().catch(e => { console.error('ERR', e.message.split('\n')[0]); process.exit(1); });
