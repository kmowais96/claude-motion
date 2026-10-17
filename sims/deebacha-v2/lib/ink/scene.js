// Shots inside one ink section: locked frames on the paper, joined by ink-bloom transitions (the style's native move).
import { clamp, seg, eio, ss } from '/core/lib.js';
import { layers, present, bloom, cam, W, H } from './comp.js';
import { draw } from './ink.js';

// shots: [{cam: t => [s,tx,ty], paint: (L, t) => {}, until, tr = 1, c: [x, y], o: present options}]
export function runShots(ctx, t, shots) {
  let i = shots.findIndex(s => s.until == null || t < s.until);
  if (i < 0) i = shots.length - 1;
  const S = shots[i], prev = shots[i - 1];
  // a transition into shot i runs over [prev.until, prev.until + prev.tr]
  const L = layers('A'); L.clear();
  if (prev && t < prev.until + (prev.tr ?? 1)) {
    const u = seg(t, prev.until, prev.until + (prev.tr ?? 1));
    const ca = prev.cam(t); L.xf(...ca); prev.paint(L, t);
    const LB = layers('B'); LB.clear(); const cb = S.cam(t); LB.xf(...cb); S.paint(LB, t);
    const c = prev.c || [W / 2, H / 2];
    bloom(L, LB, c[0], c[1], Math.pow(eio(u) * .85 + u * .15, 1.15) * W * 1.55);
    present(ctx, L, cb, S.o || {});
    return;
  }
  const c = S.cam(t); L.xf(...c); S.paint(L, t);
  present(ctx, L, c, S.o || {});
}

// slow push-in: scale from 1 to 1 + k over [a, b], around (fx, fy)
export const push = (a, b, k = .03, fx = W / 2, fy = H / 2) => t => cam(1 + k * ss(seg(t, a, b)), fx, fy);

// several strokes painted at once, each with its own delay (0..1 of the group's time) and span
export function concurrent(I, strokes, delays, p, span = .6, am = 1) {
  strokes.forEach((s, j) => draw(I, s, (p - delays[j] * (1 - span)) / span, am));
}
export { clamp, seg };

// Ink creeping in from the frame edges (a dark thought): k 0..1, drawn into the wet layer in screen space.
import { vn2 } from './land.js';
const QW = 480, QH = 270;
let EN = null, EC = null, EF = null;
export function creep(L, k, am = .62) {
  if (k <= 0) return;
  if (!EN) {
    EN = new Float32Array(QW * QH);
    for (let y = 0; y < QH; y++) for (let x = 0; x < QW; x++) { const u = x * .8 + y * .6, v = -x * .6 + y * .8; EN[y * QW + x] = vn2(u * .022 + 4, v * .022) * .65 + vn2(u * .061, v * .061 + 8) * .35; }
    EC = document.createElement('canvas'); EC.width = QW; EC.height = QH;
    EF = document.createElement('canvas'); EF.width = W; EF.height = H;
  }
  const c = EC.getContext('2d'), im = c.createImageData(QW, QH), D = im.data, reach = .03 + .13 * k;
  for (let y = 0; y < QH; y++) for (let x = 0; x < QW; x++) {
    const i = y * QW + x, ex = Math.min(x, QW - 1 - x) / QW, ey = Math.min(y * 1.1, (QH - 1 - y) * 2.4) / QH, e = Math.min(ex, ey) + Math.hypot(Math.max(0, .12 - ex), Math.max(0, .1 - ey)) * -.3;
    const v = clamp((reach - e - (EN[i] - .5) * .2) / .12);
    D[i * 4 + 3] = Math.pow(v, 1.6) * 255;
  }
  c.putImageData(im, 0, 0);
  const f = EF.getContext('2d'); f.clearRect(0, 0, W, H); f.drawImage(EC, 0, 0, W, H);
  const w = L.cw; w.save(); w.setTransform(1, 0, 0, 1, 0, 0); w.globalAlpha = am * clamp(k * 3); w.drawImage(EF, 0, 0); w.restore();
}
