// Scene 07 "Information or Transformation?" in Pictogram Motion.
// Split screen along the grid line: path A counts pages, path B stays with one page.
// Then three everyday cards (a truthful choice, helping, owning a mistake), sliding rows on the beat.
import { estimate } from './timing.js';
import { drawCaption } from './caption.js';

const G = window.G, { E, inv, lerp, clamp, mix, rgba, CREAM, INK } = G;
const W = 1920, H = 1080, S = 180;            // grid cell = 1/6 frame height
const BEAT = 0.6;                              // 100 BPM: every cut on a beat

// Own palette: five hues + dark neutral, five tones each (dark → light).
Object.assign(G.PAL, {
  rush:  { t: ['#7d2a1c', '#93331f', '#ab4128', '#c25a3a', '#d77c5c'], fg: CREAM, deep: '#5a1d13' },
  still: { t: ['#100e17', '#18151f', '#211d2a', '#2e2939', '#423b50'], fg: CREAM, deep: '#0a080e', accent: '#e8b04a' },
  truth: { t: ['#0b4a50', '#0f5d64', '#18757c', '#348c91', '#63a9ab'], fg: CREAM, deep: '#06343a' },
  help:  { t: ['#a8740f', '#bd8517', '#d19a26', '#ddb04e', '#e8ca86'], fg: INK, deep: '#7d560a' },
  own:   { t: ['#3a2350', '#472b61', '#5a3976', '#73518d', '#8f70a7'], fg: CREAM, deep: '#26163a' },
});
const LAMP = '#e8b04a';
const colorsFor = (pk, disc) => {
  const P = G.PAL[pk], fg = P.fg;
  return { fg, far: mix(fg, disc, 0.4), far2: mix(fg, disc, 0.6), acc: P.accent || LAMP, bg: disc, line: rgba(fg, 0.28) };
};

// Narration (lines 329–335 of the script), estimated timing.
const CAP = estimate([
  'You could read hundreds of pages...',
  "And barely stop to think about what you've read.",
  'Or you could reflect on a single passage...',
  'And discover something that changes your life.',
], 0.8);
const PUSH = 23 * BEAT;                        // 13.8 s: path B takes the frame
const CARDS = [29, 33, 37].map(b => b * BEAT); // 17.4, 19.8, 22.2
const DUR = 42 * BEAT;                         // 25.2 s

// ── helpers ──
const cv = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
const fb = cv(), fbx = fb.getContext('2d');   // figure buffer (band assembly)
const cb = cv(), cbx = cb.getContext('2d');   // incoming card buffer (row slide)
const ctx = document.getElementById('c').getContext('2d');
const frac = x => x - Math.floor(x);

function drawPat(c, pk, seed, offs, spread = 0.35) {
  G.drawPattern(c, G.pattern(pk, seed, { spread, density: 0.5, cell: S }), offs, { cell: S });
}
// Busy rows: quarter-cell jumps every half beat, alternating directions, bounded.
const busyOffs = t => j => {
  const step = t / (BEAT / 2), i = Math.floor(step), tri = k => { k = ((k % 8) + 8) % 8; return k < 4 ? k : 8 - k; };
  const v = lerp(tri(i + j), tri(i + j + 1), E.oExp(frac(step) * 3));
  return (j % 2 ? 1 : -1) * (v - 2) * S / 4;
};
const driftOffs = t => j => (j % 2 ? 1 : -1) * S * 0.18 * Math.sin(t * 0.5 + j);

function poly(c, pts, col) { G.poly(c, pts, col); }

// Two-bone IK in the engine's convention: returns [a1, a2] for a shoulder at S reaching T, torso frame tf.
function ik(Sh, T, tf, bend = 1) {
  const l1 = G.LEN.ua, l2 = G.LEN.fa;
  let dx = T[0] - Sh[0], dy = T[1] - Sh[1], d = Math.hypot(dx, dy);
  d = clamp(d, 0.02, l1 + l2 - 0.002);
  const g = Math.atan2(dx, dy);
  const al = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
  const g1 = g + bend * al;
  const Ex = Sh[0] + Math.sin(g1) * l1, Ey = Sh[1] + Math.cos(g1) * l1;
  const g2 = Math.atan2(T[0] - Ex, T[1] - Ey);
  const r = 180 / Math.PI;
  return [g1 * r + tf, g2 * r + tf];
}
function withArms(pose, TR, TL, bendR = 1, bendL = 1) {
  const J = G.joints(pose), tf = (pose.rot || 0) + (pose.torso || 0);
  const p = Object.assign({}, pose);
  if (TR) [p.aR1, p.aR2] = ik(J.sho, TR, tf, bendR);
  if (TL) [p.aL1, p.aL2] = ik(J.sho, TL, tf, bendL);
  return G.joints(p);
}

// ── the reader (seated, faces right), unit = body height, origin = hip ──
const SEAT = { torso: 8, head: 14, lR1: 88, lR2: 2, lL1: 82, lL2: -4, aR1: 50, aR2: 125, aL1: 44, aL2: 120 };
function book(c, C, bx, by, flip, pageCol) {
  const w = 0.15, h = 0.2;
  c.fillStyle = C.far; c.fillRect(bx - w - 0.014, by - h / 2 - 0.006, 2 * w + 0.028, h + 0.024);
  const pg = (s) => [[bx, by - h / 2 + 0.012], [bx + s * w, by - h / 2 - 0.01], [bx + s * w, by + h / 2], [bx, by + h / 2 + 0.012]];
  poly(c, pg(-1), pageCol); poly(c, pg(1), pageCol);
  // text as abstract bands
  c.fillStyle = rgba(INK, 0.22);
  for (let i = 0; i < 6; i++) for (const s of [-1, 1]) {
    const y = by - h / 2 + 0.03 + i * 0.026, l = (i * 37 + (s > 0 ? 11 : 3)) % 7 / 7;
    const x0 = s < 0 ? bx - w + 0.022 : bx + 0.02;
    c.fillRect(x0, y, (w - 0.045) * (0.6 + 0.4 * l), 0.009);
  }
  if (flip != null) {   // one page turning about the spine (a flat unfolding, never drawn)
    const xe = bx + w * Math.cos(Math.PI * flip), lift = 0.035 * Math.sin(Math.PI * flip);
    poly(c, [[bx, by - h / 2 + 0.012], [xe, by - h / 2 - 0.01 - lift], [xe, by + h / 2 - lift], [bx, by + h / 2 + 0.012]], mix(pageCol, C.bg, 0.25 * Math.abs(Math.sin(Math.PI * flip))));
  }
}
function reader(c, C, x, y, U, mode, t, glow) {
  c.save(); c.translate(x, y); c.scale(U, U);
  const bx = 0.34, by = -0.33;
  // stool and floor
  c.fillStyle = C.far2; c.fillRect(-0.15, 0.03, 0.27, 0.035); c.fillRect(-0.035, 0.05, 0.035, 0.2); c.fillRect(-0.13, 0.235, 0.23, 0.02);
  c.fillStyle = C.line; c.fillRect(-0.7, 0.253, 1.4, 0.008);
  let pose = Object.assign({}, SEAT);
  if (mode === 'fast') pose.head = 12 + 5 * Math.sin(t * 21);
  else pose.head = 22;
  if (glow > 0) { // small light from the open page: stepped flat discs, no gradient
    const k = glow * (1 + 0.03 * Math.sin(t * 1.4));
    [[0.42, 0.07], [0.31, 0.11], [0.21, 0.16]].forEach(([r, a]) => { c.fillStyle = rgba(C.acc, a * Math.min(1, glow)); c.beginPath(); c.arc(bx, by, r * k, 0, 7); c.fill(); });
  }
  const J = G.joints(pose);
  G.drawFigure(c, J, C.fg, C.far);
  const pageCol = mix(CREAM, C.bg, 0.08);
  if (mode === 'fast') {
    const per = 0.2, ph = t / per, f = E.io3(frac(ph) * 1.25);
    // pages already turned fly off the book, a short stack of them
    for (let i = 1; i <= 3; i++) {
      const a = frac(ph) + i - 1, al = 1 - a / 3;
      c.save(); c.globalAlpha = al * 0.9; c.translate(bx - 0.16 - a * 0.22, by - 0.05 - a * 0.16); c.rotate(-0.4 * a);
      c.fillStyle = pageCol; c.fillRect(-0.06, -0.08, 0.12, 0.16); c.restore();
    }
    book(c, C, bx, by, f, pageCol);
  } else {
    book(c, C, bx, by, null, pageCol);
  }
  c.restore();
}

// ── a panel of the split screen ──
function maskT(c, text, x, y, font, col, p, align = 'center', ls = '0px') { if (p > 0) G.maskText(c, text, x, y, font, col, p, { align, ls }); }
function mono(c, text, x, y, col, p = 1, align = 'left') {
  c.save(); c.font = '500 22px "DM Mono"'; c.letterSpacing = '3px'; c.fillStyle = col; c.textAlign = align;
  c.fillText(text.slice(0, Math.floor(text.length * clamp(p) + 0.001)), x, y); c.restore();
}
function panel(c, t, x0, x1, side, dx) {
  const pk = side === 'A' ? 'rush' : 'still', P = G.PAL[pk];
  c.save(); c.beginPath(); c.rect(x0, 0, x1 - x0, H); c.clip(); c.translate(dx, 0);
  c.fillStyle = P.t[1]; c.fillRect(x0 - dx, 0, x1 - x0, H);
  const pw = x1 - x0, cx = x0 + pw / 2;
  c.save(); c.translate(x0 + pw / 2 - W / 2, 0);
  drawPat(c, pk, side === 'A' ? 11 : 23, side === 'A' ? busyOffs(t) : null, side === 'A' ? 0.4 : 0.3);
  c.restore();
  const late = t > PUSH ? E.io3(inv(CAP[3].start, CAP[3].start + 2.4, t)) : 0;
  const disc = side === 'A' ? P.t[3] : mix(P.t[4], LAMP, 0.12 + 0.25 * late);
  const C = colorsFor(pk, disc);
  const cy = 395, R = 255 + 40 * late;
  const fin = E.oExp(inv(0.15, 0.75, t));
  G.disc(c, cx, cy, R * fin, disc);
  // light sweep across the sun disc
  c.save(); c.beginPath(); c.arc(cx, cy, R * fin, 0, 7); c.clip();
  const sw = (side === 'A' ? t * 0.45 : t * 0.12) % 1.6 - 0.3;
  c.fillStyle = rgba(CREAM, 0.07); c.beginPath(); c.moveTo(cx - R + sw * 2 * R, cy - R); c.lineTo(cx - R + sw * 2 * R + 120, cy - R); c.lineTo(cx - R + sw * 2 * R - 80, cy + R); c.lineTo(cx - R + sw * 2 * R - 200, cy + R); c.fill();
  c.restore();
  // figure, assembled in bands
  const glow = side === 'B' ? E.o3(inv(CAP[2].start, CAP[2].start + 1.6, t)) * (1 + 0.9 * late) : 0;
  const drawFig = (cc) => reader(cc, C, cx - 0.12 * 330, 560 - 0.255 * 330, 330, side === 'A' ? 'fast' : 'still', t, glow);
  bandAssemble(c, drawFig, 0.25, t, [150, 660]);
  // type: counter vs one
  const n = side === 'A' ? Math.max(1, Math.floor(1 + 311 * Math.pow(inv(0.6, PUSH - 0.6, t), 1.25))) : 1;
  const pt = E.oExp(inv(0.55, 1.05, t)), p2 = inv(0.65, 1.15, t);
  maskT(c, String(n), cx, 838, '900 200px "Inter Tight"', P.fg, pt, 'center', '-6px');
  maskT(c, side === 'A' ? 'PAGES TURNED' : 'PAGE, TAKEN TO HEART', cx, 905, '800 46px "Inter Tight"', P.fg, p2, 'center', '1px');
  mono(c, side === 'A' ? 'PATH A — HOW MUCH?' : 'PATH B — WHAT DID I UNDERSTAND?', x0 + 56, 92, rgba(P.fg, 0.8), inv(0.5, 1.3, t));
  mono(c, side === 'A' ? 'COUNT' : 'STAY', x1 - 56, 92, rgba(P.fg, 0.5), inv(0.7, 1.1, t), 'right');
  c.restore();
}

// Figure arrives as horizontal bands sliding into register from alternating sides.
function bandAssemble(c, draw, t0, t, [ya, yb]) {
  if (t >= t0 + 0.55) { draw(c); return; }
  if (t < t0) return;
  fbx.setTransform(1, 0, 0, 1, 0, 0); fbx.clearRect(0, 0, W, H);
  const m = c.getTransform(); fbx.setTransform(m);
  draw(fbx); fbx.setTransform(1, 0, 0, 1, 0, 0);
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
  const bh = 36;
  for (let k = 0, y = ya; y < yb; k++, y += bh) {
    const p = E.oExp(inv(t0 + k * 0.012, t0 + 0.4 + k * 0.012, t));
    if (p <= 0) continue;
    const off = (k % 2 ? 1 : -1) * (1 - p) * 180;
    c.globalAlpha = Math.min(1, p * 3);
    c.drawImage(fb, 0, y, W, bh, off, y, W, bh);
  }
  c.restore();
}

// ── everyday cards ──
const CARD = [
  { pk: 'truth', title: 'CHOOSE TRUE', sub: 'THE HARDER, HONEST WAY', tag: 'A TRUTHFUL CHOICE', seed: 41 },
  { pk: 'help', title: 'LEND A HAND', sub: 'HELP SOMEONE UP', tag: 'HELPING', seed: 52 },
  { pk: 'own', title: 'OWN IT', sub: 'SAY: I WAS WRONG', tag: 'ADMITTING A MISTAKE', seed: 63 },
];

function stageChoice(c, C, u) {          // fork: a smooth path down, steps up; the figure takes the steps
  const f = 0.45;                          // feet level below the hip
  c.fillStyle = C.line; c.lineCap = 'round';
  G.seg(c, [-0.55, f + 0.012], [-0.05, f + 0.012], 0.02, C.far2);
  G.seg(c, [-0.05, f + 0.012], [0.95, f + 0.3], 0.03, rgba(C.fg, 0.3));          // the easy slope
  const steps = [];
  for (let i = 0; i < 5; i++) steps.push([0.0 + i * 0.2, f - i * 0.1]);
  const pts = [[-0.05, f + 0.03]];
  steps.forEach(([x, y]) => { pts.push([x, y]); pts.push([x + 0.2, y]); pts.push([x + 0.2, y - 0.1]); });
  pts.pop(); pts.push([1.0, f + 0.03]);
  poly(c, pts, C.far2);
  // signpost: two plain plates, one lit toward the steps
  G.seg(c, [-0.32, f], [-0.32, f - 0.62], 0.025, C.far);
  poly(c, [[-0.3, f - 0.62], [-0.08, f - 0.62], [-0.02, f - 0.57], [-0.08, f - 0.52], [-0.3, f - 0.52]], C.acc);
  poly(c, [[-0.3, f - 0.47], [-0.1, f - 0.47], [-0.05, f - 0.42], [-0.1, f - 0.37], [-0.3, f - 0.37]].map(([x, y]) => [x, y + 0.02 * 0]), rgba(C.fg, 0.35));
  // climb: on the beat
  const s = E.io(inv(0.6, 3.6, u));
  const x = lerp(-0.15, 0.78, s), lift = clamp((x + 0.02) / 0.2, 0, 4.2);
  const y = -Math.min(lift, Math.floor(lift) + E.io3(frac(lift) * 1.6)) * 0.1;
  const p = Object.assign(G.walkCycle(s * 3.2, s > 0 && s < 1 ? 1 : 0.15), { x, y: y + (G.walkCycle(s * 3.2).y || 0), torso: 10 });
  G.drawFigure(c, G.joints(p), C.fg, C.far);
}

function stageHelp(c, C, u) {            // one figure sits fallen; the other reaches down and pulls up
  const f = 0.45;
  c.fillStyle = C.line; c.fillRect(-0.85, f + 0.006, 1.6, 0.012);
  const r = E.io3(inv(1.0, 3.2, u));
  const sit = { x: -0.32, y: 0.36, torso: 12, lR1: 82, lR2: 92, lL1: 70, lL2: 96, head: -6 };
  const up = { x: -0.24, y: 0, torso: 6, lR1: 6, lR2: 4, lL1: -6, lL2: -6, head: 0 };
  const sp = G.lerpPose(sit, up, r);
  const hx = 0.3;                                      // helper hip x (faces left)
  const hp = { x: 0, y: 0, torso: lerp(34, 14, r), head: 10, lR1: 14, lR2: 4, lL1: -12, lL2: -14 };
  const Js = G.joints(sp), Jh0 = G.joints(hp);
  const shS = Js.sho, shH = [hx - Jh0.sho[0], Jh0.sho[1]];
  const T = [lerp(shS[0], shH[0], 0.5), lerp(shS[1], shH[1], 0.5) + 0.12 - 0.06 * r];
  const Jh = withArms(hp, [hx - T[0], T[1]], [hx - T[0] + 0.03, T[1] + 0.12], 1, 1);
  const Js2 = withArms(sp, T, null, -1);
  G.drawFigure(c, Js2, C.far2, mix(C.far2, C.bg, 0.4));
  c.save(); c.translate(hx, 0); c.scale(-1, 1); G.drawFigure(c, Jh, C.fg, C.far); c.restore();
}

function stageOwn(c, C, u) {             // one figure steps forward, head bowed, holding out a broken cup
  const f = 0.45;
  c.fillStyle = C.line; c.fillRect(-0.85, f + 0.006, 1.6, 0.012);
  const s = E.io3(inv(0.4, 1.8, u)), bow = E.io3(inv(1.4, 2.6, u)), take = E.io3(inv(2.6, 3.6, u));
  const x = lerp(-0.42, -0.26, s);
  const wc = G.walkCycle(s * 1.0, s > 0 && s < 1 ? 0.8 : 0);
  const pose = Object.assign({}, wc, { x, y: 0, torso: lerp(4, 16, bow), head: lerp(6, 30, bow) });
  const obj = [lerp(x + 0.2, x + 0.33, s), lerp(-0.12, -0.08, bow)];
  const J = withArms(pose, [obj[0] - x + x + 0.012, obj[1] + 0.015], [obj[0] - 0.03, obj[1] + 0.03], -1, -1);
  // the other person, still, receives it
  const ox = 0.36;
  const op = { x: 0, y: 0, torso: 2, lR1: 4, lR2: 4, lL1: -6, lL2: -6, head: 4 };
  const Jo = take > 0 ? withArms(op, [ox - (obj[0] + 0.05), obj[1] + 0.01], null, -1) : G.joints(op);
  c.save(); c.translate(ox, 0); c.scale(-1, 1); G.drawFigure(c, Jo, C.far2, mix(C.far2, C.bg, 0.4)); c.restore();
  G.drawFigure(c, J, C.fg, C.far);
  // broken cup: two halves of a disc with a gap
  const gap = 0.012 + 0.006 * bow;
  c.save(); c.translate(obj[0] + 0.02, obj[1] - 0.05);
  c.fillStyle = C.acc;
  c.save(); c.rotate(-0.12); c.translate(-gap, 0); c.beginPath(); c.moveTo(0, -0.062); c.lineTo(-0.012, -0.02); c.lineTo(0.008, 0.01); c.lineTo(0, 0.062); c.arc(0, 0, 0.062, Math.PI / 2, Math.PI * 1.5); c.fill(); c.restore();
  c.save(); c.rotate(0.14); c.translate(gap, 0); c.beginPath(); c.moveTo(0, -0.062); c.lineTo(-0.012, -0.02); c.lineTo(0.008, 0.01); c.lineTo(0, 0.062); c.arc(0, 0, 0.062, Math.PI / 2, -Math.PI / 2, true); c.fill(); c.restore();
  c.restore();
}
const STAGES = [stageChoice, stageHelp, stageOwn];

function card(c, i, t) {
  const K = CARD[i], P = G.PAL[K.pk], t0 = CARDS[i], u = (t - t0) / BEAT;
  c.fillStyle = P.t[1]; c.fillRect(0, 0, W, H);
  drawPat(c, K.pk, K.seed, driftOffs(t), 0.32);
  const disc = K.pk === 'help' ? P.t[4] : P.t[3];
  const C = colorsFor(K.pk, disc);
  const sx = 600, sy = 450, R = 330;
  G.disc(c, sx, sy, R, disc);
  c.save(); c.beginPath(); c.arc(sx, sy, R, 0, 7); c.clip();
  const sw = frac((t - t0) * 0.18) * 1.6 - 0.3;
  c.fillStyle = rgba(CREAM, 0.08); c.beginPath(); c.moveTo(sx - R + sw * 2 * R, sy - R); c.lineTo(sx - R + sw * 2 * R + 150, sy - R); c.lineTo(sx - R + sw * 2 * R - 90, sy + R); c.lineTo(sx - R + sw * 2 * R - 240, sy + R); c.fill();
  c.restore();
  const U = 400;
  bandAssemble(c, cc => { cc.save(); cc.translate(sx - (i === 0 ? 0.18 : 0) * U, sy + 0.12 * U - 0.2 * U); cc.scale(U, U); STAGES[i](cc, C, u); cc.restore(); }, t0 + 0.05, t, [90, 820]);
  // type column
  const tx = 1060, maxW = 780;
  c.save(); const px = G.fitFont(c, K.title, "en", 900, 168, maxW, -0.02); c.restore();
  maskT(c, K.title, tx, 470, `900 ${px}px "Inter Tight"`, P.fg, inv(t0 + 0.1, t0 + 0.6, t), 'left', `${-0.02 * px}px`);
  maskT(c, K.sub, tx + 4, 552, '800 52px "Inter Tight"', rgba(P.fg, 0.92), inv(t0 + 0.18, t0 + 0.68, t), 'left', '1px');
  // tag chip
  const tp = inv(t0 + 0.3, t0 + 0.6, t);
  if (tp > 0) {
    c.save(); c.font = '500 22px "DM Mono"'; c.letterSpacing = '3px';
    const w = c.measureText(K.tag).width + 34;
    c.globalAlpha = tp; c.fillStyle = rgba(P.fg, 0.14); c.fillRect(tx + 4, 600, w * E.oExp(tp), 44);
    c.fillStyle = P.fg; c.fillText(K.tag.slice(0, Math.floor(K.tag.length * tp)), tx + 21, 630); c.restore();
  }
  hud(c, P.fg, i, t);
}
function hud(c, fg, i, t) {
  mono(c, '07 — INFORMATION OR TRANSFORMATION?', 56, 92, rgba(fg, 0.75));
  mono(c, `0${i + 1} / 03`, W - 56, 92, rgba(fg, 0.85), 1, 'right');
  for (let k = 0; k < 3; k++) {
    c.fillStyle = rgba(fg, k === i ? 0.95 : k < i ? 0.4 : 0.18);
    const h = k === i ? 26 : 14;
    c.fillRect(W - 56 - 3 * 26 + k * 26, 124 - h, 14, h);
  }
}

function scene(c, t) {
  // split phase and the push
  const cardIdx = CARDS.findLastIndex(x => t >= x - 0.25);
  const drawSplit = cc => {
    cc.fillStyle = INK; cc.fillRect(0, 0, W, H);
    const sx = t < PUSH ? 960 : lerp(960, 0, E.ioExp(inv(PUSH, PUSH + 0.6, t)));
    const o = 1 - E.oExp(inv(0, 0.55, t));
    if (sx > 0.5) panel(cc, t, 0, sx, 'A', -sx * o);
    panel(cc, t, sx, W, 'B', (W - sx) * o);
    if (t < PUSH + 0.6) { cc.fillStyle = INK; cc.fillRect(sx - 3, 0, 6, H); }
    // path A dims as the narration turns to reflection
    const dim = 0.35 * E.io(inv(CAP[2].start - 0.3, CAP[2].start + 0.6, t));
    if (dim > 0 && sx > 0.5) { cc.fillStyle = rgba(INK, dim); cc.fillRect(0, 0, sx, H); }
  };
  if (cardIdx < 0) { drawSplit(c); return; }
  const tc = CARDS[cardIdx];
  if (t < tc + 0.45) {           // sliding-rows transition into the card
    if (cardIdx === 0) drawSplit(c); else card(c, cardIdx - 1, t);
    cbx.setTransform(1, 0, 0, 1, 0, 0); card(cbx, cardIdx, t);
    for (let j = 0; j < 6; j++) {
      const p = E.ioExp(inv(tc - 0.25 + j * 0.04, tc + 0.2 + j * 0.04, t));
      if (p <= 0) continue;
      c.drawImage(cb, 0, j * S, W, S, (j % 2 ? -1 : 1) * W * (1 - p), j * S, W, S);
    }
  } else card(c, cardIdx, t);
}

function render(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  scene(ctx, t);
  // caption band (chapter-neutral ink) + the shared serif caption
  const cur = CAP.find(x => t >= x.start - 0.1 && t < x.end + 0.5);
  if (cur) {
    const a = clamp(Math.min((t - cur.start + 0.1) / 0.25, (cur.end + 0.5 - t) / 0.3));
    ctx.fillStyle = rgba(INK, 0.82 * a); ctx.fillRect(0, 950, W, 130);
  }
  drawCaption(ctx, CAP, t);
}

await document.fonts.ready;
await Promise.all(['italic 500 42px "Cormorant Garamond"', '900 120px "Inter Tight"', '800 50px "Inter Tight"', '500 22px "DM Mono"'].map(f => document.fonts.load(f, 'Ab1')));
window.DUR = DUR;
window.render = render;
window.TEXTS = t => {
  const out = [];
  const c = CAP.find(x => t >= x.start - 0.1 && t < x.end + 0.5);
  if (c) out.push({ id: 'cap', text: c.text, x0: 200, y0: 970, x1: 1720, y1: 1030 });
  CARDS.forEach((t0, i) => { if (t >= t0 + 0.6 && t < (CARDS[i + 1] ?? DUR + 1) - 0.25) out.push({ id: 'card' + i, text: CARD[i].title + ' ' + CARD[i].sub, x0: 1060, y0: 330, x1: 1840, y1: 570 }); });
  return out;
};
window.EV = [{ t: 0, type: 'split' }, { t: PUSH, type: 'push' }, ...CARDS.map((t, i) => ({ t, type: 'card' + (i + 1) }))];
render(0);
window.READY = true;
