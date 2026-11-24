// 2D cartoon appliances (flat shading, thick ink outline). Origin = bottom centre.
import { INK, rr, circle, fillStroke, popText, COL } from './core.js';

/** TV. screen(g, x, y, w, h) draws the picture. w = total width. */
export function drawTV(g, w, screen) {
  const h = w * 0.6;
  // stand
  g.beginPath(); g.moveTo(-w * 0.06, -w * 0.08); g.lineTo(w * 0.06, -w * 0.08); g.lineTo(w * 0.04, -h * 0.02 - w * 0.08); g.lineTo(-w * 0.04, -h * 0.02 - w * 0.08); fillStroke(g, '#8b8aa0', 3);
  rr(g, -w * 0.22, -w * 0.045, w * 0.44, w * 0.045, 4); fillStroke(g, '#8b8aa0', 3);
  const y0 = -w * 0.08 - h;
  rr(g, -w / 2, y0, w, h, w * 0.035); fillStroke(g, '#25203a', 4);
  const p = w * 0.04;
  g.save(); rr(g, -w / 2 + p, y0 + p, w - 2 * p, h - 2.4 * p, w * 0.015); g.clip();
  screen ? screen(g, -w / 2 + p, y0 + p, w - 2 * p, h - 2.4 * p) : (g.fillStyle = '#0c0a18', g.fillRect(-w / 2, y0, w, h));
  g.restore();
  popText(g, 'T-POT', 0, y0 + h - p * 0.7, w * 0.035, { font: 'Anton', fill: '#ddd', outline: 0, shadow: false });
  return { top: y0, h: h + w * 0.08 };
}
export function screenGlow(g, x, y, w, h, c1 = '#2a0a5e', c2 = '#ff2a4d') {
  const gr = g.createLinearGradient(x, y, x + w, y + h); gr.addColorStop(0, c1); gr.addColorStop(1, c2);
  g.fillStyle = gr; g.fillRect(x, y, w, h);
  g.fillStyle = 'rgba(255,255,255,0.12)'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + w * 0.45, y); g.lineTo(x + w * 0.2, y + h); g.lineTo(x, y + h); g.fill();
}

export function drawWasher(g, w, drumAngle = 0, inside = null) {
  const h = w * 1.1;
  rr(g, -w / 2, -h, w, h, w * 0.08); fillStroke(g, '#f4f6fb', 4);
  rr(g, -w / 2, -h, w, h * 0.17, [w * 0.08, w * 0.08, 0, 0]); fillStroke(g, '#dfe3ee', 3);
  rr(g, -w * 0.4, -h * 0.94, w * 0.34, h * 0.08, 4); fillStroke(g, '#16e0ff', 2);
  popText(g, 'T-POT', -w * 0.23, -h * 0.9, w * 0.06, { font: 'Anton', fill: '#0c3a52', outline: 0, shadow: false });
  for (const k of [0.18, 0.32]) { circle(g, w * k, -h * 0.9, w * 0.035); fillStroke(g, '#8b8aa0', 2.5); }
  const cy = -h * 0.45, R = w * 0.33;
  circle(g, 0, cy, R + w * 0.05); fillStroke(g, '#b8bccc', 4);
  g.save(); circle(g, 0, cy, R); g.clip();
  g.fillStyle = '#2b3550'; g.fillRect(-R, cy - R, 2 * R, 2 * R);
  g.translate(0, cy); g.rotate(drawAngle(drumAngle));
  if (inside) inside(g, R);
  else for (let i = 0; i < 3; i++) { g.rotate(Math.PI * 2 / 3); rr(g, -R * 0.08, -R, R * 0.16, R * 0.35, 3); g.fillStyle = '#9aa3bb'; g.fill(); }
  g.restore();
  circle(g, 0, cy, R); g.fillStyle = 'rgba(160,220,255,0.25)'; g.fill(); g.lineWidth = 3; g.strokeStyle = INK; g.stroke();
  g.beginPath(); g.ellipse(-R * 0.35, cy - R * 0.4, R * 0.3, R * 0.14, -0.6, 0, Math.PI * 2); g.fillStyle = 'rgba(255,255,255,0.5)'; g.fill();
  return { top: -h, drum: { y: cy, r: R } };
}
const drawAngle = (a) => a;

export function drawFridge(g, w, open = 0) {
  const h = w * 2;
  rr(g, -w / 2, -h, w, h, w * 0.08); fillStroke(g, '#e9edf5', 4);
  g.beginPath(); g.moveTo(-w / 2, -h * 0.66); g.lineTo(w / 2, -h * 0.66); g.lineWidth = 3; g.strokeStyle = INK; g.stroke();
  for (const [y0, y1] of [[-h * 0.95, -h * 0.72], [-h * 0.6, -h * 0.35]]) { rr(g, w * 0.32, y0, w * 0.07, y1 - y0, 3); fillStroke(g, '#b8bccc', 2.5); }
  popText(g, 'T-POT', 0, -h * 0.12, w * 0.12, { font: 'Anton', fill: COL.tred, outline: 0, shadow: false });
  return { top: -h };
}

export function drawRice(g, w) {
  const h = w * 0.62;
  g.beginPath(); g.ellipse(0, -h * 0.95, w * 0.46, h * 0.32, 0, Math.PI, 0); fillStroke(g, '#dfe3ee', 4);
  rr(g, -w / 2, -h, w, h, [w * 0.12, w * 0.12, w * 0.2, w * 0.2]); fillStroke(g, '#ffffff', 4);
  g.fillStyle = COL.red; g.fillRect(-w / 2 + 2, -h * 0.55, w - 4, h * 0.1);
  rr(g, -w * 0.1, -h * 1.27, w * 0.2, h * 0.08, 4); fillStroke(g, INK, 2);
  popText(g, 'T-POT', 0, -h * 0.27, w * 0.09, { font: 'Anton', fill: COL.tred, outline: 0, shadow: false });
  return { top: -h * 1.27 };
}

export function drawAircon(g, w) {
  const h = w * 0.32;
  rr(g, -w / 2, -h, w, h, h * 0.35); fillStroke(g, '#f4f6fb', 4);
  for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(-w * 0.42, -h * 0.28 + i * 6); g.lineTo(w * 0.42, -h * 0.28 + i * 6); g.lineWidth = 2; g.strokeStyle = '#9aa3bb'; g.stroke(); }
  circle(g, w * 0.4, -h * 0.68, 3); g.fillStyle = '#2ee6a8'; g.fill();
  popText(g, 'T-POT', -w * 0.3, -h * 0.68, h * 0.22, { font: 'Anton', fill: COL.tred, outline: 0, shadow: false });
  return { top: -h };
}

export function drawMicrowave(g, w, glow = 0) {
  const h = w * 0.58;
  rr(g, -w / 2, -h, w, h, 8); fillStroke(g, '#3a3550', 4);
  rr(g, -w * 0.44, -h * 0.86, w * 0.62, h * 0.72, 6); fillStroke(g, glow ? `rgba(255,200,80,${0.5 + glow * 0.5})` : '#15112a', 3);
  for (let i = 0; i < 4; i++) { rr(g, w * 0.24, -h * 0.82 + i * h * 0.18, w * 0.16, h * 0.1, 2); g.fillStyle = '#8b8aa0'; g.fill(); }
  return { top: -h };
}

/** price tag hanging from a string. text: price. tilt in radians. */
export function drawTag(g, w, text, o = {}) {
  const h = w * 0.5;
  g.beginPath(); g.moveTo(-w / 2 + h * 0.4, -h / 2); g.lineTo(w / 2, -h / 2); g.lineTo(w / 2, h / 2); g.lineTo(-w / 2 + h * 0.4, h / 2); g.lineTo(-w / 2, 0); g.closePath();
  fillStroke(g, o.fill || COL.yellow, 4);
  circle(g, -w / 2 + h * 0.32, 0, h * 0.08); g.fillStyle = INK; g.fill();
  if (text) popText(g, text, h * 0.12, 0, h * (o.size || 0.48), { font: 'Bowlby', fill: o.color || INK, outline: 0, shadow: false });
  return { w, h };
}
