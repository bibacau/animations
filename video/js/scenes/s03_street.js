// 3. "WALKING DOWN THE STREET, SAW A NEON LIGHT"
// 2D night city (3 parallax layers, neon signs, street lamps). Each lyric pops up as a
// floating platform the moment it is sung; Pip walks in and hops from word to word,
// landing on the beat grid. At the end of the line Pip leaps off "LIGHT" and flies into the
// glowing T-POT store while the camera zooms through its doors.
import { W, H, INK, clamp, prog, lerp, easeOut, easeIn, easeInOut, easeOutBack, springHit, decay, popText, textWidth, rr, circle, fillStroke, COL, RAINBOW, hash } from '../core.js';
import { drawBuddy, pose, SKINS, blinkAt, shade } from '../characters.js';
import { makeCity, drawCity, drawStore, skyGradient, stars, sparkles } from '../world.js';

export default function make(ctx, t0, t1) {
  const m = ctx.music, wd = m.wordsIn(t0, t1), P = m.P;
  const GY = H - 60;
  const g0 = ctx.canvas.getContext('2d');
  const heights = [GY - 120, GY - 170, GY - 135, GY - 195, GY - 150, GY - 205, GY - 165, GY - 185];
  const cols = [COL.yellow, COL.cyan, '#ffffff', COL.lime, COL.orange, COL.yellow, COL.pink, '#fff176'];
  let x = 330;
  const plats = wd.map((w, k) => {
    const size = w.display.length <= 2 ? 34 : 36;
    const tw = textWidth(g0, w.display, size) + 34;
    const p = { w, k, x: x + tw / 2, y: heights[k % heights.length], width: tw, size, col: cols[k % cols.length] };
    x += tw + 46 + (w.display.length <= 2 ? 20 : 0);
    return p;
  });
  const storeX = x + 90, storeW = 250, storeH = 270;
  // Pip's route: walk in on the street, hop onto each word on the 8th-note grid
  const keys = [{ t: t0, x: 80, y: GY, mode: 'walk' }];
  let land = t0;
  const lands = [];
  plats.forEach((p, k) => {
    const L = m.after(Math.max(p.w.start + 0.1, land + P * 0.45), true);
    if (L > t1 - 0.6) return;
    const prev = keys.at(-1);
    if (k === 0) keys.push({ t: L - P * 0.6, x: p.x - p.width / 2 - 90, y: GY, mode: 'walk' });
    else if (L - P * 0.5 > prev.t + 0.05) keys.push({ t: L - P * 0.5, x: prev.x + Math.min(30, plats[k - 1].width * 0.3), y: prev.y, mode: 'walk' });
    keys.push({ t: L, x: p.x - p.width * 0.15, y: p.y - 22, h: 60 + Math.abs(p.y - prev.y) * 0.3, mode: 'jump', plat: p });
    lands.push({ t: L, p }); land = L;
  });
  const last = keys.at(-1);
  const flyT = Math.min(t1 - 0.5, Math.max(land + 0.12, m.after(wd.at(-1).start + 0.1, true)));
  const store = { x: storeX, w: storeW, h: storeH };
  const door = { x: storeX + storeW / 2, y: GY - storeH * 0.12 };
  keys.push({ t: flyT, x: last.x + 10, y: last.y, mode: 'idle' });
  keys.push({ t: t1 - 0.05, x: door.x, y: door.y + 20, h: 120, mode: 'fly' });

  const far = makeCity(11, { x0: -200, x1: 3000, wMin: 50, wMax: 110, hMin: 120, hMax: 260, gap: 10, cols: ['#2a1650', '#24124a', '#311a5e'], signs: 0.15 });
  const mid = makeCity(23, { x0: -200, x1: 3200, wMin: 70, wMax: 140, hMin: 90, hMax: 200, gap: 30, cols: ['#3d1f73', '#4a2585', '#38206b', '#522a8f'], signs: 0.45 });

  function path(t) {
    if (t <= keys[0].t) return { ...keys[0], u: 0 };
    for (let i = 0; i < keys.length - 1; i++) {
      const a = keys[i], b = keys[i + 1];
      if (t < b.t) {
        const u = (t - a.t) / (b.t - a.t);
        const e = b.mode === 'fly' ? easeIn(u) : u;
        return { x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e) - 4 * (b.h || 0) * e * (1 - e), mode: b.mode === 'jump' || b.mode === 'fly' ? b.mode : a.mode, u, a, b };
      }
    }
    return { ...keys.at(-1), u: 1 };
  }
  function camX(t) {   // follow Pip, but never let the newest word fall off the right edge
    let c = 0;
    for (let k = 0; k < 6; k++) {
      const tk = t - k * 0.05, p = path(tk);
      const newest = plats.filter((q) => q.w.start <= tk + 0.05).at(-1);
      c += Math.max(p.x - 260, newest ? newest.x + newest.width / 2 + 40 - W : -1e9, 0) / 6;
    }
    return c;
  }

  return {
    name: 'street', caption: null, shake: 0.35, noFlash: false,
    draw(g, t) {
      const cam = camX(t);
      const zoomU = easeIn(prog(t, flyT + 0.15, t1));
      // zoom into the store doors at the end
      const dsx = door.x - cam, dsy = door.y;
      const Z = 1 + zoomU * 9;
      g.save();
      g.translate(dsx, dsy); g.scale(Z, Z); g.translate(-dsx, -dsy);
      skyGradient(g, '#12062e', '#5a1a7a', '#ff5fa2');
      stars(g, 40, t, 7, H * 0.4);
      // moon
      circle(g, W * 0.82 - cam * 0.05, 70, 34); g.fillStyle = '#fff3c4'; g.fill(); circle(g, W * 0.82 - cam * 0.05 - 12, 62, 8); g.fillStyle = '#f1dfa0'; g.fill();
      drawCity(g, far, cam * 0.25, GY - 30, t, { winSize: 4, signs: false });
      drawCity(g, mid, cam * 0.55, GY - 10, t, { winSize: 6, outline: true });
      // street
      g.fillStyle = '#2a1a44'; g.fillRect(0, GY, W, H - GY);
      g.fillStyle = '#4a3570'; g.fillRect(0, GY, W, 10);
      for (let lx = -((cam * 1) % 120); lx < W; lx += 120) { g.fillStyle = '#ffd400'; g.fillRect(lx, GY + 32, 50, 6); }
      // street lamps (foreground parallax), glow pulses with the beat
      for (let i = 0; i < 12; i++) {
        const lx = 150 + i * 260 - cam; if (lx < -40 || lx > W + 40) continue;
        g.fillStyle = '#1b1433'; g.fillRect(lx - 3, GY - 150, 6, 150);
        g.beginPath(); g.moveTo(lx, GY - 150); g.quadraticCurveTo(lx + 20, GY - 170, lx + 34, GY - 150); g.lineWidth = 5; g.strokeStyle = '#1b1433'; g.stroke();
        g.save(); g.globalAlpha = 0.25 + 0.2 * m.pulse(t); g.fillStyle = '#fff2a8';
        g.beginPath(); g.moveTo(lx + 28, GY - 150); g.lineTo(lx + 40, GY - 150); g.lineTo(lx + 90, GY); g.lineTo(lx - 22, GY); g.fill(); g.restore();
        circle(g, lx + 34, GY - 148, 7); g.fillStyle = '#fff2a8'; g.fill();
      }
      // the T-POT store at the end of the street
      drawStore(g, storeX - cam, GY, storeW, storeH, t, { flicker: true });
      sparkles(g, t, 6, 9, { x: storeX - cam - 20, y: GY - storeH - 80, w: storeW + 40, h: 120 }, '#ffd400');

      // lyric platforms
      const p = path(t);
      for (const q of plats) {
        if (t < q.w.start - 0.05) continue;
        const s = easeOutBack(prog(t, q.w.start - 0.05, q.w.start + 0.15), 2.2);
        const ld = lands.find((l) => l.p === q);
        const dip = ld ? springHit(t - ld.t, 16, 6) * 10 : 0;
        const bob = Math.sin(t * 2.4 + q.k) * 3 + springHit(m.since(t) - q.k * 0.03, 16, 9) * 4;   // unstable: wobble on the beat
        const neon = /NEON|LIGHT/.test(q.w.text);
        const qx = q.x - cam, qy = q.y + dip + bob;
        g.save(); g.translate(qx, qy); g.scale(s, s);
        // solid extruded letters (no plate): soft shadow, a darker 3D side, then the face
        g.beginPath(); g.ellipse(0, 26, q.width * 0.42, 6, 0, 0, Math.PI * 2); g.fillStyle = 'rgba(0,0,0,0.28)'; g.fill();
        const on = !neon || hash(Math.floor(t * 14) + q.k) > 0.05;
        const face = neon ? (on ? (q.w.text === 'NEON' ? '#ff7be6' : '#fff07a') : '#b0609a') : q.col;
        const side = neon ? (q.w.text === 'NEON' ? '#8a1a6e' : '#a07a10') : shade(q.col, -0.45);
        g.font = `${q.size}px Bowlby, Impact, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
        for (let d = 7; d >= 1; d--) { g.fillStyle = side; g.fillText(q.w.display, 0, -4 + d); g.lineWidth = 4; g.strokeStyle = INK; if (d === 7) g.strokeText(q.w.display, 0, -4 + d); }
        if (neon) { g.shadowColor = q.w.text === 'NEON' ? '#ff4fd8' : '#ffe14d'; g.shadowBlur = 18 + 14 * m.pulse(t); }
        g.fillStyle = face; g.fillText(q.w.display, 0, -4);
        g.shadowBlur = 0; g.lineWidth = 3; g.strokeStyle = INK; g.strokeText(q.w.display, 0, -4);
        g.fillStyle = 'rgba(255,255,255,0.35)'; g.save(); g.beginPath(); g.rect(-q.width / 2, -4 - q.size * 0.45, q.width, q.size * 0.22); g.clip(); g.fillText(q.w.display, 0, -4); g.restore();
        g.restore();
        ctx.mark(q.w.i);
      }
      // Pip
      const sinceLand = lands.filter((l) => l.t <= t).at(-1);
      const sl = sinceLand ? t - sinceLand.t : 9;
      let mode = p.mode, ps;
      if (mode === 'jump') ps = p.u > 0.85 ? pose('land', 0, 0.6) : pose('jump');
      else if (mode === 'fly') ps = pose('fly');
      else if (sl < 0.12) ps = pose('land', 0, decay(sl, 12));
      else ps = pose(mode === 'walk' ? 'walk' : 'idle', (t * 2.2) % 1);
      drawBuddy(g, { x: p.x - cam, y: p.y, s: mode === 'fly' ? 0.74 - 0.35 * p.u : 0.74, skin: SKINS.pip, ...ps, lean: mode === 'fly' ? 0.5 : mode === 'jump' ? 0.1 : 0,
        face: mode === 'fly' ? 'stars' : 'happy', t, look: { x: 1, y: mode === 'idle' ? 0 : -0.3 }, blink: blinkAt(t, 2) });
      if (mode === 'fly') { for (let i = 0; i < 5; i++) { circle(g, p.x - cam - 20 - i * 14, p.y - 40 + i * 6, 6 - i); g.fillStyle = `rgba(255,240,150,${0.8 - i * 0.15})`; g.fill(); } }
      g.restore();
      if (zoomU > 0.6) { g.fillStyle = `rgba(255,246,192,${clamp((zoomU - 0.6) / 0.4)})`; g.fillRect(0, 0, W, H); }
    },
  };
}
