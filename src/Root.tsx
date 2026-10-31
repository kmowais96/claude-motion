import React from 'react';
import {Composition, Still} from 'remotion';
import {ArticleCover} from './ArticleCover';
import {EffortVideo} from './EffortVideo';
import {FPS, H, TL, W} from './lib';
import {NewbornShort, NEWBORN_FPS, NEWBORN_FRAMES} from './newborn/NewbornShort';
import {NamingShort, NAMING_FPS, NAMING_FRAMES} from './naming/NamingShort';

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
    <Composition id="NewbornShort" component={NewbornShort} durationInFrames={NEWBORN_FRAMES} fps={NEWBORN_FPS} width={1080} height={1920} />
    <Composition id="NamingShort" component={NamingShort} durationInFrames={NAMING_FRAMES} fps={NAMING_FPS} width={1080} height={1920} />
    <Still id="ArticleCover" component={ArticleCover} width={2000} height={800} />
  </>
);
