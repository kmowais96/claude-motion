// Section 10 · Afraid — ink on rice paper, vermilion for seals only.
// Shot A: الْقُرْآن brushed on the right, empty paper on the left; a reading stroke under it; a drop of ink gathers below the word,
//         is carried across in an arc and blooms on the empty side; three short inscriptions grow from it.
// Shot B: a vast empty sheet, one small stroke; "I used this freedom… while very much afraid." brushed large, trembling
//         (no caption, marked "paraphrased from the Urdu"); two river banks are painted and the stroke runs on inside them.
import { clamp, seg, ss, eo, eio, mulberry, lerp } from '/core/lib.js';
import { mk, draw, blot, mass, TONE } from '../lib/ink/ink.js';
import { group, W, H } from '../lib/ink/comp.js';
import { brushText } from '../lib/ink/text.js';
import { seal } from '../lib/ink/seal.js';
import { runShots, push } from '../lib/ink/scene.js';
import { loadInkFonts } from '../lib/ink/fonts.js';

const WORD = [1400, 470];         // الْقُرْآن
const DROP0 = [1225, 640], DROP1 = [560, 300];
const INS = ['clarity', 'flow', 'majesty'];
const chY = x => 728 + Math.sin(x * .0042 + .6) * 34;     // the channel's centre line in shot B

let K = null;
function build() {
  const ar = brushText({ text: 'الْقُرْآن', font: '400 190px "Amiri"', size: 190, x: WORD[0], y: WORD[1], rtl: true, seed: 1001, dry: .3 });
  const read = group([mk([[WORD[0] + ar.tw / 2 + 10, 560, .5], [WORD[0], 566, 1], [WORD[0] - ar.tw / 2 - 10, 560, .4]], { w: 8, tone: .45, dry: .7, prof: 'even', nb: 14, seed: 1010, gapLen: 900 })]);
  // the path the drop is carried along (a brush's dry trail, no brush shown)
  const path = []; for (let i = 0; i <= 24; i++) { const u = i / 24; path.push([lerp(DROP0[0], DROP1[0], u), lerp(DROP0[1], DROP1[1], u) - Math.sin(Math.PI * u) * 260, .4 + .6 * Math.sin(Math.PI * u)]); }
  const trail = mk(path, { w: 9, tone: .5, dry: .78, wet: .05, prof: 'tip', nb: 12, seed: 1020, gapLen: 1300 });
  const ins = INS.map((w, i) => brushText({ text: w, font: 'italic 500 70px "Cormorant Garamond"', size: 70, x: DROP1[0], y: 470 + i * 120, seed: 1030 + i, dry: .4 }));
  // shot B
  const small = mk([[300, chY(300) + 4, .5], [345, chY(345), 1], [392, chY(392) + 3, .4]], { w: 9, tone: TONE.nong, dry: .3, wet: .3, prof: 'brush', seed: 1040 });
  const runPts = []; for (let x = 392; x <= 1640; x += 26) runPts.push([x, chY(x) + Math.sin(x * .021) * 10, .8 + .25 * Math.sin(x * .013)]);
  const run = mk(runPts, { w: 8, tone: TONE.nong, dry: .42, wet: .25, prof: 'even', nb: 12, seed: 1041, gapLen: 1300 });
  const bank = sgn => { const b = [], d = []; [[140, 760], [700, 1260], [1180, 1790]].forEach(([a, c], j) => { const pts = []; for (let k = 0; k <= 8; k++) { const x = lerp(a, c, k / 8); pts.push([x, chY(x) + sgn * (92 + Math.sin(x * .009 + j) * 8), .7 + .4 * Math.sin(k * .8 + j)]); } b.push(mk(pts, { w: 22, tone: .62, darkDir: [0, -sgn], side: .85, body: .35, dry: .5, wet: .5, prof: 'press', seed: 1050 + j + (sgn > 0 ? 10 : 0) })); d.push(j / 3); }); return [b, d]; };
  const [bu, du] = bank(-1), [bd, dd] = bank(1);
  const landS = [-1, 1].map(sgn => { const pts = []; for (let x = 100; x <= 1830; x += 60) pts.push([x, chY(x) + sgn * (150 + Math.sin(x * .007) * 14), .8 + .3 * Math.sin(x * .004)]); return mk(pts, { w: 110, tone: .2, dry: .45, wet: .8, prof: 'tip', rough: .25, nb: 30, seed: 1070 + sgn, gapLen: 1700 }); });
  const land = (I, am = 1) => landS.forEach(s => draw(I, s, 1, am));
  const banks = group([...bu, ...bd], { extra: (I, p, am = 1) => land(I, ss(seg(p, .4, 1)) * am), live: (I, p, am) => [...bu, ...bd].forEach((s, j) => draw(I, s, (p - (j % 3) * .22) / .56, am)) });
  const fear1 = brushText({ text: 'I used this freedom…', font: 'italic 500 104px "Cormorant Garamond"', size: 104, x: 960, y: 250, seed: 1061, dry: .5, tremble: 1 });
  const fear2 = brushText({ text: 'while very much afraid.', font: 'italic 500 104px "Cormorant Garamond"', size: 104, x: 1000, y: 385, seed: 1062, dry: .5, tremble: 1.2 });
  const note = brushText({ text: 'paraphrased from the Urdu', font: 'italic 500 34px "Cormorant Garamond"', size: 34, x: 1000, y: 482, seed: 1063, tex: false, tone: .78 });
  K = { ar, read, trail, path, ins, small, run, banks, fear1, fear2, note };
}

function shots(T) {
  const S = K;
  const tA = T.end(7) + .9;                                     // into the vast sheet
  const g0 = T.at(3) + .4, g1 = T.end(3) - .2;                 // the drop gathers
  const c0 = T.at(4) + .1, c1 = T.at(4) + 2.4;                 // ...is carried across
  const f1 = T.word(10, 3) - .1, f2 = f1 + 1.75, fEnd = f2 + 1.9;
  return [
    { until: tA, tr: 1.2, c: [960, 560], cam: push(T.t0 - 1.2, tA + 1, .03, 1000, 500), paint: (L, t) => {
      S.ar.paint(L, ss(seg(t, T.t0 - 1, T.t0 + .4)));
      S.read.paint(L, seg(t, T.at(2) + .1, T.end(2)));
      // the drop gathers below the word (meaning + effect on the heart), then is carried across and blooms
      const gk = ss(seg(t, g0, g1)), ck = seg(t, c0, c1), land = seg(t, c1, c1 + .8);
      if (gk > 0 && ck <= 0) { const r = 2 + 11 * gk; blot(L.cd, DROP0[0], DROP0[1] + r * .4, r, .9, 0, 1.15, 3); blot(L.cw, DROP0[0], DROP0[1] + r * .4, r * 1.9, .2 * gk, 0, 1, 4); }
      if (ck > 0) {
        draw(L.ink, S.trail, Math.min(1, eio(ck) * 1.02), 1);
        if (ck < 1) { const m = (S.path.length - 1) * eio(ck), k = Math.floor(m), f = m - k, a = S.path[k], b = S.path[Math.min(k + 1, S.path.length - 1)]; blot(L.cd, lerp(a[0], b[0], f), lerp(a[1], b[1], f), 13, .92, 0, 1.1, 5); }
      }
      if (land > 0) { blot(L.cw, DROP1[0], DROP1[1], 14 + 40 * eo(land), .7 - .25 * land, .2, .85, 6); blot(L.cd, DROP1[0], DROP1[1], 12 + 6 * eo(land), .9, .2, .85, 7); }
      S.ins.forEach((w, i) => { const a = T.at(5 + i) + .25; w.paint(L, ss(seg(t, a, a + .55 + w.tw / 900))); if (t > a + .9 + w.tw / 900) seal(L.cc, DROP1[0] + w.tw / 2 + 26, 470 + i * 120 - 46, 30, 1, 5 + i); });
    } },
    { cam: push(tA, T.t1 + 1.2, .025, 960, 600), paint: (L, t) => {
      draw(L.ink, S.small, ss(seg(t, T.at(8) + .2, T.at(8) + .75)), 1);
      S.fear1.paint(L, seg(t, f1, f2 - .15)); S.fear2.paint(L, seg(t, f2, fEnd));
      S.note.paint(L, seg(t, fEnd + .2, fEnd + .7), .95);
      if (t > fEnd + .9) seal(L.cc, 1000 + S.fear2.tw / 2 + 40, 300, 56, 1, 2);
      S.banks.paint(L, seg(t, T.at(11) - .1, T.at(11) + 2.2));
      draw(L.ink, S.run, seg(t, T.at(11) + .6, T.end(11) + .2), 1);
    } },
  ];
}

let SH = null;
export default {
  style: 'ink',
  page: 'p. 7',
  noCaption: [10],
  async init(T) { await loadInkFonts(); build(); SH = shots(T); },
  render(ctx, t, T) { runShots(ctx, t, SH); },
  texts(t, T) {
    const out = [], S = K, tA = T.end(7) + .9, f1 = T.word(10, 3) - .1, f2 = f1 + 1.75, fEnd = f2 + 1.9;
    const box = (id, b, text) => out.push({ id, text, x0: b[0], y0: b[1], x1: b[2], y1: b[3] });
    if (t < tA + .4 && t > T.t0 + .4) box('quran', [WORD[0] - S.ar.tw / 2, WORD[1] - 170, WORD[0] + S.ar.tw / 2, WORD[1] + 60], 'الْقُرْآن');
    if (t < tA + .4) S.ins.forEach((w, i) => { if (t > T.at(5 + i) + .8 + w.tw / 900) box('ins' + i, w.box(), INS[i]); });
    if (t > f2 - .15) box('fear1', S.fear1.box(), 'I used this freedom…');
    if (t > fEnd) box('fear2', S.fear2.box(), 'while very much afraid.');
    if (t > fEnd + .7) box('note', S.note.box(), 'paraphrased from the Urdu');
    return out;
  },
  events(T) {
    const tA = T.end(7) + .9, f1 = T.word(10, 3) - .1, f2 = f1 + 1.75, fEnd = f2 + 1.9;
    const ev = [{ t: T.t0 - 1, type: 'brush', dur: 1.4 }, { t: T.at(2) + .1, type: 'brush', dur: 1.3, soft: true }, { t: T.at(3) + .4, type: 'drop', soft: true },
      { t: T.at(4) + .1, type: 'brush', dur: 2.3, soft: true }, { t: T.at(4) + 2.4, type: 'drop' }, { t: tA, type: 'wash', bloom: true },
      { t: T.at(8) + .2, type: 'brush', dur: .55 }, { t: f1, type: 'brush', dur: 1.6 }, { t: f2, type: 'brush', dur: 1.9 }, { t: fEnd + .9, type: 'stamp' },
      { t: T.at(11) - .1, type: 'brush', dur: 2.3 }, { t: T.at(11) + .6, type: 'brush', dur: 3.5, soft: true }];
    INS.forEach((w, i) => ev.push({ t: T.at(5 + i) + .25, type: 'brush', dur: .9 }, { t: T.at(5 + i) + 1.2, type: 'stamp', small: true }));
    return ev.sort((a, b) => a.t - b.t);
  },
};
