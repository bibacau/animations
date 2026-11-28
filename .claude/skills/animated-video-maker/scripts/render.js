// Frame-accurate renderer for a deterministic canvas video page.
// The page must expose: window.__ready, window.__duration, window.frameJPEG(t, q),
// and (for --audit) window.audit() -> [{word, start, seen, first}].
//
//   node render.js --project ./my-video --audio song.mp3 --out out.mp4
//   node render.js --project ./my-video --stills 1.5,3.2,8     -> <project>/output/stills/
//   node render.js --project ./my-video --audit 1                lyric visibility check
// options: --w 854 --h 480 --fps 30 --crf 26 --from 0 --to <dur> --index index.html --blur 1
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path');
const { start } = require('./serve');
const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') ? [...a, [v.slice(2), arr[i + 1]]] : a), []));
const project = path.resolve(args.project || '.');
const fps = +(args.fps || 30), W = +(args.w || 854), H = +(args.h || 480), blur = +(args.blur || 1);
const OUT = path.resolve(args.out || path.join(project, 'output/video.mp4'));

(async () => {
  const srv = await start(project, 0, args.index || 'index.html');
  const browser = await chromium.launch(args.webgl ? { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] } : {});
  const page = await browser.newPage({ viewport: { width: Math.min(W, 1280), height: Math.round(Math.min(W, 1280) * H / W) } });
  page.on('console', (m) => { if (m.type() === 'error') console.log('[page]', m.text()); });
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.goto(`http://127.0.0.1:${srv.address().port}/?w=${W}&h=${H}`);
  await page.waitForFunction(() => window.__ready || window.__error, null, { timeout: 120000 });
  const err = await page.evaluate(() => window.__error);
  if (err) { console.error(err); process.exit(1); }
  const dur = await page.evaluate(() => window.__duration);
  fs.mkdirSync(path.join(project, 'output'), { recursive: true });

  if (args.audit) {
    const res = await page.evaluate(() => window.audit());
    let bad = 0;
    for (const r of res) { const fail = r.seen < 0.5 || r.first === null || r.first > 0.1; bad += fail; console.log(`${fail ? 'FAIL' : ' ok '} ${String(r.word).padEnd(10)} @${r.start.toFixed(2)}  on screen ${r.seen.toFixed(2)}s  first ${r.first}`); }
    console.log(`${bad} of ${res.length} words fail (need >= 0.5 s on screen, visible within 0.1 s of the onset)`);
    await browser.close(); srv.close(); process.exit(bad ? 2 : 0);
  }
  if (args.stills) {
    const dir = path.join(project, 'output/stills'); fs.mkdirSync(dir, { recursive: true });
    for (const s of String(args.stills).split(',')) {
      const t = +s, data = await page.evaluate((t) => window.frameJPEG(t, 0.9), t);
      fs.writeFileSync(path.join(dir, `t${t.toFixed(2)}.jpg`), Buffer.from(data.split(',')[1], 'base64'));
    }
    console.log('stills ->', dir);
    await browser.close(); srv.close(); return;
  }
  if (!args.audio) { console.error('--audio is required to render a video'); process.exit(1); }
  const from = +(args.from || 0), to = Math.min(dur, +(args.to || dur));
  const n = Math.round((to - from) * fps);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps * blur), '-c:v', 'mjpeg', '-i', '-',
    '-ss', String(from), '-t', String(to - from), '-i', path.resolve(args.audio),
    ...(blur > 1 ? ['-vf', `tmix=frames=${blur},fps=${fps}`] : []),
    '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'medium', '-crf', String(args.crf || 26), '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '128k', '-shortest', '-movflags', '+faststart', OUT], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let f = 0; f < n; f++) {
    for (let k = 0; k < blur; k++) {
      const t = from + (f + (k - (blur - 1) / 2) * (0.5 / blur)) / fps;
      const data = await page.evaluate((t) => window.frameJPEG(t, 0.88), Math.max(0, t));
      if (!ff.stdin.write(Buffer.from(data.split(',')[1], 'base64'))) await new Promise((r) => ff.stdin.once('drain', r));
    }
    if (f % 150 === 0) console.log(`frame ${f}/${n}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end(); await new Promise((r) => ff.on('close', r));
  await browser.close(); srv.close();
  console.log('wrote', OUT);
})();
