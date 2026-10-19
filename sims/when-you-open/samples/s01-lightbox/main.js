// Scene 1 design stills in the paper-cut lightbox look: a shallow box of cut card, lit from behind.
// ?v=1..5 picks the design. Canvas 2D only: each layer is one flat colour with cut holes, a warm top rim,
// backlit translucency and a soft cast shadow on the layer behind.
const W = 1920, H = 1080, C = document.getElementById('c'), X = C.getContext('2d');
import { estimate } from './timing.js';
import { drawCaption } from './caption.js';
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
// a modern desk lamp in profile: round foot, two straight arms, a cone shade tipped toward the desk (mouth at about x-118, y-274)
const bar = (q, x1, y1, x2, y2, w) => { const a = Math.atan2(y2 - y1, x2 - x1), dx = Math.sin(a) * w / 2, dy = -Math.cos(a) * w / 2;
  q.moveTo(x1 + dx, y1 + dy); q.lineTo(x2 + dx, y2 + dy); q.lineTo(x2 - dx, y2 - dy); q.lineTo(x1 - dx, y1 - dy); q.closePath(); circ(q, x2, y2, w * .8); };
const deskLamp = (q, x, base) => { q.moveTo(x - 70, base); q.quadraticCurveTo(x - 66, base - 22, x, base - 24); q.quadraticCurveTo(x + 66, base - 22, x + 70, base); q.closePath();
  bar(q, x, base - 20, x + 40, base - 170, 10); bar(q, x + 40, base - 170, x - 60, base - 300, 10);
  q.moveTo(x - 50, base - 318); q.lineTo(x - 36, base - 296); q.lineTo(x - 98, base - 236); q.quadraticCurveTo(x - 128, base - 262, x - 138, base - 312); q.closePath(); };
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
    if ((s.a ?? 1) <= 0) return;
    const c = layer(s, L), n = D.layers.length, depth = (i + 1) / n;
    X.save(); X.globalAlpha = s.a ?? 1; X.translate(s.ox || 0, s.oy || 0);   // a sheet sliding into its slot
    X.save(); X.shadowColor = `rgba(8,4,2,${.45 + .25 * depth})`; X.shadowBlur = 14 + 26 * depth; X.shadowOffsetX = 3 + 6 * depth; X.shadowOffsetY = 8 + 14 * depth;
    X.drawImage(tint(c, s.rim || D.rim), 0, -3); X.restore();          // shadow + warm rim on the top edge
    X.drawImage(tint(c, 'rgba(0,0,0,.35)'), 0, 3);                       // dark band on the bottom edge
    X.drawImage(c, 0, 0);
    if (s.glow) s.glow(X, L);                                            // emissive windows on this layer
    X.restore();
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
  drawCaption(X, S, D.t);
}

// emissive helper: burn a set of shapes with bloom
const burn = (shape, col, k = 1) => (g) => { g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = col;
  g.filter = 'blur(22px)'; g.globalAlpha = .55 * k; g.beginPath(); shape(g); g.fill(); g.filter = 'blur(6px)'; g.globalAlpha = .6 * k; g.beginPath(); shape(g); g.fill();
  g.filter = 'none'; g.globalAlpha = .9 * k; g.beginPath(); shape(g); g.fill(); g.restore(); };
// translucent vellum shafts of light
const shafts = (from, to, w, col, a) => (g) => { g.save(); g.globalCompositeOperation = 'screen'; g.filter = 'blur(10px)';
  for (let k = 0; k < from.length; k++) { const [x, y] = from[k], [u, v] = to[k]; const gr = g.createLinearGradient(x, y, u, v); gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr;
    g.beginPath(); g.moveTo(x - w[k], y); g.lineTo(x + w[k], y); g.lineTo(u + w[k] * 2.4, v); g.lineTo(u - w[k] * 2.4, v); g.closePath(); g.fill(); } g.filter = 'none'; g.restore(); };

// ---------- scene 1 · design 2 (before dawn, a modern desk lamp), moving
const CX = 960, DESK = 760;
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
], 5.0);
const T_LAMP = 3.6, T_WALK = S[3].start, WALK = 7, T_REACH = S[11].start, T_FREEZE = S[12].start - .2;
const DUR = S[12].end + 3;
const cl = x => Math.max(0, Math.min(1, x)), io = x => { x = cl(x); return x * x * (3 - 2 * x); }, out = x => 1 - Math.pow(1 - cl(x), 3);
const lerp = (a, b, k) => a + (b - a) * k;

// the reader: a flat card silhouette in profile facing the book; no features, only outline
const STAND = [[-10, -292], [14, -292], [32, -258], [36, -150], [44, 0], [-44, 0], [-36, -150], [-32, -258]];
const KNEEL = [[0, -190], [26, -186], [40, -156], [50, -84], [104, -26], [108, 0], [-58, 0], [-54, -96]];
const reader = (q, x, base, kn, reach, bob) => {
  const b = base + bob;
  const P = STAND.map((p, i) => [x + lerp(p[0], KNEEL[i][0], kn), b + lerp(p[1], KNEEL[i][1], kn)]), n = P.length, mid = i => [(P[i][0] + P[(i + 1) % n][0]) / 2, (P[i][1] + P[(i + 1) % n][1]) / 2];
  const m0 = mid(n - 1); q.moveTo(m0[0], m0[1]); for (let i = 0; i < n; i++) { const m = mid(i), sharp = i === 4 || i === 5; sharp ? (q.lineTo(P[i][0], P[i][1]), q.lineTo(m[0], m[1])) : q.quadraticCurveTo(P[i][0], P[i][1], m[0], m[1]); } q.closePath();
  circ(q, x + lerp(0, 12, kn), b + lerp(-314, -208, kn), 22);
  const sx = x + lerp(10, 22, kn), sy = b + lerp(-270, -170, kn);
  const rx = x + lerp(18, 70, kn), ry = b + lerp(-150, -60, kn);
  bar(q, sx, sy, lerp(rx, 893, reach), lerp(ry, 612, reach), 15);
};

function design(t) {
  const tt = Math.min(t, T_FREEZE);                       // everything stops just before the page; only the words go on
  const lamp = io((tt - T_LAMP) / .3), dawn = .6 * io((tt - 10) / (T_FREEZE - 10));
  const walk = io((tt - T_WALK) / WALK), x = lerp(40, 760, walk), moving = tt > T_WALK && tt < T_WALK + WALK;
  const bob = moving ? -Math.abs(Math.sin((x - 40) / 46 * Math.PI)) * 5 : 0;
  const kn = io((tt - T_WALK - WALK - .2) / 1.6), reach = out((tt - T_REACH) / (T_FREEZE - T_REACH));
  const layers = [
    { col: '#1a2550', trans: .25, shape: q => q.rect(0, 0, W, 600), holes: q => { seed = 3; for (let k = 0; k < 90; k++) circ(q, BOX.x0 + rnd() * 1580, BOX.y0 + rnd() * 460, 1.5 + rnd() * 2.6); star8(q, 1520, 170, 10, .45); q.moveTo(560 + 40, 210); q.arc(560, 210, 40, 0, Math.PI * 2); },
      glow: burn(q => { q.moveTo(600, 210); q.arc(560, 210, 40, 0, Math.PI * 2); }, '#ffe9c0', .7) },
    { col: '#0e1638', trans: .3, shape: q => { q.rect(0, 0, W, 600); }, holes: q => { q.moveTo(560 + 40, 210); q.arc(560, 210, 40, 0, Math.PI * 2); seed = 3; for (let k = 0; k < 90; k++) circ(q, BOX.x0 + rnd() * 1580, BOX.y0 + rnd() * 460, 1.5 + rnd() * 2.6); }, rule: 'evenodd',
      glow: g => { if (dawn <= 0) return; const gr = g.createLinearGradient(0, 600, 0, 260); gr.addColorStop(0, `rgba(255,164,118,${.6 * dawn})`); gr.addColorStop(1, 'rgba(255,164,118,0)'); g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = gr; g.fillRect(0, 260, W, 340); g.restore(); } },
    { col: '#3f5a92', trans: .35, shape: q => domes(q, BOX.x0, BOX.x1, 600, 21) },
    { col: '#243565', trans: .2, shape: full, holes: q => { arch(q, 700, 640, 560, 600); } },
    { col: '#141c40', trans: .15, shape: q => { q.rect(BOX.x0, DESK, BOX.x1 - BOX.x0, 200); } },
    { col: '#efe0bd', rim: 'rgba(255,236,200,.9)', trans: .3, shape: q => { pages(q, 1050, DESK, 1); } },
    { col: '#1f4a3a', rim: 'rgba(255,200,130,.8)', trans: .25, shape: q => mushaf(q, 1050, DESK, 1), holes: q => { spine(q, 1050, DESK, 1); medallion(q, 1050, DESK, 1); frameHoles(q, 1050, DESK, 1); }, glow: burn(q => medallion(q, 1050, DESK, 1), '#ffc070', .3 + .55 * lamp) },
    { col: '#0a0e22', trans: 0, shape: q => { rehal(q, 1050, DESK, 1); deskLamp(q, 1470, DESK); },
      glow: q => { if (lamp <= 0) return; shafts([[1352, 488]], [[1240, DESK]], [34], '255,196,120', .35 * lamp)(q); burn(q => { q.ellipse(1352, 486, 30, 9, -.55, 0, Math.PI * 2); }, '#ffcf88', lamp)(q); } },
  ];
  layers.forEach((s, i) => { const t0 = .2 + i * .3, k = out((tt - t0) / 1.1); s.oy = (1 - k) * 70; s.a = cl((tt - t0) / .5); });
  layers.push({ col: '#05081a', rim: 'rgba(170,190,255,.45)', trans: 0, a: tt > T_WALK ? 1 : 0, shape: q => reader(q, x, DESK, kn, reach, bob) });
  return { t, back: '#2a3a6a', rim: 'rgba(170,190,255,.55)', light: lamp > .5 ? { x: 1300, y: 560, r: 260 + 300 * lamp, rgb: '255,186,110' } : { x: 560, y: 210, r: 520, rgb: '150,170,235' }, layers };
}

await document.fonts.ready;
await document.fonts.load('italic 500 42px "Cormorant Garamond"', 'Ab');
window.DUR = DUR;
window.render = t => compose(design(t));
window.TEXTS = t => { const c = S.find(x => t >= x.start - .1 && t < x.end + .5); return c ? [{ id: 'cap', text: c.text, x0: 200, y0: 970, x1: 1720, y1: 1030 }] : []; };
window.EV = [];
window.render(0);
window.READY = true;
