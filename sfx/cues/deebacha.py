"""Sound design for DeebachaVideo: quiet effects under narration, no music.
Every time comes from src/deebacha/timeline.json (sentence starts, "part:idx").

    python3 -m sfx sfx/cues/deebacha.py
"""

from sfx.synth import blip, chime, click, impact, pop, scratch, whoosh

TIMELINE = "src/deebacha/timeline.json"
OUT = "public/deebacha-sfx.wav"
TARGET_LUFS = -14.0

# Scene openings (first sentence of each scene), same list as DeebachaVideo.
SCENES = ["1:0", "1:3", "1:7", "2:0", "2:6", "3:0", "3:8", "3:22", "4:0", "4:16", "4:20", "5:0", "5:10", "6:0", "6:9", "6:17"]
# A minor pentatonic, low and soft.
NOTES = [220.0, 261.63, 293.66, 329.63, 392.0, 440.0]


def score(mix, tl):
    at = tl["at"]
    put = mix.put

    for i, k in enumerate(SCENES[1:]):
        put(at[k] - 0.5, whoosh(0.9, 300, 1400, peak=0.5, q=0.7), 0.10, -0.3 + (i % 3) * 0.3)

    # open: cell bars drop in, the pen line, the name
    for j in range(5):
        put(at["1:0"] + 0.3 + j * 0.12, click(900 - j * 60, dur=0.06), 0.16, -0.4 + j * 0.2)
    put(at["1:1"] + 1.2, scratch(1.4), 0.10)
    put(at["1:2"], blip(220.0, dur=0.9, tau=0.4), 0.12)
    put(at["1:3"], chime([440.0, 659.25, 880.0], dur=2.4, tau=0.9), 0.08)
    for i in range(9):
        put(at["1:4"] + i * 0.09, pop(700 + i * 40, 400), 0.07, -0.6 + i * 0.15)
    put(at["1:5"], whoosh(1.8, 400, 2400, peak=0.6), 0.08)

    # why another: books fill the shelf, the gap opens, the book drops in
    for i in range(0, 22, 3):
        put(at["1:8"] + i * 0.1, click(500 + i * 10, dur=0.05), 0.08, -0.6 + i * 0.05)
    put(at["1:11"], whoosh(1.2, 900, 300, peak=0.5), 0.08)
    put(at["1:11"] + 3.5, blip(146.83, dur=0.7, tau=0.2), 0.2)

    # thirst: the one light reaches up
    put(at["2:4"], blip(NOTES[2], dur=1.0, tau=0.4), 0.10)
    put(at["2:5"], whoosh(1.8, 300, 2600, peak=0.8), 0.08)

    # reader: rings, the open line
    put(at["2:13"] + 0.6, blip(NOTES[0], dur=1.2, tau=0.5), 0.10)
    put(at["2:13"] + 3.5, blip(NOTES[4], dur=1.4, tau=0.6), 0.10)
    put(at["2:17"] + 0.4, scratch(2.0), 0.07)

    # choice: blocks drop word by word, the flowing line draws
    put(at["3:2"], whoosh(2.4, 300, 1600, peak=0.6), 0.08)
    for i in range(6):
        put(at["3:4"] + i * 0.16, click(1200, dur=0.04), 0.08, -0.5 + i * 0.2)

    # life: grains through the sieve, spirit rising, the one impact on the lightning
    for i in range(14):
        put(at["3:16"] + i * 0.2, click(2600 + (i % 4) * 200, dur=0.02), 0.04, -0.4 + (i % 5) * 0.2)
    put(at["3:17"], whoosh(2.4, 500, 5000, peak=0.7, q=0.6), 0.08)
    put(at["3:19"] + 0.45, impact(1.6), 0.22)
    put(at["3:20"], blip(NOTES[1], dur=1.6, tau=0.6), 0.08)

    # flow: the essay cut into numbered pieces
    for i in range(7):
        put(at["3:25"] + 0.4 + i * 0.22, click(1400 - i * 60, dur=0.04), 0.10, -0.3 + i * 0.1)
    put(at["3:27"], whoosh(1.2, 1200, 200, peak=0.3), 0.08)

    # speech: occasions, voices, fragments joining
    for i in range(7):
        put(at["4:2"] + 0.7 + i * 1.1, blip(NOTES[i % 6], dur=0.5, tau=0.15), 0.06, -0.6 + i * 0.2)
    for i, f in enumerate([0.06, 0.28, 0.5, 0.72]):
        put(at["4:11"] + f * 7.7, pop(600 + i * 120, 300), 0.08, -0.5 + i * 0.33)
    put(at["4:15"] + 2.0, chime([329.63, 440.0, 659.25], dur=2.0, tau=0.7), 0.06)

    # setting: the band slides away, the block flips
    put(at["4:18"], whoosh(1.2, 1600, 300, peak=0.4), 0.08)

    # kufr: six branches, then flattened
    for i in range(6):
        put(at[f"4:{23 + i}"], blip(NOTES[i], dur=0.7, tau=0.25), 0.10, -0.6 + i * 0.24)
    put(at["4:29"], whoosh(1.0, 1800, 400, peak=0.4), 0.07)

    # what he did: the trembling dot on "very much afraid"
    put(at["5:2"] + 0.8, whoosh(6.0, 300, 1800, peak=0.5, q=0.6), 0.06)
    put(at["5:8"], blip(NOTES[0] / 2, dur=2.4, tau=1.2), 0.12)

    # tools and method
    for i, k in enumerate(["5:13", "5:14"]):
        put(at[k], pop(700 + i * 150, 350), 0.08)
    for i, k in enumerate(["6:1", "6:2", "6:4", "6:5"]):
        put(at[k], click(1500 + i * 200), 0.10)
        put(at[k] + 0.01, blip(NOTES[i + 1], dur=0.5, tau=0.15), 0.07)

    # the book: work, stall, arrest, the time it needed
    put(at["6:11"], scratch(3.4), 0.06)
    for j in range(5):
        put(at["6:14"] + j * 0.1, click(800 - j * 50, dur=0.06), 0.16, 0.2 + j * 0.1)
    put(at["6:15"], whoosh(2.4, 300, 1500, peak=0.6), 0.07)

    # close
    put(at["6:17"], chime([220.0, 329.63, 440.0], dur=3.0, tau=1.2), 0.08)
    for i in range(4):
        put(at[f"6:{20 + i}"], blip(NOTES[i + 1], dur=0.6, tau=0.2), 0.07)
    put(at["6:23"] + 1.4, chime([220.0, 329.63, 440.0, 659.25], dur=3.2, tau=1.3), 0.09)
