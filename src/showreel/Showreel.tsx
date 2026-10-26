import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {useFonts} from '../components/useFonts';
import {C, cl, Finish, FM, out5, ramp, RH, RW} from './kit';
import {Arcs, Bars, Burst, Converge, Iso, Line, Morph, Panels, Ripple, Sign, Slam, Type} from './scenes';

/**
 * Fifteen seconds, twelve beats. The cut rate accelerates through the middle and
 * then stops dead for the one quiet beat, because a reel that never lets up reads
 * as panic rather than control.
 */
const BEATS: {at: number; C: React.FC<{t: number; d: number}>; flash?: boolean}[] = [
  {at: 0.0, C: Slam},
  {at: 1.5, C: Arcs},
  {at: 3.0, C: Ripple, flash: true},
  {at: 4.2, C: Type},
  {at: 5.7, C: Bars},
  {at: 7.0, C: Iso},
  {at: 8.2, C: Converge},
  {at: 9.5, C: Morph, flash: true},
  {at: 10.6, C: Panels},
  {at: 11.5, C: Burst, flash: true},
  {at: 11.9, C: Line},
  {at: 13.5, C: Sign},
];
const END = 15;

export const Showreel: React.FC = () => {
  useFonts();
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;

  const i = BEATS.reduce((a, b, k) => (t >= b.at ? k : a), 0);
  const beat = BEATS[i];
  const next = BEATS[i + 1]?.at ?? END;
  const local = t - beat.at;
  const dur = next - beat.at;

  // a two-frame white bar on the hardest cuts, and nowhere else
  const cut = beat.flash ? cl(1 - local / (2 / fps)) : 0;

  // the whole frame breathes a half percent on every cut, so the edit has weight
  const settle = 1 + 0.006 * (1 - ramp(local, 0, 0.5, out5));

  return (
    <AbsoluteFill style={{background: C.bg, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${settle})`}}>
        <beat.C t={local} d={dur} />
      </AbsoluteFill>

      {/* a fixed frame of furniture: this is a reel, and it says so quietly */}
      <svg width={RW} height={RH} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
        <rect x={56} y={56} width={RW - 112} height={RH - 112} fill="none" stroke={C.rule} strokeWidth={1} />
        <rect x={56} y={56} width={(RW - 112) * cl(t / END)} height={2} fill={C.hot} />
      </svg>
      <div
        style={{
          position: 'absolute',
          right: 76,
          bottom: 70,
          fontFamily: FM,
          fontSize: 22,
          letterSpacing: 4,
          color: C.dim,
        }}
      >
        {String(i + 1).padStart(2, '0')} / {String(BEATS.length).padStart(2, '0')}
      </div>

      <div style={{position: 'absolute', inset: 0, background: C.ink, opacity: cut, pointerEvents: 'none'}} />
      <Finish f={frame} />
    </AbsoluteFill>
  );
};
