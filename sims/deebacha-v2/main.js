// Before You Read the Qur'an: one page, a cover and fourteen sections, six hand-made styles.
import { W, H, timing, captionCues, drawCaption, resetTexts, capTexts, sheetOver, seg } from './shell.js';
import s01 from './sec/s01.js'; import s02 from './sec/s02.js'; import s03 from './sec/s03.js';
import s04 from './sec/s04.js'; import s05 from './sec/s05.js'; import s06 from './sec/s06.js';
import s07 from './sec/s07.js'; import s08 from './sec/s08.js'; import s09 from './sec/s09.js';
import s10 from './sec/s10.js'; import s11 from './sec/s11.js'; import s12 from './sec/s12.js';
import s13 from './sec/s13.js'; import s14 from './sec/s14.js'; import s00 from './sec/s00.js';

const MODS = [s00, s01, s02, s03, s04, s05, s06, s07, s08, s09, s10, s11, s12, s13, s14];
const TRANS = 1.1;   // seconds a sheet takes to lay down
const TAIL = 4.0;    // the last picture holds after the voice ends

const data = await (await fetch('sentences.json')).json();
// the cover (n = 0) has no sentences: it holds the silence before the voice
const COVER = 6.0;
const SECS = MODS.map((m, n) => {
  const sents = n ? data.sentences.filter(s => s.sec === n) : [{ start: 0, end: COVER, text: '' }];
  const T = timing(sents);
  if (!n) return { m, T, cues: [] };
  return { m, T, cues: captionCues(sents, new Set(m.noCaption || [])) };
});
// boundary n sits halfway through the silence between section n and n+1
SECS.forEach((S, n) => {
  const next = SECS[n + 1];
  S.a = n === 0 ? 0 : SECS[n - 1].b;
  S.b = next ? (S.T.t1 + next.T.t0) / 2 : S.T.t1 + TAIL;
});
window.DUR = SECS[SECS.length - 1].b;

const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const off = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
const A = off(), B = off();

await document.fonts.ready;
await Promise.all(['42px "IM Fell English"', '40px "IM Fell English SC"', '500 40px "Cormorant Garamond"', '600 40px "Cormorant Garamond"', '400 40px "Cormorant Garamond"', 'italic 500 40px "Cormorant Garamond"',
  '600 46px "Caveat"', '60px "Sacramento"', '40px "Bodoni Moda"', 'italic 40px "Bodoni Moda"', '40px "Pinyon Script"', '20px "IBM Plex Mono"',
  '60px "Amiri"', '700 60px "Amiri"'].map(f => document.fonts.load(f, f.includes('Amiri') ? 'وما' : 'Ab')));

for (const S of SECS) if (S.m.init) await S.m.init(S.T);

function drawSection(c, S, t) {
  c.save(); S.m.render(c, t, S.T); c.restore();
  if (S.m.ownCaptions) return;
  for (const cue of S.cues) if (t >= cue.show && t < cue.hide + 1) drawCaption(c, S.m.style, cue, t);
}

window.render = t => {
  resetTexts();
  let n = SECS.findIndex(S => t < S.b);
  if (n < 0) n = SECS.length - 1;
  const S = SECS[n];
  const prev = SECS[n - 1];
  // the incoming sheet lays down over [a - TRANS/2, a + TRANS/2]
  const next = SECS[n + 1];
  if (next && t > S.b - TRANS / 2) {
    const ac = A.getContext('2d'), bc = B.getContext('2d');
    drawSection(ac, S, t); drawSection(bc, next, t);
    sheetOver(ctx, A, B, seg(t, S.b - TRANS / 2, S.b + TRANS / 2));
  } else if (prev && t < S.a + TRANS / 2) {
    const ac = A.getContext('2d'), bc = B.getContext('2d');
    drawSection(ac, prev, t); drawSection(bc, S, t);
    sheetOver(ctx, A, B, seg(t, S.a - TRANS / 2, S.a + TRANS / 2));
  } else drawSection(ctx, S, t);
};

window.TEXTS = t => { window.render(t); const out = capTexts().slice(); for (const S of SECS) if (S.m.texts && t >= S.a && t < S.b) out.push(...S.m.texts(t, S.T)); return out; };

window.EV = [];
SECS.forEach((S, n) => {
  if (n) window.EV.push({ t: S.a - TRANS / 2, type: 'sheet', from: SECS[n - 1].m.style, to: S.m.style });
  if (S.m.events) for (const e of S.m.events(S.T)) window.EV.push({ ...e, sec: n, style: S.m.style });
});
window.EV.sort((x, y) => x.t - y.t);
window._SECS = SECS;
window.SECTIONS = SECS.map((S, n) => ({ sec: n, style: S.m.style, a: S.a, b: S.b, t0: S.T.t0, t1: S.T.t1 }));

window.render(0);
window.READY = true;
