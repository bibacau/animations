---
name: animated-video-maker
description: Make animated videos from scratch as code, frame-perfect and synced to audio. Covers music videos, lyric videos, beat-synced edits, product promos and ads, brand/logo reveals, explainers, and social clips (16:9, 9:16 or 1:1, any resolution). It handles audio and beat analysis, word-level lyric timing, storyboarding, characters, scenes, transitions, rendering to MP4 and a watch page. Use this skill whenever the user wants a video, animation, motion graphic, music video, lyric video, commercial, intro/outro or logo animation made or changed, even if they don't say "skill" or "animation engine". This includes "make the lyrics hit the beat", "add a scene where...", "make it 2D/3D", "redo the video" or "change the ending".
---

# Animated Video Maker

Build videos as deterministic code: every frame is a pure function of time `t`, drawn on an
HTML canvas (2D by default; Three.js when the user wants 3D). Headless Chromium renders each
frame and ffmpeg muxes it with the audio. The result is frame-accurate sync, unlimited
revisions, and the ability to inspect any moment as a still before rendering.

The rules here were learned the hard way from a demanding client. Most "it looks wrong"
feedback came from a handful of recurring causes:
- something off the beat
- a word that wasn't readable
- an empty or unevenly decorated frame
- a cheap-looking character or hand
- an object that popped from nowhere
- a jumpy transition
- wrong numbers or spelling

The checklists below exist to catch those before the user does.

## What's bundled

| Path | Use |
|---|---|
| `scripts/transcribe.py` | Word-level ASR timestamps (faster-whisper) |
| `scripts/analyze_audio.py` | Audio → `timeline.json`: beats with strength levels, downbeats, kicks/snares/hats, energy, sections, drop, refined word timings |
| `scripts/trace_logo.py`, `scripts/logo_parts.py` | Raster logo → sharp vector colour layers → separately animatable parts |
| `scripts/serve.js`, `scripts/render.js` | Preview server; renderer (`--stills`, `--audit`, full MP4) |
| `scripts/contact_sheet.py` | Tile stills (or frames grabbed from an MP4) into one image for review |
| `assets/starter/` | A working project: beat clock, captions, logo lettering, cute animal characters, a realistic hand/arm, props, evenly spaced decor helpers, a director with an example scene |
| `references/craft-rules.md` | **The rulebook.** Sync, lyrics, brand, composition, characters, transitions, realism, accuracy, endings. Read before storyboarding and again before delivering. |
| `references/audio-and-timing.md` | How the analysis works, model download fallbacks, lyric alignment, choosing cuts, timing patterns |
| `references/engine.md` | Starter project layout, module APIs, adding scenes, 3D variant, performance, QA commands |

## Workflow

### 1. Pin down the brief (ask only what you can't infer)
Collect these, and repeat them back in one short list before building:
- **Format:** aspect ratio (16:9 / 9:16 / 1:1), resolution and quality. "Low quality" means 854×480 at CRF 26–28. Also 2D or 3D, and the length.
- **Content:** the audio file, the lyrics or script, the language. Use the actual words sung or spoken; never translate or invent lyrics.
- **Brand:** exact spelling and capitalisation (e.g. "T-POT", never "TPOT" or "Teapot"), the logo file and the colours. If the user writes the brand name loosely ("teapot"), treat it as the brand.
- **Storyboard wishes:** per line or section, what should happen. Write them into a storyboard table (time · words · what happens · what lands on which beat) and keep it in the README.
- **Delivery:** where the result goes. Use its own git branch if the user wants old versions kept untouched, and a watch page if they want to share it.

### 2. Analyse the audio
```bash
python scripts/transcribe.py song.mp3 <whisper-model-dir> words_raw.json      # needs a model; see audio-and-timing.md
# write lyrics.txt (one phrase per line, corrected spelling, brand spelled exactly)
python scripts/analyze_audio.py --audio song.mp3 --words words_raw.json --lyrics lyrics.txt --out data/timeline.json
```
- **Check the lyrics:** compare the ASR words with what is actually sung, and flag doubtful words to the user rather than guessing silently.
- **Mismatches:** if the user remembers lines the audio doesn't contain, check the vocal envelope and tell them what's really there (e.g. "T-POT is sung twice, not three times").

### 3. Start the project from the starter
Copy `assets/starter/` into the project, then add:
- `data/timeline.json`
- the audio file
- fonts in `assets/fonts/` (e.g. from `@fontsource`; the starter expects `bowlby.woff2` and `anton.woff2`)
- the traced logo: `trace_logo.py` → `logo_parts.py` → `assets/logo_parts.json`

Then set `video.config.json` (`brandWord`, paths). See `references/engine.md`.

### 4. Build scene by scene
- **One file per scene:** each in `js/scenes/`, listed in `js/scenes/index.js`.
- **Cut on beats:** put every scene start on a real beat (`{ beat: n }`), at a strong beat or downbeat between phrases.
- **Draw the timing from the clock:** choreograph each scene from `music` (beat clock) and word onsets, never from guessed times. Things that "hit" (landings, stamps, slams, drops, colour switches) land ON beats or 8th notes.
- **Look after each scene:** render stills across it and build a contact sheet:
  ```bash
  node scripts/render.js --project . --stills 12.6,13.2,13.9,14.5,15.2
  python scripts/contact_sheet.py sheet.jpg output/stills 12.6,13.2,13.9,14.5,15.2
  ```
  Look at the sheet with the rulebook in mind: empty areas, uneven decoration, unreadable or covered text, things clipped at the frame edge, cheap-looking details. Fix, then re-check.

### 5. Verify before delivering
```bash
node scripts/render.js --project . --audit 1            # every sung word visible ≥ 0.5 s, within 0.1 s of its onset
node scripts/render.js --project . --audio song.mp3 --out output/video.mp4 [--w 1920 --h 1080] [--crf 26]
python scripts/contact_sheet.py check.jpg --video output/video.mp4 1.5,4.9,8.0,...   # spot-check the real file at every cut
```
- **Audit:** all words must pass. It runs `window.audit()` in the page.
- **Video size:** keep the committed master under ~50 MB. Re-encode with a higher CRF if needed, and make a smaller web copy for pages.

### 6. Deliver
- **Commit and push:** commit to the agreed branch and push.
- **Watch page:** if useful, publish a page with the video and a clickable scene list. Publishing to an existing page replaces it; use a new file path or URL for a separate page.
- **Report:** what changed per request, in the user's words, with concrete numbers (prices, timings).
- **Say what you couldn't check:** you checked with stills and the audit, not by listening. Ask for timestamps if anything feels off.

## The rules that matter most (full list in `references/craft-rules.md`)

1. **The beat drives everything.** Every cut and every significant change lands on a beat. Every beat has *something* happening: a hop, pulse, shake, flash or swing. Big moments (drop, last line) get the biggest hits. Nothing important is off-beat unless lots is happening at once.
2. **Every lyric is readable.** A word appears exactly when sung (its pop-in centred on the onset, never before), stays ≥ 0.5 s, and is never covered, clipped or placed awkwardly. Either build words into the scene or use a clean caption.
3. **No empty or uneven frames.** Fill the whole frame with on-theme detail, spread evenly on a grid across the full width. No centre cluster, no bare side, no pile of tiny messy items, no repeated identical objects. Backgrounds and colours must suit the subject (an appliance store isn't random purple).
4. **Characters and hands look crafted.** Use detailed, appealing characters (animals with fur shading, faces, paws, clothes), not bare geometric blobs. Hands have a palm, fingers, a thumb and a sleeve, and come from somewhere (the frame edge). Every action reads instantly.
5. **Nothing pops from nowhere.** Objects come from something already on screen (duplicate the sign and fly it), and destinations exist before you arrive (the store is at the end of the road from frame one). Transitions are continuous, eased camera moves with matched framing.
6. **Exactness.** Brand spelling and case, prices and arithmetic ("divide by 3" means final = original / 3), and the number of steps the user asked for ("one change" means one change, not two).
7. **Brand lettering.** A standalone brand word (sign, label) uses the logo's letterforms. Inside a sentence it uses the same font as the surrounding words, so sizes match.
8. **Endings.** Stop on the logo or final image the user wants. Don't add a white card, fade or extra beat they didn't ask for.

## When the user gives feedback
- **Keep revising the same project:** re-render only what changed, keep the same branch and page URL, and keep the storyboard table current.
- **Generalise the fix:** if they say "the decorations are uneven here", check every scene for the same problem; they will notice the next one.
- **Report each item:** what changed and how you verified it. Never claim a check you didn't run.
