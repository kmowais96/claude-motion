import React from 'react';
import {C, F, clamp01, easeIn, easeInOut, easeOut, prog} from '../lib';
import data from './sentences.json';

export const FPS = 30;
export const W = 1920;
export const H = 1080;
// Narration ends ~449 s; the end card holds a few seconds past the audio.
export const DURATION = Math.ceil(data.total + 3);

export type Sentence = {part: number; para: number; idx: number; text: string; start: number; end: number};
export const SENT: Sentence[] = data.sentences;
const BY = new Map(SENT.map((s) => [`${s.part}:${s.idx}`, s]));
const get = (p: number, i: number) => {
  const s = BY.get(`${p}:${i}`);
  if (!s) throw new Error(`no sentence ${p}:${i}`);
  return s;
};
/** Start (s) of sentence i of narration part p. */
export const at = (p: number, i: number) => get(p, i).start;
/** Fraction k (0..1) of the way through sentence p:i. */
export const within = (p: number, i: number, k: number) => {
  const s = get(p, i);
  return s.start + (s.end - s.start) * k;
};

export const AR = '"Amiri", "Noto Naskh Arabic", serif';

/** Entrance 0→1 starting at a. */
export const ap = (t: number, a: number, d = 0.7) => prog(t, a, a + d, easeOut);
/** 1→0 exit starting at b. */
export const dis = (t: number, b: number, d = 0.4) => 1 - prog(t, b, b + d, easeIn);
/** Visible between a and b (exit begins at b). */
export const win = (t: number, a: number, b: number) => ap(t, a) * dis(t, b);

export const T: React.FC<{
  x: number;
  y: number;
  k?: number;
  size?: number;
  font?: string;
  color?: string;
  italic?: boolean;
  w?: number;
  align?: 'center' | 'left' | 'right';
  ls?: string;
  weight?: number;
  rtl?: boolean;
  children: React.ReactNode;
}> = ({x, y, k = 1, size = 44, font = F.serif, color = C.cream, italic, w, align = 'center', ls, weight, rtl, children}) => {
  if (k <= 0.001) return null;
  const tx = align === 'center' ? '-50%' : align === 'right' ? '-100%' : '0';
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        transform: `translate(${tx}, -50%) translateY(${(1 - k) * 16}px)`,
        opacity: clamp01(k),
        fontFamily: font,
        fontSize: size,
        color,
        fontStyle: italic ? 'italic' : 'normal',
        textAlign: align,
        lineHeight: 1.15,
        letterSpacing: ls,
        fontWeight: weight,
        direction: rtl ? 'rtl' : undefined,
        whiteSpace: w ? 'normal' : 'nowrap',
      }}
    >
      {children}
    </div>
  );
};

/** Mono uppercase label. */
export const L: React.FC<{x: number; y: number; k?: number; color?: string; size?: number; align?: 'center' | 'left' | 'right'; children: React.ReactNode}> = ({
  x,
  y,
  k = 1,
  color = C.muted,
  size = 20,
  align = 'center',
  children,
}) => (
  <T x={x} y={y} k={k} size={size} font={F.mono} color={color} ls="0.2em" align={align}>
    {typeof children === 'string' ? children.toUpperCase() : children}
  </T>
);

/** Path drawn on by k (needs pathLength=1 semantics). */
export const draw = (k: number) => ({pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - clamp01(k)});

export const Svg: React.FC<{children: React.ReactNode; o?: number}> = ({children, o = 1}) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0, opacity: o, overflow: 'visible'}}>
    {children}
  </svg>
);

export {C, F, clamp01, easeIn, easeInOut, easeOut, prog};
