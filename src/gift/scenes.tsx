import React from 'react';
import {clamp01, easeIn, easeInOut, easeOut, lerp, prog, rand, sp} from '../lib';
import {Roll} from '../components/primitives';
import {M, MF, MW} from '../mercy/theme';
import {Tag} from '../mercy/parts';
import {Center, Line, Mono} from '../kishk/ui';
import {Person} from '../generous/scenes';
import {AFPS, END, LINES, s, w} from './theme';

type P = {t: number; frame: number};
const POPC = {damping: 10, stiffness: 210, mass: 0.7};
const SOFT = {damping: 16, stiffness: 120, mass: 0.9};
const spring = (frame: number, at: number, cfg = POPC) => sp(frame, at, cfg, AFPS);
/** Visibility of a window [a, b] with fades. */
const vis = (t: number, a: number, b: number, fin = 0.4, fout = 0.4) =>
  Math.min(prog(t, a - fin, a, easeInOut), 1 - prog(t, b, b + fout, easeInOut));
const fmt = (n: number) => Math.round(n).toLocaleString('en-US');

const H = 1920;

// ---------- the gift: a bowl of tharid, steaming ----------
export const Bowl: React.FC<{x: number; y: number; sc: number; t: number; o?: number; glow?: number; id?: string}> = ({
  x,
  y,
  sc,
  t,
  o = 1,
  glow = 1,
  id = 'b',
}) => {
  if (o <= 0.001 || sc <= 0.001) return null;
  return (
    <g transform={`translate(${x} ${y}) scale(${sc})`} opacity={o}>
      <defs>
        <radialGradient id={`${id}Halo`} cx="50%" cy="50%" r="50%">
          <stop offset="0.2" stopColor={M.gold} stopOpacity={0.32 * glow} />
          <stop offset="1" stopColor={M.gold} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}Body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8A5A2E" />
          <stop offset="1" stopColor="#4A2E18" />
        </linearGradient>
        <radialGradient id={`${id}Food`} cx="45%" cy="35%" r="70%">
          <stop offset="0" stopColor={M.goldHi} />
          <stop offset="0.7" stopColor={M.gold} />
          <stop offset="1" stopColor={M.goldDeep} />
        </radialGradient>
      </defs>
      <ellipse cx={0} cy={-10} rx={260} ry={200} fill={`url(#${id}Halo)`} />
      {/* steam */}
      {[-46, 0, 46].map((dx, i) => {
        const ph = (t * 0.45 + i * 0.33) % 1;
        const sway = Math.sin(t * 1.6 + i * 2) * 10;
        return (
          <path
            key={i}
            d={`M${dx} -40 C ${dx - 18 + sway} -80, ${dx + 18 - sway} -110, ${dx + sway} -150`}
            stroke={M.cream}
            strokeWidth={6}
            strokeLinecap="round"
            fill="none"
            opacity={0.32 * Math.sin(ph * Math.PI)}
            transform={`translate(0 ${-ph * 26})`}
          />
        );
      })}
      {/* mound of tharid, then the bowl in front of it */}
      <ellipse cx={0} cy={-6} rx={118} ry={40} fill={`url(#${id}Food)`} />
      <path d="M-124 -4 Q-110 -44 -40 -40 Q0 -64 44 -42 Q112 -44 124 -4 Z" fill={`url(#${id}Food)`} />
      <path d="M-150 -4 L150 -4 Q140 92 0 100 Q-140 92 -150 -4 Z" fill={`url(#${id}Body)`} />
      <path d="M-150 -4 L150 -4" stroke={M.goldHi} strokeWidth={5} strokeLinecap="round" />
      <path d="M-120 30 Q0 52 120 30" stroke={M.gold} strokeOpacity={0.45} strokeWidth={3} fill="none" />
      <ellipse cx={0} cy={104} rx={60} ry={9} fill="#2E1D10" />
    </g>
  );
};

// ======================= 1. Who he was =======================
export const Intro: React.FC<P> = ({t, frame}) => {
  const z = s('dhahabi') - 0.4;
  const o = 1 - prog(t, z, z + 0.4, easeInOut);
  if (o <= 0.001) return null;
  const name = w('sad1.sa‘d');
  const bowlIn = spring(frame, 0.05, SOFT);
  const bowlOut = prog(t, s('arabs') - 0.5, s('arabs') + 0.2, easeInOut);
  const up = prog(t, s('arabs') - 0.4, s('arabs') + 0.3, easeInOut);
  return (
    <div style={{position: 'absolute', inset: 0, opacity: o}}>
      <svg width={MW} height={H} style={{position: 'absolute', inset: 0}}>
        <Bowl x={540} y={lerp(560, 470, prog(t, name - 0.6, name + 0.3, easeInOut))} sc={lerp(0.6, 1.25, Math.min(bowlIn, 1.05))} t={t} o={1 - bowlOut} id="intro" />
      </svg>
      <Line t={t} at={0.25} out={name - 0.55} y={760} size={74} italic color={M.cream}>
        The man who sent the Prophet
      </Line>
      <Line t={t} at={0.6} out={name - 0.5} y={850} size={74} italic color={M.gold}>
        a gift, nearly every day.
      </Line>
      <div style={{position: 'absolute', inset: 0, transform: `translateY(${lerp(0, -330, up)}px) scale(${lerp(1, 0.78, up)})`, transformOrigin: '50% 770px'}}>
        <Line t={t} at={name - 0.1} out={z} y={720} size={128} color={M.cream}>
          Sa‘d ibn ‘Ubadah
        </Line>
        <Mono t={t} at={s('pleased')} out={z} y={880} text="MAY ALLAH BE PLEASED WITH HIM" color={M.gold} size={30} />
      </div>
      <Tag
        parts={[{t: 'MOST GENEROUS OF THE'}, {t: 'ARABS', red: true}]}
        x={540}
        y={760}
        size={52}
        rot={-2}
        k={spring(frame, w('arabs.most') - 0.05)}
        seed={4}
        redK={prog(t, w('arabs.arabs') - 0.05, w('arabs.arabs') + 0.2)}
      />
      <Tag
        parts={[{t: 'AND OF THE'}, {t: 'MUSLIMS', red: true}]}
        x={560}
        y={920}
        size={52}
        rot={2}
        k={spring(frame, s('muslims') - 0.05)}
        seed={9}
        redK={prog(t, w('muslims.muslims') - 0.05, w('muslims.muslims') + 0.2)}
      />
    </div>
  );
};

// ======================= 2. Al-Dhahabi's Siyar =======================
const PAGE_LINES = Array.from({length: 13}, (_, i) => 0.55 + rand(i * 4.7) * 0.4);

export const Siyar: React.FC<P> = ({t, frame}) => {
  const a = s('dhahabi') - 0.2;
  const z = s('khazraj') - 0.6;
  const o = vis(t, a, z, 0.4, 0.4);
  if (o <= 0.001) return null;
  const rise = spring(frame, a, SOFT);
  const open = prog(t, w('siyar.in') - 0.1, w('siyar.in') + 0.7, easeInOut);
  const mark = prog(t, s('sad2') - 0.05, s('sad2') + 0.6, easeOut);
  const cx = 540;
  const cy = 760;
  const pw = 360; // page width
  const ph = 500;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: o, transform: `translateY(${(1 - Math.min(rise, 1)) * 60}px)`}}>
      <Mono t={t} at={a + 0.1} out={z} y={300} text="IMAM AL-DHAHABI · 673–748 AH" color={M.gold} size={30} />
      <svg width={MW} height={H} style={{position: 'absolute', inset: 0}}>
        <ellipse cx={cx} cy={cy + ph / 2 + 30} rx={440} ry={36} fill="#000" opacity={0.35} />
        {/* the open spread underneath */}
        <g opacity={open}>
          <path d={`M${cx} ${cy - ph / 2} Q${cx - pw / 2} ${cy - ph / 2 - 22} ${cx - pw} ${cy - ph / 2} L${cx - pw} ${cy + ph / 2} Q${cx - pw / 2} ${cy + ph / 2 - 22} ${cx} ${cy + ph / 2} Z`} fill={M.paper} />
          <path d={`M${cx} ${cy - ph / 2} Q${cx + pw / 2} ${cy - ph / 2 - 22} ${cx + pw} ${cy - ph / 2} L${cx + pw} ${cy + ph / 2} Q${cx + pw / 2} ${cy + ph / 2 - 22} ${cx} ${cy + ph / 2} Z`} fill="#E6DDCE" />
          <line x1={cx} y1={cy - ph / 2} x2={cx} y2={cy + ph / 2} stroke="#B9AE9B" strokeWidth={3} />
          {PAGE_LINES.map((len, i) => (
            <g key={i}>
              <rect x={cx - pw + 40} y={cy - ph / 2 + 50 + i * 33} width={(pw - 80) * len} height={9} rx={4} fill={M.ink} opacity={0.22} />
              {i !== 4 && <rect x={cx + 40} y={cy - ph / 2 + 50 + i * 33} width={(pw - 80) * PAGE_LINES[(i + 5) % 13]} height={9} rx={4} fill={M.ink} opacity={0.22} />}
            </g>
          ))}
          {/* the entry being read */}
          <rect x={cx + 30} y={cy - ph / 2 + 30 + 4 * 33} width={(pw - 60) * mark} height={46} fill={M.gold} opacity={0.85} />
        </g>
        {/* the closed cover, swinging open */}
        <g transform={`translate(${cx - pw / 2 + (pw / 2) * open} ${cy}) scale(${1 - open * 1.02} 1)`} opacity={1 - prog(t, w('siyar.in') + 0.3, w('siyar.in') + 0.6)}>
          <rect x={-pw / 2 - 30} y={-ph / 2 - 10} width={pw + 60} height={ph + 20} rx={10} fill="#3A2416" />
          <rect x={-pw / 2 - 30} y={-ph / 2 - 10} width={pw + 60} height={ph + 20} rx={10} fill="none" stroke={M.goldDeep} strokeWidth={4} />
          <rect x={-pw / 2 - 6} y={-ph / 2 + 14} width={pw + 12} height={ph - 28} rx={4} fill="none" stroke={M.gold} strokeOpacity={0.6} strokeWidth={2} />
          <circle cx={0} cy={-30} r={70} fill="none" stroke={M.gold} strokeOpacity={0.5} strokeWidth={2} />
          <circle cx={0} cy={-30} r={52} fill="none" stroke={M.gold} strokeOpacity={0.35} strokeWidth={2} />
        </g>
      </svg>
      {/* cover title, folding away with the cover */}
      <div style={{opacity: 1 - prog(t, w('siyar.in') - 0.1, w('siyar.in') + 0.25)}}>
        <Center y={cy - 64} style={{fontFamily: MF.serif, fontSize: 64, lineHeight: 1, color: M.goldHi}}>
          Siyar
        </Center>
        <Center y={cy + 70} style={{fontFamily: MF.mono, fontWeight: 600, fontSize: 21, letterSpacing: '0.2em', color: M.gold}}>
          A‘LĀM AN-NUBALĀ’
        </Center>
        <Center y={cy + 160} style={{fontFamily: MF.mono, fontWeight: 600, fontSize: 18, letterSpacing: '0.24em', color: M.goldDeep}}>
          AL-DHAHABI
        </Center>
      </div>
      <div
        style={{
          position: 'absolute',
          left: cx + 46,
          top: cy - ph / 2 + 44 + 4 * 33,
          fontFamily: MF.sans,
          fontWeight: 800,
          fontSize: 28,
          letterSpacing: '0.02em',
          color: M.ink,
          opacity: prog(t, s('sad2') + 0.15, s('sad2') + 0.45),
        }}
      >
        SA‘D IBN ‘UBADAH
      </div>
      <Mono t={t} at={open > 0.5 ? w('siyar.in') + 0.4 : 999} out={z} y={1100} text="LIVES OF THE NOBLE FIGURES" color={M.muted} size={26} />
    </div>
  );
};

// ======================= 3. Madinah, from the hijrah until his death =======================
const MAKKAH: [number, number] = [380, 1060];
const MADINAH: [number, number] = [650, 560];
const CTRL: [number, number] = [230, 740];
const qpt = (k: number): [number, number] => {
  const u = 1 - k;
  return [u * u * MAKKAH[0] + 2 * u * k * CTRL[0] + k * k * MADINAH[0], u * u * MAKKAH[1] + 2 * u * k * CTRL[1] + k * k * MADINAH[1]];
};
const DOTS = Array.from({length: 140}, (_, i) => ({x: 120 + (i % 14) * 65 + (Math.floor(i / 14) % 2) * 32, y: 420 + Math.floor(i / 14) * 75}));

export const Hijrah: React.FC<P> = ({t, frame}) => {
  const a = s('khazraj') - 0.3;
  const z = s('know') - 0.3;
  const o = vis(t, a, z, 0.4, 0.45);
  if (o <= 0.001) return null;
  const route = prog(t, s('emigrated') - 0.1, w('madinah.to') + 0.4, easeInOut);
  const arrive = spring(frame, w('madinah.to') + 0.35);
  const p = qpt(route);
  const took = prog(t, s('took'), s('took') + 1.0, easeInOut);
  const pulse = (t * 0.8) % 1;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: o}}>
      <Tag parts={[{t: 'CHIEF OF THE'}, {t: 'KHAZRAJ', red: true}]} x={540} y={300} size={54} rot={-2} k={spring(frame, w('khazraj.chief') - 0.1)} seed={14} />
      <svg width={MW} height={H} style={{position: 'absolute', inset: 0, opacity: prog(t, s('emigrated') - 0.5, s('emigrated'))}}>
        {DOTS.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={2.2} fill={M.cream} opacity={0.12} />
        ))}
        <path
          d={`M${MAKKAH[0]} ${MAKKAH[1]} Q${CTRL[0]} ${CTRL[1]} ${MADINAH[0]} ${MADINAH[1]}`}
          stroke={M.cream}
          strokeOpacity={0.18}
          strokeWidth={4}
          strokeDasharray="2 14"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d={`M${MAKKAH[0]} ${MAKKAH[1]} Q${CTRL[0]} ${CTRL[1]} ${MADINAH[0]} ${MADINAH[1]}`}
          stroke={M.gold}
          strokeWidth={6}
          strokeLinecap="round"
          fill="none"
          pathLength={1}
          strokeDasharray={`${route} 1`}
        />
        <circle cx={MAKKAH[0]} cy={MAKKAH[1]} r={12} fill={M.cream} opacity={0.6} />
        <circle cx={MADINAH[0]} cy={MADINAH[1]} r={14 + 6 * Math.min(arrive, 1.2)} fill={M.gold} opacity={0.2 + 0.8 * clamp01(arrive)} />
        {arrive > 0.5 && took < 1 && <circle cx={MADINAH[0]} cy={MADINAH[1]} r={20 + pulse * 70} fill="none" stroke={M.gold} strokeWidth={3} opacity={(1 - pulse) * 0.6 * (1 - took)} />}
        {route > 0.01 && route < 0.995 && <circle cx={p[0]} cy={p[1]} r={13} fill={M.goldHi} />}
        {/* ten years held at Madinah: a ring that closes */}
        <circle
          cx={MADINAH[0]}
          cy={MADINAH[1]}
          r={66}
          fill="none"
          stroke={M.cream}
          strokeOpacity={0.7}
          strokeWidth={4}
          pathLength={1}
          strokeDasharray={`${took} 1`}
          transform={`rotate(-90 ${MADINAH[0]} ${MADINAH[1]})`}
        />
      </svg>
      <Mono t={t} at={s('emigrated') - 0.2} out={z} y={1100} text="MAKKAH" color={M.creamDim} size={26} />
      <div style={{position: 'absolute', left: MADINAH[0] + 90, top: MADINAH[1] - 22, fontFamily: MF.mono, fontWeight: 600, fontSize: 30, letterSpacing: '0.22em', color: M.gold, opacity: clamp01(arrive)}}>
        MADINAH
      </div>
      <div style={{position: 'absolute', left: MADINAH[0] + 90, top: MADINAH[1] + 22, fontFamily: MF.mono, fontWeight: 600, fontSize: 24, letterSpacing: '0.2em', color: M.creamDim, opacity: took}}>
        1 AH → 11 AH
      </div>
    </div>
  );
};

// ======================= 4–7. Ten years, 3,650 days, a gift on nearly every one =======================
const COLS = 73;
const ROWS = 50;
const CELL = 12.3;
const GX = 540 - (COLS * CELL) / 2;
const GY = 500;
type Cell = {x: number; y: number; wave: number; sweep: number; skip: boolean; year: number};
const CELLS: Cell[] = (() => {
  const out: Cell[] = [];
  for (let i = 0; i < COLS * ROWS; i++) {
    const c = i % COLS;
    const r = Math.floor(i / COLS);
    out.push({
      x: GX + c * CELL,
      y: GY + r * CELL,
      wave: (c / COLS) * 0.45 + (r / ROWS) * 0.55 + rand(i * 1.3) * 0.08,
      sweep: i / (COLS * ROWS),
      skip: rand(i * 7.9 + 3) < 0.022,
      year: Math.floor(i / 365),
    });
  }
  return out;
})();
// the cell the camera dives into
const HERO = CELLS[23 * COLS + 41];

export const Days: React.FC<P> = ({t, frame}) => {
  const a = s('know') - 0.2;
  const z = s('among') - 0.4;
  const o = vis(t, a, z, 0.4, 0.5);
  if (o <= 0.001) return null;
  const ten = w('ten.ten');
  const years = prog(t, s('ten') - 0.1, s('ten') + 1.4, easeInOut);
  const every = w('every.every');
  const n3650 = w('days3650.3,650');
  const grid = prog(t, s('days3650') - 0.3, n3650 + 0.6, easeInOut);
  const count = prog(t, s('days3650') + 0.1, n3650 + 0.35, easeOut);
  const gift0 = s('gift1');
  const gifts = prog(t, gift0, w('gift1.gift') + 0.5, (x) => x);
  const imagine = s('imagine');
  const dive = prog(t, s('hardly2') - 0.1, s('gift2') + 0.3, easeInOut);
  const bowlK = prog(t, s('hardly2') + 0.8, s('gift2') + 0.5, easeOut);
  const dim = prog(t, s('hardly') - 0.1, s('hardly') + 0.5, easeInOut) * (1 - prog(t, gift0, gift0 + 0.4));

  // camera: dive into one day
  const zoom = Math.pow(9, dive);
  const fx = HERO.x + CELL / 2;
  const fy = HERO.y + CELL / 2;
  const camX = lerp(0, 540 - fx, dive);
  const camY = lerp(0, 760 - fy, dive);
  const gridO = 1 - prog(t, s('hardly2') + 0.3, s('gift2') + 0.1, easeInOut);

  // ruler of ten years, then each year split into its days
  const RX = 120;
  const RW = 840;
  const RY = 780;
  const rulerO = vis(t, s('know'), s('days3650') + 0.2, 0.4, 0.5);

  const numOut = s('says') - 0.3;
  const numVal = t < s('days3650') ? null : fmt(3650 * count);
  return (
    <div style={{position: 'absolute', inset: 0, opacity: o}}>
      {/* the big number */}
      <div style={{opacity: 1 - prog(t, numOut, numOut + 0.4)}}>
        <Center
          y={250}
          style={{
            fontFamily: MF.serif,
            fontSize: 250,
            lineHeight: 1,
            letterSpacing: '-0.02em',
            color: M.gold,
            opacity: prog(t, ten - 0.25, ten + 0.1),
            transform: `scale(${lerp(0.9, 1, Math.min(spring(frame, ten - 0.25), 1.1))})`,
          }}
        >
          {numVal ?? <Roll a="10" b="365" k={prog(t, w('days365.365') - 0.15, w('days365.365') + 0.25, easeInOut)} />}
        </Center>
        <Center y={520} style={{fontFamily: MF.mono, fontWeight: 600, fontSize: 30, letterSpacing: '0.24em', color: M.creamDim, opacity: prog(t, ten, ten + 0.4) * (1 - prog(t, s('days3650') - 0.3, s('days3650')))}}>
          <Roll a="YEARS IN MADINAH" b="DAYS IN EVERY YEAR" k={prog(t, w('days365.365') - 0.15, w('days365.365') + 0.25, easeInOut)} />
        </Center>
      </div>
      <Mono t={t} at={s('know')} out={ten - 0.4} y={420} text="THE PROPHET IN MADINAH" color={M.gold} size={30} />

      {/* ten years as a ruler, splitting into days */}
      <svg width={MW} height={H} style={{position: 'absolute', inset: 0, opacity: rulerO}}>
        {Array.from({length: 10}, (_, i) => {
          const k = clamp01((years - i / 10) * 10);
          const x = RX + (i * RW) / 10;
          // each year leaves the ruler and drops into its own row, one after another
          const si = prog(t, every - 0.15 + i * 0.07, every + 0.45 + i * 0.07, easeInOut);
          const draw = prog(t, every + 0.1 + i * 0.07, every + 0.9 + i * 0.07, easeInOut);
          const ry = 640 + i * 46;
          return (
            <g key={i}>
              <g opacity={1 - si} transform={`translate(0 ${si * 30})`}>
                <rect x={x + 4} y={RY} width={RW / 10 - 8} height={54} fill={M.faint} />
                <rect x={x + 4} y={RY} width={(RW / 10 - 8) * k} height={54} fill={M.gold} opacity={0.85} />
                <text x={x + 4 + (RW / 10 - 8) / 2} y={RY + 100} fill={M.creamDim} opacity={k} fontFamily="JetBrains Mono" fontSize={22} textAnchor="middle">
                  {i + 1}
                </text>
              </g>
              {draw > 0 && (
                <g>
                  <rect x={RX + 4} y={ry} width={RW * draw} height={30} fill={M.gold} opacity={0.55} />
                  {Array.from({length: 73}, (_, j) =>
                    (j * RW) / 73 < RW * draw ? <line key={j} x1={RX + 4 + (j * RW) / 73} x2={RX + 4 + (j * RW) / 73} y1={ry} y2={ry + 30} stroke={M.bg} strokeWidth={1.5} /> : null,
                  )}
                </g>
              )}
            </g>
          );
        })}
      </svg>
      <Mono t={t} at={s('ten')} out={every - 0.3} y={940} text="YEAR" color={M.muted} size={22} />

      {/* 3,650 days */}
      <svg width={MW} height={H} style={{position: 'absolute', inset: 0, opacity: grid * gridO, filter: `blur(${dive * 6}px)`}}>
        <g transform={`translate(${camX + fx} ${camY + fy}) scale(${zoom}) translate(${-fx} ${-fy})`}>
          {CELLS.map((c, i) => {
            const appear = clamp01((grid - c.wave * 0.7) / 0.3);
            const lit = c.skip ? 0 : clamp01((gifts - c.sweep * 0.92) / 0.08);
            if (appear <= 0) return null;
            const base = 0.22 + 0.1 * (c.year % 2);
            return (
              <rect
                key={i}
                x={c.x + 1.6}
                y={c.y + 1.6}
                width={CELL - 3.2}
                height={CELL - 3.2}
                rx={1.5}
                fill={lit > 0 ? M.gold : M.cream}
                opacity={appear * lerp(base * (1 - dim * 0.5), 0.95, lit)}
              />
            );
          })}
        </g>
      </svg>
      <Mono t={t} at={n3650 + 0.2} out={s('says') - 0.3} y={520} text="DAYS" color={M.creamDim} size={30} />
      <Mono t={t} at={s('stayed')} out={s('says') - 0.3} y={1150} text="THE PROPHET IN MADINAH" color={M.muted} size={24} />
      <Mono t={t} at={s('says')} out={imagine - 0.3} y={300} text="AL-DHAHABI SAYS" color={M.gold} size={30} />
      <Line t={t} at={s('hardly')} out={imagine - 0.3} y={360} size={76} italic color={M.cream}>
        hardly a day passed
      </Line>
      <Line t={t} at={w('gift1.gift') - 0.1} out={imagine - 0.3} y={1130} size={64} italic color={M.gold}>
        without a gift.
      </Line>
      <Line t={t} at={imagine + 0.1} out={s('hardly2') + 0.4} y={270} size={130} italic color={M.gold}>
        Imagine that.
      </Line>
      {/* the one day, up close */}
      <svg width={MW} height={H} style={{position: 'absolute', inset: 0}}>
        <Bowl x={540} y={780} sc={lerp(0.2, 1.45, bowlK)} t={t} o={bowlK * (1 - prog(t, z - 0.5, z))} id="day" />
      </svg>
      <Mono t={t} at={s('gift2') + 0.5} out={z - 0.5} y={480} text="ONE DAY OF 3,650" color={M.creamDim} size={28} />
      <Mono t={t} at={w('gift2.peace') + 0.2} out={z - 0.5} y={1060} text="A BOWL OF THARID, DAILY · AL-DHAHABI" color={M.gold} size={24} />
    </div>
  );
};

// ======================= 8. His supplication =======================
const lineOf = (key: string) => LINES.find((l) => l.key === key)!;

/** One line of the du'a, large, lighting word by word with his voice. */
const DuaLine: React.FC<{t: number; keys: string[]; y: number; size: number; at: number; out: number; italic?: boolean}> = ({t, keys, y, size, at, out, italic}) => {
  const k = prog(t, at, at + 0.6, easeOut);
  const o = prog(t, out, out + 0.4, easeIn);
  if (k <= 0 || o >= 1) return null;
  // the latest spoken instance of this line drives the highlight
  const ln = keys.map(lineOf).filter((l) => t >= l.s - 0.2).pop() ?? lineOf(keys[0]);
  return (
    <Center
      y={y}
      style={{
        fontFamily: MF.serif,
        fontStyle: italic ? 'italic' : 'normal',
        fontSize: size,
        lineHeight: 1.08,
        letterSpacing: '-0.015em',
        padding: '0 60px',
        boxSizing: 'border-box',
        textWrap: 'balance',
        opacity: k * (1 - o),
        transform: `translateY(${(1 - k) * 26 - o * 20}px)`,
      }}
    >
      {ln.words.map((wd, n) => {
        const on = t >= wd.s - 0.04;
        const now = on && t <= wd.e + 0.12;
        return (
          <span key={n} style={{color: now ? M.goldHi : on ? M.cream : 'rgba(236,228,214,0.3)'}}>
            {wd.t}
            {n < ln.words.length - 1 ? ' ' : ''}
          </span>
        );
      })}
    </Center>
  );
};

const RAYS = Array.from({length: 46}, (_, i) => ({x: (rand(i * 2.7) - 0.5) * 2, v: 300 + rand(i * 4.1) * 380, p: rand(i * 6.3), r: 2 + rand(i * 1.9) * 3}));

export const Dua: React.FC<P> = ({t, frame}) => {
  const a = s('among') - 0.2;
  const z = END - 0.35;
  const o = vis(t, a, z, 0.5, 0.35);
  if (o <= 0.001) return null;
  const raise = prog(t, s('used') + 0.3, s('dua1a') + 0.4, easeOut);
  const enrich = prog(t, s('enrich1') - 0.2, w('enrich1.enrich') + 0.8, easeInOut);
  const light = Math.max(enrich * (1 - prog(t, s('rich') - 0.4, s('rich'))), prog(t, s('enrich2') - 0.2, w('enrich2.enrich') + 0.6, easeInOut));
  const tagsOut = prog(t, s('enrich2') - 0.5, s('enrich2') - 0.1, easeInOut);
  const give = prog(t, w('giving.giving'), w('giving.giving') + 1.3, (x) => x);
  const figY = 1215;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: o}}>
      {/* light from above on "enrich me" */}
      <div
        style={{
          position: 'absolute',
          left: 540 - 300,
          width: 600,
          top: 0,
          height: H,
          opacity: light,
          background: 'linear-gradient(90deg, rgba(228,189,125,0) 0%, rgba(228,189,125,0.2) 50%, rgba(228,189,125,0) 100%)',
          maskImage: 'linear-gradient(180deg, #000 0%, #000 50%, rgba(0,0,0,0) 66%)',
        }}
      />
      <svg width={MW} height={H} style={{position: 'absolute', inset: 0}}>
        {RAYS.map((d, i) => {
          const y = ((t * d.v + d.p * 1200) % 1200) - 40;
          const fade = 1 - clamp01((y - 800) / 250);
          return <circle key={i} cx={540 + d.x * 250} cy={y} r={d.r} fill={M.goldHi} opacity={light * fade * (0.3 + 0.5 * rand(i * 9.1))} />;
        })}
        <ellipse cx={540} cy={figY + 6} rx={150} ry={16} fill="#000" opacity={0.35} />
        <Person x={540} y={figY} s={2.3} fill={M.cream} raise={raise} o={prog(t, a, a + 0.6)} />
      </svg>

      <Mono t={t} at={s('among') + 0.1} out={s('dua1a') - 0.3} y={560} text="HIS SUPPLICATION" color={M.gold} size={30} />
      <Mono t={t} at={s('dua1a') - 0.2} out={s('enrich1') - 0.4} y={300} text="SA‘D IBN ‘UBADAH USED TO SAY" color={M.muted} size={24} />
      <DuaLine t={t} keys={['dua1a', 'dua2a']} y={340} size={88} at={s('dua1a') - 0.15} out={s('enrich1') - 0.4} />
      <DuaLine t={t} keys={['dua1b', 'dua2b']} y={590} size={88} at={s('dua1b') - 0.15} out={s('enrich1') - 0.4} />
      <Line t={t} at={s('karim') - 0.1} out={s('dua2a') - 0.5} y={830} size={58} italic color={M.gold}>
        A generous man.
      </Line>
      <DuaLine t={t} keys={['enrich1']} y={360} size={104} at={s('enrich1') - 0.15} out={s('rich') - 0.5} italic />

      {/* rich, free of need, self-sufficient, giving */}
      <div style={{opacity: 1 - tagsOut}}>
        <Tag parts={[{t: 'RICH'}]} x={330} y={360} size={58} rot={-3} k={spring(frame, w('rich.rich') - 0.05)} seed={31} />
        <Tag parts={[{t: 'FREE OF NEED'}]} x={660} y={500} size={58} rot={2} k={spring(frame, w('rich.free') - 0.05)} seed={32} />
        <Tag parts={[{t: 'SELF-SUFFICIENT'}]} x={470} y={650} size={58} rot={-2} k={spring(frame, s('giving') - 0.05)} seed={33} />
        <Tag
          parts={[{t: 'GIVING', red: true}]}
          x={600}
          y={830}
          size={84}
          rot={3}
          k={spring(frame, w('giving.giving') - 0.05)}
          seed={34}
          redK={prog(t, w('giving.giving'), w('giving.giving') + 0.3)}
        />
        <svg width={MW} height={H} style={{position: 'absolute', inset: 0}}>
          {give > 0 &&
            Array.from({length: 7}, (_, i) => {
              const k = clamp01((give - i * 0.07) / 0.7);
              if (k <= 0) return null;
              const side = i % 2 ? 1 : -1;
              const d = lerp(60, 560, easeOut(k));
              const x = 600 + side * d;
              const y = 830 + (i - 3) * 34 - Math.sin(k * Math.PI) * 60;
              return <Bowl key={i} x={x} y={y} sc={0.3} t={t} o={Math.sin(k * Math.PI) * 0.95} glow={0.5} id={`g${i}`} />;
            })}
        </svg>
      </div>
      <DuaLine t={t} keys={['enrich2']} y={400} size={112} at={s('enrich2') - 0.15} out={z} italic />
    </div>
  );
};

// ======================= 9. End card =======================
export const EndCard: React.FC<P> = ({t, frame}) => {
  if (t < END - 0.3) return null;
  const k = prog(t, END - 0.1, END + 0.6, easeOut);
  const line = prog(t, END + 0.4, END + 1.1, easeInOut);
  const pill = spring(frame, END + 0.9);
  return (
    <>
      <Mono t={t} at={END} out={999} y={640} text="FOLLOW" color={M.gold} size={30} />
      <Center y={690} style={{fontFamily: MF.sans, fontWeight: 800, fontSize: 76, letterSpacing: '-0.02em', color: M.cream, opacity: k, transform: `translateY(${(1 - k) * 24}px)`}}>
        @TheTazkiyyahGuide
      </Center>
      <div style={{position: 'absolute', left: 540 - 330 * line, top: 790, width: 660 * line, height: 4, borderRadius: 2, background: M.gold}} />
      <Line t={t} at={END + 0.5} out={999} y={840} size={58} italic color={M.cream}>
        Sheikh ‘Uthman al-Khamees
      </Line>
      {pill > 0.01 && (
        <div
          style={{
            position: 'absolute',
            left: 540,
            top: 1010,
            transform: `translate(-50%,0) scale(${Math.min(pill, 1.15)})`,
            background: M.gold,
            color: M.ink,
            fontFamily: MF.sans,
            fontWeight: 800,
            fontSize: 40,
            padding: '20px 56px',
            borderRadius: 60,
            opacity: clamp01(pill * 2),
          }}
        >
          Follow
        </div>
      )}
    </>
  );
};

// ======================= captions =======================
/** The English of what he is saying, one line at a time, word by word with the voice. */
export const Subtitles: React.FC<{t: number; hidden: Set<string>; y?: number}> = ({t, hidden, y = 1395}) => {
  let i = -1;
  for (let j = 0; j < LINES.length; j++) if (t >= LINES[j].s - 0.1) i = j;
  if (i < 0) return null;
  const c = LINES[i];
  if (hidden.has(c.key)) return null;
  const next = LINES[i + 1];
  const end = Math.min(c.e + 1.0, next ? next.s - 0.1 : c.e + 0.6);
  const kin = prog(t, c.s - 0.1, c.s + 0.12, easeOut);
  const kout = prog(t, end - 0.15, end, easeIn);
  if (kout >= 1) return null;
  return (
    <div
      style={{
        position: 'absolute',
        top: y,
        left: 90,
        width: MW - 180,
        textAlign: 'center',
        transform: `translateY(${(1 - kin) * 14}px)`,
        opacity: kin * (1 - kout),
        fontFamily: MF.sans,
        fontWeight: 700,
        fontSize: 56,
        lineHeight: 1.16,
        letterSpacing: '-0.01em',
        textShadow: '0 3px 14px rgba(0,0,0,0.85), 0 0 2px rgba(0,0,0,0.9)',
      }}
    >
      {c.words.map((wd, n) => {
        const active = t >= wd.s - 0.03 && t <= wd.e + 0.06;
        const past = t > wd.e + 0.06;
        return (
          <span key={n} style={{color: active ? M.gold : M.cream, opacity: active || past ? 1 : 0.42}}>
            {wd.t}
            {n < c.words.length - 1 ? ' ' : ''}
          </span>
        );
      })}
    </div>
  );
};
