// Section 11 · Two more tools — watercolour journal, p. 1 of 2.
// A closed mushaf painted at the centre; the introduction card with four hand notes beside it;
// two pins for the two kinds of notes; then everything settles to the margins and the mushaf keeps the centre.
import { mk, drawS, drawList, withSeed, rnd, qcurve, line, smooth, sprite, drawSprite, reveal, seg, ss, eo, eio, lerp, rgba } from '../lib/watercolor/engine.js';
import { PAL, paper, hand, handBox, leader, header, headerBoxes, roundWash, buildMushaf, buildCard, CARD_ROWS, CARD_ICON_X } from '../lib/watercolor/journal.js';

const { INK2, RAIN, SAGE, SAND, FLAG, GOLD } = PAL;
const MX = 960, MY = 470;                    // mushaf centre
const CARD0 = [566, 486], CARD1 = [372, 500];  // card centre: beside the book → at the margin
const V0 = [[1432, 352], [1432, 612]], VX1 = 1618;  // the two pins, then their margin x
const NOTES = ['when it came down', 'what was happening', 'where the call stood', 'what it faced'];
const PINNOTE = ['where a question rises', 'where the spirit is easy to miss'];
const KICK = 'PREFACE · PP. 7–8', TITLE = 'Two more tools';
let M, CARD, Q, PATH, PINS, TABS, HALO, mctx;

function withBg(bg, L) {
  const cv = document.createElement('canvas'); cv.width = bg.x1 - bg.x0; cv.height = bg.y1 - bg.y0;
  const c = cv.getContext('2d'); c.translate(-bg.x0, -bg.y0); c.drawImage(bg.cv, bg.x0, bg.y0); for (const s of L) drawS(c, s);
  return { cv, x0: bg.x0, y0: bg.y0, x1: bg.x1, y1: bg.y1 };
}
function cues(T) {
  const W = (i, w) => T.word(i, w);
  return {
    head: T.at(0) - .2,
    mCover: [T.at(0) + .1, T.k(0, .6)], mEdge: [T.k(0, .45), T.k(0, .72)], mPat: [T.k(0, .55), T.end(0) + .5],
    card: [T.at(1) - .1, T.at(1) + 1.3],
    rows: [W(1, 5), W(1, 9), W(1, 12), W(1, 18)],
    tabs: [W(2, 6), W(2, 7)], pins: [T.k(2, .55), T.k(2, .55) + .8],
    q: [T.at(3) + .05, T.at(3) + 1.3], qNote: T.at(3) + .8,
    path: [T.at(4) + .05, T.at(4) + 1.6], flag: W(4, 7), pNote: T.at(4) + 1.0,
    settle: [T.at(5) + .1, T.at(5) + 1.9],
  };
}

export default {
  style: 'watercolor',
  page: 'pp. 7–8',
  async init(T) {
    await document.fonts.load('600 32px "Caveat"', 'Ab'); await document.fonts.load('400 19px "IBM Plex Mono"', 'P');
    await document.fonts.load('500 54px "Cormorant Garamond"', 'T');
    paper(3);
    mctx = document.createElement('canvas').getContext('2d');
    M = buildMushaf(); CARD = buildCard();
    withSeed(1103, () => {
      // pin 1: a rain-blue question mark in a pale round wash
      const qm = [mk(smooth([[-24, -26], [-14, -46], [6, -50], [22, -38], [20, -20], [6, -8], [0, 6], [0, 18]], 6), 13, RAIN, { prof: 'brush', nb: 4, a: .92 }),
        mk(line(0, 36, 1, 40, 2), 12, RAIN, { prof: 'even', nb: 0, a: .95 })];
      Q = { bg: roundWash(0, 0, 76, RAIN, .2), mark: qm };
      Q.spr = withBg(Q.bg, qm);
      // pin 2: a path hurried along, with a small flag planted beside it
      const pth = [mk(smooth([[-58, 50], [-18, 36], [-34, 14], [4, 0], [22, -20], [6, -34], [22, -52]], 6), 22, SAND, { prof: 'tip', nb: 5, a: .85 })];
      const fl = [mk(line(36, 12, 36, -46, 8), 2.6, INK2, { prof: 'even', nb: 0, a: .85 }),
        mk([[37, -45], [48, -41], [60, -36], [48, -32], [37, -28]], 9, FLAG, { prof: 'leaf', nb: 2, a: .9 })];
      PATH = { bg: roundWash(0, 0, 76, SAGE, .24), path: pth, flag: fl };
      PATH.spr = withBg(PATH.bg, [...pth, ...fl]);
      // two tabs slipped into the book's pages
      TABS = [mk(line(150, -112, 226, -110, 6), 20, RAIN, { prof: 'even', nb: 3, a: .55 }), mk(line(150, 132, 226, 134, 6), 20, SAGE, { prof: 'even', nb: 3, a: .7 })];
      // a soft gold halo for the mushaf at the end
      HALO = roundWash(0, 0, 300, GOLD, .16, { blur: 26, rim: false, sy: 1.1 });
    });
  },

  render(ctx, t, T) {
    const C = cues(T);
    ctx.drawImage(paper(3), 0, 0);
    header(ctx, KICK, TITLE, seg(t, C.head, C.head + 1.1));
    const st = eio(seg(t, ...C.settle));

    // the halo arrives as the notes step back
    if (st > 0) { ctx.save(); ctx.globalAlpha = st; ctx.translate(MX + 10, MY); drawSprite(ctx, HALO); ctx.restore(); }

    // the mushaf
    const ms = 1 + .05 * st;
    ctx.save(); ctx.translate(MX, MY); ctx.scale(ms, ms);
    // tabs slide out of the pages
    TABS.forEach((s, i) => {
      const p = eo(seg(t, C.tabs[i], C.tabs[i] + .5)); if (p <= 0) return;
      ctx.save(); ctx.translate(-56 * (1 - p), 0); drawS(ctx, s); ctx.restore();
    });
    const pc = seg(t, ...C.mCover), pe = seg(t, ...C.mEdge), pp = seg(t, ...C.mPat);
    if (pp >= 1) drawSprite(ctx, M.spr);
    else { drawList(ctx, M.pages, pc); M.paintCover(ctx, pc); drawList(ctx, M.edge, pe); drawList(ctx, M.pattern, pp); }
    ctx.restore();
    const tabTip = i => [MX + 226 * ms, MY + (i ? 133 : -111) * ms];

    // the introduction card and its four notes
    const cx = lerp(CARD0[0], CARD1[0], st), cy = lerp(CARD0[1], CARD1[1], st), cs = lerp(1, .74, st), ca = lerp(1, .72, st);
    const pcard = seg(t, ...C.card);
    if (pcard > 0) {
      ctx.save(); ctx.globalAlpha = ca; ctx.translate(cx, cy); ctx.scale(cs, cs); ctx.rotate(-.035);
      if (t > C.rows[3] + 1) drawSprite(ctx, CARD.spr);
      else {
        if (pcard < 1) drawList(ctx, CARD.body, pcard); else drawSprite(ctx, CARD.bodySpr);
        CARD.rows.forEach((L, i) => drawList(ctx, L, seg(t, C.rows[i], C.rows[i] + .8)));
      }
      ctx.restore();
      ctx.save(); ctx.globalAlpha = ca; ctx.translate(cx, cy); ctx.scale(cs, cs);
      NOTES.forEach((txt, i) => {
        const y = CARD_ROWS[i] + CARD_ICON_X * -.035, t0 = C.rows[i];
        leader(ctx, -168, y, CARD_ICON_X - 30, y - 2, seg(t, t0 + .15, t0 + .7), 6);
        hand(ctx, txt, -180, y, seg(t, t0, t0 + 1.1), { align: 'right' });
      });
      ctx.restore();
    }

    // the two pins: empty round washes first, then the ? and the path with its flag
    const pins = [[Q, C.q, C.qNote], [PATH, C.path, C.pNote]];
    pins.forEach(([P, pr, nt], i) => {
      const pb = seg(t, C.pins[0] + i * .25, C.pins[1] + i * .25); if (pb <= 0) return;
      const vx = lerp(V0[i][0], VX1, st), vy = V0[i][1], vs = lerp(1, .74, st), va = lerp(1, .72, st);
      const [tx, ty] = tabTip(i);
      ctx.save(); ctx.globalAlpha = va;
      leader(ctx, tx + 6, ty, vx - 80 * vs, vy, pb, i ? 10 : -10);
      ctx.translate(vx, vy); ctx.scale(vs, vs);
      const pm = seg(t, ...pr);
      if (pm >= 1 && (i === 0 || t > C.flag + .6)) drawSprite(ctx, P.spr);
      else {
        reveal(ctx, P.bg, pb, 'x', i * 5);
        if (i === 0) drawList(ctx, P.mark, pm);
        else { drawList(ctx, P.path, pm); drawList(ctx, P.flag, seg(t, C.flag, C.flag + .6)); }
      }
      hand(ctx, PINNOTE[i], 0, 112, seg(t, nt, nt + 1.2), { align: 'center', size: 30 });
      ctx.restore();
    });
  },

  texts(t, T) {
    const C = cues(T), out = [];
    if (t > C.head + 1.1) headerBoxes(mctx, KICK, TITLE).forEach((b, i) => out.push({ id: 's11-head' + i, ...b }));
    const st = eio(seg(t, ...C.settle));
    const cx = lerp(CARD0[0], CARD1[0], st), cy = lerp(CARD0[1], CARD1[1], st), cs = lerp(1, .74, st);
    NOTES.forEach((txt, i) => {
      if (t < C.rows[i] + 1.1) return;
      const b = handBox(mctx, txt, -180, CARD_ROWS[i], { align: 'right' });
      out.push({ id: 's11-note' + i, text: txt, x0: cx + b.x0 * cs, y0: cy + b.y0 * cs, x1: cx + b.x1 * cs, y1: cy + b.y1 * cs });
    });
    [C.qNote, C.pNote].forEach((nt, i) => {
      if (t < nt + 1.2) return;
      const vx = lerp(V0[i][0], VX1, st), vy = V0[i][1], vs = lerp(1, .74, st), b = handBox(mctx, PINNOTE[i], 0, 112, { align: 'center', size: 30 });
      out.push({ id: 's11-pin' + i, text: PINNOTE[i], x0: vx + b.x0 * vs, y0: vy + b.y0 * vs, x1: vx + b.x1 * vs, y1: vy + b.y1 * vs });
    });
    return out;
  },

  events(T) {
    const C = cues(T), E = [];
    E.push({ t: C.head, type: 'pencil' });
    E.push({ t: C.mCover[0], type: 'wash' }, { t: C.mEdge[0], type: 'brush' }, { t: C.mPat[0], type: 'brush', soft: true });
    E.push({ t: C.card[0], type: 'brush' });
    C.rows.forEach(r => E.push({ t: r, type: 'brush', soft: true }, { t: r + .05, type: 'pencil' }));
    C.tabs.forEach(r => E.push({ t: r, type: 'paper' }));
    E.push({ t: C.pins[0], type: 'wash' }, { t: C.q[0], type: 'brush' }, { t: C.qNote, type: 'pencil' });
    E.push({ t: C.path[0], type: 'brush' }, { t: C.flag, type: 'brush', soft: true }, { t: C.pNote, type: 'pencil' });
    E.push({ t: C.settle[0], type: 'wash' });
    return E.sort((a, b) => a.t - b.t);
  },
};
