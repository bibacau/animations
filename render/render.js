// Frame-accurate renderer: headless Chromium draws frame t = n / fps on a 2D canvas,
// frames are piped to ffmpeg and muxed with the song.
//
//   node render/render.js                       full video -> output/tpot_2d.mp4
//   node render/render.js --stills 1.5,3.4      look-dev stills -> output/stills/
//   node render/render.js --audit 1             lyric visibility audit
//   options: --fps 30 --from 0 --to 49.85 --crf 28 --out output/x.mp4
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { start } = require('./serve');

const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') ? [...a, [v.slice(2), arr[i + 1]]] : a), []));
const fps = +(args.fps || 30);
const ROOT = path.resolve(__dirname, '..');
const OUT = path.resolve(ROOT, args.out || 'output/tpot_2d.mp4');

(async () => {
  const srv = await start(0);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 854, height: 480 } });
  page.on('console', (m) => { if (m.type() === 'error') console.log('[page]', m.text()); });
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.goto(`http://127.0.0.1:${srv.address().port}/`);
  await page.waitForFunction(() => window.__ready || window.__error, null, { timeout: 60000 });
  const err = await page.evaluate(() => window.__error);
  if (err) { console.error(err); process.exit(1); }
  const dur = await page.evaluate(() => window.__duration);
  fs.mkdirSync(path.join(ROOT, 'output'), { recursive: true });

  if (args.audit) {
    const res = await page.evaluate(() => window.audit());
    let bad = 0;
    for (const r of res) { const fail = r.seen < 0.5 || r.first === null || r.first > 0.1; bad += fail; console.log(`${fail ? 'FAIL' : ' ok '} ${r.word.padEnd(9)} @${r.start.toFixed(2)}  on screen ${r.seen.toFixed(2)}s  first ${r.first}`); }
    console.log(`${bad} of ${res.length} words fail (need >= 0.5 s on screen, visible within 0.1 s of the onset)`);
    await browser.close(); srv.close(); return;
  }
  if (args.stills) {
    const dir = path.join(ROOT, 'output/stills'); fs.mkdirSync(dir, { recursive: true });
    for (const s of args.stills.split(',')) {
      const t = +s, data = await page.evaluate((t) => window.frameJPEG(t, 0.9), t);
      fs.writeFileSync(path.join(dir, `t${t.toFixed(2)}.jpg`), Buffer.from(data.split(',')[1], 'base64'));
    }
    await browser.close(); srv.close(); return;
  }
  const from = +(args.from || 0), to = Math.min(dur, +(args.to || dur));
  const n = Math.round((to - from) * fps);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    '-ss', String(from), '-t', String(to - from), '-i', path.join(ROOT, 'assets/audio/tpot_song.mp3'),
    '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'medium', '-crf', String(args.crf || 26), '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '128k', '-shortest', '-movflags', '+faststart', OUT], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let f = 0; f < n; f++) {
    const data = await page.evaluate((t) => window.frameJPEG(t, 0.88), from + f / fps);
    if (!ff.stdin.write(Buffer.from(data.split(',')[1], 'base64'))) await new Promise((r) => ff.stdin.once('drain', r));
    if (f % 150 === 0) console.log(`frame ${f}/${n}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end(); await new Promise((r) => ff.on('close', r));
  await browser.close(); srv.close();
  console.log('wrote', OUT);
})();
