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

## Sayings series

10 reels · 15–24 s each · source: [`reels/qayyim-sayings/content.json`](../../reels/qayyim-sayings/content.json)

> Great. Now do same for 10 of his sayings. Ensure the frame changes every 3 seconds.

Follow-up after the first cut only changed the text on each beat:

> You have not been honest. It is not new frame every 3 seconds.

The content file sets `"cadence": 3`, so every card (and the end card) gets exactly 3 s, and each card names its own `motif`. On a cadence reel every beat is a full scene change: a new line drawing that draws itself in, a new background tone (ink, green, maroon, navy in turn), the next line of text, and a crossfade cut. A beat bar under the label shows the rhythm, and the end card is always a mihrab arch with the book title. Build with `npm run qayyim:sayings`.

Sources: *Madarij al-Salikin* (the heart's scattering; reliance and turning back as the two halves of the religion; the religion is all character), *Al-Wabil al-Sayyib* (between a blessing and a sin; the hardness only dhikr melts), *Miftah Dar al-Sa'adah* (glass, not a sponge, his teacher's advice), *Al-Fawa'id* (seek your heart in three places; be rich with Allah), *Al-Jawab al-Kafi* (sins are wounds; du'a is a medicine). Closing lines such as "Turn back while there is time" and "So how do you treat people?" are reflections added for the reel, not his words.
