// Rice-paper compositor in Canvas 2D (replaces the demo's WebGL comp.js, which runs on SwiftShader here).
// Three layers per picture, as in the demo: wet (bleeds, edge pigment, granulation), dry (paper tooth), col (vermilion).
// Paper is procedural, built once and cached; the wet pass runs at half resolution.
import { clamp, lerp, mulberry } from '/core/lib.js';
import { vn2 } from './land.js';

export const W = 1920, H = 1080, M = 140;          // paper margin so the camera can push/pan a little
const HW = W / 2, HH = H / 2;
export const PAPER_RGB = [242, 236, 222];
export const INK_RGB = [20, 18, 17];
const mkc = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

const fbm2 = (x, y) => vn2(x, y) * .5 + vn2(x * 2.07 + 5.1, y * 2.07 + 1.3) * .3 + vn2(x * 4.3 + 9, y * 4.3 + 3) * .2;

// ---- paper (built once) --------------------------------------------------
let PAPER = null, TOOTH = null, GRAN = null;
export function paper() {
  if (PAPER) return PAPER;
  const PW = W + 2 * M, PH = H + 2 * M;
  // cloud mottling at 1/8 res, upscaled
  const cw = Math.ceil(PW / 8), ch = Math.ceil(PH / 8), cl = mkc(cw, ch), cx = cl.getContext('2d'), ci = cx.createImageData(cw, ch);
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
    const n = fbm2(x * .022 + 3, y * .022) - .5, n2 = fbm2(x * .09 + 11, y * .09 + 4) - .5;
    const k = 1 + n * .075 + n2 * .03, i = (y * cw + x) * 4;
    ci.data[i] = PAPER_RGB[0] * k; ci.data[i + 1] = PAPER_RGB[1] * k; ci.data[i + 2] = PAPER_RGB[2] * k * (1 - n * .01); ci.data[i + 3] = 255;
  }
  cx.putImageData(ci, 0, 0);
  const pc = mkc(PW, PH), c = pc.getContext('2d');
  c.imageSmoothingEnabled = true; c.drawImage(cl, 0, 0, PW, PH);
  // fine grain (static: it is the paper, anchored to the sheet)
  const img = c.getImageData(0, 0, PW, PH), D = img.data, R = mulberry(77);
  for (let i = 0; i < D.length; i += 4) { const g = (R() - .5) * 7; D[i] += g; D[i + 1] += g; D[i + 2] += g * .9; }
  c.putImageData(img, 0, 0);
  // long fibres in three directions, pulp flecks
  const F = mulberry(19);
  c.lineCap = 'round';
  for (let i = 0; i < 2600; i++) {
    const x = F() * PW, y = F() * PH, a = [.35, 2.1, 1.2][i % 3] + (F() - .5) * .5, L = 20 + F() * 90, bend = (F() - .5) * 14;
    c.strokeStyle = i % 5 ? `rgba(255,252,244,${.16 + F() * .22})` : `rgba(150,138,118,${.05 + F() * .07})`;
    c.lineWidth = .6 + F() * .9;
    c.beginPath(); c.moveTo(x, y);
    c.quadraticCurveTo(x + Math.cos(a) * L / 2 - Math.sin(a) * bend, y + Math.sin(a) * L / 2 + Math.cos(a) * bend, x + Math.cos(a) * L, y + Math.sin(a) * L); c.stroke();
  }
  for (let i = 0; i < 900; i++) { c.fillStyle = `rgba(120,108,90,${.05 + F() * .12})`; c.beginPath(); c.arc(F() * PW, F() * PH, .5 + F() * 1.4, 0, 7); c.fill(); }
  // vignette (light) + warm old-paper tone
  const g = c.createRadialGradient(PW / 2, PH / 2, H * .35, PW / 2, PH / 2, PW * .62);
  g.addColorStop(0, 'rgba(90,70,40,0)'); g.addColorStop(1, 'rgba(90,70,40,.17)');
  c.fillStyle = g; c.fillRect(0, 0, PW, PH);
  PAPER = pc;
  // paper tooth mask for the dry layer (screen space)
  TOOTH = mkc(W, H); const tc = TOOTH.getContext('2d'), ti = tc.createImageData(W, H), T = ti.data;
  for (let y = 0; y < H; y += 1) for (let x = 0; x < W; x += 1) {
    const n = vn2(x * .55 + 3, y * .55), f = vn2(x * .02, y * 1.1 + 9) * .5 + vn2(x * 1.1 + 4, y * .02) * .5;
    const a = Math.max(0, (n - .66) / .26) * .5 + Math.max(0, f - .72) * .8;
    T[(y * W + x) * 4 + 3] = Math.min(255, a * 255);
  }
  tc.putImageData(ti, 0, 0);
  // granulation for the wet pass (half res)
  GRAN = new Float32Array(HW * HH);
  for (let y = 0; y < HH; y++) for (let x = 0; x < HW; x++) GRAN[y * HW + x] = .86 + .26 * fbm2(x * .06 + 1, y * .06 + 2) + .1 * (vn2(x * .7, y * .7) - .5);
  return PAPER;
}

// ---- layers ----------------------------------------------------------------
export function layerSet() {
  const wet = mkc(W, H), dry = mkc(W, H), col = mkc(W, H);
  const L = { wet, dry, col, cw: wet.getContext('2d'), cd: dry.getContext('2d'), cc: col.getContext('2d') };
  L.ink = { wet: L.cw, dry: L.cd, col: L.cc };
  L.all = [L.cw, L.cd, L.cc];
  L.clear = () => { for (const c of L.all) { c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.filter = 'none'; c.clearRect(0, 0, W, H); } };
  L.xf = (s = 1, tx = 0, ty = 0) => { for (const c of L.all) c.setTransform(s, 0, 0, s, tx, ty); };
  return L;
}
const POOL = {};
export const layers = k => POOL[k] || (POOL[k] = layerSet());

// camera: scale s around (fx, fy) in world px, plus offset; returns [s, tx, ty]
export function cam(s = 1, fx = W / 2, fy = H / 2, dx = 0, dy = 0) { return [s, fx - fx * s + dx, fy - fy * s + dy]; }

// ---- ink bloom transition between two pictures inside a section ------------------
const QW = 480, QH = 270;
let BN = null, MASK = null, MASKF = null, RING = null, RINGF = null;
function bloomNoise() {
  if (BN) return;
  BN = new Float32Array(QW * QH);
  for (let y = 0; y < QH; y++) for (let x = 0; x < QW; x++) BN[y * QW + x] = fbm2(x * .022 + 2, y * .022) * .7 + fbm2(x * .07 + 9, y * .07) * .2;
  MASK = mkc(QW, QH); MASKF = mkc(W, H); RING = mkc(QW, QH); RINGF = mkc(W, H);
}
// B grows inside a spreading drop centred (cx, cy) (screen px) of radius R; dark tide line at the front.
export function bloom(LA, LB, cx, cy, R) {
  bloomNoise();
  const mc = MASK.getContext('2d'), rc = RING.getContext('2d'), mi = mc.createImageData(QW, QH), ri = rc.createImageData(QW, QH);
  const qx = cx / 4, qy = cy / 4, qr = R / 4, bw = qr * .05 + 3.5;
  for (let y = 0; y < QH; y++) for (let x = 0; x < QW; x++) {
    const i = y * QW + x, d = Math.hypot(x - qx, y - qy) * (.72 + BN[i]);
    const m = 1 - clamp((d - qr * .9) / (qr * .1 + 1e-3));
    mi.data[i * 4 + 3] = m * 255;
    const b = Math.exp(-Math.pow((d - qr * .95) / bw, 2));
    ri.data[i * 4 + 3] = b * 255;
  }
  mc.putImageData(mi, 0, 0); rc.putImageData(ri, 0, 0);
  const mf = MASKF.getContext('2d'); mf.clearRect(0, 0, W, H); mf.imageSmoothingEnabled = true; mf.drawImage(MASK, 0, 0, W, H);
  for (const [a, b] of [[LA.cw, LB.cw], [LA.cd, LB.cd], [LA.cc, LB.cc]]) {
    a.save(); a.setTransform(1, 0, 0, 1, 0, 0); a.globalAlpha = 1;
    a.globalCompositeOperation = 'destination-out'; a.drawImage(MASKF, 0, 0);
    b.save(); b.setTransform(1, 0, 0, 1, 0, 0); b.globalCompositeOperation = 'destination-in'; b.drawImage(MASKF, 0, 0); b.restore();
    a.globalCompositeOperation = 'source-over'; a.drawImage(b.canvas, 0, 0); a.restore();
  }
  // tide line goes into the wet layer, fading as the drop grows past the frame
  const k = clamp(R / 60) * (1 - clamp((R - W * 1.05) / (W * .4)));
  if (k > 0) { const w = LA.cw; w.save(); w.setTransform(1, 0, 0, 1, 0, 0); w.globalAlpha = .32 * k; w.drawImage(RING, 0, 0, W, H); w.restore(); }
}

// ---- present -------------------------------------------------------------------
const HA = mkc(HW, HH), HB = mkc(HW, HH), HO = mkc(HW, HH), TMP = mkc(W, H);
// L: layer set already drawn (screen space). c: [s, tx, ty] camera for the paper. o: {bleed, rim, darken}
export function present(ctx, L, c = [1, 0, 0], o = {}) {
  paper();
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
  ctx.fillStyle = `rgb(${PAPER_RGB.join(',')})`; ctx.fillRect(0, 0, W, H);
  ctx.setTransform(c[0], 0, 0, c[0], c[1], c[2]);
  ctx.drawImage(PAPER, -M, -M);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  // wet: two blurs at half res → body + edge pigment + granulation
  const bl = (o.bleed ?? 5) / 2, rim = o.rim ?? .9;
  const a = HA.getContext('2d', { willReadFrequently: true }), b = HB.getContext('2d', { willReadFrequently: true });
  a.clearRect(0, 0, HW, HH); b.clearRect(0, 0, HW, HH);
  a.filter = `blur(${bl * .55}px)`; a.drawImage(L.wet, 0, 0, HW, HH); a.filter = 'none';
  b.filter = `blur(${bl * 1.5}px)`; b.drawImage(L.wet, 0, 0, HW, HH); b.filter = 'none';
  const A = a.getImageData(0, 0, HW, HH).data, B = b.getImageData(0, 0, HW, HH).data;
  const oc = HO.getContext('2d'), oi = oc.createImageData(HW, HH), O = oi.data;
  for (let i = 0, j = 0; j < GRAN.length; i += 4, j++) {
    const av = A[i + 3], bv = B[i + 3];
    if (av === 0 && bv === 0) continue;
    const g = GRAN[j], aa = av / 255, bb = bv / 255;
    const v = aa * g + Math.max(0, aa - bb) * rim * (g + .3) + bb * .1;
    O[i] = INK_RGB[0]; O[i + 1] = INK_RGB[1]; O[i + 2] = INK_RGB[2]; O[i + 3] = Math.min(255, v * 255);
  }
  oc.putImageData(oi, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(HO, 0, 0, W, H);
  // dry: paper tooth bites the ink
  const d = L.cd; d.save(); d.setTransform(1, 0, 0, 1, 0, 0); d.globalCompositeOperation = 'destination-out'; d.globalAlpha = .55; d.drawImage(TOOTH, 0, 0); d.restore();
  // ink colour: the dry layer is drawn black; tint toward warm black
  const t = TMP.getContext('2d'); t.clearRect(0, 0, W, H); t.globalCompositeOperation = 'source-over'; t.drawImage(L.dry, 0, 0);
  t.globalCompositeOperation = 'source-in'; t.fillStyle = `rgb(${INK_RGB.join(',')})`; t.fillRect(0, 0, W, H); t.globalCompositeOperation = 'source-over';
  ctx.drawImage(TMP, 0, 0);
  // colour (vermilion), printed into the paper
  ctx.globalAlpha = .95; ctx.drawImage(L.col, 0, 0); ctx.globalAlpha = 1;
  if (o.darken) { ctx.fillStyle = `rgba(0,0,0,${o.darken})`; ctx.fillRect(0, 0, W, H); }
  ctx.restore();
}

// ---- cached stroke groups ------------------------------------------------------
// A group of strokes painted once at p = 1 into cropped wet/dry canvases; while still being painted it draws live.
import { draw, drawSeq } from './ink.js';
export function group(strokes, o = {}) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const s of strokes) for (let i = 0; i < s.n; i++) { const p = s.P[i], r = s.ws[i] + 4; x0 = Math.min(x0, p[0] - r); y0 = Math.min(y0, p[1] - r); x1 = Math.max(x1, p[0] + r); y1 = Math.max(y1, p[1] + r); }
  x0 = Math.floor(x0 - 6); y0 = Math.floor(y0 - 6); x1 = Math.ceil(x1 + 6); y1 = Math.ceil(y1 + 6);
  const G = { strokes, x0, y0, x1, y1, cache: null, overlap: o.overlap ?? .15, extra: o.extra || null };
  G.build = () => {
    const w = Math.max(2, x1 - x0), h = Math.max(2, y1 - y0);
    const cv = { wet: mkc(w, h), dry: mkc(w, h), col: mkc(w, h) };
    const I = { wet: cv.wet.getContext('2d'), dry: cv.dry.getContext('2d'), col: cv.col.getContext('2d') };
    for (const k in I) I[k].setTransform(1, 0, 0, 1, -x0, -y0);
    for (const s of strokes) draw(I, s, 1, 1);
    if (G.extra) G.extra(I, 1);
    G.cache = cv;
  };
  // p: 0..1 painting progress (strokes in order); am: opacity
  G.paint = (L, p = 1, am = 1) => {
    if (p <= 0 || am <= 0) return;
    if (p >= 1) {
      if (!G.cache) G.build();
      for (const k of ['wet', 'dry', 'col']) { const c = L.ink[k]; c.globalAlpha = clamp(am); c.drawImage(G.cache[k], x0, y0); c.globalAlpha = 1; }
    } else { if (o.live) o.live(L.ink, p, am); else drawSeq(L.ink, strokes, p, am, G.overlap); if (G.extra) G.extra(L.ink, p, am); }
  };
  return G;
}
