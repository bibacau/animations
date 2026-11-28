// Example scene: shows the house rules in ~60 lines. Copy it for every new scene.
//  - backdrop that fits the subject, filled edge to edge (no blank areas)
//  - decorations on an even grid across the FULL width (no centre cluster, no tiny clutter)
//  - something happens on EVERY beat (hops, pulses, lights) + bigger hits on strong beats
//  - an action that is obvious (the drop lands ON a beat, with squash + dust)
//  - the brand word standalone = logo letterforms; in a sentence = normal font
import { W, H, clamp, prog, easeIn, easeOutBack, springHit, decay, popText, rr, circle, fillStroke, COL } from '../core.js';
import { drawBuddy, pose, SKINS, blinkAt } from '../characters.js';
import { hangingBulbs, posterRow, shelfRow, wallpaper, confetti } from '../world.js';
import { drawLogo } from '../logo.js';

export default function make(ctx, t0, t1) {
  const m = ctx.music, GY = H - 90;
  const firstBeat = m.after(t0 + 0.3);                // the hero lands on a beat
  return {
    name: 'example', caption: { pos: 'bottom' }, shake: 0.5,
    draw(g, t) {
      const gr = g.createLinearGradient(0, 0, 0, GY); gr.addColorStop(0, '#eef6ff'); gr.addColorStop(1, '#d6e8fb');
      g.fillStyle = gr; g.fillRect(0, 0, W, GY);
      wallpaper(g, '#ffffff', 0.5, GY);
      hangingBulbs(g, t, m, 9, 26, 1);
      shelfRow(g, t, m, 150, 9, 0.6);
      posterRow(g, t, m, 6, 250, 90);
      g.fillStyle = '#c9d3e3'; g.fillRect(0, GY, W, H - GY);
      // the brand: logo (if one is loaded) pulsing on every beat
      if (ctx.logo) { const s = 1 + m.pulse(t) * 0.06; g.save(); g.translate(W / 2, 88); g.scale(s, s); drawLogo(g, 0, 0, 220); g.restore(); }
      // hero drops in and lands ON the beat, then dances on every beat
      const u = clamp((t - (firstBeat - 0.3)) / 0.3);
      const y = GY - (1 - easeIn(u)) * 400;
      const land = t >= firstBeat ? decay(t - firstBeat, 10) : 0;
      if (t >= firstBeat && t < firstBeat + 0.35) { const q = prog(t, firstBeat, firstBeat + 0.35); for (let i = 0; i < 8; i++) { circle(g, W / 2 + (i - 3.5) * 18 * (0.6 + q), GY - q * 12, 9 * (1 - q)); g.fillStyle = 'rgba(255,255,255,0.9)'; g.fill(); } }
      drawBuddy(g, { x: W / 2, y, s: 1.2, skin: SKINS.pip, ...(t < firstBeat ? pose('jump') : land > 0.3 ? pose('land', 0, land) : pose('cheer', m.phase(t))), face: t < firstBeat ? 'surprise' : 'joy', t, blink: blinkAt(t) });
      if (t >= firstBeat) confetti(g, t, firstBeat, { n: 60, from: { x: W / 2, y: GY - 120 }, spread: 3, life: 1 });
    },
  };
}
