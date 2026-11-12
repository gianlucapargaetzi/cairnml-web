const {open} = require('./_chk');
(async () => {
  const {b, p} = await open('testuser01');
  const r = await p.api('repositories.git_token', {repository: 'https://github.com/gianlucapargaetzi/cairnml-private-demo', level: 'read_write'});
  console.log(r.status, r.status === 200 ? 'write token issued (len ' + (r.data.data.token || '').length + ')' : JSON.stringify(r.data.meta ? r.data.meta.result_msg : r.data).slice(0, 300));
  await b.close();
})();
