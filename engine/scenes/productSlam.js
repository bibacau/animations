// PRODUCT SLAM: lyrics stand on a stage; when a product is named, that appliance drops
// from the sky and crushes the word on the next strong beat (shockwave + camera punch).
// The final word launches out of a rice cooker, other words bounce off the products.
import { BaseScene, clamp } from './base.js';
import { easeInCubic, springHit, decay, easeOutBack, easeOutCubic } from '../util.js';
import { drawTV } from '../products.js';

const PRODUCT_WORDS = { "TV'S": 'tv', TV: 'tv', WASHERS: 'washer', WASHER: 'washer', FRIDGE: 'fridge', DEALS: 'fridge', PRICE: 'fridge' };

export class ProductSlam extends BaseScene {
  static meta = { id: 'productSlam', keywords: ["TV'S", 'WASHERS', 'PRICE', 'DEALS', 'TV', 'WASHER', 'FRIDGE'], products: true, energy: [0.15, 1], minWords: 3, maxWords: 10 };
  constructor(ctx, plan) {
    super(ctx, plan);
    this.floor(0xf3e9ff, 300, 0);
    const N = this.words.length;
    this.items = [];
    let x = 0;
    this.words.forEach((w, k) => {
      const kind = PRODUCT_WORDS[w.text];
      const lastWord = k === N - 1;
      const o = this.word(w, { height: kind ? 1.4 : 1.15, maxWidth: kind ? 5 : 3.6, depth: 1.2, font: kind || lastWord ? 'bowlby' : 'anton' });
      o.base = { x: x + o.width / 2, y: o.height / 2, z: (k % 2) * -1.2 };
      x += o.width + 1.3;
      o.kind = kind; o.lastWord = lastWord;
      if (kind) {
        const p = this.product(kind);
        const s = kind === 'fridge' ? 0.62 : kind === 'washer' ? 0.72 : 0.9;
        p.scale.setScalar(s);
        o.prod = p; o.slam = this.beatAfter(w.start + 0.18, { minLevel: 1 });
        if (o.slam > w.end + 0.6) o.slam = this.beatAfter(w.start + 0.18);
      }
      this.items.push(o);
    });
    // final word: shot out of a rice cooker whose lid flips open on the vocal onset
    const fin = this.items.at(-1);
    this.rice = this.product('rice');
    this.rice.position.set(fin.base.x, 0, fin.base.z);
    fin.base.y = 3.2;
    // a "bouncing" word: the one right after a product word bounces off that product
    this.items.forEach((o, k) => { if (!o.kind && !o.lastWord && this.items[k - 1]?.prod) o.bounceOff = this.items[k - 1]; });
    this.bg = { pattern: 3, a: 0xffd400, b: 0xff7a1a, c: 0xffffff };
  }
  events() {
    for (const o of this.items) if (o.prod) {
      const lvl = this.music.beat(this.music.nearestBeat(o.slam)).level;
      this.fx.impact(o.slam, 0.9 + lvl * 0.2); this.fx.flash(o.slam, 0.25, 14);
      this.fx.ring({ t0: o.slam, pos: { x: o.base.x, y: 0.05, z: o.base.z }, maxR: 7, life: 0.5, color: 0xff2a4d });
      this.fx.burst({ t0: o.slam, pos: { x: o.base.x, y: 0.2, z: o.base.z + 0.5 }, n: 90, speed: 9, gravity: 14, life: 0.9, size: 0.14, colors: ['red', 'purple', 'white', 'yellow'] });
    }
    const fin = this.items.at(-1);
    this.fx.burst({ t0: fin.w.start, pos: { x: fin.base.x, y: 1.6, z: fin.base.z }, n: 70, speed: 8, gravity: 6, life: 1, size: 0.12, colors: ['white', 'yellow', 'cyan'], cone: { x: 0, y: 1, z: 0.2 }, spread: 1.2 });
    this.fx.impact(fin.w.start, 0.5);
  }
  update(t) {
    const m = this.music;
    let focus = this.items[0];
    for (const o of this.items) {
      this.lyric(o, t);
      if (t >= o.w.start - 0.25) focus = o;
      let { x, y, z } = o.base;
      let sy = 1, sx = 1;
      if (o.prod) {
        const fall = 0.42, u = clamp((t - (o.slam - fall)) / fall);
        const crush = t >= o.slam ? 0.3 + springHit(t - o.slam, 20, 7) * 0.3 + decay(t - o.slam, 30) * 0.2 : 0;
        sy = 1 - crush; sx = 1 + crush * 0.35;
        y = o.height * sy / 2;
        const top = o.height * sy;
        const base = o.prod.userData.base ? -o.prod.userData.base : 0;
        const py = top + base * o.prod.scale.y + (1 - easeInCubic(u)) * 12 + Math.abs(springHit(t - o.slam, 16, 8)) * 0.4;
        o.prod.position.set(x, py, z);
        o.prod.rotation.set(0, -0.35 + (1 - u) * 1.2, (1 - u) * 0.5);
        o.prod.visible = t > o.slam - fall - 0.05;
        if (o.prod.userData.kind === 'tv') drawTV(o.prod, t > o.slam ? 'text' : 'static', t, t > o.slam ? 'SALE!' : '', '#ffd400');
        if (o.prod.userData.kind === 'washer') o.prod.userData.drum.rotation.z = -Math.max(0, t - o.slam) * 14;
      }
      if (o.bounceOff) {           // bounce off the previous product, landing beside it on beats
        const b = o.bounceOff, lt = t - o.w.start, P = m.period;
        const hop = Math.abs(Math.sin(Math.PI * Math.min(lt / P, 3))) * 2.6 * decay(lt, 0.9);
        y = b.height * 0.6 + o.height / 2 + 2.8 + hop; x = b.base.x + 0.2; z = b.base.z + 1.6;
      }
      if (o.lastWord) {
        const u = clamp((t - o.w.start) / 0.35);
        y = 1.4 + easeOutBack(u, 2) * 2.4; o.group.rotation.x = (1 - u) * -1.5;
      }
      o.group.position.set(x, y, z);
      o.group.scale.set(sx, sy, sx);
      if (!o.lastWord) o.group.rotation.y = -0.2;
      o.letters.forEach((L, i) => { L.mesh.position.y += Math.max(0, springHit(t - m.beatTime(m.beatIndex(t)) - i * 0.025, 20, 10)) * 0.1; });
    }
    const fin = this.items.at(-1);
    this.rice.userData.lid.rotation.x = -easeOutBack(clamp((t - fin.w.start + 0.08) / 0.25), 2.5) * 1.6;
    this.rice.rotation.y = Math.sin(t * 2) * 0.15;
    this.rice.scale.setScalar(1 + m.kick(t) * 0.06);
    const slamming = this.items.find((o) => o.prod && Math.abs(t - o.slam) < 0.45);
    if (slamming) focus = slamming;
    // camera hops between subjects (eased track), lower & closer for product crashes
    const fx_ = focus.base.x;
    const prev = this.items[Math.max(0, this.items.indexOf(focus) - 1)];
    const u = easeOutCubic(clamp((t - focus.w.start + 0.25) / 0.45));
    const cx = prev.base.x + (fx_ - prev.base.x) * u;
    const near = focus.prod ? 1 : 0;
    this.cam.pos.set(cx + 2.4, 2.6 + near * 1.4, 7.6 + near * 1.6);
    this.cam.look.set(cx, 1.5 + near * 0.9, focus.base.z);
    this.cam.roll = 0.05;
    this.light.target.set(cx, 0, 0);
    this.bg.spin = -t * 0.4;
  }
}
