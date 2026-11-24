// 2D cartoon performers. Origin = between the feet. Body ~110px tall at s = 1.
import { INK, circle, fillStroke, star, clamp, hash } from './core.js';

export const SKINS = {
  pip: { body: '#ff7a1a', belly: '#ffd27a', accent: '#16e0ff', cheek: '#ff4f6d' },
  mimi: { body: '#ff6fb5', belly: '#ffe3f2', accent: '#ffd400', cheek: '#ff2a6d', ears: true, bow: '#7b2cff' },
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
  // legs
  const legCol = INK;
  for (const [sx, a] of [[-1, o.legL || 0], [1, o.legR || 0]]) {
    const [fx, fy] = limb(g, sx * 14, -16, a, 16, '#2b2140', 9);
    g.fillStyle = '#2b2140'; g.beginPath(); g.ellipse(fx + sx * 3, fy + 2, 10, 6, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = legCol; g.lineWidth = 2.5; g.stroke();
  }
  // arms behind body
  const armA = (side, a) => limb(g, side * 30, -58, side * (a || 0), 30, sk.body, 9);
  const handL = armA(-1, o.armL), handR = armA(1, o.armR);
  for (const [hx, hy] of [handL, handR]) { circle(g, hx, hy, 7); fillStroke(g, '#fff', 3); }
  // ears / antenna
  if (sk.ears) {
    for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(sx * 12, -96); g.lineTo(sx * 30, -122); g.lineTo(sx * 32, -88); g.closePath(); fillStroke(g, sk.body, 3.5); g.beginPath(); g.moveTo(sx * 17, -97); g.lineTo(sx * 28, -113); g.lineTo(sx * 28, -93); g.closePath(); g.fillStyle = sk.belly; g.fill(); }
  } else {
    g.strokeStyle = INK; g.lineWidth = 3.5; g.beginPath(); g.moveTo(0, -98); g.quadraticCurveTo(6, -112, 2, -122); g.stroke();
    circle(g, 2, -125, 7); fillStroke(g, sk.accent, 3);
    circle(g, 0, -127, 2.5); g.fillStyle = 'rgba(255,255,255,0.8)'; g.fill();
  }
  // body
  g.beginPath(); g.ellipse(0, -56, 36, 45, 0, 0, Math.PI * 2); fillStroke(g, sk.body, 4);
  g.beginPath(); g.ellipse(0, -36, 22, 20, 0, 0, Math.PI * 2); g.fillStyle = sk.belly; g.fill();
  g.beginPath(); g.ellipse(-14, -82, 9, 6, -0.6, 0, Math.PI * 2); g.fillStyle = 'rgba(255,255,255,0.45)'; g.fill();
  if (sk.bow) { g.fillStyle = sk.bow; for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(22, -95); g.lineTo(22 + sx * 13, -103); g.lineTo(22 + sx * 13, -87); g.closePath(); fillStroke(g, sk.bow, 2.5); } circle(g, 22, -95, 4); fillStroke(g, sk.bow, 2.5); }
  if (sk.hat) { g.beginPath(); g.moveTo(-14, -97); g.lineTo(0, -128); g.lineTo(14, -97); g.closePath(); fillStroke(g, sk.accent, 3); circle(g, 0, -130, 4); fillStroke(g, '#fff', 2); }
  drawFace(g, o, sk);
  g.restore();
}

export function drawFace(g, o, sk) {
  const face = o.face || 'happy', t = o.t || 0, es = o.eyeScale || 1;
  const lx = (o.look?.x || 0) * 4, ly = (o.look?.y || 0) * 4;
  const ey = -66;
  // cheeks
  g.fillStyle = sk.cheek + '88';
  for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(sx * 24, -52, 7, 4.5, 0, 0, Math.PI * 2); g.fill(); }
  if (face === 'joy') {
    g.strokeStyle = INK; g.lineWidth = 4; g.lineCap = 'round';
    for (const sx of [-1, 1]) { g.beginPath(); g.arc(sx * 13, ey + 3, 8, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
    g.beginPath(); g.moveTo(-15, -50); g.quadraticCurveTo(0, -24, 15, -50); g.closePath(); fillStroke(g, '#8a1030', 3);
    g.beginPath(); g.ellipse(0, -36, 7, 4, 0, 0, Math.PI * 2); g.fillStyle = '#ff6f8a'; g.fill();
    return;
  }
  const shock = face === 'shock', surprise = face === 'surprise' || face === 'cosmic';
  const rx = (shock ? 14 : surprise ? 12.5 : 10.5) * es, ry = (shock ? 17 : surprise ? 15 : 12.5) * es;
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
      const pr = shock ? 3 : surprise ? 5.5 : 6;
      circle(g, ex + lx, ey + ly + 1, pr * es); g.fillStyle = INK; g.fill();
      circle(g, ex + lx - pr * 0.35, ey + ly - pr * 0.3, pr * 0.38 * es); g.fillStyle = '#fff'; g.fill();
    }
  }
  if (shock || surprise) {   // brows up
    g.strokeStyle = INK; g.lineWidth = 4; g.lineCap = 'round';
    for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(sx * 6, ey - ry - 6); g.lineTo(sx * 20, ey - ry - 10 - (shock ? 3 : 0)); g.stroke(); }
  }
  // mouth
  if (shock) { g.beginPath(); g.ellipse(0, -36, 9, 13 + (o.mouthOpen || 0) * 4, 0, 0, Math.PI * 2); fillStroke(g, '#5a0f22', 3); }
  else if (surprise) { g.beginPath(); g.ellipse(0, -40, 6, 7, 0, 0, Math.PI * 2); fillStroke(g, '#5a0f22', 3); }
  else { g.strokeStyle = INK; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.arc(0, -46, 10, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke(); }
  if (shock) {   // sweat drop + shock lines
    g.beginPath(); const dx = 34, dy = -84 + ((t * 40) % 10);
    g.moveTo(dx, dy - 10); g.quadraticCurveTo(dx + 7, dy, dx, dy + 5); g.quadraticCurveTo(dx - 7, dy, dx, dy - 10); fillStroke(g, '#7fdcff', 2.5);
    g.strokeStyle = '#3b6cff'; g.lineWidth = 3;
    for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * 7, -100); g.lineTo(i * 7, -88); g.stroke(); }
  }
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
