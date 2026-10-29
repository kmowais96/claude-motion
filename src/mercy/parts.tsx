import React from 'react';
import {AbsoluteFill} from 'remotion';
import {geoDistance, geoGraticule10, geoOrthographic, geoPath, geoContains} from 'd3-geo';
import {feature} from 'topojson-client';
import landTopo from 'world-atlas/land-110m.json';
import {clamp01, easeIn, easeOut, lerp, prog, rand} from '../lib';
import {Grain} from '../components/primitives';
import {HANDLE, M, MF, MH, MT, MW} from './theme';

// ---------- colour helpers ----------
const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export const mix = (a: string, b: string, k: number) => {
  const A = hex(a);
  const B = hex(b);
  const c = A.map((v, i) => Math.round(lerp(v, B[i], clamp01(k))));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
};

// ---------- background ----------
const SCRATCHES = Array.from({length: 22}, (_, i) => ({
  x: rand(i * 3.1) * MW,
  y: rand(i * 7.7) * MH,
  len: 60 + rand(i * 1.9) * 220,
  a: -70 + rand(i * 5.3) * 40,
  o: 0.03 + rand(i * 2.2) * 0.05,
}));

export const Bg: React.FC<{
  frame: number;
  navy: number;
  warm: number;
  warmY?: number;
  shaft?: number;
}> = ({frame, navy, warm, warmY = 42, shaft = 0}) => {
  const jitter = Math.floor(frame / 3);
  return (
    <AbsoluteFill style={{background: M.bg}}>
      <AbsoluteFill
        style={{
          opacity: navy,
          background: `linear-gradient(180deg, ${M.navy} 0%, #191B24 55%, ${M.bg} 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          opacity: shaft,
          background:
            'linear-gradient(90deg, rgba(0,0,0,0) 30%, rgba(70,96,150,0.20) 50%, rgba(0,0,0,0) 70%)',
          maskImage: 'linear-gradient(180deg, #000 0%, rgba(0,0,0,0.6) 45%, rgba(0,0,0,0) 80%)',
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 70% 42% at 50% ${warmY}%, rgba(228,189,125,${
            0.22 * warm
          }) 0%, rgba(228,189,125,${0.07 * warm}) 45%, rgba(228,189,125,0) 75%)`,
        }}
      />
      <svg width={MW} height={MH} style={{position: 'absolute', inset: 0}}>
        {SCRATCHES.map((s, i) => {
          const dx = (rand(i + jitter * 0.37) - 0.5) * 6;
          const r = (s.a * Math.PI) / 180;
          return (
            <line
              key={i}
              x1={s.x + dx}
              y1={s.y}
              x2={s.x + dx + Math.cos(r) * s.len}
              y2={s.y + Math.sin(r) * s.len}
              stroke={M.cream}
              strokeOpacity={s.o}
              strokeWidth={1.2}
            />
          );
        })}
      </svg>
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse 80% 70% at 50% 45%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.62) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};

export const Overlay: React.FC<{frame: number}> = ({frame}) => <Grain frame={frame} opacity={0.08} />;

// ---------- torn paper tag ----------
const tornPoly = (seed: number) => {
  const pts: string[] = [];
  for (let i = 0; i <= 25; i++) pts.push(`${i * 4}% ${rand(seed + i) * 7}%`);
  for (let i = 0; i <= 4; i++) pts.push(`${100 - rand(seed + 40 + i) * 1.2}% ${i * 25}%`);
  for (let i = 25; i >= 0; i--) pts.push(`${i * 4}% ${100 - rand(seed + 80 + i) * 7}%`);
  return `polygon(${pts.join(',')})`;
};

export type TagPart = {t: string; red?: boolean};

export const Tag: React.FC<{
  parts: TagPart[];
  x: number;
  y: number;
  size?: number;
  rot?: number;
  k: number;
  out?: number;
  seed?: number;
  redK?: number;
}> = ({parts, x, y, size = 64, rot = -2, k, out = 0, seed = 1, redK = 1}) => {
  if (k <= 0.001 || out >= 0.999) return null;
  const scale = lerp(1.22, 1, Math.min(k, 1.2)) * lerp(1, 0.94, out);
  const op = clamp01(k * 3) * (1 - out);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%,-50%) translateY(${-50 * out}px) rotate(${rot + (1 - Math.min(k, 1)) * 7}deg) scale(${scale})`,
        opacity: op,
        filter: 'drop-shadow(0 14px 22px rgba(0,0,0,0.55))',
      }}
    >
      <div
        style={{
          clipPath: tornPoly(seed * 13),
          background: `linear-gradient(175deg, #E6DDCE 0%, ${M.paper} 60%, #CFC4B1 100%)`,
          padding: `${size * 0.36}px ${size * 0.5}px`,
          display: 'flex',
          alignItems: 'center',
          gap: size * 0.22,
          whiteSpace: 'nowrap',
          fontFamily: MF.sans,
          fontWeight: 800,
          fontSize: size,
          letterSpacing: '-0.01em',
          lineHeight: 1,
          color: M.ink,
          textTransform: 'uppercase',
        }}
      >
        {parts.map((p, i) => (
          <span
            key={i}
            style={
              p.red
                ? {
                    background: mix(M.paper, M.red, redK),
                    color: mix(M.ink, '#F6EEE2', redK),
                    padding: `${size * 0.16}px ${size * 0.22}px ${size * 0.12}px`,
                    margin: `-${size * 0.1}px 0`,
                  }
                : {}
            }
          >
            {p.t}
          </span>
        ))}
      </div>
    </div>
  );
};

// ---------- small dark label box ----------
export const Label: React.FC<{text: string; x: number; y: number; k: number; out?: number; size?: number}> = ({
  text,
  x,
  y,
  k,
  out = 0,
  size = 50,
}) => {
  if (k <= 0.001 || out >= 0.999) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%,-50%) translateY(${(1 - k) * 18 - out * 24}px)`,
        opacity: clamp01(k) * (1 - out),
        background: 'rgba(22,20,18,0.92)',
        border: `2px solid ${M.line}`,
        padding: '18px 34px 20px',
        fontFamily: MF.serif,
        fontStyle: 'italic',
        fontSize: size,
        color: M.cream,
        whiteSpace: 'nowrap',
        lineHeight: 1,
      }}
    >
      {text}
    </div>
  );
};

// ---------- handle ----------
export const Handle: React.FC<{o: number}> = ({o}) => (
  <div
    style={{
      position: 'absolute',
      top: 128,
      width: MW,
      textAlign: 'center',
      fontFamily: MF.mono,
      fontWeight: 600,
      fontSize: 27,
      letterSpacing: '0.12em',
      color: M.creamDim,
      opacity: o,
    }}
  >
    {HANDLE}
  </div>
);

// ---------- captions ----------
type Cap = {s: number; e: number; w: number[]};
const CAPS = MT.captions as Cap[];
const WORDS = MT.words as {t: string; s: number; e: number}[];

export const Captions: React.FC<{t: number; y?: number; o?: number}> = ({t, y = 1395, o = 1}) => {
  let idx = -1;
  for (let i = 0; i < CAPS.length; i++) {
    const c = CAPS[i];
    const next = CAPS[i + 1];
    const end = Math.min(c.e + 0.7, next ? next.s - 0.04 : c.e + 1.2);
    if (t >= c.s - 0.1 && t <= end) idx = i;
  }
  if (idx < 0) return null;
  const c = CAPS[idx];
  const next = CAPS[idx + 1];
  const end = Math.min(c.e + 0.7, next ? next.s - 0.04 : c.e + 1.2);
  const kin = prog(t, c.s - 0.1, c.s + 0.12, easeOut);
  const kout = next && next.s - 0.04 <= c.e + 0.7 ? 0 : prog(t, end - 0.18, end, easeIn);
  return (
    <div
      style={{
        position: 'absolute',
        top: y,
        left: 90,
        width: MW - 180,
        textAlign: 'center',
        transform: `translateY(${(1 - kin) * 16}px)`,
        opacity: kin * (1 - kout) * o,
        fontFamily: MF.sans,
        fontWeight: 700,
        fontSize: 56,
        lineHeight: 1.15,
        letterSpacing: '-0.01em',
        textShadow: '0 3px 14px rgba(0,0,0,0.85), 0 0 2px rgba(0,0,0,0.9)',
      }}
    >
      {c.w.map((j, n) => {
        const w = WORDS[j];
        const active = t >= w.s - 0.03 && t <= w.e + 0.08;
        const past = t > w.e + 0.08;
        return (
          <span
            key={n}
            style={{
              color: active ? M.gold : M.cream,
              opacity: active || past ? 1 : 0.42,
            }}
          >
            {w.t.replace(/"/g, '')}
            {n < c.w.length - 1 ? ' ' : ''}
          </span>
        );
      })}
    </div>
  );
};

// ---------- globe ----------
const LAND = feature(landTopo as any, (landTopo as any).objects.land) as any;
const GRAT = geoGraticule10();

/** Points on land, used for the spreading "sins". Deterministic. */
export const SPOTS: {lon: number; lat: number; r: number; d: number}[] = (() => {
  const out: {lon: number; lat: number; r: number; d: number}[] = [];
  for (let i = 0; out.length < 120 && i < 4000; i++) {
    const lon = -180 + rand(i * 1.37 + 0.2) * 360;
    const lat = -55 + rand(i * 2.71 + 0.9) * 125;
    if (geoContains(LAND, [lon, lat])) out.push({lon, lat, r: 0.6 + rand(i * 9.1) * 1.1, d: rand(i * 4.4)});
  }
  return out;
})();

export const Globe: React.FC<{
  cx: number;
  cy: number;
  r: number;
  spin: number;
  tilt?: number;
  gold?: number;
  spots?: number;
  wash?: number;
  o?: number;
  glow?: number;
}> = ({cx, cy, r, spin, tilt = -18, gold = 0, spots = 0, wash = 0, o = 1, glow = 0}) => {
  if (o <= 0.001) return null;
  const proj = geoOrthographic().scale(r).translate([cx, cy]).rotate([spin, tilt]).clipAngle(90);
  const path = geoPath(proj);
  const center: [number, number] = [-spin, -tilt];
  const landFill = mix(M.land, M.gold, gold);
  return (
    <svg width={MW} height={MH} style={{position: 'absolute', inset: 0, opacity: o, overflow: 'visible'}}>
      <defs>
        <radialGradient id="oceanG" cx="42%" cy="38%" r="70%">
          <stop offset="0%" stopColor="#2C3A52" />
          <stop offset="70%" stopColor={M.ocean} />
          <stop offset="100%" stopColor="#121A27" />
        </radialGradient>
        <radialGradient id="shadeG" cx="38%" cy="32%" r="78%">
          <stop offset="55%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.55" />
        </radialGradient>
        <radialGradient id="haloG" cx="50%" cy="50%" r="50%">
          <stop offset="60%" stopColor={M.gold} stopOpacity={0.5 * glow} />
          <stop offset="100%" stopColor={M.gold} stopOpacity="0" />
        </radialGradient>
      </defs>
      {glow > 0 && <circle cx={cx} cy={cy} r={r * 1.65} fill="url(#haloG)" />}
      <circle cx={cx} cy={cy} r={r + 6} fill="none" stroke="rgba(150,175,220,0.18)" strokeWidth={10} />
      <circle cx={cx} cy={cy} r={r} fill="url(#oceanG)" />
      <path d={path(GRAT) ?? ''} fill="none" stroke="rgba(236,228,214,0.07)" strokeWidth={1.2} />
      <path d={path(LAND) ?? ''} fill={landFill} stroke="rgba(0,0,0,0.25)" strokeWidth={1} />
      {spots > 0 &&
        SPOTS.map((s, i) => {
          if (geoDistance([s.lon, s.lat], center) > Math.PI / 2 - 0.05) return null;
          const p = proj([s.lon, s.lat]);
          if (!p) return null;
          const grow = clamp01((spots - s.d * 0.7) / 0.3);
          const fade = clamp01((wash - (p[0] - cx + r) / (2 * r) * 0.7) / 0.3);
          const rr = r * 0.045 * s.r * grow * (1 - fade);
          if (rr <= 0.3) return null;
          return (
            <g key={i}>
              <circle cx={p[0]} cy={p[1]} r={rr} fill="#141110" />
              {i % 5 === 0 && <circle cx={p[0]} cy={p[1]} r={rr * 1.15} fill="none" stroke={M.red} strokeWidth={2} />}
            </g>
          );
        })}
      <circle cx={cx} cy={cy} r={r} fill="url(#shadeG)" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(236,228,214,0.35)" strokeWidth={2} />
    </svg>
  );
};

/** Deterministic starfield. */
const STARS = Array.from({length: 90}, (_, i) => ({x: rand(i * 3.3) * MW, y: rand(i * 5.9) * MH * 0.8, s: 1 + rand(i * 8.1) * 2}));
export const Stars: React.FC<{o: number; t: number}> = ({o, t}) =>
  o <= 0.001 ? null : (
    <svg width={MW} height={MH} style={{position: 'absolute', inset: 0, opacity: o}}>
      {STARS.map((s, i) => (
        <circle
          key={i}
          cx={s.x}
          cy={s.y}
          r={s.s}
          fill={M.cream}
          opacity={0.25 + 0.35 * (0.5 + 0.5 * Math.sin(t * 1.3 + i))}
        />
      ))}
    </svg>
  );
