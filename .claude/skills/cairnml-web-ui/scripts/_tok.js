const {open} = require('./_chk');
(async () => {
  const {b, p} = await open('testuser01');
  const repo = (await p.api('repositories.get_all')).data.data.repositories.find(r => r.name === 'cairnml-private-demo');
  const r = await p.api('repositories.git_token', {repository: 'https://github.com/gianlucapargaetzi/cairnml-private-demo', level: 'read'});
  console.log(r.status, r.status === 200 ? 'token len ' + (r.data.data.token || '').length : JSON.stringify(r.data).slice(0, 300));
  require('fs').writeFileSync('/tmp/claude-1000/tok.txt', r.data.data.token || '');
  await b.close();
})();
