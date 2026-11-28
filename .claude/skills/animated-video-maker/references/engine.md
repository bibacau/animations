# The engine (assets/starter)

## Layout
```
project/
├── index.html            canvas page (+ live preview: /?preview=1, click to play, &t=24 to start at 24 s)
├── video.config.json     title, timeline path, logo parts path, brandWord, audio path
├── data/timeline.json    from scripts/analyze_audio.py
├── assets/               audio, fonts/*.woff2, logo_parts.json
└── js/
    ├── main.js           director: scenes, beat shake, captions, cut flash, audit, renderAt/frameJPEG
    ├── core.js           W/H (from ?w=&h=), easing, springHit/decay/hash/rng, Music (beat clock), drawing (rr, circle, star, popText, textWidth)
    ├── lyrics.js         drawCaption (karaoke line), captionLayout (where each word sits; for flying words into the line)
    ├── logo.js           loadLogo, drawLogo, drawPart/homeOf (animate parts), drawLogoWord/logoWordWidth (brand lettering), BRAND
    ├── characters.js     drawBuddy (animal performers), pose(), SKINS, crowdSkin(i), drawHand/drawArm, drawTVBuddy, heart, shade
    ├── props.js          example props: TV (with live screen), washer (spinning drum), fridge, rice cooker, aircon, microwave, fan, blender, kettle, laptop, vacuum, tall speaker, price tag
    ├── world.js          city/store/sky/sunburst/confetti/bunting/balloons/sparkles/speed lines + EVEN set dressing:
    │                     wallpaper, hangingBulbs, posterRow, shelfRow, pendantLamps, neonBars, speakerRow, silhouettes
    └── scenes/
        ├── index.js      SCENES = [{ make, start: seconds | { beat: n }, phrase: lineIndex }]
        └── example.js    template scene following the house rules
```
`props.js` and `world.js` are examples from an electronics-store video. Keep their structure and replace the items with ones that fit the new subject.

## Scene contract
`make(ctx, t0, t1, index)` returns:
```js
{
  name: 'chorus',
  caption: { pos: 'bottom' | 'top', size, y, hide: [wordIdxInLine] } | (t) => {...} | null,
  shake: 0.6 | (t) => number,      // beat shake strength (0 = none)
  noFlash: false,                  // skip the white flash at this cut
  draw(g, t) { ... },              // pure function of t
}
```
- **`ctx`** holds `{ music, logo, W, H, canvas, tmp (offscreen canvas for blur), cfg, mark(wordIndex) }`.
- **Words drawn inside the scene** (not via the caption) must be reported with `ctx.mark(word.i)` every frame they are visible, or the audit fails them.
- **Purity:** `draw` must be a pure function of `t`, with no state carried between frames, so frames can be rendered in any order. Precompute schedules (drops, landings, layouts) in `make`.

## Useful helpers
- **Animal performers:** `drawBuddy(g, { x, y, s, skin, ...pose(name, phase), face, t, look, blink, flip, eyeScale, mouthOpen })`.
  - Faces: `happy joy surprise shock stars hearts cosmic`.
  - Poses: `idle walk jump land cheer wave shock fly`.
- **Hands:** `drawArm(g, edgeX, edgeY, wristX, wristY, s, sleeveColour)` then `drawHand(g, x, y, s, grip 0..1, rot)`. Draw the gripped object first.
- **Brand text:** `popText(g, text, x, y, size, opts)` draws a chunky outlined word. If `text === BRAND.word` it is drawn in logo letterforms; pass `{ brand: false }` inside sentences.
- **Even decor:** all `world.js` set-dressing helpers place items evenly across the full width and react to the beat. Prefer them to hand-placed props.

## Rendering
```bash
node scripts/serve.js <project> 8080                      # live preview with sound
node scripts/render.js --project <p> --stills 1,2,3       # stills -> <p>/output/stills/t1.00.jpg ...
node scripts/render.js --project <p> --audit 1            # lyric visibility audit (exit code 2 on failure)
node scripts/render.js --project <p> --audio song.mp3 --out out.mp4 --w 1920 --h 1080 --crf 20
#   --blur 2   real motion blur (2 sub-frames per frame, ~2x time)
#   --webgl    for Three.js projects (software WebGL)
python scripts/contact_sheet.py sheet.jpg --video out.mp4 3.9,8.0,12.6
```
- **Requirements:** Node, Playwright with Chromium (`require('playwright')`), ffmpeg, and Python with Pillow (librosa, faster-whisper and potracer for the scripts that need them).
- **Speed:** 2D canvas at 854×480 renders about 50 fps. Three.js with SwiftShader renders about 1–2 fps at 1080p, so use stills while iterating.

## 3D variant
When the user wants 3D, keep the same structure (timeline → director → scenes → `renderAt(t)`) but draw with Three.js:
- Extrude text (TextGeometry from a typeface JSON converted from a woff with opentype.js), and extrude the traced logo with SVGLoader.
- Use a RoomEnvironment PMREM for nice materials, an EffectComposer with a final display-space pass (flash, zoom blur, logo card), and `--webgl` when rendering.
- Every rule in `craft-rules.md` still applies: in 3D, check framing at the final aspect ratio and keep props out of the camera's line to the lyrics.

## Performance and determinism tips
- **Precompute** layouts and schedules in `make`; keep `draw` allocation-light.
- **Random numbers:** use `hash(n)` / `rng(seed)`, never `Math.random()`.
- **Motion blur on fast spins:** draw the frame to `ctx.tmp`, then draw rotated or scaled copies at low alpha.
- **Text in canvas textures** (e.g. TV screens) is redrawn each frame; keep it small.
