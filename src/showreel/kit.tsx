import React from 'react';
import {random} from 'remotion';

export const RW = 1920;
export const RH = 1080;

/** Near-black, bone, one vermilion. Amber is allowed twice in fifteen seconds. */
export const C = {
  bg: '#0B0B0F',
  ink: '#F2F1ED',
  dim: '#55555F',
  rule: '#23232B',
  hot: '#FF4A1C',
  warm: '#FFC24A',
};

export const FS = '"Inter Variable", Inter, system-ui, sans-serif';
export const FM = '"JetBrains Mono", ui-monospace, monospace';
export const FR = '"Instrument Serif", Georgia, serif';

// ---------- easing ----------
export const cl = (x: number, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
export const mix = (a: number, b: number, k: number) => a + (b - a) * k;
/** Quintic out — the arrival curve this whole piece uses. */
export const out5 = (x: number) => 1 - Math.pow(1 - cl(x), 5);
export const out3 = (x: number) => 1 - Math.pow(1 - cl(x), 3);
export const in3 = (x: number) => Math.pow(cl(x), 3);
export const inOut = (x: number) => (cl(x) < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
/** Overshoot: lands past the mark and settles. The signature of good spring work. */
export const back = (x: number, k = 1.9) => {
  const t = cl(x) - 1;
  return t * t * ((k + 1) * t + k) + 1;
};
/** A damped spring, sampled — for weight rather than snap. */
export const spring = (x: number, bounce = 7, decay = 5.5) =>
  cl(x) >= 1 ? 1 : 1 - Math.exp(-decay * x) * Math.cos(bounce * x);

/** 0 before a, 1 after b, eased between. The workhorse. */
export const ramp = (t: number, a: number, b: number, e = out5) => e(cl((t - a) / (b - a)));
/** A pulse that rises and falls across [a,b]. */
export const pulse = (t: number, a: number, b: number) => Math.sin(Math.PI * cl((t - a) / (b - a)));
/** Staggered arrival: item i of n, each offset by `step`. */
export const stag = (t: number, at: number, i: number, step = 0.035, dur = 0.5, e = out5) =>
  e(cl((t - at - i * step) / dur));

export const rnd = (...s: (number | string)[]) => random(s.join(':'));
export const rr = (lo: number, hi: number, ...s: (number | string)[]) => lo + (hi - lo) * rnd(...s);

// ---------- marks ----------
/** A line that draws itself, by dash offset — exact, not faked with scale. */
export const Draw: React.FC<{
  d: string;
  p: number;
  len: number;
  w?: number;
  color?: string;
  cap?: 'butt' | 'round';
  opacity?: number;
}> = ({d, p, len, w = 3, color = C.ink, cap = 'butt', opacity = 1}) => (
  <path
    d={d}
    fill="none"
    stroke={color}
    strokeWidth={w}
    strokeLinecap={cap}
    strokeDasharray={len}
    strokeDashoffset={len * (1 - cl(p))}
    opacity={opacity}
  />
);

/** Echoes of a moving thing at earlier times — motion blur you can art-direct. */
export const Trail: React.FC<{
  n?: number;
  step?: number;
  t: number;
  render: (t: number, k: number) => React.ReactNode;
}> = ({n = 7, step = 0.016, t, render}) => (
  <>
    {Array.from({length: n}, (_, i) => n - 1 - i).map((i) => {
      const k = 1 - i / n;
      return (
        <g key={i} opacity={i === 0 ? 1 : 0.1 + 0.22 * k}>
          {render(t - i * step, k)}
        </g>
      );
    })}
  </>
);

/** Type that arrives letter by letter, each on its own spring. */
export const Letters: React.FC<{
  text: string;
  t: number;
  at: number;
  size: number;
  step?: number;
  color?: string;
  weight?: number;
  track?: number;
  family?: string;
  from?: number;
}> = ({text, t, at, size, step = 0.028, color = C.ink, weight = 900, track = -0.04, family = FS, from = 70}) => (
  <div style={{display: 'flex', whiteSpace: 'pre'}}>
    {text.split('').map((ch, i) => {
      const k = stag(t, at, i, step, 0.62, back);
      return (
        <span
          key={i}
          style={{
            fontFamily: family,
            fontWeight: weight,
            fontSize: size,
            letterSpacing: size * track,
            color,
            lineHeight: 0.92,
            display: 'inline-block',
            opacity: cl(k * 2),
            transform: `translateY(${from * (1 - k)}px)`,
            willChange: 'transform',
          }}
        >
          {ch}
        </span>
      );
    })}
  </div>
);

/** Grain and a soft edge burn, over everything, every frame. */
export const Finish: React.FC<{f: number}> = ({f}) => (
  <>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 48%, rgba(0,0,0,0.5) 100%)`,
        pointerEvents: 'none',
      }}
    />
    <svg width={RW} height={RH} style={{position: 'absolute', inset: 0, opacity: 0.055, mixBlendMode: 'overlay'}}>
      <filter id={`g${f % 3}`}>
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={f % 3} />
      </filter>
      <rect width={RW} height={RH} filter={`url(#g${f % 3})`} />
    </svg>
  </>
);
