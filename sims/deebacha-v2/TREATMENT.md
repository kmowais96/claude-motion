# Before You Read the Qur'an — treatment (version 2)

A 10½-minute film for Muslim youth about Sayyid Abul A'la Mawdudi's nine-page preface (Deebacha) to Tafhim al-Qur'an. Its job: make the viewer want to open Tafhim al-Qur'an, and leave them with the preface's way of reading. Narration is fixed (`sentences.json`: ElevenLabs Vestal, one take per part, slowed 10 % with breathing room added). Everything said comes from the preface; outside material on screen is labelled.

**House rules for every scene**
- No faces, no human figures, no hands, no silhouettes of people. People are implied by things: a lamp, a page, a pen's shadow, lit windows, a minbar, a door.
- Islamic terms: Allah (never "God"), the Prophet ﷺ, rahimahullah, in sha' Allah.
- Arabic is set in Amiri, fully vowelled where it is Qur'an, and checked letter by letter.
- On-screen words never repeat a caption word for word at the same moment (sections may suppress a caption with `noCaption`).
- Each section's look follows its `STYLE.md` (colour, type, motion, transitions inside the section). Between sections the shell lays the next sheet over the last; that is the film's one cross-style transition.

## Three candidate structures

1. **One style throughout (woodcut).** A wordless-novel book of plates. Strong and unified, but 10 minutes of black plates tires young viewers, and Owais asked for different designs for different settings.
2. **A style per idea, in a portfolio.** Each idea of the preface gets the medium that carries it best: the prison in woodcut (the hard, carved place), the thirst and the invitation in a back-lit paper lamp (warmth, homes lighting up), the argument about translation in ink on paper (life vs. dead words), speech and flow in a single unbroken line (speech flows; numbering breaks it), the six meanings of kufr as an engraved specimen plate, and the reading method as a watercolour study journal. Sheets laid one over another, like prints handed across a table.
3. **Two worlds alternating.** The cell (woodcut) intercut with the reader's world (watercolour) throughout. Elegant, but it forces the middle argument into one of two looks that don't suit it.

**Choice: 2.** It honours "different designs in different settings", gives every idea its own feeling, and the woodcut cell bookends the film (opening and section 13), with the lamp as the motif that travels through every style: copper in woodcut, amber light in the lamp box, a single accent elsewhere.

## Sections

Times are from `sentences.json` (global seconds). Each module gets `T` with local sentence indices.

| # | Section | Style | Seconds | Sentences |
|---|---|---|---|---|
| 1 | The cell | woodcut | 1.6–48.0 | 15 |
| 2 | Why one more? | paper-cut lightbox | 50.5–72.3 | 6 |
| 3 | The thirst; who it's for | paper-cut lightbox | 74.7–143.6 | 19 |
| 4 | Why not word for word? | ink on paper (ink-wash) | 146.0–193.1 | 10 |
| 5 | Life: the sieve | ink on paper | 195.4–253.4 | 15 |
| 6 | Flow | one line | 255.8–280.7 | 8 |
| 7 | Speech, not writing | one line | 283.1–359.5 | 20 |
| 8 | Setting | one line | 361.9–378.1 | 5 |
| 9 | One word, six meanings | copperplate engraving | 380.5–421.1 | 12 |
| 10 | Afraid | ink on paper | 423.5–472.1 | 12 |
| 11 | Two more tools | watercolour journal | 475.2–504.4 | 6 |
| 12 | How to read | watercolour journal | 506.8–548.3 | 12 |
| 13 | The prison gave him time | woodcut | 550.7–596.3 | 10 |
| 14 | Your turn | paper-cut lightbox | 598.7–623.3 (+4 s hold) | 11 |

### 1. The cell — woodcut, one copper-orange plate for the lamp flame
Opens on uncut black wood. The knife cuts radial light from one point: the lamp flame (copper plate). Cuts spread to reveal a cell: brick wall in form-following hatching, a small barred window high up (sky carved, stab-cut stars), a low desk, a sheet of paper. "Multan. September 1949." is carved letterpress in the margin (caption). "A man bent over a page": only the page and the long shadow of a pen nib moving across it; lines of writing are carved one by one. "His name is…": the name is carved into a black panel as a title plate (IM Fell English SC), then gone. "Seven years earlier… far beyond that cell": a stack of manuscript sheets; pull back through the window bars, carved paths radiate out across land. "Tafhim al-Qur'an": a title plate carved, تفهيم القرآن with the copper plate glowing in the letters. "Nine pages": nine small sheets carved in a row; "Most people skip it": they riffle; "So let's not skip it": the first one stops, a copper edge.

### 2. Why one more? — lightbox, warm interior ladder
A library inside the lamp box: shelves of book spines as stacked paper layers, back-lit. "Why add one more?": one new book slides in from the front layer. "Blessing of it… not a good use of time": the shelf stays dim. "Only worth it if it fills a gap": a gap in the far shelf glows; light bursts through it.

### 3. The thirst; who it's for — lightbox, night ladder turning warm
Night stack: dunes/far hills, a town of houses, all windows dark; a dry well and an empty water jar in the front layer. "Ordinary, educated Muslims": windows are the people. "Translators had done valuable work": a few far lamps glow faintly. "Longing stayed thirsty": the jar stays empty. "Help quench that thirst": a channel of light runs from the lamp to the well and along the town; windows light one by one ("became this book": a book shape in the front layer catches the light). "Not the scholars… for people like you and me": a domed madrasa with full shelves (already lit) sits far back; the camera tilts/dollies to ordinary homes. "Left out the debates": paper strips with dense text slide out of the stack. "Understand… feel": two paper words cut in, UNDERSTAND and FEEL. "Where a doubt comes up": a cut "?" shape lights and is answered by a small glow. "Show me where I fell short. This is not the last word.": a strip with an open "…" and a small seal.

### 4. Why not word for word? — ink on rice paper, one vermilion seal
"How do you carry the Qur'an into another language?": a brushed river between two banks of empty paper. "Tarjumani": the word brushed in large calligraphic Latin with a seal. "Great scholars had done it beautifully": the six names appear as vertical inscriptions with small seals, respectfully, one per name as spoken (Shah Waliullah — Persian; Shah Abdul Qadir, Shah Rafiuddin, Mawlana Mahmud al-Hasan, Mawlana Ashraf Ali Thanawi, Hafiz Fateh Muhammad Jalandhari — Urdu). "Teaches you what every word means": an Arabic line, word by word, each word with its gloss under it — example: Al-Fatihah 1:2 ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ → "all praise · for Allah · Lord · of the worlds", labelled "example: al-Fātiḥah 1:2". "Weaknesses… the first one is life": the glosses go pale.

### 5. Life — ink on paper
"The words just lie there": the glosses lie flat as dry grey strokes on the ground line. "Heart not moved… no tears": a still pool (blank paper) with one drop that never falls. "A terrible thought": ink darkens from the edges. "Is this really the Book that challenged the whole world?": the question as a large brushed inscription (no caption). "Like a sieve": a round sieve painted in loaded strokes; dry ink particles fall through, a wet wisp (the spirit) rises and escapes upward. "Melted hearts of stone": a stone, its body wash softens and bleeds. "Struck Arabia like lightning": stillness, then one decisive dry stroke crosses the frame in a few frames. "Fiercest enemies were afraid…": ripples ring outward. "Had it come in the language of its translations…": the lightning fades back into a flat pale line.

### 6. Flow — one line, warm black on warm white, no accent
The line draws a page with two scripts between lines (interlinear) — "fine for study". "Read straight through, like a book": the line tries to run as a long wave but keeps hitting line breaks. "English is even worse": the wave is chopped into boxes with numbers. "Number its sentences… half its effect is gone": a flowing calligraphic flourish is cut into numbered pieces.

### 7. Speech, not writing — one line; the one accent (gold) used once, on "Allah Himself speaks"
The line draws a closed printed book, then opens into a sound wave. "Address for each moment… delivered like a khutbah": a minbar (steps and canopy, no person) with voice arcs. "Objectors standing right there": question marks drawn in the crowd area (marks, not people), answered by arcs. "The setting is all around": the line draws hills, palms and houses around the minbar. "The voice turns": arrows of arcs swing — about/to, one dot/many dots, speaker, group. "On behalf of Allah. And sometimes, Allah Himself speaks.": the line rises to the top; a single gold stretch of line radiates from above (the accent, once). "On paper it can feel disconnected… only notes can help… the gap closes": two cliffs of paper with a gap; a bridge line is drawn across.

### 8. Setting — one line
"Every surah came for a moment": a frame drawn around a small scene (a road, a town). "Strip that away": the frame's scene is erased; the remaining shape flips "upside down". "Carry some of that background": the background is redrawn lightly under the words.

### 9. One word, six meanings — copperplate engraving, wash arrives at the end
A specimen plate: KUFR engraved in roman capitals with كُفْر in Amiri at the centre. Six numbered roundels around it, each engraved as it is spoken, with an emblem (no figures): I complete disbelief — a door shut and barred; II simple denial — a scroll turned face down; III ingratitude — a full cup left untouched; IV falling short in what faith requires — a bridge that stops short; V believing in principle, refusing in practice — a key in a lock, not turned; VI obeying outside, disbelieving inside — a fruit whole outside, hollow in cross-section. Each roundel gets its engraved label (italic). "Translate as kufr everywhere": all six labels are overstamped KUFR. "Miss it here, misread it there, lost somewhere else": the roundels dim one by one. Then a muted madder wash blooms on the true labels as they return (colour arriving is the event).

### 10. Afraid — ink on paper
"Did not dress the Qur'an's words in Urdu clothes": an Arabic word (ٱلْقُرْءَان) on the right, an empty paper on the left. "Took the meaning… and the effect on his own heart… carried that": a brush carries one drop of ink across. "Clear Arabic… flow… majesty": three short inscriptions. "That needed freedom. But this was the Word of Allah.": a vast empty sheet, one small stroke. "I used this freedom… while very much afraid.": brushed large, the line trembling (no caption; marked "paraphrased from the Urdu"). "Never stepped beyond what the Qur'an's own words allow": a river bank painted; the stroke stays inside it.

### 11. Two more tools — watercolour journal, accent vermilion stamp
A journal page with a closed mushaf painted at the centre (geometric cover, no text). "Before every surah, an introduction": a painted card beside it with four hand notes and leaders — when it came down / what was happening / where the call stood / what it faced. "And notes, but only in two kinds of places": two pins — "a question would rise" (a rain-blue ?) and "hurry past and miss the spirit" (a path with a small flag). "Nothing that pulls your eyes away": the notes settle at the margin; the mushaf stays centre.

### 12. How to read — watercolour journal
Four painted steps, numbered 1–4, each painted as spoken: 1 the introduction card (revisited — a loop arrow); 2 daily portion word by word — stepping stones; 3 straight through without notes — a river painted in one stroke; 4 back verse by verse with notes — stones with small flags. "Know the Qur'an well… in sha' Allah": a soft sunrise wash over the page.

### 13. The prison gave him time — woodcut, hard cuts as new impressions
"February 1942": a calendar plate. "More than five years… end of Surah Yusuf": manuscript stack rising, a bookmark marked 12 (Surah Yusuf is the 12th surah — a fact, not a quote). "No time to write, or even to revise": the pen nib's shadow stops; the lamp is out. "Good luck or bad luck": two plates side by side. "October 1948… arrested and taken to jail": snap zoom, bars carved fast. "Behind the bars, he found the time": the copper lamp re-lit; the page fills with carved lines. "Ends with a dua": a black title panel; "Wa ma tawfiqi illa billah": وَمَا تَوْفِيقِيٓ إِلَّا بِٱللَّهِ carved, copper glowing in the letters (Hud 11:88, labelled). "My success is only through Allah." as the caption.

### 14. Your turn — lightbox
"A prison cell. One small lamp.": the cell from section 1 rebuilt in paper, one lit window. "A book that travelled far beyond it": dolly out; town after town of paper layers, windows lighting up. "Now it is in your hands": a book cut-out in the front layer. "Read the setting. Learn the words. Hear it whole. Then go deep.": four paper strips write themselves out, one per phrase (no caption for these). "Open Tafhim al-Qur'an": the book's cover lifts; light bursts out (native move). "Start with one surah. And let it reach your heart.": end strip TAFHIM AL-QUR'AN · SAYYID ABUL A'LA MAWDUDI, hold 4 s, the lamp's light the last thing to fade.

## Sound
No music (Owais's standing preference for these videos). Quiet foley per style, mixed under the voice, −14 LUFS: knife and paper in woodcut; switch click, paper slide and shimmer in the lamp box; brush and water in ink; nib scratch in one-line; burin and plate press in engraving; brush wash and pencil in watercolour. Sections export cues through `events(T)`.
