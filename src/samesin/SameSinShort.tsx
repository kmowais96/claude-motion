import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {easeInOut, easeOut, lerp, prog, sp} from '../lib';
import {Book, Bubble, Check, Cross, Figure, Face, Sprout, SvgText} from '../manners/figures';
import {AR_FONT, END, e, FONT, LINES, P, SFPS, ST, s, w} from './theme';

export const SAMESIN_FPS = SFPS;
export const SAMESIN_FRAMES = Math.round(ST.duration * SFPS);

const HANDLE = 'TheTazkiyyahGuide';
const STAGE_TOP = 740;
const GROUND = 760;
const HOME = 330;
const DOOR = 800;
const AT_DOOR = 620;
const HEAD = GROUND - 470;

const win = (t: number, a: number, b: number, fin = 0.3, fout = 0.25) =>
  Math.min(prog(t, a - 0.1, a - 0.1 + fin, easeOut), 1 - prog(t, b - fout, b, easeInOut));
const track = (t: number, keys: [number, number][], dur = 0.5) => {
  let v = keys[0][1];
  for (let i = 1; i < keys.length; i++) v = lerp(v, keys[i][1], prog(t, keys[i][0], keys[i][0] + dur, easeInOut));
  return v;
};
const step = <T,>(t: number, keys: [number, T][]): T => {
  let v = keys[0][1];
  for (const [k, x] of keys) if (t >= k) v = x;
  return v;
};

const useFonts = () => {
  const [handle] = useState(() => delayRender('samesin fonts'));
  useEffect(() => {
    Promise.all([
      document.fonts.load('800 80px "Baloo 2"'),
      document.fonts.load('700 30px "Baloo 2"'),
      document.fonts.load('700 80px "Amiri"', 'لا تقنطوا'),
    ]).then(() => continueRender(handle));
  }, [handle]);
};

/* ---------- beats, all read from the narration ---------- */
const S = {
  voice: s('voice') - 0.15,
  prophet: s('prophet') - 0.15,
  h1: s('h1a') - 0.15,
  flip: s('flip1') - 0.15,
  flip2: s('flip2') - 0.15,
  iq: s('iq1') - 0.15,
  iq3: s('iq3') - 0.15,
  close: s('close') - 0.15,
  ayah: s('ayah') - 0.15,
  end: END,
};
/** The three rounds of the hadith: sin, ask, forgiven. */
const ROUNDS = [
  {sin: w('h1a', 'sins'), ask: w('h1a', 'forgive'), ok: w('h1b', 'forgiven')},
  {sin: w('h2', 'again'), ask: w('h2', 'asks'), ok: w('h2', 'forgiven')},
  {sin: w('h3', 'third'), ask: w('h3', 'forgive'), ok: w('h3', 'forgiven')},
];

/* ---------- background ---------- */

const Paper: React.FC = () => (
  <AbsoluteFill
    style={{
      background: P.paper,
      backgroundImage: `radial-gradient(${P.dot} 3px, transparent 3.5px), radial-gradient(ellipse at 50% 42%, rgba(255,255,255,0.55), rgba(0,0,0,0) 62%), linear-gradient(180deg, ${P.paper}, ${P.paperDeep})`,
      backgroundSize: '54px 54px, 100% 100%, 100% 100%',
      backgroundPosition: '27px 27px, 0 0, 0 0',
    }}
  />
);

/** The whisper and the "stop asking" beat dim the stage, never the words. */
const Night: React.FC<{k: number}> = ({k}) =>
  k <= 0 ? null : (
    <div
      style={{
        position: 'absolute',
        top: 640,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: k,
        background: `linear-gradient(180deg, rgba(31,36,51,0) 0%, ${P.nightSoft} 22%, ${P.nightSoft} 100%)`,
      }}
    />
  );

const Header: React.FC = () => (
  <div style={{position: 'absolute', top: 92, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 22}}>
    <div style={{width: 90, height: 3, background: P.teal, opacity: 0.6, borderRadius: 2}} />
    <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 30, letterSpacing: 5, color: P.teal}}>SAME SIN AGAIN?</div>
    <div style={{width: 90, height: 3, background: P.teal, opacity: 0.6, borderRadius: 2}} />
  </div>
);

/** ×1 ×2 ×3: one gold circle fills on each "Forgiven". */
const Counter: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const o = win(t, S.h1, S.iq, 0.4, 0.4);
  if (o <= 0) return null;
  return (
    <div style={{position: 'absolute', top: 150, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, opacity: o}}>
      <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 28, letterSpacing: 3, color: P.inkSoft, marginRight: 10, paddingTop: 4}}>FORGIVEN</div>
      {ROUNDS.map((r, i) => {
        const k = sp(frame, r.ok, {damping: 11, stiffness: 180}, SFPS);
        const on = k > 0.5;
        return (
          <div
            key={i}
            style={{
              width: 64,
              height: 46,
              borderRadius: 23,
              border: `4px solid ${on ? P.gold : P.line}`,
              background: on ? P.gold : 'transparent',
              transform: `scale(${1 + 0.35 * Math.sin(Math.min(1, k) * Math.PI)})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: FONT,
              fontWeight: 800,
              fontSize: 26,
              color: on ? P.white : P.inkSoft,
              paddingTop: 4,
            }}
          >
            ×{i + 1}
          </div>
        );
      })}
    </div>
  );
};

/* ---------- the spoken line, word by word ---------- */

const colourOf = (c: string | null) => (c === 'r' ? P.red : c === 'g' ? P.gold : c === 't' ? P.teal : P.ink);

const Headline: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const groups: string[] = [];
  for (const l of LINES) if (!groups.includes(l.group)) groups.push(l.group);
  return (
    <>
      {groups.map((g, gi) => {
        const lines = LINES.filter((l) => l.group === g);
        const start = lines[0].s - 0.12;
        const next = gi + 1 < groups.length ? LINES.find((l) => l.group === groups[gi + 1])!.s - 0.12 : S.end;
        if (t < start - 0.1 || t > next + 0.2) return null;
        const out = prog(t, next - 0.16, next, easeInOut);
        const chars = lines.reduce((a, l) => a + l.words.reduce((b, x) => b + x.t.length + 1, 0), 0);
        const size = chars > 85 ? 66 : chars > 60 ? 74 : 82;
        return (
          <div key={g} style={{position: 'absolute', top: 262, left: 84, right: 84, opacity: 1 - out, transform: `translateY(${-out * 24}px)`}}>
            {lines.map((l) => (
              <div key={l.key} style={{fontFamily: FONT, fontWeight: 800, fontSize: size, lineHeight: 1.08, color: P.ink, marginBottom: 14, letterSpacing: -0.5}}>
                {l.words.map((wd, i) => {
                  const k = sp(frame, wd.s - 0.06, {damping: 15, stiffness: 210, mass: 0.6}, SFPS);
                  const col = colourOf(wd.c);
                  const u = prog(t, wd.s + 0.05, wd.s + 0.45, easeOut);
                  return (
                    <span key={i} style={{display: 'inline-block', marginRight: size * 0.24, opacity: Math.min(1, k * 1.5), transform: `translateY(${(1 - k) * 36}px)`, position: 'relative', color: col, ...(wd.t === 'ﷺ' ? {fontFamily: AR_FONT, fontWeight: 400, color: P.gold} : {})}}>
                      {wd.t}
                      {wd.c && (
                        <svg style={{position: 'absolute', left: 0, bottom: 2, width: '100%', height: 18, overflow: 'visible'}} viewBox="0 0 100 18" preserveAspectRatio="none">
                          <path d="M2,10 Q30,3 55,9 T98,7" fill="none" stroke={col} strokeWidth={5} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - u} vectorEffect="non-scaling-stroke" opacity={0.85} />
                        </svg>
                      )}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        );
      })}
    </>
  );
};

/* ---------- chips under the stage ---------- */

const CHIPS: {text: string; a: () => number; b: () => number; tone: 'teal' | 'red' | 'dark'}[] = [
  {text: 'HE STILL KNOWS WHERE TO GO', a: () => w('h1b', 'forgives'), b: () => ROUNDS[1].sin - 0.2, tone: 'teal'},
  {text: 'EVERY SINGLE TIME', a: () => ROUNDS[2].ok + 0.1, b: () => S.flip, tone: 'teal'},
  {text: 'THE REAL DANGER', a: () => w('flip2', 'stop'), b: () => S.iq, tone: 'red'},
  {text: 'AL-WABIL AL-SAYYIB', a: () => s('iq1') + 0.3, b: () => S.iq3, tone: 'teal'},
  {text: 'NEVER STOP COMING BACK', a: () => w('close', 'coming'), b: () => S.ayah, tone: 'dark'},
];

const Chips: React.FC<{t: number; frame: number}> = ({t, frame}) => (
  <>
    {CHIPS.map((c) => {
      const a = c.a();
      const b = c.b();
      if (t < a - 0.05 || t > b + 0.3) return null;
      const k = sp(frame, a, {damping: 12, stiffness: 200}, SFPS);
      const out = prog(t, b - 0.2, b, easeInOut);
      const col = c.tone === 'red' ? P.red : c.tone === 'dark' ? P.ink : P.teal;
      const solid = c.tone !== 'teal';
      return (
        <div key={c.text} style={{position: 'absolute', top: 1548, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: Math.min(1, k * 1.5) * (1 - out)}}>
          <div
            style={{
              fontFamily: FONT,
              fontWeight: 800,
              fontSize: solid ? 48 : 44,
              letterSpacing: 2,
              color: solid ? P.white : col,
              background: solid ? col : P.white,
              border: `4px solid ${col}`,
              borderRadius: 60,
              padding: solid ? '10px 44px 4px' : '8px 34px 2px',
              transform: `scale(${0.6 + 0.4 * k})`,
            }}
          >
            {c.text}
          </div>
        </div>
      );
    })}
  </>
);

/* ---------- props ---------- */

/** The door of light: an arch on the ground at x. `draw` strokes it on, `glow` fills it. */
const Door: React.FC<{x: number; draw: number; glow: number; flash: number; frame: number}> = ({x, draw, glow, flash, frame}) => {
  const hw = 120;
  const top = GROUND - 420;
  const d = `M${x - hw},${GROUND} L${x - hw},${top} A${hw},${hw} 0 0 1 ${x + hw},${top} L${x + hw},${GROUND}`;
  return (
    <g>
      {/* rays */}
      <g opacity={glow * (0.35 + 0.65 * flash)}>
        {Array.from({length: 9}).map((_, i) => {
          const a = -Math.PI / 2 + ((i - 4) / 4) * 1.05;
          const r0 = 170 + 6 * Math.sin(frame * 0.12 + i);
          const r1 = r0 + 60 + 50 * flash;
          return <line key={i} x1={x + Math.cos(a) * r0} y1={top + Math.sin(a) * r0} x2={x + Math.cos(a) * r1} y2={top + Math.sin(a) * r1} stroke={P.gold} strokeWidth={6} strokeLinecap="round" />;
        })}
      </g>
      <path d={`${d} Z`} fill={P.glow} fillOpacity={glow * (0.55 + 0.45 * flash)} stroke="none" />
      <path d={d} fill="none" stroke={P.gold} strokeWidth={7} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
    </g>
  );
};

/** A red scribble: the sin, hanging over his shoulder. */
const Smudge: React.FC<{x: number; y: number; k: number; frame: number}> = ({x, y, k, frame}) =>
  k <= 0.01 ? null : (
    <g transform={`translate(${x},${y}) scale(${k}) rotate(${frame * 2})`} opacity={Math.min(1, k * 1.4)}>
      <path
        d="M-34,-6 C-30,-36 10,-40 26,-18 C44,4 18,34 -6,30 C-30,26 -20,-12 2,-10 C20,-8 16,14 0,12"
        fill="none"
        stroke={P.red}
        strokeWidth={7}
        strokeLinecap="round"
      />
    </g>
  );

const Stamp: React.FC<{x: number; y: number; k: number; o: number}> = ({x, y, k, o}) =>
  k <= 0.01 || o <= 0 ? null : (
    <g transform={`translate(${x},${y}) rotate(-9) scale(${0.4 + 0.6 * k + 0.5 * (1 - Math.min(1, k))})`} opacity={Math.min(1, k * 2) * o}>
      <rect x={-170} y={-44} width={340} height={88} rx={14} fill={P.white} stroke={P.gold} strokeWidth={7} />
      <SvgText x={0} y={4} size={58} color={P.gold}>FORGIVEN</SvgText>
    </g>
  );

/** sin → repent, round and round: the loop that does NOT ruin you. */
const Loop: React.FC<{t: number; o: number; check: number}> = ({t, o, check}) => {
  if (o <= 0) return null;
  const r = 150;
  const labels = ['sin', 'repent', 'sin', 'repent'];
  return (
    <g opacity={o} transform={`translate(540,${HEAD - 150})`}>
      <circle r={r} fill="none" stroke={P.teal} strokeWidth={6} strokeDasharray="22 16" strokeLinecap="round" transform={`rotate(${t * 40})`} />
      {labels.map((l, i) => {
        const a = (i / 4) * Math.PI * 2 + t * 0.7;
        return (
          <g key={i} transform={`translate(${Math.cos(a) * r},${Math.sin(a) * r})`}>
            <rect x={l === 'sin' ? -50 : -76} y={-26} width={l === 'sin' ? 100 : 152} height={52} rx={26} fill={P.white} stroke={l === 'sin' ? P.red : P.teal} strokeWidth={5} />
            <SvgText x={0} y={3} size={32} color={l === 'sin' ? P.red : P.teal}>{l}</SvgText>
          </g>
        );
      })}
      <g transform={`scale(${check})`}>
        <Check k={1} r={42} />
      </g>
    </g>
  );
};

/** sin → … and nothing after it. */
const DeadEnd: React.FC<{t: number; o: number; a: number}> = ({t, o, a}) => {
  if (o <= 0) return null;
  const k = prog(t, a, a + 0.8, easeOut);
  return (
    <g opacity={o} transform={`translate(540,${HEAD - 150})`}>
      <rect x={-240} y={-30} width={110} height={60} rx={30} fill={P.white} stroke={P.red} strokeWidth={5} />
      <SvgText x={-185} y={3} size={34} color={P.red}>sin</SvgText>
      <line x1={-110} y1={0} x2={-110 + 260 * k} y2={0} stroke={P.red} strokeWidth={6} strokeLinecap="round" strokeDasharray="4 16" />
      <SvgText x={190} y={-6} size={70} color={P.red} weight={800}>{k > 0.95 ? '…' : ''}</SvgText>
    </g>
  );
};

/* ---------- the stage ---------- */

const Stage: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const pop = (at: number, cfg = {damping: 12, stiffness: 190}) => sp(frame, at, cfg, SFPS);

  // where he stands: home, then to the door and back each round, then running back
  const xKeys: [number, number][] = [[0, HOME]];
  ROUNDS.forEach((r, i) => {
    xKeys.push([r.ask - 0.1, AT_DOOR]);
    const next = i < 2 ? ROUNDS[i + 1].sin - 0.55 : S.flip;
    xKeys.push([next, HOME]);
  });
  xKeys.push([w('iq3', 'running') - 0.05, AT_DOOR]);
  const x = track(t, xKeys, 0.5);

  const roundOf = (tt: number) => ROUNDS.findIndex((r, i) => tt >= r.sin - 0.1 && tt < (i < 2 ? ROUNDS[i + 1].sin - 0.1 : S.flip));
  const ri = roundOf(t);
  const round = ri >= 0 ? ROUNDS[ri] : null;

  const mood = step<Face>(t, [
    [0, 'flat'], [w('hook2', 'embarrassed'), 'sad'], [S.prophet, 'flat'], [w('prophet', 'exactly'), 'o'],
    [S.h1, 'flat'], ...ROUNDS.flatMap((r) => [[r.sin, 'sad'], [r.ask, 'talk'], [r.ok, 'smile']] as [number, Face][]),
    [S.flip, 'smile'], [S.flip2, 'flat'], [w('flip2', 'stop'), 'sad'],
    [S.iq, 'flat'], [w('iq2', 'jannah'), 'o'], [S.iq3, 'flat'], [w('iq3', 'running'), 'smile'],
    [S.close, 'flat'], [w('close', 'coming'), 'smile'],
  ]);
  const brows = (t < S.prophet && t > w('hook2', 'embarrassed') - 0.2) || (t > w('flip2', 'stop') && t < S.iq) ? 'worried' : null;
  const arms = track(t, [[0, 125], [w('hook2', 'embarrassed'), 14], ...ROUNDS.flatMap((r) => [[r.ask, 140], [r.ok + 0.3, 14]] as [number, number][]),
    [w('iq3', 'running'), 60], [S.close, 14], [w('close', 'fighting'), 95], [w('close', 'fighting') + 0.6, 14], [w('close', 'coming'), 140]], 0.3);
  const look = step(t, [[0, 0], [S.prophet + 0.3, 1], [S.flip, 0], [S.flip2, -1], [S.iq, 0], [w('iq2', 'jannah'), 1], [S.iq3, 0], [w('iq3', 'running'), 1], [S.close, 1]]);
  const lean = track(t, [[0, 0], [w('hook2', 'embarrassed'), 6], [S.prophet, 0], [w('flip2', 'stop'), 7], [S.iq, 0], [w('iq3', 'humble'), 7], [w('iq3', 'running'), -6], [w('iq3', 'running') + 0.6, 0]], 0.35);

  // the door: drawn on at "exactly", open through the rounds, dimmed on "stop asking", bright again at Jannah
  const doorDraw = prog(t, w('prophet', 'exactly') - 0.2, w('prophet', 'exactly') + 0.8, easeOut);
  const doorGlow = track(t, [[0, 0], [w('prophet', 'exactly'), 0.55], [w('flip2', 'stop'), 0.08], [w('iq2', 'jannah') - 0.1, 0.8], [S.close, 0.6], [w('close', 'coming'), 1]], 0.6);
  const flash = Math.max(0, ...ROUNDS.map((r) => win(t, r.ok, r.ok + 0.9, 0.2, 0.6)), win(t, w('close', 'coming'), S.ayah, 0.3, 0.3) * 0.6);
  const doorO = 1 - prog(t, S.ayah - 0.1, S.ayah + 0.4, easeInOut);

  // the sin over his shoulder
  const smudgeK = Math.max(
    ...ROUNDS.map((r) => (t >= r.sin - 0.05 && t < r.ok + 0.4 ? pop(r.sin - 0.05) * (1 - prog(t, r.ok, r.ok + 0.35, easeInOut)) : 0)),
    t >= w('flip2', 'sin') - 0.05 && t < S.iq ? pop(w('flip2', 'sin') - 0.05) * (1 - prog(t, S.iq - 0.3, S.iq, easeInOut)) : 0,
    t >= w('close', 'fighting') - 0.1 && t < w('close', 'fighting') + 0.9 ? pop(w('close', 'fighting') - 0.1) * (1 - prog(t, w('close', 'fighting') + 0.5, w('close', 'fighting') + 0.9, easeInOut)) : 0,
  );

  const figO = 1 - prog(t, S.ayah - 0.1, S.ayah + 0.4, easeInOut);
  const matO = 1 - prog(t, S.voice + 1, S.prophet, easeInOut);

  return (
    <svg width={1080} height={960} viewBox="0 0 1080 960" style={{position: 'absolute', top: STAGE_TOP, left: 0, overflow: 'visible'}}>
      <g transform={`translate(540,${GROUND}) scale(1.3) translate(-540,${-GROUND})`}>
        <g opacity={figO}>
          <line x1={110} y1={GROUND} x2={970} y2={GROUND} stroke={P.line} strokeWidth={5} strokeLinecap="round" />
          <Sprout x={130} y={GROUND} />
          <Sprout x={950} y={GROUND} flip />
        </g>

        <g opacity={doorO}>
          <Door x={DOOR} draw={doorDraw} glow={doorGlow} flash={flash} frame={frame} />
          {t > w('iq2', 'jannah') - 0.1 && t < S.iq3 + 0.2 && (
            <g transform={`translate(${DOOR},${GROUND - 250}) scale(${pop(w('iq2', 'jannah'))})`} opacity={1 - prog(t, S.iq3 - 0.1, S.iq3 + 0.2)}>
              <SvgText x={0} y={0} size={46} color={P.gold}>Jannah</SvgText>
            </g>
          )}
        </g>

        {/* prayer mat */}
        <rect x={HOME - 110} y={GROUND - 8} width={220} height={16} rx={6} fill={P.teal} opacity={0.75 * matO} />

        {/* the whisper */}
        {t > S.voice - 0.1 && t < S.prophet + 0.3 && (
          <g opacity={1 - prog(t, S.prophet - 0.1, S.prophet + 0.3)}>
            <Bubble x={HOME + 300} y={HEAD - 90} w={340} h={100} tx={HOME + 70} ty={HEAD - 20} k={pop(w('voice', 'what') - 0.1)} fill={P.night} stroke={P.ink}>
              <SvgText x={0} y={4} size={38} color={P.white}>What's the point?</SvgText>
            </Bubble>
            <Bubble x={HOME + 330} y={HEAD + 50} w={340} h={96} tx={HOME + 70} ty={HEAD + 20} k={pop(w('voice', 'done') - 0.15)} fill={P.night} stroke={P.ink}>
              <SvgText x={0} y={4} size={34} color={P.white}>He's done with you.</SvgText>
            </Bubble>
          </g>
        )}

        {/* the hadith: one "forgive me" bubble per round, and the stamp */}
        {ROUNDS.map((r, i) => {
          const end = i < 2 ? ROUNDS[i + 1].sin - 0.3 : S.flip;
          if (t < r.ask - 0.1 || t > end + 0.2) return null;
          const out = 1 - prog(t, end - 0.25, end, easeInOut);
          return (
            <g key={i} opacity={out}>
              <Bubble x={AT_DOOR - 160} y={HEAD - 90} w={250} h={96} tx={AT_DOOR - 40} ty={HEAD + 10} k={pop(r.ask) * (1 - prog(t, r.ok, r.ok + 0.25))}>
                <SvgText x={0} y={4} size={34} color={P.teal}>forgive me</SvgText>
              </Bubble>
              <Stamp x={AT_DOOR - 20} y={HEAD - 150} k={t > r.ok - 0.05 ? pop(r.ok - 0.05, {damping: 9, stiffness: 260}) : 0} o={1} />
            </g>
          );
        })}

        {/* the flip */}
        <Loop t={t} o={win(t, S.flip + 0.2, S.flip2, 0.4, 0.25)} check={t > e('flip1') - 0.3 ? pop(e('flip1') - 0.3) : 0} />
        <DeadEnd t={t} o={win(t, S.flip2 + 0.1, S.iq, 0.3, 0.3)} a={w('flip2', 'and')} />

        {/* Ibn al-Qayyim's book */}
        {t > S.iq - 0.1 && t < w('iq2', 'jannah') + 0.2 && (
          <g transform={`translate(${HOME + 230},${HEAD - 120}) scale(${pop(S.iq + 0.1)})`} opacity={1 - prog(t, w('iq2', 'jannah') - 0.2, w('iq2', 'jannah') + 0.2)}>
            <Book color={P.gold} />
          </g>
        )}

        {/* "keep fighting the sin": he pushes it off */}
        {t > w('close', 'fighting') && t < w('close', 'fighting') + 0.9 && (
          <g transform={`translate(${x - 150},${HEAD - 10})`}>
            <Cross size={52} k={prog(t, w('close', 'fighting') + 0.2, w('close', 'fighting') + 0.5)} />
          </g>
        )}

        <g opacity={figO}>
          <Smudge x={x - 150} y={HEAD - 10} k={smudgeK} frame={frame} />
          <Figure x={x} y={GROUND} body={P.green} hat="kufi" mood={mood} frame={frame} armL={arms} armR={arms} look={look} lean={lean} brows={brows as 'worried' | null} />
        </g>
      </g>
    </svg>
  );
};

/* ---------- the ayah ---------- */

const Ayah: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  if (t < S.ayah - 0.2) return null;
  const k = sp(frame, S.ayah, {damping: 16, stiffness: 120}, SFPS);
  const out = prog(t, S.end - 0.3, S.end, easeInOut);
  return (
    <div style={{position: 'absolute', top: 820, left: 60, right: 60, textAlign: 'center', opacity: Math.min(1, k * 1.3) * (1 - out), transform: `translateY(${(1 - k) * 30}px)`}}>
      <div style={{fontFamily: AR_FONT, fontWeight: 700, fontSize: 112, lineHeight: 1.6, color: P.gold, direction: 'rtl'}}>لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ</div>
      <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 34, letterSpacing: 4, color: P.teal, marginTop: 10}}>AZ-ZUMAR 39:53</div>
    </div>
  );
};

/* ---------- end card ---------- */

const EndCard: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  if (t < S.end - 0.3) return null;
  const k = (d: number) => sp(frame, S.end + d, {damping: 14, stiffness: 160}, SFPS);
  const rise = (d: number) => ({opacity: Math.min(1, k(d) * 1.4), transform: `translateY(${(1 - k(d)) * 40}px)`});
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column', paddingBottom: 120}}>
      <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 76, lineHeight: 1.08, color: P.ink, textAlign: 'center', padding: '0 90px', ...rise(0)}}>
        Send this to someone who thinks they've asked <span style={{color: P.gold}}>too many times.</span>
      </div>
      <div style={{height: 70}} />
      <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 30, letterSpacing: 5, color: P.teal, ...rise(0.35)}}>FOLLOW</div>
      <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 64, color: P.ink, marginTop: 4, ...rise(0.45)}}>@{HANDLE}</div>
      <div style={{marginTop: 34, ...rise(0.6)}}>
        <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 34, color: P.white, background: P.teal, borderRadius: 50, padding: '10px 60px 4px'}}>Follow</div>
      </div>
      <div style={{position: 'absolute', bottom: 330, left: 80, right: 80, fontFamily: FONT, fontWeight: 600, fontSize: 30, lineHeight: 1.3, color: P.inkSoft, textAlign: 'center', ...rise(0.8)}}>
        Bukhari 7507 · Muslim 2758 · Qur'an 39:53
        <br />
        Ibn al-Qayyim, <i>al-Wabil al-Sayyib</i>
      </div>
    </AbsoluteFill>
  );
};

export const SameSinShort: React.FC<{audio?: boolean}> = ({audio = true}) => {
  useFonts();
  const frame = useCurrentFrame();
  const t = frame / SFPS;
  const night = Math.max(win(t, S.voice, S.prophet, 0.5, 0.5), 0.7 * win(t, w('flip2', 'stop') - 0.3, S.iq, 0.5, 0.4));
  return (
    <AbsoluteFill>
      <Paper />
      <Night k={night} />
      <Header />
      <Headline t={t} frame={frame} />
      <Stage t={t} frame={frame} />
      <Ayah t={t} frame={frame} />
      <Chips t={t} frame={frame} />
      <Counter t={t} frame={frame} />
      <EndCard t={t} frame={frame} />
      {audio && <Audio src={staticFile('samesin/mix.wav')} />}
    </AbsoluteFill>
  );
};
