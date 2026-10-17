// Section 3 · The thirst; who it's for — paper-cut lightbox, a night ladder that turns warm.
// A night town in the lamp box: hills, a domed madrasa far back (already lit), houses with dark windows, and in front
// a dry well, an empty jar and an unlit lantern. The lantern lights, a channel of light runs to the well and along the
// town, windows light one by one. Then paper strips, cut words and a "?" carry the rest of the paragraph.
import { W, H, CX, layer, drawLayer, bl, Glow, vignette, flick, scene, cut, archWin, aimAt, drift, cv, proj, setT, cutStrip, drawStrip, GRAIN } from '../lib/paper-lantern/box.js';
import { seg, eio, eo, ei, clamp, track, mulberry, TAU } from '/core/lib.js';

const Z = { sky: .8, far: .56, mid: .4, town: .25, near: .12, front: 0, words: .05 };
const LIGHT = { x: 960, y: 430, r: 900 };
const MAD = { x: 1570, base: 590 };                 // madrasa on the far crest
const WELL = { x: 860, top: 768 }, JAR = { x: 1210 }, POST = { x: 392 }, LANT = { x: 486, y: 600 };
const BOOK = { x0: 1022, x1: 1118, y: 826 };
const TOWN_BASE = 800;
const FS = { s: 1.22, ox: 860, oy: 878 };   // scale of the front props about the well's foot

function houses(x, R, a, b, base, hmin, hmax, wmin, wmax, wins, winSize, vellum) {
  let p = a;
  while (p < b) {
    const w = wmin + R() * (wmax - wmin), h = hmin + R() * (hmax - hmin), top = base - h;
    x.fillRect(p, top, w, h + 400);
    // parapet steps, sometimes a small dome
    if (R() < .5) x.fillRect(p + 4, top - 8, w - 8, 8);
    if (R() < .28) { x.beginPath(); x.arc(p + w / 2, top, Math.min(w * .32, 34), Math.PI, 0); x.fill(); x.fillRect(p + w / 2 - 1.5, top - Math.min(w * .32, 34) - 12, 3, 12); }
    // windows
    const n = 1 + (R() * (w > 110 ? 3 : 2) | 0), rows = h > 170 ? 2 : 1;
    for (let r = 0; r < rows; r++) for (let i = 0; i < n; i++) {
      if (R() < .2) continue;
      const ww = winSize * (.85 + R() * .3), wh = ww * 1.4, cx = p + w * (i + 1) / (n + 1), wy = top + 26 + r * (h * .42);
      if (wy + wh > base - 10) continue;
      wins.push({ cx, top: wy, w: ww, h: wh, seed: R() });
      cut(x, y => { y.beginPath(); archWin(y, cx, wy, ww, wh); y.fill(); });
      x.save(); x.fillStyle = vellum; x.beginPath(); archWin(x, cx, wy, ww, wh); x.fill(); x.restore();
    }
    p += w - 2 + (R() < .3 ? 10 + R() * 30 : 0);
  }
}

function build() {
  const st = { cool: { amb: .36, k: .55, col: '#8ea6ea' }, warm: { amb: .42, k: 1, col: '#ffbd70' } };
  const L = {}, win = { town: [], near: [], mad: [] };
  const sky = (top, mid, hor, stars) => layer({ z: Z.sky, sky: true, mx: 320, my: 200, states: { a: 1 }, draw(x, R) {
    const g = x.createLinearGradient(0, -200, 0, 760); g.addColorStop(0, top); g.addColorStop(.55, mid); g.addColorStop(1, hor);
    x.fillStyle = g; x.fillRect(-320, -200, W + 640, H + 400);
    if (stars) for (let i = 0; i < 260; i++) {
      const px = -320 + R() * (W + 640), py = -200 + R() * 820, r = .6 + R() * R() * 2.2;
      x.fillStyle = `rgba(255,246,220,${(.25 + R() * .6) * clamp(1 - py / 700)})`; x.beginPath(); x.arc(px, py, r, 0, TAU); x.fill();
    }
    const gr = x.createLinearGradient(0, 0, 0, 1); x.save(); x.globalAlpha = .45; x.globalCompositeOperation = 'overlay'; x.fillStyle = x.createPattern(GRAIN(), 'repeat'); x.fillRect(-320, -200, W + 640, H + 400); x.restore();
  } });
  L.skyC = sky('#060b22', '#14224a', '#2c4277', true);
  L.skyW = sky('#0d0f2a', '#3a2c4c', '#a86a4a', true);
  L.far = layer({ z: Z.far, col: '#5f7bb8', trans: .5, light: LIGHT, states: st, mx: 320, my: 200, blur: 1.2, shadow: { dy: 8, blur: 10, a: .4 }, seed: 5, draw(x, R) {
    x.beginPath(); x.moveTo(-320, 640);
    for (let u = -320; u <= W + 320; u += 40) x.lineTo(u, 600 - 50 * Math.sin(u * .0042 + 1) - 26 * Math.sin(u * .011) - (u > 1250 && u < 1700 ? 28 * Math.sin((u - 1250) / 450 * Math.PI) : 0));
    x.lineTo(W + 320, H + 200); x.lineTo(-320, H + 200); x.fill();
    // madrasa: a domed hall, two slim towers, an arcade of big arched windows (filled with shelves when lit)
    const m = MAD.x, b = MAD.base;
    x.fillRect(m - 170, b - 150, 340, 170);
    x.beginPath(); x.moveTo(m - 92, b - 150); x.bezierCurveTo(m - 96, b - 250, m - 30, b - 290, m, b - 300); x.bezierCurveTo(m + 30, b - 290, m + 96, b - 250, m + 92, b - 150); x.fill();
    x.fillRect(m - 2, b - 336, 4, 40); x.beginPath(); x.arc(m, b - 340, 7, 0, TAU); x.fill();
    x.fillRect(m - 104, b - 160, 208, 12);
    for (const s of [-1, 1]) { x.fillRect(m + s * 190 - 11, b - 260, 22, 280); x.fillRect(m + s * 190 - 16, b - 214, 32, 8); x.beginPath(); x.moveTo(m + s * 190 - 12, b - 260); x.lineTo(m + s * 190, b - 300); x.lineTo(m + s * 190 + 12, b - 260); x.fill(); }
    for (const dx of [-110, -37, 37, 110]) {
      const w = 50, t = b - 128, h = 104;
      win.mad.push({ cx: m + dx, top: t, w, h });
      cut(x, y => { y.beginPath(); archWin(y, m + dx, t, w, h); y.fill(); });
      x.save(); x.fillStyle = '#20305a'; x.beginPath(); archWin(x, m + dx, t, w, h); x.fill(); x.restore();
    }
  } });
  L.mid = layer({ z: Z.mid, col: '#3f5a92', trans: .45, light: LIGHT, states: st, mx: 380, my: 200, blur: .6, shadow: { dy: 10, blur: 12, a: .45 }, seed: 7, draw(x, R) {
    x.beginPath(); x.moveTo(-380, 700);
    for (let u = -380; u <= W + 380; u += 30) x.lineTo(u, 676 - 42 * Math.sin(u * .0031 + 2.2) - 18 * Math.sin(u * .013 + 1));
    x.lineTo(W + 380, H + 200); x.lineTo(-380, H + 200); x.fill();
    // date palms
    for (const [px, ph] of [[150, 150], [236, 120], [1660, 160], [1760, 130], [1980, 140]]) {
      const by = 676 - 42 * Math.sin(px * .0031 + 2.2) - 18 * Math.sin(px * .013 + 1);
      x.beginPath(); x.moveTo(px - 5, by + 6); x.quadraticCurveTo(px + 6, by - ph * .5, px + 2, by - ph); x.lineTo(px + 8, by - ph); x.quadraticCurveTo(px + 12, by - ph * .5, px + 5, by + 6); x.fill();
      for (let i = 0; i < 7; i++) {
        const a = -Math.PI / 2 + (i / 6 - .5) * 3.2, l = 46 + R() * 18, ex = px + 5 + Math.cos(a) * l, ey = by - ph + Math.sin(a) * l * .6 + 14;
        x.beginPath(); x.moveTo(px + 5, by - ph); x.quadraticCurveTo(px + 5 + Math.cos(a) * l * .5, by - ph + Math.sin(a) * l * .5 - 14, ex, ey);
        x.quadraticCurveTo(px + 5 + Math.cos(a) * l * .5, by - ph + Math.sin(a) * l * .5 - 4, px + 5, by - ph + 4); x.fill();
      }
    }
  } });
  L.town = layer({ z: Z.town, col: '#293b70', trans: .3, light: LIGHT, states: st, mx: 460, my: 200, shadow: { dy: 11, blur: 13, a: .5 }, seed: 13, draw(x, R) {
    houses(x, R, -460, W + 460, TOWN_BASE, 100, 220, 80, 160, win.town, 15, '#0d1534');
    // a minaret
    const mx = 610; x.fillRect(mx - 16, 380, 32, 430); x.fillRect(mx - 24, 456, 48, 10); x.fillRect(mx - 22, 372, 44, 10);
    x.beginPath(); x.moveTo(mx - 16, 372); x.lineTo(mx, 316); x.lineTo(mx + 16, 372); x.fill(); x.fillRect(mx - 1.5, 296, 3, 22);
    x.fillRect(-460, TOWN_BASE - 2, W + 920, 600);
  } });
  L.near = layer({ z: Z.near, col: '#16214a', trans: .15, light: LIGHT, states: st, mx: 560, my: 220, shadow: { dy: 13, blur: 15, a: .55 }, seed: 17, draw(x, R) {
    houses(x, R, -560, 640, 930, 270, 400, 150, 240, win.near, 28, '#070b20');
    houses(x, R, 1310, W + 560, 930, 270, 400, 150, 240, win.near, 28, '#070b20');
  } });
  L.front = layer({ z: Z.front, col: '#080c20', trans: .05, light: LIGHT, states: st, mx: 600, my: 240, shadow: { dy: 16, blur: 18, a: .6 }, seed: 23, draw(x, R) {
    // ground with low mounds
    x.beginPath(); x.moveTo(-600, 790);
    for (let u = -600; u <= W + 600; u += 30) x.lineTo(u, 866 - 70 * Math.exp(-(((u - 60) / 260) ** 2)) - 52 * Math.exp(-(((u - 1800) / 320) ** 2)) + 4 * Math.sin(u * .05));
    x.lineTo(W + 600, H + 240); x.lineTo(-600, H + 240); x.fill();
    for (let i = 0; i < 24; i++) { const u = -400 + R() * (W + 800), y = 866 - 70 * Math.exp(-(((u - 60) / 260) ** 2)) - 52 * Math.exp(-(((u - 1800) / 320) ** 2)); for (let k = 0; k < 4; k++) { x.beginPath(); x.moveTo(u + k * 4, y + 2); x.lineTo(u + k * 4 + (R() - .5) * 10, y - 12 - R() * 16); x.lineTo(u + k * 4 + 3, y + 2); x.fill(); } }
    // the well, jar, book and lantern are drawn a little larger than the ground they stand on
    x.save(); x.translate(FS.ox, FS.oy); x.scale(FS.s, FS.s); x.translate(-FS.ox, -FS.oy);
    // the well: stone ring, two posts, beam, pulley, rope and bucket
    const w = WELL.x;
    x.beginPath(); x.moveTo(w - 96, 872); x.lineTo(w - 90, WELL.top); x.lineTo(w + 90, WELL.top); x.lineTo(w + 96, 872); x.fill();
    x.fillRect(w - 100, WELL.top - 10, 200, 14);
    cut(x, y => { for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) y.fillRect(w - 88 + i * 30 + (r % 2) * 15, WELL.top + 14 + r * 30, 2, 26); for (let r = 1; r < 3; r++) y.fillRect(w - 88, WELL.top + 10 + r * 30, 176, 2); });
    x.fillRect(w - 80, 630, 12, WELL.top - 630); x.fillRect(w + 68, 630, 12, WELL.top - 630);
    x.beginPath(); x.moveTo(w - 100, 640); x.quadraticCurveTo(w, 610, w + 100, 640); x.lineTo(w + 100, 652); x.quadraticCurveTo(w, 622, w - 100, 652); x.fill();
    x.beginPath(); x.arc(w, 656, 13, 0, TAU); x.fill();
    x.fillRect(w - 1.2, 660, 2.4, 60);
    x.beginPath(); x.moveTo(w - 18, 718); x.lineTo(w + 18, 718); x.lineTo(w + 13, 746); x.lineTo(w - 13, 746); x.fill();
    // the empty jar, its lattice band cut through
    const j = JAR.x;
    x.beginPath(); x.moveTo(j - 22, 870); x.bezierCurveTo(j - 80, 840, j - 82, 740, j - 34, 716); x.lineTo(j - 22, 690); x.lineTo(j - 30, 680); x.lineTo(j + 30, 680); x.lineTo(j + 22, 690); x.lineTo(j + 34, 716); x.bezierCurveTo(j + 82, 740, j + 80, 840, j + 22, 870); x.fill();
    x.lineWidth = 7; x.beginPath(); x.moveTo(j - 30, 700); x.quadraticCurveTo(j - 76, 700, j - 58, 752); x.moveTo(j + 30, 700); x.quadraticCurveTo(j + 76, 700, j + 58, 752); x.stroke();
    cut(x, y => { for (let i = 0; i < 7; i++) { y.beginPath(); y.arc(j - 42 + i * 14, 768, 4, 0, TAU); y.fill(); } y.fillRect(j - 50, 784, 100, 2); });
    // a low stone and a closed book on it
    x.fillRect(BOOK.x0 - 16, 846, 128, 30);
    x.fillRect(BOOK.x0, BOOK.y, BOOK.x1 - BOOK.x0, 20);
    cut(x, y => { y.fillRect(BOOK.x0 + 4, BOOK.y + 9, BOOK.x1 - BOOK.x0 - 4, 2.4); });
    // lantern post with its hanging lantern
    const p = POST.x;
    x.fillRect(p - 8, 560, 16, 320); x.fillRect(p - 16, 860, 32, 16);
    x.fillRect(p - 8, 566, LANT.x - p + 10, 8); x.beginPath(); x.moveTo(p + 8, 610); x.lineTo(p + 60, 572); x.lineTo(p + 60, 580); x.lineTo(p + 8, 620); x.fill();
    x.fillRect(LANT.x - 1.5, 572, 3, 16);
    const lx = LANT.x, ly = LANT.y;
    x.beginPath(); x.moveTo(lx - 24, ly); x.lineTo(lx, ly - 16); x.lineTo(lx + 24, ly); x.fill();
    x.fillRect(lx - 28, ly, 56, 64); x.fillRect(lx - 22, ly + 64, 44, 8);
    cut(x, y => { for (const dx of [-17, 0, 17]) { y.beginPath(); archWin(y, lx + dx, ly + 8, 12, 48); y.fill(); } });
    x.save(); x.fillStyle = '#1a1424'; for (const dx of [-17, 0, 17]) { x.beginPath(); archWin(x, lx + dx, ly + 8, 12, 48); x.fill(); } x.restore();
    x.restore();
  } });
  // order the windows: distance from the centre street, plus a little jitter
  for (const k of ['town', 'near']) for (const w of win[k]) w.d = Math.abs(w.cx - CX) + w.seed * 60;
  // paper strips with dense text (the specialists' debates)
  const strips = [0, 1, 2, 3].map(i => {
    const R = mulberry(40 + i), w = 520 + R() * 90, h = 64, c = cv(w + 30, h + 30), x = c.getContext('2d'); x.translate(15, 15);
    x.fillStyle = '#b7aa8a'; x.beginPath(); x.moveTo(0, 0); for (let k = 1; k <= 20; k++) x.lineTo(w * k / 20, (R() - .5) * 2); x.lineTo(w, h); for (let k = 19; k >= 0; k--) x.lineTo(w * k / 20, h + (R() - .5) * 2); x.closePath(); x.fill();
    x.globalCompositeOperation = 'source-atop'; x.fillStyle = x.createPattern(GRAIN(), 'repeat'); x.fillRect(0, 0, w, h);
    x.fillStyle = 'rgba(30,24,20,.75)';
    for (let r = 0; r < 4; r++) { let u = 16; while (u < w - 20) { const l = 6 + R() * 26; x.fillRect(u, 12 + r * 12, l, 3); u += l + 4 + R() * 3; } }
    x.fillStyle = 'rgba(255,236,200,.25)'; x.fillRect(0, 0, w, 2);
    const s = cv(w + 30, h + 30), y = s.getContext('2d'); y.filter = 'blur(8px)'; y.fillStyle = 'rgba(0,0,0,.5)'; y.fillRect(20, 26, w, h);
    return { c, s, w, h };
  });
  const words = {
    und: cutStrip('UNDERSTAND', { size: 84, ls: 12, col: '#0c1330', seed: 3, h: 128 }),
    feel: cutStrip('FEEL', { size: 84, ls: 12, col: '#0c1330', seed: 4, h: 128 }),
    q: cutStrip('?', { size: 150, col: '#0c1330', seed: 5, h: 170, pad: 52, dy: 8 }),
    dots: cutStrip('', { size: 60, col: '#100c1c', seed: 6, h: 104, extra: 240, pad: 0, decor(g, w, h) { g.fillStyle = '#fff'; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(w / 2 - 54 + i * 54, h / 2, 9, 0, TAU); g.fill(); } } }),
  };
  return { L, win, strips, words, glow: new Glow() };
}

const camOf = T => {
  const k = track([
    [T.t0 - 1.4, [1.06, 0, -20]], [T.end(0), [1.03, -60, -10]], [T.at(1), [1.02, -110, 0]], [T.end(2), [1.0, 120, 10]],
    [T.end(3), [1.04, 30, -50]], [T.k(4, .7), [.88, 90, 140]], [T.end(5), [.95, -60, 90]], [T.end(6) + .4, [1.03, 0, 0]],
    [T.at(8) - .3, [1.02, 40, -20]], [T.end(9) - .2, [.84, 330, -70]], [T.at(10) + .3, [.85, 300, -60]], [T.k(11, .6), [.88, -330, 40]],
    [T.at(12) - .1, [1.0, -20, -10]], [T.t1 + 1.4, [1.03, 0, -20]],
  ]);
  return t => { const v = k(t); return { d: v[0], px: v[1], py: v[2] }; };
};

// a running channel of light: a soft band with a bright moving head
function stream(x, xa, xb, y, t, a) {
  if (Math.abs(xb - xa) < 1) return;
  const g = x.createLinearGradient(xa, 0, xb, 0);
  g.addColorStop(0, 'rgba(255,214,150,.9)'); g.addColorStop(.85, 'rgba(255,226,170,1)'); g.addColorStop(1, 'rgba(255,246,220,1)');
  x.globalAlpha = a; x.fillStyle = g; x.fillRect(Math.min(xa, xb), y - 3, Math.abs(xb - xa), 6);
  x.globalAlpha = a * .2; x.fillRect(Math.min(xa, xb), y - 7, Math.abs(xb - xa), 14);
  const h = x.createRadialGradient(xb, y, 0, xb, y, 22); h.addColorStop(0, 'rgba(255,248,226,1)'); h.addColorStop(1, 'rgba(255,200,120,0)');
  x.globalAlpha = a; x.fillStyle = h; x.fillRect(xb - 22, y - 22, 44, 44);
}

let camF = null, camT = null;
export default {
  style: 'lightbox',
  page: 'pp. 1–2',
  render(ctx, t, T) {
    const S = scene('s03', build), L = S.L, G = S.glow;
    if (camT !== T) { camF = camOf(T); camT = T; }
    const cam = drift(camF(t), t);
    // warmth of the whole ladder: cool night → warm as the windows light
    const warm = .78 * eio(seg(t, T.k(5, .5), T.end(6))) + .22 * eio(seg(t, T.at(10), T.end(11)));
    const ember = .14 * eio(seg(t, T.word(1, 0), T.word(1, 4) + 1));
    const lantern = eio(seg(t, T.word(5, 4) - .3, T.word(5, 4) + .5));
    const chanF = eio(seg(t, T.word(5, 5) - .1, T.end(5) - .2));        // lantern → well
    const wellOn = eio(seg(t, T.end(5) - .5, T.end(5) + .4));
    const reach = 1500 * eio(seg(t, T.at(6) + .1, T.word(6, 14)));        // along the town, out from the centre street
    const bookOn = eio(seg(t, T.word(6, 16) - .25, T.word(6, 16) + .4));
    const madG = .55 + .4 * eio(seg(t, T.at(8) - .3, T.at(8) + .8)) - .15 * eio(seg(t, T.at(10), T.end(10)));
    const farLamps = eio(seg(t, T.at(3), T.end(3))) * (1 - .4 * eio(seg(t, T.at(4), T.end(4)))) * (1 - .5 * warm);

    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#04060f'; ctx.fillRect(0, 0, W, H);
    G.begin();
    const blend = bl('cool', 'warm', warm);
    // sky
    let p = drawLayer(ctx, L.skyC, cam, [['a', 1]]);
    if (warm > .002) drawLayer(ctx, L.skyW, cam, [['a', 1]], warm);
    // far hills + madrasa (lit from the start)
    p = drawLayer(ctx, L.far, cam, blend);
    G.at(ctx, p, x => {
      for (const w of S.win.mad) { x.fillStyle = '#ffc070'; x.globalAlpha = madG * flick(t, w.cx); x.beginPath(); archWin(x, w.cx, w.top, w.w, w.h); x.fill(); }
    }, .8);
    ctx.save(); ctx.fillStyle = 'rgba(30,24,40,.85)';
    for (const w of S.win.mad) { for (let k = 1; k < 5; k++) ctx.fillRect(w.cx - w.w / 2, w.top + 18 + k * 18, w.w, 3); for (let k = 0; k < 9; k++) ctx.fillRect(w.cx - w.w / 2 + 4 + k * 5.4, w.top + 26 + (k % 4) * 18, 1.3, 13); }
    ctx.restore();
    // mid hills + a few far lamps (the translators' work)
    p = drawLayer(ctx, L.mid, cam, blend);
    if (farLamps > 0) G.at(ctx, p, x => {
      [[180, 628], [420, 660], [760, 652], [1180, 636], [1360, 646], [1720, 610]].forEach(([u, v], i) => {
        const a = farLamps * clamp((t - T.at(3) - i * .22) / .5) * flick(t, i);
        x.globalAlpha = a; const g = x.createRadialGradient(u, v, 0, u, v, 9); g.addColorStop(0, '#fff0c8'); g.addColorStop(.4, 'rgba(255,190,110,.8)'); g.addColorStop(1, 'rgba(255,170,90,0)');
        x.fillStyle = g; x.fillRect(u - 10, v - 10, 20, 20);
      });
    }, 1);
    const winLight = (x, w, sc) => {
      const on = clamp((reach - w.d) / 160), a = Math.max(ember * (.7 + .6 * w.seed), on) * flick(t, w.seed * 9);
      if (a <= .01) return;
      x.globalAlpha = a; x.fillStyle = on > .5 ? '#ffb45e' : '#d0884a'; x.beginPath(); archWin(x, w.cx, w.top, w.w, w.h); x.fill();
      if (on > 0) { x.globalAlpha = on * .6; x.fillStyle = '#ffe6b8'; x.fillRect(w.cx - w.w * .22, w.top + w.h * .35, w.w * .44, w.h * .45); }
    };
    // town
    p = drawLayer(ctx, L.town, cam, blend);
    G.at(ctx, p, x => {
      for (const w of S.win.town) winLight(x, w);
      if (reach > 0) {   // the channel runs out along the street foot, both ways from the centre
        const r = Math.min(reach, 1500);
        stream(x, CX, CX - r, TOWN_BASE - 3, t, .8); stream(x, CX, CX + r, TOWN_BASE - 3, t, .8);
      }
    }, 1);
    // near houses
    p = drawLayer(ctx, L.near, cam, blend);
    G.at(ctx, p, x => { for (const w of S.win.near) winLight(x, w); }, 1);
    // front: ground, well, jar, book, lantern
    p = drawLayer(ctx, L.front, cam, blend);
    G.at(ctx, p, x => {
      x.save(); x.translate(FS.ox, FS.oy); x.scale(FS.s, FS.s); x.translate(-FS.ox, -FS.oy);
      if (lantern > 0) {
        const f = lantern * flick(t, 3), lx = LANT.x, ly = LANT.y;
        x.globalAlpha = f; x.fillStyle = '#ffc06a'; for (const dx of [-17, 0, 17]) { x.beginPath(); archWin(x, lx + dx, ly + 8, 12, 48); x.fill(); }
        x.globalAlpha = f * .9; x.fillStyle = '#fff0c8'; x.beginPath(); archWin(x, lx, ly + 22, 6, 26); x.fill();
        // its pool of light on the ground
        const g = x.createRadialGradient(lx, 878, 0, lx, 878, 110); g.addColorStop(0, 'rgba(255,200,120,.55)'); g.addColorStop(1, 'rgba(255,170,90,0)');
        x.globalAlpha = f; x.fillStyle = g; x.beginPath(); x.ellipse(lx, 878, 110, 16, 0, 0, TAU); x.fill();
      }
      if (chanF > 0) {   // a channel of light from the lantern's pool along the ground into the well
        const x0 = LANT.x, x1 = WELL.x - 92, xe = x0 + (x1 - x0) * chanF;
        stream(x, x0, xe, 879, t, 1);
      }
      if (wellOn > 0) {   // the well brims with light
        const g = x.createRadialGradient(WELL.x, WELL.top - 4, 0, WELL.x, WELL.top - 4, 104);
        g.addColorStop(0, 'rgba(255,240,200,1)'); g.addColorStop(.4, 'rgba(255,200,120,.55)'); g.addColorStop(1, 'rgba(255,170,90,0)');
        x.globalAlpha = .42 * wellOn * flick(t, 5); x.fillStyle = g; x.beginPath(); x.ellipse(WELL.x, WELL.top - 6, 104, 26, 0, 0, TAU); x.fill();
        x.globalAlpha = wellOn; x.fillStyle = '#ffe7b4'; x.beginPath(); x.ellipse(WELL.x, WELL.top - 3, 84, 5, 0, 0, TAU); x.fill();
      }
      if (bookOn > 0) { x.globalAlpha = bookOn; x.fillStyle = '#ffd9a0'; x.fillRect(BOOK.x0 + 4, BOOK.y + 9, BOOK.x1 - BOOK.x0 - 4, 2.4); x.globalAlpha = bookOn * .7; x.fillRect(BOOK.x0, BOOK.y - 1.5, BOOK.x1 - BOOK.x0, 2); }
      x.restore();
    }, 1);
    this.paperWords(ctx, t, T, S, cam, G);
    G.end(ctx, .9);
    vignette(ctx);
  },
  // strips, cut words, "?" and the open "…" (in front of the town, high in the sky)
  paperWords(ctx, t, T, S, cam, G) {
    const p = proj(cam, Z.words); setT(ctx, p);
    // the debates: strips appear, then slide out of the box on "left out"
    const a12 = T.at(12), out = T.word(12, 2);
    if (t > a12 - .3 && t < T.end(12) + .4) S.strips.forEach((s, i) => {
      const k = eo(seg(t, a12 - .25 + i * .12, a12 + .2 + i * .12)), o = ei(seg(t, out - .1 + i * .1, out + 1.1 + i * .1));
      if (k <= 0) return;
      const dir = i % 2 ? 1 : -1, x0 = 960 - s.w / 2 + (i - 1.5) * 40 + dir * o * 1500, y0 = 150 + i * 80;
      ctx.save(); ctx.translate(x0, y0); ctx.rotate((i - 1.5) * .012);
      ctx.beginPath(); ctx.rect(-20, -20, s.w * k + 20, s.h + 60); ctx.clip();
      ctx.drawImage(s.s, -15, -15); ctx.drawImage(s.c, -15, -15); ctx.restore();
    });
    const Wd = S.words;
    const und = eo(seg(t, T.word(14, 2) - .35, T.word(14, 2) + .35)), feel = eo(seg(t, T.word(15, 3) - .35, T.word(15, 3) + .25));
    const away = ei(seg(t, T.at(16) - .7, T.at(16) - .05)) * 520;
    const warmGlow = '#ffcf86';
    if (und > 0 && away < 520) this.strip(ctx, G, p, Wd.und, 250, 120 - away, und, warmGlow, .95);
    if (feel > 0 && away < 520) this.strip(ctx, G, p, Wd.feel, 960, 250 - away, feel, warmGlow, .95);
    const q = eo(seg(t, T.word(16, 2) - .4, T.word(16, 2) + .2)), ans = eio(seg(t, T.word(16, 6) - .2, T.word(16, 6) + .6));
    const qAway = ei(seg(t, T.at(17) - .2, T.at(17) + .45)) * 520;
    if (q > 0 && qAway < 520) {
      const col = ans < .5 ? '#cfe0ff' : '#ffd394';
      this.strip(ctx, G, p, Wd.q, 960 - Wd.q.w / 2, 170 - qAway, q, col, .9);
      if (ans > 0) G.at(ctx, p, x => {   // a small answering glow beneath the question
        const u = 960 + 6, v = 170 - qAway + Wd.q.h + 34, g = x.createRadialGradient(u, v, 0, u, v, 30);
        g.addColorStop(0, '#fff3d4'); g.addColorStop(.35, 'rgba(255,196,110,.85)'); g.addColorStop(1, 'rgba(255,170,90,0)');
        x.globalAlpha = ans * flick(t, 8); x.fillStyle = g; x.fillRect(u - 32, v - 32, 64, 64);
      }, 1);
    }
    const dots = eo(seg(t, T.word(17, 12) - .3, T.word(17, 12) + .45));
    if (dots > 0) {
      const d = Wd.dots, x0 = 960 - d.w / 2, y0 = 190;
      this.strip(ctx, G, p, d, x0, y0, dots, '#ffcf86', .9);
      const sl = eio(seg(t, T.word(18, 4) - .2, T.word(18, 4) + .1)), sp = 1 + 1.2 * (1 - sl);
      if (sl > 0) {   // the small seal, stamped
        ctx.save(); ctx.translate(x0 + d.w - 6, y0 + d.h - 8); ctx.rotate(.06); ctx.scale(sp, sp); ctx.globalAlpha = sl;
        ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(-24, -18, 58, 58);
        ctx.fillStyle = '#b3302a'; ctx.fillRect(-29, -29, 58, 58);
        ctx.strokeStyle = '#f0d6b0'; ctx.lineWidth = 3; ctx.strokeRect(-20, -20, 40, 40);
        ctx.beginPath(); ctx.moveTo(-10, -9); ctx.lineTo(10, -9); ctx.moveTo(0, -9); ctx.lineTo(0, 11); ctx.moveTo(-10, 11); ctx.lineTo(10, 11); ctx.stroke();
        ctx.restore(); setT(ctx, p);
      }
    }
  },
  strip(ctx, G, p, st, x0, y0, k, col, ga) {
    drawStrip(ctx, st, x0, y0, k, col, ga);
    G.at(ctx, p, x => { if (x === ctx) return; x.save(); x.beginPath(); x.rect(x0, y0 - 20, st.w * k, st.h + 40); x.clip(); x.globalAlpha = .7; x.drawImage(st.G, x0 - 20, y0 - 20); x.restore(); }, 1);
  },
  texts(t, T) {
    const out = [], S = scene('s03', build), cam = drift(camOf(T)(t), t), p = proj(cam, Z.words), Wd = S.words;
    const box = (id, text, st, x0, y0) => out.push({ id, text, x0: p.ox + x0 * p.k, y0: p.oy + y0 * p.k, x1: p.ox + (x0 + st.w) * p.k, y1: p.oy + (y0 + st.h) * p.k });
    const away = ei(seg(t, T.at(16) - .7, T.at(16) - .05)) * 520;
    if (t >= T.word(14, 2) + .35 && away < 1) box('und', 'UNDERSTAND', Wd.und, 250, 120);
    if (t >= T.word(15, 3) + .25 && away < 1) box('feel', 'FEEL', Wd.feel, 960, 250);
    if (t >= T.word(16, 2) + .2 && t < T.at(17) - .2) box('q', '?', Wd.q, 960 - Wd.q.w / 2, 170);
    if (t >= T.word(17, 12) + .45) box('dots', '…', Wd.dots, 960 - Wd.dots.w / 2, 190);
    return out;
  },
  events(T) {
    return [
      { t: T.word(1, 0), type: 'light', soft: true },
      { t: T.at(3), type: 'light', soft: true },
      { t: T.word(5, 4) - .3, type: 'light' },
      { t: T.word(5, 5) - .1, type: 'shimmer' },
      { t: T.at(6) + .1, type: 'shimmer' },
      { t: T.word(6, 16) - .25, type: 'light', soft: true },
      { t: T.at(12) - .25, type: 'paper' },
      { t: T.word(12, 2) - .1, type: 'paper', dir: 'out' },
      { t: T.word(14, 2) - .35, type: 'paper' },
      { t: T.word(15, 3) - .35, type: 'paper' },
      { t: T.word(16, 2) - .4, type: 'paper' },
      { t: T.word(16, 6) - .2, type: 'light', soft: true },
      { t: T.word(17, 12) - .3, type: 'paper' },
      { t: T.word(18, 4) - .1, type: 'stamp' },
    ];
  },
};
