// Physical 3D typography: every lyric is an extruded, lit, shadow-casting object whose
// letters are individually addressable (so they can wobble, break, become platforms...).
import * as THREE from 'three';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

export const PALETTE = {
  red: 0xff2a4d, yellow: 0xffd400, cyan: 0x16e0ff, purple: 0x7b2cff, lime: 0xb4ff1e,
  pink: 0xff4fd8, orange: 0xff7a1a, white: 0xf6f4ff, ink: 0x15112a, blue: 0x2a5bff,
};
export const COMBOS = [
  ['yellow', 'red'], ['white', 'purple'], ['cyan', 'blue'], ['red', 'ink'], ['lime', 'purple'],
  ['pink', 'purple'], ['orange', 'red'], ['white', 'red'], ['yellow', 'purple'], ['cyan', 'pink'],
];

const geoCache = new Map();
const matCache = new Map();

function material(hex, opts = {}) {
  const key = hex + JSON.stringify(opts);
  if (!matCache.has(key)) {
    matCache.set(key, new THREE.MeshStandardMaterial({ color: hex, roughness: 0.35, metalness: 0.05, ...opts }));
  }
  return matCache.get(key);
}

const capCache = new Map();
function capHeight(font, name, size) {
  const k = name + size;
  if (!capCache.has(k)) {
    const g = new TextGeometry('H', { font, size, depth: 0.01, curveSegments: 2, bevelEnabled: false });
    g.computeBoundingBox(); capCache.set(k, g.boundingBox.max.y - g.boundingBox.min.y); g.dispose();
  }
  return capCache.get(k);
}

export class Word3D {
  /**
   * @param fonts {anton, bowlby}
   * @param text  word text (display)
   * @param o     {font, size, depth, front, side, emissive}
   */
  constructor(fonts, text, o = {}) {
    const font = fonts[o.font || 'anton'];
    const size = o.size ?? 1.6;
    const depth = o.depth ?? size * 0.45;
    const front = PALETTE[o.front || 'yellow'] ?? o.front;
    const side = PALETTE[o.side || 'red'] ?? o.side;
    const emis = o.emissive ? { emissive: front, emissiveIntensity: o.emissive } : {};
    this.mats = [material(front, emis), material(side, { roughness: 0.55 })];
    this.text = text;
    this.group = new THREE.Group();        // scenes transform this
    this.inner = new THREE.Group();        // fit-to-width scale lives here
    this.group.add(this.inner);
    this.letters = [];
    const res = font.data.resolution;
    const scale = size / res;
    let x = 0;
    const tracking = o.tracking ?? 0.04 * size;
    const capH = capHeight(font, o.font || 'anton', size);
    for (const ch of text) {
      const g = font.data.glyphs[ch] || font.data.glyphs['?'];
      const adv = g.ha * scale;
      if (ch !== ' ') {
        const key = `${o.font || 'anton'}|${ch}|${size}|${depth}`;
        if (!geoCache.has(key)) {
          const geo = new TextGeometry(ch, { font, size, depth, curveSegments: 4, bevelEnabled: true,
            bevelThickness: Math.min(0.06, depth * 0.12), bevelSize: size * 0.018, bevelSegments: 1 });
          geo.computeBoundingBox();
          const bb = geo.boundingBox;
          geo.translate(-(bb.min.x + bb.max.x) / 2, -capH / 2, -depth / 2);
          geo.computeBoundingBox();
          geoCache.set(key, geo);
        }
        const geo = geoCache.get(key);
        const mesh = new THREE.Mesh(geo, this.mats);
        mesh.castShadow = true; mesh.receiveShadow = true;
        const bb = geo.boundingBox;
        const w = bb.max.x - bb.min.x;
        this.letters.push({ mesh, ch, cx: x + adv / 2, w, baseX: 0 });
        this.inner.add(mesh);
      }
      x += adv + tracking;
    }
    this.width = x - tracking;
    this.height = capH;
    this.depth = depth;
    this.size = size;
    for (const l of this.letters) { l.baseX = l.cx - this.width / 2; }
    // fit: o.maxWidth / o.height (target cap height) -> uniform scale on the inner group
    let k = 1;
    if (o.height) k = o.height / this.height;
    if (o.maxWidth && this.width * k > o.maxWidth) k = o.maxWidth / this.width;
    this.inner.scale.setScalar(k);
    this.k = k;
    this.width *= k; this.height *= k; this.depth *= k;
    this.reset();
  }
  // restore the rest layout (call before applying per-frame letter transforms)
  reset() {
    for (const l of this.letters) {
      l.mesh.position.set(l.baseX, 0, 0);
      l.mesh.rotation.set(0, 0, 0);
      l.mesh.scale.set(1, 1, 1);
      l.mesh.visible = true;
    }
    return this;
  }
  rescale(f) { this.k *= f; this.inner.scale.setScalar(this.k); this.width *= f; this.height *= f; this.depth *= f; return this; }
  // world-space top surface y of the word (for characters standing on it)
  get top() { return this.height / 2; }
  letterX(i) { return this.letters[Math.max(0, Math.min(this.letters.length - 1, i))].baseX * this.k; }
  setVisible(v) { this.group.visible = v; return this; }
}

/** single merged geometry for a whole word (for instanced environments like tunnels) */
export function wordGeometry(fonts, text, fontName = 'anton', size = 1, depth = 0.3) {
  const key = `W|${fontName}|${text}|${size}|${depth}`;
  if (!geoCache.has(key)) {
    const geo = new TextGeometry(text, { font: fonts[fontName], size, depth, curveSegments: 3, bevelEnabled: false });
    geo.computeBoundingBox(); const b = geo.boundingBox;
    geo.translate(-(b.min.x + b.max.x) / 2, -(b.min.y + b.max.y) / 2, -depth / 2);
    geo.computeBoundingBox();
    geoCache.set(key, geo);
  }
  return geoCache.get(key);
}
