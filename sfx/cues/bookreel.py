"""Sound bed for any BookReel: air on every cut, one low swell at the turn, room tone.

No instruments and no bells: only filtered noise and a low thump. The narration is
mixed on top by scripts/bookreel.py, which also sets the final loudness.

    python3 -m sfx sfx/cues/bookreel.py --timeline public/bookreel/<id>/timeline.json --out out/<id>-sfx.wav
"""

from sfx.synth import bandnoise, envelope, impact, whoosh, SR

TARGET_LUFS = -33.0


def score(mix, tl):
    dur = tl["duration"]
    scenes = tl["scenes"]

    # room tone, so the gaps between sentences are never digital silence
    n = int(dur * SR)
    tone = bandnoise(n, lambda k: 420, q=0.5)
    vol = envelope([(0, 0), (0.4, 1), (dur - 0.8, 1), (dur, 0)])
    mix.put(0, [tone[k] * vol(k / SR) for k in range(n)], 0.05)

    for i, s in enumerate(scenes[1:], start=1):
        if s["turn"]:
            continue
        up = i % 2 == 0
        mix.put(s["start"] - 0.14, whoosh(0.34, 380 if up else 1500, 1500 if up else 380, peak=0.45), 0.34, -0.25 if up else 0.25)

    turn = tl["turn"]
    mix.put(turn - 0.5, whoosh(0.9, 180, 900, peak=0.62, q=0.7), 0.5)
    mix.put(turn, impact(1.4), 0.42)

    mix.put(tl["endAt"] - 0.2, whoosh(0.7, 900, 240, peak=0.3, q=0.7), 0.4)
