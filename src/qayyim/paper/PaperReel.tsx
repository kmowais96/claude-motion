import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ReelTimeline} from '../theme';
import {Camera, cutRect, Fibre, Halftone, P, Paper, Threads, tornRect} from './paper';

/** Stop-motion: time advances in whole steps, so nothing ever glides. */
const stepped = (t: number, step = 2 / 24) => Math.floor(t / step) * step;

/** 0→1 over `dur` from `at`, eased, then held — quantised to the stop-motion step. */
const arrive = (t: number, at: number, dur = 0.42) => {
  const u = Math.min(1, Math.max(0, (stepped(t) - at) / dur));
  return 1 - Math.pow(1 - u, 3);
};

const PHOTO: Record<string, string> = {
  halves: 'paper/ph-shutters.jpg',
  doorShut: 'paper/ph-shut.jpg',
  door: 'paper/ph-ajar.jpg',
  book: 'paper/ph-book.jpg',
  ring: 'paper/ph-lamp.jpg',
  scatter: 'paper/ph-shutters.jpg',
  threshold: 'paper/ph-chained.jpg',
  doorOut: 'paper/ph-ajar.jpg',
  arch: 'paper/ph-arch.jpg',
  line: 'paper/ph-threshold.jpg',
  heart: 'paper/ph-lamp.jpg',
  spark: 'paper/ph-knocker.jpg',
  dawn: 'paper/ph-flood.jpg',
};
const CLOSING = 'paper/ph-closing.jpg';
const CORRIDOR = 'paper/ph-corridor.jpg';

/** A greyscale print on a torn paper mount, arriving with a paper-drag. */
const PhotoCard: React.FC<{
  src: string;
  w: number;
  h: number;
  seed: string;
  k: number;
  rotate?: number;
  from?: number;
  /** keep the print on screen through the cut, so no frame shows an empty slab */
  hold?: boolean;
}> = ({src, w, h, seed, k, rotate = 0, from = -70, hold = false}) => {
  if (k <= 0 && !hold) return null;
  const m = 15;
  return (
    <div
      style={{
        opacity: hold ? 1 : Math.min(1, k * 2.2),
        transform: `translateX(${from * (1 - k)}px) rotate(${rotate}deg) scale(${0.97 + 0.03 * k})`,
      }}
    >
      <Paper w={w} h={h} path={tornRect(w, h, seed, 6)} lift={8} top={P.paper} under={P.accent}>
        <Fibre w={w} h={h} seed={`${seed}-f`} n={36} />
      </Paper>
      <div
        style={{
          position: 'absolute',
          left: m,
          top: m,
          width: w - m * 2,
          height: h - m * 2,
          overflow: 'hidden',
          filter: 'grayscale(1) contrast(1.3)',
          boxShadow: 'inset 0 0 36px rgba(0,0,0,0.55)',
        }}
      >
        <Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </div>
    </div>
  );
};

/** `*word*` is the accent. The strip is torn; the type is not. */
const Caption: React.FC<{text: string; k: number}> = ({text, k}) => {
  if (k <= 0 || !text) return null;
  const parts = text.split(/(\*[^*]+\*)/).filter(Boolean);
  const w = 880;
  const h = text.length > 42 ? 215 : 150;
  return (
    <div
      style={{
        position: 'absolute',
        left: 58,
        bottom: 210,
        opacity: Math.min(1, k * 2.4),
        transform: `translateY(${26 * (1 - k)}px) rotate(-1.1deg)`,
      }}
    >
      <Paper w={w} h={h} path={tornRect(w, h, `cap-${text.length}`, 8)} lift={9} top={P.paper} under={P.accent}>
        <Fibre w={w} h={h} seed="capf" n={44} />
      </Paper>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          padding: '0 46px',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontWeight: 800,
          fontSize: 64,
          lineHeight: 1.08,
          letterSpacing: -1.6,
          color: P.ink,
        }}
      >
        <span>
          {parts.map((p, i) =>
            p.startsWith('*') ? (
              <span key={i} style={{color: P.accentDeep}}>
                {p.slice(1, -1)}
              </span>
            ) : (
              <span key={i}>{p}</span>
            ),
          )}
        </span>
      </div>
    </div>
  );
};

export const PaperReel: React.FC<{tl: ReelTimeline}> = ({tl}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;

  const idx = tl.cards.reduce((acc, c, i) => (t >= c.in ? i : acc), 0);
  const card = tl.cards[idx];
  const k = arrive(t, card.in);
  const photo = PHOTO[card.shape ?? card.motif ?? ''] ?? CORRIDOR;

  // one slow committed camera move per card, reset on the cut
  const local = stepped(t) - card.in;
  const push = interpolate(local, [0, Math.max(1, card.out - card.in)], [0, 1], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });
  const dir = idx % 2 ? -1 : 1;

  const bookIn = tl.book && t >= tl.book.in ? arrive(t, tl.book.in, 0.6) : 0;

  return (
    <AbsoluteFill style={{background: P.slab, overflow: 'hidden'}}>
      {/* newsprint pinned behind, drifting against the subject */}
      <AbsoluteFill style={{filter: 'blur(8px)', opacity: 0.2, transform: `translateX(${push * 16 * dir}px)`}}>
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
            <div style={{height: 24, background: P.ink, opacity: 0.55, marginBottom: 14, width: '70%'}} />
            {Array.from({length: 17}, (__, q) => (
              <div
                key={q}
                style={{
                  height: 5,
                  margin: '9px 0',
                  background: P.ink,
                  opacity: 0.36,
                  width: `${60 + ((q * 31) % 38)}%`,
                }}
              />
            ))}
          </div>
        ))}
      </AbsoluteFill>

      {/* the subject plane, tilted, with the shot's one camera move */}
      <AbsoluteFill style={{perspective: 2000, alignItems: 'center', justifyContent: 'center'}}>
        <div
          style={{
            transform: `rotateX(20deg) rotateZ(${-6 + dir * 1.4}deg) rotateY(${10 - push * 5 * dir}deg) scale(${
              1.16 + push * 0.05
            })`,
            transformStyle: 'preserve-3d',
            position: 'relative',
            width: 840,
            height: 1150,
          }}
        >
          <svg width={840} height={1150} style={{overflow: 'visible', position: 'absolute', inset: 0}}>
            <defs>
              <filter id="slabsh" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx={16} dy={30} stdDeviation={24} floodColor="#000" floodOpacity={0.85} />
              </filter>
            </defs>
            <g filter="url(#slabsh)">
              <path d={tornRect(840, 1150, 'core', 15)} fill={P.paper} transform="translate(-10,-10)" />
              <path d={tornRect(822, 1132, 'slab', 13)} fill={P.slabLit} transform="translate(9,9)" />
              <Fibre w={840} h={1150} seed="slabf" n={150} />
            </g>
          </svg>

          {/* the hero print for this card, plus two supporting ones */}
          <div style={{position: 'absolute', left: 64, top: 120, transform: 'translateZ(40px)'}}>
            <PhotoCard src={photo} w={690} h={520} seed={`hero-${idx}`} k={k} rotate={-1.2} hold />
          </div>
          <div style={{position: 'absolute', left: 108, top: 690, transform: 'translateZ(66px)'}}>
            <PhotoCard
              src={idx < 8 ? CLOSING : 'paper/ph-arch.jpg'}
              w={560} h={300}
              seed={`sub-${idx}`}
              k={arrive(t, card.in + 0.22)}
              rotate={1.3}
              from={70}
            />
          </div>

          {/* extruded icons down the right edge */}
          {[0, 1].map((i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: 762,
                top: 300 + i * 250,
                transform: `translateZ(${110 + i * 18}px) scale(${arrive(t, card.in + 0.3 + i * 0.1)})`,
              }}
            >
              <Paper w={120} h={120} path={cutRect(120, 120)} lift={11} top={P.paper} under={P.accent}>
                <Halftone w={120} h={120} gap={11} r={2.3} />
              </Paper>
            </div>
          ))}
        </div>
      </AbsoluteFill>

      <Caption text={card.text} k={k} />

      {/* the source card, torn, at the end */}
      {bookIn > 0 && tl.book ? (
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', background: 'rgba(20,20,20,0.82)'}}>
          <div style={{opacity: bookIn, transform: `scale(${0.96 + 0.04 * bookIn})`}}>
            <Paper w={820} h={360} path={tornRect(820, 360, 'book', 10)} lift={11} top={P.paper} under={P.accent}>
              <Fibre w={820} h={360} seed="bookf" n={60} />
            </Paper>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 18,
                fontFamily: 'Inter, system-ui, sans-serif',
                color: P.ink,
              }}
            >
              <div style={{fontWeight: 800, fontSize: 56, letterSpacing: -1.4}}>{tl.book.en}</div>
              <div style={{fontSize: 26, letterSpacing: 6, color: P.accentDeep, fontWeight: 700}}>{tl.book.sub}</div>
            </div>
          </div>
        </AbsoluteFill>
      ) : null}

      <Threads w={1080} h={1920} n={7} />
      <Camera w={1080} h={1920} />
    </AbsoluteFill>
  );
};
