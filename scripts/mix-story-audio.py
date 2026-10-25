#!/usr/bin/env python3
"""Build a voiced story reel's soundtrack: narration + natural sound + the movement layer.

A voiced reel has no music. The narration leads, recorded-style sound effects sit under it
at the second their event is spoken, and the synthesized movement layer (sfx/cues/*_vo.py)
marks each morph. Every element is matched to a target RMS before mixing, so swapping a
clip for a louder or quieter one does not change the balance.

    python3 scripts/mix-story-audio.py reels/qayyim-stories/audio/01-doorstep.json out.wav

The plan's "at" times are seconds on the reel's timeline; see the reel JSON next to it.
"""

import argparse
import json
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
TARGET_LUFS = -14.0
CEILING_DB = -2.0
VOICE_RMS = -20.0


def run(cmd):
    out = subprocess.run(cmd, capture_output=True, text=True)
    if out.returncode:
        sys.exit(f"{cmd[0]} failed:\n{out.stderr[-2000:]}")
    return out


def rms_db(path):
    out = run(["ffmpeg", "-hide_banner", "-i", str(path), "-af",
               "astats=measure_overall=RMS_level:measure_perchannel=0", "-f", "null", "-"])
    m = re.findall(r"RMS level dB:\s*(-?\d+\.?\d*)", out.stderr)
    if not m:
        sys.exit(f"could not measure {path}")
    return float(m[-1])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("plan")
    ap.add_argument("out")
    ap.add_argument("--duration", type=float, help="pad or trim the mix to this many seconds")
    ap.add_argument("--moves", help="rendered movement-layer WAV (from the plan's cue sheet)")
    args = ap.parse_args()

    plan = json.loads(pathlib.Path(args.plan).read_text())
    base = ROOT / plan["dir"]
    inputs, filters, labels = [], [], []

    def add(path, gain_db, delay_s=0.0, loop_to=None, fade=0.0):
        i = len(labels)
        inputs.extend(["-i", str(path)])
        f = f"[{i}:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo"
        if loop_to:
            f += f",aloop=loop=-1:size=2e9,atrim=0:{loop_to}"
            if fade:
                f += f",afade=t=in:st=0:d={fade},afade=t=out:st={max(0, loop_to - fade):.3f}:d={fade}"
        f += f",volume={gain_db:.2f}dB"
        if delay_s > 0:
            ms = int(round(delay_s * 1000))
            f += f",adelay={ms}|{ms}"
        label = f"[a{i}]"
        filters.append(f + label)
        labels.append(label)

    voice = base / plan["voice"]
    dur = args.duration or float(run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                      "-of", "csv=p=0", str(voice)]).stdout.strip())
    add(voice, VOICE_RMS - rms_db(voice))

    bed = plan.get("bed")
    if bed:
        p = base / bed["file"]
        add(p, bed["rms_db"] - rms_db(p), loop_to=dur, fade=bed.get("fade", 1.5))

    for cue in plan.get("cues", []):
        p = base / cue["file"]
        add(p, cue["rms_db"] - rms_db(p), delay_s=cue["at"])

    if args.moves:
        p = pathlib.Path(args.moves)
        add(p, plan.get("moves_rms_db", -38) - rms_db(p))

    chain = ";".join(filters)
    mix = "".join(labels) + f"amix=inputs={len(labels)}:normalize=0:dropout_transition=0"
    body = (f"alimiter=limit={CEILING_DB}dB:level=disabled,"
            f"atrim=0:{dur},apad=whole_dur={dur}")
    raw = pathlib.Path(args.out).with_suffix(".premaster.wav")
    run(["ffmpeg", "-loglevel", "error", "-y", *inputs,
         "-filter_complex", f"{chain};{mix},{body}[out]", "-map", "[out]",
         "-ar", "48000", "-ac", "2", str(raw)])

    # Two passes: one-pass loudnorm lands a dB or two off, which a -14 LUFS target can't absorb.
    norm = f"loudnorm=I={TARGET_LUFS}:TP={CEILING_DB}:LRA=11"
    probe = run(["ffmpeg", "-hide_banner", "-i", str(raw), "-af", f"{norm}:print_format=json",
                 "-f", "null", "-"]).stderr
    stats = json.loads(probe[probe.rindex("{"):probe.rindex("}") + 1])
    measured = ":".join(f"measured_{k}={stats['input_' + k]}" for k in ("i", "tp", "lra", "thresh"))
    run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(raw), "-af",
         f"{norm}:{measured}:offset={stats['target_offset']}:linear=true",
         "-ar", "48000", "-ac", "2", args.out])
    raw.unlink()
    print(f"wrote {args.out}: {dur:.2f}s, {len(labels)} layers")


if __name__ == "__main__":
    main()
