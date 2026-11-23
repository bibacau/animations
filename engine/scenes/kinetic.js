// KINETIC STACK: pure typography scene (no characters/products). Words slam into a
// rotating 3D column; the column orbits on downbeats. Also the planner's safe fallback.
import { BaseScene, groupRows, clamp } from './base.js';
import { easeOutCubic, easeInOutCubic, springHit } from '../util.js';

export class Kinetic extends BaseScene {
  static meta = { id: 'kinetic', keywords: [], energy: [0, 1], minWords: 1, maxWords: 20 };
  constructor(ctx, plan) {
    super(ctx, plan);
    this.items = [];
    groupRows(this.words).forEach((row, r) => {
      const objs = row.map((w) => this.word(w, { height: 1.3, font: r % 2 ? 'bowlby' : 'anton', depth: 0.7 }));
      const xs = this.layoutRow(objs, 4.6);
      objs.forEach((o, k) => { o.slot = { x: xs[k], y: -r * 1.9, z: 0 }; this.items.push(o); });
    });
    this.shadowFloor(-20, 0);
    this.bg = { pattern: 3, a: 0x15112a, b: 0x2a5bff, c: 0xffd400 };
  }
  events() { for (const o of this.items) this.fx.impact(o.w.start, 0.25); }
  update(t) {
    const m = this.music;
    let focusY = 0;
    for (const o of this.items) {
      this.lyric(o, t);
      o.group.position.set(o.slot.x, o.slot.y, o.slot.z);
      o.group.scale.setScalar(1 + m.beatPulse(t) * 0.06);
      if (t >= o.w.start) focusY = o.slot.y;
    }
    const rows = this.items.filter((o) => t >= o.w.start);
    const fy = rows.length ? rows.reduce((a, o) => Math.min(a, o.slot.y), 0) : 0;
    const bar = Math.floor(m.count(t) / 4);
    const a = Math.sin(bar * 1.7) * 0.55 + (easeInOutCubic(clamp((m.count(t) % 4) / 0.5)) - 0.5) * 0.25;
    this.cam.pos.set(Math.sin(a) * 10, fy + 1.5, Math.cos(a) * 10);
    this.cam.look.set(0, fy * 0.7, 0);
    this.cam.roll = Math.sin(t) * 0.05;
    this.bg.spin = t * 0.3;
    this.light.target.set(0, fy, 0);
  }
}
