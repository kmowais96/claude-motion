# The first hours of a newborn, from Ibn al-Qayyim: 57 s YouTube Short (9:16, 1080×1920, 30 fps)

For Muslim men 25–35, often new or soon-to-be fathers. Handle **@TheTazkiyyahGuide** small on screen throughout, spoken and shown large at the end ("Follow The Tazkiyyah Guide for similar posts").

**Prompt:** "In a similar fashion, create a short on Ibn al Qayyim on what to do right after babies are born. First immediate tasks. Use the images attached. See if you want to add background voice do so. Multiple tracks. You are a director. Give me something solid."

**Source book:** Ibn Qayyim al-Jawziyya, *Tuhfat al-Mawdud bi Ahkam al-Mawlud*, ed. 'Abd al-Qadir al-Arna'ut, Maktabat Dar al-Bayan, Damascus, 1st ed. 1391/1971. Page numbers are the printed pages of that edition as shown on al-Maktaba al-Shamela (book 6266), checked against the Arabic text.

## Files

| Path | What |
|---|---|
| `src/newborn/NewbornShort.tsx`, `theme.ts` | Composition `NewbornShort` |
| `src/newborn/words.json` | Word timings of the raw narration (ElevenLabs Scribe) |
| `src/newborn/timeline.json` | Generated: beat starts and shifted word timings |
| `public/newborn/*.jpg` | The 7 photos used (resized to 2000 px; Unsplash/Pexels) |
| `public/newborn-vo-raw.mp3` | Narration, ElevenLabs eleven_v4, voice "Mike - calm American male" (same as the rise Short) |
| `sfx/cues/newborn_vo.py` | Cuts the narration at its pauses, adds breathing room between beats, writes the timeline |
| `sfx/cues/newborn_mix.py` | Bed (hummed vocal choir in D Hijaz + frame drum, no melodic instruments), SFX, ducked mix |
| `sfx/cues/newborn_mux.py` | Compress, limit, two-pass loudnorm to −14 LUFS / −1.5 dBTP, mux |

## Build

```bash
python3 sfx/cues/newborn_vo.py
python3 sfx/cues/newborn_mix.py
npx remotion render NewbornShort out/newborn-silent.mp4
python3 sfx/cues/newborn_mux.py        # -> out/newborn.mp4
```

Final file measures −14.1 LUFS integrated, −1.3 dBFS peak, LRA 4.3.

## Audio tracks

1. **Voice**: the narration, cut at its natural pauses with 0.5–1.6 s of air added before each new step.
2. **Bed**: an additive "choir" (three detuned voices per note, shaped by vowel formants for *ah* and a closed *mm* hum) on a D–A drone that opens to D–A–D–F♯ on day 7; a hummed Hijaz motif (D E♭ F♯ G) in the hook and the reverse in the recap; a frame-drum pattern at 84 BPM (dum / tak with jingles). The drum drops out under the adhan beat and for the day counter, and is fullest on the aqiqah.
3. **SFX**: a soft heartbeat synced to the pulsing baby-feet photo in the hook, air whooshes on each cut, a tick per number of the day counter, coins clinking onto the scale, ticks on the recap list.
4. The bed is side-chained to the voice (about −8 dB under speech).

## Timed script and storyboard

| Time | Narration | Visual |
|---|---|---|
| 0.0–6.6 | "Your child was born a minute ago. Before the photos… before the group chat… do this." | Baby feet (B&W), gently pulsing with a heartbeat. Big serif "Your child was born / a minute ago." "Before the photos." and "Before the group chat." get struck through, then gold "Do this." |
| 6.9–12.9 | "One: share the good news. Ibn al-Qayyim calls congratulations a dua for the child." | Feet continue. Header 01 "Share the glad tidings / البشارة والتهنئة". Quote card, Arabic + English. Chip "Tuhfat al-Mawdud · Bab 3 · p.27–28". |
| 13.4–22.4 | "Two: the adhan, in the right ear. His reason: so the first words the child hears proclaim Allah's greatness, and Shaytan flees from them." | Minaret photo; gold sound rings leave the loudspeakers. Header 02. Quote card with his Arabic wording. Drum drops out. Chip "Bab 4 · p.30–31". |
| 23.0–28.1 | "Three: tahnik. Soften a date, and rub it on the baby's palate, as the Prophet did." | Dates macro. Header 03 "وحنّكه بتمرة". Chip "Bab 5 · p.32". |
| 28.9–34.1 | "Four: a good name. The Prophet named his own son Ibrahim the night he was born." | Open mushaf. Header 04. Card with the hadith in Arabic and English (Sahih Muslim). Chip "Bab 8 · p.102–104". |
| 35.7–37.4 | "Then, on day seven:" | Black; a day counter ticks 1→7 with seven dots. |
| 37.6–40.6 | "the aqiqah. Two sheep for a boy, one for a girl." | Goat herd, cutting to a goat close-up on "one for a girl". "DAY 7 · The aqiqah / العقيقة". BOY ×2 and GIRL ×1 sheep icons pop on the words. Chip "Bab 6 · p.62, 66". |
| 40.7–43.4 | "Shave the head, and give its weight in silver to charity." | Blurred baby photo behind a balance: hair on one pan, three silver coins drop onto the other until it levels, "→ given in charity". Chip "Bab 7 · p.97–98". |
| 44.2–48.9 | "Circumcision is from the fitrah, due by puberty. Ask a scholar about the timing." | Mosque at night. "LATER · Circumcision / الختان"; RULING From the fitrah, WHEN Required by puberty, TIMING Ask a scholar. Chip "Bab 9 · p.160, 180". |
| 49.6–52.3 | "Save this for the day your child arrives." | Recap checklist of all six steps ticks on. |
| 52.5–57.0 | "Follow The Tazkiyyah Guide for similar posts." | End card: The Tazkiyyah Guide, @TheTazkiyyahGuide, "for similar posts", source line, "Educational reminder, not a fatwa." |

Captions with the current word in gold run from 6.9 s to the end card.

## Sources (checked against the Arabic)

| Claim | Where in *Tuhfat al-Mawdud* (ed. al-Arna'ut) | Arabic checked | Status |
|---|---|---|---|
| Recommended to give glad tidings and congratulate; congratulation is a dua for good in the child | Bab 3, "في استحباب بشارة من ولد له ولد وتهنئته", p.27–28. His words: «ولما كانت البشارة تسر العبد وتفرحه استحب للمسلم أن يبادر إلى مسرة أخيه وإعلامه بما يفرحه» and «والتهنئة دعاء له بالخير فيه بعد أن علم به» | Yes | Sourced |
| Adhan in the right ear | Bab 4, "في استحباب التأذين في أذنه اليمنى والإقامة في أذنه اليسرى", p.30. Hadith of Abu Rafi': the Prophet ﷺ gave the adhan in al-Hasan's ear when Fatimah gave birth (Abu Dawud, al-Tirmidhi, who called it sahih) | Yes | Sourced |
| His reason: the first words the child hears carry Allah's greatness, and Shaytan flees the adhan | Bab 4, p.31: «وسر التأذين والله أعلم أن يكون أول ما يقرع سمع الإنسان كلماته المتضمنة لكبرياء الرب وعظمته» … «هروب الشيطان من كلمات الأذان» | Yes | Sourced. The on-screen English is my translation. |
| Tahnik with a date, as the Prophet did | Bab 5, "في استحباب تحنيكه", p.32: hadith of Abu Musa «فسماه إبراهيم وحنكه بتمرة» (Bukhari, Muslim); also Anas on Abu Talha's son | Yes | Sourced. "Soften a date and rub it on the palate" describes how tahnik is done in the Anas narration; the exact chewing wording was not re-read on the page. |
| The Prophet named his son Ibrahim the night he was born | Bab 8, fasl 1 "في وقت التسمية", p.104: «ولد لي الليلة غلام فسميته باسم أبي إبراهيم» (Muslim, via Anas). p.102 also gives naming on day 7 (hadith of Samura) and p.105 lists "naming the newborn on the day of his birth" among the lessons of the Ibrahim story | Yes | Sourced. The narration presents only the day-of-birth option; naming on day 7 is also sunnah per the same chapter. |
| Aqiqah on day 7 | Bab 6, fasl 8, p.62: Ahmad «العقيقة تذبح يوم السابع», then day 14, then day 21; Aisha: the Prophet ﷺ did the aqiqah for al-Hasan and al-Husayn on the seventh day | Yes | Sourced |
| Two sheep for a boy, one for a girl | Bab 6, fasl 10, p.66: hadith of Umm Kurz «عن الغلام شاتان وعن الجارية شاة» and Aisha «أمرنا … أن نعق عن الغلام شاتين وعن الجارية شاة». p.65: he holds both share in the aqiqah, differing in amount | Yes | Sourced. Mālik's view that one sheep suffices for either is also reported there; the video gives the hadith position. |
| Shave the head (day 7) and give its weight in silver as charity | Bab 7, "في حلق رأسه والتصدق بوزن شعره", p.97–98: Ahmad «يستحب أن يحلق يوم سابعه»; Fatimah weighed the hair of al-Hasan and al-Husayn «فتصدقت بزنته فضة» (Muwatta'); Anas: shaved on their seventh day and its weight given in silver | Yes | Sourced. Gradings of these narrations were not checked. |
| Circumcision is from the fitrah | Bab 9, fasl 3 "في مشروعيته وأنه من خصال الفطرة", p.158–160 | Chapter heading only | Partly checked: the heading was read, not the body |
| Circumcision becomes obligatory at puberty | Bab 9, fasl 5 "في وقت وجوبه", p.180: «ووقته عند البلوغ لأنه وقت وجوب العبادات عليه ولا يجب قبل ذلك» | Yes | Sourced. p.183 reports that Ahmad disliked doing it on day 7, so the video does not put it on day 7 and says "ask a scholar about the timing". |

Nothing is quoted from Ibn al-Qayyim except the two Arabic lines on screen (Bab 3 and Bab 4), both copied from the edition text. The hook lines ("Before the photos, before the group chat", "Do this"), "Save this for the first week" and the recap list are my own framing.

**Left out on purpose:** the iqamah in the left ear. It is in the Bab 4 heading, but as far as I know its narration is graded very weak by hadith scholars, and I did not read his discussion of it, so the video mentions the adhan only. Note also that while al-Tirmidhi called the Abu Rafi' adhan hadith sahih, some later scholars grade its chain weak; that grading question was not checked here.

**Not used:** the eighth photo (a priest in vestments cutting a baby's hair) shows a Christian baptism and tonsure, so it is not in the video.
