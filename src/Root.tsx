import React from 'react';
import {Composition, Still} from 'remotion';
import {ArticleCover} from './ArticleCover';
import {EffortVideo} from './EffortVideo';
import {FPS, H, TL, W} from './lib';
import {SabireenShort, sabireenFrames} from './sabireen/SabireenShort';

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
      id="SabireenShort"
      component={SabireenShort}
      durationInFrames={sabireenFrames}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{audio: false}}
    />
    <Still id="ArticleCover" component={ArticleCover} width={2000} height={800} />
  </>
);
