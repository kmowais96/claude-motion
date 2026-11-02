"""Build the OneVerse Short's audio stems and timeline.

    python3 src/oneverse/build.py <source.mp4>

- Cuts the recitation of Ar-Ra'd 13:4 out of the source video, untouched (only edge fades).
- Speeds the English narration take up a little, cuts it into lines and sets the pauses.
- Writes public/oneverse/{vo,rec}.wav and src/oneverse/timeline.json.
"""
import json
import re
import subprocess
import sys
import wave

import numpy as np

SR = 48000
FPS = 30
SRC = sys.argv[1] if len(sys.argv) > 1 else '../work/source.mp4'
RAW = 'public/oneverse/vo-raw.mp3'
TEMPO = 1.07

# The recitation in the source: first word at 7.4 s, last word ends 35.9 s.
REC_IN, REC_OUT = 7.0, 36.15
# Word onsets of the recitation (source seconds), read off the source's own word-by-word highlight.
# The reciter repeats «وجنات من أعناب».
REC_WORDS = [
    ('وَفِي', 7.4), ('الْأَرْضِ', 7.8), ('قِطَعٌ', 8.4), ('مُّتَجَاوِرَاتٌ', 9.4),
    ('وَجَنَّاتٌ', 11.4), ('مِّنْ', 13.2), ('أَعْنَابٍ', 13.8),
    ('وَجَنَّاتٌ', 16.6), ('مِّنْ', 17.85), ('أَعْنَابٍ', 18.2), ('وَزَرْعٌ', 19.5), ('وَنَخِيلٌ', 20.6),
    ('صِنْوَانٌ', 22.1), ('وَغَيْرُ', 23.4), ('صِنْوَانٍ', 24.2),
    ('يُسْقَىٰ', 25.7), ('بِمَاءٍ', 26.3), ('وَاحِدٍ', 29.0),
    ('وَنُفَضِّلُ', 30.1), ('بَعْضَهَا', 31.3), ('عَلَىٰ', 32.2), ('بَعْضٍ', 32.8), ('فِي', 34.3), ('الْأُكُلِ', 34.6),
]
REC_LAST = 35.9
# Phrase groups on screen: (key, first word index, last word index exclusive, English)
REC_PHRASES = [
    ('plots', 0, 4, 'And on the earth are plots, side by side,'),
    ('vines', 4, 7, 'and gardens of grapevines,'),
    ('crops', 7, 12, 'grapevines, crops, and palm trees,'),
    ('sinwan', 12, 15, 'some from one root, some standing alone,'),
    ('water', 15, 18, 'all watered with one water.'),
    ('fruit', 18, 24, 'Yet We make some better than others in fruit.'),
]

# Narration take: (key, start, end) of each spoken chunk in the raw take (from silence detection + alignment).
LINES = [
    ('h_one', 0.0, 0.91, 'One verse.'),
    ('h_cries', 1.76, 2.90, 'One heart cries…'),
    ('h_move', 3.79, 5.46, "and another doesn't even move."),
    ('h_where', 6.76, 7.69, "So where's the problem?"),
    ('h_listen', 9.13, 9.49, 'Listen.'),
    ('hasan', 10.62, 11.89, 'Al-Hasan al-Basri said:'),
    ('parable', 12.43, 16.38, 'this is a parable Allah gave, for the hearts of the children of Adam.'),
    ('clay', 17.42, 18.91, 'The earth was one clay,'),
    ('hand', 19.24, 20.97, 'in the hand of the Most Merciful.'),
    ('spread', 21.90, 22.71, 'He spread it out…'),
    ('plots', 23.07, 24.98, 'into plots, side by side.'),
    ('rain', 25.85, 27.41, 'Then the rain comes down.'),
    ('life', 28.33, 31.37, 'This one brings out flowers, fruit, and trees.'),
    ('dead', 31.77, 33.61, 'Dead ground comes back to life.'),
    ('salt', 34.54, 36.33, 'And that one brings out salt…'),
    ('waste', 36.76, 37.40, 'and waste.'),
    ('same', 38.26, 39.03, 'Same water.'),
    ('salty', 40.06, 42.92, "If the water were salty, you'd say: the water did it."),
    ('people', 43.89, 44.89, 'People are the same.'),
    ('adam', 45.37, 46.48, 'All of them from Adam.'),
    ('remind', 47.53, 49.86, 'Then a reminder comes down from the sky.'),
    ('soft', 50.70, 51.86, 'Some hearts soften.'),
    ('humble', 52.28, 54.03, 'They humble themselves, and submit.'),
    ('hard', 54.92, 56.11, 'Other hearts harden.'),
    ('play', 56.50, 57.98, 'They play, they forget,'),
    ('away', 58.40, 59.11, 'they turn away.'),
    ('hsaid', 60.13, 60.96, 'Al-Hasan said:'),
    ('byallah', 61.40, 62.16, 'By Allah,'),
    ('nosits', 62.50, 65.14, 'no one sits with the Quran and gets up the same.'),
    ('more', 65.81, 66.83, 'He leaves with more…'),
    ('less', 67.23, 67.94, 'or with less.'),
    ('says', 68.86, 69.65, 'Allah says:'),
    ('heal', 70.20, 73.92, 'We send down in the Quran healing and mercy for the believers.'),
    ('loss', 74.53, 77.40, 'And for the wrongdoers, it only adds to their loss.'),
    ('same2', 78.10, 79.98, 'Same verse. Same rain.'),
    ('sohow', 80.86, 81.55, 'So your heart…'),
    ('ground', 82.54, 83.45, 'which ground is it?'),
]
# Silence after each line (before the next). 'REC' marks where the recitation sits.
GAP = {
    'h_one': 0.35, 'h_cries': 0.25, 'h_move': 0.55, 'h_where': 0.45, 'h_listen': 'REC',
    'hasan': 0.15, 'parable': 0.6, 'clay': 0.15, 'hand': 0.5, 'spread': 0.2, 'plots': 0.55,
    'rain': 0.4, 'life': 0.25, 'dead': 0.55, 'salt': 0.25, 'waste': 0.6, 'same': 0.5, 'salty': 0.75,
    'people': 0.25, 'adam': 0.5, 'remind': 0.6, 'soft': 0.25, 'humble': 0.55, 'hard': 0.25, 'play': 0.15,
    'away': 0.8, 'hsaid': 0.15, 'byallah': 0.2, 'nosits': 0.5, 'more': 0.3, 'less': 0.75,
    'says': 0.35, 'heal': 0.45, 'loss': 0.9, 'same2': 0.55, 'sohow': 0.7, 'ground': 0.0,
}
LEAD = 0.25
REC_PRE, REC_POST = 0.55, 0.7
TAIL = 3.6


def load(path, ss=None, to=None, af=None):
    cmd = ['ffmpeg', '-loglevel', 'error']
    if ss is not None:
        cmd += ['-ss', str(ss), '-to', str(to)]
    cmd += ['-i', path, '-vn']
    if af:
        cmd += ['-af', af]
    cmd += ['-ac', '1', '-ar', str(SR), '-f', 's16le', '-']
    pcm = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(pcm, np.int16).astype(np.float64) / 32768


def fade(seg, a, b):
    fa, fb = int(a * SR), int(b * SR)
    if fa:
        seg[:fa] *= np.linspace(0, 1, fa) ** 2
    if fb:
        seg[-fb:] *= np.linspace(1, 0, fb) ** 2
    return seg


def syl(w):
    w = w.lower()
    n = len(re.findall(r'[aeiouy]+', w))
    if w.endswith('e') and n > 1:
        n -= 1
    return max(1, n)


def write(path, x):
    with wave.open(path, 'wb') as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(SR)
        f.writeframes((np.clip(x, -1, 1) * 32767).astype('<i2').tobytes())


vo = load(RAW, af=f'atempo={TEMPO}')
rec = fade(load(SRC, REC_IN, REC_OUT), 0.25, 0.35)

placed, lines, pos = [], [], LEAD
rec_at = None
for key, a, b, text in LINES:
    a, b = a / TEMPO, b / TEMPO
    seg = fade(vo[int(a * SR):int(b * SR)].copy(), 0.01, 0.02)
    placed.append((pos, seg))
    toks = text.split()
    weights = [syl(re.sub(r"[^A-Za-z']", '', t) or 'a') for t in toks]
    tot, acc, words = sum(weights), 0, []
    for t, wgt in zip(toks, weights):
        words.append({'t': t, 's': round(pos + (b - a) * acc / tot, 3)})
        acc += wgt
    lines.append({'key': key, 'text': text, 's': round(pos, 3), 'e': round(pos + b - a, 3), 'words': words})
    pos += b - a
    g = GAP[key]
    if g == 'REC':
        pos += REC_PRE
        rec_at = pos
        pos += (REC_OUT - REC_IN) + REC_POST
    else:
        pos += g

vo_end = lines[-1]['e']
duration = round(vo_end + TAIL, 2)
n = int(duration * SR) + SR
out_vo, out_rec = np.zeros(n), np.zeros(n)
for p, seg in placed:
    i = int(p * SR)
    out_vo[i:i + len(seg)] += seg
i = int(rec_at * SR)
out_rec[i:i + len(rec)] += rec
write('public/oneverse/vo.wav', out_vo[:int(duration * SR)])
write('public/oneverse/rec.wav', out_rec[:int(duration * SR)])

shift = rec_at - REC_IN
rw = [{'ar': w, 's': round(s + shift, 3)} for w, s in REC_WORDS]
phrases = []
for k, (key, i0, i1, en) in enumerate(REC_PHRASES):
    end = (REC_WORDS[REC_PHRASES[k + 1][1]][1] if k + 1 < len(REC_PHRASES) else REC_LAST) + shift
    phrases.append({'key': key, 'i0': i0, 'i1': i1, 'en': en, 's': rw[i0]['s'], 'e': round(end, 3)})

tl = {
    'fps': FPS, 'duration': duration, 'voEnd': round(vo_end, 3),
    'rec': {'s': round(rec_at, 3), 'e': round(REC_LAST + shift, 3), 'words': rw, 'phrases': phrases},
    'lines': lines,
    'L': {l['key']: [l['s'], l['e']] for l in lines},
}
json.dump(tl, open('src/oneverse/timeline.json', 'w'), ensure_ascii=False, indent=1)
print(f'duration {duration}s, recitation at {rec_at:.2f}–{REC_LAST + shift:.2f}, vo end {vo_end:.2f}')
