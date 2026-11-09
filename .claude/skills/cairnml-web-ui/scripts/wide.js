const {open, settle} = require('./lib');
const fs=require('fs'); const out=require('path').join(process.env.EVIDENCE_DIR || require('path').join(__dirname, '../../../../../ui-evidence'), 'a6-wide/'); fs.mkdirSync(out,{recursive:true});
(async () => { const {browser, page} = await open({width:3440,height:1440,dark:process.argv[2]==='dark'}); await page.goto('http://localhost/cairnml/dashboard'); await settle(page,2000);
 for (const [n,u] of [['dashboard','dashboard'],['projects','projects'],['reports','reports'],['pipelines','pipelines'],['datasets','datasets/datasets'],['repositories','datasets/repositories'],['queues','workers-and-queues/queues'],['agents','workers-and-queues/workers'],['tasks','projects/*/tasks'],['settings_access','settings/access']]) {
  await page.goto('http://localhost/cairnml/'+u); await settle(page,2500);
  const m = await page.evaluate(() => { const r=s=>{const e=[...document.querySelectorAll(s)].find(x=>x.getBoundingClientRect().width>0); if(!e) return null; const b=e.getBoundingClientRect(); return [Math.round(b.x),Math.round(b.right)];}; return {hdr:r('sm-page-header'), table:r('sm-table, sm-recent-tasks-table'), blocks:r('sm-project-card, sm-card, sm-pipeline-card, sm-queue-stats, sm-empty-state')}; });
  console.log(n.padEnd(16), JSON.stringify(m)); await page.screenshot({path: out+n+(process.argv[2]==='dark'?'_dark':'')+'.png'}); }
 await browser.close(); })();
