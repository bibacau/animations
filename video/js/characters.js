// 2D cartoon performers. Origin = between the feet. Body ~110px tall at s = 1.
import { INK, circle, fillStroke, star, clamp, hash } from './core.js';

export const SKINS = {
  pip: { body: '#ff7a1a', belly: '#ffe1a6', accent: '#16e0ff', cheek: '#ff4f6d', shoe: '#2a5bff' },
  mimi: { body: '#ff6fb5', belly: '#ffe3f2', accent: '#ffd400', cheek: '#ff2a6d', ears: true, bow: '#7b2cff', shoe: '#7b2cff' },
};
const CROWD = ['#ff7a1a', '#16e0ff', '#b4ff1e', '#ff6fb5', '#ffd400', '#9b6bff', '#2ee6a8', '#ff4f4f', '#5aa8ff'];
export function crowdSkin(i) {
  const b = CROWD[i % CROWD.length];
  return { body: b, belly: '#fff3d6', accent: CROWD[(i + 3) % CROWD.length], cheek: '#ff4f6d', ears: i % 4 === 1, bow: i % 4 === 1 ? CROWD[(i + 5) % CROWD.length] : null, hat: i % 5 === 2 };
}

function limb(g, x0, y0, ang, len, col, w = 9) {
  const x1 = x0 + Math.sin(ang) * len, y1 = y0 + Math.cos(ang) * len;
  g.lineCap = 'round';
  g.strokeStyle = INK; g.lineWidth = w + 5; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
  g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
  return [x1, y1];
}

/**
 * o: { x, y, s, skin, armL, armR (0 = down, PI = straight up; outward positive),
 *      legL, legR (swing), squash (1 = normal), lean, face, look:{x,y}, blink (0..1),
 *      eyeScale, t (for animated faces), mouthOpen }
 */
export function drawBuddy(g, o) {
  const sk = o.skin || SKINS.pip;
  g.save();
  g.translate(o.x, o.y); g.scale(o.s || 1, o.s || 1);
  if (o.flip) g.scale(-1, 1);
  g.rotate(o.lean || 0);
  const sq = o.squash ?? 1;
  g.scale(1 / Math.sqrt(sq), sq);
  // soft ground shadow
  g.beginPath(); g.ellipse(0, 3, 30, 6, 0, 0, Math.PI * 2); g.fillStyle = 'rgba(20,10,40,0.22)'; g.fill();
  // stubby legs + little sneakers (coloured with a white toe cap and sole)
  for (const [sx, a] of [[-1, o.legL || 0], [1, o.legR || 0]]) {
    const [fx, fy] = limb(g, sx * 13, -18, a, 13, shade(sk.body, -0.25), 10);
    g.beginPath(); g.ellipse(fx + sx * 4, fy + 2, 12, 7.5, 0, 0, Math.PI * 2); fillStroke(g, sk.shoe || sk.accent, 3);
    g.beginPath(); g.ellipse(fx + sx * 9, fy + 1, 5, 4.5, 0, 0, Math.PI * 2); g.fillStyle = '#fff'; g.fill();
    g.fillStyle = 'rgba(255,255,255,0.9)'; g.fillRect(fx + sx * 4 - 10, fy + 6, 20, 2.5);
  }
  // arms behind the body, round mitten hands with a thumb
  const armA = (side, a) => limb(g, side * 31, -56, side * (a || 0), 27, sk.body, 10);
  const hands = [[-1, armA(-1, o.armL)], [1, armA(1, o.armR)]];
  for (const [sd, [hx, hy]] of hands) {
    circle(g, hx + sd * 5, hy - 3, 4.5); fillStroke(g, '#fff', 2.5);
    circle(g, hx, hy, 8.5); fillStroke(g, '#fff', 3);
  }
  // ears / antenna (glowing bulb)
  if (sk.ears) {
    for (const sx of [-1, 1]) {
      g.beginPath(); g.moveTo(sx * 10, -95); g.quadraticCurveTo(sx * 26, -128, sx * 34, -118); g.quadraticCurveTo(sx * 38, -100, sx * 31, -84); g.closePath(); fillStroke(g, sk.body, 3.5);
      g.beginPath(); g.moveTo(sx * 15, -96); g.quadraticCurveTo(sx * 26, -118, sx * 31, -112); g.quadraticCurveTo(sx * 33, -100, sx * 28, -90); g.closePath(); g.fillStyle = '#ffb3d6'; g.fill();
    }
  } else {
    g.strokeStyle = INK; g.lineWidth = 3.5; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, -99); g.quadraticCurveTo(7, -113, 3, -123); g.stroke();
    g.save(); g.shadowColor = sk.accent; g.shadowBlur = 12; circle(g, 3, -127, 7.5); fillStroke(g, sk.accent, 3); g.restore();
    circle(g, 0.5, -129.5, 2.6); g.fillStyle = 'rgba(255,255,255,0.9)'; g.fill();
  }
  // body: soft shaded bean
  const gr = g.createRadialGradient(-14, -84, 6, 0, -56, 52);
  gr.addColorStop(0, shade(sk.body, 0.35)); gr.addColorStop(0.55, sk.body); gr.addColorStop(1, shade(sk.body, -0.18));
  g.beginPath(); g.ellipse(0, -56, 38, 45, 0, 0, Math.PI * 2); fillStroke(g, gr, 4);
  g.beginPath(); g.ellipse(0, -33, 21, 17, 0, 0, Math.PI * 2); g.fillStyle = sk.belly; g.fill();
  heart(g, 0, -31, 5); g.fillStyle = shade(sk.cheek, 0.1); g.fill();
  g.beginPath(); g.ellipse(-16, -84, 9, 5.5, -0.6, 0, Math.PI * 2); g.fillStyle = 'rgba(255,255,255,0.55)'; g.fill();
  circle(g, -6, -92, 2.2); g.fill();
  if (sk.bow) { for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(24, -93); g.quadraticCurveTo(24 + sx * 16, -108, 24 + sx * 15, -84); g.closePath(); fillStroke(g, sk.bow, 2.5); } circle(g, 24, -93, 4.5); fillStroke(g, shade(sk.bow, 0.2), 2.5); }
  if (sk.hat) { g.beginPath(); g.moveTo(-15, -96); g.lineTo(0, -130); g.lineTo(15, -96); g.closePath(); fillStroke(g, sk.accent, 3); for (let i = 0; i < 3; i++) { circle(g, -6 + i * 6, -104 + (i % 2) * 8, 2.2); g.fillStyle = '#fff'; g.fill(); } circle(g, 0, -132, 4.5); fillStroke(g, '#fff', 2); }
  drawFace(g, o, sk);
  g.restore();
}

export function drawFace(g, o, sk) {
  const face = o.face || 'happy', t = o.t || 0, es = o.eyeScale || 1;
  const lx = (o.look?.x || 0) * 4, ly = (o.look?.y || 0) * 4;
  const ey = -66;
  // soft blush
  for (const sx of [-1, 1]) {
    const bg = g.createRadialGradient(sx * 25, -50, 1, sx * 25, -50, 10);
    bg.addColorStop(0, sk.cheek + 'cc'); bg.addColorStop(1, sk.cheek + '00');
    g.fillStyle = bg; g.beginPath(); g.ellipse(sx * 25, -50, 11, 7, 0, 0, Math.PI * 2); g.fill();
  }
  if (face === 'joy') {
    g.strokeStyle = INK; g.lineWidth = 4; g.lineCap = 'round';
    for (const sx of [-1, 1]) { g.beginPath(); g.arc(sx * 13, ey + 3, 8, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
    g.beginPath(); g.moveTo(-15, -50); g.quadraticCurveTo(0, -24, 15, -50); g.closePath(); fillStroke(g, '#8a1030', 3);
    g.beginPath(); g.ellipse(0, -36, 7, 4, 0, 0, Math.PI * 2); g.fillStyle = '#ff6f8a'; g.fill();
    return;
  }
  const shock = face === 'shock', surprise = face === 'surprise' || face === 'cosmic';
  const rx = (shock ? 14 : surprise ? 13 : 12) * es, ry = (shock ? 17 : surprise ? 15.5 : 14) * es;
  const blink = clamp(o.blink || 0);
  for (const sx of [-1, 1]) {
    const ex = sx * 13;
    g.beginPath(); g.ellipse(ex, ey, rx, ry * (1 - blink * 0.9), 0, 0, Math.PI * 2); fillStroke(g, '#fff', 3.5);
    if (blink > 0.7) continue;
    if (face === 'cosmic') {   // hypnotic rainbow iris with T-POT at the very centre (for the eye dive)
      g.save(); g.beginPath(); g.ellipse(ex, ey, rx, ry, 0, 0, Math.PI * 2); g.clip();
      const cols = ['#ff2a4d', '#ffd400', '#16e0ff', '#b4ff1e', '#ff4fd8', '#7b2cff'];
      const off = (t * 3) % 1;
      for (let k = 14; k >= 0; k--) {
        const rr_ = (k + 1 - off) / 14 * ry * 1.05;
        g.beginPath(); g.ellipse(ex + lx * 0.3, ey, rr_ * rx / ry, rr_, 0, 0, Math.PI * 2);
        g.fillStyle = cols[(k + Math.floor(t * 3)) % cols.length]; g.fill();
      }
      for (let k = 0; k < 6; k++) { const a = t * 4 + k * Math.PI / 3; g.beginPath(); g.moveTo(ex, ey); g.arc(ex, ey, ry * 1.1, a, a + 0.25); g.closePath(); g.fillStyle = 'rgba(255,255,255,0.25)'; g.fill(); }
      circle(g, ex, ey, ry * 0.16); g.fillStyle = '#fff'; g.fill();
      g.font = `${ry * 0.07}px Bowlby, Impact`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#e41b24'; g.fillText('T-POT', ex, ey);
      g.restore();
      g.beginPath(); g.ellipse(ex, ey, rx, ry, 0, 0, Math.PI * 2); g.lineWidth = 3.5; g.strokeStyle = INK; g.stroke();
      continue;
    }
    if (face === 'stars') { star(g, ex + lx, ey + ly, 9 * es, 4 * es, 5, t * 6); fillStroke(g, '#ffd400', 2); }
    else if (face === 'hearts') { heart(g, ex + lx, ey + ly + 1, 8 * es * (1 + 0.15 * Math.sin(t * 20))); fillStroke(g, '#ff2a6d', 2); }
    else {
      // big glossy iris with two highlights
      const pr = (shock ? 3.2 : surprise ? 6.5 : 8.2) * es;
      const ig = g.createRadialGradient(ex + lx, ey + ly + 3, 1, ex + lx, ey + ly + 1, pr);
      ig.addColorStop(0, shock ? INK : '#5a3a8a'); ig.addColorStop(1, INK);
      circle(g, ex + lx, ey + ly + 1, pr); g.fillStyle = ig; g.fill();
      circle(g, ex + lx - pr * 0.35, ey + ly - pr * 0.32, pr * 0.4); g.fillStyle = '#fff'; g.fill();
      circle(g, ex + lx + pr * 0.38, ey + ly + pr * 0.4, pr * 0.18); g.fill();
    }
    if (sk.ears && !shock) {   // lashes
      g.strokeStyle = INK; g.lineWidth = 2.5; g.lineCap = 'round';
      for (let k = 0; k < 2; k++) { const a = -0.5 - k * 0.45; g.beginPath(); g.moveTo(ex + sx * Math.cos(a) * rx, ey + Math.sin(a) * ry); g.lineTo(ex + sx * Math.cos(a) * (rx + 6), ey + Math.sin(a) * (ry + 6)); g.stroke(); }
    }
  }
  if (shock || surprise) {   // brows up
    g.strokeStyle = INK; g.lineWidth = 4; g.lineCap = 'round';
    for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(sx * 6, ey - ry - 6); g.lineTo(sx * 20, ey - ry - 10 - (shock ? 3 : 0)); g.stroke(); }
  }
  // mouth
  if (shock) { g.beginPath(); g.ellipse(0, -36, 9, 13 + (o.mouthOpen || 0) * 4, 0, 0, Math.PI * 2); fillStroke(g, '#5a0f22', 3); }
  else if (surprise) { g.beginPath(); g.ellipse(0, -40, 6, 7, 0, 0, Math.PI * 2); fillStroke(g, '#5a0f22', 3); }
  else {   // small open smile with a tongue
    g.beginPath(); g.moveTo(-8, -46); g.quadraticCurveTo(0, -33, 8, -46); g.closePath(); fillStroke(g, '#7a1230', 3);
    g.save(); g.clip(); circle(g, 0, -36, 5); g.fillStyle = '#ff7a95'; g.fill(); g.restore();
  }
  if (shock) {   // sweat drop + shock lines
    g.beginPath(); const dx = 34, dy = -84 + ((t * 40) % 10);
    g.moveTo(dx, dy - 10); g.quadraticCurveTo(dx + 7, dy, dx, dy + 5); g.quadraticCurveTo(dx - 7, dy, dx, dy - 10); fillStroke(g, '#7fdcff', 2.5);
    g.strokeStyle = '#3b6cff'; g.lineWidth = 3;
    for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * 7, -100); g.lineTo(i * 7, -88); g.stroke(); }
  }
}

/** lighten (amt > 0) or darken (amt < 0) a #rrggbb colour */
export function shade(hex, amt) {
  const n = parseInt(hex.slice(1, 7), 16);
  const f = (c) => Math.round(amt > 0 ? c + (255 - c) * amt : c * (1 + amt));
  return '#' + [n >> 16, (n >> 8) & 255, n & 255].map((c) => f(c).toString(16).padStart(2, '0')).join('');
}

export function heart(g, x, y, r) {
  g.beginPath(); g.moveTo(x, y + r * 0.9);
  g.bezierCurveTo(x - r * 1.6, y - r * 0.2, x - r * 0.6, y - r * 1.4, x, y - r * 0.45);
  g.bezierCurveTo(x + r * 0.6, y - r * 1.4, x + r * 1.6, y - r * 0.2, x, y + r * 0.9);
  g.closePath();
}

/** poses: helper that returns limb angles for named actions at beat-phase p */
export function pose(name, p = 0, amt = 1) {
  const s = Math.sin(p * Math.PI * 2);
  switch (name) {
    case 'walk': return { armL: s * 0.7, armR: -s * 0.7, legL: s * 0.6, legR: -s * 0.6, squash: 1 - Math.abs(s) * 0.04 };
    case 'jump': return { armL: 2.6, armR: 2.6, legL: -0.5, legR: 0.5, squash: 1.12 };
    case 'land': return { armL: 1.2, armR: 1.2, legL: -0.4, legR: 0.4, squash: 1 - 0.3 * amt };
    case 'cheer': return { armL: 2.8 + s * 0.2, armR: 2.8 - s * 0.2, legL: -0.15, legR: 0.15, squash: 1 + Math.abs(s) * 0.05 };
    case 'wave': return { armL: 0.25, armR: 2.3 + s * 0.6, legL: 0, legR: 0, squash: 1 - Math.max(0, -s) * 0.05 };
    case 'shock': return { armL: 1.6, armR: 1.6, legL: -0.3, legR: 0.3, squash: 1.06 };
    case 'fly': return { armL: 2.9, armR: 2.9, legL: 0.5, legR: 0.7, squash: 1.1 };
    default: return { armL: 0.2 + s * 0.05, armR: 0.2 - s * 0.05, legL: 0, legR: 0, squash: 1 - Math.abs(s) * 0.03 };
  }
}

/** a body whose head is a TV; screen(g, w, h) draws the screen contents */
export function drawTVBuddy(g, o) {
  g.save(); g.translate(o.x, o.y); g.scale(o.s || 1, o.s || 1);
  const col = '#2b2140';
  for (const [sx, a] of [[-1, o.legL || 0], [1, o.legR || 0]]) { const [fx, fy] = limb(g, sx * 14, -16, a, 18, col, 9); g.fillStyle = col; g.beginPath(); g.ellipse(fx + sx * 3, fy + 2, 10, 6, 0, 0, Math.PI * 2); g.fill(); }
  g.beginPath(); g.roundRect(-22, -62, 44, 48, 12); fillStroke(g, '#ff7a1a', 4);
  for (const [sx, a] of [[-1, o.armL || 0], [1, o.armR || 0]]) { const [hx, hy] = limb(g, sx * 22, -54, sx * a, 28, '#ff7a1a', 9); circle(g, hx, hy, 7); fillStroke(g, '#fff', 3); }
  // TV head
  g.save(); g.translate(0, -62); g.rotate(o.headTilt || 0);
  g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.moveTo(-8, -64); g.lineTo(-18, -84); g.moveTo(8, -64); g.lineTo(18, -84); g.stroke();
  g.beginPath(); g.roundRect(-52, -66, 104, 68, 10); fillStroke(g, '#2a2440', 4);
  g.save(); g.beginPath(); g.roundRect(-44, -58, 88, 52, 6); g.clip(); o.screen(g, -44, -58, 88, 52); g.restore();
  g.beginPath(); g.roundRect(-44, -58, 88, 52, 6); g.lineWidth = 2; g.strokeStyle = '#111'; g.stroke();
  g.restore();
  g.restore();
}

/** idle blink helper: returns 0..1 blink amount, a quick blink every few seconds */
export function blinkAt(t, seed = 0) { const p = (t + hash(seed) * 3) % 3.1; return p < 0.12 ? Math.sin(p / 0.12 * Math.PI) : 0; }
