import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import timeline from './timeline.json';
import {N, NF, NH, NW, PAD_X, TEXT_W} from '../newborn/theme';
import {band, easeIn, easeInOut, easeOut, lerp, prog} from '../lib';
import {Grain, Mask} from '../components/primitives';
import {useFonts} from '../components/useFonts';

const TL = timeline;
const B = TL.beats;
export const DAUGHTERS_FPS = TL.fps;
export const DAUGHTERS_FRAMES = Math.round(TL.duration * TL.fps);
const HANDLE = 'TheTazkiyyahGuide';

// The spoken "radiyallahu anha" is shown as Arabic on the caption instead of as transcribed words.
const words = (TL.words as [string, number][]).filter(([w]) => !/^(radiyallahu|anha,?)$/i.test(w));
/** Start of the first spoken word `w` at or after `after` seconds. */
const at = (w: string, after = 0) => {
  const hit = words.find(([x, s]) => x === w && s >= after);
  if (!hit) throw new Error(`word not in timeline: ${w}`);
  return hit[1];
};

const T = {
  hoping: at('hoping'),
  listen: at('boy?') + 0.45,
  daughters: at('daughters...'),
  says: at('put'),
  ignorance: at('ignorance'),
  being: at('Being'),
  jahiliyyah: at('Jahiliyyah.'),
  whoever: at('whoever', B.two),
  like: at('like', B.two),
  thisEnd: at('this.', B.two),
  one: at('one', B.date),
  split: at('split'),
  prophet2: at('Prophet', B.date),
  seven: at('seven'),
  every: at('Every', B.ahmad),
  same: at('same'),
  worry: at('worry'),
  prophets: at('Prophets'),
  /** End card: no spoken line, it lands after the last line has had room to sit. */
  follow: TL.voEnd + 1.5,
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
  {src: 'hand', w: 2000, h: 1333, from: 0, to: B.first, fx: 0.38, fy: 0.5, zoom: [1.02, 1.12], drift: [0, -10]},
  {src: 'rehal', w: 1333, h: 2000, from: B.first, to: T.says - 0.3, fx: 0.5, fy: 0.55, zoom: [1.04, 1.14], drift: [0, -20]},
  {src: 'mushaf', w: 1532, h: 2000, from: T.says - 0.3, to: B.jahil, fx: 0.5, fy: 0.5, zoom: [1.06, 1.14], drift: [20, 0]},
  {src: 'ruins', w: 1333, h: 2000, from: B.jahil, to: T.being - 0.2, fx: 0.5, fy: 0.6, zoom: [1.04, 1.1], drift: [0, 0]},
  {src: 'badlands', w: 1500, h: 2000, from: T.being - 0.2, to: B.two, fx: 0.5, fy: 0.5, zoom: [1.06, 1.16], drift: [-20, 0]},
  {src: 'finger', w: 1335, h: 2000, from: B.two, to: T.thisEnd + 0.5, fx: 0.45, fy: 0.5, zoom: [1.02, 1.12], drift: [0, -20]},
  {src: 'fingers', w: 1500, h: 2000, from: T.thisEnd + 0.5, to: B.date, fx: 0.5, fy: 0.55, zoom: [1.0, 1.08], drift: [0, 0]},
  {src: 'date-palm', w: 1195, h: 1600, from: B.date, to: T.split - 0.3, fx: 0.5, fy: 0.45, zoom: [1.02, 1.1], drift: [0, 10]},
  {src: 'date-split', w: 1195, h: 1600, from: T.split - 0.3, to: B.ahmad, fx: 0.5, fy: 0.55, zoom: [1.02, 1.12], drift: [0, -20]},
  {src: 'study', w: 897, h: 1600, from: B.ahmad, to: B.close, fx: 0.5, fy: 0.5, zoom: [1.02, 1.1], drift: [0, -10]},
  {src: 'father-girl', w: 1600, h: 873, from: B.close, to: TL.duration + 1, fx: 0.5, fy: 0.5, zoom: [1.0, 1.06], drift: [0, 0], containY: 330},
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
  const img = (style: React.CSSProperties) => <Img src={staticFile(`daughters/${s.src}.jpg`)} style={{position: 'absolute', ...style}} />;
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
  const dim = band(t, T.follow - 0.3, T.follow + 0.6);
  return (
    <>
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg, rgba(7,8,12,0.82) 0%, rgba(7,8,12,0.25) 30%, rgba(7,8,12,0.12) 50%, rgba(7,8,12,0.6) 70%, rgba(7,8,12,0.92) 100%)',
        }}
      />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 90% 70% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.5) 100%)'}} />
      <AbsoluteFill style={{background: N.ink, opacity: dim * 0.45}} />
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
  if (t < B.first || t >= B.close) return null;
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
            {w.replace(/[:]$/, '').replace(/\.\.\.$/, '…').replace(/^(Aisha),$/, '$1')}
            {w.startsWith('Aisha') && (
              <span style={{fontFamily: NF.arabic, fontWeight: 700, fontSize: 64, direction: 'rtl', marginLeft: '0.3em', verticalAlign: '-4px'}}>رضي‌اللّٰه‌عنها</span>
            )}
          </span>
        );
      })}
    </div>
  );
};

/* ---------- scenes ---------- */

const Hook: React.FC<{t: number}> = ({t}) => {
  if (t > B.first + 0.3) return null;
  const outAll = prog(t, B.first - 0.25, B.first + 0.2, easeIn);
  const line = (from: number) => prog(t, from - 0.05, from + 0.45, easeOut);
  return (
    <div style={{position: 'absolute', left: PAD_X, top: 1080, width: TEXT_W, opacity: 1 - outAll}}>
      <div style={{fontFamily: NF.serif, fontSize: 136, lineHeight: 1.0, color: N.cream, textShadow: '0 4px 30px rgba(0,0,0,0.6)'}}>
        <Mask k={line(B.hook)}>Just had a</Mask>
        <br />
        <Mask k={line(at('daughter?'))}>
          <span style={{color: N.gold}}>daughter?</span>
        </Mask>
      </div>
      <div style={{marginTop: 40, fontFamily: NF.serif, fontStyle: 'italic', fontSize: 66, color: N.creamDim, opacity: line(T.hoping), transform: `translateY(${(1 - line(T.hoping)) * 16}px)`}}>
        “Were you hoping for a boy?”
      </div>
      <div style={{marginTop: 30, fontFamily: NF.mono, fontSize: 28, letterSpacing: '0.1em', color: N.gold, opacity: line(T.listen)}}>
        IBN AL-QAYYIM HAS A WHOLE CHAPTER ON THIS
      </div>
    </div>
  );
};

/** The hook's question comes back in the close, before the answer replaces it. */
const Echo: React.FC<{t: number}> = ({t}) => {
  const from = at('hoping', B.close) - 0.1;
  if (t < from || t > T.prophets + 0.1) return null;
  const k = prog(t, from, from + 0.5, easeOut);
  const out = prog(t, T.prophets - 0.5, T.prophets - 0.05, easeIn);
  const smile = prog(t, at('smile,') - 0.1, at('smile,') + 0.4, easeOut);
  return (
    <div style={{position: 'absolute', left: PAD_X, top: 1060, width: TEXT_W, textAlign: 'center', opacity: k * (1 - out)}}>
      <div style={{fontFamily: NF.serif, fontStyle: 'italic', fontSize: 80, lineHeight: 1.1, color: N.creamDim, textShadow: '0 2px 20px rgba(0,0,0,0.85)'}}>“Were you hoping for a boy?”</div>
      <div style={{fontFamily: NF.mono, fontSize: 30, letterSpacing: '0.16em', color: N.gold, marginTop: 34, opacity: smile}}>SMILE, AND SAY…</div>
    </div>
  );
};

const Seven: React.FC<{t: number}> = ({t}) => {
  if (t < T.seven - 0.2 || t > B.close + 0.1) return null;
  const out = prog(t, B.close - 0.35, B.close, easeIn);
  const k = prog(t, T.seven - 0.1, T.seven + 0.3, easeOut);
  return (
    <div style={{position: 'absolute', left: PAD_X, top: 720, width: TEXT_W, opacity: k * (1 - out)}}>
      <div style={{display: 'flex', alignItems: 'baseline', gap: 26}}>
        <div style={{fontFamily: NF.serif, fontSize: 200, lineHeight: 1, color: N.gold, textShadow: '0 4px 30px rgba(0,0,0,0.7)'}}>7</div>
        <div style={{fontFamily: NF.serif, fontSize: 76, color: N.cream, textShadow: '0 2px 20px rgba(0,0,0,0.8)'}}>daughters</div>
      </div>
      <div style={{display: 'flex', gap: 22, marginTop: 10}}>
        {Array.from({length: 7}, (_, i) => {
          const s = T.seven + 0.1 + i * 0.12;
          const kd = prog(t, s, s + 0.25, easeOut);
          return <div key={i} style={{width: 40, height: 40, borderRadius: 20, border: `3px solid ${N.gold}`, background: i < 7 ? `rgba(233,194,122,${0.85 * kd})` : 'none', transform: `scale(${lerp(0.4, 1, kd)})`}} />;
        })}
      </div>
      <div style={{marginTop: 70, fontFamily: NF.serif, fontStyle: 'italic', fontSize: 66, lineHeight: 1.15, color: N.cream, opacity: prog(t, T.same - 0.1, T.same + 0.4, easeOut), textShadow: '0 2px 20px rgba(0,0,0,0.85)'}}>
        Every time, the same <span style={{color: N.gold}}>line</span>…
      </div>
    </div>
  );
};

const Final: React.FC<{t: number}> = ({t}) => {
  const from = T.prophets - 0.15;
  if (t < from) return null;
  const out = prog(t, T.follow - 0.4, T.follow, easeIn);
  if (out >= 1) return null;
  const k1 = prog(t, from, from + 0.7, easeOut);
  const k2 = prog(t, from + 0.5, from + 1.1, easeOut);
  const k3 = prog(t, from + 1.0, from + 1.5, easeOut);
  return (
    <div style={{position: 'absolute', left: PAD_X, top: 1000, width: TEXT_W, opacity: 1 - out}}>
      <div style={{fontFamily: NF.arabic, fontWeight: 700, fontSize: 132, lineHeight: 1.35, color: N.gold, direction: 'rtl', textAlign: 'center', opacity: k1, transform: `scale(${lerp(0.94, 1, k1)})`, textShadow: '0 4px 30px rgba(0,0,0,0.85)'}}>
        الأنبياء آباء بنات
      </div>
      <div style={{fontFamily: NF.serif, fontSize: 76, lineHeight: 1.08, color: N.cream, textAlign: 'center', marginTop: 10, opacity: k2, transform: `translateY(${(1 - k2) * 14}px)`, textShadow: '0 2px 20px rgba(0,0,0,0.85)'}}>
        The Prophets were fathers of daughters.
      </div>
      <div style={{fontFamily: NF.mono, fontSize: 24, letterSpacing: '0.12em', color: N.creamDim, textAlign: 'center', marginTop: 30, opacity: k3}}>
        IMAM AHMAD · REPORTED BY IBN AL-QAYYIM · P.26
      </div>
    </div>
  );
};

const EndCard: React.FC<{t: number}> = ({t}) => {
  const k = prog(t, T.follow - 0.1, T.follow + 0.5, easeOut);
  if (k <= 0) return null;
  return (
    <AbsoluteFill style={{alignItems: 'flex-start', justifyContent: 'flex-end', paddingLeft: PAD_X, paddingBottom: 360}}>
      <div style={{opacity: k, transform: `translateY(${(1 - k) * 26}px)`, padding: '40px 44px', background: 'rgba(7,8,12,0.78)', borderRadius: 24, width: TEXT_W, boxSizing: 'border-box'}}>
        <div style={{fontFamily: NF.mono, fontSize: 30, letterSpacing: '0.16em', color: N.gold}}>FOLLOW</div>
        <div style={{fontFamily: NF.serif, fontSize: 108, color: N.cream, lineHeight: 1.0, marginTop: 14}}>The Tazkiyyah Guide</div>
        <div style={{fontFamily: NF.mono, fontWeight: 600, fontSize: 42, color: N.gold, marginTop: 22}}>@{HANDLE}</div>
        <div style={{fontFamily: NF.sans, fontSize: 36, color: N.creamDim, marginTop: 16}}>for similar posts</div>
        <div style={{fontFamily: NF.sans, fontSize: 23, color: N.creamDim, marginTop: 48, lineHeight: 1.4, opacity: prog(t, T.follow + 0.6, T.follow + 1.2)}}>
          Source: Ibn al-Qayyim, Tuhfat al-Mawdud, Bab 2, p.20–26 (ed. al-Arna'ut, Damascus 1971). Educational reminder, not a fatwa.
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Handle: React.FC<{t: number}> = ({t}) => {
  const o = prog(t, 0.4, 1.0) * (1 - prog(t, T.follow - 0.3, T.follow));
  return (
    <div style={{position: 'absolute', left: PAD_X, top: 120, fontFamily: NF.mono, fontSize: 26, letterSpacing: '0.06em', color: N.creamDim, opacity: o, textShadow: '0 2px 10px rgba(0,0,0,0.8)'}}>
      @{HANDLE} · Ibn al-Qayyim on daughters
    </div>
  );
};

/** The verse with إِنَاثًا lit gold on "daughters". */
const Verse: React.FC<{t: number}> = ({t}) => {
  const lit = prog(t, T.daughters - 0.1, T.daughters + 0.5, easeOut);
  return (
    <>
      <div style={{fontFamily: NF.arabic, fontSize: 56, lineHeight: 1.6, color: N.cream, direction: 'rtl', textAlign: 'right'}}>
        يَهَبُ لِمَن يَشَاءُ{' '}
        <span style={{color: lit > 0.5 ? N.gold : N.cream, fontWeight: 700, fontSize: lerp(56, 66, lit), textShadow: lit > 0.5 ? '0 0 24px rgba(233,194,122,0.5)' : 'none'}}>إِنَاثًا</span>{' '}
        وَيَهَبُ لِمَن يَشَاءُ الذُّكُورَ
      </div>
      <div style={{fontFamily: NF.serif, fontStyle: 'italic', fontSize: 46, lineHeight: 1.15, color: N.cream, marginTop: 14}}>
        “He gives <span style={{color: N.gold}}>daughters</span> to whom He wills, and sons to whom He wills.”
      </div>
      <div style={{fontFamily: NF.mono, fontSize: 24, letterSpacing: '0.1em', color: N.gold, marginTop: 18}}>AL-SHURA 42:49</div>
    </>
  );
};

export const DaughtersShort: React.FC = () => {
  useFonts();
  const frame = useCurrentFrame();
  const t = frame / DAUGHTERS_FPS;
  const fade = prog(t, TL.duration - 0.5, TL.duration);
  const C = 'TUHFAT AL-MAWDUD · BAB 2';
  return (
    <AbsoluteFill style={{background: N.ink, overflow: 'hidden'}}>
      {SHOTS.map((s, i) => (
        <Photo key={i} t={t} s={s} />
      ))}
      <Grade t={t} />

      <Hook t={t} />

      <Header t={t} from={B.first} to={B.jahil} num="01" title="Daughters first" />
      <Panel t={t} from={B.first + 1.0} to={T.says - 0.2} y={720}>
        <Verse t={t} />
      </Panel>
      <Panel t={t} from={T.says - 0.1} to={B.jahil} y={720}>
        <Quote arabic="قدم ما كانت تؤخره الجاهلية" english="“He put first what the Jahiliyya used to put last.”" by="Ibn al-Qayyim · Bab 2" />
      </Panel>
      <Cite t={t} from={B.first + 0.4} to={B.jahil} label={`${C} · P.20`} />

      <Header t={t} from={B.jahil} to={B.two} num="02" title="Upset over a girl?" />
      <Panel t={t} from={T.being - 0.1} to={B.two} y={720}>
        <Quote arabic="التسخط بالإناث من أخلاق الجاهلية" english="“Resenting daughters is from the ways of the Jahiliyya.”" by="Ibn al-Qayyim · Bab 2" />
      </Panel>
      <Cite t={t} from={B.jahil + 0.4} to={B.two} label={`${C} · P.21`} />

      <Header t={t} from={B.two} to={B.date} num="03" title="Raise two girls" />
      <Panel t={t} from={T.whoever - 0.1} to={T.thisEnd + 0.6} y={640}>
        <Quote
          arabic="من عال جاريتين حتى تبلغا جاء يوم القيامة أنا وهو"
          english="“Whoever raises two girls until they come of age, he and I will come on the Day of Resurrection like this.”"
          by="Sahih Muslim · cited in Bab 2"
        />
      </Panel>
      <Cite t={t} from={B.two + 0.4} to={B.date} label={`${C} · P.21–22`} />

      <Header t={t} from={B.date} to={B.ahmad} num="04" title="One date" />
      <Panel t={t} from={T.prophet2 - 0.1} to={B.ahmad} y={680}>
        <Quote
          arabic="من ابتلي من هذه البنات بشيء فأحسن إليهن كن له سترا من النار"
          english="“Whoever is tested with these daughters and treats them well, they will be a shield for him from the Fire.”"
          by="Bukhari & Muslim · cited in Bab 2"
        />
      </Panel>
      <Cite t={t} from={B.date + 0.4} to={B.ahmad} label={`${C} · P.22`} />

      <Header t={t} from={B.ahmad} to={B.close} num="05" title="Imam Ahmad" />
      <Seven t={t} />
      <Cite t={t} from={B.ahmad + 0.4} to={B.close} label={`${C} · P.26`} />

      <Echo t={t} />
      <Final t={t} />
      <EndCard t={t} />
      <Captions t={t} />
      <Handle t={t} />
      <Grain frame={frame} opacity={0.06} />
      <AbsoluteFill style={{background: '#000', opacity: fade}} />
    </AbsoluteFill>
  );
};
