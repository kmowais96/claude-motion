// The shadow screen: carved translucent hide on a lit cotton cloth, cut in Islamic geometric patterns.
// Figures are still, seen from behind or in plain round-headed silhouette (no face, no profile); they only slide.
// Cloth units: 1 px of the 1920x1080 frame at zoom 1. Pieces are pre-carved canvases (piece()), composited by multiply.
import { piece, drawPiece, fill, cut, cutLine, ink, within, smooth, poly, beads, beadLine, lattice, scalesOpen, strata, cutTaper, DYE, canvas } from './engine/carve.js';
import { makeGL } from './engine/screengl.js';

export const GY = 900;                    // ground line
const INDIGO = '#2c4a78', MADDER = '#9a2a1e', SAFFRON = '#cf8d22', TEAL = '#1f6a6a', OLIVE = '#5f6a2a', HIDE = '#d9b47a', INK = DYE.ink;

// eight-pointed star path (khatam)
export function star8(q, x, y, r, inner = .42) { for (let j = 0; j < 16; j++) { const a = j * Math.PI / 8 - Math.PI / 2, rr = j % 2 ? r * inner : r; j ? q.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : q.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } q.closePath(); }
// a field of small eight-pointed stars and diamonds (girih-like openwork)
export function starField(g, x0, y0, x1, y1, s = 22) {
  cut(g, q => { let row = 0; for (let y = y0; y < y1 + s; y += s, row++) for (let x = x0 + (row % 2) * s / 2; x < x1 + s; x += s) star8(q, x, y, s * .34, .5); }, 'nonzero');
}
// pointed arch path
export function arch(q, x, yb, w, h, spring = .55) { const ys = yb - h * spring; q.moveTo(x - w / 2, yb); q.lineTo(x - w / 2, ys); q.quadraticCurveTo(x - w / 2, yb - h * .9, x, yb - h); q.quadraticCurveTo(x + w / 2, yb - h * .9, x + w / 2, ys); q.lineTo(x + w / 2, yb); q.closePath(); }

// a person, round-headed, no features. pose: stand | sit | walk | carry | child. f = facing (+1 right, -1 left)
export function person(cx, base, s, pose, col, opt = {}) {
  const f = opt.f || 1, H = 300 * s, hr = 30 * s;
  return piece([cx - 140 * s, base - H - 60 * s, cx + 160 * s, base + 4], g => {
    const P = (x, y) => [cx + x * s * f, base - y * s];
    let body, head;
    if (pose === 'sit') {          // seated on the ground, knees drawn up, back to us, head bowed
      body = q => smooth(q, [P(-70, 0), P(-78, 60), P(-60, 150), P(-30, 190), P(10, 196), P(46, 176), P(70, 120), P(110, 70), P(118, 18), P(80, 0)]);
      head = [P(4, 222), hr];
    } else if (pose === 'walk') {   // a traveller with a staff, a bundle on the back
      body = q => smooth(q, [P(-44, 0), P(-30, 90), P(-40, 170), P(-26, 236), P(6, 252), P(34, 230), P(40, 160), P(56, 70), P(70, 0)]);
      head = [P(4, 278), hr];
    } else if (pose === 'carry') {  // a heavy sack on the shoulder
      body = q => smooth(q, [P(-48, 0), P(-44, 110), P(-40, 210), P(-12, 244), P(28, 236), P(46, 160), P(50, 80), P(56, 0)]);
      head = [P(-6, 266), hr];
    } else if (pose === 'child') {
      body = q => smooth(q, [P(-34, 0), P(-30, 70), P(-24, 120), P(0, 136), P(24, 120), P(30, 70), P(34, 0)]);
      head = [P(0, 156), hr * .8];
    } else {                        // standing, robe to the ground
      body = q => smooth(q, [P(-56, 0), P(-48, 100), P(-44, 200), P(-22, 244), P(22, 244), P(44, 200), P(48, 100), P(56, 0)]);
      head = [P(0, 272), hr];
    }
    fill(g, col, body);
    within(g, body, () => { lattice(g, cx - 140 * s, base - H, cx + 160 * s, base - 30 * s, 13 * s, 2.6); beadLine(g, cx - 140 * s, base - 16 * s, cx + 160 * s, base - 16 * s, 3.2 * s, 11 * s); });
    ink(g, 2.4, body);
    // head with a wrapped cloth (no features at all)
    const [hx, hy] = head[0], r = head[1];
    const hd = q => { q.moveTo(hx + r, hy); q.arc(hx, hy, r, 0, Math.PI * 2); };
    fill(g, opt.headCol || '#3a2a1c', hd); within(g, hd, () => cutLine(g, 2.2, q => { q.arc(hx, hy + r * .2, r * .8, Math.PI * 1.1, Math.PI * 1.9); })); ink(g, 2, hd);
    if (pose === 'walk') {          // staff and bundle
      fill(g, '#4a3420', q => poly(q, [P(70, -4), P(76, -4), P(94, 300), P(88, 300)]));
      const bd = q => smooth(q, [P(-30, 200), P(-80, 220), P(-96, 170), P(-70, 130), P(-30, 140)]);
      fill(g, SAFFRON, bd); within(g, bd, () => starField(g, cx - 140 * s, base - 240 * s, cx + 40 * s, base - 120 * s, 16 * s)); ink(g, 2, bd);
    }
    if (pose === 'carry') {
      const sk = q => smooth(q, [P(-20, 236), P(-60, 290), P(10, 330), P(90, 300), P(70, 240)]);
      fill(g, HIDE, sk); within(g, sk, () => strata(g, cx - 100 * s, cx + 120 * s, x => base - 330 * s + Math.sin(x / 9) * 2, 6, 14 * s, 2)); ink(g, 2, sk);
    }
  }, { ss: 1.6, seed: Math.round(cx) });
}

// a house with a dome and one latticed window (the window is open cut: it glows)
export function house(cx, base, w, h, col) {
  return piece([cx - w / 2 - 10, base - h - w * .5, cx + w / 2 + 10, base + 4], g => {
    const wall = q => { q.rect(cx - w / 2, base - h, w, h); };
    const dome = q => { q.moveTo(cx - w * .3, base - h); q.quadraticCurveTo(cx - w * .32, base - h - w * .42, cx, base - h - w * .48); q.quadraticCurveTo(cx + w * .32, base - h - w * .42, cx + w * .3, base - h); q.closePath(); };
    fill(g, col, wall); fill(g, col, dome);
    within(g, wall, () => { beadLine(g, cx - w / 2, base - h + 14, cx + w / 2, base - h + 14, 3.4, 12); strata(g, cx - w / 2, cx + w / 2, () => base - 40, 2, 12, 3); });
    within(g, dome, () => scalesOpen(g, cx - w * .3, base - h - w * .45, cx + w * .3, base - h, 8));
    cut(g, q => arch(q, cx - w * .18, base - h * .32, w * .22, h * .42));     // the window: open
    cut(g, q => arch(q, cx + w * .2, base, w * .2, h * .5));                  // the door: open
    fill(g, col, q => { q.rect(cx - w * .18 - 2, base - h * .74, 4, h * .42); q.rect(cx - w * .29, base - h * .5, w * .22, 4); }); // window bars stay
    ink(g, 2.4, wall); ink(g, 2.4, dome);
  }, { ss: 1.4, seed: Math.round(cx) });
}

export function palm(x, base, h) {
  return piece([x - h * .5, base - h - 20, x + h * .5, base + 2], g => {
    const tr = q => poly(q, [[x - 9, base], [x - 5, base - h], [x + 5, base - h], [x + 10, base]]);
    fill(g, '#5a3a1e', tr); within(g, tr, () => { for (let y = base - 12; y > base - h; y -= 16) cutLine(g, 2, q => { q.moveTo(x - 10, y); q.lineTo(x + 10, y - 5); }); });
    for (let k = 0; k < 9; k++) {
      const a = Math.PI * (1.05 + k * .11), L = h * (.42 + (k % 2) * .08), ex = x + Math.cos(a) * L, ey = base - h + Math.sin(a) * L * .6 + L * .25;
      const fr = q => smooth(q, [[x, base - h], [(x + ex) / 2, (base - h + ey) / 2 - 26], [ex, ey], [(x + ex) / 2, (base - h + ey) / 2 - 8]]);
      fill(g, OLIVE, fr); within(g, fr, () => { for (let u = .2; u < .95; u += .12) cutLine(g, 1.6, q => { const px = x + (ex - x) * u, py = base - h + (ey - base + h) * u - 18 * Math.sin(u * Math.PI); q.moveTo(px, py); q.lineTo(px + 4, py + 12); }); });
      ink(g, 1.6, fr);
    }
  }, { ss: 1.4, seed: x });
}

// the ground strip: a carved band of arches and stars, the same everywhere
export function ground(x0, x1) {
  return piece([x0, GY - 30, x1, 1090], g => {
    const gp = q => { q.moveTo(x0, GY); for (let x = x0; x <= x1; x += 20) q.lineTo(x, GY + 6 * Math.sin(x / 140)); q.lineTo(x1, 1090); q.lineTo(x0, 1090); q.closePath(); };
    fill(g, '#7a5530', gp);
    within(g, gp, () => {
      g.fillStyle = '#5e3c1e'; g.fillRect(x0, 1000, x1 - x0, 90);
      cut(g, q => { for (let x = x0 + 30; x < x1; x += 70) arch(q, x, 990, 34, 56); }, 'nonzero');
      cut(g, q => { for (let x = x0 + 65; x < x1; x += 70) star8(q, x, 1040, 13, .45); }, 'nonzero');
      beadLine(g, x0, GY + 30, x1, GY + 30, 3, 14);
    });
    ink(g, 2.4, gp);
  }, { ss: 1, seed: 3 });
}

// the night sky band: dark hide, carved with stars of many sizes and a crescent
export function sky(x0, x1, y1 = 300, seed = 7) {
  let r = seed; const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647;
  return piece([x0, -20, x1, y1 + 30], g => {
    const sp = q => { q.moveTo(x0, -20); q.lineTo(x1, -20); for (let x = x1; x >= x0; x -= 30) q.lineTo(x, y1 + 18 * Math.sin(x / 210)); q.closePath(); };
    fill(g, '#2a1c14', sp);
    within(g, sp, () => {
      cut(g, q => { for (let k = 0; k < (x1 - x0) / 26; k++) { const x = x0 + rnd() * (x1 - x0), y = 10 + rnd() * (y1 - 40), big = rnd(); if (big > .9) star8(q, x, y, 9 + rnd() * 7, .45); else { q.moveTo(x + 2.4, y); q.arc(x, y, 1.6 + rnd() * 2.2, 0, Math.PI * 2); } } }, 'nonzero');
      cut(g, q => { const cx = x0 + (x1 - x0) * .62, cy = 120; q.arc(cx, cy, 38, 0, Math.PI * 2); q.moveTo(cx + 16 + 34, cy - 10); q.arc(cx + 16, cy - 10, 34, 0, Math.PI * 2); }, 'evenodd');
      beadLine(g, x0, y1 - 6, x1, y1 - 6, 3, 16);
    });
    ink(g, 2.4, sp);
  }, { ss: 1, seed });
}

// renderer: transmission canvas (screen space) -> GL with lamps in cloth coordinates
export function makeScreen(glCanvas) {
  const GL = makeGL(glCanvas), [trc, tr] = canvas(1920, 1080), [frc, fr] = canvas(1920, 1080);
  return {
    // cam = [cx, cy, zoom]; pieces = [{p, dx, dy, a}] (a = alpha 0..1 for a piece pressed on/lifted off)
    draw(cam, pieces, o) {
      tr.setTransform(1, 0, 0, 1, 0, 0); tr.globalCompositeOperation = 'source-over'; tr.globalAlpha = 1; tr.fillStyle = '#fff'; tr.fillRect(0, 0, 1920, 1080);
      tr.setTransform(cam[2], 0, 0, cam[2], 960 - cam[0] * cam[2], 540 - cam[1] * cam[2]);
      tr.globalCompositeOperation = 'multiply';
      for (const it of pieces) { if ((it.a ?? 1) <= 0) continue; tr.globalAlpha = it.a ?? 1; tr.save(); tr.translate(it.dx || 0, it.dy || 0); drawPiece(tr, it.p); tr.restore(); }
      fr.clearRect(0, 0, 1920, 1080);
      GL.render(trc, frc, { cam, rect: o.rect || [-1e5, -1e5, 1e5, 1e5], lamps: o.lamps, expo: o.expo ?? 2.3, amb: o.amb ?? .3, sigB: o.sigB ?? 620, sigC: o.sigC ?? 120, time: o.time || 0, fade: o.fade || 0, fadeCol: o.fadeCol, vign: .4, bloom: o.bloom ?? .4, lcol: o.lcol, hotcol: o.hotcol });
    },
  };
}

// a free-standing pointed portal (pillars and arch band), cut with stars
export function portal(cx, base, w, h, col) {
  return piece([cx - w / 2 - 20, base - h - 20, cx + w / 2 + 20, base + 4], g => {
    const outer = q => arch(q, cx, base, w, h), inner = q => arch(q, cx, base + 2, w - 70, h - 50);
    const band = q => { outer(q); inner(q); };
    fill(g, col, band, 'evenodd');
    within(g, band, () => { starField(g, cx - w / 2, base - h, cx + w / 2, base, 20); });
    ink(g, 2.4, outer); ink(g, 2, inner);
  }, { ss: 1.3, seed: cx });
}
// low dunes in carved strata
export function dunes(x0, x1, col = '#a8742e') {
  const top = x => GY - 70 - 50 * Math.sin((x - x0) / 260) - 30 * Math.sin((x - x0) / 97 + 1);
  return piece([x0, GY - 170, x1, GY + 10], g => {
    const d = q => { q.moveTo(x0, GY + 10); for (let x = x0; x <= x1; x += 16) q.lineTo(x, top(x)); q.lineTo(x1, GY + 10); q.closePath(); };
    fill(g, col, d); within(g, d, () => strata(g, x0, x1, x => top(x) + 4 * Math.sin(x / 30), 7, 15, 3.4)); ink(g, 2.2, d);
  }, { ss: 1.2, seed: 11 });
}
// a hill with a single tree whose crown is cut with leaf holes
export function hillTree(cx, base, col = '#6a5a26') {
  return piece([cx - 420, base - 520, cx + 420, base + 10], g => {
    const hill = q => { q.moveTo(cx - 420, base + 10); q.quadraticCurveTo(cx, base - 190, cx + 420, base + 10); q.closePath(); };
    fill(g, '#7a5a30', hill); within(g, hill, () => strata(g, cx - 420, cx + 420, x => base - 95 + Math.pow((x - cx) / 420, 2) * 100, 5, 18, 3)); ink(g, 2.2, hill);
    const trunk = q => poly(q, [[cx - 150, base - 92], [cx - 138, base - 330], [cx - 120, base - 330], [cx - 128, base - 92]]);
    fill(g, '#4a3018', trunk); ink(g, 1.8, trunk);
    const crown = q => smooth(q, [[cx - 330, base - 330], [cx - 300, base - 450], [cx - 160, base - 510], [cx - 10, base - 470], [cx + 40, base - 360], [cx - 60, base - 300], [cx - 250, base - 290]]);
    fill(g, col, crown);
    within(g, crown, () => cut(g, q => { for (let y = base - 500; y < base - 290; y += 22) for (let x = cx - 330 + (y % 44 ? 11 : 0); x < cx + 40; x += 22) { q.moveTo(x, y - 7); q.quadraticCurveTo(x + 6, y, x, y + 7); q.quadraticCurveTo(x - 6, y, x, y - 7); } }, 'nonzero'));
    ink(g, 2.2, crown);
  }, { ss: 1.2, seed: cx });
}
