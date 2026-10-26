"""Soundtrack for the showreel: a pulse, a rising bed, and a hit on every cut.

The picture accelerates to 11.5s, stops dead for one quiet beat, then lands.
The sound does the same thing — the kick doubles through the middle, drops out
entirely under the serif line, and returns once for the mark.

    python3 -m sfx sfx/cues/showreel.py
"""

from sfx.synth import blip, chime, click, envelope, hat, impact, kick, pad, riser, whoosh

TIMELINE = "reels/showreel/showreel.json"
OUT = "public/showreel.wav"
DURATION = 15.0
TARGET_LUFS = -14.0
CEILING_DB = -1.5

# the picture's cuts, verbatim — sound and image share one list or they drift
CUTS = [0.0, 1.5, 3.0, 4.2, 5.7, 7.0, 8.2, 9.5, 10.6, 11.5, 11.9, 13.5]
HARD = {3.0, 9.5, 11.5}  # the three that flash
QUIET = (11.9, 13.5)  # the held beat: nothing percussive here

# A minor — the whole piece sits in it
A2, C3, E3, A3, B3, C4, E4, A4 = 110.0, 130.81, 164.81, 220.0, 246.94, 261.63, 329.63, 440.0


def score(mix, _tl=None):
    put = mix.put

    # --- bed: two chords, swelling into the final beat
    vol = envelope([(0, 0.0), (0.4, 0.5), (9.0, 0.62), (11.5, 0.75), (11.9, 0.3), (13.4, 0.3), (13.9, 0.62), (15, 0.0)])
    bed_l, bed_r = pad(
        15.0,
        [(0.0, [A2, E3, A3]), (7.0, [A2, C3, E3]), (11.9, [A2, E3, B3]), (13.5, [A2, E3, A3, C4])],
        volume=vol,
    )
    mix.put_stereo(0.0, bed_l, bed_r, 0.5)

    # --- pulse: quarter notes at 120bpm, doubling through the busy middle, out on the quiet beat
    step = 0.5
    t = 0.0
    while t < 15.0:
        if QUIET[0] <= t < QUIET[1]:
            t += step
            continue
        put(t, kick(), 0.30 if t < 5.7 else 0.38)
        if 5.7 <= t < 11.5:
            put(t + step / 2, kick(f0=96, f1=40, dur=0.3), 0.18)
        put(t + step / 2, hat(), 0.09)
        t += step

    # --- one hit per cut; the three flashed cuts get an impact under them
    for i, c in enumerate(CUTS):
        if QUIET[0] < c < QUIET[1]:
            continue
        put(max(0.0, c - 0.26), whoosh(0.34, 420, 4200, peak=0.9), 0.3 - 0.012 * i, -0.35 + 0.07 * i)
        if c in HARD:
            put(c, impact(), 0.62)
        elif c > 0:
            put(c, click(freq=2600 + 90 * i, dur=0.05), 0.2)

    # --- the beats that need their own voice
    for k in range(7):  # bars arriving, one note each, climbing
        put(5.72 + k * 0.06, blip(A3 * (1 + 0.12 * k), 0.3, 0.1), 0.17, -0.4 + 0.13 * k)
    for k in range(9):  # the iso stack, settling downward
        put(7.02 + k * 0.05, click(freq=2400 - 120 * k, dur=0.04), 0.14)
    put(8.2, whoosh(1.1, 3000, 300, peak=0.25), 0.26)  # points converging inward

    # --- riser into the burst, which is the loudest moment in the piece
    put(10.6, riser(0.9, 200, 6000), 0.5)
    put(11.5, impact(), 0.85)

    # --- the quiet beat: one bell, then room
    put(12.0, chime([A4, E4, C4], 2.6, 0.9), 0.3)

    # --- the mark
    put(13.5, impact(), 0.5)
    put(13.52, whoosh(0.5, 5000, 500, peak=0.3), 0.26)
    put(13.86, chime([A3, C4, E4, A4], 3.0, 1.2), 0.34)
