import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {easeInOut, prog} from '../lib';
import {useFonts} from '../components/useFonts';
import {Bg, Handle, Overlay} from '../mercy/parts';
import {Asking, EndCard, Least, Plain, Pouring, Spending, Subtitles} from './scenes';
import {END, GFPS, s, w} from './theme';

/** "Ask Allah for everything": the original Arabic narration, every scene rebuilt in English. 1080×1920 at 30 fps. */
export const GenerousVideo: React.FC = () => {
  useFonts();
  const frame = useCurrentFrame();
  const t = frame / GFPS;
  const band = (a: number, b: number, fin = 0.6, fout = 0.6) =>
    Math.min(prog(t, a - fin, a, easeInOut), 1 - prog(t, b - fout, b, easeInOut));
  const night = band(w('nightday.night'), w('nightday.day') + 0.3, 0.3, 0.5);
  const navy = Math.max(0.25, night * 0.95, band(s('servants'), s('decrease'), 0.6, 1) * 0.55, band(END, 99) * 0.6);
  const warm = Math.max(
    0.3,
    band(0, s('hand') - 0.2) * 0.9,
    band(s('drain'), s('servants')) * 1.1,
    band(w('nightday.day'), s('drain')) * 1.1,
    band(s('decrease'), END) * 0.9,
  );
  const warmY = t < s('hand') - 0.3 ? 62 : t > s('servants') - 0.3 && t < s('decrease') ? 46 : 38;
  const p = {t, frame};
  return (
    <AbsoluteFill>
      <Bg frame={frame} navy={navy} warm={warm} warmY={warmY} />
      <Asking {...p} />
      <Pouring {...p} />
      <Spending {...p} />
      <Plain {...p} />
      <Least {...p} />
      <EndCard {...p} />
      <AbsoluteFill
        style={{
          opacity: 1 - prog(t, END - 0.4, END, easeInOut),
          background: 'linear-gradient(180deg, rgba(10,9,8,0) 64%, rgba(10,9,8,0.55) 71%, rgba(10,9,8,0.55) 80%, rgba(10,9,8,0) 88%)',
        }}
      />
      <Subtitles t={t} />
      <Handle o={1 - prog(t, END - 0.6, END - 0.2, easeInOut)} />
      <Overlay frame={frame} />
      <Audio src={staticFile('generous/mix.wav')} />
    </AbsoluteFill>
  );
};
