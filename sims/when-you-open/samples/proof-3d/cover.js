// The mushaf cover from scene 1 (s01-calm), built once as textures: COVER (cloth + gold) and GOLD (white mask of the tooling).
const TAU = Math.PI * 2;
function star8(g, x, y, r, inner = .42) { for (let j = 0; j < 16; j++) { const a = j * Math.PI / 8 - Math.PI / 2, rr = j % 2 ? r * inner : r; j ? g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : g.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); }
function khatam(g, x, y, r) { for (const a of [0, Math.PI / 4]) { g.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); for (let k = 1; k < 4; k++) g.lineTo(x + Math.cos(a + k * Math.PI / 2) * r, y + Math.sin(a + k * Math.PI / 2) * r); g.closePath(); } }
const BW = 340, BH = 460;
const R = 4;   // the book is drawn at four times its size so close-ups stay sharp
const cvs = () => { const c = document.createElement('canvas'); c.width = BW * R; c.height = BH * R; c.getContext('2d').scale(R, R); return c; };
const GOLD = cvs(), COVER = cvs();
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
export { COVER, GOLD, BW, BH, R, cvs };
