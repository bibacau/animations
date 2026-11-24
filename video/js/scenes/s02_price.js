// 2. "LOWEST PRICES COME AND BE GONE"
// A TV drops into the shop. A price tag swings in reading RM6,000. On "COME" a red marker
// SLASHES it, on "AND" the slashed price peels off and falls, on "BE" RM3,000 STAMPS onto
// the tag, on "GONE" a SAVE 50% burst + coins + confetti. Shelves bounce on every beat.
import { W, H, INK, clamp, prog, easeOut, easeIn, easeOutBack, easeOutBounce, springHit, decay, popText, rr, circle, fillStroke, star, COL, RAINBOW, hash } from '../core.js';
import { drawTV, screenGlow, drawRice, drawMicrowave, drawTag } from '../products.js';
import { drawBuddy, pose, SKINS, blinkAt } from '../characters.js';
import { bunting, confetti, coin, sparkles } from '../world.js';

export default function make(ctx, t0, t1) {
  const m = ctx.music, wd = m.wordsIn(t0, t1);
  const [wLow, wPri, wCome, wAnd, wBe, wGone] = wd;
  const land = m.after(t0 + 0.2, true);                // TV lands on the next 8th note
  const tagIn = wPri.start, slash = wCome.start, peel = wAnd.start, stamp = wBe.start, burst = wGone.start;
  const GY = H - 78;                                    // floor line (caption sits below)
  const tvX = W * 0.34, tvW = 320;

  function shelf(g, t, y) {
    rr(g, 20, y, W - 40, 10, 3); fillStroke(g, '#c99b6a', 3);
    const items = 9;
    for (let i = 0; i < items; i++) {
      const x = 50 + i * (W - 100) / (items - 1);
      const hop = Math.max(0, springHit(m.since(t) - i * 0.02, 16, 9)) * 6 * (1 + m.level(m.idx(t)) * 0.4);
      g.save(); g.translate(x, y - hop);
      if (i % 3 === 0) { g.scale(0.5, 0.5); drawRice(g, 70); }
      else if (i % 3 === 1) { g.scale(0.5, 0.5); drawMicrowave(g, 90); }
      else { rr(g, -16, -36, 32, 36, 4); fillStroke(g, RAINBOW[i % 8], 3); popText(g, 'T-POT', 0, -18, 8, { font: 'Anton', outline: 0, shadow: false }); }
      g.restore();
    }
  }

  return {
    name: 'price', caption: { pos: 'bottom' }, shake: 0.55,
    draw(g, t) {
      // shop wall with stripes + sale banners
      g.fillStyle = '#ffe9f6'; g.fillRect(0, 0, W, H);
      for (let x = 0; x < W; x += 60) { g.fillStyle = '#ffd5ec'; g.fillRect(x, 0, 30, GY); }
      bunting(g, -10, 18, W + 10, 18, 14, t, 16, m.pulse(t));
      shelf(g, t, 120);
      // floor
      g.fillStyle = '#7b2cff'; g.fillRect(0, GY, W, H - GY);
      for (let x = -40; x < W + 40; x += 48) { g.fillStyle = '#6a20e6'; g.beginPath(); g.moveTo(x, GY); g.lineTo(x + 24, GY); g.lineTo(x + 24 - 60, H); g.lineTo(x - 60, H); g.fill(); }
      // spotlight
      g.save(); g.globalAlpha = 0.18 + 0.08 * m.pulse(t); g.fillStyle = '#fff6b0';
      g.beginPath(); g.moveTo(tvX - 30, 0); g.lineTo(tvX + 30, 0); g.lineTo(tvX + 230, GY); g.lineTo(tvX - 230, GY); g.fill(); g.restore();

      // TV drops in, bounces, then pulses on beats
      const u = clamp((t - t0) / (land - t0));
      const tvY = GY - (1 - easeIn(u)) * 420 + (t > land ? -Math.abs(springHit(t - land, 14, 6)) * 22 : 0);
      const sq = t > land ? 1 + springHit(t - land, 22, 9) * 0.12 : 1;
      if (t >= land && t < land + 0.4) {   // dust
        const d = prog(t, land, land + 0.4);
        for (let i = 0; i < 10; i++) { circle(g, tvX + (i - 4.5) * 34 * (0.5 + d), GY - 6 - d * 20 * hash(i), 12 * (1 - d)); g.fillStyle = 'rgba(255,255,255,0.8)'; g.fill(); }
      }
      g.save(); g.translate(tvX, tvY); g.scale(1 / sq, sq);
      drawTV(g, tvW, (g, x, y, w, h) => {
        screenGlow(g, x, y, w, h, '#16e0ff', '#7b2cff');
        const p = m.pulse(t);
        g.fillStyle = `rgba(255,255,255,${0.15 * p})`; g.fillRect(x, y, w, h);
        popText(g, t < stamp ? 'SALE' : 'SUPER SALE', x + w / 2, y + h / 2, (t < stamp ? 52 : 34) * (1 + p * 0.12), { fill: COL.yellow });
      });
      g.restore();

      // price tag: string from the TV corner, swings in on PRICES, sways on every beat
      if (t >= tagIn - 0.05) {
        const anchor = { x: tvX + tvW / 2 - 12, y: tvY - tvW * 0.08 - tvW * 0.6 + 10 };
        const sw = easeOutBack(prog(t, tagIn - 0.05, tagIn + 0.35), 1.4);
        const sway = Math.sin(t * 3) * 0.04 + springHit(m.since(t), 10, 4) * 0.08 + springHit(t - stamp, 12, 4) * 0.25;
        const tx = anchor.x + 140, ty = anchor.y + 110;
        const ang = (1 - sw) * -1.6 + sway;
        g.save(); g.translate(anchor.x, anchor.y); g.rotate(ang); g.translate(-anchor.x, -anchor.y);
        g.strokeStyle = INK; g.lineWidth = 2.5; g.beginPath(); g.moveTo(anchor.x, anchor.y); g.lineTo(tx - 110, ty); g.stroke();
        g.save(); g.translate(tx, ty); drawTag(g, 270, null, { fill: '#fff' }); g.restore();
        // old price + slash; peels off and falls on AND
        const fall = prog(t, peel, peel + 0.6);
        g.save(); g.translate(tx + 12, ty + fall * fall * 420); g.rotate(fall * 1.4); g.globalAlpha = 1 - clamp((fall - 0.7) / 0.3);
        popText(g, 'RM6,000', 0, 0, 40, { fill: t >= slash ? '#8c8a99' : INK, outline: 0, shadow: false, font: 'Bowlby' });
        if (t >= slash) {   // the marker slash, drawn left -> right
          const su = easeOut(prog(t, slash, slash + 0.16));
          g.strokeStyle = COL.red; g.lineWidth = 10; g.lineCap = 'round';
          g.beginPath(); g.moveTo(-112, 16); g.lineTo(-112 + 224 * su, 16 - 34 * su); g.stroke();
          g.beginPath(); g.moveTo(-112, -14); g.lineTo(-112 + 224 * clamp(su * 1.3 - 0.3), -14 + 30 * clamp(su * 1.3 - 0.3)); g.stroke();
        }
        g.restore();
        // new price stamps in on BE
        if (t >= stamp - 0.04) {
          const s = 1 + 1.6 * (1 - easeOutBounce(prog(t, stamp - 0.04, stamp + 0.2)));
          g.save(); g.translate(tx + 12, ty); g.scale(s, s); g.rotate(-0.06);
          popText(g, 'RM3,000', 0, 0, 44, { fill: COL.red, outline: 7 });
          g.restore();
        }
        g.restore();
        // the marker pen that does the slash
        if (t >= slash - 0.15 && t < slash + 0.45) {
          const su = easeOut(prog(t, slash, slash + 0.16)), k = prog(t, slash + 0.2, slash + 0.45);
          const px = tx - 100 + 224 * su + k * 120, py = ty + 10 - 30 * su - k * 100;
          g.save(); g.translate(px, py); g.rotate(-0.7);
          rr(g, -8, -70, 16, 70, 4); fillStroke(g, COL.red, 3); rr(g, -8, -86, 16, 18, 4); fillStroke(g, '#fff', 3);
          g.beginPath(); g.moveTo(-8, 0); g.lineTo(8, 0); g.lineTo(0, 12); g.closePath(); fillStroke(g, INK, 2);
          g.restore();
        }
        // SAVE 50%! burst on GONE
        if (t >= burst - 0.04) {
          const s = easeOutBack(prog(t, burst - 0.04, burst + 0.2), 3) * (1 + m.pulse(t) * 0.1);
          g.save(); g.translate(tx + 150, ty - 95); g.rotate(0.2 + Math.sin(t * 4) * 0.05); g.scale(s, s);
          star(g, 0, 0, 62, 46, 14, t); fillStroke(g, COL.yellow, 4);
          popText(g, 'SAVE', 0, -12, 20, { fill: COL.red, outline: 4 }); popText(g, '50%!', 0, 14, 26, { fill: COL.red, outline: 4 });
          g.restore();
        }
      }
      // Pip cheering on the left: watches, then jumps for joy at the stamp
      const happy = t >= stamp;
      const jumpY = happy ? Math.abs(Math.sin((t - stamp) * Math.PI / m.P)) * 40 : 0;
      const ps = happy ? pose('cheer', m.phase(t)) : pose('idle', m.phase(t));
      drawBuddy(g, { x: 80, y: GY - jumpY, s: 0.95, skin: SKINS.pip, ...ps, face: happy ? 'stars' : t >= slash ? 'surprise' : 'happy', t, look: { x: 1, y: -0.3 }, blink: blinkAt(t) });
      if (t >= burst) { confetti(g, t, burst, { n: 90, from: { x: W * 0.72, y: H * 0.3 }, spread: 3.2, life: 1.2 }); for (let i = 0; i < 8; i++) coin(g, 120 + i * 90, ((t - burst) * 380 + i * 50) % (GY + 40) - 30, 12, t + i); }
      sparkles(g, t, 6, 21, { x: W * 0.5, y: 120, w: W * 0.45, h: 220 });
      for (const w of wd) if (t >= w.start - 0.05) ctx.mark(w.i);
    },
  };
}
