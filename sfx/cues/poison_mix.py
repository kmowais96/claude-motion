"""Narration + effects for PoisonReel, mastered to -14 LUFS / -1.5 dBTP.

    python3 sfx/cues/poison_mix.py
"""
import json
import subprocess

VO = 'public/poison/vo.wav'
SFX = 'public/poison/sfx.wav'
OUT = 'public/poison/mix.wav'
dur = json.load(open('src/poison/timeline.json'))['duration']

voice = ('[0:a]aresample=48000,pan=stereo|c0=c0|c1=c0,highpass=f=80,'
         'acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120:makeup=2,'
         'aecho=0.8:0.5:28|41:0.10|0.06[v]')
fx = '[1:a]aresample=48000,volume=1.0[f]'
mix = f'[v][f]amix=inputs=2:normalize=0,apad,atrim=0:{dur}'
loud = 'loudnorm=I=-14:TP=-1.5:LRA=9'
subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', VO, '-i', SFX, '-filter_complex',
                f'{voice};{fx};{mix},{loud}[o]', '-map', '[o]', '-ar', '48000', OUT], check=True)
print('wrote', OUT)
