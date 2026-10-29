import React from 'react';
import {Composition, Still} from 'remotion';
import {ArticleCover} from './ArticleCover';
import {EffortVideo} from './EffortVideo';
import {FPS, H, TL, W} from './lib';
import {MercyVideo} from './mercy/MercyVideo';
import {MFPS, MH, MT, MW} from './mercy/theme';

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
      id="MercyVideo"
      component={MercyVideo}
      durationInFrames={Math.round(MT.duration * MFPS)}
      fps={MFPS}
      width={MW}
      height={MH}
    />
    <Still id="ArticleCover" component={ArticleCover} width={2000} height={800} />
  </>
);
