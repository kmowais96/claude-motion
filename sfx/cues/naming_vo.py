"""Cut the NamingShort narration at its pauses, open breathing room between beats,
and write the shifted word timings + beat starts to src/naming/timeline.json.

    python3 sfx/cues/naming_vo.py
"""
import json
import os
import subprocess
import wave

import numpy as np

SR = 48000
RAW = 'public/naming-vo-raw.mp3'
OUT = 'public/naming-vo.wav'
TIMELINE = 'src/naming/timeline.json'
DURATION = 61.0
# The conversational take runs long; 5% faster keeps it near a minute without sounding rushed.
TEMPO = 1.05

# Cut points (raw-take seconds) sit inside pauses measured with silencedetect -38 dB.
BEATS = ['hook', 'stays', 'beloved', 'rush', 'match', 'change', 'father', 'cta']
CUTS = [0.0, 6.4, 17.7, 22.7, 32.2, 40.5, 48.3, 54.4]
GAPS = [0.35, 0.45, 0.4, 0.45, 0.4, 0.4, 0.5, 0.0]
LEAD = 0.2
# The narration stops after "birth certificate."; the follow line lives on the end card only.
END = 56.8

pcm = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', RAW, '-af', f'atempo={TEMPO}', '-ac', '1', '-ar', str(SR),
                      '-f', 's16le', '-'], capture_output=True, check=True).stdout
x = np.frombuffer(pcm, np.int16).astype(np.float64) / 32768
x = x[:int(END / TEMPO * SR)]
cuts = [c / TEMPO for c in CUTS]

out = np.zeros(int(DURATION * SR))
starts, offsets = [], []
pos = LEAD
for i, a in enumerate(cuts):
    b = cuts[i + 1] if i + 1 < len(cuts) else len(x) / SR
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
    t = t / TEMPO
    k = max(i for i, c in enumerate(cuts) if c <= t + 0.15)
    return round(t + offsets[k], 3)


words = [[w, shift(t)] for w, t in json.load(open('src/naming/words.json')) if t < END]
tl = json.load(open(TIMELINE)) if os.path.exists(TIMELINE) else {}
tl.update({'fps': 30, 'duration': DURATION, 'voEnd': round(pos - GAPS[-1], 3),
           'beats': dict(zip(BEATS, starts)), 'words': words})
json.dump(tl, open(TIMELINE, 'w'), indent=1)
print('beats', tl['beats'], 'vo ends', tl['voEnd'])
