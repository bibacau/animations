// Set dressing: themed props that fill empty floors and skies, all beat-reactive.
// An electronics-store sale world: cardboard boxes with T-POT tape, price tags, shopping
// bags, coin stacks, pulsing speakers, SALE starbursts, mini appliances, balloons,
// a neon city skyline, and tiled store-floor textures.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { makeProduct, drawTV } from './products.js';
import { PALETTE } from './text3d.js';
import { mulberry32, springHit, hash } from './util.js';

const texCache = new Map();
function labelTex(text, bg, fg, w = 256, h = 128, font = 'Anton') {
  const key = [text, bg, fg, w, h].join('|');
  if (texCache.has(key)) return texCache.get(key);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); }
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  let size = h * 0.72; g.font = `${size}px ${font}, Impact, sans-serif`;
  while (g.measureText(text).width > w * 0.86 && size > 10) { size -= 4; g.font = `${size}px ${font}, Impact, sans-serif`; }
  g.fillText(text, w / 2, h / 2 + h * 0.04);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  texCache.set(key, t); return t;
}
const plate = (text, bg, fg, w, h) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: labelTex(text, bg, fg), roughness: 0.6 }));
const std = (col, o = {}) => new THREE.MeshStandardMaterial({ color: col, roughness: 0.5, ...o });

/** tiled store-floor texture: 'tiles' (checker + T-POT stamps) | 'dots' | 'stripes' | 'grid' */
export function floorTexture(style, a, b, repeat = 40) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  const A = '#' + new THREE.Color(a).getHexString(), B = '#' + new THREE.Color(b).getHexString();
  g.fillStyle = A; g.fillRect(0, 0, 256, 256);
  g.fillStyle = B;
  if (style === 'tiles') {
    g.fillRect(0, 0, 128, 128); g.fillRect(128, 128, 128, 128);
    g.globalAlpha = 0.35; g.font = '34px Anton, Impact'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = A; g.fillText('T-POT', 64, 64); g.fillStyle = B; g.fillText('T-POT', 192, 64);
    g.globalAlpha = 1;
  } else if (style === 'dots') {
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.beginPath(); g.arc(32 + x * 64 + (y % 2) * 32, 32 + y * 64, 9, 0, 7); g.fill(); }
  } else if (style === 'stripes') {
    for (let i = -256; i < 512; i += 64) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 32, 0); g.lineTo(i + 32 + 256, 256); g.lineTo(i + 256, 256); g.fill(); }
  } else { // grid
    g.fillRect(0, 0, 256, 6); g.fillRect(0, 0, 6, 256); g.fillRect(0, 128, 256, 3); g.fillRect(128, 0, 3, 256);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); t.anisotropy = 8;
  return t;
}

const TAGS = ['SALE', '-50%', '$99', 'HOT', 'NEW', '-30%', 'DEAL', '2 FOR 1'];
const TAG_COLS = [['#ffd400', '#15112a'], ['#ff2a4d', '#ffffff'], ['#16e0ff', '#15112a'], ['#b4ff1e', '#15112a'], ['#ff4fd8', '#ffffff']];

/** build one prop; returns { obj, kind, h (height), pulse? } */
export function makeProp(kind, rng) {
  const g = new THREE.Group();
  let h = 1, extra = {};
  const pick = (a) => a[Math.floor(rng() * a.length)];
  switch (kind) {
    case 'box': {
      const s = 0.7 + rng() * 0.6;
      const b = new THREE.Mesh(new RoundedBoxGeometry(s * 1.2, s, s, 2, 0.04), std(0xc8935a, { roughness: 0.85 }));
      b.position.y = s / 2; b.castShadow = b.receiveShadow = true; g.add(b);
      const tape = new THREE.Mesh(new THREE.BoxGeometry(s * 1.22, s * 0.16, s * 1.02), std(0xe41b24)); tape.position.y = s * 0.62; g.add(tape);
      const p = plate('T-POT', null, '#e41b24', s * 0.7, s * 0.25); p.position.set(0, s * 0.3, s / 2 + 0.01); g.add(p);
      if (rng() < 0.5) { const b2 = b.clone(); b2.scale.setScalar(0.7); b2.position.set(0.1, s + s * 0.35, 0); b2.rotation.y = 0.5; g.add(b2); h = s * 1.7; } else h = s;
      break;
    }
    case 'tag': {
      const [bg, fg] = pick(TAG_COLS);
      const sh = new THREE.Shape(); const w = 1.4, hh = 0.75;
      sh.moveTo(-w / 2 + 0.3, -hh / 2); sh.lineTo(w / 2, -hh / 2); sh.lineTo(w / 2, hh / 2); sh.lineTo(-w / 2 + 0.3, hh / 2); sh.lineTo(-w / 2, 0); sh.closePath();
      const hole = new THREE.Path(); hole.absarc(-w / 2 + 0.25, 0, 0.07, 0, Math.PI * 2, true); sh.holes.push(hole);
      const m = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.06, bevelEnabled: false }), std(bg)); m.castShadow = true;
      const tg = new THREE.Group(); tg.add(m);
      const p = plate(pick(TAGS), null, fg, 1.0, 0.5); p.position.set(0.12, 0, 0.065); tg.add(p);
      const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.1), std(0x333344, { metalness: 0.6 })); stick.position.y = 0.55; g.add(stick);
      tg.position.y = 1.3; tg.rotation.z = (rng() - 0.5) * 0.4; g.add(tg); extra.swing = tg; h = 1.7;
      break;
    }
    case 'bag': {
      const col = pick([0xe41b24, 0xffd400, 0x16e0ff, 0xff4fd8]);
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.9, 0.32), std(col, { roughness: 0.7 })); b.position.y = 0.45; b.castShadow = true; g.add(b);
      const hd = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.025, 6, 16, Math.PI), std(0x15112a)); hd.position.y = 0.9; g.add(hd);
      const p = plate('T-POT', null, col === 0xffd400 ? '#e41b24' : '#ffffff', 0.6, 0.22); p.position.set(0, 0.5, 0.17); g.add(p);
      h = 1.1; break;
    }
    case 'coins': {
      const n = 2 + Math.floor(rng() * 4);
      const m = std(0xffc21a, { metalness: 0.9, roughness: 0.25 });
      for (let i = 0; i < n; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.1, 20), m); c.position.set((rng() - 0.5) * 0.06, 0.05 + i * 0.105, 0); c.castShadow = true; g.add(c); }
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.1, 20), m); top.rotation.x = 1.2; top.position.set(0.45, 0.3, 0.1); g.add(top);
      h = n * 0.1; break;
    }
    case 'speaker': {
      const s = 1 + rng() * 0.5;
      const b = new THREE.Mesh(new RoundedBoxGeometry(0.9 * s, 1.5 * s, 0.8 * s, 2, 0.05), std(0x17131f, { roughness: 0.4 })); b.position.y = 0.75 * s; b.castShadow = true; g.add(b);
      const cones = [];
      for (const [y, r] of [[1.05, 0.2], [0.5, 0.32]]) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(r * s, 0.04 * s, 8, 24), std(0x555566, { metalness: 0.7 })); ring.position.set(0, y * s, 0.41 * s); g.add(ring);
        const cone = new THREE.Mesh(new THREE.CircleGeometry(r * s * 0.95, 24), std(0x2a2a35)); cone.position.set(0, y * s, 0.405 * s); g.add(cone); cones.push(cone);
      }
      const led = new THREE.Mesh(new THREE.CircleGeometry(0.05 * s, 10), new THREE.MeshBasicMaterial({ color: 0x16e0ff })); led.position.set(0, 1.35 * s, 0.41 * s); g.add(led);
      extra.cones = cones; h = 1.5 * s; break;
    }
    case 'star': {
      const sh = new THREE.Shape(); const N = 12;
      for (let i = 0; i <= N * 2; i++) { const r = i % 2 ? 0.55 : 0.8; const a = i / (N * 2) * Math.PI * 2; const x = Math.cos(a) * r, y = Math.sin(a) * r; i ? sh.lineTo(x, y) : sh.moveTo(x, y); }
      const [bg, fg] = pick(TAG_COLS);
      const m = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.08, bevelEnabled: false }), std(bg)); m.castShadow = true;
      const sg = new THREE.Group(); sg.add(m);
      const p = plate(pick(['SALE!', 'WOW', 'DEAL', '-50%']), null, fg, 1.0, 0.5); p.position.z = 0.09; sg.add(p);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.3), std(0x333344, { metalness: 0.6 })); pole.position.y = 0.65; g.add(pole);
      sg.position.y = 1.9; g.add(sg); extra.spin = sg; h = 2.6; break;
    }
    case 'mini': {
      const k = pick(['tv', 'washer', 'rice', 'fridge']);
      const p = makeProduct(k); const s = { tv: 0.4, washer: 0.42, rice: 0.5, fridge: 0.32 }[k];
      p.scale.setScalar(s); if (k === 'tv') { p.position.y = -p.userData.base * s; drawTV(p, 'logo', 0); }
      g.add(p); h = { tv: 0.9, washer: 0.95, rice: 0.8, fridge: 1.15 }[k]; break;
    }
    case 'balloon': {
      const col = pick([0xe41b24, 0xffd400, 0x16e0ff, 0xff4fd8, 0x3ea74d]);
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.45, 18, 14), new THREE.MeshPhysicalMaterial({ color: col, roughness: 0.15, clearcoat: 1 }));
      b.scale.y = 1.15; b.position.y = 1.6; g.add(b);
      const knot = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.12, 8), std(col)); knot.position.y = 1.06; knot.rotation.x = Math.PI; g.add(knot);
      const str = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1.0), std(0xffffff)); str.position.y = 0.5; g.add(str);
      h = 2.1; break;
    }
  }
  return { obj: g, kind, h, ...extra };
}

/**
 * Scatter props on a floor rectangle, avoiding keep-out circles.
 * o: {x0,x1,z0,z1,y, n, kinds, keepOut:[{x,z,r}], seed, scale, face:{x,z} (look-at point)}
 */
export function scatter(parent, o) {
  const rng = mulberry32(o.seed || 1);
  const items = [];
  let tries = 0;
  while (items.length < o.n && tries++ < o.n * 40) {
    const x = o.x0 + rng() * (o.x1 - o.x0), z = o.z0 + rng() * (o.z1 - o.z0);
    if ((o.keepOut || []).some((k) => Math.hypot(x - k.x, z - k.z) < k.r)) continue;
    if (items.some((it) => Math.hypot(x - it.x, z - it.z) < 1.3)) continue;
    const kind = o.kinds[Math.floor(rng() * o.kinds.length)];
    const p = makeProp(kind, rng);
    const s = (o.scale || 1) * (0.85 + rng() * 0.35);
    p.obj.scale.setScalar(s);
    p.obj.position.set(x, o.y || 0, z);
    const f = o.face || { x: 0, z: 30 };
    p.obj.rotation.y = Math.atan2(f.x - x, f.z - z) + (rng() - 0.5) * 0.7;
    parent.add(p.obj);
    items.push({ ...p, x, z, y: o.y || 0, s, phase: rng(), float: false });
  }
  return items;
}

/** float props in a volume (skies, shafts): o: {x0,x1,y0,y1,z0,z1,n,kinds,seed,scale,keepOut:[{x,y,r}]} */
export function floatProps(parent, o) {
  const rng = mulberry32(o.seed || 2);
  const items = [];
  let tries = 0;
  while (items.length < o.n && tries++ < o.n * 40) {
    const x = o.x0 + rng() * (o.x1 - o.x0), y = o.y0 + rng() * (o.y1 - o.y0), z = o.z0 + rng() * (o.z1 - o.z0);
    if ((o.keepOut || []).some((k) => Math.hypot(x - k.x, y - k.y) < k.r)) continue;
    const kind = o.kinds[Math.floor(rng() * o.kinds.length)];
    const p = makeProp(kind, rng);
    const s = (o.scale || 1) * (0.8 + rng() * 0.5);
    p.obj.scale.setScalar(s); p.obj.position.set(x, y, z);
    p.obj.rotation.set((rng() - 0.5) * 0.6, (rng() - 0.5) * 1.5, (rng() - 0.5) * 0.6);
    parent.add(p.obj);
    items.push({ ...p, x, y, z, s, phase: rng(), float: true, rot: p.obj.rotation.clone() });
  }
  return items;
}

/** neon skyline: lit windows + rooftop neon signs that flicker on hats */
export function skyline(parent, o) {
  const rng = mulberry32(o.seed || 3);
  const items = [];
  const win = document.createElement('canvas'); win.width = 128; win.height = 256;
  const g = win.getContext('2d'); g.fillStyle = '#0d0a1c'; g.fillRect(0, 0, 128, 256);
  for (let y = 8; y < 256; y += 20) for (let x = 8; x < 128; x += 20) { const r = rng(); g.fillStyle = r > 0.55 ? (r > 0.85 ? '#ff4fd8' : '#ffd86b') : '#1c1736'; g.fillRect(x, y, 11, 12); }
  const wt = new THREE.CanvasTexture(win); wt.colorSpace = THREE.SRGBColorSpace; wt.wrapS = wt.wrapT = THREE.RepeatWrapping;
  const signs = ['T-POT', 'SALE', 'OPEN 24/7', '-50%', 'T-POT', 'DEALS', 'TV', 'HOT'];
  let si = 0;
  for (let x = o.x0; x < o.x1;) {
    const w = 3 + rng() * 4, h = o.hMin + rng() * (o.hMax - o.hMin), z = o.z + (rng() - 0.5) * 6;
    const tex = wt.clone(); tex.needsUpdate = true; tex.repeat.set(w / 3, h / 6);
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 3), [std(0x120d22), std(0x120d22), std(0x120d22), std(0x120d22),
      new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.9, roughness: 0.8 }), std(0x120d22)]);
    b.position.set(x + w / 2, o.y + h / 2, z); parent.add(b);
    let sign = null;
    if (rng() < 0.6) {
      const txt = signs[si++ % signs.length];
      const col = ['#ff4fd8', '#16e0ff', '#ffd400', '#b4ff1e'][si % 4];
      sign = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.9, w * 0.32), new THREE.MeshBasicMaterial({ map: labelTex(txt, null, col, 512, 180), transparent: true, toneMapped: false }));
      sign.position.set(x + w / 2, o.y + h + w * 0.2, z + 1.6); parent.add(sign);
    }
    items.push({ kind: 'building', obj: b, sign, phase: rng(), x: x + w / 2 });
    x += w + 0.4 + rng() * 1.5;
  }
  return items;
}

/** beat reaction for all decor items of a scene */
export function animateDecor(items, t, music, scroll = 0, wrap = null) {
  const bi = music.beatIndex(t), bt = music.beatTime(bi), lvl = music.beat(bi).level;
  const kick = music.kick(t), hat = music.hat(t);
  for (const it of items) {
    if (it.kind === 'building') {
      if (it.sign) it.sign.material.opacity = hash(Math.floor(t * 14) + it.phase * 99) > 0.12 ? 0.75 + hat * 0.25 : 0.15;
      continue;
    }
    let x = it.x + scroll;
    if (wrap) x = wrap.x0 + (((x - wrap.x0) % (wrap.x1 - wrap.x0)) + (wrap.x1 - wrap.x0)) % (wrap.x1 - wrap.x0);
    const o = it.obj;
    if (it.float) {
      o.position.set(x, it.y + Math.sin(t * 1.6 + it.phase * 6) * 0.25 + Math.max(0, springHit(t - bt - it.phase * 0.05, 14, 7)) * 0.12, it.z);
      o.rotation.set(it.rot.x + Math.sin(t + it.phase * 5) * 0.1, it.rot.y + t * 0.4 * (it.phase - 0.5), it.rot.z);
    } else {
      // a hop that ripples across the floor from left to right on every beat (bigger on strong beats)
      const d = Math.max(0, springHit(t - bt - (x * 0.012 + it.phase * 0.03), 16, 9));
      o.position.set(x, it.y + d * (0.12 + lvl * 0.08) * it.s, it.z);
      o.scale.set(it.s * (1 + d * 0.05), it.s * (1 - d * 0.04), it.s * (1 + d * 0.05));
    }
    if (it.cones) it.cones.forEach((c, k) => c.scale.setScalar(1 + kick * (0.25 - k * 0.08)));
    if (it.swing) it.swing.rotation.z = Math.sin(t * 3 + it.phase * 6) * 0.15;
    if (it.spin) it.spin.rotation.y = t * 1.2 + it.phase * 6;
  }
}
