// A traced logo (scripts/trace_logo.py -> scripts/logo_parts.py) as animatable vector parts.
//   loadLogo(url, word)  - word = the brand name as it is written (e.g. "ACME"); standalone uses
//                          of that word in popText() are then drawn in the logo's letterforms
//   drawPart / homeOf    - move individual parts (letters can run, fly, assemble)
//   drawLogoWord         - the word-mark only, at a given cap height (signs, labels, shirts)
export const BRAND = { logo: null, word: null, wm: null };

export async function loadLogo(url, word, wordLayer) {
  const d = await fetch(url).then((r) => r.json());
  const [x0, y0, x1, y1] = d.bbox;
  const parts = {};
  for (const p of d.parts) {
    const [a, b, c, e] = p.bb;
    parts[p.name] = { ...p, path: new Path2D(p.paths.join(' ')), cx: (a + c) / 2, cy: (b + e) / 2, w: c - a, h: e - b };
  }
  // word-mark box: the parts of the main (first, or named) colour layer
  const layer = wordLayer || d.parts[0].layer;
  const wp = Object.values(parts).filter((p) => p.layer === layer);
  const wm = { x0: Math.min(...wp.map((p) => p.bb[0])), y0: Math.min(...wp.map((p) => p.bb[1])), x1: Math.max(...wp.map((p) => p.bb[2])), y1: Math.max(...wp.map((p) => p.bb[3])) };
  const logo = { parts, box: { x: x0, y: y0, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 }, wm,
    // parts drawn as "the word": the word layer + anything whose centre sits inside it (e.g. a leaf inside an O)
    wordParts: Object.values(parts).filter((p) => p.layer === layer || (p.cx > wm.x0 && p.cx < wm.x1 && p.cy > wm.y0 && p.cy < wm.y1)) };
  BRAND.logo = logo; BRAND.word = word || null; BRAND.wm = wm;
  return logo;
}

/** draw one part centred at (x, y) (screen px), at `scale` px per logo unit */
export function drawPart(g, part, x, y, scale, rot = 0, o = {}) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(scale * (o.sx || 1), scale * (o.sy || 1));
  g.translate(-part.cx, -part.cy);
  if (o.outline) { g.lineWidth = o.outline / scale; g.strokeStyle = o.outlineCol || '#fff'; g.lineJoin = 'round'; g.stroke(part.path); }
  g.fillStyle = o.fill || part.color; g.fill(part.path, 'evenodd');
  g.restore();
}
/** centre of a part when the whole logo is drawn centred at (x, y) */
export function homeOf(logo, part, x, y, scale) { return { x: x + (part.cx - logo.box.cx) * scale, y: y + (part.cy - logo.box.cy) * scale }; }
/** whole logo centred at (x, y) with total width w */
export function drawLogo(g, x, y, w, o = {}) {
  const L = BRAND.logo; if (!L) return; const s = w / L.box.w;
  for (const p of Object.values(L.parts)) { const h = homeOf(L, p, x, y, s); drawPart(g, p, h.x, h.y, s, 0, o); }
}

export const logoWordWidth = (capH) => { const m = BRAND.wm; return m ? (m.x1 - m.x0) * capH / (m.y1 - m.y0) : capH * 3; };
/** the word-mark centred at (x, y) with cap height capH. o: { fill, leafFill, outline, outlineCol, glow, glowBlur } */
export function drawLogoWord(g, x, y, capH, o = {}) {
  const L = BRAND.logo, m = BRAND.wm; if (!L) return;
  const s = capH / (m.y1 - m.y0), cx = (m.x0 + m.x1) / 2, cy = (m.y0 + m.y1) / 2;
  g.save(); g.translate(x, y); g.scale(s, s); g.translate(-cx, -cy);
  if (o.outline) { g.lineJoin = 'round'; g.strokeStyle = o.outlineCol || '#fff'; g.lineWidth = o.outline * 2 / s; for (const p of L.wordParts) g.stroke(p.path); }
  if (o.glow) { g.shadowColor = o.glow; g.shadowBlur = o.glowBlur || 18; }
  const main = L.wordParts[0].layer;
  for (const p of L.wordParts) { g.fillStyle = o.fill ? (p.layer !== main && o.leafFill ? o.leafFill : o.fill) : p.color; g.fill(p.path, 'evenodd'); }
  g.restore();
}
