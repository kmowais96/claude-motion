"""Movement layer for a voiced Ibn al-Qayyim story reel: air only, no music.

The voiced reels carry a narrator, so this sheet drops the pad, the drums and every
tonal sound the unvoiced stories used. What is left is the air a move makes: a whoosh
into each morph, a click as each pill lands, and one soft impact on the hero moment.
Natural recorded sound (doors, footsteps, wind) is mixed in separately by
scripts/mix-story-audio.py.

    python3 -m sfx sfx/cues/qayyim_story_vo.py --timeline reels/qayyim-stories/01-doorstep.json --out public/qayyim-stories/01-doorstep-moves.wav
"""

from sfx.synth import click, impact, whoosh

TIMELINE = "reels/qayyim-stories/01-doorstep.json"
OUT = "public/qayyim-stories/01-doorstep-moves.wav"
# This layer sits under a voice, so it is mixed by scripts/mix-story-audio.py, not mastered here.
TARGET_LUFS = -30.0
CEILING_DB = -6.0


def score(mix, tl):
    cards, book = tl["cards"], tl["book"]
    put = mix.put

    for i, c in enumerate(cards[1:] + [book], start=1):
        put(c["in"] - 0.32, whoosh(0.6, 500, 3200, peak=0.55), 0.09, -0.3 + 0.12 * (i % 6))
    put(0.05, whoosh(0.9, 300, 1800, peak=0.35), 0.07)

    for c in cards:
        for k, p in enumerate(c.get("pills", [])):
            put(p["at"], click(1500 + 220 * k), 0.16, [-0.4, 0.4, -0.3][k % 3])

    flare_at = tl.get("flareAt")
    if flare_at is not None:
        put(flare_at, impact(1.6), 0.2)
