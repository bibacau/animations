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
  return { parts, box: { x: x0, y: y0, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 } };
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
