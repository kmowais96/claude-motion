import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, useCurrentFrame} from 'remotion';
import {clamp01, easeIn, easeInOut, easeOut, prog} from '../../lib';
import {Grain} from '../../components/primitives';
import {qsp, QF, ReelTimeline} from '../theme';
import {N, shape, Shape, SPIN} from './shapes';

// A story reel: one glowing object that morphs on every 3 s beat, a fixed hook line on top,
// short captions with one italic accent word, a light "pill" interlude, a flare, an end card.

const S = {
  ink: '#050404',
  cream: '#F3EDE4',
  text: '#F4EDE4',
  dim: 'rgba(244,237,228,0.62)',
  inkText: '#1D1916',
  amber: '#FFC46B',
  orange: '#FF8A3D',
  pink: '#FF4D6D',
  accent: '#FF9A57',
  gold: '#FFB46B',
};
// Amiri as fallback carries ﷺ, which Inter doesn't have.
const SANS = '"Inter Variable", Inter, "Amiri", system-ui, sans-serif';
const CX = 540;
const CY = 880;
const BOX = 1000;

type Pill = {label: string; at: number};
type Beat = {in: number; out: number; text: string; shape?: string; pills?: Pill[]; flare?: boolean};

const useStoryFonts = () => {
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    Promise.all([
      document.fonts.load('400 50px "Inter Variable"'),
      document.fonts.load('italic 400 100px "Instrument Serif"'),
      document.fonts.load('400 100px "Amiri"', 'ﷺ زاد المعاد'),
    ]).then(() => continueRender(handle));
  }, [handle]);
};

/** Each beat's object; the pill interlude collapses to a spark, the end card is the emblem. */
const beatsOf = (tl: ReelTimeline): {name: string; in: number; hidden: boolean}[] => [
  ...(tl.cards as Beat[]).map((c) => ({name: c.pills ? 'spark' : c.shape ?? 'spark', in: c.in, hidden: !!c.pills})),
  {name: 'emblem', in: tl.book.in, hidden: false},
];

const placed = (sh: Shape, name: string, t: number, scale = 1) => {
  const a = SPIN.has(name) ? t * 0.12 : 0;
  const [c, s] = [Math.cos(a), Math.sin(a)];
  return sh.p.map(([x, y]) => [CX + (x * c - y * s) * scale, CY + (x * s + y * c) * scale] as [number, number]);
};

const MorphingObject: React.FC<{tl: ReelTimeline; t: number; hide: number; glowBoost: number}> = ({tl, t, hide, glowBoost}) => {
  const beats = beatsOf(tl);
  const cur = beats.reduce((a, b, i) => (t >= b.in - 0.3 ? i : a), 0);
  const from = beats[Math.max(0, cur - 1)];
  const to = beats[cur];
  const breathe = 1 + 0.015 * Math.sin(t * 1.6);
  const endScale = (b: {name: string}) => (b.name === 'emblem' ? 0.62 : 1);
  const A = placed(shape(from.name), from.name, t, endScale(from) * breathe);
  const B = placed(shape(to.name), to.name, t, endScale(to) * breathe);
  const brkA = shape(from.name).brk;
  const brkB = shape(to.name).brk;
  const s0 = to.in - 0.3;
  const ks = Array.from({length: N}, (_, i) =>
    cur === 0 ? 1 : prog(t, s0 + (0.3 * i) / N, s0 + (0.3 * i) / N + 0.62, easeInOut),
  );
  const pts = ks.map((k, i) => [A[i][0] + (B[i][0] - A[i][0]) * k, A[i][1] + (B[i][1] - A[i][1]) * k]);
  const brk = ks.map((k, i) => (k < 0.5 ? brkA[i] : brkB[i]));

  let d = '';
  pts.forEach(([x, y], i) => {
    d += `${brk[i] || i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
  });
  const lone = pts.filter((_, i) => brk[i] && (i === N - 1 || brk[i + 1]));
  const beads = pts.filter((_, i) => i % 12 === 6);
  // The opening spark grows in from nothing.
  const grow = 0.3 + 0.7 * prog(t, 0, 0.6, easeOut);
  const opacity = grow * (1 - hide);
  const glow = 0.8 + glowBoost;

  return (
    // The glow layer covers only the object's box: full-frame blurs left some frames half-painted.
    <svg
      width={BOX}
      height={BOX}
      viewBox={`${CX - BOX / 2} ${CY - BOX / 2} ${BOX} ${BOX}`}
      style={{position: 'absolute', left: CX - BOX / 2, top: CY - BOX / 2, opacity, overflow: 'visible'}}
    >
      <defs>
        <linearGradient id="hot" gradientUnits="userSpaceOnUse" x1={CX - 340} y1={CY - 300} x2={CX + 340} y2={CY + 300}>
          <stop offset="0%" stopColor={S.amber} />
          <stop offset="55%" stopColor={S.orange} />
          <stop offset="100%" stopColor={S.pink} />
        </linearGradient>
        <filter id="bloomWide" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="22" />
        </filter>
        <filter id="bloom" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>
      <g filter="url(#bloomWide)" opacity={0.55 * glow}>
        <path d={d} fill="none" stroke="url(#hot)" strokeWidth={18} strokeLinecap="round" strokeLinejoin="round" />
        {lone.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={10} fill="url(#hot)" />
        ))}
      </g>
      <g filter="url(#bloom)" opacity={0.9 * glow}>
        <path d={d} fill="none" stroke="url(#hot)" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <path d={d} fill="none" stroke="url(#hot)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke="#FFF1DC" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />
      {lone.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={4} fill="#FFE6C2" />
      ))}
      {beads.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={14} fill={S.orange} opacity={0.35} filter="url(#bloom)" />
          <circle cx={x} cy={y} r={5} fill="#FFF1DC" />
        </g>
      ))}
    </svg>
  );
};

/** Big bloom + lens streak for the one hero moment per reel. */
const Flare: React.FC<{k: number}> = ({k}) =>
  k < 0.01 ? null : (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${CX}px ${CY}px, rgba(255,200,120,${0.55 * k}) 0%, rgba(255,138,61,${0.28 * k}) 18%, rgba(255,77,109,${0.08 * k}) 38%, rgba(0,0,0,0) 60%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: CX - 520,
          top: CY - 4,
          width: 1040,
          height: 8,
          borderRadius: 8,
          background: `linear-gradient(90deg, rgba(255,138,61,0), rgba(255,226,180,${0.9 * k}), rgba(255,138,61,0))`,
          filter: 'blur(3px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: CX - 70 * k,
          top: CY - 70 * k,
          width: 140 * k,
          height: 140 * k,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(255,250,240,${k}) 0%, rgba(255,196,107,${0.8 * k}) 35%, rgba(255,138,61,0) 70%)`,
        }}
      />
    </AbsoluteFill>
  );

/** "a *word*" → words, with the starred span in the accent. */
const parse = (text: string) => {
  let accent = false;
  return text.split(/\s+/).filter(Boolean).map((raw) => {
    if (raw.startsWith('*')) accent = true;
    const word = {text: raw.replace(/\*/g, ''), accent};
    if (raw.endsWith('*')) accent = false;
    return word;
  });
};

const Caption: React.FC<{beat: Beat; t: number}> = ({beat, t}) => {
  if (!beat.text || t < beat.in || t > beat.out + 0.05) return null;
  const words = parse(beat.text);
  const out = prog(t, beat.out - 0.35, beat.out, easeIn);
  return (
    <div
      style={{
        position: 'absolute',
        top: 1250,
        left: 120,
        width: 840,
        textAlign: 'center',
        textWrap: 'balance',
        fontFamily: SANS,
        fontSize: 56,
        lineHeight: 1.25,
        letterSpacing: '-0.01em',
        color: S.text,
      }}
    >
      {words.map((w, i) => {
        const k = prog(t, beat.in + 0.12 + i * 0.05, beat.in + 0.62 + i * 0.05, easeOut);
        return (
          <React.Fragment key={i}>
            <span
              style={{
                display: 'inline-block',
                opacity: k * (1 - out),
                filter: `blur(${(1 - k) * 10 + out * 8}px)`,
                transform: `translateY(${(1 - k) * 14 - out * 8}px)`,
                ...(w.accent ? {fontFamily: QF.serif, fontStyle: 'italic', fontSize: 66, color: S.accent} : {}),
              }}
            >
              {w.text}
            </span>{' '}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const PILL_POS = [
  [380, 740],
  [690, 950],
  [400, 1160],
];

/** The light interlude: three pills joined by curves that draw on, like a small flow chart. */
const Pills: React.FC<{beat: Beat; t: number; fps: number; frame: number}> = ({beat, t, fps, frame}) => {
  const pills = beat.pills ?? [];
  const out = prog(t, beat.out - 0.25, beat.out + 0.1, easeIn);
  return (
    <AbsoluteFill style={{opacity: 1 - out}}>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <defs>
          <linearGradient id="link" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor={S.pink} />
            <stop offset="100%" stopColor={S.orange} />
          </linearGradient>
        </defs>
        {pills.slice(0, -1).map((p, i) => {
          const [x0, y0] = PILL_POS[i];
          const [x1, y1] = PILL_POS[i + 1];
          const k = prog(t, p.at + 0.15, pills[i + 1].at, easeInOut);
          return (
            <path
              key={i}
              d={`M${x0} ${y0 + 40} C${x0} ${y0 + 140}, ${x1} ${y1 - 140}, ${x1} ${y1 - 40}`}
              fill="none"
              stroke="url(#link)"
              strokeWidth={3}
              pathLength={1}
              strokeDasharray="1 1"
              strokeDashoffset={1 - k}
            />
          );
        })}
      </svg>
      {pills.map((p, i) => {
        const k = qsp(frame, p.at, fps, {damping: 12, stiffness: 190, mass: 0.75});
        const last = i === pills.length - 1;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: PILL_POS[i][0],
              top: PILL_POS[i][1],
              transform: `translate(-50%, -50%) scale(${0.6 + 0.4 * k})`,
              opacity: clamp01(k * 1.4),
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '26px 44px',
              borderRadius: 999,
              background: last ? `linear-gradient(90deg, #C8243F, ${S.orange})` : S.inkText,
              boxShadow: last ? '0 12px 40px rgba(255,77,109,0.45)' : '0 12px 34px rgba(29,25,22,0.28)',
              fontFamily: SANS,
              fontSize: 46,
              color: S.text,
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{width: 14, height: 14, borderRadius: 7, background: last ? '#FFE6C2' : S.orange, boxShadow: `0 0 14px ${S.orange}`}} />
            {p.label}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const EndCard: React.FC<{tl: ReelTimeline; t: number}> = ({tl, t}) => {
  const b = tl.book;
  if (t < b.in) return null;
  const k = (d: number) => prog(t, b.in + 0.3 + d, b.in + 1.1 + d, easeOut);
  const style = (d: number): React.CSSProperties => ({
    opacity: k(d),
    filter: `blur(${(1 - k(d)) * 10}px)`,
    transform: `translateY(${(1 - k(d)) * 16}px)`,
  });
  return (
    <div style={{position: 'absolute', top: 1150, width: '100%', textAlign: 'center'}}>
      <div style={{...style(0), fontFamily: QF.arabic, fontSize: 96, lineHeight: 1.5, color: S.gold, direction: 'rtl'}}>{b.ar}</div>
      <div style={{...style(0.15), fontFamily: QF.serif, fontStyle: 'italic', fontSize: 64, color: S.text, marginTop: 4}}>{b.en}</div>
      <div style={{...style(0.3), fontFamily: SANS, fontSize: 26, letterSpacing: '0.22em', color: S.dim, marginTop: 22}}>{b.sub}</div>
    </div>
  );
};

const mixRGB = (a: number[], b: number[], k: number) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(',')})`;

export const StoryReel: React.FC<{tl: ReelTimeline}> = ({tl}) => {
  useStoryFonts();
  const frame = useCurrentFrame();
  const t = frame / tl.fps;
  const beats = tl.cards as Beat[];

  const pillBeat = beats.find((b) => b.pills);
  const light = pillBeat
    ? prog(t, pillBeat.in - 0.2, pillBeat.in + 0.3, easeInOut) * (1 - prog(t, pillBeat.out - 0.2, pillBeat.out + 0.2, easeInOut))
    : 0;
  const flareBeat = beats.find((b) => b.flare);
  const fdt = flareBeat ? t - (tl.flareAt ?? flareBeat.in + 0.35) : -1;
  const flare = fdt < 0 ? 0 : prog(fdt, 0, 0.25, easeOut) * Math.exp(-fdt / 1.1);
  const end = clamp01((tl.duration - t) / 0.6);

  return (
    <AbsoluteFill style={{background: mixRGB([5, 4, 4], [243, 237, 228], light), opacity: 0.25 + 0.75 * end}}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 60% 34% at 50% ${(CY / 1920) * 100}%, rgba(255,138,61,${0.07 * (1 - light)}) 0%, rgba(0,0,0,0) 70%)`,
        }}
      />
      {light > 0.01 ? (
        <AbsoluteFill
          style={{
            opacity: light,
            background: 'radial-gradient(ellipse 70% 30% at 50% 80%, rgba(255,170,120,0.22) 0%, rgba(255,170,120,0) 70%)',
          }}
        />
      ) : null}
      <div
        style={{
          position: 'absolute',
          top: 400,
          width: '100%',
          textAlign: 'center',
          fontFamily: SANS,
          fontSize: 42,
          color: mixRGB([244, 237, 228], [29, 25, 22], light),
          opacity: 0.92 - 0.5 * light,
        }}
      >
        {tl.hook}
      </div>
      <MorphingObject tl={tl} t={t} hide={light} glowBoost={0.6 * flare} />
      <Flare k={flare} />
      {pillBeat && light > 0.01 ? <Pills beat={pillBeat} t={t} fps={tl.fps} frame={frame} /> : null}
      {beats.map((b, i) => (
        <Caption key={i} beat={b} t={t} />
      ))}
      <EndCard tl={tl} t={t} />
      <Grain frame={frame} opacity={0.06} />
    </AbsoluteFill>
  );
};
