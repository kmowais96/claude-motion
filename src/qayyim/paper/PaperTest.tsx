import React from 'react';
import {AbsoluteFill} from 'remotion';
import {QH, QW} from '../theme';
import {Camera, cutRect, Fibre, Halftone, P, Paper, Threads, tornRect} from './paper';

/**
 * One frame of the paper-cut treatment, to judge the look before any of it moves:
 * a door built from layered card on a tilted plane, with the caption as a torn
 * paper strip. Everything here is a stack of paper, never a flat shape.
 */
export const PaperTest: React.FC = () => {
  const slabW = 760;
  const slabH = 980;
  const openW = 330;
  const openH = 700;

  return (
    <AbsoluteFill style={{background: P.slab, overflow: 'hidden'}}>
      {/* out-of-focus newsprint pinned behind everything */}
      <AbsoluteFill style={{filter: 'blur(14px)', opacity: 0.3}}>
        {Array.from({length: 8}, (_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: (i % 3) * 400 - 90 + i * 11,
              top: Math.floor(i / 3) * 560 + 40,
              width: 360,
              height: 470,
              background: P.paperDim,
              transform: `rotate(${(i % 2 ? 1 : -1) * (2 + i)}deg)`,
              boxShadow: '0 30px 60px rgba(0,0,0,0.7)',
            }}
          >
            {Array.from({length: 16}, (__, k) => (
              <div
                key={k}
                style={{
                  height: 6,
                  margin: '14px 22px',
                  background: P.ink,
                  opacity: 0.34,
                  width: `${55 + ((k * 37) % 40)}%`,
                }}
              />
            ))}
          </div>
        ))}
      </AbsoluteFill>

      {/* the subject plane is tilted — the camera looks down and across it */}
      <AbsoluteFill
        style={{
          perspective: 1800,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            transform: 'rotateX(26deg) rotateZ(-7deg) rotateY(9deg)',
            transformStyle: 'preserve-3d',
            position: 'relative',
          }}
        >
          {/* the wall: a dark card slab with a torn opening cut out of it */}
          <svg width={slabW + 60} height={slabH + 60} style={{overflow: 'visible', display: 'block'}}>
            <defs>
              <filter id="slabsh" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx={18} dy={34} stdDeviation={26} floodColor="#000" floodOpacity={0.8} />
              </filter>
              <mask id="cutout">
                <rect width={slabW} height={slabH} fill="#fff" />
                <path
                  d={tornRect(openW, openH, 'door-open', 11)}
                  fill="#000"
                  transform={`translate(${(slabW - openW) / 2},${(slabH - openH) / 2})`}
                />
              </mask>
            </defs>

            {/* the light coming through the opening, on the paper beneath */}
            <g transform={`translate(${(slabW - openW) / 2},${(slabH - openH) / 2})`}>
              <path d={tornRect(openW + 26, openH + 26, 'glowpad', 13)} fill={P.accentDeep} opacity={0.9} transform="translate(-13,-13)" />
              <path d={tornRect(openW, openH, 'glow', 11)} fill={P.accent} />
              <path d={tornRect(openW - 40, openH - 44, 'glowin', 9)} fill="#F0A070" opacity={0.85} transform="translate(20,22)" />
            </g>

            <g filter="url(#slabsh)" mask="url(#cutout)">
              <path d={tornRect(slabW, slabH, 'slab', 13)} fill={P.slabLit} />
              <Fibre w={slabW} h={slabH} seed="slabf" n={160} />
            </g>

            {/* the cream core of the card, showing where it was torn */}
            <g transform={`translate(${(slabW - openW) / 2 - 7},${(slabH - openH) / 2 - 7})`} opacity={0.95}>
              <path
                d={tornRect(openW + 14, openH + 14, 'core', 12)}
                fill="none"
                stroke={P.paper}
                strokeWidth={9}
              />
            </g>
          </svg>

          {/* the door itself: a layered card leaf, swung open on its hinge */}
          <div
            style={{
              position: 'absolute',
              left: (slabW - openW) / 2 - 6,
              top: (slabH - openH) / 2,
              transformOrigin: 'left center',
              transform: 'rotateY(-52deg) translateZ(30px)',
            }}
          >
            <Paper w={openW} h={openH} path={tornRect(openW, openH, 'leaf', 8)} lift={9} top={P.paperDim} under={P.accentDeep}>
              <Halftone w={openW} h={openH} gap={13} r={1.8} />
            </Paper>
          </div>

          {/* the caption, a torn strip laid across the lower plane */}
          <div style={{position: 'absolute', left: -70, top: slabH - 170, transform: 'translateZ(60px) rotateZ(-2deg)'}}>
            <Paper w={690} h={132} path={tornRect(690, 132, 'cap', 7)} lift={8} top={P.paper} under={P.accent}>
              <Fibre w={690} h={132} seed="capf" n={50} />
            </Paper>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                paddingLeft: 42,
                fontFamily: 'Inter, system-ui, sans-serif',
                fontWeight: 800,
                fontSize: 52,
                letterSpacing: -1,
                color: P.ink,
              }}
            >
              His door is the&nbsp;<span style={{color: P.accentDeep}}>opposite.</span>
            </div>
          </div>

          {/* one extruded icon, the way the reference stacks them */}
          <div style={{position: 'absolute', left: slabW - 40, top: 210, transform: 'translateZ(90px)'}}>
            <Paper w={150} h={150} path={cutRect(150, 150)} lift={11} top={P.paper} under={P.accent}>
              <Halftone w={150} h={150} />
            </Paper>
          </div>
        </div>
      </AbsoluteFill>

      <Threads w={QW} h={QH} n={8} />
      <Camera w={QW} h={QH} />
    </AbsoluteFill>
  );
};
