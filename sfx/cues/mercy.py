"""Sound design for MercyVideo: a pad bed plus effects, placed under the voiceover.

    python3 -m sfx sfx/cues/mercy.py

Renders effects only (no voice) to public/mercy/sfx.wav, mastered low so the
voice sits on top when the two are mixed with ffmpeg.
"""

from sfx.synth import blip, chime, click, envelope, impact, pad, pop, riser, scratch, whoosh

TIMELINE = "src/mercy/timeline.json"
OUT = "public/mercy/sfx.wav"
TARGET_LUFS = -24.0

# D minor through the weight of sin, warming to Bb and F at forgiveness, D major at the end.
DM = [146.83, 220.0, 293.66, 349.23, 440.0]
BB = [116.54, 233.08, 293.66, 349.23, 440.0]
FA = [174.61, 261.63, 349.23, 392.0, 440.0]
GM = [196.0, 233.08, 293.66, 392.0]
DMAJ = [146.83, 220.0, 293.66, 369.99, 440.0, 587.33]
CHIME = [587.33, 880.0, 1174.66]
CHIME_HI = [880.0, 1174.66, 1760.0]


def score(mix, tl):
    h, sc, g, sk, f, w, d, e, tw, fi, end = (tl[k] for k in ("hook", "scale", "globe", "sky", "forgive", "weight", "door", "earth", "twice", "finale", "end"))
    dur = tl["duration"]
    put = mix.put

    volume = envelope([
        (0, 0.5), (1.5, 1), (fi["allahs"] - 1.5, 1), (fi["allahs"], 1.35), (dur - 1.0, 1.35), (dur, 0),
    ])
    chords = [(0, DM), (f["asked"], BB), (d["oh"], FA), (e["oh"], DM), (tw["always"], GM), (fi["allahs"] - 0.3, DMAJ)]
    mix.put_stereo(0, *pad(dur, chords, volume=volume), gain=0.05)

    # hook: the sins gather, "how big?"
    put(h["gather"], whoosh(1.3, 250, 1600, peak=0.7), 0.16)
    put(h["sins"] + 0.2, blip(73.4, dur=0.8, tau=0.3), 0.3)
    put(h["howBig"], pop(900, 380), 0.3, 0.2)

    # scale: each "bigger" pops a little higher while the camera pulls back
    put(sc["imagine"] - 0.15, whoosh(0.5, 2600, 600, peak=0.5), 0.12)
    put(sc["cup"], blip(587.33, dur=0.5), 0.12, -0.2)
    put(sc["mountain"], scratch(0.9), 0.1)
    put(sc["city"], whoosh(0.6, 400, 2200, peak=0.4), 0.1)
    for i, at in enumerate((sc["big1"], sc["big2"], sc["still"])):
        put(at - 0.1, whoosh(0.55, 3000, 500, peak=0.4), 0.12)
        put(at, pop(800 + i * 160, 360 + i * 70), 0.3, (i - 1) * 0.3)

    # globe: Allah is greater than all of that
    put(g["allah"] - 0.6, whoosh(1.4, 180, 900, peak=0.6, q=0.6), 0.2)
    put(g["greater"], pop(1000, 420), 0.32)
    put(g["all"], chime(CHIME, dur=1.8, tau=0.7), 0.08)

    # sky: four slammed sins, the stack climbs to the clouds
    put(sk["said"] - 0.1, whoosh(0.7, 3000, 400, peak=0.4), 0.14)
    put(sk["clouds"], pop(900, 420), 0.28, -0.2)
    for i, at in enumerate(sk["sins"]):
        put(at + 0.05, blip(65.4 + i * 4, dur=0.5, tau=0.14), 0.55, (i % 2 - 0.5) * 0.3)
        put(at + 0.05, click(700 - i * 60, dur=0.06), 0.25)
    put(sk["piled"] - 0.1, riser(sk["heavens"] + 0.7 - sk["piled"], 200, 2600), 0.14)
    put(sk["heavens"] + 0.6, whoosh(1.0, 1600, 5000, peak=0.2, q=0.5), 0.1)

    # forgiveness: the stack dissolves into light
    put(f["asked"], whoosh(1.4, 2400, 7000, peak=0.5, q=0.5), 0.12)
    put(f["forgive"], chime(CHIME, dur=2.2, tau=0.9), 0.14)
    put(f["mind"], blip(440.0, dur=0.7, tau=0.25), 0.1)
    put(f["mind2"], chime(CHIME_HI, dur=2.4, tau=1.0), 0.14)

    # weight: drops, pulls, snaps
    put(w["this"] - 0.05, whoosh(0.45, 2000, 300, peak=0.75), 0.16)
    put(w["this"] + 0.3, blip(55.0, dur=0.7, tau=0.2), 0.5)
    put(w["down"], blip(49.0, dur=0.6, tau=0.18), 0.4)
    put(w["forgiveIt"] - 0.02, click(2400), 0.28)
    put(w["forgiveIt"], whoosh(0.8, 5000, 900, peak=0.1), 0.16)
    put(w["forgiveIt"] + 0.02, chime(CHIME, dur=2.0, tau=0.8), 0.16)

    # door: arch draws on, ripples, opens to light
    put(d["oh"], scratch(1.1), 0.1)
    put(d["call"], blip(698.46, dur=0.9, tau=0.35), 0.12, -0.2)
    put(d["hope"], blip(880.0, dur=0.9, tau=0.35), 0.12, 0.2)
    put(d["forgive"] - 0.1, whoosh(1.1, 300, 3200, peak=0.7, q=0.6), 0.16)
    put(d["forgive"] + 0.15, chime([698.46, 1046.5, 1396.9], dur=2.2, tau=0.9), 0.15)

    # earth: dark spots spread, then a golden wash
    for k in range(10):
        put(e["sins"] + k * 0.16, click(1400 - k * 60, dur=0.03), 0.07, (k % 3 - 1) * 0.4)
    put(e["earth"], pop(850, 380), 0.3, 0.2)
    put(e["forgiveness"] - 0.3, whoosh(1.6, 300, 4000, peak=0.7, q=0.6), 0.14)
    put(e["forgiveness"] + 0.2, chime(CHIME_HI, dur=2.4, tau=1.0), 0.12)

    # twice: the two wins, one struck out
    put(tw["shaitan"] - 0.1, whoosh(0.45, 600, 2800, peak=0.4), 0.1)
    put(tw["once1"], click(1200), 0.16, -0.3)
    put(tw["once1"], blip(146.83, dur=0.5, tau=0.15), 0.25)
    put(tw["once2"], click(1300), 0.16, 0.3)
    put(tw["once2"], blip(130.81, dur=0.5, tau=0.15), 0.25)
    put(tw["end"] - 0.1, scratch(0.5), 0.14)
    put(tw["end"] + 0.15, pop(1100, 450), 0.3)

    # finale: one riser into one impact on "is greater"
    put(tw["end"] + 0.6, riser(fi["greater"] - tw["end"] - 0.6, 220, 4200), 0.16)
    put(fi["allahs"] - 0.3, whoosh(1.0, 200, 2400, peak=0.8, q=0.6), 0.12)
    put(fi["greater"] - 0.01, impact(), 0.36)
    put(fi["greater"], chime([587.33, 880.0, 1174.66, 1479.98], dur=2.6, tau=1.1), 0.12)

    # end card
    put(end["follow"] - 0.2, whoosh(0.6, 2600, 700, peak=0.4), 0.1)
    put(end["guide"], pop(1000, 500), 0.22)
    put(end["reminders"] + 0.3, blip(880.0, dur=0.6, tau=0.2), 0.08)
