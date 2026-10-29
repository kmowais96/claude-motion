"""Ambient bed for the RiseVideo short, placed from src/rise/timeline.json (numpy only)."""
import json, wave
import numpy as np

TL = json.load(open('src/rise/timeline.json'))
SR = 44100
D = TL['duration']
n = int(D * SR)
t = np.arange(n) / SR
out = np.zeros(n)


def env(a, b, ramp=1.0):
    return np.clip((t - a) / ramp, 0, 1) * np.clip((b - t) / ramp, 0, 1)


def band(a, b):
    return np.clip((t - a) / (b - a), 0, 1)


# low drone: D2 + fifth, slow tremolo; fades up gently toward the end
drone = np.sin(2 * np.pi * 73.4 * t) + 0.5 * np.sin(2 * np.pi * 110.0 * t + 0.4)
out += drone * (0.5 + 0.12 * np.sin(2 * np.pi * 0.11 * t)) * env(0, D, 2.0) * 0.5

# dawn pad: A4 + E5 + D5, enters with the sky
pad = sum(np.sin(2 * np.pi * f * t + i) for i, f in enumerate([293.7, 440.0, 587.3]))
out += pad * band(TL['dawn']['from'], TL['dawn']['to']) * (1 - band(59.0, D)) * 0.1 * (0.8 + 0.2 * np.sin(2 * np.pi * 0.3 * t))

# the fall: descending sine sweep
a, b = TL['fall']['start'] + 0.5, TL['fall']['land']
m = (t >= a) & (t < b)
k = (t[m] - a) / (b - a)
f = 520 * (1 - k) ** 1.6 + 55
out[m] += np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * k) * 0.55

# landing thud
for at, amp in [(TL['fall']['land'], 0.9), (TL['stop'], 1.0)]:
    m = (t >= at) & (t < at + 0.8)
    k = t[m] - at
    f = 120 * np.exp(-k * 5) + 38
    out[m] += np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-k * 4.5) * amp

# soft tick as each step is spoken
for s in TL['steps']:
    m = (t >= s['t']) & (t < s['t'] + 0.5)
    k = t[m] - s['t']
    out[m] += np.sin(2 * np.pi * 880 * t[m]) * np.exp(-k * 9) * 0.18

out = out / np.max(np.abs(out)) * 0.9
with wave.open('public/rise-ambient.wav', 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((out * 32767).astype('<i2').tobytes())
print('ok')
