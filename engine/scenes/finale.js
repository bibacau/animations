// FINALE (instrumental outro): LOGO RACE -> 3D ASSEMBLY -> BRAND CARD.
// The real T-POT logo pieces (traced from the artwork: T, -, P, the O-ring, T) race down a
// neon road with the appliances; on the next downbeat they fly into formation, the green
// swoosh spins in underneath and the leaf pops into the O. Products slam down around it
// one per beat, performers hop on top. On the following downbeat the camera squares up,
// everything is blasted away and a white radial wipe bursts out of the O, revealing the
// exact flat logo; the final downbeat punches it once with a light sweep.
import * as THREE from 'three';
import { BaseScene, clamp } from './base.js';
import { logo3D } from '../logo.js';
import { easeOutBack, easeOutCubic, easeInOutCubic, springHit, decay, easeInCubic, arc, hash, easeOutExpo } from '../util.js';

export class Finale extends BaseScene {
  static meta = { id: 'finale', requires: 'outro', character: true, products: true, energy: [0, 1] };
  constructor(ctx, plan) {
    super(ctx, plan);
    const m = this.music;
    const L = logo3D(ctx.logo, 11, 0.9);
    this.L = L; this.logoY = 2.6;
    L.group.position.set(0, this.logoY, 0);
    this.group.add(L.group);
    this.racers = ['T1', 'dash', 'P', 'O', 'T2'].map((k, i) => {
      const p = L.parts[k];
      p.race = { lane: (i - 2) * 1.6, speed: 15 + hash(i * 3.3) * 4, wob: hash(i) * 6 };
      return p;
    });
    const downs = m.beatsBetween(this.t0 - 0.01, this.t1).filter((b) => b.inBar === 0).map((b) => b.t);
    this.A = downs[1] ?? this.t0 + 2;                       // assemble
    this.R = downs[2] ?? this.A + 2;                        // reveal (brand card)
    this.F = downs[3] ?? Math.min(this.t1 - 0.6, this.R + 2); // final punch
    const P = m.period;
    this.leafT = this.A + P / 2;
    const slams = m.beatsBetween(this.A + 0.1, this.R - 0.05).map((b) => b.t);
    this.prods = ['tv', 'fridge', 'washer', 'rice'].map((k, i) => {
      const p = this.product(k);
      const s = { tv: 1.0, fridge: 0.85, washer: 0.95, rice: 1.1 }[k];
      p.scale.setScalar(s);
      const slot = [{ x: -9.2, z: -1.5 }, { x: 9.0, z: -1.8 }, { x: -6.4, z: 2.6 }, { x: 6.6, z: 2.6 }][i];
      slot.y = k === 'tv' ? -p.userData.base * s : 0;
      p.userData.slot = slot;
      p.userData.slam = slams[i] ?? this.A + P * (i + 1);
      p.userData.lane = [-4.5, -6, -7.5, -9][i];
      return p;
    });
    this.chars = ['pip', 'volt', 'boo'].map((sk, i) => {
      const c = this.character(sk, 0.75);
      c.part = [L.parts.T1, L.parts.P, L.parts.T2][i];
      c.land = (slams[i] ?? this.A + P * (i + 1)) + P / 2;
      return c;
    });
    this.floor(0x15112a, 400, 0);
    this.card = null;
    this._v = new THREE.Vector3(); this._b = new THREE.Box3();
    this.bg = { pattern: 2, a: 0x0b0620, b: 0x3a0f6e, c: 0x16e0ff };
  }
  events() {
    const fx = this.fx, y = this.logoY;
    fx.flash(this.A, 0.4, 10); fx.impact(this.A, 0.9);
    fx.burst({ t0: this.A, pos: { x: 0, y, z: 0.5 }, n: 140, speed: 10, gravity: 8, life: 1, size: 0.13, colors: ['#e41b24', '#3ea74d', 'white', 'yellow'] });
    const lf = this.L.parts.leaf;
    fx.burst({ t0: this.leafT, pos: { x: lf.home.x, y: y + lf.home.y, z: 0.6 }, n: 40, speed: 5, gravity: 2, life: 0.8, size: 0.09, colors: ['#3ea74d', 'lime', 'white'] });
    for (const p of this.prods) {
      const s = p.userData.slot;
      fx.impact(p.userData.slam, 0.6); fx.ring({ t0: p.userData.slam, pos: { x: s.x, y: 0.05, z: s.z }, maxR: 4.5, life: 0.45, color: 0x16e0ff });
      fx.burst({ t0: p.userData.slam, pos: { x: s.x, y: 0.2, z: s.z }, n: 40, speed: 6, gravity: 12, life: 0.7, size: 0.1, colors: ['white', 'cyan'] });
    }
    fx.impact(this.R, 1.2, 7); fx.zoom(this.R, 0.5, 0.25);
    fx.impact(this.F, 0.5, 8);
  }
  update(t) {
    const m = this.music, A = this.A, R = this.R, F = this.F, L = this.L;
    const raceX = (p, tt) => (tt - this.t0) * p.race.speed + Math.sin(tt * 3 + p.race.wob) * 0.7;
    let lead = -1e9;
    this.racers.forEach((p) => { lead = Math.max(lead, raceX(p, Math.min(t, A))); });
    const blast = Math.max(0, t - R);
    // logo pieces: race -> fly home (with a hop arc and a spin)
    this.racers.forEach((p, i) => {
      const rx = raceX(p, Math.min(t, A)) - lead + 3;
      const hop = Math.abs(Math.sin(Math.PI * m.phase(t))) * 0.6 * ((m.beatIndex(t) + i) % 2);
      const race = new THREE.Vector3(rx, -this.logoY + p.h / 2 + 0.05 + hop, p.race.lane);
      const u = easeOutBack(clamp((t - A + 0.3) / 0.45), 1.2);
      const pos = t < A - 0.3 ? race : race.clone().lerp(p.home, u).add(new THREE.Vector3(0, Math.sin(clamp(u) * Math.PI) * 3, 0));
      p.pivot.position.copy(pos);
      p.pivot.rotation.set(0, t < A - 0.3 ? -0.5 : (1 - clamp(u)) * Math.PI * 2, t < A - 0.3 ? Math.sin(t * 9 + i) * 0.1 : 0);
      const pulse = t > A && t < R ? m.beatPulse(t) * 0.08 : 0;
      p.pivot.scale.set(1 + pulse, 1 + pulse, 1);
    });
    // swoosh spins in under the letters on the assemble downbeat; the leaf pops into the O
    const sw = L.parts.swoosh, su = easeOutCubic(clamp((t - A + 0.15) / 0.5));
    sw.pivot.visible = t > A - 0.15;
    sw.pivot.position.copy(sw.home).add(new THREE.Vector3(0, 0, (1 - su) * 6));
    sw.pivot.rotation.set((1 - su) * -1.3, (1 - su) * Math.PI * 3, 0);
    sw.pivot.scale.setScalar(0.2 + 0.8 * su);
    const lf = L.parts.leaf, lu = easeOutBack(clamp((t - this.leafT) / 0.3), 3);
    lf.pivot.visible = t > this.leafT;
    lf.pivot.scale.setScalar(Math.max(0.001, lu));
    lf.pivot.rotation.z = (1 - clamp(lu)) * 1.5;
    L.group.visible = t < R + 0.4;
    // products: race alongside, slam into place one per beat, blasted away at the reveal
    this.prods.forEach((p, i) => {
      const d = p.userData, s = d.slot, fall = 0.35, u = clamp((t - (d.slam - fall)) / fall);
      if (t < A) { p.position.set(-1 - i * 2.2 + Math.sin(t * 4 + i) * 0.8, s.y, d.lane); p.rotation.set(0, Math.PI / 2, Math.sin(t * 12 + i) * 0.05); p.visible = true; }
      else { p.visible = t > d.slam - fall; p.position.set(s.x, s.y + (1 - easeInCubic(u)) * 10 + Math.abs(springHit(t - d.slam, 14, 7)) * 0.3, s.z); p.rotation.set(0, s.x < 0 ? 0.5 : -0.5, (1 - u) * 0.6); }
      if (blast > 0) { p.position.x += Math.sign(s.x) * blast * 30; p.position.y += blast * 6; p.rotation.z += blast * 6 * Math.sign(s.x); }
      if (d.kind === 'washer') d.drum.rotation.z = -t * 8;
      if (d.kind === 'rice') d.lid.rotation.x = -Math.max(0, springHit(t - d.slam, 10, 4)) * 1.0;
    });
    // performers hop onto the letters on the off-beats, cheer, then get launched by the reveal
    this.chars.forEach((c, i) => {
      const part = c.part;
      const top = { x: part.home.x, y: this.logoY + part.home.y + part.h / 2, z: 0.2 };
      const from = { x: top.x + (i - 1) * 3, y: 0, z: 4 };
      const u = clamp((t - (c.land - 0.45)) / 0.45);
      const p = arc(from, top, 2.4, u);
      c.root.visible = t > c.land - 0.9 && blast < 0.6;
      c.root.position.set(p.x, p.y + blast * 14, p.z + blast * 8);
      c.root.rotation.set(0, (i - 1) * 0.3, blast * 10);
      c.pose(u < 1 ? 'jump' : 'cheer', m.count(t) + i * 0.3, decay(t - c.land, 10));
    });
    // camera: chase the race, hero orbit after assembly, square up to the front for the reveal
    const front = easeInOutCubic(clamp((t - (R - 0.55)) / 0.55));
    if (t < A) {
      this.cam.pos.set(-5.5, 3.0, 9.5 + Math.sin(t * 2) * 0.4);
      this.cam.look.set(1, 1.2, -2);
      this.cam.roll = Math.sin(t * 3) * 0.05; this.cam.fov = 52;
      this.bg = { pattern: 2, a: 0x0b0620, b: 0x3a0f6e, c: 0x16e0ff };
      this.zoomBlur = 0.12;
      this.bgType = { amt: 0.12, color: 0x16e0ff, text: 'T-POT', style: 'outline', speed: 500 };
    } else {
      const k = easeInOutCubic(clamp((t - A) / 0.6));
      const orbit = Math.sin((t - A) * 0.5) * 0.42 * (1 - front);
      const dist = 16 - front * 1.5;
      const ox = Math.sin(orbit) * dist, oz = Math.cos(orbit) * dist;
      this.cam.pos.set(ox * k + (1 - k) * -5.5, (4.2 - front * 1.6) * k + (1 - k) * 3.0, oz * k + (1 - k) * 9.5);
      this.cam.look.set(0, this.logoY + 0.2 - front * 0.2, 0);
      this.cam.roll = 0; this.cam.fov = 46 - front * 8; this.zoomBlur = 0;
      this.bg = { pattern: 1, a: 0x7b2cff, b: 0x2a5bff, c: 0xffd400, spin: (t - A) * 0.2 };
      this.bgType = { amt: 0.16, color: 0xffffff, text: 'T-POT', style: 'mix' };
    }
    this.light.target.set(0, 0, 0);
    this.cardT = t;
  }
  // called after the camera is placed: project the 3D logo to screen space for the hand-off
  afterCamera(camera) {
    const t = this.cardT, R = this.R, F = this.F;
    if (t < R) { this.card = null; return; }
    if (!this.cardRect) this.measure(camera);
    const r0 = this.cardRect;
    // settle into a centred card 62% of the frame width, then punch on the final downbeat
    const aspect = this.ctx.W / this.ctx.H, la = this.ctx.logo.aspect;
    const tw = 0.62, th = tw * aspect / la;
    const u = easeOutCubic(clamp((t - R - 0.2) / 0.6));
    const punch = 1 + springHit(t - F, 14, 5) * 0.12 + decay(t - F, 30) * 0.05;
    const cx = (r0.x + r0.z) / 2 * (1 - u) + 0.5 * u, cy = (r0.y + r0.w) / 2 * (1 - u) + 0.5 * u;
    const w = ((r0.z - r0.x) * (1 - u) + tw * u) * punch, h = ((r0.w - r0.y) * (1 - u) + th * u) * punch;
    const wipe = easeOutExpo(clamp((t - R) / 0.45)) * 1.4;
    const shineT = (t - (R + this.music.period * 2)) / 0.5, shine2 = (t - F) / 0.5;
    const shine = shineT >= 0 && shineT <= 1 ? -0.2 + shineT * 1.7 : shine2 >= 0 && shine2 <= 1 ? -0.2 + shine2 * 1.7 : -1;
    this.card = { wipe, wipeDone: clamp((t - R) / 0.45), logo: 1, rect: new THREE.Vector4(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2), center: this.cardCenter, shine };
  }
  // screen rect of the assembled logo from the squared-up reveal camera (deterministic: the
  // camera at the reveal is fully defined by t = R, so this is the same for any frame order)
  measure(camera) {
    const L = this.L, tt = this.cardT;
    const saved = { p: camera.position.clone(), q: camera.quaternion.clone(), fov: camera.fov };
    this.update(this.R);                       // pose everything at the reveal instant
    camera.position.copy(this.cam.pos); camera.up.set(0, 1, 0); camera.lookAt(this.cam.look);
    camera.fov = this.cam.fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);
    L.group.visible = true; L.group.updateMatrixWorld(true);
    const xs = [], ys = [];
    for (const it of L.items) {
      const b = this._b.setFromObject(it.mesh);
      for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) {
        const v = this._v.set(x, y, b.max.z).project(camera); xs.push(v.x * 0.5 + 0.5); ys.push(v.y * 0.5 + 0.5);
      }
    }
    this.cardRect = new THREE.Vector4(Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys));
    const o = L.parts.O;
    const c = this._v.set(o.home.x, o.home.y + this.logoY, 0).project(camera);
    this.cardCenter = new THREE.Vector2(c.x * 0.5 + 0.5, c.y * 0.5 + 0.5);
    camera.position.copy(saved.p); camera.quaternion.copy(saved.q); camera.fov = saved.fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);
    this.update(tt);
  }
}
