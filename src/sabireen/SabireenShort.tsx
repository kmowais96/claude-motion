import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import '@fontsource/amiri/400.css';
import '@fontsource/amiri/700.css';
import '@fontsource/amiri-quran/400.css';
import {Grain} from '../components/primitives';
import {band, clamp01, easeIn, easeInOut, easeOut, lerp, prog, sp as spAt} from '../lib';
import {AR, C, F, FPS, H, T, W} from './theme';

const useSabireenFonts = () => {
  const [handle] = useState(() => delayRender('sabireen-fonts'));
  useEffect(() => {
    Promise.all([
      document.fonts.load('400 100px "Amiri Quran"', 'وَٱلصَّٰبِرِينَ'),
      document.fonts.load('400 100px "Amiri"', 'النصب'),
      document.fonts.load('700 100px "Amiri"', 'النصب'),
      document.fonts.load('400 100px "Instrument Serif"'),
      document.fonts.load('italic 400 100px "Instrument Serif"'),
      document.fonts.load('400 20px "JetBrains Mono"'),
      document.fonts.load('600 20px "JetBrains Mono"'),
      document.fonts.load('400 20px "Inter Variable"'),
    ]).then(() => continueRender(handle));
  }, [handle]);
};

/** Entrance 0→1 from `a` (easeOut over `inD`), exit 0→1 into `b` (easeIn over `outD`). */
const vis = (t: number, a: number, b: number, inD = 0.7, outD = 0.4) => {
  const k = prog(t, a, a + inD, easeOut);
  const out = prog(t, b - outD, b, easeIn);
  return {k, out, o: k * (1 - out)};
};

// lib's sp() defaults to the example video's 60 fps; this piece runs at 30.
const sp = (frame: number, at: number, cfg = {}) => spAt(frame, at, cfg, FPS);

const abs = (style: React.CSSProperties): React.CSSProperties => ({position: 'absolute', ...style});

const Label: React.FC<{children: React.ReactNode; color?: string; style?: React.CSSProperties}> = ({
  children,
  color = C.muted,
  style,
}) => (
  <div
    style={{
      fontFamily: F.mono,
      fontSize: 30,
      letterSpacing: '0.22em',
      textTransform: 'uppercase',
      color,
      ...style,
    }}
  >
    {children}
  </div>
);

/** An Arabic word with its case ending in its own colour. */
const Word: React.FC<{
  stem: string;
  end: string;
  size: number;
  stemColor?: string;
  endColor: string;
  glow?: number;
  font?: string;
}> = ({stem, end, size, stemColor = C.cream, endColor, glow = 0, font = F.quran}) => (
  <span dir="rtl" style={{fontFamily: font, fontSize: size, lineHeight: 1.5, whiteSpace: 'nowrap'}}>
    <span style={{color: stemColor}}>{stem}</span>
    <span
      style={{
        color: endColor,
        textShadow: glow > 0 ? `0 0 ${30 * glow}px ${endColor}` : undefined,
      }}
    >
      {end}
    </span>
  </span>
);

// ---------------------------------------------------------------- background

const Backdrop: React.FC<{t: number; gold: number}> = ({t, gold}) => (
  <AbsoluteFill style={{background: C.bg}}>
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 80% 45% at 50% 46%, ${C.bgHi} 0%, rgba(11,14,19,0) 70%)`,
      }}
    />
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 60% 32% at 50% 44%, ${C.goldGlow}${0.2 * gold}) 0%, ${C.goldGlow}0) 70%)`,
      }}
    />
    {/* faint ruled lines drifting, like a page of a notebook */}
    <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: 0.5}}>
      {Array.from({length: 26}, (_, i) => {
        const y = ((i * 78 + t * 6) % (H + 78)) - 39;
        return <line key={i} x1={0} x2={W} y1={y} y2={y} stroke={C.line} strokeWidth={1} />;
      })}
    </svg>
    <AbsoluteFill
      style={{
        background:
          'radial-gradient(ellipse 90% 70% at 50% 50%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.6) 100%)',
      }}
    />
  </AbsoluteFill>
);

// ---------------------------------------------------------------- rhythm grid (hook + close)

const COLS = 5;
const ROWS = 8;
const ODD = {c: 2, r: 4};

const RhythmGrid: React.FC<{
  t: number;
  frame: number;
  opacity: number;
  broken: number;
  glow: number;
  dimOthers: number;
  y0?: number;
}> = ({t, frame, opacity, broken, glow, dimOthers, y0 = 640}) => {
  const cw = 190;
  const rh = 132;
  const x0 = W / 2 - ((COLS - 1) * cw) / 2;
  const beat = (t * 2) % 1; // two beats a second
  return (
    <AbsoluteFill style={{opacity}}>
      {Array.from({length: ROWS}, (_, r) =>
        Array.from({length: COLS}, (_, c) => {
          const odd = r === ODD.r && c === ODD.c;
          const drift = Math.sin(t * 0.9 + r * 0.7) * 10;
          const phase = clamp01(1 - Math.abs(beat - ((c + r) % COLS) / COLS) * 5);
          const pulse = odd ? 0 : phase * 0.18;
          const x = x0 + c * cw + drift;
          const y = y0 + r * rh;
          const fadeEdge = 1 - Math.abs(r - (ROWS - 1) / 2) / ROWS;
          const base = odd ? 1 : (0.35 + pulse) * fadeEdge * (1 - 0.6 * dimOthers);
          const drop = odd ? broken * 18 : 0;
          const sc = odd ? 1 + 0.25 * glow : 1;
          return (
            <div
              key={`${r}-${c}`}
              style={abs({
                left: x,
                top: y + drop,
                transform: `translate(-50%, -50%) scale(${sc})`,
                opacity: base,
                fontFamily: F.quran,
                fontSize: 82,
                direction: 'rtl',
                color: odd ? (broken > 0.5 ? C.gold : C.teal) : C.teal,
                textShadow: odd && broken > 0.5 ? `0 0 ${20 + 40 * glow}px ${C.goldGlow}${0.6})` : undefined,
              })}
            >
              {odd ? (broken > 0.5 ? AR.een : AR.oon) : AR.oon}
            </div>
          );
        }),
      )}
      {/* the jolt when it breaks */}
      {broken > 0 && broken < 1 ? (
        <div
          style={abs({
            left: x0 + ODD.c * cw,
            top: y0 + ODD.r * rh,
            width: 240 * broken + 60,
            height: 240 * broken + 60,
            transform: 'translate(-50%,-50%)',
            borderRadius: '50%',
            border: `3px solid ${C.gold}`,
            opacity: 1 - broken,
          })}
        />
      ) : null}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- scenes

const Hook: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const s = T.s1;
  const out = prog(t, s.exit - 0.45, s.exit, easeIn);
  const brk = prog(t, s.break, s.break + 0.5, easeOut);
  const purpose = sp(frame, s.purpose, {damping: 12, stiffness: 190, mass: 0.75});
  return (
    <AbsoluteFill style={{opacity: 1 - out}}>
      <RhythmGrid t={t} frame={frame} opacity={1} broken={brk} glow={brk} dimOthers={brk} />
      <div style={abs({top: 230, left: 0, right: 0, textAlign: 'center'})}>
        <div
          style={{
            fontFamily: F.serif,
            fontSize: 118,
            lineHeight: 1,
            letterSpacing: '-0.02em',
            color: C.cream,
          }}
        >
          One word
          <br />
          breaks the pattern.
        </div>
        <div
          style={{
            marginTop: 26,
            fontFamily: F.serif,
            fontStyle: 'italic',
            fontSize: 104,
            color: C.gold,
            opacity: purpose,
            transform: `translateY(${(1 - purpose) * 30}px)`,
          }}
        >
          On purpose.
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Rule: React.FC<{t: number}> = ({t}) => {
  const s = T.s2;
  const v = vis(t, s.start, s.exit, 0.7, 0.4);
  const uni = prog(t, s.uniform, s.uniform + 0.8, easeOut);
  return (
    <AbsoluteFill style={{opacity: v.o}}>
      <Label style={abs({top: 300, left: 0, right: 0, textAlign: 'center'})}>The rule</Label>
      <div
        style={abs({
          top: 380,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: F.serif,
          fontSize: 124,
          lineHeight: 1.02,
          letterSpacing: '-0.02em',
          color: C.cream,
          transform: `translateY(${(1 - v.k) * 40}px)`,
        })}
      >
        Same job,
        <br />
        <span style={{color: C.teal, fontStyle: 'italic'}}>same ending.</span>
      </div>
      <div style={abs({top: 780, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6})}>
        {AR.examples.map(([stem, end], i) => {
          const k = prog(t, s.words + i * 0.25, s.words + i * 0.25 + 0.7, easeOut);
          return (
            <div key={i} style={{opacity: k, transform: `translateY(${(1 - k) * 30}px)`, position: 'relative'}}>
              <Word stem={stem} end={end} size={112} endColor={C.teal} glow={uni} />
            </div>
          );
        })}
      </div>
      <div style={abs({top: 1310, left: 0, right: 0, textAlign: 'center', opacity: uni})}>
        <span style={{fontFamily: F.quran, fontSize: 96, color: C.teal}}>ـُونَ</span>
        <span style={{fontFamily: F.mono, fontSize: 40, color: C.creamDim, marginLeft: 26}}>= -ūna</span>
      </div>
    </AbsoluteFill>
  );
};

/** The verse: the list, al-mūfūn, the expected word, and the hero flip. */
const Verse: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const s3 = T.s3;
  const s4 = T.s4;
  const hero = T.hero.saabireen;
  const v = vis(t, s3.start, T.s5.start + 0.2, 0.8, 0.5);
  const list = ['believes in Allah, the Last Day…', 'gives wealth, though he loves it…', 'establishes prayer, gives zakah…'];
  const prom = prog(t, s3.promise, s3.promise + 0.9, easeOut);
  const endPop = sp(frame, s3.ending, {damping: 11, stiffness: 210, mass: 0.7});
  const expect = prog(t, s4.expect, s4.expect + 0.8, easeOut);
  const ghost = prog(t, s4.saabiroon, s4.saabiroon + 0.5, easeOut);
  const flip = prog(t, hero - 0.05, hero + 0.35, easeInOut);
  const land = sp(frame, hero + 0.25, {damping: 8, stiffness: 200});
  const dim = prog(t, hero, hero + 0.6, easeOut);
  const shake = t > s4.notIt && t < hero ? Math.sin(t * 60) * 3 * band(t, s4.notIt, s4.notIt + 0.3) : 0;
  // the gold word rises to the top when scene 5 begins (handed over to <Praise/>)
  return (
    <AbsoluteFill style={{opacity: v.o}}>
      <Label style={abs({top: 250, left: 0, right: 0, textAlign: 'center', opacity: 1 - dim * 0.6})}>
        Surah al-Baqarah · 2:177
      </Label>
      <div style={abs({top: 320, left: 0, right: 0, textAlign: 'center', fontFamily: F.serif, fontSize: 64, color: C.creamDim, opacity: (1 - dim * 0.75) * prog(t, s3.start + 0.2, s3.start + 1, easeOut)})}>
        True righteousness is one who…
      </div>
      <div style={abs({top: 430, left: 120, right: 120, opacity: 1 - dim * 0.8})}>
        {list.map((line, i) => {
          const k = prog(t, s3.list + i * 0.35, s3.list + i * 0.35 + 0.7, easeOut);
          const fade = 1 - 0.45 * prom;
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 22,
                alignItems: 'baseline',
                fontFamily: F.sans,
                fontSize: 42,
                color: C.muted,
                opacity: k * fade,
                transform: `translateX(${(1 - k) * 30}px)`,
                marginBottom: 18,
              }}
            >
              <span style={{fontFamily: F.mono, fontSize: 28, color: C.faint}}>0{i + 1}</span>
              {line}
            </div>
          );
        })}
      </div>
      {/* al-mūfūn line */}
      <div
        style={abs({
          top: 680,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: prom * (1 - dim * 0.65),
          transform: `translateY(${(1 - prom) * 40}px)`,
        })}
      >
        <div dir="rtl" style={{fontFamily: F.quran, fontSize: 92, lineHeight: 1.5, color: C.cream}}>
          <Word stem={AR.moofoonStem} end={AR.oon} size={92} endColor={C.teal} glow={endPop} />{' '}
          <span style={{color: C.creamDim}}>{AR.moofoonRest}</span>
        </div>
        <div style={{fontFamily: F.sans, fontSize: 40, color: C.creamDim, marginTop: 28}}>
          “and those who keep their promises”
        </div>
      </div>
      {/* the ending, called out */}
      <div
        style={abs({
          top: 935,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: endPop * (1 - dim),
          transform: `scale(${0.8 + 0.2 * endPop})`,
        })}
      >
        <span style={{fontFamily: F.mono, fontSize: 34, color: C.teal, letterSpacing: '0.18em'}}>ENDING: -ŪNA</span>
      </div>
      {/* the next slot: expected vs actual */}
      <div
        style={abs({
          top: 1040,
          left: 140,
          right: 140,
          height: 300,
          borderRadius: 28,
          border: `3px dashed ${flip > 0.5 ? 'rgba(0,0,0,0)' : C.tealDim}`,
          opacity: expect,
          transform: `translateX(${shake}px)`,
        })}
      >
        <div
          style={abs({
            inset: 0,
            borderRadius: 26,
            background: `${C.goldGlow}${0.1 * dim})`,
            boxShadow: `0 0 ${90 * dim}px ${C.goldGlow}${0.35 * dim})`,
            border: dim > 0 ? `3px solid ${C.goldGlow}${0.7 * dim})` : undefined,
          })}
        />
        <div style={abs({inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'})}>
          {/* expected (ghost) */}
          <div
            style={abs({
              opacity: ghost * (1 - flip) * 0.75,
              transform: `translateY(${-flip * 60}px)`,
            })}
          >
            <Word stem={AR.sabirStemU} end={AR.oon} size={128} stemColor={C.muted} endColor={C.teal} />
          </div>
          {/* actual */}
          <div
            style={abs({
              opacity: flip,
              transform: `translateY(${(1 - flip) * 60}px) scale(${0.9 + 0.1 * land})`,
            })}
          >
            <Word stem={AR.sabirStemI} end={AR.een} size={140} stemColor={C.cream} endColor={C.gold} glow={land} />
          </div>
        </div>
        <div
          style={abs({
            top: -24,
            right: 40,
            padding: '6px 16px',
            background: C.bg,
            fontFamily: F.mono,
            fontSize: 26,
            letterSpacing: '0.2em',
            color: flip > 0.5 ? C.gold : C.teal,
          })}
        >
          {flip > 0.5 ? 'IN THE QURAN' : 'EXPECTED'}
        </div>
      </div>
      <div
        style={abs({
          top: 1370,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: prog(t, hero + 0.4, hero + 1, easeOut),
        })}
      >
        <span style={{fontFamily: F.mono, fontSize: 34, color: C.gold, letterSpacing: '0.18em'}}>ENDING: -ĪNA</span>
      </div>
    </AbsoluteFill>
  );
};

const Praise: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const s = T.s5;
  const v = vis(t, s.start, T.s6.start, 0.8, 0.45);
  const not = prog(t, s.start, s.start + 0.7, easeOut);
  const sib = prog(t, s.sibawayh, s.sibawayh + 0.8, easeOut);
  const term = sp(frame, s.praise, {damping: 14, stiffness: 140, mass: 0.8});
  const stop = prog(t, s.stop, s.stop + 2.2, (x) => x);
  const asif = prog(t, s.asif, s.asif + 0.9, easeOut);
  const pat = prog(t, s.patient, s.patient + 0.6, easeOut);
  const toTop = prog(t, s.asif - 0.2, s.asif + 0.5, easeInOut);
  // rail of ticks that runs left, then halts at the gold one
  const railStop = s.stop + 1.1;
  return (
    <AbsoluteFill style={{opacity: v.o}}>
      <div
        style={abs({
          top: 250,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: F.serif,
          fontSize: 120,
          lineHeight: 1,
          color: C.cream,
          opacity: not * (1 - toTop),
          transform: `translateY(${(1 - not) * 30}px)`,
        })}
      >
        Not a <span style={{fontStyle: 'italic', color: C.gold}}>mistake.</span>
      </div>
      {/* Sibawayh card */}
      <div style={abs({top: 470, left: 90, right: 90, opacity: sib * (1 - toTop), transform: `translateY(${(1 - sib) * 30}px)`})}>
        <Label color={C.creamDim} style={{textAlign: 'center'}}>Sībawayh · al-Kitāb</Label>
        <div style={{textAlign: 'center', fontFamily: F.sans, fontSize: 34, color: C.muted, marginTop: 10}}>
          the father of Arabic grammar files it under
        </div>
        <div style={{height: 34}} />
        <div
          dir="rtl"
          style={{
            textAlign: 'center',
            fontFamily: F.arabic,
            fontWeight: 700,
            fontSize: 118,
            lineHeight: 1.6,
            color: C.gold,
            opacity: term,
            transform: `scale(${0.85 + 0.15 * term})`,
          }}
        >
          {AR.term}
        </div>
        <div style={{textAlign: 'center', fontFamily: F.serif, fontStyle: 'italic', fontSize: 66, color: C.cream, opacity: term}}>
          the accusative of praise
        </div>
      </div>
      {/* the rail: a pattern that runs, then stops on the odd one */}
      <div style={abs({top: 1080, left: 0, right: 0, height: 120, overflow: 'hidden', opacity: band(t, s.stop, s.stop + 0.4) * (1 - toTop)})}>
        {Array.from({length: 14}, (_, i) => {
          const odd = i === 9;
          const xx = W / 2 + (i - 9) * 150 + (railStop - Math.min(t, railStop)) * 420;
          return (
            <div
              key={i}
              style={abs({
                left: xx,
                top: 60,
                transform: 'translate(-50%,-50%)',
                fontFamily: F.quran,
                fontSize: 70,
                direction: 'rtl',
                color: odd && t > railStop ? C.gold : C.teal,
                opacity: odd ? 0.5 + 0.5 * band(t, railStop - 0.1, railStop + 0.2) : 0.5,
                textShadow: odd ? `0 0 30px ${C.goldGlow}0.7)` : undefined,
              })}
            >
              {odd && t > railStop ? AR.een : AR.oon}
            </div>
          );
        })}
      </div>
      <div
        style={abs({
          top: 1220,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: F.sans,
          fontSize: 42,
          color: C.creamDim,
          opacity: band(t, railStop, railStop + 0.4) * (1 - toTop),
        })}
      >
        Break the rhythm, and the ear <span style={{color: C.gold}}>stops.</span>
      </div>
      {/* "as if the verse says" */}
      <div style={abs({top: 560, left: 0, right: 0, textAlign: 'center', opacity: asif})}>
        <Label color={C.creamDim}>As if the verse says</Label>
        <div
          dir="rtl"
          style={{
            marginTop: 30,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 30,
          }}
        >
          <span
            style={{
              fontFamily: F.arabic,
              fontSize: 96,
              color: C.creamDim,
              border: `3px dashed ${C.muted}`,
              borderRadius: 20,
              padding: '0 26px',
              lineHeight: 1.5,
            }}
          >
            {AR.implied}
          </span>
          <Word stem={AR.sabirStemI} end={AR.een} size={128} endColor={C.gold} glow={0.6} />
        </div>
        <div style={{marginTop: 30, fontFamily: F.serif, fontSize: 84, lineHeight: 1.1, color: C.cream}}>
          <span style={{color: C.muted, fontStyle: 'italic'}}>(and I especially praise)</span>
          <br />
          <span style={{opacity: pat, color: C.gold, fontStyle: 'italic'}}>the patient.</span>
        </div>
        <div style={{marginTop: 40, fontFamily: F.mono, fontSize: 26, letterSpacing: '0.16em', color: C.muted, opacity: pat}}>
          THE UNSPOKEN VERB: أَمْدَحُ · “I PRAISE”
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Icon: React.FC<{kind: 'coin' | 'pulse' | 'shield'; k: number}> = ({kind, k}) => {
  const len = 400;
  const common = {
    fill: 'none',
    stroke: C.gold,
    strokeWidth: 5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeDasharray: len,
    strokeDashoffset: len * (1 - k),
  };
  return (
    <svg width={110} height={110} viewBox="0 0 100 100">
      {kind === 'coin' ? (
        <>
          <circle cx={50} cy={50} r={36} {...common} />
          <path d="M40 38 Q50 30 60 38 Q50 50 40 60 Q50 70 60 62" {...common} />
        </>
      ) : null}
      {kind === 'pulse' ? <path d="M8 52 H32 L40 30 L52 74 L62 44 L68 52 H92" {...common} /> : null}
      {kind === 'shield' ? (
        <path d="M50 12 L82 24 V50 C82 70 66 82 50 90 C34 82 18 70 18 50 V24 Z" {...common} />
      ) : null}
    </svg>
  );
};

const Why: React.FC<{t: number}> = ({t}) => {
  const s = T.s6;
  const v = vis(t, s.start, T.s7.start + 0.1, 0.7, 0.45);
  const q = prog(t, s.kathir, s.kathir + 0.9, easeOut);
  const items: [string, string, 'coin' | 'pulse' | 'shield', number][] = [
    [AR.basaa, 'when money runs out', 'coin', s.money],
    [AR.darraa, 'when sickness hits', 'pulse', s.sick],
    [AR.baas, 'in the heat of battle', 'shield', s.battle],
  ];
  const firstCard = prog(t, s.money - 0.3, s.money + 0.2, easeInOut);
  return (
    <AbsoluteFill style={{opacity: v.o}}>
      <div
        style={abs({
          top: 250,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: F.serif,
          fontSize: 120,
          lineHeight: 1,
          color: C.cream,
          transform: `translateY(${(1 - v.k) * 30}px)`,
        })}
      >
        Why <span style={{fontStyle: 'italic', color: C.gold}}>the patient?</span>
      </div>
      {/* Ibn Kathir quote; slides up and shrinks to make room for the cards */}
      <div
        style={abs({
          top: lerp(470, 420, firstCard),
          left: 90,
          right: 90,
          textAlign: 'center',
          opacity: q * (1 - 0.35 * firstCard),
          transform: `scale(${lerp(1, 0.86, firstCard)})`,
        })}
      >
        <Label color={C.creamDim}>Ibn Kathīr · Tafsīr 2:177</Label>
        <div dir="rtl" style={{marginTop: 18, fontFamily: F.arabic, fontSize: 52, lineHeight: 1.7, color: C.cream}}>
          {AR.kathir}
        </div>
        <div style={{marginTop: 8, fontFamily: F.serif, fontStyle: 'italic', fontSize: 50, lineHeight: 1.2, color: C.creamDim}}>
          “…as praise, and to urge patience in these states, because of how hard it is.”
        </div>
      </div>
      <div style={abs({top: 980, left: 90, right: 90, display: 'flex', flexDirection: 'column', gap: 26})}>
        {items.map(([ar, en, icon, at], i) => {
          const k = prog(t, at, at + 0.7, easeOut);
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 30,
                padding: '18px 34px',
                borderRadius: 26,
                background: 'rgba(242,235,221,0.04)',
                border: `2px solid ${C.goldGlow}${0.35 * k})`,
                opacity: k,
                transform: `translateY(${(1 - k) * 40}px)`,
              }}
            >
              <Icon kind={icon} k={prog(t, at + 0.1, at + 0.9, easeOut)} />
              <div style={{flex: 1, fontFamily: F.serif, fontSize: 58, color: C.cream, lineHeight: 1.05}}>{en}</div>
              <div dir="rtl" style={{fontFamily: F.quran, fontSize: 64, color: C.gold, lineHeight: 1.4}}>
                {ar}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const Close: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const s = T.s7;
  const v = vis(t, s.start, T.end.start + 0.1, 1.0, 0.45);
  const hold = prog(t, s.holding, s.holding + 0.8, easeOut);
  const rh = prog(t, s.rhythm, s.rhythm + 0.9, easeOut);
  const you = sp(frame, s.you, {damping: 8, stiffness: 200});
  return (
    <AbsoluteFill style={{opacity: v.o}}>
      <RhythmGrid t={t} frame={frame} opacity={0.55 + 0.45 * hold} broken={1} glow={0.5 + 0.5 * you} dimOthers={0.5 + 0.5 * rh} y0={640} />
      <div style={abs({top: 250, left: 0, right: 0, textAlign: 'center'})}>
        <div style={{fontFamily: F.serif, fontSize: 96, lineHeight: 1.05, color: C.creamDim, opacity: hold * (1 - prog(t, s.rhythm - 0.35, s.rhythm, easeIn))}}>
          Life is hard,
          <br />
          and you’re still <span style={{fontStyle: 'italic', color: C.cream}}>holding on?</span>
        </div>
      </div>
      <div
        style={abs({
          top: 250,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: rh,
          transform: `translateY(${(1 - rh) * 30}px)`,
        })}
      >
        <div style={{fontFamily: F.serif, fontSize: 100, lineHeight: 1.04, color: C.cream}}>
          The verse breaks its rhythm
          <br />
          to praise{' '}
          <span
            style={{
              fontStyle: 'italic',
              color: C.gold,
              display: 'inline-block',
              transform: `scale(${0.7 + 0.3 * you})`,
              opacity: clamp01(you * 1.5),
            }}
          >
            you.
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const EndCard: React.FC<{t: number}> = ({t}) => {
  const s = T.end;
  const k = prog(t, s.start, s.start + 0.9, easeOut);
  return (
    <AbsoluteFill style={{opacity: k, alignItems: 'center', justifyContent: 'center', textAlign: 'center'}}>
      <div style={{transform: `translateY(${(1 - k) * 30}px)`, marginTop: -160}}>
        <Label color={C.creamDim}>Follow</Label>
        <div style={{fontFamily: F.serif, fontSize: 118, lineHeight: 1.05, color: C.cream, marginTop: 24}}>
          The Tazkiyyah
          <br />
          <span style={{fontStyle: 'italic', color: C.gold}}>Guide</span>
        </div>
        <div style={{fontFamily: F.mono, fontSize: 36, color: C.teal, marginTop: 30}}>@TheTazkiyyahGuide</div>
        <div style={{fontFamily: F.sans, fontSize: 36, color: C.muted, marginTop: 12}}>for similar posts</div>
        <div style={{width: 120, height: 2, background: C.faint, margin: '60px auto 36px'}} />
        <div style={{fontFamily: F.sans, fontSize: 28, color: C.muted, lineHeight: 1.6, padding: '0 120px'}}>
          Al-Baqarah 2:177 · Sībawayh, al-Kitāb · al-Ṭabarī · Ibn Kathīr
          <br />
          Educational reminder, not a fatwa.
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Captions: React.FC<{t: number}> = ({t}) => {
  const cur = T.captions.find(([a, b]) => t >= (a as number) && t < (b as number));
  if (!cur || t >= T.end.start) return null;
  const [a, b, text] = cur as [number, number, string];
  const o = band(t, a, a + 0.12) * (1 - band(t, b - 0.1, b));
  return (
    <div
      style={abs({
        top: 1540,
        left: 90,
        right: 90,
        textAlign: 'center',
        fontFamily: F.sans,
        fontWeight: 500,
        fontSize: 40,
        lineHeight: 1.3,
        color: C.creamDim,
        opacity: o,
      })}
    >
      {text}
    </div>
  );
};

export const SabireenShort: React.FC<{audio?: boolean}> = ({audio = true}) => {
  useSabireenFonts();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const hero = T.hero.saabireen;
  const gold =
    0.25 * prog(t, T.s1.break, T.s1.break + 0.6, easeOut) * (1 - prog(t, T.s1.exit - 0.4, T.s1.exit)) +
    prog(t, hero, hero + 0.6, easeOut) * (1 - 0.6 * prog(t, T.s5.start, T.s5.start + 1)) +
    0.5 * prog(t, T.s7.rhythm, T.s7.you + 0.5) * (1 - prog(t, T.end.start, T.end.start + 0.8));
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <Backdrop t={t} gold={gold} />
      {t < T.s1.exit + 0.05 ? <Hook t={t} frame={frame} /> : null}
      {t > T.s2.start - 0.05 && t < T.s2.exit + 0.05 ? <Rule t={t} /> : null}
      {t > T.s3.start - 0.05 && t < T.s5.start + 0.3 ? <Verse t={t} frame={frame} /> : null}
      {t > T.s5.start - 0.05 && t < T.s6.start + 0.05 ? <Praise t={t} frame={frame} /> : null}
      {t > T.s6.start - 0.05 && t < T.s7.start + 0.2 ? <Why t={t} /> : null}
      {t > T.s7.start - 0.05 && t < T.end.start + 0.2 ? <Close t={t} frame={frame} /> : null}
      {t > T.end.start - 0.05 ? <EndCard t={t} /> : null}
      <Captions t={t} />
      <Grain frame={frame} opacity={0.07} />
      {audio ? <Audio src={staticFile('sabireen-mix.wav')} /> : null}
    </AbsoluteFill>
  );
};

export const sabireenFrames = Math.round(T.duration * FPS);
