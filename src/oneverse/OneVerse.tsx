import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import timeline from './timeline.json';
import {clamp01, easeIn, easeInOut, easeOut, lerp, prog, rand} from '../lib';
import {Grain, Mask} from '../components/primitives';
import {HANDLE, V, VF} from './theme';
import {Drop, Flower, Grass, Ground, Palm, Rain, Scrub, Sky, Tree, Vine, Wheat, circlePts, heartPts, mix, rectPts, toPath} from './art';

const TL = timeline;
export const ONEVERSE_FPS = TL.fps;
export const ONEVERSE_FRAMES = Math.round(TL.duration * TL.fps);

type Line = {key: string; text: string; s: number; e: number; words: {t: string; s: number}[]};
const LINES = TL.lines as Line[];
const LN = Object.fromEntries(LINES.map((l) => [l.key, l])) as Record<string, Line>;
const S = (k: string) => LN[k].s;
const E = (k: string) => LN[k].e;
/** start of the n-th word of a line */
const Wd = (k: string, n: number) => LN[k].words[Math.min(n, LN[k].words.length - 1)].s;

const REC = TL.rec;
const RW = REC.words;
const PH = Object.fromEntries(REC.phrases.map((p) => [p.key, p])) as Record<string, (typeof REC.phrases)[number]>;
const FOLLOW = TL.voEnd + 0.9;

/* ---------- geometry ---------- */

const TOP = 1170; // ground surface in rect mode
const PH_ = 330; // plot height
const HEART = {y: 1268, w: 400, h: 380};
const LX = 305;
const RX = 775;

/** 0 = plots, 1 = hearts */
const heartAmt = (t: number) => {
  const toPlots = prog(t, REC.s - 0.5, REC.s + 1.3, easeInOut);
  const toHearts = prog(t, S('people') - 0.1, E('adam') + 0.2, easeInOut);
  return t < S('hasan') ? 1 - toPlots : toHearts;
};

/** clay ball phase: visible between the end of the recitation and the split into plots */
const clay = (t: number) => {
  const inK = prog(t, REC.e + 0.1, REC.e + 0.5, easeOut);
  const ball = prog(t, REC.e + 0.2, S('parable') + 0.6, easeInOut);
  const flat = prog(t, S('spread'), S('spread') + 0.9, easeInOut);
  const split = prog(t, S('plots') + 0.1, S('plots') + 0.9, easeInOut);
  return {on: inK * (1 - split) * (t < S('people') ? 1 : 0), ball: ball * (1 - flat), split};
};

const plotOpacity = (t: number) => {
  if (t < REC.e) return 1;
  const out = prog(t, REC.e, REC.e + 0.35, easeIn);
  const back = prog(t, S('plots') + 0.1, S('plots') + 0.5, easeOut);
  return Math.max(1 - out, back);
};

/* ---------- small UI ---------- */

const Tag: React.FC<{x: number; y: number; k: number; children: React.ReactNode; color?: string; size?: number}> = ({x, y, k, children, color = V.gold, size = 24}) =>
  k <= 0 ? null : (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, ${(1 - k) * 12}px)`,
        opacity: k,
        fontFamily: VF.mono,
        fontSize: size,
        letterSpacing: '0.18em',
        color,
        whiteSpace: 'nowrap',
        padding: '8px 14px',
        background: 'rgba(7,10,18,0.72)',
        borderRadius: 10,
        border: `1px solid ${color === V.gold ? 'rgba(233,194,122,0.4)' : 'rgba(245,239,226,0.25)'}`,
      }}
    >
      {children}
    </div>
  );

const Handle: React.FC<{t: number}> = ({t}) => {
  const o = prog(t, 0.3, 0.9) * (1 - prog(t, FOLLOW - 0.3, FOLLOW));
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 118, textAlign: 'center', fontFamily: VF.mono, fontSize: 26, letterSpacing: '0.06em', color: V.creamDim, opacity: o}}>
      @{HANDLE}
    </div>
  );
};

/* ---------- captions ---------- */

const GROUPS: string[][] = [
  ['h_cries', 'h_move'],
  ['h_where'],
  ['h_listen'],
  ['parable'],
  ['clay', 'hand'],
  ['spread', 'plots'],
  ['rain'],
  ['life', 'dead'],
  ['salt', 'waste'],
  ['same'],
  ['salty'],
  ['people', 'adam'],
  ['remind'],
  ['soft', 'humble'],
  ['hard', 'play', 'away'],
  ['byallah', 'nosits'],
  ['more', 'less'],
  ['heal'],
  ['loss'],
  ['same2'],
  ['sohow', 'ground'],
];
const ACCENT: Record<string, string> = {
  parable: 'this is a parable Allah gave, for the *hearts* of the children of Adam.',
  clay: 'The earth was *one clay,*',
  plots: 'into plots, *side by side.*',
  dead: 'Dead ground comes back to *life.*',
  salt: 'And that one brings out *salt…*',
  same: '*Same* water.',
  salty: "If the water were salty, you'd say: *the water did it.*",
  adam: 'All of them from *Adam.*',
  remind: 'Then a *reminder* comes down from the sky.',
  soft: 'Some hearts *soften.*',
  hard: 'Other hearts *harden.*',
  nosits: 'no one sits with the Quran and gets up *the same.*',
  more: 'He leaves with *more…*',
  less: 'or with *less.*',
  heal: 'We send down in the Quran *healing and mercy* for the believers.',
  loss: 'And for the wrongdoers, it only adds to their *loss.*',
  same2: 'Same verse. *Same rain.*',
  ground: 'which ground *is it?*',
  h_listen: '*Listen.*',
};

const capTop = (g: string[]) => (g[0] === 'heal' || g[0] === 'loss' ? 640 : g[0].startsWith('h_') ? 480 : 380);

const Caption: React.FC<{t: number; g: string[]; next: number}> = ({t, g, next}) => {
  const s0 = S(g[0]);
  const end = g[0] === 'h_listen' ? REC.s - 0.45 : Math.min(next - 0.4, E(g[g.length - 1]) + 2.6);
  if (t < s0 - 0.2 || t > end + 0.4) return null;
  const out = prog(t, end - 0.05, end + 0.3, easeIn);
  const size = g[0] === 'heal' || g[0] === 'loss' ? 70 : g[0] === 'parable' || g.length > 2 ? 86 : 96;
  return (
    <div style={{position: 'absolute', left: 90, right: 90, top: capTop(g), textAlign: 'center', opacity: 1 - out, transform: `translateY(${-out * 20}px)`}}>
      {g.map((k) => {
        const l = LN[k];
        const toks = (ACCENT[k] ?? l.text).split(' ');
        let acc = false;
        return (
          <div key={k} style={{fontFamily: VF.serif, fontSize: size, lineHeight: 1.08, color: V.cream, letterSpacing: '-0.01em'}}>
            {toks.map((tok, i) => {
              const startAcc = tok.startsWith('*');
              if (startAcc) acc = true;
              const isAcc = acc;
              if (tok.endsWith('*') || tok.endsWith('*,')) acc = false;
              const clean = tok.replace(/\*/g, '');
              const ws = l.words[Math.min(i, l.words.length - 1)].s;
              const k2 = prog(t, ws - 0.08, ws + 0.45, easeOut);
              return (
                <React.Fragment key={i}>
                  <Mask k={k2} tilt={3}>
                    <span style={{color: isAcc ? V.gold : V.cream, fontStyle: isAcc ? 'italic' : 'normal'}}>{clean}</span>
                  </Mask>{' '}
                </React.Fragment>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

const Captions: React.FC<{t: number}> = ({t}) => (
  <>
    {GROUPS.map((g, i) => (
      <Caption key={g[0]} t={t} g={g} next={i + 1 < GROUPS.length ? S(GROUPS[i + 1][0]) : FOLLOW} />
    ))}
  </>
);

/** Hook header and the small gold labels ("Al-Hasan al-Basri said"). */
const Labels: React.FC<{t: number}> = ({t}) => {
  const one = prog(t, -0.6, 0, easeOut) * (1 - prog(t, S('h_listen') + 0.2, REC.s - 0.1, easeIn));
  const lab = (k0: string, k1: number, text: string) => {
    const k = prog(t, S(k0) - 0.1, S(k0) + 0.4, easeOut) * (1 - prog(t, k1 - 0.3, k1, easeIn));
    return k <= 0 ? null : (
      <div style={{position: 'absolute', left: 0, right: 0, top: 268, textAlign: 'center', fontFamily: VF.mono, fontSize: 30, letterSpacing: '0.2em', color: V.gold, opacity: k}}>
        {text}
      </div>
    );
  };
  return (
    <>
      {one > 0 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 290, textAlign: 'center', fontFamily: VF.serif, fontSize: 132, lineHeight: 1, color: V.cream, opacity: one}}>
          <Mask k={one}>
            One <span style={{fontStyle: 'italic', color: V.gold}}>verse.</span>
          </Mask>
        </div>
      )}
      {lab('hasan', S('clay'), 'AL-HASAN AL-BASRI SAID')}
      {lab('hsaid', S('more') + 0.1, 'AL-HASAN SAID')}
      {lab('says', E('loss') + 1.2, 'ALLAH SAYS · AL-ISRA 17:82')}
    </>
  );
};

/* ---------- recitation text ---------- */

const ArabicPhrase: React.FC<{t: number}> = ({t}) => {
  if (t < REC.s - 0.4 || t > REC.e + 0.8) return null;
  const head = prog(t, REC.s - 0.4, REC.s + 0.3, easeOut) * (1 - prog(t, REC.e + 0.3, REC.e + 0.8, easeIn));
  return (
    <>
      <div style={{position: 'absolute', left: 0, right: 0, top: 230, textAlign: 'center', opacity: head}}>
        <div style={{fontFamily: VF.mono, fontSize: 26, letterSpacing: '0.24em', color: V.gold}}>QUR'AN · AR-RA'D 13:4</div>
        <div style={{fontFamily: VF.mono, fontSize: 20, letterSpacing: '0.24em', color: V.creamDim, marginTop: 10}}>RECITATION</div>
      </div>
      {REC.phrases.map((p, pi) => {
        const nextS = pi + 1 < REC.phrases.length ? REC.phrases[pi + 1].s : REC.e + 0.6;
        if (t < p.s - 0.35 || t > nextS + 0.2) return null;
        const inK = prog(t, p.s - 0.35, p.s + 0.1, easeOut);
        const outK = prog(t, nextS - 0.2, nextS + 0.05, easeIn);
        const ws = RW.slice(p.i0, p.i1);
        const enK = prog(t, p.s + 0.1, p.s + 0.7, easeOut);
        return (
          <div key={p.key} style={{position: 'absolute', left: 70, right: 70, top: 330, opacity: inK * (1 - outK)}}>
            <div
              dir="rtl"
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '0 26px',
                fontFamily: VF.quran,
                fontSize: ws.length > 4 ? 84 : 96,
                lineHeight: 1.75,
              }}
            >
              {ws.map((w, i) => {
                const gi = p.i0 + i;
                const nx = gi + 1 < RW.length ? RW[gi + 1].s : REC.e;
                const active = t >= w.s - 0.05 && t < nx - 0.05;
                const said = t >= w.s - 0.05;
                const lit = prog(t, w.s - 0.1, w.s + 0.25, easeOut);
                return (
                  <span
                    key={i}
                    style={{
                      color: active ? V.gold : V.cream,
                      opacity: 0.22 + 0.78 * lit,
                      textShadow: active ? '0 0 26px rgba(233,194,122,0.45)' : 'none',
                      transition: 'none',
                    }}
                  >
                    {w.ar}
                    {said && null}
                  </span>
                );
              })}
            </div>
            <div style={{marginTop: 18, textAlign: 'center', fontFamily: VF.serif, fontSize: 52, lineHeight: 1.12, color: V.creamDim, opacity: enK, transform: `translateY(${(1 - enK) * 14}px)`}}>
              {p.en}
            </div>
          </div>
        );
      })}
    </>
  );
};

const Isra: React.FC<{t: number}> = ({t}) => {
  const k = prog(t, S('says') - 0.1, S('says') + 0.6, easeOut) * (1 - prog(t, E('loss') + 0.9, E('loss') + 1.3, easeIn));
  if (k <= 0) return null;
  const second = prog(t, S('loss') - 0.1, S('loss') + 0.4, easeOut);
  return (
    <div dir="rtl" style={{position: 'absolute', left: 70, right: 70, top: 330, textAlign: 'center', fontFamily: VF.quran, fontSize: 64, lineHeight: 1.75, opacity: k}}>
      <span style={{color: t < S('loss') ? V.gold : V.cream, opacity: t < S('loss') ? 1 : 0.55}}>وَنُنَزِّلُ مِنَ الْقُرْآنِ مَا هُوَ شِفَاءٌ وَرَحْمَةٌ لِّلْمُؤْمِنِينَ</span>{' '}
      <span style={{color: second > 0.5 ? V.gold : V.cream, opacity: 0.25 + 0.75 * second}}>وَلَا يَزِيدُ الظَّالِمِينَ إِلَّا خَسَارًا</span>
    </div>
  );
};

/* ---------- the world ---------- */

const World: React.FC<{t: number}> = ({t}) => {
  const m = heartAmt(t);
  const pOp = plotOpacity(t);
  const c = clay(t);
  const narr = t > REC.e;

  // split: plots abut when they first come out of the slab
  const sp = narr ? c.split : 1;
  const lW = lerp(450, 430, sp);
  const lCx = lerp(315, LX, sp);
  const rCx = lerp(765, RX, sp);

  // end: hearts slide apart to make room for "yours"
  const apart = prog(t, S('same2') - 0.1, S('same2') + 1.4, easeInOut);
  const hl = lerp(300, 110, apart);
  const hr = lerp(780, 970, apart);

  // hook + verse lean of each heart
  const bow = prog(t, S('humble'), E('humble') + 0.3, easeInOut) * (1 - apart);
  const turn = prog(t, S('away') - 0.2, E('away') + 0.4, easeInOut) * (1 - apart);

  const lPts = mix(rectPts(lCx, TOP + PH_ / 2, lW, PH_, 0.12), heartPts(hl, HEART.y, HEART.w, HEART.h), m);
  const rPts = mix(rectPts(rCx, TOP + PH_ / 2, lW, PH_, 0.12), heartPts(hr, HEART.y, HEART.w, HEART.h), m);

  // ----- states -----
  const hook = t < REC.s;
  const recLife = prog(t, PH.vines.s, PH.vines.s + 1.5, easeOut);
  const narLife = prog(t, S('life'), E('dead'), easeOut);
  const lifeL = narr ? narLife : recLife;
  const lifeR = narr ? 0 : recLife;
  const saltR = narr ? prog(t, S('salt'), E('waste'), easeOut) : 0;

  const warmL = hook ? lerp(0.35, 1, prog(t, S('h_cries') + 0.3, S('h_cries') + 1.2, easeOut)) : 1;
  const stoneR = 1;

  // recitation growth
  const g = (from: number, dur = 1.6) => prog(t, from, from + dur, easeOut) * (1 - prog(t, REC.e - 0.3, REC.e + 0.3, easeIn)) * (t < S('hasan') + 2 ? 1 : 0);
  const vineK = g(PH.vines.s + 0.2, 2.2);
  const wheatK = g(RW[10].s, 1.4);
  const palmK = g(RW[11].s, 1.3);
  const fruitK = g(PH.water.s + 0.6, 1.4);
  const fruitGlow = prog(t, PH.fruit.s + 0.4, PH.fruit.s + 1.6, easeOut);
  const recRain = prog(t, PH.water.s - 0.1, PH.water.s + 0.6, easeOut) * (1 - prog(t, PH.fruit.s + 1.5, PH.fruit.s + 3, easeInOut));

  // narration growth
  const n = (from: number, dur = 1.4) => prog(t, from, from + dur, easeOut) * (1 - prog(t, S('people') - 0.1, S('people') + 0.6, easeIn));
  const flowersK = n(Wd('life', 4), 1.2);
  const treeK = n(Wd('life', 6), 1.4);
  const fruitN = n(Wd('life', 5) + 0.3, 1.2);
  const grassK = n(S('dead'), 1.4);
  const scrubK = n(S('waste') - 0.1, 1.0);
  const narRain = prog(t, S('rain') - 0.1, S('rain') + 0.5, easeOut) * (1 - prog(t, S('people'), S('people') + 0.8, easeInOut));
  const lightRain = prog(t, S('remind') + 0.2, S('remind') + 1, easeOut) * (1 - prog(t, S('hsaid') - 0.3, S('hsaid') + 0.4, easeInOut));
  const endRain = prog(t, S('same2') + 0.3, S('same2') + 1.2, easeOut) * (1 - prog(t, FOLLOW - 0.3, FOLLOW + 0.4, easeIn));

  // heart moods
  const softGlow = prog(t, S('soft'), S('soft') + 0.8, easeOut) * (1 - prog(t, S('hsaid'), S('hsaid') + 0.5));
  const healGlow = prog(t, S('heal') + 0.8, S('heal') + 1.6, easeOut) * (1 - prog(t, S('same2'), S('same2') + 0.6));
  const dimMid = prog(t, S('hsaid') - 0.2, S('hsaid') + 0.4) * (1 - prog(t, S('more') - 0.3, S('more') + 0.2));
  const lossDim = prog(t, Wd('loss', 7), Wd('loss', 9) + 0.4) * (1 - prog(t, S('same2'), S('same2') + 0.6));
  const crack = prog(t, S('hard'), E('away'), easeOut);
  const hookDrop = hook;

  // camera pull-back at the end
  const cam = prog(t, S('same2') - 0.1, S('same2') + 1.6, easeInOut);
  const scale = lerp(1, 0.6, cam);

  const lHeartGlow = Math.max(softGlow, healGlow, hook ? prog(t, S('h_cries') + 0.3, S('h_cries') + 1.0) * (1 - prog(t, REC.s - 0.6, REC.s)) : 0);

  // clay
  const clayPts = mix(rectPts(540, TOP + PH_ / 2, 900, PH_, 0.12), circlePts(540, 1270, 150), c.ball);
  const clayLight = prog(t, S('hand') - 0.2, S('hand') + 0.8, easeOut) * (1 - prog(t, S('spread') + 0.4, S('plots') + 0.6));

  return (
    <AbsoluteFill style={{transform: `scale(${scale})`, transformOrigin: `540px ${HEART.y}px`}}>
      {/* crowd of hearts revealed by the pull-back */}
      {cam > 0 && (
        <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
          {[-1, 0, 1].flatMap((row) =>
            [-3, -2, -1, 0, 1, 2, 3].map((col) => {
              const x = 540 + (col + (row ? 0.5 : 0)) * 430;
              const y = HEART.y + row * 400;
              if (row === 0 && Math.abs(col) <= 1) return null;
              const i = (row + 1) * 7 + col + 3;
              const warm = rand(i * 3.7) > 0.45;
              const o = clamp01(cam * 1.4 - rand(i) * 0.5);
              return <path key={i} d={toPath(heartPts(x, y, 400, 380))} fill={warm ? V.heartWarm : V.stone} opacity={o * 0.5} />;
            }),
          )}
        </svg>
      )}
      <Rain t={t} k={recRain} />
      <Rain t={t} k={narRain} />
      <Rain t={t} k={endRain} gold y0={-200} y1={1500} x0={-300} x1={1380} seed={9} />
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        {/* hook: one gold drop, splitting to both hearts */}
        {hookDrop && <HookDrop t={t} />}

        {/* clay */}
        {c.on > 0 && (
          <g opacity={c.on}>
            <circle cx={540} cy={1270} r={260} fill={V.gold} opacity={clayLight * 0.18} style={{filter: 'blur(40px)'}} />
            <Ground id="clay" pts={clayPts} top={TOP} life={0} salt={0} heart={0} />
          </g>
        )}

        {/* the two grounds / hearts */}
        <g opacity={pOp * (1 - dimMid * 0.55)} transform={`rotate(${-bow * 9} ${hl} ${HEART.y + 190})`}>
          <Ground id="L" pts={lPts} top={TOP} life={lifeL} salt={0} heart={m} warm={warmL} glow={lHeartGlow} />
          {m > 0.5 && <HeartVines t={t} cx={hl} k={prog(t, S('soft') + 0.2, E('humble'), easeOut) * (1 - prog(t, S('same2'), S('same2') + 0.8))} />}
        </g>
        <g opacity={pOp * (1 - dimMid * 0.55) * (1 - lossDim * 0.55)} transform={`rotate(${turn * 12} ${hr} ${HEART.y + 190}) translate(${turn * 24} 0)`}>
          <Ground id="R" pts={rPts} top={TOP} life={lifeR} salt={saltR} heart={m} stone={stoneR} />
          {m > 0.5 && <Cracks cx={hr} k={crack} />}
        </g>

        {/* recitation plants */}
        <Vine x={115} y={TOP} w={190} h={150} k={vineK} fruit={fruitK} fruitGlow={fruitGlow} />
        <Wheat x0={590} x1={790} y={TOP} k={wheatK} />
        {/* sinwan: three trunks from one root */}
        <Palm x={430} y={TOP} h={230} k={palmK} lean={-0.32} fruit={fruitK} fruitGlow={fruitGlow} sway={t} />
        <Palm x={430} y={TOP} h={250} k={palmK} lean={0.02} fruit={fruitK} fruitGlow={fruitGlow} sway={t + 1} />
        <Palm x={430} y={TOP} h={220} k={palmK} lean={0.34} fruit={fruitK} fruitGlow={fruitGlow} sway={t + 2} />
        {/* ghayr sinwan: one alone */}
        <Palm x={900} y={TOP} h={235} k={palmK} lean={0.05} fruit={fruitK * 0.7} sway={t + 3} />
        <Roots t={t} on={prog(t, PH.sinwan.s, PH.sinwan.s + 0.8, easeOut) * (1 - prog(t, PH.water.s + 1.5, PH.water.s + 2.2))} />

        {/* narration plants */}
        <Grass x0={100} x1={510} y={TOP} k={grassK} />
        {[140, 200, 255, 470].map((x, i) => (
          <Flower key={i} x={x} y={TOP} k={clamp01(flowersK * 1.3 - i * 0.1)} c={i % 2 ? V.cream : V.bloom} s={1.1} />
        ))}
        <Tree x={370} y={TOP} k={treeK} fruit={fruitN} />
        {[620, 720, 830, 935].map((x, i) => (
          <Scrub key={i} x={x} y={TOP} k={clamp01(scrubK * 1.3 - i * 0.12)} s={1 + (i % 2) * 0.3} />
        ))}

        {/* gauges: more / less */}
        <Gauges t={t} hl={hl} hr={hr} />
      </svg>
      <SameWater t={t} />
      <WaterCheck t={t} />
      <Yours t={t} />
      <SinwanTags t={t} />
    </AbsoluteFill>
  );
};

const HookDrop: React.FC<{t: number}> = ({t}) => {
  const a = S('h_one') - 0.1;
  const fall = prog(t, a, S('h_cries') + 0.05, easeIn);
  const split = prog(t, S('h_cries') + 0.05, S('h_cries') + 0.6, easeOut);
  const bounce = prog(t, S('h_move') + 0.1, S('h_move') + 1.0, easeOut);
  const y0 = lerp(560, 930, fall);
  const out: React.ReactNode[] = [];
  if (split <= 0) {
    out.push(<Drop key="d" x={540} y={y0} s={0.9} fill={V.gold} />);
  } else {
    // left: sinks into the heart
    const lx = lerp(540, 300, split);
    const ly = lerp(930, 1110, split);
    const sink = prog(t, S('h_cries') + 0.55, S('h_cries') + 0.9);
    out.push(<Drop key="l" x={lx} y={ly + sink * 30} s={0.75 * (1 - sink)} fill={V.gold} />);
    // right: reaches the heart, then slides off
    const rx = lerp(540, 780, split) + bounce * 190;
    const ry = lerp(930, 1100, split) - Math.sin(bounce * Math.PI) * 90 + bounce * 260;
    out.push(<Drop key="r" x={rx} y={ry} s={0.75} fill={V.gold} opacity={1 - prog(t, S('h_move') + 0.6, S('h_move') + 1.1)} />);
  }
  return <g>{out}</g>;
};

const HeartVines: React.FC<{t: number; cx: number; k: number}> = ({cx, k}) => {
  if (k <= 0) return null;
  const paths = [
    `M${cx - 120},${HEART.y + 60} C${cx - 80},${HEART.y - 10} ${cx - 40},${HEART.y + 40} ${cx - 10},${HEART.y - 40}`,
    `M${cx + 10},${HEART.y + 150} C${cx + 40},${HEART.y + 80} ${cx + 90},${HEART.y + 70} ${cx + 110},${HEART.y - 20}`,
    `M${cx - 50},${HEART.y + 140} C${cx - 30},${HEART.y + 90} ${cx + 10},${HEART.y + 60} ${cx + 30},${HEART.y + 10}`,
  ];
  return (
    <g>
      {paths.map((d, i) => (
        <path key={i} d={d} stroke={V.green} strokeWidth={5} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - clamp01(k * 1.3 - i * 0.15)} />
      ))}
      {[
        [-10, -40],
        [110, -20],
        [30, 10],
        [-70, 20],
        [70, 76],
      ].map(([dx, dy], i) => {
        const s = clamp01(k * 1.6 - 0.4 - i * 0.08);
        return <ellipse key={i} cx={cx + dx} cy={HEART.y + dy} rx={12 * s} ry={7 * s} fill={V.green} transform={`rotate(${-30 + i * 25} ${cx + dx} ${HEART.y + dy})`} />;
      })}
    </g>
  );
};

const Cracks: React.FC<{cx: number; k: number}> = ({cx, k}) => {
  if (k <= 0) return null;
  const ds = [
    `M${cx - 20},${HEART.y - 120} l18,50 l-22,40 l26,46 l-14,50`,
    `M${cx + 90},${HEART.y - 80} l-30,40 l10,36 l-34,30`,
    `M${cx - 120},${HEART.y - 40} l40,24 l-6,40`,
  ];
  return (
    <g>
      {ds.map((d, i) => (
        <path key={i} d={d} stroke="#1B1C1F" strokeWidth={4} fill="none" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - clamp01(k * 1.4 - i * 0.2)} />
      ))}
    </g>
  );
};

const Roots: React.FC<{t: number; on: number}> = ({on}) => {
  if (on <= 0) return null;
  return (
    <g opacity={on}>
      {/* one root ball feeding three trunks */}
      <path d={`M430,${TOP} q-30,50 -60,80 M430,${TOP} q0,60 -6,100 M430,${TOP} q34,46 70,74`} stroke={V.gold} strokeWidth={3} fill="none" />
      <circle cx={430} cy={TOP + 8} r={12} fill={V.gold} />
      <path d={`M900,${TOP} q-20,50 -40,70 M900,${TOP} q20,50 36,74`} stroke={V.cream} strokeWidth={3} fill="none" opacity={0.7} />
      <circle cx={900} cy={TOP + 8} r={9} fill={V.cream} opacity={0.8} />
    </g>
  );
};

const SinwanTags: React.FC<{t: number}> = ({t}) => {
  const k = prog(t, PH.sinwan.s + 0.2, PH.sinwan.s + 0.8, easeOut) * (1 - prog(t, PH.water.s + 1.4, PH.water.s + 1.9, easeIn));
  return (
    <>
      <Tag x={430} y={TOP + 120} k={k}>
        ONE ROOT
      </Tag>
      <Tag x={880} y={TOP + 120} k={prog(t, PH.sinwan.s + 0.9, PH.sinwan.s + 1.5, easeOut) * (1 - prog(t, PH.water.s + 1.4, PH.water.s + 1.9, easeIn))} color={V.cream}>
        ITS OWN
      </Tag>
      <Tag x={540} y={TOP + 200} k={prog(t, RW[17].s - 0.2, RW[17].s + 0.4, easeOut) * (1 - prog(t, PH.fruit.s + 0.2, PH.fruit.s + 0.7, easeIn))}>
        ONE WATER
      </Tag>
    </>
  );
};

const SameWater: React.FC<{t: number}> = ({t}) => {
  const k = prog(t, S('same') - 0.05, S('same') + 0.4, easeOut) * (1 - prog(t, S('salty') + 0.1, S('salty') + 0.5, easeIn));
  return (
    <Tag x={540} y={TOP + 150} k={k} size={28}>
      SAME WATER
    </Tag>
  );
};

/** "If the water were salty…" — a drop under a lens: not salty, sweet. The fault is in the ground. */
const WaterCheck: React.FC<{t: number}> = ({t}) => {
  const k = prog(t, S('salty') - 0.1, S('salty') + 0.5, easeOut) * (1 - prog(t, S('people') - 0.2, S('people') + 0.3, easeIn));
  if (k <= 0) return null;
  const strike = prog(t, Wd('salty', 6), Wd('salty', 6) + 0.5, easeOut);
  const ground = prog(t, E('salty') - 0.2, E('salty') + 0.5, easeOut);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, opacity: k}}>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <circle cx={540} cy={930} r={92} fill="rgba(7,10,18,0.75)" stroke={V.cream} strokeWidth={4} />
        <line x1={606} y1={996} x2={660} y2={1050} stroke={V.cream} strokeWidth={10} strokeLinecap="round" />
        <Drop x={540} y={936} s={1.6} fill="#BFD6F0" />
        {ground > 0 && (
          <path d={`M720,${1060} q60,40 40,${110 * ground}`} stroke={V.gold} strokeWidth={4} fill="none" markerEnd="" opacity={ground} />
        )}
      </svg>
      <Tag x={380} y={830} k={k} color={V.cream}>
        <span style={{textDecoration: strike > 0.5 ? 'line-through' : 'none', opacity: 1 - strike * 0.4}}>SALTY?</span>
      </Tag>
      <Tag x={700} y={830} k={strike}>
        SWEET
      </Tag>
      <Tag x={790} y={TOP + 120} k={ground}>
        THE GROUND
      </Tag>
    </div>
  );
};

const Gauges: React.FC<{t: number; hl: number; hr: number}> = ({t, hl, hr}) => {
  const on = prog(t, S('more') - 0.2, S('more') + 0.3, easeOut) * (1 - prog(t, S('says') - 0.2, S('says') + 0.3, easeIn));
  if (on <= 0) return null;
  const up = prog(t, Wd('more', 3), Wd('more', 3) + 0.9, easeOut);
  const down = prog(t, Wd('less', 2), Wd('less', 2) + 0.9, easeOut);
  const y = HEART.y + 230;
  const bar = (x: number, v: number, c: string, label: string) => (
    <g>
      <rect x={x - 130} y={y} width={260} height={18} rx={9} fill="rgba(245,239,226,0.14)" />
      <rect x={x - 130} y={y} width={260 * v} height={18} rx={9} fill={c} />
      <text x={x} y={y + 62} textAnchor="middle" fontFamily={VF.mono} fontSize={28} letterSpacing="0.18em" fill={c}>
        {label}
      </text>
    </g>
  );
  return (
    <g opacity={on}>
      {bar(hl, lerp(0.5, 1, up), V.gold, '+ MORE')}
      {bar(hr, lerp(0.5, 0.06, down), V.stoneHi, '− LESS')}
    </g>
  );
};

const Yours: React.FC<{t: number}> = ({t}) => {
  const k = prog(t, S('sohow') - 0.1, S('sohow') + 0.6, easeOut) * (1 - prog(t, FOLLOW - 0.3, FOLLOW + 0.2, easeIn));
  if (k <= 0) return null;
  const pulse = 0.5 + 0.5 * Math.sin(t * 3.2);
  return (
    <>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        <path d={toPath(heartPts(540, HEART.y, 400, 380))} fill={V.gold} opacity={k * (0.06 + pulse * 0.06)} />
        <path d={toPath(heartPts(540, HEART.y, 400, 380))} fill="none" stroke={V.gold} strokeWidth={5} strokeDasharray="18 14" strokeDashoffset={-t * 30} opacity={k} />
      </svg>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: HEART.y - 30,
          textAlign: 'center',
          fontFamily: VF.mono,
          fontSize: 40,
          letterSpacing: '0.24em',
          color: V.gold,
          opacity: prog(t, S('ground') - 0.1, S('ground') + 0.4, easeOut) * k,
        }}
      >
        YOURS?
      </div>
    </>
  );
};

/* ---------- end card ---------- */

const EndCard: React.FC<{t: number}> = ({t}) => {
  const k = prog(t, FOLLOW, FOLLOW + 0.5, easeOut);
  if (k <= 0) return null;
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 380}}>
      <AbsoluteFill style={{background: V.night, opacity: k * 0.55}} />
      <div style={{opacity: k, transform: `translateY(${(1 - k) * 26}px)`, padding: '40px 44px', background: 'rgba(7,10,18,0.86)', borderRadius: 24, width: 880, boxSizing: 'border-box', border: '1px solid rgba(233,194,122,0.25)'}}>
        <div style={{fontFamily: VF.mono, fontSize: 30, letterSpacing: '0.16em', color: V.gold}}>FOLLOW</div>
        <div style={{fontFamily: VF.serif, fontSize: 108, color: V.cream, lineHeight: 1.0, marginTop: 14}}>The Tazkiyyah Guide</div>
        <div style={{fontFamily: VF.mono, fontWeight: 600, fontSize: 42, color: V.gold, marginTop: 22}}>@{HANDLE}</div>
        <div style={{fontFamily: VF.sans, fontSize: 36, color: V.creamDim, marginTop: 16}}>for similar posts</div>
        <div style={{fontFamily: VF.sans, fontSize: 23, color: V.creamDim, marginTop: 44, lineHeight: 1.4}}>
          Qur'an 13:4 and 17:82. Al-Hasan al-Basri's words: Tafsir al-Tabari on 13:4. Educational reminder, not a fatwa.
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------- composition ---------- */

export const OneVerse: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / TL.fps;
  return (
    <AbsoluteFill style={{background: V.night}}>
      <Sky t={t} />
      <World t={t} />
      {/* soft fade at the bottom where the app's own UI sits */}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(7,10,18,0) 78%, rgba(7,10,18,0.9) 92%)'}} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(7,10,18,0.55) 0%, rgba(7,10,18,0) 38%)'}} />
      <Labels t={t} />
      <ArabicPhrase t={t} />
      <Isra t={t} />
      <Captions t={t} />
      <Handle t={t} />
      <EndCard t={t} />
      <Grain frame={frame} opacity={0.08} />
    </AbsoluteFill>
  );
};
