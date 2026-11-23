// FINALE (instrumental outro): LETTER RACE -> RECONSTRUCTION -> FINAL IMPACT.
// The letters of T-POT race down a neon road (camera follows the leader) with the
// appliances racing alongside; on the next downbeat they fly into formation, products
// slam down around the logo one per beat, the performers hop on top, and on the last
// downbeat everything punches once and the world freezes.
import { BaseScene, clamp } from './base.js';
import { Word3D } from '../text3d.js';
import { easeOutBack, easeOutCubic, easeInOutCubic, springHit, decay, easeInCubic, arc, hash } from '../util.js';

export class Finale extends BaseScene {
  static meta = { id: 'finale', requires: 'outro', character: true, products: true, energy: [0, 1] };
  constructor(ctx, plan) {
    super(ctx, plan);
    const m = this.music;
    const chars = ['T', '-', 'P', 'O', 'T'];
    const cols = [['yellow', 'red'], ['white', 'red'], ['red', 'ink'], ['cyan', 'blue'], ['yellow', 'purple']];
    // final logo layout (measured from a reference word so spacing is exact)
    const ref = new Word3D(ctx.fonts, 'T-POT', { font: 'bowlby', height: 1.9 });
    this.letters = chars.map((c, i) => {
      const w = new Word3D(ctx.fonts, c, { font: 'bowlby', height: 1.9, depth: 1.3, front: cols[i][0], side: cols[i][1] });
      w.home = { x: ref.letterX(i), y: 1.9 / 2 + 0.02 };
      w.race = { lane: (i - 2) * 1.3, speed: 15 + hash(i * 3.3) * 3.5, wob: hash(i) * 6 };
      this.group.add(w.group); return w;
    });
    const downs = m.beatsBetween(this.t0 - 0.01, this.t1).filter((b) => b.inBar === 0).map((b) => b.t);
    this.assemble = downs[1] ?? this.t0 + 2;
    this.finalHit = downs.at(-1) ?? this.t1 - 0.8;
    const beats = m.beatsBetween(this.assemble + 0.1, this.finalHit).map((b) => b.t);
    this.prods = ['tv', 'fridge', 'washer', 'rice'].map((k, i) => {
      const p = this.product(k);
      const s = { tv: 0.75, fridge: 0.62, washer: 0.62, rice: 0.8 }[k];
      p.scale.setScalar(s);
      p.userData.slot = [{ x: -3.6, y: 0.43 * 0.75 + 1.0, z: -2.2 }, { x: 3.5, y: 0, z: -2.0 }, { x: -2.3, y: 0, z: 1.6 }, { x: 2.5, y: 0, z: 1.8 }][i];
      if (k === 'tv') p.userData.slot.y = -p.userData.base * s;
      p.userData.slam = beats[i] ?? this.assemble + 0.5 * (i + 1);
      p.userData.lane = [-4.5, -6.0, -7.5, -9.0][i];
      return p;
    });
    const hop = beats.slice(4);
    this.chars = ['pip', 'volt', 'boo'].map((sk, i) => {
      const c = this.character(sk, 0.62);
      c.land = hop[i] ?? this.finalHit - 0.5;
      c.spot = [0, 2, 4][i];
      return c;
    });
    this.floor(0x15112a, 400, 0);
    this.bg = { pattern: 2, a: 0x0b0620, b: 0x3a0f6e, c: 0x16e0ff };
  }
  events() {
    const fx = this.fx;
    fx.flash(this.assemble, 0.45, 10); fx.impact(this.assemble, 0.8);
    fx.burst({ t0: this.assemble, pos: { x: 0, y: 1, z: 0 }, n: 120, speed: 9, gravity: 8, life: 1, size: 0.12, colors: ['yellow', 'cyan', 'pink', 'white'] });
    for (const p of this.prods) {
      const s = p.userData.slot;
      fx.impact(p.userData.slam, 0.6); fx.ring({ t0: p.userData.slam, pos: { x: s.x, y: 0.05, z: s.z }, maxR: 4, life: 0.45, color: 0x16e0ff });
      fx.burst({ t0: p.userData.slam, pos: { x: s.x, y: 0.2, z: s.z }, n: 40, speed: 6, gravity: 12, life: 0.7, size: 0.1, colors: ['white', 'cyan'] });
    }
    for (const c of this.chars) fx.burst({ t0: c.land, pos: { x: this.letters[c.spot].home.x, y: 1.9, z: 0.5 }, n: 18, speed: 4, gravity: 10, life: 0.5, size: 0.08, colors: ['yellow', 'white'] });
    const f = this.finalHit;
    fx.flash(f, 0.9, 6); fx.impact(f, 1.6, 5); fx.zoom(f, 0.6, 0.3); fx.glitch(f, 0.6, 0.15);
    fx.ring({ t0: f, pos: { x: 0, y: 1, z: 0.8 }, normal: { x: 0, y: 0, z: 1 }, maxR: 14, life: 0.8, color: 0xffd400 });
    fx.burst({ t0: f, pos: { x: 0, y: 1.2, z: 0.5 }, n: 300, speed: 15, gravity: 7, life: 1.6, size: 0.16, colors: ['yellow', 'red', 'white', 'cyan', 'pink', 'lime'] });
  }
  update(t) {
    const m = this.music, A = this.assemble, F = this.finalHit;
    const raceX = (L, tt) => (tt - this.t0) * L.race.speed + Math.sin(tt * 3 + L.race.wob) * 0.6;
    // race phase positions (road along +x), leader = max x
    let lead = -1e9;
    this.letters.forEach((L) => { lead = Math.max(lead, raceX(L, Math.min(t, A))); });
    const leadA = lead;
    this.letters.forEach((L, i) => {
      L.reset();
      const rx = raceX(L, Math.min(t, A));
      const bi = m.beatIndex(t);
      const hopY = Math.abs(Math.sin(Math.PI * m.phase(t))) * 0.5 * ((bi + i) % 2);
      const racePos = { x: rx - leadA, y: 0.95 + hopY, z: L.race.lane };
      const u = easeOutBack(clamp((t - A + 0.25) / 0.45), 1.3);
      const p = t < A - 0.25 ? racePos : { x: racePos.x + (L.home.x - racePos.x) * u, y: 0.95 + (L.home.y - 0.95) * u + Math.sin(u * Math.PI) * 3, z: racePos.z * (1 - u) };
      const hit = springHit(t - F, 20, 6) * 0.35;
      L.group.position.set(p.x, p.y, p.z);
      L.group.rotation.set(0, t < A - 0.25 ? -0.3 : (1 - clamp(u)) * Math.PI * 2, t < A - 0.25 ? Math.sin(t * 9 + i) * 0.08 : 0);
      L.group.scale.set(1 + hit * 0.5, (1 - hit) * (1 + (t > A ? m.beatPulse(t) * 0.06 : 0)), 1 + hit * 0.5);
    });
    // products: race alongside, then slam into their slots one per beat
    this.prods.forEach((p, i) => {
      const d = p.userData, s = d.slot;
      const fall = 0.35, u = clamp((t - (d.slam - fall)) / fall);
      if (t < A) { p.position.set(-2 - i * 1.5 + Math.sin(t * 4 + i) * 0.8, s.y, d.lane); p.rotation.set(0, Math.PI / 2, Math.sin(t * 12 + i) * 0.05); p.visible = true; }
      else { p.visible = t > d.slam - fall; p.position.set(s.x, s.y + (1 - easeInCubic(u)) * 10 + Math.abs(springHit(t - d.slam, 14, 7)) * 0.3, s.z); p.rotation.set(0, s.x < 0 ? 0.5 : -0.5, (1 - u) * 0.6); }
      if (d.kind === 'washer') d.drum.rotation.z = -t * 8;
      if (d.kind === 'rice') d.lid.rotation.x = -Math.max(0, springHit(t - F, 10, 4)) * 1.2;
    });
    // performers hop on top of the logo on beats, cheering through the final hit
    this.chars.forEach((c, i) => {
      const L = this.letters[c.spot];
      const from = { x: L.home.x + (i - 1) * 4, y: 0, z: 3 }, to = { x: L.home.x, y: 1.9, z: 0.3 };
      const u = clamp((t - (c.land - 0.45)) / 0.45);
      const p = arc(from, to, 2.2, u);
      c.root.visible = t > c.land - 0.9;
      c.root.position.set(p.x, p.y + (t > F ? Math.abs(springHit(t - F, 12, 4)) * 1.2 : 0), p.z);
      c.root.rotation.y = (i - 1) * 0.3;
      c.pose(u < 1 ? 'jump' : 'cheer', m.count(t) + i * 0.3, decay(t - c.land, 10));
    });
    // camera: chase the leader during the race; settle into a low hero orbit; final punch & freeze
    if (t < A) {
      this.cam.pos.set(-6.5, 3.6, 10 + Math.sin(t * 2) * 0.5);
      this.cam.look.set(-1.5, 1, -2);
      this.cam.roll = Math.sin(t * 3) * 0.06;
      this.cam.fov = 60;
      this.bg = { pattern: 2, a: 0x0b0620, b: 0x3a0f6e, c: 0x16e0ff };
      this.zoomBlur = 0.12;
    } else {
      const k = easeInOutCubic(clamp((t - A) / 0.6));
      const orbit = Math.sin((Math.min(t, F) - A) * 0.35) * 0.45;
      const freeze = t > F ? easeOutCubic(clamp((t - F) / 0.4)) : 0;
      const dist = 19 - freeze * 1.5;
      this.cam.pos.set(Math.sin(orbit) * dist * k + (1 - k) * -6.5, 3.6 - k * 0.4, Math.cos(orbit) * dist * k + (1 - k) * 10);
      this.cam.look.set(0, 1.6, 0);
      this.cam.roll = 0;
      this.cam.fov = 50;
      this.zoomBlur = 0;
      this.bg = t >= F ? { pattern: 1, a: 0xff2a4d, b: 0xffd400, c: 0xffffff, spin: (F - A) * 0.2 + (t - F) * 0.02 } : { pattern: 1, a: 0x7b2cff, b: 0x2a5bff, c: 0xffd400, spin: (t - A) * 0.2 };
    }
    this.light.target.set(0, 0, 0);
    // fade to black during the last half second of audio
    const endFade = clamp((t - (this.t1 - 0.9)) / 0.5);
    this.fade = endFade;
  }
}
