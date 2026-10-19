// Scene 1 design stills, calm and spare: one object, one light, a lot of space. Canvas 2D, ?v=1..3.
const W = 1920, H = 1080, C = document.getElementById('c'), X = C.getContext('2d');
const V = +(new URLSearchParams(location.search).get('v') || 1);
const TAU = Math.PI * 2;
const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
let seed = 9; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
function grain(a) { const c = mk(), g = c.getContext('2d'), d = g.createImageData(W, H); for (let i = 0; i < d.data.length; i += 4) { const v = 128 + (rnd() - .5) * 60; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } g.putImageData(d, 0, 0); X.save(); X.globalAlpha = a; X.globalCompositeOperation = 'overlay'; X.drawImage(c, 0, 0); X.restore(); }
function star8(g, x, y, r, inner = .42) { for (let j = 0; j < 16; j++) { const a = j * Math.PI / 8 - Math.PI / 2, rr = j % 2 ? r * inner : r; j ? g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : g.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); }
function khatam(g, x, y, r) { for (const a of [0, Math.PI / 4]) { g.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); for (let k = 1; k < 4; k++) g.lineTo(x + Math.cos(a + k * Math.PI / 2) * r, y + Math.sin(a + k * Math.PI / 2) * r); g.closePath(); } }
function caption(text, col, sh) { X.save(); X.font = 'italic 500 40px "Cormorant Garamond"'; X.textAlign = 'center'; X.fillStyle = col; X.shadowColor = sh; X.shadowBlur = 10; X.fillText(text, W / 2, 1000); X.restore(); }
function blurred(draw, px) { const c = mk(), g = c.getContext('2d'); draw(g); X.save(); X.filter = `blur(${px}px)`; X.drawImage(c, 0, 0); X.restore(); }

// 1 · Dawn on the page: warm ivory, the closed mushaf as a blind-embossed shape, one soft beam of morning light
function v1() {
  const bg = X.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#f4ede0'); bg.addColorStop(1, '#e6dccb'); X.fillStyle = bg; X.fillRect(0, 0, W, H);
  // the beam
  blurred(g => { g.fillStyle = 'rgba(255,236,196,.75)'; g.beginPath(); g.moveTo(560, -50); g.lineTo(980, -50); g.lineTo(1500, H + 50); g.lineTo(900, H + 50); g.closePath(); g.fill(); }, 60);
  const bx = 960, by = 520, bw = 300, bh = 380;
  // soft contact shadow, then an embossed slab: same colour as the page, lit from upper left
  blurred(g => { g.fillStyle = 'rgba(70,52,30,.32)'; g.fillRect(bx - bw / 2 + 26, by - bh / 2 + 34, bw, bh); }, 26);
  X.fillStyle = '#efe6d5'; X.fillRect(bx - bw / 2, by - bh / 2, bw, bh);
  const hl = X.createLinearGradient(bx - bw / 2, by - bh / 2, bx + bw / 2, by + bh / 2); hl.addColorStop(0, 'rgba(255,252,240,.9)'); hl.addColorStop(.5, 'rgba(255,252,240,0)'); hl.addColorStop(1, 'rgba(120,96,60,.18)'); X.fillStyle = hl; X.fillRect(bx - bw / 2, by - bh / 2, bw, bh);
  // debossed medallion and frame: dark lower-right edge, light upper-left edge
  const deboss = (path, w) => { X.save(); X.lineWidth = w; X.strokeStyle = 'rgba(110,86,52,.45)'; X.translate(1.5, 1.5); X.beginPath(); path(); X.stroke(); X.translate(-3, -3); X.strokeStyle = 'rgba(255,253,245,.95)'; X.beginPath(); path(); X.stroke(); X.restore(); };
  deboss(() => X.rect(bx - bw / 2 + 24, by - bh / 2 + 24, bw - 48, bh - 48), 2);
  deboss(() => star8(X, bx, by, 58, .6), 2.2); deboss(() => khatam(X, bx, by, 28), 1.6);
  // a single fine gold line under the book: the only colour
  X.fillStyle = '#b8955a'; X.fillRect(bx - 60, by + bh / 2 + 70, 120, 1.5);
  grain(.07);
  caption("Before you open the Qur’an.", '#5b4a36', 'rgba(255,255,255,0)');
}

// 2 · Night, one light: near-black, a single warm glow from the left catching the edge of the closed book
function v2() {
  X.fillStyle = '#070809'; X.fillRect(0, 0, W, H);
  const glow = X.createRadialGradient(700, 470, 0, 700, 470, 900); glow.addColorStop(0, 'rgba(255,190,120,.28)'); glow.addColorStop(.4, 'rgba(255,170,100,.08)'); glow.addColorStop(1, 'rgba(0,0,0,0)'); X.fillStyle = glow; X.fillRect(0, 0, W, H);
  // the surface: a faint horizon where the light lands
  const tbl = X.createLinearGradient(0, 640, 0, H); tbl.addColorStop(0, 'rgba(60,40,24,.55)'); tbl.addColorStop(1, 'rgba(0,0,0,0)'); X.fillStyle = tbl; X.fillRect(0, 640, W, H - 640);
  // the book lying flat, seen low: a long dark slab with a warm page edge and a lit left rim
  const x0 = 760, x1 = 1220, yt = 610, yb = 650;
  blurred(g => { g.fillStyle = 'rgba(0,0,0,.8)'; g.beginPath(); g.ellipse(1010, 660, 300, 26, 0, 0, TAU); g.fill(); }, 18);
  X.fillStyle = '#16231c'; X.beginPath(); X.moveTo(x0, yt); X.lineTo(x1, yt - 6); X.lineTo(x1 + 30, yt + 4); X.lineTo(x0 + 26, yt + 12); X.closePath(); X.fill();           // cover top
  const pe = X.createLinearGradient(x0, 0, x1, 0); pe.addColorStop(0, '#e8c896'); pe.addColorStop(1, '#5a4430'); X.fillStyle = pe; X.fillRect(x0 + 26, yt + 12, x1 - x0 + 4, yb - yt - 22);   // page block
  X.fillStyle = '#122019'; X.fillRect(x0 + 26, yb - 10, x1 - x0 + 4, 8);                                       // lower cover
  X.fillStyle = 'rgba(255,214,150,.9)'; X.fillRect(x0 + 24, yt + 12, 3, yb - yt - 14);                           // lit edge
  // a tiny gold glint of the medallion on the cover
  X.save(); X.shadowColor = '#ffd38a'; X.shadowBlur = 20; X.fillStyle = '#e6be6e'; X.beginPath(); X.ellipse(990, yt + 2, 16, 3, -.012, 0, TAU); X.fill(); X.restore();
  // dust in the beam
  seed = 4; for (let k = 0; k < 120; k++) { const x = 380 + rnd() * 760, y = 200 + rnd() * 420, r = .6 + rnd() * 1.6, a = .15 + rnd() * .5 * (1 - Math.abs(x - 700) / 500); X.fillStyle = `rgba(255,220,170,${Math.max(0, a)})`; X.beginPath(); X.arc(x, y, r, 0, TAU); X.fill(); }
  grain(.06);
  caption("Before you open the Qur’an.", '#e9dcc6', 'rgba(0,0,0,.9)');
}

// 3 · The shadow of a lattice: pale sand, morning light through an unseen mashrabiya lays a pattern of stars across the floor and the closed book
function v3() {
  const bg = X.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#efe4d2'); bg.addColorStop(1, '#e2d2b8'); X.fillStyle = bg; X.fillRect(0, 0, W, H);
  const bx = 1040, by = 560, bw = 330, bh = 420;
  blurred(g => { g.fillStyle = 'rgba(80,58,30,.3)'; g.fillRect(bx - bw / 2 + 30, by - bh / 2 + 30, bw, bh); }, 22);
  X.fillStyle = '#3f5a4a'; X.fillRect(bx - bw / 2, by - bh / 2, bw, bh);                                       // a muted green cover, top-down
  X.fillStyle = '#efe3cb'; X.fillRect(bx + bw / 2, by - bh / 2 + 8, 8, bh - 14);                              // page edge
  X.strokeStyle = 'rgba(214,186,120,.7)'; X.lineWidth = 1.5; X.strokeRect(bx - bw / 2 + 22, by - bh / 2 + 22, bw - 44, bh - 44);
  X.beginPath(); star8(X, bx, by, 46, .6); X.stroke();
  // the lattice shadow: a skewed grid of 8-point stars, soft-edged, laid over everything
  // shade everywhere, then the window's light falls as a skewed panel; inside it a lattice of stars lets the sun through
  const sh = mk(), g = sh.getContext('2d'); g.fillStyle = 'rgba(70,48,24,.38)'; g.fillRect(0, 0, W, H);
  g.setTransform(1, 0, -.42, .9, 330, 30); g.save(); g.beginPath(); g.rect(420, 40, 900, 900); g.clip();
  g.globalCompositeOperation = 'destination-out'; g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(420, 40, 900, 900);
  g.fillStyle = '#000'; g.beginPath(); for (let y = 40; y < 1000; y += 150) for (let x = 420; x < 1400; x += 150) { star8(g, x + 75, y + 75, 58, .55); } g.fill(); g.restore();
  g.setTransform(1, 0, 0, 1, 0, 0);
  X.save(); X.filter = 'blur(6px)'; X.drawImage(sh, 0, 0); X.restore();
  // warm light where the pattern lets it through
  const warm = X.createRadialGradient(900, 450, 0, 900, 450, 900); warm.addColorStop(0, 'rgba(255,214,150,.35)'); warm.addColorStop(1, 'rgba(255,214,150,0)'); X.save(); X.globalCompositeOperation = 'soft-light'; X.fillStyle = warm; X.fillRect(0, 0, W, H); X.restore();
  grain(.07);
  caption("Before you open the Qur’an.", '#4a3a28', 'rgba(255,255,255,0)');
}

await document.fonts.ready; await document.fonts.load('italic 500 40px "Cormorant Garamond"', 'Ab');
window.DUR = 1; window.render = () => ({ 1: v1, 2: v2, 3: v3 })[V](); window.TEXTS = () => []; window.EV = [];
window.render(); window.READY = true;
