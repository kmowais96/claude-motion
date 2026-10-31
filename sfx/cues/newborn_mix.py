"""Sound for NewbornShort: three stems placed from src/newborn/timeline.json, then a ducked mix.

  bed  - hummed vocal choir (additive, formant-shaped) in D Hijaz + daf-style frame drum. No instruments.
  sfx  - heartbeat, whooshes on cuts, day-counter ticks, coin clinks, recap ticks.
  vo   - public/newborn-vo.wav from newborn_vo.py.

    python3 sfx/cues/newborn_vo.py && python3 sfx/cues/newborn_mix.py
Loudness is set on the final file in the mux step (ffmpeg loudnorm, -14 LUFS, -1.5 dBTP).
"""
import json
import wave

import numpy as np

SR = 48000
TL = json.load(open('src/newborn/timeline.json'))
B = TL['beats']
D = TL['duration']
N = int(D * SR)
t = np.arange(N) / SR
rng = np.random.default_rng(7)
WORDS = TL['words']


def at(w, after=0.0):
    return next(s for x, s in WORDS if x == w and s >= after)


def env(points):
    xs, ys = zip(*points)
    return np.interp(t, xs, ys)


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


# ---------- vocal choir ----------
FORMANTS = {'ah': [(700, 1.0, 130), (1150, 0.5, 160), (2600, 0.2, 250)],
            'mm': [(260, 1.0, 90), (2200, 0.04, 300)]}


def voice(f0, dur, vowel='ah', seed=0):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    r = np.random.default_rng(seed)
    vib = 1 + 0.004 * np.sin(2 * np.pi * (4.8 + r.random()) * tt + r.random() * 6) + 0.002 * np.sin(2 * np.pi * 0.21 * tt)
    phase = 2 * np.pi * np.cumsum(f0 * vib) / SR
    y = np.zeros(n)
    for h in range(1, int(4200 / f0)):
        fh = h * f0
        amp = sum(g * np.exp(-0.5 * ((fh - fc) / bw) ** 2) for fc, g, bw in FORMANTS[vowel]) + 0.02 / h
        y += amp / h ** 0.4 * np.sin(h * phase + r.random() * 6.28)
    breath = bandnoise(n, 500, 3000) * 0.015
    return (y / (np.max(np.abs(y)) + 1e-9)) + breath


def choir(notes, start, dur, gain, vowel='ah', fade=1.2):
    n = int(dur * SR)
    out = np.zeros(n)
    for i, f in enumerate(notes):
        for k, cents in enumerate((-7, 0, 6)):
            out += voice(f * 2 ** (cents / 1200), dur, vowel, seed=i * 10 + k + int(start * 10))
    e = np.minimum(1, np.minimum(np.arange(n) / (fade * SR), (n - np.arange(n)) / (fade * SR)))
    put(bed, start, out / (3 * len(notes)) * e, gain)


bed = np.zeros(N)
D2, D3, A3, D4, Eb4, Fs4, G4, A4 = 73.42, 146.83, 220.0, 293.66, 311.13, 369.99, 392.0, 440.0

# Drone under everything, opening to a fuller chord at day 7 and the close.
choir([D3, A3], 0, D, 0.55, 'mm', fade=2.0)
choir([D3, A3, D4], B['tidings'], B['day7'] - B['tidings'] + 0.8, 0.45, 'ah', fade=1.5)
choir([D3, A3, D4, Fs4], B['day7'], B['cta'] - B['day7'] + 0.8, 0.5, 'ah', fade=1.0)
choir([D3, A3, D4, A4], B['cta'], D - B['cta'], 0.6, 'ah', fade=1.5)

# Hummed Hijaz motif in the hook and the recap.
for start, line in [(0.3, [D4, Eb4, Fs4, G4, Fs4]), (B['cta'] + 0.2, [A4, G4, Fs4, Eb4, D4])]:
    for i, f in enumerate(line):
        choir([f], start + i * 1.05, 1.5, 0.32, 'mm', fade=0.35)

# ---------- frame drum ----------
def dum(gain=1.0):
    n = int(0.6 * SR)
    tt = np.arange(n) / SR
    f = 52 + 70 * np.exp(-tt * 22)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 7)
    skin = bandnoise(n, 80, 900) * np.exp(-tt * 40) * 0.35
    return (body + skin) * gain


def tak(gain=1.0):
    n = int(0.35 * SR)
    tt = np.arange(n) / SR
    slap = bandnoise(n, 1800, 5000) * np.exp(-tt * 55)
    jingle = bandnoise(n, 5500, 11000) * np.exp(-tt * 14) * 0.35
    return (slap + jingle) * gain


BPM = 84
beat = 60 / BPM
PATTERN = [(0, 'D', 1.0), (1.5, 'T', 0.55), (2, 'D', 0.6), (3, 'T', 0.7), (3.5, 'T', 0.35)]
drum_gain = env([(0, 0), (B['tidings'] - 0.1, 0), (B['tidings'] + 0.4, 0.8), (B['adhan'] - 0.4, 0.8), (B['adhan'], 0.0),
                 (B['tahnik'] - 0.1, 0), (B['tahnik'] + 0.5, 0.8), (B['day7'] - 0.3, 0.8), (B['day7'], 0),
                 (at('aqiqah.') - 0.4, 0), (at('aqiqah.'), 1.0), (B['khitan'] - 0.3, 1.0), (B['khitan'] + 0.4, 0.55),
                 (B['cta'] - 0.2, 0.55), (B['cta'] + 0.4, 0), (D, 0)])
drums = np.zeros(N)
bar = B['tidings']
while bar < D:
    for off, kind, g in PATTERN:
        s = bar + off * beat
        if s < D:
            put(drums, s, dum(g) if kind == 'D' else tak(g) * (0.85 + 0.3 * rng.random()))
    bar += 4 * beat
drums *= drum_gain
put(drums, at('aqiqah.') - 0.05, dum(1.4))
put(drums, at('Follow'), dum(1.2))
bed = bed / np.max(np.abs(bed)) * 0.5 + drums * 0.33

# ---------- sfx ----------
sfx = np.zeros(N)


def whoosh(dur, up=True):
    n = int(dur * SR)
    k = np.linspace(0, 1, n)
    sweep = np.sin(np.pi * k) ** 2
    hi = bandnoise(n, 1500, 7000)
    lo = bandnoise(n, 200, 1200)
    mixk = k if up else 1 - k
    return (lo * (1 - mixk) + hi * mixk) * sweep


def heartbeat():
    def thump(g):
        n = int(0.25 * SR)
        tt = np.arange(n) / SR
        return np.sin(2 * np.pi * (45 + 30 * np.exp(-tt * 30)) * tt) * np.exp(-tt * 18) * g
    y = np.zeros(int(0.6 * SR))
    put(y, 0, thump(1.0))
    put(y, 0.2, thump(0.6))
    return y


def tick(freq=2200, g=1.0):
    n = int(0.08 * SR)
    tt = np.arange(n) / SR
    return np.sin(2 * np.pi * freq * tt) * np.exp(-tt * 70) * g


def clink(g=1.0):
    n = int(0.9 * SR)
    tt = np.arange(n) / SR
    y = sum(a * np.sin(2 * np.pi * f * tt) * np.exp(-tt * d) for f, a, d in [(2400, 1, 6), (3910, 0.6, 9), (5630, 0.4, 12), (7180, 0.2, 16)])
    return y * g


# heartbeat: peaks of the photo pulse, sin(2*pi*1.15*t)^8 -> t = (0.25 + n) / 1.15
for k in range(8):
    s = (0.25 + k) / 1.15 - 0.03
    if s < B['tidings']:
        put(sfx, s, heartbeat(), 0.9 * (1 - 0.5 * s / B['tidings']))

for name in ['tidings', 'adhan', 'tahnik', 'name', 'khitan', 'cta']:
    put(sfx, B[name] - 0.35, whoosh(0.7), 0.12)
put(sfx, B['day7'] - 0.3, whoosh(0.9, up=False), 0.14)
put(sfx, at('aqiqah.') - 0.6, whoosh(0.8), 0.14)
put(sfx, at('Shave') - 0.4, whoosh(0.6), 0.12)

# day counter: one tick per number, last one a soft clink
c0, c1 = B['day7'] + 0.1, at('seven:')
for n in range(1, 8):
    s = c0 + (n - 1) / 6.999 * (c1 - c0)
    put(sfx, s, clink(0.35) if n == 7 else tick(1800 + n * 90, 0.5))

# coins land on the scale: drop starts + 0.35 s
for d in [at('weight'), at('silver'), at('charity.') - 0.1]:
    put(sfx, d + 0.33, clink(0.45))

# recap ticks (0.15 s into each item's check)
for i in range(6):
    put(sfx, B['cta'] + 0.1 + 0.2 + i * 0.3 + 0.2, tick(2600, 0.35))

# ---------- mix ----------
vo = np.zeros(N)
with wave.open('public/newborn-vo.wav') as w:
    v = np.frombuffer(w.readframes(w.getnframes()), np.int16) / 32768
vo[:len(v)] = v[:N]
vo /= np.max(np.abs(vo))

# sidechain: bed dips ~8 dB under the voice, recovers over ~250 ms
lvl = np.sqrt(np.convolve(vo ** 2, np.ones(int(0.05 * SR)) / int(0.05 * SR), 'same'))
lvl = np.convolve(lvl, np.ones(int(0.25 * SR)) / int(0.25 * SR), 'same')
duck = 1 - 0.6 * np.clip(lvl / 0.08, 0, 1)

fade = np.clip((D - t) / 1.0, 0, 1)
mix = vo * 1.0 + bed * 0.2 * duck * fade + sfx * 0.35 * fade

write('public/newborn-bed.wav', bed * 0.5)
write('public/newborn-sfx.wav', sfx * 0.5)
write('public/newborn-mix.wav', mix / np.max(np.abs(mix)) * 0.89)
print('ok', round(float(np.max(np.abs(mix))), 3))

