"""Sound for NamingShort: three stems placed from src/naming/timeline.json, then a ducked mix.

  bed  - hummed vocal choir (additive, formant-shaped) in D Hijaz + daf-style frame drum. No instruments.
  sfx  - whooshes on cuts, soft clinks as names land, ticks on the day chips and the recap.
  vo   - public/naming-vo.wav from naming_vo.py, given a small room so it doesn't sound studio-dry.

    python3 sfx/cues/naming_vo.py && python3 sfx/cues/naming_mix.py
Loudness is set on the final file in the mux step (ffmpeg loudnorm, -14 LUFS, -1.5 dBTP).
"""
import json
import wave

import numpy as np

SR = 48000
TL = json.load(open('src/naming/timeline.json'))
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

# Drone under everything; it opens up on the names and again at the close.
choir([D3, A3], 0, D, 0.55, 'mm', fade=2.0)
choir([D3, A3, D4], B['stays'], B['beloved'] - B['stays'] + 0.8, 0.42, 'ah', fade=1.5)
choir([D3, A3, D4, Fs4], B['beloved'], B['rush'] - B['beloved'] + 0.8, 0.55, 'ah', fade=0.8)
choir([D3, A3, D4], B['rush'], B['cta'] - B['rush'] + 0.8, 0.45, 'ah', fade=1.2)
choir([D3, A3, D4, A4], B['cta'], D - B['cta'], 0.6, 'ah', fade=1.5)

# Hummed Hijaz motif in the hook and the close.
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
# Drum sits out under the hadith and the Muhammad calligraphy, and under the father's beat.
drum_gain = env([(0, 0), (B['stays'] - 0.1, 0), (B['stays'] + 0.4, 0.6), (at('called') - 0.5, 0.6), (at('called'), 0.0),
                 (B['beloved'] - 0.1, 0), (B['beloved'] + 0.3, 0.85), (B['father'] - 0.3, 0.8), (B['father'] + 0.3, 0.35),
                 (B['cta'] - 0.2, 0.35), (B['cta'] + 0.4, 0.6), (TL['voEnd'], 0.6), (TL['voEnd'] + 0.8, 0), (D, 0)])
drums = np.zeros(N)
bar = B['stays']
while bar < D:
    for off, kind, g in PATTERN:
        s = bar + off * beat
        if s < D:
            put(drums, s, dum(g) if kind == 'D' else tak(g) * (0.85 + 0.3 * rng.random()))
    bar += 4 * beat
drums *= drum_gain
put(drums, at('Abdullah') - 0.03, dum(1.2))
put(drums, TL['voEnd'] + 0.5, dum(1.2))
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

for name in ['stays', 'beloved', 'rush', 'match', 'change', 'father', 'cta']:
    put(sfx, B[name] - 0.35, whoosh(0.7), 0.12)
put(sfx, at('called') - 0.6, whoosh(0.9, up=False), 0.12)
put(sfx, at('Day', B['rush']) - 0.4, whoosh(0.5), 0.08)

# names land
put(sfx, at('Abdullah'), clink(0.3))
put(sfx, at('Abdurrahman.'), clink(0.3))
# day chips
for w, a in [('Day', B['rush']), ('three,', 0), ('aqiqah', 0)]:
    put(sfx, at(w, a), tick(2200, 0.45))
# Asiya struck through, Jamila lands
put(sfx, at('Jamila.') - 0.35, whoosh(0.4), 0.1)
put(sfx, at('Jamila.'), clink(0.35))
# recap ticks (0.15 s into each item's check)
for i in range(6):
    put(sfx, B['cta'] + 0.1 + 0.2 + i * 0.28 + 0.2, tick(2600, 0.35))
put(sfx, TL['voEnd'] + 0.4, whoosh(0.8), 0.12)

# ---------- voice: small room + noise floor ----------
vo = np.zeros(N)
with wave.open('public/naming-vo.wav') as w:
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
duck = 1 - 0.6 * np.clip(lvl / 0.08, 0, 1)

fade = np.clip((D - t) / 1.0, 0, 1)
mix = vo * 1.0 + bed * 0.2 * duck * fade + sfx * 0.35 * fade

write('public/naming-bed.wav', bed * 0.5)
write('public/naming-sfx.wav', sfx * 0.5)
write('public/naming-mix.wav', mix / np.max(np.abs(mix)) * 0.89)
print('ok', round(float(np.max(np.abs(mix))), 3))
