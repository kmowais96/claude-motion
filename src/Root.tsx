import React from 'react';
import {Composition, Still} from 'remotion';
import {ArticleCover} from './ArticleCover';
import {EffortVideo} from './EffortVideo';
import {FPS, H, TL, W} from './lib';
import {Corrupters} from './corrupters/Corrupters';
import {CFPS, CH, CT, CW} from './corrupters/lib';

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
      id="Corrupters"
      component={Corrupters}
      durationInFrames={Math.round(CT.duration * CFPS)}
      fps={CFPS}
      width={CW}
      height={CH}
    />
    <Still id="ArticleCover" component={ArticleCover} width={2000} height={800} />
  </>
);
