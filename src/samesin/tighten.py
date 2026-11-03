"""Shorten long pauses in the narration and speed it up slightly, keeping pitch; remap word timings.

    python3 src/samesin/tighten.py <raw.mp3> <words.json>   ->  public/samesin/vo.mp3, src/samesin/words.json
"""
import json
import re
import subprocess
import sys
from pathlib import Path

RAW, WORDS = sys.argv[1], sys.argv[2]
KEEP = 0.32     # longest pause left between phrases
TEMPO = 1.06    # gentle speed-up; the voice stays natural
HERE = Path(__file__).parent

log = subprocess.run(['ffmpeg', '-hide_banner', '-i', RAW, '-af', 'silencedetect=n=-40dB:d=0.3', '-f', 'null', '-'],
                     capture_output=True, text=True).stderr
st = [float(x) for x in re.findall(r'silence_start: ([0-9.]+)', log)]
en = [float(x) for x in re.findall(r'silence_end: ([0-9.]+)', log)]
cuts = []  # (from, to) removed from the middle of each long pause
for a, b in zip(st, en):
    if b - a > KEEP:
        mid = (a + b) / 2
        cuts.append((mid - (b - a - KEEP) / 2, mid + (b - a - KEEP) / 2))

def remap(t):
    removed = sum(min(b, t) - a for a, b in cuts if t > a)
    return (t - removed) / TEMPO

keep, last = [], 0.0
for a, b in cuts:
    keep.append(f"between(t,{last:.3f},{a:.3f})")
    last = b
keep.append(f"gte(t,{last:.3f})")
af = f"aselect='{'+'.join(keep)}',asetpts=N/SR/TB,atempo={TEMPO}"
subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', RAW, '-af', af, '-c:a', 'libmp3lame', '-b:a', '192k', 'public/samesin/vo.mp3'], check=True)
words = [[w, round(remap(a), 3), round(remap(b), 3)] for w, a, b in json.load(open(WORDS))]
json.dump(words, open(HERE / 'words.json', 'w'))
print(f'{len(cuts)} pauses shortened, removed {sum(b - a for a, b in cuts):.2f}s; last word ends {words[-1][2]}s')
