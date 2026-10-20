// Every shape is the same number of points, so any shape can morph into any other.
// Coordinates are local: centred on 0,0 and kept within about ±320 px.
// No faces or figures: people in a story are a small circle at most.

export const N = 144;

type Pt = [number, number];
type Poly = {pts: Pt[]; closed?: boolean};
/** `brk[i]` lifts the pen before point i; an isolated point renders as a dot. */
export type Shape = {p: Pt[]; brk: boolean[]};

const TAU = Math.PI * 2;

const arc = (cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, steps = 64): Pt[] =>
  Array.from({length: steps + 1}, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / steps;
    return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
  });

const circle = (cx: number, cy: number, r: number): Poly => ({pts: arc(cx, cy, r, r, -Math.PI / 2, TAU - Math.PI / 2), closed: true});

const bezier = (a: Pt, b: Pt, c: Pt, d: Pt, steps = 32): Pt[] =>
  Array.from({length: steps + 1}, (_, i) => {
    const t = i / steps;
    const u = 1 - t;
    return [
      u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0],
      u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1],
    ];
  });

const seg = (...pts: Pt[]): Poly => ({pts});
const shift = (polys: Poly[], dx: number, dy: number, k = 1): Poly[] =>
  polys.map((q) => ({...q, pts: q.pts.map(([x, y]) => [x * k + dx, y * k + dy] as Pt)}));

const len = (pts: Pt[]) => pts.slice(1).reduce((a, p, i) => a + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);

/** Point at fraction f (0..1) of the way along a polyline. */
const along = (pts: Pt[], f: number): Pt => {
  const total = len(pts);
  let want = f * total;
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (want <= d || i === pts.length - 1) {
      const k = d ? Math.min(1, want / d) : 0;
      return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k];
    }
    want -= d;
  }
  return pts[pts.length - 1];
};

/** Spread N points over the polylines in proportion to their length. */
const resample = (polys: Poly[]): Shape => {
  const lens = polys.map((q) => Math.max(1, len(q.pts)));
  const total = lens.reduce((a, b) => a + b, 0);
  const counts = lens.map((l) => Math.max(2, Math.floor((l / total) * N)));
  let extra = N - counts.reduce((a, b) => a + b, 0);
  for (let i = 0; extra !== 0; i = (i + 1) % counts.length) {
    if (extra > 0) {
      counts[i]++;
      extra--;
    } else if (counts[i] > 2) {
      counts[i]--;
      extra++;
    }
  }
  const p: Pt[] = [];
  const brk: boolean[] = [];
  polys.forEach((q, j) => {
    for (let i = 0; i < counts[j]; i++) {
      p.push(along(q.pts, i / (counts[j] - 1)));
      brk.push(i === 0);
    }
  });
  return {p, brk};
};

const dots = (pts: Pt[]): Shape => ({p: pts, brk: pts.map(() => true)});

const rnd = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const door = (k = 1, dx = 0): Poly[] =>
  shift(
    [
      {pts: [[-140, 280], [-140, -100], ...arc(0, -100, 140, 140, Math.PI, TAU, 40), [140, 280]]},
      seg([-260, 280], [260, 280]),
    ],
    dx,
    0,
    k,
  );

const SHAPES: Record<string, () => Shape> = {
  spark: () => resample([circle(0, 0, 6)]),
  ring: () => resample([circle(0, 0, 250)]),
  orbit: () => resample([{pts: arc(0, 0, 310, 80, 0, TAU), closed: true}, circle(0, 0, 46)]),
  line: () => resample([seg([-320, 0], [320, 0])]),
  arcs: () =>
    resample([
      ...[110, 170, 230, 290].map((r) => ({pts: arc(0, 150, r, r, Math.PI, TAU, 48)})),
      seg([-320, 150], [320, 150]),
    ]),
  infinity: () =>
    resample([
      {
        pts: Array.from({length: 121}, (_, i) => {
          const t = (i / 120) * TAU;
          const d = 1 + Math.sin(t) ** 2;
          return [(330 * Math.cos(t)) / d, (330 * Math.sin(t) * Math.cos(t)) / d] as Pt;
        }),
        closed: true,
      },
    ]),
  door: () => resample(door()),
  doorOut: () => resample([...door(0.85, -80), circle(220, 250, 24)]),
  doorShut: () =>
    resample([...door(), seg([-90, 260], [-90, -60], [90, -60], [90, 260]), circle(100, 110, 8)]),
  threshold: () =>
    resample([...door(), seg([-90, 260], [-90, -60], [90, -60], [90, 260]), {pts: arc(0, 258, 56, 16, 0, TAU), closed: true}]),
  scatter: () => dots(Array.from({length: N}, (_, i) => [(rnd(i) - 0.5) * 680, (rnd(i + 500) - 0.5) * 640] as Pt)),
  road: () =>
    resample([
      seg([-320, 300], [-24, -180]),
      seg([320, 300], [24, -180]),
      seg([-330, -180], [330, -180]),
      seg([0, 250], [0, 170]),
      seg([0, 100], [0, 40]),
      seg([0, -10], [0, -50]),
    ]),
  bars: () =>
    resample([
      {pts: [[-220, -280], [220, -280], [220, 280], [-220, 280], [-220, -280]], closed: true},
      ...[-132, -44, 44, 132].map((x) => seg([x, -280], [x, 280])),
    ]),
  tree: () =>
    resample([
      seg([0, 300], [0, 70]),
      seg([0, 190], [-80, 120]),
      seg([0, 150], [90, 80]),
      circle(0, -80, 175),
      seg([-200, 300], [200, 300]),
    ]),
  wave: () =>
    resample([
      {pts: Array.from({length: 97}, (_, i) => [-320 + (640 * i) / 96, -40 + 80 * Math.sin((i / 96) * 3 * Math.PI)] as Pt)},
      {pts: Array.from({length: 97}, (_, i) => [-320 + (640 * i) / 96, 90 + 45 * Math.sin((i / 96) * 3 * Math.PI + 1)] as Pt)},
    ]),
  sun: () =>
    resample([
      circle(0, -20, 150),
      ...Array.from({length: 8}, (_, i) => {
        const a = (i / 8) * TAU;
        return seg([200 * Math.cos(a), -20 + 200 * Math.sin(a)], [250 * Math.cos(a), -20 + 250 * Math.sin(a)]);
      }),
    ]),
  dawn: () =>
    resample([
      {pts: arc(0, 150, 170, 170, Math.PI, TAU, 48)},
      seg([-320, 150], [320, 150]),
      seg([-220, 210], [220, 210]),
      seg([-120, 260], [120, 260]),
    ]),
  spiral: () =>
    resample([
      {
        pts: Array.from({length: 241}, (_, i) => {
          const t = i / 240;
          const a = t * 3.5 * TAU;
          const r = 12 + 290 * t;
          return [r * Math.cos(a), r * Math.sin(a)] as Pt;
        }),
      },
    ]),
  star8: () => {
    const sq = (rot: number): Poly => ({
      pts: [0, 1, 2, 3, 4].map((i) => {
        const a = rot + (i / 4) * TAU;
        return [270 * Math.cos(a), 270 * Math.sin(a)] as Pt;
      }),
      closed: true,
    });
    return resample([sq(Math.PI / 4), sq(0)]);
  },
  emblem: () => {
    const sq = (rot: number): Poly => ({
      pts: [0, 1, 2, 3, 4].map((i) => {
        const a = rot + (i / 4) * TAU;
        return [150 * Math.cos(a), 150 * Math.sin(a)] as Pt;
      }),
      closed: true,
    });
    return resample([sq(Math.PI / 4), sq(0), circle(0, 0, 230)]);
  },
  book: () =>
    resample([
      {pts: [...bezier([0, -150], [-90, -200], [-220, -200], [-300, -170]), [-300, 200], ...bezier([-300, 200], [-220, 180], [-90, 190], [0, 230])]},
      {pts: [...bezier([0, -150], [90, -200], [220, -200], [300, -170]), [300, 200], ...bezier([300, 200], [220, 180], [90, 190], [0, 230])]},
      seg([0, -150], [0, 230]),
    ]),
  heart: () =>
    resample([
      {
        pts: Array.from({length: 121}, (_, i) => {
          const t = (i / 120) * TAU;
          const x = 16 * Math.sin(t) ** 3;
          const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
          return [x * 17, y * 17 + 20] as Pt;
        }),
        closed: true,
      },
    ]),
  stack: () =>
    resample(
      [440, 380, 460, 400].map((w, i) => {
        const y = 230 - i * 92;
        const x = (i % 2 ? 18 : -12) - w / 2;
        return {pts: [[x, y], [x + w, y], [x + w, y - 74], [x, y - 74], [x, y]] as Pt[], closed: true};
      }),
    ),
  cube: () =>
    resample([
      {pts: [[-170, -110], [170, -110], [170, 230], [-170, 230], [-170, -110]], closed: true},
      seg([-170, -110], [-90, -180], [250, -180], [170, -110]),
      seg([170, 230], [250, 160], [250, -180]),
      seg([-170, -40], [170, -40], [250, -110]),
    ]),
  cubeOrbit: () =>
    resample([
      ...shift(
        [
          {pts: [[-170, -110], [170, -110], [170, 230], [-170, 230], [-170, -110]], closed: true},
          seg([-170, -110], [-90, -180], [250, -180], [170, -110]),
          seg([170, 230], [250, 160], [250, -180]),
        ],
        -20,
        -20,
        0.62,
      ),
      {pts: arc(0, 60, 330, 95, 0, TAU), closed: true},
    ]),
  halves: () => resample([circle(0, 0, 240), seg([0, -300], [0, 300])]),
  arch: () =>
    resample([
      {pts: [[-200, 300], [-200, 0], ...bezier([-200, 0], [-200, -170], [-80, -240], [0, -290]), ...bezier([0, -290], [80, -240], [200, -170], [200, 0]), [200, 300]]},
      {pts: [[-120, 300], [-120, 30], ...bezier([-120, 30], [-120, -90], [-50, -150], [0, -180]), ...bezier([0, -180], [50, -150], [120, -90], [120, 30]), [120, 300]]},
      seg([-300, 300], [300, 300]),
    ]),
};

const cache: Record<string, Shape> = {};

export const shape = (name: string): Shape => {
  if (!SHAPES[name]) throw new Error(`Unknown shape: ${name}`);
  return (cache[name] ??= SHAPES[name]());
};

/** Shapes that turn slowly while they hold. */
export const SPIN = new Set(['spark', 'ring', 'spiral', 'star8', 'emblem', 'scatter']);
