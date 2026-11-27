// 1. "T-POT, T-POT, TURN IT ON"
// Dark room. T-POT #1 pops in grey and slides RIGHT on the next beat, T-POT #2 pops and
// slides LEFT, a third grey T-POT pops in the MIDDLE on that same beat. On "TURN" a pull
// cord drops from the ceiling, a hand grabs it on "IT" and yanks it on "ON": CLICK. The
// lights come on, all three turn GREEN, then switch to random colours on every 8th note.
import { W, H, INK, clamp, prog, easeOut, easeIn, easeOutBack, easeOutElastic, springHit, decay, popText, circle, fillStroke, hash, rr, RAINBOW, COL } from '../core.js';
import { sparkles, halftone, hangingBulbs, wallpaper, shelfRow } from '../world.js';
import { drawHand, drawArm } from '../characters.js';
import { drawLogoWord, logoWordWidth } from '../logo.js';

export default function make(ctx, t0, t1) {
  const m = ctx.music, Wd = m.words;
  const [w1, w2, wTurn, wIt, wOn] = Wd.slice(0, 5);
  const slide1 = m.after(w1.start + 0.25);           // beat after T-POT #1 -> slides right
  const slide2 = m.after(w2.start + 0.25);           // beat after T-POT #2 -> slides left
  const pop3 = slide2;                                // the third pops in the middle on that beat
  const click = wOn.start;
  const words = [w1, w2, wTurn, wIt, wOn];
  const GREY = '#a9a7b8';

  return {
    name: 'intro', caption: null, shake: (t) => (t > click ? 0.6 : 0.25),
    draw(g, t) {
      const lit = t >= click;
      // room
      const gr = g.createRadialGradient(W / 2, H * 0.45, 40, W / 2, H * 0.5, W * 0.7);
      if (lit) { gr.addColorStop(0, '#1f4a8a'); gr.addColorStop(1, '#0b1430'); } else { gr.addColorStop(0, '#1b1433'); gr.addColorStop(1, '#05030c'); }
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      if (lit) {   // light rays + halftone once switched on
        g.save(); g.globalAlpha = 0.18 + 0.1 * m.pulse(t);
        for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2 + t * 0.3; g.fillStyle = i % 2 ? '#ffd400' : '#16e0ff'; g.beginPath(); g.moveTo(W / 2, H * 0.45); g.lineTo(W / 2 + Math.cos(a) * 900, H * 0.45 + Math.sin(a) * 900); g.lineTo(W / 2 + Math.cos(a + 0.18) * 900, H * 0.45 + Math.sin(a + 0.18) * 900); g.fill(); }
        g.restore();
        halftone(g, '#ffffff', 0.05);
      }
      wallpaper(g, '#ffffff', lit ? 0.07 : 0.03, H * 0.8);
      // the showroom stock along the back wall: barely visible in the dark, lit after the click
      shelfRow(g, t, m, H * 0.8 - 2, 9, 0.7);
      if (!lit) { g.fillStyle = 'rgba(5,3,12,0.72)'; g.fillRect(0, H * 0.45, W, H * 0.36); }
      hangingBulbs(g, t, m, 9, 28, lit ? 1 : 0);
      // floor + speakers that thump on every beat (even in the dark)
      g.fillStyle = lit ? '#24124d' : '#0b0718'; g.fillRect(0, H * 0.8, W, H * 0.2);
      for (const sx of [70, W - 70]) {
        const p = m.pulse(t);
        rr(g, sx - 38, H * 0.8 - 110, 76, 120, 8); fillStroke(g, '#15112a', 3, lit ? '#000' : '#222');
        for (const [cy, r] of [[-82, 14], [-35, 24]]) { circle(g, sx, H * 0.8 + cy, r * (1 + p * 0.18)); fillStroke(g, '#2a2440', 3, '#555'); }
        if (lit) { circle(g, sx, H * 0.8 - 100, 3); g.fillStyle = RAINBOW[m.idx(t) % 8]; g.fill(); }
      }
      // dust in the beam
      sparkles(g, t, 10, 3, { x: 0, y: 0, w: W, h: H * 0.8 }, lit ? '#fff' : 'rgba(255,255,255,0.4)');

      // ---- the three T-POTs
      const colAt = (k) => {
        if (!lit) return GREY;
        if (t < m.after(click + 0.15, true)) return '#3ee05a';            // green first
        const step = Math.floor((t - click) / (m.P / 2));                   // then random colour every 8th
        return RAINBOW[Math.floor(hash(step * 7.3 + k * 13.1) * RAINBOW.length)];
      };
      const items = [];
      if (t >= w1.start - 0.04) {
        const u = easeOutBack(prog(t, slide1, slide1 + 0.3), 1.6);
        items.push({ k: 0, x: W / 2 + (W * 0.29) * u, y: H * 0.42, a: w1.start, wi: 0, cap: 42 });
      }
      if (t >= w2.start - 0.04) {
        const u = easeOutBack(prog(t, slide2, slide2 + 0.3), 1.6);
        items.push({ k: 1, x: W / 2 - (W * 0.29) * u, y: H * 0.42, a: w2.start, wi: 1, cap: 42 });
      }
      if (t >= pop3 - 0.04) items.push({ k: 2, x: W / 2, y: H * 0.665, a: pop3, cap: 64 });   // the last one is bigger
      for (const it of items) {
        let s = easeOutBack(prog(t, it.a - 0.04, it.a + 0.16), 2.6);
        if (lit) s *= 1 + springHit(t - m.bt(m.idx(t)), 16, 8) * 0.08 + 0.2 * decay(t - click, 6);
        const col = colAt(it.k);
        // neon sign: dark backing board with screws, glass tubes in the logo's letterforms
        const bw = logoWordWidth(it.cap) + 46, bh = it.cap + 40;
        g.save(); g.translate(it.x, it.y); g.scale(s, s);
        rr(g, -bw / 2, -bh / 2, bw, bh, 12); fillStroke(g, '#15111f', 3, '#2e2842');
        for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { circle(g, sx * (bw / 2 - 9), sy * (bh / 2 - 9), 3); g.fillStyle = '#4a4560'; g.fill(); }
        // lights flicker on at the click, then stay on
        const flick = lit && (t - click > 0.12 || Math.floor((t - click) / 0.03) % 2 === 0);
        if (flick) {
          drawLogoWord(g, 0, 0, it.cap, { fill: col, leafFill: col, glow: col, glowBlur: 26 });
          drawLogoWord(g, 0, 0, it.cap, { fill: col, leafFill: col, glow: '#ffffff', glowBlur: 6 });
        } else {   // unlit glass tubes: grey with a faint highlight
          drawLogoWord(g, 0, 0, it.cap, { fill: '#5b586c', leafFill: '#5b586c', outline: 1.5, outlineCol: '#2a2738' });
          g.globalAlpha = 0.35; drawLogoWord(g, -1.2, -1.2, it.cap, { fill: '#a9a6bd', leafFill: '#a9a6bd' }); g.globalAlpha = 1;
          drawLogoWord(g, 0.6, 0.6, it.cap, { fill: '#5b586c', leafFill: '#5b586c' });
        }
        g.restore();
        if (it.wi !== undefined) ctx.mark(it.wi);
      }
      if (t >= pop3 && t < pop3 + 0.3) {   // puff for the middle pop
        const u = prog(t, pop3, pop3 + 0.3);
        for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; circle(g, W / 2 + Math.cos(a) * 150 * u, H * 0.665 + Math.sin(a) * 50 * u, 16 * (1 - u)); g.fillStyle = 'rgba(255,255,255,0.7)'; g.fill(); }
      }

      // ---- pull cord: drops on TURN, grabbed on IT, yanked on ON
      const cx = W * 0.5, topY = 0;
      const drop = easeOutElastic(prog(t, wTurn.start - 0.04, wTurn.start + 0.45));
      let endY = -20 + 150 * drop;
      const pull = clamp((t - wIt.start) / (click - wIt.start)) * (t < click ? 1 : 0);
      const yank = t >= click ? 70 * decay(t - click, 7) + springHit(t - click, 14, 5) * 30 : pull * 25;
      endY += yank;
      if (t >= wTurn.start - 0.04) {
        g.strokeStyle = '#e6d7a8'; g.lineWidth = 4; g.beginPath(); g.moveTo(cx, topY); g.lineTo(cx, endY); g.stroke();
        g.strokeStyle = INK; g.lineWidth = 1.5; g.beginPath(); g.moveTo(cx - 2, topY); g.lineTo(cx - 2, endY); g.stroke();
        circle(g, cx, endY + 10, 11); fillStroke(g, '#ffd400', 3);
        // a real arm stretches in from the right edge, the fingers close round the bead on
        // "IT", it yanks the cord down hard on "ON" (motion lines), then lets go and withdraws
        const reach = easeOut(prog(t, wIt.start - 0.3, wIt.start));
        const leave = easeIn(prog(t, click + 0.3, click + 0.75));
        if (reach > 0 && leave < 1) {
          const grip = clamp(prog(t, wIt.start - 0.06, wIt.start + 0.06)) * (1 - clamp(prog(t, click + 0.22, click + 0.32)));
          const HS = 1.25;
          const bx = cx - 6, by = endY + 10;
          const hx = bx + 6 * HS + (1 - reach) * 520 + leave * 520, hy = by + leave * 40;
          drawArm(g, W + 60, hy + 70, hx + 46 * HS, hy + 2, 1.05, '#2a5bff');
          drawHand(g, hx, hy, HS, grip, -0.05);
          if (t >= click - 0.02 && t < click + 0.22) {   // pull motion lines
            g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 3; g.lineCap = 'round';
            for (let i = 0; i < 3; i++) { const lx = hx + 6 + i * 16; g.beginPath(); g.moveTo(lx, hy - 70 - i * 6); g.lineTo(lx, hy - 34 - i * 6); g.stroke(); }
          }
        }
      }
      // "TURN IT ON" written next to the cord, word by word
      const lineY = 70;
      const parts = [[wTurn, 'TURN', -150], [wIt, 'IT', -55], [wOn, 'ON', 30]];
      parts.forEach(([w, txt, dx], k) => {
        if (t < w.start - 0.05) return;
        const s = easeOutBack(prog(t, w.start - 0.05, w.start + 0.12), 2.5) * (txt === 'ON' ? 1 + 0.3 * decay(t - click, 5) : 1);
        g.save(); g.translate(cx + dx + (txt === 'ON' ? 60 : 0) - 40, lineY + 10); g.scale(s, s);
        popText(g, txt, 0, 0, txt === 'ON' ? 54 : 40, { fill: txt === 'ON' && lit ? '#3ee05a' : '#fff' });
        g.restore();
        ctx.mark(2 + k);
      });
      // CLICK!
      if (t >= click && t < click + 0.5) {
        const u = prog(t, click, click + 0.5);
        g.save(); g.translate(cx + 120, endY + 30); g.rotate(-0.2); g.scale(easeOutBack(u * 3, 3), easeOutBack(u * 3, 3)); g.globalAlpha = 1 - clamp((u - 0.6) / 0.4);
        popText(g, 'CLICK!', 0, 0, 30, { fill: '#ffd400' }); g.restore();
      }
      // the flash of the lights coming on
      if (t >= click) { g.fillStyle = `rgba(255,255,230,${0.85 * decay(t - click, 10)})`; g.fillRect(0, 0, W, H); }
    },
  };
}
