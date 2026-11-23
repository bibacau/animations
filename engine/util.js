// Small deterministic math helpers. Everything in the engine is a pure function of time,
// so any frame can be rendered in any order (needed for frame-by-frame rendering).

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const invLerp = (a, b, x) => clamp((x - a) / (b - a));
export const smooth = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
export const easeOutCubic = (t) => 1 - Math.pow(1 - clamp(t), 3);
export const easeInCubic = (t) => Math.pow(clamp(t), 3);
export const easeInOutCubic = (t) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
export const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(t)));
export const easeInExpo = (t) => (t <= 0 ? 0 : Math.pow(2, 10 * clamp(t) - 10));
export const easeOutBack = (t, s = 1.70158) => { t = clamp(t) - 1; return t * t * ((s + 1) * t + s) + 1; };
export const easeOutElastic = (t) => {
  t = clamp(t); if (t === 0 || t === 1) return t;
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1;
};
export const easeOutBounce = (t) => {
  t = clamp(t); const n = 7.5625, d = 2.75;
  if (t < 1 / d) return n * t * t;
  if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
  if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
  return n * (t -= 2.625 / d) * t + 0.984375;
};
// damped spring response to an impulse at time 0 (returns displacement, starts at 0)
export const springHit = (dt, freq = 9, damp = 6) => (dt < 0 ? 0 : Math.exp(-damp * dt) * Math.sin(freq * dt));
// one-sided decay envelope
export const decay = (dt, k = 8) => (dt < 0 ? 0 : Math.exp(-k * dt));
export const pulse = (dt, attack = 0.02, k = 10) => (dt < -attack ? 0 : dt < 0 ? 1 + dt / attack : Math.exp(-k * dt));

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export const pick = (rng, arr) => arr[Math.floor(rng() * arr.length) % arr.length];

// Parabolic arc between two points that leaves at t0 and lands exactly at t1 (on a beat).
export function arc(p0, p1, h, u) {
  u = clamp(u);
  return { x: lerp(p0.x, p1.x, u), y: lerp(p0.y, p1.y, u) + 4 * h * u * (1 - u), z: lerp(p0.z ?? 0, p1.z ?? 0, u) };
}

// Keyframe path: [{t, x, y, z, mode, h}] -> position + mode at time t.
// Between keys with h>0 the motion is a jump arc (lands on the next key's time).
export function keyPath(keys, t) {
  if (t <= keys[0].t) return { ...keys[0], u: 0, seg: -1 };
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (t < b.t) {
      const u = (t - a.t) / (b.t - a.t);
      const e = b.ease ? b.ease(u) : u;
      const p = arc(a, b, b.h || 0, e);
      return { ...p, mode: b.mode || a.mode, u, seg: i, from: a, to: b, vx: b.x - a.x };
    }
  }
  const l = keys[keys.length - 1];
  return { ...l, u: 1, seg: keys.length - 1 };
}
