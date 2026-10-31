"""Sound for NamingShort: three stems placed from src/naming/timeline.json, then a ducked mix.

  bed  - sung dhikr nasheed (voices only) + a soft daf-style frame drum. No melodic instruments.
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


# Sung dhikr (Ya Rahman, Ya Rahim, Allahumma barik): voices only, no instruments.
# Two takes are laid end to end with a crossfade so it covers the whole Short.
import subprocess


def load(path):
    pcm = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(pcm, np.int16).astype(np.float64) / 32768


def place(x, start, fade_in, fade_out):
    n = min(len(x), N - int(start * SR))
    y = x[:n].copy()
    fi, fo = int(fade_in * SR), int(fade_out * SR)
    if fi:
        y[:fi] *= np.linspace(0, 1, fi)
    if fo:
        y[-fo:] *= np.linspace(1, 0, fo)
    bed[int(start * SR):int(start * SR) + n] += y


bed = np.zeros(N)
na, nb = load('public/naming-nasheed-a.mp3'), load('public/naming-nasheed-b.mp3')
na, nb = na / np.max(np.abs(na)), nb / np.max(np.abs(nb))
place(na, 0.0, 1.5, 3.0)
place(nb, len(na) / SR - 3.0, 3.0, 2.0)
# Soften it into the background: roll off the top, add a small hall.
spec = np.fft.rfft(bed)
f = np.fft.rfftfreq(N, 1 / SR)
spec *= 1 / (1 + (f / 4500) ** 4)
bed = np.fft.irfft(spec, N)
ir = rng.standard_normal(int(1.2 * SR)) * np.exp(-np.arange(int(1.2 * SR)) / SR * 3.2)
ir[:int(0.02 * SR)] = 0
hall = np.fft.irfft(np.fft.rfft(bed, 2 * N) * np.fft.rfft(ir, 2 * N), 2 * N)[:N]
bed = bed + hall / np.max(np.abs(hall)) * np.max(np.abs(bed)) * 0.35

# ---------- frame drum (daf): the one percussion instrument nasheed traditionally allows ----------
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
bed = bed / np.max(np.abs(bed)) * 0.5 + drums * 0.16

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
mix = vo * 1.0 + bed * 0.55 * duck * fade + sfx * 0.35 * fade

write('public/naming-bed.wav', bed * 0.5)
write('public/naming-sfx.wav', sfx * 0.5)
write('public/naming-mix.wav', mix / np.max(np.abs(mix)) * 0.89)
print('ok', round(float(np.max(np.abs(mix))), 3))
