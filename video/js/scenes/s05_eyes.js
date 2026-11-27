// 5. "I STEPPED INSIDE, COULDN'T BELIEVE MY EYES"
// The store's sliding doors open, Pip steps inside on the beat (one step per word) into a
// dazzling showroom. On "COULDN'T" the camera pushes into the face; on "BELIEVE" the eyes
// go cosmic (rainbow hypno-rings, sparkle bursts on every beat, star pupils); on "EYES"
// the camera dives INTO the eye - through the rings to the T-POT at its centre.
import { W, H, INK, clamp, prog, lerp, easeOut, easeIn, easeInOut, easeOutBack, springHit, decay, popText, rr, circle, fillStroke, star, COL, RAINBOW, hash } from '../core.js';
import { drawTV, screenGlow, drawWasher, drawFridge, drawAircon, drawMicrowave, drawRice, drawTag, drawFan, drawBlender, drawKettle, drawLaptop, drawVacuum, drawTallSpeaker } from '../products.js';
import { drawBuddy, pose, SKINS, blinkAt, EYE, FACE_Y } from '../characters.js';
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
  const eye = { x: pip.x + EYE.x * S / Math.sqrt(sq), y: pip.y + EYE.y * S * sq };
  const face = { x: pip.x, y: pip.y + FACE_Y * S * sq };

  // A bright appliance showroom: every display is a DIFFERENT product, spread evenly across
  // the room (left half mirrors the right half's density), each reacting to the beat.
  const wallItems = [
    { x: W * 0.12, y: 118, d: (g, t) => drawAircon(g, 150) },
    { x: W * 0.5, y: 150, d: (g, t) => drawTV(g, 220, (g, x, y, w, h) => { screenGlow(g, x, y, w, h, '#16b8ff', '#ff2a4d'); popText(g, 'T-POT', x + w / 2, y + h / 2, 30, {}); }) },
    { x: W * 0.88, y: 128, d: (g, t) => drawMicrowave(g, 120, m.pulse(t)) },
  ];
  const floorItems = [
    { x: W * 0.06, d: (g, t) => drawFridge(g, 64) },
    { x: W * 0.19, d: (g, t) => drawWasher(g, 82, t * 4) },
    { x: W * 0.32, d: (g, t) => drawFan(g, 64, t * 14) },
    { x: W * 0.68, d: (g, t) => drawTallSpeaker(g, 48, m.pulse(t)) },
    { x: W * 0.81, d: (g, t) => drawVacuum(g, 70, t) },
    { x: W * 0.94, d: (g, t) => drawRice(g, 74) },
  ];
  const counterItems = [   // two matching display counters, one each side
    { x: W * 0.255, d: (g, t) => drawKettle(g, 50) },
    { x: W * 0.745, d: (g, t) => drawBlender(g, 44, t, 1) },
  ];
  const tags = ['RM999', 'RM399', 'RM129', 'RM599', 'RM89', 'RM199'];
  function showroom(g, t) {
    // walls: clean white/blue showroom with a red brand stripe
    const gr = g.createLinearGradient(0, 0, 0, GY); gr.addColorStop(0, '#eef6ff'); gr.addColorStop(1, '#d6e8fb');
    g.fillStyle = gr; g.fillRect(0, 0, W, GY);
    for (let x = 0; x < W; x += 107) { g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(x, 0, 4, GY); }
    g.fillStyle = COL.tred; g.fillRect(0, 206, W, 14); g.fillStyle = '#3ea74d'; g.fillRect(0, 220, W, 5);
    // ceiling spotlights, evenly spaced, pulsing on the beat
    for (let i = 0; i < 8; i++) {
      const x = (i + 0.5) * W / 8;
      rr(g, x - 12, 0, 24, 10, 3); fillStroke(g, '#2a2440', 2);
      g.save(); g.globalAlpha = 0.12 + 0.12 * m.pulse(t); g.fillStyle = '#fff3c0';
      g.beginPath(); g.moveTo(x - 9, 10); g.lineTo(x + 9, 10); g.lineTo(x + 55, GY); g.lineTo(x - 55, GY); g.fill(); g.restore();
    }
    // wall-mounted products (each hops slightly on the beat)
    wallItems.forEach((it, i) => { const hop = Math.max(0, springHit(m.since(t) - i * 0.04, 16, 9)) * 4; g.save(); g.translate(it.x, it.y - hop); it.d(g, t); g.restore(); });
    // floor: polished light tiles
    g.fillStyle = '#c9d3e3'; g.fillRect(0, GY, W, H - GY);
    for (let x = 0; x < W; x += 61) { g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(x, GY, 2, H - GY); }
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(0, GY + 2, W, 5);
    // counters with small appliances
    counterItems.forEach((it, i) => {
      rr(g, it.x - 46, GY - 62, 92, 62, 6); fillStroke(g, '#ffffff', 3);
      g.fillStyle = COL.tred; g.fillRect(it.x - 46, GY - 62, 92, 8);
      const hop = Math.max(0, springHit(m.since(t) - 0.05 - i * 0.03, 16, 9)) * 5;
      g.save(); g.translate(it.x, GY - 62 - hop); it.d(g, t); g.restore();
    });
    // floor products with price tags
    floorItems.forEach((it, i) => {
      const hop = Math.max(0, springHit(m.since(t) - i * 0.03, 16, 9)) * 5;
      g.save(); g.translate(it.x, GY - hop); it.d(g, t); g.restore();
      g.save(); g.translate(it.x + 22, GY - 12); g.rotate(-0.1); drawTag(g, 58, tags[i], { fill: COL.yellow, size: 0.42 }); g.restore();
    });
    sparkles(g, t, 10, 5, { x: 0, y: 0, w: W, h: GY }, '#ffffff');
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
