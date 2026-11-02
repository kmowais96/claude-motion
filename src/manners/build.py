"""Turn script.json + word timings into timeline.json.

    python3 src/manners/build.py                 # provisional timings (2.7 words/s), no audio needed
    python3 src/manners/build.py words.json      # real timings: [[word, start, end], ...] from the narration
"""
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).parent
FPS = 30
TAIL = 3.2  # end card after the last word

script = json.load(open(HERE / 'script.json'))['lines']
tokens = []  # (line_index, word, colour)
for i, ln in enumerate(script):
    for raw in ln['text'].split():
        m = re.match(r'\[(r|g|t)\](.*)', raw)
        tokens.append((i, m.group(2) if m else raw, m.group(1) if m else None))

norm = lambda w: re.sub(r"[^a-z0-9]", '', w.lower().replace('’', "'"))

if len(sys.argv) > 1:
    spoken = json.load(open(sys.argv[1]))
    spoken = [s for s in spoken if norm(s[0])]
    # Align by normalised text, in order; the script is what was read, so a mismatch is an error.
    times, j = [], 0
    # On screen "1,200"; spoken "twelve hundred".
    SAID = {'1200': ['twelve', 'hundred']}
    for _, w, _ in tokens:
        said = SAID.get(norm(w), [norm(w)])
        while j < len(spoken) and norm(spoken[j][0]) != said[0]:
            j += 1
        if j + len(said) > len(spoken):
            raise SystemExit(f'word not found in narration: {w}')
        times.append((spoken[j][1], spoken[j + len(said) - 1][2]))
        j += len(said)
else:
    times, t = [], 0.3
    for k, (i, w, _) in enumerate(tokens):
        d = 0.16 + 0.028 * len(w)
        times.append((t, t + d))
        t += d + (0.38 if w[-1] in '.?' else 0.1 if w[-1] == ',' else 0.03)

lines = []
for i, ln in enumerate(script):
    ws = [(w, c, times[k]) for k, (li, w, c) in enumerate(tokens) if li == i]
    lines.append({
        'key': ln['key'], 'group': ln['group'],
        's': round(ws[0][2][0], 3), 'e': round(ws[-1][2][1], 3),
        'words': [{'t': w, 'c': c, 's': round(a, 3), 'e': round(b, 3)} for w, c, (a, b) in ws],
    })
vo_end = lines[-1]['e']
tl = {'fps': FPS, 'voEnd': round(vo_end, 3), 'end': round(vo_end + 0.6, 3), 'duration': round(vo_end + 0.6 + TAIL, 2),
      'lines': lines}
json.dump(tl, open(HERE / 'timeline.json', 'w'), indent=1)
print('vo ends', round(vo_end, 2), 'duration', tl['duration'])
