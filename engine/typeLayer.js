// Full-frame typography layer: the words sung so far in the current phrase repeat in
// giant rows that fill the whole background, alternating direction, stepping on kicks.
// Only already-sung words are used, so nothing appears before the singer.
import * as THREE from 'three';

export class TypeLayer {
  constructor(w = 1280, h = 720) {
    this.c = document.createElement('canvas'); this.c.width = w; this.c.height = h;
    this.g = this.c.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.c);
    this.tex.colorSpace = THREE.NoColorSpace;
    this.w = w; this.h = h;
  }
  /**
   * @param o {text, t, kicks (count of kicks so far + frac), rows, style:'mix'|'outline'|'fill', scrollY, angle}
   */
  draw(o) {
    const { g, w, h } = this;
    g.clearRect(0, 0, w, h);
    if (!o || !o.text) { this.tex.needsUpdate = true; return; }
    const rows = o.rows || 5;
    const rowH = h / (rows - 0.6);
    const size = rowH * 0.92;
    g.save();
    g.translate(w / 2, h / 2); g.rotate(o.angle || 0); g.translate(-w / 2, -h / 2);
    g.font = `${size}px Anton, Impact, sans-serif`;
    g.textBaseline = 'middle';
    const unit = o.text + '   •   ';
    const uw = Math.max(40, g.measureText(unit).width);
    const sy = ((o.scrollY || 0) % rowH + rowH) % rowH;
    for (let r = -2; r < rows + 2; r++) {
      const dir = r % 2 ? 1 : -1;
      const off = ((o.t * (o.speed ?? 60) + o.step * 90) * dir + r * uw * 0.37) % uw;
      const y = r * rowH + rowH * 0.5 + sy - rowH;
      const outline = o.style === 'outline' || (o.style !== 'fill' && r % 2 === 0);
      g.lineWidth = Math.max(2, size * 0.035);
      for (let x = off - uw * 2; x < w + uw; x += uw) {
        if (outline) { g.strokeStyle = 'rgba(255,255,255,1)'; g.strokeText(unit, x, y); }
        else { g.fillStyle = 'rgba(255,255,255,0.75)'; g.fillText(unit, x, y); }
      }
    }
    g.restore();
    this.tex.needsUpdate = true;
  }
}
