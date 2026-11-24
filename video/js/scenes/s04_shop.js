// 4. "SAID TV'S AND WASHERS, PRICE JUST RIGHT"
// Inside the store. On "TV'S" a TV drops from the ceiling and lands on the next beat; on
// "WASHERS" a washing machine drops and lands on the beat after. Each gets a very cheap
// price tag. On "PRICE JUST RIGHT" the camera punches into Pip's face: total shock -
// huge eyes, jaw drop, sweat, manga shock lines - getting more extreme on every word.
import { W, H, INK, clamp, prog, lerp, easeOut, easeIn, easeInOut, easeOutBack, springHit, decay, popText, rr, circle, fillStroke, star, COL, RAINBOW, hash } from '../core.js';
import { drawTV, screenGlow, drawWasher, drawFridge, drawRice, drawAircon, drawTag } from '../products.js';
import { drawBuddy, pose, SKINS, blinkAt } from '../characters.js';
import { bunting, sparkles, confetti, shelfRow, pendantLamps, wallpaper } from '../world.js';

export default function make(ctx, t0, t1) {
  const m = ctx.music, wd = m.wordsIn(t0, t1);
  const [wSaid, wTv, wAnd, wWash, wPrice, wJust, wRight] = wd;
  const GY = H - 92;
  const tvLand = m.after(wTv.start + 0.1), washLand = m.after(wWash.start + 0.1);
  const tvTag = tvLand + m.P / 2, washTag = washLand + 0.08;
  const shockT = wPrice.start;
  const pip = { x: W * 0.17, y: GY };

  function store(g, t) {
    // back wall
    g.fillStyle = '#fff4d6'; g.fillRect(0, 0, W, GY);
    for (let x = 0; x < W; x += 90) { g.fillStyle = '#ffe8a8'; g.fillRect(x, 0, 45, GY); }
    wallpaper(g, '#ffffff', 0.4, GY);
    // big wall logo
    popText(g, 'T-POT', W * 0.5, 92, 56, { fill: COL.tred, outline: 8, stroke: '#fff', shadowColor: 'rgba(0,0,0,0.15)' });
    // full-width shelves of stock that hops on every beat, lamps evenly across the ceiling
    shelfRow(g, t, m, 165, 9, 0.62);
    shelfRow(g, t, m, 245, 9, 0.62);
    pendantLamps(g, t, m, 6, GY);
    bunting(g, -10, 10, W + 10, 10, 10, t, 18, m.pulse(t));
    // checker floor in perspective
    g.fillStyle = '#7b2cff'; g.fillRect(0, GY, W, H - GY);
    for (let r = 0; r < 6; r++) for (let c = -8; c < 16; c++) {
      if ((r + c) % 2) continue;
      const y0 = GY + r * (H - GY) / 6, y1 = GY + (r + 1) * (H - GY) / 6;
      const k0 = 1 + r * 0.25, k1 = 1 + (r + 1) * 0.25, cw = 60;
      g.fillStyle = '#9b5cff'; g.beginPath();
      g.moveTo(W / 2 + (c - 4) * cw * k0, y0); g.lineTo(W / 2 + (c - 3) * cw * k0, y0); g.lineTo(W / 2 + (c - 3) * cw * k1, y1); g.lineTo(W / 2 + (c - 4) * cw * k1, y1); g.fill();
    }
  }
  function dropped(g, t, land, x, drawFn, tagT, price, wdth) {
    const fall = 0.32;
    if (t < land - fall) return;
    const u = clamp((t - (land - fall)) / fall);
    const y = GY - (1 - easeIn(u)) * 460 - Math.abs(springHit(t - land, 14, 6)) * 18;
    const sq = t > land ? 1 + springHit(t - land, 24, 9) * 0.14 : 1;
    if (t >= land && t < land + 0.45) {
      const d = prog(t, land, land + 0.45);
      for (let i = 0; i < 12; i++) { circle(g, x + (i - 5.5) * 22 * (0.6 + d), GY - 4 - d * 18 * hash(i + land), 11 * (1 - d)); g.fillStyle = 'rgba(255,255,255,0.85)'; g.fill(); }
      g.strokeStyle = 'rgba(27,20,51,0.6)'; g.lineWidth = 3;
      for (let i = 0; i < 6; i++) { const a = -Math.PI + i * Math.PI / 5; g.beginPath(); g.moveTo(x + Math.cos(a) * (wdth * 0.6), GY + Math.sin(a) * 30); g.lineTo(x + Math.cos(a) * (wdth * 0.6 + 30 * d), GY + Math.sin(a) * (30 + 30 * d)); g.stroke(); }
    }
    g.save(); g.translate(x, y); g.scale(1 / sq, sq); drawFn(g); g.restore();
    if (t >= tagT - 0.04) {
      const s = easeOutBack(prog(t, tagT - 0.04, tagT + 0.2), 2.6) * (1 + m.pulse(t) * 0.08);
      g.save(); g.translate(x + wdth * 0.38, GY - wdth * 0.95); g.rotate(-0.18 + Math.sin(t * 3 + x) * 0.05); g.scale(s, s);
      drawTag(g, 150, price, { fill: COL.yellow, color: COL.red, size: 0.46 });
      popText(g, 'CHEAP!', 4, -54, 18, { fill: COL.lime, outline: 4 });
      g.restore();
      sparkles(g, t, 4, x, { x: x - 40, y: GY - wdth * 1.3, w: wdth + 80, h: 80 }, '#ffd400');
    }
  }

  return {
    name: 'shop', caption: { pos: 'bottom' }, shake: (t) => (t >= shockT ? 1.2 : 0.5),
    draw(g, t) {
      // camera: punch into Pip's face on PRICE, closer again on RIGHT
      const z1 = easeOutBack(prog(t, shockT - 0.03, shockT + 0.22), 1.6), z2 = easeOutBack(prog(t, wRight.start - 0.03, wRight.start + 0.18), 2);
      const Z = 1 + z1 * 1.5 + z2 * 0.6;
      const fx = pip.x, fy = pip.y - 70;
      g.save();
      g.translate(lerp(fx, W * 0.5, clamp(Z - 1)), lerp(fy, H * 0.47, clamp(Z - 1))); g.scale(Z, Z); g.translate(-fx, -fy);
      store(g, t);
      dropped(g, t, tvLand, W * 0.48, (g) => drawTV(g, 230, (g, x, y, w, h) => { screenGlow(g, x, y, w, h, '#ff4fd8', '#ffd400'); popText(g, 'TV', x + w / 2, y + h / 2, 40 * (1 + m.pulse(t) * 0.15), { fill: '#fff' }); }), tvTag, 'RM999', 230);
      dropped(g, t, washLand, W * 0.78, (g) => drawWasher(g, 150, t > washLand ? (t - washLand) * 6 : 0), washTag, 'RM599', 150);
      // Pip: walks in on SAID, points at each product as it lands, then: SHOCK
      const walkIn = easeOut(prog(t, t0, wSaid.start + 0.5));
      const px = lerp(-60, pip.x, walkIn);
      let ps, face = 'happy', es = 1;
      if (t >= shockT) {
        ps = pose('shock'); face = 'shock';
        es = 1 + 0.22 * easeOutBack(prog(t, wJust.start, wJust.start + 0.15), 3) + 0.22 * easeOutBack(prog(t, wRight.start, wRight.start + 0.15), 3);
        ps.squash = 1.05 + springHit(m.since(t), 20, 8) * 0.08;
      } else if (walkIn < 1) ps = pose('walk', (t * 2.2) % 1);
      else if (t > tvLand && t < tvLand + 0.6 || t > washLand) ps = { ...pose('idle', m.phase(t)), armR: 1.7 };
      else ps = pose('idle', m.phase(t));
      const jitter = t >= shockT ? (hash(t * 77) - 0.5) * 3 : 0;
      drawBuddy(g, { x: px + jitter, y: pip.y, s: 1, skin: SKINS.pip, ...ps, face, eyeScale: es, mouthOpen: t >= wRight.start ? 1 : 0, t, look: { x: 1, y: -0.2 }, blink: t >= shockT ? 0 : blinkAt(t, 4) });
      g.restore();
      // manga shock overlay
      if (t >= shockT) {
        const k = prog(t, shockT, shockT + 0.15);
        g.save(); g.globalAlpha = 0.85 * k;
        g.strokeStyle = INK;
        for (let i = 0; i < 48; i++) {
          const a = i / 48 * Math.PI * 2 + hash(i) * 0.1, r0 = 250 + hash(i * 3 + Math.floor(t * 12)) * 60;
          g.lineWidth = 2 + hash(i * 7) * 4; g.beginPath(); g.moveTo(W / 2 + Math.cos(a) * r0, H * 0.45 + Math.sin(a) * r0 * 0.75); g.lineTo(W / 2 + Math.cos(a) * 700, H * 0.45 + Math.sin(a) * 520); g.stroke();
        }
        g.restore();
        const bang = (tt, x, y, txt, sz) => { if (t < tt - 0.03) return; const s = easeOutBack(prog(t, tt - 0.03, tt + 0.15), 3) * (1 + m.pulse(t) * 0.12); g.save(); g.translate(x, y); g.rotate(-0.15); g.scale(s, s); popText(g, txt, 0, 0, sz, { fill: COL.yellow, outline: 9 }); g.restore(); };
        bang(shockT, W * 0.2, 90, '!!', 70);
        bang(wJust.start, W * 0.82, 110, 'WHAT?!', 44);
        bang(wRight.start, W * 0.78, 220, 'SO CHEAP!', 40);
      }
    },
  };
}
