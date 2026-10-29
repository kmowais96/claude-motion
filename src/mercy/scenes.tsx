import React from 'react';
import {clamp01, easeIn, easeInOut, easeOut, lerp, prog, rand} from '../lib';
import {Mask} from '../components/primitives';
import {Globe, Label, mix, Tag} from './parts';
import {HEAVY, M, MF, msp, MT, MW, POP, SETTLE} from './theme';

type P = {t: number; frame: number};
const T = MT;

const Center: React.FC<{y: number; children: React.ReactNode; style?: React.CSSProperties}> = ({y, children, style}) => (
  <div style={{position: 'absolute', top: y, left: 0, width: MW, textAlign: 'center', ...style}}>{children}</div>
);

/** Masked line reveal that also exits upward. */
const Line: React.FC<{
  t: number;
  at: number;
  out: number;
  y: number;
  size: number;
  color?: string;
  italic?: boolean;
  serif?: boolean;
  weight?: number;
  children: React.ReactNode;
}> = ({t, at, out, y, size, color = M.cream, italic, serif = true, weight = 400, children}) => {
  const k = prog(t, at, at + 0.75, easeOut);
  const o = prog(t, out, out + 0.4, easeIn);
  if (k <= 0 || o >= 1) return null;
  return (
    <Center
      y={y}
      style={{
        fontFamily: serif ? MF.serif : MF.sans,
        fontStyle: italic ? 'italic' : 'normal',
        fontWeight: weight,
        fontSize: size,
        lineHeight: 1,
        letterSpacing: serif ? '-0.015em' : '-0.01em',
        color,
      }}
    >
      <Mask k={k} out={o}>
        {children}
      </Mask>
    </Center>
  );
};

const MonoLabel: React.FC<{t: number; at: number; out: number; y: number; text: string; color?: string}> = ({
  t,
  at,
  out,
  y,
  text,
  color = M.muted,
}) => {
  const o = Math.min(prog(t, at, at + 0.5, easeOut), 1 - prog(t, out, out + 0.3, easeIn));
  if (o <= 0) return null;
  return (
    <Center
      y={y}
      style={{
        fontFamily: MF.mono,
        fontWeight: 600,
        fontSize: 28,
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

// ======================= 1. Hook: sins gather into one mass =======================
const SQN = 150;
const SQ = Array.from({length: SQN}, (_, i) => {
  const r = 225 * Math.sqrt((i + 0.5) / SQN);
  const a = i * 2.39996;
  return {
    fx: Math.cos(a) * r,
    fy: Math.sin(a) * r,
    sx: (rand(i * 1.3) - 0.5) * 1000,
    sy: (rand(i * 2.9) - 0.5) * 1300,
    size: 16 + rand(i * 4.1) * 16,
    red: rand(i * 6.7) < 0.2,
    d: rand(i * 8.3),
    rot: (rand(i * 3.7) - 0.5) * 60,
  };
});
export const BALL = {x: 540, y: 780};

export const Hook: React.FC<P> = ({t, frame}) => {
  const h = T.hook;
  const s2 = T.scale;
  const collapse = prog(t, s2.imagine - 0.35, s2.imagine + 0.15, easeIn);
  if (collapse >= 1) return null;
  const spin = t * 0.12;
  const breathe = 1 + 0.025 * Math.sin(t * 2.4);
  const gathered = prog(t, h.gather, h.sins + 0.9, easeInOut);
  const headO = 1 - prog(t, h.howBig - 0.1, h.howBig + 0.3, easeIn);
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: BALL.x - 420,
          top: BALL.y - 420,
          width: 840,
          height: 840,
          background: `radial-gradient(circle, rgba(181,48,46,${0.28 * gathered * (1 - collapse)}) 0%, rgba(181,48,46,0) 62%)`,
        }}
      />
      {SQ.map((q, i) => {
        const k = prog(t, h.gather - 0.3 + q.d * 1.5, h.gather + 0.6 + q.d * 1.5, easeOut);
        const ca = Math.cos(spin);
        const sa = Math.sin(spin);
        const fx = (q.fx * ca - q.fy * sa) * breathe;
        const fy = (q.fx * sa + q.fy * ca) * breathe;
        const x = lerp(q.sx + Math.sin(t * 0.7 + i) * 12, fx, k) * (1 - collapse);
        const y = lerp(q.sy + Math.cos(t * 0.6 + i) * 12, fy, k) * (1 - collapse);
        const s = q.size * (1 - collapse);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: BALL.x + x - s / 2,
              top: BALL.y + y - s / 2,
              width: s,
              height: s,
              borderRadius: 3,
              background: q.red ? M.red : M.block,
              border: `1.5px solid ${q.red ? M.redHi : 'rgba(236,228,214,0.16)'}`,
              opacity: (0.45 + 0.55 * k) * (1 - collapse),
              transform: `rotate(${q.rot * (1 - k) + t * 8}deg)`,
            }}
          />
        );
      })}
      {headO > 0 && (
        <Center
          y={330}
          style={{fontFamily: MF.serif, fontStyle: 'italic', fontSize: 74, color: M.cream, opacity: headO, lineHeight: 1.05}}
        >
          If we gathered
          <br />a person's sins…
        </Center>
      )}
      <Tag
        parts={[{t: 'How'}, {t: 'big?', red: true}]}
        x={540}
        y={1130}
        size={96}
        rot={-3}
        k={msp(frame, h.howBig, POP)}
        out={prog(t, s2.imagine - 0.3, s2.imagine + 0.05, easeIn)}
        seed={2}
      />
    </>
  );
};

// ======================= 2. Scale: glass, mountain, city =======================
const GROUND = 1100;
const BUILDINGS = Array.from({length: 30}, (_, i) => {
  const x = -2900 + i * 200 + rand(i * 2.3) * 60;
  return {x, w: 150 + rand(i * 4.9) * 90, h: 900 + rand(i * 7.1) * 2600, d: rand(i * 1.1)};
});

const camScale = (t: number) => {
  const s = T.scale;
  let k = 1.7;
  k = lerp(k, 0.46, prog(t, s.big1 - 0.05, s.big1 + 1.0, easeInOut));
  k = lerp(k, 0.19, prog(t, s.big2 - 0.05, s.big2 + 1.0, easeInOut));
  k = lerp(k, 0.055, prog(t, s.still - 0.05, s.still + 1.5, easeInOut));
  return k;
};

export const Scale: React.FC<P> = ({t, frame}) => {
  const s = T.scale;
  const on = Math.min(prog(t, s.imagine - 0.25, s.imagine + 0.35, easeOut), 1 - prog(t, s.still + 0.9, s.still + 1.5, easeIn));
  if (on <= 0) return null;
  const k = camScale(t);
  const glassK = prog(t, s.imagine - 0.1, s.cup + 0.4, easeOut);
  const water = prog(t, s.cup - 0.1, s.cup + 0.9, easeInOut);
  const mtn = prog(t, s.big1 + 0.6, s.big1 + 1.3, easeOut);
  const mtnFill = prog(t, s.big1 + 0.8, s.big1 + 1.4, easeOut);
  const tx = (x: number) => 540 + x * k;
  const ty = (y: number) => GROUND + y * k;
  const MTN = [
    [-760, 0],
    [-240, -1000],
    [-80, -800],
    [160, -1160],
    [760, 0],
  ];
  const mtnPath = MTN.map((p, i) => `${i ? 'L' : 'M'}${tx(p[0])},${ty(p[1])}`).join(' ');
  return (
    <div style={{position: 'absolute', inset: 0, opacity: on}}>
      <svg width={MW} height={1920} style={{position: 'absolute', inset: 0}}>
        {BUILDINGS.map((b, i) => {
          const g = prog(t, s.big2 + b.d * 0.7, s.big2 + b.d * 0.7 + 0.8, easeOut);
          if (g <= 0) return null;
          const hh = b.h * g;
          const rows = Math.floor(hh / 110);
          const cols = Math.floor(b.w / 55);
          return (
            <g key={i}>
              <rect x={tx(b.x)} y={ty(-hh)} width={b.w * k} height={hh * k} fill="#1E1B19" stroke="rgba(236,228,214,0.18)" strokeWidth={1.2} />
              {Array.from({length: rows * cols}, (_, j) => {
                const r = Math.floor(j / cols);
                const c = j % cols;
                const lit = rand(i * 97 + j * 1.7) < 0.42;
                if (!lit) return null;
                const tw = 0.6 + 0.4 * Math.sin(t * 2 + i + j);
                return (
                  <rect
                    key={j}
                    x={tx(b.x + 14 + c * 55)}
                    y={ty(-hh + 30 + r * 110)}
                    width={26 * k}
                    height={40 * k}
                    fill={M.gold}
                    opacity={0.55 * tw * g}
                  />
                );
              })}
            </g>
          );
        })}
        {mtn > 0 && (
          <path
            d={mtnPath + ' Z'}
            fill={`rgba(44,40,36,${0.92 * mtnFill})`}
            stroke={M.cream}
            strokeOpacity={0.75}
            strokeWidth={2.5}
            pathLength={1}
            strokeDasharray={`${mtn} 1`}
          />
        )}
        <line x1={0} x2={MW} y1={GROUND} y2={GROUND} stroke={M.cream} strokeOpacity={0.35} strokeWidth={2} />
        {glassK > 0 && (
          <g opacity={glassK}>
            <path
              d={`M${tx(-60)},${ty(-180)} L${tx(-48)},${ty(0)} L${tx(48)},${ty(0)} L${tx(60)},${ty(-180)}`}
              fill="rgba(236,228,214,0.04)"
              stroke={M.cream}
              strokeWidth={Math.max(2, 6 * k)}
              strokeLinejoin="round"
            />
            <path
              d={`M${tx(-56 + 4 * (1 - water))},${ty(-170 * water * 0.62 - 4)} L${tx(-46)},${ty(-6)} L${tx(46)},${ty(-6)} L${tx(56 - 4 * (1 - water))},${ty(-170 * water * 0.62 - 4)} Z`}
              fill="#5A7290"
              opacity={0.9}
            />
          </g>
        )}
      </svg>
      <Label text="a cup of water?" x={540} y={520} k={prog(t, s.cup - 0.15, s.cup + 0.35, easeOut)} out={prog(t, s.big1 - 0.1, s.big1 + 0.2, easeIn)} />
      <Label text="a mountain?" x={540} y={520} k={prog(t, s.mountain - 0.1, s.mountain + 0.35, easeOut)} out={prog(t, s.big2 - 0.1, s.big2 + 0.2, easeIn)} />
      <Label text="a city?" x={540} y={520} k={prog(t, s.city - 0.1, s.city + 0.35, easeOut)} out={prog(t, s.still - 0.1, s.still + 0.2, easeIn)} />
      <Tag parts={[{t: 'Bigger'}]} x={790} y={700} size={60} rot={5} k={msp(frame, s.big1, POP)} out={prog(t, s.mountain + 0.4, s.mountain + 0.7, easeIn)} seed={3} />
      <Tag parts={[{t: 'Bigger'}]} x={300} y={700} size={60} rot={-5} k={msp(frame, s.big2, POP)} out={prog(t, s.city + 0.4, s.city + 0.7, easeIn)} seed={4} />
      <Tag parts={[{t: 'Bigger'}, {t: 'still', red: true}]} x={540} y={700} size={72} rot={-2} k={msp(frame, s.still, POP)} out={prog(t, s.still + 0.95, s.still + 1.3, easeIn)} seed={5} />
    </div>
  );
};

// ======================= 3. Earth: greater than all of that =======================
export const GlobeIntro: React.FC<P> = ({t, frame}) => {
  const g = T.globe;
  const s = T.scale;
  const sky = T.sky;
  const enter = prog(t, s.still + 0.4, g.allah + 0.3, easeInOut);
  const shrink = prog(t, g.all - 0.1, g.all + 0.9, easeInOut);
  const exit = prog(t, sky.said - 0.15, sky.said + 0.45, easeIn);
  if (enter <= 0 || exit >= 1) return null;
  const r = lerp(lerp(1500, 330, enter), 230, shrink);
  const cy = lerp(GROUND + 1500, 800, enter) + exit * 500;
  return (
    <>
      <Globe cx={540} cy={cy} r={r} spin={-10 + t * 7} o={clamp01(enter * 3) * (1 - exit)} />
      <MonoLabel t={t} at={g.allah} out={g.greater - 0.35} y={330} text="ALLAH, GLORIFIED & EXALTED" />
      <Tag
        parts={[{t: 'Greater than'}, {t: 'all of that', red: true}]}
        x={540}
        y={350}
        size={60}
        rot={-2}
        k={msp(frame, g.greater, POP)}
        out={prog(t, sky.said - 0.2, sky.said + 0.1, easeIn)}
        seed={6}
      />
    </>
  );
};

// ======================= 4. Sky: sin upon sin up to the clouds =======================
const BH = 92;
const BW = 230;
const N_TOTAL = 18;
const colHeight = (t: number) => {
  const s = T.sky;
  const cont = 6 * prog(t, s.said + 0.15, s.clouds + 0.5, easeInOut) + 8 * prog(t, s.piled - 0.15, s.heavens + 0.6, easeInOut);
  const slams = s.sins.reduce((acc, at) => acc + prog(t, at - 0.05, at + 0.25, easeOut), 0);
  return (cont + slams) * BH;
};
const CLOUDS = Array.from({length: 14}, (_, i) => ({
  x: -200 + rand(i * 2.2) * 1400,
  y: 1150 + rand(i * 3.3) * 520,
  w: 260 + rand(i * 5.5) * 320,
  h: 70 + rand(i * 6.6) * 60,
  v: 8 + rand(i * 7.7) * 18,
}));

export const skyNavy = (t: number) => clamp01(colHeight(t) / (N_TOTAL * BH));

export const Sky: React.FC<P> = ({t, frame}) => {
  const s = T.sky;
  const f = T.forgive;
  const on = Math.min(prog(t, s.said - 0.1, s.said + 0.4, easeOut), 1 - prog(t, f.forgive - 0.4, f.forgive + 0.1, easeIn));
  if (on <= 0) return null;
  const h = colHeight(t);
  const lift = Math.max(0, h - 560);
  const G = 1260 + lift;
  const alt = Math.round((h / (N_TOTAL * BH)) * 11046);
  const blocks: React.ReactNode[] = [];
  const nCont = Math.floor(h / BH + 0.001);
  // continuous-growth blocks (all but the four slammed ones) are drawn by count; slams fall in from above
  const order: {i: number; y: number; slam?: number}[] = [];
  for (let i = 0; i < N_TOTAL; i++) order.push({i, y: G - (i + 1) * BH});
  const slamIdx = [6, 7, 8, 9];
  order.forEach(({i, y}) => {
    const si = slamIdx.indexOf(i);
    let yy = y;
    let show = i < nCont || (h - i * BH) > BH * 0.15;
    if (si >= 0) {
      const at = s.sins[si];
      const land = msp(frame, at - 0.12, HEAVY);
      show = t >= at - 0.35;
      yy = y - (1 - land) * 520;
    }
    if (!show) return;
    const dis = prog(t, f.asked + (N_TOTAL - i) * 0.035, f.asked + (N_TOTAL - i) * 0.035 + 0.9, easeIn);
    const drift = (rand(i * 3.3) - 0.5) * 160 * dis;
    blocks.push(
      <div
        key={i}
        style={{
          position: 'absolute',
          left: 540 - BW / 2 + drift,
          top: yy - dis * 420,
          width: BW,
          height: BH - 6,
          borderRadius: 4,
          background: mix(i % 4 === 2 ? '#3A2A28' : M.block, M.gold, dis),
          border: `1.5px solid ${si >= 0 ? 'rgba(210,67,61,0.7)' : 'rgba(236,228,214,0.16)'}`,
          opacity: 1 - dis,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: MF.mono,
          fontWeight: 600,
          fontSize: 24,
          letterSpacing: '0.2em',
          color: si >= 0 ? M.redHi : 'rgba(236,228,214,0.35)',
          transform: `scale(${1 - dis * 0.5}) rotate(${(rand(i) - 0.5) * 40 * dis}deg)`,
        }}
      >
        SIN
      </div>,
    );
  });
  const cloudO = clamp01((h - 700) / 500);
  return (
    <div style={{position: 'absolute', inset: 0, opacity: on}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: G - 2,
          width: MW,
          height: 700,
          background: 'linear-gradient(180deg, rgba(18,17,16,0.95) 0%, rgba(18,17,16,0.6) 50%, rgba(18,17,16,0) 100%)',
          maskImage: 'linear-gradient(90deg, rgba(0,0,0,0) 0%, #000 25%, #000 75%, rgba(0,0,0,0) 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 140,
          top: G - 1,
          width: 800,
          height: 2,
          background: `linear-gradient(90deg, rgba(236,228,214,0) 0%, ${M.line} 50%, rgba(236,228,214,0) 100%)`,
        }}
      />
      {blocks}
      {CLOUDS.map((c, i) => {
        const y = c.y - (lift - 400) * 0.9;
        const x = c.x + Math.sin(t * 0.3 + i) * 30 + ((t * c.v) % 400) - 200;
        return (
          <div key={i} style={{position: 'absolute', left: x, top: y - 700, width: c.w, height: c.h * 2, opacity: cloudO * 0.8, filter: 'blur(9px)'}}>
            {[0, 1, 2, 3].map((j) => {
              const cw = c.w * (0.38 + 0.22 * rand(i * 9 + j));
              const cx = (c.w - cw) * (j / 3);
              const ch = c.h * (j === 1 || j === 2 ? 1.5 : 1);
              return (
                <div
                  key={j}
                  style={{
                    position: 'absolute',
                    left: cx,
                    top: c.h * 2 - ch,
                    width: cw,
                    height: ch,
                    borderRadius: '50%',
                    background: 'radial-gradient(ellipse at 50% 40%, rgba(214,210,204,0.42) 0%, rgba(190,186,180,0.18) 60%, rgba(190,186,180,0) 100%)',
                  }}
                />
              );
            })}
          </div>
        );
      })}
      <div
        style={{
          position: 'absolute',
          left: 80,
          top: 232,
          fontFamily: MF.mono,
          fontSize: 30,
          letterSpacing: '0.08em',
          color: M.creamDim,
          opacity: prog(t, s.said, s.said + 0.4) * (1 - prog(t, f.asked, f.asked + 0.4)),
        }}
      >
        ↑ {alt.toLocaleString('en-US')} m
      </div>
      <Tag
        parts={[{t: 'The clouds'}, {t: 'of the sky', red: true}]}
        x={540}
        y={380}
        size={62}
        rot={-1.5}
        k={msp(frame, s.clouds, POP)}
        out={prog(t, f.asked - 0.1, f.asked + 0.25, easeIn)}
        seed={7}
      />
    </div>
  );
};

// ======================= 5. Forgiveness: "I would not mind" =======================
export const Orb: React.FC<{x: number; y: number; r: number; o: number; power?: number}> = ({x, y, r, o, power = 1}) =>
  o <= 0 ? null : (
    <>
      <div
        style={{
          position: 'absolute',
          left: x - r * 4,
          top: y - r * 4,
          width: r * 8,
          height: r * 8,
          opacity: o,
          background: `radial-gradient(circle, rgba(246,220,168,${0.55 * power}) 0%, rgba(228,189,125,${0.22 * power}) 18%, rgba(228,189,125,0) 50%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: x - r,
          top: y - r,
          width: r * 2,
          height: r * 2,
          borderRadius: r,
          opacity: o,
          background: `radial-gradient(circle at 45% 40%, #FFF3D9 0%, ${M.goldHi} 35%, ${M.gold} 70%, rgba(228,189,125,0) 100%)`,
          filter: 'blur(1.5px)',
        }}
      />
    </>
  );

export const orbState = (t: number) => {
  const f = T.forgive;
  const w = T.weight;
  const d = T.door;
  const appear = prog(t, f.asked + 0.2, f.forgive + 0.4, easeOut);
  const up = prog(t, w.this - 0.3, w.this + 0.5, easeInOut);
  const pull = prog(t, w.keeps - 0.1, w.mercy + 0.6, easeInOut);
  const heal = prog(t, w.forgiveIt, w.forgiveIt + 0.6, easeOut);
  const pulse = prog(t, f.mind2 - 0.05, f.mind2 + 0.25, easeOut) * (1 - prog(t, f.mind2 + 0.3, f.mind2 + 1.4, easeInOut));
  const gone = prog(t, d.oh - 0.3, d.oh + 0.3, easeIn);
  return {
    x: 540,
    y: lerp(560, 360, up),
    r: lerp(70, 54, up) * (1 + 0.25 * pulse + 0.25 * heal),
    o: appear * (1 - gone),
    power: (1 + pulse * 0.8) * (1 - 0.5 * pull * (1 - heal)) + heal * 0.4,
  };
};

export const Forgive: React.FC<P> = ({t}) => {
  const f = T.forgive;
  const w = T.weight;
  if (t < f.asked || t > w.this + 0.6) return null;
  return (
    <>
      <Line t={t} at={f.forgive - 0.05} out={f.allah - 0.25} y={830} size={104}>
        I would forgive you,
      </Line>
      <Line t={t} at={f.mind - 0.05} out={f.allah - 0.2} y={960} size={112} italic color={M.gold}>
        and I would not mind.
      </Line>
      <Line t={t} at={f.allah} out={w.this - 0.3} y={700} size={68} italic color={M.creamDim}>
        Allah, glorified and exalted, says:
      </Line>
      <Line t={t} at={f.mind2 - 0.05} out={w.this - 0.25} y={880} size={150}>
        “And I would
      </Line>
      <Line t={t} at={f.mind2 + 0.35} out={w.this - 0.2} y={1035} size={170} italic color={M.gold}>
        not mind.”
      </Line>
    </>
  );
};

// ======================= 6. The weight that pulls us from His mercy =======================
const SHARDS = Array.from({length: 7}, (_, i) => ({dx: (i - 3) * 30, vx: (rand(i * 3.1) - 0.5) * 520, vr: (rand(i * 5.1) - 0.5) * 300}));

export const Weight: React.FC<P> = ({t, frame}) => {
  const w = T.weight;
  const d = T.door;
  if (t < w.this - 0.4 || t > d.oh + 0.5) return null;
  const orb0 = orbState(t);
  const orb = {...orb0, o: orb0.o * prog(t, w.this - 0.4, w.this + 0.3, easeOut)};
  const drop = msp(frame, w.this, HEAVY);
  const down = msp(frame, w.down - 0.1, {damping: 11, stiffness: 160, mass: 1});
  const pull = prog(t, w.keeps - 0.1, w.mercy + 0.6, easeInOut);
  const wy = lerp(-200, 760, drop) + 150 * down + 140 * pull;
  const snap = t >= w.forgiveIt;
  const st = Math.max(0, t - w.forgiveIt);
  const fall = (st * st) * 900;
  const lineTop = orb.y + orb.r;
  const lineK = snap ? 1 - prog(t, w.forgiveIt, w.forgiveIt + 0.35, easeOut) : 1;
  const flash = snap ? Math.max(0, 1 - st / 0.45) : 0;
  const distO = Math.min(prog(t, w.certainty - 0.1, w.certainty + 0.4, easeOut), 1 - prog(t, w.forgiveIt - 0.1, w.forgiveIt + 0.1));
  return (
    <>
      <Orb {...orb} />
      <svg width={MW} height={1920} style={{position: 'absolute', inset: 0}}>
        <line
          x1={540}
          y1={lineTop}
          x2={540}
          y2={lerp(lineTop, Math.max(lineTop, wy - 80), lineK)}
          stroke={M.cream}
          strokeOpacity={0.45}
          strokeWidth={3}
          strokeDasharray="4 10"
        />
        {distO > 0 && (
          <g opacity={distO}>
            <line x1={760} x2={760} y1={lineTop + 20} y2={wy - 70} stroke={M.gold} strokeOpacity={0.6} strokeWidth={2} />
            <line x1={740} x2={780} y1={lineTop + 20} y2={lineTop + 20} stroke={M.gold} strokeOpacity={0.6} strokeWidth={2} />
            <line x1={740} x2={780} y1={wy - 70} y2={wy - 70} stroke={M.gold} strokeOpacity={0.6} strokeWidth={2} />
          </g>
        )}
      </svg>
      {distO > 0 && (
        <div
          style={{
            position: 'absolute',
            left: 790,
            top: (lineTop + wy) / 2 - 60,
            fontFamily: MF.serif,
            fontStyle: 'italic',
            fontSize: 46,
            lineHeight: 1.05,
            color: M.gold,
            opacity: distO,
          }}
        >
          far from
          <br />
          His mercy
        </div>
      )}
      {!snap && (
        <div
          style={{
            position: 'absolute',
            left: 540 - 175,
            top: wy - 80,
            width: 350,
            height: 190,
            clipPath: 'polygon(20% 0, 80% 0, 100% 100%, 0 100%)',
            background: `linear-gradient(180deg, #4A4440 0%, #2B2724 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: MF.sans,
            fontWeight: 800,
            fontSize: 68,
            letterSpacing: '0.08em',
            color: 'rgba(236,228,214,0.7)',
            filter: 'drop-shadow(0 18px 30px rgba(0,0,0,0.5))',
          }}
        >
          SIN
        </div>
      )}
      {snap &&
        SHARDS.map((s, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 540 + s.dx * 1.6 - 32 + s.vx * st,
              top: wy + fall * (0.8 + i * 0.05),
              width: 64,
              height: 86,
              background: '#3A3531',
              opacity: Math.max(0, 1 - st / 1.1),
              transform: `rotate(${s.vr * st}deg)`,
            }}
          />
        ))}
      {flash > 0 && (
        <div
          style={{
            position: 'absolute',
            left: 540 - 400,
            top: wy - 400,
            width: 800,
            height: 800,
            background: `radial-gradient(circle, rgba(246,220,168,${0.6 * flash}) 0%, rgba(246,220,168,0) 60%)`,
          }}
        />
      )}
      <Line t={t} at={w.forgiveIt - 0.05} out={d.oh - 0.35} y={780} size={104}>
        I forgive it for you,
      </Line>
      <Line t={t} at={w.notMind - 0.05} out={d.oh - 0.3} y={910} size={112} italic color={M.gold}>
        and I do not mind.
      </Line>
    </>
  );
};

// ======================= 7. The door: call upon Me, hope in Me =======================
export const Door: React.FC<P> = ({t, frame}) => {
  const d = T.door;
  const e = T.earth;
  const on = Math.min(prog(t, d.oh - 0.2, d.oh + 0.3, easeOut), 1 - prog(t, e.oh - 0.4, e.oh - 0.05, easeIn));
  if (on <= 0) return null;
  const draw = prog(t, d.oh - 0.1, d.oh + 1.1, easeInOut);
  const open = prog(t, d.forgive - 0.05, d.forgive + 0.9, easeInOut);
  const X = 540;
  const top = 500;
  const Wd = 380;
  const Hd = 560;
  const arch = `M${X - Wd / 2},${top + Hd} L${X - Wd / 2},${top + Wd / 2} A${Wd / 2},${Wd / 2} 0 0 1 ${X + Wd / 2},${top + Wd / 2} L${X + Wd / 2},${top + Hd}`;
  const ripples = [d.call, d.hope].map((at) => prog(t, at - 0.05, at + 1.1, easeOut));
  return (
    <div style={{position: 'absolute', inset: 0, opacity: on}}>
      <div
        style={{
          position: 'absolute',
          left: X - 600,
          top: top + Hd / 2 - 600,
          width: 1200,
          height: 1200,
          opacity: open,
          background: 'radial-gradient(circle, rgba(246,220,168,0.55) 0%, rgba(228,189,125,0.18) 35%, rgba(228,189,125,0) 62%)',
        }}
      />
      <svg width={MW} height={1920} style={{position: 'absolute', inset: 0}}>
        <defs>
          <clipPath id="doorClip">
            <path d={arch + ' Z'} />
          </clipPath>
          <linearGradient id="doorLight" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFF1D2" />
            <stop offset="100%" stopColor={M.gold} />
          </linearGradient>
        </defs>
        <g clipPath="url(#doorClip)">
          <rect x={X - Wd / 2} y={top} width={Wd} height={Hd} fill="url(#doorLight)" opacity={open} />
          <rect x={X - Wd / 2} y={top} width={(Wd / 2) * (1 - open)} height={Hd} fill="#24201C" opacity={draw} />
          <rect x={X + (Wd / 2) * open} y={top} width={(Wd / 2) * (1 - open)} height={Hd} fill="#24201C" opacity={draw} />
          <line x1={X} x2={X} y1={top} y2={top + Hd} stroke={M.cream} strokeOpacity={0.25 * (1 - open) * draw} strokeWidth={2} />
        </g>
        {ripples.map((k, i) =>
          k > 0 && k < 1 ? (
            <circle key={i} cx={X} cy={top + Hd * 0.55} r={40 + 300 * k} fill="none" stroke={M.gold} strokeWidth={3} opacity={(1 - k) * 0.8} />
          ) : null,
        )}
        <path d={arch} fill="none" stroke={M.gold} strokeWidth={5} pathLength={1} strokeDasharray={`${draw} 1`} strokeLinecap="round" />
        <line x1={X - 330} x2={X + 330} y1={top + Hd} y2={top + Hd} stroke={M.cream} strokeOpacity={0.3 * draw} strokeWidth={2} />
      </svg>
      <MonoLabel t={t} at={d.oh} out={e.oh - 0.3} y={360} text="O SON OF ADAM" color={M.gold} />
      <Line t={t} at={d.call - 0.05} out={d.hope - 0.15} y={430} size={70} italic>
        call upon Me…
      </Line>
      <Line t={t} at={d.hope - 0.05} out={d.forgive - 0.15} y={430} size={70} italic>
        and hope in Me…
      </Line>
      <Line t={t} at={d.forgive + 0.1} out={e.oh - 0.3} y={1160} size={96} color={M.goldHi}>
        I will forgive you.
      </Line>
    </div>
  );
};

// ======================= 8. An earth full of sins, met with forgiveness =======================
export const Earth: React.FC<P> = ({t, frame}) => {
  const e = T.earth;
  const tw = T.twice;
  const enter = prog(t, e.oh - 0.05, e.oh + 0.6, easeOut);
  const exit = prog(t, tw.always - 0.3, tw.always + 0.3, easeIn);
  if (enter <= 0 || exit >= 1) return null;
  const spots = prog(t, e.sins - 0.3, e.earth + 0.5, easeInOut);
  const wash = prog(t, e.forgiveness - 0.35, e.forgiveness + 1.4, easeInOut) * 1.7;
  const gold = prog(t, e.forgiveness - 0.1, e.forgiveness + 1.4, easeInOut);
  return (
    <>
      <Globe
        cx={540}
        cy={830}
        r={lerp(290, 330, enter) * (1 - 0.6 * exit)}
        spin={40 + t * 6}
        spots={spots}
        wash={wash}
        gold={gold}
        glow={gold}
        o={enter * (1 - exit)}
      />
      <MonoLabel t={t} at={e.oh} out={e.earth - 0.35} y={360} text="O SON OF ADAM" color={M.gold} />
      <Tag
        parts={[{t: 'An earth full'}, {t: 'of sins', red: true}]}
        x={540}
        y={360}
        size={62}
        rot={-1.5}
        k={msp(frame, e.earth, POP)}
        out={prog(t, e.meet - 0.1, e.meet + 0.2, easeIn)}
        seed={8}
      />
      <Line t={t} at={e.forgiveness + 0.05} out={tw.always - 0.35} y={330} size={84} italic color={M.goldHi}>
        forgiveness to match.
      </Line>
    </>
  );
};

// ======================= 9. Don't let him win twice =======================
export const Twice: React.FC<P> = ({t, frame}) => {
  const w = T.twice;
  const fin = T.finale;
  if (t < w.always - 0.3 || t > fin.allahs + 0.5) return null;
  const allO = 1 - prog(t, fin.allahs - 0.35, fin.allahs + 0.1, easeIn);
  const card = prog(t, w.once1 - 0.35, w.once1 + 0.2, easeOut);
  const r1 = prog(t, w.once1 - 0.05, w.once1 + 0.45, easeOut);
  const r2 = prog(t, w.once2 - 0.05, w.once2 + 0.45, easeOut);
  const strike = prog(t, w.end - 0.1, w.end + 0.35, easeInOut);
  const heading = prog(t, w.shaitan - 0.1, w.shaitan + 0.6, easeOut);
  const Row: React.FC<{k: number; y: number; n: string; text: React.ReactNode; dim?: number}> = ({k, y, n, text, dim = 0}) =>
    k <= 0 ? null : (
      <div
        style={{
          position: 'absolute',
          left: 160,
          top: y,
          width: 760,
          display: 'flex',
          gap: 28,
          alignItems: 'flex-start',
          opacity: k * (1 - 0.45 * dim),
          transform: `translateX(${(1 - k) * -30}px)`,
        }}
      >
        <div style={{fontFamily: MF.sans, fontWeight: 800, fontSize: 46, color: M.redHi, lineHeight: 1.1}}>✕</div>
        <div style={{fontFamily: MF.mono, fontSize: 28, color: M.muted, paddingTop: 12, letterSpacing: '0.1em'}}>{n}</div>
        <div style={{fontFamily: MF.sans, fontWeight: 600, fontSize: 46, lineHeight: 1.2, color: M.cream}}>{text}</div>
      </div>
    );
  return (
    <div style={{position: 'absolute', inset: 0, opacity: allO}}>
      <Line t={t} at={w.always - 0.05} out={w.shaitan - 0.4} y={760} size={120}>
        Always call upon
      </Line>
      <Line t={t} at={w.always + 0.55} out={w.shaitan - 0.35} y={900} size={150} italic color={M.gold}>
        Allah.
      </Line>
      {heading > 0 && (
        <Center y={410} style={{fontFamily: MF.sans, fontWeight: 700, fontSize: 60, color: M.cream, lineHeight: 1.1, letterSpacing: '-0.01em'}}>
          <Mask k={heading}>
            Don’t let Shaitan win <span style={{color: M.redHi}}>twice.</span>
          </Mask>
        </Center>
      )}
      {card > 0 && (
        <div
          style={{
            position: 'absolute',
            left: 110,
            top: 560,
            width: 860,
            height: 520,
            border: `2px solid ${M.line}`,
            background: 'rgba(20,18,16,0.7)',
            opacity: card,
            transform: `scale(${lerp(0.96, 1, card)})`,
          }}
        />
      )}
      <Row k={r1} y={640} n="01" text="He convinced you to sin." />
      <Row
        k={r2}
        y={830}
        n="02"
        dim={strike}
        text={
          <span style={{position: 'relative'}}>
            He convinced you it can’t be forgiven.
          </span>
        }
      />
      {strike > 0 && (
        <svg width={MW} height={1920} style={{position: 'absolute', inset: 0}}>
          <line x1={150} y1={890} x2={lerp(150, 930, strike)} y2={884} stroke={M.gold} strokeWidth={7} strokeLinecap="round" />
        </svg>
      )}
      <Tag
        parts={[{t: 'No', red: true}, {t: 'second win'}]}
        x={540}
        y={1170}
        size={64}
        rot={-2}
        k={msp(frame, w.end + 0.15, POP)}
        out={prog(t, fin.allahs - 0.35, fin.allahs, easeIn)}
        seed={9}
      />
    </div>
  );
};

// ======================= 10. Finale: Allah's forgiveness is greater =======================
const MOTES = Array.from({length: 46}, (_, i) => ({x: rand(i * 2.7) * MW, s: 8 + rand(i * 4.4) * 14, v: 40 + rand(i * 6.1) * 90, p: rand(i * 9.3)}));


export const Finale: React.FC<P> = ({t, frame}) => {
  const f = T.finale;
  const end = T.end;
  if (t < f.allahs - 0.5) return null;
  const iris = prog(t, f.allahs - 0.45, f.allahs + 1.1, easeOut);
  const out = prog(t, end.follow - 0.45, end.follow + 0.1, easeIn);
  const hit = msp(frame, f.greater, {damping: 8, stiffness: 200, mass: 0.8});
  const shake = t > f.greater && t < f.greater + 0.35 ? Math.sin((t - f.greater) * 90) * 6 * (1 - (t - f.greater) / 0.35) : 0;
  const flash = t > f.greater ? Math.max(0, 1 - (t - f.greater) / 0.5) : 0;
  return (
    <div style={{position: 'absolute', inset: 0, transform: `translate(${shake}px, ${shake * 0.6}px)`}}>
      <div
        style={{
          position: 'absolute',
          left: 540 - 1400 * iris,
          top: 860 - 1400 * iris,
          width: 2800 * iris,
          height: 2800 * iris,
          borderRadius: '50%',
          opacity: 1 - out * 0.4,
          background: 'radial-gradient(circle, rgba(246,220,168,0.42) 0%, rgba(228,189,125,0.16) 30%, rgba(228,189,125,0) 62%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: -460,
          top: 860 - 1000,
          width: 2000,
          height: 2000,
          opacity: 0.1 * iris,
          background: `repeating-conic-gradient(from ${t * 6}deg at 50% 50%, rgba(246,220,168,0.9) 0deg 4deg, rgba(0,0,0,0) 4deg 18deg)`,
          maskImage: 'radial-gradient(circle, #000 0%, rgba(0,0,0,0) 55%)',
        }}
      />
      {MOTES.map((m, i) => {
        const y = 1500 - (((t - f.allahs) * m.v + m.p * 1400) % 1400);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: m.x,
              top: y,
              width: m.s,
              height: m.s,
              borderRadius: 2,
              background: M.gold,
              opacity: 0.35 * iris * (1 - out),
              transform: `rotate(${t * 20 + i * 30}deg)`,
            }}
          />
        );
      })}
      {flash > 0 && <div style={{position: 'absolute', inset: 0, background: `rgba(246,220,168,${0.35 * flash})`}} />}
      <div style={{opacity: 1 - out}}>
        <Line t={t} at={f.allahs - 0.05} out={99} y={700} size={120} italic>
          Allah’s
        </Line>
        <Line t={t} at={f.forgiveness - 0.05} out={99} y={840} size={160} color={M.goldHi}>
          forgiveness
        </Line>
        <Tag parts={[{t: 'is greater', red: true}]} x={540} y={1140} size={92} rot={-3} k={hit} seed={10} />
      </div>
    </div>
  );
};

// ======================= 11. End card =======================
export const EndCard: React.FC<P> = ({t, frame}) => {
  const e = T.end;
  if (t < e.follow - 0.4) return null;
  const k = prog(t, e.follow - 0.3, e.follow + 0.5, easeOut);
  const ul = prog(t, e.guide - 0.1, e.guide + 0.6, easeInOut);
  const btn = msp(frame, e.reminders + 0.2, SETTLE);
  const pulse = t > e.reminders + 0.8 ? 1 + 0.04 * Math.sin((t - e.reminders - 0.8) * 5) : 1;
  return (
    <>
      <Center y={640} style={{fontFamily: MF.mono, fontWeight: 600, fontSize: 30, letterSpacing: '0.3em', color: M.gold, opacity: k}}>
        FOLLOW
      </Center>
      <Center
        y={710}
        style={{
          fontFamily: MF.sans,
          fontWeight: 800,
          fontSize: 76,
          letterSpacing: '-0.02em',
          color: M.cream,
          opacity: k,
          transform: `translateY(${(1 - k) * 24}px)`,
        }}
      >
        {'@TheTazkiyyahGuide'}
      </Center>
      <div
        style={{position: 'absolute', left: 540 - 380 * ul, top: 812, width: 760 * ul, height: 6, borderRadius: 3, background: M.gold}}
      />
      <Line t={t} at={e.reminders - 0.1} out={99} y={870} size={72} italic color={M.creamDim}>
        for more reminders
      </Line>
      {btn > 0 && (
        <div
          style={{
            position: 'absolute',
            left: 540 - 170,
            top: 1040,
            width: 340,
            height: 104,
            borderRadius: 52,
            background: M.gold,
            color: M.ink,
            fontFamily: MF.sans,
            fontWeight: 700,
            fontSize: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: clamp01(btn * 2),
            transform: `scale(${lerp(0.6, 1, btn) * pulse})`,
            boxShadow: '0 12px 40px rgba(228,189,125,0.35)',
          }}
        >
          Follow
        </div>
      )}
    </>
  );
};
