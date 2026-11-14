# BookReel: one command from a script to a finished Reel

A vertical 1080×1920, 30 fps template for narrated book Reels: stills that move,
word-by-word captions on cream paper labels, one line of Arabic, an end card and a cover.

```bash
python3 scripts/bookreel.py <reel-folder> --draft   # half size, about a minute
python3 scripts/bookreel.py <reel-folder>           # final mp4 + cover, copied back into the folder
python3 scripts/bookreel.py <reel-folder> --prepare # only write the timeline, then `npm run studio`
```

Needs Node 20+, Python 3 and ffmpeg. Stills are found under `$BOOKREEL_STILLS`
(or `--stills`) as `batch-NN/MM-*.png` for a pick written `NN-MM`.

## The Reel folder

| File | What it is |
|---|---|
| `day.json` | number, page, hook, action, scenes |
| `words.json` | `{"duration": 38.35, "words": [["There's", 0.0], ["a", 0.24], …]}`: every spoken word and its start time, from any speech-to-text with word timestamps |
| narration audio | the path in `day.json` → `narration` |

Each scene in `day.json`:

```json
{"still": "02-12", "y": 800,
 "arabic": {"kind": "ayah", "text": "…", "ref": "AL-BAQARAH 2:187", "y": 500, "at": "so"},
 "text": "Allah says: / so now, be with your wives / and *seek* what Allah has *written for you.*"}
```

- `text` is the narration for that picture, word for word. `/` starts a new caption card, `*…*` makes big gold words, `_…_` puts a red squiggle under them.
- `y` is the centre of the caption card (safe area is 270–1500). Pick it so the card misses the subject of the still.
- `arabic` is optional: `kind` is `ayah` (Amiri Quran, in brackets) or `his` (the author's words, Amiri Bold); `at` is the spoken word it appears on.
- `"hook": true` on the first scene shows the on-screen hook instead of captions, readable from frame 0.
- `"turn": true` marks the scene where the answer lands: the "?" badge goes and the sound swells.

A Reel outside a numbered series sets `"number": 0` (the tag shows `series` alone and the cover has no number) and can give `page` as a string such as `"no. 5075"`, shown after `book` on the chip and the end card.

An honorific the voice does not say goes after the name with `^`: `Umar^ra` shows Umar رضي الله عنه (`ra`, `raha` for a woman, `ranhum` for several, `rh` for رحمه الله). Punctuation can follow: `Umar^ra:`.

To show ﷺ where the voice says "peace be upon him", write `ﷺ` in the scene text and replace those four words in `words.json` with one `["ﷺ", start]` entry.

Every time in the video comes from `words.json`. The build stops with a clear message if a scene's text does not match the narration.

## What the build does

1. Aligns scene text to the spoken words and writes `public/bookreel/<id>/timeline.json` (also the props for `BookReel` and `BookCover`).
2. Renders the sound bed (`sfx/cues/bookreel.py`: air on cuts, one low swell at the turn, room tone; no instruments, no bells), mixes it under the narration and sets the whole mix to −14 LUFS.
3. Renders the picture, muxes, renders the cover.

Palette, fonts and the safe area live in `theme.ts`.
