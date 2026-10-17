#!/bin/sh
# Urdu voiceover build: the same page and foley, timed to the Urdu narration (vo-ur/).
# Works on a copy of this folder whose sentences.json is the Urdu timing; English captions stay.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
WORK=${WORK:-/tmp/deebacha-ur}
VO=${VO:-/mnt/project-files/tafsir/deebacha-video/urdu/vo/narration-ur.wav}
rm -rf "$WORK"; mkdir -p "$WORK"
(cd "$HERE" && tar cf - --exclude=./out --exclude=./events.json --exclude=./stills .) | (cd "$WORK" && tar xf -)
cp "$HERE/vo-ur/sentences-ur.json" "$WORK/sentences.json"
VO="$VO" sh "$WORK/build.sh"
mkdir -p "$HERE/out"; cp "$WORK/out/deebacha.mp4" "$HERE/out/deebacha-ur.mp4"
