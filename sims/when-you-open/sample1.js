// Sample · Scene 1, The Invitation (impasto desk). Morning light crosses the desk to the closed mushaf;
// a hand comes in, rests, reaches, and stops just above the book. Everything holds.
import { Impasto, Strokes } from './engine/impasto.js';
import { lerp, seg, ss, eio, clamp } from './engine/common.js';
import { buildRoom, buildSun, buildHand, DW, DH, HW, HH, HOX, HOY, BOOK } from './desk.js';
import { estimate, T as timing } from './timing.js';
import { drawCaption } from './caption.js';

const LINES = [
  'There is something I want you to know...', "Before you open the Qur'an.", 'Something that might change the way you read it.',
  'Because when most of us pick up a book, we already have certain expectations.', 'We expect it to begin somewhere...',
  'Take us through a series of ideas...', 'And eventually bring us to a conclusion.', "But the Qur'an...", 'Is different.',
  'Not only because of what it says.', 'But because of how it speaks.', 'And to understand that, we need to begin with a question.',
  'What exactly are you about to read?',
];
const S = estimate(LINES, 4.0), T = timing(S);
export const DUR = T.t1 + 4.5;
export const texts = t => { const c = S.find(x => t >= x.start - .1 && t < x.end + .5); return c ? [{ id: 'cap', text: c.text, x0: 200, y0: 970, x1: 1720, y1: 1030 }] : []; };
export const events = () => [{ t: 0, type: 'room' }, { t: T.at(0) - 1, type: 'light' }, { t: T.at(3), type: 'chair' }, { t: T.at(12) + 1.4, type: 'freeze' }];

const SUN_AT = 1.2;                      // the light starts under the window
const FREEZE = T.end(12) - .2;           // the reach stops on the question
const NEVER = 1e6;

// world (plate units) -> screen for the 2D haze layer
const toScreen = (cam, [x, y]) => [(x - cam.x) * cam.zoom + 960, (y - cam.y) * cam.zoom + 540];
const handM = (tip, a, s) => { const c = Math.cos(a) * s, n = Math.sin(a) * s; return [c, n, -n, c, tip[0] - (c * HOX - n * HOY), tip[1] - (n * HOX + c * HOY)]; };

export async function setup(canvas) {
  const E = new Impasto(canvas, { ss: +(new URLSearchParams(location.search).get('ss') || 2) }), dyn = new Strokes(256);
  const up = b => ({ b: E.batch(b.strokes.data()), tex: E.texture(b.ref.ctx.canvas), w: b.ref.w, h: b.ref.h });
  const room = up(buildRoom()), sun = up(buildSun()), hand = up(buildHand());
  return (t0, ov, hz) => {
    const t = Math.min(t0, FREEZE);       // after the freeze nothing moves
    const k = eio(seg(t, 0, FREEZE));
    const cam = { x: lerp(1000, 1090, k), y: lerp(565, 650, k), zoom: lerp(1.0, 1.12, k) };
    E.begin([.16, .13, .11]);
    const o = { t, cam, grey: .5, reveal: NEVER, tint: [1.0, .98, .96] };
    E.under(room.tex, room.w, room.h, o); E.draw(room.b, o);
    E.draw(sun.b, { t, cam, grey: 0, appear: SUN_AT, appDur: .9, run: .45 });
    // the hand: rises in from the bottom right, rests, then reaches and stops just above the book
    const rise = eio(seg(t, T.at(3) + .4, T.at(3) + 2.8)), reach = eio(seg(t, T.at(7), FREEZE));
    if (rise > 0) {
      const rest = [1560, 1050], above = [1300, 868];
      const tip = [lerp(lerp(2050, rest[0], rise), above[0], reach), lerp(lerp(1320, rest[1], rise), above[1], reach) - Math.sin(reach * Math.PI) * 26];
      const a = lerp(.32, .46, reach), sc = lerp(1.0, .96, reach);
      // its shadow on the book: falls toward us, softer and further as the hand lifts
      const lift = Math.sin(Math.min(1, reach * 1.6) * Math.PI / 2) * reach;
      if (reach > 0) {
        dyn.clear();
        for (let j = 0; j < 9; j++) { const u = j / 8, d = [-Math.cos(a), -Math.sin(a)]; dyn.push({ x: tip[0] + 40 + 34 * lift - d[0] * (40 + u * 420), y: tip[1] + 44 + 40 * lift - d[1] * (40 + u * 420), ang: a, len: 150, wid: 92 + u * 40, c: [.12, .08, .06], type: 2, alpha: .34 * lift, hgt: 0, seed: j }); }
        E.drawNow(dyn.data(), { t, cam, grey: 0, run: 0 });
      }
      const M = handM(tip, a, sc), g = .55 - reach * .4;
      E.under(hand.tex, HW, HH, { t, cam, M, grey: g, reveal: NEVER });
      E.draw(hand.b, { t, cam, M, grey: g, reveal: NEVER, hgt: 1.2 });
    }
    E.finish({ light: [-.62, -.48, .62], vig: .38, expo: 1.03, sat: 1.0, ground: [.16, .13, .11], lightCol: [1, .95, .86] });
    // light in the air: a faint shaft from the window to the patch, growing as the sun arrives
    const sh = .11 * ss(seg(t, SUN_AT, SUN_AT + 6));
    if (sh > 0) {
      const poly = [[254, 300], [586, 300], [640, 705], [1470, 735], [1560, 990], [900, 1010], [330, 705]].map(p => toScreen(cam, p));
      const [ax, ay] = toScreen(cam, [420, 330]), [bx, by] = toScreen(cam, [1250, 900]);
      const g = hz.createLinearGradient(ax, ay, bx, by); g.addColorStop(0, `rgba(255,214,150,${sh})`); g.addColorStop(1, 'rgba(255,214,150,0)');
      hz.fillStyle = g; hz.filter = 'blur(30px)'; hz.beginPath(); poly.forEach(([x, y], i) => i ? hz.lineTo(x, y) : hz.moveTo(x, y)); hz.closePath(); hz.fill(); hz.filter = 'none';
    }
    drawCaption(ov, S, t0);
  };
}
