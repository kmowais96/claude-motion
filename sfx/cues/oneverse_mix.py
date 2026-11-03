"""Mix the OneVerse Short: narration + the recitation (untouched) + light effects, then master and mux.

    python3 sfx/cues/oneverse_mix.py                      # -> public/oneverse/mix.wav
    python3 sfx/cues/oneverse_mix.py out/oneverse-silent.mp4   # also muxes -> out/oneverse.mp4

No music. Nothing plays under the recitation except its own track.
"""
import json
import random
import subprocess
import sys
import wave

import numpy as np

sys.path.insert(0, '.')
from sfx.synth import SR, blip, chime, click, impact, pop, whoosh  # noqa: E402

random.seed(7)
TL = json.load(open('src/oneverse/timeline.json'))
L = {k: v for k, v in TL['L'].items()}
S = lambda k: L[k][0]  # noqa: E731
E = lambda k: L[k][1]  # noqa: E731
REC = TL['rec']
DUR = TL['duration']
N = int(DUR * SR)


def read(path):
    with wave.open(path) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float64) / 32768
    out = np.zeros(N)
    out[:min(N, len(x))] = x[:N]
    return out


vo = read('public/oneverse/vo.wav')
rec = read('public/oneverse/rec.wav')
fx_l, fx_r = np.zeros(N), np.zeros(N)


def put(t, s, g=1.0, pan=0.0):
    s = np.asarray(s, dtype=np.float64)
    i = int(t * SR)
    if i >= N:
        return
    s = s[:N - i]
    a = (pan + 1) * np.pi / 4
    fx_l[i:i + len(s)] += s * g * np.cos(a)
    fx_r[i:i + len(s)] += s * g * np.sin(a)


def rain(t0, t1, g, fc=2600):
    """Soft rain bed: filtered noise with gentle random density, faded in and out."""
    n = int((t1 - t0) * SR)
    x = np.random.default_rng(int(t0 * 10)).uniform(-1, 1, n)
    # one-pole low-pass then high-pass for a hiss band
    a = np.exp(-2 * np.pi * fc / SR)
    y = np.zeros(n)
    acc = 0.0
    for k in range(0, n):
        acc = (1 - a) * x[k] + a * acc
        y[k] = acc
    y = y - np.convolve(y, np.ones(64) / 64, 'same')
    env = np.minimum(1, np.minimum(np.arange(n) / (0.8 * SR), (n - np.arange(n)) / (0.8 * SR)))
    put(t0, y * env, g, -0.2)
    put(t0 + 0.013, y[::-1] * env, g, 0.2)


# ---- hook ----
put(S('h_one') - 0.1, whoosh(0.7, 2400, 500, peak=0.85), 0.08)
put(S('h_cries') + 0.05, blip(1318.5, dur=0.5, tau=0.14), 0.10, -0.3)
put(S('h_cries') + 0.55, chime([659.25, 987.77, 1318.5], dur=1.6, tau=0.6), 0.07, -0.4)
put(S('h_move') + 0.35, click(900, 0.06), 0.16, 0.4)
put(REC['s'] - 0.75, whoosh(1.0, 300, 1600, peak=0.6), 0.10)

# ---- after the recitation: clay, plots ----
put(REC['e'] + 0.3, whoosh(0.9, 1800, 300, peak=0.5), 0.09)
put(S('hand') + 0.1, chime([587.33, 880.0, 1174.66], dur=2.0, tau=0.8), 0.05)
put(S('spread'), whoosh(0.8, 200, 900, peak=0.6), 0.10)
put(S('plots') + 0.15, impact(0.9)[: int(0.9 * SR)], 0.10)
rain(S('rain') - 0.2, S('people') + 0.6, 0.05)
for i in range(4):
    put(S('life') + 1.2 + i * 0.22, pop(700 + i * 120, 1100 + i * 140), 0.10, -0.5)
for i in range(4):
    put(S('waste') - 0.1 + i * 0.12, click(2600 - i * 200, 0.04), 0.09, 0.5)
put(S('same'), chime([783.99, 1174.66], dur=1.4, tau=0.5), 0.06)
put(S('salty') + 0.05, pop(500, 900), 0.10)
put(E('salty') - 0.2, blip(1046.5, dur=0.4, tau=0.12), 0.08, 0.4)

# ---- hearts ----
put(S('people') - 0.1, whoosh(1.6, 250, 2200, peak=0.7), 0.13)
put(E('adam') + 0.1, impact(1.2), 0.16)
put(S('remind') + 0.2, chime([1174.66, 1567.98, 2349.32], dur=2.4, tau=0.9), 0.06)
put(S('soft') + 0.2, chime([659.25, 987.77], dur=1.6, tau=0.6), 0.06, -0.5)
for i in range(3):
    put(S('hard') + 0.3 + i * 0.35, click(500 + i * 90, 0.07), 0.16, 0.5)
put(S('more') + 0.3, whoosh(0.8, 500, 2600, peak=0.8), 0.07, -0.5)
put(S('less') + 0.2, whoosh(0.8, 2600, 400, peak=0.3), 0.07, 0.5)
put(S('heal') + 0.9, chime([523.25, 783.99, 1046.5], dur=2.2, tau=0.8), 0.05, -0.4)
put(S('same2') - 0.1, whoosh(1.8, 1600, 250, peak=0.5), 0.10)
rain(S('same2') + 0.3, TL['voEnd'] + 1.6, 0.03, 3600)
put(S('ground') + 0.25, chime([440.0, 659.25, 880.0, 1318.5], dur=2.6, tau=1.0), 0.07)

# ---- stems ----
VO_G, REC_G = 3.3, 0.8
left = vo * VO_G + rec * REC_G + fx_l
right = vo * VO_G + rec * REC_G + fx_r
# gentle fade at the very end
fo = int(0.4 * SR)
left[-fo:] *= np.linspace(1, 0, fo)
right[-fo:] *= np.linspace(1, 0, fo)

pre = 'public/oneverse/mix-pre.wav'
with wave.open(pre, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    st = np.stack([left, right], 1)
    st *= 0.5  # headroom; the limiter below brings it back
    w.writeframes((st * 32767).astype('<i2').tobytes())

# two-pass loudnorm to -14 LUFS / -1.5 dBTP
LIM = 'volume=2,acompressor=threshold=0.25:ratio=2.5:attack=8:release=120:makeup=1,alimiter=limit=0.8:attack=4:release=60:level=false'
meas = subprocess.run(['ffmpeg', '-hide_banner', '-i', pre, '-af', LIM + ',loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'],
                      capture_output=True, text=True).stderr
j = json.loads(meas[meas.rindex('{'):meas.rindex('}') + 1])
af = LIM + (f",loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:"
      f"measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true")
subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', pre, '-af', af, '-ar', str(SR), 'public/oneverse/mix.wav'], check=True)
print('mixed public/oneverse/mix.wav')

if len(sys.argv) > 1:
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', sys.argv[1], '-i', 'public/oneverse/mix.wav', '-map', '0:v', '-map', '1:a',
                    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-movflags', '+faststart', '-shortest', 'out/oneverse.mp4'], check=True)
    print('muxed out/oneverse.mp4')
