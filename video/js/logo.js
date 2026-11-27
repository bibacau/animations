// The real T-POT logo, traced to vectors (assets/logo/tpot_logo_parts.json) and split into
// parts: T1, DASH, P, O, T2, LEAF, SWOOSH. Each part can be drawn on its own (centred on
// its own box) or in place, so the letters can run around and then assemble.
export async function loadLogo() {
  const d = await fetch('/assets/logo/tpot_logo_parts.json').then((r) => r.json());
  const [x0, y0, x1, y1] = d.bbox;
  const parts = {};
  for (const p of d.parts) {
    const path = new Path2D(p.paths.join(' '));
    const [a, b, c, e] = p.bb;
    parts[p.name] = { name: p.name, path, color: p.color, cx: (a + c) / 2, cy: (b + e) / 2, w: c - a, h: e - b };
  }
  const logo = { parts, box: { x: x0, y: y0, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 } };
  BRAND.logo = logo;
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
/** position of a part's centre when the whole logo is drawn centred at (x, y) */
export function homeOf(logo, part, x, y, scale) { return { x: x + (part.cx - logo.box.cx) * scale, y: y + (part.cy - logo.box.cy) * scale }; }

// ---------------------------------------------------------------- brand word
// "T-POT" is always drawn with the logo's own letterforms (never a plain font).
export const BRAND = { logo: null };
const WM = { x0: 62.4, x1: 395.8, y0: 171.7, y1: 246.6 };   // wordmark letters box (logo units)
const WM_CX = (WM.x0 + WM.x1) / 2, WM_CY = (WM.y0 + WM.y1) / 2, WM_H = WM.y1 - WM.y0;
/** width in px of the T-POT word at cap height capH */
export const logoWordWidth = (capH) => (WM.x1 - WM.x0) * capH / WM_H;
/**
 * draw the T-POT word centred at (x, y) with cap height capH.
 * o: { fill (single colour override, e.g. neon), outline px, outlineCol, leaf (default true),
 *      swoosh (default false), glow (shadow colour), alpha }
 */
export function drawLogoWord(g, x, y, capH, o = {}) {
  const L = BRAND.logo; if (!L) return;
  const s = capH / WM_H;
  g.save(); g.translate(x, y); g.scale(s, s); g.translate(-WM_CX, -WM_CY);
  const names = ['T1', 'DASH', 'P', 'O', 'T2'];
  if (o.leaf !== false) names.push('LEAF');
  if (o.swoosh) names.push('SWOOSH');
  if (o.outline) {
    g.lineJoin = 'round'; g.strokeStyle = o.outlineCol || '#fff'; g.lineWidth = o.outline * 2 / s;
    for (const n of names) g.stroke(L.parts[n].path);
  }
  if (o.glow) { g.shadowColor = o.glow; g.shadowBlur = (o.glowBlur || 18); }
  for (const n of names) { const p = L.parts[n]; g.fillStyle = o.fill ? (n === 'LEAF' && o.leafFill ? o.leafFill : o.fill) : p.color; g.fill(p.path, 'evenodd'); }
  g.restore();
}
