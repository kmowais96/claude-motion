import React from 'react';
import {clamp01, easeIn, easeOut, lerp, prog} from '../lib';
import {Q, qsp} from './theme';

// Line-art objects only: no faces, no figures. Each motif lives in a 400×400 box
// and reacts to the reel's marks (one per highlighted card).

type Props = {name: string; t: number; frame: number; fps: number; marks: number[]};

const POP = {damping: 11, stiffness: 200, mass: 0.7};

/** How lit each mark is (0..1) and how bright the lamp glow behind the motif should be. */
export const motifState = ({name, t, frame, fps, marks}: Props) => {
  const lit = marks.map((m) => qsp(frame, m, fps, POP));
  if (name === 'candle') {
    const flame = candleFlame(lit);
    return {lit, glow: 0.15 + 0.6 * flame};
  }
  const draw = prog(t, 0.05, 1.6, easeOut);
  return {lit, glow: 0.2 * draw + 0.6 * Math.max(0, ...lit)};
};

/** Each sin dims the flame; the last mark (the cure) relights it. */
const candleFlame = (lit: number[]) => {
  const dims = lit.slice(0, -1).reduce((a, k) => a + 0.22 * k, 0);
  const relight = lit[lit.length - 1] ?? 0;
  return lerp(Math.max(0.1, 1 - dims), 1.15, relight);
};

const Stroke: React.FC<{d: string; k: number; w?: number; color?: string; fill?: string}> = ({
  d,
  k,
  w = 3.5,
  color = Q.gold,
  fill = 'none',
}) => (
  <path
    d={d}
    pathLength={1}
    fill={fill}
    stroke={color}
    strokeWidth={w}
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeDasharray="1 1"
    strokeDashoffset={1 - clamp01(k)}
  />
);

const glowStyle = (k: number): React.CSSProperties => ({
  filter: k > 0.01 ? `drop-shadow(0 0 ${18 * k}px rgba(235,199,126,${0.85 * k}))` : undefined,
});

const FLAME = 'M0 -40 C16 -14 16 6 0 16 C-16 6 -16 -14 0 -40 Z';
const HEART = 'M0 45 C-60 5 -70 -40 -35 -55 C-15 -63 0 -48 0 -35 C0 -48 15 -63 35 -55 C70 -40 60 5 0 45 Z';
const STAR = 'M0 -14 L4 -4 L14 0 L4 4 L0 14 L-4 4 L-14 0 L-4 -4 Z';

export const Motif: React.FC<Props & {size: number}> = (props) => {
  const {name, t, size} = props;
  const {lit} = motifState(props);
  const draw = prog(t, 0.05, 1.6, easeOut);
  const part = (i: number) => clamp01(draw * 1.5 - i * 0.1);
  const L = (i: number) => lit[i] ?? 0;
  const flicker = 1 + 0.05 * Math.sin(t * 9.1) + 0.03 * Math.sin(t * 23.7);

  let body: React.ReactNode = null;

  if (name === 'lamp') {
    const k = L(0);
    body = (
      <>
        <Stroke d="M200 30 V90" k={part(0)} />
        <Stroke d="M160 122 L200 90 L240 122 Z" k={part(1)} />
        <Stroke d="M150 122 H250 L272 210 L250 300 H150 L128 210 Z" k={part(2)} />
        <Stroke d="M178 122 L170 300 M222 122 L230 300" k={part(3)} w={2} color={Q.creamDim} />
        <Stroke d="M168 300 L184 332 H216 L232 300" k={part(4)} />
        <g transform={`translate(200 222) scale(${k * flicker})`} style={glowStyle(k)}>
          <path d={FLAME} fill={Q.goldHi} />
        </g>
      </>
    );
  }

  if (name === 'hourglass') {
    const flow = clamp01((t - (props.marks[0] ?? 0)) / 16) * L(0);
    const top = 1 - flow;
    body = (
      <>
        <Stroke d="M100 60 H300 M100 340 H300" k={part(0)} w={5} />
        <Stroke d="M122 60 C122 160 192 170 192 200 C192 230 122 240 122 340" k={part(1)} />
        <Stroke d="M278 60 C278 160 208 170 208 200 C208 230 278 240 278 340" k={part(2)} />
        <g opacity={draw} style={glowStyle(0.5 * L(0))}>
          <path d={`M${200 - 62 * top} ${180 - 80 * top} H${200 + 62 * top} L200 182 Z`} fill={Q.gold} />
          <path d={`M${200 - 68 * flow - 4} 336 Q200 ${336 - 70 * flow - 2} ${200 + 68 * flow + 4} 336 Z`} fill={Q.gold} />
          {flow > 0 && flow < 1 ? (
            <line x1={200} y1={190} x2={200} y2={334 - 66 * flow} stroke={Q.goldHi} strokeWidth={2} />
          ) : null}
        </g>
      </>
    );
  }

  if (name === 'bird') {
    // Abstract: a circle for the head, two arcs for wings. No eyes, no beak.
    const flap = Math.sin(t * 2.2) * 5;
    const head = L(0);
    const wings = L(1);
    const ty = Math.sin(t * 1.1) * 6;
    body = (
      <g transform={`translate(0 ${ty})`}>
        <g transform={`rotate(${flap} 192 196)`} style={glowStyle(wings)}>
          <Stroke d="M190 192 C150 150 100 140 44 178 C100 172 150 192 188 214" k={part(0)} fill={`rgba(212,168,90,${0.55 * wings})`} />
        </g>
        <g transform={`rotate(${-flap} 208 196)`} style={glowStyle(wings)}>
          <Stroke d="M210 192 C250 150 300 140 356 178 C300 172 250 192 212 214" k={part(1)} fill={`rgba(212,168,90,${0.55 * wings})`} />
        </g>
        <Stroke d="M200 204 C196 236 196 256 200 282" k={part(2)} />
        <g style={glowStyle(head)}>
          <circle cx={200} cy={176} r={18} fill={`rgba(235,199,126,${head})`} />
          <Stroke d="M200 158 A18 18 0 1 1 199.9 158" k={part(3)} />
        </g>
      </g>
    );
  }

  if (name === 'hearts') {
    body = [78, 200, 322].map((x, i) => {
      const k = L(i);
      const fill = i === 0 ? Q.goldHi : i === 2 ? 'url(#halfFill)' : 'none';
      return (
        <g key={i} transform={`translate(${x} 205) scale(${0.74 + 0.08 * k})`} style={glowStyle(i === 1 ? 0 : k)}>
          <path d={HEART} fill={fill} opacity={i === 1 ? 0 : k} />
          <path
            d={HEART}
            pathLength={1}
            fill="none"
            stroke={i === 1 ? (k > 0.5 ? Q.muted : Q.gold) : Q.gold}
            strokeWidth={5}
            strokeDasharray={i === 1 && k > 0.5 ? '0.02 0.03' : '1 1'}
            strokeDashoffset={i === 1 && k > 0.5 ? 0 : 1 - part(i)}
            strokeLinecap="round"
          />
        </g>
      );
    });
    body = (
      <>
        <defs>
          <linearGradient id="halfFill" x1="0" x2="1" y1="0" y2="0">
            <stop offset="50%" stopColor={Q.gold} />
            <stop offset="50%" stopColor={Q.gold} stopOpacity={0} />
          </linearGradient>
        </defs>
        {body}
        <Stroke d="M40 300 H360" k={part(3)} w={1.5} color={Q.faint} />
      </>
    );
  }

  if (name === 'drop') {
    const m = props.marks[0] ?? 99;
    const fall = prog(t, m - 0.35, m + 0.05, easeIn);
    const gone = t > m + 0.05;
    body = (
      <>
        <g transform={`translate(0 ${fall * 150})`} opacity={gone ? 0 : 1} style={glowStyle(0.4)}>
          <Stroke d="M200 70 C230 120 245 150 245 175 C245 203 225 222 200 222 C175 222 155 203 155 175 C155 150 170 120 200 70 Z" k={part(0)} />
        </g>
        <Stroke d="M40 330 H360" k={part(1)} w={2.5} />
        {[0, 1, 2, 3].map((i) => {
          // Rings keep spreading after the drop lands, one every 1.2 s.
          const age = t - m - 0.05 - i * 0.45;
          if (age < 0) return null;
          const k = (age % 1.8) / 1.8;
          return (
            <ellipse
              key={i}
              cx={200}
              cy={330}
              rx={20 + 170 * k}
              ry={(20 + 170 * k) * 0.16}
              fill="none"
              stroke={Q.goldHi}
              strokeWidth={2.5}
              opacity={(1 - k) * 0.9}
            />
          );
        })}
      </>
    );
  }

  if (name === 'candle') {
    const flame = candleFlame(lit) * draw;
    body = (
      <>
        <Stroke d="M168 182 H232 V338 H168 Z" k={part(0)} />
        <Stroke d="M232 200 C226 214 226 226 232 236" k={part(1)} w={2.5} />
        <Stroke d="M200 182 V164" k={part(1)} w={2.5} color={Q.creamDim} />
        <Stroke d="M120 338 H280 M146 338 L158 360 H242 L254 338" k={part(2)} />
        <g transform={`translate(200 150) scale(${flame * flicker})`} style={glowStyle(Math.min(1, flame))}>
          <path d={FLAME} fill={Q.goldHi} opacity={0.35 + 0.65 * Math.min(1, flame)} />
        </g>
      </>
    );
  }

  if (name === 'scale') {
    // Starts tipped toward wealth (right); each mark tips it toward knowledge (left).
    const angle = 9 - 12 * L(0) - 8 * L(1);
    const a = (angle * Math.PI) / 180;
    const end = (s: number) => ({x: 200 + s * 120 * Math.cos(a), y: 110 + s * 120 * Math.sin(a)});
    const pan = (s: number, content: React.ReactNode) => {
      const p = end(s);
      return (
        <g transform={`translate(${p.x} ${p.y})`}>
          <Stroke d="M0 0 L-46 120 M0 0 L46 120" k={part(2)} w={2} color={Q.creamDim} />
          <Stroke d="M-60 120 C-40 150 40 150 60 120 Z" k={part(3)} />
          <g opacity={draw}>{content}</g>
        </g>
      );
    };
    body = (
      <>
        <Stroke d="M200 96 V330 M140 338 H260" k={part(0)} w={4.5} />
        <circle cx={200} cy={92} r={7} fill={Q.gold} opacity={draw} />
        <g transform={`rotate(${angle} 200 110)`}>
          <Stroke d="M80 110 H320" k={part(1)} w={4.5} />
        </g>
        {pan(-1, (
          <g style={glowStyle(Math.max(L(0), L(1)))}>
            <path d="M-34 112 Q-17 102 0 112 Q17 102 34 112 V92 Q17 82 0 92 Q-17 82 -34 92 Z" fill={Q.goldHi} />
            <path d="M0 92 V112" stroke={Q.bg} strokeWidth={2} />
          </g>
        ))}
        {pan(1, (
          <g fill="none" stroke={Q.gold} strokeWidth={2.5}>
            <ellipse cx={-14} cy={110} rx={14} ry={5} />
            <ellipse cx={14} cy={110} rx={14} ry={5} />
            <ellipse cx={0} cy={101} rx={14} ry={5} />
          </g>
        ))}
      </>
    );
  }

  if (name === 'boat') {
    const bob = Math.sin(t * 1.4);
    body = (
      <>
        {[110, 200, 290].map((x, i) => (
          <g key={i} transform={`translate(${x} 62) scale(${0.8 + 0.5 * L(i)})`} style={glowStyle(L(i))}>
            <path d={STAR} fill={L(i) > 0.02 ? Q.goldHi : 'none'} stroke={Q.muted} strokeWidth={1.5} opacity={draw} />
          </g>
        ))}
        <g transform={`translate(0 ${bob * 6}) rotate(${bob * 2.5} 200 270)`}>
          <Stroke d="M200 250 V122" k={part(0)} />
          <Stroke d="M208 132 L208 238 L274 238 Z" k={part(1)} />
          <Stroke d="M118 252 H282 L252 292 H148 Z" k={part(2)} />
        </g>
        <Stroke d="M30 310 C70 296 110 324 150 310 C190 296 230 324 270 310 C310 296 350 324 370 310" k={part(3)} />
        <Stroke d="M60 342 C100 330 140 354 180 342 C220 330 260 354 300 342 C320 336 335 340 345 342" k={part(4)} w={2.5} color={Q.creamDim} />
      </>
    );
  }

  if (name === 'rosette') {
    // An eight-point star; each mark lights one more ring around it, gathering inward.
    const n = Math.max(1, props.marks.length);
    const all = L(n - 1);
    body = (
      <>
        {props.marks.map((_, i) => {
          const r = 175 - (i * 95) / Math.max(1, n - 1);
          const k = L(i);
          return (
            <g key={i} style={glowStyle(0.7 * k)}>
              <circle cx={200} cy={200} r={r} fill="none" stroke={Q.faint} strokeWidth={2} opacity={draw} />
              <path
                d={`M200 ${200 - r} A${r} ${r} 0 1 1 199.9 ${200 - r}`}
                pathLength={1}
                fill="none"
                stroke={Q.goldHi}
                strokeWidth={3}
                strokeLinecap="round"
                strokeDasharray="1 1"
                strokeDashoffset={1 - k}
              />
            </g>
          );
        })}
        <g style={glowStyle(all)} transform={`rotate(${t * 4} 200 200)`}>
          <Stroke d="M152 152 H248 V248 H152 Z" k={part(0)} fill={`rgba(235,199,126,${0.85 * all})`} />
          <Stroke d="M200 132 L268 200 L200 268 L132 200 Z" k={part(1)} fill={`rgba(235,199,126,${0.85 * all})`} />
        </g>
      </>
    );
  }

  if (name === 'halves') {
    // One circle, two halves: each mark fills one side.
    const half = (side: number, k: number) => (
      <g style={glowStyle(k)}>
        <path
          d={side < 0 ? 'M196 70 A130 130 0 0 0 196 330 Z' : 'M204 70 A130 130 0 0 1 204 330 Z'}
          fill={Q.gold}
          opacity={0.85 * k}
          transform={`translate(${side * 14 * (1 - k)} 0)`}
        />
      </g>
    );
    body = (
      <>
        {half(-1, L(0))}
        {half(1, L(1))}
        <Stroke d="M200 70 A130 130 0 1 1 199.9 70" k={part(0)} />
        <Stroke d="M200 50 V350" k={part(1)} w={2} color={Q.creamDim} />
      </>
    );
  }

  if (name === 'crescent') {
    const k = L(0);
    body = (
      <>
        <defs>
          <mask id="crescentCut">
            <rect width={400} height={400} fill="#fff" />
            <circle cx={274} cy={104} r={50} fill="#000" />
          </mask>
        </defs>
        <g mask="url(#crescentCut)" style={glowStyle(k)}>
          <circle cx={250} cy={124} r={58} fill={`rgba(235,199,126,${k})`} />
          <Stroke d="M250 66 A58 58 0 1 1 249.9 66" k={part(0)} />
        </g>
        <g transform="translate(120 90) scale(0.7)" opacity={draw}>
          <path d={STAR} fill={Q.goldHi} />
        </g>
        <Stroke d="M20 320 C100 262 170 272 230 312 C280 282 340 272 390 314" k={part(1)} />
        <Stroke d="M10 356 C120 326 260 336 390 350" k={part(2)} w={2.5} color={Q.creamDim} />
        <Stroke d="M60 384 C110 362 160 370 200 380 S300 372 360 386" k={part(3)} w={2} color={Q.muted} />
      </>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 400 400" style={{overflow: 'visible', display: 'block'}}>
      {body}
    </svg>
  );
};
