"""Narration + effects for MannersShort, mastered to -14 LUFS / -1.5 dBTP.

    python3 sfx/cues/manners_mix.py public/manners/vo.mp3
"""
import json
import subprocess
import sys

VO = sys.argv[1] if len(sys.argv) > 1 else 'public/manners/vo.mp3'
SFX = 'public/manners/sfx.wav'
OUT = 'public/manners/mix.wav'
tl = json.load(open('src/manners/timeline.json'))
dur = tl['duration']

# Voice: gentle high-pass, a little compression, a touch of room so it sits on the picture.
voice = ('[0:a]aresample=48000,pan=stereo|c0=c0|c1=c0,highpass=f=80,'
         'acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120:makeup=2,'
         'aecho=0.8:0.5:28|41:0.10|0.06[v]')
fx = '[1:a]aresample=48000,volume=1.0[f]'
mix = f'[v][f]amix=inputs=2:normalize=0,apad,atrim=0:{dur}'
loud = 'loudnorm=I=-14:TP=-1.5:LRA=9'
cmd = ['ffmpeg', '-loglevel', 'error', '-y', '-i', VO, '-i', SFX, '-filter_complex',
       f'{voice};{fx};{mix},{loud}[o]', '-map', '[o]', '-ar', '48000', OUT]
subprocess.run(cmd, check=True)
print('wrote', OUT)
