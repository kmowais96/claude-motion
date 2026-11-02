import React from 'react';
import {clamp01, lerp, rand} from '../lib';
import {V} from './theme';

/* ---------- shapes as point lists, so any shape can morph into any other ---------- */

const N = 160;
type P = [number, number];
const TAU = Math.PI * 2;

/** Points walk clockwise from top centre, so shapes sampled the same way morph cleanly. */
export const heartPts = (cx: number, cy: number, w: number, h: number): P[] => {
  const raw: P[] = [];
  for (let i = 0; i < N; i++) {
    const t = (i / N) * TAU;
    raw.push([16 * Math.sin(t) ** 3, -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))]);
  }
  // heart spans x ±16, y ≈ -12..17
  return raw.map(([x, y]) => [cx + (x / 32) * w, cy + ((y - 2.5) / 29) * h]);
};

export const rectPts = (cx: number, cy: number, w: number, h: number, r = 0.08): P[] => {
  const out: P[] = [];
  for (let i = 0; i < N; i++) {
    const t = (i / N) * TAU;
    const dx = Math.sin(t);
    const dy = -Math.cos(t);
    // superellipse keeps corners soft and gives a ray hit for every angle
    const n = 2 / Math.max(0.02, r);
    const k = 1 / Math.pow(Math.pow(Math.abs(dx), n) + Math.pow(Math.abs(dy), n), 1 / n);
    out.push([cx + dx * k * (w / 2), cy + dy * k * (h / 2)]);
  }
  return out;
};

export const circlePts = (cx: number, cy: number, r: number): P[] => rectPts(cx, cy, r * 2, r * 2, 1);

export const mix = (a: P[], b: P[], k: number): P[] => a.map(([x, y], i) => [lerp(x, b[i][0], k), lerp(y, b[i][1], k)]);

export const toPath = (pts: P[]) => {
  // smooth closed path through the points (Catmull-Rom → Bézier)
  const n = pts.length;
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d + 'Z';
};

/* ---------- sky, rain ---------- */

export const Sky: React.FC<{t: number; dim?: number}> = ({t, dim = 0}) => (
  <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={V.night} />
        <stop offset="0.55" stopColor={V.sky} />
        <stop offset="0.78" stopColor={V.skyLow} />
        <stop offset="1" stopColor={V.night} />
      </linearGradient>
    </defs>
    <rect width={1080} height={1920} fill="url(#sky)" />
    {Array.from({length: 70}, (_, i) => {
      const x = rand(i * 3.1) * 1080;
      const y = rand(i * 7.7) * 1000;
      const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * (0.6 + rand(i) * 1.4) + i));
      return <circle key={i} cx={(x + t * 3) % 1080} cy={y} r={0.8 + rand(i * 2.3) * 1.6} fill={V.cream} opacity={tw * 0.35 * (1 - dim)} />;
    })}
  </svg>
);

/** Falling streaks between x0..x1. `gold` makes it the falling light of the reminder. */
export const Rain: React.FC<{t: number; k: number; x0?: number; x1?: number; y0?: number; y1?: number; gold?: boolean; seed?: number}> = ({
  t,
  k,
  x0 = 60,
  x1 = 1020,
  y0 = 560,
  y1 = 1170,
  gold = false,
  seed = 0,
}) => {
  if (k <= 0.001) return null;
  const n = gold ? 26 : 70;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      <defs>
        <linearGradient id={`streak${gold ? 'g' : 'r'}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={gold ? V.gold : '#BFD6F0'} stopOpacity="0" />
          <stop offset="1" stopColor={gold ? V.gold : '#BFD6F0'} stopOpacity={gold ? 0.95 : 0.7} />
        </linearGradient>
      </defs>
      {Array.from({length: n}, (_, i) => {
        if (rand(i + seed) > k * 1.05) return null;
        const speed = gold ? 380 + rand(i * 5 + seed) * 160 : 1100 + rand(i * 5 + seed) * 500;
        const len = gold ? 90 + rand(i * 9) * 70 : 46 + rand(i * 9) * 40;
        const span = y1 - y0 + len;
        const y = y0 - len + ((t * speed + rand(i * 13 + seed) * span) % span);
        const x = x0 + rand(i * 2.7 + seed) * (x1 - x0) - (gold ? 0 : (y - y0) * 0.06);
        const fadeLow = clamp01((y1 - y) / 60);
        return (
          <line
            key={i}
            x1={x}
            y1={y}
            x2={x + (gold ? 0 : len * 0.06)}
            y2={y + len}
            stroke={`url(#streak${gold ? 'g' : 'r'})`}
            strokeWidth={gold ? 3.2 : 2.2}
            strokeLinecap="round"
            opacity={fadeLow}
          />
        );
      })}
    </svg>
  );
};

/* ---------- ground ---------- */

/** One block of ground. `life` greens the top, `salt` crusts it white; `m` morphs rect→heart, `ball`/`slab` handled by caller. */
export const Ground: React.FC<{
  id: string;
  pts: P[];
  top: number;
  life: number;
  salt: number;
  heart: number;
  warm?: number;
  stone?: number;
  glow?: number;
  opacity?: number;
}> = ({id, pts, top, life, salt, heart, warm = 0, stone = 0, glow = 0, opacity = 1}) => {
  const d = toPath(pts);
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  // soil colour: plain earth → loam (life) / ash (salt) → heart tints
  const base = salt > life ? V.ash : V.loam;
  return (
    <g opacity={opacity}>
      <defs>
        <clipPath id={`clip-${id}`}>
          <path d={d} />
        </clipPath>
        <linearGradient id={`soil-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={salt > life ? '#55524C' : V.loamTop} />
          <stop offset="0.35" stopColor={base} />
          <stop offset="1" stopColor={salt > life ? V.ashDeep : V.loamDeep} />
        </linearGradient>
        <radialGradient id={`warm-${id}`} cx="0.5" cy="0.35" r="0.75">
          <stop offset="0" stopColor={V.heartWarmHi} />
          <stop offset="0.6" stopColor={V.heartWarm} />
          <stop offset="1" stopColor="#6E2E22" />
        </radialGradient>
        <radialGradient id={`stone-${id}`} cx="0.45" cy="0.3" r="0.8">
          <stop offset="0" stopColor={V.stoneHi} />
          <stop offset="1" stopColor="#2E2F33" />
        </radialGradient>
      </defs>
      {glow > 0 && <path d={d} fill="none" stroke={V.gold} strokeWidth={26} opacity={glow * 0.22} style={{filter: 'blur(18px)'}} />}
      <path d={d} fill={`url(#soil-${id})`} />
      <g clipPath={`url(#clip-${id})`}>
        {/* strata */}
        {[0.28, 0.52, 0.74].map((f, i) => (
          <path
            key={i}
            d={`M${minX - 10},${top + (maxY - top) * f} Q${(minX + maxX) / 2},${top + (maxY - top) * f + (i % 2 ? 14 : -12)} ${maxX + 10},${top + (maxY - top) * f}`}
            stroke="rgba(0,0,0,0.25)"
            strokeWidth={3}
            fill="none"
          />
        ))}
        {/* pebbles */}
        {Array.from({length: 34}, (_, i) => (
          <ellipse
            key={i}
            cx={minX + rand(i * 4.1 + id.length) * (maxX - minX)}
            cy={top + 40 + rand(i * 6.3 + id.length) * (maxY - top - 40)}
            rx={3 + rand(i * 1.7) * 6}
            ry={2 + rand(i * 2.9) * 4}
            fill="rgba(255,255,255,0.06)"
          />
        ))}
        {/* living top: dark rich band with a green fringe */}
        <rect x={minX} y={top} width={maxX - minX} height={30} fill={V.leafDeep} opacity={life * (1 - heart)} />
        <rect x={minX} y={top} width={maxX - minX} height={10} fill={V.green} opacity={life * (1 - heart) * 0.8} />
        {/* salt crust */}
        <rect x={minX} y={top} width={maxX - minX} height={26} fill={V.salt} opacity={salt * (1 - heart) * 0.95} />
        {Array.from({length: 22}, (_, i) => (
          <path
            key={`c${i}`}
            d={`M${minX + rand(i * 3.3 + 1) * (maxX - minX)},${top + 20} l${8 - rand(i) * 16},${30 + rand(i * 7) * 50} l${10 - rand(i * 2) * 20},${20 + rand(i * 5) * 40}`}
            stroke={V.salt}
            strokeWidth={2}
            fill="none"
            opacity={salt * 0.45 * (1 - heart * 0.4)}
          />
        ))}
        {/* heart tints */}
        <path d={d} fill={`url(#warm-${id})`} opacity={heart * warm} />
        <path d={d} fill={`url(#stone-${id})`} opacity={heart * stone} />
      </g>
      <path d={d} fill="none" stroke="rgba(245,239,226,0.18)" strokeWidth={2} />
    </g>
  );
};

/* ---------- plants (grow 0..1, rooted at x,y) ---------- */

export const Grass: React.FC<{x0: number; x1: number; y: number; k: number; seed?: number}> = ({x0, x1, y, k, seed = 0}) => {
  if (k <= 0) return null;
  return (
    <g>
      {Array.from({length: 30}, (_, i) => {
        const x = x0 + (i + rand(i + seed) * 0.6) * ((x1 - x0) / 30);
        const h = (10 + rand(i * 3 + seed) * 18) * clamp01(k * 1.4 - rand(i + seed) * 0.4);
        return <path key={i} d={`M${x},${y} q${3},${-h * 0.6} ${2 + rand(i) * 6},${-h}`} stroke={V.green} strokeWidth={3} fill="none" strokeLinecap="round" />;
      })}
    </g>
  );
};

export const Palm: React.FC<{x: number; y: number; h: number; k: number; lean?: number; fruit?: number; fruitGlow?: number; sway?: number}> = ({
  x,
  y,
  h,
  k,
  lean = 0,
  fruit = 0,
  fruitGlow = 0,
  sway = 0,
}) => {
  if (k <= 0) return null;
  const hh = h * k;
  const tx = x + lean * hh;
  const ty = y - hh;
  const fronds = 7;
  return (
    <g>
      <path d={`M${x},${y} Q${x + lean * hh * 0.3},${y - hh * 0.5} ${tx},${ty}`} stroke="#6B4A2E" strokeWidth={14} fill="none" strokeLinecap="round" />
      {Array.from({length: 7}, (_, i) => {
        const f = (i + 1) / 8;
        const px = x + (tx - x) * f;
        const py = y + (ty - y) * f;
        return <line key={i} x1={px - 7} y1={py} x2={px + 7} y2={py - 3} stroke="#4C3320" strokeWidth={2} opacity={k} />;
      })}
      {Array.from({length: fronds}, (_, i) => {
        const a = -Math.PI / 2 + ((i - (fronds - 1) / 2) / ((fronds - 1) / 2)) * 1.45 + Math.sin(sway + i) * 0.04;
        const L = (70 + (i % 2) * 18) * clamp01(k * 1.6 - 0.4);
        const ex = tx + Math.cos(a) * L;
        const ey = ty + Math.sin(a) * L + L * 0.45;
        const mx = tx + Math.cos(a) * L * 0.5;
        const my = ty + Math.sin(a) * L * 0.5 - 14;
        return <path key={i} d={`M${tx},${ty} Q${mx},${my} ${ex},${ey}`} stroke={i % 2 ? V.leaf : V.green} strokeWidth={9} fill="none" strokeLinecap="round" />;
      })}
      {fruit > 0 &&
        [-14, 0, 14].map((dx, i) => (
          <g key={i}>
            {fruitGlow > 0 && <circle cx={tx + dx} cy={ty + 14} r={18} fill={V.gold} opacity={fruitGlow * 0.35} style={{filter: 'blur(6px)'}} />}
            <ellipse cx={tx + dx} cy={ty + 14 + Math.abs(dx) * 0.2} rx={7 * fruit * (1 + fruitGlow * 0.35)} ry={10 * fruit * (1 + fruitGlow * 0.35)} fill={fruitGlow > 0.5 ? '#E08A43' : V.date} />
          </g>
        ))}
    </g>
  );
};

export const Vine: React.FC<{x: number; y: number; w: number; h: number; k: number; fruit?: number; fruitGlow?: number}> = ({x, y, w, h, k, fruit = 0, fruitGlow = 0}) => {
  if (k <= 0) return null;
  const post = clamp01(k * 2);
  const top = clamp01(k * 2 - 0.6);
  const leaves = clamp01(k * 1.6 - 0.5);
  return (
    <g>
      <line x1={x} y1={y} x2={x} y2={y - h * post} stroke="#8A6A48" strokeWidth={7} />
      <line x1={x + w} y1={y} x2={x + w} y2={y - h * post} stroke="#8A6A48" strokeWidth={7} />
      <line x1={x} y1={y - h} x2={x + w * top} y2={y - h} stroke="#8A6A48" strokeWidth={6} opacity={top > 0 ? 1 : 0} />
      {Array.from({length: 9}, (_, i) => {
        const lx = x + (i + 0.5) * (w / 9);
        const s = clamp01(leaves * 1.5 - i * 0.06);
        return <ellipse key={i} cx={lx} cy={y - h - 4} rx={20 * s} ry={13 * s} fill={i % 2 ? V.leaf : V.green} />;
      })}
      {fruit > 0 &&
        [0.2, 0.5, 0.8].map((f, j) => {
          const gx = x + w * f;
          const gy = y - h + 20;
          return (
            <g key={j}>
              {fruitGlow > 0 && <circle cx={gx} cy={gy + 16} r={32} fill={V.gold} opacity={fruitGlow * 0.3} style={{filter: 'blur(8px)'}} />}
              {[
                [0, 0],
                [-9, 0],
                [9, 0],
                [-4.5, 11],
                [4.5, 11],
                [0, 22],
              ].map(([dx, dy], i) => (
                <circle key={i} cx={gx + dx} cy={gy + dy} r={6.5 * fruit * (1 + fruitGlow * 0.3)} fill={V.grape} />
              ))}
            </g>
          );
        })}
    </g>
  );
};

export const Wheat: React.FC<{x0: number; x1: number; y: number; k: number; h?: number}> = ({x0, x1, y, k, h = 120}) => {
  if (k <= 0) return null;
  return (
    <g>
      {Array.from({length: 11}, (_, i) => {
        const x = x0 + (i + 0.5) * ((x1 - x0) / 11);
        const g = clamp01(k * 1.5 - rand(i * 3.3) * 0.5);
        const hh = (h - 20 + rand(i) * 40) * g;
        return (
          <g key={i}>
            <path d={`M${x},${y} q2,${-hh / 2} ${4},${-hh}`} stroke="#A8B865" strokeWidth={3.5} fill="none" />
            {g > 0.6 && <ellipse cx={x + 4} cy={y - hh - 6} rx={5} ry={16 * (g - 0.6) * 2.5} fill="#D9C27A" />}
          </g>
        );
      })}
    </g>
  );
};

export const Flower: React.FC<{x: number; y: number; k: number; c?: string; s?: number}> = ({x, y, k, c = V.bloom, s = 1}) => {
  if (k <= 0) return null;
  const st = 46 * s * clamp01(k * 1.6);
  const b = clamp01(k * 2 - 1);
  return (
    <g>
      <line x1={x} y1={y} x2={x} y2={y - st} stroke={V.leaf} strokeWidth={3} />
      {Array.from({length: 6}, (_, i) => {
        const a = (i / 6) * TAU;
        return <ellipse key={i} cx={x + Math.cos(a) * 9 * b * s} cy={y - st + Math.sin(a) * 9 * b * s} rx={7 * b * s} ry={5 * b * s} fill={c} transform={`rotate(${(a * 180) / Math.PI} ${x + Math.cos(a) * 9 * b * s} ${y - st + Math.sin(a) * 9 * b * s})`} />;
      })}
      <circle cx={x} cy={y - st} r={5 * b * s} fill={V.gold} />
    </g>
  );
};

/** Fruit tree for the narration ("flowers, fruit, and trees"). */
export const Tree: React.FC<{x: number; y: number; k: number; fruit: number}> = ({x, y, k, fruit}) => {
  if (k <= 0) return null;
  const tr = clamp01(k * 1.8);
  const cr = clamp01(k * 1.8 - 0.6);
  return (
    <g>
      <path d={`M${x},${y} L${x},${y - 120 * tr}`} stroke="#6B4A2E" strokeWidth={16} strokeLinecap="round" />
      <path d={`M${x},${y - 70 * tr} L${x + 34 * tr},${y - 110 * tr}`} stroke="#6B4A2E" strokeWidth={8} strokeLinecap="round" />
      {[
        [0, -170, 70],
        [-48, -140, 50],
        [50, -146, 52],
        [-20, -200, 44],
        [26, -196, 46],
      ].map(([dx, dy, r], i) => (
        <circle key={i} cx={x + dx} cy={y + dy * tr} r={r * cr} fill={i % 2 ? V.leaf : V.green} />
      ))}
      {fruit > 0 &&
        [
          [-30, -160],
          [24, -180],
          [40, -136],
          [-8, -130],
          [-46, -126],
        ].map(([dx, dy], i) => <circle key={i} cx={x + dx} cy={y + dy * tr} r={8 * clamp01(fruit * 1.4 - i * 0.08)} fill="#E4573F" />)}
    </g>
  );
};

/** Dry thorny scrub that grows from salt ground ("waste"). */
export const Scrub: React.FC<{x: number; y: number; k: number; s?: number}> = ({x, y, k, s = 1}) => {
  if (k <= 0) return null;
  const g = clamp01(k);
  const br = [
    [-26, -40],
    [-10, -58],
    [8, -52],
    [24, -38],
    [0, -30],
  ];
  return (
    <g stroke="#8E8676" strokeWidth={3} fill="none" strokeLinecap="round">
      {br.map(([dx, dy], i) => (
        <path key={i} d={`M${x},${y} l${dx * s * g},${dy * s * g} m${-dx * 0.3 * s * g},${dy * 0.25 * s * g} l${dx > 0 ? 8 : -8},${-8}`} />
      ))}
    </g>
  );
};

export const Drop: React.FC<{x: number; y: number; s: number; fill?: string; opacity?: number}> = ({x, y, s, fill = '#BFD6F0', opacity = 1}) => (
  <path
    d={`M${x},${y - 34 * s} C${x + 4 * s},${y - 20 * s} ${x + 22 * s},${y - 4 * s} ${x + 22 * s},${y + 10 * s} A${22 * s},${22 * s} 0 0 1 ${x - 22 * s},${y + 10 * s} C${x - 22 * s},${y - 4 * s} ${x - 4 * s},${y - 20 * s} ${x},${y - 34 * s}Z`}
    fill={fill}
    opacity={opacity}
  />
);
