# Naming your child, from Ibn al-Qayyim: 61 s YouTube Short (9:16, 1080×1920, 30 fps)

The second Short in the series, after `03-ibn-al-qayyim-newborn`. It is for Muslim men 25–35 who are about to become fathers. The handle **@TheTazkiyyahGuide** stays small on screen throughout. "Follow The Tazkiyyah Guide for similar posts" appears on the end card only. At the client's request it is not spoken.

**Brief:** Make the first video in the next phase about naming. The hook is "Picked a name yet? Check these six things first." The voice should sound natural, not like typical AI narration.

**Source book:** Ibn Qayyim al-Jawziyya, *Tuhfat al-Mawdud bi Ahkam al-Mawlud*, Bab 8 (on naming). Edition: ed. 'Abd al-Qadir al-Arna'ut, Maktabat Dar al-Bayan, Damascus, 1st ed. 1391/1971. Page numbers are the printed pages of that edition as shown on al-Maktaba al-Shamela (book 6266). They were checked against the Arabic text.

## Files

| Path | What |
|---|---|
| `src/naming/NamingShort.tsx` | Composition `NamingShort` (palette and fonts reused from `src/newborn/theme.ts`) |
| `src/naming/words.json` | Word timings of the raw narration (ElevenLabs Scribe) |
| `src/naming/timeline.json` | Generated: beat starts and shifted word timings |
| `public/naming/*.jpg` | The 10 photos used, from the client's set, resized to 2000 px |
| `public/naming-vo-raw.mp3` | Narration: ElevenLabs eleven_v4, voice "Jerry B. - Hyper-Real Conversational Voice" |
| `sfx/cues/naming_vo.py` | Speeds the take up 5%, cuts it at its pauses, drops the spoken follow line, writes the timeline |
| `public/naming-nasheed.mp3` | Supplied input, not committed: the client's nasheed ("Newborn Nasheed for Baby Celebration"). The mix uses it from 0:20. |
| `sfx/cues/naming_mix.py` | Nasheed bed, SFX, and voice with a small room and noise floor, ducked mix |
| `sfx/cues/naming_mux.py` | Compress, limit, two-pass loudnorm to −14 LUFS / −1.5 dBTP, mux |

## Build

```bash
python3 sfx/cues/naming_vo.py
python3 sfx/cues/naming_mix.py
npx remotion render NamingShort out/naming-silent.mp4
python3 sfx/cues/naming_mux.py        # -> out/naming.mp4
```

Final file measures about −14 LUFS integrated (see the mux step output).

## Background: nasheed, not music

The first cut used a synthesised drone, which read as "music". The bed is now a real nasheed supplied by the client, used from 0:20, loudness-matched to about −34 dBFS and ducked about 8 dB under the narration. An AI-sung dhikr bed was tried and dropped: the names of Allah and a dua should not be put in a synthetic voice. Copyright: the track is third party, so the client is responsible for clearing it. YouTube Content ID may flag it.

## Making the voice sound less like AI

- **Script.** The script was rewritten to sound spoken. "First… Second…" replaces "One: Two:". It uses contractions, asides ("and I love this one", "Honestly"), and questions the speaker answers himself ("The names Allah loves most? Abdullah and Abdurrahman."). Ellipses mark the hesitations.
- **Delivery tags.** There are only three: `[chuckles softly]` on "no rush", `[warmly]`, and `[softly]` for the close.
- **Voice.** A library voice built to sound unpolished, in place of the announcer-style narrator used for the newborn Short.
- **Mix.** A short diffuse room tail (about 0.3 s, around −19 dB under the dry voice) plus a −52 dB noise floor. A perfectly dry, silent-background voice is one of the giveaways of TTS.

## Timed script

| Time | Narration | Visual |
|---|---|---|
| 0.2–6.4 | "Picked a name yet? Check these six things first… Ibn al-Qayyim actually wrote a whole chapter on this." | Father kissing his newborn (B&W). "Picked a name yet?" in large serif, then "Check these 6 things first." |
| 6.6–17.4 | "First. This name stays with him. There's a hadith in Abu Dawud: on the Day of Resurrection, you'll be called by your names, and your fathers' names. So… make them good." | Mosque window light. Header 01, the hadith in Arabic and English. On "called", a clean cut to the "Muhammad" calligraphy wall, shown whole. |
| 17.9–22.6 | "Second. The names Allah loves most? Abdullah and Abdurrahman." | "Abd" calligraphy photo. Header 02 with the hadith's opening. عبد الله and عبد الرحمن land on the spoken words. |
| 23.0–32.1 | "Third, no rush. Honestly. Day one, day three, the aqiqah day… he says all of it's fine. The matter is wide." | Baby's hand, then foot. "Day 1 / Day 3 / Day 7 (aqiqah)" chips, then "The matter is wide." |
| 32.5–40.4 | "Fourth, and I love this one. He says a name and the person carrying it tend to match. So pick a meaning you'd want him to grow into." | Open book. Header 04 with his Arabic line and its translation. |
| 40.8–48.2 | "Fifth. A bad name can be changed. The Prophet changed Asiya, which means disobedient, to Jamila. Beautiful." | Autumn leaves: yellow, turning red on "Jamila". عاصية is struck through, then → جميلة. "Also: Barra → Zaynab." |
| 48.7–54.5 | "And sixth. If you and his mother can't agree, the father names. But talk it through with her first." | Father photo, closer crop. Header 06 «فهي للأب». "…but talk it through with her first." |
| 55.0–57.2 | "Save this before the birth certificate." | Toddlers running. A six-item recap ticks on. |
| 57.7–61.0 | (no voice) | End card over the lattice: FOLLOW / The Tazkiyyah Guide / @TheTazkiyyahGuide / for similar posts / source line. |

## Sources (checked against the Arabic)

| Claim | Where in *Tuhfat al-Mawdud* (ed. al-Arna'ut), Bab 8 | Status |
|---|---|---|
| "You will be called on the Day of Resurrection by your names and your fathers' names, so make your names good" | p.111: hadith of Abu al-Darda' «إنكم تدعون يوم القيامة بأسمائكم وبأسماء آبائكم فأحسنوا أسماءكم» (Abu Dawud). The page calls its chain hasan. | Sourced. **Flag:** several hadith scholars grade this narration weak because of a break in the chain (Ibn Abi Zakariyya did not meet Abu al-Darda'). That grading was not checked here. The narration says "a hadith in Abu Dawud" and makes no claim that it is sahih. |
| The most beloved names to Allah are Abdullah and Abdurrahman | p.111: hadith of Ibn Umar «إن أحب أسمائكم إلى الله عز وجل عبد الله وعبد الرحمن» (Muslim). p.112: his conclusion «والحديث الصحيح يدل على أن أحب الأسماء إليه عبد الله وعبد الرحمن» | Sourced |
| Naming time is wide: the day of birth, the third day, or the aqiqah day | p.111: «فجاز تعريفه يوم وجوده … وجاز تأخير التعريف إلى ثلاثة أيام وجاز إلى يوم العقيقة عنه ويجوز قبل ذلك وبعده والأمر فيه واسع» | Sourced. "The matter is wide" translates «والأمر فيه واسع». |
| A name and the one who bears it tend to match | p.146: «قل ما ترى اسما قبيحا إلا وهو على مسمى قبيح» | Sourced. The narration paraphrases it ("tend to match"), and the on-screen English is my translation. "So pick a meaning you'd want him to grow into" is my own framing. |
| The Prophet ﷺ changed Asiya to Jamila; Barra to Zaynab | p.129: Ibn Umar, the Prophet ﷺ changed the name 'Asiya and said "you are Jamila" (Muslim); Abu Hurayra, Zaynab was called Barra and he named her Zaynab (Bukhari) | Sourced. "Disobedient" and "beautiful" are glosses of the two names. |
| If the parents disagree, the right to name is the father's | p.135: «هذا مما لا نزاع فيه … فهي للأب» | Sourced. "But talk it through with her first" is my own advice, not from the book, and is not shown as a quote. |

The hook, "and I love this one", "Honestly", the recap list and "Save this before the birth certificate" are my own framing. The only quotations attributed to Ibn al-Qayyim are the p.146 line and the p.111 "the matter is wide". Both are copied from the edition text.

**Left out on purpose:** the list of names the Prophet ﷺ disliked (hadith of Samura, p.115–116), at the client's request.

**Photos not used:** the "A new chapter" tiles, the Fatima and Hussain calligraphy, and the "alina" cup, and the blue-tile window. The first four each pulled attention to a specific name or brand that the script doesn't discuss.
