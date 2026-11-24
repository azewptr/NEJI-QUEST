const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const source = fs.readFileSync(path.join(__dirname, '../frontend/app.js'), 'utf8');
const start = source.indexOf('async function json(response) {');
const end = source.indexOf('\nfunction ipfs(', start);
const parse = new Function(source.slice(start, end) + '; return json;')();

(async () => {
  assert.deepEqual(await parse(new Response('{"label":"Ramuan"}')), {label: 'Ramuan'});
  await assert.rejects(parse(new Response('Internal Server Error', {status:500})), /HTTP 500/);
  await assert.rejects(parse(new Response('{"detail":"Model gagal"}', {status:503})), /Model gagal/);
  await assert.rejects(parse(new Response('<html>halaman</html>')), /Format balasan/);
  await assert.rejects(parse(new Response('{"detail":[{"msg":"invalid"}]}', {status:422})), /Permintaan gagal/);
  console.log('PASS 5 response parser checks');
})().catch(error => {console.error(error); process.exitCode = 1;});
