# Ibn al-Qayyim on earning: 57 s YouTube Short (9:16, 1080x1920, 30 fps)

Handle on screen the whole video and spoken at the end: **TheTazkiyyahGuide**.
Voice: ElevenLabs "Daniel - warm, low, confident", sped up 1.13x for pace. Timings below come from a word-level transcript of the final audio.

## Script with timings

| Time | Scene | Narration | On screen |
|---|---|---|---|
| 0.0-8.3 | Hook | "Your income is a test. Is yours clean? Most men ask: how much? Ask this first: how? Four rules." | Spinning gold coin, giant serif "Your income is a test.", "IS YOURS CLEAN?" slams in at 1.9 s; then red "HOW MUCH?" is replaced by green "How?" and four numbered dots light up |
| 8.3-20.8 | 1. Halal first | "One. Halal first. Allah made trade lawful, and riba haram. Ibn al-Qayyim sorted legal tricks, hiyal, into types, some clearly not allowed. A clever contract is not a clean contract." | TRADE (green) / RIBA (red) cards, chip "Qur'an 2:275"; then a "RIBA" card gets relabelled "a sale"; red "NOT CLEAN" stamp |
| 20.8-31.2 | 2. Be honest | "Two. Be honest. The Prophet, peace be upon him, said: 'Whoever cheats us is not one of us.' No hidden defects, no fake discounts. Your reputation is your capital." | Hadith card with chip "Sahih Muslim"; "Hidden defects" and "Fake discounts" struck through; gold reputation bar fills |
| 31.2-42.9 | 3. Effort, then trust | "Three. Work hard, then trust Allah. The Prophet told the man: 'Tie your camel, then rely on Allah.' Ibn al-Qayyim called tawakkul half of the religion. Effort is your job. The result is Allah's." | Hadith card with chip "al-Tirmidhi", rope ties around a stake; half-filled circle "Tawakkul: half of the religion"; EFFORT (your job) / RESULT (Allah's) cards |
| 42.9-51.8 | 4. Check the ruling | "Four. Get the ruling for your actual deal. Ibn al-Qayyim wrote that fatwas change with time, place and custom, so ask a qualified scholar before you sign." | TIME / PLACE / CUSTOM chips light up, chip "I'lam al-Muwaqqi'in 4/157"; "Ask a qualified scholar" signature card |
| 51.8-57.0 | CTA | "Clean income. Honest deals. Tie your camel. Follow the Tazkiyyah Guide for more." | Three-line closer, pulsing "Follow @TheTazkiyyahGuide" button, "Educational reminder, not a fatwa." |

Captions run on screen for the whole video, sourced from the same timings (`business/timeline.json`).

## What is sourced, and how well

I only attribute to Ibn al-Qayyim what I could find a source for. The project file (shamela-answer.md) only confirms his name, death date and works; it says nothing about business. The intro that named his books and death date was cut at Owais's request; the hook is now a generic one.

| Claim in the video | Status | Where from |
|---|---|---|
| He sorted hiyal (legal tricks) into types, some clearly inadmissible | Secondary source only | Wikipedia "Hiyal" says he distinguished three types: clearly inadmissible, clearly admissible, doubtful. No work or page given. |
| Fatwas change with time, place, custom | Cited, not checked in the original | Abu Amina Elias page cites I'lam al-Muwaqqi'in 4/157 |
| Tawakkul is half of the religion | Weak: attributed to him, but the source (Yaqeen Institute) cites al-Munajjid's book, not his works | Needs an original reference |
| "Allah made trade lawful and forbade riba" | Qur'an 2:275, not Ibn al-Qayyim | Widely known verse |
| "Whoever cheats us is not one of us" | Prophetic hadith, Sahih Muslim; exact wording not re-checked here | Widely known |
| "Tie your camel, then rely on Allah" | Prophetic hadith, al-Tirmidhi; the Wikipedia Tawakkul page confirms the story | Grading of the hadith not checked |
| "Most men ask: how much? Ask this first: how?" is my own framing. "A clever contract is not a clean contract"; "reputation is your capital"; "no fake discounts" | My own framing, not a quote from him | Not attributed to him on screen or in audio |

Gaps I could not close: his own passages on halal earning, honesty in trade and the link between tawakkul and effort. The video leans on Qur'an and hadith for those and says so on screen.

## Render

```bash
REMOTION_BROWSER=/path/to/chrome npx remotion render BusinessShort out/short-silent.mp4 --chrome-mode=chrome-for-testing --muted
ffmpeg -y -i out/short-silent.mp4 -i public/vo.mp3 -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -movflags +faststart -shortest out/short.mp4
```

Prompt given: a ~60 s vertical Shorts explainer on what Ibn al-Qayyim said about Islamic business, for Muslim men 25-35, with the handle TheTazkiyyahGuide.
