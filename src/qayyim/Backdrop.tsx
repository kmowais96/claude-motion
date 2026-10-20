import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Q, QH, QW} from './theme';

/** Eight-point star lattice drifting upward, a lamp glow behind the motif, and a vignette. */
/** `turn` rotates the lattice in 22.5° steps (one per beat on cadence reels). */
export const Backdrop: React.FC<{t: number; glow: number; turn?: number}> = ({t, glow, turn = 0}) => (
  <AbsoluteFill style={{background: Q.bg}}>
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 70% 38% at 50% 30%, rgba(212,168,90,${
          0.05 + 0.17 * glow
        }) 0%, rgba(212,168,90,0) 70%)`,
      }}
    />
    <svg width={QW} height={QH} style={{position: 'absolute', inset: 0}}>
      <defs>
        <pattern
          id="stars"
          width="120"
          height="120"
          patternUnits="userSpaceOnUse"
          patternTransform={`rotate(${turn * 22.5} 540 760) translate(0 ${-t * 6})`}
        >
          <g fill="none" stroke="rgba(212,168,90,0.11)" strokeWidth="1.2">
            <rect x="38" y="38" width="44" height="44" />
            <rect x="38" y="38" width="44" height="44" transform="rotate(45 60 60)" />
            <path d="M0 60 H29 M91 60 H120 M60 0 V29 M60 91 V120" />
          </g>
        </pattern>
        <radialGradient id="starFade" cx="50%" cy="45%" r="65%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="70%" stopColor="#fff" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id="starMask">
          <rect width={QW} height={QH} fill="url(#starFade)" />
        </mask>
      </defs>
      <rect width={QW} height={QH} fill="url(#stars)" mask="url(#starMask)" />
    </svg>
    <AbsoluteFill
      style={{
        background:
          'radial-gradient(ellipse 90% 75% at 50% 48%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.6) 100%)',
      }}
    />
  </AbsoluteFill>
);
