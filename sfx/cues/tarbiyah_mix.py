"""Sound for TarbiyahShort: three stems placed from src/tarbiyah/timeline.json, then a ducked mix.

  bed  - the same supplied nasheed as NamingShort (public/naming-nasheed.mp3) from 0:20, ducked under the voice.
         It drops out for "So... who is asked first?" and comes back softly under the last line.
  sfx  - whooshes into each question, a tick on each question number, a low clink when the answer lands.
  vo   - public/tarbiyah-vo.wav from tarbiyah_vo.py, given a small room so it doesn't sound studio-dry.

    python3 sfx/cues/tarbiyah_vo.py && python3 sfx/cues/tarbiyah_mix.py
"""
import json
import subprocess
import wave

import numpy as np

SR = 48000
TL = json.load(open('src/tarbiyah/timeline.json'))
B = TL['beats']
D = TL['duration']
N = int(D * SR)
t = np.arange(N) / SR
rng = np.random.default_rng(7)
WORDS = TL['words']


def at(w, after=0.0):
    return next(s for x, s in WORDS if x == w and s >= after)


def put(buf, at_s, x, gain=1.0):
    i = int(at_s * SR)
    if i >= len(buf):
        return
    n = min(len(x), len(buf) - i)
    buf[i:i + n] += x[:n] * gain


def write(path, x):
    with wave.open(path, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype('<i2').tobytes())


def bandnoise(n, lo, hi):
    spec = np.fft.rfft(rng.standard_normal(n))
    f = np.fft.rfftfreq(n, 1 / SR)
    spec[(f < lo) | (f > hi)] = 0
    y = np.fft.irfft(spec, n)
    return y / (np.max(np.abs(y)) + 1e-9)


NASHEED_START = 20.0
pcm = subprocess.run(['ffmpeg', '-loglevel', 'error', '-ss', str(NASHEED_START), '-i', 'public/naming-nasheed.mp3',
                      '-t', str(D + 0.5), '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'],
                     capture_output=True, check=True).stdout
bed = np.zeros(N)
nash = np.frombuffer(pcm, np.int16).astype(np.float64) / 32768
bed[:min(N, len(nash))] = nash[:N]
fi = int(0.8 * SR)
bed[:fi] *= np.linspace(0, 1, fi)
bed *= 10 ** (-46 / 20) / np.sqrt(np.mean(bed ** 2))
# Drop out for the returning question and the answer; come back softly under the last line.
gate = np.interp(t, [0, B['ask'] - 0.6, B['ask'] - 0.1, B['close'] - 0.4, B['close'] + 0.8, D], [1, 1, 0, 0, 0.8, 0.8])
bed *= gate

sfx = np.zeros(N)


def whoosh(dur, up=True):
    n = int(dur * SR)
    k = np.linspace(0, 1, n)
    sweep = np.sin(np.pi * k) ** 2
    hi = bandnoise(n, 1500, 7000)
    lo = bandnoise(n, 200, 1200)
    mixk = k if up else 1 - k
    return (lo * (1 - mixk) + hi * mixk) * sweep


def tick(freq=2200, g=1.0):
    n = int(0.08 * SR)
    tt = np.arange(n) / SR
    return np.sin(2 * np.pi * freq * tt) * np.exp(-tt * 70) * g


def clink(g=1.0, base=1200):
    n = int(1.2 * SR)
    tt = np.arange(n) / SR
    y = sum(a * np.sin(2 * np.pi * base * f * tt) * np.exp(-tt * d) for f, a, d in [(1, 1, 4), (1.63, 0.6, 6), (2.35, 0.35, 9)])
    return y * g


for name in ['q1', 'hold', 'q2', 'q3', 'neglect', 'close']:
    put(sfx, B[name] - 0.35, whoosh(0.7), 0.12)
for name in ['q1', 'q2', 'q3']:
    put(sfx, B[name] + 0.05, tick(2300, 0.4))
put(sfx, at('father.') - 0.05, clink(0.3))
put(sfx, TL['voEnd'] + 0.5, whoosh(0.8), 0.1)

# ---------- voice: small room + noise floor ----------
vo = np.zeros(N)
with wave.open('public/tarbiyah-vo.wav') as w:
    v = np.frombuffer(w.readframes(w.getnframes()), np.int16) / 32768
vo[:len(v)] = v[:N]
vo /= np.max(np.abs(vo))
# Short diffuse tail (~0.3 s), like a furnished room, mixed well under the dry voice.
n = int(0.35 * SR)
tt = np.arange(n) / SR
ir = rng.standard_normal(n) * np.exp(-tt * 20)
ir[:int(0.012 * SR)] = 0
ir = np.convolve(ir, np.ones(8) / 8, 'same')
wet = np.fft.irfft(np.fft.rfft(vo, 2 * N) * np.fft.rfft(ir, 2 * N), 2 * N)[:N]
wet = wet / np.max(np.abs(wet)) * 0.11
room = bandnoise(N, 60, 6000) * 0.0025
vo = vo + wet + room

# sidechain: bed dips ~8 dB under the voice, recovers over ~250 ms
dry = np.zeros(N)
dry[:len(v)] = v[:N] / np.max(np.abs(v))
lvl = np.sqrt(np.convolve(dry ** 2, np.ones(int(0.05 * SR)) / int(0.05 * SR), 'same'))
lvl = np.convolve(lvl, np.ones(int(0.25 * SR)) / int(0.25 * SR), 'same')
duck = 1 - 0.75 * np.clip(lvl / 0.08, 0, 1)

fade = np.clip((D - t) / 1.0, 0, 1)
mix = vo * 1.0 + bed * duck * fade + sfx * 0.35 * fade

write('public/tarbiyah-bed.wav', bed * 3)
write('public/tarbiyah-sfx.wav', sfx * 0.5)
write('public/tarbiyah-mix.wav', mix / np.max(np.abs(mix)) * 0.89)
print('ok', round(float(np.max(np.abs(mix))), 3))
