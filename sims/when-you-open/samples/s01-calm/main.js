// Scene 1 · The Invitation, in the calm ivory design: the closed mushaf rises out of the page as a blind emboss,
// a beam of morning light travels slowly across it and comes to rest on it at the question; then everything holds.
import { estimate } from './timing.js';
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
const cvs = () => { const c = document.createElement('canvas'); c.width = BW; c.height = BH; return c; };
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
  c.fillStyle = 'rgba(255,255,255,.05)'; c.fillRect(0, 0, 10, BH);                                         // spine edge
  const gd = cvs(), gg = gd.getContext('2d'); gg.drawImage(GOLD, 0, 0); gg.globalCompositeOperation = 'source-in';
  const gl = gg.createLinearGradient(0, 0, BW, BH); gl.addColorStop(0, '#e8c97a'); gl.addColorStop(.45, '#b88d3e'); gl.addColorStop(1, '#8a6528'); gg.fillStyle = gl; gg.fillRect(0, 0, BW, BH);
  c.drawImage(gd, 0, 0);
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

function render(t) {
  const tt = Math.min(t, T_HOLD + 1.2);                       // the light settles on the book, then the frame holds
  const rise = io((tt - .6) / 3.2);                           // the emboss lifts out of the page
  const beam = io((tt - 1) / (T_HOLD + 1.2 - 1));             // beam travels from far left to rest on the book
  const zoom = lerp(1, 1.06, io(tt / (T_HOLD + 1.2)));         // a slow push in
  X.save(); X.translate(W / 2, H * .48); X.scale(zoom, zoom); X.translate(-W / 2, -H * .48);
  const bg = X.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#f4ede0'); bg.addColorStop(1, '#e6dccb'); X.fillStyle = bg; X.fillRect(-100, -100, W + 200, H + 200);
  // the beam: a soft diagonal band whose centre moves from x≈-300 to the book
  const bx0 = lerp(-420, 760, beam), g = BEAM.getContext('2d'); g.clearRect(0, 0, W, H);
  g.fillStyle = `rgba(255,236,196,${.25 + .5 * io(beam * 3)})`; g.beginPath(); g.moveTo(bx0 - 210, -60); g.lineTo(bx0 + 210, -60); g.lineTo(bx0 + 740, H + 60); g.lineTo(bx0 + 140, H + 60); g.closePath(); g.fill();
  X.save(); X.filter = 'blur(60px)'; X.drawImage(BEAM, 0, 0); X.restore();
  // how much light the book catches: highest when the beam's centre crosses it
  const near = cl(1 - Math.abs((bx0 + 210) - 960) / 700), lit = .35 + .65 * near;
  const cx = 960, cy = 520, bw = BW, bh = BH;
  const sg = SHADOW.getContext('2d'); sg.clearRect(0, 0, W, H); sg.fillStyle = `rgba(50,36,20,${.42 * rise})`; sg.fillRect(cx - bw / 2 + 30 * rise, cy - bh / 2 + 38 * rise, bw + 10, bh);
  X.save(); X.filter = `blur(${8 + 20 * rise}px)`; X.drawImage(SHADOW, 0, 0); X.restore();
  // the mushaf: page block on the right, then the cover; it settles down onto the paper as it fades in
  X.save(); X.globalAlpha = rise; X.translate(0, (1 - rise) * -14);
  X.fillStyle = '#ece3cf'; X.fillRect(cx + bw / 2 - 4, cy - bh / 2 + 7, 9, bh - 14);
  X.drawImage(COVER, cx - bw / 2, cy - bh / 2);
  // the gold catches the beam: a soft sheen travelling over the tooling only
  const sh = SHEEN.getContext('2d'); sh.clearRect(0, 0, BW, BH); sh.drawImage(GOLD, 0, 0); sh.globalCompositeOperation = 'source-in';
  const sx = (bx0 + 300) - (cx - bw / 2), sgr = sh.createLinearGradient(sx - 260, 0, sx + 260, BH); sgr.addColorStop(0, 'rgba(255,240,200,0)'); sgr.addColorStop(.5, `rgba(255,244,214,${.85 * lit})`); sgr.addColorStop(1, 'rgba(255,240,200,0)');
  sh.fillStyle = sgr; sh.fillRect(0, 0, BW, BH); sh.globalCompositeOperation = 'source-over';
  X.globalCompositeOperation = 'screen'; X.drawImage(SHEEN, cx - bw / 2, cy - bh / 2); X.globalCompositeOperation = 'source-over';
  X.restore();
  // the one touch of colour: a fine gold rule, widening from the centre once the book has risen
  const rw = 120 * io((tt - 3.6) / 2.4); X.fillStyle = '#b8955a'; X.fillRect(cx - rw / 2, cy + bh / 2 + 56, rw, 1.5);
  X.restore();
  X.save(); X.globalAlpha = .07; X.globalCompositeOperation = 'overlay'; X.drawImage(GRAIN, 0, 0); X.restore();
  // caption: same serif as the rest of the film, in ink on the ivory
  const cur = S.find(x => t >= x.start - .1 && t < x.end + .5);
  if (cur) { const a = Math.min(1, (t - cur.start + .1) / .25, (cur.end + .5 - t) / .3);
    X.save(); X.globalAlpha = Math.max(0, a); X.font = 'italic 500 40px "Cormorant Garamond"'; X.textAlign = 'center'; X.fillStyle = '#5b4a36'; X.fillText(cur.text, W / 2, 1000); X.restore(); }
}
await document.fonts.ready; await document.fonts.load('italic 500 40px "Cormorant Garamond"', 'Ab');
window.DUR = DUR; window.render = render; window.EV = [];
window.TEXTS = t => { const c = S.find(x => t >= x.start - .1 && t < x.end + .5); return c ? [{ id: 'cap', text: c.text, x0: 200, y0: 960, x1: 1720, y1: 1020 }] : []; };
render(0); window.READY = true;
