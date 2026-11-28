// Core helpers: easing, deterministic noise, the beat clock, and 2D drawing primitives.
// Every frame is a pure function of time t, so frames can be rendered in any order.

import { BRAND, drawLogoWord, logoWordWidth } from './logo.js';

// frame size: overridable from the page URL (?w=&h=) so the same project renders any resolution
const _qs = typeof location !== 'undefined' ? new URLSearchParams(location.search) : null;
export const W = +(_qs?.get('w') || 854), H = +(_qs?.get('h') || 480);
export const INK = '#1b1433';

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const prog = (t, a, b) => clamp((t - a) / (b - a));
export const smooth = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
export const easeOut = (t) => 1 - Math.pow(1 - clamp(t), 3);
export const easeIn = (t) => Math.pow(clamp(t), 3);
export const easeInOut = (t) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
export const easeOutBack = (t, s = 1.8) => { t = clamp(t) - 1; return t * t * ((s + 1) * t + s) + 1; };
export const easeOutElastic = (t) => { t = clamp(t); if (t === 0 || t === 1) return t; return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1; };
export const easeOutBounce = (t) => {
  t = clamp(t); const n = 7.5625, d = 2.75;
  if (t < 1 / d) return n * t * t;
  if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
  if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
  return n * (t -= 2.625 / d) * t + 0.984375;
};
export const springHit = (dt, f = 18, d = 7) => (dt < 0 ? 0 : Math.exp(-d * dt) * Math.sin(f * dt));
export const decay = (dt, k = 8) => (dt < 0 ? 0 : Math.exp(-k * dt));
export const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ---------------------------------------------------------------- beat clock
export class Music {
  constructor(tl) {
    this.tl = tl; this.beats = tl.beats; this.P = tl.period; this.words = tl.words; this.phrases = tl.phrases;
    this.kicks = tl.kicks.filter((k) => k.v > 0.6);
  }
  idx(t) { const b = this.beats; if (t < b[0].t) return -1; let lo = 0, hi = b.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (b[m].t <= t) lo = m; else hi = m - 1; } return lo; }
  bt(i) { const b = this.beats; if (i < 0) return b[0].t + i * this.P; if (i >= b.length) return b.at(-1).t + (i - b.length + 1) * this.P; return b[i].t; }
  level(i) { return i < 0 || i >= this.beats.length ? 0 : this.beats[i].level; }
  /** time since the last beat */
  since(t) { return t - this.bt(this.idx(t)); }
  phase(t) { const i = this.idx(t); return clamp((t - this.bt(i)) / (this.bt(i + 1) - this.bt(i))); }
  count(t) { const i = this.idx(t); return i + this.phase(t); }
  /** beat pulse 0..~1.3, weighted by beat level (small / medium / strong / drop) */
  pulse(t, k = 9) { const i = this.idx(t); if (i < 0) return 0; return [0.45, 0.7, 1, 1.3][this.level(i)] * decay(t - this.bt(i), k); }
  /** 8th-note pulse (beats + off-beats) */
  pulse8(t, k = 14) { const h = this.P / 2; const s = ((t - this.bt(0)) % h + h) % h; return decay(s, k); }
  kick(t, k = 10) { let v = 0; for (let i = this.kicks.length - 1; i >= 0; i--) { const dt = t - this.kicks[i].t; if (dt < 0) continue; if (dt > 1) break; v = Math.max(v, decay(dt, k)); } return v; }
  /** first beat time >= t (optionally on the 8th grid) */
  after(t, half = false) { let i = Math.max(0, this.idx(t)); for (; ; i++) { const b = this.bt(i); if (half && b - this.P / 2 >= t - 1e-4) return b - this.P / 2; if (b >= t - 1e-4) return b; } }
  beatsBetween(a, b) { return this.beats.filter((x) => x.t >= a && x.t < b); }
  wordsIn(a, b) { return this.words.filter((w) => w.start >= a - 0.01 && w.start < b); }
}

// ---------------------------------------------------------------- drawing
export function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
export function circle(g, x, y, r) { g.beginPath(); g.arc(x, y, Math.max(0.01, r), 0, Math.PI * 2); }
export function fillStroke(g, fill, lw = 3, stroke = INK) { if (fill) { g.fillStyle = fill; g.fill(); } if (lw) { g.lineWidth = lw; g.strokeStyle = stroke; g.lineJoin = 'round'; g.stroke(); } }
export function star(g, x, y, r1, r2, n = 5, rot = -Math.PI / 2) {
  g.beginPath();
  for (let i = 0; i < n * 2; i++) { const r = i % 2 ? r2 : r1; const a = rot + i * Math.PI / n; i ? g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r) : g.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
  g.closePath();
}
/** chunky cartoon text: fill + thick outline + drop shadow. align center/middle.
 *  A standalone brand word (BRAND.word) is drawn with the real logo letterforms. */
export function popText(g, text, x, y, size, o = {}) {
  // the brand word is drawn with the logo's own letterforms only when it stands on its own
  // (a sign, a label); inside a sentence it uses the same font as the words around it
  if (BRAND.logo && BRAND.word && text.trim() === BRAND.word && o.brand !== false) return brandText(g, text, x, y, size, o);
  plainText(g, text, x, y, size, o);
}
function plainText(g, text, x, y, size, o = {}) {
  g.save();
  g.font = `${size}px ${o.font || 'Bowlby'}, Impact, sans-serif`;
  g.textAlign = o.align || 'center'; g.textBaseline = 'middle';
  g.lineJoin = 'round';
  if (o.shadow !== false) { g.fillStyle = o.shadowColor || 'rgba(27,20,51,0.55)'; g.fillText(text, x + size * 0.06, y + size * 0.08); }
  if (o.outline !== 0) { g.lineWidth = o.outline ?? size * 0.16; g.strokeStyle = o.stroke || INK; g.strokeText(text, x, y); }
  g.fillStyle = o.fill || '#fff'; g.fillText(text, x, y);
  g.restore();
}
const capOf = (size, font) => size * (font === 'Anton' ? 0.78 : 0.7);
function brandText(g, text, x, y, size, o) {
  const parts = text.split(BRAND.word);
  const segs = [];
  parts.forEach((p, i) => { if (p) segs.push({ t: p }); if (i < parts.length - 1) segs.push({ logo: true }); });
  const cap = capOf(size, o.font);
  const w = segs.map((s) => (s.logo ? logoWordWidth(cap) : plainWidth(g, s.t, size, o.font)));
  const total = w.reduce((a, b) => a + b, 0);
  let cx = o.align === 'left' ? x : o.align === 'right' ? x - total : x - total / 2;
  segs.forEach((s, i) => {
    if (s.logo) drawLogoWord(g, cx + w[i] / 2, y, cap, { outline: o.logoOutline ?? Math.max(1.5, size * 0.07), outlineCol: o.logoOutlineCol || '#fff', fill: o.logoFill, glow: o.logoGlow });
    else plainText(g, s.t, cx, y, size, { ...o, align: 'left' });
    cx += w[i];
  });
}
function plainWidth(g, text, size, font = 'Bowlby') { g.save(); g.font = `${size}px ${font}, Impact, sans-serif`; const w = g.measureText(text).width; g.restore(); return w; }
export function textWidth(g, text, size, font = 'Bowlby', brand = true) {
  if (brand && BRAND.logo && BRAND.word && text.trim() === BRAND.word) return logoWordWidth(capOf(size, font));
  return plainWidth(g, text, size, font);
}

/** run fn with the canvas translated/rotated/scaled about (x, y) */
export function at(g, x, y, s, rot, fn) { g.save(); g.translate(x, y); if (rot) g.rotate(rot); if (s !== 1) g.scale(s, s); fn(); g.restore(); }
export function atXY(g, x, y, sx, sy, rot, fn) { g.save(); g.translate(x, y); if (rot) g.rotate(rot); g.scale(sx, sy); fn(); g.restore(); }

export const COL = {
  red: '#ff2a4d', tred: '#e41b24', yellow: '#ffd400', cyan: '#16e0ff', purple: '#7b2cff', lime: '#b4ff1e',
  pink: '#ff4fd8', orange: '#ff7a1a', white: '#ffffff', ink: INK, blue: '#2a5bff', green: '#3ea74d', grey: '#9a98a8',
};
export const RAINBOW = [COL.red, COL.yellow, COL.cyan, COL.lime, COL.pink, COL.orange, COL.purple, COL.blue];
