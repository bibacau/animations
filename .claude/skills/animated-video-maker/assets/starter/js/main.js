// Director: loads the config + timeline + logo, cuts the song into scenes (every cut on a
// real beat), draws frame t. Exposes window.renderAt(t), frameJPEG(t), audit(), __duration.
//
// Global layers handled here, for every scene:
//  * beat shake / zoom-punch on drum hits (scene.shake: number or fn(t))
//  * karaoke caption for the scene's lyric line (scene.caption: {pos,size,y,hide} or fn(t) or null
//    when the scene draws the words itself - then it must call ctx.mark(wordIndex))
//  * a short white flash on every cut (unless scene.noFlash)
//  * the lyric-visibility audit
import { W, H, Music, hash, decay } from './core.js';
import { drawCaption } from './lyrics.js';
import { loadLogo } from './logo.js';
import { SCENES } from './scenes/index.js';

async function boot() {
  const cfg = await fetch('video.config.json').then((r) => r.json());
  window.__config = cfg;
  const tl = await fetch(cfg.timeline).then((r) => r.json());
  await Promise.all([document.fonts.load('40px Bowlby'), document.fonts.load('40px Anton')]).catch(() => {});
  const logo = cfg.logo ? await loadLogo(cfg.logo, cfg.brandWord).catch(() => null) : null;
  const canvas = document.getElementById('c'); canvas.width = W; canvas.height = H;
  const g = canvas.getContext('2d');
  const music = new Music(tl);
  const marks = new Map();
  const tmp = document.createElement('canvas'); tmp.width = W; tmp.height = H;   // offscreen, for blur effects
  const ctx = { music, logo, W, H, canvas, tmp, cfg, mark: (i) => marks.set(i, true) };
  // SCENES: [{ make, start }] where start = seconds or { beat: index } (cuts snap to beats)
  const starts = SCENES.map((s) => (typeof s.start === 'object' ? music.bt(s.start.beat) : s.start));
  const scenes = SCENES.map((s, k) => {
    const t0 = starts[k], t1 = k < SCENES.length - 1 ? starts[k + 1] : tl.duration + 1;
    const sc = s.make(ctx, t0, t1, k); sc.t0 = t0; sc.t1 = t1;
    sc.phrase = s.phrase !== undefined ? tl.phrases[s.phrase] : null;
    return sc;
  });

  window.renderAt = (t) => {
    marks.clear();
    const s = scenes.findLast((x) => t >= x.t0) || scenes[0];
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    const shake = s.shake ? (typeof s.shake === 'function' ? s.shake(t) : s.shake) : 0;
    if (shake) {
      const a = shake * Math.max(music.pulse(t, 14), music.kick(t, 16));
      g.translate(W / 2, H / 2); g.scale(1 + a * 0.03, 1 + a * 0.03); g.translate(-W / 2, -H / 2);
      g.translate((hash(t * 91) - 0.5) * a * 9, (hash(t * 57 + 3) - 0.5) * a * 9);
    }
    s.draw(g, t);
    g.restore();
    const cap = typeof s.caption === 'function' ? s.caption(t) : s.caption;
    if (cap && s.phrase) {
      drawCaption(g, music, s.phrase, t, cap);
      for (const i of s.phrase.words) if (music.words[i].start - 0.05 <= t && !(cap.hide || []).includes(s.phrase.words.indexOf(i))) marks.set(i, true);
    }
    const cut = scenes.find((x) => x.t0 > 0 && t >= x.t0 && t < x.t0 + 0.2 && !x.noFlash);
    if (cut) { g.fillStyle = `rgba(255,255,255,${0.5 * decay(t - cut.t0, 18)})`; g.fillRect(0, 0, W, H); }
    return [...marks.keys()];
  };
  window.frameJPEG = (t, q = 0.88) => { window.renderAt(t); return canvas.toDataURL('image/jpeg', q); };
  window.audit = () => tl.words.map((w, i) => {
    let seen = 0, first = null;
    for (let t = w.start; t < w.start + 1.2; t += 1 / 30) if (window.renderAt(t).includes(i)) { seen += 1 / 30; if (first === null) first = t - w.start; }
    return { word: w.display, start: w.start, seen: +seen.toFixed(2), first: first === null ? null : +first.toFixed(2) };
  });
  window.__duration = tl.duration;
  window.__ready = true;
}
boot().catch((e) => { console.error(e); window.__error = String(e.stack || e); });
