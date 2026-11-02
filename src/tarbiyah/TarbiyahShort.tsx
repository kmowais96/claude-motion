import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import timeline from './timeline.json';
import {N, NF, NH, NW, PAD_X, TEXT_W} from '../newborn/theme';
import {easeIn, easeInOut, easeOut, lerp, prog} from '../lib';
import {Grain, Mask} from '../components/primitives';
import {useFonts} from '../components/useFonts';

const TL = timeline;
const B = TL.beats;
export const TARBIYAH_FPS = TL.fps;
export const TARBIYAH_FRAMES = Math.round(TL.duration * TL.fps);
const HANDLE = 'TheTazkiyyahGuide';
const SRC = 'TUHFAT AL-MAWDUD · BAB 15';

const words = TL.words as [string, number][];
/** Start of the first spoken word `w` at or after `after` seconds. */
const at = (w: string, after = 0) => {
  const hit = words.find(([x, s]) => x === w && s >= after);
  if (!hit) throw new Error(`word not in timeline: ${w}`);
  return hit[1];
};

const T = {
  order: at('order'),
  parent: at('parent...'),
  child: at('child?'),
  father: at('father.', B.answer),
  allah: at('Allah', B.answer),
  follow: TL.voEnd + 0.5,
};

/* ---------- two timelines ---------- */

// Warm "then" on top, cold "now" below. A scene with no `now` fills the frame.
type Scene = {from: number; to: number; then: string; now?: string; thenPos?: string; nowPos?: string};
const SCENES: Scene[] = [
  {from: 0, to: B.q1, then: 'family-then', now: 'family-now', thenPos: '50% 70%', nowPos: '50% 55%'},
  {from: B.q1, to: B.hold, then: 'pray-then', now: 'pray-now', thenPos: '50% 62%', nowPos: '60% 60%'},
  {from: B.hold, to: B.q2, then: 'walk-then', now: 'walk-now', thenPos: '50% 55%', nowPos: '50% 50%'},
  {from: B.q2, to: B.q3, then: 'gift-then', now: 'gift-now', thenPos: '50% 50%', nowPos: '50% 55%'},
  {from: B.q3, to: B.neglect, then: 'dates', thenPos: '55% 50%'},
  {from: B.neglect, to: B.ask, then: 'phone-then', now: 'phone-now', thenPos: '50% 55%', nowPos: '50% 50%'},
  {from: B.ask, to: B.close, then: 'carry', thenPos: '50% 40%'},
  {from: B.close, to: TL.duration + 1, then: 'hands', thenPos: '50% 60%'},
];
const XF = 0.55;

/** Where the halves meet: 960 when split, 1920 when "then" fills the frame. */
const seamAt = (t: number) => {
  let y = SCENES[0].now ? NH / 2 : NH;
  for (const s of SCENES) {
    const target = s.now ? NH / 2 : NH;
    const k = prog(t, s.from - 0.1, s.from + 0.6, easeInOut);
    y = lerp(y, target, k);
  }
  return y;
};

const THEN_GRADE = 'sepia(0.18) saturate(1.08) brightness(1.02) contrast(1.02)';
const NOW_GRADE = 'saturate(0.55) brightness(0.86) contrast(1.05) hue-rotate(-8deg)';

const Half: React.FC<{t: number; s: Scene; which: 'then' | 'now'; seam: number}> = ({t, s, which, seam}) => {
  const src = which === 'then' ? s.then : s.now;
  if (!src || t < s.from - 0.1 || t > s.to + XF) return null;
  const o = s.from <= 0 ? 1 : prog(t, s.from - 0.1, s.from + XF - 0.1, easeInOut);
  const k = prog(t, s.from, s.to + XF, (x) => x);
  const top = which === 'then' ? 0 : seam;
  const h = which === 'then' ? seam : NH - seam;
  if (h <= 1) return null;
  // The last "now" slides down and out while "then" takes the frame.
  return (
    <div style={{position: 'absolute', left: 0, top, width: NW, height: h, overflow: 'hidden', opacity: o}}>
      <Img
        src={staticFile(`tarbiyah/${src}.jpg`)}
        style={{
          position: 'absolute',
          inset: 0,
          width: NW,
          height: h,
          objectFit: 'cover',
          objectPosition: which === 'then' ? s.thenPos : s.nowPos,
          filter: which === 'then' ? THEN_GRADE : NOW_GRADE,
          transform: `scale(${lerp(1.03, 1.11, k)})`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            which === 'then'
              ? 'linear-gradient(180deg, rgba(7,8,12,0.55) 0%, rgba(7,8,12,0) 25%, rgba(7,8,12,0) 70%, rgba(7,8,12,0.55) 100%)'
              : 'linear-gradient(180deg, rgba(7,8,12,0.5) 0%, rgba(7,8,12,0.1) 30%, rgba(7,8,12,0.35) 70%, rgba(7,8,12,0.85) 100%)',
        }}
      />
    </div>
  );
};

/** The last "now" half: on "Your child is still small." it slides off the bottom. */
const LastNow: React.FC<{t: number}> = ({t}) => {
  const from = B.close - 0.3;
  if (t < from - 0.1 || t > B.close + 1.6) return null;
  const k = prog(t, B.close + 0.1, B.close + 1.4, easeInOut);
  const top = NH / 2 + k * (NH / 2);
  const o = prog(t, from - 0.1, from + 0.4, easeInOut);
  return (
    <div style={{position: 'absolute', left: 0, top, width: NW, height: NH / 2, overflow: 'hidden', opacity: o}}>
      <Img src={staticFile('tarbiyah/walk-now.jpg')} style={{position: 'absolute', inset: 0, width: NW, height: NH / 2, objectFit: 'cover', objectPosition: '50% 55%', filter: NOW_GRADE}} />
      <AbsoluteFill style={{background: 'rgba(7,8,12,0.35)'}} />
    </div>
  );
};

const Labels: React.FC<{t: number; seam: number}> = ({t, seam}) => {
  const split = 1 - Math.min(1, Math.abs(seam - NH / 2) / 200);
  const o = split * prog(t, 0.6, 1.2) * (1 - prog(t, B.close + 0.2, B.close + 0.6));
  if (o <= 0) return null;
  const tag = (label: string, color: string): React.CSSProperties => ({
    position: 'absolute',
    fontFamily: NF.mono,
    fontWeight: 600,
    fontSize: 24,
    letterSpacing: '0.22em',
    color,
    opacity: o,
    textShadow: '0 2px 10px rgba(0,0,0,0.8)',
  });
  return (
    <>
      <div style={{...tag('THEN', N.gold), left: PAD_X, top: seam - 64}}>THEN</div>
      <div style={{...tag('NOW', N.silver), left: PAD_X, top: seam + 36}}>NOW</div>
      <div style={{position: 'absolute', left: 0, top: seam - 1.5, width: NW, height: 3, background: N.gold, opacity: o * 0.8}} />
    </>
  );
};

/* ---------- type ---------- */

const shadow = '0 2px 22px rgba(0,0,0,0.85)';

/** The opening line, over the family then/now. */
const Open: React.FC<{t: number}> = ({t}) => {
  if (t > B.q1 + 0.2) return null;
  const out = prog(t, B.q1 - 0.3, B.q1 + 0.1, easeIn);
  const k = (from: number) => prog(t, from - 0.05, from + 0.45, easeOut);
  return (
    <div style={{position: 'absolute', left: PAD_X, top: 330, width: TEXT_W, opacity: 1 - out}}>
      <div style={{fontFamily: NF.serif, fontSize: 132, lineHeight: 0.98, color: N.cream, textShadow: shadow}}>
        <Mask k={k(at('There'))}>
          There are <span style={{color: N.gold}}>three</span>
        </Mask>
        <br />
        <Mask k={k(at('questions'))}>questions</Mask>
      </div>
      <div style={{fontFamily: NF.serif, fontStyle: 'italic', fontSize: 58, lineHeight: 1.1, color: N.cream, marginTop: 24, opacity: k(at('every')), textShadow: shadow}}>
        every parent will be asked about their children.
      </div>
    </div>
  );
};

/** A question sits on the seam: number, then the question in serif. */
const Question: React.FC<{t: number; from: number; to: number; num?: string; text: string; seam: number; y?: number}> = ({t, from, to, num, text, seam, y}) => {
  if (t < from - 0.1 || t > to + 0.1) return null;
  const k1 = prog(t, from - 0.05, from + 0.35, easeOut);
  const k2 = prog(t, from + 0.1, from + 0.6, easeOut);
  const out = prog(t, to - 0.3, to, easeIn);
  const top = y ?? Math.min(seam, 1300) - 150;
  return (
    <div style={{position: 'absolute', left: 0, top, width: NW, padding: `26px ${PAD_X}px 30px`, boxSizing: 'border-box', background: `rgba(7,8,12,${0.8 * k1})`, opacity: 1 - out}}>
      {num && (
        <div style={{display: 'flex', alignItems: 'center', gap: 18, opacity: k1}}>
          <div style={{width: 64 * k1, height: 3, background: N.gold}} />
          <div style={{fontFamily: NF.mono, fontWeight: 600, fontSize: 30, letterSpacing: '0.14em', color: N.gold}}>{num}</div>
        </div>
      )}
      <div style={{fontFamily: NF.serif, fontSize: 96, lineHeight: 1.0, color: N.cream, marginTop: num ? 12 : 0}}>
        <Mask k={k2} out={out * 0.3}>
          {text}
        </Mask>
      </div>
    </div>
  );
};

const Panel: React.FC<{t: number; from: number; to: number; y: number; children: React.ReactNode}> = ({t, from, to, y, children}) => {
  if (t < from - 0.05 || t > to + 0.05) return null;
  const k = prog(t, from, from + 0.5, easeOut);
  const out = prog(t, to - 0.3, to, easeIn);
  return (
    <div
      style={{
        position: 'absolute',
        left: PAD_X,
        top: y,
        width: TEXT_W,
        boxSizing: 'border-box',
        opacity: k * (1 - out),
        transform: `translateY(${(1 - k) * 26}px)`,
        padding: '30px 38px 28px',
        borderLeft: `4px solid ${N.gold}`,
        background: 'rgba(7,8,12,0.74)',
        borderRadius: '0 18px 18px 0',
      }}
    >
      {children}
    </div>
  );
};

const Quote: React.FC<{arabic: string; english: string; by: string; weak?: boolean}> = ({arabic, english, by, weak}) => (
  <>
    <div style={{fontFamily: NF.arabic, fontSize: 52, lineHeight: 1.5, color: N.gold, direction: 'rtl', textAlign: 'right'}}>{arabic}</div>
    <div style={{fontFamily: NF.serif, fontStyle: 'italic', fontSize: 50, lineHeight: 1.12, color: N.cream, marginTop: 10}}>{english}</div>
    <div style={{display: 'flex', alignItems: 'center', gap: 14, marginTop: 18, flexWrap: 'wrap'}}>
      <div style={{fontFamily: NF.mono, fontSize: 22, letterSpacing: '0.1em', color: N.creamDim, textTransform: 'uppercase'}}>{by}</div>
      {weak && (
        <div style={{fontFamily: NF.mono, fontSize: 19, letterSpacing: '0.12em', color: N.creamDim, border: `1.5px solid ${N.faint}`, borderRadius: 999, padding: '4px 12px'}}>WEAK NARRATION</div>
      )}
    </div>
  </>
);

/** "Who is asked first?" is asked, then pinned at the top until it comes back. */
const Hold: React.FC<{t: number}> = ({t}) => {
  if (t < B.hold - 0.1 || t > B.ask + 0.6) return null;
  const k1 = prog(t, B.hold - 0.05, B.hold + 0.45, easeOut);
  const kP = prog(t, T.parent - 0.1, T.parent + 0.35, easeOut);
  const kC = prog(t, T.child - 0.1, T.child + 0.35, easeOut);
  const kH = prog(t, B.holdOn - 0.05, B.holdOn + 0.35, easeOut);
  const pin = prog(t, B.q2 - 0.5, B.q2 + 0.2, easeInOut);
  const back = prog(t, B.ask - 0.1, B.ask + 0.4, easeInOut);
  const big = 1 - pin;
  return (
    <>
      {big > 0.01 && (
        <div style={{position: 'absolute', left: 0, top: 300, width: NW, padding: `0 ${PAD_X}px`, boxSizing: 'border-box', opacity: k1 * big}}>
          <div style={{fontFamily: NF.mono, fontSize: 28, letterSpacing: '0.16em', color: N.gold, textShadow: shadow}}>BUT WAIT · ON JUDGMENT DAY</div>
          <div style={{fontFamily: NF.serif, fontSize: 118, lineHeight: 0.98, color: N.cream, marginTop: 16, textShadow: shadow}}>Who is asked first?</div>
          <div style={{display: 'flex', gap: 26, marginTop: 34, fontFamily: NF.serif, fontStyle: 'italic', fontSize: 66, color: N.cream, textShadow: shadow}}>
            <span style={{opacity: kP, color: N.gold}}>The parent…</span>
            <span style={{opacity: kC}}>or the child?</span>
          </div>
          <div style={{fontFamily: NF.mono, fontSize: 26, letterSpacing: '0.14em', color: N.creamDim, marginTop: 40, opacity: kH, textShadow: shadow}}>HOLD ON TO THAT.</div>
        </div>
      )}
      {pin > 0 && back < 1 && (
        <div
          style={{
            position: 'absolute',
            left: PAD_X,
            top: 182,
            opacity: pin * (1 - back),
            fontFamily: NF.mono,
            fontWeight: 600,
            fontSize: 24,
            letterSpacing: '0.14em',
            color: N.ink,
            background: N.gold,
            borderRadius: 999,
            padding: '10px 20px',
            transform: `scale(${lerp(0.8, 1, pin)})`,
            transformOrigin: 'left center',
          }}
        >
          ? WHO IS ASKED FIRST
        </div>
      )}
    </>
  );
};

/** The question returns, and the answer lands. */
const Answer: React.FC<{t: number}> = ({t}) => {
  if (t < B.ask - 0.1 || t > B.close + 0.1) return null;
  const kQ = prog(t, B.ask - 0.05, B.ask + 0.45, easeOut);
  const qUp = prog(t, B.answer - 0.3, B.answer + 0.3, easeInOut);
  const kA = prog(t, T.father - 0.15, T.father + 0.35, easeOut);
  const out = prog(t, B.close - 0.35, B.close, easeIn);
  return (
    <div style={{position: 'absolute', left: PAD_X, top: lerp(380, 300, qUp), width: TEXT_W, opacity: 1 - out}}>
      <div style={{fontFamily: NF.serif, fontSize: lerp(116, 78, qUp), lineHeight: 1.0, color: N.cream, opacity: kQ, textShadow: shadow}}>
        So… who is asked first?
      </div>
      <div style={{fontFamily: NF.serif, fontSize: 150, lineHeight: 1.0, color: N.gold, marginTop: 26, opacity: kA, transform: `translateY(${(1 - kA) * 20}px)`, textShadow: shadow}}>
        The father.
      </div>
    </div>
  );
};

const Close: React.FC<{t: number}> = ({t}) => {
  if (t < B.close - 0.1) return null;
  const k = prog(t, B.close + 0.1, B.close + 0.7, easeOut);
  const out = prog(t, T.follow - 0.3, T.follow + 0.1, easeIn);
  return (
    <div style={{position: 'absolute', left: PAD_X, top: 380, width: TEXT_W, opacity: 1 - out}}>
      <div style={{fontFamily: NF.serif, fontSize: 132, lineHeight: 0.98, color: N.cream, textShadow: shadow}}>
        <Mask k={k}>Your child is</Mask>
        <br />
        <Mask k={prog(t, B.close + 0.45, B.close + 1.0, easeOut)}>
          <span style={{color: N.gold}}>still small.</span>
        </Mask>
      </div>
    </div>
  );
};

/** Darkens the top of the full-frame photos so the answer and close read over bright doorways and cuffs. */
const TopScrim: React.FC<{t: number}> = ({t}) => {
  const o = prog(t, B.ask - 0.4, B.ask + 0.2, easeOut) * (1 - prog(t, T.follow - 0.3, T.follow));
  if (o <= 0) return null;
  return (
    <AbsoluteFill
      style={{
        opacity: o,
        background: 'linear-gradient(180deg, rgba(7,8,12,0.82) 0%, rgba(7,8,12,0.7) 30%, rgba(7,8,12,0.25) 50%, rgba(7,8,12,0) 62%)',
      }}
    />
  );
};

const EndCard: React.FC<{t: number}> = ({t}) => {
  const k = prog(t, T.follow, T.follow + 0.5, easeOut);
  if (k <= 0) return null;
  return (
    <AbsoluteFill style={{alignItems: 'flex-start', justifyContent: 'flex-end', paddingLeft: PAD_X, paddingBottom: 380}}>
      <AbsoluteFill style={{background: N.ink, opacity: k * 0.5}} />
      <div style={{opacity: k, transform: `translateY(${(1 - k) * 26}px)`, padding: '40px 44px', background: 'rgba(7,8,12,0.82)', borderRadius: 24, width: TEXT_W, boxSizing: 'border-box'}}>
        <div style={{fontFamily: NF.mono, fontSize: 30, letterSpacing: '0.16em', color: N.gold}}>FOLLOW</div>
        <div style={{fontFamily: NF.serif, fontSize: 108, color: N.cream, lineHeight: 1.0, marginTop: 14}}>The Tazkiyyah Guide</div>
        <div style={{fontFamily: NF.mono, fontWeight: 600, fontSize: 42, color: N.gold, marginTop: 22}}>@{HANDLE}</div>
        <div style={{fontFamily: NF.sans, fontSize: 36, color: N.creamDim, marginTop: 16}}>for similar posts</div>
        <div style={{fontFamily: NF.sans, fontSize: 23, color: N.creamDim, marginTop: 44, lineHeight: 1.4}}>
          Source: Ibn al-Qayyim, Tuhfat al-Mawdud, Bab 15, p.224–229 (ed. al-Arna'ut, Damascus 1971). Educational reminder, not a fatwa.
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Handle: React.FC<{t: number}> = ({t}) => {
  const o = prog(t, 0.4, 1.0) * (1 - prog(t, T.follow - 0.3, T.follow));
  return (
    <div style={{position: 'absolute', left: PAD_X, top: 120, fontFamily: NF.mono, fontSize: 26, letterSpacing: '0.06em', color: N.creamDim, opacity: o, textShadow: '0 2px 10px rgba(0,0,0,0.8)'}}>
      @{HANDLE} · {SRC.toLowerCase().replace('tuhfat al-mawdud', 'Tuhfat al-Mawdud').replace('bab', 'Bab')}
    </div>
  );
};

export const TarbiyahShort: React.FC = () => {
  useFonts();
  const frame = useCurrentFrame();
  const t = frame / TARBIYAH_FPS;
  const seam = seamAt(t);
  const fade = prog(t, TL.duration - 0.4, TL.duration);
  // Answer panels sit in the "now" half when split, lower third when the frame is full.
  const PY = 1150;
  return (
    <AbsoluteFill style={{background: N.ink, overflow: 'hidden'}}>
      {SCENES.map((s, i) => (
        <React.Fragment key={i}>
          <Half t={t} s={s} which="then" seam={seam} />
          <Half t={t} s={s} which="now" seam={seam} />
        </React.Fragment>
      ))}
      <LastNow t={t} />
      <Labels t={t} seam={seam} />

      <Open t={t} />

      <Question t={t} from={B.q1} to={B.hold} num="01 / 03" text="Did you teach them?" seam={seam} y={660} />
      <Panel t={t} from={B.a1} to={T.order - 0.2} y={PY}>
        <Quote arabic="علموهم وأدبوهم" english="“Educate them, discipline them.”" by="ʿAli ؓ · Bab 15 · p.224" />
      </Panel>
      <Panel t={t} from={T.order - 0.1} to={B.hold} y={PY}>
        <Quote arabic="مروا أبناءكم بالصلاة لسبع" english="“Order your children to pray at seven.”" by="Abu Dawud · Hasan · Bab 15 · p.224" />
      </Panel>

      <Hold t={t} />

      <Question t={t} from={B.q2} to={B.q3} num="02 / 03" text="Were you fair between them?" seam={seam} y={660} />
      <Panel t={t} from={B.a2} to={B.q3} y={PY}>
        <Quote arabic="اتقوا الله واعدلوا في أولادكم" english="“Fear Allah, and be just with your children.”" by="Bukhari & Muslim · Bab 15 · p.227" />
      </Panel>

      <Question t={t} from={B.q3} to={B.neglect} num="03 / 03" text="Did you raise them with manners?" seam={seam} y={660} />
      <Panel t={t} from={B.a3} to={B.neglect} y={PY}>
        <Quote arabic="ما نحل والد ولدا أفضل من أدب حسن" english="“No gift a father gives is better than a good upbringing.”" by="Bab 15 · p.225" weak />
      </Panel>

      <Panel t={t} from={B.neglect + 0.1} to={B.ask} y={PY}>
        <Quote arabic="وأكثر الأولاد إنما جاء فسادهم من قبل الآباء" english="“Most children who go wrong were lost through their fathers.”" by="Ibn al-Qayyim · Bab 15 · p.229" />
      </Panel>

      <TopScrim t={t} />
      <Answer t={t} />
      <Panel t={t} from={T.father + 0.3} to={T.allah - 0.15} y={PY}>
        <Quote arabic="يسأل الوالد عن ولده يوم القيامة قبل أن يسأل الولد عن والده" english="“Allah asks the father about his child before He asks the child about his father.”" by="Some scholars · quoted in Bab 15 · p.229" />
      </Panel>
      <Panel t={t} from={T.allah - 0.05} to={B.close} y={PY}>
        <Quote arabic="وصية الله للآباء بأولادهم سابقة على وصية الأولاد بآبائهم" english="“Allah’s charge to fathers about their children came before His charge to children about their fathers.”" by="Ibn al-Qayyim · Bab 15 · p.229" />
      </Panel>

      <Close t={t} />
      <EndCard t={t} />
      <Handle t={t} />
      <Grain frame={frame} opacity={0.06} />
      <AbsoluteFill style={{background: '#000', opacity: fade}} />
    </AbsoluteFill>
  );
};
