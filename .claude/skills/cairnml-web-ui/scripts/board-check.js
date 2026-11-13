// Checks the overview board end to end: the owner arranges it, it persists, viewers cannot change it.
// node scripts/board-check.js [project-id]
const {open} = require('./_chk');
const PROJECT = process.argv[2] || 'faea3b436d8444ea801852b286ce3b35';
let failures = 0;
const check = (ok, what, detail = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + what + (detail ? '  ' + detail : '')); if (!ok) failures++; };
const geometry = p => p.evaluate(() => [...document.querySelectorAll('.grid-stack > .grid-stack-item')].map(e => ({id: e.getAttribute('gs-id'), type: e.getAttribute('data-card-type'), x: +e.getAttribute('gs-x') || 0, y: +e.getAttribute('gs-y') || 0, w: +e.getAttribute('gs-w') || 1, h: +e.getAttribute('gs-h') || 1, px: Math.round(e.getBoundingClientRect().left), py: Math.round(e.getBoundingClientRect().top), pw: Math.round(e.getBoundingClientRect().width), ph: Math.round(e.getBoundingClientRect().height)})));

(async () => {
  for (const [w, h] of [[1600, 1000], [1024, 800], [3440, 1440]]) {
    const {b, p} = await open('testuser01', w, h);
    await p.go(`projects/${PROJECT}/overview`, 5000);
    const cards = await geometry(p);
    check(cards.length > 0, `${w}px: the board shows cards`, `${cards.length}`);
    check(await p.locator('[data-id=boardCardMove]').count() === 0 && await p.locator('[data-id=boardAddCard]').count() === 0, `${w}px: no edit controls outside edit mode`);
    // tiles are square: a card of w tiles is w columns wide, and its height h/4 tiles
    const tile = cards[0].pw / cards[0].w;
    const squareOk = cards.filter(c => c.type !== 'divider').every(c => Math.abs((c.ph / (c.h / 4)) - (c.pw / c.w)) < 3 + 16);
    check(squareOk, `${w}px: tiles are square (a card's height is a whole number of tile heights)`, `tile ~ ${Math.round(tile)}px`);
    await p.shot(`board-${w}`);
    await b.close();
  }

  const {b, p} = await open('testuser01', 1600, 1000);
  await p.go(`projects/${PROJECT}/overview`, 5000);
  await p.click('[data-id=boardEditToggle]'); await p.waitForTimeout(800);
  const before = await geometry(p);
  // drag the first card by its handle one tile to the right, if it has room
  const first = before.find(c => c.x + c.w < 6) || before[0];
  const handle = await p.locator(`[gs-id="${first.id}"] [data-id=boardCardMove]`).boundingBox();
  await p.mouse.move(handle.x + 10, handle.y + 10); await p.mouse.down();
  await p.mouse.move(handle.x + 10 + first.pw / first.w * 1.1, handle.y + 10 + 60, {steps: 12}); await p.mouse.up(); await p.waitForTimeout(500);
  const afterDrag = (await geometry(p)).find(c => c.id === first.id);
  check(Number.isInteger(afterDrag.x) && afterDrag.x + afterDrag.w <= 6, 'a drop lands on whole cells inside the 6 columns', `x=${afterDrag.x} y=${afterDrag.y}`);
  // resize the last card by its corner
  const last = (await geometry(p)).slice(-1)[0];
  await p.locator(`[gs-id="${last.id}"]`).hover(); await p.waitForTimeout(300);
  const corner = await p.locator(`[gs-id="${last.id}"] .ui-resizable-se`).first().boundingBox();
  await p.mouse.move(corner.x + corner.width / 2, corner.y + corner.height / 2); await p.mouse.down();
  await p.mouse.move(corner.x - 40, corner.y + 90, {steps: 12}); await p.mouse.up(); await p.waitForTimeout(600);
  const resized = (await geometry(p)).find(c => c.id === last.id);
  check(resized.type === 'divider' ? resized.h === 1 : resized.h % 4 === 0, 'after a resize the card is a whole number of tiles high', `h=${resized.h}`);
  // add a divider
  await p.click('[data-id=boardAddCard]'); await p.waitForTimeout(600);
  await p.click('[data-id="addCardType-divider"]'); await p.click('[data-id=AddCardButton]'); await p.waitForTimeout(800);
  const dividers = (await geometry(p)).filter(c => c.type === 'divider');
  check(dividers.length >= 1, 'a divider was added from the Add card dialog', `${dividers.length}`);
  await p.waitForTimeout(2200);
  const saved = (await p.api('projects.get_overview_board', {project: PROJECT})).data.data;
  check(saved.board && saved.board.cards.length === (await geometry(p)).length, 'the board saved by itself', `version ${saved.board && saved.board.version}`);
  await p.click('[data-id=boardEditToggle]'); await p.waitForTimeout(600);
  check(await p.locator('[data-id=boardCardMove]').count() === 0, 'leaving edit mode hides every control');
  await p.reload(); await p.waitForTimeout(5000);
  const reloaded = await geometry(p);
  check(reloaded.length === saved.board.cards.length, 'the layout persists after a reload', `${reloaded.length} cards`);
  await p.shot('board-after-edit');
  await b.close();

  // viewers: the second user as a read member and as a collaborator (they log in once, so the account exists)
  const o = await open('testuser01', 1600, 900);
  const probe = await open('testuser02', 1600, 900);
  const u2 = (await probe.p.api('users.get_current_user')).data.data.user;
  await probe.b.close();
  for (const role of ['read', 'collaborator']) {
    await o.p.api('projects.remove_member', {project: PROJECT, user: u2.id});
    const added = await o.p.api('projects.add_member', {project: PROJECT, user: u2.id, role});
    if (added.status !== 200) { check(false, `${role}: could not add the member`, JSON.stringify(added.data).slice(0, 120)); continue; }
    const v = await open('testuser02', 1600, 900);
    await v.p.go(`projects/${PROJECT}/overview`, 5000);
    check(await v.p.locator('.grid-stack-item').count() > 0, `${role}: sees the board`);
    check(await v.p.locator('[data-id=boardEditToggle]').count() === 0, `${role}: has no pen`);
    const denied = await v.p.api('projects.set_overview_board', {project: PROJECT, version: 99, cards: []});
    check(denied.status === 403 || (denied.status === 400 && /permission|access|owner/i.test(JSON.stringify(denied.data))), `${role}: a direct save is refused`, `status ${denied.status}`);
    await v.b.close();
  }
  await o.p.api('projects.remove_member', {project: PROJECT, user: u2.id});
  await o.b.close();
  console.log(failures ? `\n${failures} check(s) FAILED` : '\nall checks passed');
  process.exit(failures ? 1 : 0);
})();
