// 5. "I STEPPED INSIDE, COULDN'T BELIEVE MY EYES"
// The store's sliding doors open, Pip steps inside on the beat (one step per word) into a
// dazzling showroom. On "COULDN'T" the camera pushes into the face; on "BELIEVE" the eyes
// go cosmic (rainbow hypno-rings, sparkle bursts on every beat, star pupils); on "EYES"
// the camera dives INTO the eye - through the rings to the T-POT at its centre.
import { W, H, INK, clamp, prog, lerp, easeOut, easeIn, easeInOut, easeOutBack, springHit, decay, popText, rr, circle, fillStroke, star, COL, RAINBOW, hash } from '../core.js';
import { drawTV, screenGlow, drawWasher, drawFridge } from '../products.js';
import { drawBuddy, pose, SKINS, blinkAt } from '../characters.js';
import { sparkles, sparkle, bunting } from '../world.js';

export default function make(ctx, t0, t1) {
  const m = ctx.music, wd = m.wordsIn(t0, t1);
  const [wI, wStep, wIn, wCould, wBel, wMy, wEyes] = wd;
  const GY = H - 92;
  const pip = { x: W * 0.5, y: GY };
  const doorOpen = wI.start - 0.25;
  const steps = [wI.start, wStep.start, wIn.start].map((x) => m.after(x, true));
  const faceZ = wCould.start, cosmic = wBel.start, dive = wEyes.start;
  // eye centre in Pip's local units (right eye) -> world
  const S = 1.1;
  // (the 'shock' pose squashes the body by 1.06, which moves the eyes)
  const sq = 1.06;
  const eye = { x: pip.x + 13 * S / Math.sqrt(sq), y: pip.y - 66 * S * sq };
  const face = { x: pip.x, y: pip.y - 62 * S * sq };

  function showroom(g, t) {
    const gr = g.createLinearGradient(0, 0, 0, GY); gr.addColorStop(0, '#2a0a5e'); gr.addColorStop(1, '#7b2cff');
    g.fillStyle = gr; g.fillRect(0, 0, W, GY);
    // a wall of TVs, all showing T-POT, flashing on the beat
    for (let r = 0; r < 3; r++) for (let c = 0; c < 7; c++) {
      const x = 70 + c * 120, y = 70 + r * 92;
      g.save(); g.translate(x, y + 70); g.scale(0.42, 0.42);
      drawTV(g, 220, (g, sx, sy, w, h) => { screenGlow(g, sx, sy, w, h, RAINBOW[(r * 7 + c + m.idx(t)) % 8], '#2a0a5e'); popText(g, 'T-POT', sx + w / 2, sy + h / 2, 44, { fill: '#fff', outline: 6 }); });
      g.restore();
    }
    // light beams sweeping
    g.save(); g.globalAlpha = 0.16;
    for (let i = 0; i < 5; i++) { const a = Math.sin(t * 1.2 + i * 1.3) * 0.5; g.fillStyle = i % 2 ? '#ffd400' : '#16e0ff'; g.beginPath(); g.moveTo(W * (0.1 + i * 0.2), 0); g.lineTo(W * (0.1 + i * 0.2) + Math.sin(a) * 500 - 60, GY); g.lineTo(W * (0.1 + i * 0.2) + Math.sin(a) * 500 + 60, GY); g.fill(); }
    g.restore();
    g.fillStyle = '#1b1035'; g.fillRect(0, GY, W, H - GY);
    g.save(); g.globalAlpha = 0.35; for (let x = 0; x < W; x += 40) { g.fillStyle = RAINBOW[(x / 40 + m.idx(t)) % 8 | 0]; g.fillRect(x, GY, 20, 6); } g.restore();
    sparkles(g, t, 14, 5, { x: 0, y: 0, w: W, h: GY }, '#fff');
  }

  return {
    name: 'eyes', caption: { pos: 'bottom' }, shake: (t) => (t >= cosmic ? 0.9 : 0.35),
    draw(g, t) {
      // camera: wide -> face -> into the eye
      const zf = easeInOut(prog(t, faceZ, cosmic)), zd = easeIn(prog(t, dive, t1 - 0.05));
      const Z = 1 + zf * 3.2 + zd * zd * 140;
      const fx = lerp(lerp(W / 2, face.x, zf), eye.x, easeOut(prog(t, dive, dive + 0.5)));
      const fy = lerp(lerp(H / 2, face.y, zf), eye.y, easeOut(prog(t, dive, dive + 0.5)));
      g.save();
      g.translate(W / 2, H * 0.45); g.scale(Z, Z); g.translate(-fx, -fy);
      showroom(g, t);
      // Pip steps in: one step per word, on the beat grid
      const nSteps = steps.filter((s) => t >= s).length;
      const stepU = steps.reduce((a, s) => a + easeOut(prog(t, s, s + 0.2)), 0);
      const px = lerp(pip.x - 330, pip.x, stepU / steps.length);
      let ps = t < steps[0] ? pose('idle', m.phase(t)) : nSteps < steps.length || t < steps.at(-1) + 0.2 ? pose('walk', stepU * 0.5) : pose('shock');
      let fc = 'happy';
      if (t >= faceZ) fc = 'surprise';
      if (t >= cosmic) fc = 'cosmic';
      if (t >= cosmic && t < dive) {      // star pupils on alternating beats
        const b = m.idx(t) - m.idx(cosmic);
        if (b % 2 === 1) fc = 'stars';
      }
      drawBuddy(g, { x: px, y: pip.y, s: S, skin: SKINS.pip, ...ps, face: fc, t, eyeScale: t >= cosmic ? 1.25 + m.pulse(t) * 0.12 : 1, blink: t < faceZ ? blinkAt(t, 5) : 0 });
      // sparkle bursts around the eyes on every beat once they go cosmic
      if (t >= cosmic && t < dive + 0.3) {
        const since = m.since(t), k = decay(since, 5);
        for (let i = 0; i < 10; i++) {
          const a = i / 10 * Math.PI * 2 + m.idx(t), r = 20 + since * 90;
          sparkle(g, face.x + Math.cos(a) * r * 1.6, face.y - 4 + Math.sin(a) * r, 5 * k + 1, t * 3, RAINBOW[i % 8]);
        }
      }
      g.restore();
      // the sliding doors in the foreground (open as Pip arrives), wide shot only
      if (t < faceZ + 0.3) {
        const op = easeInOut(prog(t, doorOpen, doorOpen + 0.5)), fade = 1 - prog(t, faceZ, faceZ + 0.3);
        g.save(); g.globalAlpha = fade;
        for (const sd of [-1, 1]) {
          const x = W / 2 + sd * (W * 0.25 + op * W * 0.27);
          rr(g, x - W * 0.25, 0, W * 0.5, H, 0); g.fillStyle = 'rgba(180,230,255,0.35)'; g.fill(); g.lineWidth = 10; g.strokeStyle = '#d9dde8'; g.stroke();
          g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.moveTo(x - W * 0.2, 40); g.lineTo(x - W * 0.12, 40); g.lineTo(x - W * 0.2, 200); g.fill();
          popText(g, 'T-POT', x, H * 0.3, 30, { fill: COL.tred, outline: 5 });
        }
        g.restore();
      }
      // deep in the eye: rings fill the screen, then white
      if (zd > 0.5) { g.fillStyle = `rgba(255,255,255,${clamp((zd - 0.75) / 0.25)})`; g.fillRect(0, 0, W, H); }
      if (t >= cosmic && t < dive) popText(g, 'WOW!', W * 0.84, 70, 42 * (1 + m.pulse(t) * 0.2), { fill: COL.yellow, outline: 8 });
    },
  };
}
