// Section 5 · Life: the sieve — ink on rice paper, vermilion for seals only.
// Shot A: the glosses lie flat on a ground line by a still pool; a drop hangs from a reed tip and never falls;
//         ink creeps in from the edges; the question is brushed large (no caption).
// Shot B: a sieve painted in loaded strokes; dry particles fall through; a wet wisp (the spirit) rises and escapes.
// Shot C: a stone, painted outline → texture → wash → dots; its wash softens and bleeds ("melted hearts of stone").
// Shot D: pale dunes, stillness, one decisive dry stroke (lightning); rings spread; the stroke fades into a flat pale line.
import { clamp, seg, ss, eo, ei, mulberry, lerp } from '/core/lib.js';
import { mk, draw, blot, mass, TONE } from '../lib/ink/ink.js';
import { group, W, H } from '../lib/ink/comp.js';
import { brushText } from '../lib/ink/text.js';
import { seal } from '../lib/ink/seal.js';
import { runShots, push, creep } from '../lib/ink/scene.js';
import { reed, ripple } from '../lib/ink/land.js';
import { loadInkFonts } from '../lib/ink/fonts.js';

const GL = ['all praise', 'for Allah', 'Lord', 'of the worlds'];
const GROUND = 760;
const SV = { x: 960, y: 430, rx: 250, ry: 70 };     // the sieve
const ST = { x: 960, y: 560 };                     // the stone
const STRIKE = [905, 700];                         // where the lightning lands

let K = null;
const mkc = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

function build() {
  const R = mulberry(505);
  // ---- shot A: ground line, glosses lying on it, pool, reed
  const ground = group([mk([[150, GROUND + 4, .6], [600, GROUND, 1], [1100, GROUND + 3, .9], [1770, GROUND - 2, .5]], { w: 7, tone: .5, dry: .72, wet: .1, prof: 'even', nb: 12, seed: 5001, gapLen: 1600 })]);
  let gx = 330;
  const glosses = GL.map((g, i) => { const b = brushText({ text: g, font: 'italic 500 40px "Cormorant Garamond"', size: 44, x: gx, y: GROUND - 8, align: 'left', seed: 500 + i, tex: false, tone: .5 }); gx += b.tw + 120 + i * 40; return b; });
  // pool: blank paper ringed by a few shore strokes and a pale far-shore wash
  const shore = [
    mk([[470, 500, .4], [700, 482, 1], [960, 476, 1], [1220, 480, 1], [1430, 494, .4]], { w: 14, tone: .45, darkDir: [0, -1], side: .85, body: .35, dry: .55, wet: .5, prof: 'tip', seed: 5010 }),
    mk([[430, 560, .4], [640, 618, 1], [960, 640, .9], [1260, 626, .8], [1470, 572, .3]], { w: 20, tone: .5, darkDir: [0, 1], side: .85, body: .35, dry: .5, wet: .5, prof: 'tip', seed: 5011 }),
    mk([[640, 498], [840, 486, .8]], { w: 3, tone: .3, dry: .6, prof: 'tip', nb: 4, seed: 5012 }),
    mk([[1060, 630], [1240, 618, .8]], { w: 3, tone: .3, dry: .6, prof: 'tip', nb: 4, seed: 5013 }),
  ];
  const pool = group(shore, { extra: (I, p, am = 1) => { if (p >= 1) mass(I.wet, [[420, 492], [700, 462], [960, 450], [1250, 458], [1500, 488], [1230, 478], [960, 472], [700, 478]], .13 * am, 6, 3, [0, 450, 0, 492, 1, .3]); } });
  // a reed leaning over the pool; its tip is where the drop hangs
  const reedG = { x0: 0, y0: 0, paint: (L, p, am) => { if (p <= 0) return; const I = L.ink; draw(I, mk([[1560, 770], [1530, 600, 1], [1460, 470, .8], [1330, 400, .5]], { w: 7, tone: .78, dry: .4, wet: .3, prof: 'tip', seed: 5020 }), p, am); if (p > .6) draw(I, mk([[1528, 620], [1470, 560, 1], [1400, 552, .5]], { w: 14, tone: .7, dry: .4, wet: .4, prof: 'lens', seed: 5021 }), (p - .6) / .4, am); if (p > .8) draw(I, mk([[1545, 700], [1610, 620, 1], [1650, 590, .4]], { w: 13, tone: .6, dry: .45, wet: .4, prof: 'lens', seed: 5022 }), (p - .8) / .2, am); } };
  const q1 = brushText({ text: 'Is this really the Book', font: 'italic 500 96px "Cormorant Garamond"', size: 96, x: 960, y: 220, seed: 510, dry: .45 });
  const q2 = brushText({ text: 'that challenged the whole world?', font: 'italic 500 96px "Cormorant Garamond"', size: 96, x: 960, y: 340, seed: 511, dry: .45 });
  // ---- shot B: sieve
  const ell = (rx, ry, a0, a1, dy = 0, n = 14) => { const o = []; for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n); o.push([SV.x + Math.cos(a) * rx, SV.y + dy + Math.sin(a) * ry, .7 + .4 * Math.sin(i / n * Math.PI)]); } return o; };
  const rim = [
    mk(ell(SV.rx, SV.ry, Math.PI * 1.05, Math.PI * 1.95, 0), { w: 12, tone: .55, dry: .45, wet: .4, prof: 'brush', seed: 5101 }),   // back rim
    mk(ell(SV.rx, SV.ry, Math.PI * .02, Math.PI * .98, 0), { w: 22, tone: .85, darkDir: [0, 1], side: .8, dry: .45, wet: .3, prof: 'brush', seed: 5102 }),  // front rim
    mk(ell(SV.rx, SV.ry, Math.PI * .05, Math.PI * .95, 36), { w: 14, tone: .7, dry: .55, wet: .3, prof: 'tip', seed: 5103 }),   // rim depth
  ];
  const mesh = [];
  for (let i = -6; i <= 6; i++) for (const d of [1, -1]) {
    const c = i * 36, pts = [];
    // lines across the ellipse in two diagonal directions, clipped to it
    for (let k = -1; k <= 1; k += .1) { const x = SV.x + c + k * 200 * d * .7, y = SV.y + k * SV.ry * .95; const e = Math.pow((x - SV.x) / (SV.rx - 10), 2) + Math.pow((y - SV.y) / (SV.ry - 6), 2); if (e < 1) pts.push([x, y]); }
    if (pts.length > 2) mesh.push(mk(pts, { w: 1.6, tone: .28, dry: .5, prof: 'even', nb: 3, seed: 5150 + mesh.length }));
  }
  const sieve = group([...rim, ...mesh], { extra: (I, p, am = 1) => { if (p >= 1) mass(I.wet, ell(SV.rx, SV.ry, 0, Math.PI, 0, 16).map(q => [q[0], q[1]]).concat(ell(SV.rx, SV.ry, Math.PI, 0, 36, 16).map(q => [q[0], q[1]])), .16 * am, 3, 5); } });
  const parts = [];
  for (let i = 0; i < 70; i++) parts.push({ x: SV.x + (R() - .5) * 360, ts: R(), r: 1.6 + R() * 2.4, sq: .6 + R() * .4, rot: R() * 3, a: .6 + R() * .35 });
  // ---- shot C: stone
  const sp = []; for (let i = 0; i < 16; i++) { const a = Math.PI + i / 15 * Math.PI, rr = 1 + (R() - .5) * .12; sp.push([ST.x + Math.cos(a) * 270 * rr * (1 + .1 * Math.sin(a * 3)), ST.y + Math.sin(a) * 190 * rr]); }
  const stoneOut = [
    mk([[ST.x - 280, ST.y + 6, .6], ...sp.slice(1, 9).map(q => [q[0], q[1], 1.1])], { w: 9, tone: .9, dry: .5, wet: .25, prof: 'brush', seed: 5201 }),
    mk([...sp.slice(8, 15).map(q => [q[0], q[1], 1]), [ST.x + 285, ST.y + 8, .4]], { w: 8, tone: .88, dry: .55, wet: .25, prof: 'brush', seed: 5202 }),
    mk([[ST.x - 300, ST.y + 12, .4], [ST.x - 60, ST.y + 22, 1], [ST.x + 310, ST.y + 10, .4]], { w: 10, tone: .85, dry: .5, wet: .3, prof: 'tip', seed: 5203 }),
    mk([[ST.x + 40, ST.y - 175], [ST.x + 80, ST.y - 90, 1], [ST.x + 60, ST.y + 10, .6]], { w: 6, tone: .8, dry: .6, prof: 'tip', seed: 5204 }),
  ];
  const cunS = []; for (let i = 0; i < 16; i++) { const x = ST.x + 70 + R() * 180, y = ST.y - 120 + R() * 130, l = 28 + R() * 34; cunS.push(mk([[x, y], [x - l * .3, y + l * .55], [x - l * .45, y + l]], { w: 9 + R() * 7, tone: .7, dry: .6, wet: .4, prof: 'nail', seed: 5250 + i })); }
  const stone = group([...stoneOut, ...cunS], { overlap: .05, extra: (I, p, am = 1) => {
    if (p < 1) return;
    mass(I.wet, [...sp, [ST.x + 285, ST.y + 14], [ST.x - 285, ST.y + 14]], .2 * am, 6, 8, [ST.x - 300, 0, ST.x + 300, 0, .45, 1.3]);
    const M = mulberry(52); for (let c = 0; c < 6; c++) { const q = sp[2 + Math.floor(M() * 11)]; for (let k = 0; k < 3; k++) blot(I.wet, q[0] + (M() - .5) * 18, q[1] + M() * 6, 2 + M() * 2, .9, M() * 3, .6, c * 9 + k); }
  } });
  // ---- shot D: dunes
  const dune = (y0, amp, seed, a) => I => { const pts = [[-50, H]]; for (let x = -50; x <= 1970; x += 30) pts.push([x, y0 - amp * (Math.sin(x * .0042 + seed) * .6 + Math.sin(x * .011 + seed * 2) * .25 + .5)]); pts.push([1970, H]); mass(I.wet, pts, a, 4, seed, [0, y0 - amp, 0, y0 + 160, 1, 0]); };
  const dunesG = { cache: null };
  dunesG.paint = (L, am = 1) => {
    if (!dunesG.cache) { const c = mkc(W, H), I = { wet: c.getContext('2d') }; dune(650, 90, 3, .1)(I); dune(720, 60, 7, .15)(I); dunesG.cache = c; }
    L.cw.globalAlpha = am; L.cw.drawImage(dunesG.cache, 0, 0); L.cw.globalAlpha = 1;
  };
  const BK = [[1290, -30, .6], [1190, 190, 1], [1262, 250, 1.05], [1050, 480, 1], [1115, 520, .95], [STRIKE[0], STRIKE[1], .3]], BP = [];
  for (let i = 0; i < BK.length - 1; i++) for (let k = 0; k < 6; k++) { const u = k / 6; BP.push([lerp(BK[i][0], BK[i + 1][0], u), lerp(BK[i][1], BK[i + 1][1], u), lerp(BK[i][2], BK[i + 1][2], u)]); }
  BP.push(BK[BK.length - 1]);
  const bolt = mk(BP, { w: 34, tone: TONE.jiao, dry: .55, wet: .15, prof: 'even', rough: .18, nb: 50, seed: 5301, gapLen: 1100, per: 1 });
  const flat = mk([[300, STRIKE[1] + 2, .5], [900, STRIKE[1], 1], [1600, STRIKE[1] + 3, .5]], { w: 5, tone: .34, dry: .6, prof: 'even', nb: 10, seed: 5302, gapLen: 1300 });
  K = { ground, glosses, pool, reedG, q1, q2, sieve, rim, mesh, parts, stone, dunesG, bolt, flat };
}

function shots(T) {
  const S = K;
  const tA = T.end(7) - .3, tB = T.at(10) - .2, tC = T.at(12) - .55;
  const qa = T.at(6) - .05, qm = qa + 1.35;            // question line 1 / line 2 start
  const sv0 = tA + 1.6, fall0 = T.at(8) + .5, fall1 = T.end(8) + .3, rise0 = T.at(9) + .2;
  const strike = T.word(12, 6) - .05;
  return [
    { until: tA, tr: 1.1, c: [960, 450], cam: push(T.t0 - 1.2, tA + 1, .03, 960, 560), paint: (L, t) => {
      S.ground.paint(L, seg(t, T.t0 - 1.2, T.t0 - .2));
      S.glosses.forEach((g, i) => g.paint(L, seg(t, T.t0 - 1 + i * .25, T.t0 - .4 + i * .25)));
      S.pool.paint(L, seg(t, T.at(1) - .3, T.at(1) + 1.6));
      S.reedG.paint(L, seg(t, T.at(1) + .8, T.at(2) + .4), 1);
      // the drop at the reed tip: swells, trembles, never falls
      const dk = seg(t, T.at(2), T.at(3) + 1);
      if (dk > 0) { const r = 3 + 6 * ss(dk) + Math.sin(t * 2.2) * .25 * dk; blot(L.cd, 1330, 402 + r * .9, r, .88, 0, 1.25, 2); blot(L.cw, 1330, 402 + r * .9, r * 1.5, .25, 0, 1.2, 3); }
      creep(L, ss(seg(t, T.at(5) + .1, T.at(6) + .8)));
      S.q1.paint(L, seg(t, qa, qm - .1)); S.q2.paint(L, seg(t, qm, qm + 1.45));
    } },
    { until: tB, tr: 1.1, c: [SV.x, SV.y], cam: push(tA, tB + 1, .03, 960, 470), paint: (L, t) => {
      S.sieve.paint(L, seg(t, tA + .1, sv0));
      // dry ingredients fall through and gather in a small heap
      const fy0 = SV.y + 50, heap = ss(seg(t, fall0 + .5, fall1 + 1));
      if (heap > 0) mass(L.cw, [[SV.x - 150 * heap - 20, GROUND + 40], [SV.x - 40, GROUND + 40 - 34 * heap], [SV.x + 30, GROUND + 40 - 40 * heap], [SV.x + 160 * heap + 20, GROUND + 40]], .3 * heap, 5, 6);
      for (const p of S.parts) {
        const ts = lerp(fall0, fall1, p.ts), dt = t - ts; if (dt < 0) continue;
        const y = fy0 + 380 * dt * dt + 60 * dt; if (y > GROUND + 30) continue;
        blot(L.cd, p.x + (SV.x - p.x) * clamp((y - fy0) / 600) * .4, y, p.r, p.a, p.rot, p.sq, 7);
      }
      // the living spirit: a wet wisp rises out of the sieve and escapes upward
      for (let j = 0; j < 5; j++) {
        const t0 = rise0 + j * .4, u = t - t0; if (u <= 0) continue;
        const head = 300 * Math.pow(u, 1.2), len = 300 + j * 30, pts = [];
        for (let k = 0; k <= 16; k++) { const s = head - len * (1 - k / 16); if (s < 0) continue; pts.push([SV.x - 120 + j * 60 + Math.sin(s * .012 + j * 1.7) * (20 + s * .12), SV.y - 20 - s, .35 + .65 * Math.sin(Math.PI * k / 16)]); }
        if (pts.length > 2) draw(L.ink, mk(pts, { w: 13 - j, tone: .42, dry: .5, wet: .55, prof: 'tip', nb: 9, seed: 5170 + j, gapLen: 500 }), 1, 1 - seg(t, t0 + 2.4, t0 + 3.8));
      }
    } },
    { until: tC, tr: 1.0, c: [ST.x, ST.y - 60], cam: push(tB, tC + 1, .025, 960, 560), paint: (L, t) => {
      const p = seg(t, T.at(10) + .3, T.at(10) + 3.2), melt = ss(seg(t, T.at(11) + .3, T.end(11) + .6));
      if (melt <= 0) S.stone.paint(L, p);
      else {
        if (!S.stone.cache) S.stone.build();
        const C = S.stone.cache;
        L.cd.globalAlpha = 1 - .75 * melt; L.cd.drawImage(C.dry, S.stone.x0, S.stone.y0); L.cd.globalAlpha = 1;
        // the body softens: the wash spreads and slumps, the contour runs into it
        const w = L.cw; w.save();
        const sy = 1 + .16 * melt, by = S.stone.y1;
        w.translate(0, by); w.scale(1 + .04 * melt, sy); w.translate(0, -by);
        w.filter = `blur(${(2 + 16 * melt).toFixed(1)}px)`;
        w.globalAlpha = 1; w.drawImage(C.wet, S.stone.x0, S.stone.y0);
        w.globalAlpha = .75 * melt; w.drawImage(C.dry, S.stone.x0, S.stone.y0);
        w.filter = 'none'; w.restore();
        mass(L.cw, [[ST.x - 330 - 40 * melt, ST.y + 14], [ST.x, ST.y + 26 + 30 * melt], [ST.x + 340 + 40 * melt, ST.y + 14], [ST.x, ST.y + 2]], .1 * melt, 10, 4);
      }
    } },
    { cam: push(tC, T.t1 + 1.2, .02, 960, 640), o: { bleed: 5 }, paint: (L, t) => {
      S.dunesG.paint(L, 1);
      // stillness, then one decisive stroke in a few frames; it fades into a flat pale line at the end
      const bp = seg(t, strike, strike + .17), fade = ss(seg(t, T.at(14) + .3, T.at(14) + 2.8));
      if (bp > 0) draw(L.ink, S.bolt, bp, 1 - fade);
      if (bp >= 1 && t < strike + .6) blot(L.cw, STRIKE[0], STRIKE[1], 10 + 60 * eo(seg(t, strike + .17, strike + .6)), .35 * (1 - seg(t, strike + .2, strike + .6)), 0, .3, 9);
      draw(L.ink, S.flat, seg(t, T.at(14) + .8, T.at(14) + 3), .9);
      // rings spread out across the land
      for (let j = 0; j < 6; j++) {
        const t0 = strike + .3 + j * .85, age = t - t0; if (age <= 0) continue;
        const r = 40 + 330 * Math.pow(age / 3, .6), a = .8 * (1 - seg(age, .4, 3.2)) * (1 - fade);
        if (a > .01) ripple(L.ink, STRIKE[0], STRIKE[1], r, a, 60 + j, .2, 3.4);
      }
    } },
  ];
}

let SH = null, TT = null;
export default {
  style: 'ink',
  page: 'pp. 3–4',
  noCaption: [6],
  async init(T) { await loadInkFonts(); build(); SH = shots(T); TT = T; },
  render(ctx, t, T) { runShots(ctx, t, SH); },
  texts(t, T) {
    const out = [], S = K, tA = T.end(7) - .3, qa = T.at(6) - .05, qm = qa + 1.35;
    const box = (id, b, text) => out.push({ id, text, x0: b[0], y0: b[1], x1: b[2], y1: b[3] });
    if (t > T.t0 && t < tA) S.glosses.forEach((g, i) => box('gloss' + i, g.box(), GL[i]));
    if (t > qm + 1.45 && t < tA + .4) { box('q1', S.q1.box(), 'Is this really the Book'); box('q2', S.q2.box(), 'that challenged the whole world?'); }
    return out;
  },
  events(T) {
    const tA = T.end(7) - .3, tB = T.at(10) - .2, tC = T.at(12) - .55, strike = T.word(12, 6) - .05, qa = T.at(6) - .05;
    return [
      { t: T.t0 - 1.2, type: 'brush', dur: 1, soft: true }, { t: T.at(1) - .3, type: 'brush', dur: 1.9, soft: true }, { t: T.at(1) + .8, type: 'brush', dur: 1.8 },
      { t: T.at(5) + .1, type: 'wash', dur: 3 }, { t: qa, type: 'brush', dur: 1.3 }, { t: qa + 1.35, type: 'brush', dur: 1.45 },
      { t: tA, type: 'wash', bloom: true }, { t: tA + .25, type: 'brush', dur: 2 }, { t: T.at(8) + .2, type: 'sift', dur: T.end(8) - T.at(8) + .6 },
      { t: T.at(9) + .2, type: 'wash', dur: 2.5, soft: true }, { t: tB, type: 'wash', bloom: true }, { t: T.at(10) + .3, type: 'brush', dur: 2.9 },
      { t: T.at(11) + .3, type: 'wash', dur: 2.4 }, { t: tC, type: 'wash', bloom: true }, { t: strike, type: 'brush', dur: .17, hard: true },
      ...[0, 1, 2, 3, 4, 5].map(j => ({ t: strike + .3 + j * .85, type: 'drop', soft: true })), { t: T.at(14) + .8, type: 'brush', dur: 2.2, soft: true },
    ].sort((a, b) => a.t - b.t);
  },
};
