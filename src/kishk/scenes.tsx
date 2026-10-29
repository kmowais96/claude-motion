import React from 'react';
import {clamp01, easeIn, easeInOut, easeOut, lerp, prog, rand} from '../lib';
import {M, MF, MW} from '../mercy/theme';
import {Tag, mix} from '../mercy/parts';
import {Center, Line, Mono} from './ui';
import {END, FINAL, KEY, KFPS, NAMES} from './theme';
import {sp} from '../lib';

type P = {t: number; frame: number};
const K = KEY;
const s = (k: string) => K[k][0];
const e = (k: string) => K[k][1];
const spring = (frame: number, at: number, cfg = {damping: 10, stiffness: 210, mass: 0.7}) => sp(frame, at, cfg, KFPS);

// ======================= 0. Opening credit =======================
export const Intro: React.FC<P> = ({t}) => {
  const out = s('companion') - 0.35;
  if (t > out + 0.5) return null;
  const ring = 0.55 + 0.45 * prog(t, 0, 1.0, easeOut);
  return (
    <>
      <svg width={MW} height={1920} style={{position: 'absolute', inset: 0, opacity: 1 - prog(t, out, out + 0.4, easeIn)}}>
        <circle cx={540} cy={760} r={330} fill="none" stroke={M.gold} strokeOpacity={0.35} strokeWidth={2} pathLength={1} strokeDasharray={`${0.15 + 0.85 * ring} 1`} transform="rotate(-90 540 760)" />
      </svg>
      <Mono t={t + 1} at={0} out={out + 1} y={600} text="SHEIKH ABDULHAMID KISHK" color={M.gold} size={30} />
      <div style={{opacity: 1 - prog(t, out, out + 0.35, easeIn)}}>
        <Center y={665} style={{fontFamily: MF.serif, fontSize: 104, lineHeight: 1, color: M.cream}}>
          The remembrance
        </Center>
        <Center y={775} style={{fontFamily: MF.serif, fontStyle: 'italic', fontSize: 120, lineHeight: 1, color: M.gold}}>
          of Allah
        </Center>
      </div>
    </>
  );
};

// ======================= 1. Whoever wants… is sufficient =======================
const BASE: Record<string, {want: string; is: string; dot: number}> = {
  companion: {want: 'a companion', is: 'Allah', dot: 0},
  proof: {want: 'a proof', is: 'The Qur’an', dot: 1},
  wealth: {want: 'wealth', is: 'Contentment', dot: 2},
  reminder: {want: 'a reminder', is: 'Death', dot: 3},
};
// he goes through the list twice (the second time in a different order); a cut version may drop the repeat
const WANTS = ['companion', 'proof', 'wealth', 'reminder', 'companion2', 'proof2', 'reminder2', 'wealth2']
  .filter((k) => k in K)
  .sort((a, b) => K[a][0] - K[b][0])
  .map((k) => ({k, pass: k.endsWith('2') ? 1 : 0, ...BASE[k.replace('2', '')]}));

export const Sufficient: React.FC<P> = ({t, frame}) => {
  const a = s('companion');
  const z = s('none');
  if (t < a - 0.4 || t > z + 0.6) return null;
  return (
    <>
      <Mono t={t} at={a - 0.2} out={z - 0.3} y={400} text="WHOEVER WANTS" color={M.gold} />
      <svg width={MW} height={1920} style={{position: 'absolute', inset: 0}}>
        {[0, 1, 2, 3].map((d) => {
          // a dot is lit once its item has come up in the current pass
          const pass = WANTS.filter((w) => t >= s(w.k) - 0.1).reduce((p, w) => Math.max(p, w.pass), 0);
          const item = WANTS.find((w) => w.pass === pass && w.dot === d);
          const lit = item ? prog(t, s(item.k) - 0.1, s(item.k) + 0.3, easeOut) : 0;
          const o = 1 - prog(t, z - 0.3, z, easeIn);
          return <circle key={d} cx={540 + (d - 1.5) * 44} cy={470} r={7} fill={M.gold} fillOpacity={lit} stroke={M.gold} strokeOpacity={0.6} strokeWidth={2} opacity={o} />;
        })}
      </svg>
      {WANTS.map((w, i) => {
        const st = s(w.k);
        const en = i < WANTS.length - 1 ? s(WANTS[i + 1].k) : z;
        const ans = st + 0.42 * (en - st);
        const line = prog(t, ans - 0.45, ans, easeInOut);
        const lo = 1 - prog(t, en - 0.3, en, easeIn);
        return (
          <React.Fragment key={w.k}>
            <Line t={t} at={st + 0.05} out={en - 0.3} y={560} size={130} italic>
              {w.want}
            </Line>
            {line > 0 && lo > 0 && (
              <div style={{position: 'absolute', left: 539, top: 730, width: 2, height: 110 * line, background: M.gold, opacity: 0.7 * lo}} />
            )}
            <Tag parts={[{t: w.is, red: w.dot === 3}]} x={540} y={930} size={w.is.length > 8 ? 78 : 96} rot={i % 2 ? 2 : -2} k={spring(frame, ans)} out={prog(t, en - 0.3, en - 0.05, easeIn)} seed={20 + i} />
            <Line t={t} at={ans + 0.3} out={en - 0.3} y={1050} size={62} color={M.creamDim} italic>
              is sufficient for him.
            </Line>
          </React.Fragment>
        );
      })}
    </>
  );
};

// ======================= 2. …the Fire will suffice him =======================
const EMBERS = Array.from({length: 70}, (_, i) => ({
  x: rand(i * 3.3) * MW,
  v: 90 + rand(i * 5.1) * 220,
  ph: rand(i * 7.9) * 30,
  r: 2 + rand(i * 1.7) * 4,
  sw: 20 + rand(i * 2.3) * 50,
}));

export const Fire: React.FC<P> = ({t, frame}) => {
  const a = s('none');
  const f = s('fire');
  const out = s('adam') - 0.5;
  if (t < a - 0.3 || t > out + 0.6) return null;
  const heat = Math.min(prog(t, f - 0.4, f + 1.2, easeOut), 1 - prog(t, out, out + 0.5, easeIn));
  return (
    <>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: heat,
          background: 'radial-gradient(ellipse 90% 45% at 50% 100%, rgba(210,67,61,0.55) 0%, rgba(181,48,46,0.25) 40%, rgba(181,48,46,0) 75%)',
        }}
      />
      <svg width={MW} height={1920} style={{position: 'absolute', inset: 0, opacity: heat}}>
        {EMBERS.map((m, i) => {
          const life = ((t - f + m.ph) * m.v) % 1600;
          const y = 1920 - life;
          const x = m.x + Math.sin((t + m.ph) * 1.6) * m.sw;
          const o = clamp01(life / 200) * clamp01((1500 - life) / 500);
          return <circle key={i} cx={x} cy={y} r={m.r} fill={i % 3 ? '#E8743B' : M.gold} opacity={o * 0.85} />;
        })}
      </svg>
      <Line t={t} at={a + 0.05} out={f - 0.35} y={640} size={104}>
        And for whom
      </Line>
      <Line t={t} at={a + 0.6} out={f - 0.3} y={770} size={104} italic color={M.creamDim}>
        none of that suffices…
      </Line>
      <Tag parts={[{t: 'The Fire', red: true}]} x={540} y={760} size={110} rot={-2} k={spring(frame, f + 0.15)} out={prog(t, out, out + 0.3, easeIn)} seed={31} />
      <Line t={t} at={f + 0.6} out={out} y={890} size={64} italic color={M.creamDim}>
        will surely suffice him.
      </Line>
    </>
  );
};

// ======================= 3. O son of Adam / this lower life =======================
export const Adam: React.FC<P> = ({t}) => {
  const a = s('adam');
  const w = s('weep');
  if (t < a - 0.3 || t > w + 0.6) return null;
  // long pause after this line: keep it breathing
  const drift = prog(t, a, w, easeInOut);
  return (
    <div style={{position: 'absolute', inset: 0, transform: `scale(${1 + 0.06 * drift})`, transformOrigin: '540px 770px'}}>
      <Line t={t} at={a - 0.05} out={w - 0.4} y={700} size={140}>
        O son of Adam,
      </Line>
    </div>
  );
};

const GRAINS = Array.from({length: 26}, (_, i) => ({ph: rand(i * 4.4), dx: (rand(i * 9.1) - 0.5) * 6}));

export const Hourglass: React.FC<P> = ({t}) => {
  const a = s('weep');
  const sep = s('separate');
  if (t < a - 0.4 || t > sep + 0.6) return null;
  const on = Math.min(prog(t, a - 0.3, a + 0.6, easeOut), 1 - prog(t, sep - 0.3, sep + 0.2, easeIn));
  const k = prog(t, a, sep, (x) => x);
  const cx = 540;
  const cy = 760;
  const hw = 170;
  const hh = 280;
  // sand levels: top bulb empties, bottom pile grows
  const topLevel = lerp(cy - hh + 70, cy - 18, k);
  const pile = lerp(0, 150, k);
  const frame = `M${cx - hw},${cy - hh} L${cx + hw},${cy - hh} C${cx + hw},${cy - 80} ${cx + 22},${cy - 40} ${cx + 22},${cy} C${cx + 22},${cy + 40} ${cx + hw},${cy + 80} ${cx + hw},${cy + hh} L${cx - hw},${cy + hh} C${cx - hw},${cy + 80} ${cx - 22},${cy + 40} ${cx - 22},${cy} C${cx - 22},${cy - 40} ${cx - hw},${cy - 80} ${cx - hw},${cy - hh} Z`;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: on, transform: `translateY(${(1 - on) * 30}px)`}}>
      <svg width={MW} height={1920} style={{position: 'absolute', inset: 0}}>
        <defs>
          <clipPath id="hgClip">
            <path d={frame} />
          </clipPath>
        </defs>
        <g clipPath="url(#hgClip)">
          <rect x={cx - hw} y={topLevel} width={hw * 2} height={cy - topLevel} fill={M.gold} opacity={0.85} />
          <path d={`M${cx - hw},${cy + hh} L${cx - hw * 0.9},${cy + hh - pile * 0.35} Q${cx},${cy + hh - pile * 1.3} ${cx + hw * 0.9},${cy + hh - pile * 0.35} L${cx + hw},${cy + hh} Z`} fill={M.gold} opacity={0.85} />
          {k < 0.995 && <rect x={cx - 3} y={cy - 4} width={6} height={hh - pile * 0.9} fill={M.gold} opacity={0.85} />}
          {k < 0.995 &&
            GRAINS.map((g, i) => {
              const y = cy + (((t * 1.4 + g.ph) % 1) * (hh - pile));
              return <circle key={i} cx={cx + g.dx} cy={y} r={2.5} fill={M.goldHi} opacity={0.8} />;
            })}
        </g>
        <path d={frame} fill="none" stroke={M.cream} strokeOpacity={0.55} strokeWidth={4} />
        <rect x={cx - hw - 40} y={cy - hh - 26} width={(hw + 40) * 2} height={22} rx={4} fill={M.blockHi} stroke={M.line} />
        <rect x={cx - hw - 40} y={cy + hh + 4} width={(hw + 40) * 2} height={22} rx={4} fill={M.blockHi} stroke={M.line} />
      </svg>
      <Line t={t} at={a + 0.1} out={sep - 0.35} y={330} size={84} italic color={M.creamDim}>
        we weep over
      </Line>
      <Line t={t} at={a + 0.6} out={sep - 0.3} y={1110} size={96}>
        this lower life
      </Line>
    </div>
  );
};

// ======================= 4. Every gathering is parted =======================
const PEOPLE = 14;
export const Gathering: React.FC<P> = ({t}) => {
  const a = s('separate');
  const z = s('tyrants');
  if (t < a - 0.3 || t > z + 0.5) return null;
  const on = Math.min(prog(t, a - 0.2, a + 0.6, easeOut), 1 - prog(t, z - 0.35, z + 0.1, easeIn));
  const span = e('separate') - a;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: on}}>
      <svg width={MW} height={1920} style={{position: 'absolute', inset: 0}}>
        <circle cx={540} cy={740} r={230} fill="none" stroke={M.line} strokeDasharray="3 12" />
        {Array.from({length: PEOPLE}, (_, i) => {
          const ang = (i / PEOPLE) * Math.PI * 2 - Math.PI / 2;
          const leave = a + 1.6 + (rand(i * 7.3) * 0.85 + 0.0) * (span - 1.2);
          const k = prog(t, leave, leave + 1.6, easeInOut);
          const r = 230 + k * 260;
          const x = 540 + Math.cos(ang) * r;
          const y = 740 + Math.sin(ang) * r;
          const o = 1 - k;
          return (
            <g key={i} opacity={o}>
              <circle cx={x} cy={y - 16} r={13} fill={M.cream} opacity={0.85} />
              <path d={`M${x - 20},${y + 26} Q${x},${y - 6} ${x + 20},${y + 26} Z`} fill={M.cream} opacity={0.85} />
            </g>
          );
        })}
      </svg>
      <Line t={t} at={a + 0.4} out={z - 0.35} y={300} size={86}>
        Every gathering
      </Line>
      <Line t={t} at={a + 1.2} out={z - 0.3} y={1100} size={96} italic color={M.gold}>
        is parted.
      </Line>
    </div>
  );
};

// ======================= 5. Tyrants and their treasures =======================
const STACKS = [5, 9, 13, 17, 12, 8, 4];
export const Tyrants: React.FC<P> = ({t, frame}) => {
  const a = s('tyrants');
  const sv = s('survive');
  const z = s('army');
  if (t < a - 0.3 || t > z + 0.3) return null;
  const on = Math.min(prog(t, a - 0.2, a + 0.4, easeOut), 1 - prog(t, z - 0.4, z, easeIn));
  const crumble = Math.max(0, t - (sv + 0.35));
  const coins: React.ReactNode[] = [];
  STACKS.forEach((n, c) => {
    const x = 540 + (c - 3) * 120;
    for (let j = 0; j < n; j++) {
      const at = a + 0.3 + c * 0.12 + j * 0.07;
      const k = prog(t, at, at + 0.35, easeOut);
      if (k <= 0) continue;
      const y0 = 1130 - j * 30;
      const delay = rand(c * 31 + j) * 0.6 + (n - j) * 0.03;
      const ct = Math.max(0, crumble - delay);
      const fall = ct * ct * 1100;
      const o = k * (1 - clamp01(ct / 0.9));
      if (o <= 0) continue;
      coins.push(
        <g key={`${c}-${j}`} opacity={o} transform={`translate(${(rand(c + j * 3) - 0.5) * 160 * ct},${fall - (1 - k) * 60}) rotate(${(rand(j * 5 + c) - 0.5) * 120 * ct} ${x} ${y0})`}>
          <ellipse cx={x} cy={y0 + 8} rx={50} ry={14} fill={M.goldDeep} />
          <ellipse cx={x} cy={y0} rx={50} ry={14} fill={M.gold} stroke={M.goldHi} strokeWidth={1.5} />
        </g>,
      );
    }
  });
  const dust = prog(t, sv + 0.3, sv + 1.6, easeOut);
  return (
    <div style={{position: 'absolute', inset: 0, opacity: on}}>
      <svg width={MW} height={1920} style={{position: 'absolute', inset: 0}}>
        <line x1={150} x2={930} y1={1160} y2={1160} stroke={M.line} strokeWidth={2} />
        {coins}
        {dust > 0 &&
          Array.from({length: 60}, (_, i) => {
            const x = 220 + rand(i * 2.7) * 640;
            const y = 1150 - rand(i * 4.1) * 40 - dust * (40 + rand(i) * 140);
            return <circle key={i} cx={x} cy={y} r={2 + rand(i * 9) * 2} fill={M.land} opacity={(1 - dust) * 0.7} />;
          })}
      </svg>
      <Tag parts={[{t: 'Where are'}, {t: 'the tyrants?', red: true}]} x={540} y={420} size={60} rot={-2} k={spring(frame, a + 0.2)} out={prog(t, sv - 0.3, sv, easeIn)} seed={41} />
      <Line t={t} at={a + 1.1} out={sv - 0.3} y={530} size={60} italic color={M.creamDim}>
        and the treasures they amassed?
      </Line>
      <Line t={t} at={sv + 0.05} out={z - 0.4} y={380} size={92}>
        Neither they survived,
      </Line>
      <Line t={t} at={sv + 0.8} out={z - 0.35} y={500} size={92} italic color={M.gold}>
        nor their treasures.
      </Line>
    </div>
  );
};

// ======================= 6. An army filling the sky, then a narrow grave =======================
const ROWS = 10;
const COLS = 18;
export const Army: React.FC<P> = ({t, frame}) => {
  const a = s('army');
  const g = s('grave');
  const z = s('silent');
  if (t < a - 0.3 || t > z + 0.4) return null;
  const on = Math.min(prog(t, a - 0.2, a + 0.3, easeOut), 1 - prog(t, z - 0.4, z, easeIn));
  const fill = prog(t, a + 0.2, g - 0.4, easeInOut);
  const shrink = prog(t, g - 0.1, g + 1.2, easeInOut);
  const grave = prog(t, g + 0.6, g + 1.6, easeOut);
  const marks: React.ReactNode[] = [];
  for (let r = 0; r < ROWS; r++) {
    const vis = clamp01(fill * ROWS * 1.1 - r);
    if (vis <= 0) continue;
    for (let c = 0; c < COLS; c++) {
      const bx = 90 + c * 53 + (r % 2) * 26;
      const by = 1180 - r * 62;
      const x = lerp(bx, 540, shrink);
      const y = lerp(by, 880, shrink);
      const sc = lerp(1, 0.05, shrink);
      const o = vis * (1 - prog(shrink, 0.7, 1));
      if (o <= 0) continue;
      marks.push(
        <g key={`${r}-${c}`} opacity={o * (0.55 + 0.45 * rand(r * 40 + c))} transform={`translate(${x},${y}) scale(${sc})`}>
          <line x1={0} y1={0} x2={0} y2={-46} stroke={M.cream} strokeWidth={2.5} />
          <path d="M-6,-44 L0,-60 L6,-44 Z" fill={M.cream} />
        </g>,
      );
    }
  }
  return (
    <div style={{position: 'absolute', inset: 0, opacity: on}}>
      <svg width={MW} height={1920} style={{position: 'absolute', inset: 0}}>
        {marks}
        {grave > 0 && (
          <g opacity={grave}>
            <rect x={540 - 70} y={620 + (1 - grave) * 40} width={140} height={460} fill="#0E0D0C" stroke={M.cream} strokeOpacity={0.5} strokeWidth={3} />
            <line x1={330} x2={750} y1={620} y2={620} stroke={M.cream} strokeOpacity={0.3} strokeWidth={2} />
          </g>
        )}
      </svg>
      <Tag parts={[{t: 'An army'}, {t: 'filling the sky', red: true}]} x={540} y={300} size={58} rot={-1.5} k={spring(frame, a + 0.4)} out={prog(t, g - 0.2, g + 0.1, easeIn)} seed={51} />
      <Line t={t} at={g + 0.05} out={z - 0.4} y={350} size={78} italic color={M.creamDim}>
        In the end,
      </Line>
      <Line t={t} at={g + 0.9} out={z - 0.35} y={1140} size={104}>
        a narrow grave.
      </Line>
    </div>
  );
};

// ======================= 7. Silent when called =======================
export const Silent: React.FC<P> = ({t}) => {
  const a = s('silent');
  const z = s('believe');
  if (t < a - 0.3 || t > z + 0.4) return null;
  const on = Math.min(prog(t, a - 0.2, a + 0.4, easeOut), 1 - prog(t, z - 0.45, z, easeIn));
  const quiet = prog(t, a + 1.0, a + 3.2, easeInOut);
  const bars = 44;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: on}}>
      <svg width={MW} height={1920} style={{position: 'absolute', inset: 0}}>
        {Array.from({length: bars}, (_, i) => {
          const x = 120 + i * (840 / (bars - 1));
          const amp = (0.25 + 0.75 * Math.abs(Math.sin(i * 0.9 + t * 7) * Math.sin(i * 0.37 + t * 3.1))) * 170 * (1 - quiet);
          const h = Math.max(4, amp);
          return <rect key={i} x={x - 5} y={760 - h / 2} width={10} height={h} rx={5} fill={quiet > 0.98 ? M.muted : M.cream} opacity={0.9} />;
        })}
      </svg>
      <Line t={t} at={a + 0.05} out={z - 0.45} y={420} size={84} italic color={M.creamDim}>
        When they are called,
      </Line>
      <Line t={t} at={a + 1.6} out={z - 0.4} y={960} size={120}>
        silence.
      </Line>
    </div>
  );
};

// ======================= 8. Remembrance: hearts find peace (Qur'an 13:28) =======================
const RINGS = 8;
export const Peace: React.FC<P> = ({t, frame}) => {
  const a = s('believe');
  const v1 = s('verily1');
  const v2 = s('verily2');
  const v3 = s('verily3');
  const z = s('tellme');
  if (t < a - 0.4 || t > z + 0.5) return null;
  const on = Math.min(prog(t, a - 0.3, a + 0.8, easeOut), 1 - prog(t, z - 0.4, z + 0.1, easeIn));
  const calm = prog(t, a + 0.5, v1 + 1.5, easeInOut);
  const warm = prog(t, a, v3 + 2, easeInOut);
  const pulses = [v1, v2, v3].map((p) => prog(t, p - 0.05, p + 1.4, easeOut));
  const cx = 540;
  const cy = 600;
  const verse = prog(t, v1 - 0.4, v1, easeIn);
  const hl2 = prog(t, v2, v2 + 0.6, easeOut);
  const hl3 = prog(t, v3, v3 + 0.6, easeOut);
  return (
    <div style={{position: 'absolute', inset: 0, opacity: on}}>
      <div
        style={{
          position: 'absolute',
          left: cx - 500,
          top: cy - 500,
          width: 1000,
          height: 1000,
          background: `radial-gradient(circle, rgba(246,220,168,${0.28 * warm}) 0%, rgba(228,189,125,${0.1 * warm}) 35%, rgba(228,189,125,0) 65%)`,
        }}
      />
      <svg width={MW} height={1920} style={{position: 'absolute', inset: 0}}>
        {Array.from({length: RINGS}, (_, i) => {
          const r0 = 40 + i * 30;
          const noise = (1 - calm) * (14 + i * 3);
          const pts: string[] = [];
          for (let j = 0; j <= 96; j++) {
            const th = (j / 96) * Math.PI * 2;
            const n = Math.sin(th * (5 + i) + t * (2.2 + i * 0.3) + i) * noise + Math.sin(th * (11 + i * 2) - t * 3.1) * noise * 0.5;
            const r = r0 + n;
            pts.push(`${(cx + Math.cos(th) * r).toFixed(1)},${(cy + Math.sin(th) * r).toFixed(1)}`);
          }
          return (
            <polyline key={i} points={pts.join(' ')} fill="none" stroke={mix('#ECE4D6', '#E4BD7D', warm)} strokeOpacity={0.25 + 0.5 * (1 - i / RINGS)} strokeWidth={2} />
          );
        })}
        {pulses.map((k, i) =>
          k > 0 && k < 1 ? <circle key={i} cx={cx} cy={cy} r={60 + 340 * k} fill="none" stroke={M.gold} strokeWidth={3} opacity={(1 - k) * 0.7} /> : null,
        )}
        <circle cx={cx} cy={cy} r={18 + 6 * Math.sin(t * 2)} fill={M.goldHi} opacity={0.4 + 0.6 * warm} />
      </svg>
      <Mono t={t} at={a + 0.2} out={z - 0.4} y={930} text="QUR’AN 13:28" color={M.gold} />
      {/* first half of the verse */}
      <Line t={t} at={a + 0.1} out={v1 - 0.4} y={1000} size={74}>
        Those who believe,
      </Line>
      <Line t={t} at={a + 1.5} out={v1 - 0.38} y={1090} size={74}>
        and whose hearts find peace
      </Line>
      <Line t={t} at={a + 3.0} out={v1 - 0.36} y={1180} size={74} italic color={M.gold}>
        in the remembrance of Allah.
      </Line>
      {/* second half, said three times */}
      {verse >= 1 && (
        <>
          <Line t={t} at={v1 + 0.05} out={z - 0.4} y={1000} size={80}>
            “Verily, in the{' '}
            <span style={{color: mix('#ECE4D6', '#E4BD7D', hl2)}}>remembrance</span>
          </Line>
          <Line t={t} at={v1 + 0.6} out={z - 0.38} y={1092} size={80}>
            <span style={{color: mix('#ECE4D6', '#E4BD7D', hl2)}}>of Allah</span>
          </Line>
          <Line t={t} at={v1 + 1.3} out={z - 0.36} y={1184} size={88} italic color={mix('#ECE4D6', '#F6DCA8', Math.max(hl3, 0.35))}>
            <span style={{textShadow: `0 0 ${30 * hl3}px rgba(246,220,168,${0.6 * hl3})`}}>do hearts find peace.”</span>
          </Line>
        </>
      )}
      <div style={{display: 'none'}}>{frame}</div>
    </div>
  );
};

// ======================= 9. Who is…? Allah! (31 names on a 33-bead tasbih) =======================
const BEADS = 33;
const RC = {x: 540, y: 880, r: 390};
const beadPos = (i: number, rot: number) => {
  const a = (i / BEADS) * Math.PI * 2 - Math.PI / 2 + rot;
  return {x: RC.x + Math.cos(a) * RC.r, y: RC.y + Math.sin(a) * RC.r};
};

export const Names: React.FC<P> = ({t, frame}) => {
  const a = s('tellme');
  if (t < a - 0.3 || t > END + 0.2) return null;
  const ringIn = prog(t, a - 0.1, a + 1.2, easeInOut);
  const fin = FINAL.s;
  const finK = prog(t, fin - 0.1, fin + 1.0, easeOut);
  const endK = prog(t, END - 0.6, END, easeIn);
  const rot = prog(t, fin - 0.2, END, easeInOut) * 0.5;
  // which name is being asked: from the previous answer until this one's answer
  let cur = -1;
  for (let i = 0; i < NAMES.length; i++) if (t >= (i === 0 ? NAMES[0].s - 0.2 : NAMES[i - 1].hit + 0.5)) cur = i;
  let lastHit = -1;
  for (let i = 0; i < NAMES.length; i++) if (t >= NAMES[i].hit) lastHit = i;
  const sinceHit = lastHit >= 0 ? t - NAMES[lastHit].hit : 99;
  const flash = Math.exp(-sinceHit * 3.2);
  const pop = lastHit >= 0 ? spring(frame, NAMES[lastHit].hit, {damping: 9, stiffness: 260, mass: 0.6}) : 0;
  const allahO = t < NAMES[0].s - 0.2 ? 0 : Math.min(1, 0.5 + 0.5 * flash + 0.2 * finK) * (1 - prog(t, fin - 0.25, fin + 0.15, easeIn));
  const lit = (i: number) => (i < NAMES.length ? prog(t, NAMES[i].hit - 0.02, NAMES[i].hit + 0.25, easeOut) : finK);
  return (
    <div style={{position: 'absolute', inset: 0, opacity: 1 - endK * 0.65}}>
      <div
        style={{
          position: 'absolute',
          left: RC.x - 560,
          top: RC.y - 560,
          width: 1120,
          height: 1120,
          background: `radial-gradient(circle, rgba(246,220,168,${0.10 + 0.22 * flash + 0.3 * finK}) 0%, rgba(228,189,125,${0.04 + 0.08 * flash + 0.12 * finK}) 32%, rgba(228,189,125,0) 62%)`,
        }}
      />
      <svg width={MW} height={1920} style={{position: 'absolute', inset: 0}}>
        <circle cx={RC.x} cy={RC.y} r={RC.r} fill="none" stroke={M.gold} strokeOpacity={0.25} strokeWidth={2} pathLength={1} strokeDasharray={`${ringIn} 1`} transform={`rotate(-90 ${RC.x} ${RC.y})`} />
        {finK > 0 &&
          Array.from({length: 24}, (_, i) => {
            const th = (i / 24) * Math.PI * 2 + rot;
            return (
              <line key={i} x1={RC.x + Math.cos(th) * (RC.r + 40)} y1={RC.y + Math.sin(th) * (RC.r + 40)} x2={RC.x + Math.cos(th) * (RC.r + 40 + 260 * finK)} y2={RC.y + Math.sin(th) * (RC.r + 40 + 260 * finK)} stroke={M.gold} strokeOpacity={0.35 * finK} strokeWidth={3} strokeLinecap="round" />
            );
          })}
        {lastHit >= 0 && sinceHit < 1 && <circle cx={RC.x} cy={RC.y} r={120 + 260 * (1 - Math.exp(-sinceHit * 3))} fill="none" stroke={M.gold} strokeWidth={3} opacity={0.6 * (1 - sinceHit)} />}
        {Array.from({length: BEADS}, (_, i) => {
          const p = beadPos(i, rot);
          const show = prog(t, a + (i / BEADS) * 1.1, a + (i / BEADS) * 1.1 + 0.3, easeOut);
          const L = lit(i);
          const just = i === lastHit ? flash : 0;
          return (
            <g key={i} opacity={show}>
              {L > 0 && <circle cx={p.x} cy={p.y} r={30 + 16 * just} fill={M.gold} opacity={0.18 * L + 0.3 * just} />}
              <circle cx={p.x} cy={p.y} r={15 + 4 * just} fill={mix('#2E2A27', '#F6DCA8', L)} stroke={mix('#3D3834', '#F6DCA8', L)} strokeWidth={2} />
            </g>
          );
        })}
      </svg>
      <Line t={t} at={a + 0.05} out={NAMES[0].s - 0.3} y={720} size={62} color={M.creamDim}>
        O you who affirm
      </Line>
      <Line t={t} at={a + 0.3} out={NAMES[0].s - 0.28} y={792} size={62} color={M.creamDim}>
        the oneness of Allah,
      </Line>
      <Line t={t} at={a + 0.6} out={NAMES[0].s - 0.25} y={880} size={120} italic color={M.gold}>
        tell me:
      </Line>
      {NAMES.map((n, i) => {
        const at = i === 0 ? n.s - 0.2 : NAMES[i - 1].hit + 0.5;
        const out = i < NAMES.length - 1 ? NAMES[i].hit + 0.3 : fin - 0.3;
        if (t < at - 0.05 || t > out + 0.2) return null;
        const k = prog(t, at, at + 0.25, easeOut);
        const o = 1 - prog(t, out, out + 0.15, easeIn);
        const long = n.name.length > 17;
        return (
          <div key={i} style={{position: 'absolute', top: 670, left: 0, width: MW, textAlign: 'center', opacity: k * o, transform: `translateY(${(1 - k) * 18 - (1 - o) * 12}px)`}}>
            <div style={{fontFamily: MF.mono, fontWeight: 600, fontSize: 30, letterSpacing: '0.3em', color: M.creamDim}}>WHO IS</div>
            <div style={{fontFamily: MF.serif, fontStyle: 'italic', fontSize: long ? 64 : 78, lineHeight: 1.1, color: M.cream, marginTop: 6}}>{n.name}?</div>
          </div>
        );
      })}
      {cur >= 0 && allahO > 0 && (
        <Center
          y={870}
          style={{
            fontFamily: MF.serif,
            fontSize: 200,
            lineHeight: 1,
            letterSpacing: '0.01em',
            color: mix('#E4BD7D', '#FFF1D2', flash),
            opacity: allahO,
            transform: `scale(${lerp(1.14, 1, Math.min(pop, 1.1))})`,
            textShadow: `0 0 ${60 * flash}px rgba(246,220,168,${0.55 * flash})`,
          }}
        >
          Allah
        </Center>
      )}
      <Line t={t} at={fin + 0.05} out={END - 0.5} y={790} size={92}>
        Affirm the oneness
      </Line>
      <Line t={t} at={fin + 0.7} out={END - 0.45} y={900} size={92} italic color={M.gold}>
        of the One, the Only!
      </Line>
    </div>
  );
};

// ======================= 10. End card =======================
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
        Sheikh Abdulhamid Kishk
      </Line>
      <Line t={t} at={END + 0.75} out={999} y={912} size={40} italic color={M.creamDim}>
        may Allah have mercy on him
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
