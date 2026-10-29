# Rise after falling (9:16 Short, 60.4 s)

Second-person night narrative for Muslim men 25–35. Handle: **@TheTazkiyyahGuide** (spoken at 57 s, small on screen from 0.5 s, large end card from 57 s).

**Concept:** one dot on a vertical rail is "you". It falls at 3 a.m., sits low while the accusing voice talks, then climbs while the sky goes from night to dawn. No list of tips: a single emotional arc.

**Prompt:** Make a ~60 second vertical YouTube Shorts explainer on what Ibn al-Qayyim said about getting up after falling (tawba, not despairing of Allah's mercy). Different approach from the business explainer: story/second-person, own hook.

Files: `src/rise/` (component, `timeline.json` = word timings), `sfx/cues/rise_ambient.py` (ambient bed), `public/rise-vo.mp3` (narration, ElevenLabs eleven_v4, voice "Mike - calm American male").

Render: `npx remotion render RiseVideo out/rise-silent.mp4`, then mux `public/rise-vo.mp3` + `public/rise-ambient.wav` (ambient at 0.22, loudnorm −14 LUFS).

## Timed script and storyboard

| Time | Narration | Visual |
|---|---|---|
| 0.0–3.2 | "It's 3 a.m. You did it again." | Black night. Dot drops down the rail with a sub-bass fall, lands at 2.7 s. |
| 3.2–8.3 | "The same sin you swore last week you were finished with, and now the voice starts." | Dot trembles at the bottom. Faint red vignette creeps in. |
| 8.8–12.6 | "You're a fraud. Allah is done with you. Why even pray Fajr?" | Accusing lines in rose sans, shaking. |
| 13.2–15.4 | "Stop. That voice is not conviction." | White flash, thud, gold "Stop." Dot pulses and starts to climb; the path it has climbed lights gold. |
| 15.7–23.4 | Qur'an 39:53 (English), "Surah Az-Zumar verse 53" | Italic serif, tag "Qur'an 39:53 · Surah Az-Zumar". |
| 23.7–29.4 | "The Prophet said: every son of Adam sins, and the best of sinners are those who repent." | Tag "Tirmidhi · Ibn Majah · graded hasan". |
| 29.9–44.8 | Ibn al-Qayyim, Madarij al-Salikin: repentance as a station the traveler never leaves; a fall can leave you broken, humble, needy of Allah, a closeness pride never gives. | Tag "Paraphrase … not a verbatim quote". Chips light up: BROKEN › HUMBLE › NEEDY › NEAR. Sky starts to lift. |
| 45.3–52.0 | "So don't stay down. Make wudu. Pray two rak'ah. Say astaghfirullah. Allah loves those who keep turning back to Him." | Three step chips tick on, soft chime each. Warm horizon appears. |
| 52.5–56.7 | "You didn't fall out of His mercy. You fell into your need for it. Now rise." | Dawn gradient, gold "Now rise." |
| 57.0–60.4 | "Follow the Tazkiyyah Guide for the heart work nobody talks about." | End card @TheTazkiyyahGuide. |

## Sourcing and what is NOT verified

The project's `shamela-answer.md` only lists book titles (Madarij al-Salikin etc.), so it sources no Ibn al-Qayyim wording.

- **Qur'an 39:53, 2:222** (2:222 is the basis of "Allah loves those who keep turning back"): Qur'an, sourced. English is a paraphrase-translation, not a specific published translation.
- **"Every son of Adam sins, and the best of sinners are those who repent"**: Tirmidhi and Ibn Majah, graded hasan. Check the exact numbers and grading before publishing.
- **Madarij al-Salikin lines: UNVERIFIED.** The two claims (tawba as a station the traveler never leaves; a fall leaving the servant broken and humble, closer to Allah than pride in deeds) reflect themes I recall from Madarij, but I did not check the book text, volume or page. They are shown on screen as a paraphrase. A scholar or someone with the book should confirm or replace before posting. No quotation is attributed to Ibn al-Qayyim.
- Al-Wabil al-Sayyib, al-Fawa'id and Ighathat al-Lahfan were not cited because nothing could be checked.
