# T-POT 2D Music Video

A 2D, beat-synced cartoon music video for the T-POT song. It is drawn on an HTML canvas,
where every frame is a pure function of time, and rendered frame by frame to video.

**Output:** `output/tpot_2d.mp4` (854×480, 30 fps, low-res H.264 + AAC, 49.9 s).

## Storyboard (each cut lands on a real beat)
| Time | Lyric | Scene |
|---|---|---|
| 0.0 | T-POT, T-POT, TURN IT ON | Dark showroom. Three unlit neon T-POT signs in the logo's letterforms: #1 slides right, #2 slides left, a bigger 3rd pops in the middle. A pull cord drops, a realistic arm reaches in from the edge, the fingers close round the bead, and it yanks the cord on "ON": CLICK. The signs flicker on green, then switch colour on every 8th note |
| 4.9 | LOWEST PRICES COME AND BE GONE | A TV drops in and a price tag reads RM6,000. A marker slashes it on "COME", it peels off on "AND", RM3,000 stamps on "BE", and a SAVE 50% burst lands on "GONE" |
| 8.0 | WALKING DOWN THE STREET, SAW A NEON LIGHT | 2D parallax night city. Pip hops across the lyric words (solid 3D letters used as platforms), landing on the beat grid, then flies into the T-POT store as the camera zooms through the doors |
| 12.6 | SAID TV'S AND WASHERS, PRICE JUST RIGHT | A TV drops on "TV'S", a washer on "WASHERS", each with a cheap price. Camera punches into Pip's shocked face, getting more extreme each word |
| 17.2 | I STEPPED INSIDE, COULDN'T BELIEVE MY EYES | Sliding doors, steps on the beat. Zoom into the face; the eyes go cosmic (rainbow rings, star pupils, sparkle bursts per beat); then a dive into the eye |
| 21.8 | T-POT'S DEALS TOOK ME BY SURPRISE | New character, Mimi. The DEALS board lights up word by word and discount tags rain in. Surprised on "SURPRISE"; on the drop, hands up, joy, confetti cannons |
| 25.4 | T-POT, WHERE THE SAVINGS NEVER STOP | Crowd party: three rows wave on every beat (the wave rolls back row by row), bounce on kicks, jump on "NEVER STOP". Coins rain; the logo glows on stage |
| 30.6 | TV'S FLASHING, WASHERS GOING NON-STOP | Pip POOFs into a TV that strobes on 16ths. One continuous move: zoom into its screen (which shows the washer), ease into the drum, cross-fade inside at the same rotation, and spin up smoothly (spin blur) to white |
| 34.7 | LOW PRICES, OH YEAH, THAT'S THE PLOT | Electronics price board: prices drop on 8th notes (slot-machine roll, old digits tumble off). Each product drops twice, ending at one third of its price: TV RM3,999 → RM1,333, washer RM2,697 → RM899, fridge RM2,997 → RM999, rice cooker RM597 → RM199, aircon RM2,397 → RM799, microwave RM897 → RM299 |
| 38.8 | YOU WANT THE BEST DEAL, HEAD TO T-POT | Long road between buildings, with the T-POT store at the end of the road from the first frame. We accelerate until the screen smears, stop dead in front of the store on "TO", and its doors blaze on "T-POT" |
| 42.9 | (instrumental) | Bright white/red/green appliance showroom. The real logo letters grow legs and race, leap into place on the downbeat, the swoosh sweeps in and the leaf pops. A different electrical product drops onto the floor on every beat (evenly spaced slots), with confetti bursts on every beat. It stops on the logo |

## Characters and brand
- **Characters:** cute animals with fur shading, muzzles, inner ears, paw pads, tails and T-POT shirts.
  Pip is a shiba puppy and Mimi is a grey tabby cat; the crowd mixes dogs, cats, bunnies, bears,
  pandas and foxes.
- **Brand word:** "T-POT" is always drawn with the logo's own letterforms (`drawLogoWord`), in
  captions, signs, screens and labels. `popText` swaps it in automatically.

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
