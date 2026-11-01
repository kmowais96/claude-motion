# Daughters, from Ibn al-Qayyim: 73 s YouTube Short (9:16, 1080×1920, 30 fps)

The third Short in the Ibn al-Qayyim series, after the newborn and naming Shorts. It is for Muslim men 25–35 who are new or soon-to-be fathers. The handle **@TheTazkiyyahGuide** stays small on screen throughout. "Follow The Tazkiyyah Guide for similar posts" appears on the end card only and is not spoken.

**Brief:** "Ibn Qayyim on daughters. Research for you know what. And from where." Then, on the first draft: "The ending can be made better."

**Source book:** Ibn Qayyim al-Jawziyya, *Tuhfat al-Mawdud bi Ahkam al-Mawlud*, **Bab 2, «في كراهة تسخط البنات»** (on the disapproval of resenting daughters), printed pages 20–26. Edition: ed. 'Abd al-Qadir al-Arna'ut, Maktabat Dar al-Bayan, Damascus, 1st ed. 1391/1971, read on al-Maktaba al-Shamela (book 6266, pages 18–24 there; Shamela's page index is two lower than the printed page).

## Files

| Path | What |
|---|---|
| `src/daughters/DaughtersShort.tsx` | Composition `DaughtersShort` (palette and fonts from `src/newborn/theme.ts`) |
| `src/daughters/words.json` | Word timings of the raw narration (ElevenLabs Scribe) |
| `src/daughters/timeline.json` | Generated: beat starts and shifted word timings |
| `public/daughters/*.jpg` | The 13 photos used, from the client's set, resized |
| `public/daughters-vo-raw.mp3` | Narration: ElevenLabs eleven_v4, voice "Jerry B. - Hyper-Real Conversational Voice" (same as the naming Short) |
| `sfx/cues/daughters_vo.py` | Speeds the take up 7%, cuts it at its pauses, writes the timeline |
| `public/naming-nasheed.mp3` | Supplied input, not committed: the same client nasheed as the naming Short, used from 0:20 |
| `sfx/cues/daughters_mix.py` | Nasheed bed, SFX, voice with a small room and noise floor, ducked mix |
| `sfx/cues/daughters_mux.py` | Compress, limit, two-pass loudnorm to −14 LUFS / −1.5 dBTP, mux |

## Build

```bash
python3 sfx/cues/daughters_vo.py
python3 sfx/cues/daughters_mix.py
npx remotion render DaughtersShort out/daughters-silent.mp4
python3 sfx/cues/daughters_mux.py        # -> out/daughters.mp4
```

## Storyboard

| Beat | Narration | Visual |
|---|---|---|
| Hook | "Just had a daughter? And somebody asked if you were… hoping for a boy? Listen to this." | Father's hand holding a newborn's. "Just had a daughter?" then "“Were you hoping for a boy?”" |
| 01 Daughters first | Allah mentions daughters first; "Allah put first what the people of ignorance used to put last." | Rehal by a window, then an open mushaf. Al-Shura 42:49 with إِنَاثًا lighting gold on "daughters". Then his line «قدم ما كانت تؤخره الجاهلية». p.20 |
| 02 Upset over a girl? | "Being upset over a daughter? That's from the Jahiliyyah." | Ruins, then storm over badlands. «التسخط بالإناث من أخلاق الجاهلية». p.21 |
| 03 Raise two girls | Muslim: whoever raises two girls until they come of age… "with me, like this." | Father's finger in a baby's grip (B&W). Hadith in Arabic and English. p.21–22 |
| 04 One date | Aisha, the mother, two daughters, one date; "a shield from the Fire." | Date in a palm, then the date split before two girls. Bukhari & Muslim. p.22 |
| 05 Imam Ahmad | Ya'qub ibn Bakhtan, seven daughters, the same one line every time. | Lamp-lit study. "7 daughters", seven dots, "Every time, the same one line…" p.26 |
| Close | "So the next time someone asks if you were hoping for a boy… smile, and tell them what Imam Ahmad said. The Prophets were fathers of daughters." | Father and daughter walking, shown whole. The hook's question returns, then «الأنبياء آباء بنات» lands in gold, labelled Imam Ahmad, reported by Ibn al-Qayyim, p.26. End card. |

The full research, Arabic text, hadith gradings and what is my framing are in the project's `ibn-al-qayyim-daughters/script-and-sources.md`.

**Not used:** the finger-hearts photo (reads as a romantic couple), the Surah al-Naml page (a different surah under a verse overlay could mislead), the second date-in-palm crop and the apartment building.
