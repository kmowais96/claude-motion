"""Timeline + audio for GiftVideo: Sheikh Uthman al-Khamees on Sa'd ibn 'Ubadah, his voice untouched, English on screen.

    python3 src/gift/build.py <source.mp3>

Line times are written in the source's own clock, from the word timings in arabic_words.json
(speech-to-text, checked against the pauses). The narration is then tightened: his repeats are cut
and long pauses shortened, each cut a short equal-power crossfade inside the room tone (about −60 dB),
so no word is touched. Every time is mapped onto the edited clock.
Writes src/gift/timeline.json and public/gift/voice.wav.
"""

import json
import os
import subprocess
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
FPS = 30
SR = 48000
TAIL = 5.2  # end card after the last word

# repeats he makes for emphasis, cut (source times)
CUTS = [
    (18.40, 19.50),  # "يقول منذ هاجر", a false start he restarts at 20.96
    (64.74, 69.60),  # "ما يكاد يمر يوم إلا ويهدي للنبي هدية ﷺ", the second telling
    (85.90, 90.90),  # the du'a, said a second time
    (102.40, 106.40),  # "اللهم أغنني من فضلك", said a second time to close
]
# pauses longer than this are shortened; a few get a set length (keyed by the source time the pause ends)
MAX_GAP = 0.55
SET_GAP = {71.20: 1.35}  # after "Imagine!": room for the gifts
XF = 0.05
# the false start runs straight into "وهو" with no pause; join on the dip between them (measured at 19.535–19.585)
TAIL_ROOM = {19.58: 0.02}

LINES = [
    # (start, end, text, key)
    (0.58, 1.26, "And so it is narrated", "narrated"),
    (2.68, 3.76, "about Sa‘d ibn ‘Ubadah,", "sad1"),
    (4.44, 5.30, "may Allah be pleased with him.", "pleased"),
    (6.64, 8.62, "Sa‘d ibn ‘Ubadah was among the most generous of the Arabs,", "arabs"),
    (9.74, 10.84, "and the most generous of the Muslims.", "muslims"),
    (12.34, 13.56, "Al-Dhahabi mentions,", "dhahabi"),
    (14.60, 16.14, "may Allah have mercy on him, in his Siyar,", "siyar"),
    (16.98, 17.98, "about Sa‘d ibn ‘Ubadah,", "sad2"),
    (19.58, 20.54, "chief of the Khazraj.", "khazraj"),
    (20.96, 22.28, "He says: from the time the Prophet emigrated,", "emigrated"),
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
    (71.20, 72.72, "And so, among the supplications", "among"),
    (73.72, 75.78, "of Sa‘d ibn ‘Ubadah, he used to say:", "used"),
    (75.86, 78.62, "O Allah, I am not made for poverty,", "dua1a"),
    (80.98, 82.98, "and poverty is not made for me.", "dua1b"),
    (84.00, 84.46, "A generous man!", "karim"),
    (91.56, 93.90, "O Allah, enrich me from Your bounty,", "enrich1"),
    (96.26, 98.88, "so that I may always be rich, free of need,", "rich"),
    (100.24, 102.24, "self-sufficient, and giving.", "giving"),
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
    ("used", "he"): 75.0,
    ("dua1a", "i"): 76.56,
    ("dua1a", "poverty,"): 77.96,
    ("dua1b", "poverty"): 82.06,
    ("enrich1", "enrich"): 92.56,
    ("enrich1", "from"): 93.16,
    ("rich", "rich,"): 97.80,
    ("rich", "free"): 98.26,
    ("giving", "and"): 101.30,
}


def words_src(s, e, text, key):
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


def segments(words):
    """Kept stretches of the source as (src_start, src_end, out_start)."""
    kept = [w for w in words if not any(a <= w["start"] < b for a, b in CUTS)]
    phrases = []
    for w in kept:
        if phrases and w["start"] - phrases[-1][1] < 0.3:
            phrases[-1][1] = w["end"]
        else:
            phrases.append([w["start"], w["end"]])
    segs, out = [], 0.0
    a = 0.0
    for (s0, e0), (s1, _) in zip(phrases, phrases[1:]):
        gap = s1 - e0
        new = SET_GAP.get(round(s1, 2), min(gap, MAX_GAP + max(0, gap - MAX_GAP) * 0.15))
        if new >= gap - 0.02:
            continue
        # keep the start of the pause after e0 and the end of it before s1, crossfaded together,
        # taking room tone only from true silence (a cut-out repeat may sit inside the gap)
        head_room = min(w["start"] for w in words if w["start"] > e0 + 0.01) - e0 - 0.12
        tail_room = TAIL_ROOM.get(round(s1, 2), s1 - max(w["end"] for w in words if w["end"] < s1 - 0.01) - 0.12)
        head = min(new / 2, head_room)
        tail = new - head
        if tail > tail_room:
            tail = tail_room
            head = min(new - tail, head_room)
        cut_a = e0 + head
        cut_b = s1 - tail
        segs.append((a, cut_a + XF / 2, out))
        out += cut_a - a
        assert cut_b >= cut_a - 0.001, (e0, s1)
        a = cut_b - XF / 2
    last = phrases[-1][1]
    segs.append((a, last + 0.6, out))
    return segs, out + (last + 0.6 - a), last


def mapper(segs):
    def f(t):
        for a, b, o in segs:
            if t <= b:
                return round(o + max(0.0, t - a), 3)
        a, b, o = segs[-1]
        return round(o + (b - a), 3)
    return f


def edit_audio(src, segs, total):
    raw = subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-i", src, "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"], check=True, capture_output=True
    ).stdout
    x = np.frombuffer(raw, dtype=np.float32).reshape(-1, 2)
    n = int(round((total + TAIL) * SR))
    y = np.zeros((n + SR, 2), dtype=np.float32)
    xf = int(XF * SR)
    ramp = np.linspace(0, np.pi / 2, xf)[:, None]
    fin, fout = np.sin(ramp), np.cos(ramp)
    for i, (a, b, o) in enumerate(segs):
        chunk = x[int(a * SR) : int(b * SR)].copy()
        if i > 0:
            chunk[:xf] *= fin
        if i < len(segs) - 1:
            chunk[-xf:] *= fout
        else:
            chunk[-int(0.3 * SR) :] *= np.linspace(1, 0, int(0.3 * SR))[:, None]
        st = int(round(o * SR)) - (xf // 2 if i > 0 else 0)
        y[st : st + len(chunk)] += chunk
    return y[:n]


def main():
    src = sys.argv[1]
    words = json.load(open(os.path.join(HERE, "arabic_words.json")))["words"]
    words = [w for w in words if w["type"] == "word"]
    segs, total, last = segments(words)
    m = mapper(segs)
    used = set()
    lines = []
    for s, e, t, k in LINES:
        ws = [{**w, "s": m(w["s"]), "e": m(w["e"])} for w in words_src(s, e, t, k)]
        lines.append({"s": m(s), "e": m(e), "text": t, "key": k, "words": ws})
        used |= {(k, w.lower()) for w in t.split(" ")}
    missing = set(PINS) - used
    assert not missing, f"pins match no word: {missing}"
    end = round(m(last) + 0.45, 2)
    tl = {
        "fps": FPS,
        "duration": round(end + TAIL - 0.4, 2),
        "speechEnd": m(last),
        "end": end,
        "edits": [{"src": [round(a, 3), round(b, 3)], "at": round(o, 3)} for a, b, o in segs],
        "lines": lines,
        "key": {l["key"]: [l["s"], l["e"]] for l in lines},
        "word": {f"{l['key']}.{w['t'].strip('“”.,…:!').lower()}": w["s"] for l in lines for w in l["words"]},
    }
    json.dump(tl, open(os.path.join(HERE, "timeline.json"), "w"), indent=1, ensure_ascii=False)

    os.makedirs(os.path.join(ROOT, "public", "gift"), exist_ok=True)
    y = edit_audio(src, segs, end - 0.45 + 0.6)
    y = y[: int(tl["duration"] * SR)]
    out = os.path.join(ROOT, "public", "gift", "voice.wav")
    subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", "-c:a", "pcm_s16le", out],
        input=y.astype(np.float32).tobytes(),
        check=True,
    )
    print(f"{len(lines)} lines, {len(segs)} segments, speech {m(last)}s (was {last}s), duration {tl['duration']}s")


if __name__ == "__main__":
    main()
