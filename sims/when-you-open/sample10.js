// Sample · Scene 10 → 11. On the shadow screen, lives across times and places, each under its own lamp;
// the lamps go out, the carved holes of the sky are left as stars; a star flares into daylight on the open mushaf.
import { Impasto, Strokes } from './engine/impasto.js';
import { lerp, seg, ss, eio, clamp, hash } from './engine/common.js';
import { buildRoom, buildSun, buildHand, buildPage, HW, HH, HOX, HOY, SPINE } from './desk.js';
import { makeScreen, person, house, palm, ground, sky, portal, dunes, hillTree, GY } from './screen.js';
import { estimate, T as timing } from './timing.js';
import { drawCaption } from './caption.js';

const A = estimate(['And somewhere along the way...', 'We still find ourselves asking the same questions.', 'Why am I here?', 'What is the purpose of my life?', 'What is right?',
  'What happens after I die?', 'And...', 'What does my Creator expect of me?', "The Qur'an invites you to reflect on these questions.", 'To look at the world around you.',
  'To examine the lives of those who came before you.', 'And to look within yourself.', 'Not merely to inform your mind...', 'But to guide your heart.', 'And your actions.'], 1.5);
const TA = timing(A);
const CUT = TA.t1 + 3.2;                                 // the flare: screen -> desk
const B = estimate(["So come to the Qur'an with sincerity.", 'Come with questions.', 'Come willing to learn.', 'And above all...', 'Come prepared to listen.'], CUT + 2.2);
const TB = timing(B);
export const DUR = TB.t1 + 5;
const S = [...A, ...B];
export const texts = t => { const c = S.find(x => t >= x.start - .1 && t < x.end + .5); return c ? [{ id: 'cap', text: c.text, x0: 200, y0: 970, x1: 1720, y1: 1030 }] : []; };
export const events = () => [{ t: TA.at(12), type: 'lamps-out' }, { t: CUT, type: 'flare' }, { t: TB.at(3), type: 'page' }];

const VX = [520, 1360, 2200, 3060, 3900];               // the five lives, each with a lamp
const OUT = [TA.at(12), TA.at(12) + 1.4, TA.at(13), TA.at(13) + 1.2, TA.at(14)];   // order the lamps go out
const ORDER = [0, 4, 1, 3, 2];
const STAR = [2728, 120];                                // the crescent in the sky band
const NEVER = 1e6;

export async function setup(canvas, sc) {
  // ---- screen world
  const scr = makeScreen(sc);
  const P = [
    sky(-200, 4600), ground(-200, 4600),
    house(400, GY, 270, 250, '#9a2a1e'), person(610, GY, .8, 'sit', '#2c4a78'),
    house(1220, GY, 230, 220, '#1f6a6a'), person(1380, GY, .82, 'carry', '#cf8d22', { f: -1 }), person(1500, GY, .82, 'stand', '#2c4a78', { f: -1 }),
    portal(2200, GY, 520, 560, '#5f3a7a'), person(2125, GY, .86, 'stand', '#9a2a1e'), person(2275, GY, .86, 'stand', '#1f6a6a'), person(2200, GY + 6, .8, 'child', '#cf8d22'),
    dunes(2700, 3420), palm(2880, GY - 60, 300), person(3140, GY - 40, .78, 'walk', '#2c4a78'),
    hillTree(3900, GY, '#5f6a2a'), person(3820, GY - 92, .62, 'sit', '#9a2a1e'),
  ].map(p => ({ p }));
  // ---- desk world
  const E = new Impasto(canvas, { ss: +(new URLSearchParams(location.search).get('ss') || 2) }), dyn = new Strokes(64);
  const up = b => ({ b: E.batch(b.strokes.data()), tex: E.texture(b.ref.ctx.canvas), w: b.ref.w, h: b.ref.h });
  const room = up(buildRoom(3, true)), sun = up(buildSun(95, 5, true)), page = up(buildPage()), hand = up(buildHand());

  const lampI = (k, t) => { const out = OUT[ORDER.indexOf(k)], u = (t - out) / .6; const fl = 1 + .05 * Math.sin(t * 23 + k * 3) + .04 * (hash(Math.floor(t * 9) + k * 77) - .5); return (u < 0 ? 1 : u < 1 ? (1 - u) * (.7 + .3 * Math.sin(u * 40)) : 0) * fl; };

  return (t, ov) => {
    if (t < CUT + .9) {                       // ---------------- the screen
      sc.style.visibility = 'visible';
      // pan across the five lives through the questions; pull back to see them all; then up into the sky and the crescent
      const pan = eio(seg(t, TA.at(1), TA.end(7) + .4)), back = eio(seg(t, TA.at(8), TA.end(11))), up2 = eio(seg(t, TA.at(12), TA.end(14))), dive = Math.pow(seg(t, TA.end(14), CUT + .9), 2.2);
      let cx = lerp(520, 3900, pan), cy = 560, z = 1.0;
      cx = lerp(cx, 2200, back); z = lerp(z, .46, back); cy = lerp(cy, 520, back);
      cx = lerp(cx, STAR[0] - 300, up2); cy = lerp(cy, 330, up2); z = lerp(z, .95, up2);
      cx = lerp(cx, STAR[0], dive); cy = lerp(cy, STAR[1], dive); z = lerp(z, 7, dive);
      const lamps = VX.map((x, k) => [x, 620, lampI(k, t) * 1.0, .9]);
      const night = ss(seg(t, TA.at(12), TA.end(14)));
      lamps.push([1300, 160, .16 + .3 * night, .2], [2700, 160, .2 + .45 * night, .3], [4000, 160, .16 + .3 * night, .2]);
      const fade = ss(seg(t, CUT - .5, CUT + .3));
      scr.draw([cx, cy, z], P, { rect: [-160, -20, 4560, 1090], lamps, time: t, expo: 1.05 + .8 * night, amb: .12, sigB: 360, fade, fadeCol: [1, .93, .78] });
      if (t > CUT - .5) { ov.fillStyle = `rgba(255,238,200,${fade})`; ov.fillRect(0, 0, 1920, 1080); }
    } else {                                  // ---------------- the desk, open mushaf, daylight
      sc.style.visibility = 'hidden';
      const u = t - CUT;
      const cam = { x: 1090, y: 650, zoom: 1.12 };
      E.begin([.16, .13, .11]);
      const o = { t, cam, grey: .5, reveal: NEVER, tint: [1.0, .98, .96] };
      E.under(room.tex, room.w, room.h, o); E.draw(room.b, o);
      E.draw(sun.b, { t, cam, grey: 0 });
      // the page turns on "And above all...": lifts at the corner, crosses the spine, settles on the left
      const pt = eio(seg(t, TB.at(3) - .2, TB.at(3) + 2.4)), sx = SPINE[0][0] + 2;
      const c = Math.cos(pt * Math.PI), lift = Math.sin(pt * Math.PI);
      const M = [c, -lift * .16, 0, 1, sx - sx * c, lift * .16 * sx - lift * 26];
      if (pt > 0 && pt < 1) E.draw(page.b, { t, cam, M, grey: 0, hgt: .9 });
      // the reader's hand: resting by the right page, then carrying its corner over
      const tip = pt > 0 && pt < 1 ? [sx + (1470 - sx) * c, 860 - lift * 70] : (pt >= 1 ? [1430, 905] : [1470, 905]);
      const rise = eio(seg(u, .6, 2.8));
      const at = [lerp(1650, tip[0], rise), lerp(1180, tip[1], rise)];
      const a = .5 - pt * .25, s = .96, cc = Math.cos(a) * s, sn = Math.sin(a) * s;
      const MH = [cc, sn, -sn, cc, at[0] - (cc * HOX - sn * HOY), at[1] - (sn * HOX + cc * HOY)];
      E.under(hand.tex, HW, HH, { t, cam, M: MH, grey: .2, reveal: NEVER }); E.draw(hand.b, { t, cam, M: MH, grey: .2, reveal: NEVER, hgt: 1.2 });
      E.finish({ light: [-.62, -.48, .62], vig: .38, expo: 1.03, ground: [.16, .13, .11], lightCol: [1, .95, .86] });
      const wf = 1 - ss(seg(u, 0, 1.6));        // out of the flare
      if (wf > 0) { ov.fillStyle = `rgba(255,238,200,${wf})`; ov.fillRect(0, 0, 1920, 1080); }
    }
    drawCaption(ov, S, t);
  };
}
