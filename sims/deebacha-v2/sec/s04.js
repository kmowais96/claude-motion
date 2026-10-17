// Section 4 · Why not word for word? — ink on rice paper, one vermilion (seals only).
// Shot A: a drop, a river brushed out of it between two empty banks; a free stroke leaps across; "Tarjumānī" with a seal;
//         a row of even stepping stones (word for word is not wrong).
// Shot B: the six translators as vertical inscriptions, one per name as spoken, each with a small seal.
// Shot C: al-Fātiḥah 1:2 word by word with its glosses; a seal for "a real gift"; the glosses go pale.
import { clamp, seg, ss, eo, mulberry, lerp } from '/core/lib.js';
import { mk, draw, blot, mass, TONE } from '../lib/ink/ink.js';
import { group, W, H } from '../lib/ink/comp.js';
import { brushText } from '../lib/ink/text.js';
import { seal } from '../lib/ink/seal.js';
import { runShots, push, concurrent } from '../lib/ink/scene.js';
import { loadInkFonts } from '../lib/ink/fonts.js';

const riverY = x => 520 - (x - 960) * .07 + Math.sin(x * .004) * 40;
const NAMES = ['Shah Waliullah', 'Shah Abdul Qadir', 'Shah Rafiuddin', 'Mawlana Mahmud al-Hasan', 'Mawlana Ashraf Ali Thanawi', 'Hafiz Fateh Muhammad Jalandhari'];
const NAME_W = [6, 13, 16, 18, 21, 26];            // word index in sentence 5 where each name begins
const COLX = [1590, 1270, 1080, 890, 700, 510];
const AR = ['الْحَمْدُ', 'لِلَّهِ', 'رَبِّ', 'الْعَالَمِينَ'];
const GL = ['all praise', 'for Allah', 'Lord', 'of the worlds'];

let K = null;
function build() {
  const R = mulberry(404);
  // --- river: parallel wave lines, dense near the banks, painted outward from the drop
  const waves = [], wd = [];
  const offs = [-104, -92, -78, -60, -36, -8, 22, 50, 72, 88, 100];
  offs.forEach((o, j) => {
    const edge = Math.abs(o) / 104;
    for (const side of [-1, 1]) {
      let x = 960 + side * (R() * 40);
      while (side < 0 ? x > -80 : x < 2000) {
        const len = 180 + R() * 260, x2 = x + side * len, pts = [];
        for (let k = 0; k <= 10; k++) { const xx = lerp(x, x2, k / 10); pts.push([xx, riverY(xx) + o + Math.sin(xx * .045 + j) * (3 + edge * 3), .8 + .3 * Math.sin(k * 1.3 + j)]); }
        waves.push(mk(pts, { w: 2 + edge * 1.6, tone: .32 + edge * .38, dry: .45 + R() * .2, wet: .2, prof: 'tip', rough: .2, nb: 5, seed: 4000 + waves.length }));
        wd.push(clamp(Math.abs(x - 960) / 1100 + R() * .05));
        x = x2 + side * (30 + R() * 110 * (1 - edge * .6));
      }
    }
  });
  // banks: broken loaded strokes on the water side
  const banks = [], bd = [];
  for (const [sgn, segs] of [[-1, [[-60, 380], [620, 1020], [1380, 1990]]], [1, [[-60, 260], [520, 900], [1150, 1500], [1700, 1990]]]]) {
    for (const [a, b] of segs) {
      const pts = []; for (let k = 0; k <= 8; k++) { const xx = lerp(a, b, k / 8); pts.push([xx, riverY(xx) + sgn * (122 + Math.sin(xx * .01) * 8), .7 + .4 * Math.sin(k * .9)]); }
      if (Math.abs((a + b) / 2 - 960) > 0) banks.push(mk(a < 960 ? pts.reverse() : pts, { w: 15, tone: .6, darkDir: [0, -sgn], side: .85, body: .4, dry: .5, wet: .45, prof: 'press', seed: 4500 + banks.length }));
      bd.push(clamp(Math.abs((a + b) / 2 - 960) / 1100));
    }
  }
  const moss = I => { const M = mulberry(9); for (const [x, sg] of [[300, -1], [1060, 1], [1500, -1], [700, 1], [1840, 1]]) for (let k = 0; k < 4; k++) blot(I.wet, x + (M() - .5) * 26, riverY(x) + sg * (130 + M() * 10), 2 + M() * 2.5, .85, M() * 3, .6, k + x); };
  const body = (I, am = 1) => { const top = [], bot = []; for (let x = -80; x <= 2000; x += 40) { top.push([x, riverY(x) - 112]); bot.unshift([x, riverY(x) + 112]); } mass(I.wet, [...top, ...bot], .075 * am, 10, 7); };
  const river = group([...banks, ...waves], { live: (I, p, am) => { body(I, seg(p, .2, .8) * am); concurrent(I, banks, bd, p, .5, am); concurrent(I, waves, wd, p, .45, am); if (p > .9) moss({ wet: I.wet }); } });
  river.extra = (I, p) => { if (p >= 1) { moss(I); body(I); } };
  // the free stroke: one leap from the near bank to the far one
  const free = group([mk([[1100, 660, .5], [1190, 500, .9], [1330, 370, 1.1], [1520, 305, 1], [1720, 335, .45]], { w: 30, tone: TONE.jiao, darkDir: [0, -1], side: .6, dry: .58, wet: .2, prof: 'brush', nb: 40, seed: 4801, gapLen: 900 })]);
  // stepping stones, word by word
  const stones = [];
  for (let i = 0; i < 7; i++) { const u = i / 6, x = lerp(300, 470, u), y = lerp(712, 492, u); stones.push(mk([[x - 9, y + 1], [x + 9, y - 1]], { w: 15, tone: .78, dry: .3, wet: .5, prof: 'dot', seed: 4900 + i })); }
  const stoneG = group(stones, { overlap: 0 });
  const tarj = brushText({ text: 'Tarjumānī', font: 'italic 500 150px "Cormorant Garamond"', size: 150, x: 560, y: 285, seed: 41, dry: .48 });
  // --- names (vertical, read top to bottom)
  const head = brushText({ text: 'Great scholars had done it beautifully:', font: 'italic 500 44px "Cormorant Garamond"', size: 44, x: 960, y: 118, seed: 42, tex: false, tone: .9 });
  const lab = [brushText({ text: 'in Persian', font: 'italic 400 32px "Cormorant Garamond"', size: 32, x: COLX[0], y: 190, seed: 43, tex: false, tone: .62 }),
    brushText({ text: 'in Urdu', font: 'italic 400 32px "Cormorant Garamond"', size: 32, x: (COLX[1] + COLX[5]) / 2, y: 190, seed: 44, tex: false, tone: .62 })];
  const names = NAMES.map((n, i) => brushText({ text: n, font: '500 46px "Cormorant Garamond"', size: 46, x: COLX[i] - 15, y: 232, align: 'left', rot: Math.PI / 2, seed: 50 + i, track: 1.5 }));
  const divider = group([mk([[1430, 236], [1424, 520, .9], [1432, 800, .3]], { w: 3, tone: .45, dry: .6, prof: 'tip', nb: 6, seed: 4990 })]);
  // --- the āyah word by word
  const sz = 124, gap = 44;
  const ar = AR.map((w, i) => brushText({ text: w, font: `400 ${sz}px "Amiri"`, size: sz, x: 0, y: 450, rtl: true, seed: 70 + i, dry: .22 }));
  const tot = ar.reduce((a, b) => a + b.tw, 0) + gap * (AR.length - 1);
  let x = 960 + tot / 2;
  ar.forEach(a => { const cx = x - a.tw / 2; a.x = cx; x -= a.tw + gap; });
  // brushText places by its own o.x; rebuild with the computed centres
  const ar2 = ar.map((a, i) => brushText({ text: AR[i], font: `400 ${sz}px "Amiri"`, size: sz, x: a.x, y: 450, rtl: true, seed: 70 + i, dry: .22 }));
  const gl = ar2.map((a, i) => brushText({ text: GL[i], font: 'italic 500 40px "Cormorant Garamond"', size: 40, x: a.x, y: 610, seed: 80 + i, tex: false, tone: .88 }));
  const ticks = group(ar2.map((a, i) => mk([[a.x, 515], [a.x + 2, 556, .6]], { w: 3, tone: .5, dry: .5, prof: 'tip', nb: 5, seed: 5100 + i })), { overlap: 0 });
  const label = brushText({ text: 'example: al-Fātiḥah 1:2', font: 'italic 500 34px "Cormorant Garamond"', size: 34, x: 960, y: 740, seed: 90, tex: false, tone: .8 });
  K = { river, free, stoneG, tarj, head, lab, names, divider, ar: ar2, gl, ticks, label, tot };
}

function shots(T) {
  const S = K;
  const drop = T.at(0) + .55;
  const tA = T.end(4) + .2, tB = T.end(5) + .25;
  return [
    { until: tA, tr: 1.1, c: [960, 520], cam: push(T.t0 - 1.2, tA + 1, .035, 960, 500), paint: (L, t) => {
      // the drop: falls, lands, blooms
      const u = seg(t, drop, drop + .35);
      if (t > drop - .25 && t < drop) { const f = seg(t, drop - .25, drop); blot(L.cd, 960, lerp(380, riverY(960) - 8, f * f), 6, .9, 0, 1.6, 1); }
      if (u > 0) { blot(L.cw, 960, riverY(960), 6 + 30 * eo(u), .85 - .25 * u, .3, .82, 3); blot(L.cd, 960, riverY(960), 5 + 9 * eo(u), .9, .3, .8, 4); }
      S.river.paint(L, seg(t, T.at(1) - .2, T.end(1) + .3));
      S.free.paint(L, eo(seg(t, T.at(2) + .25, T.at(2) + 1.35)));
      S.tarj.paint(L, ss(seg(t, T.k(3, .3), T.k(3, .3) + 1.25)), 1, 1 - seg(t, T.k(3, .3) + 1.25, T.k(3, .3) + 2));
      const st = T.k(3, .3) + 1.5; if (t > st) seal(L.cc, 560 + S.tarj.tw / 2 + 34, 172, 50, 1, 2);
      S.stoneG.paint(L, seg(t, T.at(4) + .3, T.end(4) - .3));
    } },
    { until: tB, tr: 1.1, c: [960, 430], cam: push(tA, tB + 1, .02), paint: (L, t) => {
      S.head.paint(L, seg(t, T.at(5) + .15, T.word(5, 6) - .1));
      S.lab[0].paint(L, seg(t, T.word(5, 8), T.word(5, 10)));
      S.lab[1].paint(L, seg(t, T.word(5, 11), T.word(5, 13)));
      S.divider.paint(L, seg(t, T.word(5, 10), T.word(5, 13)));
      S.names.forEach((n, i) => {
        const a = T.word(5, NAME_W[i]) - .05, b = Math.min(a + .4 + n.tw / 520, (i < 5 ? T.word(5, NAME_W[i + 1]) : T.end(5)) - .1);
        n.paint(L, seg(t, a, b));
        if (t > b + .15) seal(L.cc, COLX[i] - 13, 232 + n.tw + 22, 26, 1, i + 3);
      });
    } },
    { cam: push(tB, T.t1 + 1.2, .03, 960, 520), paint: (L, t) => {
      const a0 = T.at(6) + .1, step = (T.end(6) - a0 - .2) / 4;
      const pale = 1 - .72 * ss(seg(t, T.k(8, .45), T.end(9) - .2));
      S.ar.forEach((w, i) => w.paint(L, ss(seg(t, a0 + i * step, a0 + i * step + step * .9))));
      S.ticks.strokes.forEach((s, i) => { if (t > a0 + i * step + step * .5) draw(L.ink, s, seg(t, a0 + i * step + step * .5, a0 + i * step + step * .8), pale); });
      S.gl.forEach((g, i) => g.paint(L, seg(t, a0 + i * step + step * .6, a0 + i * step + step * 1.3), pale));
      S.label.paint(L, seg(t, T.at(6) - .2, T.at(6) + .5), .95);
      const gx = 960 - S.tot / 2 - 70;
      if (t > T.at(7) + .7) seal(L.cc, gx - 30, 400, 60, 1, 1);
    } },
  ];
}

let SH = null;
export default {
  style: 'ink',
  page: 'pp. 2–3',
  noCaption: [5],
  async init(T) { await loadInkFonts(); build(); SH = shots(T); },
  render(ctx, t, T) { runShots(ctx, t, SH); },
  texts(t, T) {
    const out = [], S = K, tA = T.end(4) + .2, tB = T.end(5) + .25;
    const box = (id, b, text) => out.push({ id, text, x0: b[0], y0: b[1], x1: b[2], y1: b[3] });
    if (t > T.k(3, .3) + 1.25 && t < tA + .5) box('tarjumani', S.tarj.box(), 'Tarjumānī');
    if (t > T.word(5, 6) - .1 && t < tB + .5) {
      box('head', S.head.box(), 'Great scholars had done it beautifully:');
      S.names.forEach((n, i) => { const b = T.word(5, NAME_W[i]) - .05 + .4 + n.tw / 520; if (t > b) box("name" + i, [COLX[i] - 18, 232, COLX[i] + 24, 232 + n.tw], NAMES[i]); });
    }
    if (t > T.at(6) + .5) box('label', S.label.box(), 'example: al-Fātiḥah 1:2');
    if (t > T.end(6)) { box('ayah', [960 - S.tot / 2, 330, 960 + S.tot / 2, 500], AR.join(' ')); S.gl.forEach((g, i) => box('gloss' + i, g.box(), GL[i])); }
    return out;
  },
  events(T) {
    const tA = T.end(4) + .2, tB = T.end(5) + .25, a0 = T.at(6) + .1, step = (T.end(6) - a0 - .2) / 4;
    const ev = [{ t: T.at(0) + .55, type: 'drop' }, { t: T.at(1) - .2, type: 'wash' }, { t: T.at(2) + .25, type: 'brush', dur: 1.1 },
      { t: T.k(3, .3), type: 'brush', dur: 1.25 }, { t: T.k(3, .3) + 1.5, type: 'stamp' }, { t: T.at(4) + .3, type: 'brush', dur: 2.4, soft: true },
      { t: tA, type: 'wash', bloom: true }, { t: T.at(5) + .15, type: 'brush', dur: 1.8, soft: true }, { t: tB, type: 'wash', bloom: true },
      { t: T.at(7) + .7, type: 'stamp' }];
    NAMES.forEach((n, i) => { const tw = n.tw || 300, a = T.word(5, NAME_W[i]) - .05; ev.push({ t: a, type: 'brush', dur: .4 + tw / 520 }, { t: a + .55 + tw / 520, type: 'stamp', small: true }); });
    for (let i = 0; i < 4; i++) ev.push({ t: a0 + i * step, type: 'brush', dur: step * .9 });
    return ev.sort((a, b) => a.t - b.t);
  },
};
