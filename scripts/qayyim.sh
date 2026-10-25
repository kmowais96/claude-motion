#!/usr/bin/env bash
# Build the Ibn al-Qayyim reels: timelines → sound → picture → mux.
#   scripts/qayyim.sh                     book series, full resolution → out/qayyim/<id>.mp4
#   scripts/qayyim.sh --sayings           sayings series → out/qayyim-sayings/<id>.mp4
#   scripts/qayyim.sh --stories           story series → out/qayyim-stories/<id>.mp4
#   scripts/qayyim.sh --draft             half resolution, no sound → out/<series>-draft/<id>.mp4
#   scripts/qayyim.sh 02-madarij [--draft]   one reel
set -euo pipefail
cd "$(dirname "$0")/.."
draft=0; series=qayyim; comp=Qayyim; cue=qayyim.py; capture=(); ids=()
for a in "$@"; do
  case $a in
    --draft) draft=1 ;;
    --sayings) series=qayyim-sayings; comp=QayyimSaying ;;
    --stories) series=qayyim-stories; comp=QayyimStory; cue=qayyim_story.py; capture=(--image-format=png) ;;
    *) ids+=("$a") ;;
  esac
done
node scripts/qayyim-timeline.mjs "reels/$series" > /dev/null
if [[ ${#ids[@]} -eq 0 ]]; then
  ids=($(ls "reels/$series" | grep -E '^[0-9]{2}-[a-z]+\.json$' | sed 's/\.json$//'))
fi
for id in "${ids[@]}"; do
  tl=reels/$series/$id.json
  if [[ $draft == 1 ]]; then
    mkdir -p "out/$series-draft"
    npx remotion render "$comp-$id" "out/$series-draft/$id.mp4" --scale=0.5 --crf=28 --log=error
  else
    mkdir -p "out/$series" "public/$series"
    plan=reels/$series/audio/$id.json
    if [[ -f $plan ]]; then
      # Voiced reel: no music — narration, natural sound, and the movement layer.
      dur=$(node -p "require('./$tl').duration")
      python3 -m sfx sfx/cues/qayyim_story_vo.py --timeline "$tl" --out "public/$series/$id-moves.wav"
      python3 scripts/mix-story-audio.py "$plan" "public/$series/$id.wav" --duration "$dur" \
        --moves "public/$series/$id-moves.wav"
    else
      python3 -m sfx "sfx/cues/$cue" --timeline "$tl" --out "public/$series/$id.wav"
    fi
    npx remotion render "$comp-$id" "out/$series/$id-silent.mp4" "${capture[@]}" --log=error
    # A half-painted frame is a visible flash: re-render one frame at a time if any slipped through.
    if ! python3 scripts/check-frames.py "out/$series/$id-silent.mp4"; then
      npx remotion render "$comp-$id" "out/$series/$id-silent.mp4" "${capture[@]}" --concurrency=1 --log=error
      python3 scripts/check-frames.py "out/$series/$id-silent.mp4"
    fi
    ffmpeg -loglevel error -y -i "out/$series/$id-silent.mp4" -i "public/$series/$id.wav" -map 0:v -map 1:a \
      -c:v copy -c:a aac -b:a 256k -movflags +faststart -shortest "out/$series/$id.mp4"
    rm "out/$series/$id-silent.mp4"
  fi
  echo "done $id"
done
