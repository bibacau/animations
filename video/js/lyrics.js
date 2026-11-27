// Karaoke-style lyric line: words appear exactly when sung (pop-in centred on the onset),
// the word being sung is yellow and bounces, sung words stay white. Positions are laid out
// for the whole line up front so nothing shifts as words appear.
import { W, H, popText, textWidth, clamp, easeOutBack, decay } from './core.js';

/** where each word of the caption line sits (used to fly words into the line) */
export function captionLayout(g, music, phrase, o = {}) {
  const words = phrase.words.map((i) => music.words[i]);
  let size = o.size || 30;
  const gap = size * 0.35;
  let widths = words.map((w) => textWidth(g, w.display, size));
  let total = widths.reduce((a, b) => a + b, 0) + gap * (words.length - 1);
  const maxW = W - 60;
  if (total > maxW) { const k = maxW / total; size *= k; widths = widths.map((x) => x * k); total = maxW; }
  const y = o.y ?? (o.pos === 'top' ? 42 : H - 38);
  let x = W / 2 - total / 2; const xs = [];
  widths.forEach((wd) => { xs.push(x + wd / 2); x += wd + size * 0.35; });
  return { xs, y, size };
}

export function drawCaption(g, music, phrase, t, o = {}) {
  if (!phrase) return;
  const words = phrase.words.map((i) => music.words[i]);
  if (t < words[0].start - 0.06) return;
  let size = o.size || 30;
  const gap = size * 0.35;
  let widths = words.map((w) => textWidth(g, w.display, size));
  let total = widths.reduce((a, b) => a + b, 0) + gap * (words.length - 1);
  const maxW = W - 60;
  if (total > maxW) { const k = maxW / total; size *= k; widths = widths.map((x) => x * k); total = maxW; }
  const y = o.y ?? (o.pos === 'top' ? 42 : H - 38);
  let x = W / 2 - total / 2;
  const cur = words.filter((w) => w.start - 0.05 <= t).at(-1);
  words.forEach((w, k) => {
    const cx = x + widths[k] / 2; x += widths[k] + gap;
    const lt = t - (w.start - 0.05);
    if (lt < 0 || (o.hide && o.hide.includes(k))) return;
    const s = easeOutBack(clamp(lt / 0.16), 2.4) * (1 + (w === cur ? 0.12 * decay(t - w.start, 6) : 0));
    const active = w === cur && t < w.end + 0.15;
    g.save(); g.translate(cx, y - (active ? 4 * decay(t - w.start, 5) : 0)); g.scale(s, s);
    popText(g, w.display, 0, 0, size, { fill: active ? (o.hi || '#ffd400') : (o.fill || '#fff'), stroke: o.stroke, outline: size * 0.2 });
    g.restore();
  });
}
