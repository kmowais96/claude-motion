// Woodcut · shared pieces for sections 1 and 13: the copper lamp, carved text, bricks, cached layers.
import { clamp, mulberry, hash } from '/core/lib.js';
import * as WC from './engine.js';
import { W, H, IMG } from './print2d.js';
export { WC };

export const q12 = t => Math.floor(t * 12) / 12;           // on twos
export const dist = (x, y, F) => Math.hypot(x - F[0], y - F[1]);

// lamp-light falloff: 1 at the flame, 0 at radius R
export const lampTone = (F, R, k = 1.1, g = 1) => (x, y) => clamp(k * Math.pow(clamp(1 - dist(x, y, F) / R), g));

// ---------- the lantern (flame at F, scale s) ----------
export function lampBody(F, s, o = {}) {
  // a lantern: stepped foot, a small burner under the flame, two posts round the glass, a cap with a bail handle
  const [fx, fy] = F, P = (a, b) => [fx + a * s, fy + b * s];
  const foot = [P(-42, 64), P(42, 64), P(38, 54), P(32, 47), P(-32, 47), P(-38, 54)];
  const plate = [P(-36, 47), P(36, 47), P(36, 37), P(-36, 37)];
  const burner = [P(-16, 37), P(16, 37), P(11, 12), P(6, 7), P(-6, 7), P(-11, 12)];
  const posts = [-1, 1].map(d => [P(d * 36, 37), P(d * 30, 37), P(d * 30, -88), P(d * 36, -88)]);
  const cap = [P(-40, -88), P(40, -88), P(27, -103), P(-27, -103)];
  const dome = WC.spline([P(-24, -102), P(-17, -114), P(0, -120), P(17, -114), P(24, -102)], 3, true);
  const bail = [...WC.spline([P(-20, -108), P(-14, -132), P(0, -138), P(14, -132), P(20, -108)], 4), ...WC.spline([P(15, -108), P(10, -127), P(0, -132), P(-10, -127), P(-15, -108)], 4)];
  const L = WC.light(.75, -.55, .45), rv = o.reveal;
  const metal = WC.shape([foot, plate, burner, cap, dome], { light: L, sp: 3 * s, halo: 2.6 * s, R: 9 * s, dir: 0, seed: 41, lo: .3, hi: .9, reveal: rv });
  const bars = WC.shape([...posts, bail], { light: L, sp: 2.6 * s, halo: 2.2 * s, R: 4 * s, dir: Math.PI / 2, seed: 43, lo: .35, reveal: rv });
  // glints on the glass, carved, so the flame reads as behind a pane
  const glint = WC.cutAlong([P(-22, -80), P(-23, -30)], { w: 1.8 * s, kind: 'k', seg: [40, 120], seed: 44, reveal: rv && { t0: rv.t1 - .2, t1: rv.t1, speed: 600 } })
    .concat(WC.cutAlong([P(23, -76), P(22, -56)], { w: 1.3 * s, kind: 'k', seg: [20, 60], seed: 45, reveal: rv && { t0: rv.t1 - .2, t1: rv.t1, speed: 600 } }));
  return { draw(g, t, q = {}) { metal.draw(g, t, q); bars.draw(g, t, q); WC.drawStrokes(g, glint, { ...q, t }); }, occ: [foot, plate, burner, cap, dome, ...posts, bail] };
}

// flame: white teardrop + a black wick, boiling on twos. a = 0..1 (size, for lighting / dying)
export function flame(g, cp, t, F, s, a = 1) {
  if (a <= 0) return;
  const tq = q12(t), [fx, fy] = F;
  const sway = (Math.sin(tq * 7.1) + Math.sin(tq * 12.7 + 1) * .6) * 2.2 * s * a;
  const hgt = (40 + 5 * Math.sin(tq * 9.3) + 3 * Math.sin(tq * 23.1)) * s * a, wd = 9.5 * s * Math.sqrt(a);
  const path = gg => {
    gg.moveTo(fx + sway, fy - hgt);
    gg.bezierCurveTo(fx + sway * .4 + wd * .5, fy - hgt * .55, fx + wd * 1.15, fy - hgt * .18, fx + wd * .1, fy + 3 * s);
    gg.bezierCurveTo(fx - wd * 1.15, fy - hgt * .18, fx + sway * .4 - wd * .7, fy - hgt * .55, fx + sway, fy - hgt);
    gg.closePath();
  };
  g.fillStyle = '#fff'; g.beginPath(); path(g); g.fill();
  g.fillStyle = '#000'; g.beginPath(); g.ellipse(fx + .5 * s, fy - 1 * s, 2.2 * s * a, 6 * s * a, 0, 0, 7); g.fill();
  if (cp) { cp.fillStyle = '#000'; cp.beginPath(); path(cp); cp.fill(); }
}

// the black ground a flame needs to read (white on white is invisible)
export function flameRing(g, F, s, a = 1) {
  if (a <= 0) return;
  const [fx, fy] = F; g.fillStyle = '#000'; g.beginPath();
  g.moveTo(fx, fy - 66 * s); g.bezierCurveTo(fx + 14 * s, fy - 40 * s, fx + 22 * s, fy - 12 * s, fx + 12 * s, fy + 8 * s);
  g.bezierCurveTo(fx, fy + 14 * s, fx - 4 * s, fy + 14 * s, fx - 12 * s, fy + 8 * s);
  g.bezierCurveTo(fx - 22 * s, fy - 12 * s, fx - 14 * s, fy - 40 * s, fx, fy - 66 * s); g.fill();
}
// the lamp's light on the colour plate: copper falls off around the flame
export function lampLight(cp, F, r, a = 1) {
  if (a <= 0) return;
  const gr = cp.createRadialGradient(F[0], F[1] - r * .04, 0, F[0], F[1], r);
  gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(.22, `rgba(0,0,0,${.95 * a})`);
  gr.addColorStop(.55, `rgba(0,0,0,${.45 * a})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
  cp.fillStyle = gr; cp.fillRect(F[0] - r, F[1] - r, 2 * r, 2 * r);
}

// ---------- bricks: polygons with mortar gaps ----------
export function bricks(x0, y0, x1, y1, bw, bh, gap, seed = 1, skip = null) {
  const rnd = mulberry(seed), out = [];
  for (let r = 0, y = y0; y < y1; r++, y += bh) {
    const off = (r % 2) * bw * .5 - bw * .5;
    for (let x = x0 + off; x < x1; x += bw) {
      const a = Math.max(x0, x + gap * .5), b = Math.min(x1, x + bw - gap * .5), c0 = y + gap * .5, d = Math.min(y1, y + bh - gap * .5);
      if (b - a < 8 || d - c0 < 4) continue;
      if (skip && skip((a + b) / 2, (c0 + d) / 2)) continue;
      const j = () => (rnd() - .5) * 2.2;
      out.push([[a + j(), c0 + j()], [b + j(), c0 + j()], [b + j(), d + j()], [a + j(), d + j()]]);
    }
  }
  return out;
}
// per-brick tone wobble (stable): hash of the course/column cell
export const brickVar = (bw, bh, amp = .12) => (x, y) => (hash(Math.floor(x / bw) * 7.7 + Math.floor(y / bh) * 31.3) - .5) * 2 * amp;

// ---------- carved text: hatch the letters (merging cuts), then the clean letter follows the knife ----------
// o: { text, font, x, y, align, rtl, t0, t1, sp, angle, color('#fff' cut | '#000' leave) }
export function carveText(o) {
  const q = document.createElement('canvas').getContext('2d');
  q.font = o.font; q.direction = o.rtl ? 'rtl' : 'ltr';
  const mt = q.measureText(o.text), w = mt.width;
  const asc = mt.actualBoundingBoxAscent + 8, desc = mt.actualBoundingBoxDescent + 8;
  const al = o.align || 'center';
  const xl = al === 'center' ? o.x - w / 2 : al === 'right' ? o.x - w : o.x;
  const bbox = [xl - 10, o.y - asc, xl + w + 10, o.y + desc];
  const fillR = gg => { gg.font = o.font; gg.direction = o.rtl ? 'rtl' : 'ltr'; gg.textAlign = o.rtl ? 'right' : 'left'; gg.textBaseline = 'alphabetic'; gg.fillText(o.text, o.rtl ? xl + w : xl, o.y); };
  const reg = new WC.Region(q2 => fillR(q2), { res: 1, bbox, pad: 4 });
  const sp = o.sp ?? 4, span = bbox[2] - bbox[0];
  const key = o.rtl ? (x) => clamp((bbox[2] - x) / span) : (x) => clamp((x - bbox[0]) / span);
  const strokes = WC.hatch(reg, { dir: WC.dirAngle(o.angle ?? -1.05), tone: () => 1, sp, wmax: sp * 1.7, wmin: .5, lo: 0, hi: 1, kind: 'v', seed: o.seed ?? 5, seg: [20, 70], gap: [0, 1], minLen: 1,
    reveal: { t0: o.t0, t1: o.t1, key: (x, y) => key(x), speed: 700, jit: .03 } });
  const col = o.color || '#fff';
  return {
    bbox, strokes,
    draw(g, t) {
      WC.drawStrokes(g, strokes, { t, color: col });
      // the clean letter follows the knife a moment later
      const u = clamp((t - o.t0 - .12) / (o.t1 - o.t0));
      if (u <= 0) return;
      g.save(); g.beginPath();
      if (o.rtl) g.rect(bbox[2] - span * u, bbox[1] - 20, span * u + 20, bbox[3] - bbox[1] + 40);
      else g.rect(bbox[0] - 20, bbox[1] - 20, span * u + 20, bbox[3] - bbox[1] + 40);
      g.clip(); g.fillStyle = col; fillR(g); g.restore();
    },
  };
}

// a knife-cut double rule around a panel
export function border(x, y, w, h, o = {}) {
  const R = (a, b, cc, d) => [[a, b], [a + cc, b], [a + cc, b + d], [a, b + d]];
  return [
    ...WC.cutAlong(R(x, y, w, h), { closed: true, w: o.w ?? 4, kind: 'v', seg: [120, 300], gap: [0, 2], seed: 61, reveal: o.reveal }),
    ...WC.cutAlong(R(x + 14, y + 14, w - 28, h - 28), { closed: true, w: (o.w ?? 4) * .45, kind: 'k', seg: [80, 240], gap: [0, 3], seed: 62, reveal: o.reveal && { ...o.reveal, t0: o.reveal.t0 + .15, t1: o.reveal.t1 + .15 } }),
  ];
}

// ---------- cached full-carved mask layers (opaque, world coords = frame coords) ----------
const cache = new Map();
export function layer(key, drawFn) {
  if (cache.has(key)) return cache.get(key);
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, W, H); drawFn(g);
  cache.set(key, cv); return cv;
}
// A carved plate made of parts [{ draw(g, t, q), occ: polys|null }] (q = { after, view, fill }), drawn in order.
// Fast paths, all deterministic: once every cut is done → one cached layer; while carving at z ≤ 1.6 →
// a cached snapshot at the last half second + only the cuts still moving (later parts' silhouettes clip them);
// close-ups (z > 1.6) → vector, culled to the view, so the cuts stay sharp.
const snaps = new Map();
function snap(key, ts, fn) {
  const k = key + '@' + ts;
  if (snaps.has(k)) { const v = snaps.get(k); snaps.delete(k); snaps.set(k, v); return v; }
  let cv;
  if (snaps.size >= 4) { const old = snaps.keys().next().value; cv = snaps.get(old); snaps.delete(old); }
  else { cv = document.createElement('canvas'); cv.width = W; cv.height = H; }
  const g = cv.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#000'; g.fillRect(0, 0, W, H); fn(g);
  snaps.set(k, cv); return cv;
}
export function viewOf(cam) {
  const z = cam.z ?? 1, hw = IMG.w / 2 / z + 40, hh = IMG.h / 2 / z + 40, x = cam.x ?? 960, y = cam.y ?? 483;
  return [x - hw, y - hh, x + hw, y + hh];
}
export function carved(key, parts, tEnd, step = .5) {
  const occ = parts.map((p, i) => {
    const P = new Path2D(); P.rect(-2e4, -2e4, 5e4, 5e4); let any = false;
    for (let j = i + 1; j < parts.length; j++) for (const poly of parts[j].occ || []) { any = true; P.moveTo(...poly[0]); for (const pt of poly) P.lineTo(...pt); P.closePath(); }
    return any ? P : null;
  });
  return (g, t, cam = {}) => {
    const z = cam.z ?? 1, view = viewOf(cam);
    if (z > 1.6) { for (const p of parts) p.draw(g, t, { view }); return; }
    if (t >= tEnd) { g.drawImage(layer(key, gg => { for (const p of parts) p.draw(gg, 1e9, {}); }), 0, 0); return; }
    const ts = Math.floor(t / step) * step;
    g.drawImage(snap(key, ts, gg => { for (const p of parts) p.draw(gg, ts, {}); }), 0, 0);
    parts.forEach((p, i) => {
      if (occ[i]) { g.save(); g.clip(occ[i], 'evenodd'); }
      p.draw(g, t, { after: ts, view, fill: false });
      if (occ[i]) g.restore();
    });
  };
}

// handwriting (Urdu-like, right to left): word strokes along a line from (xr,y) to (xl,y) in a frame f(u,v)→[x,y]
export function scriptLine(f, v, ur, ul, seed, w = 3, ak = 1) {
  const rnd = mulberry(seed), words = []; let u = ur;
  while (u > ul + .03) {
    const len = Math.min(u - ul, .04 + rnd() * .09), pts = [], N = Math.ceil(len * 260);
    const ph = rnd() * 6, amp = (.006 + rnd() * .004) * ak;
    for (let i = 0; i <= N; i++) {
      const k = i / N, uu = u - len * k;
      const vv = v + Math.sin(k * 26 + ph) * amp * (.6 + .4 * Math.sin(k * 7 + ph)) - Math.max(0, Math.sin(k * 9 + ph * 2)) * amp * 1.2;
      pts.push(f(uu, vv));
    }
    const st = WC.mkStroke(pts, w, { kind: 'k', seed: rnd() * 1000, chip: .1 });
    st.u0 = u; st.u1 = u - len;
    const dots = [];
    if (rnd() < .7) { const du = u - len * (.2 + rnd() * .6), dv = v + (rnd() < .5 ? -1 : 1) * .016 * ak; dots.push(f(du, dv)); }
    words.push({ st, dots, u0: u, u1: u - len });
    u -= len + .012 + rnd() * .02;
  }
  return words;
}
// draw script words up to progress u (words ending right of u fully, the current one partially)
export function drawScript(g, words, uNow, w = 3) {
  g.fillStyle = '#000'; g.beginPath();
  for (const wd of words) {
    if (uNow >= wd.u0) break;
    const pr = clamp((wd.u0 - uNow) / (wd.u0 - wd.u1));
    WC.strokePath(g, wd.st, pr);
  }
  g.fill();
  for (const wd of words) {
    if (uNow > wd.u1) break;
    for (const d of wd.dots) { g.beginPath(); g.ellipse(d[0], d[1], w * .9, w * .65, .6, 0, 7); g.fill(); }
  }
}
// tip of the script at progress uNow
export function scriptTip(words, uNow, f, v) { return f(uNow, v); }
