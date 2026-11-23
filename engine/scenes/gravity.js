// LETTER GRAVITY: lyrics fall from the sky ("prices dropping") and land ON the beat,
// stacking into a wobbly tower. A tiny performer dodges the first one, bounces on
// the pile, and the tower collapses on the last word, launching the character.
import { BaseScene, clamp } from './base.js';
import { easeInCubic, springHit, keyPath, easeOutCubic, decay, hash } from '../util.js';

export class Gravity extends BaseScene {
  static meta = { id: 'gravity', keywords: ['LOWEST', 'LOW', 'PRICES', 'GONE', 'DROP', 'FALL', 'DOWN'], character: true, energy: [0, 0.75], minWords: 3, maxWords: 9 };
  constructor(ctx, plan) {
    super(ctx, plan);
    this.floor(0xffd400, 200, 0);
    this.items = [];
    let y = 0;
    this.words.forEach((w, k) => {
      const o = this.word(w, { height: 1.05, maxWidth: 4.3 - (k % 3) * 0.4, depth: 1.3, font: k % 2 ? 'bowlby' : 'anton',
        combo: [['red', 'ink'], ['purple', 'ink'], ['cyan', 'blue'], ['pink', 'purple'], ['white', 'red'], ['lime', 'purple']][k % 6], entrance: { type: 'snap', dur: 0.05 } });
      // land on the 8th-note grid right after the vocal onset -> every landing is a beat
      o.land = this.beatAfter(w.start + 0.16, { half: true });
      o.rest = { x: (k % 2 ? 0.35 : -0.3) * (k ? 1 : 0), y: y + o.height / 2, ry: (hash(k + 3) - 0.5) * 0.5 };
      y += o.height + 0.02;
      this.items.push(o);
    });
    this.topY = y;
    const last = this.items.at(-1);
    this.collapse = this.beatAfter(last.land + 0.12, { half: true });
    if (this.collapse > this.t1 - 0.15) this.collapse = last.land + 0.06;
    // performer keyframes: run in, dodge the first drop, hop on the pile on beats, get launched
    const P = this.music.period, first = this.items[0];
    this.char = this.character('pip', 0.9);
    const keys = [{ t: this.t0, x: -4.5, y: 0, mode: 'run' }, { t: first.w.start - 0.05, x: -0.2, y: 0, mode: 'run' },
      { t: first.land, x: 2.9, y: 0, h: 1.6, mode: 'jump' }];
    let tt = first.land;
    while (tt + P < this.collapse - 0.05) { tt += P; keys.push({ t: tt, x: 2.9, y: 0, h: 0.5, mode: 'jump' }); }
    keys.push({ t: this.collapse, x: 2.9, y: 0, mode: 'idle' });
    keys.push({ t: this.collapse + 0.9, x: 7, y: 9, h: 0, mode: 'launch' });
    this.keys = keys;
    this.bg = { pattern: 4, a: 0xff2a4d, b: 0xff7a1a, c: 0xffffff };
  }
  events() {
    for (const o of this.items) {
      const lvl = this.music.beat(this.music.nearestBeat(o.land)).level;
      this.fx.impact(o.land, 0.35 + lvl * 0.2);
      this.fx.ring({ t0: o.land, pos: { x: 0, y: 0.05, z: 0 }, maxR: 4 + lvl * 1.5, life: 0.45, color: 0xffffff });
      this.fx.burst({ t0: o.land, pos: { x: o.rest.x, y: o.rest.y - o.height / 2, z: 0.6 }, n: 30, speed: 5, gravity: 12, life: 0.7, size: 0.13, colors: ['white', 'yellow', 'red'] });
    }
    this.fx.burst({ t0: this.collapse, pos: { x: 0, y: this.topY / 2, z: 0 }, n: 140, speed: 12, gravity: 10, life: 1.2, size: 0.18, colors: ['red', 'yellow', 'purple', 'white'] });
    this.fx.impact(this.collapse, 1.1); this.fx.flash(this.collapse, 0.35, 12, 0xffd400);
  }
  update(t) {
    const m = this.music;
    let top = 0;
    this.items.forEach((o, k) => {
      this.lyric(o, t);
      const fall = o.land - o.w.start;
      const u = clamp((t - o.w.start) / fall);
      const r = o.rest;
      let y = r.y + (1 - easeInCubic(u)) * 9;
      // squash on landing + jolt when later words land on top
      let sq = springHit(t - o.land, 30, 10) * 0.35;
      for (const p of this.items.slice(k + 1)) sq += springHit(t - p.land, 26, 12) * 0.12;
      o.group.position.set(r.x, y, 0);
      o.group.rotation.set(0, r.ry, (1 - u) * 0.6 * (k % 2 ? 1 : -1) + Math.sin(t * 5 + k) * 0.02 * clamp(t - o.land));
      o.group.scale.set(1 + sq * 0.6, 1 - sq, 1 + sq * 0.3);
      if (t >= o.land) top = r.y + o.height / 2;
      // collapse: pieces fly apart
      const c = t - this.collapse;
      if (c > 0) {
        o.letters.forEach((L, i) => {
          const a = hash(k * 13 + i) * 6.28;
          L.mesh.position.x += Math.cos(a) * 6 * easeOutCubic(c * 1.5);
          L.mesh.position.y += Math.sin(a) * 3 * c * 2 + 5 * c - 9 * c * c;
          L.mesh.position.z += (hash(i + k) - 0.3) * 6 * c;
          L.mesh.rotation.set(c * 6 * hash(i), c * 5, c * 7 * hash(k));
        });
      }
    });
    const p = keyPath(this.keys, t);
    const ch = this.char;
    ch.root.position.set(p.x, p.y, 0.4);
    ch.root.rotation.y = p.mode === 'run' ? Math.PI / 2 : -0.4;
    const landK = p.to ? decay(t - p.from.t, 14) : 0;
    ch.pose(p.mode === 'jump' && p.u > 0.85 ? 'land' : p.mode, m.count(t) * 2, landK);
    if (p.mode === 'launch') ch.root.rotation.z = (t - this.collapse) * 8;
    // camera tracks the growing tower
    const fy = Math.max(1.6, top * 0.62);
    const c = clamp((t - this.collapse) / 0.6);
    this.cam.pos.set(1.6 + Math.sin(t * 0.7) * 1.0, fy + 1.6 + c * 2, 8.2 + top * 0.45 + c * 3);
    this.cam.look.set(0.6, fy + 0.2, 0);
    this.cam.fov = 50;
    this.light.target.set(0, fy, 0);
    this.bg.spin = t * 0.2;
  }
}
