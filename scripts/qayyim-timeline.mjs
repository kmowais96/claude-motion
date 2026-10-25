#!/usr/bin/env node
// Turns a series' content.json into one timeline per reel (<series dir>/<id>.json).
// Without "cadence", card holds follow motion-design §4: longer text stays up longer.
// With "cadence": N, a new card lands every N seconds exactly, end card included.
// A reel whose cards carry "at" is cut to a voiceover instead: each card lands on the
// second its line is spoken, and the reel needs "bookAt" and "end" too.
//
//   node scripts/qayyim-timeline.mjs [reels/qayyim]
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.resolve(ROOT, process.argv[2] ?? 'reels/qayyim');
const content = JSON.parse(fs.readFileSync(path.join(DIR, 'content.json'), 'utf8'));

const ENTER = 0.8; // word reveal
const GAP = 0.2; // next card starts while the previous one is leaving
const BOOK_HOLD = 4.2;
const r2 = (x) => Math.round(x * 100) / 100;
const words = (s) => s.split(/\s+/).filter(Boolean).length;
const hold = (s) => Math.max(1.6, 0.9 + 0.3 * words(s));
const pad = (n) => String(n).padStart(2, '0');

const timed = (cards) => {
  let t = 0;
  return cards.map((c, i) => {
    // The hook is on screen from frame 0 (it's the thumbnail), so it skips the entrance.
    const start = t;
    const end = i === 0 ? start + hold(c.text) + 0.9 : start + ENTER + hold(c.text);
    t = end + GAP;
    return {in: start, out: end, mark: start + (i === 0 ? 0.3 : 0.55)};
  });
};

/** Voiceover mode: each card holds until the next one lands. */
const onVoice = (cards, bookAt) =>
  cards.map((c, i) => ({in: c.at, out: (cards[i + 1]?.at ?? bookAt) - 0.1, mark: c.at + 0.3}));

const onCadence = (cards, every) =>
  cards.map((_, i) => ({in: i * every, out: (i + 1) * every - 0.1, mark: i * every + (i === 0 ? 0.3 : 0.45)}));

content.reels.forEach((reel, n) => {
  const voiced = reel.cards[0].at !== undefined;
  const slots = voiced
    ? onVoice(reel.cards, reel.bookAt)
    : content.cadence
      ? onCadence(reel.cards, content.cadence)
      : timed(reel.cards);
  // Extra card fields (motif, shape, pills, flare) pass straight through to the picture.
  const cards = reel.cards.map(({mark, at, ...c}, i) => ({
    in: r2(slots[i].in),
    out: r2(slots[i].out),
    ...c,
    // Pills are always {label, at} by the time the picture sees them.
    ...(c.pills
      ? {
          pills: c.pills.map((p, k) =>
            typeof p === 'string' ? {label: p, at: r2(slots[i].in + 0.2 + k * 0.7)} : {...p, at: r2(p.at)},
          ),
        }
      : {}),
  }));
  const marks = reel.cards.flatMap((c, i) => (c.mark ? [r2(slots[i].mark)] : []));
  const last = slots[slots.length - 1];
  const bookIn = voiced ? reel.bookAt : content.cadence ? reel.cards.length * content.cadence : last.out + GAP;
  const tl = {
    fps: content.fps,
    duration: r2(voiced ? reel.end : bookIn + (content.cadence ?? BOOK_HOLD)),
    ...(voiced ? {voice: reel.voice, flareAt: reel.flareAt} : {}),
    ...(!voiced && content.cadence ? {cadence: content.cadence, enter: 0.6} : {}),
    label: content.label,
    ...(reel.hook ? {hook: reel.hook} : {}),
    tag:
      reel.tag ??
      (content.tagPrefix
        ? `${content.tagPrefix} · ${pad(n + 1)} / ${pad(content.reels.length)}`
        : `${pad(n)} / ${pad(content.reels.length - 1)}`),
    motif: reel.motif ?? 'arch',
    cards,
    marks,
    book: {in: r2(bookIn), ...reel.book},
  };
  fs.writeFileSync(path.join(DIR, `${reel.id}.json`), JSON.stringify(tl, null, 2) + '\n');
  console.log(`${reel.id}: ${tl.duration}s, ${cards.length} cards, ${marks.length} marks`);
});
