"""Sound design for the Ibn al-Qayyim story reels. Every time comes from the reel's timeline.

A music bed (pad + soft kick and hats at 80 BPM, four beats per 3 s scene) under synced effects:
a whoosh into every morph, a sparkle as each shape lands, pops for the pills, one riser into
the flare, and a chime on the end card. The light interlude drops the drums for a breath.

    python3 -m sfx sfx/cues/qayyim_story.py --timeline reels/qayyim-stories/01-doorstep.json --out public/qayyim-stories/01-doorstep.wav
"""

from sfx.synth import blip, chime, envelope, hat, impact, kick, pad, pop, riser, whoosh

TIMELINE = "reels/qayyim-stories/01-doorstep.json"
OUT = "public/qayyim-stories/01-doorstep.wav"
TARGET_LUFS = -14.0
# Kicks and hats overshoot more in AAC than the other cue sheets; leave extra headroom.
CEILING_DB = -3.0

# D minor: i - VI - III - VII, one chord per scene, resolving to D on the end card.
CHORDS = [
    [146.83, 220.0, 349.23, 523.25, 659.25],  # Dm9
    [116.54, 233.08, 293.66, 440.0, 587.33],  # Bbmaj7
    [174.61, 261.63, 349.23, 440.0, 659.25],  # Fmaj7
    [130.81, 196.0, 293.66, 392.0, 587.33],  # Cadd9
]
END_CHORD = [146.83, 220.0, 293.66, 440.0, 587.33]
SPARKLE = [1174.66, 1396.91, 1567.98, 1760.0, 2093.0, 2349.32]
BEAT = 0.75


def score(mix, tl):
    dur = tl["duration"]
    cards, book = tl["cards"], tl["book"]
    put = mix.put
    pills = next((c for c in cards if c.get("pills")), None)
    flare = next((c for c in cards if c.get("flare")), None)

    chords = [(c["in"], CHORDS[i % len(CHORDS)]) for i, c in enumerate(cards)] + [(book["in"], END_CHORD)]
    volume = envelope([(0, 0.5), (1.5, 1), (book["in"], 1), (book["in"] + 0.5, 1.25), (dur - 1, 1.25), (dur, 0)])
    mix.put_stereo(0, *pad(dur, chords, volume=volume), gain=0.034)

    # Drums from the second scene to the end card, out during the pill interlude.
    t = cards[1]["in"]
    i = 0
    while t < book["in"] - 0.05:
        quiet = pills and pills["in"] - 0.1 <= t < pills["out"]
        if not quiet:
            put(t, kick(), 0.2 if i % 4 == 0 else 0.13)
            put(t + BEAT / 2, hat(), 0.05, 0.3 if i % 2 else -0.3)
        t += BEAT
        i += 1

    # Every morph: air in, a sparkle as it lands.
    for i, c in enumerate(cards[1:] + [book], start=1):
        put(c["in"] - 0.32, whoosh(0.6, 500, 3200, peak=0.55), 0.09, -0.3 + 0.12 * (i % 6))
        if not c.get("pills"):
            put(c["in"] + 0.42, blip(SPARKLE[i % len(SPARKLE)], dur=0.6, tau=0.18), 0.07, 0.2 - 0.08 * (i % 5))
    put(0.05, blip(SPARKLE[0], dur=0.9, tau=0.3), 0.08)

    if pills:
        for k in range(len(pills["pills"])):
            put(pills["in"] + 0.2 + k * 0.7, pop(700 + 160 * k, 320 + 60 * k), 0.24, [-0.4, 0.4, -0.3][k % 3])

    if flare:
        hit = flare["in"] + 0.35
        put(hit - 2.2, riser(2.2), 0.09)
        put(hit, impact(1.6), 0.24)
        put(hit + 0.02, chime(CHORDS[0][1:], dur=2.6, tau=0.9), 0.1)

    put(book["in"] + 0.3, chime(END_CHORD[1:], dur=3.0, tau=1.1), 0.13)
