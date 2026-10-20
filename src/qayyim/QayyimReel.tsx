import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, useCurrentFrame} from 'remotion';
import {clamp01, easeIn, easeOut, prog} from '../lib';
import {Grain, Mask} from '../components/primitives';
import {Backdrop} from './Backdrop';
import {Motif, motifState} from './Motif';
import {Card, Q, QF, ReelTimeline} from './theme';

const EXIT = 0.45;

const useReelFonts = () => {
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    Promise.all([
      document.fonts.load('400 100px "Instrument Serif"'),
      document.fonts.load('italic 400 100px "Instrument Serif"'),
      document.fonts.load('400 20px "JetBrains Mono"'),
      document.fonts.load('400 100px "Amiri"', 'ﷺ زاد المعاد'),
    ]).then(() => continueRender(handle));
  }, [handle]);
};

/** "Wasting *time.*" → words, with the starred span in the accent. */
const parse = (text: string) => {
  let accent = false;
  return text.split(/\s+/).map((raw) => {
    const opens = raw.startsWith('*');
    const closes = raw.endsWith('*');
    if (opens) accent = true;
    const word = {text: raw.replace(/\*/g, ''), accent};
    if (closes) accent = false;
    return word;
  });
};

const fontSize = (text: string) => {
  const n = text.replace(/\*/g, '').length;
  return n <= 20 ? 128 : n <= 42 ? 104 : n <= 64 ? 92 : 84;
};

const CardText: React.FC<{card: Card; t: number; first: boolean}> = ({card, t, first}) => {
  if (t < card.in || t > card.out) return null;
  const words = parse(card.text);
  return (
    <div
      style={{
        fontFamily: QF.serif,
        fontSize: fontSize(card.text),
        lineHeight: 1.08,
        letterSpacing: '-0.015em',
        color: Q.cream,
        textAlign: 'center',
        textWrap: 'balance',
        width: 900,
      }}
    >
      {words.map((w, i) => {
        const k = first ? 1 : prog(t, card.in + i * 0.09, card.in + i * 0.09 + 0.8, easeOut);
        const out = prog(t, card.out - EXIT + i * 0.015, card.out, easeIn);
        return (
          <React.Fragment key={i}>
            <Mask
              k={k}
              out={out}
              style={
                w.accent ? {fontStyle: 'italic', color: Q.goldHi} : undefined
              }
            >
              {w.text}
            </Mask>{' '}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const BookCard: React.FC<{tl: ReelTimeline; t: number}> = ({tl, t}) => {
  const b = tl.book;
  if (t < b.in) return null;
  const k = (d: number) => prog(t, b.in + d, b.in + d + 0.9, easeOut);
  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26}}>
      <div style={{fontFamily: QF.arabic, fontSize: 132, lineHeight: 1.5, color: Q.goldHi, direction: 'rtl'}}>
        <Mask k={k(0)} tilt={0}>{b.ar}</Mask>
      </div>
      <div
        style={{
          width: 320,
          height: 2,
          background: Q.gold,
          transform: `scaleX(${k(0.2)})`,
          opacity: 0.7,
        }}
      />
      <div style={{fontFamily: QF.serif, fontStyle: 'italic', fontSize: 84, lineHeight: 1.1, color: Q.cream}}>
        <Mask k={k(0.3)}>{b.en}</Mask>
      </div>
      <div
        style={{
          fontFamily: QF.mono,
          fontSize: 26,
          letterSpacing: '0.22em',
          color: Q.creamDim,
          opacity: k(0.6),
          transform: `translateY(${(1 - k(0.6)) * 16}px)`,
        }}
      >
        {b.sub ?? 'IBN AL-QAYYIM · D. 751 AH'}
      </div>
    </div>
  );
};

export const QayyimReel: React.FC<{tl: ReelTimeline}> = ({tl}) => {
  useReelFonts();
  const frame = useCurrentFrame();
  const t = frame / tl.fps;
  const motifProps = {name: tl.motif, t, frame, fps: tl.fps, marks: tl.marks};
  const {glow} = motifState(motifProps);
  const end = clamp01((tl.duration - t) / 0.5);

  return (
    <AbsoluteFill style={{opacity: 0.35 + 0.65 * end}}>
      <Backdrop t={t} glow={glow} />
      <div
        style={{
          position: 'absolute',
          top: 200,
          width: '100%',
          textAlign: 'center',
          fontFamily: QF.mono,
          fontSize: 26,
          letterSpacing: '0.24em',
          color: Q.muted,
        }}
      >
        {tl.label}
        <span style={{color: Q.gold, margin: '0 0.6em'}}>·</span>
        {tl.tag}
      </div>
      <div style={{position: 'absolute', top: 290, left: 260, width: 560, height: 560}}>
        <Motif {...motifProps} size={560} />
      </div>
      <div
        style={{
          position: 'absolute',
          top: 900,
          height: 620,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {tl.cards.map((c, i) => (
          <div key={i} style={{position: 'absolute'}}>
            <CardText card={c} t={t} first={i === 0} />
          </div>
        ))}
        <BookCard tl={tl} t={t} />
      </div>
      <Grain frame={frame} opacity={0.08} />
    </AbsoluteFill>
  );
};
