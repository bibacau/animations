// WORD PLATFORMS: each lyric pops up as a thick floating platform just ahead of a runner.
// The runner lands on every platform exactly on a beat; letters wobble like unstable
// stones, single-letter words act as trampolines, the camera side-scrolls with the run.
import { BaseScene, clamp } from './base.js';
import { keyPath, springHit, decay, hash } from '../util.js';

export class Platforms extends BaseScene {
  static meta = { id: 'platforms', keywords: ['WALKING', 'STREET', 'DOWN', 'RUN', 'NEON', 'LIGHT', 'GOING'], character: true, energy: [0.15, 0.85], minWords: 4, maxWords: 12 };
  constructor(ctx, plan) {
    super(ctx, plan);
    const m = this.music, P = m.period;
    this.items = [];
    let x = 0;
    const heights = [0, 0.9, -0.5, 1.4, 0.3, 1.9, 0.8, 2.4, 1.2, 2.8];
    this.words.forEach((w, k) => {
      const neon = /NEON|LIGHT/.test(w.text);
      const o = this.word(w, { height: 1.25, maxWidth: 5.2, depth: 1.8, font: neon ? 'bowlby' : 'anton',
        combo: neon ? ['pink', 'purple'] : [['yellow', 'red'], ['cyan', 'blue'], ['white', 'purple'], ['lime', 'purple']][k % 4],
        emissive: neon ? 1.6 : 0, pool: ['rise', 'expand', 'flip', 'swing', 'stretch', 'drop'] });
      o.base = { x: x + o.width / 2, y: heights[k % heights.length] };
      x += o.width + 1.1 + (w.text.length <= 1 ? 0.6 : 0);
      this.items.push(o);
    });
    // landing plan: one platform per landing, each landing on a beat (8th if needed)
    this.char = this.character('volt', 0.75);
    const keys = [];
    const first = this.items[0];
    let land = this.beatAfter(first.w.start + 0.1);
    keys.push({ t: this.t0, x: first.base.x - 1.5, y: first.base.y + 9, mode: 'fall' });
    keys.push({ t: land, x: first.base.x - first.width * 0.3, y: first.base.y + first.height / 2, mode: 'fall', ease: (u) => u * u });
    this.lands = [{ t: land, o: first }];
    let prevO = first;
    for (const o of this.items.slice(1)) {
      let L = this.beatAfter(Math.max(o.w.start + 0.12, land + P * 0.95));
      if (L > this.t1 - 0.2) L = this.beatAfter(Math.max(o.w.start + 0.1, land + P * 0.45), { half: true });
      if (L > this.t1 - 0.12) continue;
      const tramp = prevO.w.text.length <= 1;
      const runEnd = L - P * (tramp ? 0.5 : 0.8);
      if (runEnd > land + 0.05) keys.push({ t: runEnd, x: prevO.base.x + prevO.width * 0.42, y: prevO.base.y + prevO.height / 2, mode: tramp ? 'idle' : 'run' });
      keys.push({ t: L, x: o.base.x - o.width * 0.25, y: o.base.y + o.height / 2, h: tramp ? 3.2 : 1.3 + Math.abs(o.base.y - prevO.base.y) * 0.4, mode: 'jump' });
      this.lands.push({ t: L, o }); land = L; prevO = o;
    }
    keys.push({ t: this.t1 + 0.5, x: prevO.base.x + prevO.width * 0.45, y: prevO.base.y + prevO.height / 2, mode: 'run' });
    this.keys = keys;
    this.bg = { pattern: 2, a: 0x0b0620, b: 0x3a0f6e, c: 0xff4fd8 };
  }
  events() {
    for (const { t, o } of this.lands) {
      const lvl = this.music.beat(this.music.nearestBeat(t)).level;
      this.fx.burst({ t0: t, pos: { x: o.base.x - o.width * 0.25, y: o.base.y + o.height / 2, z: 0.3 }, n: 22, speed: 4, gravity: 10, life: 0.6, size: 0.09, colors: ['white', 'pink', 'cyan'] });
      this.fx.impact(t, 0.2 + lvl * 0.15);
    }
  }
  update(t) {
    const m = this.music;
    this.items.forEach((o, k) => {
      this.lyric(o, t);
      const landing = this.lands.find((l) => l.o === o);
      const dip = landing ? springHit(t - landing.t, 18, 5) * 0.35 : 0;
      o.group.position.set(o.base.x, o.base.y - dip, 0);
      o.group.rotation.set(-0.05, 0.12, Math.sin(t * 2 + k) * 0.03);
      // unstable letters: each letter bobs on the beat, offset per letter
      const bi = m.beatIndex(t), bt = m.beatTime(bi);
      o.letters.forEach((L, i) => { L.mesh.position.y += springHit(t - bt - i * 0.03, 22, 9) * 0.12 * (1 + m.beatPulse(t)); });
      if (/NEON|LIGHT/.test(o.w.text)) {
        const fl = 0.8 + 1.2 * (hash(Math.floor(t * 20) + k) > 0.15 ? 1 : 0.1) + m.hat(t) * 1.5;
        o.mats[0].emissiveIntensity = fl;
      }
    });
    const p = keyPath(this.keys, t);
    const ch = this.char;
    let mode = p.mode;
    if (mode === 'jump' && p.u > 0.88) mode = 'land';
    const lastLand = this.lands.filter((l) => l.t <= t).at(-1);
    const sinceLand = lastLand ? t - lastLand.t : 9;
    if (mode === 'run' && sinceLand < 0.12) mode = 'land';
    ch.root.position.set(p.x, p.y, 0.35);
    ch.root.rotation.y = mode === 'run' || mode === 'jump' ? Math.PI / 2 : 0.4;
    ch.pose(mode, (t * 2.4) % 1, decay(sinceLand, 12));
    // side-scrolling camera that leads the runner and looks slightly down at the platforms
    // 16:9 side-scroller: runner on the left third, the next platforms fill the right
    const cy = p.y * 0.5 + this.keys[1].y * 0.5;
    this.cam.pos.set(p.x + 3.6, cy + 2.4, 11);
    this.cam.look.set(p.x + 4.2, cy + 0.2, 0);
    this.cam.roll = -0.04;
    this.light.target.set(p.x, p.y, 0);
  }
}
