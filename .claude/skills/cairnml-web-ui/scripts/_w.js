const {open} = require('./_chk'); const fs = require('fs');
(async () => {
  const {b, p} = await open('testuser01');
  const r = await p.api('user_access.add_app', {label: 'w', app_id: '5709920', key: fs.readFileSync(process.argv[2], 'utf8')});
  console.log(r.status, JSON.stringify(r.data).slice(0, 400));
  await b.close();
})();
