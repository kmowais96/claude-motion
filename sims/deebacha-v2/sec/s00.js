// Cover · a title page on old paper, before the voice begins.
// A double frame rules itself in → تفهيم القرآن is inked right to left, its meaning under it → the English title rises →
// the author's name → a vermilion seal is pressed beside it. The camera leans in slightly throughout.
import { W, H, seg, eo, eio, clamp } from '../shell.js';
import { paper, M } from '../lib/ink/comp.js';
import { seal } from '../lib/ink/seal.js';
import { loadInkFonts } from '../lib/ink/fonts.js';

const INK = '#1f1a15', RULE = 'rgba(52,40,28,.82)';
const AR = 'تفهيم القرآن', EN = 'Towards Understanding the Qur\u2019an', TITLE = 'The Preface', BY = 'Sayyid Abul A\u2019la Mawdudi',
  KICK = 'DEEBACHA';
const ARF = '700 168px "Amiri"', ENF = 'italic 500 40px "Cormorant Garamond"', TF = '84px "IM Fell English"', BF = 'italic 500 46px "Cormorant Garamond"', KF = '30px "IM Fell English SC"';
const Y = { kick: 250, ar: 430, en: 600, star: 682, title: 786, by: 876 };
// beats (seconds from the start of the film)
const B = { frame: [.15, 1.6], kick: [.9, 1.7], ar: [1.2, 2.9], en: [2.4, 3.2], star: [2.5, 3.1], title: [2.9, 3.9], by: [3.6, 4.4], seal: 4.6 };

let AROFF = null, AW = 0, EW = 0, TW = 0, BW = 0, KW = 0;
const mkc = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };

function star(c, x, y, r, p = 1) {
  // khatam: two squares turned 45° to each other, with a small ring at the heart
  c.save(); c.translate(x, y); c.strokeStyle = RULE; c.lineWidth = 2;
  for (const a of [0, Math.PI / 4]) { c.save(); c.rotate(a + (1 - p) * .6); c.globalAlpha = p; c.strokeRect(-r * .7, -r * .7, r * 1.4, r * 1.4); c.restore(); }
  c.globalAlpha = p; c.beginPath(); c.arc(0, 0, r * .28, 0, 7); c.stroke();
  c.restore();
}

function ruled(c, pts, p, w) {
  // a path that draws itself in over p (0..1)
  let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  c.save(); c.strokeStyle = RULE; c.lineWidth = w; c.lineCap = 'square';
  c.setLineDash([L * p, L + 1]); c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); c.restore();
}
const rect = (x0, y0, x1, y1) => [[(x0 + x1) / 2, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0], [(x0 + x1) / 2, y0]];

function measure() {
  const c = mkc().getContext('2d');
  c.font = TF; TW = c.measureText(TITLE).width;
  c.font = BF; BW = c.measureText(BY).width;
  c.font = ENF; EW = c.measureText(EN).width;
  c.font = KF; c.letterSpacing = '6px'; KW = c.measureText(KICK).width;
  AROFF = mkc(); const a = AROFF.getContext('2d');
  a.font = ARF; a.textAlign = 'center'; a.textBaseline = 'middle'; a.direction = 'rtl'; a.fillStyle = INK;
  AW = a.measureText(AR).width;
  a.fillText(AR, W / 2, Y.ar);
}

function draw(c, t) {
  c.drawImage(paper(), -M, -M);
  // frame: outer heavy rule, inner hairline, both ruled in from the top centre
  const pf = eio(seg(t, ...B.frame)), pi = eio(seg(t, B.frame[0] + .25, B.frame[1] + .25));
  ruled(c, rect(96, 72, W - 96, H - 72), pf, 4);
  ruled(c, rect(114, 90, W - 114, H - 90), pi, 1.4);
  for (const [x, y] of [[114, 90], [W - 114, 90], [W - 114, H - 90], [114, H - 90]]) star(c, x, y, 16, eo(seg(t, B.frame[1] - .1, B.frame[1] + .5)));

  c.textAlign = 'center'; c.textBaseline = 'middle';
  // kicker line, letterspaced small caps between two short rules
  const kk = eo(seg(t, ...B.kick));
  if (kk > 0) {
    c.save(); c.globalAlpha = kk; c.fillStyle = INK; c.font = KF; c.letterSpacing = '6px'; c.fillText(KICK, W / 2 + 3, Y.kick); c.restore();
    const g = KW / 2 + 40, l = 120 * kk;
    ruled(c, [[W / 2 - g, Y.kick], [W / 2 - g - l, Y.kick]], 1, 1.4); ruled(c, [[W / 2 + g, Y.kick], [W / 2 + g + l, Y.kick]], 1, 1.4);
  }
  // the Arabic, inked from right to left behind a soft edge
  const pa = seg(t, ...B.ar);
  if (pa > 0) {
    const xr = W / 2 + AW / 2 + 40, xl = W / 2 - AW / 2 - 40, edge = 90, x = xr - (xr - xl + edge) * eio(pa);
    c.save();
    const g = c.createLinearGradient(x, 0, x + edge, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)');
    const m = mkc(), mc = m.getContext('2d'); mc.drawImage(AROFF, 0, 0); mc.globalCompositeOperation = 'destination-in';
    mc.fillStyle = g; mc.fillRect(Math.max(0, x), 0, W, H);
    c.globalAlpha = .94; c.drawImage(m, 0, 0); c.restore();
  }
  // what the name means, under it
  const pe = eo(seg(t, ...B.en));
  if (pe > 0) { c.save(); c.globalAlpha = pe * .88; c.fillStyle = INK; c.font = ENF; c.fillText(EN, W / 2, Y.en + 8 * (1 - pe)); c.restore(); }
  // a rule with the star at its heart
  const ps = eo(seg(t, ...B.star));
  if (ps > 0) {
    const half = 330 * ps;
    ruled(c, [[W / 2 - 34, Y.star], [W / 2 - 34 - half, Y.star]], 1, 1.4); ruled(c, [[W / 2 + 34, Y.star], [W / 2 + 34 + half, Y.star]], 1, 1.4);
    star(c, W / 2, Y.star, 20, ps);
  }
  // English title rises a little as it appears; the author's name follows
  const pt = eo(seg(t, ...B.title));
  if (pt > 0) { c.save(); c.globalAlpha = pt; c.fillStyle = INK; c.font = TF; c.fillText(TITLE, W / 2, Y.title + 14 * (1 - pt)); c.restore(); }
  const pb = eo(seg(t, ...B.by));
  if (pb > 0) { c.save(); c.globalAlpha = pb * .9; c.fillStyle = INK; c.font = BF; c.fillText(BY, W / 2, Y.by + 10 * (1 - pb)); c.restore(); }
  // the seal: pressed in beside the name, lands slightly large and settles
  const k = eo(seg(t, B.seal, B.seal + .35));
  if (k > 0) { const x = W / 2 + BW / 2 + 52, y = Y.by; c.save(); c.translate(x, y); c.scale(1.5 - .5 * k, 1.5 - .5 * k); seal(c, -22, -22, 44, k, 2); c.restore(); }
}

export default {
  style: 'ink',
  page: 'cover',
  ownCaptions: true,
  async init() { await loadInkFonts(); paper(); measure(); },
  render(ctx, t) {
    const s = 1 + .025 * eio(clamp(t / 7));
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(s, s); ctx.translate(-W / 2, -H / 2); draw(ctx, t); ctx.restore();
  },
  texts(t) {
    const out = [];
    if (t > B.kick[1]) out.push({ id: 'kick', text: KICK, x0: W / 2 - KW / 2, y0: Y.kick - 18, x1: W / 2 + KW / 2, y1: Y.kick + 18 });
    if (t > B.ar[1]) out.push({ id: 'ar', text: AR, x0: W / 2 - AW / 2, y0: Y.ar - 100, x1: W / 2 + AW / 2, y1: Y.ar + 100 });
    if (t > B.en[1]) out.push({ id: 'en', text: EN, x0: W / 2 - EW / 2, y0: Y.en - 24, x1: W / 2 + EW / 2, y1: Y.en + 24 });
    if (t > B.title[1]) out.push({ id: 'title', text: TITLE, x0: W / 2 - TW / 2, y0: Y.title - 50, x1: W / 2 + TW / 2, y1: Y.title + 50 });
    if (t > B.by[1]) out.push({ id: 'by', text: BY, x0: W / 2 - BW / 2, y0: Y.by - 28, x1: W / 2 + BW / 2, y1: Y.by + 28 });
    return out;
  },
  events() {
    return [{ t: B.frame[0], type: 'brush', dur: 1.4, soft: true }, { t: B.ar[0] + .1, type: 'brush', dur: 1.5 }, { t: B.seal + .05, type: 'stamp' }];
  },
};
