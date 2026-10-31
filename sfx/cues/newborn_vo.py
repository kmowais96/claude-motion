"""Cut the NewbornShort narration at its pauses, open breathing room between beats,
and write the shifted word timings + beat starts to src/newborn/timeline.json.

    python3 sfx/cues/newborn_vo.py
"""
import json
import subprocess
import wave

import numpy as np

SR = 48000
RAW = 'public/newborn-vo-raw.mp3'
OUT = 'public/newborn-vo.wav'
TIMELINE = 'src/newborn/timeline.json'
DURATION = 57.0

# Cut points sit in the middle of measured pauses (ffmpeg silencedetect -38 dB).
# Each beat starts at a cut; GAPS is the silence added after it.
BEATS = ['hook', 'tidings', 'adhan', 'tahnik', 'name', 'day7', 'khitan', 'cta']
CUTS = [0.0, 6.1, 11.8, 20.55, 25.68, 30.82, 38.45, 43.06]
GAPS = [0.5, 0.8, 0.9, 0.8, 1.6, 0.9, 0.8, 0.0]
LEAD = 0.25

pcm = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', RAW, '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'],
                     capture_output=True, check=True).stdout
x = np.frombuffer(pcm, np.int16).astype(np.float64) / 32768

out = np.zeros(int(DURATION * SR))
starts, offsets = [], []
pos = LEAD
for i, a in enumerate(CUTS):
    b = CUTS[i + 1] if i + 1 < len(CUTS) else len(x) / SR
    seg = x[int(a * SR):int(b * SR)].copy()
    f = int(0.01 * SR)
    seg[:f] *= np.linspace(0, 1, f)
    seg[-f:] *= np.linspace(1, 0, f)
    i0 = int(pos * SR)
    out[i0:i0 + len(seg)] += seg[:len(out) - i0]
    starts.append(round(pos, 3))
    offsets.append(pos - a)
    pos += (b - a) + GAPS[i]

with wave.open(OUT, 'wb') as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((np.clip(out, -1, 1) * 32767).astype('<i2').tobytes())


def shift(t):
    k = max(i for i, c in enumerate(CUTS) if c <= t + 0.2)
    return round(t + offsets[k], 3)


words = [[w, shift(t)] for w, t in json.load(open('src/newborn/words.json'))]
tl = json.load(open(TIMELINE)) if __import__('os').path.exists(TIMELINE) else {}
tl.update({'fps': 30, 'duration': DURATION, 'voEnd': round(pos - GAPS[-1], 3),
           'beats': dict(zip(BEATS, starts)), 'words': words})
json.dump(tl, open(TIMELINE, 'w'), indent=1)
print('beats', tl['beats'], 'vo ends', tl['voEnd'])
