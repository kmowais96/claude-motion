import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp01, easeIn, easeInOut, easeOut, lerp, prog, rand} from '../lib';
import {Grain} from '../components/primitives';
import {useFonts} from '../components/useFonts';
import {CFPS, CT, csp as sp, damage, K, KF, mix, P, S, WIPE} from './lib';
import {Figure, HEART, Heart, Label, Person, TitleSeq} from './parts';

const SLOT = {cx: 540, cy: 1420, size: 270};
const TITLE_Y = 280;
const POP = {damping: 10, stiffness: 220, mass: 0.7};

type Theme = {bg: string; fg: string; dim: string; accent: string; dead: string};
const CREAM: Theme = {bg: K.cream, fg: K.ink, dim: K.inkDim, accent: K.green, dead: K.smoke};
const GREEN: Theme = {bg: K.green, fg: K.cream, dim: K.creamDim, accent: K.gold, dead: K.ash};
const INK: Theme = {bg: K.ink, fg: K.cream, dim: K.creamDim, accent: K.gold, dead: K.ash};

const ORDER = ['hook', 'intro', 'c1', 'c2', 'c3', 'c4', 'c5', 'recap', 'end'] as const;

/** A scene layer revealed by a panel wiping up from the bottom. */
const Layer: React.FC<{t: number; name: (typeof ORDER)[number]; theme: Theme; children: React.ReactNode}> = ({
  t,
  name,
  theme,
  children,
}) => {
  const i = ORDER.indexOf(name);
  const s = S[name];
  const next = i + 1 < ORDER.length ? S[ORDER[i + 1]] : 1e9;
  if (t < s || t > next + WIPE + 0.05) return null;
  const k = name === 'hook' ? 1 : prog(t, s, s + WIPE, easeInOut);
  return (
    <AbsoluteFill
      style={{
        background: theme.bg,
        clipPath: `inset(${(1 - k) * 100}% 0 0 0)`,
        overflow: 'hidden',
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

const Chrome: React.FC<{theme: Theme; n?: number; t: number; s: number}> = ({theme, n, t, s}) => {
  const k = prog(t, s + 0.15, s + 0.7, easeOut);
  return (
    <>
      <Label text="PURIFYING THE SOUL" y={120} color={theme.dim} size={22} />
      {n ? (
        <Label
          text={`0${n} / 05`}
          y={176}
          color={theme.accent}
          size={30}
          op={k}
        />
      ) : null}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 1832,
          textAlign: 'center',
          fontFamily: KF.sans,
          fontSize: 26,
          fontWeight: 500,
          letterSpacing: '0.02em',
          color: theme.dim,
          opacity: 0.8,
        }}
      >
        @TheTazkiyyahGuide
      </div>
    </>
  );
};

const NO_CAPTION = new Set([0, 19, 20, 21]);

const Caption: React.FC<{t: number; theme: Theme}> = ({t, theme}) => {
  const i = P.findIndex((p, j) => t >= p.t0 - 0.08 && t < (P[j + 1]?.t0 ?? 1e9) - 0.08);
  if (i < 0 || NO_CAPTION.has(i)) return null;
  const p = P[i];
  const a = prog(t, p.t0 - 0.08, p.t0 + 0.12, easeOut);
  const b = 1 - prog(t, p.t1 + 0.25, p.t1 + 0.45, easeIn);
  return (
    <div
      style={{
        position: 'absolute',
        left: 110,
        right: 110,
        top: 1640,
        textAlign: 'center',
        fontFamily: KF.sans,
        fontSize: 40,
        fontWeight: 500,
        lineHeight: 1.3,
        color: theme.fg,
        opacity: Math.min(a, b) * 0.78,
        transform: `translateY(${(1 - a) * 10}px)`,
      }}
    >
      {p.text}
    </div>
  );
};

const SlotHeart: React.FC<{t: number; theme: Theme; id: string}> = ({t, theme, id}) => {
  const {d, r} = damage(t);
  return <Heart id={id} {...SLOT} base={theme.fg} dead={theme.dead} d={d} r={r} />;
};

/* ---------------- scenes ---------------- */

const Hook: React.FC<{t: number; f: number}> = ({t, f}) => {
  const sun = sp(f, 0.15, {damping: 16, stiffness: 120}) * (1 + 0.05 * Math.sin(Math.PI * prog(t, P[1].t0 + 0.2, P[1].t0 + 1.0)));
  const ground = 1330;
  return (
    <>
      <Label text="PURIFYING THE SOUL" y={120} color={K.inkDim} size={22} />
      <TitleSeq
        t={t}
        top={TITLE_Y + 40}
        color={K.ink}
        accent={K.green}
        items={[
          {t: -0.7, lines: ['Five things are', [{text: 'slowly '}, {text: 'ruining', accent: '1'}], 'your heart.']},
          {t: P[1].t0, lines: []},
        ]}
      />
      {/* Ibn al-Qayyim */}
      {(() => {
        const k = prog(t, P[1].t0 + 0.2, P[1].t0 + 0.9, easeOut);
        const k2 = prog(t, P[1].t0 + 0.9, P[1].t0 + 1.5, easeOut);
        return (
          <div style={{position: 'absolute', left: 0, right: 0, top: 300, textAlign: 'center', opacity: k}}>
            <div style={{fontFamily: KF.mono, fontSize: 30, letterSpacing: '0.3em', color: K.inkDim, transform: `translateY(${(1 - k) * 16}px)`}}>
              IMAM
            </div>
            <div
              style={{
                fontFamily: KF.serif,
                fontSize: 150,
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
                color: K.green,
                transform: `translateY(${(1 - k) * 30}px)`,
              }}
            >
              Ibn al-Qayyim
            </div>
            <div style={{fontFamily: KF.serif, fontStyle: 'italic', fontSize: 54, color: K.inkDim, opacity: k2}}>
              rahimahullah
            </div>
          </div>
        );
      })()}
      <div
        style={{
          position: 'absolute',
          left: 540 - 230,
          top: 1110 - 230,
          width: 460,
          height: 460,
          borderRadius: 230,
          background: K.gold,
          transform: `scale(${sun})`,
        }}
      />
      <div style={{position: 'absolute', left: 220, width: 640, top: ground, height: 4, background: K.ink}} />
      <Figure x={540} ground={ground + 2} width={330} color={K.ink} breathe={Math.sin(t * 1.6) * 0.5} />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 1832,
          textAlign: 'center',
          fontFamily: KF.sans,
          fontSize: 26,
          fontWeight: 500,
          color: K.inkDim,
        }}
      >
        @TheTazkiyyahGuide
      </div>
    </>
  );
};

const Intro: React.FC<{t: number; f: number}> = ({t, f}) => {
  const s = S.intro;
  const build = Array.from({length: 7}).map((_, i) => sp(f, s + 0.3 + i * 0.07, {damping: 15, stiffness: 170}));
  const m = prog(t, S.c1 - 0.6, S.c1 + 0.1, easeInOut);
  const fiveK = sp(f, s + 0.75, POP);
  return (
    <>
      <Chrome theme={GREEN} t={t} s={s} />
      <TitleSeq
        t={t}
        top={TITLE_Y}
        color={K.cream}
        accent={K.gold}
        items={[{t: s + 0.25, lines: ['The corrupters', [{text: 'of the '}, {text: 'heart', accent: '1'}]]}]}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 560,
          textAlign: 'center',
          fontFamily: KF.mono,
          fontSize: 40,
          fontWeight: 600,
          letterSpacing: '0.5em',
          color: K.gold,
          opacity: fiveK,
          transform: `scale(${0.8 + 0.2 * fiveK})`,
        }}
      >
        ARE FIVE
      </div>
      <Heart
        id="h-intro"
        cx={540}
        cy={lerp(1130, SLOT.cy, m)}
        size={lerp(520, SLOT.size, m)}
        base={K.cream}
        dead={K.ash}
        build={build}
      />
      <Caption t={t} theme={GREEN} />
    </>
  );
};

const C1: React.FC<{t: number; f: number}> = ({t, f}) => {
  const s = S.c1;
  const good = [1, 9, 12, 15, 18];
  const you = 7;
  const fade = prog(t, P[7].t0 + 0.05, P[7].t0 + 0.7, easeInOut);
  const gold = prog(t, P[6].t0 + 0.05, P[6].t0 + 0.4, easeOut);
  const people = Array.from({length: 20}).map((_, j) => {
    const r = Math.floor(j / 5);
    const c = j % 5;
    const x = 540 + (c - 2) * 150 + (r % 2 ? 30 : -30);
    const y = 700 + r * 150;
    const k = sp(f, P[3].t0 + 0.2 + rand(j) * 0.7, POP);
    const isGood = good.includes(j);
    const isYou = j === you;
    const col = isYou ? K.green : isGood ? mix(K.ink, K.goldDeep, gold) : K.ink;
    const op = isYou || isGood ? 1 : 1 - 0.85 * fade;
    const drift = isYou || isGood ? 0 : fade * (c - 2) * 18;
    return <Person key={j} x={x + drift + Math.sin(t * 1.2 + j) * 3} y={y} s={k} color={col} op={op} />;
  });
  const puffs = Array.from({length: 16}).map((_, i) => {
    const t0 = P[4].t0 + 0.1 + i * 0.16;
    const life = 1.7;
    const k = (t - t0) / life;
    if (k <= 0 || k >= 1) return null;
    const j = Math.floor(rand(i + 3) * 20);
    const sx = 540 + ((j % 5) - 2) * 150;
    const sy = 680 + Math.floor(j / 5) * 150;
    const ex = 540 + (rand(i + 9) - 0.5) * 140;
    const ey = SLOT.cy - 70;
    const e = easeInOut(k);
    const rr = lerp(16, 52, k);
    return (
      <div
        key={i}
        style={{
          position: 'absolute',
          left: lerp(sx, ex, e) - rr,
          top: lerp(sy, ey, e) - rr,
          width: rr * 2,
          height: rr * 2,
          borderRadius: rr,
          background: K.smoke,
          opacity: Math.sin(Math.PI * k) * 0.5,
          filter: 'blur(4px)',
        }}
      />
    );
  });
  return (
    <>
      <Chrome theme={CREAM} n={1} t={t} s={s} />
      <TitleSeq
        t={t}
        top={TITLE_Y}
        color={K.ink}
        accent={K.green}
        items={[{t: s + 0.3, lines: [[{text: 'Too much '}, {text: 'company', accent: '1'}]]}]}
      />
      {people}
      <SlotHeart t={t} theme={CREAM} id="h-c1" />
      {puffs}
      <Caption t={t} theme={CREAM} />
    </>
  );
};

const wave = (y: number, phase: number, amp: number) => {
  let d = '';
  for (let x = -60; x <= 1140; x += 20) {
    const yy = y + Math.sin(x / 70 + phase) * amp;
    d += `${x === -60 ? 'M' : 'L'}${x} ${yy.toFixed(1)} `;
  }
  return d;
};

const C2: React.FC<{t: number; f: number}> = ({t, f}) => {
  const s = S.c2;
  const seaK = prog(t, s + 0.3, s + 1.2, easeOut);
  const sea2 = prog(t, P[9].t0, P[9].t0 + 1.0, easeOut);
  const bubbles = [
    {x: 600, y: 860, r: 20},
    {x: 650, y: 770, r: 32},
    {x: 720, y: 650, r: 50},
    {x: 790, y: 515, r: 70},
  ];
  return (
    <>
      <Chrome theme={GREEN} n={2} t={t} s={s} />
      <TitleSeq
        t={t}
        top={TITLE_Y}
        color={K.cream}
        accent={K.gold}
        items={[{t: s + 0.3, lines: [[{text: 'Wishful '}, {text: 'thinking', accent: '1'}]]}]}
      />
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
        {Array.from({length: 7}).map((_, i) => (
          <path
            key={i}
            d={wave(1010 + i * 32 * (1 + sea2 * 0.25), t * 0.9 + i * 0.8, 8 + i * 1.5)}
            fill="none"
            stroke={K.cream}
            strokeOpacity={(0.42 - i * 0.045) * seaK}
            strokeWidth={3}
            strokeDasharray="1400"
            strokeDashoffset={1400 * (1 - seaK)}
          />
        ))}
        {bubbles.map((b, i) => {
          const k = sp(f, P[8].t0 + 0.35 + i * 0.22, POP);
          const pt = P[10].t0 + 0.35 + i * 0.4;
          const pop = prog(t, pt, pt + 0.16, easeOut);
          const burst = prog(t, pt, pt + 0.35, easeOut);
          const bob = Math.sin(t * 1.4 + i) * 6;
          return (
            <g key={i} transform={`translate(${b.x} ${b.y + bob})`}>
              {pop < 1 ? (
                <circle
                  r={b.r * k * (1 + 0.35 * pop)}
                  fill={K.gold}
                  fillOpacity={0.14 * (1 - pop)}
                  stroke={K.cream}
                  strokeOpacity={1 - pop}
                  strokeWidth={4}
                />
              ) : null}
              {burst > 0 && burst < 1
                ? Array.from({length: 8}).map((_, q) => {
                    const a = (q / 8) * Math.PI * 2;
                    const r0 = b.r * (1 + 0.2 * burst);
                    const r1 = b.r * (1.25 + 0.45 * burst);
                    return (
                      <line
                        key={q}
                        x1={Math.cos(a) * r0}
                        y1={Math.sin(a) * r0}
                        x2={Math.cos(a) * r1}
                        y2={Math.sin(a) * r1}
                        stroke={K.gold}
                        strokeWidth={4}
                        strokeLinecap="round"
                        opacity={1 - burst}
                      />
                    );
                  })
                : null}
            </g>
          );
        })}
      </svg>
      <Figure x={540} ground={1002} width={230} color={K.cream} breathe={Math.sin(t * 1.4) * 0.6} />
      <SlotHeart t={t} theme={GREEN} id="h-c2" />
      <Caption t={t} theme={GREEN} />
    </>
  );
};

const C3: React.FC<{t: number; f: number}> = ({t, f}) => {
  const s = S.c3;
  const snap = P[13].t0 + 0.05;
  const ts = Math.max(0, t - snap);
  const pull = prog(t, P[12].t0, snap, easeInOut);
  const crack = prog(t, snap, snap + 0.5, easeOut);
  const drop = prog(t, snap + 0.25, snap + 1.2, easeInOut);
  const shake = t > snap && t < snap + 0.35 ? (1 - (t - snap) / 0.35) * 14 : 0;
  const sx = (rand(f) - 0.5) * shake;
  const sy = (rand(f + 77) - 0.5) * shake;
  const hx = 540;
  const hy = 1000 - 26 * pull + 70 * drop;
  const shapes = [
    {x: 300, y: 690, sq: true},
    {x: 460, y: 650, sq: false},
    {x: 620, y: 670, sq: true},
    {x: 780, y: 640, sq: false},
  ];
  const ring = prog(t, snap, snap + 0.9, easeOut);
  const heartK = sp(f, P[11].t0 + 0.2, POP);
  return (
    <div style={{position: 'absolute', inset: 0, transform: `translate(${sx}px, ${sy}px)`}}>
      <Chrome theme={INK} n={3} t={t} s={s} />
      <TitleSeq
        t={t}
        top={TITLE_Y}
        size={112}
        color={K.cream}
        accent={K.gold}
        items={[
          {t: s + 0.3, lines: ['Hanging your heart', [{text: 'on other than '}, {text: 'Allah', accent: '1'}]]},
          {t: snap, lines: [[{text: 'The '}, {text: 'worst', accent: '1'}], 'of them all.']},
        ]}
      />
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <defs>
          <clipPath id="c3-left">
            <polygon points="-10,-10 54,-10 46,28 56,48 45,68 50,100 -10,100" />
          </clipPath>
          <clipPath id="c3-right">
            <polygon points="54,-10 110,-10 110,100 50,100 45,68 56,48 46,28" />
          </clipPath>
        </defs>
        {shapes.map((sh, i) => {
          const k = sp(f, P[11].t0 + 0.1 + i * 0.12, POP);
          const fallT = Math.max(0, ts - i * 0.05);
          const x = sh.x + Math.sin(t * 1.3 + i * 1.7) * 7 * (1 - pull) + (i - 1.5) * 40 * fallT;
          const y = sh.y + 0.5 * 2600 * fallT * fallT - 30 * pull;
          const rot = fallT * (i % 2 ? 180 : -160);
          const lineK = t < snap ? 1 : 1 - prog(t, snap, snap + 0.18, easeOut);
          const ex = lerp(x, hx, lineK);
          const ey = lerp(y + 30, hy - 50, lineK);
          return (
            <g key={i}>
              {lineK > 0.01 ? (
                <line
                  x1={x}
                  y1={y + 30}
                  x2={ex}
                  y2={ey}
                  stroke={K.cream}
                  strokeOpacity={(0.32 + 0.3 * pull) * k}
                  strokeWidth={2 + pull}
                />
              ) : null}
              <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${k})`}>
                {sh.sq ? (
                  <rect x={-30} y={-30} width={60} height={60} rx={6} fill="#57524A" />
                ) : (
                  <circle r={31} fill="#57524A" />
                )}
              </g>
            </g>
          );
        })}
        {ring > 0 && ring < 1 ? (
          <circle cx={hx} cy={hy - 10} r={lerp(90, 520, ring)} fill="none" stroke={K.gold} strokeWidth={6 * (1 - ring)} opacity={1 - ring} />
        ) : null}
        <g transform={`translate(${hx - 85} ${hy - 78}) scale(${1.7 * heartK})`}>
          {crack <= 0 ? (
            <path d={HEART} fill={K.gold} />
          ) : ['c3-left', 'c3-right'].map((cid, side) => (
            <g
              key={cid}
              clipPath={`url(#${cid})`}
              transform={`translate(${(side ? 1 : -1) * 9 * crack} ${4 * crack}) rotate(${(side ? 1 : -1) * 9 * crack} 50 90)`}
            >
              <path d={HEART} fill={mix(K.gold, K.goldDeep, crack * 0.6)} opacity={1 - 0.45 * drop} />
            </g>
          ))}
        </g>
      </svg>
      <SlotHeart t={t} theme={INK} id="h-c3" />
      <Caption t={t} theme={INK} />
    </div>
  );
};

const C4: React.FC<{t: number; f: number}> = ({t, f}) => {
  const s = S.c4;
  const [eat, drink, sleep] = CT.food;
  const lose = P[16].t0;
  const rows = [6, 5, 4, 3, 2, 1];
  const plateY = 1090;
  const plateK = sp(f, s + 0.35, {damping: 15, stiffness: 160});
  const balls: React.ReactNode[] = [];
  let idx = 0;
  rows.forEach((n, r) => {
    for (let c = 0; c < n; c++) {
      const i = idx++;
      const [a, b] = r < 2 ? [eat, drink] : r < 4 ? [drink, sleep] : [sleep, P[15].t1];
      const count = r < 2 ? 11 : r < 4 ? 7 : 3;
      const first = r < 2 ? 0 : r < 4 ? 11 : 18;
      const ti = a + 0.05 + ((i - first) / count) * (b - a) * 0.8;
      const k = sp(f, ti, {damping: 12, stiffness: 210, mass: 0.6});
      if (k <= 0) continue;
      const rx = 540 + (c - (n - 1) / 2) * 62;
      const ry = plateY - 34 - r * 54;
      const lt = Math.max(0, t - lose - 0.08 - (5 - r) * 0.04);
      const vx = (c - (n - 1) / 2 + (rand(i) - 0.5)) * 220;
      const x = rx + vx * lt;
      const y = ry - (1 - k) * 520 + 0.5 * 3200 * lt * lt - 180 * lt;
      balls.push(
        <circle
          key={i}
          cx={x}
          cy={y}
          r={29}
          fill={mix(K.gold, K.goldDeep, rand(i + 5) * 0.8)}
          opacity={clamp01(k * 3)}
        />,
      );
    }
  });
  return (
    <>
      <Chrome theme={CREAM} n={4} t={t} s={s} />
      <TitleSeq
        t={t}
        top={TITLE_Y}
        color={K.ink}
        accent={K.green}
        items={[
          {t: s + 0.3, lines: [[{text: 'Too much '}, {text: 'food', accent: '1'}]]},
          {t: eat, lines: ['Eat a lot.']},
          {t: drink, lines: ['Drink a lot.']},
          {t: sleep, lines: ['Sleep a lot.']},
          {t: lose, lines: [[{text: 'Lose', accent: '1'}, {text: ' a lot.'}]]},
        ]}
      />
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
        <g transform={`translate(540 ${plateY}) scale(${plateK} 1)`}>
          <ellipse rx={250} ry={30} fill={K.ink} />
          <ellipse rx={196} ry={18} cy={-4} fill={K.cream} opacity={0.18} />
        </g>
        {balls}
      </svg>
      <SlotHeart t={t} theme={CREAM} id="h-c4" />
      <Caption t={t} theme={CREAM} />
    </>
  );
};

const C5: React.FC<{t: number; f: number}> = ({t, f}) => {
  const s = S.c5;
  const {d} = damage(t);
  const cx = 540;
  const cy = 830;
  const R = 210;
  const k = sp(f, s + 0.35, {damping: 15, stiffness: 160});
  const fast = Math.max(0, t - P[18].t0);
  const minute = 360 * (0.12 * (t - s) + 1.6 * fast * fast);
  const hour = minute / 12;
  const dim = 1 - 0.5 * d[4];
  return (
    <>
      <Chrome theme={INK} n={5} t={t} s={s} />
      <TitleSeq
        t={t}
        top={TITLE_Y}
        color={K.cream}
        accent={K.gold}
        items={[
          {t: s + 0.3, lines: [[{text: 'Too much '}, {text: 'sleep', accent: '1'}]]},
          {t: P[18].t0, lines: [[{text: 'It '}, {text: 'deadens', accent: '1'}], 'the heart.']},
        ]}
      />
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
        <g opacity={dim} transform={`translate(${cx} ${cy}) scale(${k})`}>
          <circle r={R} fill="none" stroke={K.cream} strokeWidth={12} />
          {Array.from({length: 12}).map((_, i) => (
            <line
              key={i}
              x1={0}
              y1={-R + 26}
              x2={0}
              y2={-R + (i % 3 ? 40 : 52)}
              stroke={K.cream}
              strokeWidth={i % 3 ? 4 : 7}
              strokeLinecap="round"
              transform={`rotate(${i * 30})`}
            />
          ))}
          <line x1={0} y1={0} x2={0} y2={-R * 0.5} stroke={K.cream} strokeWidth={12} strokeLinecap="round" transform={`rotate(${hour + 120})`} />
          <line x1={0} y1={0} x2={0} y2={-R * 0.78} stroke={K.gold} strokeWidth={7} strokeLinecap="round" transform={`rotate(${minute})`} />
          <circle r={12} fill={K.gold} />
        </g>
        <g opacity={k} transform="translate(800 560)">
          <circle r={46} fill={K.gold} />
          <circle r={42} cx={-20} cy={-12} fill={K.ink} />
        </g>
        {Array.from({length: 3}).map((_, i) => {
          const ph = ((t - s) * 0.45 + i / 3) % 1;
          return (
            <text
              key={i}
              x={790 + ph * 70}
              y={720 - ph * 160}
              fontFamily={KF.serif}
              fontStyle="italic"
              fontSize={40 + ph * 30}
              fill={K.gold}
              opacity={Math.sin(Math.PI * ph) * k * 0.9}
            >
              z
            </text>
          );
        })}
      </svg>
      <SlotHeart t={t} theme={INK} id="h-c5" />
      <Caption t={t} theme={INK} />
    </>
  );
};

const ITEMS = [
  'Too much company',
  'Wishful thinking',
  'Attachment to other than Allah',
  'Too much food',
  'Too much sleep',
];

const Recap: React.FC<{t: number; f: number}> = ({t, f}) => {
  const s = S.recap;
  const {d, r} = damage(t);
  const m = prog(t, P[20].t0 - 0.1, P[20].t0 + 0.6, easeInOut);
  const pulse = sp(f, P[20].t0 + 0.1, {damping: 8, stiffness: 200});
  const arc = prog(t, P[21].t0 + 0.1, P[21].t0 + 1.0, easeOut);
  const cy = lerp(SLOT.cy, 1270, m);
  const size = lerp(SLOT.size, 330, m) * (1 + 0.06 * Math.sin(Math.PI * clamp01(pulse)) * (1 - r));
  const guardK = prog(t, P[21].t0, P[21].t0 + 0.7, easeOut);
  const listOut = 0.55 * m;
  const arcR = 250;
  const arcPath = (a0: number, a1: number) => {
    const p = (a: number) => `${540 + Math.cos((a * Math.PI) / 180) * arcR} ${cy + Math.sin((a * Math.PI) / 180) * arcR}`;
    return `M${p(a0)} A${arcR} ${arcR} 0 0 1 ${p(a1)}`;
  };
  const len = (Math.PI * arcR * 120) / 180;
  return (
    <>
      <Chrome theme={GREEN} t={t} s={s} />
      <TitleSeq
        t={t}
        top={TITLE_Y - 20}
        size={110}
        color={K.cream}
        accent={K.gold}
        items={[{t: s + 0.3, lines: [[{text: 'Five '}, {text: 'corrupters', accent: '1'}]]}]}
      />
      <div style={{position: 'absolute', left: 170, top: 440, opacity: 1 - listOut}}>
        {ITEMS.map((it, i) => {
          const k = prog(t, s + 0.45 + i * 0.13, s + 0.95 + i * 0.13, easeOut);
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 26,
                height: 84,
                opacity: k,
                transform: `translateX(${(1 - k) * -30}px)`,
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  background: K.gold,
                  color: K.green,
                  fontFamily: KF.sans,
                  fontWeight: 700,
                  fontSize: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {i + 1}
              </div>
              <div style={{fontFamily: KF.sans, fontSize: 42, fontWeight: 500, color: K.cream}}>{it}</div>
            </div>
          );
        })}
      </div>
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
        {[arcPath(115, 235), arcPath(-55, 65)].map((dd, i) => (
          <path
            key={i}
            d={dd}
            fill="none"
            stroke={K.gold}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={len}
            strokeDashoffset={len * (1 - arc)}
            opacity={arc > 0 ? 1 : 0}
          />
        ))}
      </svg>
      <Heart id="h-recap" cx={540} cy={cy} size={size} base={K.cream} dead={K.ash} d={d} r={r} glow={r} />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 1560,
          textAlign: 'center',
          fontFamily: KF.serif,
          fontStyle: 'italic',
          fontSize: 150,
          letterSpacing: '-0.02em',
          color: K.gold,
          opacity: guardK,
          transform: `translateY(${(1 - guardK) * 40}px)`,
        }}
      >
        Guard it.
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 1480,
          textAlign: 'center',
          fontFamily: KF.mono,
          fontSize: 30,
          letterSpacing: '0.3em',
          color: K.creamDim,
          opacity: prog(t, P[20].t0, P[20].t0 + 0.4, easeOut) * (1 - guardK),
        }}
      >
        ONE HEART
      </div>
    </>
  );
};

const End: React.FC<{t: number; f: number}> = ({t, f}) => {
  const s = S.end;
  const k = (d: number) => prog(t, s + d, s + d + 0.6, easeOut);
  const sun = sp(f, s + 0.3, {damping: 16, stiffness: 120});
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: 540 - 150,
          top: 520 - 150,
          width: 300,
          height: 300,
          borderRadius: 150,
          background: K.gold,
          transform: `scale(${sun})`,
        }}
      />
      <div style={{position: 'absolute', left: 340, width: 400, top: 620, height: 3, background: K.ink}} />
      <Figure x={540} ground={622} width={220} color={K.ink} breathe={Math.sin(t * 1.6) * 0.5} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 760, textAlign: 'center'}}>
        <div style={{fontFamily: KF.mono, fontSize: 30, letterSpacing: '0.4em', color: K.inkDim, opacity: k(0.4)}}>FOLLOW</div>
        <div
          style={{
            fontFamily: KF.serif,
            fontSize: 118,
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            color: K.green,
            opacity: k(0.5),
            transform: `translateY(${(1 - k(0.5)) * 24}px)`,
          }}
        >
          The Tazkiyyah Guide
        </div>
        <div style={{fontFamily: KF.sans, fontSize: 46, fontWeight: 600, color: K.ink, marginTop: 18, opacity: k(0.7)}}>
          @TheTazkiyyahGuide
        </div>
        <div style={{fontFamily: KF.serif, fontStyle: 'italic', fontSize: 54, color: K.inkDim, marginTop: 10, opacity: k(0.85)}}>
          for similar posts
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 80,
          right: 80,
          top: 1660,
          textAlign: 'center',
          fontFamily: KF.sans,
          fontSize: 28,
          lineHeight: 1.5,
          color: K.inkDim,
          opacity: k(1.0),
        }}
      >
        Ibn al-Qayyim, Madārij al-Sālikīn, vol. 1, pp. 450–456
        <br />
        Educational reminder, not a fatwa.
      </div>
    </>
  );
};

export const Corrupters: React.FC = () => {
  useFonts();
  const f = useCurrentFrame();
  const t = f / CFPS;
  return (
    <AbsoluteFill style={{background: K.cream}}>
      <Layer t={t} name="hook" theme={CREAM}>
        <Hook t={t} f={f} />
      </Layer>
      <Layer t={t} name="intro" theme={GREEN}>
        <Intro t={t} f={f} />
      </Layer>
      <Layer t={t} name="c1" theme={CREAM}>
        <C1 t={t} f={f} />
      </Layer>
      <Layer t={t} name="c2" theme={GREEN}>
        <C2 t={t} f={f} />
      </Layer>
      <Layer t={t} name="c3" theme={INK}>
        <C3 t={t} f={f} />
      </Layer>
      <Layer t={t} name="c4" theme={CREAM}>
        <C4 t={t} f={f} />
      </Layer>
      <Layer t={t} name="c5" theme={INK}>
        <C5 t={t} f={f} />
      </Layer>
      <Layer t={t} name="recap" theme={GREEN}>
        <Recap t={t} f={f} />
      </Layer>
      <Layer t={t} name="end" theme={CREAM}>
        <End t={t} f={f} />
      </Layer>
      <Grain frame={f} opacity={0.05} />
    </AbsoluteFill>
  );
};
