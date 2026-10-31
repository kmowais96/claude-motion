"""Timeline + audio for GenerousVideo: the original Arabic narration, English on screen.

    python3 src/generous/build.py <source.mp4>

Times are in the source clip (read from its on-screen Arabic and the speech envelope).
The source's own end card (32.6 s on) is dropped; ours follows the last word.
Writes src/generous/timeline.json and public/generous/voice_raw.wav.
"""

import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
FPS = 30
SPEECH_END = 32.6
END = 32.9  # end card in
DURATION = 37.0

LINES = [
    # (start, end, text, key)
    (0.10, 1.00, "He wanted to ask Allah.", "ask"),
    (1.30, 2.65, "He meant to mention one need,", "mention"),
    (2.75, 4.05, "and another came to him.", "another"),
    (4.50, 5.10, "He reached for a second,", "second"),
    (5.15, 5.95, "and a third came to him.", "third"),
    (6.00, 7.10, "So he said: “O my Lord, everything…", "lord"),
    (7.45, 8.30, "…everything.”", "everything"),
    (8.45, 9.40, "And there is no harm in that.", "noharm"),
    (9.50, 10.30, "He is turning to the Most Generous,", "generous"),
    (11.50, 13.55, "to the One whose Hand pours freely,", "hand"),
    (13.90, 14.95, "night and day.", "nightday"),
    (15.50, 17.15, "No spending can drain it.", "drain"),
    (17.25, 18.25, "What He has never decreases.", "never"),
    (18.70, 19.20, "“O My servants,", "servants"),
    (19.80, 21.05, "if the first of you and the last of you,", "first"),
    (21.20, 22.95, "your humans and your jinn,", "humans"),
    (23.50, 25.15, "stood together on one plain,", "stood"),
    (25.40, 26.30, "and asked of Me,", "asked"),
    (26.70, 29.30, "and I gave every one of them what they asked,", "gave"),
    (30.10, 32.45, "that would not decrease My dominion in the least.”", "decrease"),
]

# words whose start is pinned to the speech (the rest are spread by length in between)
PINS = {
    ("lord", "everything"): 6.62,
    ("hand", "pours"): 13.15,
    ("nightday", "day."): 14.45,
    ("first", "last"): 20.65,
    ("humans", "jinn,"): 21.85,
    ("gave", "every"): 27.6,
    ("decrease", "dominion"): 31.5,
    ("decrease", "in"): 32.0,
}


def words(s, e, text, key):
    ws = text.split(" ")
    anchors = [(0, s)] + [(i, PINS[(key, w)]) for i, w in enumerate(ws) if (key, w) in PINS] + [(len(ws), e)]
    out = []
    for (i0, t0), (i1, t1) in zip(anchors, anchors[1:]):
        lens = [len(w) + 2 for w in ws[i0:i1]]
        tot, acc = sum(lens), t0
        for w, n in zip(ws[i0:i1], lens):
            d = (t1 - t0) * n / tot
            out.append({"t": w, "s": round(acc, 3), "e": round(acc + d - 0.02, 3)})
            acc += d
    return out


def main():
    src = sys.argv[1]
    lines = [{"s": s, "e": e, "text": t, "key": k, "words": words(s, e, t, k)} for s, e, t, k in LINES]
    tl = {
        "fps": FPS,
        "duration": DURATION,
        "speechEnd": SPEECH_END,
        "end": END,
        "lines": lines,
        "key": {l["key"]: [l["s"], l["e"]] for l in lines},
        "word": {f"{l['key']}.{w['t'].strip('“”.,…').lower()}": w["s"] for l in lines for w in l["words"]},
    }
    json.dump(tl, open(os.path.join(HERE, "timeline.json"), "w"), indent=1, ensure_ascii=False)

    # the narration exactly as recorded, cut before the source's end card, padded to length
    out = os.path.join(ROOT, "public", "generous", "voice_raw.wav")
    af = f"atrim=0:{SPEECH_END},afade=t=out:st={SPEECH_END - 0.12}:d=0.12,apad=whole_dur={DURATION},aformat=sample_rates=48000:channel_layouts=stereo"
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", src, "-vn", "-af", af, "-c:a", "pcm_s16le", out], check=True)
    print(f"{len(lines)} lines, duration {DURATION}s")


if __name__ == "__main__":
    main()
