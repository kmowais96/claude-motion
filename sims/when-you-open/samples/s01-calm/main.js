// Scene 1 · The Invitation, in the calm ivory design: the closed mushaf rises out of the page as a blind emboss,
// a beam of morning light travels slowly across it; the camera cuts between wide and close shots on the narration.
import { estimate } from './timing.js';
import { makeLife } from './life.js';
const W = 1920, H = 1080, C = document.getElementById('c'), OUT = C.getContext('2d');
const X = OUT;
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

const S = estimate([
  'There is something I want you to know...',
  'Before you open the Qur’an.',
  'Something that might change the way you read it.',
  'Because when most of us pick up a book, we already have certain expectations.',
  'We expect it to begin somewhere...',
  'Take us through a series of ideas...',
  'And eventually bring us to a conclusion.',
  'But the Qur’an...',
  'Is different.',
  'Not only because of what it says.',
  'But because of how it speaks.',
  'And to understand that, we need to begin with a question.',
  'What exactly are you about to read?',
], 4.0);
const T_HOLD = S[12].start, DUR = S[12].end + 3.5;

const life = makeLife(W, H, rnd), GP = life.goldPoints(GOLD, 6 * R).map(([x, y]) => [x / R, y / R]);
const FALL = life.fallingLeaves([{ t0: 8, dur: 7, x0: 1560, x1: 1390, y1: 830 }, { t0: 18, dur: 8.5, x0: 1700, x1: 560, y1: 800 }, { t0: 28, dur: 7, x0: 1350, x1: 1300, y1: 230 }, { t0: 40, dur: 8, x0: 1820, x1: 1530, y1: 610 }, { t0: 50, dur: 7.5, x0: 900, x1: 640, y1: 300 }]);

// the shots, cut on the narration: wide → the medallion → along the border → down the side (beginning, ideas, conclusion)
// → pull out wide on "But the Qur'an" → the bookmark and the page edge → a slow push in on the question
const SHOTS = [
  { t: 0, a: { x: 960, y: 545, z: 1 }, b: { x: 960, y: 530, z: 1.12 } },
  { t: S[2].start - .2, a: { x: 960, y: 520, z: 3.4, r: .06 }, b: { x: 960, y: 520, z: 4.1, r: -.03 }, dark: 1 },
  { t: S[3].start - .2, a: { x: 830, y: 330, z: 3, r: -.02 }, b: { x: 1095, y: 330, z: 3.1, r: .01 }, dark: 1 },
  { t: S[4].start - .2, a: { x: 845, y: 330, z: 2.2, r: -.07 }, b: { x: 845, y: 715, z: 2.3, r: -.05 }, dark: 1 },
  { t: S[7].start - .2, a: { x: 960, y: 540, z: 1.55 }, b: { x: 960, y: 545, z: .97 } },
  { t: S[9].start - .2, a: { x: 1110, y: 760, z: 2.2, r: .03 }, b: { x: 1160, y: 850, z: 2.45, r: .01 } },
  { t: S[11].start - .2, a: { x: 960, y: 570, z: 1.2 }, b: { x: 960, y: 530, z: 1.55 } },
];
const XF = 1.3;
const shotAt = t => { let i = 0; while (i + 1 < SHOTS.length && t >= SHOTS[i + 1].t) i++; return i; };
function cam(i, t) {
  const s = SHOTS[i], end = i + 1 < SHOTS.length ? SHOTS[i + 1].t + XF / 2 : DUR, k = cl((t - s.t + XF / 2) / (end - s.t + XF / 2)), e = k * .7 + io(k) * .3;
  return { x: lerp(s.a.x, s.b.x, e) + 6 * Math.sin(t * .31), y: lerp(s.a.y, s.b.y, e) + 4 * Math.sin(t * .23 + 1), z: lerp(s.a.z, s.b.z, e), r: lerp(s.a.r || 0, s.b.r || 0, e) + .003 * Math.sin(t * .17) };
}

function world(t, c) {
  const tt = Math.min(t, T_HOLD + 1.2);
  const rise = io((tt - .6) / 3.2);                           // the book settles onto the paper
  const beam = io((tt - 1) / (T_HOLD + 1.2 - 1));             // the beam travels from far left to rest on the book
  const u = t / DUR;
  const bg = X.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#f4ede0'); bg.addColorStop(1, '#e6dccb'); X.fillStyle = bg; X.fillRect(0, 0, W, H);
  X.save(); X.translate(W / 2, H / 2); X.scale(c.z, c.z); X.rotate(c.r); X.translate(-c.x, -c.y);
  X.fillStyle = bg; X.fillRect(-W, -H, 3 * W, 3 * H);
  const bx0 = lerp(-420, 760, beam) + 70 * io((t - T_HOLD) / (DUR - T_HOLD)), g = BEAM.getContext('2d'); g.clearRect(0, 0, W, H);
  g.fillStyle = `rgba(255,236,196,${(.25 + .5 * io(beam * 3)) * life.flicker(t) * (1 - life.shade(t))})`; g.beginPath(); g.moveTo(bx0 - 210, -60); g.lineTo(bx0 + 210, -60); g.lineTo(bx0 + 740, H + 60); g.lineTo(bx0 + 140, H + 60); g.closePath(); g.fill();
  X.save(); X.filter = 'blur(60px)'; X.drawImage(BEAM, 0, 0); X.restore();
  const near = cl(1 - Math.abs((bx0 + 210) - 960) / 700), lit = .35 + .65 * near;
  const cx = 960, cy = 520, bw = BW, bh = BH, rot = lerp(-.035, .025, io(u));
  X.save(); X.translate(cx, cy); X.rotate(rot); X.translate(-cx, -cy);
  const sg = SHADOW.getContext('2d'); sg.clearRect(0, 0, W, H); sg.fillStyle = `rgba(50,36,20,${.42 * rise})`; const so = lerp(52, 18, beam); sg.fillRect(cx - bw / 2 + so * rise, cy - bh / 2 + 38 * rise, bw + 10, bh);
  X.save(); X.filter = `blur(${8 + 20 * rise}px)`; X.drawImage(SHADOW, 0, 0); X.restore();
  X.save(); X.globalAlpha = rise; X.translate(0, (1 - rise) * -14);
  life.ribbon(X, t, cx + bw / 2 - 40, cy + bh / 2 - 12, 1.25, 150, ['#173f30', '#2d6a50']);
  X.fillStyle = '#ece3cf'; X.fillRect(cx - bw / 2 - 5, cy - bh / 2 + 7, 9, bh - 14);
  X.drawImage(COVER, cx - bw / 2, cy - bh / 2, BW, BH);
  // the gold catches the beam: a soft sheen travelling over the tooling only
  const sh = SHEEN.getContext('2d'); sh.clearRect(0, 0, BW, BH); sh.drawImage(GOLD, 0, 0, BW, BH); sh.globalCompositeOperation = 'source-in';
  const sx = (bx0 + 300) - (cx - bw / 2) + 120 * Math.sin(t * .4), sgr = sh.createLinearGradient(sx - 260, 0, sx + 260, BH); sgr.addColorStop(0, 'rgba(255,240,200,0)'); sgr.addColorStop(.5, `rgba(255,244,214,${.85 * lit})`); sgr.addColorStop(1, 'rgba(255,240,200,0)');
  sh.fillStyle = sgr; sh.fillRect(0, 0, BW, BH); sh.globalCompositeOperation = 'source-over';
  X.globalCompositeOperation = 'screen'; X.drawImage(SHEEN, cx - bw / 2, cy - bh / 2, BW, BH); X.globalCompositeOperation = 'source-over';
  X.save(); X.translate(cx - bw / 2, cy - bh / 2); life.glints(X, t, GP, rise * (1 - life.shade(t)), c.z > 2 ? .45 : .7); X.restore();
  X.restore(); X.restore();
  // the world outside the window: branches' shadows swaying, dust in the beam, clouds, leaves falling, birds passing
  life.leaves(X, t, io(t / 3)); life.motes(X, t, bx0, io(beam * 3));
  life.clouds(X, t); life.drawFalling(X, FALL, t);
  life.birds(X, t, 22, 5.5, 330, 1, 1); life.birds(X, t, 45, 7, 840, -1, 4);
  const rw = 120 * io((tt - 3.6) / 2.4); X.fillStyle = '#b8955a'; X.fillRect(cx - rw / 2, cy + bh / 2 + 56, rw, 1.5);
  X.restore();
}

function render(t) {
  // between shots the camera glides from one framing to the next (zoom eased in log space) instead of cutting
  const i = shotAt(t), into = t - SHOTS[i].t;
  let c = cam(i, t);
  if (i > 0 && into < XF / 2 || i + 1 < SHOTS.length && SHOTS[i + 1].t - t < XF / 2) {
    const j = into < XF / 2 ? i - 1 : i, k = io((t - (SHOTS[j + 1].t - XF / 2)) / XF), p = cam(j, t), q = cam(j + 1, t);
    c = { x: lerp(p.x, q.x, k), y: lerp(p.y, q.y, k), z: Math.exp(lerp(Math.log(p.z), Math.log(q.z), k)), r: lerp(p.r, q.r, k) };
  }
  world(t, c);
  X.save(); X.globalAlpha = .07; X.globalCompositeOperation = 'overlay'; X.drawImage(GRAIN, 0, 0); X.restore();
  // caption: ink on the ivory; on the close shots of the cover, ivory on a soft shade so it reads over the dark cloth
  const cur = S.find(x => t >= x.start - .1 && t < x.end + .5);
  if (cur) { const a = Math.max(0, Math.min(1, (t - cur.start + .1) / .25, (cur.end + .5 - t) / .3)), dark = SHOTS[shotAt(t)].dark;
    X.save(); X.globalAlpha = a; X.font = 'italic 500 40px "Cormorant Garamond"'; X.textAlign = 'center';
    if (dark) { X.shadowColor = 'rgba(0,0,0,.7)'; X.shadowBlur = 18; X.fillStyle = '#f3e9d6'; } else X.fillStyle = '#5b4a36';
    X.fillText(cur.text, W / 2, 1000); X.restore(); }
}
await document.fonts.ready; await document.fonts.load('italic 500 40px "Cormorant Garamond"', 'Ab');
window.DUR = DUR; window.render = render; window.EV = [];
window.TEXTS = t => { const c = S.find(x => t >= x.start - .1 && t < x.end + .5); return c ? [{ id: 'cap', text: c.text, x0: 200, y0: 960, x1: 1720, y1: 1020 }] : []; };
render(0); window.READY = true;
