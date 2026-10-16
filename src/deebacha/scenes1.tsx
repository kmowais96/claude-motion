import React from 'react';
import {AbsoluteFill} from 'remotion';
import {lerp, rand, sp} from '../lib';
import {AR, C, F, L, Svg, T, ap, at, clamp01, dis, draw, easeInOut, prog, win, within} from './kit';

type S = React.FC<{t: number}>;

/** Multan jail, 1949: a barred window with lamplight, the date, the name. */
export const Open: S = ({t}) => {
  const a0 = at(1, 0);
  const cx = 960;
  const cy = 290;
  const w = 230;
  const h = 290;
  const frame = ap(t, a0 - 0.3, 1.4);
  const lamp = ap(t, a0 + 0.4, 2.2) * (0.9 + 0.1 * Math.sin(t * 3.1) * Math.sin(t * 1.7));
  return (
    <AbsoluteFill>
      <Svg>
        <defs>
          <radialGradient id="lamp">
            <stop offset="0%" stopColor={C.coral} stopOpacity={0.55} />
            <stop offset="100%" stopColor={C.coral} stopOpacity={0} />
          </radialGradient>
        </defs>
        <circle cx={cx} cy={cy} r={260} fill="url(#lamp)" opacity={lamp} />
        <path
          d={`M${cx - w / 2} ${cy + h / 2} V${cy - h / 2 + w / 2} A${w / 2} ${w / 2} 0 0 1 ${cx + w / 2} ${cy - h / 2 + w / 2} V${cy + h / 2} Z`}
          fill="none"
          stroke={C.creamDim}
          strokeWidth={3}
          {...draw(frame)}
        />
        {[1, 2, 3, 4, 5].map((j) => {
          const x = cx - w / 2 + (w * j) / 6;
          const k = ap(t, a0 + 0.3 + j * 0.12, 0.9);
          return <line key={j} x1={x} x2={x} y1={cy - h / 2 + 8} y2={lerp(cy - h / 2 + 8, cy + h / 2, k)} stroke={C.cream} strokeWidth={6} strokeLinecap="round" />;
        })}
        <path
          d="M790 600 C 830 585, 860 615, 900 598 S 960 585, 1000 600 S 1080 612, 1130 594"
          fill="none"
          stroke={C.coral}
          strokeWidth={3}
          strokeLinecap="round"
          {...draw(prog(t, at(1, 1) + 1.2, at(1, 2) + 0.2))}
        />
      </Svg>
      <L x={960} y={500} k={ap(t, a0)}>New Central Jail · Multan</L>
      <L x={960} y={540} k={ap(t, a0 + 0.3)} color={C.creamDim}>
        11 September 1949 · 17 Dhu'l-Qa'dah 1368
      </L>
      <T x={960} y={680} k={ap(t, at(1, 2))} size={84}>
        Sayyid Abu'l-A'la <span style={{color: C.coral, fontStyle: 'italic'}}>Mawdudi</span>
      </T>
    </AbsoluteFill>
  );
};

/** The book's name, and nine pages joined into one way of learning. */
export const Title: S = ({t}) => {
  const a = at(1, 3);
  const pages = Array.from({length: 9}, (_, i) => i);
  const pw = 74;
  const ph = 96;
  const gap = 26;
  const x0 = 960 - (9 * pw + 8 * gap) / 2;
  const line = prog(t, at(1, 5), at(1, 5) + 1.8, easeInOut);
  return (
    <AbsoluteFill>
      <T x={960} y={190} k={ap(t, a, 1)} size={128} font={AR} color={C.coral} rtl>
        تفهيم القرآن
      </T>
      <T x={960} y={350} k={ap(t, a + 0.4)} size={72}>
        Tafhim al-Qur'an
      </T>
      <T x={960} y={424} k={ap(t, a + 1.6)} size={40} italic color={C.creamDim}>
        making the Qur'an understood
      </T>
      <Svg>
        {pages.map((i) => {
          const k = sp(Math.round(t * 30), at(1, 4) + i * 0.09, {damping: 15, stiffness: 160}, 30);
          const x = x0 + i * (pw + gap);
          const lit = clamp01((line * 9.6 - i) * 1.2);
          return (
            <g key={i} opacity={k} transform={`translate(0 ${(1 - k) * 20})`}>
              <rect x={x} y={560} width={pw} height={ph} rx={4} fill={lit > 0 ? `rgba(217,119,87,${0.1 * lit})` : 'none'} stroke={lit > 0.5 ? C.coralHi : C.creamDim} strokeWidth={2} />
              {[0, 1, 2, 3].map((r) => (
                <line key={r} x1={x + 12} x2={x + pw - 12 - (r === 3 ? 22 : 0)} y1={584 + r * 16} y2={584 + r * 16} stroke={C.faint} strokeWidth={3} />
              ))}
            </g>
          );
        })}
        <line x1={x0 - 30} x2={lerp(x0 - 30, x0 + 9 * pw + 8 * gap + 30, line)} y1={608} y2={608} stroke={C.coral} strokeWidth={4} strokeLinecap="round" opacity={line > 0 ? 1 : 0} />
      </Svg>
      <L x={960} y={710} k={ap(t, at(1, 4) + 0.6)}>
        the preface · 9 pages
      </L>
      <L x={960} y={750} k={ap(t, at(1, 5) + 1.6)} color={C.coralHi}>
        a whole way of learning
      </L>
    </AbsoluteFill>
  );
};

/** A full shelf; a new book only belongs where it fills a gap. */
export const WhyAnother: S = ({t}) => {
  const shelfY = 640;
  const n = 22;
  const sw = 34;
  const x0 = 960 - (n * (sw + 4)) / 2;
  const gapK = prog(t, at(1, 11), at(1, 11) + 1.2, easeInOut);
  const drop = prog(t, at(1, 11) + 2.4, at(1, 11) + 3.6, easeInOut);
  const book = ap(t, at(1, 9));
  const doubt = ap(t, at(1, 10)) * (1 - drop);
  const bookY = lerp(270, shelfY - 105, drop);
  return (
    <AbsoluteFill>
      <Svg>
        <line x1={x0 - 40} x2={x0 + n * (sw + 4) + 40} y1={shelfY} y2={shelfY} stroke={C.creamDim} strokeWidth={3} opacity={ap(t, at(1, 7))} />
        {Array.from({length: n}, (_, i) => {
          const k = ap(t, at(1, 8) + i * 0.1, 0.5);
          const hh = 150 + rand(i + 3) * 70;
          const shift = (i < n / 2 ? -1 : 1) * gapK * 34;
          const x = x0 + i * (sw + 4) + shift;
          return <rect key={i} x={x} y={shelfY - hh * k} width={sw} height={hh * k} rx={3} fill={C.panelHi} stroke={C.lineHi} strokeWidth={1.5} />;
        })}
        <rect x={960 - 30} y={shelfY - 210} width={60} height={210} fill={C.coral} opacity={0.14 * gapK * (1 - drop * 0.5)} />
        <g opacity={book} transform={`translate(960 ${bookY})`}>
          <rect x={-28} y={-100} width={56} height={200} rx={4} fill={`rgba(217,119,87,${lerp(0.08, 0.85, drop)})`} stroke={C.coral} strokeWidth={2.5} opacity={1 - 0.6 * doubt * (1 - gapK)} />
        </g>
      </Svg>
      <T x={960} y={120} k={book * (1 - drop)} size={72} color={C.coralHi}>
        ?
      </T>
      <L x={960} y={710} k={ap(t, at(1, 8) + 0.6)}>
        translations and tafsir already in Urdu
      </L>
      <T x={1180} y={270} k={doubt * (1 - gapK)} size={36} italic color={C.creamDim} align="left">
        only for the blessing of it?
      </T>
      <L x={960} y={760} k={ap(t, at(1, 11) + 1.4)} color={C.coralHi}>
        worth it only if it fills a gap
      </L>
    </AbsoluteFill>
  );
};

/** People reaching for the spirit of the Qur'an; bridges stop short; one light rises. */
export const Thirst: S = ({t}) => {
  const glowK = ap(t, at(2, 1), 1.6);
  const bridges = prog(t, at(2, 2), at(2, 2) + 2.2, easeInOut);
  const thirsty = ap(t, at(2, 3));
  const one = ap(t, at(2, 4));
  const reach = prog(t, at(2, 5), at(2, 5) + 1.8, easeInOut);
  const cols = 26;
  const rows = 3;
  return (
    <AbsoluteFill>
      <Svg>
        <defs>
          <radialGradient id="spirit">
            <stop offset="0%" stopColor={C.coralHi} stopOpacity={0.8} />
            <stop offset="45%" stopColor={C.coral} stopOpacity={0.25} />
            <stop offset="100%" stopColor={C.coral} stopOpacity={0} />
          </radialGradient>
        </defs>
        <circle cx={960} cy={190} r={150 + 8 * Math.sin(t * 1.3)} fill="url(#spirit)" opacity={0.25 + 0.75 * glowK} />
        {Array.from({length: rows * cols}, (_, i) => {
          const r = Math.floor(i / cols);
          const c = i % cols;
          const k = ap(t, at(2, 0) + 0.04 * c + 0.1 * r, 0.6);
          const x = 960 + (c - (cols - 1) / 2) * 44 + (r % 2) * 22;
          const y = 640 + r * 40 - glowK * 8 * (1 - r / 3);
          return <circle key={i} cx={x} cy={y} r={6} fill={C.creamDim} opacity={k * (0.9 - r * 0.2)} />;
        })}
        {[-5, -3, -1, 1, 3, 5].map((j, i) => {
          const x = 960 + j * 120;
          const top = lerp(610, 400, bridges * (0.9 + 0.1 * rand(i)));
          return <line key={j} x1={x} x2={x} y1={612} y2={top} stroke={C.creamDim} strokeWidth={3} strokeLinecap="round" opacity={bridges > 0 ? 0.8 : 0} />;
        })}
        <circle cx={960} cy={lerp(640, 600, one)} r={9} fill={C.coral} opacity={one} />
        <line x1={960} x2={960} y1={590} y2={lerp(590, 250, reach)} stroke={C.coral} strokeWidth={4} strokeLinecap="round" opacity={reach > 0 ? 1 : 0} />
      </Svg>
      <T x={960} y={190} k={ap(t, at(2, 1) + 0.8)} size={46} italic>
        the spirit of the Qur'an
      </T>
      <L x={1600} y={380} k={ap(t, at(2, 2) + 1)} align="left">
        valuable work
      </L>
      <T x={960} y={340} k={thirsty * (1 - reach)} size={44} italic color={C.coralHi}>
        still thirsty
      </T>
      <L x={960} y={790} k={ap(t, at(2, 0) + 1)}>
        ordinary educated people
      </L>
    </AbsoluteFill>
  );
};

/** Not for scholars; for the ordinary reader: clear meaning, and the Qur'an's own effect. */
export const Reader: S = ({t}) => {
  const sch = ap(t, at(2, 7)) * dis(t, at(2, 12));
  const schDim = prog(t, at(2, 9) + 1, at(2, 10), easeInOut);
  const rd = ap(t, at(2, 10));
  const move = prog(t, at(2, 12), at(2, 12) + 1.2, easeInOut);
  const rx = lerp(1260, 960, move);
  const ry = 380;
  const ring1 = ap(t, within(2, 13, 0.1), 1);
  const ring2 = ap(t, within(2, 13, 0.55), 1);
  const asks = ap(t, at(2, 14) - 0.6);
  const endK = ap(t, at(2, 17));
  const openLine = prog(t, at(2, 17) + 0.4, at(2, 17) + 2.4, easeInOut);
  return (
    <AbsoluteFill>
      <Svg>
        <g opacity={sch * (1 - 0.7 * schDim)}>
          {Array.from({length: 14}, (_, i) => {
            const a = (i / 14) * Math.PI * 2;
            const rr = 40 + (i % 3) * 22;
            return <circle key={i} cx={620 + Math.cos(a) * rr} cy={380 + Math.sin(a) * rr} r={7} fill={C.creamDim} />;
          })}
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={480 + i * 70} y={520} width={56} height={84} rx={3} fill="none" stroke={C.faint} strokeWidth={2} opacity={ap(t, at(2, 9) + i * 0.15)} />
          ))}
        </g>
        <g opacity={rd}>
          {Array.from({length: 7}, (_, i) => {
            const k = prog(t, at(2, 11) + i * 0.1, at(2, 11) + 2 + i * 0.1, easeInOut);
            const a = (i / 7) * Math.PI * 2 + 0.4;
            const d = 60 + k * 260;
            return <rect key={i} x={rx + Math.cos(a) * d - 8} y={ry + Math.sin(a) * d - 8} width={16} height={16} rx={2} fill="none" stroke={C.muted} strokeWidth={2} opacity={ap(t, at(2, 11) - 0.2) * (1 - k)} />;
          })}
          <circle cx={rx} cy={ry} r={14} fill={C.cream} />
          <circle cx={rx} cy={ry} r={90} fill="none" stroke={C.cream} strokeWidth={2} {...draw(ring1)} opacity={ring1 * (1 - endK)} />
          <circle cx={rx} cy={ry} r={170} fill="none" stroke={C.coral} strokeWidth={3} {...draw(ring2)} opacity={ring2 * (1 - endK)} />
          <circle cx={rx} cy={ry} r={170} fill={C.coral} opacity={0.08 * ring2 * (1 - endK)} />
        </g>
      </Svg>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2 + 0.2;
        const gone = i % 2 === 0 ? ap(t, at(2, 14) + 0.6 + i * 0.1) : ap(t, at(2, 15) + 0.6 + i * 0.1);
        return (
          <T key={i} x={960 + Math.cos(a) * 250} y={380 + Math.sin(a) * 210} k={asks * (1 - gone)} size={48} color={C.muted}>
            ?
          </T>
        );
      })}
      <L x={620} y={250} k={sch * (1 - 0.7 * schDim)}>
        scholars
      </L>
      <L x={620} y={650} k={ap(t, at(2, 9) + 0.4) * sch * (1 - 0.7 * schDim)} size={17}>
        plenty already exists for them
      </L>
      <L x={rx} y={250} k={rd * (1 - ring1)}>
        the ordinary reader
      </L>
      <L x={rx} y={480} k={rd * (1 - move)} size={17}>
        doesn't know Arabic well
      </L>
      <T x={960} y={ry - 115} k={ring1 * (1 - endK)} size={30} color={C.cream}>
        the meaning, clearly
      </T>
      <T x={960} y={ry + 205} k={ring2 * (1 - endK)} size={34} italic color={C.coralHi}>
        and the effect the Qur'an wants to have
      </T>
      <L x={960} y={720} k={ap(t, at(2, 16)) * (1 - endK)}>
        readers and scholars: show him where he fell short
      </L>
      <T x={720} y={680} k={endK} size={58} italic align="left">
        not the last word
      </T>
      <Svg>
        <line x1={1170} x2={lerp(1170, 1720, openLine)} y1={688} y2={688} stroke={C.coral} strokeWidth={3} strokeDasharray="2 14" strokeLinecap="round" opacity={endK} />
      </Svg>
    </AbsoluteFill>
  );
};

const NAMES: [string, string][] = [
  ['Persian', 'Shah Waliullah'],
  ['Urdu', 'Shah Abdul Qadir'],
  ['Urdu', 'Shah Rafiuddin'],
  ['Urdu', 'Mawlana Mahmud al-Hasan'],
  ['Urdu', 'Mawlana Ashraf Ali'],
  ['Urdu', 'Hafiz Fateh Muhammad Jalandhari'],
];

/** Word-for-word (blocks drop one by one) versus tarjumani (the meaning carried whole). */
export const Choice: S = ({t}) => {
  const src = ap(t, at(3, 1));
  const flow = prog(t, at(3, 2), at(3, 2) + 2.4, easeInOut);
  const literal = prog(t, at(3, 4), at(3, 4) + 1.6, easeInOut);
  const listK = win(t, at(3, 5), at(3, 6) - 0.5);
  const dim = 1 - 0.93 * listK;
  const benefit = ap(t, at(3, 6));
  const weak = ap(t, at(3, 7) + 1);
  const blocks = [0, 1, 2, 3, 4, 5];
  const bx = (i: number, side: number) => side + (i - 2.5) * 74;
  const L0 = 560;
  const R0 = 1360;
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, opacity: dim}}>
        <Svg>
          {[L0, R0].map((side) =>
            blocks.map((i) => (
              <rect key={`${side}${i}`} x={bx(5 - i, side) - 30} y={230} width={60} height={34} rx={6} fill={C.panelHi} stroke={C.creamDim} strokeWidth={2} opacity={ap(t, at(3, 1) + i * 0.08)} />
            )),
          )}
          {blocks.map((i) => {
            const k = clamp01(literal * 1.6 - i * 0.12);
            return (
              <g key={i}>
                <line x1={bx(5 - i, L0)} x2={bx(5 - i, L0)} y1={268} y2={lerp(268, 420, k)} stroke={C.faint} strokeWidth={2} />
                <rect x={bx(5 - i, L0) - 30} y={420} width={60} height={34} rx={6} fill="none" stroke={C.cream} strokeWidth={2} opacity={k} />
                <line x1={bx(5 - i, L0) - 18} x2={bx(5 - i, L0) + 18} y1={480} y2={480} stroke={C.creamDim} strokeWidth={3} opacity={benefit} />
              </g>
            );
          })}
          <path d={`M${R0 - 200} 280 C ${R0 - 120} 420, ${R0 - 40} 330, ${R0} 410 S ${R0 + 140} 470, ${R0 + 220} 420`} fill="none" stroke={C.coral} strokeWidth={6} strokeLinecap="round" {...draw(flow)} />
          <line x1={960} x2={960} y1={200} y2={620} stroke={C.line} strokeWidth={2} opacity={src} />
        </Svg>
        <L x={960} y={160} k={src}>
          Arabic
        </L>
        <L x={L0} y={560} k={literal}>
          word for word
        </L>
        <T x={L0} y={610} k={ap(t, at(3, 4) + 1)} size={32} italic color={C.creamDim}>
          not wrong
        </T>
        <L x={L0} y={660} k={benefit} color={C.cream}>
          benefit: every word's meaning
        </L>
        <L x={R0} y={560} k={ap(t, at(3, 3))} color={C.coralHi}>
          tarjumani
        </L>
        <T x={R0} y={610} k={ap(t, at(3, 2) + 1)} size={32} italic color={C.creamDim}>
          a free, interpretive rendering
        </T>
        <T x={960} y={740} k={weak} size={36} italic color={C.coralHi}>
          for a reader without Arabic: several weaknesses
        </T>
      </div>
      {NAMES.map(([lang, name], i) => {
        const k = ap(t, within(3, 5, 0.12 + i * 0.13)) * listK;
        return (
          <React.Fragment key={name}>
            <L x={760} y={210 + i * 74} k={k} align="right" size={17}>
              {lang}
            </L>
            <T x={800} y={210 + i * 74} k={k} size={46} align="left">
              {name}
            </T>
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};

const SIEVE_X = 960;
const SIEVE_Y = 360;

/** First weakness: life. Lifeless text, the sieve, lightning over Arabia. */
export const Life: S = ({t}) => {
  const s = (i: number) => at(3, i);
  const l1 = win(t, s(8), s(15) - 0.4);
  const l2 = win(t, s(15), s(18) - 0.4);
  const l3 = win(t, s(18), s(19) - 0.4);
  const l4 = win(t, s(19), s(21) - 0.4);
  const l5 = ap(t, s(21));
  const feelings = ['soul not stirred', 'hair not on end', 'no tears', 'no storm inside'];
  const flash = ap(t, s(19) + 0.5, 0.12) * (1 - prog(t, s(19) + 0.7, s(19) + 2.4));
  const crack = prog(t, within(3, 19, 0.15), within(3, 19, 0.7), easeInOut);
  const rings = ap(t, s(20));
  return (
    <AbsoluteFill>
      <L x={960} y={120} k={ap(t, s(8)) * (1 - l2) * (1 - l3) * (1 - l4) * (1 - l5)} color={C.coralHi}>
        first weakness · life
      </L>
      {/* lifeless text */}
      <Svg o={l1}>
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x={700} y={250 + i * 40} width={i === 4 ? 300 : 520} height={10} rx={5} fill={C.muted} opacity={ap(t, s(9) + i * 0.1)} />
        ))}
      </Svg>
      <L x={960} y={470} k={ap(t, s(9) + 1) * l1}>
        lifeless text
      </L>
      {feelings.map((f, i) => {
        const k = ap(t, s(10 + i)) * l1 * (1 - ap(t, s(14)) * 0.7);
        return (
          <T key={f} x={480 + i * 320} y={590} k={k} size={36} italic color={C.muted}>
            <span style={{textDecoration: 'line-through', textDecorationColor: 'rgba(240,238,230,0.3)'}}>{f}</span>
          </T>
        );
      })}
      <T x={960} y={700} k={ap(t, s(14) + 0.3) * l1} size={40} italic color={C.coralHi}>
        is this really the Book that challenged the world?
      </T>
      {/* the sieve */}
      <Svg o={l2}>
        <path d={`M${SIEVE_X - 230} ${SIEVE_Y} Q ${SIEVE_X} ${SIEVE_Y + 200} ${SIEVE_X + 230} ${SIEVE_Y}`} fill="none" stroke={C.creamDim} strokeWidth={5} strokeDasharray="4 12" strokeLinecap="round" />
        <line x1={SIEVE_X - 250} x2={SIEVE_X + 250} y1={SIEVE_Y} y2={SIEVE_Y} stroke={C.creamDim} strokeWidth={3} />
        {Array.from({length: 46}, (_, i) => {
          const st = s(16) - 0.4;
          if (t < st) return null;
          const x = SIEVE_X - 170 + rand(i) * 340;
          const y = ((t - st) * 120 + rand(i + 9) * 420) % 420;
          return <circle key={i} cx={x} cy={SIEVE_Y + 40 + y} r={3.2} fill={C.muted} opacity={ap(t, st + rand(i) * 0.6) * (1 - y / 420)} />;
        })}
        {Array.from({length: 30}, (_, i) => {
          const st = s(17) - 0.2;
          if (t < st) return null;
          const yy = ((t - st) * 55 + rand(i + 31) * 260) % 260;
          const x = SIEVE_X - 140 + rand(i + 2) * 280 + Math.sin(t * 1.4 + i) * 14;
          return <circle key={i} cx={x} cy={SIEVE_Y - 20 - yy} r={4 + rand(i + 5) * 4} fill={C.coral} opacity={ap(t, st + rand(i) * 0.8) * (1 - yy / 260) * 0.9} />;
        })}
      </Svg>
      <L x={960} y={130} k={l2 * ap(t, s(17) + 0.6)} color={C.coralHi}>
        the living spirit of the language
      </L>
      <L x={960} y={260 + 520} k={l2 * ap(t, s(16) + 0.4)}>
        only the dry ingredients of the medicine
      </L>
      <T x={1330} y={SIEVE_Y} k={l2 * ap(t, s(15) + 0.4)} size={40} italic align="left">
        a literal translation
      </T>
      {/* language and teaching, equal */}
      <Svg o={l3}>
        {[0, 1].map((i) => {
          const hh = 260 * ap(t, s(18) + 0.3 + i * 0.25, 1);
          return <rect key={i} x={800 + i * 220} y={560 - hh} width={100} height={hh} rx={6} fill={i === 0 ? C.coral : C.panelHi} stroke={C.creamDim} strokeWidth={2} />;
        })}
      </Svg>
      <L x={850} y={610} k={l3} color={C.coralHi}>
        its language
      </L>
      <L x={1070} y={610} k={l3}>
        its teaching
      </L>
      {/* lightning, stone */}
      <Svg o={Math.max(l4, l5)}>
        <line x1={300} x2={1620} y1={520} y2={520} stroke={C.line} strokeWidth={2} />
        <path d="M985 140 L930 300 L990 300 L935 470" fill="none" stroke={l5 > 0.5 ? C.muted : C.coralHi} strokeWidth={6} strokeLinejoin="round" opacity={flash * l4} />
        <rect x={0} y={0} width={1920} height={520} fill={C.coral} opacity={0.08 * flash * l4} />
        <path d="M880 520 L900 455 L950 430 L1010 440 L1045 480 L1050 520 Z" fill={C.panelHi} stroke={C.creamDim} strokeWidth={2.5} />
        <path d="M962 432 L955 465 L975 488 L962 520" fill="none" stroke={C.coral} strokeWidth={4} {...draw(crack * (1 - l5))} />
        {[0, 1, 2].map((i) => {
          const r = ((t - s(20)) * 70 + i * 90) % 270;
          return <circle key={i} cx={965} cy={480} r={60 + r} fill="none" stroke={C.coral} strokeWidth={2} opacity={rings * (1 - l5) * (1 - r / 270) * 0.7} />;
        })}
      </Svg>
      <L x={960} y={600} k={l4 * ap(t, within(3, 19, 0.3))}>
        hearts of stone melted · Arabia shaken
      </L>
      <L x={960} y={650} k={l4 * rings} color={C.coralHi}>
        its enemies feared whoever listened
      </L>
      <T x={960} y={640} k={l5} size={40} italic color={C.creamDim}>
        in the language of its translations: never
      </T>
    </AbsoluteFill>
  );
};

/** Second weakness: flow. Interlinear lines, then an essay cut into numbered pieces. */
export const Flow: S = ({t}) => {
  const s = (i: number) => at(3, i);
  const inter = win(t, s(23), s(25) - 0.3);
  const cut = prog(t, s(25) + 0.4, s(25) + 2, easeInOut);
  const essay = ap(t, s(25));
  const meter = 1 - 0.5 * prog(t, s(27), s(27) + 1.2, easeInOut);
  const cur = ((t - s(24)) * 0.32) % 1;
  return (
    <AbsoluteFill>
      <L x={960} y={120} k={ap(t, s(22))} color={C.coralHi}>
        another weakness · flow
      </L>
      <Svg o={inter}>
        {[0, 1, 2, 3].map((i) => (
          <g key={i} opacity={ap(t, s(23) + i * 0.15)}>
            <rect x={620} y={230 + i * 100} width={680} height={14} rx={7} fill={C.creamDim} />
            <rect x={640} y={262 + i * 100} width={640} height={8} rx={4} fill={C.coral} opacity={0.5} />
          </g>
        ))}
        {t > s(24) && (
          <circle cx={620 + cur * 680} cy={230 + Math.floor(((t - s(24)) * 0.32) % 4) * 100 + 7 + (Math.sin(cur * 40) > 0.6 ? 12 : 0)} r={9} fill={C.coralHi} />
        )}
      </Svg>
      <L x={960} y={670} k={inter * ap(t, s(23) + 0.6)}>
        between the lines · half a page each
      </L>
      <Svg o={essay}>
        {Array.from({length: 7}, (_, i) => {
          const y = 230 + i * 50 + cut * i * 14;
          const x = 700 + (i % 2) * 0;
          const w = i === 6 ? 260 : 460 + rand(i) * 60;
          return <rect key={i} x={x + cut * 30} y={y} width={w} height={14} rx={7} fill={C.creamDim} />;
        })}
        <rect x={1340} y={230} width={34} height={340} rx={6} fill="none" stroke={C.faint} strokeWidth={2} />
        <rect x={1340} y={230 + 340 * (1 - meter)} width={34} height={340 * meter} rx={6} fill={C.coral} opacity={0.9} />
      </Svg>
      {Array.from({length: 7}, (_, i) => (
        <T key={i} x={690} y={237 + i * 50 + cut * i * 14} k={cut} size={22} font={F.mono} color={C.coralHi}>
          {i + 1}
        </T>
      ))}
      <L x={1357} y={610} k={essay}>
        effect
      </L>
      <L x={960} y={720} k={essay * ap(t, s(25) + 1)}>
        every verse numbered · in the style of Bible translations
      </L>
      <T x={1357} y={660} k={ap(t, s(27) + 0.8)} size={36} italic color={C.coralHi}>
        half gone
      </T>
    </AbsoluteFill>
  );
};
