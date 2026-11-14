#!/usr/bin/env python3
"""One command from a Reel folder to a finished vertical video.

    python3 scripts/bookreel.py <reel-folder>            full render, sound, cover
    python3 scripts/bookreel.py <reel-folder> --draft    half-size picture, no cover
    python3 scripts/bookreel.py <reel-folder> --prepare  timeline and assets only (for `npm run studio`)

The folder holds day.json (scenes, hook, stills), words.json (spoken word start
times) and the narration audio. See src/bookreel/README.md for the format.
Stills are looked up as <stills>/batch-NN/MM-*.png for a pick written "NN-MM";
set --stills or $BOOKREEL_STILLS.
"""

import argparse
import glob
import json
import os
import re
import shutil
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FPS = 30
LEAD = 0.12       # a picture cuts in this long before its first word
END_CARD = 4.0    # seconds of end card after the last word
TAIL = 0.45       # breath between the last word and the end card
TARGET_LUFS = -14.0


def norm(word):
    return re.sub(r"[^a-z0-9']", "", word.lower().replace("’", "'"))


def parse(text):
    """'a *big gold* / next _red_' -> chunks of {w, style}."""
    chunks = []
    for part in text.split("/"):
        tokens, style = [], "n"
        for raw in part.split():
            lead = raw[0] if raw[0] in "*_" else ""
            if lead:
                style = "gold" if lead == "*" else "red"
                raw = raw[1:]
            closes = bool(raw) and raw[-1] in "*_"
            if closes:
                raw = raw[:-1]
            if raw:
                tokens.append({"w": raw.replace("~", " "), "style": style})
            if closes:
                style = "n"
        if tokens:
            chunks.append(tokens)
    return chunks


def align(scenes, words):
    """Give every scene token the start time of the spoken word it matches, in order."""
    spoken = [(norm(w), t) for w, t in words]
    pos, last = 0, 0.0
    for si, scene in enumerate(scenes):
        for chunk in scene["chunks"]:
            for tok in chunk:
                key = norm(tok["w"])
                if not key:
                    # an honorific shown in Arabic (ﷺ, رضي~الله~عنه) while the voice says it in
                    # transliteration: it rides on the word before, and the spoken words are skipped
                    tok["t"] = last
                    continue
                hit = next((j for j in range(pos, min(pos + 6, len(spoken))) if spoken[j][0] == key), None)
                if hit is None:
                    sys.exit(
                        f"scene {si + 1}: '{tok['w']}' is not in words.json near "
                        f"'{' '.join(w for w, _ in words[pos:pos + 6])}'. "
                        "The scene text has to be the narration, word for word."
                    )
                tok["t"] = last = round(spoken[hit][1], 3)
                pos = hit + 1
    if pos < len(spoken) - 1:
        sys.exit(f"words.json has {len(spoken) - pos} spoken words after the last scene; add them to a scene")


def find_still(pick, stills):
    batch, num = pick.split("-")
    hits = glob.glob(os.path.join(stills, f"batch-{batch}", f"{num}-*.png"))
    if not hits:
        sys.exit(f"still {pick} not found under {stills}/batch-{batch}/")
    return hits[0]


def run(cmd, **kw):
    print("$", " ".join(cmd))
    subprocess.run(cmd, check=True, cwd=ROOT, **kw)


def loudness(path):
    out = subprocess.run(
        ["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", "loudnorm=print_format=json", "-f", "null", "-"],
        capture_output=True, text=True, cwd=ROOT,
    ).stderr
    data = json.loads(out[out.rindex("{"):out.rindex("}") + 1])
    return float(data["input_i"]), float(data["input_tp"])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("folder")
    ap.add_argument("--draft", action="store_true")
    ap.add_argument("--prepare", action="store_true")
    ap.add_argument("--stills", default=os.environ.get("BOOKREEL_STILLS", "/mnt/project-files/stock-stills"))
    args = ap.parse_args()

    folder = os.path.abspath(args.folder)
    day = json.load(open(os.path.join(folder, "day.json")))
    spoken = json.load(open(os.path.join(folder, "words.json")))
    rid = day["id"]
    pub = os.path.join(ROOT, "public", "bookreel", rid)
    os.makedirs(pub, exist_ok=True)
    os.makedirs(os.path.join(ROOT, "out"), exist_ok=True)

    # ---- timeline -------------------------------------------------------
    scenes = day["scenes"]
    for s in scenes:
        s["chunks"] = parse(s["text"])
    align(scenes, spoken["words"])

    voice_end = spoken["duration"]
    end_at = round(voice_end + TAIL, 3)
    duration = round(end_at + END_CARD, 3)
    out_scenes, turn = [], None
    for i, s in enumerate(scenes):
        first = s["chunks"][0][0]["t"]
        start = 0.0 if i == 0 else round(first - LEAD, 3)
        src = find_still(s["still"], args.stills)
        name = f"{s['still']}.png"
        shutil.copyfile(src, os.path.join(pub, name))
        chunks = [{"start": round(c[0]["t"] - 0.08, 3), "words": c} for c in s["chunks"]]
        arabic = s.get("arabic")
        if arabic:
            at = arabic.pop("at", None)
            tok = next((t for c in s["chunks"] for t in c if at and norm(t["w"]) == norm(at)), None)
            arabic["start"] = tok["t"] if tok else start + 0.2
        if s.get("turn"):
            turn = start
        out_scenes.append({
            "start": start,
            "still": f"bookreel/{rid}/{name}",
            "hook": bool(s.get("hook")),
            "turn": bool(s.get("turn")),
            "y": s.get("y", 1290),
            "chunks": chunks,
            "arabic": arabic,
        })
    for a, b in zip(out_scenes, out_scenes[1:]):
        a["end"] = b["start"]
    out_scenes[-1]["end"] = end_at

    cover = day.get("cover", {})
    cover_still = cover.get("still", scenes[0]["still"])
    shutil.copyfile(find_still(cover_still, args.stills), os.path.join(pub, f"{cover_still}.png"))

    timeline = {
        "fps": FPS,
        "duration": duration,
        "id": rid,
        "number": day["number"],
        "total": day["total"],
        "series": day.get("series", "IBN AL-QAYYIM"),
        "book": day["book"],
        "page": day["page"],
        "handle": day["handle"],
        "hook": parse(day["hook"])[0],
        "action": parse(day["action"])[0],
        "next": day.get("next", ""),
        "cover": {"still": f"bookreel/{rid}/{cover_still}.png", "y": cover.get("y", 1180)},
        "turn": turn if turn is not None else end_at,
        "endAt": end_at,
        "scenes": out_scenes,
    }
    tl_path = os.path.join(pub, "timeline.json")
    json.dump(timeline, open(tl_path, "w"), ensure_ascii=False, indent=1)
    print(f"timeline: {len(out_scenes)} scenes, {duration}s -> {os.path.relpath(tl_path, ROOT)}")
    if args.prepare:
        return

    # ---- sound: quiet sfx bed under the narration, whole mix to -14 LUFS ---
    sfx = f"out/{rid}-sfx.wav"
    run([sys.executable, "-m", "sfx", "sfx/cues/bookreel.py", "--timeline", tl_path, "--out", sfx])
    narration = os.path.join(folder, day["narration"])
    premix = f"out/{rid}-premix.wav"
    run(["ffmpeg", "-loglevel", "error", "-y", "-i", narration, "-i", sfx, "-filter_complex",
         f"[0:a]aresample=48000,highpass=f=70,apad[v];[v][1:a]amix=inputs=2:duration=shortest:normalize=0[m]",
         "-map", "[m]", "-ac", "2", "-t", str(duration), premix])
    lufs, _ = loudness(premix)
    audio = f"out/{rid}-audio.wav"
    run(["ffmpeg", "-loglevel", "error", "-y", "-i", premix, "-af",
         f"volume={TARGET_LUFS - lufs:.2f}dB,alimiter=limit=-2dB:level=false:attack=3:release=60,aresample=48000",
         audio])
    lufs, tp = loudness(audio)
    print(f"audio: {lufs:.1f} LUFS, true peak {tp:.1f} dBTP")

    # ---- picture ---------------------------------------------------------
    env = dict(os.environ)
    if "REMOTION_BROWSER" not in env and os.path.exists("/opt/pw-browsers/chromium"):
        env["REMOTION_BROWSER"] = "/opt/pw-browsers/chromium"
    silent = f"out/{rid}-silent.mp4"
    render = ["npx", "remotion", "render", "BookReel", silent, f"--props={tl_path}"]
    if args.draft:
        render += ["--scale=0.5", "--crf=26"]
    run(render, env=env)
    final = f"out/{rid}-draft.mp4" if args.draft else f"out/{rid}.mp4"
    run(["ffmpeg", "-loglevel", "error", "-y", "-i", silent, "-i", audio, "-map", "0:v", "-map", "1:a",
         "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart", "-shortest", final])
    print("video:", final)
    if args.draft:
        return

    cover_png = f"out/{rid}-cover.png"
    run(["npx", "remotion", "still", "BookCover", cover_png, f"--props={tl_path}"], env=env)
    name = f"{rid}-{day['slug']}"
    shutil.copyfile(os.path.join(ROOT, final), os.path.join(folder, f"{name}.mp4"))
    shutil.copyfile(os.path.join(ROOT, cover_png), os.path.join(folder, f"{name}-cover.png"))
    print(f"delivered: {folder}/{name}.mp4 and {name}-cover.png")


if __name__ == "__main__":
    main()
