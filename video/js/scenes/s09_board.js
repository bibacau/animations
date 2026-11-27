// 9. "LOW PRICES, OH YEAH, THAT'S THE PLOT"
// A T-POT price board of electronics. On every beat one price drops: its digits spin like
// a slot machine for an 8th note, then land on the new lower price with a bounce, while
// the old digits tumble off and fall. Down-arrows flash, "%" stickers slap on. Pip pops up
// in the corner on "OH YEAH".
import { W, H, INK, clamp, prog, lerp, easeOut, easeIn, easeOutBack, easeOutBounce, springHit, decay, popText, rr, circle, fillStroke, star, COL, RAINBOW, hash } from '../core.js';
import { drawTV, screenGlow, drawWasher, drawFridge, drawRice, drawAircon, drawMicrowave } from '../products.js';
import { drawBuddy, pose, SKINS } from '../characters.js';
import { halftone, sparkles, confetti } from '../world.js';

export default function make(ctx, t0, t1) {
  const m = ctx.music, wd = m.wordsIn(t0, t1);
  const wOh = wd.find((w) => w.text === 'OH');
  const items = [
    { name: 'SMART TV', draw: (g) => drawTV(g, 110, (g, x, y, w, h) => screenGlow(g, x, y, w, h)), prices: [3999, 2666, 1333] },
    { name: 'WASHER', draw: (g) => drawWasher(g, 66, 0), prices: [2697, 1798, 899] },
    { name: 'FRIDGE', draw: (g) => drawFridge(g, 40), prices: [2997, 1998, 999] },
    { name: 'RICE COOKER', draw: (g) => drawRice(g, 80), prices: [597, 398, 199] },
    { name: 'AIRCON', draw: (g) => drawAircon(g, 120), prices: [2397, 1598, 799] },
    { name: 'MICROWAVE', draw: (g) => drawMicrowave(g, 96), prices: [897, 598, 299] },
  ];
  // schedule: a drop on every 8th note from the first beat; 12 drops = each product twice
  // (original -> two thirds -> ONE THIRD of the original price)
  const slots = [];
  for (let i = m.idx(t0) + 1; m.bt(i) < t1 - 0.2; i++) { slots.push(m.bt(i)); slots.push(m.bt(i) + m.P / 2); }
  const order = [0, 3, 1, 4, 2, 5];
  const drops = slots.slice(0, 12).map((bt, k) => ({ t: bt, item: order[k % 6], step: Math.floor(k / 6) + 1 }));
  items.forEach((it, i) => { it.drops = drops.filter((d) => d.item === i); });
  const fmt = (n) => 'RM' + n.toLocaleString('en-US');

  function priceAt(it, t) {
    const done = it.drops.filter((d) => t >= d.t);
    return { cur: it.prices[Math.min(done.length, it.prices.length - 1)], prev: it.prices[Math.max(0, Math.min(done.length - 1, it.prices.length - 1))], last: done.at(-1), next: it.drops.find((d) => t < d.t) };
  }

  return {
    name: 'board', caption: { pos: 'bottom' }, shake: 0.7,
    draw(g, t) {
      g.fillStyle = '#ffd400'; g.fillRect(0, 0, W, H);
      halftone(g, '#ff7a1a', 0.35, 20);
      // header
      rr(g, 20, 12, W - 40, 56, 14); fillStroke(g, COL.tred, 4);
      popText(g, 'T-POT  PRICE  DROP!', W / 2, 41, 30 * (1 + m.pulse(t) * 0.06), { fill: '#fff', outline: 5 });
      for (let i = 0; i < 2; i++) { const x = i ? W - 60 : 60; g.save(); g.translate(x, 40 + Math.abs(Math.sin(m.count(t) * Math.PI)) * -6); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(-12, -14); g.lineTo(12, -14); g.lineTo(12, 2); g.lineTo(20, 2); g.lineTo(0, 20); g.lineTo(-20, 2); g.lineTo(-12, 2); g.closePath(); fillStroke(g, '#fff', 3); g.restore(); }
      // 3 x 2 cards
      const cw = 250, ch = 160;
      items.forEach((it, i) => {
        const cx = W / 2 + ((i % 3) - 1) * (cw + 18), cy = 160 + Math.floor(i / 3) * (ch + 14);
        const { cur, prev, last, next } = priceAt(it, t);
        const hit = last ? t - last.t : 9;
        const sq = springHit(hit, 18, 8) * 0.06;
        g.save(); g.translate(cx, cy); g.scale(1 + sq, 1 - sq);
        rr(g, -cw / 2, -ch / 2, cw, ch, 16); fillStroke(g, '#fff', 4);
        if (hit < 0.25) { rr(g, -cw / 2, -ch / 2, cw, ch, 16); g.fillStyle = `rgba(255,42,77,${0.35 * (1 - hit / 0.25)})`; g.fill(); }
        // product
        g.save(); g.translate(-cw * 0.27, 30); const hop = Math.max(0, springHit(m.since(t) - i * 0.03, 16, 9)) * 6; g.translate(0, -hop); g.scale(0.9, 0.9); it.draw(g); g.restore();
        popText(g, it.name, cw * 0.17, -ch * 0.33, 15, { font: 'Anton', fill: INK, outline: 0, shadow: false });
        // price window
        const px = cw * 0.17, py = 12;
        rr(g, px - 72, py - 26, 144, 52, 10); fillStroke(g, '#1b1035', 3);
        g.save(); rr(g, px - 72, py - 26, 144, 52, 10); g.clip();
        if (next && t >= next.t - m.P / 2) {
          // slot-machine roll: digits blur upward for the 8th note before the drop
          const u = prog(t, next.t - m.P / 2, next.t);
          for (let k = -2; k <= 2; k++) { const ry = py + ((u * 900 + k * 40) % 200) - 100; g.globalAlpha = 0.6; popText(g, fmt(Math.floor(hash(k + Math.floor(t * 40)) * 9000)), px, ry, 24, { font: 'Bowlby', fill: COL.yellow, outline: 0, shadow: false }); }
          g.globalAlpha = 1;
        } else {
          const s = 1 + 0.35 * decay(hit, 10);
          g.save(); g.translate(px, py + (1 - easeOutBounce(clamp(hit / 0.25))) * -30); g.scale(s, s);
          popText(g, fmt(cur), 0, 0, 24, { font: 'Bowlby', fill: hit < 0.6 ? COL.lime : COL.yellow, outline: 0, shadow: false });
          g.restore();
        }
        g.restore();
        // the old price tumbles off and falls
        if (last && hit < 0.7 && prev !== cur) {
          g.save(); g.translate(px + hit * 60, py + 30 + hit * hit * 900); g.rotate(hit * 4); g.globalAlpha = 1 - hit / 0.7;
          popText(g, fmt(prev), 0, 0, 20, { font: 'Bowlby', fill: '#8c8a99', outline: 3 });
          g.strokeStyle = COL.red; g.lineWidth = 4; g.beginPath(); g.moveTo(-56, 0); g.lineTo(56, 0); g.stroke();
          g.restore();
        }
        // % sticker after the first drop
        if (it.drops[0] && t >= it.drops[0].t) {
          const off = Math.round((1 - cur / it.prices[0]) * 100);   // ends at -67%
          const s = easeOutBack(prog(t, it.drops[0].t, it.drops[0].t + 0.2), 3);
          g.save(); g.translate(cw / 2 - 14, -ch / 2 + 10); g.rotate(0.25); g.scale(s, s);
          star(g, 0, 0, 28, 21, 12, t); fillStroke(g, COL.red, 3);
          popText(g, `-${off}%`, 0, 1, 14, { font: 'Bowlby', fill: '#fff', outline: 0, shadow: false });
          g.restore();
        }
        // flashing down-arrow on a drop
        if (hit < 0.4) { g.save(); g.translate(px + 92, py); g.globalAlpha = 1 - hit / 0.4; g.fillStyle = COL.red; g.beginPath(); g.moveTo(-8, -18 + hit * 40); g.lineTo(8, -18 + hit * 40); g.lineTo(8, -2 + hit * 40); g.lineTo(16, -2 + hit * 40); g.lineTo(0, 16 + hit * 40); g.lineTo(-16, -2 + hit * 40); g.lineTo(-8, -2 + hit * 40); g.closePath(); g.fill(); g.restore(); }
        g.restore();
      });
      sparkles(g, t, 8, 51, { x: 0, y: 70, w: W, h: H - 140 });
      // Pip pops up in the corner on "OH YEAH"
      if (wOh && t >= wOh.start - 0.05) {
        const u = easeOutBack(prog(t, wOh.start - 0.05, wOh.start + 0.2), 2);
        drawBuddy(g, { x: W - 52, y: H + 30 - u * 78, s: 0.62, skin: SKINS.pip, ...pose('cheer', m.phase(t)), face: 'joy', t, lean: -0.2 });
      }
    },
  };
}
