import React from 'react';
import {rand} from '../lib';
import {K, TYPE} from './theme';

/* Everything here is drawn in world units: y = 0 is the ground line, up is negative. */

const INK = 4;

/** Hatch patterns and the hand-drawn "boil": displacement whose seed steps every few frames. */
export const Defs: React.FC<{frame: number}> = ({frame}) => (
  <defs>
    <pattern id="hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(-50)">
      <line x1="0" y1="0" x2="0" y2="10" stroke={K.ink} strokeWidth={1.6} />
    </pattern>
    <pattern id="hatchWide" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(-50)">
      <line x1="0" y1="0" x2="0" y2="16" stroke={K.ink} strokeWidth={1.4} />
    </pattern>
    <pattern id="hatchDense" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(-50)">
      <line x1="0" y1="0" x2="0" y2="6" stroke={K.ink} strokeWidth={1.8} />
    </pattern>
    <pattern id="hatchLight" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(-50)">
      <line x1="0" y1="0" x2="0" y2="12" stroke="#FFFFFF" strokeWidth={2.2} opacity={0.55} />
    </pattern>
    <pattern id="planks" width="40" height="40" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="0" y2="40" stroke={K.ink} strokeWidth={2} />
    </pattern>
    <radialGradient id="doorGlow" cx="50%" cy="60%" r="60%">
      <stop offset="0%" stopColor="#FFFBE8" />
      <stop offset="55%" stopColor={K.light} />
      <stop offset="100%" stopColor={K.gold} />
    </radialGradient>
    <radialGradient id="halo" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor={K.light} stopOpacity={0.9} />
      <stop offset="100%" stopColor={K.light} stopOpacity={0} />
    </radialGradient>
    <filter id="boil" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves={2} seed={Math.floor(frame / 4) % 6} />
      <feDisplacementMap in="SourceGraphic" scale={3.2} />
    </filter>
  </defs>
);

/* ---------------- the hero ---------------- */

/**
 * Faceless pear-shaped figure in a white kufi, base centred on (0,0).
 * look: -1..1 turns the head seam; arms in degrees (0 hangs, 90 out, 160 raised);
 * bow tips him forward around his base; squash flattens on landings.
 */
export const Hero: React.FC<{
  x: number;
  y?: number;
  look?: number;
  armL?: number;
  armR?: number;
  bow?: number;
  squash?: number;
  dir?: 1 | -1;
  color?: string;
}> = ({x, y = 0, look = 0, armL = 8, armR = 8, bow = 0, squash = 0, dir = 1, color = K.hero}) => {
  const body = 'M-22,-232 C-62,-196 -108,-122 -102,-56 C-97,-6 -52,4 0,4 C52,4 97,-6 102,-56 C108,-122 62,-196 22,-232 Z';
  const arm = (side: -1 | 1, a: number) => {
    const r = (a * Math.PI) / 180;
    const sx = side * 40;
    const sy = -176;
    const ex = sx + side * Math.sin(r) * 132;
    const ey = sy + Math.cos(r) * 132;
    const mx = sx + side * Math.sin(r - 0.25) * 70;
    const my = sy + Math.cos(r - 0.25) * 70;
    const d = `M${sx},${sy} Q${mx},${my} ${ex},${ey}`;
    return (
      <g>
        <path d={d} fill="none" stroke={K.ink} strokeWidth={30} strokeLinecap="round" />
        <path d={d} fill="none" stroke={color} strokeWidth={22} strokeLinecap="round" />
      </g>
    );
  };
  const hx = look * 30;
  return (
    <g transform={`translate(${x},${y}) scale(${dir * (1 + squash * 0.12)},${1 - squash * 0.12}) rotate(${bow})`}>
      {/* the back arm sits behind the body */}
      {arm(-1, armL)}
      <path d={body} fill={color} stroke={K.ink} strokeWidth={INK} strokeLinejoin="round" />
      <clipPath id="heroClip">
        <path d={body} />
      </clipPath>
      <g clipPath="url(#heroClip)">
        <rect x={38} y={-240} width={80} height={250} fill="url(#hatch)" opacity={0.85} />
        <path d="M-60,-150 Q-78,-90 -62,-30" fill="none" stroke={K.ink} strokeWidth={3} strokeLinecap="round" opacity={0.6} />
      </g>
      {arm(1, armR)}
      {/* head */}
      <g transform={`translate(0,${-282 + bow * 0.6})`}>
        <circle r={52} fill={K.white} stroke={K.ink} strokeWidth={INK} />
        <clipPath id="headClip">
          <circle r={50} />
        </clipPath>
        <g clipPath="url(#headClip)">
          {/* kufi */}
          <path d="M-60,-20 Q0,-34 60,-20 L60,-70 L-60,-70 Z" fill={K.white} stroke={K.ink} strokeWidth={3.5} />
          <rect x={-60} y={-70} width={120} height={46} fill="url(#hatchWide)" opacity={0.7} />
          {/* the seam that says where he looks */}
          <path d={`M${hx},-20 Q${hx * 1.5},14 ${hx},52`} fill="none" stroke={K.ink} strokeWidth={3} strokeLinecap="round" />
          <rect x={18 + hx * 0.4} y={-50} width={60} height={110} fill="url(#hatch)" opacity={0.35} />
        </g>
      </g>
    </g>
  );
};

/** His own shadow, standing up: a hatched dark pear behind him. `k` 0..1 rises it out of the ground. */
export const Shadow: React.FC<{x: number; k: number}> = ({x, k}) => {
  if (k <= 0.01) return null;
  return (
    <g transform={`translate(${x},0) scale(1.25,${1.25 * k})`} opacity={Math.min(1, k * 1.5)}>
      <path d="M-22,-232 C-62,-196 -108,-122 -102,-56 C-97,-6 -52,4 0,4 C52,4 97,-6 102,-56 C108,-122 62,-196 22,-232 Z" fill={K.night} stroke={K.ink} strokeWidth={INK} />
      <circle cx={0} cy={-282} r={52} fill={K.night} stroke={K.ink} strokeWidth={INK} />
      <path d="M-22,-232 C-62,-196 -108,-122 -102,-56 C-97,-6 -52,4 0,4 C52,4 97,-6 102,-56 C108,-122 62,-196 22,-232 Z" fill="url(#hatchLight)" />
    </g>
  );
};

/* ---------------- props ---------------- */

/** A tangled red scribble: the sin. `draw` strokes it on, `burst` breaks it into flecks. */
export const Scribble: React.FC<{x: number; y: number; draw: number; burst: number; frame: number; size?: number}> = ({x, y, draw, burst, frame, size = 1}) => {
  if (draw <= 0.01 && burst <= 0.01) return null;
  const d = 'M-30,4 C-38,-30 6,-44 28,-22 C48,0 22,36 -6,30 C-36,24 -24,-16 4,-14 C26,-12 22,14 2,14 C-12,14 -10,0 0,-2 M-34,-8 C-20,-40 30,-36 34,-6';
  const wob = Math.sin(frame * 0.5) * 3;
  return (
    <g transform={`translate(${x},${y + wob}) scale(${size})`}>
      {burst < 1 && (
        <path
          d={d}
          fill="none"
          stroke={K.red}
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - draw}
          opacity={1 - burst}
          transform={`scale(${1 + burst * 0.4})`}
        />
      )}
      {burst > 0 &&
        burst < 1 &&
        Array.from({length: 9}).map((_, i) => {
          const a = rand(i + 3) * Math.PI * 2;
          const r = 20 + burst * 110 * (0.6 + rand(i + 9) * 0.6);
          return (
            <line
              key={i}
              x1={Math.cos(a) * r}
              y1={Math.sin(a) * r}
              x2={Math.cos(a) * (r + 14)}
              y2={Math.sin(a) * (r + 14)}
              stroke={i % 3 === 0 ? K.gold : K.red}
              strokeWidth={5}
              strokeLinecap="round"
              opacity={1 - burst}
            />
          );
        })}
    </g>
  );
};

/** Night window with a crescent, panes hatched like ink. */
export const Window: React.FC<{x: number; y: number}> = ({x, y}) => (
  <g transform={`translate(${x},${y})`}>
    <rect x={0} y={0} width={170} height={170} fill="url(#hatchDense)" stroke={K.ink} strokeWidth={INK} />
    <path d="M118,38 A34,34 0 1 0 128,98 A26,26 0 1 1 118,38 Z" fill={K.paper} stroke={K.ink} strokeWidth={3} />
    <line x1={85} y1={0} x2={85} y2={170} stroke={K.ink} strokeWidth={INK + 2} />
    <line x1={0} y1={85} x2={170} y2={85} stroke={K.ink} strokeWidth={INK + 2} />
    <rect x={-10} y={170} width={190} height={12} fill={K.white} stroke={K.ink} strokeWidth={3} />
  </g>
);

/** Tally marks: every time he came back. `n` groups of five, drawn on in order by `k`. */
export const Tally: React.FC<{x: number; y: number; n: number; k: number}> = ({x, y, n, k}) => (
  <g transform={`translate(${x},${y})`}>
    {Array.from({length: n}).map((_, g) => {
      const gx = (g % 4) * 78 + rand(g) * 8;
      const gy = Math.floor(g / 4) * 78 + rand(g + 40) * 8;
      return (
        <g key={g} transform={`translate(${gx},${gy}) rotate(${(rand(g + 7) - 0.5) * 10})`}>
          {[0, 1, 2, 3, 4].map((i) => {
            const idx = g * 5 + i;
            const on = Math.max(0, Math.min(1, k * n * 5 - idx));
            if (on <= 0) return null;
            return i < 4 ? (
              <line key={i} x1={i * 13} y1={0} x2={i * 13 + 2} y2={48 * on} stroke={K.ink} strokeWidth={4} strokeLinecap="round" />
            ) : (
              <line key={i} x1={-6} y1={40} x2={-6 + 56 * on} y2={40 - 34 * on} stroke={K.red} strokeWidth={4} strokeLinecap="round" />
            );
          })}
        </g>
      );
    })}
  </g>
);

/** Prayer mat on the ground, seen from the side: a low hatched strip with a fringe. */
export const Mat: React.FC<{x: number}> = ({x}) => (
  <g transform={`translate(${x},0)`}>
    <rect x={-130} y={-10} width={260} height={14} rx={3} fill={K.red} stroke={K.ink} strokeWidth={3} />
    <rect x={-130} y={-10} width={260} height={14} fill="url(#hatchWide)" opacity={0.5} />
    {Array.from({length: 7}).map((_, i) => (
      <line key={i} x1={130} y1={-8 + i * 2} x2={146} y2={-8 + i * 2} stroke={K.ink} strokeWidth={1.6} />
    ))}
  </g>
);

/** Lectern with an open book. `flip` 0..1 turns a page. */
export const Lectern: React.FC<{x: number; flip: number}> = ({x, flip}) => (
  <g transform={`translate(${x},0)`}>
    <path d="M-12,0 L-12,-150 L12,-150 L12,0" fill={K.white} stroke={K.ink} strokeWidth={INK} />
    <path d="M-60,0 L60,0" stroke={K.ink} strokeWidth={INK + 2} strokeLinecap="round" />
    <path d="M-36,-2 L-14,-30 M36,-2 L14,-30" stroke={K.ink} strokeWidth={INK} strokeLinecap="round" />
    <g transform="translate(0,-162) rotate(-14)">
      <path d="M-86,0 L86,0 L74,-18 L-74,-18 Z" fill={K.white} stroke={K.ink} strokeWidth={INK} strokeLinejoin="round" />
      <rect x={-74} y={-18} width={148} height={18} fill="url(#hatch)" opacity={0.5} />
      {/* open book */}
      <path d="M0,-22 Q-40,-38 -78,-28 L-78,-24 Q-40,-32 0,-18 Q40,-32 78,-24 L78,-28 Q40,-38 0,-22 Z" fill={K.white} stroke={K.ink} strokeWidth={3} />
      <path d="M0,-22 Q-38,-62 -76,-52 L-78,-28 Q-40,-38 0,-22" fill={K.white} stroke={K.ink} strokeWidth={3} />
      <path d={`M0,-22 Q${38 - 76 * flip},${-62 - 20 * Math.sin(flip * Math.PI)} ${76 - 152 * flip},-52 L${78 - 156 * flip},-28 Q${40 - 80 * flip},-38 0,-22`} fill={K.white} stroke={K.ink} strokeWidth={3} />
      {[0, 1, 2].map((i) => (
        <line key={i} x1={-66} y1={-46 + i * 7} x2={-16} y2={-40 + i * 6} stroke={K.ink} strokeWidth={1.6} opacity={0.6} />
      ))}
    </g>
  </g>
);

/**
 * Arched doorway. `open` 0..1 swings the leaf back on its left hinge; `light` 0..1 fills the opening;
 * `flash` adds a pulse of rays.
 */
export const Door: React.FC<{x: number; open: number; light: number; flash: number; frame: number; peek?: number}> = ({x, open, light, flash, frame, peek = 0}) => {
  const hw = 120;
  const top = -400;
  const arch = `M${-hw},0 L${-hw},${top} A${hw},${hw} 0 0 1 ${hw},${top} L${hw},0 Z`;
  return (
    <g transform={`translate(${x},0)`}>
      {/* glow behind the door */}
      <circle cx={0} cy={-260} r={340 + 60 * flash} fill="url(#halo)" opacity={light * (0.55 + 0.45 * flash)} />
      {/* rays */}
      <g opacity={light}>
        {Array.from({length: 11}).map((_, i) => {
          const a = -Math.PI / 2 + ((i - 5) / 5) * 1.25;
          const r0 = 200 + 8 * Math.sin(frame * 0.15 + i);
          const r1 = r0 + 50 + 70 * flash + 12 * Math.sin(frame * 0.2 + i * 2);
          return <line key={i} x1={Math.cos(a) * r0} y1={top + 10 + Math.sin(a) * r0} x2={Math.cos(a) * r1} y2={top + 10 + Math.sin(a) * r1} stroke={K.ink} strokeWidth={3.5} strokeLinecap="round" />;
        })}
      </g>
      {/* stone frame */}
      <path d={`M${-hw - 46},0 L${-hw - 46},${top} A${hw + 46},${hw + 46} 0 0 1 ${hw + 46},${top} L${hw + 46},0 Z`} fill={K.white} stroke={K.ink} strokeWidth={INK} />
      <path d={`M${-hw - 46},0 L${-hw - 46},${top} A${hw + 46},${hw + 46} 0 0 1 ${hw + 46},${top} L${hw + 46},0 Z`} fill="url(#hatchWide)" opacity={0.6} />
      {[-1, 1].map((sd) =>
        [0, 1, 2, 3, 4].map((i) => <line key={`${sd}${i}`} x1={sd * hw} y1={-60 - i * 80} x2={sd * (hw + 46)} y2={-60 - i * 80} stroke={K.ink} strokeWidth={3} />),
      )}
      {/* the opening: dark when shut, light when open */}
      <path d={arch} fill={K.night} stroke={K.ink} strokeWidth={INK} />
      <path d={arch} fill="url(#doorGlow)" opacity={light} />
      {peek > 0 && (
        <g opacity={light * peek}>
          <clipPath id="archClip">
            <path d={arch} />
          </clipPath>
          <g clipPath="url(#archClip)">
            <rect x={-hw} y={-40} width={hw * 2} height={40} fill={K.ground} opacity={0.8} />
            <path d={`M${-hw},-18 q30,-10 60,0 t60,0 t60,0 t60,0`} fill="none" stroke={K.water} strokeWidth={8} />
            {[
              [-70, 0.42],
              [55, 0.36],
            ].map(([tx, sc]) => (
              <g key={tx} transform={`translate(${tx},-30) scale(${sc})`}>
                <path d="M-14,0 L-6,-180 L10,-180 L16,0 Z" fill={K.white} stroke={K.ink} strokeWidth={6} />
                <circle cx={-60} cy={-230} r={80} fill={K.leaf} stroke={K.ink} strokeWidth={6} />
                <circle cx={60} cy={-240} r={84} fill={K.leaf} stroke={K.ink} strokeWidth={6} />
                <circle cx={0} cy={-300} r={100} fill={K.leaf} stroke={K.ink} strokeWidth={6} />
              </g>
            ))}
          </g>
        </g>
      )}
      {/* the leaf swings back from the left jamb */}
      <g transform={`translate(${-hw},0) scale(${1 - 0.86 * open},1) translate(${hw},0)`}>
        <path d={arch} fill="#D9C7A5" stroke={K.ink} strokeWidth={INK} />
        <path d={arch} fill="url(#planks)" opacity={0.7} />
        <path d={arch} fill="url(#hatch)" opacity={0.25 + 0.5 * open} />
        <circle cx={hw - 34} cy={-200} r={9} fill={K.gold} stroke={K.ink} strokeWidth={3} />
      </g>
      {/* light spilling onto the ground */}
      <path d={`M${-hw},2 L${hw},2 L${hw + 160},70 L${-hw - 220},70 Z`} fill={K.light} opacity={light * 0.65} />
    </g>
  );
};

/** A garden tree: trunk, round hatched canopy, a few fruits. */
export const Tree: React.FC<{x: number; s?: number; seed?: number; sway: number}> = ({x, s = 1, seed = 0, sway}) => (
  <g transform={`translate(${x},0) scale(${s})`}>
    <path d="M-14,0 C-10,-60 -16,-120 -6,-180 L10,-180 C16,-120 12,-60 16,0 Z" fill={K.white} stroke={K.ink} strokeWidth={INK} />
    <rect x={2} y={-180} width={14} height={180} fill="url(#hatchDense)" opacity={0.7} />
    <g transform={`rotate(${sway * 2}, 0, -180)`}>
      {[
        [-70, -230, 80],
        [60, -240, 84],
        [0, -300, 100],
      ].map(([cx, cy, r], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r={r} fill={K.leaf} stroke={K.ink} strokeWidth={INK} />
          <circle cx={cx + r * 0.35} cy={cy + r * 0.2} r={r * 0.75} fill="url(#hatchWide)" opacity={0.5} />
        </g>
      ))}
      {Array.from({length: 6}).map((_, i) => (
        <circle key={i} cx={-90 + rand(seed + i) * 180} cy={-330 + rand(seed + i + 20) * 150} r={10} fill={i % 2 ? K.red : K.gold} stroke={K.ink} strokeWidth={3} />
      ))}
    </g>
  </g>
);

/** A river across the ground, its ripples sliding with time. */
export const River: React.FC<{x0: number; x1: number; t: number}> = ({x0, x1, t}) => (
  <g>
    <rect x={x0} y={40} width={x1 - x0} height={70} fill={K.water} stroke={K.ink} strokeWidth={INK} />
    {Array.from({length: Math.floor((x1 - x0) / 90)}).map((_, i) => {
      const xx = x0 + ((i * 90 + t * 40) % (x1 - x0));
      return <path key={i} d={`M${xx},${66 + (i % 2) * 18} q12,-8 24,0 t24,0`} fill="none" stroke={K.ink} strokeWidth={2.5} strokeLinecap="round" />;
    })}
  </g>
);

/** Hand-drawn speech bubble with its tail pointing to (tx, ty). */
export const Speech: React.FC<{x: number; y: number; k: number; text: string; dark?: boolean; tx: number; ty: number; size?: number}> = ({x, y, k, text, dark, tx, ty, size = 40}) => {
  if (k <= 0.01) return null;
  const wpx = text.length * size * 0.52 + 60;
  const h = size + 46;
  return (
    <g transform={`translate(${x},${y}) scale(${k})`} opacity={Math.min(1, k * 1.5)}>
      <path d={`M-20,${h / 2 - 6} L${tx - x},${ty - y} L20,${h / 2 - 6} Z`} fill={dark ? K.night : K.white} stroke={K.ink} strokeWidth={INK} strokeLinejoin="round" />
      <rect x={-wpx / 2} y={-h / 2} width={wpx} height={h} rx={h / 2} fill={dark ? K.night : K.white} stroke={K.ink} strokeWidth={INK} />
      <rect x={-18} y={h / 2 - 12} width={36} height={10} fill={dark ? K.night : K.white} />
      <text x={0} y={4} textAnchor="middle" dominantBaseline="central" fontFamily={TYPE} fontWeight={800} fontSize={size} letterSpacing={-1} fill={dark ? K.white : K.ink}>
        {text}
      </text>
    </g>
  );
};

/** A label pill on the ground loop. */
export const Pill: React.FC<{x: number; y: number; text: string; color: string; k: number}> = ({x, y, text, color, k}) =>
  k <= 0.01 ? null : (
    <g transform={`translate(${x},${y}) scale(${k})`}>
      <rect x={-text.length * 14 - 24} y={-30} width={text.length * 28 + 48} height={60} rx={30} fill={K.white} stroke={color} strokeWidth={5} />
      <text x={0} y={3} textAnchor="middle" dominantBaseline="central" fontFamily={TYPE} fontWeight={800} fontSize={36} fill={color}>
        {text}
      </text>
    </g>
  );

/* ---------------- props for "More than deadly poison" ---------------- */

/** The same hero, smaller: the child. */
export const Child: React.FC<React.ComponentProps<typeof Hero> & {s?: number}> = ({s = 0.62, x, y = 0, ...p}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <Hero x={0} {...p} />
  </g>
);

/** A wall shelf: a plank on two brackets, top surface at y. */
export const Shelf: React.FC<{x: number; y: number; w?: number}> = ({x, y, w = 300}) => (
  <g transform={`translate(${x},${y})`}>
    <rect x={-w / 2} y={0} width={w} height={22} fill="#D9C7A5" stroke={K.ink} strokeWidth={INK} />
    <rect x={-w / 2} y={0} width={w} height={22} fill="url(#hatch)" opacity={0.35} />
    {[-1, 1].map((sd) => (
      <path key={sd} d={`M${sd * (w / 2 - 40)},22 L${sd * (w / 2 - 40)},70 L${sd * (w / 2 - 92)},22`} fill="none" stroke={K.ink} strokeWidth={INK} strokeLinejoin="round" />
    ))}
  </g>
);

/**
 * The poison bottle, base on (x, y). `glow` pulses a red halo; `shake` rattles it;
 * `lie` 0..1 turns its label from a skull-cross into a speech bubble.
 */
export const Bottle: React.FC<{x: number; y: number; glow: number; shake: number; lie: number; frame: number; s?: number}> = ({x, y, glow, shake, lie, frame, s = 1}) => {
  const r = Math.sin(frame * 1.7) * 6 * shake;
  const body = 'M-22,-150 L-22,-118 C-22,-104 -56,-98 -56,-70 L-56,-8 C-56,0 -50,4 -42,4 L42,4 C50,4 56,0 56,-8 L56,-70 C56,-98 22,-104 22,-118 L22,-150 Z';
  return (
    <g transform={`translate(${x},${y}) scale(${s}) rotate(${r},0,0)`}>
      <circle cx={0} cy={-70} r={150} fill={K.red} opacity={0.12 + 0.18 * glow} />
      <path d={body} fill="#7A2A20" stroke={K.ink} strokeWidth={INK} strokeLinejoin="round" />
      <path d="M-56,-60 L56,-60 L56,-8 C56,0 50,4 42,4 L-42,4 C-50,4 -56,0 -56,-8 Z" fill={K.red} opacity={0.85} />
      <path d={body} fill="url(#hatch)" opacity={0.45} />
      <path d="M-40,-90 Q-46,-50 -40,-16" fill="none" stroke={K.white} strokeWidth={6} strokeLinecap="round" opacity={0.7} />
      <rect x={-18} y={-176} width={36} height={28} rx={5} fill="#C9A16E" stroke={K.ink} strokeWidth={3.5} />
      {/* label: a cross, or (once it is named) a little speech bubble */}
      <g transform="translate(0,-52)">
        <rect x={-34} y={-24} width={68} height={48} rx={6} fill={K.white} stroke={K.ink} strokeWidth={3} opacity={1 - lie} />
        <path d="M-12,-12 L12,12 M12,-12 L-12,12" stroke={K.ink} strokeWidth={5} strokeLinecap="round" opacity={1 - lie} />
        <g opacity={lie} transform={`scale(${0.6 + 0.4 * lie})`}>
          <rect x={-40} y={-26} width={80} height={46} rx={23} fill={K.white} stroke={K.ink} strokeWidth={3.5} />
          <path d="M-10,18 L-20,34 L4,19" fill={K.white} stroke={K.ink} strokeWidth={3.5} strokeLinejoin="round" />
          <circle cx={-16} cy={-3} r={4.5} fill={K.ink} />
          <circle cx={0} cy={-3} r={4.5} fill={K.ink} />
          <circle cx={16} cy={-3} r={4.5} fill={K.ink} />
        </g>
      </g>
    </g>
  );
};

/**
 * A sapling in a pot, tied to a stake that leans. `bend` 0..1 is how far it has grown along the stake,
 * `grow` 0..1 its height, `crown` 0..1 the grown tree's canopy.
 */
export const Sapling: React.FC<{x: number; bend: number; grow: number; crown: number; stake: number; sway: number}> = ({x, bend, grow, crown, stake, sway}) => {
  const h = 160 + 380 * grow;
  const pt = (k: number) => [Math.sin(k * Math.PI * 0.55) * k * 150 * bend, -60 - h * k] as const;
  const pts = Array.from({length: 13}, (_, i) => pt(i / 12));
  const d = 'M' + pts.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(' L');
  const [tx, ty] = pts[12];
  const wTr = 10 + 18 * grow;
  return (
    <g transform={`translate(${x},0)`}>
      {/* stake, leaning the way the tree will go */}
      <g opacity={stake}>
        <line x1={-6} y1={-50} x2={-6 + 150 * 0.62} y2={-60 - 420} stroke={K.ink} strokeWidth={14} strokeLinecap="round" />
        <line x1={-6} y1={-50} x2={-6 + 150 * 0.62} y2={-60 - 420} stroke="#C9A16E" strokeWidth={8} strokeLinecap="round" />
      </g>
      <path d={d} fill="none" stroke={K.ink} strokeWidth={wTr + 8} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={K.white} strokeWidth={wTr} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke="url(#hatchDense)" strokeWidth={wTr} strokeLinecap="round" opacity={0.5} />
      {/* twine knots, red */}
      {stake > 0.05 &&
        [0.35, 0.65].map((k) => {
          const [a, b] = pt(k);
          return <ellipse key={k} cx={a} cy={b} rx={wTr / 2 + 12} ry={7} fill="none" stroke={K.red} strokeWidth={5} opacity={stake} />;
        })}
      {/* leaves, then a canopy */}
      <g transform={`translate(${tx},${ty}) rotate(${sway * 3})`}>
        {crown < 0.99 &&
          [-1, 1].map((sd) => (
            <path key={sd} d={`M0,0 q${sd * 30},-34 ${sd * 64},-16 q${sd * -30},22 ${sd * -64},16`} fill={K.leaf} stroke={K.ink} strokeWidth={3.5} opacity={1 - crown} />
          ))}
        {crown > 0.01 && (
          <g transform={`scale(${crown})`}>
            {[
              [-70, -40, 80],
              [60, -50, 84],
              [0, -110, 100],
            ].map(([cx, cy, r], i) => (
              <g key={i}>
                <circle cx={cx} cy={cy} r={r} fill={K.leaf} stroke={K.ink} strokeWidth={INK} />
                <circle cx={cx + r * 0.35} cy={cy + r * 0.2} r={r * 0.75} fill="url(#hatchWide)" opacity={0.5} />
              </g>
            ))}
          </g>
        )}
      </g>
      {/* pot */}
      <path d="M-60,-64 L60,-64 L46,0 L-46,0 Z" fill="#C4693F" stroke={K.ink} strokeWidth={INK} strokeLinejoin="round" />
      <path d="M-60,-64 L60,-64 L46,0 L-46,0 Z" fill="url(#hatch)" opacity={0.4} />
      <rect x={-68} y={-74} width={136} height={16} rx={4} fill="#C4693F" stroke={K.ink} strokeWidth={INK} />
    </g>
  );
};

/** A gold coin; `spin` flips it edge-on. */
export const Coin: React.FC<{x: number; y: number; k: number; spin?: number; r?: number}> = ({x, y, k, spin = 0, r = 24}) =>
  k <= 0.01 ? null : (
    <g transform={`translate(${x},${y}) scale(${k * Math.max(0.15, Math.abs(Math.cos(spin)))},${k})`}>
      <circle r={r * 2.2} fill="url(#halo)" opacity={0.8} />
      <circle r={r} fill={K.gold} stroke={K.ink} strokeWidth={3.5} />
      <circle r={r * 0.62} fill="none" stroke={K.ink} strokeWidth={2} opacity={0.5} />
    </g>
  );

/** The old man at the gate: a grey hero with a bowl held out. */
export const OldMan: React.FC<{x: number; bow: number}> = ({x, bow}) => (
  <g>
    <Hero x={x} dir={-1} look={0.6} armL={70} armR={70} bow={bow} color="#8C93A6" />
    <g transform={`translate(${x - 110},-150)`}>
      <path d="M-44,0 Q0,46 44,0 Z" fill={K.white} stroke={K.ink} strokeWidth={INK} strokeLinejoin="round" />
      <path d="M-44,0 Q0,46 44,0 Z" fill="url(#hatch)" opacity={0.4} />
    </g>
  </g>
);

/** A hanging lantern with a label pill under it. `on` 0..1. */
export const Lantern: React.FC<{x: number; y: number; on: number; label: string; frame: number; k: number}> = ({x, y, on, label, frame, k}) => {
  if (k <= 0.01) return null;
  const f = 1 + 0.08 * Math.sin(frame * 0.6 + x);
  return (
    <g transform={`translate(${x},${y}) scale(${k})`}>
      <line x1={0} y1={-400} x2={0} y2={-70} stroke={K.ink} strokeWidth={3} />
      <circle cy={10} r={170 * f} fill="url(#halo)" opacity={on} />
      <path d="M-26,-70 L26,-70 L34,-52 L-34,-52 Z" fill={K.ink} />
      <path d="M-40,-52 L40,-52 L48,60 L-48,60 Z" fill={K.night} stroke={K.ink} strokeWidth={INK} strokeLinejoin="round" />
      <path d="M-40,-52 L40,-52 L48,60 L-48,60 Z" fill={K.light} opacity={on * 0.9} />
      <path d={`M0,${36} q-14,-24 0,-${52 * f} q14,${28 * f} 0,${52 * f}`} fill={K.gold} stroke={K.ink} strokeWidth={2.5} opacity={on} transform={`scale(${0.3 + 0.7 * on})`} />
      {[-1, 0, 1].map((i) => (
        <line key={i} x1={i * 22} y1={-52} x2={i * 26} y2={60} stroke={K.ink} strokeWidth={3} />
      ))}
      <rect x={-56} y={60} width={112} height={16} rx={4} fill={K.ink} />
      {/* smoke once it is out */}
      {on < 0.6 &&
        [0, 1, 2].map((i) => (
          <path key={i} d={`M${Math.sin(frame * 0.1 + i) * 8},${-90 - i * 40} q16,-18 0,-36 q-16,-18 0,-36`} fill="none" stroke={K.inkSoft} strokeWidth={3} strokeLinecap="round" opacity={(1 - on) * 0.6} />
        ))}
      <g transform="translate(0,140)">
        <rect x={-label.length * 13 - 24} y={-28} width={label.length * 26 + 48} height={56} rx={28} fill={K.white} stroke={on > 0.5 ? K.gold : K.red} strokeWidth={5} />
        <text x={0} y={3} textAnchor="middle" dominantBaseline="central" fontFamily={TYPE} fontWeight={800} fontSize={32} fill={K.ink}>
          {label}
        </text>
      </g>
    </g>
  );
};

/** A small masjid gate drawn in the background: dome and minaret behind the arch. */
export const Masjid: React.FC<{x: number}> = ({x}) => (
  <g transform={`translate(${x},0)`}>
    <rect x={-260} y={-520} width={520} height={520} fill={K.white} stroke={K.ink} strokeWidth={INK} />
    <rect x={-260} y={-520} width={520} height={520} fill="url(#hatchWide)" opacity={0.35} />
    <path d="M-170,-520 Q-170,-760 0,-800 Q170,-760 170,-520 Z" fill={K.leaf} stroke={K.ink} strokeWidth={INK} />
    <path d="M0,-800 L0,-860" stroke={K.ink} strokeWidth={5} />
    <path d="M12,-880 A18,18 0 1 0 14,-846 A13,13 0 1 1 12,-880 Z" fill={K.gold} stroke={K.ink} strokeWidth={2.5} />
    <rect x={300} y={-900} width={70} height={900} fill={K.white} stroke={K.ink} strokeWidth={INK} />
    <rect x={300} y={-900} width={70} height={900} fill="url(#hatch)" opacity={0.3} />
    <path d="M290,-900 L335,-990 L380,-900 Z" fill={K.leaf} stroke={K.ink} strokeWidth={INK} strokeLinejoin="round" />
  </g>
);
