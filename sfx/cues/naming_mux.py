"""Mux out/naming-silent.mp4 with public/naming-mix.wav, two-pass loudnorm to -14 LUFS / -1.5 dBTP.

    python3 sfx/cues/naming_mux.py
"""
import json
import re
import subprocess

MIX = 'public/naming-mix.wav'
PRE = 'acompressor=threshold=-18dB:ratio=3:attack=5:release=120:makeup=2,alimiter=limit=0.3:attack=2:release=60:level=false'
target = 'I=-14:TP=-1.5:LRA=11'
probe = subprocess.run(['ffmpeg', '-hide_banner', '-i', MIX, '-af', f'{PRE},loudnorm={target}:print_format=json', '-f', 'null', '-'],
                       capture_output=True, text=True).stderr
m = json.loads(re.search(r'\{[^{}]*\}', probe[probe.rindex('[Parsed_loudnorm'):]).group(0))
af = (f"{PRE},loudnorm={target}:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
      f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', 'out/naming-silent.mp4', '-i', MIX, '-map', '0:v', '-map', '1:a',
                '-c:v', 'libx264', '-crf', '20', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-af', af, '-ar', '48000',
                '-c:a', 'aac', '-b:a', '256k', '-movflags', '+faststart', '-shortest', 'out/naming.mp4'], check=True)
print('wrote out/naming.mp4')
