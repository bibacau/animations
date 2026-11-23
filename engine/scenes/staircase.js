// LYRIC STAIRCASE: the phrase builds a staircase step by step; a performer climbs one
// step per beat to a fridge at the top. On the final word the fridge door bursts open
// (blinding light), the last lyric smashes out of it, and the stairs collapse to debris.
import { BaseScene, clamp } from './base.js';
import { keyPath, springHit, decay, easeOutBack, easeOutCubic, hash } from '../util.js';

export class Staircase extends BaseScene {
  static meta = { id: 'staircase', keywords: ['STEPPED', 'INSIDE', 'UP', 'CLIMB', 'BELIEVE', 'EYES', 'STAIRS'], character: true, products: true, energy: [0.15, 0.9], minWords: 4, maxWords: 10 };
  constructor(ctx, plan) {
    super(ctx, plan);
    const m = this.music, P = m.period;
    const steps = this.words.slice(0, -1), lastW = this.words.at(-1);
    this.steps = steps.map((w, k) => {
      const o = this.word(w, { height: 1.0, maxWidth: 3.0, depth: 2.2, font: 'anton', combo: [['white', 'purple'], ['yellow', 'red'], ['cyan', 'blue']][k % 3],
        pool: ['rise', 'drop', 'expand', 'unzip', 'swing'] });
      o.base = { x: k * 1.9, y: k * 0.95 + o.height / 2, z: -k * 0.5 };
      return o;
    });
    const top = this.steps.at(-1).base;
    this.fridge = this.product('fridge');
    this.fridge.position.set(top.x + 2.6, top.y + 0.42, top.z - 0.4);
    this.fridge.rotation.y = -0.35;
    this.finale = this.word(lastW, { height: 1.7, maxWidth: 4.6, font: 'bowlby', depth: 0.9, combo: ['yellow', 'red'], entrance: { type: 'smash', dur: 0.2 } });
    this.open = lastW.start - 0.04;
    this.collapse = this.beatAfter(lastW.start + 0.2, { half: true });
    if (this.collapse > this.t1 - 0.1) this.collapse = this.t1 - 0.22;
    // climber: one step per beat, never ahead of the stairs
    this.char = this.character('boo', 0.72);
    const keys = [{ t: this.t0, x: -2.6, y: 0, mode: 'run' }];
    let L = this.t0;
    this.lands = [];
    this.steps.forEach((o, k) => {
      L = this.beatAfter(Math.max(o.w.start + 0.12, L + P * 0.95));
      if (L > this.open + 0.2) return;
      keys.push({ t: L, x: o.base.x, y: o.base.y + o.height / 2, z: o.base.z + 0.4, h: 0.9, mode: 'jump' });
      this.lands.push({ t: L, o });
    });
    keys.push({ t: this.collapse, x: keys.at(-1).x, y: keys.at(-1).y, z: keys.at(-1).z, mode: 'idle' });
    keys.push({ t: this.collapse + 0.9, x: keys.at(-1).x - 1, y: -6, z: 1, mode: 'fall', ease: (u) => u * u });
    this.keys = keys;
    this.floor(0x1b1433, 300, -0.02);
    this.bg = { pattern: 0, a: 0x120a2e, b: 0x7b2cff, c: 0x16e0ff };
  }
  events() {
    for (const { t, o } of this.lands) this.fx.burst({ t0: t, pos: { x: o.base.x, y: o.base.y + o.height / 2, z: o.base.z + 0.6 }, n: 16, speed: 3, gravity: 8, life: 0.5, size: 0.08, colors: ['white', 'lime'] });
    const fp = this.fridge.position;
    this.fx.flash(this.open, 0.9, 6, 0xfff6d0); this.fx.impact(this.open, 1.0);
    this.fx.burst({ t0: this.open, pos: { x: fp.x, y: fp.y + 1.8, z: fp.z + 1 }, n: 120, speed: 11, gravity: 3, life: 1.1, size: 0.12, colors: ['white', 'yellow', 'cyan'], cone: { x: -0.4, y: 0.1, z: 1 }, spread: 1.5 });
    for (const o of this.steps) this.fx.burst({ t0: this.collapse + o.base.x * 0.02, pos: { x: o.base.x, y: o.base.y, z: o.base.z }, n: 40, speed: 7, gravity: 12, life: 1, size: 0.15, colors: ['purple', 'white', 'yellow', 'cyan'] });
    this.fx.impact(this.collapse, 0.8); this.fx.glitch(this.collapse, 0.8, 0.2);
  }
  update(t) {
    const m = this.music;
    this.steps.forEach((o, k) => {
      this.lyric(o, t);
      const land = this.lands.find((l) => l.o === o);
      const dip = land ? springHit(t - land.t, 20, 7) * 0.2 : 0;
      const c = t - this.collapse - k * 0.03;
      const fall = c > 0 ? 9 * c * c + 2 * c : 0;
      o.group.position.set(o.base.x, o.base.y - dip - fall, o.base.z);
      o.group.rotation.set(c > 0 ? c * 3 * (k % 2 ? 1 : -1) : 0, -0.25, c > 0 ? c * 2 : 0);
      if (c > 0) o.letters.forEach((L, i) => { L.mesh.position.x += (hash(i + k * 7) - 0.5) * c * 9; L.mesh.rotation.z = c * 6 * hash(i); });
    });
    const fp = this.fridge.position;
    const du = easeOutBack(clamp((t - this.open) / 0.3), 2.2);
    this.fridge.userData.doors.forEach((d, i) => { d.rotation.y = -du * (1.9 + i * 0.25); });
    this.fridge.scale.setScalar(1 + m.kick(t) * 0.03);
    const fo = this.finale;
    this.lyric(fo, t);
    const fu = easeOutCubic(clamp((t - fo.w.start) / 0.3));
    fo.group.position.set(fp.x - 1.1 * fu, fp.y + 1.9 + fu * 0.6, fp.z + 1 + fu * 3.2);
    fo.group.rotation.y = -0.3 * (1 - fu);
    fo.group.scale.setScalar(1 + m.beatPulse(t) * 0.08);
    const p = keyPath(this.keys, t);
    const ch = this.char;
    ch.root.position.set(p.x, p.y, (p.z ?? 0) + 0.4);
    let mode = p.mode; if (mode === 'jump' && p.u > 0.85) mode = 'land';
    ch.root.rotation.y = mode === 'run' || mode === 'jump' ? 1.2 : 0.5;
    ch.pose(mode, (t * 2) % 1, decay(p.from ? t - p.from.t : 1, 12));
    // "couldn't believe my eyes": the climber's eyes pop out
    const pop = 1 + easeOutBack(clamp((t - this.open) / 0.2), 3) * 1.4;
    ch.eyes.forEach((e) => e.scale.set(pop, pop, 0.6 * pop));
    // camera climbs diagonally with the performer, punches toward the fridge on the reveal
    const cu = easeOutCubic(clamp((t - this.open) / 0.4));
    const cx = p.x + 0.8 + cu * 0.6, cy = Math.max(1.6, p.y) + 1.6;
    this.cam.pos.set(cx + 2.6 - cu * 1.2, cy + 1.0, 7.4 - cu * 1.4 + clamp(t - this.collapse) * 5);
    this.cam.look.set(cx + 0.6, cy - 0.4 + cu * 0.8, -1);
    this.cam.roll = 0.06 - cu * 0.1;
    this.light.target.set(p.x, p.y, 0);
    this.bg = t >= this.open ? { pattern: 1, a: 0xfff6d0, b: 0x16e0ff, c: 0xffffff, spin: t * 0.3 } : { pattern: 0, a: 0x120a2e, b: 0x7b2cff, c: 0x16e0ff };
  }
}
