"""Timeline + audio for GiftVideo: Sheikh Uthman al-Khamees on Sa'd ibn 'Ubadah, his voice untouched, English on screen.

    python3 src/gift/build.py <source.mp3>

Line times come from the word timings in arabic_words.json (speech-to-text, checked by ear against the pauses).
Writes src/gift/timeline.json and public/gift/voice.wav.
"""

import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
FPS = 30
SPEECH_END = 105.2
END = 105.6  # end card in
DURATION = 111.0

LINES = [
    # (start, end, text, key)
    (0.58, 1.26, "And so it is narrated", "narrated"),
    (2.68, 3.76, "about Sa‘d ibn ‘Ubadah,", "sad1"),
    (4.44, 5.30, "may Allah be pleased with him.", "pleased"),
    (6.64, 8.62, "Sa‘d ibn ‘Ubadah was among the most generous of the Arabs,", "arabs"),
    (9.74, 10.84, "and the most generous of the Muslims.", "muslims"),
    (12.34, 13.56, "Al-Dhahabi mentions,", "dhahabi"),
    (14.60, 16.14, "may Allah have mercy on him, in his Siyar,", "siyar"),
    (16.98, 17.98, "about Sa‘d ibn ‘Ubadah.", "sad2"),
    (18.54, 19.44, "He says: from the time…", "says1"),
    (19.58, 20.54, "and Sa‘d was the chief of the Khazraj,", "khazraj"),
    (20.96, 22.28, "from the time the Prophet emigrated,", "emigrated"),
    (23.20, 24.58, "peace be upon him, to Madinah,", "madinah"),
    (26.12, 27.42, "until Allah took him.", "took"),
    (28.70, 29.36, "We know", "know"),
    (30.60, 32.58, "that the noble Prophet, peace be upon him,", "noble"),
    (33.52, 35.16, "stayed in Madinah for ten years.", "ten"),
    (37.12, 38.92, "When we speak of ten years,", "speak"),
    (39.02, 40.14, "and every year", "every"),
    (40.22, 42.50, "is, as they say, 365 days,", "days365"),
    (44.72, 47.56, "then we are talking about 3,650 days", "days3650"),
    (49.48, 51.82, "that the Prophet stayed in Madinah, peace be upon him.", "stayed"),
    (53.02, 54.36, "Al-Dhahabi says:", "says"),
    (54.48, 56.56, "Hardly a day would pass", "hardly"),
    (58.60, 61.06, "without Sa‘d ibn ‘Ubadah giving the Prophet a gift.", "gift1"),
    (62.86, 64.70, "Imagine that!", "imagine"),
    (64.78, 65.94, "Hardly a day would pass", "hardly2"),
    (67.02, 69.48, "without him giving the Prophet a gift, peace be upon him.", "gift2"),
    (71.20, 72.72, "And so, among the supplications", "among"),
    (73.72, 75.78, "of Sa‘d ibn ‘Ubadah, he used to say:", "used"),
    (75.86, 78.62, "O Allah, I am not made for poverty,", "dua1a"),
    (80.98, 82.98, "and poverty is not made for me.", "dua1b"),
    (84.00, 84.46, "A generous man!", "karim"),
    (86.04, 87.76, "O Allah, I am not made for poverty,", "dua2a"),
    (88.78, 90.76, "and poverty is not made for me.", "dua2b"),
    (91.56, 93.90, "O Allah, enrich me from Your bounty,", "enrich1"),
    (96.26, 98.88, "so that I may always be rich, free of need,", "rich"),
    (100.24, 102.24, "self-sufficient, and giving.", "giving"),
    (103.00, 105.12, "O Allah, enrich me from Your bounty.", "enrich2"),
]

# English words pinned to the Arabic word they translate (the rest are spread by length in between)
PINS = {
    ("sad1", "sa‘d"): 2.88,
    ("arabs", "most"): 7.70,
    ("arabs", "arabs,"): 8.18,
    ("muslims", "muslims."): 10.28,
    ("siyar", "in"): 15.38,
    ("emigrated", "prophet"): 21.86,
    ("madinah", "to"): 24.02,
    ("noble", "noble"): 31.10,
    ("noble", "peace"): 31.52,
    ("ten", "ten"): 34.36,
    ("days365", "365"): 40.92,
    ("days3650", "3,650"): 45.62,
    ("stayed", "peace"): 50.82,
    ("hardly", "day"): 56.08,
    ("gift1", "giving"): 59.90,
    ("gift1", "gift."): 60.66,
    ("gift2", "gift,"): 67.94,
    ("gift2", "peace"): 68.54,
    ("used", "he"): 75.0,
    ("dua1a", "i"): 76.56,
    ("dua1a", "poverty,"): 77.96,
    ("dua1b", "poverty"): 82.06,
    ("dua2a", "i"): 86.48,
    ("dua2a", "poverty,"): 87.22,
    ("dua2b", "poverty"): 89.84,
    ("enrich1", "enrich"): 92.56,
    ("enrich1", "from"): 93.16,
    ("rich", "rich,"): 97.80,
    ("rich", "free"): 98.26,
    ("giving", "and"): 101.30,
    ("enrich2", "enrich"): 103.42,
    ("enrich2", "from"): 104.44,
}


def words(s, e, text, key):
    ws = text.split(" ")
    anchors = [(0, s)] + [(i, PINS[(key, w.lower())]) for i, w in enumerate(ws) if (key, w.lower()) in PINS] + [(len(ws), e)]
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
    used = set()
    lines = []
    for s, e, t, k in LINES:
        lines.append({"s": s, "e": e, "text": t, "key": k, "words": words(s, e, t, k)})
        used |= {(k, w.lower()) for w in t.split(" ")}
    missing = set(PINS) - used
    assert not missing, f"pins match no word: {missing}"
    tl = {
        "fps": FPS,
        "duration": DURATION,
        "speechEnd": SPEECH_END,
        "end": END,
        "lines": lines,
        "key": {l["key"]: [l["s"], l["e"]] for l in lines},
        "word": {f"{l['key']}.{w['t'].strip('“”.,…:!').lower()}": w["s"] for l in lines for w in l["words"]},
    }
    json.dump(tl, open(os.path.join(HERE, "timeline.json"), "w"), indent=1, ensure_ascii=False)

    # his voice exactly as recorded, padded under the end card
    os.makedirs(os.path.join(ROOT, "public", "gift"), exist_ok=True)
    out = os.path.join(ROOT, "public", "gift", "voice.wav")
    af = f"apad=whole_dur={DURATION},aformat=sample_rates=48000:channel_layouts=stereo"
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", src, "-vn", "-af", af, "-c:a", "pcm_s16le", out], check=True)
    print(f"{len(lines)} lines, duration {DURATION}s")


if __name__ == "__main__":
    main()
