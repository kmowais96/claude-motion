import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {Grain} from '../components/primitives';
import {Card, Pill, Words} from './BookReel';
import {P, T, useBookFonts} from './theme';
import type {Reel} from './types';

/** Cover still. Everything that matters sits inside the central 1080x1350 that the profile grid shows. */
export const BookCover: React.FC<Reel> = (reel) => {
  useBookFonts();
  return (
    <AbsoluteFill style={{background: P.ink}}>
      {reel.cover.still ? (
        <Img
          src={staticFile(reel.cover.still)}
          style={{width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.05)'}}
        />
      ) : null}
      <div style={{position: 'absolute', left: 90, top: 330}}>
        <Pill reel={reel} />
      </div>
      <div
        style={{
          position: 'absolute',
          right: 90,
          top: 300,
          fontFamily: T.serif,
          fontStyle: 'italic',
          fontWeight: 600,
          fontSize: 250,
          lineHeight: 0.8,
          color: P.gold,
          textShadow: `5px 6px 0 ${P.ink}`,
        }}
      >
        {reel.number ? String(reel.number).padStart(2, '0') : ''}
      </div>
      <Card y={reel.cover.y} k={1} tilt={-0.8} width={920}>
        <Words words={reel.hook} t={0} size={86} timed={false} />
      </Card>
      <div
        style={{
          position: 'absolute',
          left: 90,
          top: 412,
        }}
      >
        <span
          style={{
            background: P.cream,
            color: P.ink,
            borderRadius: 999,
            padding: '10px 26px 12px',
            fontFamily: T.serif,
            fontWeight: 600,
            fontSize: 38,
          }}
        >
          {reel.handle}
        </span>
      </div>
      <Grain frame={0} opacity={0.06} />
    </AbsoluteFill>
  );
};
