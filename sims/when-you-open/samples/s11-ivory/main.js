// Scene 11 · The First Page, in the ivory design: the same mushaf and the same resting light as the opening;
// this time the cover opens on its spine and the first page lies in the daylight. No elaborate effects.
import { estimate } from './timing.js';
import { makeLife } from './life.js';
const W = 1920, H = 1080, C = document.getElementById('c'), X = C.getContext('2d');
const TAU = Math.PI * 2;
const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
let seed = 9; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const cl = x => Math.max(0, Math.min(1, x)), io = x => { x = cl(x); return x * x * (3 - 2 * x); }, lerp = (a, b, k) => a + (b - a) * k;
const GRAIN = (() => { const c = mk(), g = c.getContext('2d'), d = g.createImageData(W, H); for (let i = 0; i < d.data.length; i += 4) { const v = 128 + (rnd() - .5) * 60; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } g.putImageData(d, 0, 0); return c; })();
const BEAM = mk(), SHADOW = mk();
function star8(g, x, y, r, inner = .42) { for (let j = 0; j < 16; j++) { const a = j * Math.PI / 8 - Math.PI / 2, rr = j % 2 ? r * inner : r; j ? g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : g.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); }
function khatam(g, x, y, r) { for (const a of [0, Math.PI / 4]) { g.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); for (let k = 1; k < 4; k++) g.lineTo(x + Math.cos(a + k * Math.PI / 2) * r, y + Math.sin(a + k * Math.PI / 2) * r); g.closePath(); } }

// ---------- the cover, built once: dark cloth, a gold-tooled border, corner pieces and a central lobed medallion with pendants
const BW = 340, BH = 460;
const R = 4;   // the book is drawn at four times its size so close-ups stay sharp
const cvs = () => { const c = document.createElement('canvas'); c.width = BW * R; c.height = BH * R; c.getContext('2d').scale(R, R); return c; };
const GOLD = cvs(), COVER = cvs(), SHEEN = cvs();
function lobed(g, x, y, rx, ry, n, depth) { for (let k = 0; k <= 200; k++) { const a = k / 200 * TAU, r = 1 + depth * Math.pow(Math.abs(Math.cos(a * n / 2)), 6); const px = x + Math.sin(a) * rx * r, py = y - Math.cos(a) * ry * r; k ? g.lineTo(px, py) : g.moveTo(px, py); } g.closePath(); }
function almond(g, x, y, rx, ry) { g.moveTo(x, y - ry); g.bezierCurveTo(x + rx * 1.05, y - ry * .45, x + rx * 1.05, y + ry * .45, x, y + ry); g.bezierCurveTo(x - rx * 1.05, y + ry * .45, x - rx * 1.05, y - ry * .45, x, y - ry); g.closePath(); }
function rosette(g, x, y, r, n) { for (let k = 0; k < n; k++) { const a = k / n * TAU; g.save(); g.translate(x, y); g.rotate(a); g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(r * .25, -r * .25, r * .55, -r * .2, r, 0); g.bezierCurveTo(r * .55, r * .2, r * .25, r * .25, 0, 0); g.stroke(); g.restore(); } }
function scroll(g, x, y, s, rot) { g.save(); g.translate(x, y); g.rotate(rot); g.beginPath(); for (let k = 0; k <= 40; k++) { const a = k / 40 * TAU * .9, r = s * (1 - k / 52); const px = Math.cos(a) * r, py = Math.sin(a) * r; k ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke(); g.beginPath(); g.moveTo(s, 0); g.quadraticCurveTo(s * 1.6, -s * .5, s * 2.1, -s * .1); g.stroke(); g.restore(); }
(() => {
  const g = GOLD.getContext('2d'); g.strokeStyle = g.fillStyle = '#fff'; g.lineCap = 'round'; g.lineJoin = 'round';
  // border: outer and inner rules with a band of interlaced scrolls between
  const o = 14, b = 34; g.lineWidth = 2; g.strokeRect(o, o, BW - 2 * o, BH - 2 * o); g.lineWidth = 1; g.strokeRect(o + 4, o + 4, BW - 2 * o - 8, BH - 2 * o - 8);
  g.lineWidth = 2; g.strokeRect(o + b, o + b, BW - 2 * (o + b), BH - 2 * (o + b)); g.lineWidth = 1; g.strokeRect(o + b - 4, o + b - 4, BW - 2 * (o + b) + 8, BH - 2 * (o + b) + 8);
  g.lineWidth = 1.3; const m = o + 4 + (b - 8) / 2;
  for (let x = o + 16; x < BW - o - 10; x += 14) { scroll(g, x, m - 3, 5, 0); scroll(g, x + 7, m + 4, 5, Math.PI); scroll(g, x, BH - m + 3, 5, Math.PI); scroll(g, x + 7, BH - m - 4, 5, 0); }
  for (let y = o + 16; y < BH - o - 10; y += 14) { scroll(g, m - 3, y, 5, Math.PI / 2); scroll(g, m + 4, y + 7, 5, -Math.PI / 2); scroll(g, BW - m + 3, y, 5, -Math.PI / 2); scroll(g, BW - m - 4, y + 7, 5, Math.PI / 2); }
  // corner pieces: quarter medallions in the inner field
  const fx0 = o + b, fy0 = o + b, fx1 = BW - o - b, fy1 = BH - o - b;
  for (const [x, y, a] of [[fx0, fy0, 0], [fx1, fy0, Math.PI / 2], [fx1, fy1, Math.PI], [fx0, fy1, -Math.PI / 2]]) {
    g.save(); g.translate(x, y); g.rotate(a); g.beginPath(); g.moveTo(0, 0); g.lineTo(52, 0); g.quadraticCurveTo(46, 40, 0, 52); g.closePath(); g.lineWidth = 1.6; g.stroke();
    g.lineWidth = 1; scroll(g, 14, 14, 7, .6); g.beginPath(); g.moveTo(4, 30); g.quadraticCurveTo(20, 20, 30, 4); g.stroke(); g.restore(); }
  // central medallion: a lobed almond, a pendant above and below, a rosette inside
  const cx = BW / 2, cy = BH / 2, rx = 72, ry = 112;
  g.lineWidth = 2.2; g.beginPath(); almond(g, cx, cy, rx + 8, ry + 10); g.stroke();
  g.lineWidth = 1.2; g.beginPath(); almond(g, cx, cy, rx, ry); g.stroke();
  // scalloped edge: small lobes along the outer almond
  for (let k = 0; k < 44; k++) { const u = k / 44, a = u * TAU, px = cx + Math.sin(a) * (rx + 13) * (Math.abs(Math.sin(a)) < .2 ? 1 : 1), py = cy - Math.cos(a) * (ry + 16);
    const q = Math.abs(Math.cos(a)); const ex = cx + Math.sin(a) * (rx + 8) * (1 - .25 * q * q) + Math.sin(a) * 5, ey = cy - Math.cos(a) * (ry + 10) - Math.cos(a) * 5; g.beginPath(); g.arc(ex, ey, 4.2, 0, TAU); g.stroke(); }
  // dense interlace inside the medallion
  g.save(); g.beginPath(); almond(g, cx, cy, rx - 3, ry - 3); g.clip(); g.lineWidth = .9;
  for (let y = cy - ry; y < cy + ry; y += 15) for (let x = cx - rx; x < cx + rx; x += 15) scroll(g, x + ((y / 15) % 2 ? 7 : 0), y, 4.5, ((x + y) / 15) % 4 * Math.PI / 2);
  g.restore(); g.save(); g.fillStyle = '#000'; g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(cx, cy, 50, 0, TAU); g.fill(); g.restore();
  for (const d of [-1, 1]) { const py = cy + d * (ry + 24); g.lineWidth = 1.6; g.beginPath(); g.moveTo(cx, cy + d * (ry + 10)); g.lineTo(cx, py); g.stroke();
    g.beginPath(); almond(g, cx, py + d * 14, 11, 16); g.stroke(); g.beginPath(); g.arc(cx, py + d * 14, 3, 0, TAU); g.fill(); }
  g.lineWidth = 1.2; g.beginPath(); g.arc(cx, cy, 50, 0, TAU); g.stroke(); g.lineWidth = 1; rosette(g, cx, cy, 44, 12); rosette(g, cx, cy, 28, 8); g.beginPath(); g.arc(cx, cy, 10, 0, TAU); g.stroke(); g.beginPath(); g.arc(cx, cy, 4, 0, TAU); g.fill();
  // colour the gold and lay it on the cloth
  const c = COVER.getContext('2d'), cl = c.createLinearGradient(0, 0, BW, BH); cl.addColorStop(0, '#1d2433'); cl.addColorStop(1, '#0e121b'); c.fillStyle = cl; c.fillRect(0, 0, BW, BH);
  c.fillStyle = 'rgba(255,255,255,.05)'; c.fillRect(BW - 10, 0, 10, BH);                                         // spine edge: a mushaf's spine is on the right
  const gd = cvs(), gg = gd.getContext('2d'); gg.drawImage(GOLD, 0, 0, BW, BH); gg.globalCompositeOperation = 'source-in';
  const gl = gg.createLinearGradient(0, 0, BW, BH); gl.addColorStop(0, '#e8c97a'); gl.addColorStop(.45, '#b88d3e'); gl.addColorStop(1, '#8a6528'); gg.fillStyle = gl; gg.fillRect(0, 0, BW, BH);
  c.drawImage(gd, 0, 0, BW, BH);
})();

// the first page: cream paper inside an illuminated frame; the text is shown only as soft abstract bands
const FLY = cvs(), PAGE_L = cvs(), PAGE_R = cvs(), INSIDE = cvs();
// the opening spread: two illuminated pages, lapis and gold frames, an empty header cartouche, abstract lines of text
function page(cv, side, rows, sd) {
  const g = cv.getContext('2d'); g.fillStyle = '#f3ead6'; g.fillRect(0, 0, BW, BH);
  const gold = g.createLinearGradient(0, 0, BW, BH); gold.addColorStop(0, '#e2c172'); gold.addColorStop(.5, '#c39a47'); gold.addColorStop(1, '#9c7531');
  const fx = side > 0 ? 26 : 40, fy = 40, fw = BW - 66, fh = BH - 80, b = 20;
  // margin medallion on the outer edge
  const mx = side > 0 ? fx + fw + 2 : fx - 2, my = BH / 2;
  g.fillStyle = gold; g.beginPath(); for (let i = 0; i < 24; i++) { const a = i / 24 * TAU, r = i % 2 ? 17 : 21; g.lineTo(mx + Math.cos(a) * r, my + Math.sin(a) * r); } g.closePath(); g.fill();
  g.fillStyle = '#21407a'; g.beginPath(); g.arc(mx, my, 12, 0, TAU); g.fill(); g.fillStyle = gold; g.beginPath(); g.arc(mx, my, 4, 0, TAU); g.fill();
  // frame band: lapis with small gold rosettes between gold rules
  g.fillStyle = '#21407a'; g.fillRect(fx, fy, fw, fh); g.fillStyle = '#f3ead6'; g.fillRect(fx + b, fy + b, fw - 2 * b, fh - 2 * b);
  g.strokeStyle = gold; g.lineWidth = 2; g.strokeRect(fx, fy, fw, fh); g.strokeRect(fx + b, fy + b, fw - 2 * b, fh - 2 * b); g.lineWidth = 1; g.strokeRect(fx + 3, fy + 3, fw - 6, fh - 6);
  const ros = (x, y) => { g.fillStyle = gold; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; g.beginPath(); g.arc(x + Math.cos(a) * 3.4, y + Math.sin(a) * 3.4, 1.7, 0, TAU); g.fill(); } g.fillStyle = '#f0dca0'; g.beginPath(); g.arc(x, y, 1.6, 0, TAU); g.fill(); };
  const nx = Math.round((fw - b) / 18), ny = Math.round((fh - b) / 18);
  for (let i = 0; i <= nx; i++) { const x = fx + b / 2 + i * (fw - b) / nx; ros(x, fy + b / 2); ros(x, fy + fh - b / 2); }
  for (let i = 1; i < ny; i++) { const y = fy + b / 2 + i * (fh - b) / ny; ros(fx + b / 2, y); ros(fx + fw - b / 2, y); }
  // inner panel with a fine gold rule
  const ix = fx + b + 8, iy = fy + b + 8, iw = fw - 2 * b - 16, ih = fh - 2 * b - 16; g.strokeStyle = gold; g.lineWidth = 1; g.strokeRect(ix, iy, iw, ih);
  // header cartouche, lobed at both ends, left empty of words
  const hy = iy + 10, hh = 34, hx = ix + 14, hw = iw - 28, r = hh / 2;
  const cart = (inset) => { g.beginPath(); g.moveTo(hx + r + inset, hy + inset); g.lineTo(hx + hw - r - inset, hy + inset); g.arc(hx + hw - r, hy + r, r - inset, -Math.PI / 2, Math.PI / 2); g.lineTo(hx + r + inset, hy + hh - inset); g.arc(hx + r, hy + r, r - inset, Math.PI / 2, Math.PI * 1.5); g.closePath(); };
  g.fillStyle = gold; cart(0); g.fill(); g.fillStyle = '#21407a'; cart(3); g.fill(); g.fillStyle = gold; cart(9); g.fill(); g.fillStyle = '#2c4f8f'; cart(11); g.fill();
  for (let i = 0; i < 7; i++) { g.fillStyle = gold; g.beginPath(); g.arc(hx + r + 10 + i * (hw - 2 * r - 20) / 6, hy + r, 2.2, 0, TAU); g.fill(); }
  // lines of text, right to left, spaced wide as on the opening pages of a mushaf
  seed = sd; g.fillStyle = 'rgba(38,30,24,.62)'; const ty = hy + hh + 26, step = (iy + ih - 18 - ty) / (rows - 1);
  for (let k = 0; k < rows; k++) { const y = ty + k * step; let x = ix + iw - 16; while (x > ix + 16) { const w = 10 + rnd() * 38; g.fillRect(Math.max(ix + 16, x - w), y, Math.min(w, x - ix - 16), 4); x -= w + 5 + rnd() * 6; } }
}
page(PAGE_R, 1, 7, 21); page(PAGE_L, -1, 6, 34);
(() => {
  const gold = '#c39a47';
  const f = FLY.getContext('2d'); f.fillStyle = '#f1e7d2'; f.fillRect(0, 0, BW, BH);
  const fg = f.createLinearGradient(0, 0, BW, 0); fg.addColorStop(0, 'rgba(120,90,50,.06)'); fg.addColorStop(1, 'rgba(120,90,50,0)'); f.fillStyle = fg; f.fillRect(0, 0, BW, BH);
  const ic = INSIDE.getContext('2d'); ic.fillStyle = '#121722'; ic.fillRect(0, 0, BW, BH); ic.fillStyle = '#d9c9a6'; ic.fillRect(12, 12, BW - 24, BH - 24);
  ic.strokeStyle = gold; ic.lineWidth = 1.5; ic.strokeRect(12, 12, BW - 24, BH - 24);
})();
const S = estimate([
  'So come to the Qur’an with sincerity.',
  'Come with questions.',
  'Come willing to learn.',
  'And above all...',
  'Come prepared to listen.',
  'Because the greatest benefit of reading the Qur’an...',
  'Isn’t simply being able to say...',
  '“I’ve finished it.”',
  'It’s reaching a point where you can say...',
  '“I am beginning to understand.”',
  'And by Allah’s permission...',
  'That understanding is changing the way I live.',
], 2.0);
const T_OPEN = S[4].start - .2, OPEN = 3.2, T_TURN = S[5].start + .4, TURN = 2.8, DUR = S[11].end + 3.5;   // the cover opens on "Come prepared to listen.", the first leaf turns on the next line; three seconds' hold at the end

// one leaf or board turning right over the spine: front face while it rises, back face once it passes upright
function turn(front, back, k, spine, y, w, h) {
  const c = Math.cos(Math.PI * k), lift = Math.sin(Math.PI * k), ww = w * Math.abs(c);
  if (ww < .5) return;
  if (c > 0) { X.save(); X.translate(spine, y); X.scale(-c, 1); X.translate(w, 0); X.scale(-1, 1); X.drawImage(front, 0, 0, w, h); X.restore();
    X.fillStyle = `rgba(0,0,0,${.3 * lift})`; X.fillRect(spine - ww, y, ww, h); }
  else { X.save(); X.filter = `blur(${10 * lift}px)`; X.fillStyle = `rgba(50,36,20,${.28 * lift})`; X.fillRect(spine + 20 * lift, y + 30, ww, h); X.restore();
    X.drawImage(back, spine, y, ww, h); X.fillStyle = `rgba(0,0,0,${.22 * lift})`; X.fillRect(spine, y, ww, h); }
}

const life = makeLife(W, H, rnd), GP = life.goldPoints(GOLD, 6 * R).map(([x, y]) => [x / R, y / R]);
const FALL = life.fallingLeaves([{ t0: 5, dur: 7, x0: 1600, x1: 1460, y1: 830 }, { t0: 20, dur: 8, x0: 1300, x1: 430, y1: 320 }, { t0: 33, dur: 7.5, x0: 1750, x1: 1500, y1: 230 }]);

// the shots, cut on the narration: wide (as scene 1 ended) → the medallion → the spine edge as the cover is about to lift
// → a medium shot as it opens and the leaf turns → along the lines of the left page → into the header of the right page
// → a slow pull out to the whole open book for the last words and the hold
const SHOTS = [
  { t: 0, a: { x: 960, y: 530, z: 1.5 }, b: { x: 960, y: 535, z: 1.25 } },
  { t: S[2].start - .2, a: { x: 960, y: 520, z: 3.6, r: -.05 }, b: { x: 960, y: 520, z: 4.2, r: .02 }, dark: 1 },
  { t: S[3].start - .2, a: { x: 1060, y: 470, z: 2.6, r: .04 }, b: { x: 1060, y: 520, z: 2.3, r: .02 }, dark: 1 },
  { t: S[4].start - .6, a: { x: 1020, y: 520, z: 1.45 }, b: { x: 965, y: 520, z: 1.3 } },
  { t: S[6].start - .2, a: { x: 795, y: 430, z: 2.7, r: -.02 }, b: { x: 790, y: 640, z: 2.9, r: -.01 } },
  { t: S[8].start - .2, a: { x: 1127, y: 470, z: 2.4, r: .02 }, b: { x: 1127, y: 400, z: 3.2, r: 0 } },
  { t: S[10].start - .2, a: { x: 960, y: 520, z: 1.7 }, b: { x: 960, y: 530, z: 1.02 } },
];
const XF = 1.3;
const shotAt = t => { let i = 0; while (i + 1 < SHOTS.length && t >= SHOTS[i + 1].t) i++; return i; };
function cam(i, t) {
  const s = SHOTS[i], end = i + 1 < SHOTS.length ? SHOTS[i + 1].t + XF / 2 : DUR, k = cl((t - s.t + XF / 2) / (end - s.t + XF / 2)), e = k * .7 + io(k) * .3;
  return { x: lerp(s.a.x, s.b.x, e) + 6 * Math.sin(t * .31), y: lerp(s.a.y, s.b.y, e) + 4 * Math.sin(t * .23 + 1), z: lerp(s.a.z, s.b.z, e), r: lerp(s.a.r || 0, s.b.r || 0, e) + .003 * Math.sin(t * .17) };
}
function camAt(t) {
  // between shots the camera glides from one framing to the next (zoom eased in log space) instead of cutting
  const i = shotAt(t), into = t - SHOTS[i].t;
  if (i > 0 && into < XF / 2 || i + 1 < SHOTS.length && SHOTS[i + 1].t - t < XF / 2) {
    const j = into < XF / 2 ? i - 1 : i, k = io((t - (SHOTS[j + 1].t - XF / 2)) / XF), p = cam(j, t), q = cam(j + 1, t);
    return { x: lerp(p.x, q.x, k), y: lerp(p.y, q.y, k), z: Math.exp(lerp(Math.log(p.z), Math.log(q.z), k)), r: lerp(p.r, q.r, k) };
  }
  return cam(i, t);
}

function render(t) {
  const k = io((t - T_OPEN) / OPEN), k2 = io((t - T_TURN) / TURN), shift = -BW / 2 * io((t - T_OPEN - .6) / (OPEN + .8));   // the spread re-centres on the spine
  const day = io(t / (DUR - 3));
  const u = t / DUR, c = camAt(t);
  const bg = X.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#f6efe2'); bg.addColorStop(1, '#e7ddcc'); X.fillStyle = bg; X.fillRect(0, 0, W, H);
  X.save(); X.translate(W / 2, H / 2); X.scale(c.z, c.z); X.rotate(c.r); X.translate(-c.x, -c.y); X.fillRect(-W, -H, 3 * W, 3 * H);
  // daylight: the beam from the opening, resting where it stopped and widening as the morning comes
  const g = BEAM.getContext('2d'); g.clearRect(0, 0, W, H); g.fillStyle = `rgba(255,236,196,${(.7 + .15 * day) * life.flicker(t) * (1 - life.shade(t))})`; const bx0 = 760 + shift * .5 + lerp(-60, 120, u), wd = 210 + 160 * day;
  g.beginPath(); g.moveTo(bx0 - wd, -60); g.lineTo(bx0 + wd, -60); g.lineTo(bx0 + 530 + wd, H + 60); g.lineTo(bx0 + 350 - wd * .3, H + 60); g.closePath(); g.fill();
  X.save(); X.filter = 'blur(60px)'; X.drawImage(BEAM, 0, 0); X.restore();
  const cx = 960 + shift, cy = 520, x0 = cx - BW / 2, y0 = cy - BH / 2, spine = cx + BW / 2, pw = BW - 6, ph = BH - 12, py = y0 + 6;
  // shadow under whatever is open
  const sg = SHADOW.getContext('2d'); sg.clearRect(0, 0, W, H); sg.fillStyle = 'rgba(50,36,20,.42)'; sg.fillRect(x0 + 30, y0 + 38, BW + 10 + BW * k, BH);
  X.save(); X.filter = 'blur(28px)'; X.drawImage(SHADOW, 0, 0); X.restore();
  // the back board under the page block
  life.ribbon(X, t, spine - 30, y0 + BH - 14, 1.75, 170, ['#173f30', '#2d6a50']);
  X.fillStyle = '#121722'; X.fillRect(x0, y0, BW, BH);
  X.drawImage(PAGE_L, spine - pw, py, pw, ph);
  if (k2 < .5) X.drawImage(FLY, spine - pw, py, pw, ph);
  // the open cover lying to the right of the spine
  if (k >= 1) X.drawImage(INSIDE, spine, y0, BW, BH);
  // the first leaf turning, landing on the inside of the cover
  if (k2 > 0 && k2 < 1) turn(FLY, PAGE_R, k2, spine, py, pw, ph);
  if (k2 >= 1) X.drawImage(PAGE_R, spine, py, pw, ph);
  // the gutter: a faint shade either side of the spine
  const sh = Math.max(k * .7, k2);
  const gl = X.createLinearGradient(spine - 46, 0, spine, 0); gl.addColorStop(0, 'rgba(90,64,30,0)'); gl.addColorStop(1, `rgba(90,64,30,${.24 * k})`); X.fillStyle = gl; X.fillRect(spine - 46, py, 46, ph);
  if (k2 > .5) { const gr = X.createLinearGradient(spine, 0, spine + 40, 0); gr.addColorStop(0, `rgba(90,64,30,${.2 * sh})`); gr.addColorStop(1, 'rgba(90,64,30,0)'); X.fillStyle = gr; X.fillRect(spine, py, 40, ph); }
  if (k > 0 && k < 1) turn(COVER, INSIDE, k, spine, y0, BW, BH);
  if (k <= 0) { X.drawImage(COVER, x0, y0, BW, BH); X.save(); X.translate(x0, y0); life.glints(X, t, GP, 1); X.restore(); }
  // the breeze lifts the outer top corner of the open right-hand page and lets it fall
  if (k2 >= 1) { const fc = 6 + 30 * cl(life.breeze(t) - .3), px = spine + pw, c = fc;
    X.fillStyle = '#e9dfc8'; X.beginPath(); X.moveTo(px - c, py); X.lineTo(px, py); X.lineTo(px, py + c); X.closePath(); X.fill();
    X.save(); X.filter = 'blur(4px)'; X.fillStyle = 'rgba(60,40,20,.25)'; X.beginPath(); X.moveTo(px - c, py); X.lineTo(px, py + c); X.lineTo(px - c - 3, py + c + 5); X.closePath(); X.fill(); X.restore();
    const fg = X.createLinearGradient(px - c, py + c, px - c / 2, py + c / 2); fg.addColorStop(0, '#fbf5e8'); fg.addColorStop(1, '#e4d8bd');
    X.fillStyle = fg; X.beginPath(); X.moveTo(px - c, py); X.lineTo(px, py + c); X.lineTo(px - c, py + c); X.closePath(); X.fill(); }
  // the world outside the window: the branch's shadow swaying, dust glinting in the beam, a bird passing
  life.leaves(X, t, 1); life.motes(X, t, bx0, 1); life.clouds(X, t); life.drawFalling(X, FALL, t); life.birds(X, t, 28, 6.5, 300, -1, 3);
  X.restore();
  X.save(); X.globalAlpha = .07; X.globalCompositeOperation = 'overlay'; X.drawImage(GRAIN, 0, 0); X.restore();
  const cur = S.find(x => t >= x.start - .1 && t < x.end + .5);
  if (cur) { const a = Math.min(1, (t - cur.start + .1) / .25, (cur.end + .5 - t) / .3);
    X.save(); X.globalAlpha = Math.max(0, a); X.font = 'italic 500 40px "Cormorant Garamond"'; X.textAlign = 'center';
    if (SHOTS[shotAt(t)].dark) { X.shadowColor = 'rgba(0,0,0,.7)'; X.shadowBlur = 18; X.fillStyle = '#f3e9d6'; } else X.fillStyle = '#5b4a36';
    X.fillText(cur.text, W / 2, 1000); X.restore(); }
}
await document.fonts.ready; await document.fonts.load('italic 500 40px "Cormorant Garamond"', 'Ab');
window.DUR = DUR; window.render = render; window.EV = [];
window.TEXTS = t => { const c = S.find(x => t >= x.start - .1 && t < x.end + .5); return c ? [{ id: 'cap', text: c.text, x0: 200, y0: 960, x1: 1720, y1: 1020 }] : []; };
render(0); window.READY = true;
