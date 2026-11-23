// LYRIC ELEVATOR -> DROP: the performer rides a word upward through a shaft, rising in
// beat-quantised jolts that speed up through the build-up. Passing lyrics whoosh by as
// floors. The final word hangs above as a ceiling; on the drop the elevator smashes
// through it: white flash, shockwave, the products explode outward, the world flips.
import { BaseScene, clamp } from './base.js';
import { springHit, decay, easeOutCubic, easeOutExpo, hash, easeInCubic } from '../util.js';

export class Elevator extends BaseScene {
  static meta = { id: 'elevator', requires: 'drop', keywords: ['SURPRISE', 'DEALS', 'TOOK', 'UP', 'HIGH'], character: true, products: true, energy: [0, 1], minWords: 2, maxWords: 10 };
  constructor(ctx, plan) {
    super(ctx, plan);
    const m = this.music;
    this.drop = m.drop;
    const W = this.words;
    this.lift = this.word(W[0], { height: 0.9, maxWidth: 3.6, depth: 2.4, font: 'bowlby', combo: ['yellow', 'red'], entrance: { type: 'rise', dur: 0.25 } });
    this.ceiling = this.word(W.at(-1), { height: 1.6, maxWidth: 4.8, depth: 1.0, font: 'bowlby', combo: ['white', 'red'], entrance: { type: 'smash', dur: 0.12 } });
    this.floors = W.slice(1, -1).map((w, k) => this.word(w, { height: 1.0, maxWidth: 3.2, depth: 0.6, combo: [['cyan', 'blue'], ['pink', 'purple'], ['lime', 'purple'], ['orange', 'red']][k % 4],
      pool: ['fly', 'snap', 'stretch', 'flip', 'expand'] }));
    this.char = this.character('pip', 0.8);
    this.prods = ['tv', 'washer', 'fridge', 'rice'].map((k) => { const p = this.product(k); p.visible = false; return p; });
    // elevator steps: start rising at the first word, one jolt per beat, 8ths in the build-up
    const P = m.period, steps = [];
    for (let tt = this.beatAfter(W[0].start + 0.2); tt < this.drop - 0.01; tt += P / 2) {
      const inBuild = tt >= this.drop - 2 * 4 * P * 0.5;
      const onBeat = Math.abs(tt - m.beatTime(m.nearestBeat(tt))) < 0.05;
      if (onBeat || inBuild) steps.push(tt);
    }
    this.steps = steps;
    this.bg = { pattern: 3, a: 0x15112a, b: 0x2a1a55, c: 0xffd400 };
  }
  // elevator height: sum of eased jolts; jolts grow as the build-up intensifies
  liftY(t) {
    let y = 0;
    this.steps.forEach((s, i) => { y += (0.6 + i * 0.09) * easeOutExpo(clamp((t - s) / 0.16)); });
    if (t > this.drop) y += 26 * easeOutCubic(clamp((t - this.drop) / 0.9));
    return y;
  }
  events() {
    const d = this.drop, fx = this.fx, top = this.liftY(this.drop - 0.001) + 4.2;
    this.ceilY = top;
    fx.flash(d, 1.0, 5); fx.impact(d, 1.8, 5); fx.glitch(d, 1, 0.3); fx.zoom(d, 0.9, 0.4);
    fx.ring({ t0: d, pos: { x: 0, y: top, z: 0 }, normal: { x: 0, y: 0, z: 1 }, maxR: 14, life: 0.7, color: 0xffd400 });
    fx.ring({ t0: d + 0.08, pos: { x: 0, y: top, z: 0.2 }, normal: { x: 0, y: 0, z: 1 }, maxR: 10, life: 0.6, color: 0xff2a4d });
    fx.burst({ t0: d, pos: { x: 0, y: top, z: 0 }, n: 260, speed: 18, gravity: 6, life: 1.6, size: 0.2, colors: ['yellow', 'red', 'white', 'cyan', 'pink'] });
    for (const s of this.steps) fx.impact(s, 0.12 + (s > d - 2 ? 0.15 : 0), 14);
  }
  update(t) {
    const m = this.music, d = this.drop, y = this.liftY(t), after = t - d;
    // lift platform (with jolt squash)
    this.lyric(this.lift, t);
    const lastStep = this.steps.filter((s) => s <= t).at(-1) ?? -9;
    const jolt = springHit(t - lastStep, 24, 10) * 0.12;
    this.lift.group.position.set(0, y + this.lift.height / 2 - jolt, 0);
    this.lift.group.scale.set(1 + jolt, 1 - jolt, 1);
    // floors appear beside the rider at the current height, then fall past as we rise
    this.floors.forEach((o, k) => {
      this.lyric(o, t);
      const yAt = this.liftY(o.w.start);
      const side = k % 2 ? 1 : -1;
      o.group.position.set(side * 1.3, yAt + 2.0 + (k % 2) * 0.6, -1.6 + k * 0.15);
      o.group.rotation.set(0, side * -0.35, side * 0.05);
      if (after > 0) o.group.visible = false;
    });
    // ceiling word
    const c = this.ceiling;
    this.lyric(c, t);
    const top = this.ceilY;
    c.group.position.set(0, top, 0.2);
    c.group.rotation.x = 0.25;
    if (after > 0) {
      c.letters.forEach((L, i) => {
        const a = (i / c.letters.length - 0.5) * 2.6 + (hash(i) - 0.5) * 0.4;
        L.mesh.position.x += Math.sin(a) * 9 * easeOutCubic(after * 1.2);
        L.mesh.position.y += Math.cos(a) * 6 * easeOutCubic(after * 1.2) - 4 * after * after;
        L.mesh.position.z += 5 * easeOutCubic(after);
        L.mesh.rotation.set(after * 3 * hash(i + 1), after * 4, after * 5 * (hash(i) - 0.5));
      });
    } else {
      c.group.position.y += Math.sin(t * 30) * 0.03 * m.build(t);
    }
    // rider
    const ch = this.char;
    const launch = after > 0;
    ch.root.position.set(0, y + this.lift.height + (launch ? 9 * easeOutCubic(after / 0.8) : 0), 0.3);
    ch.root.rotation.set(0, launch ? after * 9 : 0.3, 0);
    ch.pose(launch ? (after < 0.25 ? 'launch' : 'cheer') : (m.build(t) > 0.5 ? 'ride' : 'idle'), m.count(t), launch ? 0 : decay(t - lastStep, 10));
    // products erupt from the impact
    this.prods.forEach((p, i) => {
      p.visible = after > 0;
      if (!p.visible) return;
      const a = i / 4 * Math.PI * 2 + 0.6;
      const u = easeOutCubic(clamp(after / 1.0));
      p.position.set(Math.cos(a) * 7 * u, top + Math.sin(a) * 5 * u - 1.5, 1 + 6 * u);
      p.rotation.set(after * 2.5 * (i % 2 ? 1 : -1), after * 3, after * 1.5);
      p.scale.setScalar(0.5 + 0.4 * u);
    });
    // camera: rides up with the lift looking up the shaft; on the drop it is thrown back
    const shake = m.build(t) * 0.08;
    this.cam.pos.set(Math.sin(t * 40) * shake + (launch ? 0 : 1.8), y + 1.2 + (launch ? 4 * easeOutCubic(after) : 0), 8.5 + (launch ? 9 * easeOutExpo(after / 0.8) : 0));
    this.cam.look.set(0, y + 2.6 + (launch ? 4 : 0), 0);
    this.cam.fov = launch ? 58 : 50 - m.build(t) * 8;
    this.cam.roll = launch ? after * 0.4 : Math.sin(t * 2) * 0.03;
    this.light.target.set(0, y + 1, 0);
    this.bg = launch ? { pattern: 1, a: 0xff2a4d, b: 0xffd400, c: 0xffffff, spin: after * 2 } : { pattern: 3, a: 0x15112a, b: 0x2a1a55, c: 0xffd400, spin: -y * 0.3 };
    this.invert = launch ? decay(after, 18) : 0;
  }
}
