# 02 · Ibn al-Qayyim reel series

9 reels · 25–31 s each · 1080×1920 · 30 fps · stereo, −14 LUFS · source: [`src/qayyim/`](../../src/qayyim/)

Short vertical reels on the works of Ibn Qayyim al-Jawziyya (d. 751 AH): a series opener, then one book per reel (*Al-Fawa'id*, *Madarij al-Salikin*, *Ighathat al-Lahfan*, *Al-Wabil al-Sayyib*, *Al-Jawab al-Kafi*, *Miftah Dar al-Sa'adah*, *'Uddat al-Sabirin*, *Zad al-Ma'ad*). Kinetic serif type over an eight-point star lattice, a line-art object per reel that reacts to the key line (no faces or figures), and a book card with the Arabic title at the end.

## Prompt

> i need short reels related to works of Ibn Al-Qayyim

Scripts and storyboards first (English), then:

> proceed

> ensure no faces shown

## How it's built

- `reels/qayyim/content.json` holds every reel's text; `*word*` marks the accent word and `"mark": true` makes the motif react to that card.
- `scripts/qayyim-timeline.mjs` turns it into one timeline per reel (holds scale with word count), which both the picture (`src/qayyim/QayyimReel.tsx`) and the sound (`sfx/cues/qayyim.py`) read.
- `npm run qayyim` builds everything into `out/qayyim/<id>.mp4`; `npm run qayyim:draft` makes fast silent drafts. One reel: `scripts/qayyim.sh 02-madarij`.

## Accuracy

On-screen lines are paraphrases of well-known passages, not word-for-word translations. Check them against a reliable edition before publishing.
