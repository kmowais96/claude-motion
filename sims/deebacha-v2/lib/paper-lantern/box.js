// Paper-cut lightbox in Canvas 2D: flat paper layers lit from behind, cast shadows, emissive windows with bloom,
// and a perspective camera that dollies and pans through the stack. Engine ideas from the paper-lantern demo
// (paper.js: grain, pulp cloud, finish(), backlight term), rebuilt for 2D.
import { mulberry, TAU, clamp } from '/core/lib.js';

export const W = 1920, H = 1080, CX = W / 2, CY = H / 2;
export function cv(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }

// —— textures: paper fibre (front grain) and pulp mottle (what backlight shows) ——
let _grain = null, _cloud = null;
export function GRAIN() {
  if (_grain) return _grain;
  const n = 384, c = cv(n, n), x = c.getContext('2d'), R = mulberry(7), img = x.createImageData(n, n), d = img.data;
  for (let i = 0; i < n * n; i++) { const v = R(); d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v < .5 ? 0 : 255; d[i * 4 + 3] = Math.abs(v - .5) * 26; }
  x.putImageData(img, 0, 0); x.lineCap = 'round';
  for (let i = 0; i < n * 1.4; i++) {
    const px = R() * n, py = R() * n, a = R() * TAU, l = 5 + R() * 22;
    x.strokeStyle = R() < .5 ? 'rgba(40,30,20,.10)' : 'rgba(255,255,255,.14)'; x.lineWidth = .5 + R() * .8;
    x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + Math.cos(a + .5) * l * .5, py + Math.sin(a + .5) * l * .5, px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke();
  }
  return (_grain = c);
}
export function CLOUD() {   // tiled multi-octave mottle, grey around .5
  if (_cloud) return _cloud;
  const n = 512, R = mulberry(3), c = cv(n, n), x = c.getContext('2d');
  x.fillStyle = '#808080'; x.fillRect(0, 0, n, n);
  for (const [cnt, rmin, rmax, a] of [[50, 50, 140, .22], [220, 14, 46, .16], [700, 4, 12, .1]]) {
    for (let i = 0; i < cnt; i++) {
      const px = R() * n, py = R() * n, r = rmin + R() * (rmax - rmin), v = R() < .5 ? 0 : 255;
      for (const ox of [-n, 0, n]) for (const oy of [-n, 0, n]) {
        if (px + ox + r < 0 || px + ox - r > n || py + oy + r < 0 || py + oy - r > n) continue;
        const g = x.createRadialGradient(px + ox, py + oy, 0, px + ox, py + oy, r);
        g.addColorStop(0, `rgba(${v},${v},${v},${a})`); g.addColorStop(1, `rgba(${v},${v},${v},0)`);
        x.fillStyle = g; x.fillRect(px + ox - r, py + oy - r, r * 2, r * 2);
      }
    }
  }
  x.lineCap = 'round';
  for (let i = 0; i < n * 2; i++) {
    const px = R() * n, py = R() * n, a = R() * TAU, l = 6 + R() * 30;
    x.strokeStyle = `rgba(255,255,255,${.05 + R() * .1})`; x.lineWidth = .6 + R();
    x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + Math.cos(a + .6) * l * .5, py + Math.sin(a + .6) * l * .5, px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke();
  }
  return (_cloud = c);
}

const hex = h => { h = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
const rgba = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;

// —— one paper layer ——
// o: { z, col, draw(x, R), trans, light: {x, y, r}, states: { name: { amb, col, k } }, shadow: {dx, dy, blur, a}, mx, my, blur, rim, under, sky }
// draw() works in design pixels (0..1920 × 0..1080, y down); the canvas has margins mx/my around the frame for camera moves.
export function layer(o) {
  const mx = o.mx ?? 160, my = o.my ?? 110, w = W + 2 * mx, h = H + 2 * my;
  const S = cv(w, h), x = S.getContext('2d');
  x.translate(mx, my); x.fillStyle = o.col; x.strokeStyle = o.col; x.lineJoin = 'round';
  o.draw(x, mulberry(o.seed || 1));
  x.setTransform(1, 0, 0, 1, 0, 0);
  if (o.sky) {   // unlit gradient back panel: no finish, no light
    const st = {}; for (const k in o.states || { on: 1 }) st[k] = S;
    return { z: o.z, mx, my, st, w, h };
  }
  // finish: grain, top rim light, bottom shade
  x.save(); x.globalCompositeOperation = 'source-atop'; x.globalAlpha = .9; x.fillStyle = x.createPattern(GRAIN(), 'repeat'); x.fillRect(0, 0, w, h); x.restore();
  const band = (dy, col, blur) => {
    const t = cv(w, h), y = t.getContext('2d');
    y.drawImage(S, 0, 0); y.globalCompositeOperation = 'destination-out'; y.drawImage(S, 0, dy);
    y.globalCompositeOperation = 'source-in'; y.fillStyle = col; y.fillRect(0, 0, w, h);
    x.save(); x.globalCompositeOperation = 'source-atop'; if (blur) x.filter = `blur(${blur}px)`; x.drawImage(t, 0, 0); x.restore();
  };
  band(o.rimPx ?? 3, `rgba(255,236,200,${o.rim ?? .4})`, .7);
  band(-(o.underPx ?? 3), `rgba(0,0,0,${o.under ?? .32})`, .9);
  // silhouette for the cast shadow
  let shadow = null;
  if (o.shadow !== false) {
    const sh = o.shadow || {}, b = sh.blur ?? 14;
    shadow = cv(w, h); const y = shadow.getContext('2d');
    y.filter = `blur(${b}px)`; y.globalAlpha = sh.a ?? .5; y.drawImage(S, sh.dx ?? 0, sh.dy ?? 12);
    y.filter = 'none'; y.globalAlpha = 1; y.globalCompositeOperation = 'source-in'; y.fillStyle = '#000'; y.fillRect(0, 0, w, h);
  }
  const L = o.light || { x: CX, y: CY, r: 800 };
  const st = {};
  for (const name in o.states) {
    const s = o.states[name], C = cv(w, h), y = C.getContext('2d');
    if (shadow) y.drawImage(shadow, 0, 0);
    const D = cv(w, h), d = D.getContext('2d');
    d.drawImage(S, 0, 0);
    d.globalCompositeOperation = 'source-atop'; d.fillStyle = `rgba(0,0,0,${1 - (s.amb ?? .4)})`; d.fillRect(0, 0, w, h);
    const k = (o.trans ?? .3) * (s.k ?? 1);
    if (k > 0) {
      // backlight: albedo × lightCol × trans × gaussian falloff × (.35 + 1.3·cloud)
      const E = cv(w, h), e = E.getContext('2d'), lc = hex(s.col || '#ffc878');
      e.drawImage(S, 0, 0); e.globalCompositeOperation = 'multiply';
      const g = e.createRadialGradient(L.x + mx, L.y + my, 0, L.x + mx, L.y + my, L.r * 1.9);
      for (let i = 0; i <= 8; i++) { const r = i / 8, f = .22 + .78 * Math.exp(-((r * 1.9) ** 2)), v = Math.min(1, f); g.addColorStop(r, rgba(lc.map(q => q * v))); }
      e.fillStyle = g; e.fillRect(0, 0, w, h);
      e.globalCompositeOperation = 'overlay'; e.globalAlpha = .55; const sc = o.cloudS ?? 1;
      e.save(); e.scale(sc, sc); e.fillStyle = e.createPattern(CLOUD(), 'repeat'); e.fillRect(0, 0, w / sc, h / sc); e.restore();
      e.globalAlpha = 1; e.globalCompositeOperation = 'destination-in'; e.drawImage(S, 0, 0);
      d.globalCompositeOperation = 'lighter';
      let rem = k * 1.6; while (rem > 0) { d.globalAlpha = Math.min(1, rem); d.drawImage(E, 0, 0); rem -= 1; }
      d.globalAlpha = 1; d.globalCompositeOperation = 'destination-in'; d.drawImage(S, 0, 0);
    }
    if (o.blur) y.filter = `blur(${o.blur}px)`;
    y.drawImage(D, 0, 0); y.filter = 'none';
    st[name] = C;
  }
  return { z: o.z, mx, my, st, w, h };
}

// —— camera: perspective through the stack ——
// cam: { d (1 = reference, smaller = closer), px, py (lateral position in reference px) }
// a point u on a layer at depth z lands at C + (u − C)·k − P/(d + z), k = (1 + z)/(d + z)
export function proj(cam, z) {
  const q = cam.d + z; if (q <= .004) return null;
  const k = (1 + z) / q;
  return { k, ox: CX * (1 - k) - cam.px / q, oy: CY * (1 - k) - cam.py / q };
}
// VIEW.s scales everything drawn (render into a smaller offscreen canvas)
export const VIEW = { s: 1 };
export function setT(ctx, p, s = 1) { s *= VIEW.s; ctx.setTransform(p.k * s, 0, 0, p.k * s, p.ox * s, p.oy * s); }
// camera that centres the design point (u, v) of a layer at depth z, at distance d
export function aimAt(u, v, z, d) { return { d, px: (u - CX) * (1 + z), py: (v - CY) * (1 + z) }; }
export function mixCam(a, b, f) { return { d: a.d + (b.d - a.d) * f, px: a.px + (b.px - a.px) * f, py: a.py + (b.py - a.py) * f }; }
export function drift(cam, t, amp = 1.4) {
  return { d: cam.d, px: cam.px + amp * (Math.sin(t * .61) + .5 * Math.sin(t * 1.37 + 1)), py: cam.py + amp * .7 * (Math.sin(t * .47 + 2) + .5 * Math.sin(t * 1.11)) };
}

// draw a layer at a blend of its states: list of [name, weight] (weights sum ≤ 1 drawn in order)
export function drawLayer(ctx, Lr, cam, blend, alpha = 1) {
  const p = proj(cam, Lr.z); if (!p) return null;
  setT(ctx, p);
  let acc = 0;
  for (const [name, wgt] of blend) {
    if (wgt <= .002) continue;
    // stack states so the result is the weighted mix: draw each later state over the earlier with alpha w/(acc+w)
    const a = acc === 0 ? 1 : wgt / (acc + wgt);
    acc += wgt;
    ctx.globalAlpha = a * alpha; ctx.drawImage(Lr.st[name], -Lr.mx, -Lr.my);
  }
  ctx.globalAlpha = 1;
  return p;
}
// two-state helper: 0 → a, 1 → b
export const bl = (a, b, f) => f <= .002 ? [[a, 1]] : f >= .998 ? [[b, 1]] : [[a, 1 - f], [b, f]];

// —— light: crisp emissive cores now, bloom from a quarter-resolution light layer at the end ——
export class Glow {
  constructor() { this.L = cv(W / 4, H / 4); this.B1 = cv(W / 4, H / 4); this.B2 = cv(W / 8, H / 8); this.x = this.L.getContext('2d'); }
  begin() { const x = this.x; x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; x.clearRect(0, 0, W / 4, H / 4); x.globalCompositeOperation = 'lighter'; }
  // run fn(x) in a layer's transform, on the main ctx (cores) and on the light layer (bloom source)
  at(ctx, p, fn, bloom = 1) {
    setT(ctx, p); ctx.save(); ctx.globalCompositeOperation = 'lighter'; fn(ctx, 1); ctx.restore();
    if (bloom > 0) { setT(this.x, p, .25); this.x.save(); this.x.globalAlpha = bloom; fn(this.x, bloom); this.x.restore(); }
  }
  end(ctx, gain = 1) {
    const b1 = this.B1.getContext('2d'), b2 = this.B2.getContext('2d');
    b1.setTransform(1, 0, 0, 1, 0, 0); b1.clearRect(0, 0, W / 4, H / 4); b1.filter = 'blur(4px)'; b1.drawImage(this.L, 0, 0); b1.filter = 'none';
    b2.setTransform(1, 0, 0, 1, 0, 0); b2.clearRect(0, 0, W / 8, H / 8); b2.filter = 'blur(7px)'; b2.drawImage(this.L, 0, 0, W / 8, H / 8); b2.filter = 'none';
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = clamp(.9 * gain, 0, 1); ctx.drawImage(this.B1, 0, 0, W, H);
    ctx.globalAlpha = clamp(.8 * gain, 0, 1); ctx.drawImage(this.B2, 0, 0, W, H);
    ctx.restore();
  }
}

// lens vignette + darker lower band (captions sit on it)
let _vig = null;
export function vignette(ctx, a = 1) {
  if (!_vig) {
    _vig = cv(W, H); const x = _vig.getContext('2d');
    const g = x.createRadialGradient(CX, CY * .92, H * .25, CX, CY, H * 1.02);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.6, 'rgba(0,0,0,.18)'); g.addColorStop(1, 'rgba(0,0,0,.62)');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    const b = x.createLinearGradient(0, H - 260, 0, H);
    b.addColorStop(0, 'rgba(0,0,0,0)'); b.addColorStop(.55, 'rgba(0,0,0,.35)'); b.addColorStop(1, 'rgba(0,0,0,.6)');
    x.fillStyle = b; x.fillRect(0, H - 260, W, 260);
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = a; ctx.drawImage(_vig, 0, 0); ctx.globalAlpha = 1;
}

// lamp flicker
export const flick = (t, s = 0) => 1 + .06 * Math.sin(7.3 * t + s) * Math.sin(3.1 * t + s * 1.7);

// a scene cache that keeps at most a couple of built scenes alive (memory), rebuilt deterministically on demand
const _scenes = new Map();
export function scene(key, build) {
  if (_scenes.has(key)) { const v = _scenes.get(key); _scenes.delete(key); _scenes.set(key, v); return v; }
  const v = build(); _scenes.set(key, v);
  while (_scenes.size > 2) _scenes.delete(_scenes.keys().next().value);
  return v;
}

// —— shapes ——
export function rr(x, a, b, w, h, r) { x.beginPath(); x.roundRect(a, b, w, h, r); }
export function archWin(x, cx, top, w, h) {   // arched window outline (path only, appended)
  const r = w / 2; x.moveTo(cx - r, top + h); x.lineTo(cx - r, top + r); x.arc(cx, top + r, r, Math.PI, 0); x.lineTo(cx + r, top + h); x.closePath();
}
export function cut(x, fn) { x.save(); x.globalCompositeOperation = 'destination-out'; x.fillStyle = '#000'; x.strokeStyle = '#000'; fn(x); x.restore(); }
// a cut paper strip with letters cut through it (texture), anchored at its left edge
export function cutStrip(text, o) {
  const pad = o.pad ?? 40, fs = o.size ?? 64;
  const m = cv(10, 10).getContext('2d'); m.font = `${o.weight || 600} ${fs}px ${o.font || '"Cormorant Garamond"'}`;
  if (o.ls) m.letterSpacing = o.ls + 'px';
  const tw = m.measureText(text).width, w = Math.ceil(tw + pad * 2 + (o.extra || 0)), h = Math.ceil(o.h ?? fs * 1.6);
  const S = cv(w + 40, h + 40), x = S.getContext('2d'); x.translate(20, 20);
  // deckled strip
  x.fillStyle = o.col || '#1a1008'; x.beginPath();
  const R = mulberry(o.seed || 9);
  x.moveTo(0, 0); for (let i = 1; i <= 30; i++) x.lineTo(w * i / 30, (R() - .5) * 2.2);
  for (let i = 1; i <= 6; i++) x.lineTo(w + (R() - .5) * 2, h * i / 6);
  for (let i = 29; i >= 0; i--) x.lineTo(w * i / 30, h + (R() - .5) * 2.2);
  x.closePath(); x.fill();
  x.globalCompositeOperation = 'source-atop'; x.globalAlpha = .9; x.fillStyle = x.createPattern(GRAIN(), 'repeat'); x.fillRect(0, 0, w, h); x.globalAlpha = 1;
  x.fillStyle = 'rgba(255,236,200,.22)'; x.fillRect(0, 0, w, 2.5); x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(0, h - 3, w, 3);
  x.globalCompositeOperation = 'source-over';
  // light that shows through the cut letters
  const G = cv(w + 40, h + 40), g = G.getContext('2d'); g.translate(20, 20);
  g.font = m.font; if (o.ls) g.letterSpacing = o.ls + 'px'; g.textBaseline = 'middle'; g.textAlign = 'left';
  g.fillStyle = '#fff'; g.fillText(text, pad, h / 2 + (o.dy || 0));
  if (o.decor) o.decor(g, w, h, x);
  cut(x, y => { y.drawImage(G, -20, -20); });
  // the strip's own cast shadow
  const Sh = cv(w + 40, h + 40), s = Sh.getContext('2d'); s.filter = 'blur(8px)'; s.globalAlpha = .55; s.drawImage(S, 0, 0); s.filter = 'none'; s.globalCompositeOperation = 'source-in'; s.fillStyle = '#000'; s.fillRect(0, 0, w + 40, h + 40);
  return { S, G, Sh, w, h };
}
// draw a cut strip growing from its left edge: k 0..1, glow colour, at (x0, y0) = left-top, in current transform
export function drawStrip(ctx, st, x0, y0, k, glowCol, glowA = 1, alpha = 1) {
  if (k <= 0 || alpha <= 0) return;
  const wv = st.w * k;
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.beginPath(); ctx.rect(x0 - 30, y0 - 30, wv + 30, st.h + 80); ctx.clip();
  ctx.drawImage(st.Sh, x0 - 20 + 5, y0 - 20 + 12);
  // light behind the letters
  ctx.fillStyle = glowCol; ctx.globalAlpha = alpha * glowA;
  ctx.drawImage(tint(st, glowCol), x0 - 20, y0 - 20);
  ctx.globalAlpha = alpha;
  ctx.drawImage(st.S, x0 - 20, y0 - 20);
  ctx.restore();
}
const _tint = new Map();
function tint(st, col) {
  const key = st; let m = _tint.get(key); if (!m) { m = new Map(); _tint.set(key, m); }
  if (!m.has(col)) { const c = cv(st.G.width, st.G.height), x = c.getContext('2d'); x.drawImage(st.G, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, c.width, c.height); m.set(col, c); }
  return m.get(col);
}
