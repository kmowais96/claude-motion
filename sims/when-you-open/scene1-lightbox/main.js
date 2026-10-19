// Scene 1 design stills in the paper-cut lightbox look: a shallow box of cut card, lit from behind.
// ?v=1..5 picks the design. Canvas 2D only: each layer is one flat colour with cut holes, a warm top rim,
// backlit translucency and a soft cast shadow on the layer behind.
const W = 1920, H = 1080, C = document.getElementById('c'), X = C.getContext('2d');
const V = +(new URLSearchParams(location.search).get('v') || 1);
const BOX = { x0: 170, y0: 70, x1: 1750, y1: 905 };          // the cavity
const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };

// ---------- seeded noise for paper fibre
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const grain = (() => { const c = mk(), g = c.getContext('2d'), d = g.createImageData(W, H);
  for (let i = 0; i < d.data.length; i += 4) { const v = 128 + (rnd() - .5) * 70; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
  g.putImageData(d, 0, 0); g.globalAlpha = .5; g.filter = 'blur(1.4px)'; g.drawImage(c, 0, 0); g.filter = 'none';
  for (let k = 0; k < 900; k++) { g.strokeStyle = `rgba(${rnd() > .5 ? 255 : 0},${rnd() > .5 ? 255 : 0},${rnd() > .5 ? 255 : 0},.05)`; g.lineWidth = 1; const x = rnd() * W, y = rnd() * H, a = rnd() * 6.3, l = 6 + rnd() * 18; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  return c; })();

// ---------- shape helpers (paths in pixel space)
const arch = (q, x, yb, w, h, s = .62) => { const ys = yb - h * s; q.moveTo(x - w / 2, yb); q.lineTo(x - w / 2, ys); q.quadraticCurveTo(x - w / 2, yb - h * .93, x, yb - h); q.quadraticCurveTo(x + w / 2, yb - h * .93, x + w / 2, ys); q.lineTo(x + w / 2, yb); q.closePath(); };
const star8 = (q, x, y, r, inner = .42, rot = 0) => { for (let j = 0; j < 16; j++) { const a = rot + j * Math.PI / 8 - Math.PI / 2, rr = j % 2 ? r * inner : r; j ? q.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : q.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } q.closePath(); };
const rect = (q, x, y, w, h) => q.rect(x, y, w, h);
const circ = (q, x, y, r) => { q.moveTo(x + r, y); q.arc(x, y, r, 0, Math.PI * 2); };
const full = q => q.rect(-50, -50, W + 100, H + 100);
// a lattice (girih-like) of 8-point stars and small squares cut inside a clip
const lattice = (q, x0, y0, x1, y1, s) => { for (let y = y0; y < y1 + s; y += s) for (let x = x0; x < x1 + s; x += s) { star8(q, x, y, s * .36, .55); q.rect(x + s / 2 - s * .09, y + s / 2 - s * .09, s * .18, s * .18); } };
// a low Qur'an stand (rehal) seen from the front with a closed mushaf resting on it, cover facing us
const rehal = (q, cx, base, s) => { q.moveTo(cx - 120 * s, base); q.lineTo(cx - 40 * s, base - 70 * s); q.lineTo(cx - 52 * s, base - 70 * s); q.lineTo(cx - 132 * s, base); q.closePath();
  q.moveTo(cx + 120 * s, base); q.lineTo(cx + 40 * s, base - 70 * s); q.lineTo(cx + 52 * s, base - 70 * s); q.lineTo(cx + 132 * s, base); q.closePath();
  q.rect(cx - 150 * s, base - 82 * s, 300 * s, 16 * s); };
const mushaf = (q, cx, base, s) => q.rect(cx - 130 * s, base - 82 * s - 300 * s, 260 * s, 300 * s);
const pages = (q, cx, base, s) => q.rect(cx - 118 * s, base - 82 * s - 312 * s, 262 * s, 300 * s);
const spine = (q, cx, base, s) => q.rect(cx - 104 * s, base - 82 * s - 300 * s, 5 * s, 300 * s);
const medallion = (q, cx, base, s) => { const y = base - 82 * s - 150 * s; star8(q, cx, y, 46 * s, .62); };
const frameHoles = (q, cx, base, s) => { const x = cx - 130 * s, y = base - 82 * s - 300 * s; q.rect(x + 16 * s, y + 16 * s, 228 * s, 4 * s); q.rect(x + 16 * s, y + 280 * s, 228 * s, 4 * s); q.rect(x + 16 * s, y + 16 * s, 4 * s, 268 * s); q.rect(x + 240 * s, y + 16 * s, 4 * s, 268 * s); };
const hand = (q, tx, ty, s) => {        // a sleeve and hand coming from the right, fingertips at (tx,ty); profile, no detail
  q.moveTo(tx, ty); q.bezierCurveTo(tx + 30 * s, ty - 14 * s, tx + 90 * s, ty - 22 * s, tx + 150 * s, ty - 26 * s);
  q.bezierCurveTo(tx + 170 * s, ty - 50 * s, tx + 200 * s, ty - 58 * s, tx + 230 * s, ty - 50 * s);
  q.lineTo(tx + 520 * s, ty - 90 * s); q.lineTo(tx + 560 * s, ty + 60 * s); q.lineTo(tx + 250 * s, ty + 44 * s);
  q.bezierCurveTo(tx + 180 * s, ty + 40 * s, tx + 100 * s, ty + 30 * s, tx + 30 * s, ty + 14 * s); q.bezierCurveTo(tx + 8 * s, ty + 10 * s, tx - 6 * s, ty + 4 * s, tx, ty); q.closePath();
  q.moveTo(tx + 260 * s, ty - 80 * s); q.lineTo(tx + 600 * s, ty - 140 * s); q.lineTo(tx + 640 * s, ty + 110 * s); q.lineTo(tx + 280 * s, ty + 70 * s); q.closePath(); };
const domes = (q, x0, x1, base, seedv) => { seed = seedv; q.moveTo(x0, base); let x = x0; while (x < x1) { const w = 60 + rnd() * 120, h = 40 + rnd() * 90, kind = rnd();
  q.lineTo(x, base - h); if (kind > .7) { q.lineTo(x + w * .2, base - h); q.quadraticCurveTo(x + w * .5, base - h - w * .7, x + w * .8, base - h); q.lineTo(x + w, base - h); }
  else if (kind > .55) { q.lineTo(x + w * .4, base - h); q.lineTo(x + w * .4, base - h - 120); q.lineTo(x + w * .47, base - h - 150); q.lineTo(x + w * .54, base - h - 120); q.lineTo(x + w * .54, base - h); q.lineTo(x + w, base - h); }
  else q.lineTo(x + w, base - h); x += w; } q.lineTo(x1, base); q.closePath(); };

// ---------- the compositor
function layer(spec, L) {
  const c = mk(), g = c.getContext('2d');
  g.fillStyle = spec.col; g.beginPath(); spec.shape(g); g.fill(spec.rule || 'nonzero');
  if (spec.holes) { g.globalCompositeOperation = 'destination-out'; g.beginPath(); spec.holes(g); g.fill('nonzero'); }
  g.globalCompositeOperation = 'source-atop';
  g.globalAlpha = .16; g.drawImage(grain, 0, 0); g.globalAlpha = 1;
  // backlight through the sheet: warm, cloudy, strongest near the light
  const t = spec.trans ?? .3; if (t > 0) { const r = g.createRadialGradient(L.x, L.y, 0, L.x, L.y, L.r); r.addColorStop(0, `rgba(${L.rgb},${t})`); r.addColorStop(1, `rgba(${L.rgb},0)`); g.fillStyle = r; g.globalCompositeOperation = 'source-atop'; g.fillRect(0, 0, W, H); }
  return c;
}
function tint(src, col) { const c = mk(), g = c.getContext('2d'); g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, W, H); return c; }

function compose(D) {
  const L = D.light;
  X.fillStyle = '#060403'; X.fillRect(0, 0, W, H);
  X.save(); X.beginPath(); X.rect(BOX.x0, BOX.y0, BOX.x1 - BOX.x0, BOX.y1 - BOX.y0); X.clip();
  // back panel: the light itself behind the paper
  X.fillStyle = D.back; X.fillRect(0, 0, W, H);
  const r = X.createRadialGradient(L.x, L.y, 0, L.x, L.y, L.r * 1.3); r.addColorStop(0, `rgba(${L.rgb},.95)`); r.addColorStop(.5, `rgba(${L.rgb},.35)`); r.addColorStop(1, `rgba(${L.rgb},0)`);
  X.fillStyle = r; X.fillRect(0, 0, W, H);
  D.layers.forEach((s, i) => {
    const c = layer(s, L), n = D.layers.length, depth = (i + 1) / n;
    X.save(); X.shadowColor = `rgba(8,4,2,${.45 + .25 * depth})`; X.shadowBlur = 14 + 26 * depth; X.shadowOffsetX = 3 + 6 * depth; X.shadowOffsetY = 8 + 14 * depth;
    X.drawImage(tint(c, s.rim || D.rim), 0, -3); X.restore();          // shadow + warm rim on the top edge
    X.drawImage(tint(c, 'rgba(0,0,0,.35)'), 0, 3);                       // dark band on the bottom edge
    X.drawImage(c, 0, 0);
    if (s.glow) s.glow(X, L);                                            // emissive windows on this layer
  });
  // light in the air between the sheets
  const h = X.createRadialGradient(L.x, L.y, 0, L.x, L.y, L.r * 1.8); h.addColorStop(0, `rgba(${L.rgb},.10)`); h.addColorStop(1, `rgba(${L.rgb},0)`);
  X.globalCompositeOperation = 'screen'; X.fillStyle = h; X.fillRect(0, 0, W, H); X.globalCompositeOperation = 'source-over';
  X.restore();
  // the box: a wooden frame, black lining, inner shadow
  X.save(); X.beginPath(); X.rect(0, 0, W, H); X.rect(BOX.x0, BOX.y0, BOX.x1 - BOX.x0, BOX.y1 - BOX.y0); X.clip('evenodd');
  const f = X.createLinearGradient(0, BOX.y0 - 40, 0, BOX.y1 + 40); f.addColorStop(0, '#3a2516'); f.addColorStop(1, '#22150c');
  X.fillStyle = f; X.fillRect(BOX.x0 - 36, BOX.y0 - 36, BOX.x1 - BOX.x0 + 72, BOX.y1 - BOX.y0 + 72); X.globalAlpha = .18; X.drawImage(grain, 0, 0); X.globalAlpha = 1; X.restore();
  X.save(); X.strokeStyle = 'rgba(0,0,0,.85)'; X.lineWidth = 30; X.filter = 'blur(14px)'; X.strokeRect(BOX.x0 - 6, BOX.y0 - 6, BOX.x1 - BOX.x0 + 12, BOX.y1 - BOX.y0 + 12); X.filter = 'none'; X.restore();
  // spill on the table below the box
  const s = X.createRadialGradient(W / 2, BOX.y1 + 40, 0, W / 2, BOX.y1 + 40, 700); s.addColorStop(0, `rgba(${L.rgb},.18)`); s.addColorStop(1, `rgba(${L.rgb},0)`); X.fillStyle = s; X.fillRect(0, BOX.y1 + 36, W, H);
  // gentle vignette
  const v = X.createRadialGradient(W / 2, H / 2, H * .45, W / 2, H / 2, H * 1.05); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.55)'); X.fillStyle = v; X.fillRect(0, 0, W, H);
  // caption under the box
  if (D.cap) { X.font = 'italic 500 40px "Cormorant Garamond"'; X.textAlign = 'center'; X.fillStyle = '#f2e6d2'; X.shadowColor = 'rgba(0,0,0,.9)'; X.shadowBlur = 12; X.fillText(D.cap, W / 2, H - 76); X.shadowBlur = 0; }
}

// emissive helper: burn a set of shapes with bloom
const burn = (shape, col, k = 1) => (g) => { g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = col;
  g.filter = 'blur(22px)'; g.globalAlpha = .55 * k; g.beginPath(); shape(g); g.fill(); g.filter = 'blur(6px)'; g.globalAlpha = .6 * k; g.beginPath(); shape(g); g.fill();
  g.filter = 'none'; g.globalAlpha = .9 * k; g.beginPath(); shape(g); g.fill(); g.restore(); };
// translucent vellum shafts of light
const shafts = (from, to, w, col, a) => (g) => { g.save(); g.globalCompositeOperation = 'screen'; g.filter = 'blur(10px)';
  for (let k = 0; k < from.length; k++) { const [x, y] = from[k], [u, v] = to[k]; const gr = g.createLinearGradient(x, y, u, v); gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr;
    g.beginPath(); g.moveTo(x - w[k], y); g.lineTo(x + w[k], y); g.lineTo(u + w[k] * 2.4, v); g.lineTo(u - w[k] * 2.4, v); g.closePath(); g.fill(); } g.filter = 'none'; g.restore(); };

// ---------- the five designs
const CX = 960, DESK = 760;
const DESIGNS = {
  // 1 · Dawn study: amber ladder, a tall arched window of lattice, the mushaf on its stand in the light
  1: () => ({ back: '#f6d9a4', rim: 'rgba(255,214,150,.9)', light: { x: 820, y: 330, r: 760, rgb: '255,196,120' }, cap: "Before you open the Qur'an.",
    layers: [
      { col: '#f0c98e', trans: .5, shape: q => domes(q, BOX.x0, BOX.x1, 560, 11) },
      { col: '#c98a4f', trans: .35, shape: full, holes: q => { arch(q, 820, 640, 420, 560); } },
      { col: '#8a4f2a', trans: .2, shape: full, holes: q => { arch(q, 820, 620, 380, 520); },
        glow: shafts([[700, 260], [820, 230], [930, 270]], [[900, 900], [1080, 900], [1240, 900]], [40, 30, 36], '255,214,150', .35) },
      { col: '#5e3219', trans: .1, shape: q => { arch(q, 820, 618, 382, 522); }, holes: q => { q.save?.(); lattice(q, 640, 120, 1000, 640, 64); }, rule: 'nonzero' },
      { col: '#3c1f10', trans: .05, shape: q => { q.rect(BOX.x0, DESK, BOX.x1 - BOX.x0, 200); q.rect(BOX.x0 + 1290, 300, 200, 470); }, holes: q => { arch(q, BOX.x0 + 1390, 520, 110, 180); } },
      { col: '#efe0bd', rim: 'rgba(255,236,200,.9)', trans: .3, shape: q => { pages(q, 1120, DESK, 1.05); } },
      { col: '#2a5a3e', rim: 'rgba(255,220,160,.9)', trans: .06, shape: q => { mushaf(q, 1120, DESK, 1.05); }, holes: q => { spine(q, 1120, DESK, 1.05); medallion(q, 1120, DESK, 1.05); frameHoles(q, 1120, DESK, 1.05); },
        glow: burn(q => { medallion(q, 1120, DESK, 1.05); }, '#ffcf7a', .9) },
      { col: '#1c0e06', trans: 0, shape: q => { rehal(q, 1120, DESK, 1.05); q.rect(BOX.x0, BOX.y0, 90, BOX.y1); q.moveTo(BOX.x0, BOX.y0); q.quadraticCurveTo(BOX.x0 + 260, BOX.y0 + 60, BOX.x0 + 150, BOX.y1); q.lineTo(BOX.x0, BOX.y1); q.closePath(); } },
    ] }),
  // 2 · Before dawn: a night-blue ladder, one warm lamp and the star on the cover as the only warm lights
  2: () => ({ back: '#2a3a6a', rim: 'rgba(170,190,255,.55)', light: { x: 1180, y: 600, r: 520, rgb: '255,176,96' }, cap: "Before you open the Qur'an.",
    layers: [
      { col: '#1a2550', trans: .25, shape: q => q.rect(0, 0, W, 600), holes: q => { seed = 3; for (let k = 0; k < 90; k++) circ(q, BOX.x0 + rnd() * 1580, BOX.y0 + rnd() * 460, 1.5 + rnd() * 2.6); star8(q, 1520, 170, 10, .45); q.moveTo(560 + 40, 210); q.arc(560, 210, 40, 0, Math.PI * 2); },
        glow: burn(q => { q.moveTo(600, 210); q.arc(560, 210, 40, 0, Math.PI * 2); }, '#ffe9c0', .7) },
      { col: '#0e1638', trans: .3, shape: q => { q.rect(0, 0, W, 600); }, holes: q => { q.moveTo(560 + 40, 210); q.arc(560, 210, 40, 0, Math.PI * 2); seed = 3; for (let k = 0; k < 90; k++) circ(q, BOX.x0 + rnd() * 1580, BOX.y0 + rnd() * 460, 1.5 + rnd() * 2.6); }, rule: 'evenodd' },
      { col: '#3f5a92', trans: .35, shape: q => domes(q, BOX.x0, BOX.x1, 600, 21) },
      { col: '#243565', trans: .2, shape: full, holes: q => { arch(q, 700, 640, 560, 600); } },
      { col: '#141c40', trans: .15, shape: q => { q.rect(BOX.x0, DESK, BOX.x1 - BOX.x0, 200); } },
      { col: '#efe0bd', rim: 'rgba(255,236,200,.9)', trans: .3, shape: q => { pages(q, 1050, DESK, 1); } },
      { col: '#1f4a3a', rim: 'rgba(255,200,130,.8)', trans: .25, shape: q => mushaf(q, 1050, DESK, 1), holes: q => { spine(q, 1050, DESK, 1); medallion(q, 1050, DESK, 1); frameHoles(q, 1050, DESK, 1); }, glow: burn(q => medallion(q, 1050, DESK, 1), '#ffc070', .8) },
      { col: '#0a0e22', trans: 0, shape: q => { rehal(q, 1050, DESK, 1); q.moveTo(1300, DESK); q.lineTo(1300, DESK - 40); q.quadraticCurveTo(1330, DESK - 70, 1380, DESK - 60); q.lineTo(1400, DESK - 74); q.lineTo(1404, DESK - 60); q.quadraticCurveTo(1380, DESK - 20, 1370, DESK); q.closePath(); },
        glow: burn(q => { q.ellipse(1402, DESK - 96, 9, 20, 0, 0, Math.PI * 2); }, '#ffb862', 1) },
    ] }),
  // 3 · Close: the mushaf large, light falling through a lattice, the cover waiting
  3: () => ({ back: '#f3cf92', rim: 'rgba(255,214,150,.9)', light: { x: 520, y: 220, r: 900, rgb: '255,190,110' }, cap: 'Something that might change the way you read it.',
    layers: [
      { col: '#d9a466', trans: .45, shape: full, holes: q => lattice(q, BOX.x0 - 40, BOX.y0 - 40, 900, 560, 96) },
      { col: '#a8693a', trans: .25, shape: q => { q.rect(BOX.x0, 640, BOX.x1 - BOX.x0, 300); },
        glow: shafts([[420, 120], [560, 120], [700, 140]], [[760, 900], [980, 900], [1200, 900]], [50, 40, 46], '255,214,150', .32) },
      { col: '#efe0bd', rim: 'rgba(255,236,200,.9)', trans: .3, shape: q => { pages(q, 980, 880, 1.7); } },
      { col: '#244f37', rim: 'rgba(255,224,170,.95)', trans: .08, shape: q => mushaf(q, 980, 880, 1.7), holes: q => { spine(q, 980, 880, 1.7); medallion(q, 980, 880, 1.7); frameHoles(q, 980, 880, 1.7); }, glow: burn(q => medallion(q, 980, 880, 1.7), '#ffd488', 1) },
      { col: '#170b05', trans: 0, shape: q => { rehal(q, 980, 880, 1.7); } },
    ] }),
  // 4 · Through the arches: nested arches step back to the mushaf at the end, in the light
  4: () => ({ back: '#fbe2b4', rim: 'rgba(255,220,160,.9)', light: { x: 960, y: 420, r: 620, rgb: '255,200,130' }, cap: "Before you open the Qur'an.",
    layers: [
      { col: '#f2c487', trans: .55, shape: full, holes: q => arch(q, 960, 600, 170, 290) },
      { col: '#e0a96a', trans: .45, shape: full, holes: q => arch(q, 960, 660, 290, 430) },
      { col: '#efe0bd', rim: 'rgba(255,236,200,.9)', trans: .3, shape: q => { pages(q, 960, 640, .42); } },
      { col: '#244f37', rim: 'rgba(255,224,170,.95)', trans: .2, shape: q => mushaf(q, 960, 640, .42), holes: q => medallion(q, 960, 640, .42), glow: burn(q => medallion(q, 960, 640, .42), '#ffd488', .9) },
      { col: '#5a2e17', trans: .1, shape: q => rehal(q, 960, 640, .42) },
      { col: '#c08048', trans: .3, shape: full, holes: q => arch(q, 960, 760, 470, 610) },
      { col: '#93552c', trans: .18, shape: full, holes: q => arch(q, 960, 860, 700, 790) },
      { col: '#5c3018', trans: .08, shape: full, holes: q => { arch(q, 960, 960, 1000, 900); } },
      { col: '#2c160a', trans: 0, shape: full, holes: q => { q.rect(BOX.x0 + 80, BOX.y0 + 40, BOX.x1 - BOX.x0 - 160, BOX.y1 - BOX.y0); }, },
    ] }),
  // 5 · Green and gold: a mashrabiya screen, the city beyond, the cover star as the one accent
  5: () => ({ back: '#e8efd2', rim: 'rgba(240,236,190,.85)', light: { x: 700, y: 360, r: 820, rgb: '255,220,150' }, cap: 'What exactly are you about to read?',
    layers: [
      { col: '#c9dcb2', trans: .5, shape: q => domes(q, BOX.x0, BOX.x1, 620, 5) },
      { col: '#7fa48a', trans: .35, shape: q => domes(q, BOX.x0, BOX.x1, 700, 9) },
      { col: '#2f5d55', trans: .2, shape: full, holes: q => { q.rect(380, 150, 760, 560); } },
      { col: '#1f453f', trans: .12, shape: q => q.rect(380, 150, 760, 560), holes: q => lattice(q, 380, 150, 1140, 710, 76),
        glow: shafts([[560, 300], [760, 300], [940, 320]], [[860, 900], [1060, 900], [1260, 900]], [40, 34, 40], '255,232,170', .28) },
      { col: '#12302c', trans: .05, shape: q => q.rect(BOX.x0, DESK, BOX.x1 - BOX.x0, 200) },
      { col: '#efe0bd', rim: 'rgba(255,236,200,.9)', trans: .3, shape: q => { pages(q, 1260, DESK, 1); } },
      { col: '#8a1f1a', rim: 'rgba(255,220,160,.9)', trans: .1, shape: q => mushaf(q, 1260, DESK, 1), holes: q => { spine(q, 1260, DESK, 1); medallion(q, 1260, DESK, 1); frameHoles(q, 1260, DESK, 1); }, glow: burn(q => medallion(q, 1260, DESK, 1), '#ffd070', .9) },
      { col: '#081a17', trans: 0, shape: q => { rehal(q, 1260, DESK, 1); q.rect(BOX.x0, BOX.y0, BOX.x1 - BOX.x0, 60); for (let x = BOX.x0; x < BOX.x1; x += 80) arch(q, x + 40, BOX.y0 + 100, 70, 50, .2); } },
    ] }),
};

await document.fonts.ready;
await document.fonts.load('italic 500 40px "Cormorant Garamond"', 'Ab');
window.DUR = 1;
window.render = () => compose(DESIGNS[V]());
window.TEXTS = () => []; window.EV = [];
window.render(0);
window.READY = true;
