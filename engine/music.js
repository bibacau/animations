// MusicClock: turns the analysed timeline into continuous, queryable signals.
import { clamp, decay } from './util.js';

export class MusicClock {
  constructor(tl) {
    this.tl = tl;
    this.beats = tl.beats;
    this.period = tl.period;
    this.kicks = tl.kicks.filter((k) => k.v > 0.45);
    this.snares = tl.snares.filter((k) => k.v > 0.5);
    this.hats = tl.hats;
    this.words = tl.words;
    this.phrases = tl.phrases;
    this.drop = tl.drop;
  }
  // index of the last beat <= t
  beatIndex(t) {
    const b = this.beats; let lo = 0, hi = b.length - 1;
    if (t < b[0].t) return -1;
    while (lo < hi) { const m = (lo + hi + 1) >> 1; if (b[m].t <= t) lo = m; else hi = m - 1; }
    return lo;
  }
  beat(i) { return this.beats[Math.max(0, Math.min(this.beats.length - 1, i))]; }
  beatTime(i) {
    if (i < 0) return this.beats[0].t + i * this.period;
    if (i >= this.beats.length) return this.beats[this.beats.length - 1].t + (i - this.beats.length + 1) * this.period;
    return this.beats[i].t;
  }
  nearestBeat(t) { const i = this.beatIndex(t); const a = this.beatTime(i), b = this.beatTime(i + 1); return (t - a < b - t) ? i : i + 1; }
  // beat phase 0..1 within the current beat
  phase(t) { const i = this.beatIndex(t); const a = this.beatTime(i), b = this.beatTime(i + 1); return clamp((t - a) / (b - a)); }
  // continuous "beat count" (float)
  count(t) { const i = this.beatIndex(t); return i + this.phase(t); }

  // envelope summed over recent events of a list
  _env(list, t, k, minV = 0) {
    let v = 0;
    for (let i = list.length - 1; i >= 0; i--) {
      const dt = t - list[i].t;
      if (dt < 0) continue;
      if (dt > 1.2) break;
      if (list[i].v >= minV) v = Math.max(v, decay(dt, k) * Math.min(1, list[i].v));
    }
    return v;
  }
  kick(t, k = 9) { return this._env(this.kicks, t, k); }
  snare(t, k = 12) { return this._env(this.snares, t, k); }
  hat(t, k = 25) { return this._env(this.hats, t, k, 0.3); }
  // hierarchical beat pulse: level-weighted decay from the last beat
  beatPulse(t, k = 7) {
    const i = this.beatIndex(t); if (i < 0) return 0;
    const b = this.beats[i]; const w = [0.25, 0.5, 0.85, 1.2][b.level];
    return w * decay(t - b.t, k);
  }
  levelAt(i) { return this.beat(i).level; }
  energy(t) {
    const e = this.tl.energy; const i = Math.min(e.length - 1, Math.max(0, Math.round(t / (e[1].t - e[0].t))));
    return e[i].e;
  }
  section(t) { return this.tl.sections.find((s) => t >= s.start && t < s.end) || this.tl.sections.at(-1); }
  // build-up intensity 0..1 (ramps inside build-up windows)
  build(t) {
    for (const b of this.tl.buildups) if (t >= b.start && t < b.end) return (t - b.start) / (b.end - b.start);
    return 0;
  }
  // next beat (index) at or after t with at least the given level
  nextBeat(t, minLevel = 0) {
    for (let i = Math.max(0, this.beatIndex(t)); i < this.beats.length; i++) {
      if (this.beats[i].t >= t - 1e-4 && this.beats[i].level >= minLevel) return i;
    }
    return this.beats.length - 1;
  }
  beatsBetween(a, b, minLevel = 0) { return this.beats.filter((x) => x.t >= a && x.t < b && x.level >= minLevel); }
}
