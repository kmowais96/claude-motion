import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import timeline from './timeline.json';
import {N, NF, NH, NW, PAD_X, TEXT_W} from '../newborn/theme';
import {band, easeIn, easeInOut, easeOut, lerp, prog} from '../lib';
import {Grain, Mask} from '../components/primitives';
import {useFonts} from '../components/useFonts';

const TL = timeline;
const B = TL.beats;
export const NAMING_FPS = TL.fps;
export const NAMING_FRAMES = Math.round(TL.duration * TL.fps);
const HANDLE = 'TheTazkiyyahGuide';

const words = TL.words as [string, number][];
/** Start of the first spoken word `w` at or after `after` seconds. */
const at = (w: string, after = 0) => {
  const hit = words.find(([x, s]) => x === w && s >= after);
  if (!hit) throw new Error(`word not in timeline: ${w}`);
  return hit[1];
};

const T = {
  check: at('Check'),
  ibn: at('Ibn'),
  hadith: at("There's"),
  called: at('called'),
  abdullah: at('Abdullah'),
  abdurrahman: at('Abdurrahman.'),
  day: at('Day', B.rush),
  three: at('three,'),
  aqiqah: at('aqiqah'),
  matter: at('matter'),
  he: at('He', B.match),
  pick: at('pick'),
  asiya: at('Asiya,'),
  disobedient: at('disobedient,'),
  jamila: at('Jamila.'),
  beautiful: at('Beautiful.'),
  fatherNames: at('father', B.father),
  but: at('But'),
  /** End card: no spoken line, it lands just after the narration ends. */
  follow: TL.voEnd + 0.5,
};

/* ---------- photos ---------- */

type Shot = {
  src: string;
  w: number;
  h: number;
  from: number;
  to: number;
  fx: number;
  fy: number;
  zoom: [number, number];
  drift: [number, number];
  filter?: string;
  /** Show the whole picture (no crop) over a blurred fill, its top edge at this y. */
  containY?: number;
};

const SHOTS: Shot[] = [
  {src: 'father', w: 1334, h: 2000, from: 0, to: B.stays, fx: 0.45, fy: 0.5, zoom: [1.02, 1.14], drift: [0, -20], filter: 'grayscale(1) contrast(1.05)'},
  {src: 'window', w: 1500, h: 2000, from: B.stays, to: T.called - 0.25, fx: 0.4, fy: 0.5, zoom: [1.04, 1.14], drift: [20, -10]},
  {src: 'muhammad', w: 2000, h: 1334, from: T.called - 0.25, to: B.beloved, fx: 0.5, fy: 0.5, zoom: [1.0, 1.04], drift: [0, 0], containY: 470},
  {src: 'abd', w: 1420, h: 2000, from: B.beloved, to: B.rush, fx: 0.62, fy: 0.42, zoom: [1.14, 1.24], drift: [0, -20]},
  {src: 'hand', w: 1500, h: 2000, from: B.rush, to: T.day - 0.1, fx: 0.4, fy: 0.5, zoom: [1.04, 1.1], drift: [0, 10]},
  {src: 'foot', w: 2000, h: 1334, from: T.day - 0.1, to: B.match, fx: 0.42, fy: 0.5, zoom: [1.02, 1.12], drift: [30, -30]},
  {src: 'book', w: 2000, h: 1334, from: B.match, to: B.change, fx: 0.55, fy: 0.5, zoom: [1.06, 1.16], drift: [-30, 20]},
  {src: 'zaynab', w: 1334, h: 2000, from: B.change, to: B.father, fx: 0.5, fy: 0.45, zoom: [1.1, 1.2], drift: [10, -10]},
  {src: 'father', w: 1334, h: 2000, from: B.father, to: B.cta, fx: 0.4, fy: 0.3, zoom: [1.3, 1.42], drift: [0, -20], filter: 'grayscale(1) contrast(1.05)'},
  {src: 'toddlers', w: 2000, h: 1334, from: B.cta, to: T.follow - 0.3, fx: 0.5, fy: 0.5, zoom: [1.0, 1.08], drift: [0, 0]},
  {src: 'lattice', w: 1126, h: 2000, from: T.follow - 0.3, to: TL.duration + 1, fx: 0.5, fy: 0.5, zoom: [1.04, 1.1], drift: [0, 0]},
];

const cover = (s: Shot) => {
  const k = Math.max(NW / s.w, NH / s.h);
  const w = s.w * k;
  const h = s.h * k;
  return {w, h, x: (NW - w) * s.fx, y: (NH - h) * s.fy};
};

const XF = 0.5;

const Photo: React.FC<{t: number; s: Shot}> = ({t, s}) => {
  if (t < s.from - 0.05 || t > s.to + XF) return null;
  const o = Math.min(prog(t, s.from, s.from + XF, easeInOut), 1 - prog(t, s.to, s.to + XF, easeInOut));
  const k = prog(t, s.from, s.to + XF, (x) => x);
  const z = lerp(s.zoom[0], s.zoom[1], k);
  const c = cover(s);
  const img = (style: React.CSSProperties) => <Img src={staticFile(`naming/${s.src}.jpg`)} style={{position: 'absolute', ...style}} />;
  return (
    <AbsoluteFill style={{opacity: s.from <= 0 ? 1 : o}}>
      {s.containY === undefined ? (
        <div style={{position: 'absolute', inset: 0, transform: `translateX(${lerp(s.drift[0], s.drift[1], k)}px) scale(${z})`}}>
          {img({left: c.x, top: c.y, width: c.w, height: c.h, filter: s.filter})}
        </div>
      ) : (
        <>
          {img({left: c.x, top: c.y, width: c.w, height: c.h, filter: 'blur(40px) brightness(0.45)', transform: 'scale(1.1)'})}
          <div style={{position: 'absolute', left: 0, top: s.containY, width: NW, height: (NW * s.h) / s.w, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.6)'}}>
            {img({left: 0, top: 0, width: NW, height: (NW * s.h) / s.w, transform: `scale(${z})`})}
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};

const Grade: React.FC<{t: number}> = ({t}) => {
  const clean = band(t, T.called - 0.2, T.called + 0.4) * (1 - band(t, B.beloved - 0.3, B.beloved + 0.1));
  const ctaDim = band(t, B.cta, B.cta + 0.8) * (1 - band(t, T.follow - 0.3, T.follow + 0.3) * 0.4);
  return (
    <>
      <AbsoluteFill
        style={{
          opacity: 1 - clean * 0.6,
          background:
            'linear-gradient(180deg, rgba(7,8,12,0.82) 0%, rgba(7,8,12,0.25) 30%, rgba(7,8,12,0.1) 50%, rgba(7,8,12,0.55) 70%, rgba(7,8,12,0.9) 100%)',
        }}
      />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 90% 70% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.5) 100%)'}} />
      <AbsoluteFill style={{background: N.ink, opacity: ctaDim * 0.6}} />
    </>
  );
};

/* ---------- type ---------- */

const Header: React.FC<{t: number; from: number; to: number; num: string; title: string; arabic?: string; y?: number}> = ({
  t,
  from,
  to,
  num,
  title,
  arabic,
  y = 250,
}) => {
  if (t < from - 0.1 || t > to + 0.1) return null;
  const k1 = prog(t, from, from + 0.45, easeOut);
  const k2 = prog(t, from + 0.12, from + 0.6, easeOut);
  const k3 = prog(t, from + 0.3, from + 0.8, easeOut);
  const out = prog(t, to - 0.35, to, easeIn);
  return (
    <div style={{position: 'absolute', left: PAD_X, top: y, width: TEXT_W, opacity: 1 - out}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 18, opacity: k1}}>
        <div style={{width: 64 * k1, height: 3, background: N.gold}} />
        <div style={{fontFamily: NF.mono, fontWeight: 600, fontSize: 32, letterSpacing: '0.14em', color: N.gold}}>{num}</div>
      </div>
      <div style={{fontFamily: NF.serif, fontSize: 108, lineHeight: 1.0, color: N.cream, marginTop: 18, textShadow: '0 2px 20px rgba(0,0,0,0.6)'}}>
        <Mask k={k2} out={out * 0.3}>
          {title}
        </Mask>
      </div>
      {arabic && (
        <div style={{fontFamily: NF.arabic, fontSize: 58, lineHeight: 1.45, color: N.gold, marginTop: 8, direction: 'rtl', textAlign: 'left', opacity: k3, textShadow: '0 2px 16px rgba(0,0,0,0.85)'}}>
          {arabic}
        </div>
      )}
    </div>
  );
};

const Panel: React.FC<{t: number; from: number; to: number; y: number; children: React.ReactNode}> = ({t, from, to, y, children}) => {
  if (t < from - 0.05 || t > to + 0.05) return null;
  const k = prog(t, from, from + 0.55, easeOut);
  const out = prog(t, to - 0.35, to, easeIn);
  return (
    <div
      style={{
        position: 'absolute',
        left: PAD_X,
        top: y,
        width: TEXT_W,
        boxSizing: 'border-box',
        opacity: k * (1 - out),
        transform: `translateY(${(1 - k) * 30}px)`,
        padding: '34px 40px 30px',
        borderLeft: `4px solid ${N.gold}`,
        background: 'rgba(7,8,12,0.66)',
        backdropFilter: 'blur(6px)',
        borderRadius: '0 18px 18px 0',
      }}
    >
      {children}
    </div>
  );
};

const Quote: React.FC<{arabic?: string; english: string; by?: string}> = ({arabic, english, by}) => (
  <>
    {arabic && <div style={{fontFamily: NF.arabic, fontSize: 50, lineHeight: 1.55, color: N.cream, direction: 'rtl', textAlign: 'right'}}>{arabic}</div>}
    <div style={{fontFamily: NF.serif, fontStyle: 'italic', fontSize: 48, lineHeight: 1.14, color: N.cream, marginTop: arabic ? 14 : 0}}>{english}</div>
    {by && <div style={{fontFamily: NF.mono, fontSize: 24, letterSpacing: '0.1em', color: N.gold, marginTop: 18, textTransform: 'uppercase'}}>{by}</div>}
  </>
);

const Cite: React.FC<{t: number; from: number; to: number; label: string}> = ({t, from, to, label}) => {
  const o = prog(t, from, from + 0.4) * (1 - prog(t, to - 0.3, to));
  if (o <= 0) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: PAD_X,
        top: 1590,
        opacity: o,
        fontFamily: NF.mono,
        fontSize: 24,
        letterSpacing: '0.08em',
        color: N.creamDim,
        padding: '10px 18px',
        border: `1.5px solid ${N.faint}`,
        borderRadius: 999,
        background: 'rgba(7,8,12,0.5)',
      }}
    >
      {label}
    </div>
  );
};

/* ---------- captions ---------- */

type Group = {from: number; words: [string, number][]};
const BEAT_STARTS = Object.values(B).sort((a, b) => a - b);
const groups: Group[] = (() => {
  const out: Group[] = [];
  let cur: [string, number][] = [];
  const beatOf = (s: number) => BEAT_STARTS.filter((b) => b <= s + 0.01).length;
  words.forEach(([w, s], i) => {
    if (cur.length && beatOf(s) !== beatOf(cur[0][1])) {
      out.push({from: cur[0][1], words: cur});
      cur = [];
    }
    cur.push([w, s]);
    const next = words[i + 1];
    const long = cur.map((c) => c[0]).join(' ').length;
    if (/[.:…?,]$/.test(w) && (cur.length >= 2 || /[.:…?]$/.test(w))) {
      out.push({from: cur[0][1], words: cur});
      cur = [];
    } else if (long > 22 || !next) {
      out.push({from: cur[0][1], words: cur});
      cur = [];
    }
  });
  return out;
})();

const Captions: React.FC<{t: number}> = ({t}) => {
  if (t < B.stays || t >= T.follow - 0.1) return null;
  const i = groups.findIndex((g, j) => t >= g.from - 0.08 && (j + 1 === groups.length || t < groups[j + 1].from - 0.08));
  if (i < 0) return null;
  const g = groups[i];
  const last = g.words[g.words.length - 1][1];
  if (t > last + 1.1) return null;
  const k = prog(t, g.from - 0.08, g.from + 0.12, easeOut);
  return (
    <div
      style={{
        position: 'absolute',
        left: PAD_X,
        top: 1430,
        width: TEXT_W,
        fontFamily: NF.sans,
        fontWeight: 650,
        fontSize: 58,
        letterSpacing: '-0.01em',
        lineHeight: 1.15,
        color: N.cream,
        textShadow: '0 2px 18px rgba(0,0,0,0.75)',
        opacity: k,
        transform: `translateY(${(1 - k) * 12}px)`,
      }}
    >
      {g.words.map(([w, s], j) => {
        const nextS = j + 1 < g.words.length ? g.words[j + 1][1] : last + 0.6;
        const live = t >= s - 0.04 && t < nextS - 0.02;
        return (
          <span key={j} style={{display: 'inline-block', whiteSpace: 'nowrap', color: live ? N.gold : t < s ? 'rgba(245,239,226,0.5)' : N.cream, marginRight: '0.26em'}}>
            {w.replace(/[:]$/, '').replace(/\.\.\.$/, '…')}
          </span>
        );
      })}
    </div>
  );
};

/* ---------- scenes ---------- */

const Hook: React.FC<{t: number}> = ({t}) => {
  if (t > B.stays + 0.3) return null;
  const outAll = prog(t, B.stays - 0.25, B.stays + 0.2, easeIn);
  const line = (from: number) => prog(t, from - 0.05, from + 0.45, easeOut);
  return (
    <div style={{position: 'absolute', left: PAD_X, top: 1170, width: TEXT_W, opacity: 1 - outAll}}>
      <div style={{fontFamily: NF.serif, fontSize: 136, lineHeight: 1.0, color: N.cream, textShadow: '0 4px 30px rgba(0,0,0,0.6)'}}>
        <Mask k={line(B.hook)}>Picked a name</Mask>
        <br />
        <Mask k={line(at('yet?'))}>
          <span style={{color: N.gold}}>yet?</span>
        </Mask>
      </div>
      <div style={{marginTop: 44, fontFamily: NF.sans, fontWeight: 600, fontSize: 54, color: N.cream, opacity: line(T.check), transform: `translateY(${(1 - line(T.check)) * 16}px)`}}>
        Check these <span style={{color: N.gold}}>6 things</span> first.
      </div>
      <div style={{marginTop: 26, fontFamily: NF.mono, fontSize: 28, letterSpacing: '0.1em', color: N.creamDim, opacity: line(T.ibn)}}>
        IBN AL-QAYYIM · A WHOLE CHAPTER ON IT
      </div>
    </div>
  );
};

const Names: React.FC<{t: number}> = ({t}) => {
  const to = B.rush;
  if (t < T.abdullah - 0.2 || t > to + 0.1) return null;
  const out = prog(t, to - 0.35, to, easeIn);
  const name = (from: number, ar: string, en: string) => {
    const k = prog(t, from - 0.05, from + 0.4, easeOut);
    return (
      <div style={{opacity: k, transform: `scale(${lerp(0.92, 1, k)})`, transformOrigin: '0% 50%'}}>
        <div style={{fontFamily: NF.arabic, fontWeight: 700, fontSize: 132, lineHeight: 1.25, color: N.gold, direction: 'rtl', textAlign: 'left', textShadow: '0 4px 24px rgba(0,0,0,0.8)'}}>{ar}</div>
        <div style={{fontFamily: NF.mono, fontSize: 30, letterSpacing: '0.16em', color: N.cream}}>{en}</div>
      </div>
    );
  };
  return (
    <div style={{position: 'absolute', left: PAD_X, top: 760, width: TEXT_W, opacity: 1 - out, padding: '20px 40px 34px', background: 'rgba(7,8,12,0.86)', borderRadius: 22, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 18}}>
      {name(T.abdullah, 'عبد الله', 'ABDULLAH')}
      {name(T.abdurrahman, 'عبد الرحمن', 'ABDURRAHMAN')}
    </div>
  );
};

const Days: React.FC<{t: number}> = ({t}) => {
  const to = B.match;
  if (t < T.day - 0.2 || t > to + 0.1) return null;
  const out = prog(t, to - 0.35, to, easeIn);
  const chip = (from: number, label: string, sub: string) => {
    const k = prog(t, from - 0.05, from + 0.35, easeOut);
    return (
      <div style={{flex: 1, opacity: k, transform: `translateY(${(1 - k) * 24}px)`, padding: '26px 0 22px', borderRadius: 18, border: `2px solid ${N.gold}`, background: 'rgba(7,8,12,0.62)', textAlign: 'center'}}>
        <div style={{fontFamily: NF.serif, fontSize: 84, lineHeight: 1, color: N.cream}}>{label}</div>
        <div style={{fontFamily: NF.mono, fontSize: 22, letterSpacing: '0.14em', color: N.gold, marginTop: 10}}>{sub}</div>
      </div>
    );
  };
  const wide = prog(t, T.matter - 0.1, T.matter + 0.4, easeOut);
  return (
    <div style={{position: 'absolute', left: PAD_X, top: 860, width: TEXT_W, opacity: 1 - out}}>
      <div style={{display: 'flex', gap: 22}}>
        {chip(T.day, 'Day 1', 'BIRTH')}
        {chip(T.three, 'Day 3', '')}
        {chip(T.aqiqah, 'Day 7', 'AQIQAH')}
      </div>
      <div style={{marginTop: 40, fontFamily: NF.serif, fontStyle: 'italic', fontSize: 70, color: N.cream, opacity: wide, textShadow: '0 2px 20px rgba(0,0,0,0.8)'}}>
        “The matter is wide.”
      </div>
    </div>
  );
};

const Swap: React.FC<{t: number}> = ({t}) => {
  const to = B.father;
  if (t < T.asiya - 0.2 || t > to + 0.1) return null;
  const out = prog(t, to - 0.35, to, easeIn);
  const k1 = prog(t, T.asiya - 0.1, T.asiya + 0.35, easeOut);
  const kD = prog(t, T.disobedient, T.disobedient + 0.3, easeOut);
  const strike = prog(t, T.jamila - 0.35, T.jamila, easeInOut);
  const k2 = prog(t, T.jamila - 0.05, T.jamila + 0.4, easeOut);
  const kB = prog(t, T.beautiful, T.beautiful + 0.3, easeOut);
  const kZ = prog(t, T.beautiful + 0.5, T.beautiful + 0.9, easeOut);
  const word = (ar: string, en: string, meaning: string, km: number, gold: boolean) => (
    <div>
      <div style={{fontFamily: NF.arabic, fontWeight: 700, fontSize: 100, lineHeight: 1.3, color: gold ? N.gold : N.cream, direction: 'rtl', textAlign: 'left'}}>{ar}</div>
      <div style={{fontFamily: NF.serif, fontSize: 60, color: N.cream, lineHeight: 1}}>{en}</div>
      <div style={{fontFamily: NF.mono, fontSize: 24, letterSpacing: '0.12em', color: gold ? N.gold : N.creamDim, marginTop: 10, opacity: km}}>{meaning}</div>
    </div>
  );
  return (
    <div style={{position: 'absolute', left: PAD_X, top: 820, width: TEXT_W, opacity: 1 - out, padding: '26px 40px 30px', background: 'rgba(7,8,12,0.86)', borderRadius: 22, boxSizing: 'border-box'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 36}}>
        <div style={{position: 'relative', opacity: lerp(1, 0.55, strike) * k1}}>
          {word('عاصية', 'Asiya', 'DISOBEDIENT', kD, false)}
          <div style={{position: 'absolute', left: -6, top: '56%', height: 5, width: `${strike * 104}%`, background: N.gold}} />
        </div>
        <div style={{fontFamily: NF.serif, fontSize: 90, color: N.gold, opacity: k2}}>→</div>
        <div style={{opacity: k2, transform: `translateX(${(1 - k2) * 20}px)`}}>{word('جميلة', 'Jamila', 'BEAUTIFUL', kB, true)}</div>
      </div>
      <div style={{marginTop: 26, paddingTop: 20, borderTop: `1.5px solid ${N.faint}`, fontFamily: NF.sans, fontSize: 34, color: N.creamDim, opacity: kZ}}>
        Also: Barra → <span style={{color: N.cream}}>Zaynab</span>
      </div>
    </div>
  );
};

const RECAP = [
  'It stays with him',
  'Abdullah · Abdurrahman',
  'No rush: day 1, 3 or 7',
  'A meaning to grow into',
  'A bad name can change',
  'Father names, after talking',
];

const Recap: React.FC<{t: number}> = ({t}) => {
  const from = B.cta + 0.1;
  if (t < from - 0.1) return null;
  const out = prog(t, T.follow - 0.4, T.follow, easeIn);
  if (out >= 1) return null;
  return (
    <div style={{position: 'absolute', left: PAD_X, top: 300, width: TEXT_W, opacity: 1 - out}}>
      <div style={{fontFamily: NF.mono, fontSize: 30, letterSpacing: '0.16em', color: N.gold, opacity: prog(t, from, from + 0.3)}}>BEFORE THE BIRTH CERTIFICATE</div>
      {RECAP.map((r, i) => {
        const s = from + 0.2 + i * 0.28;
        const k = prog(t, s, s + 0.35, easeOut);
        const tick = prog(t, s + 0.15, s + 0.45, easeOut);
        return (
          <div key={r} style={{display: 'flex', alignItems: 'center', gap: 26, marginTop: 34, opacity: k, transform: `translateX(${(1 - k) * -24}px)`}}>
            <div style={{fontFamily: NF.mono, fontWeight: 600, fontSize: 30, color: N.gold, width: 44}}>{`0${i + 1}`}</div>
            <svg width={48} height={48} viewBox="0 0 52 52">
              <circle cx={26} cy={26} r={23} fill="none" stroke={N.gold} strokeWidth={2.5} />
              <path d="M 15 27 L 23 35 L 38 18" fill="none" stroke={N.gold} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={40} strokeDashoffset={40 * (1 - tick)} />
            </svg>
            <div style={{fontFamily: NF.serif, fontSize: 62, color: N.cream, lineHeight: 1.05, whiteSpace: 'nowrap'}}>{r}</div>
          </div>
        );
      })}
    </div>
  );
};

const EndCard: React.FC<{t: number}> = ({t}) => {
  const k = prog(t, T.follow - 0.1, T.follow + 0.5, easeOut);
  if (k <= 0) return null;
  return (
    <AbsoluteFill style={{alignItems: 'flex-start', justifyContent: 'center', paddingLeft: PAD_X, paddingBottom: 140}}>
      <div style={{opacity: k, transform: `translateY(${(1 - k) * 26}px)`, padding: '40px 44px', background: 'rgba(7,8,12,0.72)', borderRadius: 24, width: TEXT_W, boxSizing: 'border-box'}}>
        <div style={{fontFamily: NF.mono, fontSize: 30, letterSpacing: '0.16em', color: N.gold}}>FOLLOW</div>
        <div style={{fontFamily: NF.serif, fontSize: 108, color: N.cream, lineHeight: 1.0, marginTop: 14}}>The Tazkiyyah Guide</div>
        <div style={{fontFamily: NF.mono, fontWeight: 600, fontSize: 42, color: N.gold, marginTop: 22}}>@{HANDLE}</div>
        <div style={{fontFamily: NF.sans, fontSize: 36, color: N.creamDim, marginTop: 16}}>for similar posts</div>
        <div style={{fontFamily: NF.sans, fontSize: 23, color: N.creamDim, marginTop: 56, lineHeight: 1.4, opacity: prog(t, T.follow + 0.6, T.follow + 1.2)}}>
          Source: Ibn al-Qayyim, Tuhfat al-Mawdud, Bab 8 (ed. al-Arna'ut, Damascus 1971). Educational reminder, not a fatwa.
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Handle: React.FC<{t: number}> = ({t}) => {
  const o = prog(t, 0.4, 1.0) * (1 - prog(t, T.follow - 0.3, T.follow));
  return (
    <div style={{position: 'absolute', left: PAD_X, top: 120, fontFamily: NF.mono, fontSize: 26, letterSpacing: '0.06em', color: N.creamDim, opacity: o, textShadow: '0 2px 10px rgba(0,0,0,0.8)'}}>
      @{HANDLE} · Ibn al-Qayyim on naming
    </div>
  );
};

export const NamingShort: React.FC = () => {
  useFonts();
  const frame = useCurrentFrame();
  const t = frame / NAMING_FPS;
  const fade = prog(t, TL.duration - 0.5, TL.duration);
  const C = 'TUHFAT AL-MAWDUD · BAB 8';
  return (
    <AbsoluteFill style={{background: N.ink, overflow: 'hidden'}}>
      {SHOTS.map((s, i) => (
        <Photo key={i} t={t} s={s} />
      ))}
      <Grade t={t} />

      <Hook t={t} />

      <Header t={t} from={B.stays} to={T.called - 0.25} num="01" title="It stays with him" arabic="فأحسنوا أسماءكم" />
      <Panel t={t} from={T.hadith - 0.1} to={T.called - 0.25} y={900}>
        <Quote
          arabic="إنكم تدعون يوم القيامة بأسمائكم وبأسماء آبائكم فأحسنوا أسماءكم"
          english="“You will be called on the Day of Resurrection by your names and your fathers’ names, so make your names good.”"
          by="Abu Dawud, cited in Bab 8"
        />
      </Panel>
      <Cite t={t} from={B.stays + 0.4} to={B.beloved} label={`${C} · P.111`} />

      <Header t={t} from={B.beloved} to={B.rush} num="02" title="Most beloved to Allah" arabic="إن أحب أسمائكم إلى الله عز وجل" />
      <Names t={t} />
      <Cite t={t} from={B.beloved + 0.4} to={B.rush} label={`SAHIH MUSLIM · IN BAB 8 · P.111`} />

      <Header t={t} from={B.rush} to={B.match} num="03" title="No rush" arabic="والأمر فيه واسع" />
      <Days t={t} />
      <Cite t={t} from={B.rush + 0.4} to={B.match} label={`${C} · P.111`} />

      <Header t={t} from={B.match} to={B.change} num="04" title="Name and named" />
      <Panel t={t} from={T.he - 0.1} to={B.change} y={760}>
        <Quote
          arabic="قل ما ترى اسما قبيحا إلا وهو على مسمى قبيح"
          english="“Seldom do you see an ugly name except on someone who matches it.”"
          by="Ibn al-Qayyim · Bab 8"
        />
      </Panel>
      <Cite t={t} from={B.match + 0.4} to={B.change} label={`${C} · P.146`} />

      <Header t={t} from={B.change} to={B.father} num="05" title="A bad name can change" />
      <Swap t={t} />
      <Cite t={t} from={B.change + 0.4} to={B.father} label={`${C} · P.129`} />

      <Header t={t} from={B.father} to={B.cta} num="06" title="If you disagree" arabic="فهي للأب" />
      <Panel t={t} from={T.fatherNames - 0.1} to={B.cta} y={880}>
        <Quote english="The naming right is the father’s. He says there is no dispute on it." by="Ibn al-Qayyim · Bab 8" />
        <div style={{fontFamily: NF.serif, fontStyle: 'italic', fontSize: 52, color: N.gold, marginTop: 26, opacity: prog(t, T.but - 0.05, T.but + 0.35, easeOut)}}>
          …but talk it through with her first.
        </div>
      </Panel>
      <Cite t={t} from={B.father + 0.4} to={B.cta} label={`${C} · P.135`} />

      <Recap t={t} />
      <EndCard t={t} />
      <Captions t={t} />
      <Handle t={t} />
      <Grain frame={frame} opacity={0.06} />
      <AbsoluteFill style={{background: '#000', opacity: fade}} />
    </AbsoluteFill>
  );
};
