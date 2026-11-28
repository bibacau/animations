import { INK, circle, fillStroke, star, clamp, hash } from './core.js';
import { drawLogoWord } from './logo.js';

// Cute animal performers (Pip the shiba pup, Mimi the cat, and a mixed animal crowd).
// Chibi proportions, fur shading, muzzle/nose, inner ears, paw pads, tails, brand-logo shirts.
// Origin = between the feet; ~135px tall at s = 1. Eye centres: EYE (local units).
export const EYE = { x: 12, y: -88 };
export const FACE_Y = -84;

export const SKINS = {
  pip: { species: 'dog', fur: '#f0a03c', mask: '#fff5e4', inner: '#ffd2a0', paw: '#fff5e4', shirt: '#2a5bff', cheek: '#ff6f7d', cap: null },
  mimi: { species: 'cat', fur: '#c9c3d9', mask: '#ffffff', inner: '#ffb3c8', paw: '#ffffff', shirt: '#ff6fb5', cheek: '#ff5f8a', bow: '#7b2cff', lashes: true, stripes: '#a59fbb' },
};
const SPECIES = [
  { species: 'dog', fur: '#e3a050', mask: '#fff3e0', inner: '#ffcfa0', paw: '#fff3e0' },
  { species: 'cat', fur: '#9a98aa', mask: '#ffffff', inner: '#ffb3c8', paw: '#ffffff', stripes: '#7d7b90' },
  { species: 'bunny', fur: '#f7f3fa', mask: '#ffffff', inner: '#ffb3d1', paw: '#ffffff' },
  { species: 'bear', fur: '#a8754a', mask: '#efd2a8', inner: '#7a4f30', paw: '#efd2a8' },
  { species: 'panda', fur: '#ffffff', mask: '#ffffff', inner: '#2b2b3a', paw: '#2b2b3a', patch: '#2b2b3a' },
  { species: 'fox', fur: '#f07a2a', mask: '#ffffff', inner: '#3a2a3a', paw: '#3a2a3a' },
  { species: 'cat', fur: '#f2a654', mask: '#fff6ea', inner: '#ffc1a8', paw: '#fff6ea', stripes: '#d9853a' },
];
const SHIRTS = ['#ff2a4d', '#16b8ff', '#ffd400', '#2ee6a8', '#ff6fb5', '#7b5cff', '#ff8a1a', '#3ea74d'];
export function crowdSkin(i) {
  const sp = SPECIES[i % SPECIES.length];
  return { ...sp, shirt: SHIRTS[(i * 3) % SHIRTS.length], cheek: '#ff6f8a', bow: sp.species === 'cat' && i % 2 ? SHIRTS[(i + 4) % SHIRTS.length] : null, cap: sp.species === 'dog' && i % 3 === 0 ? SHIRTS[(i + 2) % SHIRTS.length] : null, lashes: sp.species === 'cat' || sp.species === 'bunny' };
}

function limb(g, x0, y0, ang, len, col, w = 9) {
  const x1 = x0 + Math.sin(ang) * len, y1 = y0 + Math.cos(ang) * len;
  g.lineCap = 'round';
  g.strokeStyle = INK; g.lineWidth = w + 5; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
  g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
  return [x1, y1];
}
function paw(g, x, y, r, col) {
  circle(g, x, y, r); fillStroke(g, col, 3);
  g.fillStyle = 'rgba(255,140,160,0.75)';
  circle(g, x, y + r * 0.2, r * 0.35); g.fill();
  for (const dx of [-0.45, 0, 0.45]) { circle(g, x + dx * r, y - r * 0.4, r * 0.17); g.fill(); }
}
function fur(g, cx, cy, r, col) {
  const gr = g.createRadialGradient(cx - r * 0.4, cy - r * 0.5, r * 0.1, cx, cy, r * 1.15);
  gr.addColorStop(0, shade(col, 0.35)); gr.addColorStop(0.6, col); gr.addColorStop(1, shade(col, -0.2));
  return gr;
}

function ears(g, sk) {
  const sp = sk.species;
  for (const sx of [-1, 1]) {
    g.save(); g.scale(sx, 1);
    if (sp === 'bunny') {
      g.beginPath(); g.ellipse(14, -128, 9, 26, 0.12, 0, Math.PI * 2); fillStroke(g, sk.fur, 3.5);
      g.beginPath(); g.ellipse(14, -126, 4.5, 19, 0.12, 0, Math.PI * 2); g.fillStyle = sk.inner; g.fill();
    } else if (sp === 'bear' || sp === 'panda') {
      circle(g, 26, -110, 11); fillStroke(g, sp === 'panda' ? sk.patch : sk.fur, 3.5);
      circle(g, 26, -110, 5.5); g.fillStyle = sp === 'panda' ? '#4a4a5a' : sk.inner; g.fill();
    } else {
      const tall = sp === 'fox' ? 34 : sp === 'cat' ? 30 : 27;
      g.beginPath(); g.moveTo(10, -108); g.quadraticCurveTo(16, -108 - tall, 26, -106 - tall * 0.95); g.quadraticCurveTo(36, -100, 33, -88); g.closePath(); fillStroke(g, sk.fur, 3.5);
      g.beginPath(); g.moveTo(16, -106); g.quadraticCurveTo(20, -100 - tall * 0.8, 26, -100 - tall * 0.75); g.quadraticCurveTo(31, -98, 29, -92); g.closePath(); g.fillStyle = sk.inner; g.fill();
    }
    g.restore();
  }
}
function tail(g, sk, t, wag) {
  const sp = sk.species, w = Math.sin(t * 9) * 0.3 * wag;
  g.save(); g.translate(20, -26); g.rotate(w);
  if (sp === 'dog') { g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(22, -6, 26, -30, 10, -34); g.bezierCurveTo(18, -22, 12, -10, 0, -8); g.closePath(); fillStroke(g, sk.fur, 3); g.beginPath(); g.moveTo(12, -31); g.quadraticCurveTo(20, -26, 16, -18); g.lineWidth = 4; g.strokeStyle = sk.mask; g.stroke(); }
  else if (sp === 'cat') { g.lineCap = 'round'; g.strokeStyle = INK; g.lineWidth = 11; g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(26, 0, 22, -36, 36, -44); g.stroke(); g.strokeStyle = sk.fur; g.lineWidth = 6; g.stroke(); }
  else if (sp === 'fox') { g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(34, 6, 40, -30, 22, -44); g.bezierCurveTo(18, -24, 10, -12, 0, -8); g.closePath(); fillStroke(g, sk.fur, 3); g.beginPath(); g.moveTo(22, -44); g.quadraticCurveTo(30, -36, 31, -26); g.quadraticCurveTo(24, -34, 22, -44); g.fillStyle = '#fff'; g.fill(); }
  else if (sp === 'bunny' || sp === 'bear' || sp === 'panda') { circle(g, 4, -2, 8); fillStroke(g, sp === 'panda' ? '#fff' : sk.fur, 3); }
  g.restore();
}

/**
 * o: { x, y, s, skin, armL, armR (0 = down, PI = straight up; outward positive),
 *      legL, legR (swing), squash (1 = normal), lean, face, look:{x,y}, blink (0..1),
 *      eyeScale, t (for animated faces), mouthOpen, flip }
 */
export function drawBuddy(g, o) {
  const sk = o.skin || SKINS.pip;
  const t = o.t || 0;
  g.save();
  g.translate(o.x, o.y); g.scale(o.s || 1, o.s || 1);
  if (o.flip) g.scale(-1, 1);
  g.rotate(o.lean || 0);
  const sq = o.squash ?? 1;
  g.scale(1 / Math.sqrt(sq), sq);
  g.beginPath(); g.ellipse(0, 2, 28, 5.5, 0, 0, Math.PI * 2); g.fillStyle = 'rgba(20,10,40,0.22)'; g.fill();
  tail(g, sk, t, o.face === 'joy' || o.face === 'happy' || o.face === 'stars' ? 1 : 0.3);
  const limbCol = sk.species === 'panda' ? sk.patch : sk.fur;
  // legs with paw feet
  for (const [sx, a] of [[-1, o.legL || 0], [1, o.legR || 0]]) {
    const [fx, fy] = limb(g, sx * 11, -20, a, 13, limbCol, 11);
    g.beginPath(); g.ellipse(fx + sx * 2, fy + 1, 10, 6.5, 0, 0, Math.PI * 2); fillStroke(g, sk.paw, 3);
    g.strokeStyle = 'rgba(27,20,51,0.5)'; g.lineWidth = 1.5; for (const d of [-3, 2]) { g.beginPath(); g.moveTo(fx + sx * 2 + d, fy - 3); g.lineTo(fx + sx * 2 + d, fy + 1); g.stroke(); }
  }
  // arms: short sleeve then furry forearm, padded paw
  const arm = (sd, a) => {
    const ang = sd * (a || 0), x0 = sd * 21, y0 = -52;
    const [ex, ey] = limb(g, x0, y0, ang, 24, limbCol, 10);
    g.lineCap = 'round'; g.strokeStyle = INK; g.lineWidth = 17; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + Math.sin(ang) * 7, y0 + Math.cos(ang) * 7); g.stroke();
    g.strokeStyle = sk.shirt; g.lineWidth = 12; g.stroke();
    paw(g, ex, ey, 7.5, sk.paw);
  };
  arm(-1, o.armL); arm(1, o.armR);
  // torso in a brand-logo shirt
  const sg = g.createLinearGradient(0, -60, 0, -16); sg.addColorStop(0, shade(sk.shirt, 0.25)); sg.addColorStop(1, shade(sk.shirt, -0.15));
  g.beginPath(); g.ellipse(0, -38, 24, 23, 0, 0, Math.PI * 2); fillStroke(g, sg, 3.5);
  g.beginPath(); g.moveTo(-8, -59); g.lineTo(0, -51); g.lineTo(8, -59); g.lineWidth = 3; g.strokeStyle = shade(sk.shirt, -0.35); g.stroke();
  rr_(g, -13, -45, 26, 11, 3); g.fillStyle = '#fff'; g.fill();
  g.save(); if (o.flip) g.scale(-1, 1); drawLogoWord(g, 0, -39.5, 6.2, {}); g.restore();   // never mirrored
  // head
  ears(g, sk);
  const hg = fur(g, 0, -86, 34, sk.fur);
  g.beginPath(); g.ellipse(0, -86, 34, 30, 0, 0, Math.PI * 2); fillStroke(g, hg, 4);
  if (sk.stripes) { g.strokeStyle = sk.stripes; g.lineWidth = 3.5; g.lineCap = 'round'; for (const dx of [-8, 0, 8]) { g.beginPath(); g.moveTo(dx, -115); g.lineTo(dx * 0.8, -104); g.stroke(); } }
  if (sk.species === 'dog' || sk.species === 'fox') {   // pale lower face mask
    g.save(); g.beginPath(); g.ellipse(0, -86, 32, 28, 0, 0, Math.PI * 2); g.clip();
    g.beginPath(); g.moveTo(-34, -64); g.quadraticCurveTo(-30, -92, -12, -90); g.quadraticCurveTo(0, -84, 12, -90); g.quadraticCurveTo(30, -92, 34, -64); g.closePath(); g.fillStyle = sk.mask; g.fill(); g.restore();
  }
  if (sk.species === 'panda') for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(sx * 13, -86, 10, 12, sx * -0.5, 0, Math.PI * 2); g.fillStyle = sk.patch; g.fill(); }
  g.beginPath(); g.ellipse(-14, -104, 8, 4.5, -0.5, 0, Math.PI * 2); g.fillStyle = 'rgba(255,255,255,0.45)'; g.fill();
  if (sk.bow) { for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(22, -110); g.quadraticCurveTo(22 + sx * 15, -124, 22 + sx * 14, -100); g.closePath(); fillStroke(g, sk.bow, 2.5); } circle(g, 22, -110, 4.5); fillStroke(g, shade(sk.bow, 0.2), 2.5); }
  if (sk.cap) { g.beginPath(); g.arc(0, -106, 25, Math.PI, 0); g.closePath(); fillStroke(g, sk.cap, 3); g.beginPath(); g.ellipse(18, -106, 18, 5, 0.1, 0, Math.PI * 2); fillStroke(g, shade(sk.cap, -0.2), 3); circle(g, 0, -131, 3.5); fillStroke(g, '#fff', 2); }
  drawFace(g, o, sk);
  g.restore();
}
const rr_ = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };

export function drawFace(g, o, sk) {
  const face = o.face || 'happy', t = o.t || 0, es = o.eyeScale || 1;
  const lx = (o.look?.x || 0) * 3.5, ly = (o.look?.y || 0) * 3.5;
  const ey = EYE.y, ex0 = EYE.x;
  // blush
  for (const sx of [-1, 1]) {
    const bg = g.createRadialGradient(sx * 22, -74, 1, sx * 22, -74, 9);
    bg.addColorStop(0, sk.cheek + 'bb'); bg.addColorStop(1, sk.cheek + '00');
    g.fillStyle = bg; g.beginPath(); g.ellipse(sx * 22, -74, 10, 6, 0, 0, Math.PI * 2); g.fill();
  }
  // muzzle + nose (cats/bunnies: small; dogs/bears/foxes: bigger)
  const big = sk.species === 'dog' || sk.species === 'bear' || sk.species === 'fox';
  if (big || sk.species === 'panda') { g.beginPath(); g.ellipse(0, -73, 13, 9.5, 0, 0, Math.PI * 2); g.fillStyle = sk.species === 'bear' ? sk.mask : '#ffffff'; g.fill(); g.lineWidth = 2; g.strokeStyle = 'rgba(27,20,51,0.25)'; g.stroke(); }
  g.beginPath(); const nw = big ? 6 : 4;
  g.moveTo(-nw, -79); g.quadraticCurveTo(0, -82, nw, -79); g.quadraticCurveTo(nw * 0.6, -74.5, 0, -73.5); g.quadraticCurveTo(-nw * 0.6, -74.5, -nw, -79);
  g.fillStyle = sk.species === 'cat' || sk.species === 'bunny' ? '#ff8aa8' : '#2b2140'; g.fill();
  circle(g, -nw * 0.3, -79, 1.3); g.fillStyle = 'rgba(255,255,255,0.8)'; g.fill();
  if (sk.species === 'cat') {   // whiskers
    g.strokeStyle = 'rgba(27,20,51,0.55)'; g.lineWidth = 1.5;
    for (const sx of [-1, 1]) for (const d of [-3, 1.5]) { g.beginPath(); g.moveTo(sx * 13, -74 + d); g.lineTo(sx * 30, -76 + d * 1.6); g.stroke(); }
  }
  if (face === 'joy') {
    g.strokeStyle = INK; g.lineWidth = 3.5; g.lineCap = 'round';
    for (const sx of [-1, 1]) { g.beginPath(); g.arc(sx * ex0, ey + 3, 7, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
    g.beginPath(); g.moveTo(-9, -71); g.quadraticCurveTo(0, -52, 9, -71); g.closePath(); fillStroke(g, '#7a1230', 3);
    g.save(); g.clip(); g.beginPath(); g.ellipse(0, -60, 6, 5, 0, 0, Math.PI * 2); g.fillStyle = '#ff7a95'; g.fill(); g.restore();
    return;
  }
  const shock = face === 'shock', surprise = face === 'surprise' || face === 'cosmic', special = face === 'stars' || face === 'hearts';
  const sclera = shock || surprise || special;
  const rx = (shock ? 12 : sclera ? 11 : 7.6) * es, ry = (shock ? 14 : sclera ? 12.5 : 8.8) * es;
  const blink = clamp(o.blink || 0);
  for (const sx of [-1, 1]) {
    const ex = sx * ex0;
    if (blink > 0.7) { g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.arc(ex, ey - 2, 7, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke(); continue; }
    if (!sclera) {
      // big glossy dark animal eyes
      const ig = g.createRadialGradient(ex + lx, ey + ly + 3, 1, ex + lx, ey + ly, ry);
      ig.addColorStop(0, '#5a3a6a'); ig.addColorStop(1, '#16101f');
      g.beginPath(); g.ellipse(ex + lx * 0.5, ey + ly * 0.5, rx, ry * (1 - blink * 0.9), 0, 0, Math.PI * 2); g.fillStyle = ig; g.fill();
      circle(g, ex + lx * 0.5 - rx * 0.35, ey + ly * 0.5 - ry * 0.35, rx * 0.38); g.fillStyle = '#fff'; g.fill();
      circle(g, ex + lx * 0.5 + rx * 0.35, ey + ly * 0.5 + ry * 0.35, rx * 0.16); g.fill();
    } else {
      g.beginPath(); g.ellipse(ex, ey, rx, ry, 0, 0, Math.PI * 2); fillStroke(g, '#fff', 3);
      if (face === 'cosmic') {   // hypnotic rainbow iris with the brand logo at its very centre
        g.save(); g.beginPath(); g.ellipse(ex, ey, rx, ry, 0, 0, Math.PI * 2); g.clip();
        const cols = ['#ff2a4d', '#ffd400', '#16e0ff', '#b4ff1e', '#ff4fd8', '#7b2cff'];
        const off = (t * 3) % 1;
        for (let k = 14; k >= 0; k--) { const r2 = (k + 1 - off) / 14 * ry * 1.05; g.beginPath(); g.ellipse(ex, ey, r2 * rx / ry, r2, 0, 0, Math.PI * 2); g.fillStyle = cols[(k + Math.floor(t * 3)) % cols.length]; g.fill(); }
        for (let k = 0; k < 6; k++) { const a = t * 4 + k * Math.PI / 3; g.beginPath(); g.moveTo(ex, ey); g.arc(ex, ey, ry * 1.1, a, a + 0.25); g.closePath(); g.fillStyle = 'rgba(255,255,255,0.25)'; g.fill(); }
        circle(g, ex, ey, ry * 0.2); g.fillStyle = '#fff'; g.fill();
        drawLogoWord(g, ex, ey, ry * 0.045, {});
        g.restore();
        g.beginPath(); g.ellipse(ex, ey, rx, ry, 0, 0, Math.PI * 2); g.lineWidth = 3; g.strokeStyle = INK; g.stroke();
      } else if (face === 'stars') { star(g, ex + lx, ey + ly, 8 * es, 3.6 * es, 5, t * 6); fillStroke(g, '#ffd400', 2); }
      else if (face === 'hearts') { heart(g, ex + lx, ey + ly + 1, 7 * es * (1 + 0.15 * Math.sin(t * 20))); fillStroke(g, '#ff2a6d', 2); }
      else {
        const pr = (shock ? 3 : 6) * es;
        circle(g, ex + lx, ey + ly + 1, pr); g.fillStyle = INK; g.fill();
        circle(g, ex + lx - pr * 0.35, ey + ly - pr * 0.3, pr * 0.4); g.fillStyle = '#fff'; g.fill();
      }
    }
    if (sk.lashes && !shock) {
      g.strokeStyle = INK; g.lineWidth = 2.2; g.lineCap = 'round';
      for (let k = 0; k < 2; k++) { const a = -0.55 - k * 0.45; g.beginPath(); g.moveTo(ex + sx * Math.cos(a) * rx, ey + Math.sin(a) * ry); g.lineTo(ex + sx * Math.cos(a) * (rx + 5), ey + Math.sin(a) * (ry + 5)); g.stroke(); }
    }
  }
  if (shock || surprise) {   // brows up
    g.strokeStyle = INK; g.lineWidth = 3.5; g.lineCap = 'round';
    for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(sx * 5, ey - ry - 5); g.lineTo(sx * 18, ey - ry - 9 - (shock ? 3 : 0)); g.stroke(); }
  }
  // mouth under the nose
  if (shock) { g.beginPath(); g.ellipse(0, -63, 7, 9 + (o.mouthOpen || 0) * 3, 0, 0, Math.PI * 2); fillStroke(g, '#5a0f22', 3); }
  else if (surprise) { g.beginPath(); g.ellipse(0, -66, 4.5, 5.5, 0, 0, Math.PI * 2); fillStroke(g, '#5a0f22', 2.5); }
  else {
    g.strokeStyle = INK; g.lineWidth = 2.5; g.lineCap = 'round';
    g.beginPath(); g.moveTo(0, -73.5); g.lineTo(0, -70); g.stroke();
    g.beginPath(); g.arc(-4, -70, 4, 0.1 * Math.PI, 0.9 * Math.PI); g.stroke();
    g.beginPath(); g.arc(4, -70, 4, 0.1 * Math.PI, 0.9 * Math.PI); g.stroke();
    if (face !== 'stars') { g.beginPath(); g.ellipse(0, -65.5, 3, 2.5, 0, 0, Math.PI); g.fillStyle = '#ff7a95'; g.fill(); }
  }
  if (shock) {   // sweat drop + shock lines
    g.beginPath(); const dx = 32, dy = -100 + ((t * 40) % 10);
    g.moveTo(dx, dy - 10); g.quadraticCurveTo(dx + 7, dy, dx, dy + 5); g.quadraticCurveTo(dx - 7, dy, dx, dy - 10); fillStroke(g, '#7fdcff', 2.5);
    g.strokeStyle = '#3b6cff'; g.lineWidth = 3;
    for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * 7, -114); g.lineTo(i * 7, -103); g.stroke(); }
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
  const sk = SKINS.pip;   // Pip's own body (puppy legs, paws, tail, brand shirt) with a TV for a head
  tail(g, sk, o.t || 0, 1);
  for (const [sx, a] of [[-1, o.legL || 0], [1, o.legR || 0]]) { const [fx, fy] = limb(g, sx * 12, -18, a, 16, sk.fur, 11); g.beginPath(); g.ellipse(fx + sx * 2, fy + 1, 10, 6.5, 0, 0, Math.PI * 2); fillStroke(g, sk.paw, 3); }
  for (const [sx, a] of [[-1, o.armL || 0], [1, o.armR || 0]]) { const [hx, hy] = limb(g, sx * 22, -52, sx * a, 26, sk.fur, 10); paw(g, hx, hy, 7.5, sk.paw); }
  const sg = g.createLinearGradient(0, -64, 0, -14); sg.addColorStop(0, shade(sk.shirt, 0.25)); sg.addColorStop(1, shade(sk.shirt, -0.15));
  g.beginPath(); g.roundRect(-24, -64, 48, 50, 16); fillStroke(g, sg, 4);
  rr_(g, -14, -46, 28, 12, 3); g.fillStyle = '#fff'; g.fill(); drawLogoWord(g, 0, -40, 6.5, {});
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

/**
 * A realistic cartoon hand (right hand, palm towards camera, fingers pointing along -x).
 * grip: 0 = open/reaching, 1 = fingers curled round an object at the origin.
 * Draw the gripped object first, then this, so the fingers wrap over it.
 */
export function drawHand(g, x, y, s, grip, rot = 0, skin = '#f2c29b') {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  const dark = shade(skin, -0.22), INKH = '#3a2430';
  const sg = (x0, y0, x1, y1) => { const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, shade(skin, 0.18)); gr.addColorStop(1, dark); return gr; };
  // palm (sits to the right of the grip point)
  g.beginPath(); g.moveTo(10, -20); g.quadraticCurveTo(42, -24, 48, -6); g.quadraticCurveTo(50, 16, 36, 22); g.quadraticCurveTo(14, 26, 8, 14); g.closePath();
  g.fillStyle = sg(10, -20, 40, 24); g.fill(); g.lineWidth = 2.5; g.strokeStyle = INKH; g.stroke();
  // four fingers: straight when open, curled (short arcs over the object) when gripping
  const fingers = [[-15, 13], [-5, 15], [5, 14], [14, 11]];   // [y offset, length]
  fingers.forEach(([fy, len], i) => {
    const L = len * (1 - grip * 0.55);
    const bx = 12, by = fy;
    g.save(); g.translate(bx, by);
    if (grip < 0.5) {
      g.beginPath(); g.roundRect(-L - 4, -4.2, L + 6, 8.4, 4.2); g.fillStyle = sg(-L, -4, 0, 4); g.fill(); g.lineWidth = 2; g.strokeStyle = INKH; g.stroke();
      g.beginPath(); g.ellipse(-L - 0.5, 0, 2.6, 2.2, 0, 0, Math.PI * 2); g.fillStyle = 'rgba(255,235,225,0.9)'; g.fill();
      g.strokeStyle = 'rgba(58,36,48,0.4)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-L * 0.45, -3); g.lineTo(-L * 0.45, 3); g.stroke();
    } else {
      // curled: the finger wraps forward over the object, tip tucked back toward the palm
      g.beginPath(); g.moveTo(2, -4.2); g.quadraticCurveTo(-L - 12, -6, -L - 10, 3); g.quadraticCurveTo(-L - 6, 7, -4, 4.2); g.closePath();
      g.fillStyle = sg(-L - 10, -6, 0, 6); g.fill(); g.lineWidth = 2; g.strokeStyle = INKH; g.stroke();
      g.strokeStyle = 'rgba(58,36,48,0.45)'; g.lineWidth = 1.2; g.beginPath(); g.arc(-L * 0.6, 0, 3, -1.2, 1.2); g.stroke();
    }
    g.restore();
  });
  // thumb: along the bottom, wrapping under when gripping
  // open: thumb hangs along the bottom; gripping: it folds across the front of the curled fingers
  g.save(); g.translate(18 - grip * 6, 18 - grip * 6); g.rotate(-0.5 + grip * 0.15);
  g.beginPath(); g.roundRect(-22 + grip * 4, -5, 26 - grip * 4, 10, 5); g.fillStyle = sg(-22, -5, 4, 5); g.fill(); g.lineWidth = 2; g.strokeStyle = INKH; g.stroke();
  g.beginPath(); g.ellipse(-19, 0, 3, 2.6, 0, 0, Math.PI * 2); g.fillStyle = 'rgba(255,235,225,0.9)'; g.fill();
  g.restore();
  // knuckle creases on the palm
  g.strokeStyle = 'rgba(58,36,48,0.35)'; g.lineWidth = 1.4;
  g.beginPath(); g.moveTo(22, -12); g.quadraticCurveTo(30, -4, 26, 8); g.stroke();
  g.beginPath(); g.moveTo(32, -14); g.quadraticCurveTo(38, 0, 34, 14); g.stroke();
  g.restore();
}
/** an arm reaching in from (x0, y0) (off-screen) to the wrist at (x1, y1): sleeve + forearm */
export function drawArm(g, x0, y0, x1, y1, s = 1, sleeve = '#2a5bff', skin = '#f2c29b') {
  const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
  g.save(); g.translate(x0, y0); g.rotate(a);
  const fore = Math.min(len, 150 * s);
  // sleeve from the edge up to the forearm
  g.beginPath(); g.roundRect(-40, -22 * s, Math.max(0, len - fore) + 50, 44 * s, 18 * s); g.fillStyle = sleeve; g.fill(); g.lineWidth = 3; g.strokeStyle = INK; g.stroke();
  // forearm (skin) tapering to the wrist
  const fx = len - fore;
  const gr = g.createLinearGradient(0, -16 * s, 0, 16 * s); gr.addColorStop(0, shade(skin, 0.15)); gr.addColorStop(1, shade(skin, -0.2));
  g.beginPath(); g.moveTo(fx, -16 * s); g.quadraticCurveTo(fx + fore * 0.5, -18 * s, len, -11 * s); g.lineTo(len, 11 * s); g.quadraticCurveTo(fx + fore * 0.5, 18 * s, fx, 16 * s); g.closePath();
  g.fillStyle = gr; g.fill(); g.lineWidth = 2.5; g.strokeStyle = '#3a2430'; g.stroke();
  // cuff
  g.beginPath(); g.roundRect(fx - 10, -21 * s, 16, 42 * s, 6); g.fillStyle = shade(sleeve, 0.3); g.fill(); g.lineWidth = 2.5; g.strokeStyle = INK; g.stroke();
  g.restore();
}
