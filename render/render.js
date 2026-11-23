// Frame-accurate renderer: headless Chromium renders each frame at an exact time
// (t = frame / fps), frames are piped to ffmpeg and muxed with the song.
//
// usage: node render/render.js [--fps 30] [--w 1080] [--h 1920] [--from 0] [--to end]
//                              [--out output/tpot_lyric_world.mp4] [--stills 1.5,3.2] [--blur 2]
//   --stills  only write PNG stills at the given times (quick look-dev)
//   --blur N  render N sub-frames per frame and blend them (real motion blur)
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { start } = require('./serve');

const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') ? [...a, [v.slice(2), arr[i + 1]]] : a), []));
const fps = +(args.fps || 30), W = +(args.w || 1920), H = +(args.h || 1080);
const ROOT = path.resolve(__dirname, '..');
const OUT = path.resolve(ROOT, args.out || 'output/tpot_lyric_world.mp4');
const blur = +(args.blur || 1);

(async () => {
  const srv = await start(0);
  const url = `http://127.0.0.1:${srv.address().port}/?w=${W}&h=${H}${args.seed ? '&seed=' + args.seed : ''}`;
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  page.on('console', (m) => { if (m.type() === 'error' || m.text().startsWith('PLAN')) console.log('[page]', m.text()); });
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.goto(url);
  await page.waitForFunction(() => window.__ready || window.__error, null, { timeout: 120000 });
  const err = await page.evaluate(() => window.__error);
  if (err) { console.error(err); process.exit(1); }
  const dur = await page.evaluate(() => window.__duration);
  fs.writeFileSync(path.join(ROOT, 'output/scene_plan.json'), JSON.stringify(await page.evaluate(() => window.__plan), null, 1));

  if (args.stills) {
    const dir = path.join(ROOT, 'output/stills'); fs.mkdirSync(dir, { recursive: true });
    for (const s of args.stills.split(',')) {
      const t = +s; const data = await page.evaluate(([t]) => window.frameJPEG(t, 0.9), [t]);
      fs.writeFileSync(path.join(dir, `t${t.toFixed(2)}.jpg`), Buffer.from(data.split(',')[1], 'base64'));
      console.log('still', t);
    }
    await browser.close(); srv.close(); return;
  }

  const from = +(args.from || 0), to = Math.min(dur, +(args.to || dur));
  const n = Math.round((to - from) * fps);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error',
    '-f', 'image2pipe', '-framerate', String(fps * blur), '-c:v', 'mjpeg', '-i', '-',
    '-ss', String(from), '-t', String(to - from), '-i', path.join(ROOT, 'assets/audio/tpot_song.mp3'),
    ...(blur > 1 ? ['-vf', `tmix=frames=${blur},fps=${fps}`] : []),
    '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', OUT], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let f = 0; f < n; f++) {
    for (let s = 0; s < blur; s++) {
      const t = from + (f + (s - (blur - 1) / 2) * (0.5 / blur)) / fps;  // shutter = 180 degrees
      const data = await page.evaluate(([t]) => window.frameJPEG(t, 0.94), [Math.max(0, t)]);
      if (!ff.stdin.write(Buffer.from(data.split(',')[1], 'base64'))) await new Promise((r) => ff.stdin.once('drain', r));
    }
    if (f % 30 === 0) { const el = (Date.now() - t0) / 1000; console.log(`frame ${f}/${n}  ${(el / (f + 1)).toFixed(2)}s/frame  eta ${((n - f) * el / (f + 1) / 60).toFixed(1)} min`); }
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  await browser.close(); srv.close();
  console.log('wrote', OUT);
})();
