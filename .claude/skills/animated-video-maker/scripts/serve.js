// Minimal static server for a canvas video project (ES modules + fetch need http://).
// usage: node serve.js <projectDir> [port] [index=index.html]
const http = require('http'), fs = require('fs'), path = require('path');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.mp3': 'audio/mpeg', '.wav': 'audio/wav',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
function start(root, port = 0, index = 'index.html') {
  root = path.resolve(root);
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p === '/') p = '/' + index;
      const f = path.join(root, p);
      if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(res);
    });
    srv.listen(port, '127.0.0.1', () => resolve(srv));
  });
}
module.exports = { start };
if (require.main === module) start(process.argv[2] || '.', +(process.argv[3] || 8080), process.argv[4]).then((s) => console.log(`preview: http://127.0.0.1:${s.address().port}/?preview=1`));
