# T-POT Lyric World

A beat-synced music-video generator for the T-POT jingle. The lyrics are 3D objects
inside the scene, not subtitles. They become platforms, stairs, slides, dominoes,
elevator floors, tunnel walls and washing-machine spin cycles. Tiny performers and
CGI T-POT appliances interact with them, and every jump, landing, crash, camera move
and cut is placed on a timestamp taken from the audio analysis.

Output: `output/tpot_lyric_world.mp4` (1080×1920, 30 fps, H.264 + AAC, ~50 s).

## Pipeline

```
assets/audio/tpot_song.mp3
   │  analysis/transcribe.py   (faster-whisper, word timestamps)  -> data/words_raw.json
   │  data/lyrics.txt          (lyric sheet, aligned 1:1 to the ASR words)
   │  analysis/analyze.py      (librosa)                           -> data/timeline.json
   ▼
engine/  (Three.js, deterministic: every frame is a pure function of time t)
   director.js   cuts the song into units on real beats and assigns interaction templates
   scenes/*.js   reusable interaction templates
   ▼
render/render.js  headless Chromium renders frame t = n/fps, pipes it to ffmpeg, muxes the song
```

### Music analysis (`data/timeline.json`)
- **BPM and beat grid**: the tempo estimate is refined by a grid search over period and
  phase against kick/snare/onset energy. Each beat is then re-aligned to the nearest real
  onset (±35 ms), so drift and push/pull are kept. Result: 116.99 BPM.
- **Beat hierarchy**: level 0 is a small beat, 1 a medium beat (backbeat or hard kick),
  2 a strong beat (downbeat), 3 a major moment (the drop at 24.41 s).
- **Hits**: separate kick (30–150 Hz), snare (1.5–5 kHz) and hi-hat (7–16 kHz) onset lists.
- **Energy and sections**: RMS energy curve; intro, verse, chorus and outro; the drop is the
  largest bar-to-bar energy jump; the build-up is the two bars before it; vocal pauses are detected.
- **Words**: each word has start, end, duration, nearest beat, offset from that beat and
  intensity. Onsets come from Whisper and are pushed later when Whisper has absorbed a
  gap, then snapped to the vocal-band onset, so words never appear before the singer.

### Sync rules used by the engine
| Musical event | Visual response |
|---|---|
| kick | FOV punch, chromatic push, landings, jolts |
| snare | camera roll flick |
| hi-hat | glitch slices, neon flicker, strobe |
| downbeat | scene cuts, tunnel twists, product slams |
| drop | elevator smashes through the last lyric, white flash, invert, products explode, world flips |
| vocal onset | the word's entrance starts at exactly that time |
| build-up | the elevator moves in 8th-note jolts that keep getting bigger, and the camera FOV tightens |
| pause / "STOP" | the tunnel halts and everything freezes |
| ending | letters race in, reassemble into the logo, and the final downbeat punch freezes the frame |

### Director
For each lyric phrase, the director picks a cut point on the strongest beat between
phrases. It then scores every template on keyword affinity, energy fit, hard requirements
(the drop and the outro) and novelty. Novelty means no template is reused, characters
can't appear in long streaks and products aren't used in back-to-back scenes. Entrances
and exits are chosen from a parametric system (13 entrance types × direction × axis ×
stagger order × timing × amplitude), and two consecutive lyrics never get the same
entrance. Change `?seed=` to get a different mix.

### Templates (`engine/scenes/`)
`tvPortal` (words burst out of a TV) · `gravity` (prices drop from the sky onto the beat and stack, then collapse) ·
`platforms` (a runner lands on one word per beat; one-letter words act as trampolines) · `productSlam` (TV, washer and fridge
crush the words that name them; the last word launches out of a rice cooker) · `staircase` (climb one step per beat;
the fridge door bursts open and the stairs collapse) · `elevator` (build-up ride, then the drop smashes through the lyric) ·
`tunnel` (endless typography tunnel; walls flip to the sung word; a character rides a letter past; "STOP" freezes it) ·
`washer` (words get sucked into the drum, wrap around the door, then get spat back out) · `domino` (words topple on 8th notes;
the last one lands on the downbeat) · `slide` (the ramp builds in front of a sliding rider, who lands on the final word) ·
`finale` (letter race, logo reassembly, final impact) · `kinetic` (pure typography, also the fallback).

## Usage
```bash
npm install
pip install librosa faster-whisper
python analysis/analyze.py            # rebuild data/timeline.json (transcribe.py first if the song changes)
node render/serve.js 8080             # live preview: http://127.0.0.1:8080/?preview=1  (click to play)
node render/render.js --blur 2        # full render with 2-sub-frame motion blur
node render/render.js --stills 12.5,24.41   # look-dev stills -> output/stills/
```

### Lyrics
The lyrics are the actual English vocal, transcribed word by word with Whisper. They are
kept in `data/lyrics.txt`, and the brand is always written **T-POT**. One homophone was
resolved by meaning: "T-POT, **where** the savings never stop" (the ASR heard "we're").
