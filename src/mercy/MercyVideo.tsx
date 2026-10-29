import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {easeInOut, prog} from '../lib';
import {useFonts} from '../components/useFonts';
import {Bg, Captions, Handle, Overlay, Stars} from './parts';
import {
  Door,
  EndCard,
  Earth,
  Finale,
  Forgive,
  GlobeIntro,
  Hook,
  Scale,
  Sky,
  skyNavy,
  Twice,
  Weight,
} from './scenes';
import {MFPS, MT} from './theme';

const T = MT;

/** English rebuild of the "sins reaching the clouds" reminder, 1080×1920 at 30 fps. */
export const MercyVideo: React.FC = () => {
  useFonts();
  const frame = useCurrentFrame();
  const t = frame / MFPS;

  // navy: globe + sky; fades as the sins dissolve into mercy
  const navy = Math.min(
    prog(t, T.globe.allah - 0.6, T.globe.allah + 0.8, easeInOut),
    1 - prog(t, T.forgive.asked, T.forgive.asked + 1.5, easeInOut),
  ) * 0.9 + 0.35 * Math.min(prog(t, T.earth.oh - 0.4, T.earth.oh + 0.6, easeInOut), 1 - prog(t, T.earth.end - 0.3, T.earth.end + 0.4, easeInOut));
  const warm = Math.max(
    0.25,
    Math.min(prog(t, T.forgive.asked, T.forgive.asked + 1.2, easeInOut), 1 - prog(t, T.weight.this - 0.3, T.weight.this + 0.6, easeInOut)),
    Math.min(prog(t, T.door.oh, T.door.forgive, easeInOut), 1 - prog(t, T.earth.oh, T.earth.oh + 0.6, easeInOut)),
    prog(t, T.finale.allahs - 0.6, T.finale.allahs + 0.8, easeInOut) * 1.2,
  );
  const shaft = Math.min(prog(t, T.sky.said, T.sky.said + 1, easeInOut), 1 - prog(t, T.forgive.asked, T.forgive.asked + 1, easeInOut)) * (0.5 + 0.5 * skyNavy(t));
  const stars = Math.min(prog(t, T.globe.allah - 0.3, T.globe.allah + 0.8, easeInOut), 1 - prog(t, T.sky.said + 1, T.sky.reach, easeInOut));
  const handleO = 1 - prog(t, T.end.follow - 0.6, T.end.follow - 0.2, easeInOut);
  const capO = 1 - prog(t, T.end.follow - 0.5, T.end.follow - 0.2, easeInOut);

  const p = {t, frame};
  return (
    <AbsoluteFill>
      <Bg frame={frame} navy={navy} warm={warm} shaft={shaft} />
      <Stars o={stars} t={t} />
      <Hook {...p} />
      <Scale {...p} />
      <GlobeIntro {...p} />
      <Sky {...p} />
      <Forgive {...p} />
      <Weight {...p} />
      <Door {...p} />
      <Earth {...p} />
      <Twice {...p} />
      <Finale {...p} />
      <EndCard {...p} />
      <AbsoluteFill
        style={{
          opacity: capO,
          background: 'linear-gradient(180deg, rgba(10,9,8,0) 62%, rgba(10,9,8,0.55) 70%, rgba(10,9,8,0.55) 78%, rgba(10,9,8,0) 88%)',
        }}
      />
      <Handle o={handleO} />
      <Captions t={t} o={capO} />
      <Overlay frame={frame} />
      <Audio src={staticFile('mercy/mix.wav')} />
    </AbsoluteFill>
  );
};
