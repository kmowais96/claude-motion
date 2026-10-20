import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, useCurrentFrame} from 'remotion';
import {clamp01, easeIn, easeInOut, easeOut, prog} from '../lib';
import {Grain, Mask} from '../components/primitives';
import {Backdrop} from './Backdrop';
import {Motif, motifState} from './Motif';
import {Card, Q, QF, ReelTimeline, SCENE_TONES} from './theme';

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

const CardText: React.FC<{card: Card; t: number; first: boolean; enter: number}> = ({card, t, first, enter}) => {
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
        const lag = i * enter * 0.1125;
        const k = first ? 1 : prog(t, card.in + lag, card.in + lag + enter, easeOut);
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

/** One segment per beat, filling over its slot, so the 3 s rhythm is visible. */
const BeatBar: React.FC<{tl: ReelTimeline; t: number}> = ({tl, t}) => {
  const starts = [...tl.cards.map((c) => c.in), tl.book.in];
  const every = tl.cadence ?? 3;
  return (
    <div style={{position: 'absolute', top: 262, left: 240, width: 600, display: 'flex', gap: 8}}>
      {starts.map((s, i) => (
        <div key={i} style={{flex: 1, height: 3, borderRadius: 2, background: Q.faint, overflow: 'hidden'}}>
          <div
            style={{
              height: '100%',
              background: Q.gold,
              transform: `scaleX(${clamp01((t - s) / every)})`,
              transformOrigin: '0 50%',
            }}
          />
        </div>
      ))}
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

// Cadence reels: every card is its own scene with its own drawing and tone.
const SCENE_MARKS: Record<string, number[]> = {
  bird: [0.6, 1.1],
  halves: [0.6, 1.1],
  boat: [0.5, 0.9, 1.3],
  rosette: [0.5, 0.9, 1.3],
  drop: [1.5],
};
const BOOK_MOTIF = 'arch';

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const mix = (a: number[], b: number[], k: number) => a.map((v, i) => v + (b[i] - v) * k);

type Scene = {motif: string; in: number; out: number};

const scenesOf = (tl: ReelTimeline): Scene[] => [
  ...tl.cards.map((c) => ({motif: c.motif ?? tl.motif, in: c.in, out: c.out})),
  {motif: BOOK_MOTIF, in: tl.book.in, out: tl.duration + 1},
];

/** A scene's drawing on its own clock. The opening scene starts already drawn: frame 0 is the thumbnail. */
const sceneMotif = (sc: Scene, i: number, t: number, fps: number) => {
  const lead = i === 0 ? 1.2 : 0;
  const local = t - sc.in + lead;
  return {name: sc.motif, t: local, frame: Math.round(local * fps), fps, marks: SCENE_MARKS[sc.motif] ?? [0.6]};
};

const sceneTone = (scenes: Scene[], t: number) => {
  const rgb = scenes.slice(1).reduce(
    (acc, sc, j) => mix(acc, hex(SCENE_TONES[(j + 1) % SCENE_TONES.length]), prog(t, sc.in - 0.2, sc.in + 0.25, easeInOut)),
    hex(SCENE_TONES[0]),
  );
  return `rgb(${rgb.map(Math.round).join(',')})`;
};

export const QayyimReel: React.FC<{tl: ReelTimeline}> = ({tl}) => {
  useReelFonts();
  const frame = useCurrentFrame();
  const t = frame / tl.fps;
  const motifProps = {name: tl.motif, t, frame, fps: tl.fps, marks: tl.marks};
  const scenes = tl.cadence ? scenesOf(tl) : [];
  const current = scenes.reduce((a, sc, i) => (t >= sc.in - 0.1 ? i : a), 0);
  const {glow} = tl.cadence ? motifState(sceneMotif(scenes[current], current, t, tl.fps)) : motifState(motifProps);
  const end = clamp01((tl.duration - t) / 0.5);
  const turn = tl.cadence
    ? [...tl.cards.slice(1).map((c) => c.in), tl.book.in].reduce((a, s) => a + prog(t, s - 0.15, s + 0.6, easeInOut), 0)
    : 0;

  return (
    <AbsoluteFill style={{opacity: 0.35 + 0.65 * end}}>
      <Backdrop t={t} glow={glow} turn={turn} bg={tl.cadence ? sceneTone(scenes, t) : undefined} />
      {tl.cadence ? <BeatBar tl={tl} t={t} /> : null}
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
      {tl.cadence ? (
        scenes.map((sc, i) => {
          if (t < sc.in - 0.25 || t > sc.out + 0.25) return null;
          const k = i === 0 ? 1 : prog(t, sc.in - 0.15, sc.in + 0.3, easeOut);
          const out = prog(t, sc.out - 0.2, sc.out + 0.15, easeIn);
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: 290,
                left: 260,
                width: 560,
                height: 560,
                opacity: k * (1 - out),
                transform: `scale(${1.08 - 0.08 * k + 0.05 * out})`,
              }}
            >
              <Motif {...sceneMotif(sc, i, t, tl.fps)} size={560} />
            </div>
          );
        })
      ) : (
        <div style={{position: 'absolute', top: 290, left: 260, width: 560, height: 560}}>
          <Motif {...motifProps} size={560} />
        </div>
      )}
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
            <CardText card={c} t={t} first={i === 0} enter={tl.enter ?? 0.8} />
          </div>
        ))}
        <BookCard tl={tl} t={t} />
      </div>
      <Grain frame={frame} opacity={0.08} />
    </AbsoluteFill>
  );
};
