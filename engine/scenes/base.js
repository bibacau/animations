// Scene template base: owns a group of objects; update(t) is a pure function of time.
import * as THREE from 'three';
import { Word3D, COMBOS } from '../text3d.js';
import { chooseEntrance, applyEntrance, chooseExit, applyExit } from '../entrances.js';
import { Character } from '../character.js';
import { makeProduct } from '../products.js';
import { mulberry32, clamp, easeInOutCubic, lerp } from '../util.js';

export class BaseScene {
  constructor(ctx, plan) {
    this.ctx = ctx; this.plan = plan; this.music = ctx.music; this.fx = ctx.fx;
    this.t0 = plan.t0; this.t1 = plan.t1;
    this.words = plan.words;            // timeline word objects
    this.rng = mulberry32(plan.seed);
    this.group = new THREE.Group(); this.group.visible = false; ctx.root.add(this.group);
    this.combo = COMBOS[Math.floor(this.rng() * COMBOS.length)];
    this.cam = { pos: new THREE.Vector3(0, 2, 12), look: new THREE.Vector3(0, 1, 0), fov: 50, roll: 0 };
    this.bg = { pattern: 0, a: 0x1b0b3a, b: 0xff2a4d, c: 0xffd400, spin: 0 };
    this.light = { target: new THREE.Vector3(0, 0, 0) };
  }
  /** Create the 3D object for a timeline word; picks an entrance different from the previous lyric. */
  word(w, o = {}) {
    const combo = o.combo || COMBOS[(w.i * 3 + this.plan.index) % COMBOS.length];
    const obj = new Word3D(this.ctx.fonts, o.text || w.display, { front: combo[0], side: combo[1], ...o });
    const mem = this.ctx.memory;
    obj.entrance = o.entrance ? { ...chooseEntrance(this.rng, mem.lastEntrance, w), ...o.entrance } : chooseEntrance(this.rng, mem.lastEntrance, w, o);
    mem.lastEntrance = obj.entrance;
    obj.exitSpec = chooseExit(this.rng, mem.lastExit); mem.lastExit = obj.exitSpec.type;
    obj.w = w;
    (o.parent || this.group).add(obj.group);
    return obj;
  }
  /** standard lyric lifecycle: enter at the vocal onset; optional exit. Letters reset each frame. */
  lyric(obj, t, exitAt = null, exitSpec = null) {
    obj.reset();
    const visible = applyEntrance(obj, t - obj.w.start, obj.entrance);
    if (exitAt != null && t >= exitAt) {
      if (applyExit(obj, t - exitAt, exitSpec || obj.exitSpec)) obj.group.visible = false;
    }
    return visible;
  }
  character(skin, scale = 1) { const c = new Character(skin, scale); this.group.add(c.root); return c; }
  product(kind) { const p = makeProduct(kind); this.group.add(p); return p; }
  floor(color = 0x2a1a55, size = 200, y = 0) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshStandardMaterial({ color, roughness: 0.8 }));
    m.rotation.x = -Math.PI / 2; m.position.y = y; m.receiveShadow = true; this.group.add(m); return m;
  }
  shadowFloor(y = 0, opacity = 0.35) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity }));
    m.rotation.x = -Math.PI / 2; m.position.y = y; m.receiveShadow = true; this.group.add(m); return m;
  }
  /** camera keyframes [{t,pos:[x,y,z],look:[x,y,z],fov,roll}] eased between keys */
  camTrack(keys, t) {
    let a = keys[0], b = keys[keys.length - 1];
    if (t <= a.t) b = a;
    for (let i = 0; i < keys.length - 1; i++) if (t >= keys[i].t && t < keys[i + 1].t) { a = keys[i]; b = keys[i + 1]; break; }
    if (t >= keys[keys.length - 1].t) a = b;
    const u = a === b ? 1 : (b.ease || easeInOutCubic)(clamp((t - a.t) / (b.t - a.t)));
    this.cam.pos.set(lerp(a.pos[0], b.pos[0], u), lerp(a.pos[1], b.pos[1], u), lerp(a.pos[2], b.pos[2], u));
    this.cam.look.set(lerp(a.look[0], b.look[0], u), lerp(a.look[1], b.look[1], u), lerp(a.look[2], b.look[2], u));
    this.cam.fov = lerp(a.fov ?? 50, b.fov ?? 50, u); this.cam.roll = lerp(a.roll ?? 0, b.roll ?? 0, u);
  }
  /** first beat at/after t (optionally on the 8th-note grid), at or above a level */
  beatAfter(t, { minLevel = 0, half = false } = {}) {
    const m = this.music; let i = Math.max(0, m.beatIndex(t));
    for (; i < m.beats.length + 64; i++) {
      const bt = m.beatTime(i);
      if (half) { const h = bt - m.period / 2; if (h >= t - 1e-4) return h; }
      if (bt >= t - 1e-4 && (i >= m.beats.length || m.beats[i].level >= minLevel)) return bt;
    }
    return t;
  }
  /** lay a row of word objects side by side, scaled to fit maxW; returns x centers */
  layoutRow(objs, maxW, gap = 0.25) {
    let total = objs.reduce((a, o) => a + o.width, 0) + gap * (objs.length - 1);
    if (total > maxW) { const f = maxW / total; objs.forEach((o) => o.rescale(f)); total = maxW; gap *= f; }
    let x = -total / 2; const xs = [];
    for (const o of objs) { xs.push(x + o.width / 2); x += o.width + gap; }
    return xs;
  }
  // registered once at build time (deterministic): fx events for this scene
  events() {}
  update(t) {}
}

/** group fast consecutive words into visual phrases without losing per-word timing */
export function groupRows(words, maxPerRow = 3) {
  const rows = [];
  for (const w of words) {
    const row = rows.at(-1); const prev = row?.at(-1);
    if (prev && w.start - prev.end < 0.14 && prev.dur < 0.42 && row.length < maxPerRow) row.push(w);
    else rows.push([w]);
  }
  return rows;
}

export { THREE, clamp, lerp };
