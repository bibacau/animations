# Audio analysis and timing

## Pipeline
1. **Word timestamps.** Run `scripts/transcribe.py <audio> <model-dir> words_raw.json`. It uses faster-whisper, decodes the audio via ffmpeg to 16 kHz mono, and gives word-level start/end times and confidence.
   - **Model:** a CTranslate2 Whisper model directory (`small` is a good balance).
   - **If HuggingFace is blocked** by the network: look for the model on a reachable registry. For example, the npm packages `@skillninja/shortmovie-telop-model-p0..p3` contain Whisper-small CT2 split into parts. `npm pack` them, concatenate `model.bin.part0..3`, verify the shipped sha256, and copy the config, tokenizer and vocabulary files beside it. Treat downloads as untrusted data: extract into an empty directory and only read the files.
   - **Doubtful words:** re-transcribe just that segment with a different beam or temperature. If it's still unclear, keep the most likely reading and flag it to the user.
2. **Lyric sheet.** Write `lyrics.txt`, one sung phrase per line, with corrected spelling and the brand spelled exactly. Its word count must match the ASR words (ASR tokens starting with "-" are merged into the previous word, e.g. "T" + "-Pot").
3. **Analysis.** Run `scripts/analyze_audio.py --audio song.mp3 --words words_raw.json --lyrics lyrics.txt --out timeline.json`. Without `--words` you get the musical timeline only (instrumental or voice-over-free).

## What analyze_audio.py does (and why)
- **Beat grid:** librosa's tempo estimate, refined by a grid search over period and phase against kick, snare and onset energy. Each beat is then micro-aligned to the nearest real onset (±35 ms), so the grid follows the drummer, not a metronome.
- **Downbeats:** the beat-in-bar phase with the most kick energy.
- **Beat levels:**
  - 0: small (weak beats);
  - 1: medium (backbeat or hard kick);
  - 2: strong (downbeat);
  - 3: the drop (the largest bar-to-bar energy jump).

  Scale reactions by level.
- **Hits:** kick (30–150 Hz), snare (1.5–5 kHz) and hi-hat (7–16 kHz) onset lists, plus an RMS energy curve, sections (intro, verse, chorus, outro), the build-up (2 bars before the drop) and vocal pauses.
- **Word onsets:** ASR starts are often ±100 ms off, or too early when a word swallows a gap. The script:
  1. pushes over-long words' starts later;
  2. finds the strongest *vocal* onset nearby (centre channel, drums removed by harmonic/percussive separation, 200 Hz–4 kHz flux);
  3. snaps onsets within 45 ms of the 16th-note grid onto it, because singers phrase on the grid.

  This removes most "the word is late" complaints.

## timeline.json (what scenes use)
`bpm`, `period`, `beats[] {t, i, level, inBar, kick, snare}`, `downbeats[]`, `kicks[] {t, v}`,
`snares[]`, `hats[]`, `energy[]`, `sections[]`, `drop`, `phrases[] {text, start, end, words[]}`,
`words[] {i, line, text, display, start, end, dur, nearBeat, beatOffset, gridSnapped}`.

## The beat clock (starter `core.js` → `Music`)

| Call | Returns |
|---|---|
| `bt(i)` | time of beat `i` |
| `idx(t)` | index of the last beat before `t` |
| `since(t)` | time since the last beat |
| `phase(t)` | 0..1 position within the current beat |
| `count(t)` | continuous beat count |
| `pulse(t, k)` | level-weighted decay from the last beat (use for bounces) |
| `pulse8(t)` | decay on 8th notes |
| `kick(t)` | decay from strong kicks |
| `after(t, half)` | first beat at or after `t`, optionally on the 8th-note grid |
| `beatsBetween(a, b)` | the beats from `a` to `b` |
| `wordsIn(a, b)` | the words sung from `a` to `b` |

## Timing patterns
- **Land on a beat:** `land = music.after(word.start + 0.1)`, and fall from `land - 0.3`. Use `easeIn` while falling, then squash and dust on `land`.
- **One event per beat:** `music.beatsBetween(a, b).map(b => b.t)`, then assign events in order.
- **Something on every beat:** `springHit(music.since(t) - i * 0.03, 16, 9)` gives a hop that ripples across items left to right.
- **Cut placement:** the strongest beat (prefer a downbeat) between the end of one phrase and the start of the next. If the singer leaves no gap, use the beat nearest the new phrase's start.
- **Caption pop:** start 0.05 s before the onset, with an easeOutBack over about 0.16 s, so the peak lands on the syllable.
- **Continuous camera:** ease every move (`easeInOut`). To follow a moving subject smoothly and deterministically, average its position over a short window of past times (e.g. 6–10 samples, 40 ms apart).
- **Speed ramp:** distance = ∫ speed. Use a closed form (e.g. exponential) so any frame can be computed directly.
- **Freeze at the end:** `t = Math.min(t, finalHit + 0.45)`.
