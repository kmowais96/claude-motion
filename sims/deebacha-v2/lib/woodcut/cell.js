// Woodcut · the cell, wide plate: brick wall lit by one lamp, a small barred window high up, a low desk,
// a page and a small manuscript stack, a water pot, stone floor. World coords = frame coords.
// Every piece is carved on a local clock u (seconds from the first knife cut).
import { clamp } from '/core/lib.js';
import { WC, lampTone, lampBody, flame, flameRing, lampLight, bricks, brickVar, dist, carved } from './kit.js';

export const LS = 1.45;                      // lamp scale in the wide plate
export const F = [690, 540];                 // the flame
export const WIN = [1262, 132, 1436, 338];   // window opening x0,y0,x1,y1
const FLOOR = 692;
export const CELL_END = 7.8;                 // u at which every cut is done

const S = (list, extra = {}) => (g, t, q) => WC.drawStrokes(g, list, { ...q, t, ...extra });

let B = null;
function build() {
  if (B) return B;
  const lt = lampTone(F, 920, 1.2, 1.75);
  // --- wall
  const inWin = (x, y) => x > WIN[0] - 26 && x < WIN[2] + 26 && y > WIN[1] - 26 && y < WIN[3] + 30;
  const bw = 112, bh = 46, bv = brickVar(bw, bh, .1);
  const wallP = bricks(30, 30, 1890, FLOOR, bw, bh, 8, 3, inWin);
  const wall = WC.hatch(new WC.Region(wallP, { res: 2 }), { dir: WC.dirAngle(0), tone: (x, y) => lt(x, y) + bv(x, y), sp: 7.5, wmax: 7, lo: .06, hi: .95, gamma: 1.3, seed: 5, seg: [40, 120], gap: [2, 6], jit: .05,
    reveal: { t0: 2.0, t1: 7.2, key: (x, y) => clamp(dist(x, y, F) / 1250), speed: 700, jit: .06 } });
  // --- window: night sky in horizontal sweeps, brighter toward the sill; stab-cut stars; bars left in wood
  const [a, b, cc, d] = WIN;
  const sky = WC.hatch(new WC.Region([[[a, b], [cc, b], [cc, d], [a, d]]], { res: 2 }), { dir: WC.dirAngle(0), tone: (x, y) => .05 + .95 * clamp((y - b) / (d - b)) ** 1.6, sp: 8, wmax: 9, lo: .3, hi: .95, kind: 'u', seed: 9, seg: [60, 200],
    reveal: { t0: 5.4, t1: 6.6, key: (x, y) => 1 - (y - b) / (d - b), speed: 900 } });
  const stars = WC.flecks([[1279, 150, 3.2], [1318, 172, 2.6], [1354, 146, 3.4], [1392, 182, 2.4], [1424, 156, 2.8], [1300, 196, 2.2], [1410, 210, 2]], { seed: 4 });
  stars.forEach((s, i) => { s.t0 = 6.5 + i * .07; s.dur = .06; });
  const emb = [
    ...WC.cutAlong([[a - 18, d + 14], [cc + 18, d + 14]], { w: 6, kind: 'v', seed: 12, reveal: { t0: 5.2, t1: 5.6, speed: 900 } }),
    ...WC.cutAlong([[a - 18, b - 18], [cc + 18, b - 18], [cc + 18, d + 14], [a - 18, d + 14]], { closed: true, w: 2.2, kind: 'k', seed: 13, reveal: { t0: 5.0, t1: 5.6, speed: 1200 } }),
    ...[0, 1, 2, 3].map(i => WC.mkStroke([[a - 10, d + 22 + i * 4], [cc + 10, d + 22 + i * 4]], 2 - i * .3, { kind: 'k', seed: 70 + i, t0: 5.3 + i * .05, dur: .2 })),
  ];
  const bars = [0, 1, 2, 3].map(i => { const x = a + (i + 1) * (cc - a) / 5; return [[x - 6, b - 4], [x + 6, b - 4], [x + 6, d + 4], [x - 6, d + 4]]; });
  bars.push([[a - 4, (b + d) / 2 - 5], [cc + 4, (b + d) / 2 - 5], [cc + 4, (b + d) / 2 + 5], [a - 4, (b + d) / 2 + 5]]);
  // --- floor: flags in perspective, cuts converge to the vanishing point
  const VP = [960, 380], flags = [];
  const xs = [-900, -420, 60, 520, 980, 1440, 1900, 2380, 2860], ys = [FLOOR + 6, 742, 812, 930];
  const at = (xb, y) => VP[0] + (xb - VP[0]) * (y - VP[1]) / (930 - VP[1]);
  for (let j = 0; j < ys.length - 1; j++) for (let i = 0; i < xs.length - 1; i++) {
    const y0 = ys[j] + 3, y1 = ys[j + 1] - 3;
    flags.push([[at(xs[i], y0) + 4, y0], [at(xs[i + 1], y0) - 4, y0], [at(xs[i + 1], y1) - 4, y1], [at(xs[i], y1) + 4, y1]]);
  }
  const flt = lampTone([720, 760], 1000, 1.0, 1.4);
  const floor = WC.hatch(new WC.Region(flags, { res: 2 }), { dir: WC.dirRadial(...VP), tone: flt, sp: 8, wmax: 7, lo: .04, gamma: 1.5, seed: 15, seg: [30, 90],
    reveal: { t0: 3.4, t1: 7.0, key: (x, y) => clamp(dist(x, y, [760, 760]) / 1100), speed: 700 } });
  const skirting = WC.cutAlong([[30, FLOOR], [1890, FLOOR]], { w: (u, p) => 4 * lt(p[0], p[1] - 40) + .3, kind: 'v', seed: 16, reveal: { t0: 3.0, t1: 6.0, speed: 900 } });
  // --- desk (low), page, small stack
  const top = [[470, 606], [1330, 606], [1362, 656], [440, 656]];
  const apron = [[440, 656], [1362, 656], [1362, 690], [440, 690]];
  const legs = [[[452, 690], [492, 690], [494, 792], [452, 792]], [[1312, 690], [1352, 690], [1354, 792], [1312, 792]]];
  const dRev = { t0: 2.2, t1: 4.4, key: (x, y) => clamp(dist(x, y, F) / 700), speed: 800 };
  const deskTop = WC.shape([top], { tone: () => (x, y) => lt(x, y) * .62, sp: 6, wmax: 4.5, lo: .12, dir: 0, halo: 4, seed: 21, reveal: dRev });
  const deskApron = WC.shape([apron], { tone: () => (x, y) => lt(x, y) * .4, sp: 6, lo: .15, dir: 0, halo: 3, seed: 22, reveal: dRev });
  const deskLegs = WC.shape(legs, { tone: () => (x, y) => lt(x, y) * .5, sp: 5, lo: .2, dir: Math.PI / 2, halo: 3, seed: 23, reveal: dRev });
  const page = [[792, 614], [1078, 611], [1100, 650], [776, 652]];
  const pageHalo = WC.cutAlong(WC.offsetPoly(page, 3), { closed: true, w: 2, kind: 'k', seed: 24, reveal: { t0: 2.6, t1: 3.0, speed: 1500 } });
  const pageCut = WC.hatch(new WC.Region([page], { res: 1 }), { dir: WC.dirAngle(0), tone: () => 1, sp: 3, wmax: 5, lo: 0, hi: 1, seed: 25, seg: [40, 120], gap: [0, 1],
    reveal: { t0: 2.6, t1: 3.2, key: (x, y) => clamp((x - 776) / 330), speed: 1200 } });
  const pl = (u, v) => [776 + 16 * (1 - v) + (302 + 6 * v) * u, 614 + 37 * v - 3 * u];
  const writing = [.2, .36, .52, .68, .84].map((v, i) => WC.mkStroke([pl(.9, v), pl(.1 + (i === 4 ? .45 : 0), v)], 1.7, { kind: 'k', seed: 80 + i, t0: 3.1 + i * .08, dur: .2 }));
  const stTop = [[1170, 580], [1296, 578], [1306, 596], [1162, 598]];
  const stack = [
    ...WC.hatch(new WC.Region([stTop], { res: 1 }), { dir: WC.dirAngle(0), tone: () => .9, sp: 3, wmax: 4, lo: 0, hi: 1, seed: 26, gap: [0, 1], reveal: { t0: 3.0, t1: 3.5, key: x => (x - 1160) / 150, speed: 900 } }),
    ...[0, 1, 2, 3, 4, 5].map(i => WC.mkStroke([[1165, 601 + i * 3], [1303, 599 + i * 3]], 1.3, { kind: 'k', seed: 90 + i, t0: 3.4 + i * .04, dur: .15 })),
  ];
  const stackHalo = WC.cutAlong([...stTop.slice(0, 2), [1306, 616], [1162, 618]], { closed: true, w: 2, kind: 'k', seed: 27, reveal: { t0: 3.0, t1: 3.4, speed: 1500 } });
  // --- water pot, right corner (lit from the lamp, on the left)
  const pot = WC.spline([[1600, 700], [1640, 706], [1668, 740], [1662, 790], [1630, 816], [1580, 816], [1550, 790], [1544, 740], [1572, 706]], 3, true);
  const potS = WC.shape([pot], { light: WC.light(-.85, -.35, .5), sp: 5, halo: 3, R: 45, seed: 31, lo: .3, amb: 0, reveal: { t0: 5.0, t1: 6.4, key: (x, y) => (1680 - x) / 140, speed: 600 } });
  const potMouth = WC.cutAlong(WC.ellipse(1606, 703, 26, 6, 30), { closed: true, w: 2, kind: 'k', seed: 32, reveal: { t0: 6.2, t1: 6.5, speed: 600 } });
  // --- lamp and its carved light
  const lamp = lampBody(F, LS, { reveal: { t0: 1.0, t1: 2.4, key: (x, y) => clamp(dist(x, y, F) / 200), speed: 400 } });
  const rays = WC.rays(F[0], F[1] - 26, { n: 64, r0: 46, r1: [110, 330], w: 9, kind: 'u', seed: 7, jit: .7, reveal: { t0: .35, t1: 1.9, jit: .4 } });

  const parts = [
    { draw: (g, t, q) => { S(wall)(g, t, q); S(skirting)(g, t, q); S(floor)(g, t, q); } },
    { draw: (g, t, q) => { S(emb)(g, t, q); S(sky)(g, t, q); S(stars)(g, t, q); if (q.fill !== false && t > 5.3) WC.fillPoly(g, bars, '#000', 'nonzero'); }, occ: bars },
    { draw: S(rays) },
    { draw: (g, t, q) => { potS.draw(g, t, q); S(potMouth)(g, t, q); }, occ: [pot] },
    { draw: (g, t, q) => { deskLegs.draw(g, t, q); deskApron.draw(g, t, q); deskTop.draw(g, t, q); }, occ: [top, apron, ...legs] },
    { draw: (g, t, q) => { S(pageHalo)(g, t, q); S(pageCut)(g, t, q); S(writing, { color: '#000' })(g, t, q); S(stackHalo)(g, t, q); S(stack)(g, t, q); } },
    { draw: (g, t, q) => lamp.draw(g, t, q), occ: lamp.occ },
  ];
  B = { draw: carved('cell', parts, CELL_END) };
  return B;
}

// draw the cell into mask g / plate cp at local carve time u. o: { lamp (0..1), cam }
export function drawCell(g, cp, u, t, o = {}) {
  build().draw(g, u, o.cam || {});
  const la = o.lamp ?? clamp(u / .3);
  flameRing(g, F, LS, la);
  flame(g, cp, t, F, LS, la);
  if (cp) lampLight(cp, F, 210 * la, la);
}
