import React from 'react';
import {AbsoluteFill} from 'remotion';
import {lerp, rand} from '../lib';
import {AR, C, F, L, Svg, T, ap, at, clamp01, dis, draw, easeInOut, prog, win, within} from './kit';

type S = React.FC<{t: number}>;

/** Sound arcs from (x,y) toward the right, pulsing outward. */
const Arcs: React.FC<{x: number; y: number; k: number; t: number; color?: string; dir?: number; n?: number}> = ({x, y, k, t, color = C.coral, dir = 1, n = 3}) => (
  <g opacity={k}>
    {Array.from({length: n}, (_, i) => {
      const p = ((t * 0.7 + i / n) % 1);
      const r = 30 + p * 110;
      return <path key={i} d={`M${x + dir * r * 0.5} ${y - r * 0.8} A ${r} ${r} 0 0 ${dir > 0 ? 1 : 0} ${x + dir * r * 0.5} ${y + r * 0.8}`} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" opacity={1 - p} />;
    })}
  </g>
);

const Crowd: React.FC<{x: number; y: number; k: number; n?: number; spread?: number; hi?: number}> = ({x, y, k, n = 11, spread = 1, hi = -1}) => (
  <g opacity={k}>
    {Array.from({length: n}, (_, i) => {
      const a = rand(i + 40) * Math.PI * 2;
      const r = Math.sqrt(rand(i + 70)) * 70 * spread;
      return <circle key={i} cx={x + Math.cos(a) * r} cy={y + Math.sin(a) * r * 0.8} r={i === hi ? 10 : 7} fill={i === hi ? C.coral : C.creamDim} />;
    })}
  </g>
);

/** Speech, not writing. */
export const Speech: S = ({t}) => {
  const s = (i: number) => at(4, i);
  const A = win(t, s(0), s(3) - 0.4);
  const B = win(t, s(3), s(8) - 0.4);
  const Cv = win(t, s(8), s(12) - 0.4);
  const D = ap(t, s(12));
  const book = ap(t, s(0) + 0.6) * (1 - 0.7 * ap(t, s(1)));
  const occ = ap(t, s(2));
  const aboutTo = prog(t, within(4, 9, 0.45), within(4, 9, 0.65), easeInOut);
  const one = prog(t, s(10) - 0.1, s(10) + 0.4, easeInOut) * (1 - prog(t, within(4, 10, 0.55), within(4, 10, 0.85), easeInOut));
  const roles = ['for himself', 'for a group', 'for a higher power', 'that power itself'];
  const join = ap(t, s(12), 0.6) * (1 - prog(t, s(13), s(13) + 0.6, easeInOut)) + prog(t, within(4, 15, 0.3), within(4, 15, 0.8), easeInOut);
  const segs = [0, 1, 2, 3];
  return (
    <AbsoluteFill>
      {/* A: speech vs booklets, then an address for each occasion */}
      <Svg o={A * (1 - occ)}>
        <circle cx={600} cy={380} r={16} fill={C.cream} />
        <Arcs x={600} y={380} k={ap(t, s(0))} t={t} />
        <Crowd x={860} y={380} k={ap(t, s(0) + 0.3)} />
        <g opacity={book}>
          <rect x={1260} y={260} width={190} height={250} rx={6} fill="none" stroke={C.creamDim} strokeWidth={2.5} />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <line key={i} x1={1285} x2={1425 - (i === 5 ? 50 : 0)} y1={300 + i * 32} y2={300 + i * 32} stroke={C.faint} strokeWidth={4} />
          ))}
        </g>
        <line x1={1240} x2={1470} y1={530} y2={240} stroke={C.coral} strokeWidth={4} {...draw(prog(t, s(1) + 0.3, s(1) + 1))} />
      </Svg>
      <L x={730} y={560} k={A * (1 - occ)} color={C.coralHi}>
        speech
      </L>
      <L x={1355} y={560} k={A * (1 - occ)}>
        written booklets
      </L>
      <Svg o={A * occ}>
        <line x1={300} x2={1620} y1={420} y2={420} stroke={C.lineHi} strokeWidth={2} />
        {Array.from({length: 7}, (_, i) => {
          const tt = within(4, 2, 0.08 + i * 0.12);
          const k = ap(t, tt, 0.5);
          return (
            <g key={i}>
              <circle cx={380 + i * 193} cy={420} r={9} fill={C.coral} opacity={k} />
              <Arcs x={380 + i * 193} y={420} k={k * (1 - prog(t, tt + 1.4, tt + 2.2))} t={t + i * 0.3} n={2} />
            </g>
          );
        })}
      </Svg>
      <L x={960} y={500} k={A * occ}>
        the call moves forward · an address for each occasion
      </L>
      <T x={960} y={570} k={A * ap(t, within(4, 2, 0.5))} size={36} italic color={C.creamDim}>
        delivered like a sermon
      </T>
      {/* B: on paper vs in speech */}
      <Svg o={B}>
        <line x1={960} x2={960} y1={190} y2={700} stroke={C.line} strokeWidth={2} />
        <rect x={440} y={240} width={360} height={430} rx={6} fill="none" stroke={C.faint} strokeWidth={2} />
        <Crowd x={1360} y={360} k={ap(t, s(5))} hi={3} />
        <circle cx={1360} cy={590} r={14} fill={C.cream} opacity={ap(t, s(5))} />
        <path d="M1360 572 Q 1300 480 1330 400" fill="none" stroke={C.coral} strokeWidth={3} strokeLinecap="round" {...draw(prog(t, within(4, 5, 0.5), within(4, 5, 0.75)))} />
        <ellipse cx={1360} cy={440} rx={250} ry={210} fill={C.coral} opacity={0.1 * ap(t, s(7), 1.2)} />
        <ellipse cx={1360} cy={440} rx={250} ry={210} fill="none" stroke={C.coral} strokeWidth={2} strokeDasharray="3 10" opacity={ap(t, s(7), 1.2)} />
      </Svg>
      <L x={620} y={180} k={B}>
        on paper
      </L>
      <L x={1360} y={180} k={B} color={C.coralHi}>
        in speech
      </L>
      {[
        ['"People say …"', s(4)],
        ['the answer', within(4, 4, 0.6)],
        ['the setting, explained in words', s(6)],
      ].map(([txt, tt], i) => (
        <T key={i} x={470} y={300 + i * 90} k={B * ap(t, tt as number)} size={32} italic={i === 0} color={i === 2 ? C.muted : C.creamDim} align="left" w={320}>
          {txt}
        </T>
      ))}
      <L x={1360} y={665} k={B * ap(t, s(7) + 0.5)} size={17}>
        the setting is all around
      </L>
      {/* C: voices shift */}
      <Svg o={Cv}>
        <circle cx={760} cy={360} r={16} fill={C.cream} />
        <line x1={790} x2={1120} y1={360} y2={360} stroke={C.coral} strokeWidth={4} strokeDasharray={aboutTo > 0.5 ? undefined : '6 12'} opacity={ap(t, s(9))} />
        <path d="M1120 346 L1140 360 L1120 374" fill="none" stroke={C.coral} strokeWidth={4} opacity={ap(t, s(9)) * aboutTo} />
        <Crowd x={1240} y={360} k={1} n={11} spread={1 - one * 0.95} />
      </Svg>
      <L x={960} y={300} k={Cv * ap(t, s(9)) * (1 - aboutTo)}>
        spoken about
      </L>
      <L x={960} y={300} k={Cv * aboutTo} color={C.coralHi}>
        spoken to
      </L>
      <L x={1240} y={480} k={Cv * ap(t, s(10))}>
        {one > 0.5 ? 'one person' : 'many'}
      </L>
      {roles.map((r, i) => {
        const on = ap(t, within(4, 11, 0.06 + i * 0.22));
        const now = on * (1 - ap(t, within(4, 11, 0.28 + i * 0.22)) * 0.6);
        return (
          <T key={r} x={420 + i * 360} y={620} k={Cv * on} size={34} italic={i === 3} color={now > 0.7 && i === 3 ? C.coralHi : now > 0.7 ? C.cream : C.muted}>
            {r}
          </T>
        );
      })}
      <L x={960} y={560} k={Cv * ap(t, s(11))} size={17}>
        sometimes the speaker speaks
      </L>
      {/* D: beauty aloud, disconnected on paper, closed in another language */}
      <Svg o={D}>
        {segs.map((i) => {
          const x = 560 + i * 200;
          const off = (1 - join) * (i % 2 === 0 ? -26 : 26);
          const gap = (1 - join) * 26;
          return (
            <path
              key={i}
              d={`M${x + gap} ${380 + off} Q ${x + 100} ${380 + off + (i % 2 === 0 ? -70 : 70)} ${x + 200 - gap} ${380 + off}`}
              fill="none"
              stroke={join > 0.5 ? C.coral : C.muted}
              strokeWidth={6}
              strokeLinecap="round"
              strokeDasharray={join > 0.5 ? undefined : '14 10'}
            />
          );
        })}
        <g opacity={win(t, s(14), s(15) + 0.6)}>
          <rect x={530} y={300} width={860} height={160} rx={8} fill="none" stroke={C.creamDim} strokeWidth={2} />
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <circle cx={1440} cy={320 + i * 60} r={7} fill={C.coral} />
              <line x1={1460} x2={1560} y1={320 + i * 60} y2={320 + i * 60} stroke={C.faint} strokeWidth={4} />
            </g>
          ))}
        </g>
      </Svg>
      <T x={960} y={560} k={win(t, s(12), s(13) - 0.3)} size={40} italic color={C.coralHi}>
        heard aloud: beauty
      </T>
      <T x={960} y={560} k={win(t, s(13), s(14) - 0.3)} size={40} italic color={C.muted}>
        on paper: disconnected
      </T>
      <L x={960} y={560} k={win(t, s(14), s(15) - 0.3)}>
        in Arabic the text stays as it is · only notes can help
      </L>
      <T x={960} y={560} k={ap(t, within(4, 15, 0.5))} size={40} italic color={C.cream}>
        in another language, the gap can close
      </T>
    </AbsoluteFill>
  );
};

/** Every surah had a moment; strip it away and things turn upside down. */
export const Setting: S = ({t}) => {
  const s = (i: number) => at(4, i);
  const band = ap(t, s(16) + 0.4, 1.2);
  const strip = prog(t, s(18), s(18) + 1.2, easeInOut);
  const flip = prog(t, within(4, 18, 0.45), within(4, 18, 0.7), easeInOut) * (1 - prog(t, s(19), s(19) + 1, easeInOut));
  const carry = prog(t, s(19) + 0.6, s(19) + 1.8, easeInOut);
  const bandX = lerp(0, -1400, strip);
  return (
    <AbsoluteFill>
      <Svg>
        <rect x={360 + bandX} y={250} width={1200} height={260} rx={14} fill={C.coral} opacity={0.12 * band} />
        <rect x={360 + bandX} y={250} width={1200} height={260} rx={14} fill="none" stroke={C.coral} strokeWidth={2} strokeDasharray="3 10" opacity={band} />
        <rect x={860} y={330 + 100 * carry} width={200} height={40} rx={6} fill={C.coral} opacity={0.4 * carry} />
        <g transform={`rotate(${flip * 180} 960 380)`}>
          <rect x={860} y={310} width={200} height={140} rx={8} fill={C.panelHi} stroke={C.cream} strokeWidth={2.5} />
          {[0, 1, 2].map((i) => (
            <line key={i} x1={885} x2={1035 - (i === 2 ? 50 : 0)} y1={345 + i * 32} y2={345 + i * 32} stroke={C.creamDim} strokeWidth={5} strokeLinecap="round" />
          ))}
          <path d="M1060 310 L1060 330" stroke={C.coral} strokeWidth={0} />
        </g>
      </Svg>
      <L x={960} y={278} k={band * (1 - strip)} color={C.coralHi}>
        a particular moment
      </L>
      <L x={600} y={480} k={ap(t, s(17)) * (1 - strip)} size={17}>
        its background
      </L>
      <L x={1320} y={480} k={ap(t, within(4, 17, 0.5)) * (1 - strip)} size={17}>
        the needs it came to meet
      </L>
      <L x={960} y={200} k={ap(t, s(16))}>
        surah: an address
      </L>
      <T x={960} y={590} k={win(t, within(4, 18, 0.45), s(19) - 0.3)} size={38} italic color={C.creamDim}>
        some things not understood, some understood upside down
      </T>
      <T x={960} y={590} k={ap(t, s(19) + 1)} size={38} italic color={C.coralHi}>
        a rendering can carry some of the background
      </T>
    </AbsoluteFill>
  );
};

const KUFR = [
  'complete disbelief',
  'simple denial',
  'only ingratitude',
  'falling short in what faith requires',
  'believing, but refusing in practice',
  'obeying outwardly, disbelieving inside',
];

/** One word, six senses; translated flat, the reader misses, misreads, gets lost. */
export const Kufr: S = ({t}) => {
  const s = (i: number) => at(4, i);
  const word = ap(t, s(22), 1);
  const flat = prog(t, s(29), s(29) + 1, easeInOut);
  const cx = 960;
  const cy = 400;
  const pos = KUFR.map((_, i) => {
    const a = -Math.PI / 2 + ((i + 0.5) / 6) * Math.PI * 2;
    return [cx + Math.cos(a) * 520, cy + Math.sin(a) * 250] as const;
  });
  const verdict = ['missed', 'misread', 'lost'];
  return (
    <AbsoluteFill>
      <L x={960} y={140} k={ap(t, s(20)) * (1 - word)} color={C.coralHi}>
        and then · vocabulary
      </L>
      <T x={960} y={400} k={ap(t, s(21)) * (1 - word)} size={50} italic>
        a language within the language
      </T>
      <Svg>
        {pos.map(([x, y], i) => {
          const k = ap(t, s(23 + i), 0.8);
          return <line key={i} x1={lerp(cx, x, 0.36)} y1={lerp(cy, y, 0.36)} x2={lerp(lerp(cx, x, 0.36), lerp(cx, x, 0.72), k)} y2={lerp(lerp(cy, y, 0.36), lerp(cy, y, 0.72), k)} stroke={C.coral} strokeWidth={2.5} opacity={(1 - flat) * k} />;
        })}
      </Svg>
      <T x={cx} y={cy - 10} k={word} size={140} font={AR} color={C.coral} rtl>
        كُفْر
      </T>
      {pos.map(([x, y], i) => {
        const k = ap(t, s(23 + i), 0.8);
        const v = i < 3 ? ap(t, within(4, 30, 0.15 + i * 0.27)) : 0;
        const vi = [1, 3, 5][i] ?? 0;
        return (
          <React.Fragment key={i}>
            <T x={x} y={y} k={k * (1 - flat)} size={34} italic={false} color={C.cream} w={340}>
              {KUFR[i]}
            </T>
            <T x={x} y={y} k={k * flat} size={36} italic color={C.muted}>
              kufr
            </T>
            <T x={pos[vi][0]} y={pos[vi][1] + 46} k={v} size={30} italic color={C.coralHi}>
              {verdict[i]}
            </T>
          </React.Fragment>
        );
      })}
      <L x={960} y={720} k={ap(t, s(29) + 0.6)}>
        technically correct
      </L>
    </AbsoluteFill>
  );
};

/** What he did: meaning and effect carried over; freedom used while afraid. */
export const Did: S = ({t}) => {
  const s = (i: number) => at(5, i);
  const P1 = win(t, s(0), s(6) - 0.4);
  const P2 = ap(t, s(6));
  const clothes = ap(t, s(1)) * (1 - ap(t, s(2)));
  const strike = prog(t, within(5, 1, 0.5), within(5, 1, 0.8));
  const pipe = prog(t, within(5, 2, 0.1), within(5, 2, 0.9), easeInOut);
  const goals = ['clear Arabic → clear Urdu', 'the flow of speech, natural', 'majesty and force, as far as possible'];
  const fear = ap(t, s(8));
  const allow = ap(t, s(9));
  const fx = 960 + Math.sin(t * 0.9) * 180 * (1 - 0.6 * allow) + Math.sin(t * 2.3) * 40;
  const fy = 380 + Math.cos(t * 1.1) * 70 * (1 - 0.5 * allow);
  const tremble = fear * (Math.sin(t * 47) * 2.2 + Math.sin(t * 31) * 1.6);
  return (
    <AbsoluteFill>
      <L x={960} y={130} k={ap(t, s(0)) * P1} color={C.coralHi}>
        what he did
      </L>
      <Svg o={P1}>
        <g opacity={clothes}>
          {[0, 1, 2, 3, 4].map((i) => (
            <g key={i}>
              <rect x={700 + i * 110} y={330} width={80} height={36} rx={6} fill={C.panelHi} stroke={C.creamDim} strokeWidth={2} />
              <rect x={690 + i * 110} y={320} width={100} height={56} rx={10} fill="none" stroke={C.muted} strokeWidth={2} strokeDasharray="5 6" />
            </g>
          ))}
          <line x1={670} x2={lerp(670, 1250, strike)} y1={348} y2={348} stroke={C.coral} strokeWidth={4} />
        </g>
        <g opacity={ap(t, s(2))}>
          {[0, 1, 2].map((i) => (
            <rect key={i} x={360} y={290 + i * 34} width={220} height={12} rx={6} fill={C.creamDim} />
          ))}
          <path d="M600 330 C 700 330, 760 290, 860 300" fill="none" stroke={C.cream} strokeWidth={3} {...draw(clamp01(pipe * 3))} />
          <path d="M600 345 C 700 345, 760 390, 860 380" fill="none" stroke={C.coral} strokeWidth={3} {...draw(clamp01(pipe * 3 - 0.3))} />
          <circle cx={960} cy={340} r={90} fill={C.coral} opacity={0.1 * clamp01(pipe * 2 - 0.4)} />
          <circle cx={960} cy={340} r={90} fill="none" stroke={C.coral} strokeWidth={2} {...draw(clamp01(pipe * 2 - 0.4))} />
          <path d="M1060 340 C 1160 280, 1260 400, 1360 340 S 1500 300, 1560 340" fill="none" stroke={C.coral} strokeWidth={6} strokeLinecap="round" {...draw(clamp01(pipe * 2 - 1))} />
        </g>
      </Svg>
      <T x={1000} y={240} k={P1 * clothes} size={34} italic color={C.creamDim}>
        not words dressed in Urdu clothes
      </T>
      <L x={470} y={420} k={P1 * ap(t, s(2))}>
        a passage
      </L>
      <T x={730} y={262} k={P1 * ap(t, within(5, 2, 0.2))} size={26} color={C.cream}>
        the meaning he understood
      </T>
      <T x={730} y={422} k={P1 * ap(t, within(5, 2, 0.35))} size={26} color={C.coralHi}>
        the effect on his heart
      </T>
      <L x={1360} y={420} k={P1 * ap(t, within(5, 2, 0.75))} color={C.coralHi}>
        his own language
      </L>
      {goals.map((g, i) => (
        <T key={g} x={960} y={540 + i * 60} k={P1 * ap(t, s(3 + i))} size={36} italic={i === 2} color={i === 2 ? C.coralHi : C.cream}>
          {g}
        </T>
      ))}
      <Svg o={P2}>
        <rect x={560} y={210} width={800} height={340} rx={16} fill="none" stroke={ap(t, s(7)) > 0.5 ? C.coral : C.creamDim} strokeWidth={3} />
        <circle cx={fx + tremble} cy={fy + tremble * 0.6} r={14} fill={C.cream} />
      </Svg>
      <L x={960} y={180} k={P2 * ap(t, s(6))}>
        freedom
      </L>
      <L x={960} y={585} k={P2 * ap(t, s(7)) * (1 - allow)} color={C.coralHi}>
        the Word of God
      </L>
      <L x={960} y={585} k={P2 * allow} color={C.coralHi}>
        within what the Qur'an's own words allow
      </L>
      <T x={960} y={690} k={P2 * fear} size={50} italic>
        "I used this freedom while very much afraid."
      </T>
      <L x={960} y={750} k={P2 * fear} size={15}>
        his words · our English rendering of the Urdu
      </L>
    </AbsoluteFill>
  );
};

/** Two more tools: an introduction before every surah, and notes in two kinds of places. */
export const Tools: S = ({t}) => {
  const s = (i: number) => at(5, i);
  const col = ap(t, s(10));
  const intro = ap(t, s(11));
  const rows = ['when it was revealed', 'what was happening', 'the stage of the movement of Islam', 'its needs and problems'];
  const eye = ap(t, s(15));
  return (
    <AbsoluteFill>
      <Svg o={col}>
        {Array.from({length: 9}, (_, i) => (
          <rect key={i} x={830} y={230 + i * 46} width={i === 8 ? 180 : 300} height={12} rx={6} fill={C.creamDim} opacity={0.5 + 0.5 * eye} />
        ))}
        <rect x={810} y={210} width={340} height={430} rx={8} fill="none" stroke={eye > 0.5 ? C.coral : C.lineHi} strokeWidth={2} />
        <g opacity={intro * (1 - eye * 0.7)}>
          <rect x={300} y={210} width={440} height={300} rx={8} fill={C.panel} stroke={C.coral} strokeWidth={2} />
          <line x1={740} x2={810} y1={260} y2={260} stroke={C.coral} strokeWidth={2} strokeDasharray="3 6" />
        </g>
        {[0, 1].map((i) => {
          const k = ap(t, s(13 + i));
          const y = [325, 509][i];
          return (
            <g key={i} opacity={k * (1 - eye * 0.7)}>
              <line x1={1150} x2={1210} y1={y} y2={y} stroke={C.coral} strokeWidth={2} />
              <circle cx={1222} cy={y} r={12} fill="none" stroke={C.coral} strokeWidth={3} />
              <text x={1222} y={y + 6} fill={C.coralHi} fontFamily={F.mono} fontSize={16} textAnchor="middle">
                {i + 1}
              </text>
            </g>
          );
        })}
      </Svg>
      <L x={520} y={240} k={intro * (1 - eye * 0.7)} color={C.coralHi} size={17}>
        before every surah
      </L>
      {rows.map((r, i) => (
        <T key={r} x={330} y={295 + i * 52} k={ap(t, within(5, 11, 0.2 + i * 0.19)) * (1 - eye * 0.7)} size={28} align="left" color={C.cream}>
          {r}
        </T>
      ))}
      <L x={1300} y={180} k={ap(t, s(12)) * (1 - eye * 0.7)}>
        notes · only two kinds
      </L>
      <T x={1255} y={325} k={ap(t, s(13) + 0.3) * (1 - eye * 0.7)} size={28} align="left" w={480}>
        where a question or doubt would rise
      </T>
      <T x={1255} y={509} k={ap(t, s(14) + 0.3) * (1 - eye * 0.7)} size={28} align="left" w={480}>
        where a reader might hurry past the spirit of a verse
      </T>
      <L x={980} y={700} k={eye} color={C.coralHi}>
        nothing that pulls the eye away from the Qur'an
      </L>
    </AbsoluteFill>
  );
};

const STEPS = [
  ['the surah\'s introduction', 'read it first, return to it'],
  ['word for word', 'verse by verse'],
  ['his rendering, straight through', 'no notes: the whole message at once'],
  ['verse by verse, with the notes', 'for the detail'],
];

/** The four-step daily method. */
export const Method: S = ({t}) => {
  const s = (i: number) => at(6, i);
  const on = [s(1), s(2), s(4), s(5)];
  const active = on.reduce((acc, a, i) => (t >= a ? i : acc), -1);
  const loop = ap(t, s(6), 1.2);
  const cw = 360;
  const x0 = 960 - (4 * cw + 3 * 40) / 2;
  return (
    <AbsoluteFill>
      <L x={960} y={130} k={ap(t, s(0))} color={C.coralHi}>
        how to read it
      </L>
      <Svg>
        {STEPS.map((_, i) => {
          const k = ap(t, s(0) + 0.3 + i * 0.2);
          const lit = ap(t, on[i], 0.5);
          const x = x0 + i * (cw + 40);
          return (
            <g key={i} opacity={k}>
              <rect x={x} y={240} width={cw} height={250} rx={12} fill={i === active ? 'rgba(217,119,87,0.12)' : C.panel} stroke={lit > 0.5 ? (i === active ? C.coral : C.creamDim) : C.line} strokeWidth={2.5} />
            </g>
          );
        })}
        <path d={`M${x0 + 3 * (cw + 40) + cw / 2} 500 C ${x0 + 3 * (cw + 40) + cw / 2} 660, ${x0 + cw + 40 + cw / 2} 660, ${x0 + cw + 40 + cw / 2} 555`} fill="none" stroke={C.coral} strokeWidth={3} strokeDasharray="4 10" opacity={loop} />
      </Svg>
      {STEPS.map(([a, b], i) => {
        const x = x0 + i * (cw + 40) + 30;
        const k = ap(t, s(0) + 0.3 + i * 0.2);
        const lit = ap(t, on[i], 0.6);
        return (
          <React.Fragment key={a}>
            <T x={x} y={285} k={k} size={46} font={F.serif} color={lit > 0.5 ? C.coral : C.muted} align="left">
              {i + 1}
            </T>
            <T x={x} y={375} k={k * (0.35 + 0.65 * lit)} size={32} align="left" w={cw - 60}>
              {a}
            </T>
            <T x={x} y={455} k={k * lit} size={22} align="left" w={cw - 60} color={C.creamDim} italic>
              {b}
            </T>
          </React.Fragment>
        );
      })}
      <L x={x0 + cw + 40 + cw / 2} y={530} k={ap(t, s(3))} size={16}>
        Persian, Urdu or English
      </L>
      <L x={960} y={665} k={loop}>
        each day's portion
      </L>
      <T x={960} y={735} k={ap(t, s(7))} size={38} italic color={C.creamDim}>
        perhaps not like a scholar · <span style={{color: C.coralHi}}>but well, in sha' Allah</span>
      </T>
    </AbsoluteFill>
  );
};

/** 1942 → Surah Yusuf → stalled → arrested Oct 1948 → jail gave the time. */
export const Book: S = ({t}) => {
  const s = (i: number) => at(6, i);
  const X = (f: number) => 300 + f * 1320;
  const f42 = 0;
  const fYus = 0.5;
  const f48 = 0.72;
  const work = prog(t, s(11), s(11) + 3.4, easeInOut);
  const stall = prog(t, s(12), s(12) + 2.2, easeInOut);
  const cell = ap(t, s(14), 0.9);
  const res = prog(t, s(15), s(15) + 2.4, easeInOut);
  const pray = ap(t, s(16));
  const y = 420;
  return (
    <AbsoluteFill>
      <Svg>
        <line x1={X(0)} x2={X(1)} y1={y} y2={y} stroke={C.line} strokeWidth={2} opacity={ap(t, s(9))} />
        <circle cx={X(f42)} cy={y} r={10} fill={C.coral} opacity={ap(t, s(10))} />
        <line x1={X(f42)} x2={X(lerp(f42, fYus, work))} y1={y} y2={y} stroke={C.coral} strokeWidth={8} strokeLinecap="round" opacity={work > 0 ? 1 : 0} />
        <circle cx={X(fYus)} cy={y} r={10} fill={C.coral} opacity={work > 0.98 ? 1 : 0} />
        <line x1={X(fYus)} x2={X(lerp(fYus, f48, stall))} y1={y} y2={y} stroke={C.muted} strokeWidth={4} strokeDasharray="4 12" opacity={stall > 0 ? 1 : 0} />
        <g opacity={cell}>
          <rect x={X(f48)} y={y - 120} width={240} height={240} rx={10} fill="rgba(217,119,87,0.06)" stroke={C.creamDim} strokeWidth={2.5} />
          {[1, 2, 3, 4, 5].map((j) => (
            <line key={j} x1={X(f48) + j * 40} x2={X(f48) + j * 40} y1={y - 120} y2={lerp(y - 120, y + 120, cell)} stroke={C.cream} strokeWidth={5} />
          ))}
        </g>
        <line x1={X(f48)} x2={X(lerp(f48, 0.9, res))} y1={y} y2={y} stroke={C.coral} strokeWidth={8} strokeLinecap="round" opacity={res > 0 ? 1 : 0} />
        <g opacity={pray} transform={`translate(${X(0.95)} ${y})`}>
          <rect x={-26} y={-60} width={52} height={120} rx={4} fill={C.coral} />
        </g>
      </Svg>
      <L x={X(f42)} y={y + 60} k={ap(t, s(10))} color={C.cream}>
        Feb 1942
      </L>
      <T x={X(f42)} y={y - 60} k={ap(t, s(10) + 0.4)} size={30} italic color={C.creamDim}>
        began
      </T>
      <L x={X(fYus)} y={y + 60} k={ap(t, s(11) + 2.6)} color={C.cream}>
        end of Surah Yusuf
      </L>
      <T x={X(0.25)} y={y - 60} k={ap(t, s(11) + 1)} size={30} italic color={C.creamDim}>
        more than five years
      </T>
      <T x={X(0.61)} y={y - 60} k={ap(t, s(12) + 0.5) * (1 - cell * 0.6)} size={28} italic color={C.muted}>
        no time to write or revise
      </T>
      <T x={960} y={190} k={win(t, s(13), s(14))} size={40} italic>
        good luck, or bad luck?
      </T>
      <L x={X(f48) + 120} y={y + 160} k={cell} color={C.coralHi}>
        Oct 1948 · arrested
      </L>
      <T x={X(f48) + 120} y={y - 170} k={ap(t, s(15) + 0.6)} size={34} italic color={C.coralHi}>
        the time the book needed
      </T>
      <T x={960} y={680} k={pray} size={36} italic color={C.creamDim}>
        that it truly helps God's servants understand the Qur'an
      </T>
    </AbsoluteFill>
  );
};

/** His closing line, then four lines, then the end card. */
export const Close: S = ({t}) => {
  const s = (i: number) => at(6, i);
  const ar = ap(t, s(17), 1.2) * dis(t, s(20) - 0.6);
  const lines = ['Read the setting.', 'Learn the words.', 'Hear it whole.', 'Then go deep.'];
  const endC = ap(t, s(23) + 1.4, 1);
  const lk = dis(t, s(23) + 1);
  return (
    <AbsoluteFill>
      <T x={960} y={300} k={ar} size={92} font={AR} color={C.coral} rtl>
        وَمَا تَوْفِيقِي إِلَّا بِاللَّهِ الْعَلِيِّ الْعَظِيمِ
      </T>
      <T x={960} y={470} k={ar * ap(t, s(19))} size={46} italic>
        My success is only through God, the Most High, the Most Great.
      </T>
      <L x={960} y={560} k={ar * ap(t, s(17) + 0.8)} size={17}>
        his closing line · the first part is Qur'an 11:88
      </L>
      {lines.map((l, i) => (
        <T key={l} x={960} y={250 + i * 105} k={ap(t, s(20 + i), 0.6) * lk} size={84} color={i === 3 ? C.coral : C.cream} italic={i === 3}>
          {l}
        </T>
      ))}
      <T x={960} y={420} k={endC} size={110}>
        Before You Read the <span style={{color: C.coral, fontStyle: 'italic'}}>Qur'an</span>
      </T>
      <L x={960} y={560} k={ap(t, s(23) + 2, 1)} color={C.creamDim}>
        the preface to Tafhim al-Qur'an, vol. 1 · Sayyid Abu'l-A'la Mawdudi
      </L>
      <L x={960} y={605} k={ap(t, s(23) + 2.3, 1)} size={17}>
        paraphrased in English from the Urdu
      </L>
    </AbsoluteFill>
  );
};
