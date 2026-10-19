"""Quiet foley for the Ivory-room proof slice: room tone, the breeze outside, the cover, the leaf, and the
pictures on the wall (sand wind, a far town, the sea). No music. Writes sound.wav (48 kHz stereo).
Beats match T in main.js."""
import math, sys, wave
import numpy as np

SR, DUR = 48000, 45.0
T = dict(open0=13, open1=16.4, leaf0=17.4, leaf1=21, slit0=21.6, slit1=25.2, city=31, sea=38.2, out0=43.6)
N = int(SR * DUR)
t = np.arange(N) / SR
rng = np.random.default_rng(11)


def band(n, lo, hi, tilt=0.0):
    """White noise shaped in the frequency domain: band [lo, hi] Hz, tilt in dB/octave."""
    X = np.fft.rfft(rng.standard_normal(n))
    f = np.fft.rfftfreq(n, 1 / SR)
    m = ((f >= lo) & (f <= hi)).astype(float)
    m *= np.clip(f, 20, None) ** (tilt / 6.02)
    y = np.fft.irfft(X * m, n)
    return y / (np.abs(y).max() + 1e-9)


def seg(x, a, b):
    return np.clip((x - a) / (b - a), 0, 1)


def ss(x):
    return x * x * (3 - 2 * x)


def env(x, a, b, fi, fo):
    return np.minimum(ss(seg(x, a, a + fi)), 1 - ss(seg(x, b - fo, b)))


def breeze(x):
    return .55 * np.sin(x * .9) + .3 * np.sin(x * 2.3 + 1.3) + .15 * np.sin(x * 5.1 + .4) + .6 * np.exp(-((x % 11) - 6) ** 2 * .6)


def db(v):
    return 10 ** (v / 20)


L = np.zeros(N); R = np.zeros(N)
def put(sig, at=0.0, g=1.0, pan=0.0):
    i = int(at * SR); n = min(len(sig), N - i)
    if n <= 0: return
    a = (pan + 1) * math.pi / 4
    L[i:i + n] += sig[:n] * g * math.cos(a); R[i:i + n] += sig[:n] * g * math.sin(a)

dim = ss(seg(t, T['leaf1'] - .5, T['slit1']))
fade = 1 - seg(t, DUR - 1.2, DUR)
fade *= ss(seg(t, 0, 1.4))

# room tone: a low, warm, still air
put(band(N, 30, 260, -3) * db(-44) * fade)
# the breeze in the tree outside the window (from the left), leaves hiss when it gusts
b = np.clip((breeze(t) + .6) / 1.8, 0, 1)
leaves = band(N, 900, 7000, -2) * (.25 + .75 * b ** 2)
put(leaves * db(-40) * (1 - .7 * dim) * fade, pan=-.6)
put(band(N, 120, 900, -4) * (.3 + .7 * b) * db(-42) * (1 - .6 * dim) * fade, pan=-.4)

# two far birds outside, early
def chirp(f0, f1, d):
    n = int(d * SR); x = np.arange(n) / SR
    ph = 2 * np.pi * np.cumsum(f0 + (f1 - f0) * (x / d) ** .6) / SR
    return np.sin(ph) * np.sin(np.pi * x / d) ** 2
for at, f in [(2.6, 3400), (2.75, 3800), (9.1, 3100), (9.24, 3600), (9.4, 3300)]:
    put(chirp(f, f * 1.25, .07) * db(-46), at, pan=-.7)

# the cover: a slow cloth-and-board creak while it lifts, then a soft settle on the table
n = int((T['open1'] - T['open0']) * SR); x = np.arange(n) / n
creak = band(n, 180, 1400, -4) * (np.sin(np.pi * x) ** 1.5) * (1 + .5 * np.sin(2 * np.pi * x * 9))
put(creak * db(-34), T['open0'], pan=.2)
k = int(.5 * SR); xx = np.arange(k) / SR
put((np.sin(2 * np.pi * 70 * xx) * np.exp(-xx * 18) * .8 + band(k, 60, 900, -6) * np.exp(-xx * 30)) * db(-28), T['open1'] - .08, pan=.3)

# the leaf: a paper rustle with crackle, loudest as it stands up, then a light flap as it lands
n = int((T['leaf1'] - T['leaf0']) * SR); x = np.arange(n) / n
crack = (rng.random(n) < 0.0016).astype(float) * rng.random(n)
crack = np.convolve(crack, np.exp(-np.arange(200) / 25), 'same')
rustle = band(n, 1800, 9000, -1) * .6 + crack * .9
rustle *= (np.sin(np.pi * x) ** 1.2) * (.6 + .4 * np.sin(np.pi * x * 3))
put(rustle * db(-32), T['leaf0'], pan=.1)
k = int(.35 * SR); xx = np.arange(k) / SR
put(band(k, 300, 4000, -3) * np.exp(-xx * 22) * db(-34), T['leaf1'] - .1, pan=.25)

# the pictures on the wall bring their own air, far and soft
open_ = ss(seg(t, T['slit0'], T['slit1']))
desert = env(t, T['slit0'], T['city'] + 1, 3, 2)
town = env(t, T['city'] - 1, T['sea'] + 1, 2, 2)
seaE = env(t, T['sea'] - 1, DUR, 2, 1.4)
put(band(N, 1500, 9000, -1) * (.4 + .6 * b) * desert * open_ * db(-42) * fade)            # sand lifting off the crests
put(band(N, 100, 700, -4) * desert * open_ * db(-44) * fade)
put(band(N, 150, 2500, -5) * town * db(-48) * fade)                                       # a far town at dusk
for i, at in enumerate([32.4, 34.9, 36.6]):
    k = int(.18 * SR); xx = np.arange(k) / SR
    put(np.sin(2 * np.pi * (520 + 40 * i) * xx) * np.exp(-xx * 14) * db(-56), at, pan=-.2 + .2 * i)   # a door, a pot, far off
swell = .5 + .5 * np.sin(2 * np.pi * t / 5.2 - 1.2)
put(band(N, 80, 1600, -4) * (.25 + .75 * swell ** 2) * seaE * db(-38) * fade)               # waves breaking softly
put(band(N, 2500, 9000, -2) * (swell ** 3) * seaE * db(-48) * fade)

mix = np.stack([L, R], 1)
mix /= max(1e-9, np.abs(mix).max()) / db(-3)
out = sys.argv[1] if len(sys.argv) > 1 else 'sound.wav'
with wave.open(out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print(out)
