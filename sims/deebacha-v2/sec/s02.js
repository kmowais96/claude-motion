// Section 2 · Why one more? — paper-cut lightbox, warm interior ladder.
// A library inside the lamp box: shelves of spines as stacked back-lit layers. One new book slides onto the near shelf;
// the shelf stays dim; a gap in the far shelf glows and light bursts through it.
import { W, H, layer, drawLayer, bl, Glow, vignette, flick, scene, cut, aimAt, drift, cv } from '../lib/paper-lantern/box.js';
import { seg, eio, eo, clamp, track, mulberry } from '/core/lib.js';

const Z = { wall: .6, far: .42, mid: .27, near: .13, front: 0 };
const LIGHT = { x: 965, y: 420, r: 700 };
const GAP = { x0: 922, x1: 1008, top: 340, bot: 474 };      // empty slot in the far shelf, middle row
const ROWS_FAR = [190, 340, 490, 640], ROW_H = 150, BOARD = 16;
const NEAR_SHELF = 772, NB = { x: 1162, w: 46, h: 196 };   // the new book's final place

// books standing in a row between x0 and x1 on a board at y; returns nothing, fills with current fillStyle
function books(x, R, x0, x1, base, hmin, hmax, skip) {
  let p = x0;
  while (p < x1 - 8) {
    if (skip && p + 30 > skip[0] && p < skip[1]) { p = skip[1] + 2; continue; }
    const r = R();
    if (r < .07 && x1 - p > 120) {   // a small lying stack
      let y = base; const sw = 70 + R() * 40;
      for (let k = 0; k < 2 + (R() * 3 | 0); k++) { const th = 12 + R() * 9; x.fillRect(p + (R() - .5) * 8, y - th, sw - k * 4, th - 2); y -= th; }
      p += sw + 6; continue;
    }
    const bw = 14 + R() * 20, bh = hmin + R() * (hmax - hmin);
    if (r > .95 && p + bw + 30 < x1) {   // a leaning book
      x.beginPath(); x.moveTo(p, base); x.lineTo(p + bw, base); x.lineTo(p + bw + bh * .28, base - bh * .96); x.lineTo(p + bh * .28, base - bh * .96 - 4); x.fill();
      p += bw + bh * .3 + 4; continue;
    }
    x.fillRect(p, base - bh, bw, bh);
    // spine bands: thin cuts
    if (R() < .7) cut(x, y => { const b = 7 + R() * 6; y.fillRect(p + 2, base - bh + b, bw - 4, 2); y.fillRect(p + 2, base - 12 - R() * 6, bw - 4, 2); });
    p += bw + 2 + (R() < .3 ? 2 : 0);
  }
}

function build() {
  const states = { off: { amb: .30, k: .12 }, on: { amb: .42, k: 1, col: '#ffc878' } };
  const L = {};
  L.wall = layer({ z: Z.wall, col: '#efcf98', trans: .8, light: LIGHT, states, shadow: false, mx: 260, my: 160, draw(x) {
    x.fillRect(-260, -160, W + 520, H + 320);
  } });
  L.far = layer({ z: Z.far, col: '#c98f56', trans: .5, light: LIGHT, states, mx: 240, my: 150, blur: .8, shadow: { dy: 9, blur: 10, a: .45 }, seed: 3, draw(x, R) {
    x.fillRect(-240, 150, W + 480, H);
    // crown moulding
    x.fillRect(-240, 128, W + 480, 14);
    for (const top of ROWS_FAR) cut(x, y => y.fillRect(-240, top, W + 480, ROW_H - BOARD));
    for (const top of ROWS_FAR) {
      const base = top + ROW_H - BOARD;
      books(x, R, -230, W + 230, base, 96, 128, top === 340 ? [GAP.x0, GAP.x1] : null);
    }
    for (let u = -200; u < W + 240; u += 470) x.fillRect(u, 150, 22, 650);
  } });
  L.mid = layer({ z: Z.mid, col: '#a2603a', trans: .45, light: LIGHT, states, mx: 210, my: 140, shadow: { dy: 12, blur: 14, a: .5 }, seed: 11, draw(x, R) {
    for (const [a, b] of [[-210, 470], [1450, W + 210]]) {
      x.fillRect(a, 90, b - a, H + 200);
      for (const top of [120, 316, 512, 708]) {
        cut(x, y => y.fillRect(a + 26, top, b - a - 52, 176));
        books(x, R, a + 30, b - 30, top + 176, 100, 160);
      }
      x.fillRect(a, 892, b - a, 300);
    }
    // arch spanning the two cases
    x.beginPath(); x.moveTo(440, 260); x.quadraticCurveTo(440, 40, 960, 34); x.quadraticCurveTo(1480, 40, 1480, 260);
    x.lineTo(1480, -140); x.lineTo(440, -140); x.closePath(); x.fill();
    cut(x, y => { y.beginPath(); y.moveTo(470, 270); y.quadraticCurveTo(470, 64, 960, 58); y.quadraticCurveTo(1450, 64, 1450, 270); y.lineTo(1450, 300); y.lineTo(470, 300); y.closePath(); y.fill(); });
  } });
  L.near = layer({ z: Z.near, col: '#62321a', trans: .2, light: LIGHT, states, mx: 180, my: 120, shadow: { dy: 14, blur: 16, a: .55 }, seed: 21, draw(x, R) {
    x.fillRect(-180, NEAR_SHELF, W + 360, 26);
    x.fillRect(-180, NEAR_SHELF + 26, W + 360, 20);
    for (let u = 240; u < W; u += 560) { x.beginPath(); x.moveTo(u, NEAR_SHELF + 40); x.lineTo(u + 40, NEAR_SHELF + 40); x.lineTo(u + 20, NEAR_SHELF + 110); x.fill(); }
    books(x, R, 330, NB.x - 2, NEAR_SHELF, 130, 200);
    // brass oil lamp on the shelf (body; the flame is light)
    const lx = 205, ly = NEAR_SHELF;
    x.beginPath(); x.ellipse(lx, ly - 22, 46, 20, 0, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.moveTo(lx + 40, ly - 28); x.quadraticCurveTo(lx + 80, ly - 34, lx + 86, ly - 48); x.lineTo(lx + 74, ly - 46); x.quadraticCurveTo(lx + 60, ly - 30, lx + 30, ly - 30); x.fill();
    x.beginPath(); x.arc(lx - 44, ly - 26, 14, Math.PI * .5, Math.PI * 1.6); x.lineWidth = 7; x.strokeStyle = '#62321a'; x.stroke();
    x.fillRect(lx - 18, ly - 10, 36, 10);
  } });
  L.front = layer({ z: Z.front, col: '#1c0c05', trans: .05, light: LIGHT, states, mx: 160, my: 110, shadow: { dy: 16, blur: 20, a: .6 }, seed: 31, draw(x, R) {
    // reading desk edge, side pillars and a scalloped valance
    x.beginPath(); x.moveTo(-160, 884); x.lineTo(W + 160, 872); x.lineTo(W + 160, H + 110); x.lineTo(-160, H + 110); x.fill();
    x.fillRect(-160, -110, 230, H + 220); x.fillRect(W - 70, -110, 230, H + 220);
    x.beginPath(); x.moveTo(-160, -110); x.lineTo(W + 160, -110); x.lineTo(W + 160, 30);
    for (let u = W + 160; u >= -160; u -= 80) x.quadraticCurveTo(u - 40, 62, u - 80, 30);
    x.closePath(); x.fill();
  } });
  // the new book: one deep red spine with gold bands (the stack's one accent)
  const B = cv(NB.w + 40, NB.h + 40), b = B.getContext('2d'); b.translate(20, 20);
  b.fillStyle = '#8e2419'; b.fillRect(0, 0, NB.w, NB.h);
  b.globalCompositeOperation = 'source-atop'; b.globalAlpha = .9;
  b.fillStyle = '#d9b46a'; b.globalAlpha = 1;
  for (const y of [16, 22, NB.h - 26, NB.h - 20]) b.fillRect(3, y, NB.w - 6, 2.5);
  b.fillRect(9, 64, NB.w - 18, 54); b.fillStyle = '#8e2419'; b.fillRect(12, 67, NB.w - 24, 48);
  b.fillStyle = 'rgba(255,236,200,.35)'; b.fillRect(0, 0, NB.w, 3); b.fillStyle = 'rgba(0,0,0,.35)'; b.fillRect(0, NB.h - 4, NB.w, 4);
  b.fillStyle = 'rgba(0,0,0,.22)'; b.fillRect(NB.w - 6, 0, 6, NB.h);
  const BS = cv(NB.w + 40, NB.h + 40), bs = BS.getContext('2d'); bs.filter = 'blur(9px)'; bs.fillStyle = 'rgba(0,0,0,.5)'; bs.fillRect(26, 34, NB.w, NB.h);
  return { L, B, BS, glow: new Glow() };
}

export default {
  style: 'lightbox',
  page: 'p. 1',
  render(ctx, t, T) {
    const S = scene('s02', build), L = S.L, G = S.glow;
    const t0 = T.at(0);
    // lamp on: source, then each layer back to front in a .35 s stagger
    const litOf = n => eio(seg(t, t0 - .5 + n * .35, t0 + 1.0 + n * .35));
    const dim = 1 - .45 * eio(seg(t, T.at(3) + .4, T.k(3, .6))) + .45 * eio(seg(t, T.at(5) - .2, T.at(5) + 1.4));
    const gapOn = eio(seg(t, T.word(4, 8) - .25, T.word(4, 9) + .5));
    const burst = eio(seg(t, T.at(5) - .3, T.at(5) + 1.6));
    const cam = drift(track([
      [t0 - 1.4, [1.07, -70, 10]], [T.at(1), [1.02, -110, 0]], [T.end(1) + .4, [.99, 90, -6]],
      [T.end(2) + .3, [.97, 80, 0]], [T.end(3), [.93, 30, -20]], [T.end(4), [.9, 6, -34]], [T.t1 + 1.4, [.83, 2, -52]],
    ])(t).reduce((c, v, i) => (c[['d', 'px', 'py'][i]] = v, c), {}), t);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#0b0603'; ctx.fillRect(0, 0, W, H);
    G.begin();
    const order = ['wall', 'far', 'mid', 'near', 'front'];
    order.forEach((name, n) => {
      const f = litOf(n);
      const p = drawLayer(ctx, L[name], cam, bl('off', 'on', f));
      if (!p) return;
      if (name === 'far') {
        // the gap glows, then light bursts through it (rays are occluded by the nearer layers)
        G.at(ctx, p, (x, s) => {
          const cxg = (GAP.x0 + GAP.x1) / 2, cyg = (GAP.top + GAP.bot) / 2 + 20;
          if (gapOn > 0) {
            x.globalAlpha = gapOn * (.85 + .15 * flick(t, 2)) * (s < 1 ? 1 : 1);
            const g = x.createLinearGradient(0, GAP.top, 0, GAP.bot);
            g.addColorStop(0, '#ffc470'); g.addColorStop(.5, '#ffe2a6'); g.addColorStop(1, '#ffd690');
            x.fillStyle = g; x.fillRect(GAP.x0 + 1, GAP.top - 10, GAP.x1 - GAP.x0 - 2, GAP.bot - GAP.top + 10);
          }
        }, 1);
        G.haze(p, (x, s) => {
          const cxg = (GAP.x0 + GAP.x1) / 2, cyg = (GAP.top + GAP.bot) / 2 + 20;
          if (burst > 0) {
            const R = 120 + 1000 * burst, rg = x.createRadialGradient(cxg, cyg, 0, cxg, cyg, R);
            rg.addColorStop(0, `rgba(255,214,150,${.6 * burst})`); rg.addColorStop(.18, `rgba(255,180,95,${.2 * burst})`); rg.addColorStop(1, 'rgba(255,170,90,0)');
            x.fillStyle = rg; x.globalAlpha = 1; x.fillRect(cxg - R, cyg - R, R * 2, R * 2);
            const Rr = mulberry(5);
            for (let i = 0; i < 14; i++) {
              const a = -Math.PI / 2 + (i / 13 - .5) * 2.6 + (Rr() - .5) * .1, len = (600 + Rr() * 900) * burst, wd = .03 + Rr() * .05;
              const lg = x.createRadialGradient(cxg, cyg, 0, cxg, cyg, len);
              lg.addColorStop(0, `rgba(255,205,140,${.38 * burst})`); lg.addColorStop(1, 'rgba(255,200,130,0)');
              x.fillStyle = lg; x.beginPath(); x.moveTo(cxg, cyg);
              x.arc(cxg, cyg, len, a - wd, a + wd); x.closePath(); x.fill();
            }
          }
        }, 1);
      }
      if (name === 'near') {
        // the new book slides in along the shelf from the right
        const sl = eo(seg(t, T.word(2, 2) - .45, T.word(2, 4) + .15));
        const bx = NB.x + (1 - sl) * 1100;
        ctx.drawImage(S.BS, bx - 20, NEAR_SHELF - NB.h - 20);
        ctx.drawImage(S.B, bx - 20, NEAR_SHELF - NB.h - 20);
        // a little warm wash on the spine from the burst
        if (burst > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .25 * burst; ctx.fillStyle = '#ffb060'; ctx.fillRect(bx, NEAR_SHELF - NB.h, 5, NB.h); ctx.restore(); }
        // the shelf lamp's flame
        const fl = litOf(3) * flick(t);
        G.at(ctx, p, (x, s) => {
          const fx = 205 + 82, fy = NEAR_SHELF - 50;
          x.globalAlpha = fl;
          const g = x.createRadialGradient(fx, fy - 6, 0, fx, fy - 6, 26);
          g.addColorStop(0, '#fff3d0'); g.addColorStop(.35, 'rgba(255,190,100,.85)'); g.addColorStop(1, 'rgba(255,150,60,0)');
          x.fillStyle = g; x.fillRect(fx - 30, fy - 36, 60, 60);
          x.fillStyle = '#fff1c8'; x.beginPath(); x.moveTo(fx, fy - 22); x.quadraticCurveTo(fx + 7, fy - 6, fx, fy); x.quadraticCurveTo(fx - 7, fy - 6, fx, fy - 22); x.fill();
          if (s < 1) { x.globalAlpha = fl * .7; x.fillStyle = 'rgba(255,170,80,1)'; x.beginPath(); x.arc(fx, fy - 8, 40, 0, 7); x.fill(); }
        }, 1);
      }
    });
    if (dim < .999) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = `rgba(10,4,0,${(1 - dim) * .8})`; ctx.fillRect(0, 0, W, H); }
    G.end(ctx, .9);
    vignette(ctx);
  },
  events(T) {
    return [
      { t: T.at(0) - .5, type: 'light' },
      { t: T.word(2, 2) - .45, type: 'paper' },
      { t: T.word(2, 4) + .1, type: 'thud' },
      { t: T.at(3) + .4, type: 'light', dir: 'down' },
      { t: T.word(4, 8) - .2, type: 'light' },
      { t: T.at(5) - .3, type: 'light', big: true },
    ];
  },
};
