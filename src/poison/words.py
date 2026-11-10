# Scribe word times on v3 take 1 -> the sped-up clock (atempo 1.06, 0.05 s lead) used by public/poison/vo.wav
import json, sys
SPD, LEAD = 1.06, 0.05
W = json.load(open(sys.argv[1]))['words']
json.dump([[w['text'], round(LEAD + w['start'] / SPD, 3), round(LEAD + w['end'] / SPD, 3)] for w in W if w['type'] == 'word'], open('src/poison/words.json', 'w'))
