"""Short cut of GiftVideo (~40 s): his voice, only the lines that carry the story.

    python3 src/giftshort/build.py <source.mp3>

Same method as src/gift/build.py: lines are cut on whole phrases, each join is a 50 ms equal-power
crossfade inside room tone (checked against the silences of the source), so no word is touched.
Writes src/giftshort/timeline.json and public/giftshort/voice.wav.
"""

import importlib.util
import json
import os
import subprocess
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
spec = importlib.util.spec_from_file_location("gift_build", os.path.join(ROOT, "src", "gift", "build.py"))
G = importlib.util.module_from_spec(spec)
spec.loader.exec_module(G)

SR, FPS, TAIL = G.SR, G.FPS, G.TAIL
# source stretches kept (each starts and ends inside a silence of the source)
KEEP = [(6.0, 11.0), (30.0, 35.3), (44.5, 47.7), (52.9, 61.3), (62.0, 63.6), (71.0, 85.0), (91.4, 102.5)]
KEEP_KEYS = {"arabs", "muslims", "noble", "ten", "days3650", "says", "hardly", "gift1", "imagine", "among", "used", "dua1a", "dua1b", "karim", "enrich1", "rich", "giving"}
TEXT = {"noble": "the noble Prophet, peace be upon him,", "days3650": "So we are talking about 3,650 days"}
BETWEEN = 0.5  # silence left between two stretches
LEAD = 0.45


def inside(t):
    return any(a <= t < b for a, b in KEEP)


def segments(words):
    kept = [w for w in words if inside(w["start"])]
    phrases = []
    for w in kept:
        if phrases and w["start"] - phrases[-1][1] < 0.3:
            phrases[-1][1] = w["end"]
        else:
            phrases.append([w["start"], w["end"]])
    segs, out, a = [], 0.0, kept[0]["start"] - LEAD
    for (s0, e0), (s1, _) in zip(phrases, phrases[1:]):
        gap = s1 - e0
        removed = any(e0 + 0.01 < w["start"] < s1 - 0.01 for w in words)
        new = BETWEEN if removed else min(gap, G.MAX_GAP + max(0, gap - G.MAX_GAP) * 0.15)
        if new >= gap - 0.02:
            continue
        if removed:
            cut_a, cut_b = e0 + BETWEEN / 2, s1 - BETWEEN / 2
        else:
            head_room = min(w["start"] for w in words if w["start"] > e0 + 0.01) - e0 - 0.12
            tail_room = s1 - max(w["end"] for w in words if w["end"] < s1 - 0.01) - 0.12
            head = min(new / 2, head_room)
            tail = min(new - head, tail_room)
            cut_a, cut_b = e0 + head, s1 - tail
        assert cut_b >= cut_a - 0.001, (e0, s1)
        segs.append((a, cut_a + G.XF / 2, out))
        out += cut_a - a
        a = cut_b - G.XF / 2
    last = phrases[-1][1]
    segs.append((a, last + 0.6, out))
    return segs, out + (last + 0.6 - a), last


def main():
    src = sys.argv[1]
    words = [w for w in json.load(open(os.path.join(HERE, "arabic_words.json")))["words"] if w["type"] == "word"]
    for w in words:  # the transcript pads "تصوروا!" through its pause; he stops at 63.4
        if w["text"].startswith("تصوروا"):
            w["end"] = 63.4
    segs, total, last = segments(words)
    m = G.mapper(segs)
    lines = []
    for s, e, t, k in G.LINES:
        if k not in KEEP_KEYS:
            continue
        t = TEXT.get(k, t)
        ws = [{**w, "s": m(w["s"]), "e": m(w["e"])} for w in G.words_src(s, e, t, k)]
        lines.append({"s": m(s), "e": m(e), "text": t, "key": k, "words": ws})
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
    os.makedirs(os.path.join(ROOT, "public", "giftshort"), exist_ok=True)
    y = G.edit_audio(src, segs, end - 0.45 + 0.6)[: int(tl["duration"] * SR)]
    subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", "-c:a", "pcm_s16le", os.path.join(ROOT, "public", "giftshort", "voice.wav")],
        input=y.astype(np.float32).tobytes(),
        check=True,
    )
    print(f"{len(lines)} lines, speech {m(last):.1f}s, duration {tl['duration']}s")


if __name__ == "__main__":
    main()
