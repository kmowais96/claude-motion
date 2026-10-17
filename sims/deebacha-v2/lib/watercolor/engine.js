// Watercolour stroke engine, copied from the Watercolor Brush style (engine.js) as an ES module.
// Strokes are a variable-width ribbon at partial opacity plus dashed bristle tracks (flying white).
// RNG is module-level; anything built must go through withSeed so frames stay deterministic.
import { mulberry } from '/core/lib.js';

let RNG = mulberry(20260924);
export const rnd = (a = 0, b = 1) => a + (b - a) * RNG();
export const pick = a => a[Math.floor(RNG() * a.length)];
export function withSeed(seed, fn) { const keep = RNG; RNG = mulberry(seed); try { return fn(); } finally { RNG = keep; } }
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const ss = t => { t = clamp(t); return t * t * (3 - 2 * t); };
export const eio = t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
export const eo = t => 1 - Math.pow(1 - clamp(t), 3);
export const ei = t => Math.pow(clamp(t), 2.2);
export const hash = n => { n = Math.sin(n * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };
export const vnoise = x => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i), hash(i + 1), u); };
export const fbm = x => vnoise(x) * .55 + vnoise(x * 2.1 + 17) * .3 + vnoise(x * 4.3 + 41) * .15;

const _rgb = {};
export const hex2rgb = h => _rgb[h] || (_rgb[h] = [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
export const mixc = (a, b, t) => { const A = hex2rgb(a), B = hex2rgb(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
export const rgba = (h, a) => { const c = hex2rgb(h); return `rgba(${c[0]},${c[1]},${c[2]},${clamp(a).toFixed(3)})`; };

export function qcurve(x0, y0, x1, y1, bend = 0, n = 12) {
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1;
  const cx = mx - dy / L * bend, cy = my + dx / L * bend, out = [];
  for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; out.push([u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y1]); }
  return out;
}
export function qctrl(x0, y0, cx, cy, x1, y1, n = 12) {
  const out = [];
  for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; out.push([u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y1]); }
  return out;
}
export const polar = (x, y, a, len, bend = 0, n = 8) => qcurve(x, y, x + Math.cos(a) * len, y + Math.sin(a) * len, bend, n);
// a straight segment resampled into n points (painted lines need points to taper along)
export const line = (x0, y0, x1, y1, n = 8) => Array.from({ length: n + 1 }, (_, i) => [lerp(x0, x1, i / n), lerp(y0, y1, i / n)]);

export function mk(pts, w, col, o = {}) {
  const n = pts.length, ws = [], nx = [], ny = [];
  const seed = rnd(0, 1000), rough = o.rough ?? .22, prof = o.prof || 'brush';
  for (let i = 0; i < n; i++) {
    const s = i / (n - 1); let f;
    if (prof === 'leaf') f = Math.pow(Math.sin(Math.PI * (s * .94 + .03)), .7);
    else if (prof === 'even') f = Math.min(1, s / .06 + .35) * Math.min(1, (1 - s) / .08 + .4);
    else if (prof === 'tip') f = Math.pow(1 - s * .92, .85) * Math.min(1, s / .05 + .6);
    else if (prof === 'trunk') f = (1 - s * .62) * (1 + Math.max(0, .06 - s) * 9);
    else f = Math.min(1, s / .1 + .3) * Math.pow(1 - s * .85, .6);
    ws.push(Math.max(.5, w * f * (1 + rough * (vnoise(seed + i * .9) * 2 - 1))));
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
    nx.push(-dy / L); ny.push(dx / L);
  }
  const nb = o.nb ?? (w >= 6 ? Math.min(9, Math.max(3, Math.round(w / 3.2))) : 0);
  let br = null;
  if (nb > 0) {
    br = [];
    for (let j = 0; j < nb; j++) {
      const dash = []; for (let k = 0; k < 6; k++) dash.push(k % 2 ? rnd(1, w * .5 + 3) : rnd(18, 90));
      br.push({ off: rnd(-.46, .46), bw: Math.max(.7, w / nb * rnd(.6, 1.3)), a: rnd(.3, .85), end: rnd(.72, 1), dash });
    }
  }
  return { pts, ws, nx, ny, col, a: o.a ?? .92, rib: o.rib ?? (nb ? .62 : .92), br };
}

export function drawS(c, s, p = 1, col = null, am = 1) {
  if (p <= 0) return;
  const P = s.pts, n = P.length, m = (n - 1) * clamp(p), k = Math.floor(m), f = m - k, cc = col || s.col;
  const cnt = f > .001 && k < n - 1 ? k + 2 : k + 1;
  const X = i => i <= k ? P[i][0] : lerp(P[k][0], P[k + 1][0], f), Y = i => i <= k ? P[i][1] : lerp(P[k][1], P[k + 1][1], f);
  c.beginPath();
  for (let i = 0; i < cnt; i++) { const j = Math.min(i, n - 1), hw = s.ws[j] / 2 * (p < 1 && i === cnt - 1 ? .5 : 1); const x = X(i) + s.nx[j] * hw, y = Y(i) + s.ny[j] * hw; i ? c.lineTo(x, y) : c.moveTo(x, y); }
  for (let i = cnt - 1; i >= 0; i--) { const j = Math.min(i, n - 1), hw = s.ws[j] / 2 * (p < 1 && i === cnt - 1 ? .5 : 1); c.lineTo(X(i) - s.nx[j] * hw, Y(i) - s.ny[j] * hw); }
  c.closePath(); c.fillStyle = rgba(cc, s.a * s.rib * am); c.fill();
  if (s.br) {
    c.lineCap = 'round'; c.lineJoin = 'round';
    for (const b of s.br) {
      const e = Math.min(m, (n - 1) * b.end), kk = Math.floor(e); if (kk < 1) continue;
      c.beginPath();
      for (let i = 0; i <= kk; i++) { const hw = s.ws[i] * b.off, x = P[i][0] + s.nx[i] * hw, y = P[i][1] + s.ny[i] * hw; i ? c.lineTo(x, y) : c.moveTo(x, y); }
      c.setLineDash(b.dash); c.lineWidth = b.bw; c.strokeStyle = rgba(cc, s.a * b.a * am); c.stroke();
    }
    c.setLineDash([]);
  }
}

export function drawList(c, L, p = 1, col = null, am = 1) {
  const N = L.length; if (!N) return;
  if (p >= 1) { for (const s of L) drawS(c, s, 1, col, am); return; }
  const dur = Math.min(.5, Math.max(.12, 4 / N));
  for (let j = 0; j < N; j++) { const t0 = j / N * (1 - dur); drawS(c, L[j], (p - t0) / dur, col, am); }
}

export function bbox(L, pad = 6) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const s of L) for (let i = 0; i < s.pts.length; i++) { const [x, y] = s.pts[i], w = s.ws[i]; x0 = Math.min(x0, x - w); y0 = Math.min(y0, y - w); x1 = Math.max(x1, x + w); y1 = Math.max(y1, y + w); }
  return [Math.floor(x0 - pad), Math.floor(y0 - pad), Math.ceil(x1 + pad), Math.ceil(y1 + pad)];
}
export function sprite(L, col = null) {
  const [x0, y0, x1, y1] = bbox(L), cv = document.createElement('canvas');
  cv.width = Math.max(1, x1 - x0); cv.height = Math.max(1, y1 - y0);
  const c = cv.getContext('2d'); c.translate(-x0, -y0); for (const s of L) drawS(c, s, 1, col);
  return { cv, x0, y0, x1, y1 };
}
export const drawSprite = (c, sp) => c.drawImage(sp.cv, sp.x0, sp.y0);

export function edgeOf(s, side, w, col, a = .85) {
  const pts = s.pts.map((p, i) => [p[0] + s.nx[i] * s.ws[i] * .47 * side, p[1] + s.ny[i] * s.ws[i] * .47 * side]);
  return mk(pts, w, col, { prof: 'even', nb: 0, a, rough: .35 });
}
// fill a region with overlapping broad horizontal strokes (a laid wash); inside(x,y) bounds it
export function fillStrokes(L, x0, y0, x1, y1, w, col, o = {}) {
  const step = w * (o.overlap ?? .62);
  for (let y = y0 + w * .35; y <= y1 - w * .2; y += step) {
    const j = rnd(-4, 4), a = o.a ?? .5;
    L.push(mk(qcurve(x0 + rnd(0, 6), y + j, x1 - rnd(0, 6), y + j + rnd(-3, 3), rnd(-4, 4), 14), w, col, { prof: 'even', nb: o.nb ?? 4, a, rough: o.rough ?? .18 }));
  }
}
// Catmull-Rom through control points → a smooth centre-line with `per` samples per span
export function smooth(P, per = 6) {
  const out = [];
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
    for (let j = 0; j < per; j++) {
      const t = j / per, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map(k => .5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)));
    }
  }
  out.push(P[P.length - 1]);
  return out;
}
// a flat wash: the same polygon in `passes` jittered passes (edges pool where passes disagree),
// then a faint darker rim. Rasterised to a sprite {cv,x0,y0,x1,y1}; optional blur for blooms.
export function washSprite(pts, col, a = .5, o = {}) {
  const passes = o.passes ?? 3, jit = o.jit ?? 4, blur = o.blur ?? 0, pad = 12 + blur * 3;
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  x0 = Math.floor(x0 - pad); y0 = Math.floor(y0 - pad); x1 = Math.ceil(x1 + pad); y1 = Math.ceil(y1 + pad);
  const cv = document.createElement('canvas'); cv.width = x1 - x0; cv.height = y1 - y0;
  const c = cv.getContext('2d'); c.translate(-x0, -y0); if (blur) c.filter = `blur(${blur}px)`;
  for (let p = 0; p < passes; p++) {
    c.beginPath(); pts.forEach(([x, y], i) => { const xx = x + rnd(-jit, jit), yy = y + rnd(-jit, jit); i ? c.lineTo(xx, yy) : c.moveTo(xx, yy); });
    c.closePath(); c.fillStyle = rgba(col, a / passes * 1.5); c.fill();
  }
  if (o.rim ?? true) { c.filter = 'none'; const R = mk([...pts, pts[0]], o.rimW ?? 2.2, col, { prof: 'even', nb: 0, a: a * .55, rough: .5 }); drawS(c, R); }
  return { cv, x0, y0, x1, y1 };
}
export const circlePts = (cx, cy, rx, ry = rx, n = 48, wob = .04) => Array.from({ length: n }, (_, i) => {
  const a = i / n * Math.PI * 2, r = 1 + wob * (vnoise(i * .7 + cx * .01) * 2 - 1); return [cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r];
});
// reveal a sprite with a wavy brush-edge wipe; dir 'x' = left→right, 'y' = top→bottom
export function reveal(c, sp, p, dir = 'x', seed = 0) {
  if (p <= 0) return; if (p >= 1) { c.drawImage(sp.cv, sp.x0, sp.y0); return; }
  const w = sp.x1 - sp.x0, h = sp.y1 - sp.y0, pe = eio(p);
  c.save(); c.beginPath();
  if (dir === 'x') {
    const e = sp.x0 + (w + 60) * pe - 30; c.moveTo(sp.x0 - 1, sp.y0);
    for (let i = 0; i <= 16; i++) { const y = sp.y0 + h * i / 16; c.lineTo(e + 22 * (vnoise(i * .8 + seed) - .5), y); }
    c.lineTo(sp.x0 - 1, sp.y1);
  } else {
    const e = sp.y0 + (h + 60) * pe - 30; c.moveTo(sp.x0, sp.y0 - 1);
    for (let i = 0; i <= 16; i++) { const x = sp.x0 + w * i / 16; c.lineTo(x, e + 22 * (vnoise(i * .8 + seed) - .5)); }
    c.lineTo(sp.x1, sp.y0 - 1);
  }
  c.closePath(); c.clip(); c.drawImage(sp.cv, sp.x0, sp.y0); c.restore();
}
