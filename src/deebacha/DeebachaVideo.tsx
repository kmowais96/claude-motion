import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, useCurrentFrame} from 'remotion';
import {Background} from '../components/Background';
import {Grain} from '../components/primitives';
import {useFonts} from '../components/useFonts';
import {C, F, FPS, SENT, at, clamp01, easeIn, easeOut, prog} from './kit';
import {Choice, Flow, Life, Open, Reader, Thirst, Title, WhyAnother} from './scenes1';
import {Book, Close, Did, Kufr, Method, Setting, Speech, Tools} from './scenes2';

type Scene = {p: number; i: number; page: string; C: React.FC<{t: number}>};

// Each scene starts at its first sentence; `page` is where the preface says it.
const SCENES: Scene[] = [
  {p: 1, i: 0, page: 'p. 9', C: Open},
  {p: 1, i: 3, page: 'p. 1', C: Title},
  {p: 1, i: 7, page: 'p. 1', C: WhyAnother},
  {p: 2, i: 0, page: 'p. 1', C: Thirst},
  {p: 2, i: 6, page: 'pp. 1–2', C: Reader},
  {p: 3, i: 0, page: 'pp. 2–3', C: Choice},
  {p: 3, i: 8, page: 'pp. 3–4', C: Life},
  {p: 3, i: 22, page: 'p. 4', C: Flow},
  {p: 4, i: 0, page: 'pp. 4–5', C: Speech},
  {p: 4, i: 16, page: 'p. 6', C: Setting},
  {p: 4, i: 20, page: 'pp. 6–7', C: Kufr},
  {p: 5, i: 0, page: 'p. 7', C: Did},
  {p: 5, i: 10, page: 'pp. 7–8', C: Tools},
  {p: 6, i: 0, page: 'p. 8', C: Method},
  {p: 6, i: 9, page: 'pp. 8–9', C: Book},
  {p: 6, i: 17, page: 'p. 9', C: Close},
];

// Lines already shown large on screen don't repeat as captions.
const NO_CAPTION = new Set(['5:8', '6:20', '6:21', '6:22', '6:23']);

const useAmiri = () => {
  const [handle] = useState(() => delayRender('amiri'));
  useEffect(() => {
    Promise.all([document.fonts.load('400 60px "Amiri"', 'وما'), document.fonts.load('700 60px "Amiri"', 'وما')]).then(() => continueRender(handle));
  }, [handle]);
};

const Caption: React.FC<{t: number}> = ({t}) => {
  const s = SENT.find((x, n) => t >= x.start - 0.15 && t < (SENT[n + 1]?.start ?? Infinity) - 0.15);
  if (!s || NO_CAPTION.has(`${s.part}:${s.idx}`)) return null;
  const k = prog(t, s.start - 0.15, s.start + 0.2, easeOut) * (1 - prog(t, s.end + 0.1, s.end + 0.35, easeIn));
  return (
    <div
      style={{
        position: 'absolute',
        left: 210,
        right: 210,
        top: 905,
        transform: 'translateY(-50%)',
        textAlign: 'center',
        fontFamily: F.serif,
        fontSize: 42,
        lineHeight: 1.22,
        color: C.cream,
        opacity: clamp01(k),
      }}
    >
      {s.text}
    </div>
  );
};

export const DeebachaVideo: React.FC = () => {
  useFonts();
  useAmiri();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const starts = SCENES.map((s) => at(s.p, s.i));
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <Background t={t} glow={0.45} glowY={40} />
      {SCENES.map((sc, n) => {
        const a = n === 0 ? -1 : starts[n] - 0.5;
        const b = n + 1 < SCENES.length ? starts[n + 1] - 0.9 : Infinity;
        if (t < a - 0.01 || t > b + 0.45) return null;
        const o = (n === 0 ? 1 : prog(t, a, a + 0.6, easeOut)) * (1 - prog(t, b, b + 0.4, easeIn));
        const Sc = sc.C;
        return (
          <AbsoluteFill key={n} style={{opacity: o}}>
            <Sc t={t} />
            <div
              style={{
                position: 'absolute',
                left: 80,
                bottom: 42,
                fontFamily: F.mono,
                fontSize: 16,
                letterSpacing: '0.2em',
                color: C.muted,
              }}
            >
              DEEBACHA · TAFHIM AL-QUR'AN, VOL. 1 · {sc.page.toUpperCase()} · PARAPHRASED FROM THE URDU
            </div>
          </AbsoluteFill>
        );
      })}
      <Caption t={t} />
      <Grain frame={frame} opacity={0.07} />
    </AbsoluteFill>
  );
};
