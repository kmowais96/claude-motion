import React from 'react';
import {FONT, P} from './theme';

const SW = 6; // ink stroke width, everywhere

export type Face = 'smile' | 'flat' | 'talk' | 'sad' | 'o' | 'grin' | 'smug';
export type Hat = 'kufi' | 'cap' | 'none';

/**
 * Stick figure standing with feet at (x, y). Arm angles in degrees: 0 hangs straight down,
 * 90 points straight out sideways, 150 is raised. `face` -1/1 turns the cap brim and eyes.
 */
export const Figure: React.FC<{
  x: number;
  y: number;
  body: string;
  hat: Hat;
  mood: Face;
  frame: number;
  armL?: number;
  armR?: number;
  look?: number;
  facing?: 1 | -1;
  scale?: number;
  lean?: number;
  opacity?: number;
  brows?: 'angry' | 'worried' | null;
  talkAmt?: number;
}> = ({x, y, body, hat, mood, frame, armL = 12, armR = 12, look = 0, facing = 1, scale = 1, lean = 0, opacity = 1, brows = null, talkAmt = 1}) => {
  const arm = (side: -1 | 1, a: number) => {
    const r = (a * Math.PI) / 180;
    const sx = side * 38;
    const sy = -296;
    const ex = sx + side * Math.sin(r) * 150;
    const ey = sy + Math.cos(r) * 150;
    return (
      <g>
        <line x1={sx} y1={sy} x2={ex} y2={ey} stroke={P.ink} strokeWidth={SW} strokeLinecap="round" />
        <circle cx={ex} cy={ey} r={7} fill={P.ink} />
      </g>
    );
  };
  const mouthOpen = mood === 'talk' ? (0.35 + 0.65 * Math.abs(Math.sin(frame * 0.55) * Math.sin(frame * 0.23 + 1))) * talkAmt : 0;
  const ex = look * 7;
  const mouth = (() => {
    const my = -368;
    switch (mood) {
      case 'smile':
        return <path d={`M${-15 + ex},${my - 4} Q${ex},${my + 10} ${15 + ex},${my - 4}`} fill="none" stroke={P.ink} strokeWidth={5} strokeLinecap="round" />;
      case 'grin':
        return <path d={`M${-19 + ex},${my - 6} Q${ex},${my + 16} ${19 + ex},${my - 6} Z`} fill={P.ink} stroke={P.ink} strokeWidth={4} strokeLinejoin="round" />;
      case 'smug':
        return <path d={`M${-14 + ex},${my} Q${4 + ex},${my + 6} ${17 + ex},${my - 8}`} fill="none" stroke={P.ink} strokeWidth={5} strokeLinecap="round" />;
      case 'sad':
        return <path d={`M${-14 + ex},${my + 4} Q${ex},${my - 8} ${14 + ex},${my + 4}`} fill="none" stroke={P.ink} strokeWidth={5} strokeLinecap="round" />;
      case 'o':
        return <ellipse cx={ex} cy={my} rx={8} ry={10} fill={P.ink} />;
      case 'talk':
        return <ellipse cx={ex} cy={my} rx={12} ry={2.5 + mouthOpen * 10} fill={P.ink} />;
      default:
        return <line x1={-12 + ex} y1={my} x2={12 + ex} y2={my} stroke={P.ink} strokeWidth={5} strokeLinecap="round" />;
    }
  })();
  return (
    <g transform={`translate(${x},${y}) scale(${scale}) rotate(${lean}, 0, 0)`} opacity={opacity}>
      {/* legs */}
      <path d="M-16,-150 L-20,-4 L-36,-4" fill="none" stroke={P.ink} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16,-150 L20,-4 L36,-4" fill="none" stroke={P.ink} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" />
      {arm(-1, armL)}
      {arm(1, armR)}
      {/* body */}
      <rect x={-42} y={-330} width={84} height={192} rx={34} fill={body} stroke={P.ink} strokeWidth={SW} />
      <line x1={0} y1={-300} x2={0} y2={-230} stroke="rgba(0,0,0,0.18)" strokeWidth={4} strokeLinecap="round" />
      {/* head */}
      <circle cx={0} cy={-390} r={54} fill={P.skin} stroke={P.ink} strokeWidth={SW} />
      {hat === 'kufi' && (
        <path d="M-50,-408 Q-48,-452 0,-454 Q48,-452 50,-408 Z" fill={P.white} stroke={P.ink} strokeWidth={SW} strokeLinejoin="round" />
      )}
      {hat === 'kufi' && <path d="M-36,-424 L36,-424" stroke={P.line} strokeWidth={4} strokeLinecap="round" />}
      {hat === 'cap' && (
        <g>
          <path d={`M-52,-404 Q-50,-456 0,-458 Q50,-456 52,-404 Z`} fill={P.blue} stroke={P.ink} strokeWidth={SW} strokeLinejoin="round" />
          <path d={`M${facing * 44},-406 L${facing * 98},-400`} stroke={P.ink} strokeWidth={SW + 3} strokeLinecap="round" />
          <circle cx={0} cy={-458} r={6} fill={P.ink} />
        </g>
      )}
      {/* eyes */}
      <circle cx={-18 + ex} cy={-394} r={6} fill={P.ink} />
      <circle cx={18 + ex} cy={-394} r={6} fill={P.ink} />
      {brows === 'angry' && (
        <g stroke={P.ink} strokeWidth={5} strokeLinecap="round">
          <line x1={-30 + ex} y1={-416} x2={-10 + ex} y2={-408} />
          <line x1={30 + ex} y1={-416} x2={10 + ex} y2={-408} />
        </g>
      )}
      {brows === 'worried' && (
        <g stroke={P.ink} strokeWidth={5} strokeLinecap="round">
          <line x1={-30 + ex} y1={-406} x2={-10 + ex} y2={-414} />
          <line x1={30 + ex} y1={-406} x2={10 + ex} y2={-414} />
        </g>
      )}
      {mouth}
    </g>
  );
};

/** Speech bubble centred on (x, y), its tail pointing to (tx, ty). `k` 0→1 pops it in. */
export const Bubble: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  tx: number;
  ty: number;
  k: number;
  fill?: string;
  stroke?: string;
  children?: React.ReactNode;
}> = ({x, y, w: bw, h, tx, ty, k, fill = P.white, stroke = P.ink, children}) => {
  if (k <= 0.001) return null;
  const bx = Math.max(-bw / 2 + 26, Math.min(bw / 2 - 52, (tx - x) * 0.5));
  return (
    <g transform={`translate(${x},${y}) scale(${k})`} opacity={Math.min(1, k * 1.6)}>
      <path
        d={`M${bx},${h / 2 - 4} L${tx - x},${ty - y} L${bx + 34},${h / 2 - 4} Z`}
        fill={fill}
        stroke={stroke}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <rect x={-bw / 2} y={-h / 2} width={bw} height={h} rx={30} fill={fill} stroke={stroke} strokeWidth={SW} />
      <rect x={bx + 3} y={h / 2 - 10} width={28} height={12} fill={fill} />
      {children}
    </g>
  );
};

/** Voice bars inside a bubble; `live` 0..1 sets how much they move. */
export const Wave: React.FC<{frame: number; color: string; live?: number; n?: number; seed?: number}> = ({frame, color, live = 1, n = 7, seed = 0}) => (
  <g>
    {Array.from({length: n}).map((_, i) => {
      const base = [0.45, 0.8, 0.6, 1, 0.55, 0.85, 0.5, 0.7, 0.9][(i + seed) % 9];
      const hgt = 70 * base * (0.55 + 0.45 * live * Math.abs(Math.sin(frame * 0.32 + i * 1.7 + seed)));
      const x = (i - (n - 1) / 2) * 17;
      return <line key={i} x1={x} y1={-hgt / 2} x2={x} y2={hgt / 2} stroke={color} strokeWidth={8} strokeLinecap="round" />;
    })}
  </g>
);

export const Dots: React.FC<{frame: number}> = ({frame}) => (
  <g>
    {[0, 1, 2].map((i) => (
      <circle key={i} cx={(i - 1) * 24} cy={-6 * Math.max(0, Math.sin(frame * 0.3 - i * 0.9))} r={8} fill={P.inkSoft} />
    ))}
  </g>
);

export const Book: React.FC<{color?: string}> = ({color = P.teal}) => (
  <g>
    <path d="M0,-34 Q-38,-48 -74,-36 L-74,38 Q-38,26 0,40 Q38,26 74,38 L74,-36 Q38,-48 0,-34 Z" fill={P.white} stroke={P.ink} strokeWidth={SW} strokeLinejoin="round" />
    <line x1={0} y1={-34} x2={0} y2={40} stroke={P.ink} strokeWidth={5} />
    {[-16, 0, 16].map((yy) => (
      <g key={yy}>
        <line x1={-60} y1={yy - 8} x2={-14} y2={yy - 6} stroke={color} strokeWidth={5} strokeLinecap="round" />
        <line x1={14} y1={yy - 6} x2={60} y2={yy - 8} stroke={yy === 0 ? P.gold : color} strokeWidth={5} strokeLinecap="round" />
      </g>
    ))}
  </g>
);

export const Stop: React.FC<{size?: number}> = ({size = 1}) => {
  const pts = Array.from({length: 8}).map((_, i) => {
    const a = (Math.PI / 8) * (2 * i + 1);
    return `${Math.cos(a) * 52},${Math.sin(a) * 52}`;
  });
  return (
    <g transform={`scale(${size})`}>
      <polygon points={pts.join(' ')} fill={P.red} stroke={P.ink} strokeWidth={SW} strokeLinejoin="round" />
      <rect x={-13} y={-24} width={26} height={44} rx={10} fill={P.white} />
      <rect x={-13} y={-34} width={8} height={22} rx={4} fill={P.white} />
      <rect x={-3} y={-38} width={8} height={24} rx={4} fill={P.white} />
      <rect x={7} y={-34} width={8} height={22} rx={4} fill={P.white} />
    </g>
  );
};

export const Ear: React.FC<{size?: number; color?: string}> = ({size = 1, color = P.ink}) => (
  <g transform={`scale(${size})`} fill="none" stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round">
    <path d="M-30,-10 C-34,-56 30,-66 36,-18 C40,12 14,20 10,40 C6,60 -14,66 -24,52" />
    <path d="M-12,-14 C-10,-34 16,-34 16,-14 C16,0 2,4 0,14" />
  </g>
);

export const Waves: React.FC<{k: number; color?: string; side?: 1 | -1}> = ({k, color = P.teal, side = -1}) => (
  <g fill="none" stroke={color} strokeWidth={5} strokeLinecap="round">
    {[0, 1, 2].map((i) => {
      const r = 70 + i * 26;
      const o = Math.max(0, Math.min(1, k * 3 - i));
      const a0 = (side < 0 ? 140 : -40) * (Math.PI / 180);
      const a1 = (side < 0 ? 220 : 40) * (Math.PI / 180);
      return (
        <path
          key={i}
          d={`M${Math.cos(a0) * r},${Math.sin(a0) * r} A${r},${r} 0 0 1 ${Math.cos(a1) * r},${Math.sin(a1) * r}`}
          opacity={o * (1 - i * 0.22)}
          transform={side < 0 ? 'scale(1,-1)' : undefined}
        />
      );
    })}
  </g>
);

export const Bulb: React.FC<{glow: number}> = ({glow}) => (
  <g>
    <circle r={58} fill={P.goldSoft} opacity={0.6 * glow} />
    {Array.from({length: 8}).map((_, i) => {
      const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
      return (
        <line key={i} x1={Math.cos(a) * 44} y1={Math.sin(a) * 44} x2={Math.cos(a) * (44 + 16 * glow)} y2={Math.sin(a) * (44 + 16 * glow)} stroke={P.gold} strokeWidth={5} strokeLinecap="round" opacity={glow} />
      );
    })}
    <circle r={28} fill="#F6CE5A" stroke={P.ink} strokeWidth={5} />
    <rect x={-12} y={24} width={24} height={14} rx={3} fill={P.inkSoft} stroke={P.ink} strokeWidth={4} />
  </g>
);

export const Heart: React.FC<{size?: number}> = ({size = 1}) => (
  <path
    transform={`scale(${size})`}
    d="M0,26 C-40,0 -40,-34 -18,-34 C-6,-34 0,-24 0,-18 C0,-24 6,-34 18,-34 C40,-34 40,0 0,26 Z"
    fill={P.red}
    stroke={P.ink}
    strokeWidth={4}
    strokeLinejoin="round"
  />
);

export const Trophy: React.FC<{size?: number}> = ({size = 1}) => (
  <g transform={`scale(${size})`} stroke={P.ink} strokeWidth={5} strokeLinejoin="round" strokeLinecap="round">
    <path d="M-30,-34 L30,-34 L26,4 Q0,22 -26,4 Z" fill={P.gold} />
    <path d="M-30,-26 Q-52,-26 -44,-6 Q-38,4 -24,2" fill="none" />
    <path d="M30,-26 Q52,-26 44,-6 Q38,4 24,2" fill="none" />
    <line x1={0} y1={14} x2={0} y2={30} />
    <rect x={-20} y={30} width={40} height={10} rx={3} fill={P.gold} />
  </g>
);

/** Red X drawn over something. `k` 0→1 draws the two strokes in turn. */
export const Cross: React.FC<{size: number; k: number}> = ({size, k}) => {
  const a = Math.min(1, k * 2);
  const b = Math.max(0, k * 2 - 1);
  return (
    <g stroke={P.red} strokeWidth={10} strokeLinecap="round">
      {a > 0 && <line x1={-size} y1={-size} x2={-size + 2 * size * a} y2={-size + 2 * size * a} />}
      {b > 0 && <line x1={size} y1={-size} x2={size - 2 * size * b} y2={-size + 2 * size * b} />}
    </g>
  );
};

export const Check: React.FC<{k: number; r?: number}> = ({k, r = 30}) => (
  <g transform={`scale(${k})`}>
    <circle r={r} fill={P.teal} />
    <path d={`M${-r * 0.42},0 L${-r * 0.1},${r * 0.32} L${r * 0.45},${-r * 0.3}`} fill="none" stroke={P.white} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
  </g>
);

export const Hourglass: React.FC<{t: number}> = ({t}) => (
  <g transform={`rotate(${Math.floor(t / 1.2) * 180 + Math.min(1, (t % 1.2) / 0.3) * 180})`}>
    <path d="M-22,-34 L22,-34 L4,0 L22,34 L-22,34 L-4,0 Z" fill={P.white} stroke={P.ink} strokeWidth={5} strokeLinejoin="round" />
    <path d="M-12,-26 L12,-26 L0,-6 Z" fill={P.gold} />
    <path d="M-14,30 L14,30 L0,16 Z" fill={P.gold} />
  </g>
);

/** Balance scale; `tilt` in degrees, positive drops the right pan. */
export const Scales: React.FC<{tilt: number; leftItem?: React.ReactNode; rightItem?: React.ReactNode}> = ({tilt, leftItem, rightItem}) => {
  const r = (tilt * Math.PI) / 180;
  const arm = 150;
  const lx = -Math.cos(r) * arm;
  const ly = -Math.sin(r) * arm;
  const rx = Math.cos(r) * arm;
  const ry = Math.sin(r) * arm;
  const pan = (px: number, py: number, item?: React.ReactNode) => (
    <g transform={`translate(${px},${py})`}>
      <line x1={0} y1={0} x2={-34} y2={70} stroke={P.ink} strokeWidth={3} />
      <line x1={0} y1={0} x2={34} y2={70} stroke={P.ink} strokeWidth={3} />
      <path d="M-46,70 Q0,100 46,70 Z" fill={P.white} stroke={P.ink} strokeWidth={5} strokeLinejoin="round" />
      {item && <g transform="translate(0,52)">{item}</g>}
    </g>
  );
  return (
    <g>
      <line x1={0} y1={0} x2={0} y2={250} stroke={P.ink} strokeWidth={SW} strokeLinecap="round" />
      <line x1={-50} y1={250} x2={50} y2={250} stroke={P.ink} strokeWidth={SW} strokeLinecap="round" />
      <line x1={lx} y1={ly} x2={rx} y2={ry} stroke={P.ink} strokeWidth={SW} strokeLinecap="round" />
      <circle r={10} fill={P.gold} stroke={P.ink} strokeWidth={4} />
      {pan(lx, ly, leftItem)}
      {pan(rx, ry, rightItem)}
    </g>
  );
};

/** Little sprout on the ground line, as in the original's set dressing. */
export const Sprout: React.FC<{x: number; y: number; flip?: boolean}> = ({x, y, flip}) => (
  <g transform={`translate(${x},${y}) scale(${flip ? -1 : 1},1)`}>
    <path d="M0,0 Q2,-22 0,-40" fill="none" stroke={P.green} strokeWidth={4} strokeLinecap="round" />
    <path d="M0,-26 Q-18,-34 -20,-50 Q-4,-46 0,-26 Z" fill={P.green} />
    <path d="M1,-34 Q16,-40 20,-54 Q4,-52 1,-34 Z" fill={P.green} opacity={0.75} />
  </g>
);

/** Text label drawn in SVG (chips inside the stage). */
export const SvgText: React.FC<{x: number; y: number; size: number; color: string; children: string; weight?: number; anchor?: 'start' | 'middle' | 'end'}> = ({
  x,
  y,
  size,
  color,
  children,
  weight = 800,
  anchor = 'middle',
}) => (
  <text x={x} y={y} fontFamily={FONT} fontWeight={weight} fontSize={size} fill={color} textAnchor={anchor} dominantBaseline="central">
    {children}
  </text>
);
