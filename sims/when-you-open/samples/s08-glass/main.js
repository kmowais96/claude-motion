// Scene 08 "When You Don't Understand" — Stained Glass sample.
// Darkness: loose, unleaded fragments (some cut as question marks) drift, dim and apart. As the narration turns
// to patience and context, light rises behind a round opening; the question marks slide away into the dark and the
// fragments slide into their lead cames ring by ring (border, surroundings, ground, centre) until one 8-point star
// rosette window glows warm. render(t) is pure in t; pieces step at 8 fps, light moves on ones.
import { estimate } from './timing.js';
import { drawCaption } from './caption.js';
import { makeComp } from './comp.js';
import { Pass, COL, poly, circle, brush, INK } from './glass.js';
import { mulberry, hash } from './lib.js';

const LINES = [
  'And questions you cannot answer.',
  "That's okay.",
  "The problem isn't having questions.",
  'The problem is deciding you already know the answer...',
  "Before you've taken the time to understand.",
  'So be patient.',
  'Look at the verses around the passage.',
  'Learn its background.',
  'Explore reliable explanations.',
];
const S = estimate(LINES, .8);
const at = i => S[i].start, end = i => S[i].end;
const DUR = end(8) + 2.6;

const cv = document.getElementById('gl');
const comp = makeComp(cv);
const K = 2 / 3, W = 1280, H = 720;
const mk = (w = W, h = H) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const L = { G: mk(), S: mk(), R: mk(), O: mk() };
const Lc = {}; for (const k in L) Lc[k] = L[k].getContext('2d');
const CAP = document.getElementById('cap').getContext('2d');

const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ss = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); };
const D = Math.PI / 180;
const P = (r, a) => [r * Math.cos(a * D), r * Math.sin(a * D)];
const arc = (r, a0, a1, n = 8) => Array.from({ length: n + 1 }, (_, i) => P(r, a0 + (a1 - a0) * i / n));

// ---------- the window: an 8-point star rosette ----------
const RA = 185, RI = RA * .7654, R2 = 205, R2F = 228, RS = 330, RB = 428, RW = 470, OPEN = 474;
const pieces = [];
const add = (pts, color, group, paint, o = {}) => pieces.push({ pts, color, group, paint, ...o });
const ang = k => k * 45 - 90;

// grisaille helpers (world coordinates; the paint callback shifts into the piece frame)
const dot = (g, x, y, r, a = .8) => { g.fillStyle = `rgba(44,26,12,${a})`; g.fill(circle(x, y, r)); };
const pearl = (g, x, y, r) => { g.strokeStyle = 'rgba(44,26,12,.85)'; g.lineWidth = r * .55; g.stroke(circle(x, y, r)); };
const band = (g, r, a0, a1, w, a = .5) => { g.strokeStyle = `rgba(52,30,14,${a})`; g.lineWidth = w; g.beginPath(); g.arc(0, 0, r, a0 * D, a1 * D); g.stroke(); };

for (let k = 0; k < 8; k++) {
  const A = ang(k), B = A + 45, M = A + 22.5;
  // border: 16 segments, gold and ruby, with pearls
  for (let h = 0; h < 2; h++) {
    const a0 = A + h * 22.5, a1 = a0 + 22.5, gold = h === 0;
    add([...arc(RB, a0, a1, 6), ...arc(RW, a1, a0, 6)], gold ? COL.gold : COL.ruby2, 0, g => {
      for (let j = 0; j < 3; j++) pearl(g, ...P((RB + RW) / 2, a0 + (j + .5) * 7.5), 7);
    }, { wash: .25 });
  }
  // surroundings: kite (ruby / green) and two cobalt sides
  const kite = [P(R2F, M), P(RS, M - 11), P(RB, M), P(RS, M + 11)];
  add(kite, k % 2 ? COL.green : COL.ruby, 1, g => {
    brush(g, [P(R2F + 22, M), P((R2F + RB) / 2, M), P(RB - 24, M)], 5, { w0: .2, w1: .2 });
    dot(g, ...P(RS, M), 9); dot(g, ...P(RS + 46, M), 5);
  }, { shade: null });
  add([...arc(R2F, A, M, 4), P(RS, M - 11), P(RB, M), ...arc(RB, M, A, 4)], k % 2 ? COL.deepblue : COL.cobalt, 1, g => {
    band(g, RB - 26, A + 1, M - 1, 6, .35); dot(g, ...P(RS + 10, A + 9), 7, .6); dot(g, ...P(RS - 48, A + 6), 5, .6);
  }, { wash: .18 });
  add([...arc(R2F, M, B, 4), ...arc(RB, B, M, 4), P(RS, M + 11)], k % 2 ? COL.cobalt : COL.deepblue, 1, g => {
    band(g, RB - 26, M + 1, B - 1, 6, .35); dot(g, ...P(RS + 10, B - 9), 7, .6); dot(g, ...P(RS - 48, B - 6), 5, .6);
  }, { wash: .18 });
  // background: gold fillet ring and the cobalt ground between the star points
  add([...arc(R2, A, B, 6), ...arc(R2F, B, A, 6)], COL.gold2, 2, g => {
    for (let j = 0; j < 4; j++) pearl(g, ...P((R2 + R2F) / 2, A + (j + .5) * 11.25), 5.5);
  });
  add([P(RA, A), P(RI, A + 22.5), P(RA, B), ...arc(R2, B, A, 6)], COL.blue2, 2, g => {
    dot(g, ...P(188, M), 6); dot(g, ...P(178, M - 6), 4); dot(g, ...P(178, M + 6), 4);
  }, { wash: .15 });
  // centre: the star's points
  add([P(RA, A), P(RI, A - 22.5), P(RI, A + 22.5)], COL.ruby, 3, g => {
    brush(g, [P(RI + 6, A), P(RA - 14, A)], 5, { w0: .5, w1: .1 }); dot(g, ...P(RI + 14, A), 6);
  });
}
add(Array.from({ length: 8 }, (_, k) => P(RI, ang(k) + 22.5)), COL.gold, 4, g => {
  pearl(g, 0, 0, 30); for (let k = 0; k < 8; k++) { dot(g, ...P(70, ang(k)), 8); brush(g, [P(38, ang(k) + 22.5), P(112, ang(k) + 22.5)], 5, { w0: .3, w1: .1 }); }
}, { wash: .1 });

// question marks: a hook and a dot, cut from pale and blue glass
function qHook(s) {
  const c = [...arc(40, 190, 390, 14), [16, 12], [2, 32], [0, 54]].map(p => [p[0] * s, (p[1] - 40) * s]);
  const Lp = [], Rp = [], w = 13 * s;
  for (let i = 0; i < c.length; i++) {
    const a = c[Math.max(0, i - 1)], b = c[Math.min(c.length - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    Lp.push([c[i][0] - dy * w, c[i][1] + dx * w]); Rp.push([c[i][0] + dy * w, c[i][1] - dx * w]);
  }
  return [...Lp, ...Rp.reverse()];
}
const QS = [];
[[-640, -250, 1.25, -.25, COL.white], [610, -300, 1.0, .3, COL.sky], [-260, 300, .9, .5, COL.white], [700, 230, 1.15, -.4, COL.steel]].forEach(([x, y, s, r, col], i) => {
  QS.push({ x, y, s, r, col, i });
});

// final-geometry metadata
pieces.forEach((p, i) => {
  let cx = 0, cy = 0; p.pts.forEach(q => { cx += q[0]; cy += q[1]; }); cx /= p.pts.length; cy /= p.pts.length;
  p.c = [cx, cy]; p.id = i + 1;
  p.path = poly(p.pts.map(q => [q[0] - cx, q[1] - cy]));
  p.far = p.pts.reduce((m, q) => Math.hypot(...q) > Math.hypot(...m) ? q : m, p.pts[0]);
  const rnd = mulberry(900 + i * 7);
  // loose state: scattered in the dark room, turned, drifting
  p.p0 = [-860 + rnd() * 1720, -470 + rnd() * 860]; p.v = [(rnd() - .5) * 26, (rnd() - .5) * 18];
  p.r0 = (rnd() - .5) * 360; p.w = (rnd() - .5) * 10; p.sc = .8 + rnd() * .25;
});
// landing beats: border (patience), surroundings (the verses around), ground (background), centre (explanation)
const span = [[at(5) - .5, end(5) + .6], [at(6) + .1, end(6) + .2], [at(7) - .1, end(7) + .4], [at(8), end(8) - .1], [end(8) + .25, end(8) + .25]];
for (let gi = 0; gi < 5; gi++) {
  const gs = pieces.filter(p => p.group === gi), [a, b] = span[gi];
  gs.forEach((p, j) => { p.land = Math.round((a + (b - a) * (gs.length > 1 ? j / (gs.length - 1) : 0)) * 8) / 8; });
}
const SLIDE = 1.5;

const easeIO = u => u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
function loose(p, t) {
  return [p.p0[0] + p.v[0] * t + 14 * Math.sin(t * .4 + p.id), p.p0[1] + p.v[1] * t + 10 * Math.sin(t * .31 + p.id * 2.1), p.r0 + p.w * t, p.sc];
}
function pose(p, t) {   // [x, y, rotDeg, scale, settled 0..1]
  const ts = p.land - SLIDE;
  if (t < ts) return [...loose(p, t), 0];
  if (t >= p.land) return [p.c[0], p.c[1], 0, 1, 1];
  const l = loose(p, ts), u = easeIO((t - ts) / SLIDE);
  let dr = ((0 - l[2]) % 360 + 540) % 360 - 180;
  const bump = Math.sin(cl((t - p.land + .3) / .3) * Math.PI) * 10, n = Math.hypot(...p.c) || 1;
  return [l[0] + (p.c[0] - l[0]) * u + p.c[0] / n * bump, l[1] + (p.c[1] - l[1]) * u + p.c[1] / n * bump, l[2] + dr * u, l[3] + (1 - l[3]) * u, 0];
}

// ---------- stone wall with a round, splayed opening (pre-rendered, world coords) ----------
const SX = 1500, SY = 950;
const stone = mk(SX * 2, SY * 2);
{
  const s = stone.getContext('2d'), rnd = mulberry(11);
  s.translate(SX, SY); s.fillStyle = '#3e3832'; s.fillRect(-SX, -SY, SX * 2, SY * 2);
  for (let row = -12; row < 12; row++) {
    const CH = 92, y0 = row * CH; let x = -SX - hash(row * 7.3) * 200;
    while (x < SX) {
      const w = 150 + hash(row * 13.1 + x * .01) * 140, t = .78 + hash(row * 3.7 + x * .13) * .3;
      s.fillStyle = `rgb(${92 * t | 0},${84 * t | 0},${74 * t | 0})`; s.fillRect(x + 2.5, y0 + 2.5, w - 5, CH - 5);
      x += w;
    }
  }
  for (let i = 0; i < 9000; i++) { const v = rnd(); s.fillStyle = v > .5 ? 'rgba(255,245,225,.06)' : 'rgba(20,15,10,.10)'; s.fillRect(-SX + rnd() * SX * 2, -SY + rnd() * SY * 2, 2 + rnd() * 5, 2 + rnd() * 4); }
  // splayed embrasure: dressed rings, lighter toward the glass
  [[OPEN + 112, '#4f483e'], [OPEN + 96, '#655d50'], [OPEN + 60, '#726959'], [OPEN + 34, '#7d735f'], [OPEN + 14, '#887d68']].forEach(([r, c]) => { s.fillStyle = c; s.fill(circle(0, 0, r)); });
  s.strokeStyle = 'rgba(40,34,28,.5)'; s.lineWidth = 3;
  for (let k = 0; k < 16; k++) { const a = k * 22.5 + 11; s.beginPath(); s.moveTo(...P(OPEN + 96, a)); s.lineTo(...P(OPEN + 34, a)); s.stroke(); }
  s.globalCompositeOperation = 'destination-out'; s.fill(circle(0, 0, OPEN));
}

// ---------- frame ----------
function light(t) { return ss(at(4), end(8) + .8, t) * .85 + ss(at(8), end(8) + 1.4, t) * .35; }
function render(t) {
  const { G, S: Sc, R, O } = Lc;
  for (const c of [G, Sc, R, O]) { c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H); }
  CAP.setTransform(1, 0, 0, 1, 0, 0); CAP.clearRect(0, 0, 1920, 1080); R.setTransform(K, 0, 0, K, 0, 0);
  const tq = Math.floor(t * 8 + 1e-6) / 8;   // pieces step at 8 fps
  const z = .86 + .09 * ss(0, DUR, t), cam = [0, 62 - 10 * ss(0, DUR, t), z];
  const M = new DOMMatrix().scale(K).translate(960, 540).scale(z).translate(-cam[0], -cam[1]);
  const I = light(t);
  Sc.setTransform(M); Sc.drawImage(stone, -SX, -SY);
  const Pz = new Pass(G, Sc);
  const draw = (p, ps) => {
    Pz.setTransform(M.translate(ps[0], ps[1]).rotate(ps[2]).scale(ps[3]));
    Pz.piece(p.path, p.color, { id: p.id, paint: g => { g.save(); g.translate(-p.c[0], -p.c[1]); p.paint(g); g.restore(); }, wash: p.wash, lead: ps[4] ? 7 : 2.4, edge: 7, matW: 11 });
  };
  const poses = pieces.map(p => pose(p, tq));
  pieces.forEach((p, i) => { if (poses[i][4]) draw(p, poses[i]); });
  // the outer came and two iron saddle bars belong to the stone opening
  if (poses.some(q => q[4])) { Sc.setTransform(M); Sc.strokeStyle = '#1d1f23'; Sc.lineWidth = 12; Sc.stroke(circle(0, 0, RW)); }
  Sc.setTransform(M); Sc.fillStyle = '#26282c';
  for (const y of [-RS + 40, RS - 40]) { const hw = Math.sqrt(OPEN * OPEN - y * y) + 18; Sc.fillRect(-hw, y - 6, hw * 2, 12); }
  pieces.forEach((p, i) => { if (!poses[i][4]) draw(p, poses[i]); });
  // question marks: drifting in the dark, then sliding away out of the light
  const away = ss(at(5) - .4, at(6) + 1.8, tq);
  for (const q of QS) {
    const n = Math.hypot(q.x, q.y), x = q.x + Math.sin(tq * .35 + q.i) * 30 + q.x / n * away * 900, y = q.y + Math.cos(tq * .27 + q.i * 2) * 20 + q.y / n * away * 700;
    const rot = q.r * 40 + Math.sin(tq * .3 + q.i) * 8;
    Pz.setTransform(M.translate(x, y).rotate(rot).scale(q.s));
    Pz.piece(poly(qHook(1)), q.col, { id: 300 + q.i, lead: 2.4, edge: 7, matW: 9 });
    Pz.piece(circle(0, 54 * 1 + 26, 15), q.col, { id: 320 + q.i, lead: 2.4, edge: 5, matW: 6 });
  }
  // light behind the empty opening (fades as the glass fills it) and weld sparks on each landing
  R.globalCompositeOperation = 'lighter';
  const fill = pieces.filter((p, i) => poses[i][4]).length / pieces.length;
  const gk = I * (1 - fill) * .55;
  if (gk > .01) {
    const c0 = [960 - cam[0] * z, 540 - cam[1] * z], gr = R.createRadialGradient(...c0, 0, ...c0, OPEN * z);
    const col = m => `rgb(${255 * gk * m | 0},${200 * gk * m | 0},${130 * gk * m | 0})`;
    gr.addColorStop(0, col(1)); gr.addColorStop(.7, col(.55)); gr.addColorStop(1, col(0));
    R.fillStyle = gr; R.fill(circle(...c0, OPEN * z));
  }
  for (const p of pieces) {
    const u = (t - p.land) / .35; if (u < 0 || u > 1) continue;
    const [x, y] = [960 + (p.far[0] - cam[0]) * z, 540 + (p.far[1] - cam[1]) * z], a = (1 - u) * (1 - u), r = 26 * (1 - .5 * u);
    const gr = R.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgb(${255 * a | 0},${240 * a | 0},${200 * a | 0})`); gr.addColorStop(.25, `rgb(${255 * a * .5 | 0},${170 * a * .5 | 0},${80 * a * .5 | 0})`); gr.addColorStop(1, 'rgb(0,0,0)');
    R.fillStyle = gr; R.fill(circle(x, y, r));
  }
  R.globalCompositeOperation = 'source-over';
  drawCaption(CAP, S, t);
  const warm = [1, .8, .52];
  comp.render(L, {
    cam: [cam[0], cam[1], z * K], sunI: 0, skyI: .17 + .06 * I, skyCol: [.55, .62, .85], amb: .035 + .025 * I, ambCol: [.8, .82, .9], haze: .3 - .15 * I,
    pts: [[0, 0, 340 + 160 * I, 1.3 * I, warm], [0, 0, 700, .85 * I, warm]],
    raysK: 1, expo: 1.15, bloom: .35 + .3 * I, thr: .5, vign: .5, sat: 1.1, contrast: .12, time: t,
  });
}

await document.fonts.load('italic 500 42px "Cormorant Garamond"');
window.DUR = DUR;
window.render = render;
window.TEXTS = t => S.filter(s => t >= s.start - .1 && t < s.end + .5).map(s => s.text);
window.EV = [{ t: at(4), what: 'light begins behind the opening' }, { t: at(5), what: 'question marks slide away; border leaded' },
  { t: at(6), what: 'surroundings slide in' }, { t: at(7), what: 'background ring' }, { t: at(8), what: 'star centre' }, { t: end(8) + .25, what: 'window whole and lit' }];
render(0);
window.READY = true;
