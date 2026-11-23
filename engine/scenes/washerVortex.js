// WASHER VORTEX: a giant washing machine. Lyrics arrive, strobe, then get sucked into the
// drum on the beat in a spiral; the next lyric wraps around the door ring and spins with
// the drum; the camera starts rolling with the spin, and the last word is spat back out
// of the drum straight at the viewer before the camera dives into the glass.
import { BaseScene, clamp } from './base.js';
import { easeInCubic, easeOutBack, easeOutCubic, decay, springHit, easeInExpo } from '../util.js';
import { drawTV } from '../products.js';

export class WasherVortex extends BaseScene {
  static meta = { id: 'washer', keywords: ['WASHERS', 'WASHER', 'GOING', 'NON-STOP', 'FLASHING', 'SPIN', 'ROUND'], products: true, energy: [0.35, 1], minWords: 3, maxWords: 9 };
  constructor(ctx, plan) {
    super(ctx, plan);
    const W = this.words, S = 2.6;
    this.washer = this.product('washer'); this.washer.scale.setScalar(S);
    this.S = S;
    this.door = { x: 0, y: this.washer.userData.S * 0.5 * S, z: this.washer.userData.S * 0.5 * S + 0.05 };
    this.tv = this.product('tv'); this.tv.scale.setScalar(0.9);
    this.floor(0x2a5bff, 300, 0);
    const wi = W.findIndex((w) => /WASHER/.test(w.text));
    this.wrapIdx = wi >= 0 ? wi : Math.floor(W.length / 2);
    this.items = W.map((w, k) => {
      const wrap = k === this.wrapIdx, last = k === W.length - 1;
      const o = this.word(w, { height: wrap ? 0.75 : last ? 1.5 : 1.25, maxWidth: wrap ? 99 : 4.6, font: last || k % 2 ? 'bowlby' : 'anton', depth: 0.6,
        pool: ['fly', 'drop', 'expand', 'snap', 'unzip', 'roll'] });
      o.role = wrap ? 'wrap' : last ? 'spit' : k < this.wrapIdx ? 'suck' : 'suck';
      o.slot = { x: 0, y: this.door.y + (k % 2 ? -1.3 : 1.7), z: this.door.z + 2.2 };
      // sucked into the drum on the first strong beat after its onset (+ at least one beat on screen)
      if (o.role === 'suck') o.suck = Math.min(this.beatAfter(w.end + 0.1, { minLevel: 1 }), (W[k + 2]?.start ?? this.t1) - 0.05);
      return o;
    });
    this.spinStart = W[this.wrapIdx].start;
    const last = this.items.at(-1);
    this.dive = this.beatAfter(last.w.start + 0.45);
    if (this.dive > this.t1 - 0.15) this.dive = this.t1 - 0.3;
    this.flashWord = W.find((w) => w.text === 'FLASHING');
    this.bg = { pattern: 4, a: 0x2a5bff, b: 0x16e0ff, c: 0xffffff };
  }
  events() {
    for (const o of this.items) if (o.suck) { this.fx.burst({ t0: o.suck + 0.25, pos: this.door, n: 40, speed: 5, gravity: 0, life: 0.6, size: 0.1, colors: ['cyan', 'white'] }); this.fx.impact(o.suck + 0.25, 0.4); }
    const l = this.items.at(-1);
    this.fx.burst({ t0: l.w.start, pos: this.door, n: 120, speed: 12, gravity: 2, life: 1, size: 0.14, cone: { x: 0, y: 0, z: 1 }, spread: 1.6, colors: ['white', 'cyan', 'yellow', 'pink'] });
    this.fx.impact(l.w.start, 1.0); this.fx.zoom(this.dive, 0.6, 0.35);
  }
  spin(t) { const s = t - this.spinStart; return s < 0 ? 0 : s * s * 6 + s * 4; }
  update(t) {
    const m = this.music, D = this.door, sp = this.spin(t);
    this.washer.userData.drum.rotation.z = -sp;
    this.washer.position.y = Math.abs(Math.sin(sp * 3)) * 0.04 * clamp(t - this.spinStart);
    this.washer.rotation.z = Math.sin(sp * 2.3) * 0.015 * clamp(t - this.spinStart);
    this.washer.scale.setScalar(this.S * (1 + m.kick(t) * 0.025));
    // TV slides in from the side and strobes on hats while "FLASHING"
    const tvIn = easeOutBack(clamp((t - this.words[0].start + 0.1) / 0.4), 1.5);
    this.tv.position.set(-9 + tvIn * 5.6, 1.45, D.z + 0.6);
    this.tv.rotation.y = 0.5;
    const fw = this.flashWord;
    const strobing = fw && t >= fw.start && t < fw.end + 0.6;
    drawTV(this.tv, strobing ? (m.hat(t) > 0.4 || Math.floor(t * 16) % 2 ? 'bars' : 'off') : 'logo', t);
    this.items.forEach((o, k) => {
      this.lyric(o, t);
      const s = o.slot;
      if (o.role === 'suck') {
        const u = o.suck ? easeInCubic(clamp((t - o.suck) / 0.3)) : 0;
        const ang = u * 5;
        o.group.position.set(s.x * (1 - u) + Math.sin(ang) * (1 - u) * 1.5, s.y + (D.y - s.y) * u, s.z + (D.z - s.z) * u);
        o.group.rotation.z = -ang * 1.5;
        o.group.scale.setScalar(Math.max(0.001, 1 - u) * (1 + m.beatPulse(t) * 0.06));
        if (fw && o.w === fw && t >= fw.start && t < (o.suck || 99)) {   // strobing word
          const on = m.hat(t) > 0.35 || Math.floor(t * 20) % 2 === 0;
          o.group.visible = o.group.visible && on;
        }
        if (u >= 1) o.group.visible = false;
      } else if (o.role === 'wrap') {   // letters wrapped around the door ring, spinning with the drum
        const n = o.letters.length, r = 0.62 * this.S + 0.75;
        o.letters.forEach((L, i) => {
          const a = Math.PI / 2 - (i - (n - 1) / 2) * (Math.PI * 1.6 / n) - sp * 0.6;
          L.mesh.position.x += -L.baseX + Math.cos(a) * r / o.k;
          L.mesh.position.y += Math.sin(a) * r / o.k;
          L.mesh.rotation.z += a - Math.PI / 2;
        });
        o.group.position.set(D.x, D.y, D.z + 0.4);
        o.group.scale.setScalar(1 + m.beatPulse(t) * 0.08);
      } else {                          // spat out of the drum at the viewer
        const u = easeOutCubic(clamp((t - o.w.start) / 0.4));
        o.group.position.set(D.x, D.y + u * 0.3, D.z + u * 5.2);
        o.group.rotation.z = (1 - u) * -sp * 0.3;
        o.group.scale.setScalar(0.1 + u * 0.9 + m.beatPulse(t) * 0.08);
      }
    });
    // camera: front of the machine; rolls with the spin; finally dives into the glass
    const roll = t > this.spinStart ? -Math.min(sp * 0.08, 3) : 0;
    const dv = easeInExpo(clamp((t - this.dive) / 0.4));
    const pull = this.items.at(-1).w.start <= t ? easeOutCubic(clamp((t - this.items.at(-1).w.start) / 0.4)) * 3 : 0;
    this.cam.pos.set(Math.sin(t * 0.8) * 1.2 * (1 - dv), D.y + 0.6 * (1 - dv), D.z + 13 + pull - dv * (13 + pull - 0.6));
    this.cam.look.set(0, D.y, D.z);
    this.cam.fov = 50 + dv * 20;
    this.cam.roll = roll + dv * 2;
    this.zoomBlur = dv * 0.6 + clamp(sp / 40) * 0.15;
    this.light.target.set(0, D.y, 0);
    this.bg.spin = sp * 0.05;
  }
}
