"""Sound for GiftVideo: light effects under the original narration. No music; his voice carries it.

    python3 -m sfx sfx/cues/gift.py
"""

from sfx.synth import blip, chime, click, pop, scratch, whoosh

TIMELINE = "src/gift/timeline.json"
OUT = "public/gift/sfx.wav"
TARGET_LUFS = -30.0


def score(mix, tl):
    k = {n: v[0] for n, v in tl["key"].items()}
    w = tl["word"]
    end = tl["end"]
    put = mix.put

    # the gifts flick past under the hook, his name lands
    put(0.05, whoosh(0.7, 400, 1800, peak=0.6), 0.07)
    for i in range(int((w["sad1.sa‘d"] - 0.5) / 0.42) + 1):
        put(i * 0.42, pop(760 + (i % 6) * 60, 420, dur=0.1), 0.07, ((i % 3) - 1) * 0.25)
    put(w["sad1.sa‘d"] - 0.1, blip(293.66, dur=0.9, tau=0.35), 0.08)
    put(w["arabs.most"] - 0.05, pop(720, 320), 0.2, -0.15)
    put(k["muslims"] - 0.05, pop(860, 380), 0.2, 0.15)

    # the book
    put(k["dhahabi"] - 0.3, whoosh(0.8, 2200, 500, peak=0.5), 0.08)
    put(k["sad2"], scratch(0.6), 0.04)

    # chief of the Khazraj; the road to Madinah
    put(w["khazraj.chief"] - 0.1, pop(700, 300), 0.2)
    put(k["emigrated"] - 0.1, whoosh(w["madinah.to"] - k["emigrated"] + 0.5, 300, 1600, peak=0.85, q=0.6), 0.07)
    put(w["madinah.to"] + 0.35, chime([587.33, 880.0], dur=1.4, tau=0.5), 0.05)
    put(k["took"], blip(146.83, dur=1.4, tau=0.5), 0.1)

    # ten years tick in, then the days
    for i in range(10):
        put(k["ten"] - 0.1 + i * 0.14, click(2400 + i * 90, dur=0.04), 0.06, (i - 4.5) * 0.08)
    put(w["ten.ten"] - 0.2, pop(520, 240), 0.22)
    put(w["every.every"] - 0.1, whoosh(0.9, 900, 3200, peak=0.5), 0.06)
    put(w["days365.365"] - 0.1, pop(640, 300), 0.18)
    put(k["days3650"] - 0.2, whoosh(1.6, 200, 2400, peak=0.7, q=0.6), 0.08)
    for i in range(14):
        put(k["days3650"] + 0.1 + i * 0.06, click(3000 + (i % 5) * 180, dur=0.03), 0.04, ((i % 5) - 2) * 0.2)
    put(w["days3650.3,650"] + 0.3, blip(220.0, dur=1.0, tau=0.35), 0.1)

    # a gift on nearly every day: a run of soft pops, then the bell
    g0, g1 = k["gift1"], w["gift1.gift"] + 0.4
    n = 22
    for i in range(n):
        put(g0 + (g1 - g0) * i / n, pop(900 + (i % 6) * 70, 500, dur=0.09), 0.05, ((i % 5) - 2) * 0.2)
    put(w["gift1.gift"] + 0.1, chime([587.33, 880.0, 1174.66], dur=1.8, tau=0.7), 0.06)

    # imagine that: dive into one day, then the gifts one after another
    im = k["imagine"]
    put(im - 0.1, whoosh(1.2, 600, 2600, peak=0.6), 0.08)
    put(im + 0.6, chime([440.0, 659.25, 880.0], dur=1.8, tau=0.7), 0.05)
    t, i = im + 0.6, 0
    while t < k["among"] - 0.5:
        put(t, pop(820 + (i % 6) * 70, 400, dur=0.1), 0.12, ((i % 3) - 1) * 0.3)
        t, i = t + 0.36, i + 1

    # the supplication: hands raised, light falls on "enrich me"
    put(k["among"] - 0.3, whoosh(1.0, 2000, 300, peak=0.5), 0.08)
    put(k["karim"], blip(587.33, dur=0.7, tau=0.25), 0.06)
    put(w["enrich1.enrich"] - 0.2, whoosh(1.4, 3000, 400, peak=0.3, q=0.6), 0.07)
    put(w["enrich1.enrich"], chime([587.33, 880.0, 1174.66], dur=2.2, tau=0.9), 0.05)
    put(w["rich.rich"] - 0.05, pop(700, 320), 0.18, -0.2)
    put(w["rich.free"] - 0.05, pop(790, 360), 0.18, 0.2)
    put(k["giving"] - 0.05, pop(880, 400), 0.18, -0.1)
    put(w["giving.giving"] - 0.05, pop(620, 260), 0.24)
    for i in range(7):
        put(w["giving.giving"] + 0.1 + i * 0.09, pop(1100 + i * 60, 700, dur=0.08), 0.05, (i - 3) * 0.25)
    put(w["giving.giving"] + 0.3, chime([440.0, 587.33, 880.0, 1174.66], dur=2.6, tau=1.0), 0.05)

    put(end - 0.1, whoosh(0.6, 2600, 700, peak=0.4), 0.08)
    put(end + 0.9, pop(1000, 500), 0.16)
