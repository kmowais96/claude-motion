import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import timeline from './timeline.json';
import {N, NF, NH, NW, PAD_X, TEXT_W} from './theme';
import {band, clamp01, easeIn, easeInOut, easeOut, lerp, prog} from '../lib';
import {Grain, Mask} from '../components/primitives';
import {useFonts} from '../components/useFonts';

const TL = timeline;
const B = TL.beats;
export const NEWBORN_FPS = TL.fps;
export const NEWBORN_FRAMES = Math.round(TL.duration * TL.fps);
export const HANDLE = 'TheTazkiyyahGuide';

const words = TL.words as [string, number][];
/** Start of the first spoken word `w` at or after `after` seconds. */
const at = (w: string, after = 0) => {
  const hit = words.find(([x, s]) => x === w && s >= after);
  if (!hit) throw new Error(`word not in timeline: ${w}`);
  return hit[1];
};

const T = {
  heading1: at('One:'),
  calls: at('calls'),
  adhan: at('adhan,'),
  reason: at('reason:'),
  soften: at('Soften'),
  ibrahim: at('Ibrahim'),
  seven: at('seven:'),
  aqiqah: at('aqiqah.'),
  boy: at('Two', B.day7),
  girl: at('one', B.day7),
  shave: at('Shave'),
  weight: at('weight'),
  silver: at('silver'),
  charity: at('charity.'),
  fitrah: at('fitrah,'),
  puberty: at('puberty.'),
  scholar: at('scholar'),
  follow: at('Follow'),
};

/* ---------- photos ---------- */

type Shot = {
  src: string;
  w: number;
  h: number;
  from: number;
  to: number;
  fx: number; // horizontal focus 0..1 of the cover crop
  fy: number;
  zoom: [number, number];
  drift: [number, number]; // px of horizontal drift across the shot
  filter?: string;
};

const SHOTS: Shot[] = [
  {src: 'feet', w: 1333, h: 2000, from: 0, to: B.adhan, fx: 0.55, fy: 0.5, zoom: [1.04, 1.2], drift: [0, -30]},
  {src: 'minaret', w: 1389, h: 2000, from: B.adhan, to: B.tahnik, fx: 0.5, fy: 0.5, zoom: [1.12, 1.02], drift: [10, -10]},
  {src: 'dates', w: 2000, h: 1334, from: B.tahnik, to: B.name, fx: 0.45, fy: 0.5, zoom: [1.0, 1.14], drift: [40, -40]},
  {src: 'quran', w: 2000, h: 1125, from: B.name, to: B.day7, fx: 0.62, fy: 0.5, zoom: [1.06, 1.16], drift: [-30, 30]},
  {src: 'herd', w: 2000, h: 1334, from: T.aqiqah - 0.35, to: T.girl - 0.3, fx: 0.42, fy: 0.5, zoom: [1.0, 1.06], drift: [30, -20]},
  {src: 'goat', w: 2000, h: 1333, from: T.girl - 0.3, to: T.shave - 0.1, fx: 0.48, fy: 0.5, zoom: [1.1, 1.18], drift: [0, -20]},
  {src: 'feet', w: 1333, h: 2000, from: T.shave - 0.1, to: B.khitan, fx: 0.5, fy: 0.5, zoom: [1.2, 1.3], drift: [0, 0], filter: 'blur(10px) saturate(0.4) brightness(0.55)'},
  {src: 'mosque', w: 1427, h: 2000, from: B.khitan, to: TL.duration + 1, fx: 0.4, fy: 0.5, zoom: [1.02, 1.14], drift: [0, 20]},
];

const cover = (s: Shot) => {
  const k = Math.max(NW / s.w, NH / s.h);
  const w = s.w * k;
  const h = s.h * k;
  return {w, h, x: (NW - w) * s.fx, y: (NH - h) * s.fy};
};

const XF = 0.5;

const Photo: React.FC<{t: number; s: Shot; children?: React.ReactNode}> = ({t, s, children}) => {
  if (t < s.from - 0.05 || t > s.to + XF) return null;
  const o = Math.min(prog(t, s.from, s.from + XF, easeInOut), 1 - prog(t, s.to, s.to + XF, easeInOut));
  const k = prog(t, s.from, s.to + XF, (x) => x);
  const beat = s.src === 'feet' && t < B.tidings ? 0.012 * Math.max(0, Math.sin(t * 2 * Math.PI * 1.15)) ** 8 : 0;
  const z = lerp(s.zoom[0], s.zoom[1], k) + beat;
  const c = cover(s);
  return (
    <AbsoluteFill style={{opacity: s.from <= 0 ? 1 : o}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `translateX(${lerp(s.drift[0], s.drift[1], k)}px) scale(${z})`,
          transformOrigin: '50% 50%',
        }}
      >
        <Img
          src={staticFile(`newborn/${s.src}.jpg`)}
          style={{position: 'absolute', left: c.x, top: c.y, width: c.w, height: c.h, filter: s.filter}}
        />
        {children}
      </div>
    </AbsoluteFill>
  );
};

/** Sound rings leaving the minaret's loudspeakers; drawn in image space so they ride the zoom. */
const Rings: React.FC<{t: number; s: Shot}> = ({t, s}) => {
  const c = cover(s);
  const cx = c.x + c.w * 0.52;
  const cy = c.y + c.h * 0.54;
  const on = band(t, T.adhan - 0.2, T.adhan + 0.4) * (1 - band(t, B.tahnik - 0.6, B.tahnik));
  if (on <= 0) return null;
  return (
    <svg width={NW} height={NH} style={{position: 'absolute', inset: 0}}>
      {[0, 1, 2, 3].map((i) => {
        const p = ((t - T.adhan) / 2.4 + i / 4) % 1;
        if (p < 0) return null;
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={40 + p * 620}
            fill="none"
            stroke={N.gold}
            strokeWidth={3 - p * 2}
            strokeOpacity={on * 0.55 * (1 - p)}
          />
        );
      })}
    </svg>
  );
};

const Grade: React.FC<{t: number}> = ({t}) => {
  const day7Dark = band(t, B.day7 - 0.1, B.day7 + 0.5) * (1 - band(t, T.aqiqah - 0.35, T.aqiqah + 0.15));
  const ctaDim = band(t, B.cta, B.cta + 0.8);
  return (
    <>
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg, rgba(7,8,12,0.82) 0%, rgba(7,8,12,0.25) 30%, rgba(7,8,12,0.1) 50%, rgba(7,8,12,0.55) 70%, rgba(7,8,12,0.9) 100%)',
        }}
      />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 90% 70% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.5) 100%)'}} />
      <AbsoluteFill style={{background: N.ink, opacity: Math.max(day7Dark, ctaDim * 0.55)}} />
    </>
  );
};

/* ---------- type ---------- */

const Header: React.FC<{t: number; from: number; to: number; num: string; title: string; arabic: string; y?: number}> = ({
  t,
  from,
  to,
  num,
  title,
  arabic,
  y = 250,
}) => {
  if (t < from - 0.1 || t > to + 0.1) return null;
  const k1 = prog(t, from, from + 0.45, easeOut);
  const k2 = prog(t, from + 0.12, from + 0.6, easeOut);
  const k3 = prog(t, from + 0.3, from + 0.8, easeOut);
  const out = prog(t, to - 0.35, to, easeIn);
  return (
    <div style={{position: 'absolute', left: PAD_X, top: y, width: TEXT_W, opacity: 1 - out}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 18, opacity: k1}}>
        <div style={{width: 64 * k1, height: 3, background: N.gold}} />
        <div style={{fontFamily: NF.mono, fontWeight: 600, fontSize: 32, letterSpacing: '0.14em', color: N.gold}}>{num}</div>
      </div>
      <div style={{fontFamily: NF.serif, fontSize: 108, lineHeight: 1.0, color: N.cream, marginTop: 18, textShadow: '0 2px 20px rgba(0,0,0,0.6)'}}>
        <Mask k={k2} out={out * 0.3}>
          {title}
        </Mask>
      </div>
      <div style={{fontFamily: NF.arabic, fontSize: 62, lineHeight: 1.4, color: N.gold, marginTop: 6, direction: 'rtl', textAlign: 'left', opacity: k3, textShadow: '0 2px 16px rgba(0,0,0,0.85)'}}>
        {arabic}
      </div>
    </div>
  );
};

const Card: React.FC<{t: number; from: number; to: number; arabic?: string; english: string; by?: string; y: number}> = ({
  t,
  from,
  to,
  arabic,
  english,
  by,
  y,
}) => {
  if (t < from - 0.05 || t > to + 0.05) return null;
  const k = prog(t, from, from + 0.55, easeOut);
  const out = prog(t, to - 0.35, to, easeIn);
  return (
    <div
      style={{
        position: 'absolute',
        left: PAD_X,
        top: y,
        width: TEXT_W,
        opacity: k * (1 - out),
        transform: `translateY(${(1 - k) * 30}px)`,
        padding: '34px 40px 30px',
        borderLeft: `4px solid ${N.gold}`,
        background: 'rgba(7,8,12,0.62)',
        backdropFilter: 'blur(6px)',
        borderRadius: '0 18px 18px 0',
      }}
    >
      {arabic && (
        <div style={{fontFamily: NF.arabic, fontSize: 56, lineHeight: 1.55, color: N.cream, direction: 'rtl', textAlign: 'right'}}>{arabic}</div>
      )}
      <div style={{fontFamily: NF.serif, fontStyle: 'italic', fontSize: 50, lineHeight: 1.12, color: N.cream, marginTop: arabic ? 14 : 0}}>
        {english}
      </div>
      {by && <div style={{fontFamily: NF.mono, fontSize: 24, letterSpacing: '0.1em', color: N.gold, marginTop: 18, textTransform: 'uppercase'}}>{by}</div>}
    </div>
  );
};

const Cite: React.FC<{t: number; from: number; to: number; label: string}> = ({t, from, to, label}) => {
  const o = prog(t, from, from + 0.4) * (1 - prog(t, to - 0.3, to));
  if (o <= 0) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: PAD_X,
        top: 1590,
        opacity: o,
        fontFamily: NF.mono,
        fontSize: 24,
        letterSpacing: '0.08em',
        color: N.creamDim,
        padding: '10px 18px',
        border: `1.5px solid ${N.faint}`,
        borderRadius: 999,
        background: 'rgba(7,8,12,0.5)',
      }}
    >
      {label}
    </div>
  );
};

/* ---------- captions ---------- */

type Group = {from: number; words: [string, number][]};
const BEAT_STARTS = Object.values(B).sort((a, b) => a - b);
const groups: Group[] = (() => {
  const out: Group[] = [];
  let cur: [string, number][] = [];
  const beatOf = (s: number) => BEAT_STARTS.filter((b) => b <= s + 0.01).length;
  words.forEach(([w, s], i) => {
    if (cur.length && beatOf(s) !== beatOf(cur[0][1])) {
      out.push({from: cur[0][1], words: cur});
      cur = [];
    }
    cur.push([w, s]);
    const next = words[i + 1];
    const long = cur.map((c) => c[0]).join(' ').length;
    if (/[.:…,]$/.test(w) && (cur.length >= 2 || /[.:…]$/.test(w))) {
      out.push({from: cur[0][1], words: cur});
      cur = [];
    } else if (long > 22 || !next) {
      out.push({from: cur[0][1], words: cur});
      cur = [];
    }
  });
  return out;
})();

const Captions: React.FC<{t: number}> = ({t}) => {
  if (t < B.tidings || t >= T.follow - 0.1) return null;
  const i = groups.findIndex((g, j) => t >= g.from - 0.08 && (j + 1 === groups.length || t < groups[j + 1].from - 0.08));
  if (i < 0) return null;
  const g = groups[i];
  const last = g.words[g.words.length - 1][1];
  if (t > last + 1.1) return null;
  const k = prog(t, g.from - 0.08, g.from + 0.12, easeOut);
  return (
    <div
      style={{
        position: 'absolute',
        left: PAD_X,
        top: 1430,
        width: TEXT_W,
        fontFamily: NF.sans,
        fontWeight: 650,
        fontSize: 58,
        letterSpacing: '-0.01em',
        lineHeight: 1.15,
        color: N.cream,
        textShadow: '0 2px 18px rgba(0,0,0,0.75)',
        opacity: k,
        transform: `translateY(${(1 - k) * 12}px)`,
      }}
    >
      {g.words.map(([w, s], j) => {
        const nextS = j + 1 < g.words.length ? g.words[j + 1][1] : last + 0.6;
        const live = t >= s - 0.04 && t < nextS - 0.02;
        return (
          <span key={j} style={{display: 'inline-block', whiteSpace: 'nowrap', color: live ? N.gold : t < s ? 'rgba(245,239,226,0.5)' : N.cream, marginRight: '0.26em'}}>
            {w.replace(/[:]$/, '')}
          </span>
        );
      })}
    </div>
  );
};

/* ---------- scenes ---------- */

const Hook: React.FC<{t: number}> = ({t}) => {
  if (t > B.tidings + 0.3) return null;
  const a = at('Your');
  const b = at('a');
  const c = at('Before');
  const d = at('before');
  const e = at('do');
  const out1 = prog(t, e - 0.25, e + 0.1, easeIn);
  const outAll = prog(t, B.tidings - 0.2, B.tidings + 0.2, easeIn);
  const line = (from: number) => prog(t, from - 0.05, from + 0.45, easeOut);
  const strike = (from: number) => prog(t, from + 0.55, from + 0.95, easeInOut);
  return (
    <div style={{position: 'absolute', left: PAD_X, top: 560, width: TEXT_W, opacity: 1 - outAll}}>
      <div style={{fontFamily: NF.serif, fontSize: 128, lineHeight: 1.0, color: N.cream, opacity: 1 - out1}}>
        <Mask k={line(a)}>Your child was born</Mask>
        <br />
        <Mask k={line(b)}>
          <span style={{color: N.gold}}>a minute ago.</span>
        </Mask>
      </div>
      <div style={{marginTop: 56, fontFamily: NF.sans, fontWeight: 500, fontSize: 52, lineHeight: 1.35, color: N.creamDim, opacity: 1 - out1}}>
        {[
          [c, 'Before the photos.'],
          [d, 'Before the group chat.'],
        ].map(([from, txt]) => (
          <div key={txt as string} style={{position: 'relative', display: 'table', opacity: line(from as number)}}>
            {txt}
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: '54%',
                height: 4,
                width: `${strike(from as number) * 100}%`,
                background: N.gold,
              }}
            />
          </div>
        ))}
      </div>
      <div
        style={{
          position: 'absolute',
          top: 120,
          left: 0,
          fontFamily: NF.serif,
          fontSize: 220,
          lineHeight: 1,
          color: N.gold,
          opacity: prog(t, e, e + 0.3),
          transform: `scale(${lerp(1.12, 1, prog(t, e, e + 0.5, easeOut))})`,
          transformOrigin: '0% 50%',
        }}
      >
        Do this.
      </div>
    </div>
  );
};

const Day7Counter: React.FC<{t: number}> = ({t}) => {
  const from = B.day7 + 0.1;
  const to = T.aqiqah - 0.2;
  if (t < from - 0.1 || t > to + 0.3) return null;
  const n = Math.min(7, 1 + Math.floor(prog(t, from, T.seven, (x) => x) * 6.999));
  const o = prog(t, from, from + 0.3) * (1 - prog(t, to - 0.1, to + 0.3, easeIn));
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', opacity: o}}>
      <div style={{fontFamily: NF.mono, fontSize: 34, letterSpacing: '0.3em', color: N.creamDim}}>DAY</div>
      <div style={{fontFamily: NF.serif, fontSize: 420, lineHeight: 1, color: n === 7 ? N.gold : N.cream}}>{n}</div>
      <div style={{display: 'flex', gap: 26, marginTop: 30}}>
        {Array.from({length: 7}, (_, i) => (
          <div
            key={i}
            style={{
              width: 22,
              height: 22,
              borderRadius: 11,
              background: i < n ? N.gold : 'transparent',
              border: `2px solid ${i < n ? N.gold : N.faint}`,
            }}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};

const Sheep: React.FC<{k: number; size?: number}> = ({k, size = 130}) => (
  <svg width={size} height={size * 0.8} viewBox="0 0 100 80" style={{opacity: k, transform: `scale(${0.7 + 0.3 * k})`}}>
    <g fill={N.cream}>
      {[
        [30, 34],
        [44, 26],
        [58, 28],
        [68, 36],
        [56, 46],
        [40, 46],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={15} />
      ))}
    </g>
    <ellipse cx={82} cy={30} rx={10} ry={12} fill={N.ink} />
    <rect x={34} y={54} width={6} height={18} rx={3} fill={N.ink} />
    <rect x={58} y={54} width={6} height={18} rx={3} fill={N.ink} />
  </svg>
);

const Aqiqah: React.FC<{t: number}> = ({t}) => {
  const from = T.boy - 0.1;
  const to = T.shave - 0.1;
  if (t < from - 0.1 || t > to + 0.2) return null;
  const out = prog(t, to - 0.3, to, easeIn);
  const row = (label: string, n: number, at0: number) => {
    const k = prog(t, at0, at0 + 0.4, easeOut);
    return (
      <div style={{display: 'flex', alignItems: 'center', gap: 24, opacity: k, transform: `translateX(${(1 - k) * -30}px)`}}>
        <div style={{width: 200, fontFamily: NF.mono, fontWeight: 600, fontSize: 34, letterSpacing: '0.12em', color: N.gold}}>{label}</div>
        {Array.from({length: n}, (_, i) => (
          <Sheep key={i} k={prog(t, at0 + 0.15 + i * 0.22, at0 + 0.5 + i * 0.22, easeOut)} />
        ))}
        <div style={{fontFamily: NF.serif, fontSize: 64, color: N.cream, marginLeft: 8}}>× {n}</div>
      </div>
    );
  };
  return (
    <div
      style={{
        position: 'absolute',
        left: PAD_X,
        top: 940,
        width: TEXT_W,
        padding: '34px 40px',
        background: 'rgba(7,8,12,0.66)',
        borderRadius: 22,
        display: 'flex',
        flexDirection: 'column',
        gap: 22,
        opacity: prog(t, T.boy - 0.1, T.boy + 0.3) * (1 - out),
      }}
    >
      {row('BOY', 2, T.boy)}
      {row('GIRL', 1, T.girl)}
    </div>
  );
};

/** Balance: hair on the left pan, silver coins drop on the right until the beam levels. */
const Scale: React.FC<{t: number}> = ({t}) => {
  const from = T.shave - 0.1;
  const to = B.khitan;
  if (t < from - 0.1 || t > to + 0.1) return null;
  const o = prog(t, from, from + 0.4) * (1 - prog(t, to - 0.35, to, easeIn));
  const drops = [T.weight, T.silver, T.charity - 0.1];
  const coins = drops.map((d) => prog(t, d, d + 0.35, easeIn));
  const level = coins.reduce((a, b) => a + b, 0) / 3;
  const tilt = lerp(-12, 0, level) + Math.sin(t * 9) * 1.2 * (1 - level) * band(t, from, from + 0.4);
  const cx = 540;
  const cy = 820;
  const arm = 300;
  const rad = (tilt * Math.PI) / 180;
  const L = {x: cx - arm * Math.cos(rad), y: cy - arm * Math.sin(rad)};
  const R = {x: cx + arm * Math.cos(rad), y: cy + arm * Math.sin(rad)};
  const pan = (p: {x: number; y: number}, children: React.ReactNode) => (
    <g>
      <line x1={p.x} y1={p.y} x2={p.x - 90} y2={p.y + 170} stroke={N.silverDim} strokeWidth={2} />
      <line x1={p.x} y1={p.y} x2={p.x + 90} y2={p.y + 170} stroke={N.silverDim} strokeWidth={2} />
      <path d={`M ${p.x - 110} ${p.y + 170} Q ${p.x} ${p.y + 230} ${p.x + 110} ${p.y + 170} Z`} fill={N.silverDim} />
      {children}
    </g>
  );
  return (
    <svg width={NW} height={NH} style={{position: 'absolute', inset: 0, opacity: o}}>
      <line x1={cx} y1={cy - 10} x2={cx} y2={cy + 330} stroke={N.silver} strokeWidth={8} strokeLinecap="round" />
      <path d={`M ${cx - 90} ${cy + 340} L ${cx + 90} ${cy + 340}`} stroke={N.silver} strokeWidth={10} strokeLinecap="round" />
      <circle cx={cx} cy={cy - 14} r={14} fill={N.gold} />
      <line x1={L.x} y1={L.y} x2={R.x} y2={R.y} stroke={N.silver} strokeWidth={8} strokeLinecap="round" />
      {pan(
        L,
        <g stroke={N.cream} strokeWidth={2.4} fill="none" strokeLinecap="round" opacity={0.9}>
          {Array.from({length: 9}, (_, i) => (
            <path key={i} d={`M ${L.x - 60 + i * 15} ${L.y + 176} q 10 -26 ${18 - (i % 3) * 6} -40`} />
          ))}
        </g>,
      )}
      {pan(
        R,
        <g>
          {coins.map((k, i) =>
            k <= 0 ? null : (
              <ellipse
                key={i}
                cx={R.x - 30 + i * 30}
                cy={lerp(R.y - 260, R.y + 176 - i * 2, k)}
                rx={34}
                ry={11}
                fill={N.silver}
                stroke="#FFFFFF"
                strokeWidth={1.5}
                opacity={Math.min(1, k * 3)}
              />
            ),
          )}
        </g>,
      )}
      <text x={L.x} y={L.y + 270} textAnchor="middle" fill={N.creamDim} style={{fontFamily: NF.mono, fontSize: 26, letterSpacing: '0.14em'}}>
        HAIR
      </text>
      <text x={R.x} y={R.y + 270} textAnchor="middle" fill={N.gold} opacity={prog(t, T.silver, T.silver + 0.3)} style={{fontFamily: NF.mono, fontSize: 26, letterSpacing: '0.14em'}}>
        SILVER
      </text>
      <text x={cx} y={cy + 440} textAnchor="middle" fill={N.cream} opacity={prog(t, T.charity, T.charity + 0.4)} style={{fontFamily: NF.serif, fontStyle: 'italic', fontSize: 58}}>
        → given in charity
      </text>
    </svg>
  );
};

const Khitan: React.FC<{t: number}> = ({t}) => {
  if (t < T.fitrah - 0.2 || t > B.cta + 0.1) return null;
  const out = prog(t, B.cta - 0.3, B.cta, easeIn);
  const item = (from: number, a: string, b: string) => {
    const k = prog(t, from, from + 0.45, easeOut);
    return (
      <div style={{opacity: k, transform: `translateY(${(1 - k) * 20}px)`, marginBottom: 26}}>
        <div style={{fontFamily: NF.mono, fontSize: 26, letterSpacing: '0.14em', color: N.gold}}>{a}</div>
        <div style={{fontFamily: NF.serif, fontSize: 76, color: N.cream, lineHeight: 1.05}}>{b}</div>
      </div>
    );
  };
  return (
    <div style={{position: 'absolute', left: PAD_X, top: 880, width: TEXT_W, opacity: 1 - out, padding: '30px 40px 6px', background: 'rgba(7,8,12,0.66)', borderRadius: 22, boxSizing: 'border-box'}}>
      {item(T.fitrah - 0.1, 'RULING', 'From the fitrah')}
      {item(T.puberty - 0.1, 'WHEN', 'Required by puberty')}
      {item(T.scholar - 0.1, 'TIMING', 'Ask a scholar')}
    </div>
  );
};

const RECAP = [
  'Share the glad tidings',
  'Adhan in the right ear',
  'Tahnik with a date',
  'A good name',
  'Day 7: aqiqah, shave, silver',
  'Circumcision by puberty',
];

const Recap: React.FC<{t: number}> = ({t}) => {
  const from = B.cta + 0.1;
  if (t < from - 0.1) return null;
  const out = prog(t, T.follow - 0.3, T.follow + 0.1, easeIn);
  if (out >= 1) return null;
  return (
    <div style={{position: 'absolute', left: PAD_X, top: 330, width: TEXT_W, opacity: 1 - out}}>
      <div style={{fontFamily: NF.mono, fontSize: 30, letterSpacing: '0.16em', color: N.gold, opacity: prog(t, from, from + 0.3)}}>
        SAVE THIS FOR THE FIRST WEEK
      </div>
      {RECAP.map((r, i) => {
        const s = from + 0.2 + i * 0.3;
        const k = prog(t, s, s + 0.35, easeOut);
        const tick = prog(t, s + 0.15, s + 0.45, easeOut);
        return (
          <div key={r} style={{display: 'flex', alignItems: 'center', gap: 26, marginTop: 34, opacity: k, transform: `translateX(${(1 - k) * -24}px)`}}>
            <svg width={52} height={52} viewBox="0 0 52 52">
              <circle cx={26} cy={26} r={23} fill="none" stroke={N.gold} strokeWidth={2.5} />
              <path d="M 15 27 L 23 35 L 38 18" fill="none" stroke={N.gold} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={40} strokeDashoffset={40 * (1 - tick)} />
            </svg>
            <div style={{fontFamily: NF.serif, fontSize: 66, color: N.cream, lineHeight: 1.05}}>{r}</div>
          </div>
        );
      })}
    </div>
  );
};

const EndCard: React.FC<{t: number}> = ({t}) => {
  const k = prog(t, T.follow - 0.1, T.follow + 0.5, easeOut);
  if (k <= 0) return null;
  return (
    <AbsoluteFill style={{alignItems: 'flex-start', justifyContent: 'center', paddingLeft: PAD_X, paddingBottom: 140}}>
      <div style={{opacity: k, transform: `translateY(${(1 - k) * 26}px)`}}>
        <div style={{fontFamily: NF.mono, fontSize: 30, letterSpacing: '0.16em', color: N.gold}}>FOLLOW</div>
        <div style={{fontFamily: NF.serif, fontSize: 112, color: N.cream, lineHeight: 1.0, marginTop: 14}}>The Tazkiyyah Guide</div>
        <div style={{fontFamily: NF.mono, fontWeight: 600, fontSize: 44, color: N.gold, marginTop: 22}}>@{HANDLE}</div>
        <div style={{fontFamily: NF.sans, fontSize: 36, color: N.creamDim, marginTop: 16}}>for similar posts</div>
        <div style={{fontFamily: NF.sans, fontSize: 24, color: N.creamDim, marginTop: 80, width: TEXT_W, lineHeight: 1.4, opacity: prog(t, T.follow + 0.6, T.follow + 1.2)}}>
          Source: Ibn al-Qayyim, Tuhfat al-Mawdud bi Ahkam al-Mawlud (ed. al-Arna'ut, Damascus 1971). Educational reminder, not a fatwa.
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Handle: React.FC<{t: number}> = ({t}) => {
  const o = prog(t, 0.4, 1.0) * (1 - prog(t, T.follow - 0.3, T.follow));
  return (
    <div style={{position: 'absolute', left: PAD_X, top: 120, fontFamily: NF.mono, fontSize: 26, letterSpacing: '0.06em', color: N.creamDim, opacity: o}}>
      @{HANDLE} · Ibn al-Qayyim on the newborn
    </div>
  );
};

export const NewbornShort: React.FC = () => {
  useFonts();
  const frame = useCurrentFrame();
  const t = frame / NEWBORN_FPS;
  const minaret = SHOTS[1];
  const fade = prog(t, TL.duration - 0.5, TL.duration);
  const C = 'TUHFAT AL-MAWDUD';
  return (
    <AbsoluteFill style={{background: N.ink, overflow: 'hidden'}}>
      {SHOTS.map((s, i) => (
        <Photo key={i} t={t} s={s}>
          {s === minaret && <Rings t={t} s={s} />}
        </Photo>
      ))}
      <Grade t={t} />

      <Hook t={t} />
      <Header t={t} from={B.tidings} to={B.adhan} num="01" title="Share the glad tidings" arabic="البشارة والتهنئة" />
      <Card t={t} from={T.calls - 0.1} to={B.adhan} arabic="والتهنئة دعاء له بالخير فيه" english="“Congratulating is a dua for good in him.”" by="Ibn al-Qayyim" y={1000} />
      <Cite t={t} from={B.tidings + 0.4} to={B.adhan} label={`${C} · BAB 3 · P.27–28`} />

      <Header t={t} from={B.adhan} to={B.tahnik} num="02" title="Adhan in the right ear" arabic="التأذين في أذنه اليمنى" />
      <Card
        t={t}
        from={T.reason - 0.1}
        to={B.tahnik}
        arabic="أن يكون أول ما يقرع سمع الإنسان كلماته المتضمنة لكبرياء الرب وعظمته"
        english="“…that the first words to strike a person’s hearing carry the Lord’s greatness.”"
        by="Ibn al-Qayyim"
        y={930}
      />
      <Cite t={t} from={B.adhan + 0.4} to={B.tahnik} label={`${C} · BAB 4 · P.30–31`} />

      <Header t={t} from={B.tahnik} to={B.name} num="03" title="Tahnik with a date" arabic="وحنّكه بتمرة" />
      <Card t={t} from={T.soften - 0.1} to={B.name} english="Soften a date, rub it on the baby’s palate." by="Bukhari · Muslim, cited in Bab 5" y={1080} />
      <Cite t={t} from={B.tahnik + 0.4} to={B.name} label={`${C} · BAB 5 · P.32`} />

      <Header t={t} from={B.name} to={B.day7} num="04" title="A good name" arabic="التسمية" />
      <Card
        t={t}
        from={T.ibrahim - 0.15}
        to={B.day7}
        arabic="وُلد لي الليلة غلام فسميته باسم أبي إبراهيم"
        english="“A boy was born to me tonight, and I named him after my father, Ibrahim.”"
        by="Sahih Muslim, cited in Bab 8"
        y={960}
      />
      <Cite t={t} from={B.name + 0.4} to={B.day7} label={`${C} · BAB 8 · P.102–104`} />

      <Day7Counter t={t} />
      <Header t={t} from={T.aqiqah - 0.1} to={T.shave - 0.1} num="DAY 7" title="The aqiqah" arabic="العقيقة" />
      <Aqiqah t={t} />
      <Cite t={t} from={T.aqiqah + 0.3} to={T.shave - 0.1} label={`${C} · BAB 6 · P.62, 66`} />

      <Header t={t} from={T.shave - 0.1} to={B.khitan} num="DAY 7" title="Shave, weigh, give" arabic="حلق رأسه والتصدق بوزن شعره" />
      <Scale t={t} />
      <Cite t={t} from={T.shave + 0.3} to={B.khitan} label={`${C} · BAB 7 · P.97–98`} />

      <Header t={t} from={B.khitan} to={B.cta} num="LATER" title="Circumcision" arabic="الختان" />
      <Khitan t={t} />
      <Cite t={t} from={B.khitan + 0.4} to={B.cta} label={`${C} · BAB 9 · P.160, 180`} />

      <Recap t={t} />
      <EndCard t={t} />
      <Captions t={t} />
      <Handle t={t} />
      <Grain frame={frame} opacity={0.06} />
      <AbsoluteFill style={{background: '#000', opacity: fade}} />
    </AbsoluteFill>
  );
};
