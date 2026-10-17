// Section 12 · How to read — watercolour journal, p. 2 of 2 (same paper and palette as section 11).
// Four steps, each stamped with its number (the vermilion stamp: the one accent) and painted as spoken:
// 1 the introduction card with a loop arrow; 2 stepping stones, word by word, labelled in many languages;
// 3 one river in one stroke, nothing on it; 4 the river again with the stones, each verse flagged with a note.
// Then a soft sunrise wash over the page.
import { mk, drawS, drawList, withSeed, rnd, line, smooth, qcurve, sprite, drawSprite, reveal, washSprite, seg, ss, eo, eio, lerp, rgba, vnoise } from '../lib/watercolor/engine.js';
import { PAL, paper, hand, handBox, leader, header, headerBoxes, roundWash, arcPts, buildCard, stampSprite, drawStamp } from '../lib/watercolor/journal.js';

const { INK, INK2, PENCIL, RAIN, STONE, FLAG, SUN, SUN2, GOLD, SAND } = PAL;
const KICK = 'PREFACE · P. 8', TITLE = 'How to read';
const CARD_AT = [318, 560], CARD_S = .92;
const STAMP_X = 676, NOTE_X = 726;
const ROWS = [null, 272, 470, 668];              // top line (stamp + note) of rows 2–4 (index = step - 1)
const Y2 = 380, Y3 = 568, Y4 = 778;              // centre lines: stones, river, river + stones
const X0 = 770, X1 = 1790;
const GROUPS = [[800, 900, 1000], [1150, 1250, 1350], [1500, 1600, 1700]];   // three verses of three words
const SX = GROUPS.flat();
const LANG = ['word', 'mot', 'kelime', 'kata', 'palabra', 'Wort', 'neno', 'parola', 'ord'];
const NOTE = ['read it first · return to it often', 'word by word, in any tongue', 'whole, at once · no notes', 'again, verse by verse · notes open'];
let CARD, STAMPS, LOOP, STONES2, STONES4, RIVER, RIVER_SPR, RIVER_BED, FLAGS, SUNRISE, SUNDISC, mctx;

function cues(T) {
  return {
    head: T.at(0) - .1,
    stamp: [T.at(1) + .02, T.at(3) + .02, T.at(5) + .02, T.at(7) + .02],
    card: [T.at(2) - .25, T.at(2) + .9], loop: [T.word(2, 5), T.word(2, 5) + 1.3], n1: T.at(2) + .3,
    stones: [T.word(4, 9), T.word(4, 15) + .2], langs: [T.word(4, 15), T.word(4, 15) + 1.8], n2: T.at(4) + .2,
    river: [T.word(6, 5), T.word(6, 10)], whole: [T.word(6, 13), T.word(6, 13) + 1.2], n3: T.word(6, 8),
    bed: [T.at(8) - .1, T.at(8) + .9], stones4: [T.at(8) + .3, T.at(8) + 1.7], flags: [T.word(8, 3), T.end(8) + .4], n4: T.at(8) + .4,
    sun: [T.at(9) + .2, T.end(9) + .6], disc: [T.k(9, .5), T.end(9) + 1.4],
  };
}

function stone(L, x, y, s = 1) {
  const w = 62 * s;
  L.push(mk(qcurve(x - w / 2, y - 2, x + w / 2, y - 2, -7 * s, 10), 26 * s, STONE, { prof: 'leaf', nb: 4, a: .7 }));
  L.push(mk(qcurve(x - w / 2 + 6, y + 8, x + w / 2 - 4, y + 8, 4 * s, 10), 6 * s, INK2, { prof: 'leaf', nb: 0, a: .38 }));
}

export default {
  style: 'watercolor',
  page: 'p. 8',
  noCaption: [1, 3, 5, 7],   // "One." … "Four." are the stamped numbers
  async init(T) {
    await document.fonts.load('400 40px "IBM Plex Mono"', '1234'); await document.fonts.load('600 32px "Caveat"', 'Ab'); await document.fonts.load('400 25px "Caveat"', 'Ab');
    await document.fonts.load('500 54px "Cormorant Garamond"', 'H');
    paper(4);
    mctx = document.createElement('canvas').getContext('2d');
    CARD = buildCard();
    STAMPS = [1, 2, 3, 4].map(stampSprite);
    withSeed(1201, () => {
      // 1 · a loop arrow that leaves the card and comes back to it
      const lp = arcPts(452, 520, 74, 108, -Math.PI * .92, Math.PI * .78, 30);
      LOOP = [mk(lp, 7, INK2, { prof: 'even', nb: 2, a: .72, rough: .3 })];
      const [ex, ey] = lp[lp.length - 1], [px, py] = lp[lp.length - 3], a = Math.atan2(ey - py, ex - px);
      for (const d of [-1, 1]) LOOP.push(mk(line(ex, ey, ex - Math.cos(a + d * .55) * 22, ey - Math.sin(a + d * .55) * 22, 4), 5, INK2, { prof: 'tip', nb: 0, a: .75 }));
      // 2 · stepping stones on bare paper
      STONES2 = SX.map(x => { const L = []; stone(L, x + rnd(-6, 6), Y2 + rnd(-4, 4)); return L; });
      // 3 · one river, one stroke
      const rp = smooth([[X0 - 20, Y3 + 8], [980, Y3 - 14], [1240, Y3 + 12], [1520, Y3 - 10], [X1 + 10, Y3 + 4]], 14);
      RIVER = mk(rp, 64, RAIN, { prof: 'even', nb: 6, a: .52, rough: .16 });
      RIVER_SPR = sprite([RIVER]);
      // 4 · the same river, paler, as a bed for the stones and their flags
      const rp4 = rp.map(([x, y]) => [x, y - Y3 + Y4]);
      RIVER_BED = sprite([mk(rp4, 60, RAIN, { prof: 'even', nb: 5, a: .3, rough: .16 })]);
      STONES4 = SX.map(x => { const L = []; stone(L, x + rnd(-4, 4), Y4 + rnd(-3, 3), .9); return L; });
      // a flag (a note) on the last stone of every verse, and one more mid-verse where a question would rise
      FLAGS = [2, 4, 5, 8].map(i => {
        const x = SX[i] + 14, y = Y4 - 8, L = [];
        L.push(mk(line(x, y, x + 1, y - 58, 8), 2.6, INK2, { prof: 'even', nb: 0, a: .85 }));
        L.push(mk([[x + 2, y - 57], [x + 14, y - 53], [x + 28, y - 48], [x + 14, y - 43], [x + 2, y - 39]], 10, FLAG, { prof: 'leaf', nb: 2, a: .9 }));
        L.push(mk(line(x + 8, y - 30, x + 58, y - 30, 6), 30, PAL.CARD, { prof: 'even', nb: 2, a: .6 }));   // a small note slip
        for (let j = 0; j < 3; j++) L.push(mk(qcurve(x + 14, y - 39 + j * 9, x + 52 - (j % 2) * 12, y - 39 + j * 9, rnd(-1, 1), 6), 1.8, PENCIL, { prof: 'even', nb: 0, a: .7, rough: .5 }));
        return L;
      });
      // the sunrise: warm washes rising from the lower right, blurred like wet-in-wet; a striped sun
      const sc = document.createElement('canvas'); sc.width = 1920; sc.height = 1080;
      const c = sc.getContext('2d');
      for (const [cx, cy, rx, ry, col, a] of [[1560, 1060, 1200, 560, SUN2, .3], [1760, 760, 760, 420, SUN, .2], [1720, 220, 360, 240, SUN2, .22]]) {
        const w = roundWash(cx, cy, rx, col, a, { blur: 40, rim: false, sy: ry / rx, passes: 3, jit: 18 });
        c.drawImage(w.cv, w.x0, w.y0);
      }
      SUNRISE = sc;
      const disc = [];
      for (let i = 0; i < 7; i++) { const yy = -39 + i * 13, hw = Math.sqrt(Math.max(0, 46 * 46 - yy * yy)) * 1.02; disc.push(mk(qcurve(-hw, yy, hw, yy + rnd(-1.5, 1.5), rnd(-2, 2), 10), 15, i < 4 ? SUN : '#e79a66', { prof: 'even', nb: 3, a: .6, rough: .12 })); }
      SUNDISC = { L: disc, spr: sprite(disc) };
    });
  },

  render(ctx, t, T) {
    const C = cues(T);
    ctx.drawImage(paper(4), 0, 0);

    // sunrise under everything painted (it tints the paper)
    const ps = eio(seg(t, ...C.sun));
    if (ps > 0) {
      ctx.save(); ctx.globalAlpha = ps * .62; ctx.beginPath();
      const e = 1080 - 1180 * ps; ctx.moveTo(0, 1080);
      for (let i = 0; i <= 24; i++) ctx.lineTo(i * 80, e - i * 18 * ps + 30 * (vnoise(i * .7) - .5));
      ctx.lineTo(1920, 1080); ctx.closePath(); ctx.clip(); ctx.drawImage(SUNRISE, 0, 0); ctx.restore();
      const pd = seg(t, ...C.disc);
      if (pd > 0) { ctx.save(); ctx.translate(1712, 178 + 40 * (1 - eo(pd))); ctx.globalAlpha = ss(pd * 2); if (pd < 1) drawList(ctx, SUNDISC.L, pd); else drawSprite(ctx, SUNDISC.spr); ctx.restore(); }
    }

    header(ctx, KICK, TITLE, seg(t, C.head, C.head + 1.1));

    // 1 · the introduction card, revisited, with its loop arrow
    drawStamp(ctx, STAMPS[0], 118, ROWS[1], t, C.stamp[0]);
    hand(ctx, NOTE[0], 162, ROWS[1], seg(t, C.n1, C.n1 + 1.3), { size: 31 });
    const pc = seg(t, ...C.card);
    if (pc > 0) {
      ctx.save(); ctx.translate(...CARD_AT); ctx.scale(CARD_S, CARD_S); ctx.rotate(-.035);
      if (pc < 1) { drawList(ctx, CARD.body, pc); CARD.rows.forEach(L => drawList(ctx, L, pc)); } else drawSprite(ctx, CARD.spr);
      ctx.restore();
    }
    drawList(ctx, LOOP.slice(0, 1), seg(t, ...C.loop));
    drawList(ctx, LOOP.slice(1), seg(t, C.loop[1] - .1, C.loop[1] + .15));

    // 2 · stepping stones, word by word, in any language
    drawStamp(ctx, STAMPS[1], STAMP_X, ROWS[1], t, C.stamp[1]);
    hand(ctx, NOTE[1], NOTE_X, ROWS[1], seg(t, C.n2, C.n2 + 1.2));
    const p2 = seg(t, ...C.stones);
    STONES2.forEach((L, i) => drawList(ctx, L, seg(p2, i / 9 * .85, i / 9 * .85 + .2)));
    LANG.forEach((w, i) => { const t0 = lerp(C.langs[0], C.langs[1], i / 8); hand(ctx, w, SX[i], Y2 - 40, seg(t, t0, t0 + .45), { size: 25, align: 'center', w: 400, col: INK2 }); });

    // 3 · one river, one stroke, straight through; nothing on it
    drawStamp(ctx, STAMPS[2], STAMP_X, ROWS[2], t, C.stamp[2]);
    hand(ctx, NOTE[2], NOTE_X, ROWS[2], seg(t, C.n3, C.n3 + 1.2));
    const pr = seg(t, ...C.river);
    const pw = ss(seg(t, ...C.whole));   // the whole message, at once: a second clear wash over the full length
    if (pr >= 1) { drawSprite(ctx, RIVER_SPR); if (pw > 0) { ctx.save(); ctx.globalAlpha = .45 * pw; drawSprite(ctx, RIVER_SPR); ctx.restore(); } }
    else drawS(ctx, RIVER, ei2(pr));

    // 4 · back again: the river, the stones on it, and a flag (a note) at every verse
    drawStamp(ctx, STAMPS[3], STAMP_X, ROWS[3], t, C.stamp[3]);
    hand(ctx, NOTE[3], NOTE_X, ROWS[3], seg(t, C.n4, C.n4 + 1.3));
    reveal(ctx, RIVER_BED, seg(t, ...C.bed), 'x', 9);
    const p4 = seg(t, ...C.stones4);
    STONES4.forEach((L, i) => drawList(ctx, L, seg(p4, i / 9 * .85, i / 9 * .85 + .2)));
    FLAGS.forEach((L, i) => drawList(ctx, L, seg(t, lerp(C.flags[0], C.flags[1], i / 4), lerp(C.flags[0], C.flags[1], i / 4) + .7)));
  },

  texts(t, T) {
    const C = cues(T), out = [];
    if (t > C.head + 1.1) headerBoxes(mctx, KICK, TITLE).forEach((b, i) => out.push({ id: 's12-head' + i, ...b }));
    const N = [[C.n1, 162, ROWS[1], 31], [C.n2, NOTE_X, ROWS[1]], [C.n3, NOTE_X, ROWS[2]], [C.n4, NOTE_X, ROWS[3]]];
    N.forEach(([t0, x, y, size], i) => { if (t > t0 + 1.3) out.push({ id: 's12-note' + i, text: NOTE[i], ...handBox(mctx, NOTE[i], x, y, { size: size || 32 }) }); });
    LANG.forEach((w, i) => { const t0 = lerp(C.langs[0], C.langs[1], i / 8); if (t > t0 + .45) out.push({ id: 's12-lang' + i, text: w, ...handBox(mctx, w, SX[i], Y2 - 40, { size: 25, align: 'center', w: 400 }) }); });
    return out;
  },

  events(T) {
    const C = cues(T), E = [];
    E.push({ t: C.head, type: 'pencil' });
    C.stamp.forEach(s => E.push({ t: s, type: 'stamp' }));
    E.push({ t: C.card[0], type: 'brush' }, { t: C.loop[0], type: 'brush', soft: true }, { t: C.n1, type: 'pencil' });
    for (let i = 0; i < 9; i++) E.push({ t: lerp(C.stones[0], C.stones[1], i / 9 * .85), type: 'brush', soft: true });
    E.push({ t: C.n2, type: 'pencil' }, { t: C.langs[0], type: 'pencil' });
    E.push({ t: C.river[0], type: 'wash', dur: C.river[1] - C.river[0] }, { t: C.n3, type: 'pencil' }, { t: C.whole[0], type: 'wash', soft: true });
    E.push({ t: C.bed[0], type: 'wash' }, { t: C.stones4[0], type: 'brush' }, { t: C.n4, type: 'pencil' });
    for (let i = 0; i < 4; i++) E.push({ t: lerp(C.flags[0], C.flags[1], i / 4), type: 'brush', soft: true });
    E.push({ t: C.sun[0], type: 'wash', dur: C.sun[1] - C.sun[0] });
    return E.sort((a, b) => a.t - b.t);
  },
};
// the river stroke: a steady, even pull (slight ease at both ends)
function ei2(p) { return p < .08 ? p * p / .16 : p > .92 ? 1 - (1 - p) * (1 - p) / .16 : p; }
