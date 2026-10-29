import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import timeline from './timeline.json';
import {R, RF, RAIL_X, TEXT_W, TEXT_X} from './theme';
import {band, clamp01, easeIn, easeInOut, easeOut, lerp, prog} from '../lib';
import {useFonts} from '../components/useFonts';

const TLR = timeline;
export const RISE_FPS = TLR.fps;
export const RISE_FRAMES = Math.round(TLR.duration * TLR.fps);

type Group = {id: string; k: string; w: [string, number][]};
const groups = TLR.groups as Group[];

const mix = (a: string, b: string, k: number) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return `rgb(${x.map((v, i) => Math.round(lerp(v, y[i], k))).join(',')})`;
};

/** Piecewise position of the dot along the rail, in px. */
const dotY = (t: number) => {
  const kf = TLR.lift as number[][];
  if (t <= kf[0][0]) return kf[0][1];
  for (let i = 1; i < kf.length; i++) {
    if (t <= kf[i][0]) {
      const [t0, y0] = kf[i - 1];
      const [t1, y1] = kf[i];
      const ease = i === 1 ? easeIn : easeInOut;
      return lerp(y0, y1, prog(t, t0, t1, ease));
    }
  }
  return kf[kf.length - 1][1];
};

const RAIL_TOP = 260;
const RAIL_BOTTOM = 1620;

const Sky: React.FC<{t: number}> = ({t}) => {
  const dawn = band(t, TLR.dawn.from, TLR.dawn.to);
  const mid = band(t, TLR.stop, 30) * 0.25;
  const top = mix(R.night, R.sky, dawn * 0.9 + mid * 0.3);
  const bottom = mix(R.deep, R.dawnLow, dawn);
  const y = dotY(t);
  return (
    <AbsoluteFill style={{background: `linear-gradient(180deg, ${top} 0%, ${mix(R.night, R.dusk, dawn)} 55%, ${bottom} 100%)`}}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 80% 40% at 50% 100%, rgba(242,200,121,${0.55 * dawn}) 0%, rgba(242,200,121,0) 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle 520px at ${RAIL_X}px ${y}px, rgba(242,200,121,${0.06 + 0.2 * mid + 0.1 * dawn}) 0%, rgba(242,200,121,0) 70%)`,
        }}
      />
      {t < TLR.stop && (
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse 100% 70% at 50% 50%, rgba(0,0,0,0) 40%, rgba(120,30,30,${
              0.28 * band(t, 7, 8.6) * (1 - band(t, 12.8, 13.2))
            }) 100%)`,
          }}
        />
      )}
    </AbsoluteFill>
  );
};

const Rail: React.FC<{t: number}> = ({t}) => {
  const y = dotY(t);
  const climbed = band(t, TLR.stop, TLR.stop + 0.6);
  const pulse = 1 + 0.35 * Math.max(0, 1 - Math.abs(t - TLR.stop) * 3) + 0.06 * Math.sin(t * 3);
  const trembling = t > TLR.fall.land && t < TLR.stop ? Math.sin(t * 38) * 1.6 : 0;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      <line x1={RAIL_X} x2={RAIL_X} y1={RAIL_TOP} y2={RAIL_BOTTOM} stroke="rgba(244,239,227,0.14)" strokeWidth={2} />
      <line
        x1={RAIL_X}
        x2={RAIL_X}
        y1={y}
        y2={1500}
        stroke={R.gold}
        strokeOpacity={0.75 * climbed}
        strokeWidth={4}
        strokeLinecap="round"
      />
      <circle cx={RAIL_X + trembling} cy={y} r={46 * pulse} fill="rgba(242,200,121,0.14)" />
      <circle cx={RAIL_X + trembling} cy={y} r={20 * pulse} fill={mix(R.ash, R.gold, clamp01(climbed + band(t, 40, 44)))} />
    </svg>
  );
};

const Word: React.FC<{text: string; t: number; start: number; end: number}> = ({text, t, start, end}) => {
  const k = prog(t, start - 0.02, start + 0.22, easeOut);
  const out = prog(t, end - 0.25, end, easeIn);
  return (
    <span
      style={{
        display: 'inline-block',
        marginRight: '0.28em',
        opacity: k * (1 - out),
        transform: `translateY(${(1 - k) * 22 - out * 14}px)`,
      }}
    >
      {text}
    </span>
  );
};

const STYLE: Record<string, React.CSSProperties> = {
  big: {fontFamily: RF.serif, fontSize: 136, lineHeight: 1.0, color: R.cream},
  body: {fontFamily: RF.serif, fontSize: 92, lineHeight: 1.06, color: R.cream},
  voice: {fontFamily: RF.sans, fontSize: 96, lineHeight: 1.04, color: R.rose, fontWeight: 600, letterSpacing: '-0.02em'},
  stop: {fontFamily: RF.serif, fontSize: 280, lineHeight: 0.95, color: R.gold},
  scripture: {fontFamily: RF.serif, fontStyle: 'italic', fontSize: 72, lineHeight: 1.12, color: R.cream},
  rise: {fontFamily: RF.serif, fontSize: 220, lineHeight: 0.95, color: R.gold},
};

const Captions: React.FC<{t: number}> = ({t}) => {
  return (
    <>
      {groups.map((g, i) => {
        const first = g.w[0][1];
        const last = g.w[g.w.length - 1][1];
        const nextStart = i + 1 < groups.length ? groups[i + 1].w[0][1] : 61;
        const end = Math.min(nextStart - 0.04, last + 1.0);
        if (t < first - 0.05 || t > end) return null;
        const shake = g.k === 'voice' ? Math.sin(t * 61) * 3 : 0;
        const dim = g.k === 'voice' && t > 12.9 ? 0 : 1;
        return (
          <div
            key={g.id}
            style={{
              position: 'absolute',
              left: TEXT_X + shake,
              top: 0,
              width: TEXT_W,
              height: 1920,
              display: 'flex',
              alignItems: 'center',
              opacity: dim,
              ...STYLE[g.k],
            }}
          >
            <div>
              {g.w.map(([text, s], j) => (
                <Word key={j} text={text} t={t} start={s} end={end} />
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
};

const Tag: React.FC<{t: number; label: string; from: number; to: number; y: number; color?: string}> = ({
  t,
  label,
  from,
  to,
  y,
  color = R.gold,
}) => {
  const o = prog(t, from, from + 0.4, easeOut) * (1 - prog(t, to - 0.4, to, easeIn));
  if (o <= 0) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: TEXT_X,
        top: y,
        width: TEXT_W,
        opacity: o,
        fontFamily: RF.mono,
        fontSize: 28,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color,
      }}
    >
      {label}
    </div>
  );
};

const Chips: React.FC<{t: number; items: {label: string; t: number}[]; y: number; from: number; to: number; arrow?: boolean}> = ({
  t,
  items,
  y,
  from,
  to,
  arrow,
}) => {
  const o = prog(t, from, from + 0.3) * (1 - prog(t, to - 0.35, to));
  if (o <= 0) return null;
  return (
    <div style={{position: 'absolute', left: TEXT_X, top: y, width: TEXT_W, display: 'flex', gap: 14, alignItems: 'center', opacity: o, flexWrap: 'wrap'}}>
      {items.map((it, i) => {
        const k = prog(t, it.t, it.t + 0.3, easeOut);
        return (
          <React.Fragment key={it.label}>
            <div
              style={{
                fontFamily: RF.mono,
                fontSize: 30,
                fontWeight: 600,
                padding: '12px 22px',
                borderRadius: 999,
                border: `2px solid ${mix('#4A4F66', R.gold, k)}`,
                color: mix('#6A6F86', R.gold, k),
                background: `rgba(242,200,121,${0.14 * k})`,
                transform: `scale(${1 + 0.06 * Math.max(0, 1 - (t - it.t) * 3) * k})`,
              }}
            >
              {it.label}
            </div>
            {arrow && i < items.length - 1 && <span style={{color: R.ash, fontFamily: RF.mono, fontSize: 28}}>›</span>}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const Handle: React.FC<{t: number}> = ({t}) => {
  const o = prog(t, 0.5, 1.2) * (1 - band(t, 56.6, 57.0));
  const end = prog(t, 57.0, 57.8, easeOut);
  return (
    <>
      <div style={{position: 'absolute', left: TEXT_X, top: 150, fontFamily: RF.mono, fontSize: 28, letterSpacing: '0.06em', color: R.creamDim, opacity: o * 0.8}}>
        @{TLR.handle}
      </div>
      <div
        style={{
          position: 'absolute',
          left: TEXT_X,
          top: 1300,
          width: TEXT_W,
          opacity: end,
          transform: `translateY(${(1 - end) * 24}px)`,
          fontFamily: RF.mono,
          fontWeight: 600,
          fontSize: 54,
          color: R.cream,
        }}
      >
        @{TLR.handle}
        <div style={{fontFamily: RF.sans, fontWeight: 400, fontSize: 30, color: R.creamDim, marginTop: 12}}>Follow for the heart work</div>
      </div>
    </>
  );
};

export const RiseVideo: React.FC = () => {
  useFonts();
  const frame = useCurrentFrame();
  const t = frame / RISE_FPS;
  const flash = Math.max(0, 1 - (t - TLR.stop) * 4) * (t >= TLR.stop ? 1 : 0);
  const fade = prog(t, TLR.duration - 0.4, TLR.duration);
  return (
    <AbsoluteFill style={{background: R.night, overflow: 'hidden'}}>
      <Sky t={t} />
      <Rail t={t} />
      <Handle t={t} />
      <Captions t={t} />
      <Tag t={t} {...TLR.cite.quran} label={TLR.cite.quran.label} y={1380} />
      <Tag t={t} {...TLR.cite.hadith} label={TLR.cite.hadith.label} y={1380} />
      <Tag t={t} {...TLR.cite.madarij} label={TLR.cite.madarij.label} y={1300} color={R.creamDim} />
      <Chips t={t} items={TLR.stations} y={1400} from={39.4} to={45.2} arrow />
      <Chips t={t} items={TLR.steps} y={1400} from={46.3} to={50.4} />
      <AbsoluteFill style={{background: '#fff', opacity: flash * 0.5, pointerEvents: 'none'}} />
      <AbsoluteFill style={{background: '#000', opacity: fade}} />
    </AbsoluteFill>
  );
};
