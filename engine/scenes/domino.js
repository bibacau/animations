// WORD DOMINO: lyrics rise as giant dominoes along a curving line. Once the line is
// complete an appliance shoves the first one and the words topple in a chain timed to
// 16th notes, so the LAST word hits the floor exactly on the next downbeat.
import { BaseScene, clamp } from './base.js';
import { easeInCubic, easeOutCubic, springHit, easeOutBack, decay } from '../util.js';

export class Domino extends BaseScene {
  static meta = { id: 'domino', keywords: ['PLOT', 'LOW', 'PRICES', 'OH', 'YEAH', "THAT'S", 'FALL'], products: true, energy: [0.3, 1], minWords: 3, maxWords: 10 };
  constructor(ctx, plan) {
    super(ctx, plan);
    const m = this.music, W = this.words, N = W.length;
    this.floor(0x16e0ff, 300, 0);
    // downbeat at/after the end of the scene's last word = final hit (cut lands on it)
    this.finalHit = this.t1;
    const sixteenth = m.period / 4;
    this.fallDur = 0.32;
    // 8th-note chain if every word is already standing when the chain reaches it, else 16ths
    let step = sixteenth * 2;
    if (W.some((w, k) => this.finalHit - (N - 1 - k) * step - this.fallDur < w.start + 0.15)) step = sixteenth;
    let x = 0;
    this.items = W.map((w, k) => {
      const o = this.word(w, { height: 2.4, maxWidth: 4.6, depth: 0.55, font: k % 2 ? 'anton' : 'bowlby',
        combo: [['red', 'ink'], ['yellow', 'purple'], ['white', 'blue'], ['pink', 'purple']][k % 4], pool: ['rise', 'swing', 'expand', 'stretch'] });
      // 16:9: the line runs across the frame, left-front to right-back, gently snaking
      o.base = { x: -8.5 + k * 2.25, z: -k * 0.95 + Math.sin(k * 0.9) * 0.5, ry: -1.0 };
      o.hit = this.finalHit - (N - 1 - k) * step;       // time this domino hits the floor
      o.tip = o.hit - this.fallDur;
      return o;
    });
    this.pusher = this.product('fridge'); this.pusher.scale.setScalar(0.8);
    this.bg = { pattern: 1, a: 0x2a5bff, b: 0x16e0ff, c: 0xffffff };
  }
  events() {
    this.items.forEach((o, k) => {
      const big = k === this.items.length - 1;
      this.fx.burst({ t0: o.hit, pos: { x: o.base.x + 1.6, y: 0.2, z: o.base.z - 0.8 }, n: big ? 120 : 24, speed: big ? 10 : 5, gravity: 12, life: big ? 1 : 0.6, size: 0.12, colors: ['white', 'yellow', 'red'] });
      this.fx.impact(o.hit, big ? 1.4 : 0.25, big ? 6 : 14);
    });
    const last = this.items.at(-1);
    this.fx.ring({ t0: last.hit, pos: { x: last.base.x, y: 0.05, z: last.base.z - 1 }, maxR: 12, life: 0.6, color: 0xffd400 });
  }
  update(t) {
    const m = this.music, items = this.items;
    let front = items[0];
    items.forEach((o, k) => {
      this.lyric(o, t);
      const u = easeInCubic(clamp((t - o.tip) / this.fallDur));
      const bounce = t > o.hit ? springHit(t - o.hit, 25, 9) * 0.08 : 0;
      o.group.position.set(o.base.x, 0, o.base.z);
      o.group.rotation.order = 'YXZ';
      o.group.rotation.set(-u * (Math.PI / 2 - 0.02) + bounce, o.base.ry, 0);
      // pivot around the bottom edge: offset the inner word up by half height
      o.inner.position.set(0, o.height / 2, 0);
      if (t < o.tip) o.group.scale.setScalar(1 + m.beatPulse(t) * 0.06);
      if (t >= o.w.start) front = o;
      if (t >= o.tip - 0.15) front = o;
    });
    // the pusher (fridge) slides in and shoves the first domino
    const f = items[0];
    const pu = easeOutCubic(clamp((t - (f.tip - 0.45)) / 0.45));
    this.pusher.position.set(f.base.x - 6 + pu * 4.6, 0, f.base.z + 2.6 - pu * 2.1);
    this.pusher.rotation.y = -1.0;
    this.pusher.visible = t > f.tip - 0.6;
    // camera: travels along the line with the newest word; whips along the falling front
    const fb = front.base;
    const cascade = t >= f.tip;
    const cx = cascade ? fb.x : Math.min(fb.x, 0);
    this.cam.pos.set(cx - 5.5, cascade ? 4.4 : 3.4, fb.z + (cascade ? 8.5 : 8));
    this.cam.look.set(cx + 2.5, 1.4, fb.z - 2);
    this.cam.fov = cascade ? 55 : 50;
    this.cam.roll = cascade ? -0.08 : 0.03;
    this.light.target.set(fb.x, 0, fb.z);
    this.bg.spin = t * 0.25;
  }
}
