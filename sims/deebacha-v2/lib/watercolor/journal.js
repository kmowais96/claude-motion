// The study journal shared by sections 11 and 12: one paper, one palette, the hand, the mushaf, the card, the stamp.
import { drawList, mk, drawS, rnd, withSeed, qcurve, polar, line, fillStrokes, sprite, rgba, clamp, eo, ss, seg, washSprite, reveal, vnoise } from './engine.js';
import { paper } from './paper.js';

export const PAL = {
  PAPER: '#f1e9da', HALO: '#f3ead9', INK: '#2b2520', INK2: '#3d3129', PENCIL: '#6d5f52',
  TEAL: '#2f5d57', TEAL2: '#1f403c', GOLD: '#c9a25a', CREAM: '#e2d2ae',
  CARD: '#e8d4a4', RAIN: '#5b8db0', SAGE: '#97ad86', SAND: '#cdb083', STONE: '#968b7f',
  FLAG: '#bf8a3f', SUN: '#eeb07e', SUN2: '#f3cf8f',
  VERM: '#c8442a',          // the one accent: the step-number stamp
};
const { INK, INK2, PENCIL, TEAL, TEAL2, GOLD, CREAM, CARD, RAIN, SAGE, STONE, VERM, HALO } = PAL;
export { paper };

// --- hand notes (Caveat), revealed left to right like writing, over a paper halo -----------------
export function hand(c, txt, x, y, p, o = {}) {
  if (p <= 0) return;
  c.save(); c.font = `${o.w || 600} ${o.size || 32}px "Caveat"`; c.textAlign = o.align || 'left'; c.textBaseline = 'middle';
  const w = c.measureText(txt).width, x0 = o.align === 'right' ? x - w : o.align === 'center' ? x - w / 2 : x;
  c.beginPath(); c.rect(x0 - 8, y - 40, (w + 16) * eo(p), 80); c.clip();
  c.shadowColor = rgba(HALO, .95); c.shadowBlur = 12; c.fillStyle = rgba(o.col || INK, o.a ?? .9);
  c.fillText(txt, x, y); c.fillText(txt, x, y);
  c.restore();
}
export function handBox(c, txt, x, y, o = {}) {
  c.save(); c.font = `${o.w || 600} ${o.size || 32}px "Caveat"`;
  const w = c.measureText(txt).width, s = o.size || 32; c.restore();
  const x0 = o.align === 'right' ? x - w : o.align === 'center' ? x - w / 2 : x;
  return { x0, y0: y - s * .55, x1: x0 + w, y1: y + s * .55 };
}
// pen leader: thin ink line that grows from the note to its specimen, a dot on arrival
export function leader(c, x0, y0, x1, y1, p, bend = 18, a = .72) {
  if (p <= 0) return;
  const pts = qcurve(x0, y0, x1, y1, bend, 16), m = Math.max(1, Math.round(16 * clamp(p)));
  c.beginPath(); for (let i = 0; i <= m; i++) i ? c.lineTo(pts[i][0], pts[i][1]) : c.moveTo(pts[i][0], pts[i][1]);
  c.strokeStyle = rgba(INK, a); c.lineWidth = 1.6; c.lineCap = 'round'; c.stroke();
  if (p >= 1) { c.beginPath(); c.arc(x1, y1, 3, 0, 7); c.fillStyle = rgba(INK, a); c.fill(); }
}
// journal header: a small spaced mono kicker and a serif title, opened by a left-to-right clip
export function header(c, kicker, title, p, x = 92, y = 92) {
  if (p <= 0) return;
  c.save(); c.beginPath(); c.rect(x - 10, y - 30, 900 * eo(p), 130); c.clip();
  c.textBaseline = 'middle'; c.textAlign = 'left';
  c.font = '400 19px "IBM Plex Mono"'; c.letterSpacing = '4px'; c.fillStyle = rgba(INK2, .72); c.fillText(kicker, x, y);
  c.letterSpacing = '0px'; c.font = '500 54px "Cormorant Garamond"'; c.fillStyle = rgba(INK, .9); c.fillText(title, x - 2, y + 52);
  c.restore();
}
export function headerBoxes(c, kicker, title, x = 92, y = 92) {
  c.save(); c.font = '400 19px "IBM Plex Mono"'; c.letterSpacing = '4px'; const wk = c.measureText(kicker).width;
  c.letterSpacing = '0px'; c.font = '500 54px "Cormorant Garamond"'; const wt = c.measureText(title).width; c.restore();
  return [{ x0: x, y0: y - 12, x1: x + wk, y1: y + 12, text: kicker }, { x0: x, y0: y + 52 - 30, x1: x + wt, y1: y + 52 + 30, text: title }];
}

// --- painted shapes -----------------------------------------------------------------------------
// a soft round wash with a pooled rim, for pins; blurred for halos
export function roundWash(cx, cy, r, col, a = .3, o = {}) {
  const pts = Array.from({ length: 56 }, (_, i) => { const t = i / 56 * Math.PI * 2, k = 1 + .05 * (vnoise(i * .6 + r) * 2 - 1); return [cx + Math.cos(t) * r * k, cy + Math.sin(t) * r * k * (o.sy ?? 1)]; });
  return washSprite(pts, col, a, o);
}
export function arcPts(cx, cy, rx, ry, a0, a1, n = 20) {
  return Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; });
}

// The mushaf: a closed book seen from the front, geometric (girih-like) cover, no lettering.
// Local coordinates, centred at 0,0. Returns stroke lists in painting order: structure before detail.
export function buildMushaf() {
  return withSeed(1101, () => {
    const pages = [], cover = [], edge = [], pattern = [];
    // page block showing at the right and bottom (thickness)
    for (let i = 0; i < 6; i++) pages.push(mk(line(172 + i * 2.6, -214 + i * 2, 172 + i * 2.6, 236, 10), 3.2, i % 2 ? '#d8c6a0' : CREAM, { prof: 'even', nb: 0, a: .9, rough: .1 }));
    for (let i = 0; i < 5; i++) pages.push(mk(line(-160 + i * 2, 232 + i * 2.4, 186, 232 + i * 2.4, 12), 3, i % 2 ? '#d8c6a0' : CREAM, { prof: 'even', nb: 0, a: .9, rough: .1 }));
    pages.push(mk(line(188, -210, 188, 244, 10), 1.6, '#8c7a5c', { prof: 'even', nb: 0, a: .55, rough: .3 }));
    pages.push(mk(line(-160, 246, 188, 246, 12), 1.6, '#8c7a5c', { prof: 'even', nb: 0, a: .55, rough: .3 }));
    // cover: a flat pooled wash, then broad strokes on top for brush texture (both clipped to the board)
    const board = []; for (let i = 0; i <= 24; i++) board.push([-170 + 342 * i / 24, -232 + rnd(-1.5, 1.5)]);
    for (let i = 0; i <= 30; i++) board.push([172 + rnd(-1.5, 1.5), -232 + 464 * i / 30]);
    for (let i = 24; i >= 0; i--) board.push([-170 + 342 * i / 24, 232 + rnd(-1.5, 1.5)]);
    for (let i = 30; i >= 0; i--) board.push([-170 + rnd(-1.5, 1.5), -232 + 464 * i / 30]);
    const base = washSprite(board, TEAL, .62, { jit: 2.5, rimW: 3 });
    fillStrokes(cover, -180, -236, 182, 236, 54, TEAL, { a: .2, nb: 5, overlap: .5 });
    for (let i = 0; i < 3; i++) cover.push(mk(line(-160 + i * 10, -232, -160 + i * 10, 232, 12), 14, TEAL2, { prof: 'even', nb: 4, a: .4, rough: .25 }));
    // the only "line": darker edges along the form
    edge.push(mk(line(171, -230, 171, 232, 12), 3, INK2, { prof: 'even', nb: 0, a: .6, rough: .35 }));
    edge.push(mk(line(-168, 232, 171, 232, 12), 3, INK2, { prof: 'even', nb: 0, a: .6, rough: .35 }));
    edge.push(mk(line(-138, -228, -138, 228, 12), 2.2, TEAL2, { prof: 'even', nb: 0, a: .7, rough: .3 }));
    // girih-like tooling in gold
    const gl = (x0, y0, x1, y1, w = 2.4) => pattern.push(mk(line(x0, y0, x1, y1, 6), w, GOLD, { prof: 'even', nb: 0, a: .86, rough: .12 }));
    const cx = 17, cy = 0;
    // double frame
    for (const ins of [0, 9]) {
      const x0 = -118 + ins, x1 = 152 - ins, y0 = -206 + ins, y1 = 206 - ins;
      gl(x0, y0, x1, y0); gl(x1, y0, x1, y1); gl(x1, y1, x0, y1); gl(x0, y1, x0, y0);
    }
    const star = (x, y, R, rot = 0, w = 2.4) => {
      const P = k => [x + Math.cos(rot + k * Math.PI / 4) * R, y + Math.sin(rot + k * Math.PI / 4) * R];
      for (let k = 0; k < 8; k++) { const a = P(k), b = P(k + 3); gl(a[0], a[1], b[0], b[1], w); }
    };
    const ring = (x, y, R, rot, w = 2.2) => {
      for (let k = 0; k < 8; k++) { const a = rot + k * Math.PI / 4, b = rot + (k + 1) * Math.PI / 4; gl(x + Math.cos(a) * R, y + Math.sin(a) * R, x + Math.cos(b) * R, y + Math.sin(b) * R, w); }
    };
    // central rosette: an 8-point star, its octagon heart, and kites out to an outer octagon
    star(cx, cy, 84, -Math.PI / 2);
    ring(cx, cy, 30, -Math.PI / 2 + Math.PI / 8, 2);
    for (let k = 0; k < 8; k++) {
      const ao = -Math.PI / 2 + Math.PI / 8 + k * Math.PI / 4, o = [cx + Math.cos(ao) * 112, cy + Math.sin(ao) * 112];
      for (const d of [-1, 1]) { const at = ao + d * Math.PI / 8; gl(o[0], o[1], cx + Math.cos(at) * 84, cy + Math.sin(at) * 84, 2); }
    }
    // the rosette's field: two lines out to the frame along the axes
    gl(cx, cy - 112, cx, -197); gl(cx, cy + 112, cx, 197);
    // corner stars and small lozenges at the field's quarter points
    for (const [x, y] of [[-78, -166], [112, -166], [-78, 166], [112, 166]]) { star(x, y, 24, -Math.PI / 2, 1.8); ring(x, y, 9, -Math.PI / 2 + Math.PI / 8, 1.5); }
    for (const [x, y] of [[-78, 0], [112, 0]]) { gl(x, y - 30, x + 14, y); gl(x + 14, y, x, y + 30); gl(x, y + 30, x - 14, y); gl(x - 14, y, x, y - 30); }
    // spine bands
    for (const y of [-150, -60, 60, 150]) gl(-166, y, -142, y, 2);
    const clip = c => { c.beginPath(); board.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.clip(); };
    // paint the cover to progress p (top to bottom): the wash is wiped in, the strokes follow it
    const paintCover = (c, p) => { if (p <= 0) return; c.save(); clip(c); reveal(c, base, p, 'y', 3); drawList(c, cover, p); c.restore(); };
    const all = document.createElement('canvas'); all.width = 420; all.height = 540;
    const a = all.getContext('2d'); a.translate(210, 270);
    for (const s of pages) drawS(a, s); paintCover(a, 1); for (const s of [...edge, ...pattern]) drawS(a, s);
    return { pages, cover, edge, pattern, paintCover, spr: { cv: all, x0: -210, y0: -270, x1: 210, y1: 270 } };
  });
}

// Small icons painted on the introduction card (local, centred at 0,0, ~46 px)
function icon(kind, x, y) {
  const L = [];
  if (kind === 'moon') {       // when it came down
    L.push(mk(arcPts(x + 3, y, 17, 17, Math.PI * .62, Math.PI * 1.38 + Math.PI * .02, 14), 11, GOLD, { prof: 'leaf', nb: 3, a: .85 }));
    L.push(mk(arcPts(x + 2, y, 17, 17, Math.PI * .7, Math.PI * 1.3, 10), 2, INK2, { prof: 'leaf', nb: 0, a: .45 }));
    L.push(mk(line(x + 16, y - 12, x + 17, y - 10, 2), 3.4, GOLD, { prof: 'even', nb: 0, a: .9 }));
  } else if (kind === 'town') { // what was happening
    for (const [dx, h] of [[-16, 14], [0, 20], [16, 12]]) {
      L.push(mk(line(x + dx - 6, y + 12 - h / 2, x + dx + 6, y + 12 - h / 2, 4), h, '#b49478', { prof: 'even', nb: 2, a: .75 }));
      L.push(mk(line(x + dx - 6, y + 12 - h - 1, x + dx + 6, y + 12 - h - 1, 4), 3, INK2, { prof: 'even', nb: 0, a: .5 }));
    }
    L.push(mk(line(x - 26, y + 13, x + 26, y + 13, 8), 2.2, INK2, { prof: 'even', nb: 0, a: .55 }));
  } else if (kind === 'hill') { // where the call stood
    L.push(mk(qcurve(x - 26, y + 14, x + 26, y + 14, 26, 14), 9, SAGE, { prof: 'leaf', nb: 3, a: .8 }));
    L.push(mk(qcurve(x - 18, y + 12, x + 4, y - 4, -6, 8), 2, PENCIL, { prof: 'even', nb: 0, a: .7 }));
    L.push(mk(line(x + 3, y - 5, x + 4, y - 4, 2), 6, INK2, { prof: 'even', nb: 0, a: .85 }));
  } else {                      // what it faced: a storm cloud and slanting rain
    L.push(mk(qcurve(x - 20, y - 4, x + 20, y - 4, -12, 12), 14, STONE, { prof: 'leaf', nb: 3, a: .78 }));
    L.push(mk(qcurve(x - 8, y - 10, x + 14, y - 8, -10, 10), 12, '#7e7468', { prof: 'leaf', nb: 2, a: .6 }));
    for (let i = 0; i < 3; i++) L.push(mk(line(x - 10 + i * 10, y + 6, x - 16 + i * 10, y + 20, 4), 2, RAIN, { prof: 'even', nb: 0, a: .8 }));
  }
  return L;
}
export const CARD_ROWS = [-108, -36, 36, 108];   // card-local y of the four notes
export const CARD_ICON_X = -72;
// The introduction card: a pale painted card, four icons, lines of painted writing. Centred at 0,0, 250×330.
export function buildCard() {
  return withSeed(1102, () => {
    const body = [], rows = [];
    fillStrokes(body, -125, -165, 125, 165, 32, CARD, { a: .55, nb: 3 });
    body.push(mk(line(126, -160, 126, 167, 10), 2.4, '#8b7355', { prof: 'even', nb: 0, a: .5, rough: .3 }));
    body.push(mk(line(-122, 167, 126, 167, 10), 2.4, '#8b7355', { prof: 'even', nb: 0, a: .5, rough: .3 }));
    body.push(mk(line(-96, -146, 40, -146, 10), 7, GOLD, { prof: 'even', nb: 2, a: .7 }));     // a title rule
    const kinds = ['moon', 'town', 'hill', 'storm'];
    CARD_ROWS.forEach((y, i) => {
      const L = icon(kinds[i], CARD_ICON_X, y);
      for (let j = 0; j < 2; j++) {   // painted writing (no legible words on the card)
        const x1 = 96 - rnd(0, 40) - j * 30, yy = y - 8 + j * 16;
        L.push(mk(qcurve(-36, yy, x1, yy + rnd(-1.5, 1.5), rnd(-2, 2), 10), 2.2, PENCIL, { prof: 'even', nb: 0, a: .55, rough: .45 }));
      }
      rows.push(L);
    });
    return { body, rows, spr: sprite([...body, ...rows.flat()]), bodySpr: sprite(body) };
  });
}

// The vermilion stamp: a small square seal with the step number knocked out in mono. The one accent.
export function stampSprite(n) {
  return withSeed(1200 + n, () => {
    const S = 64, cv = document.createElement('canvas'); cv.width = S + 16; cv.height = S + 16;
    const c = cv.getContext('2d'); c.translate(8, 8);
    c.beginPath();
    const P = [];
    for (let i = 0; i < 40; i++) {
      const s = i / 10, side = Math.floor(s), f = s - side, j = () => rnd(-1.6, 1.6);
      if (side === 0) P.push([f * S, j()]); else if (side === 1) P.push([S + j(), f * S]);
      else if (side === 2) P.push([S - f * S, S + j()]); else P.push([j(), S - f * S]);
    }
    P.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath();
    c.fillStyle = rgba(VERM, .9); c.fill();
    // uneven ink take: pale specks and a lighter corner
    c.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 160; i++) { c.fillStyle = `rgba(0,0,0,${rnd(.08, .4)})`; c.beginPath(); c.arc(rnd(0, S), rnd(0, S), rnd(.4, 1.8), 0, 7); c.fill(); }
    const g = c.createLinearGradient(0, 0, S, S); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.7, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.25)');
    c.fillStyle = g; c.fillRect(-4, -4, S + 8, S + 8);
    c.font = '400 40px "IBM Plex Mono"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#000';
    c.fillText(String(n), S / 2, S / 2 + 2);
    return cv;
  });
}
// land a stamp at (x,y): a quick press (scale 1.18 → 1, alpha in) over 0.14 s
export function drawStamp(c, cv, x, y, t, tl, size = 56) {
  if (t < tl) return;
  const p = seg(t, tl, tl + .14), s = (1 + .18 * (1 - eo(p))) * size / 64;
  c.save(); c.globalAlpha = c.globalAlpha * ss(p); c.translate(x, y); c.rotate(-.03); c.scale(s, s);
  c.drawImage(cv, -cv.width / 2, -cv.height / 2); c.restore();
}
