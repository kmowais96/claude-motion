import React from 'react';
import {easeIn, easeOut, prog} from '../lib';
import {Mask} from '../components/primitives';
import {M, MF, MW} from '../mercy/theme';
import {LINES} from './theme';

export const Center: React.FC<{y: number; children: React.ReactNode; style?: React.CSSProperties}> = ({y, children, style}) => (
  <div style={{position: 'absolute', top: y, left: 0, width: MW, textAlign: 'center', ...style}}>{children}</div>
);

/** Masked line reveal that also exits. */
export const Line: React.FC<{
  t: number;
  at: number;
  out: number;
  y: number;
  size: number;
  color?: string;
  italic?: boolean;
  children: React.ReactNode;
}> = ({t, at, out, y, size, color = M.cream, italic, children}) => {
  const k = prog(t, at, at + 0.75, easeOut);
  const o = prog(t, out, out + 0.35, easeIn);
  if (k <= 0 || o >= 1) return null;
  return (
    <Center
      y={y}
      style={{fontFamily: MF.serif, fontStyle: italic ? 'italic' : 'normal', fontSize: size, lineHeight: 1, letterSpacing: '-0.015em', color}}
    >
      <Mask k={k} out={o}>
        {children}
      </Mask>
    </Center>
  );
};

export const Mono: React.FC<{t: number; at: number; out: number; y: number; text: string; color?: string; size?: number}> = ({
  t,
  at,
  out,
  y,
  text,
  color = M.muted,
  size = 28,
}) => {
  const o = Math.min(prog(t, at, at + 0.5, easeOut), 1 - prog(t, out, out + 0.3, easeIn));
  if (o <= 0) return null;
  return (
    <Center
      y={y}
      style={{
        fontFamily: MF.mono,
        fontWeight: 600,
        fontSize: size,
        letterSpacing: '0.24em',
        color,
        opacity: o,
        transform: `translateY(${(1 - o) * 10}px)`,
      }}
    >
      {text}
    </Center>
  );
};

/** Translation of the sermon, one line at a time; words come up as he speaks them. */
export const Subtitles: React.FC<{t: number; hidden: (key: string) => boolean; y?: number}> = ({t, hidden, y = 1380}) => {
  let i = -1;
  for (let j = 0; j < LINES.length; j++) if (t >= LINES[j].s - 0.1) i = j;
  if (i < 0) return null;
  const c = LINES[i];
  if (hidden(c.key)) return null;
  const next = LINES[i + 1];
  const end = Math.min(c.e + 1.2, next ? next.s - 0.08 : c.e + 1.2);
  const kin = prog(t, c.s - 0.1, c.s + 0.15, easeOut);
  const kout = prog(t, end - 0.2, end, easeIn);
  if (kout >= 1) return null;
  const words = c.text.split(' ');
  const span = Math.max(0.6, (c.e - c.s) * 0.7);
  return (
    <div
      style={{
        position: 'absolute',
        top: y,
        left: 100,
        width: MW - 200,
        textAlign: 'center',
        transform: `translateY(${(1 - kin) * 14}px)`,
        opacity: kin * (1 - kout),
        fontFamily: MF.sans,
        fontWeight: 700,
        fontSize: 50,
        lineHeight: 1.18,
        letterSpacing: '-0.01em',
        color: M.cream,
        textShadow: '0 3px 14px rgba(0,0,0,0.85), 0 0 2px rgba(0,0,0,0.9)',
      }}
    >
      {words.map((w, n) => {
        const at = c.s + (span * n) / words.length;
        return (
          <span key={n} style={{opacity: 0.38 + 0.62 * prog(t, at - 0.05, at + 0.25)}}>
            {w}
            {n < words.length - 1 ? ' ' : ''}
          </span>
        );
      })}
    </div>
  );
};
