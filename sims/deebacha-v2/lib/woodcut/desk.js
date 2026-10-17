// Woodcut · the desk close-up: the copper lamp at left, the page being written (Urdu runs right to left),
// the long shadow of a pen nib (no hand: the pen is above the frame), the manuscript stack at right.
// The plate arrives whole (a fresh impression); only the writing, the stack, the nib and the light move.
import { clamp, mulberry } from '/core/lib.js';
import { WC, lampTone, lampBody, flame, flameRing, lampLight, bricks, brickVar, dist, carved, scriptLine, drawScript, q12 } from './kit.js';

export const F2 = [430, 404], S2 = 2.5;
export const PAGE = [[640, 524], [1330, 510], [1410, 884], [586, 906]];
const DESK_Y = 472;
// page frame: u 0..1 left→right, v 0..1 top→bottom (bilinear)
export const pageAt = (u, v) => {
  const [a, b, c, d] = PAGE;
  const x0 = a[0] + (b[0] - a[0]) * u, y0 = a[1] + (b[1] - a[1]) * u, x1 = d[0] + (c[0] - d[0]) * u, y1 = d[1] + (c[1] - d[1]) * u;
  return [x0 + (x1 - x0) * v, y0 + (y1 - y0) * v];
};
export const LINES = 10;
const lineV = i => .1 + i * .085;

let B = null;
function build() {
  if (B) return B;
  const lt = lampTone(F2, 1300, 1.25, 1.6);
  const bw = 176, bh = 66, bv = brickVar(bw, bh, .1);
  const wall = WC.hatch(new WC.Region(bricks(20, 20, 1900, DESK_Y - 6, bw, bh, 11, 8), { res: 2 }), { dir: WC.dirAngle(0), tone: (x, y) => lt(x, y) * .9 + bv(x, y), sp: 10, wmax: 9, lo: .05, gamma: 1.3, seed: 51, seg: [50, 150], gap: [2, 7] });
  const edge = WC.cutAlong([[20, DESK_Y], [1900, DESK_Y - 8]], { w: (u, p) => 7 * lt(p[0], p[1]) + 1, kind: 'v', seed: 52 });
  // desk planks: horizontal grain, seams widening toward us
  const seams = [DESK_Y + 4, 560, 660, 780, 930, 1100], planks = [];
  for (let i = 0; i < seams.length - 1; i++) planks.push([[0, seams[i] + 4], [1920, seams[i] - 6], [1920, seams[i + 1] - 4], [0, seams[i + 1] - 4]]);
  const desk = WC.hatch(new WC.Region(planks, { res: 2 }), { dir: (x, y) => -.006 + Math.sin(x * .004 + y * .02) * .03, tone: (x, y) => lt(x, y) * .85, sp: 11, wmax: 9, lo: .04, gamma: 1.4, seed: 53, seg: [80, 260], gap: [3, 10] });
  const lamp = lampBody(F2, S2);
  const rays = WC.rays(F2[0], F2[1] - 46, { n: 72, r0: 110, r1: [240, 640], w: 15, kind: 'u', seed: 54, jit: .7 });
  const pageHalo = WC.cutAlong(WC.offsetPoly(PAGE, 5), { closed: true, w: 3, kind: 'k', seed: 55 });
  const parts = [
    { draw: (g, t, q) => { WC.drawStrokes(g, wall, { ...q, t }); WC.drawStrokes(g, edge, { ...q, t }); WC.drawStrokes(g, desk, { ...q, t }); } },
    { draw: (g, t, q) => WC.drawStrokes(g, rays, { ...q, t }) },
    { draw: (g, t, q) => { WC.drawStrokes(g, pageHalo, { ...q, t }); if (q.fill !== false) WC.fillPoly(g, [PAGE], '#fff'); } },
    { draw: (g, t, q) => lamp.draw(g, t, q), occ: lamp.occ },
  ];
  // the script, line by line (deterministic words)
  const lines = [];
  for (let i = 0; i < LINES; i++) lines.push(scriptLine(pageAt, lineV(i), .9, i === LINES - 1 ? .5 : .1, 300 + i * 17, 3.4, 2.2));
  B = { draw: carved('desk', parts, 0), lines };
  return B;
}

// stack of manuscript sheets: front face of sheet edges, top face of the last sheet. h in px, b = bookmark 0..1
function stack(g, h, bookmark, t) {
  if (h <= 0) return;
  const x0 = 1470, x1 = 1862, yb0 = 712, yb1 = 702, back = 128;
  const top = [[x0 + 30, yb0 - h - back], [x1 - 38, yb1 - h - back + 6], [x1, yb1 - h], [x0, yb0 - h]];
  const front = [[x0, yb0 - h], [x1, yb1 - h], [x1, yb1], [x0, yb0]];
  WC.fillPoly(g, [top, front], '#000', 'nonzero');
  // halo around the whole stack
  g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.moveTo(...top[0]); g.lineTo(...top[1]); g.lineTo(...top[2]); g.lineTo(x1, yb1); g.lineTo(x0, yb0); g.lineTo(...top[3]); g.closePath(); g.stroke();
  // top sheet: cut white, with a few faint lines of writing left in wood
  WC.fillPoly(g, [WC.offsetPoly(top, -3)], '#fff');
  g.strokeStyle = '#000'; g.lineWidth = 1.6;
  for (let i = 1; i < 6; i++) { const v = i / 6, l = [top[0][0] + (top[3][0] - top[0][0]) * v + 30, top[0][1] + (top[3][1] - top[0][1]) * v], r = [top[1][0] + (top[2][0] - top[1][0]) * v - 30, top[1][1] + (top[2][1] - top[1][1]) * v]; g.beginPath(); g.moveTo(...l); g.lineTo(r[0] - (i % 2) * 60, r[1]); g.stroke(); }
  // sheet edges on the front face: thin cuts, wider toward the lamp
  const n = Math.floor(h / 4.2), rnd = mulberry(7);
  g.fillStyle = '#fff'; g.beginPath();
  for (let i = 0; i < n; i++) {
    const f = (i + .5) / n, ya = yb0 - h + h * f, yb = yb1 - h + h * f, wd = 1.1 + rnd() * .9;
    const xs = x0 + 6 + rnd() * 20, xe = x1 - 10 - rnd() * 120;
    g.moveTo(xs, ya - wd); g.lineTo(xe, ya + (yb - ya) * (xe - x0) / (x1 - x0) - wd * .3); g.lineTo(xe, ya + (yb - ya) * (xe - x0) / (x1 - x0) + wd * .3); g.lineTo(xs, ya + wd);
  }
  g.fill();
  if (bookmark > 0) {   // a ribbon hanging over the front face, marked 12 (Surah Yusuf)
    const bx = 1700, by = yb1 - h + 2, L = 150 * clamp(bookmark * 1.4);
    g.fillStyle = '#000'; g.fillRect(bx - 32, by - 4, 64, L + 10);
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(bx - 26, by); g.lineTo(bx + 26, by); g.lineTo(bx + 26, by + L); g.lineTo(bx, by + L - 18); g.lineTo(bx - 26, by + L); g.closePath(); g.fill();
    if (bookmark > .75) { g.fillStyle = '#000'; g.font = '44px "IM Fell English"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('12', bx, by + 62); }
  }
  return [x0, yb0 - h - back, x1, yb0];
}

// o: { cam, lamp 0..1, write (lines written, float), nib bool, stackH, bookmark 0..1, dark 0..1 (inked back in), bars 0..1 }
export function drawDesk(g, cp, t, o = {}) {
  const D = build(), la = o.lamp ?? 1;
  D.draw(g, 1e9, o.cam || {});
  // the writing so far
  const wr = o.write ?? 0;
  for (let i = 0; i < LINES; i++) {
    if (wr <= i) break;
    const L = D.lines[i], uEnd = L[L.length - 1].u1, uNow = .9 - (.9 - uEnd) * clamp(wr - i);
    drawScript(g, L, uNow, 3.4);
  }
  if (o.stackH) stack(g, o.stackH, o.bookmark ?? 0, t);
  if (o.bars) barShadows(g, o.bars, o.stackH);
  if (o.dark) inkBack(g, o.dark);
  // the nib's shadow at the writing point
  if (o.nib && wr < LINES) {
    const i = Math.floor(wr), L = D.lines[i], uEnd = L[L.length - 1].u1, uNow = .9 - (.9 - uEnd) * clamp(wr - i);
    const tq = q12(t), lift = (Math.sin(tq * 31) * .5 + .5) * 4;
    nibShadow(g, pageAt(uNow, lineV(i) - .004), lift, o.nibOff ?? 0);
  }
  flameRing(g, F2, S2, la); flame(g, cp, t, F2, S2, la);
  if (cp) lampLight(cp, F2, 520 * la, la);
}

// a long, thin shadow from the nib tip toward the upper right (lamp at left, pen above the frame)
export function nibShadow(g, P, lift = 0, off = 0) {
  const dx = .62, dy = -.785, nx = -dy, ny = dx, L = 1500;
  const x = P[0] + dx * (lift + off), y = P[1] + dy * (lift + off);
  g.fillStyle = '#000'; g.beginPath();
  g.moveTo(x, y);
  g.lineTo(x + dx * 70 + nx * 7, y + dy * 70 + ny * 7);
  g.lineTo(x + dx * 150 + nx * 9, y + dy * 150 + ny * 9);
  g.lineTo(x + dx * L + nx * 24, y + dy * L + ny * 24);
  g.lineTo(x + dx * L - nx * 20, y + dy * L - ny * 20);
  g.lineTo(x + dx * 150 - nx * 8, y + dy * 150 - ny * 8);
  g.lineTo(x + dx * 70 - nx * 6, y + dy * 70 - ny * 6);
  g.closePath(); g.fill();
  // the slit of the nib, a hair of light down the shadow's centre
  g.strokeStyle = '#fff'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x + dx * 12, y + dy * 12); g.lineTo(x + dx * 46, y + dy * 46); g.stroke();
}

// shadows of the window bars laid across page and stack (moonlight), k = 0..1 how far they have fallen
function barShadows(g, k, stackH) {
  g.save(); g.beginPath();
  WC.pathOf(g, PAGE);
  g.clip();
  g.fillStyle = '#000';
  for (let i = 0; i < 5; i++) {
    const x = 520 + i * 230, w = 46;
    g.beginPath(); g.moveTo(x, 300); g.lineTo(x + w, 300); g.lineTo(x + w + 380 * k, 300 + 700 * k); g.lineTo(x + 380 * k, 300 + 700 * k); g.closePath(); g.fill();
  }
  g.restore();
}

// the lamp goes out: ink rolls back in from the flame outward (a ragged front), the page stays pale
function inkBack(g, k) {
  if (k <= 0) return;
  const R = 2300 * k, rnd = mulberry(3);
  g.save(); g.fillStyle = '#000'; g.beginPath();
  for (let i = 0; i <= 72; i++) {
    const a = i / 72 * Math.PI * 2, r = R * (1 + .08 * Math.sin(a * 7 + 1) + .05 * (rnd() - .5));
    const x = F2[0] + Math.cos(a) * r, y = F2[1] + Math.sin(a) * r * .8;
    i ? g.lineTo(x, y) : g.moveTo(x, y);
  }
  g.closePath();
  // keep the page: punch it out of the ink (it holds the moonlight)
  WC.pathOf(g, [...PAGE].reverse());
  g.fill('evenodd'); g.restore();
}
