import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {easeInOut, easeOut, lerp, prog, sp} from '../lib';
import {Book, Bubble, Bulb, Check, Cross, Dots, Ear, Figure, Face, Heart, Hourglass, Scales, Sprout, Stop, SvgText, Trophy, Wave, Waves} from './figures';
import {END, e, FONT, LINES, MFPS, MT, P, s, w} from './theme';
import {useMannersFonts} from './fonts';

export const MANNERS_FPS = MFPS;
export const MANNERS_FRAMES = Math.round(MT.duration * MFPS);

const HANDLE = 'TheTazkiyyahGuide';
const STAGE_TOP = 740; // stage svg sits here; ground line at stage y 760 (1400 on screen)
const GROUND = 760;

/** 0→1 in over `fin` before a, 1→0 out over `fout` before b. */
const win = (t: number, a: number, b: number, fin = 0.3, fout = 0.25) =>
  Math.min(prog(t, a - 0.1, a - 0.1 + fin, easeOut), 1 - prog(t, b - fout, b, easeInOut));

/** Piecewise value: keys [[time, value], ...], each move eased over `dur` seconds starting at its time. */
const track = (t: number, keys: [number, number][], dur = 0.5) => {
  let v = keys[0][1];
  for (let i = 1; i < keys.length; i++) v = lerp(v, keys[i][1], prog(t, keys[i][0], keys[i][0] + dur, easeInOut));
  return v;
};
/** Last value whose time has passed. */
const step = <T,>(t: number, keys: [number, T][]): T => {
  let v = keys[0][1];
  for (const [k, x] of keys) if (t >= k) v = x;
  return v;
};

/* ---------- scene boundaries, all from the narration ---------- */
const S = {
  check: s('check1') - 0.15,
  r1: s('r1') - 0.15,
  r2: s('r2') - 0.15,
  r3: s('r3a') - 0.15,
  r3b: s('r3b') - 0.1,
  r4: s('r4a') - 0.15,
  r4b: s('r4b') - 0.1,
  r5: s('r5') - 0.15,
  close: s('close') - 0.15,
  end: END,
};

/* ---------- background, header, score ---------- */

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

const Header: React.FC<{o: number}> = ({o}) => (
  <div style={{position: 'absolute', top: 92, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 22, opacity: o}}>
    <div style={{width: 90, height: 3, background: P.teal, opacity: 0.6, borderRadius: 2}} />
    <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 30, letterSpacing: 5, color: P.teal}}>THE MANNERS OF CONVERSATION</div>
    <div style={{width: 90, height: 3, background: P.teal, opacity: 0.6, borderRadius: 2}} />
  </div>
);

const RULE_STARTS = () => [s('r1'), s('r2'), s('r3a'), s('r4a'), s('r5')];

const Score: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const o = win(t, w('check2', 'how'), S.end, 0.4, 0.4);
  if (o <= 0) return null;
  const starts = RULE_STARTS();
  return (
    <div style={{position: 'absolute', top: 150, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, opacity: o}}>
      <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 28, letterSpacing: 3, color: P.inkSoft, marginRight: 10, paddingTop: 4}}>HOW MANY DO YOU PASS?</div>
      {starts.map((st, i) => {
        const k = sp(frame, st, {damping: 11, stiffness: 180}, MFPS);
        const on = k > 0.5;
        return (
          <div
            key={i}
            style={{
              width: 46,
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
            {i + 1}
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
        return (
          <div key={g} style={{position: 'absolute', top: 262, left: 84, right: 84, opacity: 1 - out, transform: `translateY(${-out * 24}px)`}}>
            {lines.map((l) => (
              <div key={l.key} style={{fontFamily: FONT, fontWeight: 800, fontSize: 82, lineHeight: 1.08, color: P.ink, marginBottom: 14, letterSpacing: -0.5}}>
                {l.words.map((wd, i) => {
                  const k = sp(frame, wd.s - 0.06, {damping: 15, stiffness: 210, mass: 0.6}, MFPS);
                  const col = colourOf(wd.c);
                  const u = prog(t, wd.s + 0.05, wd.s + 0.45, easeOut);
                  return (
                    <span key={i} style={{display: 'inline-block', marginRight: 20, opacity: Math.min(1, k * 1.5), transform: `translateY(${(1 - k) * 36}px)`, position: 'relative', color: col}}>
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

const CHIPS: {text: string; a: () => number; b: () => number; dark?: boolean}[] = [
  {text: 'TAKE TURNS', a: () => e('r1') - 0.1, b: () => S.r2},
  {text: 'LET THEM ANSWER', a: () => e('r2') - 0.4, b: () => S.r3},
  {text: 'LET THEM FINISH', a: () => w('r3b', 'cut'), b: () => s('r3c')},
  {text: 'HUMBLE, NOT A KNOW-IT-ALL', a: () => e('r3c') - 0.2, b: () => S.r4},
  {text: 'RESPECT BEFORE VICTORY', a: () => w('r4c', 'flex'), b: () => S.r5},
  {text: 'LISTEN… THEN SPEAK', a: () => w('close', 'then'), b: () => S.end, dark: true},
];

const Chips: React.FC<{t: number; frame: number}> = ({t, frame}) => (
  <>
    {CHIPS.map((c) => {
      const a = c.a();
      const b = c.b();
      if (t < a - 0.05 || t > b + 0.3) return null;
      const k = sp(frame, a, {damping: 12, stiffness: 200}, MFPS);
      const out = prog(t, b - 0.2, b, easeInOut);
      return (
        <div key={c.text} style={{position: 'absolute', top: 1548, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: Math.min(1, k * 1.5) * (1 - out)}}>
          <div
            style={{
              fontFamily: FONT,
              fontWeight: 800,
              fontSize: c.dark ? 50 : 44,
              letterSpacing: 2,
              color: c.dark ? P.white : P.teal,
              background: c.dark ? P.ink : P.white,
              border: `4px solid ${c.dark ? P.ink : P.teal}`,
              borderRadius: 60,
              padding: c.dark ? '10px 44px 4px' : '8px 34px 2px',
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

/* ---------- the stage ---------- */

const Stage: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const pop = (at: number, cfg = {damping: 12, stiffness: 190}) => sp(frame, at, cfg, MFPS);
  const out = (b: number, d = 0.2) => 1 - prog(t, b - d, b, easeInOut);
  const live = (a: number, b: number) => (t >= a && t < b ? 1 : 0);

  // --- characters' positions ---
  const ax = track(t, [[0, 330], [S.r2 - 0.2, 210], [S.r3 - 0.2, 330], [S.r4 - 0.2, 250], [S.r4b + 0.6, 400], [S.r5 - 0.2, 330]], 0.55);
  const bx = track(t, [[0, 730], [S.r2 - 0.2, 540], [S.r3 - 0.2, 730], [S.r4 - 0.2, 830], [S.r4b + 0.6, 660], [S.r5 - 0.2, 730]], 0.55);
  const cx = track(t, [[0, 1250], [S.r2 - 0.25, 860], [S.r3 - 0.25, 1250]], 0.55);
  const fade = 1 - prog(t, S.end - 0.4, S.end + 0.1, easeInOut);

  // --- moods and poses ---
  const r1Clash = w('r1', 'talk') + 0.9;
  const aMood = step<Face>(t, [
    [0, 'talk'], [S.check, 'smile'], [S.r1, 'talk'], [r1Clash, 'talk'], [r1Clash + 0.9, 'smile'],
    [S.r2, 'talk'], [w('r2', 'else') + 0.4, 'smile'],
    [S.r3, 'smile'], [w('r3b', 'cut') - 0.5, 'o'], [w('r3b', 'cut') + 0.2, 'smile'], [w('r3c', 'see'), 'grin'], [w('r3c', 'already') + 0.5, 'smile'],
    [S.r4, 'smile'], [w('r4a', 'win'), 'smug'], [w('r4a', 'gentle'), 'smile'],
    [S.r5, 'smile'], [S.close, 'smile'], [w('close', 'then'), 'talk'],
  ]);
  const bMood = step<Face>(t, [
    [0, 'flat'], [w('hook2', 'talk') - 0.1, 'o'], [S.check, 'smile'], [S.r1, 'talk'], [r1Clash, 'smile'], [r1Clash + 0.9, 'talk'],
    [S.r2, 'flat'], [w('r2', 'else'), 'talk'], [w('r2', 'dont') + 0.2, 'sad'], [e('r2') - 0.4, 'smile'],
    [S.r3, 'talk'], [w('r3b', 'cut') - 0.5, 'o'], [w('r3b', 'cut') + 0.2, 'talk'],
    [S.r4, 'flat'], [w('r4a', 'win'), 'sad'], [w('r4b', 'graceful'), 'smile'],
    [S.r5, 'smile'], [w('close', 'then'), 'smile'],
  ]);
  const cMood = step<Face>(t, [[0, 'flat'], [w('r2', 'else') + 0.3, 'o'], [e('r2') - 0.4, 'talk']]);
  const aBrows = t >= S.r1 && t < r1Clash ? 'angry' : null;
  const bBrows = (t >= S.r1 && t < r1Clash ? 'angry' : t >= w('r4a', 'win') && t < w('r4b', 'graceful') ? 'worried' : t < S.check && t > w('hook2', 'wait') ? 'worried' : null) as 'angry' | 'worried' | null;
  const aArmR = track(t, [[0, 40], [S.check, 12], [S.r1, 55], [r1Clash, 30], [S.r2, 75], [w('r2', 'else') + 0.4, 18], [S.r3, 12], [w('r3b', 'cut') - 0.5, 150], [w('r3b', 'cut') + 0.2, 12], [S.r4b, 12], [S.r4b + 0.5, 42], [S.r5, 12]], 0.3);
  const bArmL = track(t, [[0, 12], [S.r1, 55], [r1Clash, 12], [S.r2, 12], [w('r2', 'else'), 140], [w('r2', 'dont') + 0.2, 10], [S.r3, 40], [S.r4, 10], [S.r4b + 0.5, 42], [S.r5, 12]], 0.3);
  const bLean = track(t, [[0, 0], [w('hook2', 'talk') - 0.2, -6], [S.check, 0], [w('r2', 'else'), 5], [w('r2', 'dont') + 0.2, 0]], 0.3);
  const bLook = step(t, [[0, 0.6], [w('hook1', 'listen'), 1], [S.check, 0], [S.r1, -1], [S.r2, 1], [w('r2', 'dont') + 0.2, 1], [S.r3, -1], [S.r5, 0], [S.close, -1]]);
  const aLook = step(t, [[0, 1], [S.check, 0], [S.r1, 1], [S.r5, 0], [S.close, 1]]);

  // --- props ---
  const hook = out(S.check);
  const r1o = win(t, S.r1, S.r2);
  const r2o = win(t, S.r2, S.r3);
  const r3o = win(t, S.r3, S.r4);
  const r4o = win(t, S.r4, S.r5);
  const r5o = win(t, S.r5, S.close);
  const clo = win(t, S.close, S.end, 0.3, 0.4);

  const headY = GROUND - 470; // just above the heads
  return (
    <svg width={1080} height={960} viewBox="0 0 1080 960" style={{position: 'absolute', top: STAGE_TOP, left: 0, overflow: 'visible'}}>
      <g opacity={fade} transform={`translate(540,${GROUND}) scale(1.3) translate(-540,${-GROUND})`}>
        <line x1={110} y1={GROUND} x2={970} y2={GROUND} stroke={P.line} strokeWidth={5} strokeLinecap="round" />
        <Sprout x={130} y={GROUND} />
        <Sprout x={950} y={GROUND} flip />

        {/* HOOK: A shares, B is only waiting for his turn */}
        {hook > 0 && (
          <g opacity={hook}>
            <Bubble x={ax - 10} y={headY - 60} w={200} h={120} tx={ax + 10} ty={headY + 20} k={1}>
              <Wave frame={frame} color={P.teal} live={1} />
            </Bubble>
            <Bubble x={bx + 30} y={headY - 80} w={150} h={110} tx={bx + 10} ty={headY + 20} k={pop(0.0)}>
              {t < w('hook2', 'wait') ? <Dots frame={frame} /> : <g transform={`scale(${pop(w('hook2', 'wait'))})`}><Hourglass t={t} /></g>}
            </Bubble>
            {t > w('hook2', 'turn') && (
              <g transform={`translate(${bx + 120},${headY - 190}) scale(${pop(w('hook2', 'turn'))})`}>
                <rect x={-96} y={-30} width={192} height={60} rx={30} fill={P.red} />
                <SvgText x={0} y={3} size={32} color={P.white}>MY TURN?</SvgText>
              </g>
            )}
          </g>
        )}

        {/* CHECK: the classic ring */}
        {(() => {
          const o = win(t, S.check, S.r1, 0.3, 0.3);
          if (o <= 0) return null;
          const draw = prog(t, S.check, S.check + 0.9, easeOut);
          const old = pop(w('check1', '1200'));
          return (
            <g opacity={o} transform={`translate(540,${headY - 40}) scale(0.7)`}>
              <circle r={150} fill="none" stroke={P.gold} strokeWidth={6} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} transform="rotate(-90)" />
              <circle r={172} fill="none" stroke={P.teal} strokeWidth={3} strokeDasharray="2 14" strokeLinecap="round" opacity={draw} transform={`rotate(${t * 8})`} />
              <g transform={`scale(${old})`}>
                <SvgText x={0} y={-18} size={96} color={P.gold}>1,200</SvgText>
                <SvgText x={0} y={56} size={34} color={P.teal} weight={700}>YEARS OLD</SvgText>
              </g>
              {[0, 1, 2, 3].map((i) => {
                const a = (i / 4) * Math.PI * 2 + 0.6;
                return <SvgText key={i} x={Math.cos(a) * 172} y={Math.sin(a) * 172} size={30} color={P.gold}>✦</SvgText>;
              })}
            </g>
          );
        })()}

        {/* RULE 1: both talking at once, then taking turns */}
        {r1o > 0 && (
          <g opacity={r1o}>
            {t < r1Clash + 0.15 ? (
              <g opacity={1 - prog(t, r1Clash - 0.1, r1Clash + 0.15)}>
                <g transform={`rotate(-8, ${ax + 90}, ${headY - 60})`}>
                  <Bubble x={ax + 90} y={headY - 60} w={190} h={120} tx={ax + 20} ty={headY + 20} k={pop(S.r1)}>
                    <Wave frame={frame} color={P.red} seed={2} />
                  </Bubble>
                </g>
                <g transform={`rotate(8, ${bx - 90}, ${headY - 80})`}>
                  <Bubble x={bx - 90} y={headY - 80} w={190} h={120} tx={bx - 20} ty={headY + 20} k={pop(S.r1 + 0.15)}>
                    <Wave frame={frame + 7} color={P.red} seed={5} />
                  </Bubble>
                </g>
                {[0, 1, 2].map((i) => (
                  <line key={i} x1={540 + (i - 1) * 40} y1={headY - 190} x2={540 + (i - 1) * 60} y2={headY - 240 - (i === 1 ? 20 : 0)} stroke={P.red} strokeWidth={6} strokeLinecap="round" opacity={0.5 + 0.5 * Math.sin(frame * 0.8 + i)} />
                ))}
              </g>
            ) : (
              <g>
                {(() => {
                  const k = prog(t, r1Clash, r1Clash + 0.35, easeOut);
                  const swap = t > r1Clash + 0.9;
                  return (
                    <g opacity={k}>
                      <Bubble x={ax} y={headY - 70} w={180} h={110} tx={ax} ty={headY + 20} k={swap ? 0.75 : 1}>
                        {swap ? <Dots frame={frame} /> : <Wave frame={frame} color={P.teal} live={1} />}
                      </Bubble>
                      <Bubble x={bx} y={headY - 70} w={180} h={110} tx={bx} ty={headY + 20} k={swap ? 1 : 0.75}>
                        {swap ? <Wave frame={frame} color={P.blue} live={1} seed={3} /> : <Dots frame={frame} />}
                      </Bubble>
                      <g transform={`translate(540,${headY - 70})`} stroke={P.gold} strokeWidth={6} strokeLinecap="round" fill="none">
                        <path d="M-40,-14 L40,-14 M26,-28 L40,-14 L26,0" />
                        <path d="M40,14 L-40,14 M-26,0 L-40,14 L-26,28" />
                      </g>
                    </g>
                  );
                })()}
              </g>
            )}
          </g>
        )}

        {/* RULE 2: the question was for someone else */}
        {r2o > 0 && (
          <g opacity={r2o}>
            <Bubble x={ax + 40} y={headY - 90} w={120} h={110} tx={ax + 20} ty={headY + 10} k={pop(S.r2 + 0.1)}>
              <SvgText x={0} y={4} size={78} color={P.gold}>?</SvgText>
            </Bubble>
            {/* the question's path, arcing over B to C */}
            <path
              d={`M${ax + 100},${headY - 120} Q540,${headY - 330} ${cx - 40},${headY - 120}`}
              fill="none"
              stroke={P.gold}
              strokeWidth={5}
              strokeDasharray="4 14"
              strokeLinecap="round"
              opacity={prog(t, S.r2 + 0.2, S.r2 + 0.6)}
            />
            <circle cx={cx - 40} cy={headY - 120} r={10} fill={P.gold} opacity={prog(t, S.r2 + 0.5, S.r2 + 0.7)} />
            {/* B jumps in */}
            <Bubble x={bx + 10} y={headY - 80} w={110} h={110} tx={bx} ty={headY + 20} k={t > w('r2', 'else') ? pop(w('r2', 'else')) * out(e('r2') - 0.3, 0.3) : 0}>
              <SvgText x={0} y={4} size={74} color={P.red}>!</SvgText>
              <g transform="translate(0,2)">
                <Cross size={42} k={prog(t, w('r2', 'dont'), w('r2', 'dont') + 0.35)} />
              </g>
            </Bubble>
            <circle cx={bx} cy={GROUND - 260} r={200} fill="none" stroke={P.gold} strokeWidth={6} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - prog(t, w('r2', 'dont'), w('r2', 'dont') + 0.5, easeOut)} opacity={out(e('r2') - 0.3, 0.3)} />
            {/* C answers */}
            <Bubble x={cx - 10} y={headY - 80} w={170} h={110} tx={cx} ty={headY + 20} k={t > e('r2') - 0.4 ? pop(e('r2') - 0.4) : 0}>
              <Wave frame={frame} color={P.mustard} seed={1} />
            </Bubble>
          </g>
        )}

        {/* RULE 3: the story, the interruption, the know-it-all */}
        {r3o > 0 && (
          <g opacity={r3o}>
            <Bubble x={bx - 20} y={headY - 90} w={210} h={140} tx={bx} ty={headY + 20} k={pop(S.r3 + 0.1)}>
              <g transform={`translate(0,${Math.sin(frame * 0.2) * 3})`}>
                <Book />
              </g>
            </Bubble>
            <g transform={`translate(${ax - 120},${headY + 60})`} opacity={win(t, S.r3 + 0.3, w('r3b', 'cut') - 0.5, 0.3, 0.2) + win(t, w('r3c', 'already') + 0.6, S.r4, 0.3, 0.2)}>
              <Ear size={0.9} color={P.teal} />
            </g>
            {/* cut in */}
            {t > w('r3b', 'cut') - 0.55 && t < s('r3c') + 0.2 && (
              <g opacity={out(s('r3c') + 0.2)}>
                <g transform={`translate(540,${headY - 20}) scale(${pop(w('r3b', 'cut'))})`}>
                  <Stop size={1.1} />
                </g>
              </g>
            )}
            {/* know-it-all */}
            {t > w('r3c', 'see') - 0.1 && (
              <g opacity={out(e('r3c') + 0.15, 0.25)}>
                <g transform={`translate(${ax + 190},${headY - 110}) scale(${pop(w('r3c', 'see')) * 0.8})`}>
                  <Bulb glow={0.6 + 0.4 * Math.sin(frame * 0.4)} />
                </g>
                <Bubble x={ax + 30} y={headY - 60} w={260} h={100} tx={ax + 10} ty={headY + 20} k={pop(w('r3c', 'see') + 0.1)}>
                  <SvgText x={0} y={4} size={40} color={P.red}>I KNOW THIS!</SvgText>
                  <Cross size={44} k={prog(t, w('r3c', 'already'), w('r3c', 'already') + 0.35)} />
                </Bubble>
              </g>
            )}
            {t > e('r3c') - 0.1 && (
              <g transform={`translate(${ax + 10},${headY - 150}) scale(${pop(e('r3c'))})`}>
                <SvgText x={0} y={0} size={90} color={P.gold}>humility</SvgText>
                <path d="M-150,48 Q-20,30 150,44" fill="none" stroke={P.gold} strokeWidth={6} strokeLinecap="round" />
              </g>
            )}
          </g>
        )}

        {/* RULE 4: you won; let them keep their dignity */}
        {r4o > 0 && (
          <g opacity={r4o}>
            {(() => {
              const o = out(S.r4b + 0.2, 0.35);
              const tilt = -14 * prog(t, w('r4a', 'win'), w('r4a', 'win') + 0.6, easeOut);
              return (
                <g opacity={o} transform={`translate(540,${headY - 120})`}>
                  <Scales
                    tilt={tilt}
                    leftItem={<g transform={`scale(${pop(w('r4a', 'win'))})`}><Check k={1} r={26} /></g>}
                    rightItem={<g transform="translate(0,6)"><circle r={18} fill={P.blue} stroke={P.ink} strokeWidth={4} /></g>}
                  />
                </g>
              );
            })()}
            {t > w('r4a', 'gentle') && t < S.r4b + 0.3 && (
              <g transform={`translate(${ax + 100},${headY - 40}) scale(${pop(w('r4a', 'gentle')) * out(S.r4b + 0.3)})`}>
                <Heart size={1.1} />
              </g>
            )}
            {t > S.r4b && (
              <g>
                {/* a graceful way out: an open doorway of light around B */}
                <path
                  d={`M${bx - 110},${GROUND} L${bx - 110},${GROUND - 380} A110,110 0 0 1 ${bx + 110},${GROUND - 380} L${bx + 110},${GROUND}`}
                  fill={P.goldSoft}
                  fillOpacity={0.55 * prog(t, w('r4b', 'graceful'), w('r4b', 'graceful') + 0.5)}
                  stroke={P.gold}
                  strokeWidth={5}
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={1 - prog(t, w('r4b', 'graceful'), w('r4b', 'graceful') + 0.7, easeOut)}
                />
                <g transform={`translate(${(ax + bx) / 2},${headY - 60}) scale(${pop(w('r4b', 'way'))})`}>
                  <Heart size={1.2} />
                </g>
              </g>
            )}
            {t > w('r4c', 'flex') - 0.1 && (
              <g transform={`translate(${ax - 10},${headY - 160}) scale(${pop(w('r4c', 'flex') - 0.1)})`}>
                <Trophy size={1.4} />
                <Cross size={48} k={prog(t, w('r4c', 'flex') + 0.15, w('r4c', 'flex') + 0.5)} />
              </g>
            )}
          </g>
        )}

        {/* RULE 5: listening is a skill, like speaking */}
        {r5o > 0 && (
          <g opacity={r5o} transform={`translate(540,${headY - 175})`}>
            <g transform={`translate(${lerp(0, 130, prog(t, w('r5', 'speak') - 0.3, w('r5', 'speak') + 0.2))},0) scale(${pop(S.r5 + 0.25)})`}>
              <circle r={92} fill={P.tealSoft} />
              <Ear size={1.25} />
              <g transform="translate(-30,0)">
                <Waves k={prog(t, w('r5', 'listen'), w('r5', 'listen') + 0.8)} side={-1} />
              </g>
            </g>
            {t > w('r5', 'speak') - 0.3 && (
              <g>
                <g transform={`translate(-170,0) scale(${pop(w('r5', 'speak') - 0.2)})`}>
                  <Bubble x={0} y={0} w={190} h={130} tx={30} ty={90} k={1}>
                    <Wave frame={frame} color={P.gold} />
                  </Bubble>
                </g>
                <g transform={`scale(${pop(w('r5', 'speak'))})`}>
                  <SvgText x={-20} y={4} size={90} color={P.teal}>=</SvgText>
                </g>
              </g>
            )}
            <g transform="translate(0,118)" opacity={prog(t, w('r5', 'speak'), w('r5', 'speak') + 0.4)}>
              <line x1={-260} y1={0} x2={260} y2={0} stroke={P.ink} strokeWidth={6} strokeLinecap="round" />
              <path d="M-26,40 L0,4 L26,40 Z" fill={P.gold} stroke={P.ink} strokeWidth={5} strokeLinejoin="round" />
            </g>
          </g>
        )}

        {/* CLOSE: listen first, then speak */}
        {clo > 0 && (
          <g opacity={clo}>
            <g transform={`translate(${ax - 110},${headY + 50}) scale(${pop(S.close + 0.1)})`}>
              <Ear size={0.9} color={P.teal} />
            </g>
            <Bubble x={bx} y={headY - 70} w={180} h={110} tx={bx} ty={headY + 20} k={t < w('close', 'then') ? pop(S.close + 0.1) : 0.75}>
              {t < w('close', 'then') ? <Wave frame={frame} color={P.blue} seed={4} /> : <Dots frame={frame} />}
            </Bubble>
            {t > w('close', 'then') && (
              <Bubble x={ax} y={headY - 70} w={180} h={110} tx={ax} ty={headY + 20} k={pop(w('close', 'then'))}>
                <Wave frame={frame} color={P.teal} seed={6} />
              </Bubble>
            )}
          </g>
        )}

        {/* the people */}
        <Figure x={cx} y={GROUND} body={P.mustard} hat="none" mood={cMood} frame={frame} armL={step(t, [[0, 12], [e('r2') - 0.4, 40]])} look={-1} facing={-1} />
        <Figure x={ax} y={GROUND} body={P.green} hat="kufi" mood={aMood} frame={frame} armR={aArmR} armL={12} look={aLook} brows={aBrows} />
        <Figure x={bx} y={GROUND} body={P.blue} hat="cap" mood={bMood} frame={frame + 11} armL={bArmL} look={bLook} facing={-1} lean={bLean} brows={bBrows} />
      </g>
    </svg>
  );
};

/* ---------- end card ---------- */

const EndCard: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  if (t < S.end - 0.3) return null;
  const k = (d: number) => sp(frame, S.end + d, {damping: 14, stiffness: 160}, MFPS);
  const rise = (d: number) => ({opacity: Math.min(1, k(d) * 1.4), transform: `translateY(${(1 - k(d)) * 40}px)`});
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 0, paddingBottom: 120}}>
      <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 76, lineHeight: 1.08, color: P.ink, textAlign: 'center', padding: '0 90px', ...rise(0)}}>
        Send this to someone who <span style={{color: P.red}}>finishes your sentences.</span>
      </div>
      <div style={{height: 70}} />
      <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 30, letterSpacing: 5, color: P.teal, ...rise(0.35)}}>FOLLOW</div>
      <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 64, color: P.ink, marginTop: 4, ...rise(0.45)}}>@{HANDLE}</div>
      <div style={{marginTop: 34, ...rise(0.6)}}>
        <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 34, color: P.white, background: P.teal, borderRadius: 50, padding: '10px 60px 4px'}}>Follow</div>
      </div>
      <div style={{position: 'absolute', bottom: 360, fontFamily: FONT, fontWeight: 600, fontSize: 34, color: P.inkSoft, textAlign: 'center', ...rise(0.8)}}>
        From <i>al-Adab al-Kabir</i>, Ibn al-Muqaffa‘ (d. c. 759 CE)
      </div>
    </AbsoluteFill>
  );
};

export const MannersShort: React.FC<{audio?: boolean}> = ({audio = true}) => {
  useMannersFonts();
  const frame = useCurrentFrame();
  const t = frame / MFPS;
  return (
    <AbsoluteFill>
      <Paper />
      <Header o={1} />
      <Headline t={t} frame={frame} />
      <Stage t={t} frame={frame} />
      <Chips t={t} frame={frame} />
      <Score t={t} frame={frame} />
      <EndCard t={t} frame={frame} />
      {audio && <Audio src={staticFile('manners/mix.wav')} />}
    </AbsoluteFill>
  );
};



