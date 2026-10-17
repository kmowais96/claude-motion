// Section 9 · One word, six meanings — a copperplate specimen plate.
// KUFR at the centre in a ruled cartouche; six numbered roundels engraved as each meaning is spoken;
// the labels are burnished and re-cut as KUFR, tissue guards dim the roundels, then the true labels
// return and a madder wash blooms on their tablets (the section's one colour event).
import { B, Wash, drawSheet, engraveText, measure, PAL } from '../lib/engraving/index.js';
import { clamp, seg, eo } from '/core/lib.js';

const W = 1920, H = 1080;
const PLATE = [70, 34, 1850, 926], BORDER = [100, 60, 1820, 900];
const L = [-0.6, -0.7];                       // one light, upper left
const RR = 112;                               // roundel radius
const POS = [[285, 205], [285, 482], [285, 759], [1635, 205], [1635, 482], [1635, 759]];
const NUM = ['I', 'II', 'III', 'IV', 'V', 'VI'];
const LAB = [['Complete', 'disbelief'], ['Simple', 'denial'], ['Ingratitude'],
  ['Falling short in what', 'faith requires'], ['Belief in principle,', 'refusal in practice'], ['Obedience outside,', 'disbelief inside']];
const KW = [5, 2, 2, 2, 2, 3];                // word of each sentence where the meaning is named
const C = [960, 488];                         // centre cartouche
const LABF = { size: 30, italic: true, weight: 400 };
const NUMF = { size: 28, weight: 600, track: 0.12 };
const STAMPF = { size: 36, weight: 600, track: 0.22 };
const AR = 'كُفْر', ARF = '700 150px "Amiri"';
const MADDER = '#a9483d';

// ---------------------------------------------------------------- geometry helpers (local coords → world)
const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
const ell = (cx, cy, rx, ry, n = 56) => B.ellipsePts(cx, cy, rx, ry, 0, n);
const arc = (cx, cy, rx, ry, a0, a1, n = 24) => Array.from({ length: n + 1 }, (_, k) => { const a = a0 + (a1 - a0) * k / n; return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; });
const pathPts = (d, step = 1.5) => B.parseD(d, step)[0].pts;
const rrect = (x0, y0, x1, y1, r) => [...arc(x0 + r, y0 + r, r, r, Math.PI, 1.5 * Math.PI, 6), ...arc(x1 - r, y0 + r, r, r, -0.5 * Math.PI, 0, 6), ...arc(x1 - r, y1 - r, r, r, 0, 0.5 * Math.PI, 6), ...arc(x0 + r, y1 - r, r, r, 0.5 * Math.PI, Math.PI, 6)];

// one engraved part: swelling outline + up to three hatch families, occluded by `excl`
function part(ink, polys, o = {}) {
  const { angle = -0.6, spacing = 2.7, tone = null, base = 0.06, excl = null, wMax = 1.35, ow = 1.45, t1 = 0.12, t2 = 0.5, t3 = 0.78, bend = 0, seed = 1, dash = 0, noOutline = false } = o;
  const tn = typeof tone === 'number' ? () => tone : tone || B.formTone(polys, { light: L, base });
  const G = ink.g;
  if (!noOutline) { ink.group(G + 'ol'); for (const p of polys) B.outline(ink, p, { w: ow, light: L, seed, excl, run: 60, step: 1.5 }); }
  ink.group(G + 'h1'); B.hatch(ink, polys, { angle, spacing, tone: tn, thr: t1, wMax, excl, bend, seed, dash, taper: 5, step: 1.5, wobble: 0.15 });
  if (t2 != null) { ink.group(G + 'h2'); B.hatch(ink, polys, { angle: angle + 1.05, spacing: spacing * 1.1, tone: tn, thr: t2, wMax: wMax * 0.8, excl, seed: seed + 1, taper: 5, step: 1.5, wobble: 0.15 }); }
  if (t3 != null) { ink.group(G + 'h3'); B.hatch(ink, polys, { angle: angle - 0.5, spacing: spacing * 1.25, tone: tn, thr: t3, wMax: wMax * 0.6, excl, seed: seed + 2, taper: 5, step: 1.5, wobble: 0.15 }); }
  ink.group(G);
}
const line = (ink, pts, w = 1.1) => { const G = ink.g; ink.group('x'); B.stroke(ink, pts, w, { taper: 4, step: 1.2 }); ink.group(G); };

// ---------------------------------------------------------------- the six emblems (no figures)
// each takes f (local → world) and fills an Ink whose groups are 'ol', 'h1', 'h2', 'h3', 'x'
const EMB = [
  // I · a door shut and barred
  (ink, f) => {
    const M = ps => ps.map(f);
    const outer = M([[-64, 80], ...arc(0, -22, 64, 64, Math.PI, 2 * Math.PI, 30), [64, 80]]);
    const inner = M([[-46, 80], ...arc(0, -22, 46, 46, Math.PI, 2 * Math.PI, 24), [46, 80]]);
    const bar = M(rect(-60, 12, 60, 28)), b1 = M(rect(-42, 2, -33, 40)), b2 = M(rect(33, 2, 42, 40)), step = M(rect(-80, 80, 80, 90));
    part(ink, [outer, inner], { angle: -0.55, base: 0.1, excl: [bar], seed: 3 });
    part(ink, [inner], { angle: Math.PI / 2, spacing: 2.5, base: 0.42, excl: [bar, b1, b2], seed: 5, t3: 0.86 });
    part(ink, [b1], { angle: Math.PI / 2, spacing: 2.2, base: 0.3, excl: [bar], seed: 7 });
    part(ink, [b2], { angle: Math.PI / 2, spacing: 2.2, base: 0.3, excl: [bar], seed: 8 });
    part(ink, [bar], { angle: 0.02, spacing: 2.3, base: 0.3, seed: 9, ow: 1.7 });
    part(ink, [step], { angle: 0, spacing: 2.8, base: 0.25, seed: 10 });
    for (const x of [-23, 0, 23]) { const top = -22 - Math.sqrt(46 * 46 - x * x); line(ink, M([[x, top + 2], [x, 11]]), 1.3); line(ink, M([[x, 29], [x, 79]]), 1.3); }
    for (let k = 0; k <= 8; k++) { const a = Math.PI + 0.12 + (Math.PI - 0.24) * k / 8; line(ink, M([[Math.cos(a) * 47, -22 + Math.sin(a) * 47], [Math.cos(a) * 63, -22 + Math.sin(a) * 63]]), 1.0); }
    for (const x of [-35, -12, 12, 35]) for (const y of [-34, 56]) { const [X, Y] = f([x, y]); ink.group('x'); ink.dot(X, Y, 1.6); }
    return [outer, step];
  },
  // II · a scroll turned face down (one corner curls back to show the writing it hides)
  (ink, f) => {
    const M = ps => ps.map(f);
    const roll = M(rect(-70, -62, 70, -42)), cap = M(ell(70, -52, 4, 10, 20));
    const FL = [[64, 10], [18, 60], [14, 14]], flap = M(FL);
    const sheet = M([[-64, -44], [64, -44], [64, 10], [18, 60], [-64, 60]]);
    part(ink, [sheet], { angle: -0.25, spacing: 3.0, base: 0.16, excl: [roll, flap], seed: 11, t3: null });
    part(ink, [flap], { angle: 0.8, spacing: 3.2, tone: 0.0, seed: 12, t2: null, t3: null });
    part(ink, [roll], { angle: 0.0, spacing: 2.2, base: 0.22, seed: 13 });
    part(ink, [cap], { angle: Math.PI / 2, spacing: 2.0, base: 0.35, seed: 14 });
    // the writing on the turned-back corner: little runs of script, reflected (vertical)
    // lines of writing on the face, mirrored by the fold (horizontal → nearly vertical)
    { const th = 2 * Math.atan2(50, -46), ux = Math.cos(th), uy = Math.sin(th), nx = -uy, ny = ux, R = B.RNG(17);
      for (let o = -40; o <= 40; o += 5.5) { let run = []; const flush = () => { if (run.length > 1) line(ink, M(run), 1.05); run = []; };
        for (let s2 = -60; s2 <= 60; s2 += 1.5) { const px = 38 + nx * o + ux * s2, py = 30 + ny * o + uy * s2;
          const inside = B.inPoly([FL], px, py) && B.inPoly([[[64, 10], [18, 60], [14, 14]].map(([a, b]) => [a + (38 - a) * 0.16, b + (30 - b) * 0.16])], px, py);
          if (inside && R() > 0.06) run.push([px, py]); else flush(); } flush(); } }
    line(ink, M([[16, 62], [66, 8]]), 1.8);
    return [roll, sheet];
  },
  // III · a full cup, left untouched
  (ink, f) => {
    const M = ps => ps.map(f);
    const bowl = M(pathPts('M-46 -46 C-46 -6 -28 16 -7 22 L7 22 C28 16 46 -6 46 -46 C46 -40 25 -36 0 -36 C-25 -36 -46 -40 -46 -46 Z'));
    const surf = M(ell(0, -46, 43, 8.4)), glint = M(ell(-16, -47, 11, 2.6, 20));
    const stem = M(rect(-5, 21, 5, 51)), knop = M(ell(0, 34, 10, 5, 24));
    const foot = M(pathPts('M-36 60 C-32 51 -10 51 -6 51 L6 51 C10 51 32 51 36 60 C30 65 -30 65 -36 60 Z'));
    part(ink, [bowl], { angle: 1.25, spacing: 2.5, base: 0.08, seed: 21, bend: 0.004 });
    part(ink, [surf], { angle: 0, spacing: 2.0, tone: B.linTone(f([-40, 0])[0], 0, f([40, 0])[0], 0, 0.55, 0.85), excl: [glint], seed: 22, ow: 1.2 });
    part(ink, [stem], { angle: Math.PI / 2, spacing: 2.2, base: 0.25, excl: [knop], seed: 23 });
    part(ink, [knop], { angle: 0.3, spacing: 2.2, base: 0.2, seed: 24 });
    part(ink, [foot], { angle: 0, spacing: 2.3, base: 0.15, seed: 25 });
    { const G = ink.g; ink.group('ol'); B.outline(ink, M(ell(0, -46, 46, 10)), { w: 1.5, light: L, step: 1.5 }); ink.group(G); }
    line(ink, M([[-92, 64], [92, 64]]), 1.0);
    const sh = M([[34, 62], [36, 58], [86, 60], [88, 63.5]]);
    part(ink, [sh], { angle: 0, spacing: 2.2, tone: 0.6, seed: 26, noOutline: true, t2: null, t3: null });
    return [bowl, foot, M(rect(-92, -60, 92, 66))];
  },
  // IV · a bridge that stops short of the far bank
  (ink, f) => {
    const M = ps => ps.map(f);
    const bankL = M([[-120, -8], [-96, -14], [-82, -12], [-72, -6], [-70, 12], [-66, 30], [-62, 54], [-120, 54]]);
    const bankR = M([[50, -12], [62, -18], [80, -15], [96, -22], [120, -20], [120, 54], [46, 54], [44, 32], [48, 12]]);
    const span = [[-74, -10], [16, -10], [16, -3], [12, -3], [12, 3], [8, 3], [8, 8]];
    const half = pathPts('M8 8 Q-12 8 -14 40', 1.2), archP = arc(-46, 40, 20, 30, 0, -Math.PI, 22);
    const bridge = M([...span, ...half, [-14, 54], [-26, 54], [-26, 40], ...archP, [-66, 40], [-74, 40]]);
    const par = M([[-74, -17], [10, -17], [10, -10], [-74, -10]]);
    const water = M(rect(-120, 54, 120, 120));
    part(ink, [water], { angle: 0, spacing: 3.2, tone: B.linTone(0, f([0, 54])[1], 0, f([0, 100])[1], 0.3, 0.5), seed: 31, noOutline: true, t2: null, t3: null, dash: 0.06 });
    part(ink, [bridge], { angle: -0.5, spacing: 2.6, base: 0.1, excl: [bankL], seed: 32 });
    part(ink, [par], { angle: 0, spacing: 2.2, base: 0.25, excl: [bankL], seed: 33 });
    part(ink, [bankL], { angle: -0.9, spacing: 2.6, base: 0.3, seed: 34 });
    part(ink, [bankR], { angle: 0.9, spacing: 2.6, base: 0.3, seed: 35 });
    for (const y of [-3, 4]) line(ink, M([[-68, y], [y < 0 ? 12 : 6, y]]), 0.8);
    for (const x of [-56, -40, -24, -8, 6]) line(ink, M([[x, -10], [x, -3]]), 0.8);
    // the reflection of the pier, broken on the water
    for (let k = 0; k < 6; k++) line(ink, M([[-28 + k % 2 * 3, 60 + k * 6], [-12 - k % 2 * 3, 60 + k * 6]]), 1.1);
    return null;
  },
  // V · a key in a lock, not turned (the shackle still shut)
  (ink, f) => {
    const M = ps => ps.map(f);
    const shackle = M([[-30, -18], [-30, -50], ...arc(0, -50, 30, 30, Math.PI, 2 * Math.PI, 20), [30, -18], [20, -18], [20, -50], ...arc(0, -50, 20, 20, 2 * Math.PI, Math.PI, 16), [-20, -18]]);
    const body = M(rrect(-48, -24, 48, 44, 9));
    const hole = M([...arc(0, 2, 7, 7, 0.3 * Math.PI, 2.7 * Math.PI, 18), [-5, 22], [5, 22]]);
    // the key: shaft out of the keyhole toward the viewer, bow face-on
    const ang = 0.95, ca = Math.cos(ang), sa = Math.sin(ang), K = ([u, v]) => [2 + u * ca - v * sa, 6 + u * sa + v * ca];
    const shaft = M([[0, -4], [42, -4], [42, 4], [0, 4]].map(K));
    const bowO = M(ell(...K([58, 0]), 18, 18, 30)), bowI = M(ell(...K([58, 0]), 7.5, 7.5, 24));
    part(ink, [shackle], { angle: 0.4, spacing: 2.3, base: 0.12, excl: [body], seed: 41 });
    part(ink, [body], { angle: -0.55, spacing: 2.5, base: 0.18, excl: [shaft, bowO], seed: 42 });
    part(ink, [hole], { angle: 0.6, spacing: 1.5, tone: 0.95, excl: [shaft, bowO], seed: 43, t3: null });
    part(ink, [shaft], { angle: ang, spacing: 2.0, base: 0.3, excl: [bowO], seed: 44 });
    part(ink, [bowO, bowI], { angle: -0.4, spacing: 2.1, base: 0.15, seed: 45 });
    for (const [x, y] of [[-38, -14], [38, -14], [-38, 34], [38, 34]]) { const [X, Y] = f([x, y]); ink.group('x'); ink.dot(X, Y, 2.0); }
    line(ink, M([[-44, 30], [-44, 40]]), 0.6);
    return [shackle, body, bowO];
  },
  // VI · a fruit whole outside, hollow in its cross-section
  (ink, f) => {
    const AP = 'M0 -30 C14 -44 44 -40 44 -6 C44 24 22 44 4 40 C2 40 -2 40 -4 40 C-22 44 -44 24 -44 -6 C-44 -40 -14 -44 0 -30 Z';
    const g = (ox, oy, s) => p => f([ox + p[0] * s, oy + p[1] * s]);
    const whole = pathPts(AP).map(g(-44, 2, 0.88)), cut = pathPts(AP).map(g(44, 2, 0.88));
    // the hollow: an irregular cavity leaving only a thin rim of flesh
    const hollow = pathPts(AP).map(([x, y], i, A) => { const a = i / A.length * 6.283, k = 0.74 + 0.05 * Math.sin(a * 5 + 1) + 0.03 * Math.sin(a * 9); return g(44, 4, 0.88)([x * k, y * k]); });
    const leaf = pathPts('M2 -36 C10 -52 26 -52 32 -48 C24 -38 12 -36 2 -36 Z').map(g(-44, 2, 0.88));
    part(ink, [whole], { angle: -0.5, spacing: 2.4, base: 0.04, seed: 51, bend: 0.006 });
    part(ink, [leaf], { angle: 0.4, spacing: 1.9, base: 0.25, seed: 52 });
    part(ink, [cut], { angle: 0, spacing: 3.4, tone: 0.0, seed: 53, t2: null, t3: null, excl: [hollow], ow: 1.6 });
    part(ink, [hollow], { angle: -0.8, spacing: 2.0, tone: B.linTone(0, f([0, -24])[1], 0, f([0, 30])[1], 0.97, 0.8), seed: 54, ow: 1.0 });
    { const G = ink.g; ink.group('x'); B.stipple(ink, [cut], { density: 0.035, tone: () => 0.35, r: 0.55, seed: 55, excl: [hollow] }); ink.group(G); }
    line(ink, [g(-44, 2, 0.88)([0, -30]), g(-44, 2, 0.88)([4, -48])], 1.6);
    line(ink, [g(44, 2, 0.88)([0, -30]), g(44, 2, 0.88)([3, -46])], 1.4);
    line(ink, [f([-92, 40]), f([92, 40])], 1.0);
    return [whole, cut, leaf];
  },
];

// ---------------------------------------------------------------- build (deterministic, once)
let G = null;
const hull = pts => { pts = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]); const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); const lo = [], up = []; for (const p of pts) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); } for (const p of pts.slice().reverse()) { while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); } return lo.slice(0, -1).concat(up.slice(0, -1)); };

function build(T) {
  const mctx = document.createElement('canvas').getContext('2d');
  const g = { T };
  // the sheet
  g.sheet = document.createElement('canvas'); g.sheet.width = W; g.sheet.height = H;
  drawSheet(g.sheet.getContext('2d'), { plate: PLATE });
  // border
  g.border = new B.Ink(); g.border.group('b'); borderInk(g.border, BORDER);
  g.border.schedule('b', T.t0 - 0.45, T.t0 + 1.4, { conc: 2 }).build();
  // centre cartouche: double-ruled oval, machine-ruled band, two small lozenges, a swelling divider
  const ci = g.cart = new B.Ink(), [cx, cy] = C;
  const o1 = ell(cx, cy, 214, 262, 160), o2 = ell(cx, cy, 205, 253, 160), i1 = ell(cx, cy, 176, 224, 160);
  ci.group('ring'); B.outline(ci, o1, { w: 2.2, light: L, step: 2 }); B.outline(ci, o2, { w: 0.7, vary: 0.1, run: 0, step: 2 }); B.outline(ci, i1, { w: 1.1, light: L, step: 2 });
  ci.group('band'); B.hatch(ci, [o2, i1], { angle: 0, spacing: 3.3, tone: B.linTone(cx - 200, cy - 250, cx + 200, cy + 250, 0.45, 0.75), thr: 0.1, wMin: 0.35, wMax: 0.9, swell: 0.3, taper: 3, wobble: 0.05, jitter: 0.03, step: 2 });
  ci.group('orn');
  for (const s of [-1, 1]) { const y = cy + s * 262; part(ci, [[[cx, y - 13], [cx + 9, y], [cx, y + 13], [cx - 9, y]]], { angle: 0.5, spacing: 1.8, base: 0.3, seed: 60 + s }); }
  ci.group('div'); B.stroke(ci, [[cx - 120, cy + 64], [cx + 120, cy + 64]], 2.0, { taper: 30, step: 2 });
  ci.group('div'); for (const s of [-1, 1]) ci.dot(cx + s * 132, cy + 64, 2.4);
  const a1 = T.at(1), e1 = T.end(1);
  ci.schedule('ring', a1 - 0.15, a1 + 0.9, { conc: 3 });
  ci.schedule('band', a1 + 0.35, e1 + 0.3, { conc: 30 });
  ci.schedule(['orn', 'ornol', 'ornh1', 'ornh2', 'ornh3'], e1 - 0.2, e1 + 0.5, { conc: 6 });
  ci.schedule('div', T.at(3) + 0.35, T.at(3) + 1.0, { conc: 3 });
  ci.build();
  g.cartDone = Math.max(...ci.groups().map(n => ci.span(n)[1]));
  // roundels
  g.rd = POS.map(([x, y], k) => {
    const i = 4 + k, a = T.at(i), D = Math.max(2.3, T.end(i) - a + 0.5);
    const ink = new B.Ink(); ink.group('');
    const f = B.xf(x, y, k === 3 ? 1 : 1.1, k === 1 ? -0.08 : 0);
    const haloSrc = EMB[k](ink, f);
    if (haloSrc) {   // ruled machine ground with a white halo round the emblem
      const pts = []; for (const p of haloSrc) for (const [px, py] of p) for (let q = 0; q < 8; q++) pts.push([px + Math.cos(q * 0.785) * 11, py + Math.sin(q * 0.785) * 11]);
      ink.group('g'); B.hatch(ink, [ell(x, y, RR - 8, RR - 8, 90)], { angle: 0, spacing: 3.6, tone: () => 0.5, thr: 0.1, wMin: 0.35, wMax: 0.62, swell: 0.25, taper: 3, wobble: 0.04, jitter: 0.02, excl: [hull(pts)], step: 2 });
    }
    const s = a + 0.3;
    ink.schedule('g', a + 0.1, a + 0.75, { conc: 30 });
    ink.schedule('ol', s, s + 0.42 * D, { conc: 4 });
    ink.schedule('h1', s + 0.22 * D, s + 0.68 * D, { conc: 26 });
    ink.schedule('x', s + 0.45 * D, s + 0.8 * D, { conc: 6 });
    ink.schedule('h2', s + 0.5 * D, s + 0.86 * D, { conc: 26 });
    ink.schedule('h3', s + 0.64 * D, s + D, { conc: 20 });
    ink.build();
    const done = Math.max(...ink.groups().map(n => ink.span(n)[1]));
    // label block
    const left = k < 3, lx = left ? 425 : 1495, al = left ? 'left' : 'right';
    const lines = LAB[k], yb = lines.length === 1 ? [y + 16] : [y + 10, y + 48], ny = y - 34;
    const lw = Math.max(...lines.map(s => measure(mctx, s, LABF).tw));
    const lab = T.word(i, KW[k]);
    return { k, i, x, y, ink, a, done, cache: null, left, lx, al, lines, yb, ny, lw, lab, D };
  });
  // overstamp, tissue and return times
  const s10 = 10, s11 = 11;
  g.rd.forEach((r, k) => {
    r.burn1 = T.k(s10, 0.1) + k * 0.42; r.stamp = r.burn1 + 0.3;
    r.tis = T.word(s11, [4, 4, 7, 7, 11, 11][k]) + (k % 2) * 0.22;
  });
  g.ret = T.word(s11, 14) - 0.1;
  g.rd.forEach((r, k) => { r.lift = g.ret + k * 0.05; r.burn2 = g.ret + 0.1 + k * 0.05; r.recut = r.burn2 + 0.22; r.washT = g.ret + 0.25 + k * 0.06; });
  // tablets behind the labels: a hairline frame with notched corners, cut with the label; washed at the end
  g.tab = new B.Ink(); g.wash = new Wash({ scale: 1.25 });
  g.rd.forEach((r, k) => {
    const x0 = r.left ? r.lx - 16 : r.lx - r.lw - 16, x1 = r.left ? r.lx + r.lw + 16 : r.lx + 16, y0 = r.yb[0] - 34, y1 = r.yb[r.yb.length - 1] + 14, n = 6;
    const P = [[x0 + n, y0], [x1 - n, y0], [x1 - n, y0 + n], [x1, y0 + n], [x1, y1 - n], [x1 - n, y1 - n], [x1 - n, y1], [x0 + n, y1], [x0 + n, y1 - n], [x0, y1 - n], [x0, y0 + n], [x0 + n, y0 + n]];
    g.tab.group('t' + k); B.outline(g.tab, P, { w: 0.9, vary: 0.2, run: 0, step: 2 });
    g.tab.schedule('t' + k, r.lab - 0.1, r.lab + 0.9, { conc: 1 });
    r.tabBox = [x0, y0, x1, y1];
    const sh = B.ring(P);
    g.wash.add({ path: sh.path, polys: sh.polys, color: MADDER, origin: r.left ? [x0 + 10, (y0 + y1) / 2] : [x1 - 10, (y0 + y1) / 2], t0: r.washT, dur: 0.9, alpha: 0.44, spill: 2.5, seed: 70 + k, backruns: 0 });
  });
  g.tab.build(); g.tabDone = g.tab.span('t5')[1];
  return g;
}
function borderInk(ink, [x0, y0, x1, y1], gap = 9) {
  B.outline(ink, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], { w: 2.4, vary: 0.15, grain: 0.04, step: 4 });
  B.outline(ink, [[x0 + gap, y0 + gap], [x1 - gap, y0 + gap], [x1 - gap, y1 - gap], [x0 + gap, y1 - gap]], { w: 0.8, vary: 0.1, grain: 0.04, step: 4 });
}

// finished ink, rasterised once (only lines still being cut are stroked per frame)
function cached(obj, key, ink, bb, clip) {
  if (!obj[key]) {
    const c = document.createElement('canvas'); c.width = bb[2] - bb[0]; c.height = bb[3] - bb[1];
    const x = c.getContext('2d'); x.translate(-bb[0], -bb[1]); if (clip) clip(x); ink.draw(x, Infinity);
    obj[key] = c;
  }
  return obj[key];
}
function drawInk(ctx, obj, key, ink, t, done, bb, clip) {
  if (t >= done) { ctx.drawImage(cached(obj, key, ink, bb, clip), bb[0], bb[1]); return; }
  ctx.save(); if (clip) clip(ctx); ink.draw(ctx, t); ctx.restore();
}

// Arabic is shaped as one run: it is cut by a burin travelling right to left
function engraveArabic(ctx, x, y, p) {
  if (p <= 0) return;
  ctx.save(); ctx.font = ARF; ctx.direction = 'rtl'; ctx.textAlign = 'center'; ctx.fillStyle = PAL.ink;
  const w = ctx.measureText(AR).width + 40;
  if (p < 1) { ctx.beginPath(); ctx.rect(x + w / 2 - w * p, y - 220, w * p, 320); ctx.clip(); }
  ctx.fillText(AR, x, y); ctx.restore();
}

// a label slot: true label → burnished → KUFR → burnished → true label again
function labelState(r, t) {
  if (t < r.lab) return null;
  const sweep = (t0) => seg(t, t0, t0 + 0.28);
  if (t < r.burn1) return { text: 'true', p: seg(t, r.lab, r.lab + 0.95), cut: 0 };
  if (t < r.stamp) return { text: 'true', p: 1, cut: sweep(r.burn1) };
  if (t < r.burn2) return { text: 'stamp', p: seg(t, r.stamp, r.stamp + 0.38), cut: 0 };
  if (t < r.recut) return { text: 'stamp', p: 1, cut: sweep(r.burn2) };
  return { text: 'true', p: seg(t, r.recut, r.recut + 0.45), cut: 0 };
}
function drawLabel(ctx, r, t) {
  const st = labelState(r, t);
  const np = seg(t, r.a + 0.05, r.a + 0.45);
  if (np > 0) engraveText(ctx, NUM[r.k] + '.', r.lx, r.ny, { ...NUMF, align: r.al, p: np });
  if (!st) return;
  const [x0, y0, x1, y1] = r.tabBox;
  ctx.save();
  if (st.cut > 0) { const sx = x0 + (x1 - x0) * st.cut; ctx.beginPath(); ctx.rect(sx, y0 - 4, x1 - sx + 4, y1 - y0 + 8); ctx.clip(); }
  if (st.text === 'true') r.lines.forEach((s, q) => engraveText(ctx, s, r.lx, r.yb[q], { ...LABF, align: r.al, p: clamp(st.p * r.lines.length * 1.15 - q * 0.9) }));
  else engraveText(ctx, 'KUFR', r.lx, (r.yb[0] + r.yb[r.yb.length - 1]) / 2 + 14, { ...STAMPF, align: r.al, p: st.p });
  ctx.restore();
  // the burnisher's polished track, still bright just behind the sweep
  if (st.cut > 0 && st.cut < 1) {
    const sx = x0 + (x1 - x0) * st.cut;
    const gr = ctx.createLinearGradient(sx - 60, 0, sx, 0); gr.addColorStop(0, 'rgba(255,250,236,0)'); gr.addColorStop(1, 'rgba(255,250,236,.55)');
    ctx.fillStyle = gr; ctx.fillRect(Math.max(x0, sx - 60), y0 + 3, Math.min(60, sx - x0), y1 - y0 - 6);
  }
}

// a tissue guard laid over a roundel and its label
function drawTissue(ctx, r, t, sheet) {
  const on = seg(t, r.tis, r.tis + 0.32), off = seg(t, r.lift, r.lift + 0.35), k = eo(on) * (1 - eo(off));
  if (k <= 0) return;
  const R = RR + 11, dy = (1 - eo(on)) * -9 + eo(off) * -12, cy = r.y + dy;
  ctx.save();
  ctx.globalAlpha = k;
  ctx.shadowColor = 'rgba(60,40,20,.3)'; ctx.shadowBlur = 8 + (1 - k) * 14; ctx.shadowOffsetY = 2 + (1 - k) * 6;
  ctx.fillStyle = 'rgba(246,240,226,.76)';
  ctx.beginPath(); for (let i = 0; i <= 72; i++) { const a = i / 72 * 6.2832, rr = R + Math.sin(a * 7 + r.k) * 0.8; ctx.lineTo(r.x + Math.cos(a) * rr, cy + Math.sin(a) * rr); } ctx.closePath(); ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.globalAlpha = k * 0.35; ctx.globalCompositeOperation = 'multiply'; ctx.clip();
  ctx.drawImage(sheet, r.x - R, cy - R, 2 * R, 2 * R, r.x - R, cy - R, 2 * R, 2 * R);
  ctx.restore();
}

const TITLE = 'THE VOCABULARY OF THE QUR’AN', FOOT = 'ONE WORD · SIX MEANINGS';
const TITLEF = { size: 30, weight: 600, track: 0.16 }, FOOTF = { size: 24, weight: 600, track: 0.2 };

export default {
  style: 'engraving',
  page: 'pp. 6–7',
  noCaption: [3],
  async init(T) {
    await Promise.all(['600 30px "Bodoni Moda"', 'italic 400 30px "Bodoni Moda"', '400 30px "Bodoni Moda"'].map(f => document.fonts.load(f, 'Ab')).concat([document.fonts.load(ARF, AR)]));
    G = build(T);
  },
  render(ctx, t, T) {
    if (!G) G = build(T);
    ctx.drawImage(G.sheet, 0, 0);
    G.wash.draw(ctx, t);
    drawInk(ctx, G, '_border', G.border, t, T.t0 + 1.4, [90, 50, 1830, 910]);
    // title and foot
    engraveText(ctx, TITLE, 960, 124, { ...TITLEF, p: seg(t, T.k(0, 0.25), T.k(0, 0.25) + 1.3) });
    // centre
    drawInk(ctx, G, '_cart', G.cart, t, G.cartDone, [C[0] - 230, C[1] - 290, C[0] + 230, C[1] + 290]);
    engraveArabic(ctx, C[0], C[1] - 10, seg(t, T.at(2) - 0.05, T.at(2) + 0.95));
    engraveText(ctx, 'KUFR', C[0] + 4, C[1] + 150, { size: 84, weight: 600, track: 0.12, p: seg(t, T.at(3) - 0.1, T.at(3) + 0.7) });
    // roundels
    for (const r of G.rd) {
      if (t < r.a - 0.2) continue;
      const clip = c => { c.beginPath(); c.arc(r.x, r.y, RR - 5, 0, 7); c.clip(); };
      drawInk(ctx, r, 'cache', r.ink, t, r.done, [r.x - RR, r.y - RR, r.x + RR, r.y + RR], clip);
      if (t < r.done + 1) roundelFrameAt(ctx, r, seg(t, r.a - 0.2, r.a + 0.45));
      else ctx.drawImage(frameCache(r), r.x - RR - 6, r.y - RR - 6);
    }
    drawInk(ctx, G, '_tab', G.tab, t, G.tabDone, [380, 120, 1540, 860]);
    for (const r of G.rd) drawLabel(ctx, r, t);
    engraveText(ctx, FOOT, 960, 872, { ...FOOTF, p: seg(t, T.end(9) - 0.2, T.end(9) + 1.0) });
    for (const r of G.rd) drawTissue(ctx, r, t, G.sheet);
  },
  texts(t, T) {
    if (!G) return [];
    const out = [], c = document.createElement('canvas').getContext('2d');
    const box = (id, text, x, y, o, al = 'center') => { const w = measure(c, text, o).tw, x0 = al === 'center' ? x - w / 2 : al === 'right' ? x - w : x; out.push({ id, text, x0, y0: y - o.size * 0.8, x1: x0 + w, y1: y + o.size * 0.25 }); };
    if (t > T.k(0, 0.25)) box('s9title', TITLE, 960, 124, TITLEF);
    if (t > T.at(2)) out.push({ id: 's9ar', text: AR, x0: C[0] - 140, y0: C[1] - 130, x1: C[0] + 140, y1: C[1] + 60 });
    if (t > T.at(3)) box('s9kufr', 'KUFR', C[0], C[1] + 150, { size: 84, weight: 600, track: 0.12 });
    if (t > T.end(9) - 0.2) box('s9foot', FOOT, 960, 872, FOOTF);
    for (const r of G.rd) {
      if (t > r.a) box('s9n' + r.k, NUM[r.k] + '.', r.lx, r.ny, NUMF, r.al);
      const st = labelState(r, t); if (!st) continue;
      if (st.text === 'true') { const [x0, y0, x1, y1] = r.tabBox; out.push({ id: 's9l' + r.k, text: r.lines.join(' '), x0, y0, x1, y1 }); }
      else box('s9l' + r.k, 'KUFR', r.lx, (r.yb[0] + r.yb[r.yb.length - 1]) / 2 + 14, STAMPF, r.al);
    }
    return out;
  },
  events(T) {
    const ev = [{ t: T.t0 - 0.45, type: 'burin', dur: 1.8, what: 'border' },
      { t: T.at(1) - 0.15, type: 'burin', dur: 1.2, what: 'cartouche' },
      { t: T.at(2) - 0.05, type: 'burin', dur: 1.0, what: 'arabic' },
      { t: T.at(3) - 0.1, type: 'burin', dur: 0.8, what: 'KUFR' }];
    if (!G) G = build(T);
    for (const r of G.rd) {
      ev.push({ t: r.a - 0.2, type: 'burin', dur: 0.65, what: 'roundel ring ' + NUM[r.k] });
      ev.push({ t: r.a + 0.3, type: 'burin', dur: r.D, what: 'emblem ' + NUM[r.k], hatch: true });
      ev.push({ t: r.burn1, type: 'burnish', dur: 0.3 }, { t: r.stamp, type: 'burin', dur: 0.38, what: 'KUFR overstamp' });
      ev.push({ t: r.tis, type: 'paper', what: 'tissue down' });
    }
    ev.push({ t: G.ret, type: 'paper', what: 'tissues lifted' }, { t: G.ret + 0.32, type: 'burin', dur: 0.6, what: 'labels re-cut' });
    ev.push({ t: G.ret + 0.35, type: 'wash', dur: 1.5, what: 'madder on the tablets' });
    return ev;
  },
};

function roundelFrameAt(ctx, r, p) {
  if (p <= 0) return;
  ctx.save(); ctx.strokeStyle = PAL.ink; ctx.lineCap = 'round';
  const a0 = -Math.PI / 2 - 0.4;
  ctx.lineWidth = 2.3; ctx.beginPath(); ctx.arc(r.x, r.y, RR, a0, a0 + Math.PI * 2 * clamp(p)); ctx.stroke();
  ctx.lineWidth = 0.85; ctx.beginPath(); ctx.arc(r.x, r.y, RR - 5, a0, a0 + Math.PI * 2 * clamp(p * 1.1 - 0.1)); ctx.stroke();
  ctx.restore();
}
function frameCache(r) {
  if (!r.fc) { r.fc = document.createElement('canvas'); r.fc.width = r.fc.height = RR * 2 + 12; const x = r.fc.getContext('2d'); x.translate(-(r.x - RR - 6), -(r.y - RR - 6)); roundelFrameAt(x, r, 1); }
  return r.fc;
}
