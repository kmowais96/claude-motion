import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {QH, QW} from '../theme';
import {Camera, cutRect, Fibre, Halftone, P, Paper, Threads, tornRect} from './paper';

/** A photograph as the reference uses one: a greyscale print on a torn paper
 *  mount, with the orange layer showing as an edge beneath it. */
const PhotoCard: React.FC<{
  src: string;
  w: number;
  h: number;
  seed: string;
  rotate?: number;
  lift?: number;
}> = ({src, w, h, seed, rotate = 0, lift = 8}) => {
  const m = 16; // the paper margin around the print
  return (
    <div style={{transform: `rotate(${rotate}deg)`}}>
      <Paper w={w} h={h} path={tornRect(w, h, seed, 6)} lift={lift} top={P.paper} under={P.accent}>
        <Fibre w={w} h={h} seed={`${seed}-f`} n={40} />
      </Paper>
      <div
        style={{
          position: 'absolute',
          left: m,
          top: m,
          width: w - m * 2,
          height: h - m * 2,
          overflow: 'hidden',
          filter: 'grayscale(1) contrast(1.25)',
          boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5)',
        }}
      >
        <Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </div>
    </div>
  );
};

/** One frame of the paper-cut treatment, to judge before anything moves. */
export const PaperTest: React.FC = () => {
  const slabW = 820;
  const slabH = 1180;

  return (
    <AbsoluteFill style={{background: P.slab, overflow: 'hidden'}}>
      {/* newsprint pinned behind: legible as paper, not a grey wash */}
      <AbsoluteFill style={{filter: 'blur(7px)', opacity: 0.22}}>
        {Array.from({length: 9}, (_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: (i % 3) * 400 - 60,
              top: Math.floor(i / 3) * 640 - 30,
              width: 380,
              height: 540,
              background: P.paperDim,
              transform: `rotate(${(i % 2 ? 1 : -1) * (2 + (i % 4))}deg)`,
              boxShadow: '0 24px 50px rgba(0,0,0,0.8)',
              padding: '26px 22px',
            }}
          >
            <div style={{height: 26, background: P.ink, opacity: 0.6, marginBottom: 16, width: '72%'}} />
            {Array.from({length: 18}, (__, k) => (
              <div
                key={k}
                style={{
                  height: 5,
                  margin: '9px 0',
                  background: P.ink,
                  opacity: 0.38,
                  width: `${62 + ((k * 29) % 36)}%`,
                }}
              />
            ))}
          </div>
        ))}
      </AbsoluteFill>

      {/* the subject plane, tilted — never flat-on */}
      <AbsoluteFill style={{perspective: 2000, alignItems: 'center', justifyContent: 'center'}}>
        <div
          style={{
            transform: 'rotateX(22deg) rotateZ(-6deg) rotateY(11deg)',
            transformStyle: 'preserve-3d',
            position: 'relative',
            width: slabW,
            height: slabH,
          }}
        >
          {/* the tray: a dark card slab, torn open to show its cream core */}
          <svg width={slabW} height={slabH} style={{overflow: 'visible', position: 'absolute', inset: 0}}>
            <defs>
              <filter id="slabsh" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx={16} dy={30} stdDeviation={24} floodColor="#000" floodOpacity={0.85} />
              </filter>
            </defs>
            <g filter="url(#slabsh)">
              <path d={tornRect(slabW, slabH, 'core', 14)} fill={P.paper} transform="translate(-10,-10)" />
              <path d={tornRect(slabW - 18, slabH - 18, 'slab', 12)} fill={P.slabLit} transform="translate(9,9)" />
              <Fibre w={slabW} h={slabH} seed="slabf" n={150} />
            </g>
          </svg>

          {/* the photographs, stacked down the tray in perspective */}
          <div style={{position: 'absolute', left: 74, top: 96, transform: 'translateZ(26px)'}}>
            <PhotoCard src="paper/ph-corridor.jpg" w={610} h={330} seed="pc1" rotate={-1.4} />
          </div>
          <div style={{position: 'absolute', left: 96, top: 462, transform: 'translateZ(44px)'}}>
            <PhotoCard src="paper/ph-shut.jpg" w={600} h={320} seed="pc2" rotate={1.1} />
          </div>
          <div style={{position: 'absolute', left: 70, top: 808, transform: 'translateZ(66px)'}}>
            <PhotoCard src="paper/ph-ajar.jpg" w={620} h={330} seed="pc3" rotate={-0.7} lift={10} />
          </div>

          {/* extruded icons down the right edge, as the reference stacks them */}
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: slabW - 96,
                top: 300 + i * 230,
                transform: `translateZ(${100 + i * 16}px)`,
              }}
            >
              <Paper w={132} h={132} path={cutRect(132, 132)} lift={12} top={P.paper} under={P.accent}>
                <Halftone w={132} h={132} gap={11} r={2.4} />
              </Paper>
            </div>
          ))}
        </div>
      </AbsoluteFill>

      {/* the caption: a torn strip, flat to camera so it stays readable */}
      <div style={{position: 'absolute', left: 54, bottom: 190}}>
        <Paper w={760} h={140} path={tornRect(760, 140, 'cap', 8)} lift={9} top={P.paper} under={P.accent}>
          <Fibre w={760} h={140} seed="capf" n={48} />
        </Paper>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 40,
            fontFamily: 'Inter, system-ui, sans-serif',
            fontWeight: 800,
            fontSize: 58,
            letterSpacing: -1.5,
            color: P.ink,
          }}
        >
          His door is the&nbsp;<span style={{color: P.accentDeep}}>opposite.</span>
        </div>
      </div>

      <Threads w={QW} h={QH} n={7} />
      <Camera w={QW} h={QH} />
    </AbsoluteFill>
  );
};
