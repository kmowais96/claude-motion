import React from 'react';
import {Composition, Still} from 'remotion';
import {ArticleCover} from './ArticleCover';
import {EffortVideo} from './EffortVideo';
import {FPS, H, TL, W} from './lib';
import {RiseVideo, RISE_FPS, RISE_FRAMES} from './rise/RiseVideo';

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
    <Composition id="RiseVideo" component={RiseVideo} durationInFrames={RISE_FRAMES} fps={RISE_FPS} width={1080} height={1920} />
    <Still id="ArticleCover" component={ArticleCover} width={2000} height={800} />
  </>
);
