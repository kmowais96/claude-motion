# Three questions every parent, from Ibn al-Qayyim: 60 s YouTube Short (9:16, 1080×1920, 30 fps)

The fourth Short in the Ibn al-Qayyim series, after the newborn, naming and daughters Shorts. The handle **@TheTazkiyyahGuide** stays small on screen throughout. The end card asks viewers to follow; it is not spoken.

**Brief:** "Do only bab 15. Include weak ones as well." Then, through the script rounds: start with "There are three questions every parent will be asked about their children", ask "who is questioned first, the parent or the child?" after the first question and answer it at the end, structure it question, pause, answer, and show the weak narration small on screen only.

**Source book:** Ibn Qayyim al-Jawziyya, *Tuhfat al-Mawdud bi Ahkam al-Mawlud*, **Bab 15** (on the obligation to teach and discipline children and be just between them), printed pages 224–229. Edition: ed. 'Abd al-Qadir al-Arna'ut, Maktabat Dar al-Bayan, Damascus, 1st ed. 1391/1971, read on al-Maktaba al-Shamela (book 6266, pages 222–227 there; Shamela's page index is two lower than the printed page).

## Concept: two timelines

A split screen. The top half is THEN (warm, a child being raised), the bottom half is NOW (cold, the same people grown). Each question gets a matched pair of photos. When the answer arrives the frame goes full and warm, and at the close the last NOW photo slides away, leaving only the child's hand in the father's: "Your child is still small."

## Files

| Path | What |
|---|---|
| `src/tarbiyah/TarbiyahShort.tsx` | Composition `TarbiyahShort` (palette and fonts from `src/newborn/theme.ts`) |
| `src/tarbiyah/words.json` | Word timings of the raw narration (ElevenLabs Scribe) |
| `src/tarbiyah/timeline.json` | Generated: beat starts and shifted word timings |
| `public/tarbiyah/*.jpg` | The client's photos: 13 in the cut, `faces.jpg` unused |
| `public/tarbiyah-vo-raw.mp3` | Narration: ElevenLabs eleven_v4, voice "Jerry B. - Hyper-Real Conversational Voice", take 1 of 2 |
| `sfx/cues/tarbiyah_vo.py` | Speeds the take up 11%, cuts it into 13 lines with set pauses, writes the timeline |
| `public/naming-nasheed.mp3` | Supplied input, not committed: the same client nasheed as the naming Short, used from 0:20 |
| `sfx/cues/tarbiyah_mix.py` | Nasheed bed (drops out for "So… who is asked first?"), whooshes, ticks, a clink on "the father", voice room |
| `sfx/cues/tarbiyah_mux.py` | Compress, limit, two-pass loudnorm to −14 LUFS / −1.5 dBTP, mux |

## Build

```bash
python3 sfx/cues/tarbiyah_vo.py
python3 sfx/cues/tarbiyah_mix.py
npx remotion render TarbiyahShort out/tarbiyah-silent.mp4
python3 sfx/cues/tarbiyah_mux.py        # -> out/tarbiyah.mp4
```

## Storyboard

| Beat | Narration | Visual |
|---|---|---|
| Hook | "There are three questions every parent will be asked about their children." | Family THEN / family NOW. |
| 01 Teach | "Did you teach them?" 'Ali: educate them, discipline them. The Prophet ﷺ: order them to pray at seven. | Prayer THEN / NOW. «علموهم وأدبوهم» p.224, «مروا أبناءكم بالصلاة لسبع» (Abu Dawud, hasan) p.224 |
| Hold | "But wait. On Judgment Day, who is asked first? The parent… or the child? Hold on to that." | Walk THEN / NOW. The question big, then pinned as a gold chip at the top until the end. |
| 02 Fair | "Were you fair between them?" The gift the Prophet ﷺ refused to witness. | Gift THEN / NOW. «اتقوا الله واعدلوا في أولادكم» (Bukhari & Muslim) p.227 |
| 03 Manners | "Did you raise them with manners?" No gift better than a good upbringing. | Dates THEN. «ما نحل والد ولدا أفضل من أدب حسن» p.225, tagged WEAK NARRATION |
| Neglect | Most children who go wrong were lost through their fathers' neglect. | Phone THEN / NOW. «وأكثر الأولاد إنما جاء فسادهم من قبل الآباء» p.229 |
| Answer | "So… who is asked first? Some scholars said: the father. And Allah told fathers to care for their sons before He told sons to honour their fathers." | Father carrying a sleeping child, full frame. "The father." in gold. The two lines from p.229. |
| Close | "Your child is still small." | Last NOW slides away; a child's hand in the father's. End card. |

The full research, Arabic text, gradings and Shamela links are in the project's `ibn-al-qayyim-tarbiyah/bab15-script-and-sources.md`.

**Review fix:** the answer and close text were gold on bright doorways and cuffs, so a top scrim darkens the full-frame photos from "So… who is asked first?" to the end card.
