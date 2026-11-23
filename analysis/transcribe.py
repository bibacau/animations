"""Word-level transcription of the song with faster-whisper.

Usage:
    python analysis/transcribe.py <audio> <ctranslate2-model-dir> data/words_raw.json

Audio is decoded with ffmpeg to 16 kHz mono first (avoids PyAV version issues).
The output is the raw ASR result; analysis/analyze.py applies the lyric sheet
(data/lyrics.txt) and refines onsets against the audio.
"""
import json
import subprocess
import sys

import numpy as np
from faster_whisper import WhisperModel


def load16k(path):
    raw = subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-i", path, "-ac", "1", "-ar", "16000",
         "-f", "f32le", "-"], check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32)


def main(audio, model_dir, out_path):
    model = WhisperModel(model_dir, device="cpu", compute_type="int8")
    segs, _ = model.transcribe(load16k(audio), language="en", word_timestamps=True,
                               beam_size=5, vad_filter=False)
    words = []
    for s in segs:
        print(f"[{s.start:6.2f}-{s.end:6.2f}] {s.text}")
        for w in s.words:
            words.append({"w": w.word.strip(), "s": round(w.start, 3),
                          "e": round(w.end, 3), "p": round(w.probability, 3)})
    with open(out_path, "w") as f:
        json.dump(words, f, indent=0)


if __name__ == "__main__":
    main(*sys.argv[1:4])
