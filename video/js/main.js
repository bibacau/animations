// Director: loads the song timeline + assets, cuts the song into the storyboard scenes
// (every cut sits on a real beat), and draws frame t. Exposes window.renderAt(t).
import { W, H, Music, hash, decay, clamp } from './core.js';
import { drawCaption } from './lyrics.js';
import { loadLogo } from './logo.js';
import intro from './scenes/s01_intro.js';
import price from './scenes/s02_price.js';
import street from './scenes/s03_street.js';
import shop from './scenes/s04_shop.js';
import eyes from './scenes/s05_eyes.js';
import surprise from './scenes/s06_surprise.js';
import crowd from './scenes/s07_crowd.js';
import tvwash from './scenes/s08_tvwash.js';
import board from './scenes/s09_board.js';
import road from './scenes/s10_road.js';
import finale from './scenes/s11_finale.js';

async function boot() {
  const tl = await fetch('/data/timeline.json').then((r) => r.json());
  await Promise.all([document.fonts.load('40px Bowlby'), document.fonts.load('40px Anton')]);
  const logo = await loadLogo();
  const canvas = document.getElementById('c'); canvas.width = W; canvas.height = H;
  const g = canvas.getContext('2d');
  const music = new Music(tl);
  const B = (i) => music.bt(i);
  // storyboard cuts (beat indices) -> one scene per lyric line, instrumental finale
  const cuts = [0, B(9), B(15), B(24), B(33), B(42), B(49), B(59), B(67), B(75), B(83), tl.duration + 1];
  const makers = [intro, price, street, shop, eyes, surprise, crowd, tvwash, board, road, finale];
  const marks = new Map();       // word index -> visible this frame (for the audit)
  const tmp = document.createElement('canvas'); tmp.width = W; tmp.height = H;   // offscreen, for blur effects
  const ctx = { music, logo, W, H, canvas, tmp, mark: (i) => marks.set(i, true) };
  const scenes = makers.map((mk, k) => { const s = mk(ctx, cuts[k], cuts[k + 1], k); s.t0 = cuts[k]; s.t1 = cuts[k + 1]; s.phrase = tl.phrases[k] || null; return s; });
  window.__scenes = scenes.map((s) => ({ name: s.name, t0: +s.t0.toFixed(3), t1: +s.t1.toFixed(3) }));


  window.renderAt = (t) => {
    marks.clear();
    const s = scenes.findLast((x) => t >= x.t0) || scenes[0];
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    // drum hits shake the frame in the scenes that ask for it
    const shake = (s.shake ? (typeof s.shake === 'function' ? s.shake(t) : s.shake) : 0);
    if (shake) {
      const p = music.pulse(t, 14), k = music.kick(t, 16);
      const a = shake * Math.max(p, k);
      g.translate(W / 2, H / 2); g.scale(1 + a * 0.03, 1 + a * 0.03); g.translate(-W / 2, -H / 2);
      g.translate((hash(t * 91) - 0.5) * a * 9, (hash(t * 57 + 3) - 0.5) * a * 9);
    }
    s.draw(g, t);
    g.restore();
    // lyrics: karaoke caption unless the scene builds the words into its world
    if (s.caption) {
      const cap = typeof s.caption === 'function' ? s.caption(t) : s.caption;
      if (cap) {
        drawCaption(g, music, s.phrase, t, cap);
        for (const i of s.phrase.words) if (music.words[i].start - 0.05 <= t) marks.set(i, true);
      }
    }
    // cut flash
    const cut = scenes.find((x) => x.t0 > 0 && t >= x.t0 && t < x.t0 + 0.2 && !x.noFlash);
    if (cut) { g.fillStyle = `rgba(255,255,255,${0.55 * decay(t - cut.t0, 18)})`; g.fillRect(0, 0, W, H); }
    return [...marks.keys()];
  };
  window.frameJPEG = (t, q = 0.85) => { window.renderAt(t); return canvas.toDataURL('image/jpeg', q); };
  // visibility audit: for every sung word, how long is it on screen in its first 1.2 s?
  window.audit = () => tl.words.map((w, i) => {
    let seen = 0, first = null;
    for (let t = w.start; t < w.start + 1.2; t += 1 / 30) { if (window.renderAt(t).includes(i)) { seen += 1 / 30; if (first === null) first = t - w.start; } }
    return { word: w.display, start: w.start, seen: +seen.toFixed(2), first: first === null ? null : +first.toFixed(2) };
  });
  window.__duration = tl.duration;
  window.__ready = true;
}
boot().catch((e) => { console.error(e); window.__error = String(e.stack || e); });
