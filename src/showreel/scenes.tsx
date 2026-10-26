import React from 'react';
import {back, C, cl, Draw, FM, FR, FS, inOut, Letters, mix, out3, out5, pulse, ramp, RH, rnd, rr, RW, spring, stag, Trail} from './kit';

type S = {t: number; d: number};

/** 1 — A single rule slams across, splits, and the title is revealed through the gap. */
export const Slam: React.FC<S> = ({t}) => {
  const whip = ramp(t, 0, 0.26, out5);
  const split = ramp(t, 0.3, 0.72, out5);
  const gap = split * RH * 0.46;
  return (
    <>
      <svg width={RW} height={RH} style={{position: 'absolute', inset: 0}}>
        <Trail
          t={t}
          n={9}
          step={0.012}
          render={(tt) => {
            const w = ramp(tt, 0, 0.26, out5);
            return <rect x={RW / 2 - (RW * w) / 2} y={RH / 2 - 3} width={RW * w} height={6} fill={C.ink} />;
          }}
        />
      </svg>
      {/* the two halves part, and the word is behind them */}
      <div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            clipPath: `inset(${RH / 2 - gap}px 0 0 0)`,
          }}
        >
          <div style={{display: 'flex'}}>
            <Letters text="MOTION" t={t} at={0.34} size={286} step={0.022} from={0} />
          </div>
        </div>
      </div>
      <svg width={RW} height={RH} style={{position: 'absolute', inset: 0}}>
        <rect x={0} y={RH / 2 - 3 - gap} width={RW} height={6} fill={C.hot} opacity={whip} />
        <rect x={0} y={RH / 2 - 3 + gap} width={RW} height={6} fill={C.hot} opacity={whip} />
      </svg>
    </>
  );
};

/** 2 — Concentric arcs draw at different rates while a counter runs. */
export const Arcs: React.FC<S> = ({t, d}) => {
  const cx = RW / 2;
  const cy = RH / 2;
  const n = 7;
  return (
    <>
      <svg width={RW} height={RH} style={{position: 'absolute', inset: 0}}>
        {Array.from({length: n}, (_, i) => {
          const r = 90 + i * 58;
          const p = stag(t, 0.02, i, 0.055, 0.8, out5);
          const spin = (t * (i % 2 ? -34 : 44)) % 360;
          const len = 2 * Math.PI * r;
          const arc = 0.26 + 0.5 * rnd('arc', i);
          return (
            <g key={i} transform={`rotate(${spin} ${cx} ${cy})`}>
              <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.rule} strokeWidth={1} />
              <Draw
                d={`M${cx + r},${cy} A${r},${r} 0 ${arc > 0.5 ? 1 : 0} 1 ${
                  cx + r * Math.cos(arc * 2 * Math.PI)
                },${cy + r * Math.sin(arc * 2 * Math.PI)}`}
                p={p}
                len={len}
                w={i === 3 ? 5 : 2.5}
                color={i === 3 ? C.hot : C.ink}
                cap="round"
              />
            </g>
          );
        })}
        <circle cx={cx} cy={cy} r={7 * spring(ramp(t, 0.1, 0.5))} fill={C.hot} />
      </svg>
      <div
        style={{
          position: 'absolute',
          left: 96,
          bottom: 92,
          fontFamily: FM,
          fontSize: 26,
          letterSpacing: 2,
          color: C.dim,
        }}
      >
        <span style={{color: C.hot}}>▍</span> R{String(Math.round(mix(0, 496, ramp(t, 0, d, inOut)))).padStart(3, '0')}
        {'  ·  '}
        {String(Math.round(mix(0, 360, ramp(t, 0, d, inOut)))).padStart(3, '0')}°
      </div>
    </>
  );
};

/** 3 — A field of cells ripples outward from a moving source. */
export const Ripple: React.FC<S> = ({t, d}) => {
  const cols = 32;
  const rows = 18;
  const cw = RW / cols;
  const ch = RH / rows;
  const sx = mix(0.18, 0.84, inOut(cl(t / d))) * cols;
  const sy = mix(0.74, 0.3, inOut(cl(t / d))) * rows;
  return (
    <svg width={RW} height={RH} style={{position: 'absolute', inset: 0}}>
      {Array.from({length: rows}, (_, r) =>
        Array.from({length: cols}, (_, c) => {
          const dist = Math.hypot(c - sx, (r - sy) * 1.3);
          const k = cl(1 - Math.abs(dist - t * 17) / 4);
          const base = 0.1 + 0.9 * k;
          const s = mix(0.12, 0.92, k) * Math.min(cw, ch);
          return (
            <rect
              key={`${r}-${c}`}
              x={c * cw + (cw - s) / 2}
              y={r * ch + (ch - s) / 2}
              width={s}
              height={s}
              fill={k > 0.72 ? C.hot : C.ink}
              opacity={base * 0.9}
              rx={1}
            />
          );
        }),
      )}
    </svg>
  );
};

/** 4 — Type with weight: a word lands, a rule underlines it, a kicker types on. */
export const Type: React.FC<S> = ({t}) => {
  const rule = ramp(t, 0.42, 0.9, out5);
  const kick = 'EVERY FRAME DRAWN IN CODE';
  const shown = Math.round(cl((t - 0.62) / 0.5) * kick.length);
  return (
    <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingLeft: 150}}>
      <Letters text="PRECISION" t={t} at={0.04} size={238} step={0.03} from={150} />
      <div style={{height: 10, width: 1180 * rule, background: C.hot, marginTop: 34}} />
      <div
        style={{
          marginTop: 38,
          fontFamily: FM,
          fontSize: 34,
          letterSpacing: 7,
          color: C.dim,
          height: 40,
        }}
      >
        {kick.slice(0, shown)}
        <span style={{color: C.hot, opacity: Math.floor(t * 8) % 2 ? 1 : 0.15}}>_</span>
      </div>
    </div>
  );
};

/** 5 — Bars race, overshoot, and settle on their marks. */
export const Bars: React.FC<S> = ({t}) => {
  const vals = [0.92, 0.64, 0.78, 0.41, 0.86, 0.55, 0.7];
  const labels = ['EASE', 'STAGGER', 'MASK', 'SPRING', 'TRAIL', 'MORPH', 'GRAIN'];
  const left = 180;
  const top = 168;
  const bh = 74;
  const gap = 24;
  const maxW = 1380;
  return (
    <div style={{position: 'absolute', inset: 0}}>
      {vals.map((v, i) => {
        const k = stag(t, 0.03, i, 0.06, 0.78, back);
        const w = maxW * v * k;
        return (
          <div key={i} style={{position: 'absolute', left, top: top + i * (bh + gap), height: bh, width: maxW}}>
            <div style={{position: 'absolute', inset: 0, borderBottom: `1px solid ${C.rule}`}} />
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 10,
                height: bh - 20,
                width: w,
                background: i === 0 ? C.hot : C.ink,
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 16,
                top: 20,
                fontFamily: FS,
                fontWeight: 800,
                fontSize: 30,
                letterSpacing: 2,
                color: i === 0 ? C.ink : C.bg,
                opacity: cl(k * 3),
                mixBlendMode: i === 0 ? 'normal' : 'difference',
              }}
            >
              {labels[i]}
            </div>
            <div
              style={{
                position: 'absolute',
                left: w + 22,
                top: 18,
                fontFamily: FM,
                fontSize: 28,
                color: C.dim,
                opacity: cl(k * 2 - 0.4),
              }}
            >
              {Math.round(v * k * 100)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/** 6 — An isometric stack unfolds, each slab on its own delay. */
export const Iso: React.FC<S> = ({t, d}) => {
  const n = 9;
  const cx = RW / 2;
  const cy = RH / 2 + 110;
  const spin = mix(-18, 14, inOut(cl(t / d)));
  return (
    <svg width={RW} height={RH} style={{position: 'absolute', inset: 0}}>
      <g transform={`translate(${cx} ${cy}) rotate(${spin * 0.25})`}>
        {Array.from({length: n}, (_, i) => {
          const k = stag(t, 0.02, n - 1 - i, 0.05, 0.7, back);
          const w = 300 - i * 9;
          const lift = -i * 46 * k;
          const hot = i === 2;
          return (
            <g key={i} transform={`translate(0 ${lift})`} opacity={cl(k * 1.6)}>
              <path d={`M0,${-w * 0.5} L${w},0 L0,${w * 0.5} L${-w},0 Z`} fill={hot ? C.hot : C.ink} opacity={hot ? 1 : 0.1 + 0.08 * i} />
              <path d={`M0,${-w * 0.5} L${w},0 L0,${w * 0.5} L${-w},0 Z`} fill="none" stroke={hot ? C.hot : C.ink} strokeWidth={1.6} opacity={0.75} />
            </g>
          );
        })}
      </g>
    </svg>
  );
};

/** 7 — Scattered points converge into a ring, then breathe. */
export const Converge: React.FC<S> = ({t, d}) => {
  const n = 340;
  const cx = RW / 2;
  const cy = RH / 2;
  const k = ramp(t, 0.05, 0.78, out5);
  const breathe = 1 + 0.045 * Math.sin((t - 0.8) * 5.2) * cl((t - 0.8) / 0.4);
  return (
    <svg width={RW} height={RH} style={{position: 'absolute', inset: 0}}>
      {Array.from({length: n}, (_, i) => {
        const a = (i / n) * Math.PI * 2;
        const R = 300 * breathe;
        const tx = cx + Math.cos(a) * R;
        const ty = cy + Math.sin(a) * R;
        const fx = rr(-RW * 0.6, RW * 1.6, 'px', i);
        const fy = rr(-RH * 0.6, RH * 1.6, 'py', i);
        const kk = cl(k * 1.3 - rnd('d', i) * 0.3);
        const x = mix(fx, tx, kk);
        const y = mix(fy, ty, kk);
        const hot = i % 23 === 0;
        return <circle key={i} cx={x} cy={y} r={hot ? 6.5 : 3.4} fill={hot ? C.hot : C.ink} opacity={0.3 + 0.7 * kk} />;
      })}
      <circle cx={cx} cy={cy} r={300 * breathe} fill="none" stroke={C.hot} strokeWidth={2} opacity={ramp(t, 0.7, 1.05) * 0.8} />
    </svg>
  );
};

/** 8 — One square becomes a circle becomes a blade, trailing itself. */
export const Morph: React.FC<S> = ({t, d}) => {
  const cx = RW / 2;
  const cy = RH / 2;
  const shape = (tt: number) => {
    const u = cl(tt / d);
    const r = mix(10, 240, inOut(cl(u * 2.4))) * (1 - 0.55 * cl((u - 0.62) / 0.38));
    const sq = 430;
    const rad = mix(10, sq / 2, inOut(cl((u - 0.1) * 2.2)));
    const sx = mix(1, 2.2, cl((u - 0.6) / 0.4));
    return {r, rad, sq, sx, rot: mix(0, 220, inOut(u))};
  };
  return (
    <svg width={RW} height={RH} style={{position: 'absolute', inset: 0}}>
      <Trail
        t={t}
        n={10}
        step={0.02}
        render={(tt) => {
          const s = shape(Math.max(0, tt));
          return (
            <g transform={`translate(${cx} ${cy}) rotate(${s.rot}) scale(${s.sx} 1)`}>
              <rect x={-s.sq / 2} y={-s.sq / 2} width={s.sq} height={s.sq} rx={s.rad} fill="none" stroke={C.ink} strokeWidth={7} />
            </g>
          );
        }}
      />
      <g transform={`translate(${cx} ${cy})`}>
        <circle r={6} fill={C.hot} opacity={ramp(t, 0.2, 0.6)} />
      </g>
    </svg>
  );
};

/** 9 — Panels wipe in from alternating sides, each carrying a word. */
export const Panels: React.FC<S> = ({t}) => {
  const words = ['TIMING', 'WEIGHT', 'RHYTHM', 'RESTRAINT'];
  return (
    <div style={{position: 'absolute', inset: 0, display: 'flex'}}>
      {words.map((w, i) => {
        const k = stag(t, 0.02, i, 0.085, 0.58, out5);
        const dir = i % 2 ? 1 : -1;
        return (
          <div
            key={i}
            style={{
              flex: 1,
              position: 'relative',
              overflow: 'hidden',
              borderRight: i < words.length - 1 ? `1px solid ${C.rule}` : 'none',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: i === 1 ? C.hot : C.bg,
                transform: `translateY(${dir * (1 - k) * RH}px)`,
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `translateY(${dir * (1 - k) * RH}px) rotate(-90deg)`,
                fontFamily: FS,
                fontWeight: 900,
                fontSize: 96,
                letterSpacing: -3,
                color: i === 1 ? C.bg : C.ink,
                whiteSpace: 'nowrap',
              }}
            >
              {w}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/** 10 — A burst of rays on the beat, with a hard flash. */
export const Burst: React.FC<S> = ({t}) => {
  const cx = RW / 2;
  const cy = RH / 2;
  const k = ramp(t, 0, 0.5, out5);
  const flash = cl(1 - t / 0.07);
  return (
    <>
      <svg width={RW} height={RH} style={{position: 'absolute', inset: 0}}>
        {Array.from({length: 92}, (_, i) => {
          const a = (i / 92) * Math.PI * 2 + 0.03;
          const r0 = mix(40, 300, k) + rr(0, 90, 'b', i) * k;
          const r1 = r0 + mix(0, 420, k) * rr(0.35, 1, 'bl', i);
          return (
            <line
              key={i}
              x1={cx + Math.cos(a) * r0}
              y1={cy + Math.sin(a) * r0}
              x2={cx + Math.cos(a) * r1}
              y2={cy + Math.sin(a) * r1}
              stroke={i % 7 === 0 ? C.hot : C.ink}
              strokeWidth={i % 7 === 0 ? 6 : 2.6}
              opacity={(1 - k) * 0.95}
            />
          );
        })}
        <circle cx={cx} cy={cy} r={mix(0, 340, k)} fill="none" stroke={C.hot} strokeWidth={mix(14, 0.5, k)} opacity={1 - k} />
      </svg>
      <div style={{position: 'absolute', inset: 0, background: C.ink, opacity: flash * 0.9}} />
    </>
  );
};

/** 11 — A serif line, set properly, held still. The rest was noise; this is the point. */
export const Line: React.FC<S> = ({t}) => {
  const k = ramp(t, 0.05, 0.95, out5);
  return (
    <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{textAlign: 'center', maxWidth: 1340}}>
        <div
          style={{
            fontFamily: FR,
            fontSize: 112,
            lineHeight: 1.08,
            color: C.ink,
            opacity: k,
            transform: `translateY(${20 * (1 - k)}px)`,
          }}
        >
          Anyone can move a thing.
          <br />
          <span style={{fontStyle: 'italic', color: C.warm}}>Timing</span> is the whole craft.
        </div>
      </div>
    </div>
  );
};

/** 12 — Everything collapses to one rule, and the mark sits on it. */
export const Sign: React.FC<S> = ({t}) => {
  const close = ramp(t, 0, 0.42, out5);
  const nameK = ramp(t, 0.36, 0.95, out5);
  const w = mix(RW, 440, close);
  return (
    <>
      <svg width={RW} height={RH} style={{position: 'absolute', inset: 0}}>
        <rect x={RW / 2 - w / 2} y={RH / 2 + 86} width={w} height={4} fill={C.hot} />
      </svg>
      <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{textAlign: 'center', transform: 'translateY(-26px)'}}>
          <div style={{display: 'flex', justifyContent: 'center'}}>
            <Letters text="MOTION" t={t} at={0.34} size={168} step={0.03} from={44} />
          </div>
          <div
            style={{
              marginTop: 38,
              fontFamily: FM,
              fontSize: 26,
              letterSpacing: 13,
              color: C.dim,
              opacity: nameK,
            }}
          >
            DRAWN IN CODE · 2026
          </div>
        </div>
      </div>
    </>
  );
};
