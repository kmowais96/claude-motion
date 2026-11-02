"""Sound for the five-corrupters Short. Voice plus light effects, no music.

    python3 -m sfx sfx/cues/corrupters.py

The voice is pre-treated (small room, -52 dB pink floor) into public/corrupters-vo.wav.
Every effect time comes from src/corrupters/timeline.json.
"""

import random
import wave

from sfx.synth import blip, chime, click, impact, pop, riser, whoosh

TIMELINE = "src/corrupters/timeline.json"
OUT = "public/corrupters-mix.wav"
TARGET_LUFS = -24.0  # gentle here; final loudness is set by ffmpeg loudnorm at mux

D = [146.83, 220.0, 293.66, 369.99, 440.0, 587.33, 739.99, 880.0]


def load_voice(path):
    with wave.open(path) as w:
        raw = w.readframes(w.getnframes())
    import array
    a = array.array("h", raw)
    return [s / 32768.0 for s in a]


def score(mix, tl):
    P = [(p["t0"], p["t1"]) for p in tl["phrases"]]
    put = mix.put
    W = 0.5
    scenes = {
        "intro": P[2][0] - 0.15, "c1": P[3][0] - 0.4, "c2": P[8][0] - 0.4, "c3": P[11][0] - 0.4,
        "c4": P[14][0] - 0.4, "c5": P[17][0] - 0.4, "recap": P[19][0] - 0.45, "end": P[21][1] + 1.4,
    }

    put(0.0, load_voice("public/corrupters-vo.wav"), 1.0)

    # wipes: a panel rising
    for s in scenes.values():
        put(s - 0.05, whoosh(W + 0.15, 300, 2200, peak=0.55), 0.10)

    # hook
    put(0.15, chime([293.66, 440.0, 587.33], dur=2.2, tau=0.9), 0.05)
    put(P[1][0] + 0.25, blip(587.33, dur=0.5, tau=0.18), 0.10)

    # intro: stripes slide in
    for i in range(7):
        put(scenes["intro"] + 0.3 + i * 0.07, pop(500 + i * 90, 260 + i * 40, dur=0.12), 0.10, (-1) ** i * 0.3)

    # 1: crowd pops in, smoke, the good ones light up
    for j in range(20):
        put(P[3][0] + 0.2 + random.Random(j).random() * 0.7, pop(700, 380, dur=0.1), 0.05, random.uniform(-0.5, 0.5))
    put(P[4][0] + 0.1, whoosh(2.6, 900, 180, peak=0.5, q=0.6), 0.09)
    for i in range(5):
        put(P[6][0] + 0.05 + i * 0.06, blip(D[3 + i % 4] * 2, dur=0.4, tau=0.12), 0.06, -0.4 + i * 0.2)
    put(P[7][0] + 0.05, whoosh(0.7, 1800, 500, peak=0.3), 0.06)

    # 2: bubbles rise, then pop
    for i in range(4):
        put(P[8][0] + 0.35 + i * 0.22, pop(420 + i * 120, 900 + i * 160, dur=0.14), 0.12, 0.3)
        put(P[10][0] + 0.35 + i * 0.4, pop(2400, 900, dur=0.07), 0.16, 0.3)
        put(P[10][0] + 0.35 + i * 0.4, click(3200), 0.08, 0.3)

    # 3: hero. shapes, the pull, the snap
    snap = P[13][0] + 0.05
    for i in range(4):
        put(P[11][0] + 0.1 + i * 0.12, pop(380 + i * 60, 200, dur=0.14), 0.12, -0.5 + i * 0.33)
    put(P[11][0] + 0.2, blip(440.0, dur=0.6, tau=0.2), 0.08)
    put(P[12][0], riser(snap - P[12][0], f0=200, f1=2400), 0.07)
    put(snap, impact(1.6), 0.35)
    put(snap, click(2600, dur=0.04), 0.3)
    put(snap + 0.02, click(1900, dur=0.04), 0.25, 0.4)
    put(snap + 0.05, whoosh(1.0, 2600, 300, peak=0.2), 0.10)

    # 4: food drops onto the plate, then spills
    eat, drink, sleep = tl["food"]
    rows = [6, 5, 4, 3, 2, 1]
    idx = 0
    for r, n in enumerate(rows):
        for c in range(n):
            i = idx
            idx += 1
            a, b = (eat, drink) if r < 2 else (drink, sleep) if r < 4 else (sleep, P[15][1])
            count, first = (11, 0) if r < 2 else (7, 11) if r < 4 else (3, 18)
            ti = a + 0.05 + ((i - first) / count) * (b - a) * 0.8
            put(ti + 0.12, blip(196.0 + r * 30, dur=0.12, tau=0.04), 0.10, (c - n / 2) * 0.1)
    lose = P[16][0]
    put(lose, whoosh(0.8, 1400, 200, peak=0.3), 0.12)
    for k in range(10):
        put(lose + 0.1 + k * 0.05, click(900 + 120 * k, dur=0.04), 0.06, random.uniform(-0.7, 0.7))

    # 5: the clock ticks, then races
    t = scenes["c5"] + 0.4
    while t < P[18][1] + 0.4:
        fast = max(0.0, t - P[18][0])
        put(t, click(2200, dur=0.03), 0.07, 0.15)
        t += max(0.07, 0.5 / (1 + 3.2 * fast * fast))

    # recap
    for i in range(5):
        put(scenes["recap"] + 0.5 + i * 0.13, pop(600 + i * 110, 300 + i * 50, dur=0.12), 0.08)
    put(P[20][0] + 0.1, blip(146.83, dur=0.7, tau=0.25), 0.18)
    put(P[21][0] + 0.05, chime([293.66, 369.99, 440.0, 587.33], dur=2.8, tau=1.1), 0.12)

    # end card
    put(scenes["end"] + 0.3, chime([587.33, 880.0], dur=2.0, tau=0.8), 0.05)
