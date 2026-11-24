// Backgrounds & decorations: parallax city, T-POT store building, sky, confetti, bunting,
// balloons, sparkles, speed lines, sunburst. All deterministic in t.
import { W, H, INK, rr, circle, fillStroke, star, popText, rng, hash, COL, RAINBOW, clamp, springHit } from './core.js';
import { heart } from './characters.js';

// ------------------------------------------------------------------- city
export function makeCity(seed, o) {
  const r = rng(seed), out = [];
  let x = o.x0;
  while (x < o.x1) {
    const w = o.wMin + r() * (o.wMax - o.wMin), h = o.hMin + r() * (o.hMax - o.hMin);
    out.push({ x, w, h, col: o.cols[Math.floor(r() * o.cols.length)], win: r() < 0.85, seed: r() * 1000,
      roof: Math.floor(r() * 4), sign: r() < o.signs ? ['SALE', 'OPEN', 'HOT', 'DEALS', '24/7', 'TV', 'WOW', '-50%'][Math.floor(r() * 8)] : null,
      signCol: RAINBOW[Math.floor(r() * RAINBOW.length)] });
    x += w + o.gap * r();
  }
  return out;
}
export function drawCity(g, city, scroll, groundY, t, o = {}) {
  for (const b of city) {
    const x = b.x - scroll;
    if (x > W + 50 || x + b.w < -50) continue;
    const y = groundY - b.h;
    g.fillStyle = b.col; g.fillRect(x, y, b.w, b.h);
    if (o.outline) { g.lineWidth = 2; g.strokeStyle = INK; g.strokeRect(x, y, b.w, b.h); }
    if (b.roof === 1) { g.fillRect(x + b.w * 0.3, y - 14, 4, 14); circle(g, x + b.w * 0.3 + 2, y - 15, 3); g.fillStyle = '#ff2a4d'; g.fill(); }
    if (b.roof === 2) { g.fillStyle = b.col; g.fillRect(x + b.w * 0.55, y - 12, b.w * 0.3, 12); }
    if (b.win && o.windows !== false) {
      const cw = o.winSize || 7, gap = cw * 1.9;
      for (let wy = y + 8; wy < groundY - 10; wy += gap) for (let wx = x + 6; wx < x + b.w - cw - 2; wx += gap) {
        const hsh = hash(b.seed + wx * 1.3 + wy * 7.1);
        const lit = hsh > 0.45 && hash(hsh * 99 + Math.floor(t * 0.7 + hsh * 5)) > 0.08;
        g.fillStyle = lit ? (hsh > 0.9 ? '#ff9ff0' : '#ffd86b') : 'rgba(0,0,0,0.25)';
        g.fillRect(wx, wy, cw, cw * 1.2);
      }
    }
    if (b.sign && o.signs !== false) {
      const on = hash(Math.floor(t * 12) + b.seed) > 0.1;
      const sw = Math.min(b.w * 0.9, 70);
      g.save(); g.shadowColor = b.signCol; g.shadowBlur = on ? 14 : 0;
      popText(g, b.sign, x + b.w / 2, y - 14, sw * 0.32, { font: 'Bowlby', fill: on ? b.signCol : '#444', outline: 0, shadow: false });
      g.restore();
    }
  }
}

/** the T-POT store: neon sign, logo, glass doors. returns door centre. */
export function drawStore(g, x, groundY, w, h, t, o = {}) {
  const y = groundY - h;
  rr(g, x, y, w, h, 6); fillStroke(g, o.col || '#3b1f6b', 4);
  // windows
  for (let wy = y + h * 0.12; wy < groundY - h * 0.38; wy += 22) for (let wx = x + 12; wx < x + w - 20; wx += 22) {
    g.fillStyle = hash(wx * 3 + wy) > 0.3 ? '#ffd86b' : '#22154a'; g.fillRect(wx, wy, 12, 14);
  }
  // awning
  const ay = groundY - h * 0.3;
  for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#fff' : COL.tred; g.beginPath(); g.moveTo(x + i * w / 8, ay); g.lineTo(x + (i + 1) * w / 8, ay); g.lineTo(x + (i + 1) * w / 8, ay + 16); g.arc(x + (i + 0.5) * w / 8, ay + 16, w / 16, 0, Math.PI); g.closePath(); g.fill(); }
  g.lineWidth = 3; g.strokeStyle = INK; g.strokeRect(x, ay, w, 16);
  // doors (glowing)
  const dw = w * 0.36, dh = h * 0.24, dx = x + w / 2 - dw / 2, dy = groundY - dh;
  g.save(); g.shadowColor = '#fff6c0'; g.shadowBlur = 25; rr(g, dx, dy, dw, dh, 4); g.fillStyle = '#fff6c0'; g.fill(); g.restore();
  rr(g, dx, dy, dw, dh, 4); g.lineWidth = 3; g.strokeStyle = INK; g.stroke();
  g.beginPath(); g.moveTo(dx + dw / 2, dy); g.lineTo(dx + dw / 2, groundY); g.stroke();
  // neon T-POT sign on the facade
  const flick = o.flicker ? (hash(Math.floor(t * 15)) > 0.12 ? 1 : 0.3) : 1;
  g.save(); g.shadowColor = '#ff2a4d'; g.shadowBlur = 22 * flick;
  rr(g, x + w * 0.08, y - h * 0.16, w * 0.84, h * 0.2, 10); fillStroke(g, '#1b1035', 4);
  popText(g, 'T-POT', x + w / 2, y - h * 0.06, h * 0.13, { font: 'Bowlby', fill: flick > 0.5 ? '#ff3b5c' : '#5a2030', outline: 0, shadow: false });
  g.restore();
  return { doorX: dx + dw / 2, doorY: dy + dh / 2, doorW: dw, doorH: dh };
}

export function skyGradient(g, c1, c2, c3) {
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, c1); gr.addColorStop(0.6, c2); if (c3) gr.addColorStop(1, c3);
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
}
export function stars(g, n, t, seed = 1, yMax = H * 0.6) {
  for (let i = 0; i < n; i++) {
    const x = hash(seed + i * 3.1) * W, y = hash(seed + i * 7.7) * yMax, tw = 0.5 + 0.5 * Math.sin(t * 3 + i);
    g.fillStyle = `rgba(255,255,255,${0.3 + tw * 0.6})`; g.fillRect(x, y, 2, 2);
  }
}

// ------------------------------------------------------------------- decorations
export function sunburst(g, cx, cy, n, rot, c1, c2, R = 1200) {
  g.fillStyle = c1; g.fillRect(0, 0, W, H);
  g.fillStyle = c2;
  for (let i = 0; i < n; i++) { const a0 = rot + i * Math.PI * 2 / n, a1 = a0 + Math.PI / n; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a0) * R, cy + Math.sin(a0) * R); g.lineTo(cx + Math.cos(a1) * R, cy + Math.sin(a1) * R); g.fill(); }
}
export function halftone(g, col, alpha, step = 18, t = 0) {
  g.fillStyle = col; g.globalAlpha = alpha;
  for (let y = 0; y < H + step; y += step) for (let x = 0; x < W + step; x += step) { const r = 2 + 3 * (y / H); circle(g, x + (Math.floor(y / step) % 2) * step / 2, y, r); g.fill(); }
  g.globalAlpha = 1;
}
/** confetti falling (or bursting from a point if o.from) */
export function confetti(g, t, t0, o = {}) {
  const n = o.n || 80, dt = t - t0; if (dt < 0) return;
  for (let i = 0; i < n; i++) {
    const h1 = hash(i * 1.37 + (o.seed || 0)), h2 = hash(i * 2.91 + 5), h3 = hash(i * 4.13 + 9);
    let x, y;
    if (o.from) { const a = -Math.PI / 2 + (h1 - 0.5) * (o.spread || 2.6), sp = 250 + h2 * 450; x = o.from.x + Math.cos(a) * sp * dt; y = o.from.y + Math.sin(a) * sp * dt + 380 * dt * dt; }
    else { x = (h1 * W * 1.2 - W * 0.1 + Math.sin(dt * 2 + i) * 20); y = ((h2 * H + dt * (80 + h3 * 120)) % (H + 40)) - 20; }
    if (o.life && dt > o.life) continue;
    g.save(); g.translate(x, y); g.rotate(dt * (4 + h3 * 6) + i);
    g.fillStyle = RAINBOW[i % RAINBOW.length]; g.fillRect(-4, -2.5, 8, 5 * Math.abs(Math.cos(dt * 6 + i)) + 1);
    g.restore();
  }
}
/** bunting flags strung between two points, waving */
export function bunting(g, x0, y0, x1, y1, sag, t, n = 12, pulse = 0) {
  g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + sag * 2, x1, y1); g.stroke();
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) / n, x = (1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * (x0 + x1) / 2 + u * u * x1, y = (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * ((y0 + y1) / 2 + sag * 2) + u * u * y1;
    const sw = Math.sin(t * 4 + i) * 0.15 + pulse * 0.25 * (i % 2 ? 1 : -1);
    g.save(); g.translate(x, y); g.rotate(sw);
    g.beginPath(); g.moveTo(-9, 0); g.lineTo(9, 0); g.lineTo(0, 20); g.closePath(); fillStroke(g, RAINBOW[i % RAINBOW.length], 2);
    g.restore();
  }
}
export function balloon(g, x, y, r, col, t, seed = 0) {
  const bx = x + Math.sin(t * 1.3 + seed) * 6, by = y + Math.sin(t * 1.7 + seed * 2) * 5;
  g.strokeStyle = 'rgba(27,20,51,0.7)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(bx, by + r * 1.15); g.quadraticCurveTo(bx + 8, by + r * 2.2, bx - 2, by + r * 3.4); g.stroke();
  g.beginPath(); g.ellipse(bx, by, r, r * 1.18, 0, 0, Math.PI * 2); fillStroke(g, col, 3);
  g.beginPath(); g.ellipse(bx - r * 0.35, by - r * 0.4, r * 0.25, r * 0.38, -0.5, 0, Math.PI * 2); g.fillStyle = 'rgba(255,255,255,0.55)'; g.fill();
  g.beginPath(); g.moveTo(bx - 4, by + r * 1.25); g.lineTo(bx + 4, by + r * 1.25); g.lineTo(bx, by + r * 1.12); g.closePath(); g.fillStyle = col; g.fill();
}
export function sparkle(g, x, y, r, rot = 0, col = '#fff') { star(g, x, y, r, r * 0.25, 4, rot); g.fillStyle = col; g.fill(); }
export function sparkles(g, t, n, seed, area = { x: 0, y: 0, w: W, h: H }, col = '#fff') {
  for (let i = 0; i < n; i++) {
    const life = 0.8, ph = (t + hash(seed + i) * life * 3) % (life * 3); if (ph > life) continue;
    const k = Math.sin(ph / life * Math.PI);
    const x = area.x + hash(seed + i * 5.3 + Math.floor((t + hash(seed + i) * life * 3) / (life * 3))) * area.w, y = area.y + hash(seed + i * 9.1 + Math.floor((t + hash(seed + i) * 2.4) / 2.4)) * area.h;
    sparkle(g, x, y, 4 + 8 * k, ph * 2, col);
  }
}
export function speedLines(g, cx, cy, amt, t, col = 'rgba(255,255,255,0.8)') {
  if (amt <= 0.01) return;
  g.strokeStyle = col; g.lineCap = 'round';
  for (let i = 0; i < 70; i++) {
    const a = hash(i * 3.3) * Math.PI * 2, s = (hash(i * 7.1) + t * (1.5 + hash(i) * 2)) % 1;
    const r0 = 80 + s * 600, len = (30 + 140 * amt) * (0.4 + s);
    g.lineWidth = 1 + 2.5 * hash(i * 2.2) * amt; g.globalAlpha = clamp(amt * 1.2) * (0.3 + 0.7 * s);
    g.beginPath(); g.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); g.lineTo(cx + Math.cos(a) * (r0 + len), cy + Math.sin(a) * (r0 + len)); g.stroke();
  }
  g.globalAlpha = 1;
}
export function floatingHearts(g, t, n, seed, col = '#ff4fd8') {
  for (let i = 0; i < n; i++) {
    const ph = (t * 0.25 + hash(seed + i)) % 1, x = hash(seed + i * 3) * W + Math.sin(t * 2 + i) * 12, y = H + 20 - ph * (H + 60);
    heart(g, x, y, 7 + hash(i) * 6); g.globalAlpha = Math.sin(ph * Math.PI); fillStroke(g, col, 2); g.globalAlpha = 1;
  }
}
/** a coin (rotating) */
export function coin(g, x, y, r, t) {
  const sx = Math.abs(Math.cos(t * 4)) * 0.85 + 0.15;
  g.save(); g.translate(x, y); g.scale(sx, 1);
  circle(g, 0, 0, r); fillStroke(g, '#ffc21a', 3); circle(g, 0, 0, r * 0.65); g.strokeStyle = '#d18a00'; g.lineWidth = 2; g.stroke();
  popText(g, '$', 0, 1, r * 1.0, { font: 'Bowlby', fill: '#d18a00', outline: 0, shadow: false });
  g.restore();
}
export { heart };

// ------------------------------------------------------------------- even set dressing
// Every helper below spaces its items on an even grid across the FULL frame width, so the
// dressing never clusters in the middle. Items are medium-sized and on-theme (an
// electronics store / party): no tiny scattered clutter.
import { drawTV as _tv, drawWasher as _wa, drawFridge as _fr, drawRice as _ri, drawAircon as _ac, drawMicrowave as _mw } from './products.js';
const PRODUCTS = [(g) => _tv(g, 70), (g) => _wa(g, 44), (g) => _fr(g, 24), (g) => _ri(g, 52), (g) => _ac(g, 70), (g) => _mw(g, 56)];
const evenXs = (n, margin = 0) => Array.from({ length: n }, (_, i) => margin + (i + 0.5) * (W - 2 * margin) / n);

/** subtle diamond wallpaper over the whole wall */
export function wallpaper(g, col, alpha, y1 = H, step = 44) {
  g.save(); g.globalAlpha = alpha; g.fillStyle = col;
  for (let y = 0, r = 0; y < y1; y += step / 2, r++) for (let x = (r % 2) * step / 2; x < W + step; x += step) {
    g.beginPath(); g.moveTo(x, y - 6); g.lineTo(x + 6, y); g.lineTo(x, y + 6); g.lineTo(x - 6, y); g.closePath(); g.fill();
  }
  g.restore();
}
/** a string of bulbs across the top; lit = 0..1; they sway on the beat */
export function hangingBulbs(g, t, music, n, y, lit = 1) {
  const xs = evenXs(n);
  g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); g.moveTo(0, y - 18);
  xs.forEach((x) => g.quadraticCurveTo(x - W / n / 2, y - 8, x, y - 18)); g.lineTo(W, y - 18); g.stroke();
  xs.forEach((x, i) => {
    const sw = Math.sin(t * 2 + i) * 0.06 + springHit(music.since(t) - i * 0.02, 12, 6) * 0.12;
    g.save(); g.translate(x, y - 18); g.rotate(sw);
    g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 16); g.stroke();
    rr(g, -5, 14, 10, 7, 2); g.fillStyle = '#555'; g.fill();
    const on = lit * (0.75 + 0.25 * music.pulse(t));
    if (on > 0.05) { g.shadowColor = '#ffe28a'; g.shadowBlur = 22 * on; }
    g.beginPath(); g.ellipse(0, 30, 9, 11, 0, 0, Math.PI * 2);
    g.fillStyle = on > 0.05 ? `rgba(255,${200 + 30 * on | 0},${100 + 60 * on | 0},1)` : '#5a5570'; g.fill();
    g.shadowBlur = 0; g.lineWidth = 2; g.strokeStyle = INK; g.stroke();
    g.restore();
  });
}
/** framed product posters evenly along the wall */
export function posterRow(g, t, music, n, y, h, labels = ['SALE', 'NEW', 'HOT', 'DEALS', '-50%', 'WOW']) {
  const xs = evenXs(n), w = h * 0.78;
  xs.forEach((x, i) => {
    const tilt = Math.sin(i * 2.3) * 0.04 + springHit(music.since(t) - i * 0.02, 12, 7) * 0.03;
    g.save(); g.translate(x, y); g.rotate(tilt);
    rr(g, -w / 2, -h / 2, w, h, 6); fillStroke(g, '#fff', 4);
    rr(g, -w / 2 + 6, -h / 2 + 6, w - 12, h - 12, 3); g.fillStyle = RAINBOW[(i * 3) % RAINBOW.length]; g.fill();
    g.save(); g.translate(0, h * 0.12); PRODUCTS[i % PRODUCTS.length](g); g.restore();
    popText(g, labels[i % labels.length], 0, -h * 0.3, h * 0.15, { fill: '#fff', outline: 4, shadow: false });
    circle(g, 0, -h / 2 - 4, 3); g.fillStyle = INK; g.fill();
    g.restore();
  });
}
/** a full-width shelf with products, each hopping on the beat */
export function shelfRow(g, t, music, y, n = 8, scale = 0.6) {
  rr(g, 10, y, W - 20, 10, 3); fillStroke(g, '#c99b6a', 3);
  for (let k = 0; k < 2; k++) { g.fillStyle = '#a77a4a'; g.fillRect(40 + k * (W - 100), y + 10, 12, 22); }
  evenXs(n, 20).forEach((x, i) => {
    const hop = Math.max(0, springHit(music.since(t) - i * 0.025, 16, 9)) * 6;
    g.save(); g.translate(x, y - hop); g.scale(scale, scale); PRODUCTS[(i + 1) % PRODUCTS.length](g); g.restore();
  });
}
/** pendant lamps evenly across the ceiling, swinging on the beat, casting light cones */
export function pendantLamps(g, t, music, n, floorY, col = '#ff2a4d') {
  evenXs(n).forEach((lx, i) => {
    const a = Math.sin(music.count(t) * Math.PI + i * 0.5) * 0.1;
    g.save(); g.translate(lx, 0); g.rotate(a);
    g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 30); g.stroke();
    g.beginPath(); g.moveTo(-20, 46); g.lineTo(20, 46); g.lineTo(10, 30); g.lineTo(-10, 30); g.closePath(); fillStroke(g, col, 2.5);
    g.globalAlpha = 0.1 + 0.1 * music.pulse(t); g.fillStyle = '#fff6b0';
    g.beginPath(); g.moveTo(-16, 46); g.lineTo(16, 46); g.lineTo(80, floorY); g.lineTo(-80, floorY); g.fill();
    g.restore();
  });
}
/** vertical neon bars evenly across a wall; each lights up in turn with the beat */
export function neonBars(g, t, music, n, y0, y1) {
  const xs = evenXs(n), bi = music.idx(t);
  xs.forEach((x, i) => {
    const on = (bi + i) % 3 === 0 ? 1 : 0.35;
    const c = RAINBOW[(i * 2) % RAINBOW.length];
    g.save(); g.shadowColor = c; g.shadowBlur = 20 * on; rr(g, x - 6, y0, 12, y1 - y0, 6); g.fillStyle = c; g.globalAlpha = 0.35 + 0.65 * on * (0.7 + 0.3 * music.pulse(t)); g.fill(); g.restore();
  });
}
/** speaker stacks evenly along the floor, cones pumping on every kick */
export function speakerRow(g, t, music, n, floorY, s = 1) {
  evenXs(n).forEach((x) => {
    const p = Math.max(music.pulse(t), music.kick(t));
    rr(g, x - 30 * s, floorY - 96 * s, 60 * s, 96 * s, 6); fillStroke(g, '#15112a', 3, '#000');
    for (const [cy, r] of [[-70, 11], [-32, 19]]) { circle(g, x, floorY + cy * s, r * s * (1 + p * 0.16)); fillStroke(g, '#2a2440', 3, '#555'); circle(g, x, floorY + cy * s, r * s * 0.35); g.fillStyle = '#555'; g.fill(); }
  });
}
/** a row of crowd silhouettes along the bottom, bouncing on the beat */
export function silhouettes(g, t, music, n, y, col = 'rgba(10,5,25,0.85)') {
  evenXs(n).forEach((x, i) => {
    const b = Math.abs(Math.sin((music.count(t) + (i % 2) * 0.5) * Math.PI)) * 10;
    g.fillStyle = col;
    circle(g, x, y - 58 - b, 15); g.fill();
    rr(g, x - 20, y - 44 - b, 40, 60, 14); g.fill();
    const up = (music.idx(t) + i) % 2;
    g.strokeStyle = col; g.lineWidth = 9; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x - 16, y - 36 - b); g.lineTo(x - 26, y - (up ? 78 : 20) - b); g.moveTo(x + 16, y - 36 - b); g.lineTo(x + 26, y - (up ? 20 : 78) - b); g.stroke();
  });
}
