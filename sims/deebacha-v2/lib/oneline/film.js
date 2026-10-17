// Sections 6–8 are one line: the pen touches down in section 6 and never lifts until the end of 8.
// Every new sheet (the shell lays one between sections) starts exactly where the pen rests.
// Coordinates are paper units; each section is drawn in its own local frame, shifted so it starts
// at the pen's last point. Time windows come from the sentence timings (T), never fixed seconds.
import { vnoise, hash, clamp, lerp, ss } from '/core/lib.js';
import { headAt, posAt } from './geom.js';
import { prepare, drawLine, drawBlots } from './ink.js';
import { makePaper, drawPaper, vignette, makeTooth, drawTooth } from './paper.js';
import { camAt, worldToScreen, BASE } from './cam.js';
import { penShadow } from './hands.js';

const W = 1920, H = 1080, TAU = Math.PI * 2, D2R = Math.PI / 180;

// ---------------------------------------------------------------- path builder (dense, ~1 unit)
class PB {
  constructor() { this.X = []; this.Y = []; this.R = []; this.segs = []; this.ox = 0; this.oy = 0; this.rt = 0; }
  get n() { return this.X.length; }
  get cur() { return [this.X[this.n - 1] - this.ox, this.Y[this.n - 1] - this.oy]; }   // local
  idx() { return this.n - 1; }
  _p(x, y) { this.X.push(x); this.Y.push(y); this.R.push(this.rt); }
  start(x, y) { this._p(x + this.ox, y + this.oy); return this; }
  // shift the local frame so that local (x,y) is where the pen is now
  anchor(x, y) { this.ox = this.X[this.n - 1] - x; this.oy = this.Y[this.n - 1] - y; }
  to(x, y) {   // world point, sampled at ≤ 1 unit
    const x0 = this.X[this.n - 1], y0 = this.Y[this.n - 1], d = Math.hypot(x - x0, y - y0), k = Math.ceil(d);
    for (let i = 1; i <= k; i++) this._p(lerp(x0, x, i / k), lerp(y0, y, i / k));
  }
  L(x, y) { this.to(x + this.ox, y + this.oy); return this; }
  Lr(x, y) { this.rt = 1; this.L(x, y); this.rt = 0; return this; }      // along a line already drawn
  C(x1, y1, x2, y2, x, y) {
    const [x0, y0] = this.cur, len = Math.hypot(x1 - x0, y1 - y0) + Math.hypot(x2 - x1, y2 - y1) + Math.hypot(x - x2, y - y2), k = Math.max(2, Math.ceil(len / 1.5));
    for (let i = 1; i <= k; i++) { const u = i / k, v = 1 - u; this.L(v * v * v * x0 + 3 * v * v * u * x1 + 3 * v * u * u * x2 + u * u * u * x, v * v * v * y0 + 3 * v * v * u * y1 + 3 * v * u * u * y2 + u * u * u * y); }
    return this;
  }
  poly(pts) { for (const p of pts) this.L(p[0], p[1]); return this; }
  thru(pts) {   // Catmull-Rom through the current point and pts
    const P = [this.cur, ...pts];
    for (let i = 0; i < P.length - 1; i++) {
      const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
      this.C(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
    }
    return this;
  }
  arc(cx, cy, r, a0, a1) {   // degrees, y down
    this.L(cx + r * Math.cos(a0 * D2R), cy + r * Math.sin(a0 * D2R));
    const k = Math.max(4, Math.ceil(Math.abs(a1 - a0) * D2R * r / 1.5));
    for (let i = 1; i <= k; i++) { const a = lerp(a0, a1, i / k) * D2R; this.L(cx + r * Math.cos(a), cy + r * Math.sin(a)); }
    return this;
  }
  // go over points already drawn, from index i to index j (either direction): invisible, fast
  over(i, j) { const s = j >= i ? 1 : -1; for (let k = i + s; s > 0 ? k <= j : k >= j; k += s) { this.X.push(this.X[k]); this.Y.push(this.Y[k]); this.R.push(1); } return this; }
  back(i) { return this.over(this.idx(), i); }
  // close a time window: points since the last window are drawn between t0 and t1
  win(id, t0, t1, o = {}) { const a = this.segs.length ? this.segs[this.segs.length - 1].b : 0; this.segs.push({ id, a, b: this.idx(), t: [t0, t1], style: o.style || 'main', slowK: o.slowK ?? 2.2, sec: this.sec }); }
}

// ---------------------------------------------------------------- writing marks
// "Arabic" row: a prolate cycloid, loops of varying size, a slow drift (x0 → x1, either way)
function arabicRow(pb, x0, x1, y, seed = 1, sc = 1) {
  const dir = Math.sign(x1 - x0), s = 5.6 * sc, len = Math.abs(x1 - x0), U = len / s;
  for (let u = 0.5; u <= U; u += 0.5) {
    const cyc = Math.floor(u / TAU), b = sc * (4 + 7.5 * hash(cyc * 3.1 + seed * 17));
    const env = clamp(u / 4) * clamp((U - u) / 4);
    const x = x0 + dir * (s * u - b * env * Math.sin(u)), yy = y - b * env * Math.cos(u) * .9 + 3 * sc * Math.sin(u * .31 + seed) + 2 * sc * env;
    pb.L(x, yy);
  }
  pb.L(x1, y);
}
// "translation" row: small, tight, with word gaps
function latinRow(pb, x0, x1, y, seed = 2, sc = 1) {
  const dir = Math.sign(x1 - x0), len = Math.abs(x1 - x0);
  for (let d = 0.6; d <= len; d += 0.6) {
    const word = Math.floor(d / 46), inw = d - word * 46, gap = inw > 38;
    const a = gap ? 0.3 : sc * (3.2 + 1.6 * hash(word + seed * 9)) * clamp(Math.min(d, len - d) / 6);
    pb.L(x0 + dir * d, y - Math.abs(Math.sin(d * 0.42 + seed)) * a * 1.7 + a * .4);
  }
  pb.L(x1, y);
}
// a smooth flowing wave
function flowRow(pb, x0, x1, y, amp, lam, ph = 0) {
  const dir = Math.sign(x1 - x0), len = Math.abs(x1 - x0);
  for (let d = 1; d <= len; d += 1) { const e = clamp(d / 25) * clamp((len - d) / 25); pb.L(x0 + dir * d, y + amp * e * Math.sin(TAU * d / lam + ph)); }
}
// a digit standing on (x, B), height h, as a point list beginning at its base
const DIG = {
  1: (x, B, h) => [[x, B], [x, B - h], [x - .28 * h, B - .72 * h]],
  2: (x, B, h) => [[x, B], [x + .32 * h, B], [x - .32 * h, B], [x + .2 * h, B - .52 * h], [x + .3 * h, B - .78 * h], [x + .02 * h, B - h], [x - .27 * h, B - .82 * h]],
  3: (x, B, h) => [[x, B], [x + .27 * h, B - .14 * h], [x + .25 * h, B - .4 * h], [x - .04 * h, B - .52 * h], [x + .24 * h, B - .66 * h], [x + .22 * h, B - .9 * h], [x - .02 * h, B - h], [x - .26 * h, B - .86 * h]],
  4: (x, B, h) => [[x + .14 * h, B], [x + .14 * h, B - h], [x - .32 * h, B - .3 * h], [x + .34 * h, B - .3 * h]],
};
const SMOOTH_DIG = { 2: 3, 3: 1 };   // from which point on the digit is a curve
function digit(pb, d, x, B, h) {
  const P = DIG[d](x, B, h), i0 = pb.idx();
  pb.L(P[0][0], P[0][1]);
  const m = pb.idx(), cut = SMOOTH_DIG[d] ?? 99;
  for (let i = 1; i < P.length; i++) { if (i >= cut) { pb.thru(P.slice(i)); break; } pb.L(P[i][0], P[i][1]); }
  pb.back(m);   // retrace down to where it began
  return i0;
}
// question mark: hook then stem, dot as a small loop on the stem; (x, B) is the bottom of the dot
function qmark(pb, x, B, h) {
  pb.L(x, B); const m = pb.idx(), r = .075 * h;
  pb.arc(x, B - r, r, 90, 450); pb.L(x, B - .3 * h);
  pb.thru([[x + .02 * h, B - .46 * h], [x + .26 * h, B - .62 * h], [x + .3 * h, B - .86 * h], [x + .06 * h, B - h], [x - .18 * h, B - .95 * h], [x - .3 * h, B - .78 * h]]);
  pb.back(m);
}
// concentric arcs, one after another, joined by small hairpin turns at alternate ends
function arcRun(pb, cx, cy, list) {   // list: [[r, a0, a1], ...]
  const pol = (r, d) => [cx + r * Math.cos(d * D2R), cy + r * Math.sin(d * D2R)];
  list.forEach(([r, a0, a1], k) => {
    if (k === 0 && list.skipFirst) return;
    if (k) {
      const [rp, , b] = list[k - 1], sg = Math.sign(b - list[k - 1][1]), tx = -Math.sin(b * D2R) * sg, ty = Math.cos(b * D2R) * sg;
      const P0 = pol(rp, b), P3 = pol(r, a0), hh = Math.abs(r - rp) * .7;
      pb.C(P0[0] + tx * hh, P0[1] + ty * hh, P3[0] + tx * hh, P3[1] + ty * hh, P3[0], P3[1]);
    }
    pb.arc(cx, cy, r, a0, a1);
  });
}

// ---------------------------------------------------------------- the three sections
function sec6(pb, T) {
  const a = T.at, e = T.end; pb.sec = 6;
  // flow: one long wave across the top of the sheet, curling down into the book's corner
  pb.start(-820, -340);
  for (let x = -819; x <= 600; x++) { const u = x + 820; pb.L(x, -340 + 34 * ss(u / 220) * Math.sin(TAU * u / 330)); }
  pb.C(700, -330, 420, -300, 420, -210);
  pb.win('flow', a(0) - .3, e(0) + .25, { slowK: 1.2 });
  // the open book: outline, spine
  pb.L(420, 190); const iBR = pb.idx();
  pb.C(280, 198, 140, 196, 0, 182); const iSB = pb.idx();
  pb.C(-140, 196, -280, 198, -420, 190); pb.L(-420, -210);
  pb.C(-280, -218, -140, -216, 0, -200); const iST = pb.idx();
  pb.C(140, -216, 280, -218, 420, -210); pb.back(iST); pb.L(0, -160);
  pb.win('book', e(0) + .3, a(1) + 1.6, { slowK: 1.4 });
  // left page: interlinear — a looped line above, a small tight line under it
  for (const [n, y] of [-160, -40, 80].entries()) {
    pb.L(-28, y); arabicRow(pb, -28, -392, y, 3 + n);
    pb.C(-406, y, -406, y + 34, -392, y + 34); latinRow(pb, -392, -28, y + 34, 5 + n);
    if (n < 2) pb.C(-14, y + 34, -14, y + 120, -28, y + 120);
  }
  pb.L(0, 116); pb.L(0, -160);
  pb.win('interlinear', a(1) + 1.65, e(1) + .1, { slowK: .9 });
  // right page: text above, a rule across the middle, notes in the lower half
  pb.L(28, -160); arabicRow(pb, 28, 392, -160, 9);
  pb.C(406, -160, 406, -95, 392, -95); arabicRow(pb, 392, 28, -95, 10);
  pb.C(14, -95, 14, -30, 28, -30); pb.L(392, -30);
  pb.C(406, -30, 406, 10, 392, 10); latinRow(pb, 392, 28, 10, 11, .8);
  pb.C(14, 10, 14, 45, 28, 45); latinRow(pb, 28, 392, 45, 12, .8);
  pb.C(406, 45, 406, 80, 392, 80); latinRow(pb, 392, 28, 80, 13, .8);
  pb.L(0, 116); pb.L(0, 182); pb.over(iSB, iBR);
  pb.win('half', e(1) + .15, e(2) + .15, { slowK: .9 });
  // straight through: a wave that keeps hitting the margin and being sent back
  pb.L(900, 190); pb.L(900, -130);
  for (let r = 0; r < 3; r++) { const y = -130 + r * 80; flowRow(pb, 900, 1300, y, 20, 200, 0); if (r < 2) pb.L(900, y + 80); }
  pb.L(1300, 190);
  pb.win('breaks', a(3) - .1, e(3) + .2, { slowK: 2.6 });
  // English: every verse in its own box, each with a number
  pb.L(1600, 190);
  const box = (x0, first, d) => {
    if (first) { pb.L(x0 + 200, 190); pb.L(x0 + 200, 60); pb.L(x0, 60); pb.L(x0, 190); pb.Lr(x0, 125); }
    else { pb.L(x0, 190); pb.L(x0 + 200, 190); pb.L(x0 + 200, 60); pb.L(x0, 60); pb.L(x0, 125); }
    flowRow(pb, x0, x0 + 200, 125, 13, 100, 0);
    const cx = x0 + 250; pb.L(cx - 28, 125); pb.arc(cx, 125, 28, 180, 450); const ib = pb.idx();
    digit(pb, d, cx, 138, 26); pb.back(ib); pb.rt = 1; pb.arc(cx, 125, 28, 90, 0); pb.rt = 0;   // the quarter back to the right is a retrace
    if (d < 3) pb.L(x0 + 300, 125);
  };
  box(1600, true, 1); box(1900, false, 2); box(2200, false, 3);
  pb.C(2482, 140, 2490, 190, 2520, 190);
  pb.win('boxes', a(4) - .1, e(5) + .05, { slowK: 1.4 });
  // a beautiful flourish, written right to left
  pb.L(3500, 190); pb.C(3540, 190, 3530, 90, 3480, 72);
  pb.win('ruled', e(5) + .1, a(6) - .05, { slowK: 1 });
  { const s = 21, U = 860 / s;
    for (let u = 0.25; u <= U; u += 0.25) {
      const f = u / U, b = 6 + 32 * Math.pow(Math.sin(Math.PI * f), .6) * (0.75 + 0.5 * vnoise(u / 3));
      pb.L(3480 - s * u - .55 * b * Math.sin(u), 80 - 1.3 * b * Math.cos(u) + 34 * Math.sin(u * .17 + .4) * Math.sin(Math.PI * f));
    } }
  pb.C(2585, 110, 2592, 178, 2620, 190);
  pb.win('flourish', a(6) - .02, a(6) + (e(6) - a(6)) * .72, { slowK: 1.2 });
  // ...and number its sentences: cut, number, cut, number
  const B = 190, cuts = [2835, 3050, 3265], nums = [2727, 2942, 3157, 3372];
  for (let k = 0; k < 4; k++) {
    pb.Lr(nums[k], B); digit(pb, k + 1, nums[k], B, 34);
    if (k < 3) { pb.Lr(cuts[k], B); const m = pb.idx(); pb.L(cuts[k], -140); pb.back(m); }
  }
  pb.win('numbered', a(6) + (e(6) - a(6)) * .74, e(7) - .5, { slowK: 1.2 });
  pb.blots = [{ k: pb.idx(), t0: e(7) - .45, dur: 2.2, r: 6.5 }];
}

function sec7(pb, T) {
  const a = T.at, e = T.end; pb.sec = 7;
  pb.anchor(-980, 300);
  // a closed printed book, standing
  pb.L(-962, 300); pb.L(-962, 20); pb.L(-980, 20); pb.L(-980, 300); pb.Lr(-962, 300);
  pb.L(-780, 300); pb.L(-780, 20); pb.L(-962, 20); pb.Lr(-780, 20);
  pb.L(-750, -4); pb.L(-950, -4); pb.L(-980, 20); pb.Lr(-950, -4); pb.Lr(-750, -4);
  pb.L(-750, 276); pb.L(-780, 300); pb.Lr(-750, 276); pb.Lr(-750, -4);
  pb.win('book', a(0) - .1, a(1) - .1, { slowK: 1.6 });
  // ...that opens into speech: a voice wave, in bursts, that runs on and then comes down
  { const C = [[-750, -4], [-735, -150], [-690, -330], [-560, -460], [-300, -500], [0, -490], [220, -465], [320, -405], [290, -350], [140, -330], [-120, -340], [-300, -345], [-390, -330], [-415, -300], [-415, -290]];
    const tmp = new PB(); tmp.start(...C[0]); tmp.thru(C.slice(1));
    const N = tmp.n, S = [0]; for (let i = 1; i < N; i++) S.push(S[i - 1] + Math.hypot(tmp.X[i] - tmp.X[i - 1], tmp.Y[i] - tmp.Y[i - 1]));
    const L = S[N - 1], bursts = [[.06, .17], [.25, .37], [.45, .56], [.64, .74], [.81, .9]];
    for (let i = 1; i < N; i++) {
      const f = S[i] / L; let amp = 1.5;
      for (const [p, q] of bursts) amp += 19 * Math.pow(Math.sin(Math.PI * clamp((f - p) / (q - p))), 1.4) * (0.75 + 0.5 * vnoise(S[i] / 30));
      amp *= clamp(f / .02) * clamp((1 - f) / .03);
      const j = Math.min(N - 1, i + 1), dx = tmp.X[j] - tmp.X[i - 1], dy = tmp.Y[j] - tmp.Y[i - 1], l = Math.hypot(dx, dy) || 1;
      const o = amp * Math.sin(TAU * S[i] / 24);
      pb.L(tmp.X[i] - dy / l * o, tmp.Y[i] + dx / l * o);
    } }
  pb.win('voice', a(1) - .05, a(4) + (e(4) - a(4)) * .5, { slowK: .5 });
  // the minbar: finial, dome, canopy, back, steps — empty
  pb.L(-415, -240); const iApex = pb.idx();
  pb.C(-440, -228, -478, -190, -470, -140); pb.back(iApex);
  pb.C(-390, -228, -352, -190, -360, -140); pb.L(-470, -140); pb.Lr(-460, -140);
  pb.L(-460, 300); pb.L(-100, 300);
  const iSt0 = pb.idx(); let sx = -100, sy = 300;
  for (let k = 0; k < 6; k++) { sy -= 50; pb.L(sx, sy); sx -= 45; pb.L(sx, sy); }
  const iSt1 = pb.idx();
  pb.L(-460, 0); pb.Lr(-370, 0); pb.L(-370, -140); const iTop = pb.idx(); pb.Lr(-360, -140);
  pb.win('minbar', a(4) + (e(4) - a(4)) * .52, a(4) + (e(4) - a(4)) * .9, { slowK: 1.8 });
  // the khutbah: voice arcs from the empty canopy
  const cx = -415, cy = -70, A = (r, d) => [cx + r * Math.cos(d * D2R), cy + r * Math.sin(d * D2R)];
  const iA0 = pb.idx();
  arcRun(pb, cx, cy, [[100, -45, 30], [160, 30, -45], [220, -45, 30]]);
  const iA1 = pb.idx();
  pb.win('khutbah', a(4) + (e(4) - a(4)) * .9, e(4) + .15, { slowK: 1.2 });
  // on paper: back to the book (along lines already there), the objection, then the answer
  pb.back(iTop); pb.Lr(-370, 0); pb.Lr(-460, 0); pb.Lr(-460, 300); pb.L(-780, 300); pb.Lr(-962, 300); pb.Lr(-962, 70);
  pb.win('to-paper', a(5) - .1, a(6) - .05, { slowK: .5 });
  latinRow(pb, -962, -868, 70, 21, 1.1); qmark(pb, -846, 70, 40);
  pb.win('objection', a(6), a(6) + (e(6) - a(6)) * .5, { slowK: 1.2 });
  pb.C(-822, 70, -800, 96, -800, 120); latinRow(pb, -800, -958, 120, 22, 1.1); pb.L(-962, 120);
  pb.win('answer', a(6) + (e(6) - a(6)) * .52, e(6) + .1, { slowK: 1.2 });
  // in a speech the objectors are right there: question marks standing on the ground
  pb.Lr(-962, 300); pb.Lr(-780, 300); pb.Lr(-100, 300);
  for (const x of [120, 270, 420]) {
    pb.L(x, 300); const m = pb.idx();
    pb.arc(x, 290, 7, 90, 450); pb.L(x, 250);
    pb.thru([[x, 234], [x + 22, 220], [x + 26, 196], [x + 8, 178], [x - 14, 180], [x - 24, 196]]);
    pb.back(m);
  }
  pb.L(520, 300);
  pb.win('objectors', a(7) - .3, e(7) + .1, { slowK: 1.3 });
  // so the answer simply comes: the minbar's voice reaches out to them
  pb.Lr(-100, 300); pb.over(iSt0, iSt1); pb.Lr(-370, -140); pb.Lr(-360, -140); pb.over(iA0, iA1);
  arcRun(pb, cx, cy, Object.assign([[220, -45, 30], [290, 30, -25], [370, -25, 30], [450, 30, -25], [530, -25, 44.3]], { skipFirst: true })); pb.L(-36, 300);
  pb.win('answered', a(8) - .4, e(8) + .1, { slowK: 1 });
  // on paper you must describe the setting: more lines on the cover
  pb.Lr(-780, 300); pb.Lr(-962, 300); pb.Lr(-962, 170);
  latinRow(pb, -962, -800, 170, 31, 1.1); pb.C(-788, 170, -788, 215, -800, 215);
  latinRow(pb, -800, -962, 215, 32, 1.1); pb.C(-974, 215, -974, 258, -962, 258);
  latinRow(pb, -962, -800, 258, 33, 1.1); pb.L(-780, 262); pb.Lr(-780, 300);
  pb.win('description', a(9) - .3, e(9) + .1, { slowK: 1 });
  // in a speech the setting is all around: a palm, houses, another palm, a dune
  const palm = (x, lean) => {
    const m = pb.idx(); pb.thru([[x - 6 + lean * .2, 230], [x - 2 + lean * .6, 160], [x + lean, 112]]); const c = pb.idx(); const [px, py] = pb.cur;
    for (const [tx, ty, mx, my] of [[-92, 26, -50, -22], [-60, -34, -30, -36], [58, -30, 30, -36], [94, 30, 52, -20], [10, -48, 4, -30]]) { pb.thru([[px + mx, py + my], [px + tx, py + ty]]); pb.back(c); }
    pb.back(m);
  };
  pb.Lr(-620, 300); palm(-620, 14); pb.Lr(520, 300);
  pb.L(600, 300); pb.L(600, 205); pb.L(700, 205); pb.L(700, 300); pb.Lr(700, 205); pb.L(700, 160); pb.L(790, 160); pb.L(790, 300);
  pb.L(870, 300); palm(870, -12); pb.L(940, 300); pb.thru([[1000, 262], [1060, 236], [1120, 262], [1180, 300]]);
  pb.win('setting', a(10) - .25, e(10) + .9, { slowK: 1.4 });
  // the people: one mark, then many, on a long ground
  const dot = x => { pb.L(x, 300); for (let k = 0; k <= 90; k++) { const u = k / 90, r = 15 * (1 - .72 * u), ang = Math.PI / 2 + u * 2.4 * TAU; pb.L(x + r * Math.cos(ang), 285 + r * Math.sin(ang)); } pb.L(x, 300); };
  pb.L(1300, 300); dot(1500); pb.L(1840, 300); for (const x of [1880, 1940, 2000, 2060, 2120]) dot(x); pb.L(2300, 300);
  pb.win('ground', e(10) + 1.0, a(11) + 1.1, { slowK: 1 });
  // the voice turns: one line that passes over him, comes back to him, sweeps to the many...
  const rib = (pts, amp = 4) => {   // a smooth line with a faint voice tremor
    const tmp = new PB(); tmp.start(...pb.cur); tmp.thru(pts); let s = 0;
    for (let i = 1; i < tmp.n; i++) { s += Math.hypot(tmp.X[i] - tmp.X[i - 1], tmp.Y[i] - tmp.Y[i - 1]); const j = Math.min(tmp.n - 1, i + 1), dx = tmp.X[j] - tmp.X[i - 1], dy = tmp.Y[j] - tmp.Y[i - 1], l = Math.hypot(dx, dy) || 1, o = amp * Math.sin(s / 7) * clamp(s / 30); pb.L(tmp.X[i] - dy / l * o, tmp.Y[i] + dx / l * o); }
    pb.L(...pts[pts.length - 1]);
  };
  rib([[2345, 250], [2335, 170], [2250, 118], [2050, 108], [1800, 128]]);
  pb.win('turns', a(11) + 1.15, a(12) - .05, { slowK: 1 });
  rib([[1620, 148], [1500, 158], [1410, 185]]);
  pb.win('about', a(12), a(12) + (e(12) - a(12)) * .45, { slowK: 1 });
  rib([[1400, 236], [1448, 262], [1496, 268]], 2);
  pb.win('to', a(12) + (e(12) - a(12)) * .5, e(12), { slowK: 1.2 });
  rib([[1600, 226], [1750, 212], [1880, 242], [2000, 250], [2140, 238]]);
  pb.win('many', a(13) - .1, e(13) + .2, { slowK: 1 });
  const t14 = f => a(14) + (e(14) - a(14)) * f;
  rib([[2195, 200], [2210, 158], [2176, 136], [2146, 164], [2176, 198], [2205, 228]], 2);
  pb.win('himself', t14(0), t14(.3), { slowK: 1.4 });
  { const ex = 2000, ey = 284, rx = 172, ry = 52; rib([[ex + rx, ey]], 1);
    for (let k = 1; k <= 90; k++) { const t = k / 90 * TAU; pb.L(ex + rx * Math.cos(-t), ey + ry * Math.sin(-t)); } }
  pb.win('group', t14(.33), t14(.64), { slowK: 1.2 });
  rib([[2240, 170], [2290, -60], [2280, -330], [2210, -480], [2100, -520], [2010, -485], [2000, -444]], 3);
  pb.win('rise', t14(.66), e(14) + .2, { slowK: .8 });
  // and sometimes Allah Himself speaks: the one gold stretch, radiating from above
  { const gx = 2000, gy = -440; pb.L(gx, gy);
    arcRun(pb, gx, gy, [[70, 25, 155], [140, 155, 25], [210, 25, 155], [280, 155, 25]]); }
  pb.win('gold', a(15) - .05, e(15) - .1, { style: 'gold', slowK: 1 });
  // heard aloud, this is beauty: the line comes down in one sweep
  pb.thru([[2380, -260], [2520, -60], [2610, 160], [2700, 285], [2800, 300]]);
  pb.win('beauty', a(16) - .1, e(16) + .3, { slowK: .8 });
  // on paper it can feel disconnected: two cliffs and a gap
  pb.L(3000, 300); const iF0 = pb.idx(); pb.L(3008, 340); const iFs = pb.idx();
  pb.poly([[2996, 380], [3012, 430], [3000, 480], [3015, 520], [3010, 560]]); const iF1 = pb.idx();
  pb.L(3330, 560); const iG0 = pb.idx();
  pb.poly([[3345, 520], [3336, 480], [3352, 430], [3342, 380], [3352, 340]]); const iGs = pb.idx(); pb.L(3360, 300); const iG1 = pb.idx();
  pb.L(3650, 300);
  pb.win('cliffs', a(17) - .2, e(17) + .2, { slowK: 1.6 });
  // only notes can help: three small note cards on the floor of the gap
  pb.back(iG0);
  for (const [x0, x1, sd] of [[3260, 3312, 41], [3186, 3240, 42], [3110, 3166, 43]]) {
    pb.Lr(x1, 560); pb.L(x1, 506); pb.L(x0, 506); pb.L(x0, 530); const m = pb.idx(); latinRow(pb, x0, x1 - 8, 530, sd, .7); pb.back(m); pb.L(x0, 560);
  }
  pb.Lr(3010, 560); pb.over(iF1, iF0);
  pb.win('notes', a(18) - .1, e(18) + .2, { slowK: 1.6 });
  // ...the gap closes: one slow bridge
  pb.thru([[3090, 266], [3180, 252], [3270, 266], [3360, 300]]); pb.Lr(3650, 300);
  pb.win('bridge', a(19) + .1, e(19) + .2, { slowK: 1 });
}

function sec8(pb, T) {
  const a = T.at, e = T.end; pb.sec = 8;
  pb.anchor(0, 0);
  const town = (x0, light) => {   // road to a horizon with houses; leaves the pen at the frame's left edge
    pb.Lr(x0 + 170, 0); pb.L(x0 + 220, -150); const iV = pb.idx(); pb.L(x0 + 270, 0); pb.back(iV);
    pb.poly([[x0 + 250, -150], [x0 + 250, -180], [x0 + 265, -196], [x0 + 280, -180], [x0 + 280, -150], [x0 + 300, -150], [x0 + 300, -206], [x0 + 336, -206], [x0 + 336, -150], [x0 + 356, -150], [x0 + 356, -176]]);
    pb.C(x0 + 356, -194, x0 + 386, -194, x0 + 386, -176); pb.poly([[x0 + 386, -150], [x0 + 440, -150]]);
    pb.back(iV);
    pb.poly([[x0 + 192, -150], [x0 + 192, -178], [x0 + 176, -194], [x0 + 160, -178], [x0 + 160, -150], [x0 + 136, -150], [x0 + 136, -196], [x0 + 96, -196], [x0 + 96, -150], [x0, -150]]);
  };
  const words = (x0, out) => { pb.L(x0 + 30, -262); arabicRow(pb, x0 + 30, x0 + 370, -262, 77, 1.2); if (out) pb.L(x0 + 440, -262); };
  const frame = x0 => { pb.L(x0, -320); pb.L(x0 + 440, -320); pb.L(x0 + 440, 0); pb.L(x0, 0); };
  // every surah came for a moment: a frame...
  frame(0);
  pb.win('frame1', a(0) - .4, e(0) + .2, { slowK: 1.4 });
  // ...with its background: a road, a town, and the words over it
  town(0); pb.win('scene1', a(1) - .1, a(1) + (e(1) - a(1)) * .72, { slowK: 1.2 });
  pb.Lr(0, -262); words(0, true);
  pb.win('words1', a(1) + (e(1) - a(1)) * .74, e(1) + .3, { slowK: 1 });
  // strip that away: the words alone, and a question
  pb.Lr(440, 0); pb.L(520, 0); frame(520); pb.Lr(520, -262); words(520, false);
  qmark(pb, 912, -262, 46);
  pb.win('stripped', a(2) - .2, e(2) + .1, { slowK: 1.2 });
  // some are understood upside down: the town hangs from its horizon
  pb.L(960, -262); pb.Lr(960, -150);
  { const x0 = 520, f = y => -300 - y;
    pb.poly([[x0 + 386, f(-150)], [x0 + 386, f(-176)]]); pb.C(x0 + 386, f(-194), x0 + 356, f(-194), x0 + 356, f(-176));
    pb.poly([[x0 + 356, f(-150)], [x0 + 336, -150], [x0 + 336, f(-206)], [x0 + 300, f(-206)], [x0 + 300, -150], [x0 + 280, -150], [x0 + 280, f(-180)], [x0 + 265, f(-196)], [x0 + 250, f(-180)], [x0 + 250, -150],
      [x0 + 192, -150], [x0 + 192, f(-178)], [x0 + 176, f(-194)], [x0 + 160, f(-178)], [x0 + 160, -150], [x0 + 136, -150], [x0 + 136, f(-196)], [x0 + 96, f(-196)], [x0 + 96, -150], [x0, -150]]); }
  pb.win('upside', a(3) - .3, e(3) + .1, { slowK: 1.2 });
  // a rendering should carry some of that background: drawn lightly, under the words
  pb.Lr(520, 0); pb.Lr(960, 0); pb.L(1040, 0); frame(1040);
  pb.win('frame3', e(3) + .25, a(4) + .9, { slowK: 1 });
  town(1040);
  pb.win('light', a(4) + .92, a(4) + (e(4) - a(4)) * .72, { style: 'light', slowK: .8 });
  pb.Lr(1040, -262); words(1040, true);
  pb.win('words3', a(4) + (e(4) - a(4)) * .73, e(4) + .25, { slowK: 1 });
}

// ---------------------------------------------------------------- timing
function timeAll(pb) {
  const N = pb.n, X = pb.X, Y = pb.Y, S = new Float64Array(N);
  for (let i = 1; i < N; i++) S[i] = S[i - 1] + Math.hypot(X[i] - X[i - 1], Y[i] - Y[i - 1]);
  const TURN = new Float64Array(N);
  for (let i = 6; i < N - 6; i++) {
    const d1 = Math.atan2(Y[i] - Y[i - 6], X[i] - X[i - 6]), d2 = Math.atan2(Y[i + 6] - Y[i], X[i + 6] - X[i]);
    let da = Math.abs(d2 - d1); if (da > Math.PI) da = TAU - da; TURN[i] = da;
  }
  const Tm = new Float64Array(N), SEG = new Int32Array(N);
  pb.segs.forEach((sg, si) => {
    const i0 = sg.a, i1 = sg.b, n = i1 - i0, K = sg.slowK;
    const w = new Float64Array(n + 1);
    for (let i = i0 + 1; i <= i1; i++) w[i - i0] = (S[i] - S[i - 1]) * (pb.R[i] ? .22 : 1) * (1 + K * Math.min(TURN[i] * 3.2, 3));
    const ws = new Float64Array(n + 1), R = 10;
    for (let j = 1; j <= n; j++) { let acc = 0, c = 0; for (let k = -R; k <= R; k++) { const q = j + k; if (q > 0 && q <= n) { const g = 1 - Math.abs(k) / (R + 1); acc += w[q] * g; c += g; } } ws[j] = acc / c; }
    let cum = 0; const tot = ws.reduce((x, y) => x + y, 0) || 1;
    for (let i = i0 + 1; i <= i1; i++) { cum += ws[i - i0]; Tm[i] = lerp(sg.t[0], sg.t[1], cum / tot); SEG[i] = si; }
    if (si === 0) { Tm[0] = sg.t[0]; SEG[0] = 0; }
  });
  for (let i = 1; i < N; i++) if (Tm[i] < Tm[i - 1]) Tm[i] = Tm[i - 1];
  const V = new Float64Array(N);
  for (let i = 1; i < N - 1; i++) { const dt = Tm[i + 1] - Tm[i - 1]; V[i] = dt > 1e-6 ? (S[i + 1] - S[i - 1]) / dt : 0; }
  V[0] = V[1]; V[N - 1] = V[N - 2];
  return { X: Float64Array.from(X), Y: Float64Array.from(Y), S, T: Tm, V, SEG, TURN, N, segs: pb.segs, R: Uint8Array.from(pb.R) };
}

// ---------------------------------------------------------------- cameras (local coords, shifted with each section)
function cams(T6, T7, T8, off7, off8) {
  const sh = (o, keys) => keys.map(k => ({ ...k, x: k.x + o[0], y: k.y + o[1] }));
  const a = T6.at, e = T6.end;
  const c6 = [
    { t: a(0) - 2, x: -800, y: -330, z: 2.4, f: 0 }, { t: a(0) - .2, x: -790, y: -330, z: 2.3, f: .1 },
    { t: e(0) - .4, x: -150, y: -260, z: 1.35, f: .55 }, { t: a(1) + .4, x: 0, y: -70, z: 1.34, f: 0 }, { t: e(2), x: 0, y: -70, z: 1.36, f: 0 },
    { t: a(3) + .2, x: 1150, y: 10, z: 1.45, f: .05 }, { t: e(3), x: 1155, y: 10, z: 1.47, f: .05 },
    { t: a(4) + .3, x: 2040, y: 110, z: 1.5, f: 0 }, { t: e(5) + .2, x: 2045, y: 110, z: 1.52, f: 0 },
    { t: a(6) - .1, x: 3050, y: 40, z: 1.28, f: 0 }, { t: e(7), x: 3050, y: 40, z: 1.34, f: 0 }, { t: e(7) + 3, x: 3050, y: 40, z: 1.38, f: 0 },
  ];
  const b = T7.at, d = T7.end, t4 = f => b(4) + (d(4) - b(4)) * f, t14 = f => b(14) + (d(14) - b(14)) * f;
  const c7 = sh(off7, [
    { t: b(0) - 2, x: -870, y: 150, z: 1.75, f: 0 }, { t: b(1) - .2, x: -860, y: 140, z: 1.6, f: 0 },
    { t: b(2) + .3, x: -330, y: -180, z: .9, f: 0 }, { t: t4(.45), x: -300, y: -170, z: .92, f: 0 },
    { t: t4(.55), x: -310, y: 40, z: 1.3, f: 0 }, { t: d(4) + .5, x: -300, y: 40, z: 1.32, f: 0 },
    { t: b(6) - .2, x: -870, y: 170, z: 1.85, f: 0 }, { t: d(6) + .1, x: -870, y: 170, z: 1.9, f: 0 },
    { t: b(7) + .2, x: -160, y: 10, z: .95, f: 0 }, { t: d(8) + .1, x: -150, y: 10, z: .96, f: 0 },
    { t: b(9) + .2, x: -870, y: 170, z: 1.85, f: 0 }, { t: d(9) + .1, x: -870, y: 170, z: 1.9, f: 0 },
    { t: b(10) + .1, x: 80, y: 20, z: .86, f: 0 }, { t: d(10) + .7, x: 90, y: 20, z: .87, f: 0 },
    { t: b(11) + .5, x: 1700, y: 200, z: 1.3, f: .4 }, { t: b(12) - .3, x: 1860, y: 205, z: 1.55, f: 0 }, { t: t14(.64), x: 1870, y: 205, z: 1.58, f: 0 },
    { t: d(14) - .2, x: 2060, y: -150, z: 1.0, f: .2 }, { t: b(15) - .1, x: 2000, y: -300, z: 1.15, f: 0 }, { t: d(15), x: 2000, y: -300, z: 1.2, f: 0 },
    { t: b(16) + .3, x: 2100, y: -60, z: .8, f: 0 }, { t: d(16) + .2, x: 2120, y: -50, z: .8, f: 0 },
    { t: b(17) + .2, x: 3190, y: 400, z: 1.3, f: 0 }, { t: d(19), x: 3190, y: 400, z: 1.42, f: 0 }, { t: d(19) + 3, x: 3190, y: 400, z: 1.44, f: 0 },
  ]);
  const g = T8.at, h = T8.end;
  const c8 = sh(off8, [
    { t: g(0) - 2, x: 220, y: -150, z: 2.3, f: 0 }, { t: h(1) + .2, x: 220, y: -150, z: 2.32, f: 0 },
    { t: g(2) + .1, x: 740, y: -150, z: 2.3, f: 0 }, { t: h(3) + .2, x: 740, y: -150, z: 2.32, f: 0 },
    { t: h(3) + .9, x: 1260, y: -150, z: 2.3, f: 0 },
    { t: h(4) - .45, x: 1260, y: -150, z: 2.3, f: 0 }, { t: h(4) + .55, x: 740, y: -150, z: 1.2, f: 0 }, { t: h(4) + 6, x: 740, y: -150, z: 1.17, f: 0 },
  ]);
  return { 6: c6, 7: c7, 8: c8 };
}

// ---------------------------------------------------------------- the film
const reg = {};
let F = null;
export function register(n, T) { reg[n] = T; }
function build() {
  const pb = new PB();
  sec6(pb, reg[6]); const blots = pb.blots; const e6 = [pb.X[pb.n - 1], pb.Y[pb.n - 1]];
  const r6 = [0, pb.idx()];
  sec7(pb, reg[7]); const off7 = [pb.ox, pb.oy]; const r7 = [r6[1], pb.idx()];
  sec8(pb, reg[8]); const off8 = [pb.ox, pb.oy]; const r8 = [r7[1], pb.idx()];
  const P = timeAll(pb); P.blots = blots.map(b => ({ ...b, sec: 6 })); prepare(P);
  const paper = makePaper(), tooth = makeTooth();
  F = { P, rng: { 6: r6, 7: r7, 8: r8 }, cams: cams(reg[6], reg[7], reg[8], off7, off8), paper, tooth };
  window.ONELINE = F;
}

export function renderSec(n, ctx, t) {
  if (!F) build();
  const { P, rng, paper, tooth } = F, [i0, i1] = rng[n];
  const cam = camAt(P, F.cams[n], t, W, H, [i0, i1]);
  const M = worldToScreen(cam, W, H);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  const pr = window.OLPROF, q = () => performance.now(); let t0 = q();
  drawPaper(ctx, paper, cam, W, H);
  if (pr) { ctx.getImageData(0, 0, 1, 1); pr.paper = (pr.paper || 0) + q() - t0; t0 = q(); }
  const head = clamp(headAt(P, t), i0, i1);
  if (head > i0 + 1) drawLine(ctx, P, head, M, cam.k, { from: i0 });
  if (pr) { ctx.getImageData(0, 0, 1, 1); pr.line = (pr.line || 0) + q() - t0; t0 = q(); }
  drawBlots(ctx, { ...P, blots: P.blots.filter(b => b.sec === n) }, t, M, cam.k);
  drawTooth(ctx, tooth, cam, W, H);
  vignette(ctx, W, H);
  if (pr) { ctx.getImageData(0, 0, 1, 1); pr.rest = (pr.rest || 0) + q() - t0; t0 = q(); }
  // the pen is never drawn, only its shadow; it hovers before the first touch and lifts after the last stroke
  const tip = M(...posAt(P, head));
  const tFirst = P.T[1], tLast = P.T[P.N - 1];
  let lift = 0;
  if (n === 6) lift = clamp((tFirst - t) / .8);
  if (n === 8) lift = ss((t - tLast - .6) / 1.2);
  const k = cam.k, ang = Math.atan2(.83, .56);
  penShadow(ctx, tip, [Math.cos(ang), Math.sin(ang)], k, { lift, alpha: 1 - (n === 8 ? ss((t - tLast - 1.4) / 1.2) : 0) });
  ctx.restore();
}

export function eventsSec(n) {
  if (!F) build();
  const { P } = F, ev = [];
  for (const sg of P.segs) if (sg.sec === n) {
    let L = 0; for (let i = sg.a + 1; i <= sg.b; i++) if (!P.R[i]) L += P.S[i] - P.S[i - 1];
    ev.push({ t: +sg.t[0].toFixed(3), type: 'nib', id: sg.id, dur: +(sg.t[1] - sg.t[0]).toFixed(3), speed: Math.round(L / Math.max(.1, sg.t[1] - sg.t[0])) });
    if (sg.style === 'gold') ev.push({ t: +sg.t[0].toFixed(3), type: 'light', dur: +(sg.t[1] - sg.t[0]).toFixed(3) });
  }
  if (n === 6) ev.unshift({ t: +P.T[1].toFixed(3), type: 'tap' });
  for (const b of P.blots) if (b.sec === n) ev.push({ t: +b.t0.toFixed(3), type: 'wash', dur: b.dur });
  return ev;
}
