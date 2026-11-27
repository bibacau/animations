// 8. "TV'S FLASHING, WASHERS GOING NON-STOP"
// Pip dances under a disco ball; POOF on "TV'S" - Pip is now a TV. On "FLASHING" the TV
// face strobes colours on every 16th note. On "WASHERS" the camera zooms into the TV
// screen, which is showing a washing machine; that becomes the whole frame. On "GOING"
// we zoom into the drum, and on "NON-STOP" we're inside it: everything spins crazily,
// faster and faster (with spin blur), socks + T-POT letters + bubbles, into a white-out.
import { W, H, INK, clamp, prog, lerp, easeOut, easeIn, easeInOut, smooth as smoothF, easeOutBack, springHit, decay, popText, rr, circle, fillStroke, star, COL, RAINBOW, hash } from '../core.js';
import { drawWasher } from '../products.js';
import { drawBuddy, drawTVBuddy, pose, SKINS, blinkAt } from '../characters.js';
import { sparkles, confetti, neonBars, speakerRow, silhouettes } from '../world.js';

export default function make(ctx, t0, t1) {
  const m = ctx.music, wd = m.wordsIn(t0, t1);
  const [wTv, wFlash, wWash, wGoing, wNon] = wd;
  const GY = H - 80;
  const S = 1.6;
  const body = { x: W / 2, y: GY };
  const screen = { x: body.x, y: body.y - (62 + 32) * S, w: 88 * S, h: 52 * S };   // TV-head screen in world px
  const poofT = wTv.start - 0.04;
  const zTv = wWash.start, zDrum = wGoing.start, spinT = wNon.start;
  const tmp = ctx.tmp, tg = tmp.getContext('2d');

  function laundromat(g, t, drumZ = 1) {
    // full-frame washer room; drumZ zooms into the drum
    const wx = W / 2, wy = H - 40, ww = 260;
    const drumY = wy - ww * 1.1 * 0.45;
    g.save();
    g.translate(wx, drumY); g.scale(drumZ, drumZ); g.translate(-wx, -drumY);
    g.fillStyle = '#bfeaff'; g.fillRect(-W, -H, W * 3, H * 3);
    for (let y = -H; y < H * 2; y += 40) for (let x = -W; x < W * 2; x += 40) { if ((x + y) / 40 % 2 === 0) { g.fillStyle = '#a8e0ff'; g.fillRect(x, y, 40, 40); } }
    // side washers bouncing on the beat
    for (const sx of [-1, 1]) for (let k = 1; k <= 2; k++) {
      g.save(); g.translate(wx + sx * (k * 250), wy - Math.abs(springHit(m.since(t) - k * 0.03, 16, 8)) * 6); drawWasher(g, 170, t * 8 * sx); g.restore();
    }
    g.fillStyle = '#9fb4cc'; g.fillRect(-W, wy, W * 3, H);
    g.save(); g.translate(wx, wy); drawWasher(g, ww, drumAngle(t), (g, R) => {
      for (let i = 0; i < 5; i++) { g.rotate(Math.PI * 2 / 5); rr(g, -R * 0.25, R * 0.25, R * 0.5, R * 0.3, 6); g.fillStyle = RAINBOW[i]; g.fill(); }
    }); g.restore();
    popText(g, 'T-POT', wx, wy - ww * 1.1 - 26, 36, { fill: COL.tred, outline: 6 });
    g.restore();
    return { drumY, drumR: ww * 0.33 };
  }

  // drum rotation shared by the laundromat close-up and the inside view, so the hand-off is
  // seamless: a steady 3 rad/s that ramps up smoothly (cubic) once NON-STOP starts
  const SPIN0 = spinT - 0.12;
  function drumAngle(t) { const s = Math.max(0, t - SPIN0); return 3 * t + 4.5 * s * s * s; }
  function drumOmega(t) { const s = Math.max(0, t - SPIN0); return 3 + 13.5 * s * s; }
  function drumInside(g, t) {
    // the drum interior, spinning: angle accelerates continuously
    const ang = drumAngle(t);
    g.save(); g.translate(W / 2, H / 2); g.rotate(ang);
    g.fillStyle = '#26305a'; g.fillRect(-W, -W, W * 2, W * 2);
    for (let r = 60; r < 700; r += 46) { circle(g, 0, 0, r); g.strokeStyle = r % 92 ? '#3a4880' : '#4a5a9a'; g.lineWidth = 8; g.stroke(); }
    for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; for (let r = 90; r < 700; r += 60) { circle(g, Math.cos(a) * r, Math.sin(a) * r, 5); g.fillStyle = '#5a6aa8'; g.fill(); } }
    for (let i = 0; i < 3; i++) { g.save(); g.rotate(i * Math.PI * 2 / 3); rr(g, -26, -560, 52, 330, 12); fillStroke(g, '#9aa3bb', 4); g.restore(); }
    // tumbling laundry + letters orbiting at different radii
    const items = ['sock', 'shirt', 'T', '-', 'P', 'O', 'T', 'sock', 'bubble', 'shirt', 'bubble', 'bubble'];
    items.forEach((k, i) => {
      const a = i / items.length * Math.PI * 2 + Math.sin(t * 2 + i) * 0.3, r = 120 + (i % 4) * 70;
      g.save(); g.translate(Math.cos(a) * r, Math.sin(a) * r); g.rotate(t * 5 + i);
      if (k === 'sock') { g.beginPath(); g.moveTo(-10, -30); g.lineTo(10, -30); g.lineTo(10, 10); g.lineTo(30, 18); g.lineTo(26, 32); g.lineTo(-10, 26); g.closePath(); fillStroke(g, RAINBOW[i % 8], 4); }
      else if (k === 'shirt') { g.beginPath(); g.moveTo(-34, -30); g.lineTo(-14, -38); g.lineTo(0, -30); g.lineTo(14, -38); g.lineTo(34, -30); g.lineTo(44, -10); g.lineTo(26, -4); g.lineTo(26, 36); g.lineTo(-26, 36); g.lineTo(-26, -4); g.lineTo(-44, -10); g.closePath(); fillStroke(g, RAINBOW[(i + 3) % 8], 4); }
      else if (k === 'bubble') { circle(g, 0, 0, 22); g.fillStyle = 'rgba(200,240,255,0.5)'; g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 3; g.stroke(); }
      else popText(g, k, 0, 0, 60, { fill: COL.tred, outline: 8, stroke: '#fff' });
      g.restore();
    });
    g.restore();
    return ang;
  }

  return {
    name: 'tvwash', caption: { pos: 'bottom' }, shake: (t) => (t >= spinT ? 0.4 : 0.9),
    draw(g, t) {
      const zEnd = zTv + 0.45;                         // TV-screen zoom finishes on GOING
      if (t >= zEnd) {
        // inside the TV picture: ease into the drum, cross-fade to the drum interior, spin
        const dz = easeInOut(prog(t, zDrum, spinT + 0.15));
        laundromat(g, t, 1 + dz * 5.2);
        const fade = smoothF(prog(t, spinT - 0.12, spinT + 0.18));
        if (fade > 0) {
          tg.setTransform(1, 0, 0, 1, 0, 0);
          drumInside(tg, t);
          const smear = Math.min(0.55, drumOmega(t) / 30 * 0.9);   // ~ one frame of rotation
          g.save(); g.globalAlpha = fade; g.drawImage(tmp, 0, 0); g.restore();
          if (smear > 0.06) for (let k = 1; k <= 5; k++) { g.save(); g.globalAlpha = fade * 0.22; g.translate(W / 2, H / 2); g.rotate(-smear * k / 5); g.translate(-W / 2, -H / 2); g.drawImage(tmp, 0, 0); g.restore(); }
        }
        const wo = easeIn(prog(t, t1 - 0.35, t1)); if (wo > 0) { g.fillStyle = `rgba(255,255,255,${wo})`; g.fillRect(0, 0, W, H); }
        return;
      }
      // ---- stage: disco Pip -> TV-Pip
      const flashing = t >= wFlash.start;
      g.fillStyle = flashing ? RAINBOW[Math.floor((t - wFlash.start) / (m.P / 4)) % 8] : '#0d1a3a'; g.fillRect(0, 0, W, H);
      if (flashing) { g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(0, 0, W, H); }
      neonBars(g, t, m, 10, 110, GY - 14);
      // disco ball + light spots
      const ba = t * 1.5;
      g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); g.moveTo(W / 2, 0); g.lineTo(W / 2, 40); g.stroke();
      circle(g, W / 2, 70, 30); fillStroke(g, '#c8c8d8', 3);
      for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) { g.fillStyle = (i + j + Math.floor(ba * 4)) % 3 ? '#e8e8f8' : '#8888a8'; g.fillRect(W / 2 - 24 + i * 8, 48 + j * 11, 6, 9); }
      for (let i = 0; i < 26; i++) { const a = ba + i * 2.39, r = 120 + (i * 37) % 300; circle(g, W / 2 + Math.cos(a) * r * 1.4, 70 + Math.abs(Math.sin(a)) * r, 5); g.fillStyle = RAINBOW[i % 8] + 'aa'; g.fill(); }
      g.fillStyle = '#16244a'; g.fillRect(0, GY, W, H - GY);
      speakerRow(g, t, m, 4, GY, 0.95);
      for (let i = 0; i < 10; i++) { g.fillStyle = (i + m.idx(t)) % 2 ? '#ff4fd8' : '#16e0ff'; g.globalAlpha = 0.5 + 0.5 * m.pulse(t); g.fillRect(i * W / 10, GY, W / 10 - 4, 8); g.globalAlpha = 1; }
      // zoom into the TV screen on WASHERS
      const zu = easeInOut(prog(t, zTv, zTv + 0.45));
      const Z = 1 + zu * (W / screen.w - 1);
      g.save();
      const cx = lerp(W / 2, screen.x, zu), cy = lerp(H / 2, screen.y, zu);
      g.translate(W / 2, H / 2); g.scale(Z, Z); g.translate(-cx, -cy);
      if (t < poofT) {
        const dance = m.phase(t);
        drawBuddy(g, { x: body.x + Math.sin(m.count(t) * Math.PI) * 30, y: body.y, s: 1.3, skin: SKINS.pip, ...pose(m.idx(t) % 2 ? 'wave' : 'cheer', dance), face: 'joy', t });
      } else {
        const b = m.since(t);
        drawTVBuddy(g, { x: body.x, y: body.y, s: S, armL: 0.4 + (m.idx(t) % 2) * 2, armR: 0.4 + ((m.idx(t) + 1) % 2) * 2, legL: Math.sin(m.count(t) * Math.PI) * 0.4, legR: -Math.sin(m.count(t) * Math.PI) * 0.4,
          headTilt: Math.sin(m.count(t) * Math.PI) * 0.08,
          screen: (g, x, y, w, h) => {
            if (t >= zTv) {   // the picture: our washer room (continuous with the full-frame cut)
              g.save(); g.translate(x, y + (h - H * w / W) / 2); g.scale(w / W, w / W); laundromat(g, t, 1); g.restore();   // uniform scale: matches the full-frame cut exactly
            } else if (flashing) {
              const k = Math.floor((t - wFlash.start) / (m.P / 4));
              g.fillStyle = RAINBOW[(k * 3) % 8]; g.fillRect(x, y, w, h);
              if (k % 2) popText(g, 'T-POT', x + w / 2, y + h / 2, 22, { fill: '#fff', outline: 4 });
              else { g.fillStyle = INK; circle(g, x + w * 0.35, y + h * 0.42, 5); g.fill(); circle(g, x + w * 0.65, y + h * 0.42, 5); g.fill(); g.lineWidth = 3; g.strokeStyle = INK; g.beginPath(); g.arc(x + w / 2, y + h * 0.55, 10, 0.2, Math.PI - 0.2); g.stroke(); }
            } else {
              g.fillStyle = '#16e0ff'; g.fillRect(x, y, w, h);
              g.fillStyle = INK; circle(g, x + w * 0.35, y + h * 0.42, 5); g.fill(); circle(g, x + w * 0.65, y + h * 0.42, 5); g.fill();
              g.lineWidth = 3; g.strokeStyle = INK; g.beginPath(); g.arc(x + w / 2, y + h * 0.55, 10, 0.2, Math.PI - 0.2); g.stroke();
              g.fillStyle = `rgba(255,255,255,${0.3 * decay(b, 10)})`; g.fillRect(x, y, w, h);
            }
          } });
        // TV glow flashes onto the floor
        if (flashing && t < zTv) { g.save(); g.globalAlpha = 0.35 * m.pulse8(t); g.fillStyle = '#fff'; g.beginPath(); g.ellipse(body.x, GY + 10, 200, 26, 0, 0, Math.PI * 2); g.fill(); g.restore(); }
      }
      g.restore();
      // the dancing crowd in front of the stage (fades as we zoom into the screen)
      if (t < zTv + 0.2) { g.save(); g.globalAlpha = 1 - prog(t, zTv, zTv + 0.2); silhouettes(g, t, m, 9, H + 18); g.restore(); }
      // POOF cloud for the transformation
      if (t >= poofT && t < poofT + 0.45) {
        const u = prog(t, poofT, poofT + 0.45);
        for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; circle(g, body.x + Math.cos(a) * 80 * (0.3 + u), body.y - 110 + Math.sin(a) * 70 * (0.3 + u), 42 * (1 - u * 0.8)); g.fillStyle = `rgba(255,255,255,${0.95 - u * 0.6})`; g.fill(); }
        popText(g, 'POOF!', body.x, body.y - 120, 40 * (0.6 + u), { fill: COL.yellow, outline: 7 });
      }
      if (flashing && t < zTv) sparkles(g, t, 14, 41, { x: 0, y: 0, w: W, h: GY }, '#fff');
    },
  };
}
