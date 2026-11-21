import React from 'react';
import {Composition, Still} from 'remotion';
import {ArticleCover} from './ArticleCover';
import {BookCover} from './bookreel/BookCover';
import {BookReel} from './bookreel/BookReel';
import {EMPTY} from './bookreel/types';
import {EffortVideo} from './EffortVideo';
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
    <Still id="ArticleCover" component={ArticleCover} width={2000} height={800} />
    {/* Book Reels: props come from scripts/bookreel.py (--props=public/bookreel/<id>/timeline.json) */}
    <Composition
      id="BookReel"
      component={BookReel}
      defaultProps={EMPTY}
      calculateMetadata={({props}) => ({durationInFrames: Math.round(props.duration * props.fps), fps: props.fps})}
      durationInFrames={120}
      fps={30}
      width={1080}
      height={1920}
    />
    <Still id="BookCover" component={BookCover} defaultProps={EMPTY} width={1080} height={1920} />
  </>
);
