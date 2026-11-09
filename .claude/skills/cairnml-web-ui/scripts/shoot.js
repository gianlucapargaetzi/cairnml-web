const {open, settle} = require('./lib');
const fs = require('fs');
const out = require('path').join(process.env.EVIDENCE_DIR || require('path').join(__dirname, '../../../../../ui-evidence'), 'after/');
fs.mkdirSync(out, {recursive: true});
(async () => {
  const {browser, page} = await open();
  const base = 'http://localhost/cairnml/';
  const shot = async (n) => page.screenshot({path: out + n + '.png'});
  const meas = async (n) => console.log(n, JSON.stringify(await page.evaluate(() => {
    const r = s => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)]; };
    return {header: r('.sm-page-header'), toolbar: r('sm-projects-header, .queues-header'), table: r('sm-table, p-table'), empty: r('sm-empty-state'), recent: r('sm-dashboard-experiments sm-table, sm-dashboard-experiments p-table')};
  })));
  await page.goto(base + 'dashboard'); await settle(page);
  for (const [n, u] of [['datasets_datasets','datasets/datasets'],['datasets_repositories','datasets/repositories'],['queues','workers-and-queues/queues'],['dashboard','dashboard']]) {
    await page.goto(base + u); await settle(page); await shot(n); await meas(n);
  }
  await page.goto(base + 'datasets/datasets'); await settle(page);
  for (const [id, n] of [['addDataset','dlg_add_dataset'],['datasetsHelp','dlg_help']]) {
    await page.click(`[data-id="${id}"]`); await page.waitForTimeout(900); await shot(n);
    await page.keyboard.press('Escape'); await page.waitForTimeout(500);
  }
  await page.goto(base + 'datasets/repositories'); await settle(page);
  await page.click('[data-id="addRepository"]'); await page.waitForTimeout(900); await shot('dlg_add_repository');
  await browser.close();
})();
