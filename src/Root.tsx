import React from 'react';
import {Composition, Still} from 'remotion';
import {ArticleCover} from './ArticleCover';
import {EffortVideo} from './EffortVideo';
import {FPS, H, TL, W} from './lib';
import {MANNERS_FPS, MANNERS_FRAMES, MannersShort} from './manners/MannersShort';
import {SAMESIN_FPS, SAMESIN_FRAMES, SameSinShort} from './samesin/SameSinShort';
import {REEL_FPS, REEL_FRAMES, SameSinReel} from './samesin2/SameSinReel';

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
      id="MannersShort"
      component={MannersShort}
      durationInFrames={MANNERS_FRAMES}
      fps={MANNERS_FPS}
      width={1080}
      height={1920}
      defaultProps={{audio: true}}
    />
    <Composition
      id="SameSinShort"
      component={SameSinShort}
      durationInFrames={SAMESIN_FRAMES}
      fps={SAMESIN_FPS}
      width={1080}
      height={1920}
      defaultProps={{audio: true}}
    />
    <Composition
      id="SameSinReel"
      component={SameSinReel}
      durationInFrames={REEL_FRAMES}
      fps={REEL_FPS}
      width={1080}
      height={1920}
      defaultProps={{audio: true}}
    />
    <Still id="ArticleCover" component={ArticleCover} width={2000} height={800} />
  </>
);
