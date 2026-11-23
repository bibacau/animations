// TV PORTAL: the TV powers on with the music and every lyric bursts out of its screen
// toward the viewer; the camera backs away from the flying words.
import { BaseScene, groupRows, clamp } from './base.js';
import { drawTV } from '../products.js';
import { easeOutBack, easeOutCubic, decay, springHit } from '../util.js';

export class TvPortal extends BaseScene {
  static meta = { id: 'tvPortal', requires: 'intro', keywords: ['ON', 'TURN', 'TV', "TV'S", 'SCREEN', 'FLASHING'], products: true, energy: [0, 0.8], minWords: 1, maxWords: 9 };
  constructor(ctx, plan) {
    super(ctx, plan);
    this.tv = this.product('tv');
    this.shadowFloor(this.tv.userData.base, 0.45);
    // 16:9: words fly out to the left, right and across the bottom of the frame
    const slots = [{ x: -4.5, y: 0.55, z: 0.9 }, { x: 4.5, y: 0.55, z: 0.9 }, { x: 0, y: -2.75, z: 2.4 }, { x: -5.4, y: 3.1, z: -0.4 }, { x: 5.4, y: 3.1, z: -0.4 }];
    // two extra screens in the background echo the main one
    this.sideTVs = [-1, 1].map((sd) => { const tv = this.product('tv'); tv.scale.setScalar(1.15); tv.position.set(sd * 8.6, 1.6, -5); tv.rotation.y = -sd * 0.45; return tv; });
    this.items = [];
    groupRows(this.words).forEach((row, r) => {
      const slot = slots[r % slots.length];
      const big = r === 2;
      const objs = row.map((w) => this.word(w, { height: big ? 1.5 : 1.7, font: big ? 'bowlby' : 'anton', depth: 0.6,
        pool: ['expand', 'flip', 'snap', 'stretch', 'swing', 'unzip'] }));
      const xs = this.layoutRow(objs, big ? 9 : 3.9);
      objs.forEach((o, k) => { o.slot = { x: slot.x + xs[k], y: slot.y, z: slot.z }; this.items.push(o); });
    });
    this.firstKick = this.music.kicks.find((k) => k.t >= this.t0 + 0.2)?.t ?? this.t0 + 0.5;
    this.bg = { pattern: 0, a: 0x07040f, b: 0x1d0b3a, c: 0x7b2cff };
  }
  events() {
    const fx = this.fx;
    fx.flash(this.firstKick, 0.25, 14, 0x9fdcff);
    for (const o of this.items) fx.burst({ t0: o.w.start, pos: { x: 0, y: 0, z: 0.4 }, n: 40, speed: 7, gravity: 4, life: 0.9, size: 0.1, cone: { x: o.slot.x * 0.3, y: o.slot.y * 0.3, z: 1 }, spread: 1.4, colors: ['yellow', 'cyan', 'white'] });
    const last = this.words.at(-1);
    fx.ring({ t0: last.start, pos: { x: 0, y: 0, z: 0.3 }, normal: { x: 0, y: 0, z: 1 }, maxR: 9, life: 0.6, color: 0xffd400 });
    fx.impact(last.start, 0.8); fx.flash(last.start, 0.55, 9, 0xfff2b0);
  }
  update(t) {
    const m = this.music, tv = this.tv, W = this.words;
    const w0 = W[0].start, last = W.at(-1);
    const cur = W.filter((w) => w.start <= t).at(-1);
    if (t < this.firstKick) drawTV(tv, 'off', t);
    else if (t < w0) drawTV(tv, Math.floor(t * 24) % 4 === 0 ? 'bars' : 'static', t);
    else if (t < last.start) drawTV(tv, 'text', t, cur.display, ['#ffd400', '#16e0ff', '#ff4fd8'][cur.i % 3]);
    else drawTV(tv, 'logo', t, '', '#ffffff');
    tv.scale.setScalar(1 + m.kick(t) * 0.04);
    tv.rotation.y = Math.sin(t * 0.7) * 0.18;
    tv.rotation.x = -0.04 + m.beatPulse(t) * 0.03;
    this.sideTVs.forEach((s, i) => {
      if (t < this.firstKick) drawTV(s, 'off', t);
      else if (t < last.start) drawTV(s, (Math.floor(t * 12) + i) % 3 ? 'static' : 'bars', t + i);
      else drawTV(s, 'text', t, cur.display, i ? '#16e0ff' : '#ff4fd8');
      s.position.y = 1.6 + springHit(t - m.beatTime(m.beatIndex(t)), 18, 8) * 0.12 * (i ? 1 : -1);
    });

    for (const o of this.items) {
      const lt = t - o.w.start;
      this.lyric(o, t);
      const u = easeOutBack(clamp(lt / 0.32), 1.3);
      const s = o.slot;
      o.group.position.set(s.x * u, s.y * u, 0.2 + (s.z - 0.2) * u);
      o.group.scale.setScalar(Math.max(0.001, 0.12 + 0.88 * clamp(u, 0, 1.2)) * (1 + m.beatPulse(t) * 0.05));
      o.group.rotation.y = (1 - clamp(u)) * 0.9 + Math.sin(t * 1.3 + o.w.i) * 0.07;
      o.group.rotation.x = Math.sin(t * 1.1 + o.w.i * 2) * 0.05;
    }
    // camera: push toward the dark TV, then back away from every word that flies out
    let z = 7.0 - clamp((t - this.t0) / Math.max(0.1, w0 - this.t0)) * 1.0 + 4.2 * easeOutCubic((t - w0 + 0.15) / 0.4);
    for (const w of W.slice(1)) z += 0.7 * easeOutCubic((t - w.start) / 0.35);
    z += 2.0 * easeOutCubic((t - last.start) / 0.45) + Math.max(0, t - last.start) * 0.8;
    this.cam.pos.set(Math.sin(t * 0.9) * 1.4, 0.3 + Math.sin(t * 0.6) * 0.3, z);
    this.cam.look.set(0, 0.1, 0); this.cam.fov = 50; this.cam.roll = Math.sin(t * 0.8) * 0.03;
    const on = t >= last.start;
    this.bg = on ? { pattern: 1, a: 0x2a0a5e, b: 0x7b2cff, c: 0xffd400, spin: t * 0.15 } : { pattern: 0, a: 0x07040f, b: 0x1d0b3a, c: 0x7b2cff };
    this.light.target.set(0, 0, 0);
    this.bgType = t < w0 ? null : { amt: on ? 0.2 : 0.1, color: on ? 0xffffff : 0x7b2cff };
    this.invert = on ? decay(t - last.start, 25) * 0.6 : 0;
  }
}
