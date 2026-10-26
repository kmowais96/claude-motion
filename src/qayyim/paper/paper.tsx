import React from 'react';
import {random} from 'remotion';

/** Charcoal card, manila paper, one orange. Nothing else. */
export const P = {
  slab: '#141414',
  slabLit: '#262320',
  paper: '#E8DFCE',
  paperDim: '#C9C2B4',
  accent: '#D94F2B',
  accentDeep: '#A63A1E',
  ink: '#1A1714',
};

/** A rectangle whose edges are torn, not cut: the fibres decide where it ends. */
export const tornRect = (w: number, h: number, seed: string, amp = 9, step = 16) => {
  const pts: string[] = [];
  const jig = (i: number, k: string) => (random(`${seed}-${k}-${i}`) - 0.5) * 2 * amp;
  // the long edges tear more than the short ones, as paper does
  for (let x = 0; x <= w; x += step) pts.push(`${x},${jig(x, 't')}`);
  for (let y = 0; y <= h; y += step) pts.push(`${w + jig(y, 'r') * 0.6},${y}`);
  for (let x = w; x >= 0; x -= step) pts.push(`${x},${h + jig(x, 'b')}`);
  for (let y = h; y >= 0; y -= step) pts.push(`${jig(y, 'l') * 0.6},${y}`);
  return `M${pts.join('L')}Z`;
};

/** A clean-cut rectangle, for things meant to read as manufactured. */
export const cutRect = (w: number, h: number) => `M0,0L${w},0L${w},${h}L0,${h}Z`;

type LayerProps = {
  w: number;
  h: number;
  path: string;
  /** how far the under-layer sits down-right — this is what reads as thickness */
  lift?: number;
  top?: string;
  under?: string;
  children?: React.ReactNode;
  className?: string;
};

/**
 * One piece of paper: its cast shadow, an accent layer offset beneath it, and the
 * face on top. Every object in this film is built from this — a flat shape reads
 * as a drawing, a stack reads as a thing lying on a table.
 */
export const Paper: React.FC<LayerProps> = ({
  w,
  h,
  path,
  lift = 7,
  top = P.paper,
  under = P.accent,
  children,
}) => (
  <svg width={w + lift * 3} height={h + lift * 3} style={{overflow: 'visible', display: 'block'}}>
    <defs>
      <filter id={`sh-${w}-${h}-${lift}`} x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx={lift * 1.5} dy={lift * 2} stdDeviation={lift * 1.4} floodColor="#000" floodOpacity={0.55} />
      </filter>
      <clipPath id={`cl-${w}-${h}-${lift}`}>
        <path d={path} />
      </clipPath>
    </defs>
    <g filter={`url(#sh-${w}-${h}-${lift})`}>
      <path d={path} fill={under} transform={`translate(${lift},${lift})`} />
      <path d={path} fill={top} />
    </g>
    {children ? <g clipPath={`url(#cl-${w}-${h}-${lift})`}>{children}</g> : null}
  </svg>
);

/** Halftone dots, the way a printed icon face is screened. */
export const Halftone: React.FC<{w: number; h: number; r?: number; gap?: number; color?: string}> = ({
  w,
  h,
  r = 2.1,
  gap = 9,
  color = P.ink,
}) => {
  const dots: React.ReactNode[] = [];
  for (let y = 0; y < h; y += gap)
    for (let x = 0; x < w; x += gap)
      dots.push(<circle key={`${x}-${y}`} cx={x + (Math.round(y / gap) % 2 ? gap / 2 : 0)} cy={y} r={r} fill={color} />);
  return <g opacity={0.34}>{dots}</g>;
};

/** Paper fibre: fine light scratches along a torn edge. */
export const Fibre: React.FC<{w: number; h: number; seed: string; n?: number}> = ({w, h, seed, n = 90}) => (
  <g opacity={0.5}>
    {Array.from({length: n}, (_, i) => {
      const x = random(`${seed}-fx-${i}`) * w;
      const y = random(`${seed}-fy-${i}`) * h;
      const l = 3 + random(`${seed}-fl-${i}`) * 14;
      const a = (random(`${seed}-fa-${i}`) - 0.5) * 0.5;
      return (
        <line
          key={i}
          x1={x}
          y1={y}
          x2={x + Math.cos(a) * l}
          y2={y + Math.sin(a) * l}
          stroke="#fff"
          strokeOpacity={0.14}
          strokeWidth={1}
        />
      );
    })}
  </g>
);

/** The threads that hang through the frame and give it depth. */
export const Threads: React.FC<{w: number; h: number; n?: number; seed?: string}> = ({
  w,
  h,
  n = 9,
  seed = 'th',
}) => (
  <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
    {Array.from({length: n}, (_, i) => {
      const x = (i + 0.5) * (w / n) + (random(`${seed}-x-${i}`) - 0.5) * 70;
      const sway = (random(`${seed}-s-${i}`) - 0.5) * 50;
      return (
        <path
          key={i}
          d={`M${x},-20 Q${x + sway},${h / 2} ${x + sway * 0.4},${h + 20}`}
          stroke={P.accentDeep}
          strokeWidth={1.6 + random(`${seed}-w-${i}`) * 1.6}
          fill="none"
          opacity={0.75}
        />
      );
    })}
  </svg>
);

/** Grain and vignette: the camera, not the paper. */
export const Camera: React.FC<{w: number; h: number}> = ({w, h}) => (
  <>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(ellipse at 50% 42%, rgba(0,0,0,0) 32%, rgba(0,0,0,0.55) 78%, rgba(0,0,0,0.85) 100%)`,
        pointerEvents: 'none',
      }}
    />
    <svg width={w} height={h} style={{position: 'absolute', inset: 0, opacity: 0.1, mixBlendMode: 'overlay'}}>
      <filter id="gr">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={3} />
      </filter>
      <rect width={w} height={h} filter="url(#gr)" />
    </svg>
  </>
);
