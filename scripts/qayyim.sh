#!/usr/bin/env bash
# Build the Ibn al-Qayyim reels: timelines → sound → picture → mux.
#   scripts/qayyim.sh            all reels, full resolution → out/qayyim/<id>.mp4
#   scripts/qayyim.sh --draft    half resolution, no sound → out/qayyim-draft/<id>.mp4
#   scripts/qayyim.sh 02-madarij [--draft]   one reel
set -euo pipefail
cd "$(dirname "$0")/.."
draft=0; ids=()
for a in "$@"; do [[ $a == --draft ]] && draft=1 || ids+=("$a"); done
node scripts/qayyim-timeline.mjs > /dev/null
if [[ ${#ids[@]} -eq 0 ]]; then
  ids=($(ls reels/qayyim | grep -E '^[0-9]{2}-[a-z]+\.json$' | sed 's/\.json$//'))
fi
for id in "${ids[@]}"; do
  tl=reels/qayyim/$id.json
  if [[ $draft == 1 ]]; then
    mkdir -p out/qayyim-draft
    npx remotion render "Qayyim-$id" "out/qayyim-draft/$id.mp4" --scale=0.5 --crf=28 --log=error
  else
    mkdir -p out/qayyim public/qayyim
    python3 -m sfx sfx/cues/qayyim.py --timeline "$tl" --out "public/qayyim/$id.wav"
    npx remotion render "Qayyim-$id" "out/qayyim/$id-silent.mp4" --log=error
    ffmpeg -loglevel error -y -i "out/qayyim/$id-silent.mp4" -i "public/qayyim/$id.wav" -map 0:v -map 1:a \
      -c:v copy -c:a aac -b:a 256k -movflags +faststart -shortest "out/qayyim/$id.mp4"
    rm "out/qayyim/$id-silent.mp4"
  fi
  echo "done $id"
done
