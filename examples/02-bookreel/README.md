# 02 · Book Reel (vertical, narrated)

42 s · 1080×1920 · 30 fps · narration + sound bed, −14 LUFS · source: [`src/bookreel/`](../../src/bookreel/)

A reusable template for narrated book Reels: stills with a slow push, word-by-word captions timed to the voice, one line of Arabic, an end card and a cover. This example is Reel 1 of a series on Ibn al-Qayyim's *Tuhfat al-Mawdud* (p. 10, on the verse 2:187).

## Prompt

> Build it. The next Ibn al Qayyim reel.

## Run it

`day.json` and `words.json` here are the inputs. The narration audio and the stills belong to the series and are not in this repo; point `--stills` at a folder laid out as `batch-NN/MM-*.png` and put the narration next to `day.json`.

```bash
python3 scripts/bookreel.py examples/02-bookreel --draft
```

Format and options: [`src/bookreel/README.md`](../../src/bookreel/README.md).
