import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Grain} from '../components/primitives';
import {clamp01, easeOut, lerp, prog} from '../lib';
import {P, SAFE, T, useBookFonts} from './theme';
import type {Arabic, Chunk, Reel, Scene, Word} from './types';

const DISSOLVE = 0.2; // 6 frames at 30 fps

/** One still, pushed or pulled 7% across its scene, dissolving in over the one before. */
const Still: React.FC<{scene: Scene; index: number; t: number}> = ({scene, index, t}) => {
  const k = clamp01((t - scene.start) / (scene.end + DISSOLVE - scene.start));
  const push = index % 2 === 0;
  const scale = push ? lerp(1.05, 1.12, k) : lerp(1.12, 1.05, k);
  const x = lerp(-10, 10, k) * (index % 4 < 2 ? 1 : -1);
  const opacity = index === 0 ? 1 : prog(t, scene.start, scene.start + DISSOLVE, (v) => v);
  return (
    <AbsoluteFill style={{opacity}}>
      <Img
        src={staticFile(scene.still)}
        style={{width: '100%', height: '100%', objectFit: 'cover', transform: `translateX(${x}px) scale(${scale})`}}
      />
    </AbsoluteFill>
  );
};

const Squiggle: React.FC<{k: number}> = ({k}) => (
  <svg
    viewBox="0 0 200 12"
    preserveAspectRatio="none"
    style={{position: 'absolute', left: 0, bottom: '-0.02em', width: '100%', height: '0.16em', overflow: 'visible'}}
  >
    <path
      d="M2 7 Q 14 0 27 7 T 52 7 T 77 7 T 102 7 T 127 7 T 152 7 T 177 7 T 198 6"
      fill="none"
      stroke={P.red}
      strokeWidth={5}
      strokeLinecap="round"
      pathLength={1}
      strokeDasharray={1}
      strokeDashoffset={1 - k}
      vectorEffect="non-scaling-stroke"
    />
  </svg>
);

/** A caption word. Gold words are bigger, italic, with a marker swipe; red words get a squiggle. */
export const CaptionWord: React.FC<{word: Word; t: number; at: number | null; size: number; shown?: boolean}> = ({
  word,
  t,
  at,
  size,
  shown = false,
}) => {
  const k = at === null || shown ? 1 : prog(t, at - 0.06, at + 0.14, easeOut);
  const mark = at === null ? 1 : prog(t, at + 0.04, at + 0.34, easeOut);
  const big = word.style !== 'n';
  return (
    <span
      style={{
        position: 'relative',
        display: 'inline-block',
        opacity: k,
        transform: `translateY(${(1 - k) * 18}px)`,
        fontSize: big ? size * 1.5 : size,
        fontStyle: big ? 'italic' : 'normal',
        fontWeight: big ? 600 : 500,
        // EB Garamond has no U+FDFA; Amiri does
        ...(word.w === 'ﷺ' ? {fontFamily: T.arabic, fontStyle: 'normal', fontWeight: 700, fontSize: size * 1.25} : {}),
        lineHeight: 1.04,
        padding: big ? '0 0.05em' : 0,
        backgroundImage: word.style === 'gold' ? `linear-gradient(${P.goldWash}, ${P.goldWash})` : undefined,
        backgroundRepeat: 'no-repeat',
        backgroundSize: `${mark * 100}% 40%`,
        backgroundPosition: '0 82%',
      }}
    >
      {word.w}
      {word.hon ? (
        <span
          style={{
            fontFamily: T.arabic,
            fontStyle: 'normal',
            fontWeight: 700,
            fontSize: size * 0.62,
            marginLeft: '0.3em',
            direction: 'rtl',
            unicodeBidi: 'isolate',
            whiteSpace: 'nowrap',
          }}
        >
          {word.hon}
        </span>
      ) : null}
      {word.style === 'red' ? <Squiggle k={mark} /> : null}
    </span>
  );
};

/** Cream paper label centred on `y`. Children decide what is written on it. */
export const Card: React.FC<{
  y: number;
  k: number;
  tilt?: number;
  width?: number;
  children: React.ReactNode;
}> = ({y, k, tilt = 0, width = 860, children}) => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      right: 0,
      top: y,
      display: 'flex',
      justifyContent: 'center',
      transform: 'translateY(-50%)',
    }}
  >
    <div
      style={{
        maxWidth: width,
        background: P.cream,
        color: P.ink,
        borderRadius: 14,
        padding: '34px 46px 40px',
        boxShadow: `0 14px 44px ${P.shadow}`,
        opacity: k,
        transform: `scale(${lerp(0.94, 1, k)}) rotate(${tilt}deg)`,
      }}
    >
      {children}
    </div>
  </div>
);

export const Words: React.FC<{words: Word[]; t: number; size: number; timed?: boolean; shown?: boolean}> = ({
  words,
  t,
  size,
  timed = true,
  shown = false,
}) => (
  <div
    style={{
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'baseline',
      columnGap: '0.24em',
      rowGap: '0.08em',
      fontFamily: T.serif,
      fontSize: size,
      letterSpacing: '-0.01em',
      textAlign: 'center',
    }}
  >
    {words.map((w, i) => (
      <CaptionWord key={i} word={w} t={t} at={timed ? (w.t ?? null) : null} size={size} shown={shown} />
    ))}
  </div>
);

const Caption: React.FC<{scene: Scene; chunk: Chunk; index: number; t: number}> = ({scene, chunk, index, t}) => (
  <Card y={scene.y} k={prog(t, chunk.start, chunk.start + 0.16, easeOut)} tilt={index % 2 === 0 ? -0.8 : 0.7}>
    <Words words={chunk.words} t={t} size={70} />
  </Card>
);

/** The on-screen hook: readable on frame 0, the marker lands while the line is spoken. */
const Hook: React.FC<{reel: Reel; scene: Scene; t: number}> = ({reel, scene, t}) => {
  const golds = reel.hook.filter((w) => w.style !== 'n');
  const words = reel.hook.map((w) => ({...w, t: w.style === 'n' ? -1 : 0.35 + golds.indexOf(w) * 0.16}));
  return (
    <Card y={scene.y} k={1} tilt={-0.8} width={900}>
      <Words words={words} t={t} size={78} shown />
    </Card>
  );
};

/** One line of Arabic, wiped in from the right: an ayah (Amiri Quran) or the author's words (Amiri Bold). */
const ArabicLine: React.FC<{arabic: Arabic; t: number}> = ({arabic, t}) => {
  const k = prog(t, arabic.start - 0.1, arabic.start + 0.12, easeOut);
  const wipe = prog(t, arabic.start, arabic.start + 0.9, easeOut);
  const ayah = arabic.kind === 'ayah';
  return (
    <Card y={arabic.y} k={k} width={960}>
      <div
        style={{
          direction: 'rtl',
          textAlign: 'center',
          whiteSpace: 'nowrap',
          fontFamily: ayah ? T.quran : T.arabic,
          fontWeight: ayah ? 400 : 700,
          fontSize: ayah ? 58 : 72,
          lineHeight: ayah ? 1.9 : 1.5,
          clipPath: `inset(-20% 0 -20% ${(1 - wipe) * 100}%)`,
        }}
      >
        {ayah ? `﴿${arabic.text}﴾` : arabic.text}
      </div>
      <div
        style={{
          marginTop: ayah ? 2 : 10,
          textAlign: 'center',
          fontFamily: T.sans,
          fontWeight: 600,
          fontSize: 22,
          letterSpacing: '0.16em',
          color: P.inkSoft,
        }}
      >
        {arabic.ref}
      </div>
    </Card>
  );
};

export const Pill: React.FC<{reel: Reel}> = ({reel}) => (
  <div
    style={{
      display: 'inline-block',
      background: P.ink,
      color: P.cream,
      borderRadius: 999,
      padding: '11px 24px 12px',
      fontFamily: T.sans,
      fontWeight: 600,
      fontSize: 25,
      letterSpacing: '0.1em',
      whiteSpace: 'nowrap',
    }}
  >
    {reel.number ? `${reel.series} · ${String(reel.number).padStart(2, '0')}/${reel.total}` : reel.series}
  </div>
);

/** Tag, open-question badge (until the turn), page chip and the progress line. */
const Chrome: React.FC<{reel: Reel; t: number}> = ({reel, t}) => {
  const asked = 1 - prog(t, reel.turn, reel.turn + 0.3, easeOut);
  const width = SAFE.right - SAFE.left;
  return (
    <>
      <div
        style={{position: 'absolute', left: SAFE.left, top: SAFE.top - 8, width, height: 4, borderRadius: 2, background: P.creamSoft}}
      >
        <div style={{width: `${clamp01(t / reel.endAt) * 100}%`, height: '100%', borderRadius: 2, background: P.gold}} />
      </div>
      <div style={{position: 'absolute', left: SAFE.left, top: SAFE.top + 14, display: 'flex', alignItems: 'center', gap: 12}}>
        <Pill reel={reel} />
        <div
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            background: P.gold,
            color: P.ink,
            fontFamily: T.serif,
            fontWeight: 600,
            fontStyle: 'italic',
            fontSize: 38,
            lineHeight: '48px',
            textAlign: 'center',
            opacity: asked,
            transform: `scale(${lerp(1.5, 1, asked)})`,
          }}
        >
          ?
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          right: 1080 - SAFE.right,
          top: SAFE.top + 14,
          background: P.cream,
          color: P.ink,
          borderRadius: 999,
          padding: '11px 22px 12px',
          fontFamily: T.sans,
          fontWeight: 600,
          fontSize: 25,
          letterSpacing: '0.06em',
          boxShadow: `0 4px 14px ${P.shadow}`,
        }}
      >
        {typeof reel.page === 'number' ? `p. ${reel.page}` : `${reel.book} · ${reel.page}`}
      </div>
    </>
  );
};

const EndCard: React.FC<{reel: Reel; t: number}> = ({reel, t}) => {
  const t0 = reel.endAt;
  const rise = (delay: number): React.CSSProperties => {
    const k = prog(t, t0 + delay, t0 + delay + 0.45, easeOut);
    return {opacity: k, transform: `translateY(${(1 - k) * 26}px)`};
  };
  const words = reel.action.map((w, i) => ({...w, t: t0 + 0.3 + i * 0.07}));
  return (
    <AbsoluteFill style={{background: P.cream, opacity: prog(t, t0, t0 + 0.27, (v) => v)}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 520, textAlign: 'center', ...rise(0.1)}}>
        <Pill reel={reel} />
      </div>
      <div style={{position: 'absolute', left: 110, right: 110, top: 660, color: P.ink}}>
        <Words words={words} t={t} size={92} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: 540 - 70,
          top: 1085,
          width: 140 * prog(t, t0 + 0.8, t0 + 1.3, easeOut),
          height: 5,
          borderRadius: 3,
          background: P.gold,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 1125,
          textAlign: 'center',
          fontFamily: T.sans,
          fontWeight: 600,
          fontSize: 28,
          letterSpacing: '0.14em',
          color: P.inkSoft,
          ...rise(0.9),
        }}
      >
        {reel.book.toUpperCase()} · {typeof reel.page === 'number' ? `P. ${reel.page}` : reel.page.toUpperCase()}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 1180,
          textAlign: 'center',
          fontFamily: T.serif,
          fontStyle: 'italic',
          fontWeight: 500,
          fontSize: 40,
          color: P.inkSoft,
          ...rise(1.0),
        }}
      >
        Educational reminder, not a fatwa.
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 1330,
          textAlign: 'center',
          fontFamily: T.serif,
          fontWeight: 600,
          fontSize: 50,
          color: P.ink,
          ...rise(1.25),
        }}
      >
        {reel.handle}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 110,
          right: 110,
          top: 1408,
          textAlign: 'center',
          fontFamily: T.sans,
          fontWeight: 600,
          fontSize: 27,
          letterSpacing: '0.04em',
          color: P.inkSoft,
          ...rise(1.4),
        }}
      >
        {reel.next}
      </div>
    </AbsoluteFill>
  );
};

export const BookReel: React.FC<Reel> = (reel) => {
  useBookFonts();
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const live = reel.scenes.findIndex((s) => t >= s.start && t < s.end);
  const scene = live === -1 ? null : reel.scenes[live];
  const chunkIndex = scene ? scene.chunks.reduce((acc, c, i) => (t >= c.start ? i : acc), 0) : 0;

  return (
    <AbsoluteFill style={{background: P.ink}}>
      {reel.scenes.map((s, i) =>
        t >= s.start && t < s.end + DISSOLVE ? <Still key={i} scene={s} index={i} t={t} /> : null,
      )}
      {scene?.arabic && t >= scene.arabic.start - 0.1 ? <ArabicLine arabic={scene.arabic} t={t} /> : null}
      {scene && scene.hook ? <Hook reel={reel} scene={scene} t={t} /> : null}
      {scene && !scene.hook && t >= scene.chunks[chunkIndex].start ? (
        <Caption scene={scene} chunk={scene.chunks[chunkIndex]} index={live + chunkIndex} t={t} />
      ) : null}
      <Chrome reel={reel} t={t} />
      {t >= reel.endAt ? <EndCard reel={reel} t={t} /> : null}
      <Grain frame={frame} opacity={0.06} />
    </AbsoluteFill>
  );
};
