"""Timeline + audio for KishkVideo, from the sermon clip's own subtitle timings.

    python3 src/kishk/build.py <source.mp4> [--full]

Times below are in the SOURCE clip. CUTS remove the speaker's repeat of the
"whoever wants" list and shorten long pauses, so the reel fits in 3:00.
Writes src/kishk/timeline.json (output times) and public/kishk/voice.wav.
"""

import json
import os
import subprocess
import sys
import wave

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
FPS = 30
XF = 0.3  # crossfade at each cut, inside a pause
CUTS = [(0.0, 2.4), (28.35, 51.0), (61.2, 64.8), (69.3, 70.0), (71.4, 72.1), (73.5, 75.6), (91.2, 93.6)]
SRC_END = 215.8  # speech ends 212.6; keep the room tone under the end card

LINES = [
    # (start, end, text, key)
    (3.7, 9.1, "Whoever wants a companion, Allah is sufficient for him.", "companion"),
    (9.2, 15.7, "And whoever wants a proof, the Qur'an is sufficient for him.", "proof"),
    (15.8, 21.9, "And whoever wants wealth, contentment is sufficient for him.", "wealth"),
    (21.9, 28.3, "And whoever wants a reminder, death is sufficient for him.", "reminder"),
    (29.0, 33.9, "Whoever wants a companion, Allah is sufficient for him.", "companion2"),
    (34.7, 39.9, "And whoever wants a proof, the Qur'an is sufficient for him.", "proof2"),
    (40.7, 45.5, "And whoever wants a reminder, death is sufficient for him.", "reminder2"),
    (46.2, 50.9, "And whoever wants wealth, contentment is sufficient for him.", "wealth2"),
    (51.1, 55.4, "And for whom none of that is sufficient…", "none"),
    (55.5, 60.3, "…the Fire will surely be sufficient for him.", "fire"),
    (68.0, 69.3, "O son of Adam,", "adam"),
    (77.0, 80.4, "we weep over this lower life,", "weep"),
    (84.0, 90.6, "but there has never been a gathering that death did not separate.", "separate"),
    (93.9, 99.3, "Where are the mighty tyrants who amassed treasures?", "tyrants"),
    (99.5, 102.2, "They did not survive, nor did their treasures.", "survive"),
    (103.4, 107.6, "Where is the one who filled the wide sky with his army?", "army"),
    (107.6, 112.0, "In the end, he ended in a narrow grave.", "grave"),
    (113.0, 121.0, "When they are called, they will be silent, as if they never knew how to speak.", "silent"),
    (122.1, 130.0, "“Those who believe, and whose hearts find peace in the remembrance of Allah.”", "believe"),
    (130.6, 137.4, "“Verily, in the remembrance of Allah do hearts find peace.”", "verily1"),
    (137.6, 143.8, "“Verily, in the remembrance of Allah do hearts find peace.”", "verily2"),
    (144.0, 150.0, "“Verily, in the remembrance of Allah do hearts find peace.”", "verily3"),
    (150.1, 152.2, "O you who affirm the oneness of Allah, tell me:", "tellme"),
]
NAMES = [
    (152.2, 155.0, "the One"), (155.0, 156.7, "the Finder"), (156.7, 159.0, "the Most Glorious"),
    (159.0, 161.2, "the Entirely Merciful"), (161.2, 163.2, "the Especially Merciful"), (163.2, 164.5, "the King"),
    (164.5, 166.9, "the Most Holy"), (167.1, 168.4, "the Peace"), (168.6, 170.0, "the Giver of Faith"),
    (170.2, 172.0, "the Guardian"), (172.2, 173.7, "the Almighty"), (173.7, 175.2, "the Compeller"),
    (175.2, 177.5, "the Supreme"), (177.7, 179.1, "the Creator"), (179.2, 180.5, "the Originator"),
    (180.7, 182.6, "the Fashioner"), (182.6, 184.3, "the Most Wise"), (184.3, 186.5, "the Most Kind"),
    (186.6, 187.9, "the Magnificent"), (188.1, 190.0, "the Withholder"), (190.0, 192.0, "the Extender"),
    (192.0, 193.7, "the Exalter"), (193.7, 195.6, "the Abaser"), (195.6, 197.5, "the Most Majestic"),
    (197.7, 199.5, "the Most Majestic"), (199.5, 201.4, "the All-Powerful"), (201.5, 203.2, "the Trustee"),
    (203.2, 204.9, "the Nourisher"), (204.9, 206.4, "the Finder"), (206.4, 208.4, "the Most Glorious"),
    (208.6, 209.6, "the Only One"),
]
FINAL = (209.8, 212.6, "Affirm the oneness of the One, the Only!")


def keeps(full):
    if full:
        return [(0.0, SRC_END)]
    out, t = [], 0.0
    for a, b in CUTS:
        if a > t:
            out.append((t, a))
        t = b
    out.append((t, SRC_END))
    return out


def mapper(segs):
    starts, acc = [], 0.0
    for i, (a, b) in enumerate(segs):
        starts.append(acc)
        acc += (b - a) - (XF if i < len(segs) - 1 else 0)

    def m(t):
        for (a, b), o in zip(segs, starts):
            if a - 1e-6 <= t <= b + 1e-6:
                return round(o + t - a, 3)
        # inside a cut: snap to the next kept segment
        for (a, b), o in zip(segs, starts):
            if t < a:
                return round(o, 3)
        return round(acc, 3)

    return m, acc


def crowd_hits(src, names):
    """Each name gets a crowd answer "Allah!": find the noisiest (crowd) burst in its window."""
    wav = os.path.join(HERE, "..", "..", "out", "kishk16.wav")
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", src, "-vn", "-ac", "1", "-ar", "16000", wav], check=True)
    w = wave.open(wav)
    x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float) / 32768
    sr, n, hop = 16000, 640, 160
    t0, t1 = names[0][0] - 1, names[-1][1] + 1
    T, P, E = [], [], []
    for i in range(int(t0 * sr / hop), int(t1 * sr / hop)):
        seg = x[i * hop:i * hop + n]
        seg = seg - seg.mean()
        p = np.abs(np.fft.rfft(seg * np.hanning(n), 2048)) ** 2
        fr = np.fft.rfftfreq(2048, 1 / sr)
        ac = np.fft.irfft(p)
        ac = ac / (ac[0] + 1e-12)
        T.append(i * hop / sr)
        P.append(ac[sr // 400:sr // 80].max())  # pitch periodicity: high for one voice, low for a crowd
        E.append(10 * np.log10(p[(fr > 300) & (fr < 2000)].sum() + 1e-12))
    T, E = np.array(T), np.array(E)
    P = np.convolve(P, np.ones(9) / 9, "same")
    ez = (E - np.percentile(E, 20)) / (np.percentile(E, 95) - np.percentile(E, 20))
    score = np.convolve(np.clip(ez, 0, 1.2) * (1 - P), np.ones(9) / 9, "same")
    hits = []
    for s, e, _ in names:
        w = (T >= s + 0.4) & (T <= e + 0.35)
        j = np.flatnonzero(w)[np.argmax(score[w])]
        k = j
        while k > 0 and score[k - 1] > 0.5 * score[j] and T[k - 1] > s + 0.3:
            k -= 1
        hits.append(round(float(T[k]), 2))
    return hits


def main():
    src = sys.argv[1]
    full = "--full" in sys.argv
    segs = keeps(full)
    m, dur = mapper(segs)
    kept = lambda a, b: any(ka <= a + 0.01 and b - 0.01 <= kb for ka, kb in segs)

    lines = [{"s": m(a), "e": m(b), "text": t, "key": k} for a, b, t, k in LINES if kept(a, b)]
    hits = crowd_hits(src, NAMES)
    names = [{"s": m(a), "hit": m(h), "e": m(b), "name": nm} for (a, b, nm), h in zip(NAMES, hits)]
    final = {"s": m(FINAL[0]), "e": m(FINAL[1]), "text": FINAL[2]}
    key = {l["key"]: l for l in lines}
    tl = {
        "fps": FPS,
        "duration": round(dur, 3),
        "full": full,
        "lines": lines,
        "names": names,
        "final": final,
        "key": {k: [v["s"], v["e"]] for k, v in key.items()},
    }
    json.dump(tl, open(os.path.join(HERE, "timeline.json"), "w"), indent=1)

    # voice: kept segments joined with short crossfades inside pauses, then mastered
    parts, fc = [], []
    for i, (a, b) in enumerate(segs):
        fc.append(f"[0:a]atrim={a}:{b},asetpts=PTS-STARTPTS,aformat=sample_rates=48000:channel_layouts=stereo[s{i}]")
    cur = "s0"
    for i in range(1, len(segs)):
        fc.append(f"[{cur}][s{i}]acrossfade=d={XF}:c1=tri:c2=tri[x{i}]")
        cur = f"x{i}"
    fc.append(f"[{cur}]afade=t=in:d=0.4,afade=t=out:st={dur - 2.5}:d=2.5[v]")
    out = os.path.join(ROOT, "public", "kishk", "voice_raw.wav")
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", src, "-filter_complex", ";".join(fc), "-map", "[v]", "-c:a", "pcm_s16le", out], check=True)
    print(f"duration {dur:.2f}s, {len(lines)} lines, {len(names)} names")


if __name__ == "__main__":
    main()
