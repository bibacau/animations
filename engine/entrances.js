// Parametric lyric entrance / exit system.
// A spec = {type, dir, axis, stagger, dur, amp, order}. Types x directions x axes x
// stagger orders x easing give hundreds of distinct looks from a few functions.
import { clamp, easeOutBack, easeOutBounce, easeOutCubic, easeOutElastic, easeInCubic, easeOutExpo, springHit, hash } from './util.js';

export const ENTRANCES = ['smash', 'drop', 'fly', 'flip', 'roll', 'stretch', 'scatter', 'expand', 'snap', 'rise', 'shoot', 'swing', 'unzip'];
export const EXITS = ['shatter', 'implode', 'fall', 'blast', 'fold', 'zip', 'sink'];

function order(word, i, ord) {
  const n = word.letters.length;
  if (ord === 'rev') return n - 1 - i;
  if (ord === 'mid') return Math.abs(i - (n - 1) / 2);
  if (ord === 'rand') return Math.floor(hash(i * 7.31 + n) * n);
  return i;
}

/** Plan an entrance so consecutive lyrics never share the same one. */
export function chooseEntrance(rng, prev, word, opts = {}) {
  const pool = (opts.pool || ENTRANCES).filter((e) => e !== prev?.type && e !== prev?.prevType);
  const type = pool[Math.floor(rng() * pool.length)];
  const dirs = [[-1, 0], [1, 0], [0, 1], [0, -1], [1, 1], [-1, 1]];
  const d = dirs[Math.floor(rng() * dirs.length)];
  const fast = word.dur < 0.3;
  return {
    type, prevType: prev?.type, dir: { x: d[0], y: d[1] }, axis: rng() < 0.5 ? 'x' : 'y',
    order: ['fwd', 'rev', 'mid', 'rand'][Math.floor(rng() * 4)],
    stagger: fast ? 0.008 : 0.012 + rng() * 0.02,
    dur: fast ? 0.12 : 0.14 + rng() * 0.1,
    amp: 0.7 + rng() * 0.6,
  };
}

/** apply entrance at local time lt (seconds since the vocal onset). Letters must be reset first. */
export function applyEntrance(word, lt, s) {
  if (lt < 0) { word.group.visible = false; return false; }
  word.group.visible = true;
  let done = true;
  word.letters.forEach((L, i) => {
    const m = L.mesh;
    const u = clamp((lt - order(word, i, s.order) * s.stagger) / s.dur);
    if (u < 1) done = false;
    const A = s.amp;
    const sx = s.dir.x, sy = s.dir.y;
    switch (s.type) {
      case 'smash': { // slams from the camera
        const e = easeOutExpo(u);
        m.position.z += (1 - e) * 9 * A; m.scale.setScalar(1 + (1 - e) * 2.2);
        const w = springHit(lt - s.dur, 26, 9) * 0.18; m.scale.y *= 1 - w; m.scale.x *= 1 + w;
        break;
      }
      case 'drop': { const e = easeOutBounce(u); m.position.y += (1 - e) * 7 * A; m.rotation.z = (1 - e) * 0.4 * (i % 2 ? 1 : -1); break; }
      case 'fly': { const e = easeOutBack(u, 1.6); m.position.x += (1 - e) * 10 * (sx || 1); m.position.y += (1 - e) * 4 * sy; m.rotation.z = (1 - e) * -2.5 * (sx || 1); break; }
      case 'flip': { const e = easeOutBack(u, 2.2); m.rotation[s.axis] = (1 - e) * Math.PI * 0.5 * (i % 2 ? 1 : -1) * 2; m.scale.setScalar(0.3 + 0.7 * clamp(u * 3)); break; }
      case 'roll': { const e = easeOutCubic(u); m.position.x += (1 - e) * -7 * (sx || 1); m.rotation.z = (1 - e) * Math.PI * 2 * (sx || 1); break; }
      case 'stretch': { const e = easeOutElastic(u); m.scale.x = Math.max(0.01, e); m.scale.y = 1 + (1 - clamp(u * 1.5)) * 2.5; break; }
      case 'scatter': { const e = easeOutExpo(u); const a = hash(i * 3.7 + word.text.length) * 6.28;
        m.position.x += Math.cos(a) * 6 * (1 - e) * A; m.position.y += Math.sin(a) * 6 * (1 - e) * A; m.position.z += (1 - e) * (hash(i) * 8 - 2);
        m.rotation.set((1 - e) * 4, (1 - e) * 3, (1 - e) * 2); break; }
      case 'expand': { const e = easeOutBack(u, 2.5); m.scale.setScalar(Math.max(0.001, e)); break; }
      case 'snap': { const on = u > 0.05; m.visible = on; const j = (1 - u) * 0.35; m.position.x += (hash(i + lt * 60) - 0.5) * j; m.position.y += (hash(i * 2 + lt * 60) - 0.5) * j; break; }
      case 'rise': { const e = easeOutBack(u, 1.4); m.position.y -= (1 - e) * 4; m.rotation.x = (1 - e) * -Math.PI / 2; break; }
      case 'shoot': { const e = easeOutExpo(u); m.position.z -= (1 - e) * 40; m.position.y += (1 - e) * 2 * sy; break; }
      case 'swing': { const e = easeOutElastic(u); m.rotation.x = (1 - e) * -Math.PI * 0.6; m.position.y += (1 - e) * 1.2; break; }
      case 'unzip': { const e = easeOutCubic(u); m.position.y += (1 - e) * (i % 2 ? 5 : -5); m.rotation.y = (1 - e) * 2; break; }
    }
  });
  return done;
}

export function chooseExit(rng, prevType) {
  const pool = EXITS.filter((e) => e !== prevType);
  return { type: pool[Math.floor(rng() * pool.length)], dur: 0.22 + rng() * 0.12, stagger: 0.015 };
}

/** apply exit at local time lt (seconds since exit start). returns true when gone */
export function applyExit(word, lt, s) {
  if (lt < 0) return false;
  let gone = true;
  word.letters.forEach((L, i) => {
    const m = L.mesh;
    const u = clamp((lt - i * s.stagger) / s.dur);
    if (u < 1) gone = false;
    const e = easeInCubic(u);
    switch (s.type) {
      case 'shatter': { const a = hash(i * 9.1) * 6.28; m.position.x += Math.cos(a) * 7 * easeOutCubic(u); m.position.y += Math.sin(a) * 7 * easeOutCubic(u) - e * 3; m.rotation.set(u * 5, u * 4, u * 3); m.scale.setScalar(1 - e); break; }
      case 'implode': m.position.x *= 1 - e; m.scale.setScalar(Math.max(0.001, 1 - e)); m.rotation.z = e * 3; break;
      case 'fall': m.position.y -= e * 9; m.rotation.z = e * (i % 2 ? 1.2 : -1.2); break;
      case 'blast': m.position.z += e * 14; m.scale.setScalar(1 + e * 2); break;
      case 'fold': m.rotation.x = e * Math.PI / 2; m.scale.y = 1 - e; break;
      case 'zip': m.position.x += e * 14 * (i % 2 ? 1 : -1); break;
      case 'sink': m.position.y -= e * 3; m.scale.y = Math.max(0.001, 1 - e); break;
    }
    if (u >= 1) m.visible = false;
  });
  return gone;
}
