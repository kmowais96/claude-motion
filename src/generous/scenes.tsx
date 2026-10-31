import React from 'react';
import {clamp01, easeIn, easeInOut, easeOut, lerp, prog, rand, sp} from '../lib';
import {M, MF, MW} from '../mercy/theme';
import {Label, Stars, Tag, mix} from '../mercy/parts';
import {Center, Line, Mono} from '../kishk/ui';
import {END, GFPS, LINES, s, w} from './theme';

type P = {t: number; frame: number};
const POPC = {damping: 10, stiffness: 210, mass: 0.7};
const spring = (frame: number, at: number, cfg = POPC) => sp(frame, at, cfg, GFPS);
/** Visibility of a window [a, b] with fades. */
const vis = (t: number, a: number, b: number, fin = 0.4, fout = 0.4) =>
  Math.min(prog(t, a - fin, a, easeInOut), 1 - prog(t, b, b + fout, easeInOut));

const H = 1920;
const HORIZON = 1190;

// ---------- a person, seen from behind; `raise` lifts the hands in du'a ----------
export const Person: React.FC<{x: number; y: number; s: number; fill: string; raise?: number; o?: number; outline?: string}> = ({
  x,
  y,
  s: sc,
  fill,
  raise = 0,
  o = 1,
  outline,
}) => {
  const hx = lerp(22, 34, raise);
  const hy = lerp(-34, -124, raise);
  const stroke = outline ?? 'none';
  return (
    <g transform={`translate(${x} ${y}) scale(${sc})`} opacity={o}>
      {raise > 0 && (
        <>
          <path d={`M-13 -80 Q${-hx - 6} ${(hy - 80) / 2} ${-hx} ${hy}`} stroke={fill} strokeWidth={8} strokeLinecap="round" fill="none" />
          <path d={`M13 -80 Q${hx + 6} ${(hy - 80) / 2} ${hx} ${hy}`} stroke={fill} strokeWidth={8} strokeLinecap="round" fill="none" />
        </>
      )}
      <path d="M-25 0 C-25 -38 -23 -68 -16 -82 Q0 -95 16 -82 C23 -68 25 -38 25 0 Z" fill={fill} stroke={stroke} strokeWidth={outline ? 2.5 : 0} />
      <circle cx={0} cy={-108} r={16} fill={fill} stroke={stroke} strokeWidth={outline ? 2.5 : 0} />
    </g>
  );
};

const Ground: React.FC<{o: number; y?: number}> = ({o, y = HORIZON}) =>
  o <= 0.001 ? null : (
    <svg width={MW} height={H} style={{position: 'absolute', inset: 0, opacity: o}}>
      <defs>
        <linearGradient id="gGround" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2A2420" />
          <stop offset="0.5" stopColor="#1A1715" />
          <stop offset="1" stopColor={M.bg} />
        </linearGradient>
        <radialGradient id="gHalo" cx="50%" cy="100%" r="60%">
          <stop offset="0" stopColor={M.gold} stopOpacity="0.32" />
          <stop offset="1" stopColor={M.gold} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x={0} y={y - 260} width={MW} height={260} fill="url(#gHalo)" />
      <path d={`M0 ${y} C 240 ${y - 14} 420 ${y + 6} 600 ${y - 4} S 900 ${y - 12} 1080 ${y} L1080 ${H} L0 ${H} Z`} fill="url(#gGround)" />
      <path d={`M0 ${y} C 240 ${y - 14} 420 ${y + 6} 600 ${y - 4} S 900 ${y - 12} 1080 ${y}`} stroke={M.gold} strokeOpacity={0.35} strokeWidth={2} fill="none" />
    </svg>
  );

// ======================= 1. The asking: one need, another, everything =======================
type Need = {label: string; at: number; a: [number, number]; b: [number, number]; size: number};
// stage a: where each need comes up around him; stage b: clear of the centre for Al-Karim
const NEEDS: [string, [number, number], [number, number]][] = [
  ['A HOME', [290, 560], [180, 490]],
  ['PROVISION', [790, 470], [880, 400]],
  ['A CHILD', [270, 790], [200, 940]],
  ['HEALING', [820, 720], [480, 940]],
  ['GUIDANCE', [250, 420], [230, 400]],
  ['FORGIVENESS', [520, 405], [560, 400]],
  ['A SPOUSE', [530, 560], [450, 490]],
  ['EASE', [930, 590], [940, 490]],
  ['KNOWLEDGE', [560, 690], [800, 940]],
  ['SAFETY', [170, 680], [160, 1030]],
  ['JANNAH', [850, 860], [720, 490]],
  ['A GOOD END', [230, 920], [430, 1030]],
  ['PATIENCE', [540, 810], [720, 1030]],
  ['HEALTH', [850, 990], [950, 1030]],
];

const needs = (): Need[] =>
  NEEDS.map(([label, a, b], i) => ({
    label,
    a,
    b,
    // the four he reaches for one by one, then everything else at once
    at: [w('mention.need') - 0.05, w('another.another'), w('second.second'), w('third.third')][i] ?? w('lord.everything') + 0.05 * (i - 4),
    size: i < 4 ? 48 : 36,
  }));

export const Asking: React.FC<P> = ({t, frame}) => {
  const out = s('hand') - 0.5;
  if (t > out + 0.6) return null;
  const o = 1 - prog(t, out, out + 0.5, easeInOut);
  const every = w('lord.everything');
  const gen = s('generous');
  const figO = 1 - prog(t, gen - 0.3, gen + 0.3, easeInOut);
  const raise = prog(t, 0.15, 0.9, easeOut);
  const shrink = prog(t, every, every + 0.6, easeInOut);
  const move = prog(t, gen - 0.35, gen + 0.45, easeInOut);
  return (
    <div style={{position: 'absolute', inset: 0, opacity: o}}>
      <Ground o={figO} />
      <svg width={MW} height={H} style={{position: 'absolute', inset: 0}}>
        <Person x={540} y={HORIZON + 120} s={2.6} fill={M.cream} raise={raise} o={figO} />
      </svg>
      {needs().map((n, i) => {
        const k = spring(frame, n.at);
        const from = i >= 4 ? 1 - Math.min(1, k) : 0;
        const x = lerp(lerp(n.a[0], n.b[0], move), 540, from);
        const y = lerp(lerp(n.a[1], n.b[1], move), 1000, from) + Math.sin(t * 1.3 + i) * 6;
        const size = i < 4 ? lerp(48, 36, shrink) : n.size;
        return <Tag key={n.label} parts={[{t: n.label}]} x={x} y={y} size={size} rot={(rand(i * 3.7) - 0.5) * 8} k={k} seed={i + 3} />;
      })}
      <Line t={t} at={every - 0.05} out={gen - 0.35} y={200} size={120} italic color={M.gold}>
        everything.
      </Line>
      <Line t={t} at={gen + 0.1} out={out} y={610} size={170} color={M.cream}>
        Al-Karīm
      </Line>
      <Mono t={t} at={w('generous.most')} out={out} y={800} text="THE MOST GENEROUS" color={M.gold} size={34} />
    </div>
  );
};

// ======================= 2. Pouring freely, night and day =======================
const Tiny: React.FC<{x: number; y: number; o: number; text: string; color: string}> = ({x, y, o, text, color}) =>
  o <= 0.001 ? null : (
    <div style={{position: 'absolute', left: x - 150, top: y, width: 300, textAlign: 'center', opacity: o, fontFamily: MF.mono, fontWeight: 600, fontSize: 28, letterSpacing: '0.24em', color}}>
      {text}
    </div>
  );

const DROPS = Array.from({length: 90}, (_, i) => ({x: (rand(i * 2.3) - 0.5) * 2, v: 420 + rand(i * 5.1) * 520, p: rand(i * 7.7), r: 2 + rand(i * 1.1) * 4}));

export const Pouring: React.FC<P> = ({t}) => {
  const a = s('hand');
  const z = s('drain') - 0.2;
  const o = vis(t, a, z, 0.6, 0.5);
  if (o <= 0.001) return null;
  const pour = prog(t, w('hand.pours') - 0.2, w('hand.pours') + 0.6, easeOut);
  const width = lerp(70, 340, pour);
  const night = vis(t, w('nightday.night'), w('nightday.day'), 0.25, 0.3);
  const day = prog(t, w('nightday.day') - 0.1, w('nightday.day') + 0.4, easeOut);
  return (
    <div style={{position: 'absolute', inset: 0, opacity: o}}>
      <Stars o={night * 0.9} t={t} />
      <div
        style={{
          position: 'absolute',
          left: 540 - width,
          width: width * 2,
          top: 0,
          height: H,
          background: `linear-gradient(90deg, rgba(228,189,125,0) 0%, rgba(228,189,125,${0.1 + 0.12 * pour}) 50%, rgba(228,189,125,0) 100%)`,
          maskImage: 'linear-gradient(180deg, #000 0%, #000 55%, rgba(0,0,0,0) 78%)',
        }}
      />
      <svg width={MW} height={H} style={{position: 'absolute', inset: 0}}>
        {DROPS.map((d, i) => {
          const y = ((t * d.v + d.p * 1500) % 1500) - 60;
          const x = 540 + d.x * width * 0.85;
          const fade = 1 - clamp01((y - 1000) / 300);
          return <ellipse key={i} cx={x} cy={y} rx={d.r} ry={d.r * 3.2} fill={M.goldHi} opacity={(0.3 + 0.5 * rand(i * 9.3)) * fade * (0.35 + 0.65 * pour)} />;
        })}
        {/* the moon, then the sun */}
        <g opacity={night}>
          <circle cx={830} cy={420} r={95} fill="rgba(236,228,214,0.08)" />
          <circle cx={830} cy={420} r={62} fill={M.cream} />
          <circle cx={858} cy={404} r={56} fill={mix(M.navy, M.bg, 0.15)} />
        </g>
        <g opacity={day}>
          <circle cx={250} cy={420} r={150} fill={M.gold} opacity={0.12} />
          <circle cx={250} cy={420} r={95} fill={M.gold} opacity={0.18} />
          <circle cx={250} cy={420} r={62} fill={M.goldHi} />
        </g>
      </svg>
      <Mono t={t} at={a} out={z - 0.3} y={560} text="THE ONE WHOSE HAND" color={M.gold} size={32} />
      <Line t={t} at={w('hand.pours') - 0.05} out={z - 0.3} y={625} size={150} italic color={M.cream}>
        pours freely
      </Line>
      <Tiny x={830} y={525} o={night} text="NIGHT" color={M.cream} />
      <Tiny x={250} y={525} o={day * (1 - prog(t, z - 0.4, z))} text="DAY" color={M.goldHi} />
    </div>
  );
};

// ======================= 3. Spent without end, never less =======================
const SPARKS = Array.from({length: 80}, (_, i) => ({a: rand(i * 3.9) * Math.PI * 2, v: 160 + rand(i * 6.1) * 380, p: rand(i * 2.9), r: 2 + rand(i * 8.3) * 4}));
const fmt = (n: number) => Math.floor(n).toLocaleString('en-US');

export const Treasury: React.FC<{t: number; cx?: number; cy?: number; o: number; flow: number; gauge: number}> = ({t, cx = 540, cy = 720, o, flow, gauge}) =>
  o <= 0.001 ? null : (
    <svg width={MW} height={H} style={{position: 'absolute', inset: 0, opacity: o}}>
      <defs>
        <radialGradient id="gTreas" cx="45%" cy="40%" r="65%">
          <stop offset="0" stopColor={M.goldHi} />
          <stop offset="0.6" stopColor={M.gold} />
          <stop offset="1" stopColor={M.goldDeep} />
        </radialGradient>
        <radialGradient id="gTreasHalo" cx="50%" cy="50%" r="50%">
          <stop offset="0.45" stopColor={M.gold} stopOpacity="0.35" />
          <stop offset="1" stopColor={M.gold} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={420} fill="url(#gTreasHalo)" />
      {flow > 0 &&
        SPARKS.map((p, i) => {
          const life = (t * 0.55 + p.p) % 1;
          const d = 200 + life * p.v * 1.6;
          const x = cx + Math.cos(p.a) * d;
          const y = cy + Math.sin(p.a) * d + life * life * 260;
          return <circle key={i} cx={x} cy={y} r={p.r * (1 - life * 0.6)} fill={M.goldHi} opacity={flow * (1 - life) * 0.9} />;
        })}
      <circle cx={cx} cy={cy} r={300} fill="none" stroke={M.faint} strokeWidth={10} />
      <circle
        cx={cx}
        cy={cy}
        r={300}
        fill="none"
        stroke={M.gold}
        strokeWidth={10}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={`${gauge} 1`}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <circle cx={cx} cy={cy} r={190 + Math.sin(t * 2.4) * 4} fill="url(#gTreas)" />
      <circle cx={cx - 55} cy={cy - 60} r={46} fill="#FFF6E2" opacity={0.25} />
    </svg>
  );

export const Spending: React.FC<P> = ({t, frame}) => {
  const a = s('drain');
  const z = s('servants') - 0.55;
  const o = vis(t, a, z, 0.5, 0.3);
  if (o <= 0.001) return null;
  const given = Math.pow(10, 1 + 8.2 * prog(t, a + 0.2, z, (x) => x));
  const never = w('never.never');
  return (
    <div style={{position: 'absolute', inset: 0, opacity: o}}>
      <Treasury t={t} o={1} flow={prog(t, a, a + 0.6)} gauge={prog(t, a - 0.3, a + 0.4, easeOut)} />
      <Mono t={t} at={a + 0.1} out={z} y={290} text="GIVEN" color={M.muted} size={28} />
      <Center y={335} style={{fontFamily: MF.sans, fontWeight: 800, fontSize: 84, letterSpacing: '-0.02em', color: M.cream, opacity: prog(t, a + 0.1, a + 0.5)}}>
        {fmt(given)}
      </Center>
      <Mono t={t} at={a + 0.3} out={z} y={1090} text="REMAINING" color={M.muted} size={28} />
      <Center y={1135} style={{fontFamily: MF.serif, fontStyle: 'italic', fontSize: 92, color: M.gold, opacity: prog(t, a + 0.3, a + 0.7)}}>
        full
      </Center>
      <Tag parts={[{t: 'NEVER', red: true}, {t: 'DECREASES'}]} x={540} y={720} size={62} rot={-3} k={spring(frame, never - 0.05)} seed={21} />
    </div>
  );
};

// ======================= 4. The first and the last, on one plain =======================
type Fig = {x: number; y: number; sc: number; d: number; at: number; tone: number; jinn: boolean; bubble: boolean; seed: number};
const ROWS = 19;
const CROWD: Fig[] = (() => {
  const out: Fig[] = [];
  const first = w('first.if');
  const last = w('first.last');
  for (let r = 0; r < ROWS; r++) {
    const d = r / 13; // 0 = horizon, 1 = front of the first view, beyond that only seen once the camera pulls back
    const y = 905 + Math.pow(d, 1.7) * 380;
    const sc = 0.2 + d * 0.88;
    const gap = Math.max(18, 62 * sc);
    const span = 1080 * 2.1;
    const x0 = 540 - span / 2 - gap;
    const n = Math.ceil((span + gap * 2) / gap);
    const at = r < 7 ? first + 0.12 + r * 0.08 : r < 14 ? last + (r - 7) * 0.06 : s('stood') + 0.2 + (r - 14) * 0.05;
    for (let i = 0; i < n; i++) {
      const seed = r * 131 + i;
      out.push({
        x: x0 + (i + (r % 2) * 0.5) * gap + (rand(seed) - 0.5) * gap * 0.4,
        y: y + (rand(seed * 1.7) - 0.5) * 6 * sc,
        sc: sc * (0.9 + rand(seed * 2.3) * 0.2),
        d,
        at: at + rand(seed * 3.1) * 0.25,
        tone: rand(seed * 4.9),
        jinn: r > 1 && r < 16 && rand(seed * 5.3) < 0.2,
        bubble: r > 2 && rand(seed * 6.7) < 0.1,
        seed,
      });
    }
  }
  return out;
})();

export const Plain: React.FC<P> = ({t}) => {
  const a = s('servants');
  const z = END - 0.45;
  const o = vis(t, a - 0.05, z, 0.3, 0.35);
  if (o <= 0.001) return null;
  const stood = s('stood');
  const pull = prog(t, stood - 0.1, stood + 1.6, easeInOut);
  const zoom = lerp(1, 0.56, pull);
  const lift = lerp(0, -40, pull);
  const jinnAt = w('humans.jinn');
  const asked = s('asked');
  const every = w('gave.every');
  const dim = 1 - 0.75 * prog(t, s('decrease') - 0.2, s('decrease') + 0.6, easeInOut);
  const rays = vis(t, s('gave'), s('decrease') + 0.2, 0.5, 0.8);
  return (
    <div style={{position: 'absolute', inset: 0, opacity: o}}>
      <Ground o={1} y={905} />
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: MW,
          height: H,
          opacity: rays,
          background: 'conic-gradient(from 180deg at 50% -8%, rgba(228,189,125,0) 0deg, rgba(228,189,125,0.11) 20deg, rgba(228,189,125,0) 34deg, rgba(228,189,125,0.08) 50deg, rgba(228,189,125,0) 64deg, rgba(228,189,125,0) 296deg, rgba(228,189,125,0.08) 310deg, rgba(228,189,125,0) 326deg, rgba(228,189,125,0.11) 340deg, rgba(228,189,125,0) 360deg)',
          maskImage: 'linear-gradient(180deg, #000 0%, #000 50%, rgba(0,0,0,0) 85%)',
        }}
      />
      <svg width={MW} height={H} style={{position: 'absolute', inset: 0, opacity: dim}}>
        <g transform={`translate(540 ${905 + lift}) scale(${zoom}) translate(-540 -905)`}>
          {CROWD.map((f, i) => {
            const k = clamp01((t - f.at) / 0.35);
            if (k <= 0) return null;
            const sx = 540 + (f.x - 540) * zoom;
            if (sx < -60 || sx > MW + 60) return null;
            const fill = mix('#3A322B', M.cream, 0.2 + 0.5 * Math.min(1, f.d) + 0.15 * f.tone);
            const pop = easeOut(k);
            const y = f.y + (1 - pop) * 14 * f.sc;
            const els = [<Person key={i} x={f.x} y={y} s={f.sc * (0.6 + 0.4 * pop)} fill={fill} o={pop} outline="rgba(20,17,15,0.55)" />];
            if (f.jinn) {
              const jk = clamp01((t - jinnAt - f.tone * 0.4) / 0.5);
              if (jk > 0)
                els.push(
                  <Person
                    key={`j${i}`}
                    x={f.x + 25 * f.sc}
                    y={f.y - 18 * f.sc - Math.sin(t * 1.7 + f.seed) * 4 * f.sc}
                    s={f.sc * 0.95}
                    fill="rgba(228,189,125,0.08)"
                    outline={M.gold}
                    o={jk * (0.7 + 0.25 * Math.sin(t * 5 + f.seed))}
                  />,
                );
            }
            if (f.bubble) {
              const bk = clamp01((t - asked - f.tone * 0.9) / 0.3);
              if (bk > 0) {
                const sweep = every + ((sx / MW) * 1.2);
                const gold = clamp01((t - sweep) / 0.25);
                const r = Math.max(12, 17 * f.sc) * easeOut(bk) * (1 + 0.35 * Math.sin(Math.PI * gold));
                const by = f.y - 165 * f.sc - 10 - bk * 8;
                els.push(
                  <g key={`b${i}`}>
                    {gold > 0 && <circle cx={f.x} cy={by} r={r * 2.4} fill={M.gold} opacity={0.25 * gold} />}
                    <circle cx={f.x} cy={by} r={r} fill={mix('#ECE4D6', '#F6DCA8', gold)} stroke={gold > 0.5 ? M.gold : 'rgba(0,0,0,0.3)'} strokeWidth={2} />
                  </g>,
                );
              }
            }
            return els;
          })}
        </g>
      </svg>
      <Mono t={t} at={a - 0.1} out={w('first.if') + 0.3} y={330} text="HADITH QUDSI" color={M.gold} size={30} />
      <Line t={t} at={a} out={w('first.if') + 0.3} y={380} size={110} italic color={M.cream}>
        O My servants,
      </Line>
      <Label text="the first of you" x={330} y={820} k={prog(t, w('first.first'), w('first.first') + 0.4, easeOut)} out={prog(t, s('humans') - 0.1, s('humans') + 0.2)} size={46} />
      <Label text="the last of you" x={750} y={1215} k={prog(t, w('first.last'), w('first.last') + 0.4, easeOut)} out={prog(t, s('humans') - 0.1, s('humans') + 0.2)} size={46} />
      <Label text="humans" x={330} y={780} k={prog(t, w('humans.humans'), w('humans.humans') + 0.4, easeOut)} out={prog(t, stood - 0.2, stood + 0.1)} size={50} />
      <Label text="and jinn" x={760} y={780} k={prog(t, jinnAt, jinnAt + 0.4, easeOut)} out={prog(t, stood - 0.2, stood + 0.1)} size={50} />
      <Mono t={t} at={w('stood.one')} out={asked - 0.1} y={720} text="ONE PLAIN" color={M.gold} size={34} />
      <Mono t={t} at={every} out={s('decrease') - 0.3} y={600} text="EVERY ONE OF THEM" color={M.gold} size={34} />
    </div>
  );
};

// ======================= 5. Not in the least =======================
export const Least: React.FC<P> = ({t}) => {
  const a = s('decrease');
  const o = vis(t, a, END - 0.45, 0.4, 0.35);
  if (o <= 0.001) return null;
  const ring = prog(t, a, a + 1.2, easeInOut);
  const dom = w('decrease.dominion');
  const least = w('decrease.in');
  return (
    <div style={{position: 'absolute', inset: 0, opacity: o}}>
      <svg width={MW} height={H} style={{position: 'absolute', inset: 0}}>
        <circle cx={540} cy={640} r={330} fill="none" stroke={M.gold} strokeOpacity={0.5} strokeWidth={3} pathLength={1} strokeDasharray={`${ring} 1`} transform="rotate(-90 540 640)" />
        <circle cx={540} cy={640} r={330} fill="none" stroke={M.gold} strokeOpacity={0.12 * ring} strokeWidth={30} />
      </svg>
      <Mono t={t} at={dom} out={999} y={500} text="MY DOMINION" color={M.gold} size={34} />
      <Line t={t} at={least - 0.05} out={999} y={565} size={124} italic color={M.cream}>
        not in the least.
      </Line>
      <Mono t={t} at={least + 0.25} out={999} y={740} text="HADITH QUDSI · SAHIH MUSLIM" color={M.muted} size={24} />
    </div>
  );
};

// ======================= 6. End card =======================
export const EndCard: React.FC<P> = ({t, frame}) => {
  if (t < END - 0.3) return null;
  const k = prog(t, END - 0.1, END + 0.6, easeOut);
  const line = prog(t, END + 0.4, END + 1.1, easeInOut);
  const pill = spring(frame, END + 0.9);
  return (
    <>
      <Mono t={t} at={END} out={999} y={680} text="FOLLOW" color={M.gold} size={30} />
      <Center y={730} style={{fontFamily: MF.sans, fontWeight: 800, fontSize: 76, letterSpacing: '-0.02em', color: M.cream, opacity: k, transform: `translateY(${(1 - k) * 24}px)`}}>
        @TheTazkiyyahGuide
      </Center>
      <div style={{position: 'absolute', left: 540 - 330 * line, top: 830, width: 660 * line, height: 4, borderRadius: 2, background: M.gold}} />
      <Line t={t} at={END + 0.5} out={999} y={880} size={58} italic color={M.cream}>
        Ask Allah for everything.
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
export const Subtitles: React.FC<{t: number; y?: number}> = ({t, y = 1395}) => {
  let i = -1;
  for (let j = 0; j < LINES.length; j++) if (t >= LINES[j].s - 0.1) i = j;
  if (i < 0) return null;
  const c = LINES[i];
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
