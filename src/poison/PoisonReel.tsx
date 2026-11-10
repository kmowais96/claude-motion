import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {easeInOut, easeOut, lerp, prog, sp} from '../lib';
import {Bottle, Child, Coin, Defs, Door, Hero, Lantern, Masjid, OldMan, Sapling, Scribble, Shelf, Speech, Tally, Window} from './art';
import {AR, END, FPS, K, LINES, s, ST, TYPE, w} from './theme';

export const POISON_FPS = FPS;
export const POISON_FRAMES = Math.round(ST.duration * FPS);
const HANDLE = 'TheTazkiyyahGuide';

/* ---------------- the world's places (world units, y = 0 is the ground) ---------------- */

const SAP = -560; // the sapling in its pot
const SHELF = 330; // the shelf with the bottle
const LOW = -230; // low shelf top: in the child's reach
const HIGH = -640; // high shelf top
const LAMPS = [520, 900];
const GIVE_F = 680; // father's spot by the gate
const GIVE_C = 900; // child's spot by the gate
const OLD = 1190; // the old man
const BOWL = {x: OLD - 110, y: -150};

/* ---------------- beats, all from the narration ---------------- */

const T = {
  one: w('hook1', 'one'),
  more: w('hook2', 'more'),
  poison0: w('hook2', 'poison'),
  rule: s('rule1'),
  used: w('rule2', 'used'),
  habit: w('rule3', 'habit'),
  settle: w('rule3', 'settle'),
  becomes: w('rule4', 'becomes'),
  who: w('rule4', 'who'),
  give: s('give1'),
  hand: w('give1', 'hand'),
  sweet: w('give3', 'sweetness'),
  lie: s('lie1'),
  poison: w('lie1', 'poison'),
  lying: w('lie1', 'lying'),
  keep: s('lie2'),
  deadly: w('lie2', 'deadly'),
  because: s('lie3'),
  easy: w('lie3', 'easy'),
  world: w('lie3', 'world'),
  next: w('lie3', 'next'),
  tomorrow: s('end1'),
  small: w('end1', 'small'),
  end: END,
};
/** Three gifts: "give it", "again", "and again". Each: coin to the child, then into the bowl. */
const GIFTS = [w('give2', 'give'), w('give2', 'again'), w('give2', 'again', 1)];
const FINAL_GIFT = w('end1', 'give');

/* ---------------- small helpers ---------------- */

type Key = [number, number, number?];
const track = (t: number, keys: Key[], dflt = 0.5) => {
  let v = keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [a, val, d = dflt] = keys[i];
    v = lerp(v, val, prog(t, a, a + d, easeInOut));
  }
  return v;
};
const win = (t: number, a: number, b: number, fin = 0.3, fout = 0.3) => Math.min(prog(t, a, a + fin, easeOut), 1 - prog(t, b - fout, b, easeInOut));

type Move = {a: number; b: number; to: number; hops: number; h?: number};
const walker = (start: number, moves: Move[]) => (t: number) => {
  let x = start;
  let from = start;
  let lift = 0;
  let squash = 0;
  for (const m of moves) {
    if (t >= m.b) x = m.to;
    else if (t >= m.a) {
      const p = (t - m.a) / (m.b - m.a);
      x = lerp(from, m.to, easeInOut(p));
      const ph = (p * m.hops) % 1;
      lift = Math.sin(ph * Math.PI) * (m.h ?? 60);
      squash = Math.max(0, 1 - ph * 8, 1 - (1 - ph) * 8) * 0.8;
    }
    if (t >= m.b && t < m.b + 0.25) squash = Math.max(squash, (1 - (t - m.b) / 0.25) * 0.9);
    from = m.to;
  }
  return {x, lift, squash};
};
const child = walker(120, [
  {a: T.rule - 0.1, b: T.rule + 0.8, to: SAP + 200, hops: 3, h: 50},
  {a: T.give - 0.2, b: T.give + 1.1, to: GIVE_C, hops: 5, h: 50},
  {a: T.lie - 0.45, b: T.lie + 0.6, to: 170, hops: 4, h: 50},
  {a: T.keep + 0.9, b: T.keep + 1.4, to: 40, hops: 2, h: 40},
  {a: T.tomorrow - 0.1, b: T.tomorrow + 1.0, to: GIVE_C, hops: 4, h: 55},
]);
const father = walker(-420, [
  {a: T.more - 0.35, b: T.more + 0.35, to: -110, hops: 2, h: 70},
  {a: T.give - 0.1, b: T.give + 1.1, to: GIVE_F, hops: 4, h: 70},
  {a: T.lie - 0.45, b: T.lie + 0.6, to: -80, hops: 4, h: 70},
  {a: T.keep - 0.05, b: T.keep + 0.45, to: 190, hops: 2, h: 60},
  {a: T.tomorrow - 0.1, b: T.tomorrow + 1.0, to: GIVE_F, hops: 3, h: 60},
]);

/* ---------------- fonts ---------------- */

const useFonts = () => {
  const [handle] = useState(() => delayRender('reel fonts'));
  useEffect(() => {
    Promise.all([document.fonts.load('800 80px "Inter Variable"'), document.fonts.load('700 80px "Amiri"', 'ليذوق حلاوة الإعطاء')]).then(() => continueRender(handle));
  }, [handle]);
};

/* ---------------- kinetic type, in the same-sin manner ---------------- */

const SMALL = new Set(['a', 'an', 'the', 'to', 'of', 'and', 'in', 'he', 'it', 'you', 'him', 'your', 'from', 'with', 'so', 'is', 'be', 'his', 'on', 'up', 'while', 'than', 'let', 'when', 'until', 'once', 'for', 'this', 'whatever', 'hes', 'made', 'more', 'away', 'said', 'put']);
const norm = (x: string) => x.toLowerCase().replace(/[^a-z]/g, '');

const Word: React.FC<{t: string; c: string | null; at: number; frame: number; time: number; ink: string}> = ({t, c, at, frame, time, ink}) => {
  const big = c !== null;
  const small = !big && SMALL.has(norm(t));
  const size = big ? 116 : small ? 50 : 74;
  const k = sp(frame, at - 0.04, {damping: 16, stiffness: 260, mass: 0.5}, FPS);
  const u = prog(time, at + 0.08, at + 0.5, easeOut);
  return (
    <span
      style={{
        display: 'inline-block',
        position: 'relative',
        fontFamily: TYPE,
        fontWeight: 800,
        fontSize: size,
        lineHeight: 1,
        letterSpacing: '-0.045em',
        color: c === 'r' ? K.red : ink,
        alignSelf: small ? 'flex-start' : 'auto',
        marginTop: small ? 6 : 0,
        opacity: Math.min(1, k * 2),
        transform: `translateY(${(1 - k) * 18}px) scale(${0.92 + 0.08 * k})`,
        transformOrigin: 'left bottom',
      }}
    >
      {c === 'g' && (
        <span
          style={{
            position: 'absolute',
            left: -8,
            right: -8,
            bottom: 6,
            height: '42%',
            background: K.gold,
            opacity: 0.75,
            transformOrigin: 'left',
            transform: `scaleX(${u}) skewX(-8deg)`,
            zIndex: -1,
            borderRadius: 6,
          }}
        />
      )}
      {t}
      {c === 'r' && (
        <svg style={{position: 'absolute', left: 0, bottom: -16, width: '100%', height: 20, overflow: 'visible'}} viewBox="0 0 100 20" preserveAspectRatio="none">
          <path d="M1,10 q6,-8 12,0 t12,0 t12,0 t12,0 t12,0 t12,0 t12,0 t12,0" fill="none" stroke={K.red} strokeWidth={4} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - u} vectorEffect="non-scaling-stroke" />
        </svg>
      )}
    </span>
  );
};

const Type: React.FC<{t: number; frame: number; ink: string}> = ({t, frame, ink}) => {
  const groups: string[] = [];
  for (const l of LINES) if (!groups.includes(l.group)) groups.push(l.group);
  return (
    <>
      {groups.map((g, gi) => {
        const lines = LINES.filter((l) => l.group === g);
        const start = lines[0].s - 0.1;
        const next = gi + 1 < groups.length ? LINES.find((l) => l.group === groups[gi + 1])!.s - 0.1 : T.end - 0.1;
        if (t < start - 0.1 || t >= next) return null;
        const words = lines.flatMap((l) => l.words);
        return (
          <div key={g} style={{position: 'absolute', top: 236, left: 72, right: 110, display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', columnGap: 22, rowGap: 14, isolation: 'isolate'}}>
            {words.map((wd, i) => (
              <Word key={i} t={wd.t} c={wd.c} at={wd.s} frame={frame} time={t} ink={ink} />
            ))}
          </div>
        );
      })}
    </>
  );
};

/** The book and page, small, under the ground line while his words are on screen. */
const Source: React.FC<{t: number; ink: string}> = ({t, ink}) => {
  const items: [number, number, string][] = [
    [T.rule + 0.4, T.give - 0.2, 'Tuhfat al-Mawdud · Bab 16 · p.240'],
    [T.give + 0.2, T.lie - 0.2, 'Tuhfat al-Mawdud · Bab 16 · p.241'],
    [T.lie + 0.3, T.tomorrow - 0.2, 'Tuhfat al-Mawdud · Bab 16 · p.241'],
  ];
  return (
    <>
      {items.map(([a, b, txt], i) => {
        const o = win(t, a, b, 0.4, 0.3);
        if (o <= 0) return null;
        return (
          <div key={i} style={{position: 'absolute', top: 1612, left: 0, right: 0, textAlign: 'center', opacity: o}}>
            <span style={{fontFamily: TYPE, fontWeight: 800, fontSize: 30, letterSpacing: 2, color: ink, background: 'rgba(255,255,255,0.18)', border: `3px solid ${ink}`, borderRadius: 40, padding: '10px 26px'}}>{txt}</span>
          </div>
        );
      })}
    </>
  );
};

/* ---------------- the world ---------------- */

const World: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const pop = (at: number, cfg = {damping: 12, stiffness: 200}) => sp(frame, at, cfg, FPS);

  // camera: world point (x, y) at screen (540, 1100), scaled by z
  const K_: [number, number, [number, number, number]][] = [
    [0, 0, [300, -300, 1.3]],
    [0.2, 3.4, [270, -320, 1.18]],
    [T.more - 0.4, 0.8, [180, -330, 1.08]],
    [T.rule - 0.2, 1.1, [-600, -330, 1.0]],
    [T.becomes - 0.2, 1.0, [-560, -440, 0.86]],
    [T.give - 0.3, 1.3, [880, -330, 0.9]],
    ...GIFTS.map((g) => [g - 0.05, 0.3, [930, -340, 0.96]] as [number, number, [number, number, number]]),
    [T.sweet - 0.4, 1.4, [990, -360, 1.06]],
    [T.lie - 0.5, 1.1, [300, -330, 1.22]],
    [T.lying - 0.12, 0.25, [320, -360, 1.4]],
    [T.keep - 0.1, 1.2, [260, -420, 1.0]],
    [T.because - 0.2, 1.0, [690, -520, 0.92]],
    [T.tomorrow - 0.2, 1.1, [900, -330, 0.92]],
    [T.end - 0.3, 1.4, [1000, -230, 0.8]],
  ];
  const cam = (i: number) => {
    let v = K_[0][2][i];
    for (const [a, d, val] of K_.slice(1)) v = lerp(v, val[i], prog(t, a, a + d, easeInOut));
    return v;
  };
  const cx = cam(0);
  const cy = cam(1);
  const z = cam(2);

  const c = child(t);
  const f = father(t);

  // ---- the child's pose
  const reach = track(t, [
    [0, 150],
    [T.more + 0.1, 40, 0.4],
    [T.give + 1.1, 20],
    [T.sweet - 0.2, 160, 0.35],
    [T.lie - 0.5, 20, 0.3],
    [T.lying - 0.1, 70, 0.2],
    [T.keep + 0.8, 15, 0.3],
    [T.tomorrow + 1.0, 95, 0.3],
    [FINAL_GIFT + 0.4, 160, 0.4],
  ]);
  const giveArm = Math.max(
    0,
    ...GIFTS.map((g) => Math.sin(Math.PI * prog(t, g + 0.15, g + 0.75, easeInOut)) * 100),
    Math.sin(Math.PI * prog(t, FINAL_GIFT - 0.3, FINAL_GIFT + 0.3, easeInOut)) * 70,
  );
  const cLook = track(t, [
    [0, 0.6],
    [T.more, -0.6, 0.3],
    [T.rule, 0.0, 0.4],
    [T.give + 1.1, 0.7, 0.3],
    [T.lie, 0.5, 0.3],
    [T.lying, -0.8, 0.2],
    [T.keep + 0.9, -0.4, 0.3],
    [T.tomorrow, 0.7, 0.3],
  ]);
  const cBow = track(t, [
    [0, -6],
    [T.more, 0, 0.3],
    [T.lying, 10, 0.3],
    [T.keep + 1, 4, 0.4],
    [T.tomorrow, -4, 0.4],
  ]);
  // ---- the father's pose: he stops the hand, gives, lifts the bottle away
  const fArm = track(t, [
    [0, 10],
    [T.more + 0.1, 95, 0.3],
    [T.rule + 0.6, 10, 0.4],
    [T.hand - 0.5, 90, 0.4],
    ...GIFTS.flatMap((g) => [[g - 0.35, 95, 0.2], [g + 0.1, 60, 0.3]] as Key[]),
    [T.sweet, 10, 0.5],
    [T.keep + 0.1, 150, 0.4],
    [T.keep + 1.8, 10, 0.5],
    [T.tomorrow + 1.0, 70, 0.4],
  ]);
  const fLook = track(t, [
    [0, 0.6],
    [T.rule, -0.4, 0.4],
    [T.give + 1, 0.6, 0.3],
    [T.keep, 0.7, 0.3],
  ]);

  // ---- the bottle: low shelf, then lifted to the high one by the father
  const lift = prog(t, T.keep + 0.45, T.keep + 1.35, easeInOut);
  const bx = lerp(SHELF, SHELF - 10, lift);
  const by = lerp(LOW, HIGH, lift) - Math.sin(lift * Math.PI) * 60;
  const glow = Math.max(0.4 + 0.3 * Math.sin(t * 5), win(t, T.poison0 - 0.1, T.rule, 0.2, 0.5) * 1.6, win(t, T.poison - 0.1, T.keep + 0.4, 0.2, 0.4) * 1.8);
  const shake = Math.max(win(t, T.poison0 - 0.05, T.poison0 + 0.6, 0.05, 0.3), win(t, T.lying - 0.05, T.lying + 0.7, 0.05, 0.4));
  const lie = prog(t, T.lying - 0.05, T.lying + 0.25, easeOut);
  const qmark = (1 - prog(t, T.rule - 0.2, T.rule + 0.3)) * pop(0.05);

  // ---- the sapling: grows along the stake; the stake goes, the bend stays
  const grow = prog(t, T.settle - 0.2, T.who + 0.4, easeInOut);
  const bend = prog(t, T.habit - 0.2, T.becomes, easeInOut);
  const crown = prog(t, T.becomes - 0.1, T.who + 0.5, easeOut);
  const stake = 1 - prog(t, T.becomes + 0.2, T.who + 0.6, easeInOut);
  // the tally: every day the same habit
  const tallyK = prog(t, T.used - 0.6, T.used + 1.6, (x) => x);
  // red tally for lies: once it is easy, it repeats
  const lieTally = prog(t, T.easy - 0.5, T.easy + 0.9, (x) => x);

  // ---- coins
  const coins: React.ReactNode[] = [];
  const arc = (a: {x: number; y: number}, b: {x: number; y: number}, p: number, h = 120) => ({x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p) - Math.sin(p * Math.PI) * h});
  const fHand = {x: f.x + 120, y: -280 - f.lift};
  const cHand = {x: c.x + 60, y: -170 - c.lift};
  // "put it in your child's hand"
  {
    const a = T.hand - 0.45;
    const p = prog(t, a, a + 0.45, easeInOut);
    if (t >= a - 0.3 && t < GIFTS[0] + 0.15) {
      const q = t < a ? fHand : arc(fHand, cHand, p, 90);
      coins.push(<Coin key="first" x={q.x} y={q.y} k={pop(a - 0.3)} spin={p * 6} />);
    }
  }
  GIFTS.forEach((g, i) => {
    const a = g + 0.15;
    const p = prog(t, a, a + 0.45, easeInOut);
    if (i > 0 && t >= g - 0.35 && t < a) {
      const q = arc(fHand, cHand, prog(t, g - 0.35, g - 0.05, easeInOut), 70);
      coins.push(<Coin key={`h${i}`} x={q.x} y={q.y} k={1} spin={t * 20} />);
    }
    if (t >= a && t < a + 0.6) {
      const q = arc(cHand, BOWL, p, 110);
      coins.push(<Coin key={`g${i}`} x={q.x} y={q.y} k={1 - prog(t, a + 0.45, a + 0.6)} spin={p * 8} />);
    }
  });
  // tomorrow: the coin rides in his hand, then drops into the bowl
  {
    const a = T.tomorrow - 0.1;
    const drop = FINAL_GIFT - 0.15;
    if (t >= a && t < drop + 0.6) {
      const p = prog(t, drop, drop + 0.45, easeInOut);
      const q = t < drop ? {x: c.x + 60, y: -190 - c.lift} : arc({x: c.x + 60, y: -190}, BOWL, p, 100);
      coins.push(<Coin key="tmr" x={q.x} y={q.y} k={pop(a) * (1 - prog(t, drop + 0.45, drop + 0.6))} spin={t < drop ? 0 : p * 8} />);
    }
  }
  const drops = [...GIFTS.map((g) => g + 0.6), FINAL_GIFT + 0.3];
  const flash = Math.max(0, ...drops.map((a) => win(t, a - 0.05, a + 0.9, 0.1, 0.6)), win(t, T.sweet - 0.1, T.sweet + 1.6, 0.3, 0.8));

  // lamps
  const lampK = pop(T.because - 0.1);
  const lampOn = [1 - prog(t, T.world - 0.05, T.world + 0.3), 1 - prog(t, T.next - 0.05, T.next + 0.3)];

  const showLamps = t > T.because - 0.2 && t < T.tomorrow + 0.6;

  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <Defs frame={frame} />
      <g transform={`translate(540,1100) scale(${z}) translate(${-cx},${-cy})`}>
        <g filter="url(#boil)">
          {/* ground */}
          <rect x={-3000} y={0} width={9000} height={3000} fill={K.ground} />
          <line x1={-3000} y1={0} x2={6000} y2={0} stroke={K.ink} strokeWidth={4} />
          {[...Array(44)].map((_, i) => (
            <path key={i} d={`M${-1500 + i * 110},${18 + (i % 3) * 30} l10,-10 m4,10 l10,-10`} stroke={K.groundDark} strokeWidth={3} strokeLinecap="round" />
          ))}

          {/* the room: the habit wall, the window, the sapling */}
          <Window x={-340} y={-640} />
          <Tally x={-1040} y={-600} n={8} k={tallyK} />
          <Sapling x={SAP} bend={bend} grow={grow} crown={crown} stake={stake} sway={Math.sin(t * 1.4)} />

          {/* the shelves and the bottle */}
          <Shelf x={SHELF} y={LOW} w={280} />
          <Shelf x={SHELF} y={HIGH} w={280} />
          <Tally x={-10} y={-760} n={4} k={lieTally} />
          {lieTally > 0 &&
            [0, 1, 2, 3].map((g) =>
              prog(lieTally, g / 4, (g + 1) / 4) > 0.2 ? (
                <line key={g} x1={-10 + (g % 4) * 78 - 6} y1={-760 + 4} x2={-10 + (g % 4) * 78 + 52} y2={-760 + 40} stroke={K.red} strokeWidth={5} strokeLinecap="round" />
              ) : null,
            )}
          <Bottle x={bx} y={by} glow={glow} shake={shake} lie={lie} frame={frame} s={1.25} />
          {qmark > 0.01 && (
            <text x={SHELF + 90} y={LOW - 200 + Math.sin(t * 4) * 6} fontFamily={TYPE} fontWeight={800} fontSize={120} fill={K.red} stroke={K.ink} strokeWidth={3} opacity={qmark}>
              ?
            </text>
          )}

          {/* the masjid gate, the old man and his bowl */}
          <Masjid x={OLD + 330} />
          <Door x={OLD + 330} open={1} light={0.7 + 0.3 * flash} flash={flash} frame={frame} />
          <OldMan x={OLD} bow={-4 + 6 * flash} />
          {/* a gold tick on the gate for each gift */}
          {drops.map((a, i) =>
            t > a ? (
              <g key={i} transform={`translate(${OLD + 330 - 260 + i * 70},${-600}) scale(${pop(a, {damping: 9, stiffness: 260})})`}>
                <circle r={26} fill={K.gold} stroke={K.ink} strokeWidth={3.5} />
                <path d="M-11,1 L-3,9 L12,-8" fill="none" stroke={K.ink} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
              </g>
            ) : null,
          )}
          {/* the count, x1 x2 x3 */}
          {GIFTS.map((g, i) =>
            t > g + 0.6 && t < T.lie - 0.3 ? (
              <text key={i} x={GIVE_C - 30} y={-470 - i * 0} fontFamily={TYPE} fontWeight={800} fontSize={86} fill={K.ink} opacity={i === GIFTS.filter((x) => t > x + 0.6).length - 1 ? pop(g + 0.6) : 0} transform={`translate(0,${-(1 - pop(g + 0.6)) * 30})`}>
                ×{i + 1}
              </text>
            ) : null,
          )}

          {/* two lamps: this world and the next */}
          {showLamps && (
            <>
              <Lantern x={LAMPS[0]} y={-720} on={lampOn[0]} label="THIS WORLD" frame={frame} k={lampK * 1.25} />
              <Lantern x={LAMPS[1]} y={-720} on={lampOn[1]} label="THE NEXT" frame={frame} k={pop(T.because + 0.1) * 1.25} />
            </>
          )}

          {/* the father */}
          <ellipse cx={f.x} cy={4} rx={100 - f.lift * 0.5} ry={12} fill={K.groundDark} opacity={0.7} />
          <Hero x={f.x} y={-f.lift} look={fLook} armL={10} armR={fArm} squash={f.squash} color={K.heroDark} />

          {/* the child */}
          <ellipse cx={c.x} cy={4} rx={64 - c.lift * 0.3} ry={9} fill={K.groundDark} opacity={0.7} />
          <Child x={c.x} y={-c.lift} look={cLook} armL={Math.max(10, reach * 0.5)} armR={Math.max(reach, giveArm)} bow={cBow} squash={c.squash} />
          {/* the lie, over his shoulder */}
          {(() => {
            if (t < T.lying - 0.1 || t > T.keep + 1.2) return null;
            return <Scribble x={c.x - 90} y={-250 - c.lift} draw={prog(t, T.lying - 0.05, T.lying + 0.35, easeOut)} burst={prog(t, T.keep + 0.7, T.keep + 1.2, easeOut)} frame={frame} size={1.1} />;
          })()}
          <Speech x={c.x + 150} y={-330} k={t > T.lying && t < T.keep + 0.5 ? pop(T.lying + 0.05) * (1 - prog(t, T.keep + 0.2, T.keep + 0.5)) : 0} text="It wasn't me." dark tx={c.x + 50} ty={-200} size={46} />

          {/* sweetness: gold sparks rise from his hands */}
          {(() => {
            const o = win(t, T.sweet - 0.3, T.lie - 0.3, 0.3, 0.4);
            if (o <= 0) return null;
            return Array.from({length: 14}).map((_, i) => {
              const q = ((t - T.sweet) * 0.7 + i / 14) % 1;
              const x = c.x + Math.sin(i * 2.3) * 110 * (0.4 + q);
              const y = -260 - q * 420;
              return <path key={i} d={`M${x},${y - 14} L${x + 5},${y - 4} L${x + 15},${y} L${x + 5},${y + 4} L${x},${y + 14} L${x - 5},${y + 4} L${x - 15},${y} L${x - 5},${y - 4} Z`} fill={K.gold} stroke={K.ink} strokeWidth={2} opacity={o * (1 - q)} />;
            });
          })()}
          {coins}
        </g>
      </g>
    </svg>
  );
};

/* ---------------- hook kicker and end card ---------------- */

const Kicker: React.FC<{t: number}> = ({t}) => {
  const o = 1 - prog(t, T.rule - 0.3, T.rule);
  if (o <= 0) return null;
  return (
    <div style={{position: 'absolute', top: 150, left: 72, opacity: o}}>
      <span style={{fontFamily: TYPE, fontWeight: 800, fontSize: 30, letterSpacing: 5, color: K.white, background: K.red, borderRadius: 8, padding: '8px 16px'}}>PARENTS, WATCH THIS</span>
    </div>
  );
};

const EndCard: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  if (t < T.end - 0.1) return null;
  const words: [string, 'r' | 'g' | null, number][] = [
    ['Send', null, 0],
    ['this', null, 0.12],
    ['to', null, 0.2],
    ['a', null, 0.26],
    ['parent', 'g', 0.34],
    ['who', null, 0.5],
    ['needs', null, 0.58],
    ['it.', null, 0.68],
  ];
  const k = (d: number) => sp(frame, T.end + d, {damping: 15, stiffness: 170}, FPS);
  return (
    <>
      <div style={{position: 'absolute', top: 236, left: 72, right: 110, display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', columnGap: 22, rowGap: 14, isolation: 'isolate'}}>
        {words.map(([wd, c, d], i) => (
          <Word key={i} t={wd} c={c} at={T.end + d} frame={frame} time={t} ink={K.ink} />
        ))}
      </div>
      <div style={{position: 'absolute', top: 520, left: 72, right: 72, opacity: Math.min(1, k(0.9) * 1.5), transform: `translateY(${(1 - k(0.9)) * 20}px)`}}>
        <div style={{fontFamily: AR, fontWeight: 700, fontSize: 84, color: K.ink, direction: 'rtl', textAlign: 'left', lineHeight: 1.4}}>ليذوق حلاوة الإعطاء</div>
        <div style={{fontFamily: TYPE, fontWeight: 700, fontSize: 36, color: K.inkSoft, marginTop: 4}}>“…so he tastes the sweetness of giving.”</div>
      </div>
      <div style={{position: 'absolute', top: 760, left: 72, opacity: Math.min(1, k(1.4) * 1.5), transform: `translateY(${(1 - k(1.4)) * 20}px)`}}>
        <div style={{fontFamily: TYPE, fontWeight: 800, fontSize: 34, letterSpacing: 5, color: K.inkSoft}}>FOLLOW</div>
        <div style={{fontFamily: TYPE, fontWeight: 800, fontSize: 76, letterSpacing: '-0.035em', color: K.ink}}>@{HANDLE}</div>
        <div style={{fontFamily: TYPE, fontWeight: 600, fontSize: 30, color: K.inkSoft, marginTop: 18, lineHeight: 1.4}}>
          Ibn al-Qayyim, Tuhfat al-Mawdud, Bab 16, pp. 240–241
          <br />
          Educational reminder, not a fatwa.
        </div>
      </div>
    </>
  );
};

export const PoisonReel: React.FC<{audio?: boolean}> = ({audio = true}) => {
  useFonts();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const night = 0.8 * win(t, T.lie - 0.5, T.tomorrow + 0.2, 0.7, 0.7);
  const ink = night > 0.35 ? K.white : K.ink;
  return (
    <AbsoluteFill style={{background: K.paper}}>
      <World t={t} frame={frame} />
      <AbsoluteFill style={{background: K.night, opacity: night * 0.7}} />
      <Kicker t={t} />
      <Type t={t} frame={frame} ink={ink} />
      <Source t={t} ink={ink} />
      <AbsoluteFill style={{background: K.paper, opacity: 0.86 * prog(t, T.end - 0.1, T.end + 0.4)}} />
      <EndCard t={t} frame={frame} />
      {audio && <Audio src={staticFile('poison/mix.wav')} />}
    </AbsoluteFill>
  );
};
