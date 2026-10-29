import React from 'react';
import {Composition, Still} from 'remotion';
import {ArticleCover} from './ArticleCover';
import {EffortVideo} from './EffortVideo';
import {FPS, H, TL, W} from './lib';
import {BusinessShort} from './business/BusinessShort';
import {BFPS, BH, BT, BW} from './business/theme';

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
      id="BusinessShort"
      component={BusinessShort}
      durationInFrames={Math.round(BT.duration * BFPS)}
      fps={BFPS}
      width={BW}
      height={BH}
    />
    <Still id="ArticleCover" component={ArticleCover} width={2000} height={800} />
  </>
);
