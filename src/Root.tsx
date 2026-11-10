import React from 'react';
import {Composition, Still} from 'remotion';
import {ArticleCover} from './ArticleCover';
import {EffortVideo} from './EffortVideo';
import {FPS, H, TL, W} from './lib';
import {POISON_FPS, POISON_FRAMES, PoisonReel} from './poison/PoisonReel';

export const Root: React.FC = () => (
  <>
    <Composition
      id="EffortVideo"
      component={EffortVideo}
      durationInFrames={Math.round(TL.duration * FPS)}
      fps={FPS}
      width={W}
      height={H}
    />
    <Composition
      id="PoisonReel"
      component={PoisonReel}
      durationInFrames={POISON_FRAMES}
      fps={POISON_FPS}
      width={1080}
      height={1920}
      defaultProps={{audio: true}}
    />
    <Still id="ArticleCover" component={ArticleCover} width={2000} height={800} />
  </>
);
