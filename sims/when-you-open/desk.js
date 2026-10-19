// The reader's desk, in knife paint: a dim cool room, an arched window, a closed mushaf on a cloth.
// Two plates: the room (always there) and the sun patch (laid in stroke by stroke as the light arrives).
// Units: DW x DH; the camera stays inside (zoom >= 0.96).
import { Ref, paintRef } from './engine/plate.js';
import { P, E, lin, rad } from './engine/common.js';

export const DW = 2000, DH = 1130;
export const BOOK = { c: [1162, 826], quad: [[960, 745], [1360, 740], [1405, 905], [925, 915]] };
// the window projected onto the desk by a low morning sun (window plane -> desk plane, an affine shear)
export const proj = (x, y) => [420 + (x - 420) * 2.2 + (560 - y) * 2.3 + 270, 710 + (560 - y) * .75];
export const SUN_FROM = proj(420, 560);      // where the patch starts (under the window)
const archPts = (i) => { const out = [[610 - i, 560], [230 + i, 560], [230 + i, 300]]; for (let k = 1; k <= 12; k++) { const u = k / 12, v = 1 - u; out.push([v * v * (230 + i) + 2 * v * u * (230 + i) + u * u * 420, v * v * 300 + 2 * v * u * (150 + i * .6) + u * u * (110 + i)]); } for (let k = 1; k <= 12; k++) { const u = k / 12, v = 1 - u; out.push([v * v * 420 + 2 * v * u * (610 - i) + u * u * (610 - i), v * v * (110 + i) + 2 * v * u * (150 + i * .6) + u * u * 300]); } return out; };
export const PATCH = archPts(24).map(([x, y]) => proj(x, y));
// the lattice bars, projected (their shadows cut through the patch)
const BARS = () => { const b = []; for (const x of [357, 483]) b.push([[x - 6, 110], [x + 6, 110], [x + 6, 560], [x - 6, 560]]); for (const y of [380, 470]) b.push([[230, y - 6], [610, y - 6], [610, y + 6], [230, y + 6]]); return b.map(q => q.map(([x, y]) => proj(x, y))); };
export const NICHE = [1640, 250];   // the wall niche with the unlit oil lamp

const ARCH = (c, i = 0) => { c.moveTo(230 + i, 560); c.lineTo(230 + i, 300); c.quadraticCurveTo(230 + i, 150 + i * .6, 420, 110 + i); c.quadraticCurveTo(610 - i, 150 + i * .6, 610 - i, 300); c.lineTo(610 - i, 560); c.closePath(); };
// top of the inner arch at x (sampled from the two quadratics)
function archTop(x, i) {
  const half = x < 420, p0 = half ? [230 + i, 300] : [610 - i, 300], p1 = half ? [230 + i, 150 + i * .6] : [610 - i, 150 + i * .6], p2 = [420, 110 + i];
  let best = 300, bd = 1e9;
  for (let k = 0; k <= 200; k++) { const u = k / 200, v = 1 - u, px = v * v * p0[0] + 2 * v * u * p1[0] + u * u * p2[0], py = v * v * p0[1] + 2 * v * u * p1[1] + u * u * p2[1]; if (Math.abs(px - x) < bd) { bd = Math.abs(px - x); best = py; } }
  return best;
}

// lit = false: the dim room; lit = true: the same objects in sunlight (used only inside PATCH)
function drawRoom(R, lit, open = false) {
  const k = lit ? 1 : 0;
  // wall
  R.fill(P([[0, 0], [DW, 0], [DW, 660], [0, 660]]), lin(0, 0, DW, 0, lit ? [[0, '#e0b27a'], [1, '#c58f5a']] : [[0, '#80694f'], [.3, '#6c5744'], [1, '#3c3029']]), { dir: 90, fallback: 90, group: 'wall', maxR: 46, detail: 1.5 });
  R.tint(P([[0, 0], [DW, 0], [DW, 660], [0, 660]]), rad(420, 360, 40, 900, [[0, 'rgba(230,200,150,.28)'], [1, 'rgba(230,200,150,0)']]));
  if (!lit) {
    // an arched niche with a small clay oil lamp (unlit): the lamp of later scenes
    const [nx, ny] = NICHE;
    R.fill(c => { c.moveTo(nx - 90, ny + 230); c.lineTo(nx - 90, ny + 40); c.quadraticCurveTo(nx - 90, ny - 50, nx, ny - 80); c.quadraticCurveTo(nx + 90, ny - 50, nx + 90, ny + 40); c.lineTo(nx + 90, ny + 230); c.closePath(); }, lin(0, ny - 80, 0, ny + 230, [[0, '#251d18'], [1, '#3a2e26']]), { dir: 90, group: 'niche', maxR: 14, detail: 1.8 });
    R.fill(P([[nx - 104, ny + 230], [nx + 104, ny + 230], [nx + 112, ny + 248], [nx - 112, ny + 248]]), '#6b5a48', { dir: 0, group: 'nsill', maxR: 6 });
    R.fill(c => { c.moveTo(nx - 46, ny + 230); c.quadraticCurveTo(nx - 40, ny + 196, nx, ny + 194); c.quadraticCurveTo(nx + 52, ny + 196, nx + 70, ny + 206); c.lineTo(nx + 40, ny + 230); c.closePath(); }, '#7a4e33', { dir: 0, group: 'lampclay', maxR: 6, detail: 2 });
  }
  // floor strip behind the desk
  R.fill(P([[0, 660], [DW, 660], [DW, 702], [0, 702]]), lit ? '#7a5236' : '#241c18', { dir: 0, group: 'floor', maxR: 14 });
  if (!lit) {
    // window: frame, morning sky, sill, lattice
    R.fill(c => ARCH(c), '#33281f', { dir: 'edge', group: 'frame', maxR: 10, detail: 2 });
    R.fill(c => ARCH(c, 24), lin(0, 120, 0, 560, [[0, '#b9c2c0'], [.6, '#d8c9a6'], [1, '#e6c896']]), { dir: 80, group: 'sky', maxR: 22, detail: 1.4 });
    for (const x of [357, 483]) { const top = archTop(x, 24); R.fill(P([[x - 5, top], [x + 5, top], [x + 5, 560], [x - 5, 560]]), '#2e241c', { dir: 90, group: 'bar' + x, maxR: 4 }); }
    for (const y of [380, 470]) R.fill(P([[254, y - 5], [586, y - 5], [586, y + 5], [254, y + 5]]), '#2e241c', { dir: 0, group: 'barh' + y, maxR: 4 });
    // eight-pointed star at the apex
    R.fill(c => { const cx = 420, cy = 225, r1 = 34, r2 = 16; for (let j = 0; j < 16; j++) { const a = j * Math.PI / 8 - Math.PI / 2, r = j % 2 ? r2 : r1; j ? c.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r) : c.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } c.closePath(); }, '#2e241c', { dir: 'edge', group: 'star', maxR: 5 });
    R.fill(P([[200, 560], [640, 560], [664, 594], [176, 594]]), '#8b8170', { dir: 0, group: 'sill', maxR: 12 });
  }
  // desk top
  R.fill(P([[260, 690], [1840, 690], [2060, DH], [-60, DH]]), lin(0, 690, 0, DH, lit ? [[0, '#d8aa72'], [1, '#c48c56']] : [[0, '#5e412c'], [1, '#3b281c']]), { dir: 2, fallback: 0, group: 'desk', maxR: 34, detail: 1.4, aj: .2 });
  R.fill(P([[260, 690], [1840, 690], [1846, 700], [254, 700]]), lit ? '#e8b47a' : '#77583e', { dir: 0, group: 'deskedge', maxR: 4 });
  // cloth under the book
  R.fill(P([[880, 765], [1450, 755], [1525, 990], [840, 1005]]), lit ? '#b65a44' : '#4e2a28', { dir: 3, group: 'cloth', maxR: 18, detail: 1.6 });
  R.fill(P([[840, 985], [1520, 970], [1525, 990], [840, 1005]]), lit ? '#d9aa5c' : '#6a5130', { dir: 1, group: 'clothband', maxR: 5 });
  if (open) drawOpen(R, lit); else {
  // the closed mushaf: page block, spine, cover, gold frame and medallion (no lettering)
  const q = BOOK.quad;
  R.fill(P([q[3], q[2], [1405, 936], [925, 947]]), lit ? '#efe0bb' : '#8c8270', { dir: 1, group: 'pages', maxR: 6, detail: 2 });
  R.fill(P([[905, 912], [945, 742], [960, 745], [925, 915], [925, 947], [905, 943]]), lit ? '#2f5440' : '#1c2a24', { dir: 'edge', group: 'spine', maxR: 6 });
  R.fill(P(q), lit ? lin(960, 745, 1405, 905, [[0, '#3f7055'], [1, '#2f5944']]) : '#22342c', { dir: 2, group: 'cover', maxR: 20, detail: 1.8 });
  const ins = (f) => q.map(([x, y]) => [x + (BOOK.c[0] - x) * f, y + (BOOK.c[1] - y) * f]);
  R.line(P(ins(.14)), lit ? '#e6be62' : '#6d6038', 5, { dir: 'edge', group: 'gframe', maxR: 3 });
  R.fill(E(BOOK.c[0], BOOK.c[1], 74, 46, -.02), lit ? '#e2b85a' : '#6f6136', { dir: 'edge', group: 'med', maxR: 8, detail: 2.2 });
  R.fill(E(BOOK.c[0], BOOK.c[1], 50, 30, -.02), lit ? '#2b5240' : '#1b2a22', { dir: 'edge', group: 'medin', maxR: 6, detail: 2.2 });
  R.fill(c => { const [cx, cy] = BOOK.c; for (let j = 0; j < 16; j++) { const a = j * Math.PI / 8, r = j % 2 ? 11 : 24; const x = cx + Math.cos(a) * r * 1.5, y = cy + Math.sin(a) * r * .95; j ? c.lineTo(x, y) : c.moveTo(x, y); } c.closePath(); }, lit ? '#f0cf74' : '#706238', { dir: 'edge', group: 'medstar', maxR: 4, detail: 2.4 });
  }
}
const lerp2 = (a, b, f) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];

export function buildRoom(seed = 3, open = false) {
  const R = new Ref(DW, DH, 1); drawRoom(R, false, open);
  const st = paintRef(R, { R: [44, 22, 11, 5.5, 2.8], T: 12, seed });
  return { strokes: st, ref: R };
}

// sun patch: the lit room clipped to PATCH; each stroke appears when the light reaches it
export function buildSun(speed = 95, seed = 5, open = false) {
  const R = new Ref(DW, DH, 1);
  for (const x of [R.ctx, R.idc]) { x.save(); x.beginPath(); P(PATCH)(x); for (const b of BARS()) P(b)(x); x.clip('evenodd'); }
  drawRoom(R, true, open);
  for (const x of [R.ctx, R.idc]) x.restore();
  const st = paintRef(R, { R: [30, 15, 7.5, 3.8], T: 11, seed, app: (x, y) => Math.hypot(x - SUN_FROM[0], (y - SUN_FROM[1]) * 1.6) / speed });
  return { strokes: st, ref: R };
}

// the reader's right forearm and hand from above and behind, pointing left (rotate with M); origin at the fingertips
export const HW = 900, HH = 520, HOX = 120, HOY = 260;
export function buildHand(seed = 9) {
  const R = new Ref(HW, HH, 1), o = ([x, y]) => [x + HOX, y + HOY];
  const pts = a => P(a.map(o));
  // sleeve (dark wool), widening out of frame to the right
  R.fill(pts([[196, -52], [760, -96], [780, 150], [196, 50]]), lin(HOX + 196, 0, HOX + 780, 0, [[0, '#454b57'], [1, '#2a2e36']]), { dir: 4, group: 'sleeve', maxR: 22, detail: 1.4 });
  R.fill(pts([[186, -54], [214, -55], [218, 52], [186, 50]]), '#575e6b', { dir: 88, group: 'cuff', maxR: 7 });
  // back of the hand: wrist to knuckles, a little narrower at the wrist
  R.fill(pts([[192, -40], [150, -46], [96, -44], [84, -30], [82, 30], [96, 42], [150, 40], [192, 36]]), lin(HOX + 80, 0, HOX + 190, 0, [[0, '#c29274'], [1, '#a57759']]), { dir: 2, group: 'hand', maxR: 12, detail: 1.8 });
  // four fingers, gently curled, small gaps between them
  [[-30, 9.5, 74], [-10, 10, 86], [10, 10, 82], [29, 9, 66]].forEach(([y, w, L], j) => {
    const x0 = 92, x1 = x0 - L;
    R.fill(pts([[x0, y - w], [x1 + 14, y - w * .9], [x1 + 2, y - w * .45], [x1, y + w * .2], [x1 + 8, y + w * .85], [x0, y + w]]), j % 2 ? '#b68769' : '#c4967a', { dir: 2, group: 'f' + j, maxR: 5, detail: 2 });
  });
  // thumb on the near side, tucked
  R.fill(pts([[160, 34], [118, 52], [86, 62], [78, 54], [104, 40], [140, 30]]), '#b0836a', { dir: 20, group: 'thumb', maxR: 6, detail: 2 });
  // knuckle highlights
  [[-30], [-10], [10], [29]].forEach(([y], j) => R.fill(E(HOX + 96, HOY + y, 7, 5), '#d6a88a', { dir: 90, group: 'k' + j, maxR: 3 }));
  const st = paintRef(R, { R: [20, 10, 5, 2.6], T: 11, seed });
  return { strokes: st, ref: R };
}

// the open mushaf: two pages in a gold-ruled frame; the text is only soft grey bands at this distance (no letterforms)
export const SPINE = [[1162, 742], [1166, 918]];
export const LPAGE = [[878, 758], [1162, 742], [1166, 918], [858, 930]], RPAGE = [[1162, 742], [1448, 750], [1488, 912], [1166, 918]];
function pageArt(R, q, lit, side, grp) {
  const qp = (u, v) => { const t = [q[0][0] + (q[1][0] - q[0][0]) * u, q[0][1] + (q[1][1] - q[0][1]) * u], b = [q[3][0] + (q[2][0] - q[3][0]) * u, q[3][1] + (q[2][1] - q[3][1]) * u]; return [t[0] + (b[0] - t[0]) * v, t[1] + (b[1] - t[1]) * v]; };
  R.fill(P(q), lit ? '#f4e6c4' : '#9d9480', { dir: 2, group: grp, maxR: 9, detail: 2 });
  R.line(P([qp(.1, .1), qp(.9, .1), qp(.9, .9), qp(.1, .9)]), lit ? '#c99a3e' : '#6d6040', 3, { dir: 'edge', group: grp + 'f', maxR: 2 });
  R.fill(P([qp(.12, .12), qp(.88, .12), qp(.88, .2), qp(.12, .2)]), lit ? '#3f7a62' : '#3c4a40', { dir: 2, group: grp + 'h', maxR: 3 });
  for (let k = 0; k < 11; k++) { const v = .27 + k * .057; R.fill(P([qp(.15, v), qp(.85, v), qp(.85, v + .016), qp(.15, v + .016)]), lit ? 'rgba(120,104,84,.85)' : 'rgba(80,74,64,.9)', { dir: 2, group: grp + 'l' + k, maxR: 2, len: .6 }); }
}
function drawOpen(R, lit) {
  R.fill(P([[858, 930], [1488, 912], [1490, 926], [856, 944]]), lit ? '#e9d9b2' : '#8a8170', { dir: 1, group: 'pblock', maxR: 4 });
  R.fill(P([[836, 940], [858, 930], [878, 758], [866, 760]]), lit ? '#2f5440' : '#1c2a24', { dir: 'edge', group: 'lcov', maxR: 4 });
  R.fill(P([[1448, 750], [1462, 752], [1508, 914], [1488, 912]]), lit ? '#2f5440' : '#1c2a24', { dir: 'edge', group: 'rcov', maxR: 4 });
  pageArt(R, LPAGE, lit, -1, 'lp'); pageArt(R, RPAGE, lit, 1, 'rp');
  R.line(P([SPINE[0], SPINE[1], [SPINE[1][0] + 1, SPINE[1][1]]]), lit ? 'rgba(150,120,80,.9)' : 'rgba(60,54,46,.9)', 5, { dir: 'edge', group: 'gutter', maxR: 3 });
}
// one right-hand page as its own plate, for the page turn (local = plate units)
export function buildPage(lit = true, seed = 21) {
  const R = new Ref(DW, DH, 1); pageArt(R, RPAGE, lit, 1, 'tp');
  return { strokes: paintRef(R, { R: [9, 4.5, 2.4], T: 10, seed }), ref: R };
}
