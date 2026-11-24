// 1. "T-POT, T-POT, TURN IT ON"
// Dark room. T-POT #1 pops in grey and slides RIGHT on the next beat, T-POT #2 pops and
// slides LEFT, a third grey T-POT pops in the MIDDLE on that same beat. On "TURN" a pull
// cord drops from the ceiling, a hand grabs it on "IT" and yanks it on "ON": CLICK. The
// lights come on, all three turn GREEN, then switch to random colours on every 8th note.
import { W, H, INK, clamp, prog, easeOut, easeOutBack, easeOutElastic, springHit, decay, popText, circle, fillStroke, hash, rr, RAINBOW, COL } from '../core.js';
import { sparkles, halftone, hangingBulbs, wallpaper } from '../world.js';

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
      if (lit) { gr.addColorStop(0, '#3a1d7a'); gr.addColorStop(1, '#120a2e'); } else { gr.addColorStop(0, '#1b1433'); gr.addColorStop(1, '#05030c'); }
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      if (lit) {   // light rays + halftone once switched on
        g.save(); g.globalAlpha = 0.18 + 0.1 * m.pulse(t);
        for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2 + t * 0.3; g.fillStyle = i % 2 ? '#ffd400' : '#16e0ff'; g.beginPath(); g.moveTo(W / 2, H * 0.45); g.lineTo(W / 2 + Math.cos(a) * 900, H * 0.45 + Math.sin(a) * 900); g.lineTo(W / 2 + Math.cos(a + 0.18) * 900, H * 0.45 + Math.sin(a + 0.18) * 900); g.fill(); }
        g.restore();
        halftone(g, '#ffffff', 0.05);
      }
      if (lit) wallpaper(g, '#ffffff', 0.06, H * 0.8);
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
        items.push({ k: 0, x: W / 2 + (W * 0.3) * u, y: H * 0.42, a: w1.start, wi: 0 });
      }
      if (t >= w2.start - 0.04) {
        const u = easeOutBack(prog(t, slide2, slide2 + 0.3), 1.6);
        items.push({ k: 1, x: W / 2 - (W * 0.3) * u, y: H * 0.42, a: w2.start, wi: 1 });
      }
      if (t >= pop3 - 0.04) items.push({ k: 2, x: W / 2, y: H * 0.62, a: pop3 });
      for (const it of items) {
        let s = easeOutBack(prog(t, it.a - 0.04, it.a + 0.16), 2.6);
        if (lit) s *= 1 + springHit(t - m.bt(m.idx(t)), 16, 8) * 0.1 + 0.25 * decay(t - click, 6);
        const col = colAt(it.k);
        g.save(); g.translate(it.x, it.y); g.scale(s, s);
        if (lit) { g.shadowColor = col; g.shadowBlur = 25; }
        popText(g, 'T-POT', 0, 0, 74, { fill: col, outline: 12 });
        g.restore();
        if (it.wi !== undefined) ctx.mark(it.wi);
      }
      if (t >= pop3 && t < pop3 + 0.3) {   // puff for the middle pop
        const u = prog(t, pop3, pop3 + 0.3);
        for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; circle(g, W / 2 + Math.cos(a) * 90 * u, H * 0.62 + Math.sin(a) * 40 * u, 14 * (1 - u)); g.fillStyle = 'rgba(255,255,255,0.7)'; g.fill(); }
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
        // the hand: reaches up from the right on IT, grips, yanks down on ON, lets go
        const reach = easeOut(prog(t, wIt.start - 0.15, wIt.start + 0.05));
        const leave = easeOut(prog(t, click + 0.25, click + 0.6));
        if (reach > 0 && leave < 1) {
          const hx = cx + 14 + (1 - reach) * 260 + leave * 300, hy = endY + 16 - leave * 60;
          g.strokeStyle = INK; g.lineWidth = 22; g.lineCap = 'round'; g.beginPath(); g.moveTo(hx + 190, hy - 10); g.lineTo(hx + 8, hy + 2); g.stroke();
          g.strokeStyle = '#ff7a1a'; g.lineWidth = 16; g.stroke();
          circle(g, hx, hy, 17); fillStroke(g, '#fff', 4);
          for (let i = 0; i < 3; i++) { circle(g, hx - 12 + i * 9, hy - 12, 6); fillStroke(g, '#fff', 3); }
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
