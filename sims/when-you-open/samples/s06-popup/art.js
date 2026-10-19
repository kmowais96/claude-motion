// Cut-paper art for scene 06: page spreads, set pieces and faceless figures (Canvas2D, then finishCut).
import { cv, finishCut, paperFill, INK, blob, sh, smoothClosed, smoothOpen, crescent, GRAIN } from './paper.js';
import { mulberry, TAU } from './lib.js';

export const P = 5000;                 // px per metre for cards
const BORDER = 9, PAD = 16;

// card: draws fn(x, w, h) into a content box of wM×hM metres; anchor at bottom centre of the content.
export function card(wM, hM, fn, o = {}) {
  const w = Math.round(wM * P), h = Math.round(hM * P), c = cv(w + PAD * 2, h + PAD * 2), x = c.getContext('2d');
  x.translate(PAD, PAD); fn(x, w, h);
  const out = finishCut(c, o.border ?? BORDER);
  return { c: out, w: c.width / P, h: c.height / P, ax: o.ax ?? .5, ay: (PAD + h + (o.sink ?? 4)) / c.height };
}

const shade = (hex, k = .78) => { const n = parseInt(hex.slice(1), 16), r = n >> 16, g = n >> 8 & 255, b = n & 255; return `rgb(${r * k | 0},${g * k | 0},${b * (k + .04) | 0})`; };
function wavyTop(w, h, seed, amp, base, n = 40) {
  const R = mulberry(seed), ph = [R() * TAU, R() * TAU, R() * TAU], pts = [];
  for (let i = 0; i <= n; i++) { const u = i / n; pts.push([u * w, base - amp * (Math.sin(u * 3.1 + ph[0]) * .6 + Math.sin(u * 7.3 + ph[1]) * .25 + Math.sin(u * 1.7 + ph[2]) * .5 + .4)]); }
  return pts;
}
function ridgePath(x, w, h, pts) { x.beginPath(); x.moveTo(0, h); x.lineTo(pts[0][0], pts[0][1]); smoothOpen(x, pts, false); x.lineTo(w, h); x.closePath(); }

// ---------- set pieces ----------
export function dunes(x, w, h, col, seed, amp = .5) {
  const pts = wavyTop(w, h, seed, h * amp, h * .9 - h * amp * .2);
  const path = () => ridgePath(x, w, h, pts);
  path(); x.fillStyle = col; x.fill();
  crescent(x, path, shade(col, .86), w * .05, -h * .08, col);
  x.save(); path(); x.clip(); x.strokeStyle = 'rgba(58,42,36,.28)'; x.lineWidth = 3; x.lineCap = 'round';
  const R = mulberry(seed + 9);
  for (let i = 0; i < 7; i++) { const px = R() * w, py = h * (.45 + R() * .45), l = w * (.06 + R() * .08); x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + l * .5, py - 8, px + l, py); x.stroke(); }
  x.restore(); path(); sh(x, null, 6);
}
export function mesa(x, w, h, col, seed) {
  const R = mulberry(seed), pts = [[0, h]]; let px = 0;
  while (px < w) { const top = h * (.15 + R() * .55), wd = w * (.12 + R() * .2); pts.push([px + wd * .12, top + 10], [px + wd * .88, top]); px += wd; }
  pts.push([w, h]);
  const path = () => { x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); };
  path(); x.fillStyle = col; x.fill(); crescent(x, path, shade(col, .82), -w * .02, -h * .06, col);
  x.save(); path(); x.clip(); x.strokeStyle = 'rgba(58,42,36,.25)'; x.lineWidth = 3;
  for (let i = 1; i < 4; i++) { x.beginPath(); x.moveTo(0, h * (.35 + i * .15)); x.lineTo(w, h * (.33 + i * .15)); x.stroke(); }
  x.restore(); path(); sh(x, null, 6);
}
export function rock(x, w, h, col, seed) {
  const path = () => blob(x, w / 2, h * .55, w * .46, h * .45, .12, seed, 22);
  path(); x.fillStyle = col; x.fill(); crescent(x, path, shade(col, .78), w * .1, -h * .1, col); path(); sh(x, null, 5);
}
export function acacia(x, w, h) {
  x.lineCap = 'round';
  const trunk = () => { x.beginPath(); x.moveTo(w * .5, h); x.quadraticCurveTo(w * .48, h * .6, w * .32, h * .38); x.moveTo(w * .49, h * .62); x.quadraticCurveTo(w * .6, h * .5, w * .68, h * .36); };
  trunk(); x.lineWidth = 22; x.strokeStyle = INK; x.stroke(); trunk(); x.lineWidth = 13; x.strokeStyle = '#8a5a36'; x.stroke();
  const can = () => blob(x, w * .5, h * .27, w * .47, h * .16, .1, 4, 30);
  can(); x.fillStyle = '#8a9a48'; x.fill(); crescent(x, can, '#6e7c36', 0, -h * .07, '#8a9a48'); can(); sh(x, null, 6);
}
export function palm(x, w, h, seed = 1) {
  const R = mulberry(seed), tx = w * .55, ty = h * .2;
  const tr = () => { x.beginPath(); x.moveTo(w * .45, h); x.quadraticCurveTo(w * .4, h * .55, tx, ty); };
  tr(); x.lineWidth = 26; x.strokeStyle = INK; x.lineCap = 'round'; x.stroke(); tr(); x.lineWidth = 16; x.strokeStyle = '#a0703e'; x.stroke();
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + (i - 3) * .55 + (R() - .5) * .2, l = w * (.32 + R() * .12), ex = tx + Math.cos(a) * l * 1.2, ey = ty + Math.sin(a) * l * .6 + l * .35;
    const leaf = () => { x.beginPath(); x.moveTo(tx, ty); x.quadraticCurveTo(tx + Math.cos(a) * l * .7, ty + Math.sin(a) * l * .9 - 26, ex, ey); x.quadraticCurveTo(tx + Math.cos(a) * l * .5, ty + Math.sin(a) * l * .4 + 10, tx, ty); };
    leaf(); x.fillStyle = i % 2 ? '#5f9a4a' : '#4f8a3e'; x.fill(); leaf(); sh(x, null, 5);
  }
}
export function roundTree(x, w, h, col = '#6f9e4c', seed = 3) {
  const tr = () => { x.beginPath(); x.moveTo(w * .5, h); x.lineTo(w * .5, h * .45); };
  tr(); x.lineWidth = 20; x.strokeStyle = INK; x.lineCap = 'round'; x.stroke(); tr(); x.lineWidth = 11; x.strokeStyle = '#8a5a36'; x.stroke();
  const can = () => blob(x, w * .5, h * .36, w * .45, h * .33, .09, seed, 30);
  can(); x.fillStyle = col; x.fill(); crescent(x, can, shade(col, .8), w * .09, -h * .08, col); can(); sh(x, null, 6);
}
export function tent(x, w, h) {
  const path = () => { x.beginPath(); x.moveTo(w * .02, h); x.lineTo(w * .14, h * .32); x.quadraticCurveTo(w * .5, h * .02, w * .86, h * .32); x.lineTo(w * .98, h); x.closePath(); };
  path(); x.fillStyle = '#efe0bf'; x.fill();
  x.save(); path(); x.clip(); x.fillStyle = '#9a5a3a'; for (let i = 0; i < 6; i++) x.fillRect(w * (.05 + i * .17), 0, w * .06, h);
  x.fillStyle = 'rgba(80,50,30,.18)'; x.fillRect(w * .5, 0, w * .5, h); x.restore();
  x.beginPath(); x.moveTo(w * .4, h); x.lineTo(w * .47, h * .52); x.lineTo(w * .58, h * .52); x.lineTo(w * .64, h); x.closePath(); sh(x, '#3e2a22', 0);
  path(); sh(x, null, 6);
  x.beginPath(); x.moveTo(w * .4, h); x.lineTo(w * .47, h * .52); x.lineTo(w * .58, h * .52); x.lineTo(w * .64, h); sh(x, null, 4);
}
export function fire(x, w, h, f) {
  const R = mulberry(f * 31 + 7);
  for (const [a, b] of [[.15, .85], [.85, .2]]) { x.beginPath(); x.moveTo(w * a, h * .97); x.lineTo(w * b, h * .78); x.lineWidth = 16; x.strokeStyle = INK; x.lineCap = 'round'; x.stroke(); x.lineWidth = 8; x.strokeStyle = '#7a4a2a'; x.stroke(); }
  const fl = (s, col) => { const pts = []; const n = 9; for (let i = 0; i < n; i++) { const a = i / n * TAU, top = Math.sin(a) < 0 ? 1 + .55 * (1 - Math.abs(Math.cos(a))) + R() * .25 : .7; pts.push([w * .5 + Math.cos(a) * w * .3 * s, h * .72 + Math.sin(a) * h * .38 * s * top]); } x.beginPath(); smoothClosed(x, pts); x.fillStyle = col; x.fill(); return pts; };
  const p = fl(1, '#f08a2a'); x.beginPath(); smoothClosed(x, p); sh(x, null, 5); fl(.55, '#ffd25a');
}
export function well(x, w, h) {
  // posts and beam
  for (const px of [.14, .86]) { x.beginPath(); x.moveTo(w * px, h * .6); x.lineTo(w * px, h * .05); x.lineWidth = 18; x.strokeStyle = INK; x.lineCap = 'round'; x.stroke(); x.lineWidth = 9; x.strokeStyle = '#8a5a36'; x.stroke(); }
  x.beginPath(); x.moveTo(w * .08, h * .07); x.lineTo(w * .92, h * .07); x.lineWidth = 18; x.strokeStyle = INK; x.stroke(); x.lineWidth = 9; x.strokeStyle = '#8a5a36'; x.stroke();
  x.beginPath(); x.moveTo(w * .5, h * .08); x.lineTo(w * .5, h * .3); x.lineWidth = 3; x.strokeStyle = INK; x.stroke();
  x.beginPath(); x.roundRect(w * .43, h * .28, w * .14, h * .12, 6); sh(x, '#3f8f8c', 4);
  const body = () => { x.beginPath(); x.moveTo(w * .05, h * .55); x.quadraticCurveTo(w * .5, h * .45, w * .95, h * .55); x.lineTo(w * .95, h); x.lineTo(w * .05, h); x.closePath(); };
  body(); x.fillStyle = '#cdb48c'; x.fill();
  x.save(); body(); x.clip(); x.strokeStyle = 'rgba(58,42,36,.45)'; x.lineWidth = 3;
  for (let r = 0; r < 4; r++) { const y = h * (.6 + r * .11); x.beginPath(); x.moveTo(0, y); x.lineTo(w, y); x.stroke(); for (let k = 0; k < 6; k++) { const px = w * ((k + (r % 2) * .5) / 5.5); x.beginPath(); x.moveTo(px, y); x.lineTo(px, y + h * .11); x.stroke(); } }
  x.fillStyle = 'rgba(80,50,30,.2)'; x.fillRect(w * .62, 0, w, h); x.restore();
  body(); sh(x, null, 6);
  x.beginPath(); x.ellipse(w * .5, h * .53, w * .4, h * .04, 0, 0, TAU); sh(x, '#3f8f8c', 4);
}
export function house(x, w, h, lit = 1) {
  const body = () => { x.beginPath(); x.moveTo(w * .06, h); x.lineTo(w * .08, h * .3); x.quadraticCurveTo(w * .5, h * .22, w * .92, h * .3); x.lineTo(w * .94, h); x.closePath(); };
  body(); x.fillStyle = '#e2c49a'; x.fill(); crescent(x, body, '#c9a77c', w * .06, 0, '#e2c49a'); body(); sh(x, null, 6);
  const door = () => { x.beginPath(); x.moveTo(w * .36, h); x.lineTo(w * .36, h * .6); x.arc(w * .5, h * .6, w * .14, Math.PI, 0); x.lineTo(w * .64, h); x.closePath(); };
  door(); const g = x.createRadialGradient(w * .5, h * .75, 4, w * .5, h * .75, w * .25); g.addColorStop(0, lit ? '#fff2b0' : '#5a4636'); g.addColorStop(1, lit ? '#f2b640' : '#3e2e24'); x.fillStyle = g; x.fill(); door(); sh(x, null, 5);
  x.beginPath(); x.roundRect(w * .74, h * .45, w * .1, h * .12, 4); sh(x, lit ? '#f7cf62' : '#4a3a2e', 4);
}
export function lanternPost(x, w, h) {
  x.beginPath(); x.moveTo(w * .5, h); x.lineTo(w * .5, h * .1); x.lineTo(w * .78, h * .1); x.lineWidth = 14; x.strokeStyle = INK; x.lineCap = 'round'; x.stroke(); x.lineWidth = 7; x.strokeStyle = '#6a4a32'; x.stroke();
  const g = x.createRadialGradient(w * .78, h * .26, 2, w * .78, h * .26, w * .4); g.addColorStop(0, 'rgba(255,220,120,.6)'); g.addColorStop(1, 'rgba(255,220,120,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h * .6);
  x.beginPath(); x.roundRect(w * .66, h * .16, w * .24, h * .2, 6); sh(x, '#ffd766', 5);
}
export function sun(x, w, h) {
  x.beginPath(); x.moveTo(w * .5, h); x.lineTo(w * .5, h * .45); x.lineWidth = 3; x.strokeStyle = '#6b5a4a'; x.stroke();
  const d = () => blob(x, w * .5, w * .5, w * .44, w * .44, .03, 11, 30);
  d(); x.fillStyle = '#ffcf4a'; x.fill(); crescent(x, d, '#f0a836', w * .06, -w * .06, '#ffcf4a'); d(); sh(x, null, 6);
}

// ---------- figures (no faces: heads are plain, mostly covered, seen from side or behind) ----------
// o: { h (px), robe, cloth, skin, view:'side'|'back'|'sit', phase, walk, arm (rad, 0 = down), lean, staff, pack, cup }
export function figure(x, w, H, o) {
  const h = o.h ?? H, cx = w / 2;
  x.save(); x.translate(cx, H);
  const lw = Math.max(4, h * .028), r = h * .085, robe = o.robe, cloth = o.cloth ?? '#efe3c8', skin = o.skin ?? '#b9805a';
  const view = o.view || 'side';
  if (o.lean) x.transform(1, 0, o.lean, 1, 0, 0);
  const hem = -h * .17, neck = -h + r * 2, shY = neck + h * .035, wa = view === 'back' ? h * .12 : h * .085, wb = view === 'back' ? h * .17 : h * .14;
  const tube = (pts, wd, col) => { x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); smoothOpen(x, pts); x.lineWidth = wd + lw * 2; x.strokeStyle = INK; x.stroke(); x.beginPath(); smoothOpen(x, pts); x.lineWidth = wd; x.strokeStyle = col; x.stroke(); };
  if (view === 'sit') {
    // seated on the ground, side view facing right, knees up
    const top = -h * .62;
    const body = () => { x.beginPath(); x.moveTo(-h * .14, 0); x.quadraticCurveTo(-h * .16, top + h * .2, -h * .05, top + h * .12); x.quadraticCurveTo(h * .05, top + h * .1, h * .06, top + h * .25); x.quadraticCurveTo(h * .12, -h * .3, h * .3, -h * .2); x.quadraticCurveTo(h * .34, -h * .05, h * .3, 0); x.closePath(); };
    body(); x.fillStyle = robe; x.fill(); crescent(x, body, shade(robe), h * .05, h * .04, robe); body(); sh(x, null, lw);
    x.beginPath(); x.ellipse(h * .32, -h * .025, h * .05, h * .025, 0, 0, TAU); sh(x, skin, lw * .7);
    const hy = top + h * .02;
    x.beginPath(); x.arc(h * .0, hy, r, 0, TAU); sh(x, skin, lw);
    x.beginPath(); x.moveTo(h * .07, hy - r * .3); x.quadraticCurveTo(h * .02, hy - r * 1.6, -r * 1.1, hy - r * .3); x.quadraticCurveTo(-r * 1.6, hy + r * 1.6, -r * 1.2, hy + r * 2.6); x.lineTo(-r * .2, hy + r * 1.2); x.quadraticCurveTo(h * .02, hy + r * .2, h * .07, hy - r * .3); sh(x, cloth, lw);
    tube([[h * .02, top + h * .2], [h * .12, top + h * .3], [h * .2, -h * .27]], h * .045, robe);
    if (o.pack) { const b = () => blob(x, -h * .3, -h * .1, h * .14, h * .1, .1, 5); b(); x.fillStyle = o.pack; x.fill(); b(); sh(x, null, lw); }
    x.restore(); return;
  }
  // legs
  const ph = o.phase || 0, wk = o.walk || 0;
  for (const s of [1, -1]) {
    const sw = Math.sin(ph) * s * h * .075 * wk, lift = Math.max(0, Math.cos(ph) * s) * h * .03 * wk;
    const fx = view === 'back' ? s * h * .045 : sw;
    tube([[fx * .3 + (view === 'back' ? s * h * .03 : 0), hem], [fx, -lift - h * .015]], h * .045, '#5a4436');
    if (view !== 'back') { x.beginPath(); x.ellipse(fx + h * .025, -lift - h * .012, h * .035, h * .016, 0, 0, TAU); sh(x, '#4a3428', lw * .6); }
  }
  // pack on the back
  if (o.pack && view === 'side') { const b = () => blob(x, -wb * .75, shY + h * .17, h * .12, h * .14, .1, 5); b(); x.fillStyle = o.pack; x.fill(); crescent(x, b, shade(o.pack), h * .03, 0, o.pack); b(); sh(x, null, lw); }
  // robe
  const sk = view === 'side' ? -h * .02 : 0;
  const rb = () => { x.beginPath(); x.moveTo(-wa + sk, shY); x.quadraticCurveTo(sk, shY - h * .03, wa + sk, shY); x.quadraticCurveTo(wb * .95, (shY + hem) / 2, wb, hem); x.quadraticCurveTo(0, hem + h * .025, -wb, hem); x.quadraticCurveTo(-wb * .95, (shY + hem) / 2, -wa + sk, shY); x.closePath(); };
  rb(); x.fillStyle = robe; x.fill(); crescent(x, rb, shade(robe), view === 'back' ? -h * .05 : h * .06, 0, robe);
  x.save(); rb(); x.clip(); x.fillStyle = 'rgba(255,255,255,.14)'; x.fillRect(-wb, hem - h * .05, wb * 2, h * .025); x.restore();
  rb(); sh(x, null, lw);
  // back arm
  const arm = o.arm ?? .15, ax = view === 'back' ? 0 : h * .01, ay = shY + h * .03, L = h * .3;
  if (view === 'side') tube([[ax - h * .02, ay], [ax - h * .02 - Math.sin(.1) * L * .5, ay + L * .5], [ax - h * .01, ay + L * .95]], h * .05, shade(robe));
  // head + head cloth (covers the head; no features)
  const hx = view === 'side' ? h * .015 : 0, hy = -h + r;
  if (view === 'back') {
    x.beginPath(); x.arc(hx, hy, r * 1.08, 0, TAU); sh(x, cloth, lw);
    x.beginPath(); x.moveTo(-r * 1.05, hy + r * .2); x.quadraticCurveTo(-r * 1.3, hy + r * 2.2, -wa * .8, shY + h * .05); x.lineTo(wa * .8, shY + h * .05); x.quadraticCurveTo(r * 1.3, hy + r * 2.2, r * 1.05, hy + r * .2); x.closePath(); sh(x, cloth, lw);
    x.beginPath(); x.arc(hx, hy, r * 1.08, Math.PI * 1.05, Math.PI * 1.95); x.lineWidth = lw * .8; x.strokeStyle = 'rgba(58,42,36,.5)'; x.stroke();
  } else {
    x.beginPath(); x.arc(hx, hy, r, 0, TAU); sh(x, skin, lw);
    x.beginPath(); x.moveTo(hx + r * .55, hy - r * .55); x.quadraticCurveTo(hx, hy - r * 1.55, hx - r * 1.1, hy - r * .4); x.quadraticCurveTo(hx - r * 1.6, hy + r * 1.4, hx - r * 1.4, shY + h * .1); x.lineTo(hx - r * .1, shY + h * .02); x.quadraticCurveTo(hx - r * .2, hy + r * .5, hx + r * .35, hy - r * .1); x.closePath(); sh(x, cloth, lw);
  }
  // front arm
  const ex = ax + Math.sin(arm) * L * .5, ey = ay + Math.cos(arm) * L * .5, hx2 = ax + Math.sin(arm) * L, hy2 = ay + Math.cos(arm) * L;
  if (view === 'side') {
    tube([[ax, ay], [ex, ey], [hx2, hy2]], h * .055, robe);
    x.beginPath(); x.arc(hx2, hy2, h * .028, 0, TAU); sh(x, skin, lw * .7);
    if (o.staff) { x.beginPath(); x.moveTo(hx2 + h * .02, hy2 - h * .32); x.lineTo(hx2 - h * .04, -h * .005); x.lineWidth = lw * 2.4; x.strokeStyle = INK; x.lineCap = 'round'; x.stroke(); x.lineWidth = lw * 1.1; x.strokeStyle = '#a07040'; x.stroke(); }
    if (o.cup) { x.beginPath(); x.roundRect(hx2 + h * .015, hy2 - h * .07, h * .06, h * .07, 4); sh(x, '#3f8f8c', lw * .7); }
  } else {
    for (const s of [1, -1]) tube([[s * wa * .9, ay], [s * wa * 1.15, ay + L * .5], [s * wa, ay + L * .9]], h * .05, shade(robe, .9));
  }
  x.restore();
}

// ---------- page art: the flat spread (left and right pages) ----------
export const PGW = 0.22, PGD = 0.30, PPX = 1024, PPY = Math.round(1024 * PGD / PGW);
// world (page-local) -> canvas px; page-local x in [0,PGW] from outer edge? we use world x directly per page
export function pageArt(side) {
  const c = cv(PPX, PPY), x = c.getContext('2d');
  // world x of the page's left edge, z of top edge (far)
  const x0 = side < 0 ? -PGW : 0, z0 = -PGD / 2;
  const X = wx => (wx - x0) / PGW * PPX, Z = wz => (wz - z0) / PGD * PPY;
  paperFill(x, PPX, PPY, '#f4e9d2', side < 0 ? 31 : 32, .05);
  const R = mulberry(side < 0 ? 5 : 6);
  const wash = (pts, col, a = 1) => { x.save(); x.globalAlpha = a; x.beginPath(); smoothClosed(x, pts.map(p => [X(p[0]), Z(p[1])])); x.fillStyle = col; x.fill(); x.restore(); };
  if (side < 0) {
    // desert at the back, beaten earth at the front where the people gather
    wash([[-.23, -.16], [-.0, -.16], [.01, .0], [-.08, .02], [-.16, -.0], [-.23, .02]], '#ecc98c');
    x.strokeStyle = 'rgba(160,110,60,.35)'; x.lineWidth = 5; x.lineCap = 'round';
    for (let i = 0; i < 26; i++) { const px = X(-.21 + R() * .19), py = Z(-.14 + R() * .13), l = 40 + R() * 60; x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + l / 2, py - 10, px + l, py); x.stroke(); }
    wash([[-.2, .02], [-.03, .01], [-.0, .12], [-.1, .145], [-.21, .12]], '#e0b47a', .9);
    wash([[-.15, .045], [-.06, .045], [-.05, .1], [-.16, .1]], '#efd6a6', .9);
    // footprints of the traveller across the sand
    x.fillStyle = 'rgba(110,70,40,.35)';
    for (let i = 0; i < 12; i++) { const px = X(-.205 + i * .009), py = Z(-.045 + Math.sin(i * .7) * .004 + (i % 2) * .004); x.beginPath(); x.ellipse(px, py, 7, 4, 0, 0, TAU); x.fill(); }
  } else {
    // oasis at the front, a road at the back that runs off the page and loses its colour
    wash([[.02, .015], [.2, .01], [.215, .13], [.1, .145], [.01, .12]], '#bcc98a', .95);
    wash([[.115, .03], [.165, .03], [.17, .055], [.12, .06]], '#7cc4c0', .9);
    const road = [[.03, -.04], [.08, -.05], [.13, -.075], [.18, -.1], [.23, -.12]];
    x.lineCap = 'round'; x.lineJoin = 'round';
    x.beginPath(); smoothOpen(x, road.map(p => [X(p[0]), Z(p[1])])); x.lineWidth = 120; x.strokeStyle = '#d7b98a'; x.stroke();
    x.beginPath(); smoothOpen(x, road.map(p => [X(p[0]), Z(p[1])])); x.lineWidth = 92; x.strokeStyle = '#efdcb4'; x.stroke();
    // colour drains toward the outer edge: graphite on cream
    const g = x.createLinearGradient(X(.12), 0, X(.22), 0); g.addColorStop(0, 'rgba(236,230,214,0)'); g.addColorStop(1, 'rgba(232,228,218,.92)');
    x.fillStyle = g; x.fillRect(X(.12), 0, PPX, Z(-.0));
    x.strokeStyle = 'rgba(70,72,82,.35)'; x.lineWidth = 3;
    for (let i = 0; i < 10; i++) { const px = X(.16 + R() * .055), py = Z(-.14 + R() * .12); x.beginPath(); x.moveTo(px, py); x.lineTo(px + 30 + R() * 30, py - 6); x.stroke(); }
  }
  // abstract text bands in the margin nearest the reader (no real text)
  x.fillStyle = 'rgba(80,62,48,.32)';
  const bx = side < 0 ? X(-.2) : X(.025), bw = PGW * .8 / PGW * PPX;
  for (let i = 0; i < 3; i++) { const lw = bw * (i === 2 ? .55 : .96 - R() * .06); x.beginPath(); x.roundRect(bx, Z(.128) + i * 26, lw, 9, 4.5); x.fill(); }
  // page number dot
  x.beginPath(); x.arc(side < 0 ? X(-.205) : X(.205), Z(.142), 6, 0, TAU); x.fill();
  // inner shading toward the gutter
  const gs = x.createLinearGradient(side < 0 ? PPX : 0, 0, side < 0 ? PPX - 90 : 90, 0); gs.addColorStop(0, 'rgba(90,60,30,.22)'); gs.addColorStop(1, 'rgba(90,60,30,0)'); x.fillStyle = gs; x.fillRect(0, 0, PPX, PPY);
  x.save(); x.globalAlpha = .6; x.fillStyle = x.createPattern(GRAIN, 'repeat'); x.fillRect(0, 0, PPX, PPY); x.restore();
  return c;
}
// the leaf that turns at the start: a page of text bands
export function textPage() {
  const c = cv(PPX, PPY), x = c.getContext('2d'); paperFill(x, PPX, PPY, '#f4e9d2', 77, .05);
  x.fillStyle = 'rgba(80,62,48,.3)'; const R = mulberry(12);
  for (let i = 0; i < 26; i++) { const w = (PPX - 220) * (i % 9 === 8 ? .5 : .92 + R() * .08); x.beginPath(); x.roundRect(110, 150 + i * 40, w, 10, 5); x.fill(); }
  x.beginPath(); x.roundRect(110, 70, 300, 20, 10); x.fillStyle = 'rgba(150,70,50,.45)'; x.fill();
  const gs = x.createLinearGradient(0, 0, 90, 0); gs.addColorStop(0, 'rgba(90,60,30,.2)'); gs.addColorStop(1, 'rgba(90,60,30,0)'); x.fillStyle = gs; x.fillRect(0, 0, PPX, PPY);
  return c;
}

// ---------- the room (pre-blurred, it is always far out of focus) ----------
export function roomArt() {
  const c = cv(1024, 512), x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 512); g.addColorStop(0, '#3a2c24'); g.addColorStop(.7, '#5a4334'); g.addColorStop(1, '#6a5040'); x.fillStyle = g; x.fillRect(0, 0, 1024, 512);
  x.filter = 'blur(26px)';
  x.fillStyle = '#e8d2a8'; x.globalAlpha = .55; x.fillRect(620, 40, 260, 300); x.globalAlpha = 1;   // window
  const R = mulberry(4); const cols = ['#7a3a2a', '#3f5a4a', '#b08a4a', '#5a4a6a', '#8a6a4a', '#2e4a5a'];
  for (let s = 0; s < 2; s++) { let px = 60; while (px < 520) { const w = 14 + R() * 26, h = 70 + R() * 50; x.fillStyle = cols[(R() * cols.length) | 0]; x.fillRect(px, 140 + s * 140 - h, w, h); px += w + 3; } x.fillStyle = '#2a1e18'; x.fillRect(40, 140 + s * 140, 500, 14); }
  const lg = x.createRadialGradient(140, 330, 0, 140, 330, 260); lg.addColorStop(0, 'rgba(255,210,140,.55)'); lg.addColorStop(1, 'rgba(255,210,140,0)'); x.fillStyle = lg; x.fillRect(0, 0, 1024, 512);
  x.filter = 'none';
  return c;
}
export function woodArt() {
  const c = cv(1024, 1024), x = c.getContext('2d'); x.fillStyle = '#8a5a38'; x.fillRect(0, 0, 1024, 1024);
  const R = mulberry(8);
  for (let i = 0; i < 260; i++) { const y = R() * 1024, a = .04 + R() * .1; x.strokeStyle = R() < .5 ? `rgba(60,30,15,${a})` : `rgba(200,150,100,${a * .7})`; x.lineWidth = 1 + R() * 5; x.beginPath(); x.moveTo(0, y); for (let px = 0; px <= 1024; px += 64) x.lineTo(px, y + Math.sin(px * .006 + i) * 6); x.stroke(); }
  return c;
}
