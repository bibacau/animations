# T-POT 2D Music Video

A 2D, beat-synced cartoon music video for the T-POT song. It is drawn on an HTML canvas,
where every frame is a pure function of time, and rendered frame by frame to video.

**Output:** `output/tpot_2d.mp4` (854×480, 30 fps, low-res H.264 + AAC, 49.9 s).

## Storyboard (each cut lands on a real beat)
| Time | Lyric | Scene |
|---|---|---|
| 0.0 | T-POT, T-POT, TURN IT ON | Dark room. T-POT #1 slides right, #2 slides left, a 3rd pops in the middle, all grey. A pull cord drops; a hand yanks it on "ON": CLICK. They turn green, then switch colour on every 8th note |
| 4.9 | LOWEST PRICES COME AND BE GONE | A TV drops in and a price tag reads RM6,000. A marker slashes it on "COME", it peels off on "AND", RM3,000 stamps on "BE", and a SAVE 50% burst lands on "GONE" |
| 8.0 | WALKING DOWN THE STREET, SAW A NEON LIGHT | 2D parallax night city. Pip hops across the lyric words (solid 3D letters used as platforms), landing on the beat grid, then flies into the T-POT store as the camera zooms through the doors |
| 12.6 | SAID TV'S AND WASHERS, PRICE JUST RIGHT | A TV drops on "TV'S", a washer on "WASHERS", each with a cheap price. Camera punches into Pip's shocked face, getting more extreme each word |
| 17.2 | I STEPPED INSIDE, COULDN'T BELIEVE MY EYES | Sliding doors, steps on the beat. Zoom into the face; the eyes go cosmic (rainbow rings, star pupils, sparkle bursts per beat); then a dive into the eye |
| 21.8 | T-POT'S DEALS TOOK ME BY SURPRISE | New character, Mimi. The DEALS board lights up word by word and discount tags rain in. Surprised on "SURPRISE"; on the drop, hands up, joy, confetti cannons |
| 25.4 | T-POT, WHERE THE SAVINGS NEVER STOP | Crowd party: three rows wave on every beat (the wave rolls back row by row), bounce on kicks, jump on "NEVER STOP". Coins rain; the logo glows on stage |
| 30.6 | TV'S FLASHING, WASHERS GOING NON-STOP | Pip POOFs into a TV that strobes on 16ths. One continuous move: zoom into its screen (which shows the washer), ease into the drum, cross-fade inside at the same rotation, and spin up smoothly (spin blur) to white |
| 34.7 | LOW PRICES, OH YEAH, THAT'S THE PLOT | Electronics price board: on every beat a price rolls like a slot machine, lands lower, and the old digits tumble off |
| 38.8 | YOU WANT THE BEST DEAL, HEAD TO T-POT | Long road between buildings, with the T-POT store at the end of the road from the first frame. We accelerate until the screen smears, stop dead in front of the store on "TO", and its doors blaze on "T-POT" |
| 42.9 | (instrumental) | The real logo letters grow legs and race, leap into place on the downbeat, the swoosh sweeps in and the leaf pops. Products slam, fireworks go off on beats, and it stops on the logo |

## Set dressing
Backgrounds are dressed with on-theme items (hanging bulbs, framed product posters, wallpaper,
full-width product shelves, pendant lamps, neon wall bars, speaker stacks, a dancing crowd),
all placed on an even grid across the full width (`world.js`, "even set dressing"). There is
no cluster in the middle and no tiny clutter. Most items bounce or glow on the beat.

## How it is built
- `data/timeline.json`: audio analysis of the song (beat grid at 117 BPM with strong/weak
  levels, kicks, word-level lyric timing). `analysis/` rebuilds it.
- `assets/logo/`: the supplied logo traced to vectors (`tools/trace_logo.py`), split into parts
  (`tools/logo_parts.py`) so the letters can move independently.
- `video/js/`: `core.js` (beat clock, easing, drawing helpers), `characters.js` (Pip, Mimi, the
  crowd, the TV-head body, expressions), `products.js`, `world.js` (city, store, decorations),
  `lyrics.js` (karaoke captions), `logo.js`, and `scenes/` (one file per storyboard scene).
- **Beat sync:** scenes read the beat clock (`music.pulse`, `kick`, `since`, `after`). Drops,
  landings, stamps, slams and cuts are placed on beats or 8th notes. Heavy scenes shake and
  zoom-punch on every drum hit.
- **Lyrics:** every sung word is shown, either built into the scene (T-POT words, the cord
  caption, the street platforms, the DEALS board) or as a karaoke caption that pops in exactly
  when the word is sung. `npm run audit` checks that every word is on screen within 0.1 s of
  its onset for at least 0.5 s. All 65 words pass.

## Usage
```bash
node render/serve.js 8080              # live preview: http://127.0.0.1:8080/?preview=1 (click to play)
node render/render.js                  # render output/tpot_2d.mp4 (~30 s)
node render/render.js --stills 3.5,24.4
node render/render.js --audit 1
```
Needs Node and Playwright with Chromium, plus ffmpeg.
