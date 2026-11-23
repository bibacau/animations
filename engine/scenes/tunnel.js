// TYPOGRAPHY TUNNEL: an endless tunnel built from the brand name. When a lyric is sung,
// the tunnel walls flip to that word in a cascade racing away from the camera, while the
// sung word itself hangs in the centre and the camera flies through it. The tunnel
// twists on downbeats, surges on kicks, products drift past, a performer overtakes the
// camera riding a giant letter -- and on "STOP" everything halts dead.
import * as THREE from 'three';
import { BaseScene, clamp } from './base.js';
import { wordGeometry, PALETTE } from '../text3d.js';
import { easeOutCubic, easeInOutCubic, decay, springHit, easeOutBack } from '../util.js';
import { Word3D } from '../text3d.js';

const RINGS = 16, PER = 7, SPACING = 5.5, R = 4.6;

export class Tunnel extends BaseScene {
  static meta = { id: 'tunnel', keywords: ['NEVER', 'STOP', 'NON-STOP', 'SAVINGS', 'FOREVER'], products: true, energy: [0.35, 1], minWords: 3, maxWords: 10 };
  constructor(ctx, plan) {
    super(ctx, plan);
    const W = this.words;
    this.stopWord = W.find((w) => w.text === 'STOP' || w.text === 'NON-STOP');
    this.stopT = this.stopWord ? this.stopWord.start : null;
    // instanced wall layers: brand + one per sung word
    const texts = ['T-POT', ...W.map((w) => w.display)];
    const cols = [['yellow', 'red'], ['cyan', 'blue'], ['pink', 'purple'], ['lime', 'purple'], ['white', 'red'], ['orange', 'red'], ['yellow', 'purple']];
    this.layers = texts.map((tx, i) => {
      const geo = wordGeometry(ctx.fonts, tx, i % 2 ? 'bowlby' : 'anton', 0.9, 0.35);
      const c = cols[i % cols.length];
      const mesh = new THREE.InstancedMesh(geo, [new THREE.MeshStandardMaterial({ color: PALETTE[c[0]], emissive: PALETTE[c[0]], emissiveIntensity: 0.35, roughness: 0.4 }), new THREE.MeshStandardMaterial({ color: PALETTE[c[1]], roughness: 0.6 })], RINGS * PER);
      mesh.frustumCulled = false; this.group.add(mesh);
      const w = geo.boundingBox.max.x - geo.boundingBox.min.x;
      return { mesh, scale: Math.min(1, 3.4 / w) };
    });
    this.center = W.map((w, k) => this.word(w, { height: 1.5, maxWidth: 4.4, font: k % 2 ? 'anton' : 'bowlby', depth: 0.8,
      combo: w === this.stopWord ? ['red', 'ink'] : cols[(k + 2) % cols.length],
      entrance: w === this.stopWord ? { type: 'smash', dur: 0.12 } : undefined, pool: ['shoot', 'expand', 'scatter', 'flip', 'stretch'] }));
    this.center.forEach((o) => { o.zAt = this.camZ(o.w.start) - 10; });
    this.prods = ['tv', 'washer', 'rice', 'fridge'].map((k, i) => {
      const p = this.product(k); p.scale.setScalar(0.7);
      const bt = this.beatAfter(this.t0 + 0.8 + i * 1.1, { minLevel: 1 });
      p.userData.pass = { t: bt, z: this.camZ(bt) - 7, a: i * 1.7 + 0.4 };
      return p;
    });
    // cameo: performer riding a giant letter overtakes the camera
    const nev = W.find((w) => w.text === 'NEVER') || W[Math.floor(W.length / 2)];
    this.rideT = nev.start;
    this.rider = this.character('volt', 0.7);
    this.board = new Word3D(ctx.fonts, 'S', { height: 1.4, depth: 0.7, front: 'lime', side: 'purple', font: 'bowlby' });
    this.group.add(this.board.group);
    this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._e = new THREE.Euler();
    this.bg = { pattern: 5, a: 0x05030d, b: 0x05030d, c: 0xffffff };
  }
  // distance travelled: cruising speed + a surge on every kick; hard stop on STOP
  camZ(t) {
    const m = this.music, stop = this.stopT ?? 1e9;
    const tt = Math.min(t, stop);
    let z = -(tt - this.t0) * 9;
    for (const b of m.beatsBetween(this.t0, tt)) z -= (1.2 + b.level * 0.8) * easeOutCubic(clamp((tt - b.t) / 0.3));
    if (t > stop) z -= 0.9 * easeOutBack(clamp((t - stop) / 0.15), 3) ;
    return z;
  }
  twist(t) {
    const m = this.music, stop = this.stopT ?? 1e9;
    const downs = m.beatsBetween(this.t0, Math.min(t, stop)).filter((b) => b.inBar === 0);
    let a = 0; downs.forEach((b, i) => { a += (i % 2 ? -1 : 1) * Math.PI / 4 * easeInOutCubic(clamp((t - b.t) / 0.35)); });
    return a;
  }
  events() {
    for (const o of this.center) this.fx.zoom(o.w.start, 0.25, 0.2);
    if (this.stopT) { this.fx.impact(this.stopT, 1.3, 6); this.fx.flash(this.stopT, 0.5, 8, 0xff2a4d); this.fx.glitch(this.stopT, 1, 0.25); }
  }
  update(t) {
    const m = this.music, W = this.words;
    const z = this.camZ(t), tw = this.twist(t);
    const stopped = this.stopT != null && t >= this.stopT;
    const curve = (zz) => Math.sin(zz * 0.035) * 2.2;
    // which layer each ring shows: brand by default, sung word cascades outward from the camera
    const base = Math.floor(-z / SPACING);
    const counts = this.layers.map(() => 0);
    const mm = this._m, q = this._q, e = this._e;
    for (let r = 0; r < RINGS; r++) {
      const ringIdx = base + r;
      const rz = -ringIdx * SPACING;
      const dist = r;
      let layer = 0;
      W.forEach((w, k) => { if (t >= w.start + dist * 0.035) layer = k + 1; });
      const L = this.layers[layer];
      const flip = W.reduce((a, w) => Math.max(a, decay(t - (w.start + dist * 0.035), 14) * (t >= w.start + dist * 0.035 ? 1 : 0)), 0);
      for (let k = 0; k < PER; k++) {
        const a = k / PER * Math.PI * 2 + tw + ringIdx * 0.22;
        const x = Math.cos(a) * R + curve(rz), y = Math.sin(a) * R;
        e.set(flip * Math.PI, 0, a - Math.PI / 2); q.setFromEuler(e);
        const s = L.scale * (1 + m.beatPulse(t) * 0.12);
        mm.compose(new THREE.Vector3(x, y, rz), q, new THREE.Vector3(s, s, s));
        L.mesh.setMatrixAt(counts[layer]++, mm);
      }
    }
    this.layers.forEach((L, i) => { L.mesh.count = counts[i]; L.mesh.instanceMatrix.needsUpdate = true; });
    // sung words in the centre: placed ahead, the camera flies through them
    this.center.forEach((o, k) => {
      this.lyric(o, t);
      const isStop = o.w === this.stopWord;
      const zz = isStop ? z - 7 : o.zAt;
      o.group.position.set(curve(zz), 0, zz);
      o.group.rotation.z = isStop ? Math.sin(t * 40) * 0.02 * decay(t - o.w.start, 5) : -tw * 0.3;
      o.group.scale.setScalar(1 + m.beatPulse(t) * 0.1);
      if (!isStop && stopped) o.group.visible = false;
    });
    // products drift past on strong beats
    this.prods.forEach((p, i) => {
      const ps = p.userData.pass;
      p.position.set(curve(ps.z) + Math.cos(ps.a) * 2.8, Math.sin(ps.a) * 2.8, ps.z);
      p.rotation.set(t * 1.5, t * 2 + i, t * 0.7);
      p.visible = !stopped;
    });
    // rider overtakes from behind
    const ru = (t - this.rideT + 0.3) / 1.6;
    const vis = ru > 0 && ru < 1 && !stopped;
    this.rider.root.visible = this.board.group.visible = vis;
    if (vis) {
      const rz = z - 3.5 - ru * 16;
      const bx = curve(rz) + 1.5, by = -1.6 + Math.sin(ru * 9) * 0.3;
      this.board.reset(); this.board.group.position.set(bx, by, rz); this.board.group.rotation.set(-Math.PI / 2 + 0.3, 0, 0.2);
      this.rider.root.position.set(bx, by + 0.4, rz); this.rider.root.rotation.set(0, Math.PI / 2 + 0.3, 0);
      this.rider.pose('surf', ru * 4);
    }
    // camera: flies down the curved tunnel, rolls with the twist
    this.cam.pos.set(curve(z), 0, z);
    this.cam.look.set(curve(z - 12), 0, z - 12);
    this.cam.fov = stopped ? 50 : 62 + m.kick(t) * 6;
    this.cam.roll = tw * 0.25 + (stopped ? springHit(t - this.stopT, 20, 6) * 0.15 : 0);
    this.light.target.set(curve(z - 8), 0, z - 8);
    this.zoomBlur = stopped ? 0 : 0.12 + m.kick(t) * 0.15;
    this.bg = stopped ? { pattern: 4, a: 0x120a2e, b: 0xff2a4d, c: 0xffffff } : { pattern: 5, a: 0x0a0618, b: 0x0a0618, c: 0xffffff };
  }
}
