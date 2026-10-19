// Scene 1 design still: an illuminated manuscript page (tazhib). Lapis field, gold rules and star bands,
// a pointed-arch panel holding the night room and the closed mushaf. Canvas 2D, ?v= picks a variant.
const W = 1920, H = 1080, C = document.getElementById('c'), X = C.getContext('2d');
const V = +(new URLSearchParams(location.search).get('v') || 1);
let seed = 5; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const TAU = Math.PI * 2;
const PAL = {
  1: { field: '#10285a', field2: '#0a1a3d', turq: '#2f8f8a', red: '#a3322a', night: ['#0b1838', '#1d2f63', '#4a3f6e'], book: '#1f5a3e' },
  2: { field: '#0d3b3a', field2: '#072423', turq: '#3a6fb0', red: '#9c2f2a', night: ['#091f2e', '#173f55', '#5a4a5e'], book: '#7a1f1c' },
  3: { field: '#2a0f12', field2: '#160709', turq: '#2f7c86', red: '#c08a2a', night: ['#120a1e', '#2d2246', '#6a4a52'], book: '#1d4f6e' },
}[V];

function goldFill(g, y0, y1) { const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, '#8a6420'); gr.addColorStop(.35, '#f6dc8a'); gr.addColorStop(.6, '#c79a3e'); gr.addColorStop(1, '#7a561c'); return gr; }
function star8(g, x, y, r, inner = .42, rot = 0) { for (let j = 0; j < 16; j++) { const a = rot + j * Math.PI / 8 - Math.PI / 2, rr = j % 2 ? r * inner : r; j ? g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : g.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); }
// two squares at 45° = the eight-pointed khatam
function khatam(g, x, y, r) { for (const a of [0, Math.PI / 4]) { g.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); for (let k = 1; k < 4; k++) g.lineTo(x + Math.cos(a + k * Math.PI / 2) * r, y + Math.sin(a + k * Math.PI / 2) * r); g.closePath(); } }
function pointedArch(g, cx, yb, w, h) { const ys = yb - h * .58; g.moveTo(cx - w / 2, yb); g.lineTo(cx - w / 2, ys); g.bezierCurveTo(cx - w / 2, ys - h * .3, cx - w * .12, yb - h * .92, cx, yb - h); g.bezierCurveTo(cx + w * .12, yb - h * .92, cx + w / 2, ys - h * .3, cx + w / 2, ys); g.lineTo(cx + w / 2, yb); g.closePath(); }
// a scroll of arabesque: a spiral stem with split-palmette leaves
function arabesque(g, x, y, s, dir, gold) {
  g.save(); g.translate(x, y); g.scale(dir * s, s); g.strokeStyle = gold; g.lineWidth = 3 / s; g.lineCap = 'round';
  g.beginPath(); for (let k = 0; k <= 60; k++) { const a = k / 60 * TAU * 1.15, r = 60 - k * .85; const px = Math.cos(a) * r, py = Math.sin(a) * r * .8; k ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke();
  g.fillStyle = gold;
  for (const [a, r, sz] of [[.6, 56, 16], [2.2, 44, 13], [3.9, 34, 11], [5.6, 24, 9]]) { const px = Math.cos(a) * r, py = Math.sin(a) * r * .8;
    g.save(); g.translate(px, py); g.rotate(a + 1.2); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(sz, -sz * .9, sz * 2, 0); g.quadraticCurveTo(sz, -sz * .2, 0, 0); g.moveTo(0, 0); g.quadraticCurveTo(sz, sz * .9, sz * 2, 0); g.quadraticCurveTo(sz, sz * .2, 0, 0); g.fill(); g.restore(); }
  g.beginPath(); g.arc(0, 0, 6, 0, TAU); g.fill(); g.restore();
}
function noise(alpha) { const c = document.createElement('canvas'); c.width = 480; c.height = 270; const g = c.getContext('2d'), d = g.createImageData(480, 270); for (let i = 0; i < d.data.length; i += 4) { const v = 128 + (rnd() - .5) * 90; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } g.putImageData(d, 0, 0); X.save(); X.globalAlpha = alpha; X.globalCompositeOperation = 'overlay'; X.drawImage(c, 0, 0, W, H); X.restore(); }

function render() {
  // lapis field with a faint gold khatam lattice
  const f = X.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, 1100); f.addColorStop(0, PAL.field); f.addColorStop(1, PAL.field2); X.fillStyle = f; X.fillRect(0, 0, W, H);
  X.save(); X.globalAlpha = .13; X.strokeStyle = '#e9c46a'; X.lineWidth = 1.4; X.beginPath(); for (let y = -40; y < H + 80; y += 80) for (let x = -40; x < W + 80; x += 80) khatam(X, x + (y / 80 % 2 ? 40 : 0), y, 26); X.stroke(); X.restore();

  // the page: outer frame with a band of stars
  const P = { x0: 300, y0: 60, x1: 1620, y1: 930 }, B = 44;
  X.fillStyle = goldFill(X, P.y0, P.y1); X.fillRect(P.x0 - 8, P.y0 - 8, P.x1 - P.x0 + 16, P.y1 - P.y0 + 16);
  X.fillStyle = PAL.field2; X.fillRect(P.x0, P.y0, P.x1 - P.x0, P.y1 - P.y0);
  // band
  X.fillStyle = PAL.field; X.fillRect(P.x0 + 6, P.y0 + 6, P.x1 - P.x0 - 12, B);
  const band = (x0, y0, x1, y1, horiz) => { const n = Math.round((horiz ? x1 - x0 : y1 - y0) / B); for (let k = 0; k < n; k++) { const t = (k + .5) / n, x = horiz ? x0 + (x1 - x0) * t : (x0 + x1) / 2, y = horiz ? (y0 + y1) / 2 : y0 + (y1 - y0) * t;
      X.beginPath(); star8(X, x, y, B * .38, .55); X.fillStyle = k % 2 ? PAL.turq : PAL.red; X.fill(); X.lineWidth = 2; X.strokeStyle = goldFill(X, y - 20, y + 20); X.stroke();
      X.beginPath(); X.arc(x, y, 4, 0, TAU); X.fillStyle = '#f6dc8a'; X.fill(); } };
  const bandRect = (x0, y0, x1, y1) => { X.fillStyle = PAL.field; X.fillRect(x0, y0, x1 - x0, y1 - y0); };
  bandRect(P.x0 + 6, P.y0 + 6, P.x1 - 6, P.y0 + 6 + B); bandRect(P.x0 + 6, P.y1 - 6 - B, P.x1 - 6, P.y1 - 6);
  bandRect(P.x0 + 6, P.y0 + 6, P.x0 + 6 + B, P.y1 - 6); bandRect(P.x1 - 6 - B, P.y0 + 6, P.x1 - 6, P.y1 - 6);
  band(P.x0 + 6, P.y0 + 6, P.x1 - 6, P.y0 + 6 + B, true); band(P.x0 + 6, P.y1 - 6 - B, P.x1 - 6, P.y1 - 6, true);
  band(P.x0 + 6, P.y0 + 6 + B, P.x0 + 6 + B, P.y1 - 6 - B, false); band(P.x1 - 6 - B, P.y0 + 6 + B, P.x1 - 6, P.y1 - 6 - B, false);
  // gold rules inside the band
  const I = { x0: P.x0 + 6 + B + 10, y0: P.y0 + 6 + B + 10, x1: P.x1 - 6 - B - 10, y1: P.y1 - 6 - B - 10 };
  X.strokeStyle = goldFill(X, I.y0, I.y1); X.lineWidth = 5; X.strokeRect(I.x0, I.y0, I.x1 - I.x0, I.y1 - I.y0); X.lineWidth = 1.5; X.strokeRect(I.x0 + 9, I.y0 + 9, I.x1 - I.x0 - 18, I.y1 - I.y0 - 18);

  // spandrels: lapis with gold arabesque, then the arch panel
  const cx = W / 2, yb = I.y1 - 12, aw = 860, ah = I.y1 - I.y0 - 40;
  X.fillStyle = PAL.field; X.fillRect(I.x0 + 12, I.y0 + 12, I.x1 - I.x0 - 24, I.y1 - I.y0 - 24);
  const gold = goldFill(X, I.y0, yb);
  X.save(); X.beginPath(); X.rect(I.x0 + 12, I.y0 + 12, I.x1 - I.x0 - 24, I.y1 - I.y0 - 24); X.clip();
  for (const d of [-1, 1]) { arabesque(X, cx + d * 480, I.y0 + 130, 1.5, d, gold); arabesque(X, cx + d * 545, I.y0 + 400, 1.3, -d, gold); arabesque(X, cx + d * 545, I.y0 + 640, 1.2, d, gold); arabesque(X, cx + d * 270, I.y0 + 60, .7, -d, gold); }
  X.restore();
  // arch: gold rim, then the scene inside
  X.save(); X.beginPath(); pointedArch(X, cx, yb + 14, aw + 40, ah + 30); X.fillStyle = gold; X.fill();
  X.beginPath(); pointedArch(X, cx, yb + 14, aw + 18, ah + 18); X.fillStyle = PAL.red; X.fill();
  X.beginPath(); pointedArch(X, cx, yb + 14, aw + 8, ah + 10); X.fillStyle = gold; X.fill();
  X.beginPath(); pointedArch(X, cx, yb + 14, aw, ah); X.clip();
  // night through the room
  const n = X.createLinearGradient(0, I.y0, 0, yb); n.addColorStop(0, PAL.night[0]); n.addColorStop(.55, PAL.night[1]); n.addColorStop(1, PAL.night[2]); X.fillStyle = n; X.fillRect(0, 0, W, H);
  seed = 11; for (let k = 0; k < 140; k++) { const x = cx - aw / 2 + rnd() * aw, y = I.y0 + rnd() * 380, r = .6 + rnd() * 1.8; X.beginPath(); X.arc(x, y, r, 0, TAU); X.fillStyle = `rgba(255,240,200,${.4 + rnd() * .6})`; X.fill(); }
  // crescent
  { const m = document.createElement('canvas'); m.width = 200; m.height = 200; const g = m.getContext('2d');
    g.beginPath(); g.arc(100, 100, 40, 0, TAU); g.fillStyle = '#fbeec4'; g.fill(); g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(116, 90, 36, 0, TAU); g.fill();
    X.save(); X.shadowColor = '#fbeec4'; X.shadowBlur = 30; X.drawImage(m, cx + 230 - 100, I.y0 + 170 - 100); X.restore(); }
  // distant city of domes and minarets
  X.fillStyle = 'rgba(8,10,30,.85)'; X.beginPath(); X.moveTo(cx - aw / 2, yb - 230);
  const city = [[-.5, 0], [-.42, 30], [-.36, 80, 'd'], [-.28, 40], [-.2, 150, 'm'], [-.16, 50], [-.02, 110, 'd'], [.12, 40], [.2, 170, 'm'], [.26, 60], [.36, 90, 'd'], [.5, 30]];
  for (let k = 0; k < city.length - 1; k++) { const [u, h, t] = city[k], [u2] = city[k + 1], x = cx + u * aw, x2 = cx + u2 * aw, y = yb - 230 - h;
    if (t === 'd') { X.lineTo(x, yb - 230 - 30); X.quadraticCurveTo((x + x2) / 2, y - 60, x2, yb - 230 - 30); }
    else if (t === 'm') { X.lineTo(x, yb - 230); X.lineTo(x, y + 20); X.lineTo(x + 6, y); X.lineTo(x + 12, y + 20); X.lineTo(x + 12, yb - 230); X.lineTo(x2, yb - 230); }
    else { X.lineTo(x, y); X.lineTo(x2, y); } }
  X.lineTo(cx + aw / 2, yb - 230); X.lineTo(cx + aw / 2, yb); X.lineTo(cx - aw / 2, yb); X.closePath(); X.fill();
  // the floor and a warm pool of light
  X.fillStyle = 'rgba(20,12,24,.95)'; X.fillRect(cx - aw / 2, yb - 230, aw, 230);
  const pool = X.createRadialGradient(cx, yb - 150, 10, cx, yb - 150, 420); pool.addColorStop(0, 'rgba(255,196,110,.55)'); pool.addColorStop(1, 'rgba(255,196,110,0)'); X.fillStyle = pool; X.fillRect(0, 0, W, H);
  // carpet: a band of small stars in the floor
  X.fillStyle = PAL.red; X.fillRect(cx - 330, yb - 70, 660, 46); X.strokeStyle = goldFill(X, yb - 70, yb - 24); X.lineWidth = 2; X.strokeRect(cx - 330, yb - 70, 660, 46);
  for (let k = 0; k < 14; k++) { X.beginPath(); star8(X, cx - 306 + k * 47, yb - 47, 12, .5); X.fillStyle = k % 2 ? '#f6dc8a' : PAL.turq; X.fill(); }
  // rehal (X stand) and the closed mushaf
  const bx = cx, by = yb - 80; X.fillStyle = goldFill(X, by - 120, by); X.strokeStyle = X.fillStyle; X.lineWidth = 12; X.lineCap = 'round';
  X.beginPath(); X.moveTo(bx - 120, by); X.lineTo(bx + 30, by - 140); X.moveTo(bx + 120, by); X.lineTo(bx - 30, by - 140); X.stroke();
  X.fillStyle = '#e8dcbc'; X.fillRect(bx - 128, by - 386, 262, 248);                                  // page edges
  X.fillStyle = PAL.book; X.fillRect(bx - 140, by - 376, 256, 246);                                   // cover
  X.strokeStyle = goldFill(X, by - 376, by - 130); X.lineWidth = 4; X.strokeRect(bx - 124, by - 360, 224, 214); X.lineWidth = 1.5; X.strokeRect(bx - 114, by - 350, 204, 194);
  X.save(); X.translate(bx - 12, by - 253); X.shadowColor = '#ffd27a'; X.shadowBlur = 40; X.beginPath(); star8(X, 0, 0, 58, .6); X.fillStyle = goldFill(X, -58, 58); X.fill(); X.shadowBlur = 0;
  X.beginPath(); khatam(X, 0, 0, 30); X.fillStyle = PAL.red; X.fill(); X.beginPath(); X.arc(0, 0, 9, 0, TAU); X.fillStyle = '#f6dc8a'; X.fill(); X.restore();
  for (const [x, y] of [[-124, -360], [100, -360], [-124, -146], [100, -146]]) { X.beginPath(); X.moveTo(bx + x, by + y); X.lineTo(bx + x + (x < 0 ? 40 : -40) * 0 + (x < 0 ? 30 : -30) * 0, by + y); X.fillStyle = '#f6dc8a'; X.arc(bx + x, by + y, 6, 0, TAU); X.fill(); }
  // hanging lamp from the arch apex
  const ly = I.y0 + 175; X.strokeStyle = goldFill(X, I.y0, ly); X.lineWidth = 2; X.beginPath(); X.moveTo(cx, I.y0 + 40); X.lineTo(cx, ly - 40); X.stroke();
  X.save(); X.shadowColor = '#ffcf7a'; X.shadowBlur = 50; X.beginPath(); X.moveTo(cx - 30, ly - 40); X.lineTo(cx + 30, ly - 40); X.quadraticCurveTo(cx + 48, ly + 10, cx, ly + 40); X.quadraticCurveTo(cx - 48, ly + 10, cx - 30, ly - 40); X.fillStyle = 'rgba(255,214,140,.95)'; X.fill(); X.restore();
  X.beginPath(); X.moveTo(cx - 30, ly - 40); X.lineTo(cx + 30, ly - 40); X.quadraticCurveTo(cx + 48, ly + 10, cx, ly + 40); X.quadraticCurveTo(cx - 48, ly + 10, cx - 30, ly - 40); X.strokeStyle = goldFill(X, ly - 40, ly + 40); X.lineWidth = 3; X.stroke();
  const lg = X.createRadialGradient(cx, ly, 0, cx, ly, 360); lg.addColorStop(0, 'rgba(255,200,120,.35)'); lg.addColorStop(1, 'rgba(255,200,120,0)'); X.fillStyle = lg; X.fillRect(0, 0, W, H);
  X.restore();
  // inner arch rule
  X.beginPath(); pointedArch(X, cx, yb + 14, aw - 16, ah - 16); X.strokeStyle = 'rgba(246,220,138,.6)'; X.lineWidth = 1.5; X.stroke();
  noise(.18);
  // vignette + caption
  const v = X.createRadialGradient(W / 2, H / 2, H * .4, W / 2, H / 2, H * 1.05); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.6)'); X.fillStyle = v; X.fillRect(0, 0, W, H);
  X.font = 'italic 500 42px "Cormorant Garamond"'; X.textAlign = 'center'; X.fillStyle = '#f6ecda'; X.shadowColor = 'rgba(0,0,0,.9)'; X.shadowBlur = 14; X.fillText("Before you open the Qur’an.", W / 2, 1010); X.shadowBlur = 0;
}
await document.fonts.ready; await document.fonts.load('italic 500 42px "Cormorant Garamond"', 'Ab');
window.DUR = 1; window.render = () => render(); window.TEXTS = () => []; window.EV = [];
render(); window.READY = true;
