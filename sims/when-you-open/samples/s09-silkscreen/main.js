// Scene 09 "How to Begin" — Silkscreen poster sample.
// The reading desk as a screen print: wall, window at dawn, desk, an open mushaf of bare paper.
// The order of reading is printed one colour pass at a time onto the pages, each with its legend row:
// plum = introduction to the surah, teal = the Arabic (abstract bands), terracotta = translation,
// gold = explanatory notes. Locked top-down sheet; every ink arrives under a squeegee. render(t) is pure in t.
import { makeTextures, paperSheet, ink, wipeRegion, wipeFront, squeegee, inkFinish, polyPath, rectPath, circlePath, ringPath, unionPath, hash } from './engine/silk.js';
import { estimate } from './timing.js';
import { drawCaption } from './caption.js';

const W = 1920, H = 1080;
const LINES = [
  'So...',
  'How should you begin?',
  'Before reading a surah, learn a little about it.',
  'Then read.',
  'Try to follow the message from beginning to end.',
  'When something is difficult, make a note of it.',
  'Read its explanation.',
  'Take your time.',
];
const S = estimate(LINES, 1.0);
const DUR = S[S.length - 1].end + 2.0;

const PAPER = '#F4EAD5';
const INK = { wall: '#DDB98A', terra: '#D0754A', teal: '#2E6670', near: '#1F2A33', gold: '#EFAE3A', plum: '#7A5A8E' };

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ss = x => { x = clamp(x); return x * x * (3 - 2 * x); };

await document.fonts.ready;
await Promise.all(['italic 500 42px "Cormorant Garamond"', '700 60px BigShoulders', '400 30px Outfit', '700 30px Outfit'].map(f => document.fonts.load(f, 'Ab')));
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const T = makeTextures(PAPER, 11);

// ---------- sheet and bench ----------
const SHEET = [44, 22, 1832, 1036];                    // x, y, w, h
const ART = { x0: 76, y0: 54, x1: 1844, y1: 938 };
const DESK_Y = 452, FRONT_Y = 900;
const bench = document.createElement('canvas'); bench.width = W; bench.height = H;
{
  const g = bench.getContext('2d');
  for (let i = 0; i * 120 < H; i++) {
    g.fillStyle = ['#5E4A39', '#64503D', '#594634', '#61503F'][i % 4]; g.fillRect(0, i * 120, W, 120);
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, i * 120, W, 3);
    g.strokeStyle = 'rgba(30,20,10,.12)'; g.lineWidth = 1.2;
    for (let k = 0; k < 6; k++) { g.beginPath(); for (let x = 0; x <= W; x += 40) { const y = i * 120 + 14 + k * 18 + 4 * Math.sin(x / 260 + k * 1.7 + i); x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
  }
  g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(SHEET[0] + 8, SHEET[1] + 10, SHEET[2], SHEET[3]);   // sheet shadow
}

// ---------- the open mushaf: page(side, u, v) with u from the outer edge (0) to the spine (1) ----------
const SPINE = 960;
const qb = (a, c, b, t) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * c + t * t * b;
function pageXY(side, u, v) {
  const tx = qb(470, 700, SPINE, u), ty = qb(522, 470, 516, u);
  const bx = qb(446, 700, SPINE, u), by = qb(866, 842, 878, u);
  const x = tx + (bx - tx) * v, y = ty + (by - ty) * v;
  return side < 0 ? [x, y] : [2 * SPINE - x, y];
}
function quad(side, u0, u1, v0, v1, n = 10) {          // a band following the page's curve
  const pts = [];
  for (let i = 0; i <= n; i++) pts.push(pageXY(side, u0 + (u1 - u0) * i / n, v0));
  for (let i = n; i >= 0; i--) pts.push(pageXY(side, u0 + (u1 - u0) * i / n, v1));
  return polyPath(pts);
}
const pages = unionPath([quad(-1, 0, 1, 0, 1, 24), quad(1, 0, 1, 0, 1, 24)]);
function blockPath(side) {                              // the stack of page edges under each page
  const pts = [];
  for (let i = 0; i <= 20; i++) pts.push(pageXY(side, i / 20, 1));
  for (let i = 20; i >= 0; i--) { const [x, y] = pageXY(side, i / 20, 1); pts.push([x + side * -10 * (1 - i / 20), y + 16 - 4 * i / 20]); }
  return polyPath(pts);
}
const block = unionPath([blockPath(-1), blockPath(1)]);
const blockLines = new Path2D();                        // paper gaps between page edges
for (const side of [-1, 1]) for (const d of [6, 11]) {
  const pts = [];
  for (let i = 0; i <= 20; i++) { const [x, y] = pageXY(side, i / 20, 1); pts.push([x + side * -d * .62 * (1 - i / 20), y + d - 2 * i / 20]); }
  for (let i = 20; i >= 0; i--) { const [x, y] = pageXY(side, i / 20, 1); pts.push([x + side * -d * .62 * (1 - i / 20), y + d + 1.6 - 2 * i / 20]); }
  blockLines.addPath(polyPath(pts));
}
const bookAll = unionPath([pages, block]);
const cover = (() => {
  const p = new Path2D();
  for (const side of [-1, 1]) {
    const pts = [];
    for (let i = 0; i <= 20; i++) { const [x, y] = pageXY(side, i / 20, 0); pts.push([x + side * 16 * (1 - i / 20), y - 10]); }
    for (let i = 20; i >= 0; i--) { const [x, y] = pageXY(side, i / 20, 1); pts.push([x + side * 22 * (1 - i / 20), y + 26]); }
    p.addPath(polyPath(pts));
  }
  return p;
})();

// ---------- base screens ----------
const WIN = { x0: 1094, y0: 104, x1: 1736, y1: 416 };
const winInner = rectPath(WIN.x0, WIN.y0, WIN.x1 - WIN.x0, WIN.y1 - WIN.y0);
const wall = { path: rectPath(ART.x0, ART.y0, ART.x1 - ART.x0, DESK_Y - ART.y0), knock: winInner };
const pageBlock = { path: block, knock: blockLines };
const sky = (() => {                                    // dawn: a flat terracotta horizon, stripes thinning upward
  const p = new Path2D(); p.rect(WIN.x0, 330, WIN.x1 - WIN.x0, WIN.y1 - 330);
  for (let i = 0; i < 5; i++) { const cell = 34, th = cell * (1 - (i + .5) / 5) * .95 + 1.5; p.rect(WIN.x0, 330 - (i + 1) * cell + (cell - th), WIN.x1 - WIN.x0, th); }
  return p;
})();
const skyline = (() => {                                // far town in teal: roofs, a dome, a minaret
  const p = new Path2D(), g = 396;
  p.rect(WIN.x0, g, WIN.x1 - WIN.x0, WIN.y1 - g);
  p.rect(1120, g - 18, 120, 18); p.rect(1260, g - 30, 70, 30); p.rect(1450, g - 22, 160, 22); p.rect(1680, g - 14, 60, 14);
  p.moveTo(1480, g - 22); p.arc(1530, g - 22, 50, Math.PI, 0); p.closePath();
  p.rect(1527, g - 86, 6, 14);
  p.rect(1628, g - 120, 14, 120); p.rect(1623, g - 92, 24, 6);
  p.moveTo(1625, g - 120); p.lineTo(1635, g - 146); p.lineTo(1645, g - 120); p.closePath();
  return p;
})();
const desk = { path: rectPath(ART.x0, DESK_Y, ART.x1 - ART.x0, FRONT_Y - DESK_Y), knock: bookAll };
const frame = (() => {
  const p = new Path2D(); p.rect(WIN.x0 - 22, WIN.y0 - 22, WIN.x1 - WIN.x0 + 44, WIN.y1 - WIN.y0 + 44);
  p.rect(WIN.x0, WIN.y0, WIN.x1 - WIN.x0, WIN.y1 - WIN.y0); return p;
})();
const nearParts = [
  { path: frame, rule: 'evenodd' },
  { path: unionPath([rectPath(1411, WIN.y0, 9, WIN.y1 - WIN.y0), rectPath(WIN.x0, 250, WIN.x1 - WIN.x0, 8), rectPath(WIN.x0 - 40, WIN.y1 + 18, WIN.x1 - WIN.x0 + 80, 16)]) },
  { path: rectPath(ART.x0, FRONT_Y, ART.x1 - ART.x0, ART.y1 - FRONT_Y) },
  { path: cover, knock: bookAll },
  { path: rectPath(ART.x0, 948, ART.x1 - ART.x0, 82) },  // info band: the captions sit on it
];
const sunClip = rectPath(WIN.x0, WIN.y0, WIN.x1 - WIN.x0, 366 - WIN.y0);
const sun = unionPath([circlePath(1300, 336, 40), ringPath(1300, 336, 54, 62), ringPath(1300, 336, 76, 82)]);
const LEG = { x: 150, y0: 214, dy: 62, chip: 40 };
const header = { paint: c => { c.font = '700 64px BigShoulders'; c.letterSpacing = '12px'; c.fillText('HOW TO BEGIN', LEG.x, 150); } };

// ---------- the four passes ----------
const chip = i => rectPath(LEG.x, LEG.y0 + i * LEG.dy - LEG.chip / 2, LEG.chip, LEG.chip);
const LABELS = ['Introduction to the surah', 'The Arabic', 'Translation', 'Explanatory notes'];
const intro = (() => {
  const p = new Path2D(), v0 = .06, v1 = .145, vm = (v0 + v1) / 2;
  const P = (u, v) => pageXY(-1, u, v);
  const pts = [P(.1, vm)]; for (let i = 0; i <= 8; i++) pts.push(P(.15 + .7 * i / 8, v0)); pts.push(P(.9, vm)); for (let i = 8; i >= 0; i--) pts.push(P(.15 + .7 * i / 8, v1));
  p.addPath(polyPath(pts));
  [[.1, .9, .19], [.1, .9, .232], [.1, .62, .274]].forEach(([a, b, v]) => p.addPath(quad(-1, a, b, v, v + .019)));
  return { path: p, knock: quad(-1, .26, .74, .094, .111) };
})();
const translation = (() => {
  const p = new Path2D();
  for (let i = 0; i < 11; i++) {
    const v = .36 + i * .052, endPara = i === 4 || i === 10;
    const a = i === 5 ? .16 : .1, b = endPara ? .38 + .2 * hash(i * 3.1) : .86 + .04 * hash(i * 1.7);
    p.addPath(quad(-1, a, b, v, v + .018));
  }
  return { path: p };
})();
const arabic = (() => {
  const p = new Path2D();
  p.addPath(quad(1, .06, .94, .05, .058)); p.addPath(quad(1, .06, .94, .942, .95));
  p.addPath(quad(1, .06, .072, .05, .95, 2)); p.addPath(quad(1, .928, .94, .05, .95, 2));
  let k = 0, last = 0;
  for (let i = 0; i < 13; i++) {
    const v = .1 + i * .064;
    let u = .1;
    while (u < .9) {                                   // word-like segments, right to left, justified
      k++;
      const w = Math.min(.9 - u, .035 + .1 * hash(k * 2.37));
      if (hash(k * 5.1) < .07 && .9 - u > .1 && k - last > 4) {
        last = k;        // a round verse marker in place of a word
        const [x, y] = pageXY(1, .9 - u - .02, v + .012); p.addPath(ringPath(x, y, 4, 9)); u += .05; continue;
      }
      p.addPath(quad(1, .9 - u - w, .9 - u, v, v + .024, 3)); u += w + .016;
    }
  }
  return { path: p };
})();
const notes = (() => {
  const p = new Path2D(), k = new Path2D();
  [[-1, .5, -.10], [1, .24, .08], [1, .66, -.06]].forEach(([side, v, rot]) => {
    const [x0, y0] = pageXY(side, 0, v), cx = x0 + side * -6, cy = y0, w = 132, h = 84;
    const c = Math.cos(rot), s = Math.sin(rot);
    const R = (dx, dy) => [cx + dx * c - dy * s, cy + dx * s + dy * c];
    p.addPath(polyPath([R(-w / 2, -h / 2), R(w / 2, -h / 2), R(w / 2, h / 2), R(-w / 2, h / 2)]));
    for (let j = 0; j < 3; j++) { const yy = -h / 2 + 22 + j * 18, ww = j === 2 ? w * .45 : w * .7; k.addPath(polyPath([R(-w / 2 + 16, yy), R(-w / 2 + 16 + ww, yy), R(-w / 2 + 16 + ww, yy + 6), R(-w / 2 + 16, yy + 6)])); }
  });
  return { path: p, knock: k };
})();

// ---------- schedule ----------
const BASE = [
  { t: .3, color: INK.wall, parts: [wall, pageBlock] },
  { t: .97, color: INK.terra, parts: [{ path: sky, clip: winInner }] },
  { t: 1.64, color: INK.teal, parts: [desk, { path: skyline }] },
  { t: 2.31, color: INK.near, parts: [...nearParts, header] },
  { t: 2.98, color: INK.gold, parts: [{ path: sun, clip: sunClip }] },
].map(b => ({ ...b, dur: .55 }));
const PASS = [
  { t: S[2].start, color: INK.plum, parts: [intro], reg: [2, -1] },
  { t: S[3].start, color: INK.teal, parts: [arabic], reg: [-2, 1] },
  { t: S[4].start, color: INK.terra, parts: [translation], reg: [1, 2] },
  { t: S[5].start + 2.0, color: INK.gold, parts: [notes], reg: [-1, -2] },
].map((b, i) => ({ ...b, dur: .95, i }));
PASS.forEach((b, i) => b.parts.push({ path: chip(i) }));
const LABEL_DUR = .45, labelT = b => b.t + b.dur + .15;
const PULLS = [...BASE.map((b, i) => ({ ...b, reg: [[1, 0], [-1, 1], [0, -1], [1, 1], [-1, 0]][i], seed: i + 1 })), ...PASS.map(b => ({ ...b, seed: 10 + b.i }))];

// ---------- render ----------
const BOX = [SHEET[0], SHEET[1], SHEET[2], SHEET[3]];
function labelPart(i) {
  return { paint: c => { c.font = '400 31px Outfit'; c.letterSpacing = '1px'; c.textBaseline = 'middle'; c.fillText(LABELS[i], LEG.x + LEG.chip + 22, LEG.y0 + i * LEG.dy + 2); } };
}
function render(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(bench, 0, 0);
  const z = 1 + .045 * ss((t - S[6].start) / (DUR - S[6].start));   // a slow push toward the pages at the end
  ctx.translate(960, 640); ctx.scale(z, z); ctx.translate(-960, -640);
  paperSheet(ctx, T, ...SHEET);
  let blade = null;
  for (const pl of PULLS) {
    const p = (t - pl.t) / pl.dur;
    if (p <= 0) continue;
    const clip = p < 1 ? wipeRegion(BOX, 'down', p, pl.seed, 30) : null;
    for (const part of pl.parts) {
      ctx.save();
      if (part.clip) ctx.clip(part.clip);
      ink(ctx, part.rule ? { path: part.path, rule: part.rule } : part, { color: pl.color, reg: pl.reg, clip, sheen: 1, trap: pl.i != null ? 1 : .6 });
      ctx.restore();
    }
    if (p < 1.12) blade = { y: wipeFront(BOX, 'down', clamp(p, 0, 1.2), 30), color: pl.color, p };
  }
  for (const b of PASS) {                               // each legend label is stamped by a small pull just after its pass
    const p = (t - labelT(b)) / LABEL_DUR;
    if (p <= 0) continue;
    const box = [LEG.x + LEG.chip + 14, LEG.y0 + b.i * LEG.dy - 28, 470, 56];
    ink(ctx, labelPart(b.i), { color: INK.near, reg: [1, -1], clip: p < 1 ? wipeRegion(box, 'right', p, 30 + b.i, 16) : null });
    if (p < 1.15) blade = { x: wipeFront(box, 'right', clamp(p, 0, 1.2), 16), y0: box[1] - 10, y1: box[1] + box[3] + 10, color: INK.near, p, small: true };
  }
  inkFinish(ctx, T, ...SHEET);
  ctx.fillStyle = 'rgba(232,226,205,.78)';             // tape on the sheet corners
  for (const [x, y, r] of [[SHEET[0] + 10, SHEET[1] + 6, -.6], [SHEET[0] + SHEET[2] - 10, SHEET[1] + 6, .6], [SHEET[0] + 10, SHEET[1] + SHEET[3] - 6, .6], [SHEET[0] + SHEET[2] - 10, SHEET[1] + SHEET[3] - 6, -.6]]) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(r); ctx.fillRect(-36, -11, 72, 22); ctx.restore();
  }
  if (blade && blade.small) squeegee(ctx, [blade.x + 4, blade.y0], [blade.x + 4, blade.y1], [1, 0], { color: blade.color, roll: blade.p * 6, handle: .35, scale: .6, bead: 12, seed: 3 });
  else if (blade) squeegee(ctx, [10, blade.y + 6], [1910, blade.y + 6], [0, 1], { color: blade.color, roll: blade.p * 14, handle: .5, scale: 1.3, bead: 26, seed: 7 });
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  drawCaption(ctx, S, t);
}

window.DUR = DUR;
window.render = render;
window.TEXTS = t => {
  const out = S.filter(s => t >= s.start - .1 && t < s.end + .5).map((s, i) => ({ id: 'cap' + s.start.toFixed(2), text: s.text, x0: 960 - s.text.length * 9, y0: 975, x1: 960 + s.text.length * 9, y1: 1022 }));
  for (const b of PASS) if (t >= labelT(b) + LABEL_DUR) out.push({ id: 'label' + b.i, text: LABELS[b.i], x0: LEG.x, y0: LEG.y0 + b.i * LEG.dy - 22, x1: LEG.x + 480, y1: LEG.y0 + b.i * LEG.dy + 22 });
  return out;
};
window.EV = [
  ...BASE.map((b, i) => ({ t: b.t, name: 'base pull ' + (i + 1) })),
  ...PASS.map(b => ({ t: b.t, name: 'pass: ' + LABELS[b.i] })),
  ...PASS.map(b => ({ t: labelT(b), name: 'label stamp ' + (b.i + 1) })),
  ...S.map((s, i) => ({ t: s.start, name: 'line ' + (i + 1) })),
];
render(0);
window.READY = true;
