// The Director: turns the analysed song into a scene plan.
//  1. cuts the song into units (one per lyric phrase + an instrumental outro),
//     placing every cut on a real beat (strongest available, never inside a sung word
//     unless the singer leaves no gap)
//  2. assigns an interaction template to each unit by scoring keyword affinity,
//     energy fit, musical requirements (drop / outro) and *novelty* (what already
//     happened: no template reuse, no character or product streaks)
//  3. registers transition hits on every cut, scaled by the beat level
import { mulberry32 } from './util.js';

function bestBeat(music, lo, hi) {
  const c = music.beats.filter((b) => b.t >= lo && b.t <= hi);
  if (!c.length) return null;
  c.sort((a, b) => b.level - a.level || (a.inBar === 0 ? -1 : 0) - (b.inBar === 0 ? -1 : 0) || b.t - a.t);
  return c[0];
}

export function planScenes(music, registry, seed = 7) {
  const rng = mulberry32(seed);
  const P = music.phrases, W = music.words, tl = music.tl;
  const units = [];
  for (let i = 0; i < P.length; i++) {
    let t0 = 0;
    if (i > 0) {
      const prevEnd = P[i - 1].end;
      let lo = prevEnd - 0.02;
      if (music.drop > P[i - 1].start && music.drop < P[i].start) lo = Math.max(lo, music.drop + 0.45);
      const b = bestBeat(music, lo, P[i].start - 0.12);
      t0 = b ? b.t : music.beatTime(music.nearestBeat(P[i].start));
    }
    units.push({ kind: i === 0 ? 'intro' : 'phrase', t0, phrase: P[i], words: P[i].words.map((k) => W[k]) });
  }
  const ob = bestBeat(music, tl.lastVocal, tl.lastVocal + 0.6);
  units.push({ kind: 'outro', t0: ob ? ob.t : tl.lastVocal + 0.2, phrase: null, words: [] });
  units.forEach((u, i) => { u.t1 = i < units.length - 1 ? units[i + 1].t0 : tl.duration + 0.5; u.index = i; });

  // ---- template assignment -------------------------------------------------------
  const used = new Set(); const history = [];
  for (const u of units) {
    const hasDrop = music.drop >= u.t0 && music.drop < u.t1;
    const energy = (music.energy(u.t0 + 0.5) + music.energy((u.t0 + u.t1) / 2)) / 2;
    const text = u.words.map((w) => w.text).join(' ');
    let best = null;
    for (const T of registry) {
      const m = T.meta;
      if (m.requires === 'drop' && !hasDrop) continue;
      if (hasDrop && m.requires !== 'drop') continue;
      if (m.requires === 'outro' && u.kind !== 'outro') continue;
      if (u.kind === 'outro' && m.requires !== 'outro') continue;
      if (m.requires === 'intro' && u.kind !== 'intro') continue;
      if (u.words.length && (u.words.length < (m.minWords || 1) || u.words.length > (m.maxWords || 99))) continue;
      let s = 0;
      for (const k of m.keywords || []) if (text.split(' ').includes(k)) s += 3;
      if (u.kind === 'intro' && m.requires === 'intro') s += 4;
      const [lo, hi] = m.energy || [0, 1]; s += energy >= lo && energy <= hi ? 1.5 : -1.5;
      if (used.has(m.id)) s -= 12;
      const last = history.at(-1), last2 = history.at(-2);
      if (m.character && last?.meta.character && last2?.meta.character) s -= 3;   // no character streaks
      if (m.character && last?.meta.character) s -= 0.8;
      if (m.products && last?.meta.products) s -= 1;                            // products not every scene
      s += rng() * 0.8;
      if (!best || s > best.s) best = { T, s };
    }
    if (!best) best = { T: registry.find((T) => T.meta.id === 'kinetic') };   // safe fallback
    u.template = best.T; u.meta = best.T.meta; used.add(best.T.meta.id); history.push(u);
    u.seed = Math.floor(rng() * 1e9);
  }
  return units;
}

/** transition hits on cuts: bigger cut for bigger beats */
export function registerTransitions(music, fx, units) {
  for (const u of units.slice(1)) {
    const b = music.beat(music.nearestBeat(u.t0));
    const lvl = Math.abs(b.t - u.t0) < 0.03 ? b.level : 1;
    fx.flash(u.t0, [0.25, 0.4, 0.6, 1][lvl], 12);
    fx.zoom(u.t0, [0.15, 0.25, 0.4, 0.7][lvl], 0.22);
    if (lvl >= 2) fx.glitch(u.t0, 0.7, 0.12);
  }
}
