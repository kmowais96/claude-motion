"""Effects for MannersShort, no music: pops for bubbles and chips, ticks for the score,
a soft clash for rule one. Every time comes from src/manners/timeline.json.

    python3 -m sfx sfx/cues/manners.py      # then: python3 sfx/cues/manners_mix.py
"""

import re

from sfx.synth import blip, chime, click, pop, scratch, whoosh

TIMELINE = "src/manners/timeline.json"
OUT = "public/manners/sfx.wav"
TARGET_LUFS = -30.0

# G major, kept light
SCORE_NOTES = [783.99, 880.0, 987.77, 1174.66, 1318.51]


def score(mix, tl):
    lines = {l["key"]: l for l in tl["lines"]}
    n = lambda x: re.sub(r"[^a-z0-9]", "", x.lower())

    def s(k):
        return lines[k]["s"]

    def e(k):
        return lines[k]["e"]

    def w(k, word):
        return next(x["s"] for x in lines[k]["words"] if n(x["t"]).startswith(n(word)))

    put = mix.put
    end = tl["end"]

    # hook: bubbles already up; the hourglass and the "MY TURN?" tag
    put(0.05, pop(620, 300), 0.12, -0.3)
    put(w("hook2", "wait"), pop(760, 380), 0.16, 0.3)
    put(w("hook2", "turn"), pop(980, 520), 0.2, 0.35)

    # the ring and the number
    put(s("check1") - 0.15, scratch(0.9), 0.10)
    put(w("check1", "1200"), chime([783.99, 1174.66, 1567.98], dur=1.4, tau=0.5), 0.07)

    # the score: one bright tick per rule
    for i, k in enumerate(["r1", "r2", "r3a", "r4a", "r5"]):
        put(s(k), blip(SCORE_NOTES[i], dur=0.35, tau=0.1), 0.16)
        put(s(k), click(2200), 0.12)

    # rule 1: two voices clash, then turns
    put(s("r1") - 0.1, pop(700, 300), 0.16, -0.4)
    put(s("r1") + 0.05, pop(640, 280), 0.16, 0.4)
    put(w("r1", "talk") + 0.9, whoosh(0.5, 2400, 700, peak=0.4), 0.06)

    # rule 2: the question, the jump-in, the cross, the answer
    put(s("r2") + 0.1, pop(820, 420), 0.14, -0.4)
    put(s("r2") + 0.25, whoosh(0.6, 600, 2200, peak=0.6), 0.05, 0.3)
    put(w("r2", "else"), pop(1100, 600), 0.18)
    put(w("r2", "dont"), scratch(0.35), 0.14)
    put(e("r2") - 0.4, pop(700, 350), 0.14, 0.45)

    # rule 3: the book, the stop sign, the bulb, humility
    put(s("r3a") + 0.1, pop(660, 330), 0.14, 0.3)
    put(w("r3b", "cut"), pop(420, 180), 0.24)
    put(w("r3c", "see"), blip(1567.98, dur=0.5, tau=0.15), 0.12, -0.3)
    put(w("r3c", "already"), scratch(0.35), 0.14, -0.3)
    put(e("r3c"), chime([587.33, 880.0, 1174.66], dur=1.6, tau=0.6), 0.07)

    # rule 4: scales tip, the heart, the doorway, the trophy crossed out
    put(w("r4a", "win") - 0.05, click(1400), 0.16)
    put(w("r4a", "win") + 0.1, whoosh(0.5, 900, 300, peak=0.3), 0.06)
    put(w("r4a", "gentle"), pop(880, 520), 0.14)
    put(w("r4b", "graceful") - 0.1, whoosh(0.9, 300, 1800, peak=0.7, q=0.6), 0.06)
    put(w("r4b", "way"), pop(980, 600), 0.14)
    put(w("r4c", "flex") - 0.1, pop(1200, 700), 0.14, -0.3)
    put(w("r4c", "flex") + 0.15, scratch(0.35), 0.14, -0.3)

    # rule 5: the ear, the equal sign
    put(s("r5") + 0.2, whoosh(0.7, 300, 1600, peak=0.6), 0.06)
    put(w("r5", "speak") - 0.2, pop(760, 380), 0.14, -0.3)
    put(w("r5", "speak") + 0.1, click(1800), 0.14)

    # close and end card
    put(w("close", "then"), chime([783.99, 987.77, 1174.66], dur=1.8, tau=0.7), 0.07)
    put(end - 0.2, whoosh(0.6, 2600, 700, peak=0.4), 0.07)
    put(end + 0.6, pop(1000, 500), 0.14)
