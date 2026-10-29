import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {band, clamp01, easeInOut, easeOut, prog} from '../lib';
import {Grain, Mask} from '../components/primitives';
import {useFonts} from '../components/useFonts';
import {BFPS, BT, BW, FN, P, rise} from './theme';

const CAP_Y = 1360;
const [S, E] = [0, 1];
const sc = BT.scenes;
const cu = BT.cues;

/* ---------- shared bits ---------- */

const Stage: React.FC<{id: keyof typeof sc; t: number; children: React.ReactNode}> = ({id, t, children}) => {
  const [a, b] = sc[id];
  if (t < a - 0.02 || t > b + 0.4) return null;
  const inK = rise(t, a, 0.4);
  const outK = easeInOut(clamp01((t - (b - 0.3)) / 0.3));
  return (
    <AbsoluteFill style={{opacity: inK * (1 - outK), transform: `translateY(${60 + (1 - inK) * 40 - outK * 60}px)`}}>
      {children}
    </AbsoluteFill>
  );
};

const Star: React.FC<{size: number; rot: number; color: string; opacity: number}> = ({size, rot, color, opacity}) => (
  <svg width={size} height={size} viewBox="-50 -50 100 100" style={{transform: `rotate(${rot}deg)`, opacity}}>
    <rect x="-30" y="-30" width="60" height="60" fill="none" stroke={color} strokeWidth="0.6" />
    <rect x="-30" y="-30" width="60" height="60" fill="none" stroke={color} strokeWidth="0.6" transform="rotate(45)" />
    <circle r="22" fill="none" stroke={color} strokeWidth="0.4" />
    <circle r="8" fill="none" stroke={color} strokeWidth="0.4" />
  </svg>
);

const Backdrop: React.FC<{t: number}> = ({t}) => (
  <AbsoluteFill style={{background: P.bg}}>
    <AbsoluteFill
      style={{background: `radial-gradient(ellipse 80% 50% at 50% 38%, rgba(62,155,115,0.20), rgba(10,19,16,0) 70%)`}}
    />
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', top: -120}}>
      <Star size={1500} rot={t * 2.2} color={P.gold} opacity={0.10} />
    </AbsoluteFill>
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', top: -120}}>
      <Star size={1000} rot={-t * 3} color={P.cream} opacity={0.06} />
    </AbsoluteFill>
  </AbsoluteFill>
);

const Chip: React.FC<{k: number; children: React.ReactNode; tone?: 'gold' | 'green' | 'red'; style?: React.CSSProperties}> = ({
  k, children, tone = 'gold', style,
}) => {
  const col = tone === 'gold' ? P.gold : tone === 'green' ? P.green : P.red;
  return (
    <div
      style={{
        opacity: k,
        transform: `translateY(${(1 - k) * 20}px)`,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 26px',
        borderRadius: 999,
        border: `2px solid ${col}`,
        background: 'rgba(10,19,16,0.7)',
        color: col,
        fontFamily: FN.mono,
        fontWeight: 600,
        fontSize: 30,
        letterSpacing: 1,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

const Head: React.FC<{t: number; t0: number; n: string; title: string}> = ({t, t0, n, title}) => (
  <div style={{position: 'absolute', top: 300, left: 70, right: 70}}>
    <div style={{fontFamily: FN.mono, fontWeight: 600, fontSize: 40, color: P.gold, letterSpacing: 6, opacity: rise(t, t0)}}>
      LESSON {n}
    </div>
    <div style={{fontFamily: FN.serif, fontSize: 132, lineHeight: 1, color: P.cream, marginTop: 14}}>
      <Mask k={rise(t, t0 + 0.05, 0.55)}>{title}</Mask>
    </div>
  </div>
);

const Card: React.FC<{
  k: number; top: number; h?: number; tone?: string; children: React.ReactNode; style?: React.CSSProperties;
}> = ({k, top, h, tone = P.line, children, style}) => (
  <div
    style={{
      position: 'absolute',
      left: 70,
      right: 70,
      top,
      height: h,
      opacity: k,
      transform: `translateY(${(1 - k) * 50}px) scale(${0.97 + 0.03 * k})`,
      background: P.panel,
      border: `2px solid ${tone}`,
      borderRadius: 28,
      padding: '30px 40px',
      color: P.cream,
      ...style,
    }}
  >
    {children}
  </div>
);

/* ---------- scenes ---------- */

const Hook: React.FC<{t: number}> = ({t}) => {
  const c = cu.hook;
  const flip = Math.cos(t * 7);
  const slam = rise(t, c.clean, 0.3);
  return (
    <Stage id="hook" t={t}>
      <div style={{position: 'absolute', top: 330, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
        <svg width="320" height="320" viewBox="-50 -50 100 100" style={{transform: `scaleX(${Math.abs(flip) * 0.92 + 0.08})`}}>
          <circle r="46" fill={P.gold} />
          <circle r="38" fill="none" stroke={P.bg} strokeWidth="2" opacity="0.5" />
          <text textAnchor="middle" y="14" fontSize="42" fontFamily={FN.serif} fill={P.bg}>$</text>
        </svg>
      </div>
      <div style={{position: 'absolute', top: 700, left: 60, right: 60, textAlign: 'center', fontFamily: FN.serif, color: P.cream}}>
        <div style={{fontSize: 190, lineHeight: 0.95}}>
          <Mask k={rise(t, c.income, 0.4)}>Your income</Mask>
        </div>
        <div style={{fontSize: 190, lineHeight: 0.95, fontStyle: 'italic', color: P.gold}}>
          <Mask k={rise(t, c.test - 0.3, 0.4)}>is a test.</Mask>
        </div>
        <div
          style={{
            fontFamily: FN.sans, fontWeight: 800, fontSize: 96, marginTop: 40, color: P.cream,
            opacity: slam, transform: `scale(${1.5 - 0.5 * slam})`, textTransform: 'uppercase',
          }}
        >
          Is yours clean?
        </div>
      </div>
    </Stage>
  );
};

const Intro: React.FC<{t: number}> = ({t}) => {
  const c = cu.intro;
  const books = [
    {t: c.zad, name: "Zad al-Ma'ad"},
    {t: c.madarij, name: 'Madarij al-Salikin'},
  ];
  return (
    <Stage id="intro" t={t}>
      <div style={{position: 'absolute', top: 330, left: 70, right: 70}}>
        <div style={{fontFamily: FN.serif, fontSize: 150, lineHeight: 0.95, color: P.cream, whiteSpace: 'nowrap'}}>
          <Mask k={rise(t, c.name, 0.5)}>Ibn al-Qayyim</Mask>
        </div>
        <div style={{marginTop: 30}}>
          <Chip k={rise(t, c.died)}>d. 751 AH</Chip>
        </div>
      </div>
      {books.map((b, i) => (
        <Card key={b.name} k={rise(t, b.t)} top={880 + i * 150} h={110} tone={P.gold} style={{display: 'flex', alignItems: 'center', gap: 28, padding: '0 40px'}}>
          <div style={{width: 14, height: 70, background: P.gold, borderRadius: 4}} />
          <div style={{fontFamily: FN.serif, fontSize: 64, color: P.cream}}>{b.name}</div>
        </Card>
      ))}
      <div style={{position: 'absolute', top: 1180, left: 70, right: 70, display: 'flex', gap: 22, alignItems: 'center'}}>
        {[1, 2, 3, 4].map((n) => {
          const k = rise(t, c.four + (n - 1) * 0.28, 0.3);
          return (
            <div
              key={n}
              style={{
                width: 100, height: 100, borderRadius: 50, border: `3px solid ${P.gold}`,
                background: k > 0.5 ? P.gold : 'transparent', color: k > 0.5 ? P.ink : P.gold,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: FN.mono, fontWeight: 600, fontSize: 44, transform: `scale(${0.8 + 0.2 * k})`, opacity: 0.4 + 0.6 * k,
              }}
            >
              {n}
            </div>
          );
        })}
      </div>
    </Stage>
  );
};

const Halal: React.FC<{t: number}> = ({t}) => {
  const c = cu.halal;
  const first = 1 - band(t, c.hiyal - 0.4, c.hiyal - 0.05);
  const stamp = rise(t, c.clever, 0.25);
  const disguise = prog(t, c.hiyal + 0.5, c.hiyal + 1.6);
  return (
    <Stage id="halal" t={t}>
      <Head t={t} t0={c.one} n="01" title="Halal first." />
      <div style={{opacity: first}}>
        <Card k={rise(t, c.trade)} top={640} h={190} tone={P.green} style={{display: 'flex', alignItems: 'center', gap: 30}}>
          <div style={{fontSize: 90, color: P.green}}>✓</div>
          <div>
            <div style={{fontFamily: FN.sans, fontWeight: 800, fontSize: 70}}>TRADE</div>
            <div style={{fontFamily: FN.mono, fontSize: 32, color: P.green}}>lawful</div>
          </div>
        </Card>
        <Card k={rise(t, c.riba)} top={880} h={190} tone={P.red} style={{display: 'flex', alignItems: 'center', gap: 30}}>
          <div style={{fontSize: 90, color: P.red}}>✕</div>
          <div>
            <div style={{fontFamily: FN.sans, fontWeight: 800, fontSize: 70}}>RIBA</div>
            <div style={{fontFamily: FN.mono, fontSize: 32, color: P.red}}>haram</div>
          </div>
        </Card>
        <div style={{position: 'absolute', top: 1110, left: 70}}>
          <Chip k={rise(t, c.trade + 0.4)}>Qur'an 2:275</Chip>
        </div>
      </div>

      {/* hiyal: riba in a costume */}
      <Card k={rise(t, c.hiyal)} top={640} h={330} tone={P.gold}>
        <div style={{fontFamily: FN.mono, fontSize: 30, color: P.gold, letterSpacing: 3}}>ḤIYAL · LEGAL TRICKS</div>
        <div style={{position: 'relative', marginTop: 34, height: 150}}>
          <div style={{position: 'absolute', fontFamily: FN.sans, fontWeight: 800, fontSize: 110, color: P.red, opacity: 1 - disguise * 0.85}}>RIBA</div>
          <div
            style={{
              position: 'absolute', left: 0, top: 6, width: 560 * disguise, height: 130, overflow: 'hidden',
              background: P.panelHi, border: `2px dashed ${P.gold}`, borderRadius: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: FN.serif, fontStyle: 'italic', fontSize: 80, color: P.cream, whiteSpace: 'nowrap',
            }}
          >
            “a sale”
          </div>
        </div>
      </Card>
      <div style={{position: 'absolute', top: 1010, left: 70, display: 'flex', gap: 16, flexWrap: 'wrap'}}>
        <Chip k={rise(t, c.hiyal + 2.0)} tone="green">some allowed</Chip>
        <Chip k={rise(t, c.notAllowed)} tone="red">some clearly not ✕</Chip>
      </div>
      <div
        style={{
          position: 'absolute', top: 1090, left: 130, opacity: stamp,
          transform: `rotate(-6deg) scale(${1.6 - 0.6 * stamp})`, border: `8px solid ${P.red}`, color: P.red,
          padding: '8px 36px', borderRadius: 14, fontFamily: FN.sans, fontWeight: 900, fontSize: 90, letterSpacing: 4,
        }}
      >
        NOT CLEAN
      </div>
    </Stage>
  );
};

const Honest: React.FC<{t: number}> = ({t}) => {
  const c = cu.honest;
  const quoteOut = 1 - band(t, c.defects - 0.2, c.defects + 0.2);
  const rep = prog(t, c.rep, c.rep + 1.6);
  const strike = (t0: number) => prog(t, t0 + 0.3, t0 + 0.7);
  return (
    <Stage id="honest" t={t}>
      <Head t={t} t0={c.two} n="02" title="Be honest." />
      <div style={{opacity: quoteOut}}>
        <Card k={rise(t, c.prophet)} top={640} h={370} tone={P.gold} style={{padding: '36px 44px'}}>
          <div style={{fontFamily: FN.mono, fontSize: 28, color: P.gold}}>THE PROPHET ﷺ</div>
          <div style={{fontFamily: FN.serif, fontStyle: 'italic', fontSize: 84, lineHeight: 1.05, marginTop: 20, opacity: rise(t, c.quote, 0.5)}}>
            “Whoever cheats us is not one of us.”
          </div>
        </Card>
        <div style={{position: 'absolute', top: 1050, left: 70}}>
          <Chip k={rise(t, c.quote + 0.6)}>Sahih Muslim</Chip>
        </div>
      </div>
      {[
        {t: c.defects, label: 'Hidden defects', y: 640},
        {t: c.fake, label: 'Fake discounts', y: 800},
      ].map((r) => (
        <Card key={r.label} k={rise(t, r.t)} top={r.y} h={130} tone={P.red} style={{display: 'flex', alignItems: 'center', padding: '0 44px'}}>
          <div style={{position: 'relative', fontFamily: FN.sans, fontWeight: 800, fontSize: 64}}>
            {r.label}
            <div style={{position: 'absolute', left: -8, top: '54%', height: 8, width: `${strike(r.t) * 108}%`, background: P.red, borderRadius: 4}} />
          </div>
        </Card>
      ))}
      <div style={{position: 'absolute', top: 1000, left: 70, right: 70, opacity: rise(t, c.rep)}}>
        <div style={{fontFamily: FN.mono, fontWeight: 600, fontSize: 32, color: P.gold, letterSpacing: 3}}>
          REPUTATION = CAPITAL
        </div>
        <div style={{marginTop: 22, height: 54, borderRadius: 27, border: `3px solid ${P.gold}`, overflow: 'hidden'}}>
          <div style={{width: `${rep * 100}%`, height: '100%', background: `linear-gradient(90deg, ${P.gold}, ${P.goldHi})`}} />
        </div>
      </div>
    </Stage>
  );
};

const Tawakkul: React.FC<{t: number}> = ({t}) => {
  const c = cu.tawakkul;
  const q = (1 - band(t, c.half - 0.25, c.half + 0.1));
  const halfOut = 1 - band(t, c.effort - 0.25, c.effort + 0.1);
  const rope = prog(t, c.quote, c.quote + 1.5);
  const pie = prog(t, c.half + 0.2, c.half + 1.2);
  const R = 150;
  const arc = (frac: number) => {
    const a = frac * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(a) * R, y = Math.sin(a) * R;
    return `M0 0 L0 ${-R} A${R} ${R} 0 ${frac > 0.5 ? 1 : 0} 1 ${x} ${y} Z`;
  };
  return (
    <Stage id="tawakkul" t={t}>
      <Head t={t} t0={c.three} n="03" title="Effort, then trust." />
      <div style={{opacity: q}}>
        <Card k={rise(t, c.tie)} top={640} h={290} tone={P.gold}>
          <div style={{fontFamily: FN.mono, fontSize: 28, color: P.gold}}>THE PROPHET ﷺ TO THE MAN</div>
          <div style={{fontFamily: FN.serif, fontStyle: 'italic', fontSize: 78, lineHeight: 1.05, marginTop: 18, opacity: rise(t, c.quote, 0.5)}}>
            “Tie your camel, then rely on Allah.”
          </div>
        </Card>
        <svg width="940" height="230" viewBox="0 0 940 230" style={{position: 'absolute', top: 960, left: 70, opacity: rise(t, c.quote)}}>
          <rect x="120" y="40" width="22" height="170" rx="6" fill={P.gold} />
          <path
            d="M131 80 C 300 10, 520 10, 640 90 C 700 130, 660 190, 600 170 C 540 150, 560 100, 620 100 L 820 110"
            fill="none" stroke={P.goldHi} strokeWidth="10" strokeLinecap="round" pathLength={1}
            strokeDasharray={1} strokeDashoffset={1 - rope}
          />
          <text x="740" y="170" fontFamily={FN.mono} fontWeight="600" fontSize="30" fill={P.gold} opacity={rope}>tied ✓</text>
        </svg>
        <div style={{position: 'absolute', top: 1190, left: 70}}>
          <Chip k={rise(t, c.quote + 0.8)}>Hadith · al-Tirmidhi</Chip>
        </div>
      </div>
      <div style={{opacity: halfOut}}>
        <div style={{position: 'absolute', top: 650, left: 70, right: 70, display: 'flex', alignItems: 'center', gap: 50, opacity: rise(t, c.half)}}>
          <svg width="320" height="320" viewBox="-160 -160 320 320">
            <circle r={R} fill="none" stroke={P.gold} strokeWidth="6" />
            <path d={arc(0.5 * pie + 0.0001)} fill={P.gold} />
          </svg>
          <div>
            <div style={{fontFamily: FN.sans, fontWeight: 800, fontSize: 96, lineHeight: 1}}>Tawakkul</div>
            <div style={{fontFamily: FN.serif, fontStyle: 'italic', fontSize: 70, color: P.gold, marginTop: 10}}>
              half of the religion
            </div>
          </div>
        </div>
        <div style={{position: 'absolute', top: 1040, left: 70}}>
          <Chip k={rise(t, c.half + 0.8)}>Ibn al-Qayyim · via al-Munajjid</Chip>
        </div>
      </div>
      <Card k={rise(t, c.effort)} top={640} h={190} tone={P.green} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <div style={{fontFamily: FN.sans, fontWeight: 800, fontSize: 74}}>EFFORT</div>
        <div style={{fontFamily: FN.mono, fontSize: 40, color: P.green}}>your job</div>
      </Card>
      <Card k={rise(t, c.result)} top={870} h={190} tone={P.gold} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <div style={{fontFamily: FN.sans, fontWeight: 800, fontSize: 74}}>RESULT</div>
        <div style={{fontFamily: FN.mono, fontSize: 40, color: P.gold}}>Allah's</div>
      </Card>
    </Stage>
  );
};

const Ruling: React.FC<{t: number}> = ({t}) => {
  const c = cu.ruling;
  const chips = [
    {t: c.time, label: 'TIME'},
    {t: c.place, label: 'PLACE'},
    {t: c.custom, label: 'CUSTOM'},
  ];
  const sign = prog(t, c.ask + 0.8, c.ask + 1.6);
  return (
    <Stage id="ruling" t={t}>
      <Head t={t} t0={c.four} n="04" title="Check the ruling." />
      <Card k={rise(t, c.fatwa)} top={640} h={260} tone={P.gold}>
        <div style={{fontFamily: FN.mono, fontSize: 28, color: P.gold}}>IBN AL-QAYYIM · FATWAS CHANGE WITH</div>
        <div style={{display: 'flex', gap: 18, marginTop: 36}}>
          {chips.map((ch) => {
            const k = rise(t, ch.t, 0.3);
            return (
              <div
                key={ch.label}
                style={{
                  flex: 1, textAlign: 'center', padding: '28px 0', borderRadius: 18, border: `3px solid ${P.gold}`,
                  background: k > 0.5 ? P.gold : 'transparent', color: k > 0.5 ? P.ink : P.muted,
                  fontFamily: FN.sans, fontWeight: 800, fontSize: 44, transform: `scale(${0.92 + 0.08 * k})`,
                }}
              >
                {ch.label}
              </div>
            );
          })}
        </div>
      </Card>
      <div style={{position: 'absolute', top: 930, left: 70}}>
        <Chip k={rise(t, c.fatwa + 0.8)}>I'lam al-Muwaqqi'in 4/157</Chip>
      </div>
      <Card k={rise(t, c.ask)} top={1010} h={250} tone={P.green}>
        <div style={{fontFamily: FN.mono, fontSize: 28, color: P.green}}>BEFORE YOU SIGN</div>
        <div style={{fontFamily: FN.sans, fontWeight: 800, fontSize: 62, marginTop: 14}}>Ask a qualified scholar</div>
        <svg width="500" height="60" viewBox="0 0 500 60" style={{marginTop: 6}}>
          <line x1="0" y1="50" x2="500" y2="50" stroke={P.muted} strokeWidth="3" />
          <path d="M10 40 C 60 -10, 90 60, 140 20 S 220 10, 260 30" fill="none" stroke={P.goldHi} strokeWidth="5" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - sign} />
        </svg>
      </Card>
    </Stage>
  );
};

const Cta: React.FC<{t: number}> = ({t}) => {
  const c = cu.cta;
  const pulse = 1 + 0.04 * Math.sin(t * 8);
  return (
    <Stage id="cta" t={t}>
      <div style={{position: 'absolute', top: 330, left: 70, right: 70, fontFamily: FN.serif, fontSize: 150, lineHeight: 1, color: P.cream}}>
        <div><Mask k={rise(t, c.clean, 0.45)}>Clean income.</Mask></div>
        <div><Mask k={rise(t, c.honest, 0.45)}>Honest deals.</Mask></div>
        <div style={{color: P.gold, fontStyle: 'italic'}}><Mask k={rise(t, c.camel, 0.45)}>Tie your camel.</Mask></div>
      </div>
      <div style={{position: 'absolute', top: 960, left: 70, right: 70, textAlign: 'center', opacity: rise(t, c.follow)}}>
        <div
          style={{
            display: 'inline-block', transform: `scale(${pulse})`, background: P.gold, color: P.ink, borderRadius: 999,
            padding: '34px 56px', fontFamily: FN.sans, fontWeight: 800, fontSize: 60,
          }}
        >
          Follow @{BT.handle}
        </div>
        <div style={{marginTop: 30, fontFamily: FN.mono, fontSize: 26, color: P.muted}}>
          Educational reminder, not a fatwa.
        </div>
      </div>
    </Stage>
  );
};

/* ---------- chrome ---------- */

const Captions: React.FC<{t: number}> = ({t}) => {
  const caps = BT.captions as [number, string][];
  let i = -1;
  caps.forEach(([ct], idx) => {
    if (t >= ct) i = idx;
  });
  if (i < 0) return null;
  const [t0, text] = caps[i];
  const k = rise(t, t0, 0.25);
  return (
    <div
      style={{
        position: 'absolute', top: CAP_Y, left: 70, right: 70, minHeight: 190, display: 'flex',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center',
      }}
    >
      <div
        style={{
          fontFamily: FN.sans, fontWeight: 800, fontSize: 62, lineHeight: 1.12, color: P.cream, opacity: k,
          transform: `translateY(${(1 - k) * 24}px) scale(${0.96 + 0.04 * k})`,
          textShadow: '0 4px 24px rgba(0,0,0,0.9), 0 0 4px rgba(0,0,0,0.8)',
        }}
      >
        {text}
      </div>
    </div>
  );
};

export const BusinessShort: React.FC = () => {
  useFonts();
  const frame = useCurrentFrame();
  const t = frame / BFPS;
  return (
    <AbsoluteFill style={{background: P.bg}}>
      <Backdrop t={t} />
      <Hook t={t} />
      <Intro t={t} />
      <Halal t={t} />
      <Honest t={t} />
      <Tawakkul t={t} />
      <Ruling t={t} />
      <Cta t={t} />
      <div style={{position: 'absolute', top: 150, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
        <div style={{fontFamily: FN.mono, fontWeight: 600, fontSize: 30, color: P.gold, letterSpacing: 2, opacity: 0.9}}>
          @{BT.handle}
        </div>
      </div>
      <div style={{position: 'absolute', top: 110, left: 70, right: 70, height: 6, background: P.line, borderRadius: 3}}>
        <div style={{width: `${(t / BT.duration) * 100}%`, height: '100%', background: P.gold, borderRadius: 3}} />
      </div>
      <Captions t={t} />
      <Grain frame={frame} opacity={0.07} />
      <Audio src={staticFile('vo.mp3')} />
    </AbsoluteFill>
  );
};
