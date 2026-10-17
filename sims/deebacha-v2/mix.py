"""Voice + quiet procedural foley from events.json -> out/mix.wav (48 kHz stereo). No music.
Usage: .venv/bin/python mix.py <events.json> <narration.wav> <out.wav>"""
import json, sys
import numpy as np, soundfile as sf
sys.path.insert(0, '/root/lemo-opuscar/core/audio')
from sfx import SR, t_, env_exp, bp, lp, hp, noise, norm, thump, pop, add, limit

rng = np.random.default_rng(11)

def swell(d, a=.25):
    tt = t_(d); return np.minimum(1, tt / max(.02, d * a)) * np.minimum(1, (d - tt) / max(.02, d * .35))

def knife(v=1):            # gouge into wood: transient + fibre tearing
    d = .16 + rng.random() * .08
    return norm(bp(noise(d), 1400, 5200) * env_exp(d, .035) + bp(noise(d), 300, 900) * env_exp(d, .01) * .6) * v

def rustle(d=.45, v=1):    # paper slide / lay
    return norm(bp(noise(d), 900, 6000) * swell(d, .3) * (.6 + .4 * np.abs(np.sin(2 * np.pi * 7 * t_(d))))) * v

def brush(d=.8, v=1):      # bristles on paper
    d = min(max(d, .25), 3); return norm(bp(noise(d), 700, 3200) * swell(d)) * v

def wash(d=1.2, v=1):      # wet wash spreading
    d = min(max(d, .4), 4); return norm(lp(bp(noise(d), 200, 1600), 900) * swell(d, .4)) * v

def scratch(d=.8, v=1, lo=2500, hi=8000):   # nib / pencil / burin
    d = min(max(d, .2), 3); tt = t_(d)
    grain = .5 + .5 * (rng.random(len(tt)) > .7)
    return norm(bp(noise(d), lo, hi) * grain * swell(d, .15)) * v

def shimmer(d=1.6, v=1):
    tt = t_(d); x = sum(np.sin(2 * np.pi * f * tt * (1 + .02 * tt)) * a for f, a in [(1568, 1), (2349, .6), (3136, .4), (3951, .25)])
    return norm(x * np.minimum(1, tt / .5) * env_exp(d, .7)) * v

def switch(v=1):
    d = .05; return norm(hp(noise(d), 2000) * env_exp(d, .004)) * v

def sift(d=2.0, v=1):
    tt = t_(d); x = hp(noise(d), 3000) * (rng.random(len(tt)) > .985) * 4
    return norm(lp(x, 9000) * swell(d)) * v

# Recorded effects (ElevenLabs sound effects, not in git) for the moments Owais asked to hear:
# a flame catching, thunder under the lightning, the pen while it writes, voices gathering as the light spreads,
# and the azan (Owais's own recording) heard faintly while the minaret is on screen.
import os
SFX = os.environ.get('SFX_DIR', '/mnt/project-files/tafsir/deebacha-video/sfx')
REC = {}
def rec(name):
    if name not in REC:
        x, sr = sf.read(os.path.join(SFX, name + '.wav'), dtype='float32')
        assert sr == SR; x = x.mean(1) if x.ndim > 1 else x
        REC[name] = x / (np.abs(x).max() + 1e-9)
    return REC[name]

def fit(x, d, xf=.4):
    # loop a recording to d seconds with crossfades, starting somewhere random so repeats differ
    n, f = int(d * SR), int(xf * SR)
    out, pos = np.zeros(n + f, np.float32), 0
    while pos < n:
        a = int(rng.integers(0, max(1, len(x) - f * 3))); seg_ = x[a:].copy()
        r = np.ones(len(seg_), np.float32); r[:f] = np.linspace(0, 1, f); r[-f:] = np.linspace(1, 0, f)
        seg_ = (seg_ * r)[:n + f - pos]; out[pos:pos + len(seg_)] += seg_; pos += len(seg_) - f
    out = out[:n]; k = min(n // 3, int(.3 * SR)); out[:k] *= np.linspace(0, 1, k); out[-k:] *= np.linspace(1, 0, k)
    return out

RECORDED = {'ignite', 'thunder', 'pen', 'crowd', 'azan'}
def recorded(e):
    ty, d, g = e['type'], e.get('dur', 2.0), .6 if e.get('soft') else 1.0
    if ty == 'ignite':  return rec('ignite'), .28 * g
    if ty == 'thunder': return rec('thunder'), .45 * g
    if ty == 'azan':    # Owais's recording, from its opening takbir: distant (dull top end), in over 2.5 s, out over 3 s
        x = lp(rec('azan')[:int(d * SR)], 3200); n = len(x); r = np.ones(n, np.float32)
        r[:int(2.5 * SR)] = np.linspace(0, 1, int(2.5 * SR)); r[-int(3 * SR):] = np.linspace(1, 0, int(3 * SR))
        return x * r, .10
    if ty == 'pen':     return fit(rec('pen'), max(d, .6)), .17 * g
    # crowd: from silence, voices grow as the light spreads, then settle away
    x = fit(rec("crowd"), d + 1.5); tt = np.arange(len(x)) / SR
    x = x * np.clip(tt / d, 0, 1) ** 1.6 * np.clip((len(x) / SR - tt) / 1.5, 0, 1)
    return x, .22 * g

def sound(e):
    if e.get('type') in RECORDED: return recorded(e)
    x, g = _sound(e)
    k = float(rng.uniform(.8, 1.25))           # small pitch/tempo change per instance
    idx = np.arange(0, len(x) - 1, k)
    return np.interp(idx, np.arange(len(x)), x), g * float(rng.uniform(.7, 1.0))

def _sound(e):
    ty, d = e.get('type'), e.get('dur', None)
    soft = .6 if e.get('soft') or e.get('small') else 1.0
    big = 1.4 if e.get('big') or e.get('hard') else 1.0
    g = soft * big
    if ty == 'sheet':   return rustle(.9), .10
    if ty == 'cut':     return knife(), .07 * g
    if ty == 'paper':   return rustle(d or .45), .06 * g
    if ty == 'light':
        sh = np.pad(shimmer(1.4), (2400, 0)) * .5; sh[:len(switch())] += switch()
        return sh, .05 * g
    if ty == 'shimmer': return shimmer(d or 1.6), .04 * g
    if ty == 'nib':     return scratch(d or .8, lo=3000, hi=9000), .035 * g
    if ty == 'pencil':  return scratch(d or .6, lo=2000, hi=7000), .035 * g
    if ty == 'burin':   return scratch(d or .8, lo=3500, hi=10000), .03 * g
    if ty == 'burnish': return lp(scratch(d or .7, lo=600, hi=3000), 2500), .04 * g
    if ty == 'brush':   return brush(d or .8), .05 * g
    if ty == 'wash':    return wash(d or 1.4), .06 * g
    if ty == 'stamp':   return thump(1, 110), .09 * g
    if ty == 'thud':    return thump(1, 60), .16 * g
    if ty == 'tap':     return switch(), .03 * g
    if ty == 'drop':    return pop(), .05 * g
    if ty == 'sift':    return sift(d or 2.0), .04 * g
    return rustle(.4), .04 * g

ev = json.load(open(sys.argv[1])); dur = ev['dur']

# Thin the foley: every scene drawing a sound got repetitive. Accents (light, stamp, thud...) may sit
# 3 s apart; textures (brush, nib, paper...) need 7 s of air, and the same sound twice in a row needs 14 s.
ACCENT = {'light', 'stamp', 'thud', 'shimmer', 'sheet', 'cut', 'drop', 'sift'}
kept, last_t, last_by = [e for e in ev['ev'] if e.get('type') in RECORDED], -99.0, {}
for e in sorted(ev['ev'], key=lambda e: e['t']):
    ty = e.get('type')
    if ty in RECORDED: continue
    gap = 3.0 if ty in ACCENT else 7.0
    if e['t'] - last_t < gap or e['t'] - last_by.get(ty, -99.0) < 14.0: continue
    kept.append(e); last_t = e['t']; last_by[ty] = e['t']
ev['ev'] = kept
voice, sr = sf.read(sys.argv[2], dtype='float32'); assert sr == SR
if voice.ndim > 1: voice = voice.mean(1)
n = int((dur + .5) * SR)
voice = np.pad(voice, (0, max(0, n - len(voice))))[:n]
fx = np.zeros((n, 2), np.float32)
for e in ev['ev']:
    x, gain = sound(e)
    add(fx, x.astype(np.float32), e['t'], gain, pan=float(rng.uniform(-.35, .35)))
# duck foley ~6 dB under the voice
from scipy.ndimage import uniform_filter1d
venv = uniform_filter1d(np.abs(voice), int(.25 * SR))
duck = 1 - .7 * np.clip(venv / (np.percentile(venv, 90) + 1e-9), 0, 1)
fx *= duck[:, None]
vpk = np.abs(voice).max()
mix = np.stack([voice, voice], 1) / vpk * .7 + fx * .7
mix = np.stack([limit(mix[:, 0], .85), limit(mix[:, 1], .85)], 1)
sf.write(sys.argv[3], mix, SR)
print('wrote', sys.argv[3], round(n / SR, 2), 's,', len(ev['ev']), 'events kept')
