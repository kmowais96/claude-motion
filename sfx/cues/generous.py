"""Sound for GenerousVideo: light effects under the original narration. No music; his voice carries it.

    python3 -m sfx sfx/cues/generous.py
"""

from sfx.synth import blip, chime, pop, riser, whoosh

TIMELINE = "src/generous/timeline.json"
OUT = "public/generous/sfx.wav"
TARGET_LUFS = -30.0

FIRST4 = ["mention.need", "another.another", "second.second", "third.third"]


def score(mix, tl):
    k = {n: v[0] for n, v in tl["key"].items()}
    w = tl["word"]
    end = tl["end"]
    put = mix.put

    # each need pops up, then everything at once
    for i, n in enumerate(FIRST4):
        put(w[n] - 0.05, pop(700 + i * 110, 340), 0.2, (-0.3, 0.3, -0.3, 0.3)[i])
    ev = w["lord.everything"]
    for i in range(10):
        put(ev + 0.05 * i, pop(900 + (i % 5) * 120, 420, dur=0.12), 0.1, ((i % 5) - 2) * 0.2)
    put(k["generous"] - 0.3, whoosh(0.8, 500, 2400, peak=0.6), 0.08)
    put(w["generous.most"], chime([587.33, 880.0, 1174.66], dur=1.6, tau=0.6), 0.06)

    put(k["hand"] - 0.5, whoosh(1.0, 2600, 500, peak=0.5), 0.08)
    put(w["hand.pours"] - 0.3, whoosh(1.4, 300, 2200, peak=0.7, q=0.6), 0.08)
    put(w["nightday.night"], blip(293.66, dur=0.8, tau=0.3), 0.08)
    put(w["nightday.day"], blip(440.0, dur=0.8, tau=0.3), 0.08)

    put(k["drain"] - 0.3, whoosh(0.7, 2200, 600, peak=0.5), 0.08)
    put(w["never.never"] - 0.05, pop(620, 240), 0.22)

    put(k["servants"] - 0.3, whoosh(0.9, 1800, 300, peak=0.5), 0.08)
    put(w["stood.stood"] - 0.1, whoosh(1.8, 200, 1400, peak=0.6, q=0.6), 0.08)
    for i in range(8):
        put(k["asked"] + 0.11 * i, pop(1000 + (i % 4) * 140, 600, dur=0.1), 0.06, ((i % 4) - 1.5) * 0.3)
    put(w["gave.every"] - 1.2, riser(1.2, 300, 3000), 0.06)
    put(w["gave.every"], chime([880.0, 1174.66, 1760.0], dur=2.0, tau=0.8), 0.07)

    put(w["decrease.in"] - 0.05, blip(146.83, dur=1.4, tau=0.5), 0.14)
    put(end - 0.1, whoosh(0.6, 2600, 700, peak=0.4), 0.08)
    put(end + 0.9, pop(1000, 500), 0.16)
