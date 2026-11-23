// LYRIC SLIDE: the phrase builds a giant diagonal slide one word at a time, right in
// front of a sliding performer (each word appears at its vocal onset just before the
// rider reaches it). The last ramp word kicks up, the rider launches, and lands on the
// final lyric exactly on a beat -> shockwave.
import { BaseScene, clamp } from './base.js';
import { arc, decay, springHit, easeOutCubic, lerp } from '../util.js';

export class Slide extends BaseScene {
  static meta = { id: 'slide', keywords: ['HEAD', 'BEST', 'DEAL', 'WANT', 'TO', 'SLIDE', 'DOWN'], character: true, energy: [0.3, 1], minWords: 4, maxWords: 12 };
  constructor(ctx, plan) {
    super(ctx, plan);
    const W = this.words, ramp = W.slice(0, -1), fin = W.at(-1);
    this.ang = -0.42;
    this.dir = { x: Math.cos(this.ang), y: Math.sin(this.ang) };
    this.nrm = { x: -Math.sin(this.ang), y: Math.cos(this.ang) };
    let s = 0;
    this.segs = ramp.map((w, k) => {
      const o = this.word(w, { height: 1.2, maxWidth: 5, depth: 2.8, font: k % 2 ? 'bowlby' : 'anton',
        combo: [['yellow', 'red'], ['white', 'purple'], ['cyan', 'blue'], ['lime', 'purple'], ['pink', 'purple']][k % 5], pool: ['unzip', 'expand', 'rise', 'drop', 'stretch', 'flip'] });
      o.s0 = s; s += o.width + 0.12; o.s1 = s;
      return o;
    });
    this.total = s;
    // rider arrival times: reach each segment no earlier than its onset
    let tArr = this.t0 + 0.2;
    this.arrive = this.segs.map((o) => (tArr = Math.max(o.w.start + 0.22, tArr + 0.12)));
    this.landT = this.beatAfter(fin.start + 0.15);
    if (this.landT > this.t1 - 0.1) this.landT = this.beatAfter(fin.start + 0.1, { half: true });
    this.launchT = Math.min(this.landT - this.music.period * 0.9, Math.max(this.arrive.at(-1) + 0.25, this.landT - this.music.period * 1.5));
    const end = this.pt(this.total, 1);
    this.fin = this.word(fin, { height: 2.2, maxWidth: 7, depth: 1.6, font: 'bowlby', combo: ['red', 'yellow'], entrance: { type: 'smash', dur: 0.14 } });
    this.finPos = { x: end.x + 4.5, y: end.y - 4.2 };
    this.char = this.character('pip', 0.8);
    this.bg = { pattern: 1, a: 0xff2a4d, b: 0xff7a1a, c: 0xffd400 };
  }
  pt(s, lift = 0) { return { x: this.dir.x * s + this.nrm.x * lift, y: this.dir.y * s + this.nrm.y * lift }; }
  riderS(t) {
    const A = this.arrive, S = this.segs;
    if (t <= A[0]) return 0;
    for (let i = 0; i < A.length - 1; i++) if (t < A[i + 1]) return lerp(S[i].s0, S[i + 1].s0, (t - A[i]) / (A[i + 1] - A[i]));
    return lerp(S.at(-1).s0, this.total, clamp((t - A.at(-1)) / Math.max(0.1, this.launchT - A.at(-1))));
  }
  events() {
    const f = this.finPos;
    this.fx.impact(this.landT, 1.3, 6); this.fx.flash(this.landT, 0.35, 10, 0xffd400);
    this.fx.ring({ t0: this.landT, pos: { x: f.x, y: f.y + this.fin.height / 2 + 0.05, z: 0 }, maxR: 9, life: 0.6, color: 0xffffff });
    this.fx.burst({ t0: this.landT, pos: { x: f.x, y: f.y + this.fin.height / 2, z: 0.5 }, n: 160, speed: 11, gravity: 12, life: 1.1, size: 0.15, colors: ['yellow', 'white', 'red', 'cyan'] });
    for (const a of this.arrive) this.fx.impact(a, 0.15, 16);
  }
  update(t) {
    const m = this.music;
    const halfH = this.segs[0].height / 2;
    this.segs.forEach((o, k) => {
      this.lyric(o, t);
      const c = this.pt((o.s0 + o.s1) / 2);
      const kick = k === this.segs.length - 1 ? 0.35 : 0;     // last ramp piece tilts up into a kicker
      o.group.position.set(c.x, c.y + (kick ? 0.4 : 0), 0);
      o.group.rotation.set(0, 0, this.ang + kick + Math.sin(t * 3 + k) * 0.01);
      o.letters.forEach((L, i) => { L.mesh.position.y += Math.max(0, springHit(t - this.arrive[k] - i * 0.04, 25, 10)) * 0.15; });
    });
    const f = this.fin;
    this.lyric(f, t);
    const land = springHit(t - this.landT, 18, 6) * 0.25;
    f.group.position.set(this.finPos.x, this.finPos.y - land, 0);
    f.group.scale.set(1 + land * 0.5, 1 - land, 1);
    f.group.rotation.y = -0.15;
    // rider
    const ch = this.char;
    let pos, mode, rz = 0;
    if (t < this.launchT) {
      const s = this.riderS(t);
      pos = this.pt(s, halfH); mode = t < this.arrive[0] ? 'idle' : 'slide'; rz = this.ang;
      if (s > this.segs.at(-1).s0) pos.y += 0.5 * clamp((s - this.segs.at(-1).s0) / this.segs.at(-1).width);
    } else {
      const p0 = this.pt(this.total, halfH); p0.y += 0.5;
      const p1 = { x: this.finPos.x - 0.4, y: this.finPos.y + f.height / 2 };
      const u = clamp((t - this.launchT) / (this.landT - this.launchT));
      pos = arc(p0, p1, 2.8, u); mode = u < 1 ? (u > 0.85 ? 'land' : 'jump') : 'cheer';
      rz = u < 1 ? -u * Math.PI * 2 : 0;   // front flip
    }
    ch.root.position.set(pos.x, pos.y, 0.4);
    ch.root.rotation.set(0, mode === 'slide' ? Math.PI / 2 : 0.3, rz);
    ch.pose(mode, m.count(t), mode === 'cheer' ? decay(t - this.landT, 8) : 0);
    // camera tracks the slide, then pulls back for the landing
    const back = easeOutCubic(clamp((t - this.landT + 0.3) / 0.6));
    this.cam.pos.set(pos.x + 3.2 + back, pos.y + 1.6 + back, 11 + back * 2);
    this.cam.look.set(pos.x + 3.6, pos.y - 1.2, 0);
    this.cam.roll = this.ang * 0.25 * (1 - back);
    this.light.target.set(pos.x, pos.y, 0);
    this.bg.spin = t * 0.4;
  }
}
