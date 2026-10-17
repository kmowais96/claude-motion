#!/bin/sh
# One command: picture, events, foley + voice mix, mux. Needs the narration WAV (not in git).
set -e
LIB=${LIB:-/root/lemo-opuscar}
HERE=$(cd "$(dirname "$0")" && pwd)
VO=${VO:-/mnt/project-files/tafsir/deebacha-video/vo2/narration-v2.wav}
export PLAYWRIGHT_CHROME=${PLAYWRIGHT_CHROME:-/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell}
mkdir -p "$HERE/out"
cd "$LIB"
node core/render/events.mjs "$HERE"
node core/render/video.mjs "$HERE" --fps 24 --workers ${WORKERS:-4} --out "$HERE/out/video.mp4"
"$LIB/.venv/bin/python" "$HERE/mix.py" "$HERE/events.json" "$VO" "$HERE/out/mix.wav"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/out/deebacha.mp4" 24
