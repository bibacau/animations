// 6. "T-POT'S DEALS TOOK ME BY SURPRISE"
// New character: Mimi. A "T-POT'S DEALS" board drops behind her, its words lighting up as
// they are sung. Discount tags rain in on "TOOK ME BY" while she looks around on each
// beat. On "SURPRISE" she jumps back, eyes wide, "!" pops. On the drop her hands shoot
// up - pure joy - confetti cannons, sunburst, hearts, bouncing on every beat.
import { W, H, INK, clamp, prog, lerp, easeOut, easeIn, easeOutBack, easeOutBounce, springHit, decay, popText, rr, circle, fillStroke, star, COL, RAINBOW, hash } from '../core.js';
import { drawTag } from '../products.js';
import { drawBuddy, pose, SKINS, blinkAt } from '../characters.js';
import { sunburst, confetti, floatingHearts, sparkles, bunting, balloon } from '../world.js';

export default function make(ctx, t0, t1) {
  const m = ctx.music, wd = m.wordsIn(t0, t1);
  const [wTpot, wDeals, wTook, wMe, wBy, wSur] = wd;
  const drop = m.tl.drop;
  const GY = H - 92;
  const mimi = { x: W * 0.5, y: GY };
  const boardIn = wTpot.start - 0.05;

  return {
    name: 'surprise', caption: { pos: 'bottom' }, noFlash: true,
    shake: (t) => (t >= drop ? 1.3 : t >= wSur.start ? 0.8 : 0.4),
    draw(g, t) {
      const party = t >= drop;
      if (party) sunburst(g, W / 2, H * 0.42, 18, (t - drop) * 0.8 + m.pulse(t) * 0.05, '#ff4fd8', '#ffd400');
      else {
        g.fillStyle = '#d8fff6'; g.fillRect(0, 0, W, H);
        for (let x = 0; x < W; x += 70) { g.fillStyle = '#c2f5ea'; g.fillRect(x, 0, 35, H); }
      }
      bunting(g, -10, 14, W + 10, 14, 12, t, 18, m.pulse(t));
      // the DEALS board drops behind Mimi; each word lights up when sung
      const bu = easeOutBounce(prog(t, boardIn, boardIn + 0.5));
      const by = lerp(-200, 120, bu);
      g.save(); g.translate(W / 2, by); g.rotate(Math.sin(t * 2) * 0.02 + springHit(m.since(t), 12, 6) * 0.03);
      g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.moveTo(-180, -60); g.lineTo(-150, -200); g.moveTo(180, -60); g.lineTo(150, -200); g.stroke();
      rr(g, -260, -62, 520, 124, 18); fillStroke(g, '#1b1035', 5);
      for (let i = 0; i < 26; i++) { const a = i / 26; const bx = -250 + a * 500; circle(g, bx, -52, 4); g.fillStyle = (i + m.idx(t)) % 3 ? '#ffd400' : '#ff4fd8'; g.fill(); circle(g, bx, 52, 4); g.fill(); }
      const lit1 = t >= wTpot.start - 0.05, lit2 = t >= wDeals.start - 0.05;
      g.save(); if (lit1) { g.shadowColor = '#ff2a4d'; g.shadowBlur = 18; }
      popText(g, "T-POT'S", -95, 2, 54 * (lit1 ? 1 + 0.15 * decay(t - wTpot.start, 6) : 1), { fill: lit1 ? '#ff3b5c' : '#3a2a55', outline: 0, shadow: false }); g.restore();
      g.save(); if (lit2) { g.shadowColor = '#ffd400'; g.shadowBlur = 18; }
      popText(g, 'DEALS', 150, 2, 54 * (lit2 ? 1 + 0.15 * decay(t - wDeals.start, 6) : 1), { fill: lit2 ? '#ffe14d' : '#3a2a55', outline: 0, shadow: false }); g.restore();
      g.restore();
      // discount tags rain in from TOOK onwards, one more on every 8th note
      if (t >= wTook.start) {
        const tags = ['-50%', '-70%', 'RM99', 'FREE GIFT', '-30%', 'RM199', '2 FOR 1', '-60%'];
        const n = Math.min(14, Math.floor((t - wTook.start) / (m.P / 2)) + 1);
        for (let i = 0; i < n; i++) {
          const tt = wTook.start + i * m.P / 2, u = prog(t, tt, tt + 0.35);
          const side = i % 2 ? 1 : -1, x = W / 2 + side * (180 + hash(i) * 200), y = lerp(-60, 170 + hash(i * 3) * 170, easeOutBounce(u));
          g.save(); g.translate(x, y); g.rotate((hash(i * 7) - 0.5) * 0.8 + Math.sin(t * 3 + i) * 0.08); g.scale(0.55, 0.55);
          drawTag(g, 190, tags[i % tags.length], { fill: RAINBOW[i % 8], color: INK, size: 0.4 });
          g.restore();
        }
      }
      // party decorations after the drop
      if (party) {
        for (let i = 0; i < 6; i++) balloon(g, 60 + i * 150 + (i % 2) * 30, 110 + (i % 3) * 30 - (t - drop) * 30, 22, RAINBOW[i], t, i);
        floatingHearts(g, t, 14, 3, '#ff2a6d');
        confetti(g, t, drop, { n: 70, from: { x: 30, y: GY }, spread: 1.2, life: 1.2, seed: 1 });
        confetti(g, t, drop, { n: 70, from: { x: W - 30, y: GY }, spread: 1.2, life: 1.2, seed: 2 });
        for (let k = 0; k < 2; k++) { const bt = m.bt(m.idx(t)); confetti(g, t, bt, { n: 18, from: { x: k ? W * 0.85 : W * 0.15, y: GY - 40 }, spread: 1.6, life: 0.5, seed: m.idx(t) * 3 + k }); }
        sparkles(g, t, 12, 17, { x: 0, y: 0, w: W, h: H * 0.8 });
      }
      // floor
      g.fillStyle = party ? 'rgba(27,16,53,0.85)' : '#ff6fb5'; g.fillRect(0, GY, W, H - GY);
      // Mimi
      let ps, face = 'happy', look = { x: 0, y: 0 }, x = mimi.x, y = mimi.y, lean = 0;
      if (party) {
        ps = pose('cheer', m.phase(t)); face = 'joy';
        y -= Math.abs(Math.sin(m.phase(t) * Math.PI)) * 46;
      } else if (t >= wSur.start) {
        const k = prog(t, wSur.start, wSur.start + 0.15);
        ps = pose('shock'); face = 'surprise'; x -= easeOut(k) * 26; lean = -0.15 * easeOutBack(k); y -= Math.sin(k * Math.PI) * 30;
      } else if (t >= wTook.start) {
        ps = pose('idle', m.phase(t)); look = { x: m.idx(t) % 2 ? 1 : -1, y: -0.4 };   // looks around, one side per beat
      } else ps = pose('wave', m.phase(t));
      drawBuddy(g, { x, y, s: 1.45, skin: SKINS.mimi, ...ps, face, t, look, lean, blink: party || t >= wSur.start ? 0 : blinkAt(t, 9) });
      if (t >= wSur.start - 0.03 && !party) {
        const s = easeOutBack(prog(t, wSur.start - 0.03, wSur.start + 0.15), 3);
        g.save(); g.translate(x + 70, y - 215); g.rotate(0.2); g.scale(s, s); popText(g, '!', 0, 0, 70, { fill: COL.red, outline: 10 }); g.restore();
      }
      if (party) {
        const s = easeOutBack(prog(t, drop, drop + 0.2), 3) * (1 + m.pulse(t) * 0.15);
        g.save(); g.translate(W * 0.8, 255); g.rotate(-0.15); g.scale(s, s); popText(g, 'YAY!', 0, 0, 60, { fill: COL.yellow, outline: 10 }); g.restore();
      }
      // fade in from the white of the eye-dive
      if (t < t0 + 0.25) { g.fillStyle = `rgba(255,255,255,${1 - prog(t, t0, t0 + 0.25)})`; g.fillRect(0, 0, W, H); }
    },
  };
}
