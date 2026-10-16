import React from 'react';
import {Composition, Still} from 'remotion';
import {ArticleCover} from './ArticleCover';
import {EffortVideo} from './EffortVideo';
import {DeebachaVideo} from './deebacha/DeebachaVideo';
import * as DB from './deebacha/kit';
import {FPS, H, TL, W} from './lib';

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
      id="Deebacha"
      component={DeebachaVideo}
      durationInFrames={DB.DURATION * DB.FPS}
      fps={DB.FPS}
      width={DB.W}
      height={DB.H}
    />
    <Still id="ArticleCover" component={ArticleCover} width={2000} height={800} />
  </>
);
