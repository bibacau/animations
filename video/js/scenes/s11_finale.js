// 11. Instrumental outro: THE LETTERS RUN, THEN BECOME THE LOGO.
// A bright appliance showroom in the brand colours; an electrical product drops onto the
// floor on every beat; confetti bursts on every beat.
// The real T-POT logo letters (T, -, P, O, T, traced from the artwork) sprout little legs
// and race back and forth, hopping on every beat. On the downbeat they leap into place and
// land as the logo; the green swoosh sweeps in on the next 8th and the leaf pops on the
// beat. Products slam onto pedestals, the whole cast dances. On the final downbeat:
// one big punch + confetti, then everything stops on the logo.
import { W, H, INK, clamp, prog, lerp, easeOut, easeIn, easeInOut, easeOutBack, easeOutBounce, springHit, decay, popText, rr, circle, fillStroke, star, COL, RAINBOW, hash } from '../core.js';
import { drawTV, screenGlow, drawWasher, drawFridge, drawRice, drawFan, drawMicrowave, drawBlender, drawKettle, drawTallSpeaker, drawVacuum, drawAircon, drawLaptop } from '../products.js';
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
  // the drop schedule: one product per beat from the start of the outro to the final hit
  // BIG products, one per beat, into 7 evenly spaced floor slots (filled middle-out so the
  // floor stays balanced). When a slot is already full, the new product knocks the old one off.
  const DROPS = [
    (g) => drawFridge(g, 74), (g, t) => drawWasher(g, 104, t * 5), (g) => drawTV(g, 150, (g, x, y, w, h) => screenGlow(g, x, y, w, h, '#16b8ff', '#ff2a4d')),
    (g) => drawAircon(g, 130), (g) => drawRice(g, 100), (g, t) => drawFan(g, 72, t * 14), (g) => drawMicrowave(g, 116),
    (g, t) => drawTallSpeaker(g, 54, m.pulse(t)), (g, t) => drawVacuum(g, 104, t), (g) => drawKettle(g, 80), (g, t) => drawBlender(g, 62, t, 1),
    (g) => drawLaptop(g, 104, (g, x, y, w, h) => screenGlow(g, x, y, w, h)), (g) => drawFridge(g, 68),
  ];
  const dropBeats = m.beatsBetween(t0 + 0.05, FINAL + 0.01).map((b) => b.t);
  const NS = 7, slotOrder = [3, 0, 6, 1, 5, 2, 4];
  const drops = dropBeats.map((bt, k) => ({ t: bt, kind: k % DROPS.length, slot: slotOrder[k % NS], x: (slotOrder[k % NS] + 0.5) * W / NS, s: 1 }));
  drops.forEach((d) => { const nxt = drops.find((e) => e.t > d.t && e.slot === d.slot); d.knocked = nxt ? nxt.t : null; });
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
      // backdrop: a bright, clean appliance showroom in the brand colours (white / red / green)
      const bgG = g.createLinearGradient(0, 0, 0, GY); bgG.addColorStop(0, '#ffffff'); bgG.addColorStop(1, '#e4ebf5');
      g.fillStyle = bgG; g.fillRect(0, 0, W, GY);
      g.save(); g.globalAlpha = 0.5;
      for (let i = 0; i < 24; i++) { const a0 = t * 0.15 + i * Math.PI / 12; g.fillStyle = i % 2 ? '#ffffff' : '#eef2f8'; g.beginPath(); g.moveTo(W / 2, LY); g.lineTo(W / 2 + Math.cos(a0) * 900, LY + Math.sin(a0) * 900); g.lineTo(W / 2 + Math.cos(a0 + Math.PI / 12) * 900, LY + Math.sin(a0 + Math.PI / 12) * 900); g.fill(); }
      g.restore();
      for (let i = 0; i < 9; i++) {   // ceiling spotlights, evenly spaced, pulsing on the beat
        const x = (i + 0.5) * W / 9;
        rr(g, x - 13, 0, 26, 10, 3); fillStroke(g, '#2a2440', 2);
        g.save(); g.globalAlpha = 0.14 + 0.14 * m.pulse(t); g.fillStyle = '#fff1b8'; g.beginPath(); g.moveTo(x - 9, 10); g.lineTo(x + 9, 10); g.lineTo(x + 50, GY); g.lineTo(x - 50, GY); g.fill(); g.restore();
      }
      g.fillStyle = COL.tred; g.fillRect(0, GY - 112, W, 10); g.fillStyle = '#3ea74d'; g.fillRect(0, GY - 102, W, 4);
      // symmetric wall displays either side of the logo: aircon above a mounted TV, bouncing on the beat
      for (const sx of [-1, 1]) {
        const x = W / 2 + sx * 360, hop = Math.max(0, springHit(m.since(t), 16, 9)) * 4;
        g.save(); g.translate(x, 118 - hop); drawAircon(g, 104); g.restore();
        g.save(); g.translate(x, 252 - hop); drawTV(g, 118, (g, x0, y0, w, h) => { screenGlow(g, x0, y0, w, h, sx < 0 ? '#16b8ff' : '#3ea74d', '#ff2a4d'); popText(g, 'T-POT', x0 + w / 2, y0 + h / 2, 22, {}); }); g.restore();
      }
      // confetti bursts from alternating top corners on every beat
      { const bi = m.idx(t); if (bi >= 0) confetti(g, t, m.bt(bi), { n: 22, from: { x: bi % 2 ? W - 40 : 40, y: 30 }, spread: 1.4, life: 0.9, seed: bi }); }
      bunting(g, -10, 22, W / 2, 46, 12, t, 10, m.pulse(t)); bunting(g, W / 2, 46, W + 10, 22, 12, t, 10, m.pulse(t));
      for (let i = 0; i < 8; i++) balloon(g, (i + 0.5) * W / 8, 300 - (i % 2) * 34, 18, ['#e41b24', '#ffffff', '#3ea74d', '#ffd400'][i % 4], t, i);
      // floor: polished light tiles
      g.fillStyle = '#cdd6e4'; g.fillRect(0, GY, W, H - GY);
      for (let x = 0; x < W; x += 57) { g.fillStyle = 'rgba(255,255,255,0.55)'; g.fillRect(x, GY, 2, H - GY); }
      g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(0, GY + 2, W, 4);
      // an electrical product drops from the top onto the floor on EVERY beat, filling evenly
      // spaced slots in an order that keeps the floor balanced (never bunched on one side)
      drops.forEach((d, k) => {
        if (t < d.t - 0.3) return;
        const u = clamp((t - (d.t - 0.3)) / 0.3);
        const y = GY - 4 - (1 - easeIn(u)) * (GY + 40) - Math.abs(springHit(t - d.t, 16, 7)) * 10;
        const sq = t > d.t ? 1 + springHit(t - d.t, 24, 9) * 0.15 : 1;
        if (d.knocked !== null && t >= d.knocked) {   // knocked off by the next product in this slot
          const q = t - d.knocked; if (q > 0.55) return;
          const dir = d.x < W / 2 ? -1 : 1;
          g.save(); g.translate(d.x + dir * q * 520, GY - 4 - q * 260 + q * q * 900); g.rotate(dir * q * 9); g.globalAlpha = 1 - q / 0.55;
          g.scale(d.s, d.s); DROPS[d.kind](g, t); g.restore();
          return;
        }
        g.save(); g.translate(d.x, y); g.scale(d.s / sq, d.s * sq); DROPS[d.kind](g, t); g.restore();
        if (t >= d.t && t < d.t + 0.35) { const q = prog(t, d.t, d.t + 0.35); for (let i = 0; i < 6; i++) { circle(g, d.x + (i - 2.5) * 12 * (0.6 + q), GY - 4 - q * 10, 7 * (1 - q)); g.fillStyle = 'rgba(255,255,255,0.9)'; g.fill(); } }
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
