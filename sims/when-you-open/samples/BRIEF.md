# Brief for one style sample of "When You Open the Qur'an"

You build ONE short sample (about 20–30 s) of one scene in one lemo-opuscar style. Full plan: /mnt/project-files/tafsir/when-you-open-quran/style-plan.md. Script: /mnt/project-files/tafsir/when-you-open-quran/script-original.md (read your scene's Visual and Narration).

## Where
- Your folder: /home/claude/claude-motion/sims/when-you-open/samples/<your-folder>/ (self-contained: index.html, main.js, your code, copies of what you need). Do not edit anything outside it.
- Style library: /home/claude/lemo-opuscar. Read styles/<style>/STYLE.md fully (it is fixed: keep its look, colour, type, motion, pitfalls). Learn techniques from styles/<style>/demo/ but never copy its story, shots or props. Copy engine code you need into your folder.
- Reference for the page contract and captions: /home/claude/claude-motion/sims/when-you-open/{index.html,main.js,timing.js,caption.js,fonts/}. Copy timing.js, caption.js and fonts/ into your folder and use drawCaption for the narration captions (same serif in every scene, so the film reads as one piece). Narration timing: estimate(lines, t0) from timing.js. Use your scene's real narration lines from the script, in order, for the part your sample covers.
- Page contract: window.READY, window.render(t) pure in time (no Math.random without a seeded hash, no Date, no CSS animation), window.DUR, window.TEXTS, window.EV.

## Render
From /home/claude/lemo-opuscar with `export PLAYWRIGHT_CHROME=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell`:
- Stills: `node core/render/still.mjs <your-folder> 2 8 15 ... --out <your-folder>/stills`
- Video: `node core/render/video.mjs <your-folder> --fps 24 --workers 2 --out <your-folder>/sample.mp4` (screenshots time out at 30 s per frame: keep a frame well under 10 s; at most 2 workers, other renders share the machine). Run long renders with `timeout` and in the foreground only if under 10 minutes; otherwise reduce cost.
- Never kill processes you did not start.

## Rules (all compulsory)
- No faces anywhere. Never depict Allah, a prophet or an angel. People are small, seen from behind or as featureless shapes.
- No look where a pen, brush or hand draws lines on screen. Things appear by light, by sliding, by printing, by unfolding, by being laid down; never by being drawn stroke by stroke.
- Islamic terms (Allah, not God). Arabic only if it is a single verified word given in your task; otherwise show text as abstract bands. No Qur'an verse text.
- Calm, humble, warm. No music, no sound needed for the sample.
- karpathy-guidelines: simplest thing that works, verify by looking at your own stills before claiming done. Look at every still (Read the jpg) and fix what is weak: legibility of the captions, composition, faithfulness to STYLE.md, the scene's one idea being readable without the narration.

## Report back
Path of sample.mp4, 4–6 still paths, two sentences on what the sample shows, and anything you could not do.
