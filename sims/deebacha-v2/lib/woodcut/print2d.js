// Woodcut · Canvas 2D printer and plate frame (a port of the demo's WebGL compositor look).
// Two working canvases per frame: MASK (black = uncut wood, white = cut) and PLATE (alpha = copper density).
// print(): laid paper → copper plate (mottled, misregistered) multiplied in → mask multiplied (ink) →
// cached ink texture via 'lighten' (±6 % unevenness, grain streaks, specks where ink didn't take).
import { mulberry, hash, clamp } from '/core/lib.js';

export const W = 1920, H = 1080;
export const IMG = { x: 48, y: 46, w: 1824, h: 874 };          // printed image area; captions sit in the margin below
export const PAPER = [239, 232, 216], INK = [20, 18, 16], COPPER = '#C2471C';

const mk = (w = W, h = H) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
export const [M, m] = mk(), [C, c] = mk();
const [PC, pc] = mk();

// smooth value noise on a lattice (deterministic)
const vn2 = (x, y, s) => {
  const i = Math.floor(x), j = Math.floor(y), f = x - i, g = y - j, u = f * f * (3 - 2 * f), v = g * g * (3 - 2 * g);
  const h = (a, b) => hash(a * 12.9898 + b * 78.233 + s * 37.7);
  return (h(i, j) * (1 - u) + h(i + 1, j) * u) * (1 - v) + (h(i, j + 1) * (1 - u) + h(i + 1, j + 1) * u) * v;
};
const fbm = (x, y, s) => vn2(x, y, s) * .5 + vn2(x * 2.03 + 5, y * 2.03 + 9, s) * .25 + vn2(x * 4.1 + 2, y * 4.1 + 7, s) * .125 + vn2(x * 8.3, y * 8.3, s) * .0625;

let tex = null;
function build() {
  if (tex) return tex;
  // paper: cloud + laid-line fibres + fine tooth, built at full res once
  const [P, p] = mk(), id = p.createImageData(W, H), d = id.data;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const cl = fbm(x * .0035, y * .0035, 1) - .47;
    const fib = vn2(x * .9, y * .035, 2) + vn2(x * .03 + y * .02, y * .7, 3) - 1;
    const laid = Math.sin(y * .62) * .006;
    const k = 1 + .05 * cl + .02 * fib + laid + .016 * (hash(x * .37 + y * 91.1) - .5);
    const o = (y * W + x) * 4; d[o] = PAPER[0] * k; d[o + 1] = PAPER[1] * k; d[o + 2] = PAPER[2] * k; d[o + 3] = 255;
  }
  p.putImageData(id, 0, 0);
  // ink texture, larger than the frame so each impression can sample it at its own offset
  const IW = 1104, IH = 660, [I0, i0] = mk(IW, IH), jd = i0.createImageData(IW, IH), e = jd.data;
  for (let y = 0; y < IH; y++) for (let x = 0; x < IW; x++) {
    const dens = .5 + .5 * (fbm(x * .008, y * .008, 4) - .47) * 2;                  // broad unevenness
    const grain = Math.max(0, vn2(x * .006, y * 1.1, 5) - .62) / .38;              // horizontal grain streaks
    const sp = vn2(x * .9, y * .9, 6) > .9 && fbm(x * .015, y * .015, 7) > .5 ? 1 : 0; // specks
    const k = 1 + .5 * dens + 1.4 * grain * grain;
    const o = (y * IW + x) * 4;
    for (let ch = 0; ch < 3; ch++) e[o + ch] = Math.min(150, INK[ch] * k + sp * 55);
    e[o + 3] = 255;
  }
  i0.putImageData(jd, 0, 0);
  const [I, ic] = mk(IW * 2, IH * 2); ic.imageSmoothingEnabled = true; ic.drawImage(I0, 0, 0, IW * 2, IH * 2);
  // plate mottle: alpha where the copper didn't take
  const [MO, mo] = mk(W / 2, H / 2), md = mo.createImageData(W / 2, H / 2), f = md.data;
  for (let y = 0; y < H / 2; y++) for (let x = 0; x < W / 2; x++) {
    const a = .05 + .16 * clamp((fbm(x * .02, y * .02, 8) - .4) * 2.2) + .22 * (vn2(x * .12, y * .12, 9) > .82 ? 1 : 0);
    const o = (y * W / 2 + x) * 4; f[o] = f[o + 1] = f[o + 2] = 0; f[o + 3] = a * 255;
  }
  mo.putImageData(md, 0, 0);
  // ragged block edge
  const rnd = mulberry(77), edge = new Path2D(), pts = [];
  const { x: X, y: Y, w: Wd, h: Hd } = IMG, j = (u, s) => (vn2(u * .05, s, 10) - .5) * 4 + (rnd() - .5) * 1.2;
  for (let x = X; x < X + Wd; x += 6) pts.push([x, Y + j(x, 1)]);
  for (let y = Y; y < Y + Hd; y += 6) pts.push([X + Wd + j(y, 2), y]);
  for (let x = X + Wd; x > X; x -= 6) pts.push([x, Y + Hd + j(x, 3)]);
  for (let y = Y + Hd; y > Y; y -= 6) pts.push([X + j(y, 4), y]);
  edge.moveTo(...pts[0]); for (const q of pts) edge.lineTo(...q); edge.closePath();
  return (tex = { P, I, MO, edge });
}

export function camMatrix(cam) {
  const z = cam.z ?? 1, r = cam.r ?? 0, cs = Math.cos(r) * z, sn = Math.sin(r) * z;
  const ox = IMG.x + IMG.w / 2 + (cam.dx ?? 0), oy = IMG.y + IMG.h / 2 + (cam.dy ?? 0);
  const x = cam.x ?? ox, y = cam.y ?? oy;
  return [cs, sn, -sn, cs, ox - (cs * x - sn * y), oy - (sn * x + cs * y)];
}

// misregistration jolt of a fresh impression: two frames of offset, then back
export function jolt(t, tc) {
  const f = Math.floor((t - tc) * 24);
  return f === 0 ? [5, -3] : f === 1 ? [-2, 1] : [0, 0];
}

// start a plate: paper everywhere, black wood inside the ragged block edge, camera applied
export function begin(cam = {}) {
  const T = build();
  m.setTransform(1, 0, 0, 1, 0, 0); c.setTransform(1, 0, 0, 1, 0, 0);
  m.globalCompositeOperation = c.globalCompositeOperation = 'source-over'; m.globalAlpha = c.globalAlpha = 1;
  m.fillStyle = '#fff'; m.fillRect(0, 0, W, H); c.clearRect(0, 0, W, H);
  for (const g of [m, c]) { g.save(); g.clip(T.edge); g.transform(...camMatrix(cam)); }
  m.fillStyle = '#000'; m.fillRect(-6000, -6000, 14000, 14000);
}
export function end() { m.restore(); c.restore(); m.setTransform(1, 0, 0, 1, 0, 0); c.setTransform(1, 0, 0, 1, 0, 0); }

// pull the print onto ctx. o: { imp (impression id → ink offset), reg:[dx,dy], plate:false to skip }
export function print(ctx, o = {}) {
  const T = build(), imp = o.imp ?? 0;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over'; ctx.drawImage(T.P, 0, 0);
  if (o.plate !== false) {
    pc.globalCompositeOperation = 'source-over'; pc.clearRect(0, 0, W, H);
    pc.drawImage(C, 0, 0);
    pc.globalCompositeOperation = 'source-in'; pc.fillStyle = o.plateColor || COPPER; pc.fillRect(0, 0, W, H);
    pc.globalCompositeOperation = 'destination-out'; pc.drawImage(T.MO, (imp * 37) % 40 - 20, (imp * 23) % 30 - 15, W + 40, H + 30);
    ctx.globalCompositeOperation = 'multiply';
    const [rx, ry] = o.reg || [3, 2]; ctx.drawImage(PC, rx, ry);
  }
  ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(M, 0, 0);
  ctx.globalCompositeOperation = 'lighten';
  const ox = (imp * 131) % 280, oy = (imp * 71) % 230;
  ctx.drawImage(T.I, ox, oy, W, H, 0, 0, W, H);
  ctx.restore();
}
