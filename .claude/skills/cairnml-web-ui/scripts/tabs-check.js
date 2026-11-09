// Does the tab bar of an experiment page stay put when another tab opens? Prints the position of the tab bar and the
// centre of its tabs for every tab, at the given widths. Usage: node tabs-check.js <task path> [widths]
const {open, settle} = require('./lib');
const base = 'http://localhost/cairnml';
const path = process.argv[2];
const widths = (process.argv[3] || '1600,3440').split(',').map(Number);
(async () => {
  for (const w of widths) {
    const {browser, page} = await open({width: w, height: 900});
    await page.goto(base + path, {waitUntil: 'load'}); await settle(page, 3500);
    const names = await page.$$eval('sm-router-tab-nav-bar a[mat-tab-link]', a => a.map(x => x.getAttribute('data-id')));
    const rows = [];
    for (const n of names) {
      const link = await page.$(`sm-router-tab-nav-bar a[data-id="${n}"]`);
      if (!link) continue;
      await link.click(); await page.waitForTimeout(1500);
      const m = await page.evaluate(() => {
        const nav = document.querySelector('sm-router-tab-nav-bar'); const tabs = [...nav.querySelectorAll('a[mat-tab-link]')];
        const nb = nav.getBoundingClientRect(); const first = tabs[0].getBoundingClientRect(), last = tabs[tabs.length - 1].getBoundingClientRect();
        const grid = nav.closest('.tab-nav'); const gb = grid && grid.getBoundingClientRect();
        const r = n => Math.round(n * 10) / 10;
        return {navX: r(nb.x), navW: r(nb.width), tabsCentre: r((first.left + last.right) / 2), gridCentre: gb && r(gb.x + gb.width / 2), gridW: gb && r(gb.width), kids: grid ? [...grid.children].map(c => r(c.getBoundingClientRect().width)) : null};
      });
      rows.push({tab: n, ...m});
    }
    console.log('## width', w); rows.forEach(r => console.log(JSON.stringify(r)));
    await browser.close();
  }
})().catch(e => { console.error('ERR', e.message.split('\n')[0]); process.exit(1); });
