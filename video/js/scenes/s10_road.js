// 10. "YOU WANT THE BEST DEAL, HEAD TO T-POT"
// Driving down a very long road with buildings on both sides (pseudo-3D, 2D-drawn). We
// accelerate harder and harder - speed lines, zoom blur until the screen smears - then on
// "TO" a dead STOP (screech, jolt) right in front of the T-POT store, which has been
// standing at the end of the road all along. On "T-POT" its doors blaze: we've arrived. Lamp posts flick past on the beat.
import { W, H, INK, clamp, prog, lerp, easeOut, easeIn, easeOutBack, springHit, decay, popText, rr, circle, fillStroke, COL, RAINBOW, hash } from '../core.js';
import { drawStore, speedLines, sparkles, confetti } from '../world.js';
import { shade as shadeHex } from '../characters.js';

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
  // ---- the street: continuous rows of buildings on both sides (and beside the store),
  // lamps, trees, billboards, overtaken cars. Everything placed by world z, drawn far -> near.
  const ROADW = 260, WALK = 70, XIN = ROADW + WALK;
  const BCOL = ['#3c4a7a', '#5a3f7a', '#2f5a78', '#6b4a60', '#45607e', '#574b8a'];
  const items = [];
  for (const side of [-1, 1]) {
    let zz = side < 0 ? 0 : 35;
    for (let i = 0; zz < zStore + 900; i++) {
      const dep = 70 + hash(i * 3 + side) * 70;
      items.push({ kind: 'bld', side, z0: zz, z1: zz + dep, h: 110 + hash(i * 7 + side * 3) * 240, w: 160, col: BCOL[(i + (side > 0 ? 3 : 0)) % BCOL.length], seed: i * 13 + (side > 0 ? 7 : 0),
        sign: hash(i * 11 + side) > 0.55 ? ['SALE', 'T-POT', 'OPEN', 'DEALS', '24H', 'TV'][(i * 7 + (side > 0 ? 1 : 0)) % 6] : null });
      zz += dep + 4;
    }
  }
  for (let zz = 40; zz < zStore - 30; zz += 80) for (const side of [-1, 1]) items.push({ kind: 'lamp', side, z: zz + (side > 0 ? 40 : 0) });
  for (let zz = 80; zz < zStore - 60; zz += 160) for (const side of [-1, 1]) items.push({ kind: 'tree', side, z: zz + (side > 0 ? 80 : 0) });
  for (let zz = 600; zz < zStore - 400; zz += 900) for (const side of [-1, 1]) items.push({ kind: 'board', side, z: zz + (side > 0 ? 450 : 0), ad: (Math.round(zz / 900) + (side > 0 ? 1 : 0)) % 2 });
  const cars = [];
  // 9 cars, all overtaken before we stop
  for (let i = 0; i < 9; i++) cars.push({ z0: 260 + i * 240, lane: i % 2 ? 110 : -110, v: 70 + hash(i) * 40, col: ['#ff2a4d', '#ffd400', '#16b8ff', '#ffffff', '#2ee6a8'][i % 5] });
  const P_ = (X, Y, d) => ({ x: W / 2 + X * F / d, y: HZ + (CAMH - Y) * F / d });

  function sky(g, t) {
    const gr = g.createLinearGradient(0, 0, 0, HZ); gr.addColorStop(0, '#0c1236'); gr.addColorStop(0.6, '#3b2a6e'); gr.addColorStop(1, '#ff9a6b');
    g.fillStyle = gr; g.fillRect(0, 0, W, HZ + 2);
    for (let i = 0; i < 46; i++) { const x = (i + 0.5) * W / 46 + (hash(i) - 0.5) * 14, y = 10 + hash(i * 7) * (HZ * 0.55), tw = 0.5 + 0.5 * Math.sin(t * 3 + i); g.fillStyle = `rgba(255,255,255,${0.35 + 0.55 * tw})`; g.fillRect(x, y, 2, 2); }
    circle(g, W * 0.84, 46, 22); g.fillStyle = '#fff3c4'; g.fill(); circle(g, W * 0.84 - 8, 41, 5); g.fillStyle = '#efdca0'; g.fill();
    for (let i = 0; i < 4; i++) { const cx = ((i + 0.5) * W / 4 + t * 6) % (W + 120) - 60, cy = 60 + (i % 2) * 34; g.fillStyle = 'rgba(255,200,220,0.35)'; for (const [dx, r] of [[-22, 14], [0, 20], [24, 15]]) { circle(g, cx + dx, cy, r); g.fill(); } }
    for (let x = 0; x < W; x += 30) { const h = 28 + hash(x) * 56; g.fillStyle = '#26204a'; g.fillRect(x, HZ - h, 28, h); for (let wy = HZ - h + 6; wy < HZ - 4; wy += 9) for (let wx = x + 4; wx < x + 26; wx += 8) if (hash(wx * 3 + wy) > 0.55) { g.fillStyle = '#ffd86b'; g.fillRect(wx, wy, 3, 4); } }
  }
  function bld(g, b, z) {
    const d0 = b.z0 - z, d1 = b.z1 - z;
    if (d1 <= 4 || d0 > 3200) return;
    const n0 = Math.max(d0, 4);
    const s = b.side, xi = s * XIN, xo = s * (XIN + b.w);
    const a0 = P_(xi, 0, n0), a1 = P_(xi, 0, d1), t0_ = P_(xi, b.h, n0), t1_ = P_(xi, b.h, d1);
    g.beginPath(); g.moveTo(a0.x, a0.y); g.lineTo(a1.x, a1.y); g.lineTo(t1_.x, t1_.y); g.lineTo(t0_.x, t0_.y); g.closePath();
    g.fillStyle = b.col; g.fill(); g.lineWidth = 1.5; g.strokeStyle = 'rgba(10,8,30,0.8)'; g.stroke();
    const cols = 4, rows = Math.floor(b.h / 34);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (hash(b.seed * 9 + r * 5 + c) < 0.35) continue;
      const zA = lerp(b.z0, b.z1, (c + 0.25) / cols), zB = lerp(b.z0, b.z1, (c + 0.75) / cols);
      const dA = zA - z, dB = zB - z; if (dA < 4) continue;
      const yA = b.h - 16 - r * 34, yB = yA - 18;
      const p1 = P_(xi, yA, dA), p2 = P_(xi, yA, dB), p3 = P_(xi, yB, dB), p4 = P_(xi, yB, dA);
      g.beginPath(); g.moveTo(p1.x, p1.y); g.lineTo(p2.x, p2.y); g.lineTo(p3.x, p3.y); g.lineTo(p4.x, p4.y); g.closePath(); g.fillStyle = hash(b.seed + r * 3 + c) > 0.25 ? '#ffd86b' : '#1d1a3a'; g.fill();
    }
    if (d0 > 4) {
      const f0 = P_(xi, 0, d0), f1 = P_(xo, b.h, d0);
      g.fillStyle = shadeHex(b.col, -0.25); g.fillRect(Math.min(f0.x, f1.x), f1.y, Math.abs(f1.x - f0.x), f0.y - f1.y);
      if (b.sign && F / d0 > 0.25) { const sp = P_(xi + s * 60, b.h + 26, d0); popText(g, b.sign, sp.x, sp.y, 22 * F / d0, { fill: RAINBOW[b.seed % 8], outline: 3 * F / d0, shadow: false }); }
    }
  }
  function lamp(g, it, z) {
    const d = it.z - z; if (d < 6 || d > 2600) return;
    const X = it.side * (ROADW + 22), base = P_(X, 0, d), top = P_(X, 110, d), arm = P_(X - it.side * 40, 110, d);
    g.strokeStyle = '#1b1433'; g.lineWidth = Math.max(1, 5 * F / d); g.beginPath(); g.moveTo(base.x, base.y); g.lineTo(top.x, top.y); g.lineTo(arm.x, arm.y); g.stroke();
    g.save(); g.shadowColor = '#fff2a8'; g.shadowBlur = 14; circle(g, arm.x, arm.y + 3 * F / d, 6 * F / d); g.fillStyle = '#fff2a8'; g.fill(); g.restore();
  }
  function tree(g, it, z) {
    const d = it.z - z; if (d < 6 || d > 2600) return;
    const X = it.side * (ROADW + 48), base = P_(X, 0, d), top = P_(X, 60, d), sc = F / d;
    g.strokeStyle = '#5a3a24'; g.lineWidth = Math.max(1, 9 * sc); g.beginPath(); g.moveTo(base.x, base.y); g.lineTo(top.x, top.y); g.stroke();
    for (const [dx, dy, r] of [[0, 18, 34], [-20, 4, 24], [20, 4, 24]]) { circle(g, top.x + dx * sc, top.y - dy * sc, r * sc); g.fillStyle = '#2f8a4a'; g.fill(); g.lineWidth = Math.max(1, 2 * sc); g.strokeStyle = '#1b5a2e'; g.stroke(); }
  }
  function board(g, it, z) {
    const d = it.z - z; if (d < 10 || d > 3000) return;
    const sc = F / d, X = it.side * (XIN + 40), base = P_(X, 0, d), c = P_(X, 210, d);
    g.strokeStyle = '#2a2440'; g.lineWidth = Math.max(1, 6 * sc); g.beginPath(); g.moveTo(base.x, base.y); g.lineTo(c.x, c.y); g.stroke();
    const bw = 190 * sc, bh = 90 * sc;
    rr(g, c.x - bw / 2, c.y - bh, bw, bh, 6 * sc); fillStroke(g, it.ad ? '#ffffff' : COL.yellow, Math.max(1, 3 * sc));
    if (sc > 0.08) popText(g, it.ad ? 'T-POT' : 'BIG SALE', c.x, c.y - bh / 2, (it.ad ? 34 : 26) * sc, { fill: COL.red, outline: 2 * sc, shadow: false });
  }
  function car(g, c, cz, z) {
    const d = cz - z; if (d < 30 || d > 2600) return;
    const sc = F / d, p = P_(c.lane, 0, d), w = 90 * sc, h = 52 * sc;
    rr(g, p.x - w / 2, p.y - h, w, h, 10 * sc); fillStroke(g, c.col, Math.max(1, 2.5 * sc));
    rr(g, p.x - w * 0.36, p.y - h * 1.32, w * 0.72, h * 0.42, 8 * sc); fillStroke(g, shadeHex(c.col, -0.2), Math.max(1, 2.5 * sc));
    rr(g, p.x - w * 0.3, p.y - h * 1.25, w * 0.6, h * 0.3, 5 * sc); g.fillStyle = '#9fdcff'; g.fill();
    for (const sx of [-1, 1]) { g.save(); g.shadowColor = '#ff2a4d'; g.shadowBlur = 10; rr(g, p.x + sx * w * 0.36 - w * 0.08, p.y - h * 0.7, w * 0.16, h * 0.18, 3 * sc); g.fillStyle = '#ff3b5c'; g.fill(); g.restore(); }
    g.fillStyle = '#15111f'; g.fillRect(p.x - w * 0.42, p.y - 4 * sc, w * 0.18, 8 * sc); g.fillRect(p.x + w * 0.24, p.y - 4 * sc, w * 0.18, 8 * sc);
  }
  function sideStuff(g, t, z) {
    const vis = [];
    for (const it of items) { const zn = it.kind === 'bld' ? it.z0 : it.z; if (zn - z < 3200 && (it.kind === 'bld' ? it.z1 - z > 4 : zn - z > 6)) vis.push({ it, zz: zn }); }
    for (const c of cars) { const cz = c.z0 + c.v * (Math.min(t, stopT) - t0); vis.push({ it: { kind: 'car', c, cz }, zz: cz }); }
    vis.sort((a, b) => b.zz - a.zz);
    for (const { it } of vis) {
      if (it.kind === 'bld') bld(g, it, z); else if (it.kind === 'lamp') lamp(g, it, z); else if (it.kind === 'tree') tree(g, it, z);
      else if (it.kind === 'board') board(g, it, z); else car(g, it.c, it.cz, z);
    }
  }

  function road(g, t) {
    const z = dist(t);
    sky(g, t);
    // ground
    g.fillStyle = '#3a3a52'; g.fillRect(0, HZ, W, H - HZ);
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
    sideStuff(g, t, z);
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
