// Scene 05 "Words and Meaning" — Archive Light Table sample.
// The word كُفْر on a backlit sheet; the root slip (to cover, a seed under soil) is laid first,
// then the senses, then one "disbelief" slip slides over the word. render(t) is pure in t.
import { estimate } from './timing.js';
import { drawCaption } from './caption.js';

const W = 1920, H = 1080, K = 2.5, TAU = Math.PI * 2;                 // K: texture px per world px
const INK = '#15171A', SIG = '#FF5A1F';
const WORD = 'كُفْر';     // كُفْر : kaf+damma, fa+sukun, ra

const LINES = [
  'Take the word kufr, for example.',
  'You may often see it translated as “disbelief.”',
  'But depending on the passage, it can involve rejection, denial, or ingratitude.',
  'These distinctions matter.',
  'And this is one reason why reading a translation alone may not always be enough.',
];
const S = estimate(LINES, 2.6);
const at = i => S[i].start, end = i => S[i].end, k = (i, f) => S[i].start + (S[i].end - S[i].start) * f;
const DUR = end(4) + 2.2;

// ---------- helpers ----------
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ss = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const eout = x => 1 - Math.pow(1 - clamp(x), 3);
const einout = x => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
function hash(n) { n = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b); n ^= n >>> 13; n = Math.imul(n, 0xc2b2ae35); n ^= n >>> 16; return (n >>> 0) / 4294967296; }
const rng = seed => { let i = 0; return () => hash(seed * 7919 + (i++)); };
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.round(w); c.height = Math.round(h); return c; };

// ---------- textures (built once, deterministic) ----------
function cloud(w, h, seed, cell, amp) {           // low-frequency paper formation, upscaled smooth
  const gw = Math.ceil(w / cell) + 2, gh = Math.ceil(h / cell) + 2, g = mk(gw, gh), x = g.getContext('2d'), d = x.createImageData(gw, gh);
  for (let i = 0; i < gw * gh; i++) { const v = 255 - hash(seed * 1000003 + i) * amp; d.data.set([v, v, v, 255], i * 4); }
  x.putImageData(d, 0, 0); return g;
}
function paper(w, h, seed, tone, { deckle = 0, rim = .55 } = {}) {
  const c = mk(w * K, h * K), x = c.getContext('2d'), r = rng(seed);
  x.scale(K, K);
  // outline (slight deckle on the main sheet, clean cut on slips)
  const path = new Path2D(), n = 60, pts = [];
  for (let s = 0; s < 4; s++) for (let i = 0; i < n; i++) {
    const f = i / n, j = deckle * (r() - .5);
    pts.push(s === 0 ? [f * w, Math.max(0, j)] : s === 1 ? [w - Math.max(0, j), f * h] : s === 2 ? [w - f * w, h - Math.max(0, j)] : [Math.max(0, j), h - f * h]);
  }
  pts.forEach((p, i) => i ? path.lineTo(...p) : path.moveTo(...p)); path.closePath();
  x.save(); x.clip(path);
  x.fillStyle = tone; x.fillRect(0, 0, w, h);
  x.globalCompositeOperation = 'multiply'; x.imageSmoothingQuality = 'high';
  x.globalAlpha = .45; x.drawImage(cloud(w, h, seed + 1, 26, 24), -26, -26, w + 52, h + 52);
  x.globalAlpha = .4; x.drawImage(cloud(w, h, seed + 2, 7, 16), -7, -7, w + 14, h + 14);
  x.globalAlpha = 1;
  for (let i = 0; i < w * h / 260; i++) {        // fibres, baked into the sheet
    const px = r() * w, py = r() * h, a = r() * Math.PI, L = 3 + r() * 12;
    x.strokeStyle = `rgba(120,100,70,${.05 + r() * .08})`; x.lineWidth = .35;
    x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + Math.cos(a) * L * .5 + r() * 2, py + Math.sin(a) * L * .5, px + Math.cos(a) * L, py + Math.sin(a) * L); x.stroke();
  }
  // backlit edge: thinner paper at the rim lets warm light through
  x.globalCompositeOperation = 'screen';
  x.filter = 'blur(7px)'; x.strokeStyle = `rgba(255,232,190,${rim})`; x.lineWidth = 16; x.stroke(path); x.filter = 'none';
  x.restore();
  return { c, w, h, ctx: x };
}
function soilPrint(w, h, seed) {                   // pressed image: a seed lying under soil (monochrome print)
  const c = mk(w * K, h * K), x = c.getContext('2d'), r = rng(seed), d = x.createImageData(c.width, c.height);
  const surf = X => h * (.34 + .025 * Math.sin(X / w * 7 + 1) + .015 * Math.sin(X / w * 19));
  const sx = w * .47, sy = h * .7, ra = w * .1, rb = h * .1;
  for (let j = 0; j < c.height; j++) for (let i = 0; i < c.width; i++) {
    const X = i / K, Y = j / K, gs = surf(X), cell = hash(seed * 31 + Math.floor(X / 2.2) * 977 + Math.floor(Y / 2.2) * 131071);
    let v;
    if (Y < gs) v = 222 - Y / gs * 26 + hash(i * 7 + j * 13331) * 8;                                   // pale air
    else {
      const depth = (Y - gs) / (h - gs);
      v = 84 - depth * 30 + (cell - .5) * 44 + (hash(i * 3 + j * 911 + 7) - .5) * 14;                 // soil grain
      const pb = hash(Math.floor(X / 9) * 53 + Math.floor(Y / 9) * 8191 + seed);
      if (pb > .965) v += 40 * (1 - Math.hypot((X % 9) - 4.5, (Y % 9) - 4.5) / 4.5);                   // small stones
      if (Y - gs < 2.2) v -= 30;
      const ex = (X - sx) / ra, ey = (Y - sy) / rb, e = ex * ex * .9 + ey * ey + ex * ey * .5;          // the seed
      if (e < 1) v = 140 + (1 - e) * 60 - (ex + ey) * 26 - 50 * Math.exp(-Math.pow((ey - ex * .25) * 7, 2)) * (1 - e) + (hash(i * 5 + j * 77) - .5) * 8;
      else if (e < 1.18) v = 55;
      const rx = X - (sx + ra * .7), ry = Y - (sy + rb * .5);                                         // first root
      if (rx > 0 && rx < w * .12 && Math.abs(ry - Math.pow(rx / (w * .12), 1.6) * h * .12) < .9) v = 175;
    }
    v = clamp(v, 18, 236);
    d.data.set([v * 1.04, v, v * .9, 255], (j * c.width + i) * 4);
  }
  x.putImageData(d, 0, 0);
  const b = mk(c.width, c.height), bx = b.getContext('2d'); bx.filter = 'blur(1.1px)'; bx.drawImage(c, 0, 0); return b;
}
function label(p, text, size, y, { align = 'center', x0 } = {}) {
  const x = p.ctx; x.save(); x.globalCompositeOperation = 'source-over';
  x.font = `400 ${size}px "IBM Plex Mono"`; x.textAlign = align; x.textBaseline = 'middle'; x.fillStyle = INK; x.globalAlpha = .9;
  x.fillText(text, x0 ?? p.w / 2, y); x.restore();
  x.font = `400 ${size}px "IBM Plex Mono"`; return x.measureText(text).width;
}

// ---------- objects on the table (world = screen px at zoom 1) ----------
const OBJ = {};
function build() {
  const sheet = paper(660, 480, 11, '#F6E3C0', { deckle: 3.2, rim: .8 });
  { const x = sheet.ctx; x.save(); x.font = '700 236px "Amiri"'; x.direction = 'rtl'; x.textAlign = 'center'; x.textBaseline = 'alphabetic';
    const m = x.measureText(WORD), base = 240 + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;
    x.fillStyle = '#17120c'; x.globalAlpha = .94; x.fillText(WORD, 330, base); x.restore(); }
  const root = paper(360, 310, 23, '#F3E8D2', { rim: .7 });
  { const x = root.ctx, pw = 312, ph = 200; x.save(); x.fillStyle = '#f8f5ee'; x.fillRect(18, 18, pw + 12, ph + 12);
    x.drawImage(soilPrint(pw, ph, 5), 24, 24, pw, ph); x.restore(); }
  root.uw = label(root, 'root: to cover', 30, 268);
  const rej = paper(330, 112, 37, '#F4EAD5', { rim: .7 }); rej.uw = label(rej, 'to reject', 38, 58);
  const ung = paper(430, 112, 41, '#F2E8D2', { rim: .7 }); ung.uw = label(ung, 'to be ungrateful', 38, 58);
  const dis = paper(640, 420, 53, '#F5F1E8', { rim: .4 }); dis.uw = label(dis, 'disbelief', 76, 210);
  Object.assign(OBJ, {
    sheet: { p: sheet, x: 960, y: 445, r: -.012, lay: -1, from: [0, 0, 0] },
    root: { p: root, x: 395, y: 330, r: -.05, lay: at(1) + .35, from: [-160, -40, -.12] },
    rej: { p: rej, x: 1495, y: 300, r: .04, lay: k(2, .6), from: [150, -60, .14] },
    ung: { p: ung, x: 1505, y: 640, r: -.03, lay: end(2) - .45, from: [160, 70, -.12] },
    dis: { p: dis, x: 962, y: 468, r: .015, slide: [at(4) + .5, at(4) + 3.0], from: [1450, 30, .07] },
  });
}

// ---------- table, light, camera ----------
let tableTex, grain = [];
function buildTable() {
  tableTex = mk(1740, 840); const x = tableTex.getContext('2d');
  const g = x.createRadialGradient(870, 420, 80, 870, 420, 1000);
  g.addColorStop(0, '#F8FAFC'); g.addColorStop(.6, '#F1F4F7'); g.addColorStop(1, '#DCE1E6');
  x.fillStyle = g; x.fillRect(0, 0, 1740, 840);
  x.globalCompositeOperation = 'multiply'; x.globalAlpha = .25; x.drawImage(cloud(1740, 840, 3, 4, 14), 0, 0, 1740, 840);
  for (let f = 0; f < 4; f++) {
    const c = mk(256, 256), cx = c.getContext('2d'), d = cx.createImageData(256, 256);
    for (let i = 0; i < 65536; i++) { const v = hash(f * 70001 + i) * 255; d.data.set([v, v, v, 255], i * 4); }
    cx.putImageData(d, 0, 0); grain.push(c);
  }
}
const TB = { x0: 90, y0: 50, x1: 1830, y1: 890 };
function light(t) {                                // table switching on: starter flicker, then full
  if (t < .25) return 0;
  if (t < .34) return .55;
  if (t < .5) return .08;
  if (t < .56) return .7;
  if (t < .66) return .2;
  return .2 + .8 * eout((t - .66) / .5);
}
const CAM = [[0, 960, 440, 1.22], [end(0) + .3, 960, 440, 1.22], [at(1) + 2.6, 950, 462, 1.0], [at(4) + .4, 958, 462, 1.02], [at(4) + 4.2, 966, 452, 1.075], [DUR, 966, 452, 1.085]];
function cam(t) {
  let i = 0; while (i < CAM.length - 2 && t > CAM[i + 1][0]) i++;
  const a = CAM[i], b = CAM[i + 1], f = ss((t - a[0]) / (b[0] - a[0]));
  return { cx: a[1] + (b[1] - a[1]) * f, cy: a[2] + (b[2] - a[2]) * f, z: a[3] + (b[3] - a[3]) * f };
}
const w2s = (c, x, y) => [(x - c.cx) * c.z + W / 2, (y - c.cy) * c.z + H / 2];

function pose(o, t) {                              // where an object is, and how high above the glass
  if (o.slide) {
    const f = einout((t - o.slide[0]) / (o.slide[1] - o.slide[0]));
    if (t < o.slide[0]) return null;
    return { x: o.x + o.from[0] * (1 - f), y: o.y + o.from[1] * (1 - f), r: o.r + o.from[2] * (1 - f), h: 0, a: 1 };
  }
  if (t < o.lay) return null;
  const f = eout((t - o.lay) / .75), h = 1 - f;
  return { x: o.x + o.from[0] * h, y: o.y + o.from[1] * h, r: o.r + o.from[2] * h, h, a: clamp((t - o.lay) / .18) };
}

function drawWorld(x, c, t) {
  x.setTransform(c.z, 0, 0, c.z, W / 2 - c.cx * c.z, H / 2 - c.cy * c.z);
  x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
  x.fillStyle = '#141517'; x.fillRect(-400, -400, W + 800, H + 800);                       // dark desk
  const fr = x.createLinearGradient(0, TB.y0 - 22, 0, TB.y1 + 22);
  fr.addColorStop(0, '#a7adb3'); fr.addColorStop(.5, '#7b8086'); fr.addColorStop(1, '#55595e');
  x.fillStyle = fr; x.beginPath(); x.roundRect(TB.x0 - 22, TB.y0 - 22, TB.x1 - TB.x0 + 44, TB.y1 - TB.y0 + 44, 10); x.fill();
  x.fillStyle = '#c9ced3'; x.fillRect(TB.x0 - 22, TB.y0 - 22, TB.x1 - TB.x0 + 44, 2);
  const L = light(t);
  x.drawImage(tableTex, TB.x0, TB.y0);
  for (const key of ['sheet', 'root', 'rej', 'ung', 'dis']) {
    const o = OBJ[key], p = pose(o, t); if (!p) continue;
    const { w, h } = o.p, s = 1 + .08 * p.h;
    x.save(); x.translate(p.x + 18 * p.h, p.y + 26 * p.h); x.rotate(p.r);                 // soft shadow, tight on contact
    x.globalCompositeOperation = 'multiply'; x.globalAlpha = p.a * (.22 + .1 * p.h);
    x.filter = `blur(${2 + 22 * p.h}px)`; x.fillStyle = '#6b6f75'; x.fillRect(-w * s / 2, -h * s / 2, w * s, h * s); x.filter = 'none';
    x.restore();
    x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.scale(s, s);
    x.globalCompositeOperation = 'multiply'; x.globalAlpha = p.a;                           // transmitted light
    x.drawImage(o.p.c, -w / 2, -h / 2, w, h);
    if (key === 'dis') { x.globalCompositeOperation = 'source-over'; x.globalAlpha = .84 * (.25 + .75 * L); x.drawImage(o.p.c, -w / 2, -h / 2, w, h); }
    x.restore();
  }
  // light level: off table ≈ 0.04 ambient
  x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'multiply'; x.globalAlpha = 1;
  const v = Math.round(10 + 245 * L); x.fillStyle = `rgb(${v},${v},${Math.min(255, v + 4)})`; x.fillRect(0, 0, W, H);
  x.globalCompositeOperation = 'source-over';
}

// ---------- loupe on the word ----------
const LOUPE = { land: at(0) + .25, lift: end(0) + .25, wx: 985, wy: 352, R: 235, mag: 1.4 };
function loupe(x, c, t) {
  const inF = eout((t - LOUPE.land) / .4), outF = eout((t - LOUPE.lift) / .4);
  if (t < LOUPE.land || outF >= 1) return;
  const air = t < LOUPE.lift ? 1 - inF : outF, sc = 1 + .35 * air, al = 1 - air;
  const [px, py] = w2s(c, LOUPE.wx, LOUPE.wy), R = LOUPE.R * sc;
  x.save(); x.globalAlpha = al;
  x.globalCompositeOperation = 'multiply'; x.filter = `blur(${10 + 30 * air}px)`; x.fillStyle = 'rgba(70,74,80,.5)';
  x.beginPath(); x.arc(px + 14 + 30 * air, py + 20 + 40 * air, R + 46, 0, TAU); x.fill(); x.filter = 'none';
  x.globalCompositeOperation = 'source-over';
  // acrylic skirt glowing at its foot
  const sk = x.createRadialGradient(px, py, R + 10, px, py, R + 52);
  sk.addColorStop(0, 'rgba(255,255,255,.5)'); sk.addColorStop(.7, 'rgba(230,238,245,.25)'); sk.addColorStop(1, 'rgba(255,255,255,.75)');
  x.fillStyle = sk; x.beginPath(); x.arc(px, py, R + 52, 0, TAU); x.arc(px, py, R + 10, 0, TAU, true); x.fill();
  x.save(); x.beginPath(); x.arc(px, py, R, 0, TAU); x.clip();
  const z2 = c.z * LOUPE.mag * (1 + .0 * air);
  const wp = [(px - W / 2) / c.z + c.cx, (py - H / 2) / c.z + c.cy];
  drawWorld(x, { z: z2, cx: wp[0] - (px - W / 2) / z2, cy: wp[1] - (py - H / 2) / z2 }, t);
  x.setTransform(1, 0, 0, 1, 0, 0);
  const lg = x.createRadialGradient(px - R * .3, py - R * .35, 0, px, py, R);                 // glass sheen and rim darkening
  lg.addColorStop(0, 'rgba(255,255,255,.10)'); lg.addColorStop(.75, 'rgba(255,255,255,0)'); lg.addColorStop(1, 'rgba(20,25,30,.22)');
  x.fillStyle = lg; x.fillRect(px - R, py - R, 2 * R, 2 * R);
  x.restore();
  x.globalAlpha = al;
  x.lineWidth = 22; x.strokeStyle = '#0d0e10'; x.beginPath(); x.arc(px, py, R + 11, 0, TAU); x.stroke();     // black ring
  const bv = x.createLinearGradient(px - R, py - R, px + R, py + R);
  bv.addColorStop(0, 'rgba(255,255,255,.55)'); bv.addColorStop(.5, 'rgba(255,255,255,.05)'); bv.addColorStop(1, 'rgba(255,255,255,.25)');
  x.lineWidth = 2.5; x.strokeStyle = bv; x.beginPath(); x.arc(px, py, R + 19, 0, TAU); x.stroke();
  x.restore();
}

// ---------- marks (signal colour) ----------
function marks(x, c, t) {
  const a = ss((t - (LOUPE.lift + .45)) / .35);
  if (a > 0) {                                     // tag pinned to the sheet: the word's reading
    const [ax, ay] = w2s(c, 700, 238), top = ay - 92 * c.z;
    x.save(); x.globalAlpha = a; x.strokeStyle = SIG; x.fillStyle = SIG; x.lineWidth = 2;
    x.beginPath(); x.arc(ax, ay, 4.5, 0, TAU); x.fill(); x.beginPath(); x.arc(ax, ay, 11, 0, TAU); x.stroke();
    x.beginPath(); x.moveTo(ax, ay - 11); x.lineTo(ax, top); x.stroke();
    const wipe = ss((t - (LOUPE.lift + .55)) / .45);
    x.beginPath(); x.rect(ax, top - 40, 260 * wipe, 80); x.clip();
    x.fillStyle = INK; x.textBaseline = 'alphabetic';
    x.font = '400 34px "IBM Plex Mono"'; x.fillText('kufr', ax + 14, top + 10);
    x.font = '400 17px "IBM Plex Mono"'; x.globalAlpha = a * .75; x.fillText('ARABIC · ROOT K-F-R', ax + 15, top + 34);
    x.restore();
  }
  // "These distinctions matter.": each shade underlined, one after another
  [['root', 268], ['rej', 58], ['ung', 58]].forEach(([key, ly], i) => {
    const o = OBJ[key], f = ss((t - (at(3) + .1 + i * .3)) / .3) * (1 - .55 * ss((t - (OBJ.dis.slide[1] - .2)) / .8));
    if (f <= 0) return;
    x.save(); x.setTransform(c.z, 0, 0, c.z, W / 2 - c.cx * c.z, H / 2 - c.cy * c.z);
    x.translate(o.x, o.y); x.rotate(o.r); x.globalAlpha = f; x.fillStyle = SIG;
    x.fillRect(-o.p.uw / 2, ly - o.p.h / 2 + 24, o.p.uw, 3); x.restore();
  });
}

function post(x, t) {
  const fr = Math.floor(t * 24), g = grain[fr % 4];
  x.save(); x.globalCompositeOperation = 'overlay'; x.globalAlpha = .055;
  const pat = x.createPattern(g, 'repeat'); pat.setTransform(new DOMMatrix().translate(hash(fr) * 256, hash(fr + 99) * 256));
  x.fillStyle = pat; x.fillRect(0, 0, W, H);
  x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
  const v = x.createRadialGradient(W / 2, H / 2, H * .45, W / 2, H / 2, H * 1.05);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.28)'); x.fillStyle = v; x.fillRect(0, 0, W, H);
  x.restore();
}
function caption(x, t) {                           // dark plate with a signal edge (STYLE §4), shared serif caption on it
  const cur = S.find(s => t >= s.start - .1 && t < s.end + .5);
  if (cur) {
    const a = clamp(Math.min(1, (t - cur.start + .1) / .25, (cur.end + .5 - t) / .3));
    x.save(); x.font = 'italic 500 42px "Cormorant Garamond"';
    const w = x.measureText(cur.text).width + 84;
    x.globalAlpha = a; x.fillStyle = 'rgba(14,15,17,.74)'; x.fillRect(960 - w / 2, 958, w, 74);
    x.fillStyle = SIG; x.fillRect(960 - w / 2, 958, w, 3); x.restore();
  }
  drawCaption(x, S, t);
}

// ---------- page contract ----------
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
await document.fonts.ready;
await Promise.all([['700 236px "Amiri"', WORD], ['400 30px "IBM Plex Mono"', 'Ab'], ['italic 500 42px "Cormorant Garamond"', 'Ab']].map(([f, s]) => document.fonts.load(f, s)));
build(); buildTable();
window.DUR = DUR;
window.render = t => {
  const c = cam(t);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, H);
  drawWorld(ctx, c, t); ctx.setTransform(1, 0, 0, 1, 0, 0);
  marks(ctx, c, t); loupe(ctx, c, t); post(ctx, t); caption(ctx, t);
};
window.TEXTS = t => S.filter(s => t >= s.start - .1 && t < s.end + .5).map(s => s.text);
window.EV = [
  { t: .25, name: 'table on' }, { t: LOUPE.land, name: 'loupe lands' }, { t: LOUPE.lift, name: 'loupe lifts' },
  { t: OBJ.root.lay, name: 'root slip laid' }, { t: OBJ.rej.lay, name: 'to reject laid' }, { t: OBJ.ung.lay, name: 'to be ungrateful laid' },
  { t: OBJ.dis.slide[0], name: 'disbelief slides' }, { t: OBJ.dis.slide[1], name: 'disbelief covers the word' },
];
window.render(0);
window.READY = true;
