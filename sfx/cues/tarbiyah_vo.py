"""Cut the TarbiyahShort narration into its question/answer lines, set the pauses between them,
and write the shifted word timings + beat starts to src/tarbiyah/timeline.json.

    python3 sfx/cues/tarbiyah_vo.py
"""
import json
import subprocess
import wave

import numpy as np

SR = 48000
RAW = 'public/tarbiyah-vo-raw.mp3'
OUT = 'public/tarbiyah-vo.wav'
TIMELINE = 'src/tarbiyah/timeline.json'
# The take runs 66.6 s with long [pause]s; 11% faster plus set gaps brings the voice to about 57 s.
TEMPO = 1.11
LEAD = 0.25
# Each line in the raw take: (name, first-word start, last-word end), then the silence after it.
LINES = [
    ('open', 0.0, 4.2), ('q1', 4.5, 6.7), ('a1', 7.2, 16.75), ('hold', 17.65, 23.15), ('holdOn', 24.1, 25.0),
    ('q2', 25.95, 28.1), ('a2', 28.97, 37.3), ('q3', 38.1, 40.45), ('a3', 41.13, 46.1), ('neglect', 47.48, 52.2),
    ('ask', 53.48, 55.65), ('answer', 56.64, 63.72), ('close', 64.68, 66.7),
]
# Questions get a beat of silence before their answer; the reveal gets the longest.
GAPS = [0.3, 0.6, 0.4, 0.45, 0.55, 0.6, 0.45, 0.6, 0.75, 0.75, 0.65, 0.75, 0.0]
TAIL = 2.4  # end card after the last line

pcm = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', RAW, '-af', f'atempo={TEMPO}', '-ac', '1', '-ar', str(SR),
                      '-f', 's16le', '-'], capture_output=True, check=True).stdout
x = np.frombuffer(pcm, np.int16).astype(np.float64) / 32768

segs, starts, offsets = [], {}, []
pos = LEAD
for (name, a, b), gap in zip(LINES, GAPS):
    a, b = a / TEMPO, b / TEMPO
    seg = x[int(a * SR):int(b * SR)].copy()
    f = int(0.012 * SR)
    seg[:f] *= np.linspace(0, 1, f)
    seg[-f:] *= np.linspace(1, 0, f)
    segs.append((pos, seg))
    starts[name] = round(pos, 3)
    offsets.append((a, b, pos - a))
    pos += (b - a) + gap
vo_end = pos - GAPS[-1]
duration = round(vo_end + TAIL, 2)

out = np.zeros(int(duration * SR) + SR)
for p, seg in segs:
    i0 = int(p * SR)
    out[i0:i0 + len(seg)] += seg
out = out[:int(duration * SR)]
with wave.open(OUT, 'wb') as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((np.clip(out, -1, 1) * 32767).astype('<i2').tobytes())


def shift(t):
    t = t / TEMPO
    for a, b, off in offsets:
        if a - 0.05 <= t <= b + 0.05:
            return round(t + off, 3)
    raise ValueError(t)


words = [[w, shift(t)] for w, t in json.load(open('src/tarbiyah/words.json'))]
tl = {'fps': 30, 'duration': duration, 'voEnd': round(vo_end, 3), 'beats': starts, 'words': words}
json.dump(tl, open(TIMELINE, 'w'), indent=1)
print('beats', starts, 'vo ends', round(vo_end, 2), 'duration', duration)
