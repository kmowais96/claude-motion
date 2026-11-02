import React from 'react';
import {clamp01, easeIn, easeOut, prog} from '../lib';
import {Mask} from '../components/primitives';
import {K, KF, mix} from './lib';

export const HEART =
  'M50 90 C46 86 6 60 3 35 C0 14 13 2 28 2 C39 2 46 9 50 17 C54 9 61 2 72 2 C87 2 100 14 97 35 C94 60 54 86 50 90 Z';

const N = 7;
const BAND = 88 / N;

/**
 * The striped heart. Each corrupter damages one or two stripes (d[0..4]),
 * `build` slides the stripes in, `r` restores and gilds it.
 */
export const Heart: React.FC<{
  id: string;
  cx: number;
  cy: number;
  size: number;
  base: string;
  dead: string;
  d?: number[];
  r?: number;
  build?: number[];
  glow?: number;
}> = ({id, cx, cy, size, base, dead, d = [0, 0, 0, 0, 0], r = 0, build, glow = 0}) => {
  const h = size * 0.92;
  const col = mix(base, K.gold, r * 0.55);
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 100 92"
      style={{
        position: 'absolute',
        left: cx - size / 2,
        top: cy - h / 2,
        overflow: 'visible',
        filter: glow > 0.01 ? `drop-shadow(0 0 ${30 * glow}px rgba(226,207,159,${0.55 * glow}))` : undefined,
      }}
    >
      <defs>
        <clipPath id={id}>
          <path d={HEART} />
        </clipPath>
      </defs>
      <g opacity={1 - 0.22 * d[4]}>
        {Array.from({length: N}).map((_, i) => {
          const y = 2 + i * BAND;
          const hh = i === N - 1 ? BAND + 2 : BAND - 2.6;
          let fill = col;
          let fo = 1;
          let sw = 0;
          let dx = 0;
          let dy = 0;
          let rot = 0;
          let op = 1;
          if (i <= 1) fill = mix(col, dead, d[0] * (i === 0 ? 1 : 0.85));
          if (i === 2) {
            fo = 1 - d[1];
            sw = 1.6 * d[1];
          }
          if (i === 3) {
            dx = -24 * d[2];
            rot = -7 * d[2];
            dy = 1.5 * d[2];
          }
          if (i === 4) {
            dx = 20 * d[2];
            rot = 6 * d[2];
            dy = 2.5 * d[2];
          }
          if (i === 5) {
            dy = 5 * d[3];
            fill = mix(col, K.heavy, d[3]);
          }
          if (i === 6) op = 1 - 0.8 * d[4];
          if (build) {
            const k = build[i] ?? 1;
            dx += (i % 2 ? 1 : -1) * 90 * (1 - k);
            op *= clamp01(k * 1.4);
          }
          return (
            <g
              key={i}
              opacity={op}
              transform={`translate(${dx} ${dy}) rotate(${rot} 50 ${y + hh / 2})`}
            >
              <rect
                x={-2}
                y={y}
                width={104}
                height={hh}
                clipPath={`url(#${id})`}
                fill={fill}
                fillOpacity={fo}
                stroke={col}
                strokeWidth={sw}
              />
            </g>
          );
        })}
      </g>
    </svg>
  );
};

/** The sitting figure, hugging his knees. Bottom-center sits on (x, ground). */
export const Figure: React.FC<{
  x: number;
  ground: number;
  width: number;
  color: string;
  breathe?: number;
}> = ({x, ground, width, color, breathe = 0}) => {
  const h = width * (100 / 120);
  return (
    <svg
      width={width}
      height={h}
      viewBox="0 0 120 100"
      style={{position: 'absolute', left: x - width / 2, top: ground - h, overflow: 'visible'}}
    >
      <g
        stroke={color}
        strokeWidth={11}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        transform={`rotate(${breathe * 1.5} 30 92)`}
      >
        <path d="M33 38 L29 91" />
        <path d="M30 91 L70 55 L80 93 L98 93" />
        <path d="M35 46 L68 66" />
      </g>
      <circle cx={36 + breathe * 0.6} cy={20} r={14} fill={color} />
    </svg>
  );
};

/** A small person: head and pill body. */
export const Person: React.FC<{x: number; y: number; s: number; color: string; op?: number}> = ({
  x,
  y,
  s,
  color,
  op = 1,
}) => (
  <div
    style={{
      position: 'absolute',
      left: x - 20,
      top: y - 46,
      width: 40,
      height: 92,
      opacity: op,
      transform: `scale(${s})`,
      transformOrigin: '50% 100%',
    }}
  >
    <div style={{position: 'absolute', left: 4, top: 0, width: 32, height: 32, borderRadius: 16, background: color}} />
    <div style={{position: 'absolute', left: 0, top: 38, width: 40, height: 54, borderRadius: 20, background: color}} />
  </div>
);

export type Line = {text: string; accent?: string};

/** A sequence of titles; each one masks in at its time and out before the next. */
export const TitleSeq: React.FC<{
  t: number;
  items: {t: number; lines: (string | Line[])[]}[];
  top: number;
  size?: number;
  color: string;
  accent: string;
}> = ({t, items, top, size = 124, color, accent}) => (
  <>
    {items.map((it, i) => {
      const next = items[i + 1]?.t ?? 1e9;
      if (t < it.t - 0.01 || t > next + 0.05) return null;
      const out = prog(t, next - 0.24, next, easeIn);
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: 60,
            right: 60,
            top,
            textAlign: 'center',
            fontFamily: KF.serif,
            fontSize: size,
            lineHeight: 1.02,
            letterSpacing: '-0.02em',
            color,
          }}
        >
          {it.lines.map((ln, j) => {
            const k = prog(t, it.t + j * 0.09, it.t + j * 0.09 + 0.62, easeOut);
            const parts: Line[] = typeof ln === 'string' ? [{text: ln}] : ln;
            return (
              <div key={j}>
                <Mask k={k} out={out}>
                  {parts.map((p, q) => (
                    <span
                      key={q}
                      style={p.accent ? {fontStyle: 'italic', color: accent} : undefined}
                    >
                      {p.text}
                    </span>
                  ))}
                </Mask>
              </div>
            );
          })}
        </div>
      );
    })}
  </>
);

export const Label: React.FC<{text: string; y: number; color: string; size?: number; op?: number}> = ({
  text,
  y,
  color,
  size = 24,
  op = 1,
}) => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      right: 0,
      top: y,
      textAlign: 'center',
      fontFamily: KF.mono,
      fontSize: size,
      letterSpacing: '0.24em',
      color,
      opacity: op,
    }}
  >
    {text}
  </div>
);
