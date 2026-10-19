// Scene 08 "When You Don't Understand" — Stained Glass sample (v2: Islamic window).
// Darkness: loose, unleaded fragments (some cut as question marks) drift, dim and apart. As the narration turns
// to patience and context, light rises behind a pointed-arch opening in a warm plastered wall; the question marks
// slide away into the dark and the fragments slide into their lead cames, outside in (border, surroundings,
// ground, centre), until one khatam pattern of 8-point stars and crosses glows warm.
// render(t) is pure in t; pieces step at 8 fps, light moves on ones.
import { estimate } from './timing.js';
import { drawCaption } from './caption.js';
import { makeComp } from './comp.js';
import { Pass, COL, poly, circle, brush } from './glass.js';
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
const P = (r, a, c = [0, 0]) => [c[0] + r * Math.cos(a * D), c[1] + r * Math.sin(a * D)];

// ---------- the opening: a pointed arch over upright jambs (convex) ----------
const HA = 380, AR = 520, YS = -80, YB = 380, CX = AR - HA;   // half width, arch radius, springing, sill
const CEN = [0, -95];
function archPts(o) {   // outline offset by o (o < 0 = inward); equal sample counts for every o
  const R = AR + o, al = Math.acos(CX / R) / D, pts = [];
  for (let i = 0; i < 6; i++) pts.push([-(HA + o), YB + o + (YS - YB - o) * i / 6]);
  for (let i = 0; i <= 12; i++) pts.push(P(R, 180 + al * i / 12, [CX, YS]));
  for (let i = 1; i <= 12; i++) pts.push(P(R, -al + al * i / 12, [-CX, YS]));
  for (let i = 1; i < 6; i++) pts.push([HA + o, YS + (YB + o - YS) * i / 6]);
  for (let i = 0; i < 8; i++) pts.push([(HA + o) - 2 * (HA + o) * i / 8, YB + o]);
  return pts;
}
const OPEN = archPts(4), GLASS = archPts(0), INNER = archPts(-42);
const pathOf = pts => poly(pts);

// Sutherland–Hodgman clip of a polygon against the convex inner outline
const area = p => { let a = 0; for (let i = 0; i < p.length; i++) { const q = p[i], r = p[(i + 1) % p.length]; a += q[0] * r[1] - r[0] * q[1]; } return a / 2; };
const CLIPSIGN = Math.sign(area(INNER));
function clip(sub) {
  let out = sub;
  for (let i = 0; i < INNER.length && out.length; i++) {
    const a = INNER[i], b = INNER[(i + 1) % INNER.length];
    const side = p => CLIPSIGN * ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])) >= 0;
    const inp = out; out = [];
    for (let j = 0; j < inp.length; j++) {
      const p = inp[j], q = inp[(j + 1) % inp.length], ip = side(p), iq = side(q);
      if (ip) out.push(p);
      if (ip !== iq) {
        const d1 = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]), d2 = (b[0] - a[0]) * (q[1] - a[1]) - (b[1] - a[1]) * (q[0] - a[0]), u = d1 / (d1 - d2);
        out.push([p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u]);
      }
    }
  }
  return out;
}

// grisaille helpers (world coordinates; the paint callback shifts into the piece frame)
const dot = (g, x, y, r, a = .8) => { g.fillStyle = `rgba(44,26,12,${a})`; g.fill(circle(x, y, r)); };
const pearl = (g, x, y, r) => { g.strokeStyle = 'rgba(44,26,12,.85)'; g.lineWidth = r * .55; g.stroke(circle(x, y, r)); };

const pieces = [];
const add = (pts, color, group, paint, o = {}) => pieces.push({ pts, color, group, paint, ...o });

// border band: gold and green segments with pearls
{
  const n = GLASS.length, step = 3;
  for (let i0 = 0, k = 0; i0 < n; i0 += step, k++) {
    const idx = []; for (let i = i0; i <= Math.min(i0 + step, n); i++) idx.push(i % n);
    const pts = [...idx.map(i => GLASS[i]), ...idx.slice().reverse().map(i => INNER[i])];
    const mid = idx.map(i => [(GLASS[i][0] + INNER[i][0]) / 2, (GLASS[i][1] + INNER[i][1]) / 2]);
    add(pts, k % 2 ? COL.green2 : COL.gold, 0, g => { for (let j = 0; j < mid.length - 1; j++) pearl(g, (mid[j][0] + mid[j + 1][0]) / 2, (mid[j][1] + mid[j + 1][1]) / 2, 7); }, { wash: .2 });
  }
}
// khatam field: 8-point stars (two squares) on a square lattice, tips touching; crosses between them
const SP = 196, RT = SP / 2, RIN = RT * .7654;
const star = c => Array.from({ length: 16 }, (_, k) => P(k % 2 ? RIN : RT, k * 22.5, c));
const arcOf = (c, a0, a1) => { const o = []; for (let a = a0; a <= a1 + 1e-6; a += 22.5) o.push(P(Math.round(a / 22.5) % 2 ? RIN : RT, a, c)); return o; };
const field = [];
for (let j = -4; j <= 3; j++) for (let i = -3; i <= 3; i++) {
  const c = [CEN[0] + i * SP, CEN[1] + j * SP], central = i === 0 && j === 0;
  field.push({ pts: clip(star(c)), color: central ? COL.gold2 : ((i + j) % 2 ? COL.ruby : COL.gold), lat: c, kind: 'star', central });
  // cross centred at c + (SP/2, SP/2): bounded by the four surrounding stars
  const A = c, Dd = [c[0], c[1] + SP], Cc = [c[0] + SP, c[1] + SP], B = [c[0] + SP, c[1]];
  const cr = [...arcOf(A, 0, 67.5), ...arcOf(Dd, -90, -22.5), ...arcOf(Cc, 180, 247.5), ...arcOf(B, 90, 157.5)];
  field.push({ pts: clip(cr), color: (i + j) % 2 ? COL.cobalt : COL.deepblue, lat: [c[0] + SP / 2, c[1] + SP / 2], kind: 'cross' });
}
const keep = field.filter(f => f.pts.length > 2 && Math.abs(area(f.pts)) > 700);
keep.forEach(f => {
  f.d = Math.hypot(f.lat[0] - CEN[0], f.lat[1] - CEN[1]);
  f.paint = f.kind === 'star'
    ? g => { const c = f.lat; g.strokeStyle = 'rgba(44,26,12,.7)'; g.lineWidth = 4; g.stroke(poly(Array.from({ length: 16 }, (_, k) => P(k % 2 ? RIN * .55 : RT * .55, k * 22.5, c)))); dot(g, c[0], c[1], f.central ? 12 : 8); if (f.central) pearl(g, c[0], c[1], 26); }
    : g => { const c = f.lat; dot(g, c[0], c[1], 9); for (let k = 0; k < 4; k++) dot(g, ...P(36, k * 90 + 45, c), 5, .6); brush(g, [P(20, 0, c), P(58, 0, c)], 4); brush(g, [P(20, 180, c), P(58, 180, c)], 4); };
});
// outside in: surroundings, ground, centre, the central star last
const ring = keep.filter(f => !f.central).sort((a, b) => b.d - a.d);
const n1 = Math.round(ring.length * .45), n2 = Math.round(ring.length * .8);
ring.forEach((f, i) => add(f.pts, f.color, i < n1 ? 1 : i < n2 ? 2 : 3, f.paint, { wash: f.kind === 'cross' ? .15 : 0 }));
keep.filter(f => f.central).forEach(f => add(f.pts, f.color, 4, f.paint));

// question marks: a hook and a dot, cut from pale and blue glass
function qHook() {
  const c = [...Array.from({ length: 15 }, (_, i) => P(40, 190 + 200 * i / 14)), [16, 12], [2, 32], [0, 54]].map(p => [p[0], p[1] - 40]);
  const Lp = [], Rp = [], w = 13;
  for (let i = 0; i < c.length; i++) {
    const a = c[Math.max(0, i - 1)], b = c[Math.min(c.length - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    Lp.push([c[i][0] - dy * w, c[i][1] + dx * w]); Rp.push([c[i][0] + dy * w, c[i][1] - dx * w]);
  }
  return poly([...Lp, ...Rp.reverse()]);
}
const QHOOK = qHook(), QDOT = circle(0, 80, 15);
const QS = [[-640, -330, 1.25, -.25, COL.white], [610, -380, 1.0, .3, COL.sky], [-260, 230, .9, .5, COL.white], [700, 150, 1.15, -.4, COL.steel]]
  .map(([x, y, s, r, col], i) => ({ x: x, y: y, s, r, col, i }));

// final-geometry metadata + loose state
pieces.forEach((p, i) => {
  let cx = 0, cy = 0; p.pts.forEach(q => { cx += q[0]; cy += q[1]; }); cx /= p.pts.length; cy /= p.pts.length;
  p.c = [cx, cy]; p.id = i + 1;
  p.path = poly(p.pts.map(q => [q[0] - cx, q[1] - cy]));
  const dc = q => Math.hypot(q[0] - CEN[0], q[1] - CEN[1]);
  p.far = p.pts.reduce((m, q) => dc(q) > dc(m) ? q : m, p.pts[0]);
  p.ang = Math.atan2(cy - CEN[1], cx - CEN[0]);
  const rnd = mulberry(900 + i * 7);
  p.p0 = [-900 + rnd() * 1800, -560 + rnd() * 900]; p.v = [(rnd() - .5) * 26, (rnd() - .5) * 18];
  p.r0 = (rnd() - .5) * 360; p.w = (rnd() - .5) * 10; p.sc = .8 + rnd() * .25;
});
// landing beats: border (patience), surroundings (the verses around), ground (background), centre (explanation)
const span = [[at(5) - .5, end(5) + .6], [at(6) + .1, end(6) + .2], [at(7) - .1, end(7) + .4], [at(8), end(8) - .1], [end(8) + .25, end(8) + .25]];
for (let gi = 0; gi < 5; gi++) {
  const gs = pieces.filter(p => p.group === gi).sort((a, b) => (a.ang + 4) % 6.2832 - (b.ang + 4) % 6.2832), [a, b] = span[gi];
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
  const dr = ((0 - l[2]) % 360 + 540) % 360 - 180;
  const bump = Math.sin(cl((t - p.land + .3) / .3) * Math.PI) * 10, vx = p.c[0] - CEN[0], vy = p.c[1] - CEN[1], n = Math.hypot(vx, vy) || 1;
  return [l[0] + (p.c[0] - l[0]) * u + vx / n * bump, l[1] + (p.c[1] - l[1]) * u + vy / n * bump, l[2] + dr * u, l[3] + (1 - l[3]) * u, 0];
}

// ---------- warm plastered wall with a moulded arch and a rectangular frame (pre-rendered, world coords) ----------
const SX = 1550, SY = 1000;
const wall = mk(SX * 2, SY * 2);
{
  const s = wall.getContext('2d'), rnd = mulberry(11);
  s.translate(SX, SY); s.fillStyle = '#b48f66'; s.fillRect(-SX, -SY, SX * 2, SY * 2);
  for (let i = 0; i < 260; i++) {   // lime-plaster mottling: soft blotches, lighter and darker
    const x = -SX + rnd() * SX * 2, y = -SY + rnd() * SY * 2, r = 60 + rnd() * 260, lt = rnd() > .5;
    const gr = s.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, lt ? 'rgba(236,206,160,.16)' : 'rgba(110,80,50,.14)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    s.fillStyle = gr; s.fillRect(x - r, y - r, r * 2, r * 2);
  }
  for (let i = 0; i < 7000; i++) { s.fillStyle = rnd() > .5 ? 'rgba(255,240,215,.07)' : 'rgba(70,45,25,.08)'; s.fillRect(-SX + rnd() * SX * 2, -SY + rnd() * SY * 2, 1.5 + rnd() * 3, 1.5 + rnd() * 3); }
  // rectangular frame around the arch (alfiz): moulded bands
  const fr = (x0, y0, x1, y1, w, c) => { s.strokeStyle = c; s.lineWidth = w; s.strokeRect(x0, y0, x1 - x0, y1 - y0); };
  fr(-560, -760, 560, 480, 30, '#c9a77c'); fr(-560, -760, 560, 480, 6, '#7d5f40'); fr(-600, -800, 600, 520, 10, '#9a7a55');
  // spandrel stucco: small 8-point stars, shallow relief
  for (const sx of [-1, 1]) {
    const c = [sx * 430, -630];
    s.fillStyle = 'rgba(90,64,40,.35)'; s.fill(poly(Array.from({ length: 16 }, (_, k) => P(k % 2 ? 38 : 50, k * 22.5, c))));
    s.fillStyle = 'rgba(232,204,160,.25)'; s.fill(poly(Array.from({ length: 16 }, (_, k) => P(k % 2 ? 22 : 30, k * 22.5, c))));
  }
  // splayed reveal: arch-shaped moulded rings, lighter toward the glass
  [[118, '#7e6243'], [100, '#c3a074'], [82, '#9a7a55'], [58, '#cfae84'], [32, '#b8966c'], [14, '#d6b78d']].forEach(([o, c]) => { s.fillStyle = c; s.fill(pathOf(archPts(o))); });
  s.fillStyle = '#8a6c4b'; s.fillRect(-470, YB + 14, 940, 30); s.fillStyle = '#d0b089'; s.fillRect(-470, YB + 10, 940, 8);
  s.globalCompositeOperation = 'destination-out'; s.fill(pathOf(OPEN));
}

// ---------- frame ----------
function light(t) { return ss(at(4), end(8) + .8, t) * .85 + ss(at(8), end(8) + 1.4, t) * .35; }
function render(t) {
  const { G, S: Sc, R, O } = Lc;
  for (const c of [G, Sc, R, O]) { c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H); }
  CAP.setTransform(1, 0, 0, 1, 0, 0); CAP.clearRect(0, 0, 1920, 1080);
  const tq = Math.floor(t * 8 + 1e-6) / 8;   // pieces step at 8 fps
  const z = .82 + .06 * ss(0, DUR, t), cam = [0, -60 - 40 * ss(0, DUR, t), z];
  const M = new DOMMatrix().scale(K).translate(960, 540).scale(z).translate(-cam[0], -cam[1]);
  const I = light(t);
  Sc.setTransform(M); Sc.drawImage(wall, -SX, -SY);
  const Pz = new Pass(G, Sc);
  const draw = (p, ps) => {
    Pz.setTransform(M.translate(ps[0], ps[1]).rotate(ps[2]).scale(ps[3]));
    Pz.piece(p.path, p.color, { id: p.id, paint: g => { g.save(); g.translate(-p.c[0], -p.c[1]); p.paint(g); g.restore(); }, wash: p.wash, lead: ps[4] ? 7 : 2.4, edge: 7, matW: 11 });
  };
  const poses = pieces.map(p => pose(p, tq));
  pieces.forEach((p, i) => { if (poses[i][4]) draw(p, poses[i]); });
  // the outer came and two iron saddle bars belong to the opening
  Sc.setTransform(M);
  if (poses.some(q => q[4])) { Sc.strokeStyle = '#1d1f23'; Sc.lineWidth = 12; Sc.stroke(pathOf(GLASS)); }
  Sc.save(); Sc.clip(pathOf(archPts(18))); Sc.fillStyle = '#26282c';
  for (const y of [CEN[1] - SP, CEN[1] + SP]) Sc.fillRect(-500, y - 6, 1000, 12);
  Sc.restore();
  pieces.forEach((p, i) => { if (!poses[i][4]) draw(p, poses[i]); });
  // question marks: drifting in the dark, then sliding away out of the light
  const away = ss(at(5) - .4, at(6) + 1.8, tq);
  for (const q of QS) {
    const vx = q.x - CEN[0], vy = q.y - CEN[1], n = Math.hypot(vx, vy);
    const x = q.x + Math.sin(tq * .35 + q.i) * 30 + vx / n * away * 900, y = q.y + Math.cos(tq * .27 + q.i * 2) * 20 + vy / n * away * 700;
    Pz.setTransform(M.translate(x, y).rotate(q.r * 40 + Math.sin(tq * .3 + q.i) * 8).scale(q.s));
    Pz.piece(QHOOK, q.col, { id: 300 + q.i, lead: 2.4, edge: 7, matW: 9 });
    Pz.piece(QDOT, q.col, { id: 320 + q.i, lead: 2.4, edge: 5, matW: 6 });
  }
  // light behind the empty opening (fades as the glass fills it) and weld sparks on each landing
  R.globalCompositeOperation = 'lighter';
  const fill = poses.filter(q => q[4]).length / pieces.length, gk = I * (1 - fill) * .55;
  if (gk > .01) {
    R.setTransform(M);
    const gr = R.createRadialGradient(CEN[0], CEN[1], 0, CEN[0], CEN[1], 620);
    const col = m => `rgb(${255 * gk * m | 0},${200 * gk * m | 0},${130 * gk * m | 0})`;
    gr.addColorStop(0, col(1)); gr.addColorStop(.7, col(.55)); gr.addColorStop(1, col(.1));
    R.fillStyle = gr; R.fill(pathOf(OPEN));
  }
  R.setTransform(K, 0, 0, K, 0, 0);
  for (const p of pieces) {
    const u = (t - p.land) / .35; if (u < 0 || u > 1) continue;
    const x = 960 + (p.far[0] - cam[0]) * z, y = 540 + (p.far[1] - cam[1]) * z, a = (1 - u) * (1 - u), r = 26 * (1 - .5 * u);
    const gr = R.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgb(${255 * a | 0},${240 * a | 0},${200 * a | 0})`); gr.addColorStop(.25, `rgb(${255 * a * .5 | 0},${170 * a * .5 | 0},${80 * a * .5 | 0})`); gr.addColorStop(1, 'rgb(0,0,0)');
    R.fillStyle = gr; R.fill(circle(x, y, r));
  }
  R.globalCompositeOperation = 'source-over';
  drawCaption(CAP, S, t);
  const warm = [1, .8, .52];
  comp.render(L, {
    cam: [cam[0], cam[1], z * K], sunI: 0, skyI: .17 + .06 * I, skyCol: [.55, .62, .85], amb: .03 + .02 * I, ambCol: [.9, .85, .8], haze: .3 - .15 * I,
    pts: [[CEN[0], CEN[1], 380 + 200 * I, 1.3 * I, warm], [CEN[0], CEN[1], 820, .85 * I, warm]],
    raysK: 1, expo: 1.15, bloom: .35 + .3 * I, thr: .5, vign: .5, sat: 1.1, contrast: .12, time: t,
  });
}

await document.fonts.load('italic 500 42px "Cormorant Garamond"');
window.DUR = DUR;
window.render = render;
window.TEXTS = t => S.filter(s => t >= s.start - .1 && t < s.end + .5).map(s => s.text);
window.EV = [{ t: at(4), what: 'light begins behind the opening' }, { t: at(5), what: 'question marks slide away; border leaded' },
  { t: at(6), what: 'surroundings slide in' }, { t: at(7), what: 'ground' }, { t: at(8), what: 'centre' }, { t: end(8) + .25, what: 'window whole and lit' }];
render(0);
window.READY = true;
