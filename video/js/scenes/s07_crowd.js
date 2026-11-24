// 7. "T-POT, WHERE THE SAVINGS NEVER STOP"
// Party! A big crowd in three rows waves in time - every beat flips the wave, each row a
// 16th later than the one in front so the wave rolls backwards; every kick bounces
// everyone. The real T-POT logo glows on the stage wall, stage lights sweep, the backdrop
// colour swaps on each downbeat, coins (savings!) rain down. On "NEVER STOP" the whole
// crowd jumps on every beat.
import { W, H, INK, clamp, prog, lerp, easeOut, easeOutBack, springHit, decay, popText, rr, circle, fillStroke, COL, RAINBOW, hash } from '../core.js';
import { drawBuddy, pose, SKINS, crowdSkin } from '../characters.js';
import { sunburst, confetti, coin, sparkles, bunting, balloon } from '../world.js';
import { drawPart } from '../logo.js';

export default function make(ctx, t0, t1) {
  const m = ctx.music, wd = m.wordsIn(t0, t1), L = ctx.logo;
  const wNever = wd.find((w) => w.text === 'NEVER');
  const wTpot = wd[0];
  const rows = [
    { n: 10, y: H - 175, s: 0.5, dt: m.P / 2 },
    { n: 9, y: H - 105, s: 0.66, dt: m.P / 4 },
    { n: 7, y: H - 20, s: 0.85, dt: 0 },
  ];
  const people = [];
  rows.forEach((r, ri) => {
    for (let i = 0; i < r.n; i++) {
      const x = (i + 0.5) / r.n * W + (ri % 2 ? 20 : -20) + (hash(i + ri * 9) - 0.5) * 24;
      let skin = crowdSkin(i * 3 + ri * 7);
      if (ri === 2 && i === 3) skin = SKINS.pip;
      if (ri === 2 && i === 4) skin = SKINS.mimi;
      people.push({ x, y: r.y, s: r.s * (0.92 + hash(i * 5 + ri) * 0.16), skin, dt: r.dt, ri, i, flip: hash(i + ri * 3) > 0.5 });
    }
  });
  const BG = [['#2a0a5e', '#4a1590'], ['#0a2a5e', '#15508f'], ['#5e0a3a', '#8f1560'], ['#0a4a3a', '#15806a']];

  return {
    name: 'crowd', caption: { pos: 'top', size: 40, y: 40 }, shake: 1.0,
    draw(g, t) {
      const bar = Math.floor((m.idx(t) - 3) / 4);
      const [c1, c2] = BG[((bar % 4) + 4) % 4];
      sunburst(g, W / 2, H * 0.4, 20, t * 0.4, c1, c2);
      // stage lights sweeping on the beat
      g.save(); g.globalAlpha = 0.2 + 0.15 * m.pulse(t);
      for (let i = 0; i < 6; i++) { const a = Math.sin(m.count(t) * Math.PI / 2 + i) * 0.6; const x0 = 40 + i * 155; g.fillStyle = RAINBOW[i]; g.beginPath(); g.moveTo(x0, 0); g.lineTo(x0 + Math.sin(a) * 600 - 50, H); g.lineTo(x0 + Math.sin(a) * 600 + 50, H); g.fill(); }
      g.restore();
      // logo sign on the stage wall: white plate, real vector logo, pulses on kicks
      const ls = 1 + m.pulse(t) * 0.06 + 0.25 * decay(t - wTpot.start, 6) * (t >= wTpot.start ? 1 : 0);
      g.save(); g.translate(W / 2, 150); g.scale(ls, ls);
      rr(g, -175, -62, 350, 124, 22); fillStroke(g, '#fff', 6);
      for (let i = 0; i < 22; i++) { const a = i / 22; circle(g, -165 + a * 330, -52, 3.5); g.fillStyle = (i + m.idx(t)) % 2 ? '#ffd400' : '#ff4fd8'; g.fill(); circle(g, -165 + a * 330, 52, 3.5); g.fill(); }
      const sc = 300 / L.box.w;
      for (const p of Object.values(L.parts)) drawPart(g, p, (p.cx - L.box.cx) * sc, (p.cy - L.box.cy) * sc, sc);
      g.restore();
      bunting(g, -10, 70, W * 0.32, 92, 10, t, 7, m.pulse(t)); bunting(g, W * 0.68, 92, W + 10, 70, 10, t, 7, m.pulse(t));
      for (let i = 0; i < 4; i++) balloon(g, i < 2 ? 40 + i * 55 : W - 40 - (i - 2) * 55, 150 + (i % 2) * 30, 20, RAINBOW[i + 2], t, i);
      // coins raining
      for (let i = 0; i < 14; i++) { const x = hash(i * 3.3) * W, y = ((t - t0) * (160 + hash(i) * 120) + hash(i * 9) * H) % (H + 60) - 30; coin(g, x, y, 9 + hash(i * 2) * 5, t + i); }
      sparkles(g, t, 10, 31, { x: 0, y: 0, w: W, h: H * 0.55 });
      // the crowd
      const jumping = wNever && t >= wNever.start - 0.05;
      for (const p of people) {
        const tt = t - p.dt;
        const beat = m.idx(tt), ph = m.phase(tt);
        // wave arm flips side every beat (snappy ease), bounce on every beat
        const side = beat % 2 ? 1 : -1;
        const sw = side * (0.9 - 0.9 * decay(ph * m.P, 12) * 2 + 0.9) * 0.5;
        const bounce = Math.max(0, springHit(m.since(tt), 16, 8));
        let y = p.y, ps;
        if (jumping) { ps = pose('cheer', ph); y -= Math.sin(ph * Math.PI) * 50 * p.s; }
        else { ps = { armL: 0.5 + (side < 0 ? 1.8 : 0.3), armR: 0.5 + (side > 0 ? 1.8 : 0.3), legL: 0, legR: 0, squash: 1 - bounce * 0.12 }; y += bounce * 4; ps.armL += Math.sin(ph * Math.PI) * 0.3 * (side < 0); ps.armR += Math.sin(ph * Math.PI) * 0.3 * (side > 0); }
        drawBuddy(g, { x: p.x, y, s: p.s, skin: p.skin, ...ps, face: jumping ? 'joy' : (p.ri === 2 ? 'happy' : 'happy'), t, flip: p.flip, look: { x: 0, y: -0.6 }, blink: 0 });
      }
      if (jumping) confetti(g, t, wNever.start, { n: 80 });
      // big "T-POT" slam on the first word (the caption also carries the line)
      if (t >= wTpot.start - 0.04 && t < wd[1].start) {
        const s = easeOutBack(prog(t, wTpot.start - 0.04, wTpot.start + 0.15), 2.5) * (1 + m.pulse(t) * 0.1);
        g.save(); g.translate(W / 2, 262); g.scale(s, s); popText(g, 'T-POT', 0, 0, 84, { fill: COL.yellow, outline: 12 }); g.restore();
      }
    },
  };
}
