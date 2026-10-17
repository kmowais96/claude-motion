// Section 14 · Your turn — paper-cut lightbox, the film's ending.
// The cell rebuilt in paper (brick wall with light through the mortar, a barred window, a desk); one small lamp lights.
// The camera pulls back out through the cell's window: it is one lit window in a prison wall, among town after town
// whose windows light up. A book rises in the front layer; four strips write themselves; the cover opens and light
// bursts out; the end strip holds while the world dims and the book's light is the last thing left.
import { W, H, CX, CY, layer, drawLayer, bl, Glow, vignette, flick, scene, cut, archWin, drift, cv, proj, setT, cutStrip, drawStrip, GRAIN, VIEW } from '../lib/paper-lantern/box.js';
import { seg, eio, eo, ei, clamp, track, mulberry, TAU } from '/core/lib.js';

// —— inside the cell ——
const IZ = { sky: .6, wall: .34, desk: .15, front: 0 };
const ILIGHT = { x: 810, y: 590, r: 620 };
const IWIN = { x0: 1236, x1: 1436, top: 150, bot: 318 };
const LAMP = { x: 780, y: 640 };   // lamp foot on the desk top
// —— outside ——
const OZ = { sky: .9, far: .62, mid: .45, near: .3, prison: .14, front: 0, paper: .04 };
const OLIGHT = { x: 960, y: 520, r: 900 };
const CELL = { x0: 864, y0: 466, w: 192, h: 108 };      // the cell's window in the prison wall (16:9, the interior is drawn into it)
const BOOK = { x: 860, w: 200, top: 628, bot: 884 };    // spine at x, closed cover spans x..x+w
const LEDGE = 884;

function houses(x, R, a, b, base, hmin, hmax, wmin, wmax, wins, ws, vellum, skip) {
  let p = a;
  while (p < b) {
    const w = wmin + R() * (wmax - wmin), h = hmin + R() * (hmax - hmin), top = base - h;
    if (skip && p + w > skip[0] && p < skip[1]) { p = skip[1]; continue; }
    x.fillRect(p, top, w, h + 400);
    if (R() < .3) { const r = Math.min(w * .3, 30); x.beginPath(); x.arc(p + w / 2, top, r, Math.PI, 0); x.fill(); }
    else if (R() < .5) { x.beginPath(); x.moveTo(p - 4, top); x.lineTo(p + w / 2, top - w * .3); x.lineTo(p + w + 4, top); x.fill(); }
    const n = 1 + (R() * (w > 90 ? 3 : 2) | 0), rows = h > 150 ? 2 : 1;
    for (let r = 0; r < rows; r++) for (let i = 0; i < n; i++) {
      if (R() < .15) continue;
      const ww = ws * (.85 + R() * .3), wh = ww * 1.35, cx = p + w * (i + 1) / (n + 1), wy = top + ws * 1.4 + r * h * .42;
      if (wy + wh > base - 6) continue;
      wins.push({ cx, top: wy, w: ww, h: wh, seed: R() });
      cut(x, y => { y.beginPath(); archWin(y, cx, wy, ww, wh); y.fill(); });
      x.save(); x.fillStyle = vellum; x.beginPath(); archWin(x, cx, wy, ww, wh); x.fill(); x.restore();
    }
    p += w - 2 + (R() < .35 ? 8 + R() * 40 : 0);
  }
}

function build() {
  // inside: moonlight (off) → the lamp (on)
  const ist = { off: { amb: .26, k: .3, col: '#7c90c8' }, on: { amb: .4, k: 1, col: '#ffbf70' } };
  const I = {};
  I.sky = layer({ z: IZ.sky, sky: true, mx: 200, my: 140, states: { a: 1 }, draw(x, R) {
    const g = x.createLinearGradient(0, 80, 0, 360); g.addColorStop(0, '#0a1230'); g.addColorStop(1, '#22346a');
    x.fillStyle = g; x.fillRect(-200, -140, W + 400, H + 280);
    for (let i = 0; i < 90; i++) { const u = 1000 + R() * 700, v = 60 + R() * 320; x.fillStyle = `rgba(255,246,220,${.3 + R() * .6})`; x.beginPath(); x.arc(u, v, .7 + R() * 1.6, 0, TAU); x.fill(); }
  } });
  I.wall = layer({ z: IZ.wall, col: '#a66d3e', trans: .62, light: ILIGHT, states: ist, mx: 200, my: 140, shadow: { dy: 10, blur: 12, a: .45 }, seed: 2, draw(x, R) {
    x.fillRect(-200, -140, W + 400, H + 280);
    cut(x, y => {
      for (let r = 0, v = -130; v < H + 140; r++, v += 44) {
        y.fillRect(-200, v, W + 400, 3);
        for (let u = -200 + (r % 2) * 50 + (R() * 10 | 0); u < W + 200; u += 100) y.fillRect(u, v, 3, 44);
      }
      y.beginPath(); archWin(y, (IWIN.x0 + IWIN.x1) / 2, IWIN.top, IWIN.x1 - IWIN.x0, IWIN.bot - IWIN.top); y.fill();
    });
    for (let i = 1; i < 5; i++) x.fillRect(IWIN.x0 + i * (IWIN.x1 - IWIN.x0) / 5 - 6, IWIN.top - 10, 12, IWIN.bot - IWIN.top + 14);
    x.fillRect(IWIN.x0 - 6, IWIN.top + 92, IWIN.x1 - IWIN.x0 + 12, 10);
    x.fillRect(IWIN.x0 - 20, IWIN.bot, IWIN.x1 - IWIN.x0 + 40, 16);
  } });
  I.desk = layer({ z: IZ.desk, col: '#5a2a12', trans: .22, light: ILIGHT, states: ist, mx: 180, my: 120, shadow: { dy: 14, blur: 16, a: .55 }, seed: 4, draw(x, R) {
    // low writing desk
    x.fillRect(520, 652, 880, 26); x.fillRect(540, 678, 24, 150); x.fillRect(1356, 678, 24, 150); x.fillRect(560, 690, 800, 12);
    // stack of written sheets, a single sheet, inkpot and reed pen
    for (let i = 0; i < 9; i++) x.fillRect(930 + (R() - .5) * 8, 646 - i * 5.2, 250, 4.4);
    x.save(); x.translate(1110, 642); x.rotate(-.04); x.fillRect(0, -2, 170, 4); x.restore();
    x.beginPath(); x.ellipse(1260, 632, 22, 20, 0, 0, TAU); x.fill(); x.fillRect(1248, 604, 24, 12);
    x.save(); x.translate(1236, 600); x.rotate(-.9); x.fillRect(-2, -80, 4, 92); x.restore();
    // the clay lamp
    const l = LAMP;
    x.beginPath(); x.ellipse(l.x, l.y - 18, 46, 18, 0, 0, TAU); x.fill();
    x.beginPath(); x.moveTo(l.x + 30, l.y - 26); x.quadraticCurveTo(l.x + 64, l.y - 30, l.x + 70, l.y - 42); x.lineTo(l.x + 58, l.y - 40); x.quadraticCurveTo(l.x + 48, l.y - 28, l.x + 22, l.y - 26); x.fill();
    x.fillRect(l.x - 22, l.y - 6, 44, 8);
    x.lineWidth = 7; x.strokeStyle = '#5a2a12'; x.beginPath(); x.arc(l.x - 46, l.y - 22, 12, Math.PI * .5, Math.PI * 1.6); x.stroke();
  } });
  I.front = layer({ z: IZ.front, col: '#170904', trans: .05, light: ILIGHT, states: ist, mx: 160, my: 110, shadow: { dy: 16, blur: 20, a: .6 }, seed: 6, draw(x, R) {
    // stone arch of the cell, floor
    x.fillRect(-160, -110, W + 320, H + 220);
    cut(x, y => { y.beginPath(); y.moveTo(110, 900); y.lineTo(110, 240); y.quadraticCurveTo(120, 50, 960, 44); y.quadraticCurveTo(1800, 50, 1810, 240); y.lineTo(1810, 900); y.closePath(); y.fill(); });
    x.beginPath(); x.moveTo(-160, 880); x.lineTo(W + 160, 872); x.lineTo(W + 160, H + 110); x.lineTo(-160, H + 110); x.fill();
    cut(x, y => { for (let i = 0; i < 9; i++) { const v = 120 + i * 92; y.fillRect(96, v, 16, 2.5); y.fillRect(W - 112, v + 40, 16, 2.5); } });
  } });

  // outside: violet night (night) → dawn-warm (warm)
  const ost = { night: { amb: .34, k: .6, col: '#a39ae6' }, warm: { amb: .42, k: 1, col: '#ffbd72' } };
  const O = {}, win = { far: [], mid: [], near: [] };
  const sky = (top, mid, hor) => layer({ z: OZ.sky, sky: true, mx: 260, my: 160, states: { a: 1 }, draw(x, R) {
    const g = x.createLinearGradient(0, -160, 0, 700); g.addColorStop(0, top); g.addColorStop(.6, mid); g.addColorStop(1, hor);
    x.fillStyle = g; x.fillRect(-260, -160, W + 520, H + 320);
    for (let i = 0; i < 240; i++) { const u = -260 + R() * (W + 520), v = -160 + R() * 760; x.fillStyle = `rgba(255,246,220,${(.2 + R() * .6) * clamp(1 - v / 640)})`; x.beginPath(); x.arc(u, v, .6 + R() * R() * 2, 0, TAU); x.fill(); }
    x.save(); x.globalAlpha = .45; x.globalCompositeOperation = 'overlay'; x.fillStyle = x.createPattern(GRAIN(), 'repeat'); x.fillRect(-260, -160, W + 520, H + 320); x.restore();
  } });
  O.skyN = sky('#07061a', '#1b1740', '#3a3270');
  O.skyW = sky('#120c26', '#4a2c4e', '#d08856');
  const hillsAnd = (base, amp, f, ph, pad) => x => { x.beginPath(); x.moveTo(-pad, H + 300); for (let u = -pad; u <= W + pad; u += 30) x.lineTo(u, base - amp * Math.sin(u * f + ph) - amp * .4 * Math.sin(u * f * 3.1 + ph)); x.lineTo(W + pad, H + 300); x.fill(); };
  O.far = layer({ z: OZ.far, col: '#7b6fb6', trans: .7, light: OLIGHT, states: ost, mx: 300, my: 180, blur: 1, shadow: { dy: 8, blur: 10, a: .4 }, seed: 8, draw(x, R) {
    hillsAnd(560, 30, .004, 1, 300)(x);
    houses(x, R, -300, W + 300, 570, 40, 90, 34, 70, win.far, 7, '#2a2350');
  } });
  O.mid = layer({ z: OZ.mid, col: '#52478f', trans: .45, light: OLIGHT, states: ost, mx: 360, my: 200, blur: .5, shadow: { dy: 10, blur: 12, a: .45 }, seed: 9, draw(x, R) {
    hillsAnd(650, 24, .005, 2, 360)(x);
    houses(x, R, -360, W + 360, 660, 70, 150, 60, 110, win.mid, 11, '#1c1840');
  } });
  O.near = layer({ z: OZ.near, col: '#312a68', trans: .25, light: OLIGHT, states: ost, mx: 420, my: 220, shadow: { dy: 12, blur: 14, a: .5 }, seed: 10, draw(x, R) {
    x.fillRect(-420, 760, W + 840, 600);
    houses(x, R, -420, W + 420, 770, 120, 260, 100, 170, win.near, 17, '#120f2c', [560, 1360]);
  } });
  O.prison = layer({ z: OZ.prison, col: '#1d173d', trans: .1, light: OLIGHT, states: ost, mx: 460, my: 240, shadow: { dy: 14, blur: 16, a: .55 }, seed: 12, draw(x, R) {
    // a long wall with crenellations and two towers; the cell's window sits in its middle
    x.fillRect(620, 400, 680, 700);
    for (let u = 620; u < 1300; u += 40) x.fillRect(u, 384, 22, 18);
    for (const c of [640, 1280]) {
      x.fillRect(c - 56, 330, 112, 760);
      for (let u = c - 60; u < c + 60; u += 30) x.fillRect(u, 314, 18, 18);
      cut(x, y => { y.fillRect(c - 3, 400, 6, 34); y.fillRect(c - 3, 520, 6, 34); });
    }
    cut(x, y => { for (let r = 0; r < 12; r++) for (let u = 700 + (r % 2) * 40; u < 1240; u += 80) if (Math.abs(u - 960) > 140 || r < 1 || r > 5) y.fillRect(u, 430 + r * 40, 2, 38); for (let r = 0; r < 12; r++) y.fillRect(700, 468 + r * 40, 540, 1.6); });
    x.fillRect(CELL.x0 - 14, CELL.y0 + CELL.h, CELL.w + 28, 12);
  } });
  O.front = layer({ z: OZ.front, col: '#0b0918', trans: .05, light: OLIGHT, states: ost, mx: 200, my: 140, shadow: { dy: 16, blur: 18, a: .6 }, seed: 14, draw(x, R) {
    x.beginPath(); x.moveTo(-200, LEDGE + 6);
    for (let u = -200; u <= W + 200; u += 40) x.lineTo(u, LEDGE + 2 - 60 * Math.exp(-(((u + 40) / 300) ** 2)) - 50 * Math.exp(-(((u - 1960) / 300) ** 2)) + 3 * Math.sin(u * .07));
    x.lineTo(W + 200, H + 140); x.lineTo(-200, H + 140); x.fill();
    for (let i = 0; i < 30; i++) { const u = -150 + R() * (W + 300), v = LEDGE - 60 * Math.exp(-(((u + 40) / 300) ** 2)) - 50 * Math.exp(-(((u - 1960) / 300) ** 2)); for (let k = 0; k < 4; k++) { x.beginPath(); x.moveTo(u + k * 4, v + 4); x.lineTo(u + k * 4 + (R() - .5) * 10, v - 10 - R() * 18); x.lineTo(u + k * 4 + 3, v + 4); x.fill(); } }
  } });
  for (const k in win) for (const w of win[k]) w.d = Math.abs(w.cx - CX) / 1100 + w.seed * .25 + { near: 0, mid: .15, far: .3 }[k];

  // the book: cover (with تفهيم القرآن cut through), endpaper (inside of the cover), page block
  const bw = BOOK.w, bh = BOOK.bot - BOOK.top;
  const mk = (w, h, f) => { const c = cv(w + 2, h + 2), x = c.getContext('2d'); x.translate(1, 1); f(x); return c; };
  const grain = (x, w, h, a) => { x.save(); x.globalCompositeOperation = 'source-atop'; x.globalAlpha = a; x.fillStyle = x.createPattern(GRAIN(), 'repeat'); x.fillRect(0, 0, w, h); x.restore(); };
  const coverG = mk(bw, bh, x => {   // light that shows through the cover's cuts
    x.fillStyle = '#fff'; x.strokeStyle = '#fff'; x.lineWidth = 2.2;
    x.strokeRect(14, 14, bw - 28, bh - 28);
    x.direction = 'rtl'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = '700 50px "Amiri"'; x.fillText('تفهيم', bw / 2, bh * .36);
    x.font = '700 44px "Amiri"'; x.fillText('القرآن', bw / 2, bh * .58);
    x.direction = 'ltr';
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; x.beginPath(); x.arc(bw / 2 + Math.cos(a) * 16, bh * .82 + Math.sin(a) * 16, 2.4, 0, TAU); x.fill(); }
  });
  const cover = mk(bw, bh, x => {
    x.fillStyle = '#24110a'; x.fillRect(0, 0, bw, bh); grain(x, bw, bh, .9);
    x.fillStyle = 'rgba(255,236,200,.25)'; x.fillRect(0, 0, bw, 2.5); x.fillStyle = 'rgba(0,0,0,.4)'; x.fillRect(0, bh - 3, bw, 3);
    x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(0, 0, 7, bh);
    x.globalCompositeOperation = 'destination-out'; x.drawImage(coverG, -1, -1);
  });
  const endp = mk(bw, bh, x => { x.fillStyle = '#d4b47a'; x.fillRect(0, 0, bw, bh); grain(x, bw, bh, .9); x.strokeStyle = 'rgba(120,70,30,.5)'; x.lineWidth = 1.5; x.strokeRect(12, 12, bw - 24, bh - 24); x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(bw - 8, 0, 8, bh); });
  const pages = mk(bw, bh, x => {
    x.fillStyle = '#e8cf98'; x.fillRect(0, 0, bw, bh); grain(x, bw, bh, .7);
    x.fillStyle = 'rgba(110,60,25,.45)';
    const R = mulberry(77);
    for (let r = 0; r < 11; r++) { let u = bw - 22; while (u > 26) { const l = 8 + R() * 22; x.fillRect(u - l, 30 + r * 18, l, 2.2); u -= l + 5; } }
    x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(0, 0, 10, bh);
  });
  const sh = mk(bw + 60, bh + 60, x => { x.filter = 'blur(10px)'; x.fillStyle = 'rgba(0,0,0,.6)'; x.fillRect(36, 44, bw, bh); });
  const strips = ['Read the setting.', 'Learn the words.', 'Hear it whole.', 'Then go deep.'].map((s, i) => ({ s, st: cutStrip(s, { size: 54, weight: 'italic 500', col: '#120c22', seed: 20 + i, h: 92, pad: 34 }) }));
  const endStrip = cutStrip('TAFHIM AL-QUR’AN · SAYYID ABUL A’LA MAWDUDI', { size: 38, weight: 600, ls: 5, col: '#130a06', seed: 31, h: 100, pad: 56 });
  return { I, O, win, book: { cover, coverG, endp, pages, sh }, strips, endStrip, glow: new Glow(), gIn: new Glow(), IC: cv(W, H), ICh: cv(W / 2, H / 2) };
}

// strip layout (paper plane, design px)
const SPOS = [[230, 110], [1010, 196], [300, 292], [1090, 378]];
const END = { y: 128 };

function timeline(T) {
  return {
    lampOn: t => eio(seg(t, T.word(1, 2) - .3, T.word(1, 2) + .5)),
    pull: t => eio(seg(t, T.at(2) - .15, T.end(2) + .9)),           // 0 inside the cell → 1 the whole land
    winOn: t => eio(seg(t, T.at(2) + .3, T.at(3) + .4)),
    rise: t => eo(seg(t, T.at(3) - .25, T.word(3, 3) + .2)),
    strip: (t, i) => eo(seg(t, T.at(4 + i) - .2, T.at(4 + i) + .45)),
    stripsAway: t => ei(seg(t, T.at(8) + .3, T.at(8) + .9)),
    open: t => eio(seg(t, T.word(8, 0) + .05, T.word(8, 1) + .55)),    // "Open Tafhim…"
    burst: t => eio(seg(t, T.word(8, 1) - .1, T.end(8) + .2)),
    oneLine: t => eio(seg(t, T.word(9, 3) - .3, T.word(9, 3) + .5)),
    end: t => eo(seg(t, T.at(10) + .15, T.at(10) + .85)),
    dim: t => eio(seg(t, T.t1 + 1.8, T.t1 + 4.05)),
  };
}

let TL = null, TLT = null, CAMF = null;
export default {
  style: 'lightbox',
  page: 'p. 9',
  noCaption: [4, 5, 6, 7],
  render(ctx, t, T) {
    const S = scene('s14', build);
    if (TLT !== T) { TL = timeline(T); TLT = T; CAMF = camOf(T, TL); }
    const pull = TL.pull(t);
    const cam = drift(CAMF(t), t, 1.2);
    const pw = proj(cam, OZ.prison);
    const winScreenW = pw ? CELL.w * pw.k : 1e9;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (winScreenW >= W - 1 && pull < .02) {   // fully inside the cell
      this.interior(ctx, t, T, S, 1);
      vignette(ctx);
      return;
    }
    // render the interior small, to be placed in the cell's window
    const half = winScreenW < W * .5;
    let IC;
    if (winScreenW < 520) {   // small: a cached snapshot of the lit cell (built at a fixed time, so deterministic)
      if (!S.snap || S.snapT !== T) { S.snap = cv(W / 2, H / 2); VIEW.s = .5; this.interior(S.snap.getContext('2d'), T.end(2) + 1, T, S, .5); VIEW.s = 1; S.snapT = T; }
      IC = S.snap;
    } else {
      IC = half ? S.ICh : S.IC; const ic = IC.getContext('2d');
      VIEW.s = half ? .5 : 1; this.interior(ic, t, T, S, VIEW.s); VIEW.s = 1;
    }
    this.exterior(ctx, t, T, S, cam, IC, pull);
    vignette(ctx);
  },
  interior(ctx, t, T, S, s) {
    const I = S.I, G = S.gIn, lamp = TL.lampOn(t);
    const icam = drift({ d: 1.05 - .07 * eio(seg(t, T.t0 - 1.3, T.at(2) + .6)), px: -20, py: -10 }, t, 1);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#070302'; ctx.fillRect(0, 0, W * s, H * s);
    G.begin();
    const order = [['sky', null], ['wall', 0], ['desk', 1], ['front', 2]];
    for (const [n, i] of order) {
      const f = i === null ? 1 : clamp(eio(seg(lamp, i * .12, .7 + i * .12)));
      const p = drawLayer(ctx, I[n], icam, n === 'sky' ? [['a', 1]] : bl('off', 'on', f));
      if (n === 'sky') G.at(ctx, p, x => {   // a thin crescent moon in the barred window
        x.globalAlpha = .9; x.fillStyle = '#f4ecd2'; x.beginPath(); x.arc(1390, 206, 16, 0, TAU); x.fill();
        x.globalCompositeOperation = 'destination-out'; x.beginPath(); x.arc(1397, 201, 14, 0, TAU); x.fill(); x.globalCompositeOperation = 'lighter';
      }, .6);
      if (n === 'desk' && lamp > 0) G.at(ctx, p, x => {
        const fx = LAMP.x + 66, fy = LAMP.y - 46, f = lamp * flick(t);
        x.globalAlpha = f * .8; const g = x.createRadialGradient(fx, fy - 8, 0, fx, fy - 8, 46); g.addColorStop(0, '#fff2cc'); g.addColorStop(.3, 'rgba(255,190,100,.8)'); g.addColorStop(1, 'rgba(255,150,60,0)');
        x.fillStyle = g; x.fillRect(fx - 48, fy - 56, 96, 96);
        x.globalAlpha = f; x.fillStyle = '#fff3d2'; x.beginPath(); x.moveTo(fx, fy - 30); x.quadraticCurveTo(fx + 9, fy - 8, fx, fy); x.quadraticCurveTo(fx - 9, fy - 8, fx, fy - 30); x.fill();
      }, 1);
    }
    G.end(ctx, .9);
  },
  exterior(ctx, t, T, S, cam, IC, pull) {
    const O = S.O, G = S.glow, warm = TL.burst(t), winOn = TL.winOn(t), dim = TL.dim(t);
    const blend = bl('night', 'warm', warm);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#050410'; ctx.fillRect(0, 0, W, H);
    G.begin();
    if (warm < .998) drawLayer(ctx, O.skyN, cam, [['a', 1]]);
    if (warm > .002) drawLayer(ctx, O.skyW, cam, [['a', 1]], warm < .998 ? warm : 1);
    const winLight = (x, w) => {
      const a = clamp((winOn * 1.25 - w.d) / .12) * (w.seed < .3 ? warm : 1);
      const v = (w.seed < .3 ? a : Math.max(a, 0)) * flick(t, w.seed * 9);
      if (v <= .01) return;
      x.globalAlpha = v; x.fillStyle = '#ffb860'; x.beginPath(); archWin(x, w.cx, w.top, w.w, w.h); x.fill();
      x.globalAlpha = v * .5; x.fillStyle = '#ffe6b8'; x.fillRect(w.cx - w.w * .2, w.top + w.h * .35, w.w * .4, w.h * .45);
    };
    for (const n of ['far', 'mid', 'near']) {
      const p = drawLayer(ctx, O[n], cam, blend);
      if (p) G.at(ctx, p, x => { for (const w of S.win[n]) winLight(x, w); }, 1);
    }
    // the prison wall and the cell's lit window
    const pp = drawLayer(ctx, O.prison, cam, blend);
    if (pp) {
      setT(ctx, pp); ctx.drawImage(IC, CELL.x0, CELL.y0, CELL.w, CELL.h);
      const bars = seg(pull, .25, .6);
      if (bars > 0) {
        ctx.save(); ctx.globalAlpha = bars; ctx.fillStyle = '#1d173d';
        for (let i = 1; i < 6; i++) ctx.fillRect(CELL.x0 + i * CELL.w / 6 - 2.5, CELL.y0 - 2, 5, CELL.h + 4);
        ctx.fillRect(CELL.x0 - 2, CELL.y0 + CELL.h * .45, CELL.w + 4, 4);
        ctx.lineWidth = 6; ctx.strokeRect(CELL.x0 - 1, CELL.y0 - 1, CELL.w + 2, CELL.h + 2);
        ctx.restore();
      }
      G.at(ctx, pp, x => { if (x === ctx) return; x.globalAlpha = .55 * bars; x.fillStyle = '#ffb860'; x.fillRect(CELL.x0, CELL.y0, CELL.w, CELL.h); }, 1);
    }
    // front ground and the book
    const fa = clamp((cam.d - .01) / .12);
    const pf = drawLayer(ctx, O.front, cam, blend, fa);
    if (pf) this.book(ctx, t, T, S, pf, G);
    if (dim > 0) {   // the world goes dark; the book's light (bloom) and the end strip stay
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = `rgba(4,3,8,${.6 * dim})`; ctx.fillRect(0, 0, W, H);
    }
    // strips in the sky
    const pq = proj(cam, OZ.paper);
    if (pq) {
      setT(ctx, pq);
      const away = TL.stripsAway(t);
      S.strips.forEach((s, i) => {
        const k = TL.strip(t, i); if (k <= 0 || away >= 1) return;
        const [x0, y0] = SPOS[i], y = y0 - away * 560;
        drawStrip(ctx, s.st, x0, y, k, '#ffcf86', .95);
        G.haze(pq, x => { x.beginPath(); x.rect(x0, y - 20, s.st.w * k, s.st.h + 40); x.clip(); x.globalAlpha = .6; x.drawImage(s.st.G, x0 - 20, y - 20); });
      });
      const e = TL.end(t);
      if (e > 0) {
        setT(ctx, pq);
        const es = S.endStrip, x0 = CX - es.w / 2, y0 = END.y;
        drawStrip(ctx, es, x0, y0, e, '#ffd894', 1);
        const sl = eio(seg(t, T.at(10) + .9, T.at(10) + 1.25)), sp = 1 + 1.1 * (1 - sl);
        if (sl > 0) {
          ctx.save(); ctx.translate(x0 + es.w + 34, y0 + es.h / 2); ctx.rotate(.05); ctx.scale(sp, sp); ctx.globalAlpha = sl;
          ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(-24, -18, 58, 58);
          ctx.fillStyle = '#b3302a'; ctx.fillRect(-29, -29, 58, 58);
          ctx.strokeStyle = '#f0d6b0'; ctx.lineWidth = 3; ctx.strokeRect(-20, -20, 40, 40);
          ctx.beginPath(); ctx.arc(0, 0, 9, 0, TAU); ctx.stroke();
          ctx.restore();
        }
        G.haze(pq, x => { x.beginPath(); x.rect(x0, y0 - 20, es.w * e, es.h + 40); x.clip(); x.globalAlpha = .75; x.drawImage(es.G, x0 - 20, y0 - 20); });
      }
    }
    // light from the open book: soft rays, bloom only
    this.burst(t, T, cam, G);
    G.end(ctx, .9);
  },
  book(ctx, t, T, S, pf, G) {
    const rise = TL.rise(t); if (rise <= 0) return;
    const B = S.book, open = TL.open(t), burst = TL.burst(t);
    const y0 = BOOK.top + (1 - rise) * 440, bh = BOOK.bot - BOOK.top, bx = BOOK.x;
    setT(ctx, pf);
    ctx.save(); ctx.beginPath(); ctx.rect(-500, -500, W + 1000, LEDGE + 500 + 2); ctx.clip();   // rises from behind the ledge
    ctx.drawImage(B.sh, bx - 1 - 30, y0 - 1 - 30);
    // pages (seen once the cover lifts)
    if (open > 0) {
      ctx.drawImage(B.pages, bx - 1, y0 - 1);
      G.haze(pf, x => { x.globalAlpha = .3 * burst + .2 * open; x.fillStyle = '#ffcf8a'; x.fillRect(bx, y0, BOOK.w, bh); });
      const one = TL.oneLine(t);   // one line of the page catches the light: one surah
      if (one > 0) G.at(ctx, pf, x => { x.globalAlpha = one * .9; x.fillStyle = '#ffd9a0'; x.fillRect(bx + 22, y0 + 28, BOOK.w - 44, 4); }, 1);
      // the gutter
      const gg = ctx.createLinearGradient(bx - 14, 0, bx + 14, 0); gg.addColorStop(0, 'rgba(60,30,10,0)'); gg.addColorStop(.5, 'rgba(60,30,10,.45)'); gg.addColorStop(1, 'rgba(60,30,10,0)');
      if (open > .5) { ctx.fillStyle = gg; ctx.fillRect(bx - 14, y0, 28, bh); }
    }
    // the cover turns on its spine: width cos(angle), front face then the endpaper
    const sx = Math.cos(open * Math.PI);
    ctx.save(); ctx.translate(bx, 0);
    if (sx > 0) {
      ctx.scale(sx, 1);
      // light inside the book through the cut title
      ctx.save(); ctx.globalAlpha = .55 + .45 * open; ctx.drawImage(tintC(B.coverG, '#ffc879'), -1, y0 - 1); ctx.restore();
      ctx.drawImage(B.cover, -1, y0 - 1);
      // a dark wash as it turns away from the light
      if (open > 0) { ctx.fillStyle = `rgba(0,0,0,${.5 * open})`; ctx.fillRect(0, y0, BOOK.w, bh); }
    } else {
      ctx.scale(sx, 1);   // negative: lies to the left of the spine
      ctx.drawImage(B.endp, -1, y0 - 1);
      ctx.fillStyle = `rgba(0,0,0,${.4 * (1 + sx)})`; ctx.fillRect(0, y0, BOOK.w, bh);
    }
    ctx.restore();
    if (rise < 1 || open === 0) G.at(ctx, pf, x => { if (x === ctx) return; x.globalAlpha = .35 * rise; x.drawImage(tintC(B.coverG, '#ffc879'), bx - 1, y0 - 1); }, 1);
    ctx.restore();
  },
  burst(t, T, cam, G) {
    const b = TL.burst(t); if (b <= 0) return;
    const pf = proj(cam, OZ.front); if (!pf) return;
    const bh = BOOK.bot - BOOK.top, cx = BOOK.x + BOOK.w / 2, cy = BOOK.top + bh * .4;
    const k = b * (1 - .3 * eio(seg(t, T.end(8) + .3, T.at(10)))) * (1 - .25 * TL.dim(t));
    G.haze(pf, x => {
      const R = 240 + 1100 * b;
      x.beginPath(); x.rect(-600, -600, W + 1200, LEDGE + 600); x.clip();   // nothing below the ledge: the caption band stays dark
      const rg = x.createRadialGradient(cx, cy, 0, cx, cy, R);
      rg.addColorStop(0, `rgba(255,222,160,${.5 * k})`); rg.addColorStop(.2, `rgba(255,186,100,${.16 * k})`); rg.addColorStop(1, 'rgba(255,170,90,0)');
      x.fillStyle = rg; x.fillRect(cx - R, cy - R, R * 2, R * 2);
      const Rr = mulberry(9);
      for (let i = 0; i < 16; i++) {
        const a = -Math.PI / 2 + (i / 15 - .5) * 2.4 + (Rr() - .5) * .08 + .03 * Math.sin(t * .7 + i), len = (700 + Rr() * 700) * b, wd = .02 + Rr() * .035;
        const lg = x.createRadialGradient(cx, cy, 0, cx, cy, len);
        lg.addColorStop(0, `rgba(255,214,150,${.3 * k})`); lg.addColorStop(1, 'rgba(255,200,130,0)');
        x.fillStyle = lg; x.beginPath(); x.moveTo(cx, cy); x.arc(cx, cy, len, a - wd, a + wd); x.closePath(); x.fill();
      }
    });
  },
  texts(t, T) {
    if (!TL || TLT !== T) return [];
    const S = scene('s14', build), cam = drift(CAMF(t), t, 1.2), p = proj(cam, OZ.paper), out = [];
    if (!p) return out;
    const box = (id, text, st, x0, y0) => out.push({ id, text, x0: p.ox + x0 * p.k, y0: p.oy + y0 * p.k, x1: p.ox + (x0 + st.w) * p.k, y1: p.oy + (y0 + st.h) * p.k });
    if (TL.stripsAway(t) <= 0) S.strips.forEach((s, i) => { if (TL.strip(t, i) >= 1) box('strip' + i, s.s, s.st, ...SPOS[i]); });
    if (TL.end(t) >= 1) box('end', 'TAFHIM AL-QUR’AN · SAYYID ABUL A’LA MAWDUDI', S.endStrip, CX - S.endStrip.w / 2, END.y);
    return out;
  },
  events(T) {
    return [
      { t: T.word(1, 2) - .3, type: 'light' },
      { t: T.at(2) - .1, type: 'shimmer' },
      { t: T.at(2) + .5, type: 'light', soft: true },
      { t: T.at(3) - .25, type: 'paper' },
      ...[4, 5, 6, 7].map(i => ({ t: T.at(i) - .2, type: 'paper' })),
      { t: T.at(8) - .5, type: 'paper', dir: 'out' },
      { t: T.word(8, 0) + .05, type: 'paper', what: 'cover' },
      { t: T.word(8, 1) - .1, type: 'light', big: true },
      { t: T.at(10) + .15, type: 'paper' },
      { t: T.at(10) + 1.1, type: 'stamp' },
      { t: T.t1 + 1.8, type: 'light', dir: 'down' },
    ];
  },
};

const _tc = new Map();
function tintC(c, col) {
  const k = col; let m = _tc.get(c); if (!m) { m = new Map(); _tc.set(c, m); }
  if (!m.has(k)) { const o = cv(c.width, c.height), x = o.getContext('2d'); x.drawImage(c, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, o.width, o.height); m.set(k, o); }
  return m.get(k);
}

// camera: starts with the cell's window filling the frame, pulls back (zoom eased in log space), settles, then moves to the book
function camOf(T, TL) {
  const pyW = (CELL.y0 + CELL.h / 2 - CY) * (1 + OZ.prison);
  const kStart = W / CELL.w;   // 10
  const later = track([
    [T.end(2) + .9, [1.0, 0, pyW * .2]], [T.at(3) + 1.6, [.97, 0, 10]], [T.end(7), [.95, 0, 20]],
    [T.end(8) + .2, [.86, 0, 110]], [T.at(10), [.9, 0, 70]], [T.t1 + 4.2, [.93, 0, 40]],
  ]);
  return t => {
    const pull = TL.pull(t);
    if (pull < 1) {
      const k = Math.exp(Math.log(kStart) * (1 - pull)), d = (1 + OZ.prison) / k - OZ.prison;
      const py = pyW + (pyW * .2 - pyW) * eio(pull);
      return { d, px: 0, py };
    }
    const v = later(t); return { d: v[0], px: v[1], py: v[2] };
  };
}
