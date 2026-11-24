"""Music analysis -> data/timeline.json

Produces a precise, timestamped timeline that drives every visual event:
  * BPM + a phase-locked beat grid (refined per beat against real onsets)
  * beat hierarchy: level 0 small / 1 medium / 2 strong / 3 major
  * downbeats (bar starts), kick / snare / hi-hat hits from band-split onsets
  * RMS energy curve, sections (intro / verse / chorus / outro), build-ups, drop
  * word-level lyric timing (ASR timing aligned to the lyric sheet, onsets
    refined against the vocal-band onset envelope, never earlier than the singer)

Usage:  python analysis/analyze.py
"""
import json
import os
import re
import subprocess

import numpy as np
import librosa

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO = os.path.join(ROOT, "assets/audio/tpot_song.mp3")
SR = 44100
HOP = 256


def load(path):
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", path, "-ac", "2", "-ar", str(SR),
                          "-f", "f32le", "-"], check=True, capture_output=True).stdout
    st = np.frombuffer(raw, dtype=np.float32).reshape(-1, 2)
    return st.mean(1), st


def band_flux(S, freqs, lo, hi):
    e = np.log1p(S[(freqs >= lo) & (freqs < hi)].sum(0))
    d = np.maximum(0, np.diff(e, prepend=e[0]))
    return d / (np.percentile(d, 99.5) + 1e-9)


def peaks(env, times, delta, wait):
    idx = librosa.util.peak_pick(env, pre_max=6, post_max=6, pre_avg=16, post_avg=16,
                                 delta=delta, wait=wait)
    return [{"t": round(float(times[i]), 3), "v": round(float(min(env[i], 1.5)), 3)} for i in idx]


def main():
    y, stereo = load(AUDIO)
    dur = len(y) / SR
    S = np.abs(librosa.stft(y, n_fft=2048, hop_length=HOP))
    freqs = librosa.fft_frequencies(sr=SR, n_fft=2048)
    times = librosa.frames_to_time(np.arange(S.shape[1]), sr=SR, hop_length=HOP)

    kick = band_flux(S, freqs, 30, 150)
    snare = band_flux(S, freqs, 1500, 5000)
    hat = band_flux(S, freqs, 7000, 16000)
    full = librosa.onset.onset_strength(S=librosa.amplitude_to_db(S), sr=SR, hop_length=HOP)
    full = full / (np.percentile(full, 99.5) + 1e-9)

    # vocal onset envelope: centre (mid) channel -> harmonic/percussive separation removes
    # the drums -> spectral flux in the vocal band of the harmonic part only
    mid = stereo.mean(1)
    Sm = librosa.stft(mid, n_fft=2048, hop_length=HOP)
    Hm, _ = librosa.decompose.hpss(Sm, margin=(1.0, 3.0))
    Hm = np.abs(Hm)
    vocal = band_flux(Hm, freqs, 200, 4000)
    vocal = np.convolve(vocal, [0.25, 0.5, 0.25], mode="same")

    # ---- tempo + phase-locked grid -------------------------------------------------
    tempo, _ = librosa.beat.beat_track(y=y, sr=SR, hop_length=HOP, tightness=200)
    bpm = float(np.atleast_1d(tempo)[0])
    period = 60.0 / bpm
    drive = kick * 1.0 + snare * 0.6 + full * 0.4

    def env_at(env, t, win=0.03):
        m = (times >= t - win) & (times <= t + win)
        return float(env[m].max()) if m.any() else 0.0

    # refine period + phase by grid search
    best = None
    for p in np.linspace(period * 0.99, period * 1.01, 41):
        for ph in np.linspace(0, p, 64, endpoint=False):
            g = np.arange(ph, dur, p)
            sc = sum(env_at(drive, t, 0.02) for t in g)
            if best is None or sc > best[0]:
                best = (sc, p, ph)
    _, period, phase = best
    bpm = 60.0 / period
    grid = np.arange(phase, dur - 0.05, period)

    # per-beat micro alignment to actual onset (handles slight drift), max 35 ms
    beats = []
    for t in grid:
        m = (times >= t - 0.035) & (times <= t + 0.035)
        tt = float(times[m][np.argmax(drive[m])]) if m.any() and drive[m].max() > 0.25 else float(t)
        beats.append(tt)

    # downbeat phase: which beat-in-bar carries most kick
    k_at = np.array([env_at(kick, t) for t in beats])
    s_at = np.array([env_at(snare, t) for t in beats])
    bar_off = int(np.argmax([k_at[o::4].sum() for o in range(4)]))

    # ---- energy + sections ---------------------------------------------------------
    rms = librosa.feature.rms(y=y, hop_length=HOP)[0]
    rms_s = np.convolve(rms, np.ones(80) / 80, mode="same")
    energy = rms_s / rms_s.max()
    energy_curve = [{"t": round(float(t), 2), "e": round(float(e), 3)}
                    for t, e in zip(times[::20], energy[::20])]

    def e_mean(a, b):
        m = (times >= a) & (times < b)
        return float(energy[m].mean())

    # find the drop: largest positive energy jump between consecutive 2-bar windows
    bar = period * 4
    best_drop, drop_t = 0, None
    for i, t in enumerate(beats):
        if (i - bar_off) % 4 or t < 6 or t > dur - 8:
            continue
        jump = e_mean(t, t + bar) - e_mean(t - bar, t)
        if jump > best_drop:
            best_drop, drop_t = jump, t

    # ---- beat hierarchy ------------------------------------------------------------
    section_marks = [drop_t]
    out_beats = []
    for i, t in enumerate(beats):
        in_bar = (i - bar_off) % 4
        strength = 0.55 * env_at(kick, t) + 0.35 * env_at(snare, t) + 0.25 * energy[np.searchsorted(times, t) - 1]
        e_here = float(energy[min(len(energy) - 1, np.searchsorted(times, t))])
        level = 1 if in_bar == 2 else 0                       # backbeat = medium
        if env_at(kick, t) > 0.85 and e_here > 0.5: level = max(level, 1)
        if in_bar == 0: level = 2 if e_here > 0.3 else 1        # downbeat = strong
        if in_bar == 0 and ((i - bar_off) // 4) % 2 == 0 and e_here > 0.55: level = 2
        if any(abs(t - x) < 0.05 for x in section_marks): level = 3   # major moments
        out_beats.append({"t": round(t, 3), "i": i, "bar": (i - bar_off) // 4, "inBar": in_bar,
                          "kick": round(env_at(kick, t), 3), "snare": round(env_at(snare, t), 3),
                          "strength": round(float(strength), 3), "level": level})

    # ---- lyrics: align sheet to ASR words, refine onsets ---------------------------
    raw = json.load(open(os.path.join(ROOT, "data/words_raw.json")))
    merged = []
    for w in raw:
        if w["w"].startswith("-") and merged:
            merged[-1]["w"] += w["w"]; merged[-1]["e"] = w["e"]
        else:
            merged.append(dict(w))
    lines = [l.strip() for l in open(os.path.join(ROOT, "data/lyrics.txt")) if l.strip()]
    sheet = [(li, tok) for li, l in enumerate(lines) for tok in l.split()]
    assert len(sheet) == len(merged), (len(sheet), len(merged))

    voc_peaks = peaks(vocal, times, 0.05, 3)
    vp = np.array([p["t"] for p in voc_peaks]); vv = np.array([p["v"] for p in voc_peaks])
    # 16th-note grid built from the (onset-aligned) beats
    sixteenths = []
    for a, b in zip(beats, beats[1:] + [beats[-1] + period]):
        sixteenths += [a + (b - a) * q / 4 for q in range(4)]
    sixteenths = np.array(sixteenths)
    words = []
    for k, ((li, tok), w) in enumerate(zip(sheet, merged)):
        s, e = w["s"], w["e"]
        clean = re.sub(r"[^A-Z0-9'\-]", "", tok.upper())
        est = 0.16 + 0.065 * len(clean)          # plausible sung length of the word
        if e - s > est + 0.35:                   # ASR swallowed a gap -> start is too early
            s = e - est - 0.2
        asr_s = s
        # strongest nearby vocal onset (ASR word starts are typically +-100 ms off)
        win = (vp >= s - 0.12) & (vp <= s + 0.16)
        if win.any():
            score = vv[win] - 2.5 * np.abs(vp[win] - s)
            s = float(vp[win][np.argmax(score)])
        # singers phrase on the grid: snap to the 16th grid when the onset is within 45 ms
        g = sixteenths[np.argmin(np.abs(sixteenths - s))]
        snapped = abs(g - s) <= 0.045
        if snapped:
            s = float(g)
        prev_e = words[-1]["end"] if words else 0
        s = max(s, prev_e - 0.02)
        s = min(s, e - 0.06)
        nb = min(out_beats, key=lambda b: abs(b["t"] - s))
        seg = (times >= s) & (times <= e)
        inten = float(energy[seg].mean()) if seg.any() else 0.5
        words.append({"i": k, "line": li, "text": clean, "display": tok.rstrip(","),
                      "start": round(s, 3), "end": round(e, 3), "dur": round(e - s, 3),
                      "nearBeat": nb["i"], "beatOffset": round(s - nb["t"], 3),
                      "intensity": round(inten, 3), "asrProb": w["p"],
                      "asrStart": round(asr_s, 3), "gridSnapped": bool(snapped)})

    phrases = []
    for li, l in enumerate(lines):
        ws = [w for w in words if w["line"] == li]
        phrases.append({"i": li, "text": l, "start": ws[0]["start"], "end": ws[-1]["end"],
                        "words": [w["i"] for w in ws]})

    last_vocal = words[-1]["end"]
    first_vocal = words[0]["start"]
    sections = [
        {"name": "intro", "start": 0.0, "end": phrases[2]["start"] - 0.25},
        {"name": "verse", "start": phrases[2]["start"] - 0.25, "end": drop_t},
        {"name": "chorus", "start": drop_t, "end": last_vocal + 0.3},
        {"name": "outro", "start": last_vocal + 0.3, "end": dur},
    ]
    for s in sections:
        s["energy"] = round(e_mean(s["start"], s["end"]), 3)
        s["start"], s["end"] = round(s["start"], 3), round(s["end"], 3)

    # build-up = the 2 bars before the drop; pauses = gaps in vocals > 0.9 s
    buildups = [{"start": round(drop_t - 2 * bar, 3), "end": round(drop_t, 3)}]
    pauses = []
    for a, b in zip(words, words[1:]):
        if b["start"] - a["end"] > 0.9:
            pauses.append({"start": a["end"], "end": b["start"]})

    tl = {
        "audio": "assets/audio/tpot_song.mp3", "duration": round(dur, 3),
        "bpm": round(bpm, 3), "period": round(period, 4), "barOffset": bar_off,
        "firstVocal": first_vocal, "lastVocal": last_vocal, "drop": round(drop_t, 3),
        "sections": sections, "buildups": buildups, "pauses": pauses,
        "beats": out_beats,
        "downbeats": [b["t"] for b in out_beats if b["inBar"] == 0],
        "kicks": peaks(kick, times, 0.22, 10),
        "snares": peaks(snare, times, 0.25, 10),
        "hats": peaks(hat, times, 0.2, 6),
        "vocalOnsets": voc_peaks,
        "energy": energy_curve,
        "phrases": phrases, "words": words,
    }
    with open(os.path.join(ROOT, "data/timeline.json"), "w") as f:
        json.dump(tl, f, indent=1)
    print(f"BPM {bpm:.2f}  period {period:.4f}  phase {phase:.3f}  barOffset {bar_off}  drop {drop_t:.2f}")
    print("sections", [(s["name"], s["start"], s["end"], s["energy"]) for s in sections])
    print("levels", np.bincount([b["level"] for b in out_beats]))
    for w in words:
        print(f'{w["display"]:>10} {w["start"]:6.2f}-{w["end"]:6.2f} asr {w["asrStart"]:6.2f} beatOff {w["beatOffset"]:+.3f} {"GRID" if w["gridSnapped"] else ""}')


if __name__ == "__main__":
    main()
