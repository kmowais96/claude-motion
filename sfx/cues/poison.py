"""Effects for PoisonReel, no music: a rattle and low hit on the poison, tally scratches for the habit,
a chime that rises one step for each coin given, a hollow drop on "Lying", the lamps going out.
Every time comes from src/poison/timeline.json.

    python3 -m sfx sfx/cues/poison.py      # then: python3 sfx/cues/poison_mix.py
"""

import re

from sfx.synth import blip, chime, click, impact, pop, scratch, whoosh

TIMELINE = "src/poison/timeline.json"
OUT = "public/poison/sfx.wav"
TARGET_LUFS = -30.0

GIFT_CHIMES = [
    [587.33, 880.0, 1174.66],
    [659.25, 987.77, 1318.51],
    [739.99, 1108.73, 1479.98],
    [783.99, 1174.66, 1567.98],
]


def score(mix, tl):
    lines = {l["key"]: l for l in tl["lines"]}
    n = lambda x: re.sub(r"[^a-z0-9]", "", x.lower())
    s = lambda k: lines[k]["s"]

    def w(k, word, nth=0):
        return [x["s"] for x in lines[k]["words"] if n(x["t"]).startswith(n(word))][nth]

    put = mix.put
    end = tl["end"]

    # hook: the bottle rattles on "one thing" and hits on "deadly poison"
    put(0.0, pop(420, 260), 0.10, 0.3)
    put(w("hook1", "one") - 0.05, click(900), 0.10, 0.3)
    put(w("hook2", "more") - 0.35, pop(160, 80), 0.16, -0.2)  # father hops in
    put(w("hook2", "more"), pop(160, 80), 0.16, -0.2)
    put(w("hook2", "poison") - 0.05, impact(1.0), 0.10)

    # his rule: pan across, the tally scratched on, stroke by stroke
    put(s("rule1") - 0.2, whoosh(0.9, 300, 1400, peak=0.5), 0.05)
    a = w("rule2", "used") - 0.6
    for i in range(16):
        put(a + i * 0.135, scratch(0.05), 0.045, -0.4)
    put(w("rule3", "settle"), whoosh(1.4, 200, 600, peak=0.5, q=0.5), 0.05, -0.3)
    put(w("rule4", "who") - 0.05, pop(300, 150), 0.14, -0.3)

    # giving: coin to the hand, then each gift lands in the bowl a step higher
    put(s("give1") - 0.2, whoosh(1.2, 300, 1500, peak=0.5), 0.05)
    put(w("give1", "hand") - 0.1, blip(1760, dur=0.25, tau=0.08), 0.08)
    gifts = [w("give2", "give"), w("give2", "again"), w("give2", "again", 1)]
    for i, g in enumerate(gifts):
        put(g + 0.15, whoosh(0.4, 900, 2400, peak=0.5), 0.04, 0.3)
        put(g + 0.6, click(2200), 0.12, 0.4)
        put(g + 0.6, chime(GIFT_CHIMES[i], dur=1.6, tau=0.6), 0.08, 0.4)
    put(w("give3", "sweetness") - 0.1, chime([587.33, 880.0, 1174.66, 1760.0], dur=2.4, tau=0.9), 0.07)

    # the poison: night falls, the rattle, the hollow drop on "Lying"
    put(s("lie1") - 0.5, whoosh(1.4, 220, 110, peak=0.5, q=0.5), 0.09)
    put(w("lie1", "poison"), click(700), 0.10, 0.3)
    put(w("lie1", "lying") - 0.05, impact(1.4), 0.14)
    put(w("lie1", "lying") + 0.05, pop(300, 160), 0.14, 0.3)
    put(w("lie1", "lying") - 0.05, scratch(0.3), 0.09, -0.3)
    put(s("lie2") + 0.45, whoosh(0.9, 400, 1200, peak=0.6), 0.05, 0.2)  # the bottle lifted away
    put(s("lie2") + 1.35, pop(220, 120), 0.14, 0.2)

    # once it is easy: red tallies, fast; then the two lamps go out
    a = w("lie3", "easy") - 0.5
    for i in range(20):
        put(a + i * 0.07, scratch(0.04), 0.04, -0.2)
    put(s("lie3") - 0.1, pop(500, 300), 0.10, -0.2)
    put(w("lie3", "world") - 0.05, whoosh(0.8, 900, 140, peak=0.2, q=0.5), 0.10, -0.2)
    put(w("lie3", "world"), impact(0.9), 0.08, -0.2)
    put(w("lie3", "next") - 0.05, whoosh(0.8, 900, 140, peak=0.2, q=0.5), 0.10, 0.2)
    put(w("lie3", "next"), impact(1.2), 0.10, 0.2)

    # tomorrow: morning, the hops back to the gate, the last coin
    put(s("end1") - 0.2, whoosh(1.2, 250, 1600, peak=0.6, q=0.6), 0.05)
    for k in range(4):
        put(s("end1") - 0.1 + (k + 1) * 0.275, pop(170, 85), 0.14, 0.2)
    g = w("end1", "give")
    put(g + 0.3, click(2200), 0.12, 0.4)
    put(g + 0.3, chime(GIFT_CHIMES[3], dur=1.8, tau=0.7), 0.09, 0.4)

    # end card
    put(end - 0.2, whoosh(0.6, 2600, 700, peak=0.4), 0.06)
    put(end + 0.6, pop(1000, 500), 0.12)
