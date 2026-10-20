"""Sound design for the Ibn al-Qayyim reels. Every time comes from the reel's timeline.

    python3 -m sfx sfx/cues/qayyim.py --timeline reels/qayyim/02-madarij.json --out public/qayyim/02-madarij.wav
"""

from sfx.synth import blip, chime, envelope, impact, pad, whoosh

TIMELINE = "reels/qayyim/00-who.json"
OUT = "public/qayyim/00-who.wav"
TARGET_LUFS = -14.0

# D minor, calm: a Dm9 bed that opens to a bare D5 chord on the book card.
BED_A = [146.83, 220.0, 349.23, 523.25, 659.25]
BED_B = [146.83, 220.0, 293.66, 440.0, 587.33]
CARD_NOTES = [587.33, 698.46, 783.99, 880.0, 1046.5, 1174.66]
MARK_CHORD = [587.33, 880.0, 1174.66]
BOOK_CHORD = [293.66, 440.0, 587.33, 880.0]


def score(mix, tl):
    dur = tl["duration"]
    cards, marks, book = tl["cards"], tl["marks"], tl["book"]
    put = mix.put

    volume = envelope([(0, 0.4), (1.2, 1), (book["in"], 1), (book["in"] + 0.6, 1.2), (dur - 1, 1.2), (dur, 0)])
    mix.put_stereo(0, *pad(dur, [(0, BED_A), (book["in"], BED_B)], volume=volume), gain=0.03)

    put(cards[0]["in"] + 0.05, chime(MARK_CHORD, dur=2.2, tau=0.8), 0.08)
    for i, c in enumerate(cards):
        if i > 0:
            put(c["in"], whoosh(0.32, 500, 2400, peak=0.45), 0.06, -0.2 + 0.08 * i)
            put(c["in"] + 0.45, blip(CARD_NOTES[i % len(CARD_NOTES)], dur=0.5, tau=0.14), 0.1)
        put(c["out"] - 0.45, whoosh(0.4, 2600, 700, peak=0.4), 0.04)

    if tl.get("cadence"):
        # Every card is a new scene: a soft chime as its drawing lights.
        for i, c in enumerate(cards[1:], start=1):
            root = CARD_NOTES[i % len(CARD_NOTES)]
            put(c["in"] + 0.6, chime([root, root * 1.5], dur=1.4, tau=0.5), 0.07, -0.25 + 0.1 * (i % 6))

    for i, m in enumerate(marks):
        if tl["motif"] == "candle" and i < len(marks) - 1:
            # The flame dimming: a low, falling note instead of a bright chord.
            put(m, blip(146.83 - 12 * i, dur=0.9, tau=0.35), 0.16)
        else:
            put(m, chime(MARK_CHORD, dur=1.8, tau=0.6), 0.12, -0.15 + 0.15 * i)

    put(book["in"] - 0.25, whoosh(0.5, 400, 2000, peak=0.7), 0.1)
    put(book["in"], impact(1.4), 0.14)
    put(book["in"] + 0.05, chime(BOOK_CHORD, dur=3.2, tau=1.1), 0.15)
