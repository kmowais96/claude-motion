import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {useFonts} from '../components/useFonts';
import {back, cl, Draw, Finish, FM, FR, FS, inOut, Letters, mix, out3, out5, pulse, ramp, rnd, rr, spring, stag, Trail} from './kit';

const W = 1080;
const H = 1920;

/** Near-black, bone, and lamp-gold. The showreel's vermilion is too loud for this. */
const C = {
  bg: '#0A0A0C',
  ink: '#F2F1ED',
  dim: '#4E4E58',
  rule: '#1F1F27',
  hot: '#E0A84B',
  deep: '#8A6420',
};

type S = {t: number; d: number};

/** 1 — Nothing moves. A rule, a place, a date. */
const Open: React.FC<S> = ({t}) => {
  const k = ramp(t, 0.2, 1.6, out5);
  return (
    <>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <rect x={W / 2 - (520 * k) / 2} y={H / 2} width={520 * k} height={2} fill={C.dim} />
      </svg>
      <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{fontFamily: FM, fontSize: 30, letterSpacing: 14, color: C.dim, opacity: ramp(t, 0.5, 1.8), marginBottom: 54}}>
          11 AH · MADINAH
        </div>
        <div style={{height: 2}} />
        <div style={{fontFamily: FR, fontSize: 74, color: C.ink, opacity: ramp(t, 1.4, 2.8), marginTop: 54}}>a Monday</div>
      </div>
    </>
  );
};

/** 2 — A blade: one hard diagonal, trailing itself. */
const Blade: React.FC<S> = ({t}) => (
  <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
    <Trail
      t={t}
      n={11}
      step={0.014}
      render={(tt) => {
        const k = ramp(tt, 0, 0.3, out5);
        const x1 = mix(-200, W * 0.2, k);
        const y1 = mix(H * 0.18, H * 0.3, k);
        const L = 1500 * k;
        return <line x1={x1} y1={y1} x2={x1 + L * 0.62} y2={y1 + L * 0.78} stroke={C.ink} strokeWidth={7} />;
      }}
    />
    <line
      x1={W * 0.2}
      y1={H * 0.3}
      x2={W * 0.2 + 930}
      y2={H * 0.3 + 1170}
      stroke={C.hot}
      strokeWidth={3}
      opacity={ramp(t, 0.22, 0.6) * (1 - ramp(t, 2.2, 3.4))}
    />
  </svg>
);

/** 3 — The same line, breaking into shards that will not hold. */
const Fracture: React.FC<S> = ({t, d}) => {
  const n = 22;
  const k = ramp(t, 0.05, 0.9, out3);
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
      {Array.from({length: n}, (_, i) => {
        const u = i / n;
        const bx = mix(W * 0.14, W * 0.86, u);
        const by = mix(H * 0.26, H * 0.74, u);
        const sp = rr(-1, 1, 'fx', i);
        const dx = sp * 150 * k;
        const dy = rr(-1, 1, 'fy', i) * 70 * k;
        const rot = sp * 26 * k;
        const seg = 62;
        return (
          <g key={i} transform={`translate(${bx + dx} ${by + dy}) rotate(${38 + rot})`} opacity={1 - 0.45 * k}>
            <line x1={-seg / 2} y1={0} x2={seg / 2} y2={0} stroke={i % 6 === 0 ? C.hot : C.ink} strokeWidth={i % 6 === 0 ? 6 : 4} />
          </g>
        );
      })}
      <circle cx={W / 2} cy={H / 2} r={3} fill={C.hot} opacity={pulse(t, 0, d) * 0.6} />
    </svg>
  );
};

/** 4 — A circle draws, steady, taking its time. */
const Arrive: React.FC<S> = ({t}) => {
  const r = 320;
  const len = 2 * Math.PI * r;
  const p = ramp(t, 0.05, 1.5, inOut);
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
      <circle cx={W / 2} cy={H / 2} r={r} fill="none" stroke={C.rule} strokeWidth={1} />
      <g transform={`rotate(-90 ${W / 2} ${H / 2})`}>
        <Draw d={`M${W / 2},${H / 2 - r} A${r},${r} 0 1 1 ${W / 2 - 0.01},${H / 2 - r}`} p={p} len={len} w={5} color={C.ink} cap="round" />
      </g>
      <circle cx={W / 2} cy={H / 2} r={5 * spring(ramp(t, 0.3, 0.9))} fill={C.hot} />
    </svg>
  );
};

/** 5 — A covering lifts: a mask rising off what is beneath. */
const Uncover: React.FC<S> = ({t}) => {
  const k = ramp(t, 0.1, 1.2, inOut);
  const r = 320;
  return (
    <>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <circle cx={W / 2} cy={H / 2} r={r} fill="none" stroke={C.ink} strokeWidth={5} />
        <circle cx={W / 2} cy={H / 2} r={r * 0.58} fill="none" stroke={C.hot} strokeWidth={2} opacity={0.25 + 0.5 * k} />
        {Array.from({length: 7}, (_, i) => (
          <line
            key={i}
            x1={W / 2 - r * 0.52}
            y1={H / 2 - 120 + i * 40}
            x2={W / 2 + r * 0.52}
            y2={H / 2 - 120 + i * 40}
            stroke={C.hot}
            strokeWidth={1.5}
            opacity={stag(t, 0.5, i, 0.06, 0.6) * 0.5}
          />
        ))}
      </svg>
      {/* the covering: a sheet drawn upward off what is beneath, its edge catching light */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: C.bg,
          transform: `translateY(${-k * H}px)`,
          borderBottom: `3px solid ${C.ink}`,
          boxShadow: `0 26px 60px rgba(0,0,0,0.95)`,
        }}
      />
    </>
  );
};

/** 6 — One point meets the edge, and the whole form answers. */
const Touch: React.FC<S> = ({t}) => {
  const r = 320;
  const k = ramp(t, 0.1, 0.5, out5);
  const ring = ramp(t, 0.42, 1.3, out5);
  const py = H / 2 - r;
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
      <circle cx={W / 2} cy={H / 2} r={r} fill="none" stroke={C.ink} strokeWidth={5} />
      <circle cx={W / 2} cy={mix(py - 260, py, k)} r={9} fill={C.hot} opacity={cl(k * 2)} />
      <circle cx={W / 2} cy={py} r={mix(0, 300, ring)} fill="none" stroke={C.hot} strokeWidth={mix(5, 0.4, ring)} opacity={1 - ring} />
    </svg>
  );
};

/** 7 — Weeping, as weight: slow verticals falling off the form. */
const Fall: React.FC<S> = ({t, d}) => {
  const r = 320;
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
      <circle cx={W / 2} cy={H / 2} r={r} fill="none" stroke={C.ink} strokeWidth={5} opacity={0.85} />
      {Array.from({length: 9}, (_, i) => {
        const a = Math.PI * (0.18 + 0.64 * (i / 8));
        const x = W / 2 + Math.cos(a) * r;
        const y0 = H / 2 + Math.sin(a) * r;
        const k = stag(t, 0.08, i, 0.07, 0.9, out3);
        return (
          <line key={i} x1={x} y1={y0} x2={x} y2={y0 + 190 * k} stroke={C.hot} strokeWidth={2.4} opacity={(1 - k * 0.55) * 0.85} />
        );
      })}
    </svg>
  );
};

/** 8 — The sentence being readied: a frame assembling around nothing yet. */
const Ready: React.FC<S> = ({t}) => {
  const k = ramp(t, 0.1, 1.1, out5);
  const bw = 880;
  const bh = 420;
  const x = (W - bw) / 2;
  const y = (H - bh) / 2;
  return (
    <>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <line x1={x} y1={y} x2={x + bw * k} y2={y} stroke={C.ink} strokeWidth={4} />
        <line x1={x + bw} y1={y} x2={x + bw} y2={y + bh * k} stroke={C.ink} strokeWidth={4} />
        <line x1={x + bw} y1={y + bh} x2={x + bw - bw * k} y2={y + bh} stroke={C.ink} strokeWidth={4} />
        <line x1={x} y1={y + bh} x2={x} y2={y + bh - bh * k} stroke={C.ink} strokeWidth={4} />
      </svg>
      <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{fontFamily: FM, fontSize: 28, letterSpacing: 12, color: C.dim, opacity: ramp(t, 0.9, 1.9)}}>ONE SENTENCE</div>
      </div>
    </>
  );
};

/** 9 — The name, set large, whole. */
const Name: React.FC<S> = ({t}) => (
  <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 30}}>
    <div style={{fontFamily: FM, fontSize: 26, letterSpacing: 10, color: C.dim, opacity: ramp(t, 0.05, 0.6)}}>WHOEVER WORSHIPPED</div>
    <div style={{display: 'flex'}}>
      <Letters text="MUHAMMAD" t={t} at={0.16} size={132} step={0.03} color={C.ink} from={60} />
    </div>
  </div>
);

/** 10 — And the same name coming apart, grain by grain. */
const Erode: React.FC<S> = ({t, d}) => {
  const k = ramp(t, 0.04, 1.38, out3);
  const n = 180;
  return (
    <>
      <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 1 - cl(k * 1.08)}}>
        <div style={{fontFamily: FS, fontWeight: 900, fontSize: 132, letterSpacing: -5, color: C.ink}}>MUHAMMAD</div>
      </div>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        {Array.from({length: n}, (_, i) => {
          const x0 = rr(W * 0.1, W * 0.9, 'ex', i);
          const y0 = H / 2 + rr(-62, 62, 'ey', i);
          const kk = cl(k * 1.15 - rnd('ed', i) * 0.35);
          return (
            <rect
              key={i}
              x={x0 + rr(-40, 240, 'edx', i) * kk}
              y={y0 + rr(-130, 130, 'edy', i) * kk}
              width={rr(3, 11, 'ew', i)}
              height={rr(3, 9, 'eh', i)}
              fill={i % 11 === 0 ? C.hot : C.ink}
              opacity={(1 - kk * 0.82) * 0.95}
            />
          );
        })}
      </svg>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 420, textAlign: 'center', fontFamily: FM, fontSize: 38, letterSpacing: 12, color: C.ink, opacity: ramp(t, 0.42, 0.95)}}>
        HAS DIED
      </div>
    </>
  );
};

/** 11 — A ring that does not break, and breathes. */
const Alive: React.FC<S> = ({t, d}) => {
  const r = 300;
  const len = 2 * Math.PI * r;
  const p = ramp(t, 0.05, 1.4, inOut);
  const breathe = 1 + 0.03 * Math.sin(t * 2.0);
  return (
    <>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <g transform={`translate(${W / 2} ${H / 2}) scale(${breathe})`}>
          {[0, 1, 2].map((i) => (
            <circle key={i} r={r + i * 34} fill="none" stroke={C.rule} strokeWidth={1} opacity={ramp(t, 0.3 + i * 0.2, 1.2 + i * 0.2)} />
          ))}
          <g transform="rotate(-90)">
            <Draw d={`M0,${-r} A${r},${r} 0 1 1 -0.01,${-r}`} p={p} len={len} w={8} color={C.hot} cap="round" />
          </g>
        </g>
      </svg>
      <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22}}>
        <div style={{fontFamily: FS, fontWeight: 900, fontSize: 96, letterSpacing: -3, color: C.ink, opacity: ramp(t, 0.9, 1.7)}}>ALLAH</div>
        <div style={{fontFamily: FM, fontSize: 28, letterSpacing: 9, color: C.hot, opacity: ramp(t, 1.4, 2.3)}}>IS ALIVE</div>
      </div>
    </>
  );
};

/** 12 — A column takes weight it cannot take. */
const Buckle: React.FC<S> = ({t, d}) => {
  const n = 13;
  const k = ramp(t, 0.1, d * 0.85, inOut);
  const top = H * 0.26;
  const seg = (H * 0.46) / n;
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
      {Array.from({length: n}, (_, i) => {
        const u = i / (n - 1);
        const bend = Math.sin(u * Math.PI) * 180 * k;
        const drop = u * u * 150 * k;
        return (
          <rect
            key={i}
            x={W / 2 - 74 + bend}
            y={top + i * seg + drop}
            width={148}
            height={seg * 0.44}
            fill={i === n - 1 ? C.hot : C.ink}
            rx={3}
            stroke={C.bg}
            strokeWidth={2}
            opacity={0.5 + 0.5 * (1 - u)}
            transform={`rotate(${bend * 0.06} ${W / 2 + bend} ${top + i * seg})`}
          />
        );
      })}
    </svg>
  );
};

/** 13 — The ground, met hard. */
const Ground: React.FC<S> = ({t}) => {
  const hit = cl(1 - t / 0.1); // decays; ramp() would hold at 1 forever
  const sh = ramp(t, 0.1, 1.0, out3);
  const y = H * 0.68;
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
      <rect x={0} y={y} width={W} height={4} fill={C.ink} opacity={0.9} />
      {Array.from({length: 30}, (_, i) => {
        const a = Math.PI * (1.08 + 0.84 * (i / 29));
        const L = mix(0, 230, sh) * rr(0.3, 1, 'g', i);
        return (
          <line
            key={i}
            x1={W / 2}
            y1={y}
            x2={W / 2 + Math.cos(a) * L}
            y2={y + Math.sin(a) * L * 0.5}
            stroke={i % 8 === 0 ? C.hot : C.ink}
            strokeWidth={i % 8 === 0 ? 3 : 1.4}
            opacity={(1 - sh) * 0.8}
          />
        );
      })}
      <circle cx={W / 2} cy={y} r={mix(10, 300, sh)} fill="none" stroke={C.ink} strokeWidth={mix(9, 0.4, sh)} opacity={1 - sh} />
      <rect x={0} y={0} width={W} height={H} fill={C.ink} opacity={hit * 0.16} />
    </svg>
  );
};

/** 14 — Held. The word, and nothing else. */
const Word: React.FC<S> = ({t}) => {
  const k = ramp(t, 0.08, 1.0, out5);
  return (
    <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 34}}>
      <div style={{display: 'flex'}}>
        <Letters text="TAWAKKUL" t={t} at={0.06} size={148} step={0.038} color={C.ink} from={40} />
      </div>
      <div style={{width: 520 * k, height: 3, background: C.hot}} />
      <div style={{fontFamily: FR, fontSize: 50, color: C.dim, opacity: ramp(t, 0.7, 1.5)}}>reliance</div>
    </div>
  );
};

/** 15 — Two forms. One of them goes. */
const Two: React.FC<S> = ({t, d}) => {
  const go = ramp(t, 0.9, d, inOut);
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
      <circle cx={W / 2 - 180} cy={H / 2} r={168} fill="none" stroke={C.ink} strokeWidth={5} opacity={1 - go} transform={`translate(${-go * 240} 0)`} />
      <circle cx={W / 2 + 180} cy={H / 2} r={168} fill="none" stroke={C.hot} strokeWidth={6} />
      <circle cx={W / 2 + 180} cy={H / 2} r={6} fill={C.hot} />
    </svg>
  );
};

/** 16 — What is left, and the source. */
const Remains: React.FC<S> = ({t}) => {
  const k = ramp(t, 0.05, 1.1, out5);
  const breathe = 1 + 0.02 * Math.sin(t * 1.7);
  return (
    <>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <g transform={`translate(${W / 2} ${H / 2 - 60}) scale(${breathe})`}>
          <circle r={168} fill="none" stroke={C.hot} strokeWidth={6} />
          <circle r={mix(0, 340, k)} fill="none" stroke={C.hot} strokeWidth={1} opacity={(1 - k) * 0.6} />
          <circle r={6} fill={C.hot} />
        </g>
      </svg>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 300, textAlign: 'center'}}>
        <div style={{fontFamily: FR, fontSize: 62, color: C.ink, opacity: ramp(t, 0.4, 1.4)}}>What holds when he is gone.</div>
        <div style={{marginTop: 46, fontFamily: FM, fontSize: 24, letterSpacing: 8, color: C.dim, opacity: ramp(t, 1.3, 2.2)}}>
          SAHIH AL-BUKHARI 3667–3668
        </div>
      </div>
    </>
  );
};

// the narration's own pauses, measured off the take
const BEATS: {at: number; C: React.FC<S>}[] = [
  {at: 0.0, C: Open},
  {at: 3.67, C: Blade},
  {at: 7.48, C: Fracture},
  {at: 10.75, C: Arrive},
  {at: 12.48, C: Uncover},
  {at: 14.07, C: Touch},
  {at: 15.57, C: Fall},
  {at: 16.6, C: Ready},
  {at: 21.14, C: Name},
  {at: 22.92, C: Erode},
  {at: 24.39, C: Alive},
  {at: 28.84, C: Buckle},
  {at: 31.62, C: Ground},
  {at: 32.97, C: Word},
  {at: 34.63, C: Two},
  {at: 37.36, C: Remains},
];
export const TAWAKKUL_END = 41.6;

export const Tawakkul: React.FC = () => {
  useFonts();
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;

  const i = BEATS.reduce((a, b, k) => (t >= b.at ? k : a), 0);
  const beat = BEATS[i];
  const next = BEATS[i + 1]?.at ?? TAWAKKUL_END;
  const local = t - beat.at;

  // weight on the cut, but no flash: this subject does not get strobed
  const settle = 1 + 0.004 * (1 - ramp(local, 0, 0.6, out5));

  return (
    <AbsoluteFill style={{background: C.bg, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${settle})`}}>
        <beat.C t={local} d={next - beat.at} />
      </AbsoluteFill>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
        <rect x={52} y={52} width={W - 104} height={H - 104} fill="none" stroke={C.rule} strokeWidth={1} />
        <rect x={52} y={52} width={(W - 104) * cl(t / TAWAKKUL_END)} height={2} fill={C.hot} />
      </svg>
      <Finish f={frame} />
    </AbsoluteFill>
  );
};
