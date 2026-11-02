"""Sound for SabireenShort: narration, a small room, and effects. No music.

    python3 -m sfx sfx/cues/sabireen.py

Every time comes from src/sabireen/timeline.json.
"""

import math
import random
import wave
from array import array

from sfx.synth import blip, chime, click, impact, pop, riser, scratch, whoosh

TIMELINE = "src/sabireen/timeline.json"
OUT = "public/sabireen-mix.wav"
TARGET_LUFS = -14.0
SR = 48000

# A minor: teal notes for the "-ūna" pattern, gold notes for the break.
TEAL = [440.0, 523.25, 659.25]
GOLD = [880.0, 1108.73, 1318.5]


def load_voice(path):
    with wave.open(path) as w:
        assert w.getframerate() == SR and w.getnchannels() == 1 and w.getsampwidth() == 2
        raw = array("h", w.readframes(w.getnframes()))
    return [s / 32768.0 for s in raw]


def room(x, gain=0.11, length=0.32):
    """Short diffuse tail: a few decaying taps, so the voice isn't bone dry."""
    rng = random.Random(7)
    taps = [(int(SR * rng.uniform(0.012, length)), 0.0) for _ in range(14)]
    taps = [(d, math.exp(-d / (SR * length * 0.45)) * rng.uniform(0.4, 1.0)) for d, _ in taps]
    out = list(x) + [0.0] * int(SR * length)
    for d, g in taps:
        g *= gain
        for i, s in enumerate(x):
            if s:
                out[i + d] += s * g
    return out


def score(mix, tl):
    put = mix.put
    s1, s2, s3, s4, hero, s5, s6, s7, end = (
        tl["s1"], tl["s2"], tl["s3"], tl["s4"], tl["hero"]["saabireen"],
        tl["s5"], tl["s6"], tl["s7"], tl["end"],
    )

    # narration (already tempo-adjusted and offset by its lead-in in the wav)
    voice = room(load_voice("public/" + tl["voice"]["file"]))
    put(0, voice, 1.0)

    # a faint noise floor: a perfectly silent background is a TTS giveaway
    rng = random.Random(3)
    n = int(SR * tl["duration"])
    floor, prev = [], 0.0
    for _ in range(n):
        prev = prev * 0.97 + rng.uniform(-1, 1) * 0.03
        floor.append(prev)
    put(0, floor, 0.012)

    # 1 · hook: the grid pulses, one cell breaks
    for i in range(int(s1["break"] * 2)):
        put(0.1 + i * 0.5, click(2400 - (i % 2) * 400, 0.04), 0.05, -0.3 + 0.6 * (i % 2))
    put(s1["break"], pop(500, 1100), 0.22)
    put(s1["break"] + 0.02, chime(GOLD, dur=1.6, tau=0.5), 0.07)
    put(s1["purpose"], whoosh(0.35, 600, 2600, peak=0.4), 0.07)

    # 2 · the rule
    put(s2["start"], whoosh(0.5, 1800, 400, peak=0.5), 0.07)
    for i, f in enumerate(TEAL):
        put(s2["words"] + i * 0.25, blip(f, dur=0.3, tau=0.09), 0.1, -0.2 + 0.2 * i)
    put(s2["uniform"], chime(TEAL, dur=1.4, tau=0.5), 0.06)

    # 3 · the verse
    put(s3["start"], whoosh(0.5, 400, 1800, peak=0.5), 0.07)
    for i in range(3):
        put(s3["list"] + i * 0.35, click(1800, 0.05), 0.07, -0.2 + 0.2 * i)
    put(s3["promise"], whoosh(0.45, 500, 2200, peak=0.4), 0.07)
    put(s3["ending"], pop(700, 1000), 0.16)
    put(s3["ending"] + 0.05, blip(TEAL[2], dur=0.35, tau=0.1), 0.1)

    # 4 · expectation, then the break (the one hero moment)
    put(s4["expect"], scratch(0.7), 0.05)
    put(s4["saabiroon"], blip(TEAL[0], dur=0.4, tau=0.12), 0.1)
    for i in range(3):
        put(s4["notIt"] + i * 0.07, click(900, 0.04), 0.08)
    put(s4["notIt"] + 0.2, riser(hero - s4["notIt"] - 0.2, 220, 3200), 0.05)
    put(hero, impact(1.4), 0.5)
    put(hero + 0.02, chime(GOLD, dur=2.4, tau=0.9), 0.1)

    # 5 · not a mistake
    put(s5["start"], whoosh(0.5, 1600, 400, peak=0.5), 0.06)
    put(s5["sibawayh"], scratch(0.6), 0.05)
    put(s5["praise"], chime(GOLD, dur=1.6, tau=0.6), 0.07)
    rail_stop = s5["stop"] + 1.1
    t = s5["stop"] + 0.1
    while t < rail_stop - 0.05:
        put(t, click(2200, 0.035), 0.05, 0.4)
        t += 150 / 420
    put(rail_stop, pop(600, 1200), 0.18)
    put(s5["asif"], whoosh(0.5, 400, 1600, peak=0.5), 0.06)
    put(s5["patient"], blip(GOLD[0], dur=0.5, tau=0.15), 0.08)

    # 6 · why the patient
    put(s6["start"], whoosh(0.5, 1600, 400, peak=0.5), 0.06)
    put(s6["kathir"], scratch(0.8), 0.05)
    for i, k in enumerate(["money", "sick", "battle"]):
        put(s6[k], pop(420 + 120 * i, 820 + 160 * i), 0.15, -0.25 + 0.25 * i)

    # 7 · close
    put(s7["start"], whoosh(0.8, 300, 1200, peak=0.6), 0.06)
    put(s7["rhythm"], whoosh(0.4, 600, 2400, peak=0.4), 0.05)
    put(s7["you"], chime(GOLD, dur=2.6, tau=1.0), 0.11)

    # end card
    put(end["start"], whoosh(0.6, 1800, 500, peak=0.5), 0.05)
    put(end["start"] + 0.3, blip(TEAL[0], dur=0.5, tau=0.18), 0.06)
