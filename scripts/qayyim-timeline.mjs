#!/usr/bin/env node
// Turns reels/qayyim/content.json into one timeline per reel (reels/qayyim/<id>.json).
// Card holds follow motion-design §4: longer text stays up longer.
//
//   node scripts/qayyim-timeline.mjs
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../reels/qayyim');
const content = JSON.parse(fs.readFileSync(path.join(DIR, 'content.json'), 'utf8'));

const ENTER = 0.8; // word reveal
const GAP = 0.2; // next card starts while the previous one is leaving
const BOOK_HOLD = 4.2;
const r2 = (x) => Math.round(x * 100) / 100;
const words = (s) => s.split(/\s+/).filter(Boolean).length;
const hold = (s) => Math.max(1.6, 0.9 + 0.3 * words(s));

content.reels.forEach((reel, n) => {
  let t = 0;
  const marks = [];
  const cards = reel.cards.map((c, i) => {
    // The hook is on screen from frame 0 (it's the thumbnail), so it skips the entrance.
    const start = t;
    const end = i === 0 ? start + hold(c.text) + 0.9 : start + ENTER + hold(c.text);
    if (c.mark) marks.push(r2(start + (i === 0 ? 0.3 : 0.55)));
    t = end + GAP;
    return {in: r2(start), out: r2(end), text: c.text};
  });
  const book = {in: r2(t), ...reel.book};
  const tl = {
    fps: content.fps,
    duration: r2(t + BOOK_HOLD),
    label: content.label,
    tag: reel.tag ?? `${String(n).padStart(2, '0')} / ${String(content.reels.length - 1).padStart(2, '0')}`,
    motif: reel.motif,
    cards,
    marks,
    book,
  };
  fs.writeFileSync(path.join(DIR, `${reel.id}.json`), JSON.stringify(tl, null, 2) + '\n');
  console.log(`${reel.id}: ${tl.duration}s, ${cards.length} cards, ${marks.length} marks`);
});
