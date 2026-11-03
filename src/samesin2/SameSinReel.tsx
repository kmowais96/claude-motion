import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {easeInOut, easeOut, lerp, prog, sp} from '../lib';
import {Defs, Door, Hero, Lectern, Mat, Pill, River, Scribble, Shadow, Speech, Tally, Tree, Window} from './art';
import {AR, e, END, FPS, K, LINES, s, ST, TYPE, w} from './theme';

export const REEL_FPS = FPS;
export const REEL_FRAMES = Math.round(ST.duration * FPS);
const HANDLE = 'TheTazkiyyahGuide';

/* ---------------- beats, all from the narration ---------------- */

const HOME = 40;
const FRONT = 690; // where he stands to ask, just before the door
const DOOR = 900;
const LECTERN = 470;

const T = {
  lower: w('hook2', 'embarrassed'),
  voice: s('voice'),
  what: w('voice', 'what'),
  done: w('voice', 'done'),
  prophet: s('prophet'),
  exactly: w('prophet', 'exactly'),
  flip: s('flip1'),
  flipEnd: e('flip1'),
  flip2: s('flip2'),
  sin2: w('flip2', 'sin'),
  stop: w('flip2', 'stop'),
  iq: s('iq1'),
  jannah: w('iq2', 'jannah'),
  iq3: s('iq3'),
  humble: w('iq3', 'humble'),
  running: w('iq3', 'running'),
  close: s('close'),
  fighting: w('close', 'fighting'),
  coming: w('close', 'coming'),
  ayah: s('ayah'),
  end: END,
};
const ROUNDS = [
  {sin: w('h1a', 'sins'), ask: w('h1a', 'forgive'), ok: w('h1b', 'forgiven')},
  {sin: w('h2', 'again'), ask: w('h2', 'asks'), ok: w('h2', 'forgiven')},
  {sin: w('h3', 'third'), ask: w('h3', 'forgive'), ok: w('h3', 'forgiven')},
];
/** When he hops home after each round. */
const BACK = [ROUNDS[1].sin - 0.75, ROUNDS[2].sin - 0.75, ROUNDS[2].ok + 0.55];

/* ---------------- small helpers ---------------- */

type Key = [number, number, number?]; // [start, value, duration]
/** Value that eases to each key's value over its duration, starting at its time. */
const track = (t: number, keys: Key[], dflt = 0.5) => {
  let v = keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [a, val, d = dflt] = keys[i];
    v = lerp(v, val, prog(t, a, a + d, easeInOut));
  }
  return v;
};
const win = (t: number, a: number, b: number, fin = 0.3, fout = 0.3) => Math.min(prog(t, a, a + fin, easeOut), 1 - prog(t, b - fout, b, easeInOut));

/** Hops between two x positions: returns x, lift and a landing squash. */
type Move = {a: number; b: number; from: number; to: number; hops: number; h?: number};
const MOVES: Move[] = [
  ...ROUNDS.flatMap((r, i) => [
    {a: r.ask - 0.1, b: r.ask + 0.55, from: HOME, to: FRONT, hops: 2},
    {a: BACK[i], b: BACK[i] + 0.55, from: FRONT, to: HOME, hops: 2},
  ]),
  {a: T.running - 0.05, b: T.running + 0.5, from: HOME, to: FRONT, hops: 3, h: 50},
  {a: T.coming + 0.05, b: T.coming + 0.75, from: FRONT, to: DOOR, hops: 2},
];
const hero = (t: number) => {
  let x = HOME;
  let lift = 0;
  let squash = 0;
  for (const m of MOVES) {
    if (t >= m.b) x = m.to;
    else if (t >= m.a) {
      const p = (t - m.a) / (m.b - m.a);
      x = lerp(m.from, m.to, easeInOut(p));
      const ph = p * m.hops;
      lift = Math.sin((ph % 1) * Math.PI) * (m.h ?? 70);
      squash = Math.max(0, 1 - Math.abs((ph % 1) - 0) * 8, 1 - Math.abs((ph % 1) - 1) * 8) * 0.8;
    }
    // a little settle after landing
    if (t >= m.b && t < m.b + 0.25) squash = Math.max(squash, (1 - (t - m.b) / 0.25) * 0.9);
  }
  return {x, lift, squash};
};

/* ---------------- fonts ---------------- */

const useFonts = () => {
  const [handle] = useState(() => delayRender('reel fonts'));
  useEffect(() => {
    Promise.all([document.fonts.load('800 80px "Inter Variable"'), document.fonts.load('700 80px "Amiri"', 'لا تقنطوا')]).then(() => continueRender(handle));
  }, [handle]);
};

/* ---------------- kinetic type, in the reference's manner ---------------- */

const SMALL = new Set(['a', 'an', 'the', 'to', 'of', 'and', 'in', 'he', 'its', 'you', 'him', 'it', 'that', 'who', 'has', 'from', 'with', 'so', 'but', 'is', 'be', 'my', 'one', 'can', 'then', 'says', 'this', 'same', 'youre', 'hes', 'not', 'never', 'keep', 'because', 'asks', 'times', 'many']);
const norm = (x: string) => x.toLowerCase().replace(/[^a-z]/g, '');

const Word: React.FC<{t: string; c: string | null; at: number; frame: number; time: number; ink: string}> = ({t, c, at, frame, time, ink}) => {
  const big = c !== null;
  const small = !big && SMALL.has(norm(t));
  const size = big ? 116 : small ? 50 : 74;
  const k = sp(frame, at - 0.04, {damping: 16, stiffness: 260, mass: 0.5}, FPS);
  const u = prog(time, at + 0.08, at + 0.5, easeOut);
  const isAr = t === 'ﷺ';
  return (
    <span
      style={{
        display: 'inline-block',
        position: 'relative',
        fontFamily: isAr ? AR : TYPE,
        fontWeight: isAr ? 700 : 800,
        fontSize: isAr ? size * 0.9 : size,
        lineHeight: 1,
        letterSpacing: '-0.045em',
        color: isAr ? K.gold : ink,
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

/* ---------------- the world ---------------- */

const World: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const pop = (at: number, cfg = {damping: 12, stiffness: 200}) => sp(frame, at, cfg, FPS);

  // camera: the world point (x, y) sits at screen (540, 1100), scaled by z
  const camKeys = (k: 'x' | 'y' | 'z') => {
    const i = {x: 0, y: 1, z: 2}[k];
    const K_: [number, number, [number, number, number]][] = [
      [0, 0, [-50, -330, 1.55]],
      [0.15, 4.4, [20, -322, 1.22]],
      [T.voice - 0.25, 0.9, [-70, -330, 1.12]],
      [w('prophet', 'described') - 0.4, 1.5, [LECTERN, -330, 0.95]],
      ...ROUNDS.flatMap((r) => [[r.ok - 0.05, 0.25, [LECTERN, -340, 1.0]], [r.ok + 0.25, 0.7, [LECTERN, -330, 0.95]]] as [number, number, [number, number, number]][]),
      [T.flip - 0.1, 1.0, [380, -270, 0.8]],
      [T.stop - 0.7, 1.2, [170, -320, 1.12]],
      [T.iq - 0.15, 0.8, [LECTERN, -230, 1.35]],
      [w('iq2', 'person') - 0.2, 1.0, [LECTERN, -330, 0.95]],
      [T.iq3 - 0.2, 1.2, [400, -330, 1.0]],
      [T.coming - 0.2, 1.7, [1300, -340, 0.95]],
      [T.ayah - 0.35, 1.6, [1720, -1080, 0.95]],
    ];
    let v = K_[0][2][i];
    for (const [a, d, val] of K_.slice(1)) v = lerp(v, val[i], prog(t, a, a + d, easeInOut));
    return v;
  };
  const cx = camKeys('x');
  const cy = camKeys('y');
  const z = camKeys('z');

  const {x: hx, lift, squash} = hero(t);
  const roundIdx = ROUNDS.findIndex((r, i) => t >= r.sin - 0.1 && t < BACK[i] + 0.6);
  const asking = roundIdx >= 0 && t >= ROUNDS[roundIdx].ask + 0.4 && t < ROUNDS[roundIdx].ok + 0.45;

  // hero pose
  const arms = track(t, [
    [0, 155],
    [T.lower - 0.1, 10, 0.7],
    ...ROUNDS.flatMap((r) => [[r.ask + 0.45, 150, 0.3], [r.ok + 0.45, 10, 0.4]] as Key[]),
    [T.running + 0.5, 150, 0.35],
    [T.close, 15, 0.4],
    [T.coming - 0.1, 150, 0.3],
  ]);
  const swat = Math.sin(Math.PI * prog(t, T.fighting + 0.05, T.fighting + 0.45, easeOut)) * 150;
  const look = track(t, [
    [0, 0],
    [T.lower, -0.15, 0.6],
    [T.what, -0.7, 0.4],
    [T.exactly - 0.2, 0.8, 0.5],
    [T.stop - 0.3, -0.95, 0.4],
    [T.iq3 - 0.2, 0.2, 0.4],
    [T.running - 0.3, 0.8, 0.3],
  ]);
  const bow = track(t, [
    [0, 0],
    [T.lower, 8, 0.6],
    [T.prophet, 0, 0.5],
    [T.stop - 0.2, -10, 0.5],
    [T.iq3 - 0.2, 0, 0.4],
    [T.humble - 0.1, 16, 0.5],
    [T.running - 0.2, 8, 0.25],
    [T.running + 0.6, 0, 0.3],
  ]);
  const heroIn = 1 - prog(t, T.coming + 0.55, T.coming + 0.9, easeInOut);
  const gardenHero = prog(t, T.ayah - 0.3, T.ayah + 0.5, easeOut);

  // the door
  const doorOpen = track(t, [
    [0, 0],
    [T.exactly - 0.1, 0.12, 0.6],
    ...ROUNDS.flatMap((r, i) => [[r.ok - 0.35, 1, 0.4], [BACK[i] + 0.2, 0.12, 0.5]] as Key[]),
    [T.stop - 0.2, 0, 0.8],
    [T.jannah - 0.3, 1, 0.4],
    [T.iq3 + 0.4, 0.12, 0.5],
    [T.running + 0.15, 1, 0.4],
  ]);
  const doorLight = track(t, [
    [0, 0],
    [T.exactly - 0.1, 0.4, 0.5],
    ...ROUNDS.flatMap((r, i) => [[r.ok - 0.3, 1, 0.3], [BACK[i] + 0.2, 0.4, 0.5]] as Key[]),
    [T.stop - 0.2, 0, 0.8],
    [T.jannah - 0.3, 1, 0.4],
    [T.iq3 + 0.4, 0.4, 0.5],
    [T.running + 0.15, 1, 0.4],
  ]);
  const flash = Math.max(0, ...[...ROUNDS.map((r) => r.ok), T.jannah, T.coming + 0.4].map((a) => win(t, a - 0.05, a + 1.0, 0.15, 0.7)));

  // the sin over his shoulder
  const scribbles: {a: number; b: number; size: number; fade?: boolean}[] = [
    ...ROUNDS.map((r) => ({a: r.sin - 0.05, b: r.ok, size: 1})),
    {a: T.sin2 - 0.05, b: T.iq - 0.1, size: 1.5, fade: true},
    {a: T.fighting - 0.35, b: T.fighting + 0.3, size: 1.2},
  ];

  // the whisper
  const shadowK = win(t, T.voice - 0.1, T.prophet + 0.2, 0.7, 0.5);

  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <Defs frame={frame} />
      <g transform={`translate(540,1100) scale(${z}) translate(${-cx},${-cy})`}>
        <g filter="url(#boil)">
          {/* ground */}
          <rect x={-3000} y={0} width={9000} height={3000} fill={K.ground} />
          <line x1={-3000} y1={0} x2={6000} y2={0} stroke={K.ink} strokeWidth={4} />
          {[...Array(40)].map((_, i) => (
            <path key={i} d={`M${-1200 + i * 110},${18 + (i % 3) * 30} l10,-10 m4,10 l10,-10`} stroke={K.groundDark} strokeWidth={3} strokeLinecap="round" />
          ))}

          {/* the room */}
          <Window x={170} y={-610} />
          <Tally x={-340} y={-560} n={8} k={prog(t, 0, 2.6, (x) => x)} />
          <Mat x={HOME} />
          <Lectern x={LECTERN} flip={prog(t, T.iq + 0.3, T.iq + 1.1, easeInOut)} />

          {/* the garden, beyond the door */}
          <River x0={1150} x1={2700} t={t} />
          {[
            [1260, 1.05, 3],
            [1500, 0.85, 11],
            [1790, 1.25, 19],
            [2080, 0.95, 27],
            [2370, 1.15, 35],
          ].map(([x, sc, sd]) => (
            <Tree key={x} x={x} s={sc} seed={sd} sway={Math.sin(t * 1.3 + x)} />
          ))}
          {[0, 1, 2, 3].map((i) => {
            const bx = 1450 + i * 170 + ((t * 30 + i * 50) % 120);
            const by = -760 - i * 60 + Math.sin(t * 2 + i) * 14;
            const f = Math.sin(t * 9 + i) * 10;
            return <path key={i} d={`M${bx - 22},${by - f} Q${bx - 10},${by - 10} ${bx},${by} Q${bx + 10},${by - 10} ${bx + 22},${by - f}`} fill="none" stroke={K.ink} strokeWidth={3.5} strokeLinecap="round" />;
          })}

          {/* the door */}
          <Door x={DOOR} open={doorOpen} light={doorLight} flash={flash} frame={frame} peek={t > T.jannah - 0.4 ? 1 : 0} />
          {/* a gold tick on the frame for each time he was forgiven */}
          {ROUNDS.map((r, i) =>
            t > r.ok ? (
              <g key={i} transform={`translate(${DOOR + 195},${-330 + i * 70}) scale(${pop(r.ok, {damping: 9, stiffness: 260})})`}>
                <circle r={26} fill={K.gold} stroke={K.ink} strokeWidth={3.5} />
                <path d="M-11,1 L-3,9 L12,-8" fill="none" stroke={K.ink} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
              </g>
            ) : null,
          )}

          {/* the loop on the ground: sin -> repent, round and round */}
          {(() => {
            const o = win(t, T.flip, T.flip2 + 0.4, 0.4, 0.4);
            if (o <= 0) return null;
            const draw = prog(t, T.flip + 0.1, T.flip + 1.0, easeOut);
            return (
              <g opacity={o}>
                <ellipse cx={(HOME + FRONT) / 2} cy={70} rx={410} ry={42} fill="none" stroke={K.white} strokeWidth={8} strokeDasharray="26 18" strokeDashoffset={-t * 120} strokeLinecap="round" opacity={draw} />
                <Pill x={HOME - 40} y={-440} text="sin" color={K.red} k={pop(w('flip1', 'sin') - 0.05)} />
                <Pill x={FRONT + 20} y={-440} text="repent" color={K.hero} k={pop(w('flip1', 'repent') - 0.05)} />
                <path d={`M${HOME + 60},-470 Q${(HOME + FRONT) / 2},-560 ${FRONT - 90},-470`} fill="none" stroke={K.ink} strokeWidth={4} strokeDasharray="10 10" opacity={prog(t, w('flip1', 'repent'), w('flip1', 'repent') + 0.4)} />
                <path d={`M${FRONT - 90},-410 Q${(HOME + FRONT) / 2},-330 ${HOME + 60},-410`} fill="none" stroke={K.ink} strokeWidth={4} strokeDasharray="10 10" opacity={prog(t, w('flip1', 'sin', 1), w('flip1', 'sin', 1) + 0.4)} />
                {t > T.flipEnd - 0.35 && (
                  <g transform={`translate(${(HOME + FRONT) / 2},-470) scale(${pop(T.flipEnd - 0.35, {damping: 9, stiffness: 240})})`}>
                    <circle r={54} fill={K.ground} stroke={K.ink} strokeWidth={4} />
                    <path d="M-24,2 L-6,20 L26,-16" fill="none" stroke={K.white} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
                  </g>
                )}
              </g>
            );
          })()}

          {/* the dead end: sin, and then nothing */}
          {(() => {
            const o = win(t, T.flip2, T.iq - 0.05, 0.3, 0.3);
            if (o <= 0) return null;
            const k = prog(t, T.sin2 + 0.2, T.stop, easeOut);
            return (
              <g opacity={o}>
                <line x1={HOME - 110} y1={60} x2={HOME - 110 - 300 * k} y2={60} stroke={K.red} strokeWidth={8} strokeDasharray="20 18" strokeLinecap="round" />
                {k > 0.95 && (
                  <text x={HOME - 470} y={78} fontFamily={TYPE} fontWeight={800} fontSize={90} fill={K.red}>
                    …
                  </text>
                )}
              </g>
            );
          })()}

          {/* his shadow stands up and whispers */}
          <Shadow x={-230} k={shadowK} />
          <Speech x={-170} y={-575} k={t < T.prophet + 0.2 ? pop(T.what - 0.1) * (1 - prog(t, T.prophet - 0.1, T.prophet + 0.2)) : 0} text="What's the point?" dark tx={-220} ty={-420} size={52} />
          <Speech x={60} y={-460} k={t < T.prophet + 0.2 ? pop(T.done - 0.1) * (1 - prog(t, T.prophet - 0.1, T.prophet + 0.2)) : 0} text="He's done with you." dark tx={-150} ty={-380} size={48} />

          {/* round by round: "forgive me" */}
          {ROUNDS.map((r, i) => (
            <Speech key={i} x={FRONT - 150} y={-490} k={t > r.ask + 0.3 && t < r.ok + 0.3 ? pop(r.ask + 0.3) * (1 - prog(t, r.ok, r.ok + 0.3)) : 0} text="My Lord, forgive me" tx={FRONT - 40} ty={-350} size={50} />
          ))}

          {/* the book: al-Wabil al-Sayyib */}
          <Speech x={LECTERN} y={-420} k={t > T.iq + 0.3 && t < w('iq2', 'person') + 0.3 ? pop(T.iq + 0.3) * (1 - prog(t, w('iq2', 'person'), w('iq2', 'person') + 0.3)) : 0} text="al-Wabil al-Sayyib" tx={LECTERN} ty={-230} size={44} />
          {/* a sin that takes him to Jannah: a gold trail from him to the door */}
          {(() => {
            const o = win(t, w('iq2', 'sin') - 0.1, T.iq3 + 0.6, 0.3, 0.4);
            if (o <= 0) return null;
            const k = prog(t, w('iq2', 'takes') - 0.1, T.jannah, easeInOut);
            return (
              <path d={`M${HOME + 60},50 C${HOME + 260},120 ${DOOR - 300},120 ${DOOR - 20},40`} fill="none" stroke={K.gold} strokeWidth={12} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - k} opacity={o} />
            );
          })()}

          {/* the hero */}
          {heroIn > 0 && (
            <g opacity={heroIn}>
              <ellipse cx={hx} cy={4} rx={100 - lift * 0.5} ry={12} fill={K.groundDark} opacity={0.7} />
              <Hero x={hx} y={-lift} look={look} armL={arms} armR={Math.max(arms, swat)} bow={bow} squash={squash} />
              {scribbles.map((sc, i) => {
                if (t < sc.a || t > sc.b + 0.6) return null;
                const draw = prog(t, sc.a, sc.a + 0.4, easeOut);
                const burst = sc.fade ? 0 : prog(t, sc.b, sc.b + 0.5, easeOut);
                const fade = sc.fade ? 1 - prog(t, sc.b - 0.3, sc.b, easeInOut) : 1;
                return (
                  <g key={i} opacity={fade}>
                    <Scribble x={hx - 120 * (i === 4 ? -1.1 : 1)} y={-360 - lift} draw={draw} burst={burst} frame={frame} size={sc.size} />
                  </g>
                );
              })}
            </g>
          )}
          {/* in the garden, at the end, looking up */}
          {gardenHero > 0 && (
            <g opacity={gardenHero}>
              <Hero x={1640} look={0.1} armL={150} armR={150} bow={-4} />
            </g>
          )}
        </g>
      </g>
    </svg>
  );
};

/* ---------------- the ayah and the end card ---------------- */

const Ayah: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  if (t < T.ayah - 0.1) return null;
  const k = sp(frame, T.ayah + 0.2, {damping: 18, stiffness: 120}, FPS);
  const out = prog(t, T.end - 0.35, T.end, easeInOut);
  const u = prog(t, T.ayah + 0.6, T.ayah + 1.6, easeOut);
  return (
    <div style={{position: 'absolute', top: 760, left: 40, right: 40, textAlign: 'center', opacity: Math.min(1, k * 1.4) * (1 - out), transform: `translateY(${(1 - k) * 30}px)`}}>
      <div style={{fontFamily: AR, fontWeight: 700, fontSize: 124, lineHeight: 1.55, color: K.ink, direction: 'rtl'}}>لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ</div>
      <svg width={620} height={30} viewBox="0 0 620 30" style={{display: 'block', margin: '0 auto'}}>
        <path d="M10,18 Q160,4 310,16 T610,12" fill="none" stroke={K.gold} strokeWidth={8} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - u} />
      </svg>
      <div style={{fontFamily: TYPE, fontWeight: 800, fontSize: 34, letterSpacing: 4, color: K.ink, marginTop: 16, opacity: u}}>AZ-ZUMAR · 39:53</div>
    </div>
  );
};

const EndCard: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  if (t < T.end - 0.1) return null;
  const words: [string, 'r' | null, number][] = [
    ['Send', null, 0],
    ['this', null, 0.12],
    ['to', null, 0.2],
    ['someone', null, 0.28],
    ['who', null, 0.42],
    ['thinks', null, 0.5],
    ["they've", null, 0.6],
    ['asked', null, 0.7],
    ['too', 'r', 0.85],
    ['many', 'r', 0.95],
    ['times.', 'r', 1.05],
  ];
  const k = (d: number) => sp(frame, T.end + d, {damping: 15, stiffness: 170}, FPS);
  return (
    <>
      <div style={{position: 'absolute', top: 236, left: 72, right: 110, display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', columnGap: 22, rowGap: 14, isolation: 'isolate'}}>
        {words.map(([wd, c, d], i) => (
          <Word key={i} t={wd} c={c} at={T.end + d} frame={frame} time={t} ink={K.ink} />
        ))}
      </div>
      <div style={{position: 'absolute', top: 700, left: 72, opacity: Math.min(1, k(1.5) * 1.5), transform: `translateY(${(1 - k(1.5)) * 20}px)`}}>
        <div style={{fontFamily: TYPE, fontWeight: 800, fontSize: 34, letterSpacing: 5, color: K.inkSoft}}>FOLLOW</div>
        <div style={{fontFamily: TYPE, fontWeight: 800, fontSize: 76, letterSpacing: '-0.035em', color: K.ink}}>@{HANDLE}</div>
        <div style={{fontFamily: TYPE, fontWeight: 600, fontSize: 32, color: K.inkSoft, marginTop: 18, lineHeight: 1.35}}>
          Bukhari 7507 · Muslim 2758 · Qur'an 39:53
          <br />
          Ibn al-Qayyim, al-Wabil al-Sayyib
        </div>
      </div>
    </>
  );
};

export const SameSinReel: React.FC<{audio?: boolean}> = ({audio = true}) => {
  useFonts();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const night = Math.max(win(t, T.voice - 0.1, T.prophet + 0.1, 0.6, 0.5), 0.85 * win(t, T.stop - 0.4, T.iq, 0.6, 0.4));
  const ink = night > 0.35 ? K.white : K.ink;
  return (
    <AbsoluteFill style={{background: K.paper}}>
      <World t={t} frame={frame} />
      <AbsoluteFill style={{background: K.night, opacity: night * 0.62}} />
      <Type t={t} frame={frame} ink={ink} />
      <Ayah t={t} frame={frame} />
      <EndCard t={t} frame={frame} />
      {audio && <Audio src={staticFile('samesin2/mix.wav')} />}
    </AbsoluteFill>
  );
};
