# Brief for each scene builder

You build some sections of one film. Read, in this order:
1. `TREATMENT.md` (this folder): the house rules and your sections' direction. Follow it; you may improve shots inside a section if it serves the narration better, but keep the meaning and the rules.
2. `/root/lemo-opuscar/styles/<style>/STYLE.md` — the fixed invariants of your style. Keep all of them, except the ones this brief overrides.
3. `/root/lemo-opuscar/styles/<style>/DEMO.md` and `demo/` — only to learn and copy engine code (brushes, cuts, paper, lines). Never its story, shots or props. Copy what you need into `lib/<style>/` in this folder (never import from `/root/lemo-opuscar/styles/…`, never edit the library). `/core/lib.js` may be imported by absolute URL.
4. `shell.js`, `main.js`, `sentences.json` here, to see the contract.

## The contract
Each section is `sec/sNN.js` with a default export:
```js
export default {
  style: 'woodcut',            // keep the one the stub has: picks the caption look in shell.js
  page: 'p. 9',                // keep
  noCaption: [3],              // optional: local sentence indices whose words are already on screen
  async init(T) {},            // optional: load images, build caches (deterministic)
  render(ctx, t, T) {},        // draw the full 1920×1080 frame at global time t (opaque!)
  texts(t, T) { return [] },   // optional: on-screen words [{id,text,x0,y0,x1,y1}] for readcheck
  events(T) { return [] },     // sound cues [{t, type, ...}] for foley (type: e.g. 'cut','paper','light','brush','nib','burin','wash','stamp','thud')
};
```
`T.t0`/`T.t1` are the section's first sentence start / last sentence end; `T.at(i)`, `T.end(i)`, `T.k(i,f)`, `T.word(i,w)` give times of local sentence `i` (see shell.js); `T.s[i].text` is the sentence. Read the sentences of your sections from `sentences.json` (`sec` field) and time every beat to them, never hard-coded seconds. `render` is called for t slightly before `T.t0` (about 1.2 s) and after `T.t1` (about 1.2 s, 4 s for the last section): the frame must look right there too (finished picture held, or the opening state).

Captions are drawn by the shell on top of your frame in the style's subtitle look, centred around y ≈ 990–1006. Keep the bottom 150 px calm (woodcut: the plate sits inside a paper margin, image area about y 50–920, caption in the margin below). Lightbox captions are light text with a shadow: the lower part of the frame must be dark enough.

## Rules
- **No faces, no human figures, no hands, no people's silhouettes.** Objects, places and light carry everything.
- Islamic terms: Allah, the Prophet ﷺ. Arabic text exactly as given, in `"Amiri"` (loaded): al-Fatihah 1:2 `الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ`; Hud 11:88 `وَمَا تَوْفِيقِي إِلَّا بِاللَّهِ`; `تفهيم القرآن`; `كُفْر`; `الْقُرْآن`. Canvas: set `ctx.direction = 'rtl'` for Arabic.
- Fonts available (fonts/fonts.css): Amiri 400/700, IM Fell English (+italic), IM Fell English SC, Cormorant Garamond 400/500/600 (+italic 400/500), Caveat 400/600, Sacramento, Bodoni Moda 400/600 (+italic), Pinyon Script, IBM Plex Mono. Nothing else; no network at render time.
- **Deterministic**: no `Math.random()` (use `mulberry(seed)` from `/core/lib.js`), no `Date`, no state carried between frames. Caches are fine if built deterministically (on first use or in `init`). Any frame must render alone, in any order.
- **Speed**: the film is 627 s at 24 fps = 15,000 frames. Budget about 150 ms per frame for your sections in headless Chrome here. WebGL runs on SwiftShader (software, slow): prefer Canvas 2D; if you port a WebGL compositor, measure it. Cache static layers as offscreen canvases. Grain is added later by ffmpeg — don't draw per-frame grain.
- The film is 24 fps; `render(t)` must be smooth at any t.
- Text you draw on screen must stay fully visible long enough to read (shell's `TEXTS` + readcheck: chars/15 + 1.5 s).
- Write only `sec/sNN.js` for your sections and files under `lib/<style>/` (and `assets/<style>/` if you generate any). Don't touch `shell.js`, `main.js`, `index.html`, other sections, or `sentences.json`. If you need a shell change, say so in your report.

## Checking your work
From `/root/lemo-opuscar`, with `export PLAYWRIGHT_CHROME=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell`:
```sh
node core/render/still.mjs /home/claude/claude-motion/sims/deebacha-v2 <t> <t> … --out <your scratch dir>   # stills, prints ms per frame
.venv/bin/python core/render/sheet.py out.jpg a.jpg b.jpg … --cols 4 --w 480                                # contact sheet
```
Use your own scratch directory under `/tmp/claude-0/-home-claude/30f84b7e-a1ec-5c32-9ac3-4c0bfe9a6072/scratchpad/<style>/`. Look at the stills yourself (Read the jpg). Check: every beat in the treatment lands on its words; the style reads unmistakably as its `STYLE.md`; nothing collides with the caption band; no blank or broken frames at the section's edges; per-frame time within budget. Iterate until a full pass over the section (a still every ~2 s, plus 0.2 s strips around key actions) is clean.

## Report back
Short: what each section shows beat by beat, the measured ms/frame, the `events` types you emit, anything you deviated from in the treatment and why, and any shell change you need.
