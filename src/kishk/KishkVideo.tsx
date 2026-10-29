import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {easeInOut, prog} from '../lib';
import {useFonts} from '../components/useFonts';
import {Bg, Handle, Overlay} from '../mercy/parts';
import {Adam, Army, EndCard, Fire, Gathering, Hourglass, Intro, Names, Peace, Silent, Sufficient, Tyrants} from './scenes';
import {Subtitles} from './ui';
import {END, KEY, KFPS} from './theme';

const s = (k: string) => KEY[k][0];
// lines the scene itself shows in full (the verse, the names), so no subtitle under them
const SHOWN = new Set(['believe', 'verily1', 'verily2', 'verily3', 'tellme']);

/** Sheikh Kishk on the remembrance of Allah: his voice, English on screen. 1080×1920 at 30 fps. */
export const KishkVideo: React.FC = () => {
  useFonts();
  const frame = useCurrentFrame();
  const t = frame / KFPS;
  const band = (a: number, b: number, fin = 0.8, fout = 0.8) =>
    Math.min(prog(t, a - fin, a, easeInOut), 1 - prog(t, b - fout, b, easeInOut));
  const navy = Math.max(0.35, band(s('adam'), s('believe')) * 0.9, band(s('tellme'), END + 4) * 0.8);
  const warm = Math.max(0.2, band(s('companion'), s('none')) * 0.7, band(s('believe'), s('tellme')) * 1.1, band(s('tellme'), END + 4) * 0.6);
  const p = {t, frame};
  return (
    <AbsoluteFill>
      <Bg frame={frame} navy={navy} warm={warm} warmY={38} />
      <Intro {...p} />
      <Sufficient {...p} />
      <Fire {...p} />
      <Adam {...p} />
      <Hourglass {...p} />
      <Gathering {...p} />
      <Tyrants {...p} />
      <Army {...p} />
      <Silent {...p} />
      <Peace {...p} />
      <Names {...p} />
      <EndCard {...p} />
      <AbsoluteFill
        style={{background: 'linear-gradient(180deg, rgba(10,9,8,0) 62%, rgba(10,9,8,0.5) 70%, rgba(10,9,8,0.5) 80%, rgba(10,9,8,0) 90%)'}}
      />
      <Subtitles t={t} hidden={(k) => SHOWN.has(k) || t > s('tellme')} />
      <Handle o={1 - prog(t, END - 0.6, END - 0.2, easeInOut)} />
      <Overlay frame={frame} />
      <Audio src={staticFile('kishk/voice.wav')} />
    </AbsoluteFill>
  );
};
