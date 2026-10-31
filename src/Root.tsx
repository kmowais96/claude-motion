import React from 'react';
import {Composition, Still} from 'remotion';
import {ArticleCover} from './ArticleCover';
import {EffortVideo} from './EffortVideo';
import {FPS, H, TL, W} from './lib';
import {MercyVideo} from './mercy/MercyVideo';
import {KishkVideo} from './kishk/KishkVideo';
import {KFPS, KT} from './kishk/theme';
import {GenerousVideo} from './generous/GenerousVideo';
import {GFPS, GT} from './generous/theme';
import {MFPS, MH, MT, MW} from './mercy/theme';
import {GiftVideo} from './gift/GiftVideo';
import {AFPS, AT} from './gift/theme';

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
    <Composition
      id="KishkVideo"
      component={KishkVideo}
      durationInFrames={Math.round(KT.duration * KFPS)}
      fps={KFPS}
      width={MW}
      height={MH}
    />
    <Composition
      id="GenerousVideo"
      component={GenerousVideo}
      durationInFrames={Math.round(GT.duration * GFPS)}
      fps={GFPS}
      width={MW}
      height={MH}
    />
    <Composition
      id="GiftVideo"
      component={GiftVideo}
      durationInFrames={Math.round(AT.duration * AFPS)}
      fps={AFPS}
      width={MW}
      height={MH}
    />
    <Still id="ArticleCover" component={ArticleCover} width={2000} height={800} />
  </>
);
