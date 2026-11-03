"""Effects for SameSinReel, no music: a low swell for the whisper, a chime for each "Forgiven",
a hollow drop on "stop asking", warm chimes for Jannah and coming back. Every time comes from
src/samesin2/timeline.json.

    python3 -m sfx sfx/cues/samesin2.py      # then: python3 sfx/cues/samesin2_mix.py <vo.mp3>
"""

import re

from sfx.synth import blip, chime, click, pop, scratch, whoosh

TIMELINE = "src/samesin2/timeline.json"
OUT = "public/samesin2/sfx.wav"
TARGET_LUFS = -30.0

# D major, one step brighter each round
ROUND_CHIMES = [
    [587.33, 880.0, 1174.66],
    [659.25, 987.77, 1318.51],
    [739.99, 1108.73, 1479.98],
]


def score(mix, tl):
    lines = {l["key"]: l for l in tl["lines"]}
    n = lambda x: re.sub(r"[^a-z0-9]", "", x.lower())

    def s(k):
        return lines[k]["s"]

    def e(k):
        return lines[k]["e"]

    def w(k, word, nth=0):
        hits = [x["s"] for x in lines[k]["words"] if n(x["t"]).startswith(n(word))]
        return hits[nth]

    put = mix.put
    end = tl["end"]

    # hook: the tally marks scratched on, one stroke at a time
    for i in range(14):
        put(0.1 + i * 0.18, scratch(0.06), 0.05, -0.4)

    # every hop lands with a soft thump
    for r_ in [("h1a", "forgive"), ("h2", "asks"), ("h3", "forgive")]:
        a = w(*r_)
        for k in range(2):
            put(a - 0.1 + (k + 1) * 0.325, pop(160, 80), 0.18, 0.1)
    for a in [w("h2", "again") - 0.75, w("h3", "third") - 0.75, w("h3", "forgiven") + 0.55]:
        for k in range(2):
            put(a + (k + 1) * 0.275, pop(160, 80), 0.16, -0.1)

    # hook: hands lowered
    put(w("hook2", "embarrassed"), whoosh(0.7, 900, 250, peak=0.3), 0.05)

    # the whisper: the room dims, two dark bubbles
    put(s("voice") - 0.2, whoosh(1.2, 220, 120, peak=0.5, q=0.5), 0.08)
    put(w("voice", "what") - 0.1, pop(300, 160), 0.16, 0.3)
    put(w("voice", "done") - 0.15, pop(260, 140), 0.16, 0.3)

    # the door draws on
    put(w("prophet", "exactly") - 0.2, whoosh(1.0, 300, 1800, peak=0.7, q=0.6), 0.06, 0.4)
    put(w("prophet", "exactly") + 0.5, chime([440.0, 659.25, 880.0], dur=1.8, tau=0.7), 0.05, 0.4)

    # three rounds: the sin, the ask, the stamp
    rounds = [
        (w("h1a", "sins"), w("h1a", "forgive"), w("h1b", "forgiven")),
        (w("h2", "again"), w("h2", "asks"), w("h2", "forgiven")),
        (w("h3", "third"), w("h3", "forgive"), w("h3", "forgiven")),
    ]
    for i, (sin, ask, ok) in enumerate(rounds):
        put(sin - 0.05, scratch(0.3), 0.10, -0.3)
        put(ask - 0.1, whoosh(0.5, 500, 1400, peak=0.5), 0.04)
        put(ask, pop(760, 420), 0.12, 0.2)
        put(ok - 0.05, click(1400), 0.16, 0.2)
        put(ok, chime(ROUND_CHIMES[i], dur=1.6, tau=0.6), 0.08, 0.2)
        put(ok, blip(ROUND_CHIMES[i][1] * 2, dur=0.3, tau=0.1), 0.06)

    # the flip: the loop spins, gets its tick; then the dead end
    put(s("flip1") + 0.1, whoosh(0.9, 400, 1600, peak=0.5), 0.05)
    put(e("flip1") - 0.3, blip(1174.66, dur=0.4, tau=0.12), 0.12)
    put(w("flip2", "sin") - 0.05, scratch(0.3), 0.10, -0.3)
    put(w("flip2", "stop") - 0.2, whoosh(1.3, 700, 140, peak=0.3, q=0.5), 0.09)

    # Ibn al-Qayyim: the book, Jannah, running back
    put(s("iq1") + 0.1, pop(620, 330), 0.14, -0.2)
    put(w("iq2", "jannah"), chime([587.33, 880.0, 1174.66, 1760.0], dur=2.2, tau=0.8), 0.07, 0.4)
    put(s("iq1") + 0.3, whoosh(0.5, 1800, 900, peak=0.3), 0.05)  # page turn
    put(w("iq2", "takes") - 0.1, whoosh(1.2, 400, 2200, peak=0.6, q=0.6), 0.04)
    put(w("iq3", "running") - 0.05, whoosh(0.6, 600, 2000, peak=0.5), 0.06, 0.3)
    for k in range(3):
        put(w("iq3", "running") - 0.05 + (k + 1) * 0.183, pop(170, 85), 0.16, 0.2)

    # close: the sin pushed off, then home
    put(w("close", "fighting") - 0.3, scratch(0.3), 0.10, 0.3)
    put(w("close", "fighting") + 0.2, whoosh(0.35, 900, 3000, peak=0.5), 0.08)
    put(w("close", "fighting") + 0.3, pop(500, 200), 0.18, 0.3)
    put(w("close", "coming"), chime([783.99, 987.77, 1174.66], dur=1.8, tau=0.7), 0.07, 0.3)

    # the ayah and the end card
    put(s("ayah") - 0.15, whoosh(1.0, 250, 1200, peak=0.6, q=0.6), 0.05)
    put(end - 0.2, whoosh(0.6, 2600, 700, peak=0.4), 0.06)
    put(end + 0.6, pop(1000, 500), 0.12)
