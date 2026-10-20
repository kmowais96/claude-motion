#!/usr/bin/env python3
"""Find half-painted frames in rendered videos: a frame much darker than both neighbours.

Heavy SVG blurs can make headless Chromium hand over a frame before it has finished painting.
Exit status 1 when any video has suspicious frames, so a build can re-render it.

    python3 scripts/check-frames.py out/qayyim-stories/*.mp4
"""

import subprocess
import sys
from fractions import Fraction

W, H = 27, 48


def suspicious(path):
    raw = subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-i", path, "-vf", f"scale={W}:{H},format=gray", "-f", "rawvideo", "-"],
        capture_output=True,
    ).stdout
    rate = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v", "-show_entries", "stream=r_frame_rate", "-of", "csv=p=0", path],
        capture_output=True,
        text=True,
    ).stdout.split()[0].rstrip(",")
    fps = float(Fraction(rate))
    n = len(raw) // (W * H)
    lum = [sum(raw[i * W * H : (i + 1) * W * H]) / (W * H) for i in range(n)]
    return [round(i / fps, 2) for i in range(1, n - 1) if min(lum[i - 1], lum[i + 1]) > 3 and lum[i] < 0.6 * min(lum[i - 1], lum[i + 1])]


bad = False
for path in sys.argv[1:]:
    hits = suspicious(path)
    print(f"{path}: {'ok' if not hits else f'{len(hits)} suspicious frame(s) at ' + ', '.join(map(str, hits)) + ' s'}")
    bad |= bool(hits)
sys.exit(1 if bad else 0)
