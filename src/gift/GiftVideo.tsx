import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {easeInOut, prog} from '../lib';
import {useFonts} from '../components/useFonts';
import {Bg, Handle, Overlay} from '../mercy/parts';
import {Days, Dua, EndCard, Hijrah, Intro, Siyar, Subtitles} from './scenes';
import {AFPS, END, s} from './theme';

// lines the scene shows in full, so no subtitle under them
const SHOWN = new Set(['imagine', 'dua1a', 'dua1b', 'karim', 'dua2a', 'dua2b', 'enrich1', 'enrich2']);

/** Sheikh 'Uthman al-Khamees on Sa'd ibn 'Ubadah's daily gift: his voice untouched, every scene in English. 1080×1920 at 30 fps. */
export const GiftVideo: React.FC = () => {
  useFonts();
  const frame = useCurrentFrame();
  const t = frame / AFPS;
  const band = (a: number, b: number, fin = 0.8, fout = 0.8) =>
    Math.min(prog(t, a - fin, a, easeInOut), 1 - prog(t, b - fout, b, easeInOut));
  const navy = Math.max(0.2, band(s('khazraj'), s('know')) * 0.6, band(s('among'), END) * 0.95, band(END, 999) * 0.6);
  const warm = Math.max(
    0.3,
    band(0, s('dhahabi')) * 0.9,
    band(s('says'), s('among')) * 1.1,
    band(s('enrich1'), s('rich')) * 1.2,
    band(s('enrich2'), END) * 1.2,
  );
  const warmY = t < s('dhahabi') ? 34 : t > s('among') ? 26 : 42;
  const p = {t, frame};
  return (
    <AbsoluteFill>
      <Bg frame={frame} navy={navy} warm={warm} warmY={warmY} />
      <Intro {...p} />
      <Siyar {...p} />
      <Hijrah {...p} />
      <Days {...p} />
      <Dua {...p} />
      <EndCard {...p} />
      <AbsoluteFill
        style={{
          opacity: 1 - prog(t, END - 0.4, END, easeInOut),
          background: 'linear-gradient(180deg, rgba(10,9,8,0) 64%, rgba(10,9,8,0.55) 71%, rgba(10,9,8,0.55) 80%, rgba(10,9,8,0) 88%)',
        }}
      />
      <Subtitles t={t} hidden={SHOWN} />
      <Handle o={1 - prog(t, END - 0.6, END - 0.2, easeInOut)} />
      <Overlay frame={frame} />
      <Audio src={staticFile('gift/mix.wav')} />
    </AbsoluteFill>
  );
};
