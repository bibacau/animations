// 10. "YOU WANT THE BEST DEAL, HEAD TO T-POT"
// Driving down a very long road with buildings on both sides (pseudo-3D, 2D-drawn). We
// accelerate harder and harder - speed lines, zoom blur until the screen smears - then on
// "TO" a dead STOP (screech, jolt) right in front of the T-POT store, which has been
// standing at the end of the road all along. On "T-POT" its doors blaze: we've arrived. Lamp posts flick past on the beat.
import { W, H, INK, clamp, prog, lerp, easeOut, easeIn, easeOutBack, springHit, decay, popText, rr, circle, fillStroke, COL, RAINBOW, hash } from '../core.js';
import { drawStore, speedLines, sparkles, confetti } from '../world.js';

export default function make(ctx, t0, t1) {
  const m = ctx.music, wd = m.wordsIn(t0, t1);
  const wHead = wd.find((w) => w.text === 'HEAD'), wTo = wd.find((w) => w.text === 'TO'), wT = wd.at(-1);
  const stopT = wTo.start, arriveT = wT.start;
  const HZ = 200, CAMH = 120, F = 300, SEG = 60;
  const tmp = ctx.tmp, tg = tmp.getContext('2d');
  // speed: accelerates (exponential) until the stop; distance is its integral (closed form)
  const v0 = 120, k = 1.25;
  const dist = (t) => { const tt = Math.min(t, stopT) - t0; return v0 * (Math.exp(k * tt) - 1) / k; };
  const speed = (t) => (t < stopT ? v0 * Math.exp(k * (t - t0)) : 0);
  const vMax = speed(stopT - 1e-3);
  // the T-POT store stands at the end of the road the whole time; we stop right in front of it
  const zStore = dist(stopT) + 420, STW = 520, STH = 300;
  const buildings = [];
  for (let i = 0; i < 400; i++) buildings.push({ z: i * 90 + hash(i) * 30, side: i % 2 ? 1 : -1, w: 90 + hash(i * 3) * 90, h: 120 + hash(i * 7) * 260, col: ['#4a2585', '#5e2a8f', '#3d1f73', '#7b2c9f', '#2a5bff'][i % 5], seed: i, sign: hash(i * 11) > 0.6 });

  function road(g, t) {
    const z = dist(t);
    // sunset sky + sun + skyline
    const gr = g.createLinearGradient(0, 0, 0, HZ); gr.addColorStop(0, '#2a0a5e'); gr.addColorStop(1, '#ff7a6b');
    g.fillStyle = gr; g.fillRect(0, 0, W, HZ + 2);
    circle(g, W / 2, HZ - 10, 70); g.fillStyle = '#ffd36b'; g.fill();
    for (let i = 0; i < 6; i++) { g.fillStyle = '#ff7a6b'; g.fillRect(W / 2 - 80, HZ - 50 + i * 8, 160, 3); }
    for (let x = 0; x < W; x += 28) { const h = 20 + hash(x) * 50; g.fillStyle = '#3b1060'; g.fillRect(x, HZ - h, 26, h); }
    // ground
    g.fillStyle = '#1e7a3e'; g.fillRect(0, HZ, W, H - HZ);
    // road strips, far -> near
    const first = Math.floor(z / SEG);
    const last = Math.floor(zStore / SEG);
    // plaza in front of the store
    for (let n = Math.min(first + 120, last); n >= first; n--) {
      const d0 = n * SEG - z, d1 = (n + 1) * SEG - z;
      if (d1 <= 1) continue;
      const e0 = Math.max(d0, 1);
      const y0 = HZ + CAMH * F / e0, y1 = HZ + CAMH * F / d1;
      const w0 = 260 * F / e0, w1 = 260 * F / d1;
      g.fillStyle = n % 2 ? '#2b2b3a' : '#33334a';
      g.beginPath(); g.moveTo(W / 2 - w1, y1); g.lineTo(W / 2 + w1, y1); g.lineTo(W / 2 + w0, y0); g.lineTo(W / 2 - w0, y0); g.fill();
      g.fillStyle = n % 2 ? '#ffffff' : '#ff2a4d';   // kerbs
      for (const s of [-1, 1]) { g.beginPath(); g.moveTo(W / 2 + s * w1, y1); g.lineTo(W / 2 + s * w1 * 1.08, y1); g.lineTo(W / 2 + s * w0 * 1.08, y0); g.lineTo(W / 2 + s * w0, y0); g.fill(); }
      if (n % 2) { g.fillStyle = '#ffd400'; g.beginPath(); g.moveTo(W / 2 - w1 * 0.03, y1); g.lineTo(W / 2 + w1 * 0.03, y1); g.lineTo(W / 2 + w0 * 0.03, y0); g.lineTo(W / 2 - w0 * 0.03, y0); g.fill(); }
    }
    // buildings both sides, far -> near
    // the store (drawn first: it is the farthest thing on the road)
    const ds = zStore - z, ss = F / ds;
    const sw = STW * ss, sh = STH * ss, sy = HZ + CAMH * ss;
    if (sw > 3) {
      g.fillStyle = '#c7b9e8'; g.beginPath(); g.moveTo(W / 2 - sw * 0.75, sy); g.lineTo(W / 2 + sw * 0.75, sy); g.lineTo(W / 2 + 260 * F / Math.max(ds - 80, 1), HZ + CAMH * F / Math.max(ds - 80, 1)); g.lineTo(W / 2 - 260 * F / Math.max(ds - 80, 1), HZ + CAMH * F / Math.max(ds - 80, 1)); g.fill();
      const dd = drawStore(g, W / 2 - sw / 2, sy, sw, sh, t, { flicker: false });
      if (t >= arriveT) {   // doors blaze and the sign pulses on the beat when we arrive
        g.save(); g.globalAlpha = 0.5 * (0.5 + 0.5 * m.pulse(t)); g.fillStyle = '#fff6c0';
        g.beginPath(); g.ellipse(dd.doorX, sy - 4, dd.doorW * 1.3, dd.doorH * 0.35, 0, 0, Math.PI * 2); g.fill(); g.restore();
      }
    }
    const vis = buildings.filter((b) => b.z - z > 8 && b.z - z < 3000 && b.z < zStore - 80).sort((a, b) => b.z - a.z);
    for (const b of vis) {
      const d = b.z - z, sc = F / d;
      const x = W / 2 + b.side * (380 + b.w / 2) * sc, yb = HZ + CAMH * sc, bw = b.w * sc, bh = b.h * sc;
      g.fillStyle = b.col; g.fillRect(x - bw / 2, yb - bh, bw, bh);
      g.lineWidth = Math.max(1, 3 * sc); g.strokeStyle = INK; g.strokeRect(x - bw / 2, yb - bh, bw, bh);
      if (sc > 0.15) {
        const cw = 14 * sc;
        for (let wy = yb - bh + cw; wy < yb - cw * 2; wy += cw * 2) for (let wx = x - bw / 2 + cw; wx < x + bw / 2 - cw; wx += cw * 2) { g.fillStyle = hash(b.seed + wx * 0.01 + wy * 0.01) > 0.4 ? '#ffd86b' : '#22154a'; g.fillRect(wx, wy, cw, cw * 1.2); }
      }
      if (b.sign && sc > 0.2) popText(g, ['SALE', 'T-POT', 'DEALS', 'OPEN'][b.seed % 4], x, yb - bh - 14 * sc, 26 * sc, { fill: RAINBOW[b.seed % 8], outline: 4 * sc, shadow: false });
    }
  }

  return {
    name: 'road', caption: { pos: 'bottom' }, shake: (t) => (t >= stopT ? 0.6 : 0.3),
    draw(g, t) {
      const v = speed(t), amt = clamp(v / vMax);
      tg.setTransform(1, 0, 0, 1, 0, 0);
      // stop jolt: the camera lurches forward then settles
      const jolt = t >= stopT ? springHit(t - stopT, 18, 6) * 30 : 0;
      tg.save(); tg.translate(0, jolt); road(tg, t); tg.restore();
      if (t >= arriveT) {
        sparkles(tg, t, 10, 61, { x: W / 2 - 220, y: 30, w: 440, h: 230 }, '#ffd400');
        confetti(tg, t, arriveT, { n: 70, from: { x: W / 2, y: 120 }, spread: 3, life: 1.1 });
      }
      g.drawImage(tmp, 0, 0);
      // zoom blur that grows with speed (screen smears), gone instantly at the stop
      if (amt > 0.05 && t < stopT) {
        const n = 6, spread = 0.02 + amt * amt * 0.22;
        for (let i = 1; i <= n; i++) { const s = 1 + spread * i / n; g.save(); g.globalAlpha = 0.42 * amt; g.translate(W / 2, HZ); g.scale(s, s); g.translate(-W / 2, -HZ); g.drawImage(tmp, 0, 0); g.restore(); }
        speedLines(g, W / 2, HZ, amt, t);
      }
      // dashboard of our T-POT van
      g.save(); g.translate(0, (t >= stopT ? jolt * 0.6 : Math.sin(t * 40) * amt * 2));
      g.fillStyle = COL.tred; g.beginPath(); g.moveTo(-10, H + 10); g.lineTo(-10, H - 62); g.quadraticCurveTo(W / 2, H - 112, W + 10, H - 62); g.lineTo(W + 10, H + 10); g.closePath(); g.fill();
      g.lineWidth = 4; g.strokeStyle = INK; g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.25)'; g.beginPath(); g.moveTo(120, H - 74); g.quadraticCurveTo(W / 2, H - 104, W - 120, H - 74); g.lineTo(W - 140, H - 70); g.quadraticCurveTo(W / 2, H - 96, 140, H - 70); g.fill();
      // speedometer
      circle(g, 90, H - 90, 46); fillStroke(g, '#1b1035', 4);
      const na = -Math.PI * 1.2 + amt * Math.PI * 1.4;
      g.strokeStyle = COL.yellow; g.lineWidth = 4; g.beginPath(); g.moveTo(90, H - 90); g.lineTo(90 + Math.cos(na) * 36, H - 90 + Math.sin(na) * 36); g.stroke();
      popText(g, String(Math.round(amt * 280)), 90, H - 70, 14, { font: 'Bowlby', fill: '#fff', outline: 0, shadow: false });
      g.restore();
      if (t >= stopT && t < stopT + 0.5) { const s = easeOutBack(prog(t, stopT, stopT + 0.15), 3); g.save(); g.translate(W * 0.8, 120); g.rotate(-0.2); g.scale(s, s); popText(g, 'SCREECH!', 0, 0, 34, { fill: COL.yellow, outline: 6 }); g.restore(); }
    },
  };
}
