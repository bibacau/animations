// 11. Instrumental outro: THE LETTERS RUN, THEN BECOME THE LOGO.
// A festive stage (sunburst, bunting, balloons, lights, confetti, fireworks on the beat).
// The real T-POT logo letters (T, -, P, O, T, traced from the artwork) sprout little legs
// and race back and forth, hopping on every beat. On the downbeat they leap into place and
// land as the logo; the green swoosh sweeps in on the next 8th and the leaf pops on the
// beat. Products slam onto pedestals, the whole cast dances. On the final downbeat:
// one big punch + confetti, then everything stops on the logo.
import { W, H, INK, clamp, prog, lerp, easeOut, easeIn, easeInOut, easeOutBack, easeOutBounce, springHit, decay, popText, rr, circle, fillStroke, star, COL, RAINBOW, hash } from '../core.js';
import { drawTV, screenGlow, drawWasher, drawFridge, drawRice } from '../products.js';
import { drawBuddy, pose, SKINS, crowdSkin } from '../characters.js';
import { sunburst, bunting, balloon, confetti, sparkles, coin } from '../world.js';
import { drawPart, homeOf } from '../logo.js';

export default function make(ctx, t0, t1) {
  const m = ctx.music, L = ctx.logo;
  const downs = m.tl.downbeats.filter((d) => d >= t0 - 0.01);
  const A = downs[1], FINAL = downs.at(-1);
  const STOP = FINAL + 0.45;                                  // the picture freezes here
  const P = m.P;
  const SC = 1.45, LX = W / 2, LY = 200;
  const GY = H - 70;
  const names = ['T1', 'DASH', 'P', 'O', 'T2'];
  const racers = names.map((n, i) => ({ part: L.parts[n], i, speed: 260 + hash(i * 3.1) * 140, delay: i * 0.16, home: homeOf(L, L.parts[n], LX, LY, SC) }));
  const leapT = A - P;                                        // leap one beat before, land ON the downbeat
  const swooshT = A + P / 2, leafT = A + P;
  const slams = [A + 2 * P, A + 3 * P, A + 4 * P, A + 5 * P];
  const cast = [
    { skin: SKINS.pip, x: 90 }, { skin: SKINS.mimi, x: W - 90 },
    { skin: crowdSkin(2), x: 190 }, { skin: crowdSkin(5), x: W - 190 },
  ];

  // a racer's x on the track: runs right, bounces off the edges (triangle wave)
  function trackX(r, t) {
    const d = Math.max(0, t - t0 - r.delay) * r.speed - 80;
    const span = W + 40, pz = ((d % (2 * span)) + 2 * span) % (2 * span);
    return { x: pz < span ? pz - 20 : 2 * span - pz - 20, dir: pz < span ? 1 : -1 };
  }

  function legs(g, x, y, sc, ph, amt) {
    if (amt <= 0.01) return;
    g.lineCap = 'round';
    for (const s of [-1, 1]) {
      const a = Math.sin(ph * Math.PI * 2 + (s > 0 ? Math.PI : 0)) * 0.7;
      const len = 26 * amt * sc;
      const fx = x + s * 9 * sc + Math.sin(a) * len, fy = y + Math.cos(a) * len;
      g.strokeStyle = INK; g.lineWidth = 6 * sc; g.beginPath(); g.moveTo(x + s * 9 * sc, y); g.lineTo(fx, fy); g.stroke();
      g.beginPath(); g.ellipse(fx + 5 * sc, fy + 2, 9 * sc * amt, 5 * sc * amt, 0, 0, Math.PI * 2); fillStroke(g, '#fff', 2.5);
    }
  }

  return {
    name: 'finale', caption: null, shake: (t) => (t < STOP ? 0.6 : 0),
    draw(g, tReal) {
      const t = Math.min(tReal, STOP);   // freeze at the end: "just stop there"
      // backdrop
      sunburst(g, W / 2, LY, 22, t * 0.25, '#7b2cff', '#9b5cff');
      // fireworks on every beat after the assembly
      if (t >= A) {
        for (let k = 0; k < 3; k++) {
          const bi = m.idx(t) - k; if (m.bt(bi) < A) continue;
          const bt = m.bt(bi), dt = t - bt, fx = 120 + hash(bi * 3.3) * (W - 240), fy = 60 + hash(bi * 7.7) * 90, col = RAINBOW[bi % 8];
          for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; const r = easeOut(dt / 0.6) * 70; circle(g, fx + Math.cos(a) * r, fy + Math.sin(a) * r + dt * dt * 40, 3.5 * (1 - clamp(dt / 0.9))); g.fillStyle = col; g.fill(); }
        }
      }
      bunting(g, -10, 12, W / 2, 40, 12, t, 10, m.pulse(t)); bunting(g, W / 2, 40, W + 10, 12, 12, t, 10, m.pulse(t));
      bunting(g, -10, 60, W + 10, 60, 18, t + 1, 20, m.pulse(t));
      for (let i = 0; i < 8; i++) balloon(g, 40 + i * 110 + (i % 2) * 20, 330 - (i % 3) * 40, 20, RAINBOW[(i + 2) % 8], t, i);
      // stage floor with chasing lights
      g.fillStyle = '#2a1650'; g.fillRect(0, GY, W, H - GY);
      for (let i = 0; i < 18; i++) { circle(g, 24 + i * 48, GY + 14, 6); g.fillStyle = (i + m.idx(t)) % 3 === 0 ? COL.yellow : '#5a3a90'; g.fill(); }
      // pedestals + products slamming on the beats
      const peds = [{ x: 70, d: (g) => drawTV(g, 120, (g, x, y, w, h) => screenGlow(g, x, y, w, h)) }, { x: W - 70, d: (g) => drawWasher(g, 80, t * 6) }, { x: 170, d: (g) => drawFridge(g, 44) }, { x: W - 170, d: (g) => drawRice(g, 80) }];
      peds.forEach((p, i) => {
        rr(g, p.x - 44, GY - 30, 88, 30, 6); fillStroke(g, COL.tred, 3);
        const st = slams[i]; if (t < st - 0.3) return;
        const u = clamp((t - (st - 0.3)) / 0.3), y = GY - 30 - (1 - easeIn(u)) * 400 - Math.abs(springHit(t - st, 14, 6)) * 10;
        g.save(); g.translate(p.x, y); p.d(g); g.restore();
      });
      // the cast dances in front (after the letters have assembled)
      if (t >= A) cast.forEach((c, i) => {
        const inU = easeOutBack(prog(t, A + i * P / 2, A + i * P / 2 + 0.3), 1.5);
        const ph = m.phase(t);
        drawBuddy(g, { x: c.x, y: GY + 40 - inU * 40 - Math.abs(Math.sin(ph * Math.PI)) * 24, s: 0.72, skin: c.skin, ...pose(i % 2 ? 'wave' : 'cheer', ph + i * 0.25), face: 'joy', t, flip: i % 2 === 1 });
      });
      // ---- letters: race -> leap -> logo
      const legAmt = 1 - clamp((t - A - P) / 0.3);
      racers.forEach((r) => {
        const p = r.part;
        let x, y, rot = 0, sx = 1, sy = 1;
        const tr = trackX(r, Math.min(t, leapT)), runY = GY - p.h * SC * 0.5 * 0.8 - 26;
        const hop = Math.abs(Math.sin((m.count(t) + r.i * 0.25) * Math.PI)) * 18;
        if (t < leapT) { x = tr.x; y = runY - hop; rot = tr.dir * 0.08; }
        else {   // leap arc, landing exactly on the downbeat
          const u = clamp((t - leapT) / (A - leapT));
          x = lerp(tr.x, r.home.x, u); y = lerp(runY, r.home.y, u) - Math.sin(u * Math.PI) * 140;
          rot = (1 - u) * tr.dir * Math.PI * 2 * (r.i % 2 ? 1 : -1);
          if (t >= A) { const s = springHit(t - A, 20, 7) * 0.25; sx = 1 + s; sy = 1 - s; rot = 0; }
        }
        if (t >= A + P) { const pu = springHit(m.since(t), 16, 8) * 0.05; sx += pu; sy -= pu; }
        if (t >= FINAL) { const pu = springHit(t - FINAL, 14, 5) * 0.18; sx += pu; sy += pu; }
        const sc = t < leapT ? SC * 0.8 : lerp(SC * 0.8, SC, clamp((t - leapT) / (A - leapT)));
        if (legAmt > 0) legs(g, x, y + p.h * sc * 0.5, sc / SC, t < leapT ? (t - t0) * 3 : 0, t < leapT ? 1 : legAmt);
        drawPart(g, p, x, y, sc, rot, { sx, sy, outline: 7, outlineCol: '#fff' });
      });
      // swoosh sweeps in left->right, the leaf pops into the O
      if (t >= swooshT - 0.05) {
        const sw = L.parts.SWOOSH, h = homeOf(L, sw, LX, LY, SC), u = easeOut(prog(t, swooshT - 0.05, swooshT + 0.25));
        g.save(); g.beginPath(); g.rect(h.x - sw.w * SC / 2 - 10, 0, (sw.w * SC + 20) * u, H); g.clip();
        const pu = t >= FINAL ? 1 + springHit(t - FINAL, 14, 5) * 0.18 : 1;
        drawPart(g, sw, h.x, h.y, SC, 0, { outline: 7, outlineCol: '#fff', sx: pu, sy: pu }); g.restore();
      }
      if (t >= leafT - 0.04) {
        const lf = L.parts.LEAF, h = homeOf(L, lf, LX, LY, SC), s = easeOutBack(prog(t, leafT - 0.04, leafT + 0.2), 3) * (t >= FINAL ? 1 + springHit(t - FINAL, 14, 5) * 0.18 : 1);
        drawPart(g, lf, h.x, h.y, SC * s, (1 - clamp(s)) * 1.2, { outline: 6, outlineCol: '#fff' });
      }
      // sparkles around the finished logo, coins and confetti
      if (t >= A) {
        sparkles(g, t, 12, 71, { x: LX - 320, y: LY - 110, w: 640, h: 200 }, '#fff');
        confetti(g, t, A, { n: 60 });
      }
      if (t >= FINAL) confetti(g, t, FINAL, { n: 140, from: { x: W / 2, y: LY }, spread: 6.2, life: 2 });
      if (tReal < A) for (let i = 0; i < 5; i++) coin(g, (hash(i) * W + (tReal - t0) * 120) % W, 110 + i * 22, 9, tReal + i);
    },
  };
}
