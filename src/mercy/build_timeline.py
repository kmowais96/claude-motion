"""Build src/mercy/timeline.json from the word-level voiceover timings in words.json.

Every beat is looked up by the words spoken, in order, so retiming the voiceover
only means re-running this script.
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
src = json.load(open(os.path.join(HERE, 'words.json')))
W = src['words']
norm = lambda s: ''.join(ch for ch in s.lower() if ch.isalnum() or ch == "'")

cursor = 0


def at(text, edge='s'):
    """Time of the next occurrence of `text` (one or more words) after the cursor."""
    global cursor
    parts = [norm(p) for p in text.split()]
    for i in range(cursor, len(W) - len(parts) + 1):
        if all(norm(W[i + k]['t']) == parts[k] for k in range(len(parts))):
            cursor = i + 1
            return round(W[i + (len(parts) - 1 if edge == 'e' else 0)][edge], 3)
    raise SystemExit(f'not found after {cursor}: {text}')


tl = {'fps': 30, 'duration': src['duration']}
tl['hook'] = {'gather': at('If'), 'sins': at('sins'), 'howBig': at('how big')}
tl['scale'] = {'imagine': at('Imagine'), 'cup': at('cup'), 'big1': at('Bigger'), 'mountain': at('mountain'),
               'big2': at('Bigger'), 'city': at('city'), 'still': at('Bigger still')}
tl['globe'] = {'allah': at('Allah'), 'gave': at('gave'), 'greater': at('greater'), 'all': at('all of that'),
               'end': at('that', 'e')}
tl['sky'] = {'said': at('He said'), 'reach': at('reach'), 'clouds': at('clouds'),
             'sins': [at('sin'), at('sin'), at('sin'), at('sin')], 'piled': at('piled'), 'heavens': at('heavens')}
tl['forgive'] = {'asked': at('asked'), 'forgive': at('I would forgive'), 'mind': at('and I would not mind'),
                 'mindEnd': at('mind', 'e'), 'allah': at('Allah'), 'says': at('says'), 'mind2': at('And I would not mind'),
                 'mind2End': at('mind', 'e')}
tl['weight'] = {'this': at('This is the sin'), 'down': at('down'), 'keeps': at('keeps'), 'certainty': at('certainty'),
                'mercy': at('mercy'), 'forgiveIt': at('I forgive it'), 'notMind': at('I do not mind'), 'end': at('mind', 'e')}
tl['door'] = {'oh': at('Oh'), 'call': at('call upon'), 'hope': at('hope'), 'forgive': at('I will forgive'),
              'end': at('you', 'e')}
tl['earth'] = {'oh': at('Oh'), 'came': at('came'), 'sins': at('sins'), 'earth': at('Earth'), 'meet': at('meet'),
               'forgiveness': at('forgiveness'), 'end': at('great', 'e')}
tl['twice'] = {'always': at('Always'), 'shaitan': at('Shaitan'), 'twice': at('twice'), 'once1': at('once'),
               'wrong': at('wrong'), 'once2': at('once'), 'never': at('never'), 'forgiven': at('forgiven'),
               'end': at('forgiven', 'e') if False else None}
tl['twice']['end'] = round(next(w['e'] for w in W if norm(w['t']) == 'forgiven'), 3)
tl['finale'] = {'allahs': at("Allah's"), 'forgiveness': at('forgiveness'), 'greater': at('greater')}
tl['end'] = {'follow': at('Follow'), 'guide': at('Guide'), 'reminders': at('reminders')}

# captions: one clause per chunk; long clauses split into balanced pieces of <= 26 chars
import math
clauses, cur = [], []
for i, w in enumerate(W):
    cur.append(i)
    nxt = W[i + 1] if i + 1 < len(W) else None
    if w['t'].rstrip('"')[-1:] in ',.?!:' or nxt is None or nxt['s'] - w['e'] > 0.5:
        clauses.append(cur)
        cur = []
caps = []
for c in clauses:
    txt = ' '.join(W[j]['t'] for j in c)
    if len(txt) <= 28:
        caps.append(c)
        continue
    n = math.ceil(len(txt) / 26)
    target = len(txt) / n
    pieces, piece, acc = [], [], 0
    for j in c:
        if piece and acc + len(W[j]['t']) > target + 4 and len(pieces) < n - 1:
            pieces.append(piece)
            piece, acc = [], 0
        piece.append(j)
        acc += len(W[j]['t']) + 1
    pieces.append(piece)
    caps.extend(pieces)
merged = []
for c in caps:
    if merged and len(' '.join(W[j]['t'] for j in merged[-1])) < 8 and \
            len(' '.join(W[j]['t'] for j in merged[-1] + c)) <= 30:
        merged[-1] = merged[-1] + c
    else:
        merged.append(c)
caps = merged
tl['captions'] = [{'s': W[c[0]]['s'], 'e': W[c[-1]]['e'], 'w': c} for c in caps]
tl['words'] = W
json.dump(tl, open(os.path.join(HERE, 'timeline.json'), 'w'), indent=1)
print({k: v for k, v in tl.items() if k not in ('words', 'captions')})
print(len(caps), 'captions;', max(len(' '.join(W[j]['t'] for j in c['w'])) for c in tl['captions']), 'max chars')
