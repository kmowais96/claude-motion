// Scene 04 "The Missing Conversation" — Risograph sample (two inks: teal = the hallway, orange = the room).
// The camera is the walker: it slows down a hallway toward a door with a frosted glass panel. Behind the
// glass two blurred shapes are already mid-conversation; their speech is soft rings and rounded shapes.
// The plate canvas holds ink densities (R = teal, G = orange); riso.js prints it. render(t) is pure in t.
import { makeRiso } from './riso.js';
import { estimate } from './timing.js';

const W = 1920, H = 1080, TAU = Math.PI * 2;
const TEAL = [0, 131, 138], ORANGE = [255, 116, 119];

const LINES = [
  'Imagine walking into a room...',
  'In the middle of a conversation.',
  'And the first thing you hear is someone saying...',
  '“How could you do that?”',
  'You understand the words.',
  'Every single one.',
  'But...',
  'Do you understand the situation?',
];
const S = estimate(LINES, 1.2);
const at = i => S[i].start;
const DUR = S[7].end + 2.0;
const Q = at(3);                          // the overheard line: rings leak through the door
const T_ARRIVE = Q - .3;                  // the walker stops at the door

// ---------- helpers ----------
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ss = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const eoutBack = x => { x = clamp(x); const c = 1.6; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
function hash(n) { n = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b); n ^= n >>> 13; n = Math.imul(n, 0xc2b2ae35); n ^= n >>> 16; return (n >>> 0) / 4294967296; }
const step = (v, n) => Math.round(v * n) / n;                       // stepped tints (20/40/60...)

// ---------- plate canvas ----------
const plate = document.createElement('canvas'); plate.width = W; plate.height = H;
const g = plate.getContext('2d', { alpha: false });
const c255 = v => Math.round(clamp(v) * 255);
const ink = (t, o = 0) => `rgb(${c255(t)},${c255(o)},0)`;
const over = fn => { g.globalCompositeOperation = 'lighter'; fn(); g.globalCompositeOperation = 'source-over'; };

// ---------- hallway (metres) ----------
const HW = 1.1, CEIL = 2.7, ZEND = 13, F = 820, HZ = 400;
const DOOR = { x0: -.5, x1: .5, y1: 2.15 }, FRAME = { x0: -.6, x1: .6, y1: 2.27 }, GLASS = { x0: -.32, x1: .32, y0: .95, y1: 1.95 };
const SIDE = [[-1, 4.6], [1, 6.8], [-1, 8.7]];          // side doors: wall, z
const LIGHTS = [1.4, 3.6, 5.8, 8.0, 10.2, 12.2];

function cam(t) {
  const Z0 = 2.6, Z = 10.1;
  const u = clamp(t / T_ARRIVE);
  let z = Z0 + (Z - Z0) * (1 - (1 - u) * (1 - u));
  const v = t < T_ARRIVE ? 2 * (Z - Z0) * (1 - u) / T_ARRIVE : 0;    // walking speed
  z += .14 * ss((t - T_ARRIVE) / (DUR - T_ARRIVE));                  // a last lean toward the glass
  const ph = z / .75 * Math.PI, k = v / 1.1;
  return { z, x: .012 * k * Math.sin(ph), y: 1.6 + .022 * k * Math.cos(2 * ph) };
}
let C;
const proj = (x, y, z) => { const d = z - C.z; return [W / 2 + F * (x - C.x) / d, HZ + F * (C.y - y) / d]; };
function polyW(pts, col) {                                            // world polygon, clipped at the near plane
  const zn = C.z + .2, out = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length], ia = a[2] >= zn, ib = b[2] >= zn;
    if (ia) out.push(a);
    if (ia !== ib) { const f = (zn - a[2]) / (b[2] - a[2]); out.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, zn]); }
  }
  if (out.length < 3) return;
  g.beginPath(); out.map(p => proj(...p)).forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]));
  g.closePath(); g.fillStyle = col; g.fill();
}
const wallRect = (x0, x1, y0, y1, col) => polyW([[x0, y0, ZEND], [x1, y0, ZEND], [x1, y1, ZEND], [x0, y1, ZEND]], col);
const sideRect = (s, z0, z1, y0, y1, col) => polyW([[s * HW, y0, z0], [s * HW, y0, z1], [s * HW, y1, z1], [s * HW, y1, z0]], col);

function hallway() {
  const zn = C.z - 1;
  polyW([[-HW, CEIL, zn], [HW, CEIL, zn], [HW, CEIL, ZEND], [-HW, CEIL, ZEND]], ink(.22));            // ceiling
  for (const z of LIGHTS) polyW([[-.3, CEIL, z - .45], [.3, CEIL, z - .45], [.3, CEIL, z + .45], [-.3, CEIL, z + .45]], ink(0));
  polyW([[-HW, 0, zn], [-HW, 0, ZEND], [-HW, CEIL, ZEND], [-HW, CEIL, zn]], ink(.55));              // left wall
  polyW([[HW, 0, zn], [HW, 0, ZEND], [HW, CEIL, ZEND], [HW, CEIL, zn]], ink(.4));                   // right wall
  polyW([[-HW, 0, zn], [HW, 0, zn], [HW, 0, ZEND], [-HW, 0, ZEND]], ink(.8));                       // floor
  for (const s of [-1, 1]) sideRect(s, zn, ZEND, 0, .1, ink(1));                                     // skirting
  for (const [s, z] of SIDE) {                                                                        // closed side doors
    sideRect(s, z - .08, z + .98, 0, 2.22, ink(0));
    sideRect(s, z, z + .9, 0, 2.15, ink(1));
    sideRect(s, z + (s < 0 ? .74 : .08), z + (s < 0 ? .82 : .16), 1.0, 1.06, ink(0));
  }
  wallRect(-HW, HW, 0, CEIL, ink(.3));                                                                // end wall
  wallRect(FRAME.x0, FRAME.x1, 0, FRAME.y1, ink(0));
  wallRect(DOOR.x0, DOOR.x1, 0, DOOR.y1, ink(1));
  wallRect(DOOR.x0 + .02, DOOR.x1 - .02, 0, .025, ink(0, 1));                                         // light under the door
  wallRect(.36, .44, 1.0, 1.06, ink(0));                                                              // handle
  polyW([[-.5, 0, ZEND], [.5, 0, ZEND], [.86, 0, ZEND - 2.4], [-.86, 0, ZEND - 2.4]], ink(0, .22));   // light spill:
  polyW([[-.5, 0, ZEND], [.5, 0, ZEND], [.6, 0, ZEND - .8], [-.6, 0, ZEND - .8]], ink(0, .45));        // orange only
}

// ---------- the room behind the glass ----------
// Conversation already in progress: turns from a seeded hash, starting long before t = 0.
const TURNS = (() => { const r = []; let t = -40, who = 0, i = 0; while (t < 80) { const d = 1.1 + hash(i++) * 1.7; r.push([t, t + d, who]); t += d + .25; who ^= 1; } return r; })();
function speaker(t) {
  if (t >= Q - .2 && t < S[3].end + .2) return 0;                    // the overheard line is the left one's
  for (const [a, b, w] of TURNS) if (t >= a && t < b) return w;
  return -1;
}
const HEAD = [[-45, -32, 30], [55, -22, 27]];                         // x, y, r in glass px (final framing)
function figPath(i, tf, grow) {
  const sp = speaker(tf) === i, [hx, hy, hr] = HEAD[i];
  const sway = 3 * Math.sin(tf * 1.1 + i * 2), lean = i === 0 ? 7 * ss((tf - Q + .3) / .4) * (1 - ss((tf - S[3].end - .3) / .6)) : 0;
  const nod = sp ? 3.5 * Math.sin(tf * 6.5 + i) : 0;
  const x = hx + sway + lean, y = hy + nod;
  const p = new Path2D();
  p.ellipse(x, y, hr + grow, hr * 1.12 + grow, 0, 0, TAU);
  p.ellipse(hx + sway * .5 + lean * .5, 78, hr * 1.5 + grow, 60 + grow, 0, 0, TAU);
  return { p, x, y };
}
function room(tf, gx, gy, k) {
  g.save(); g.beginPath(); g.rect(gx[0], gy[0], gx[1] - gx[0], gy[1] - gy[0]); g.clip();
  g.translate((gx[0] + gx[1]) / 2, (gy[0] + gy[1]) / 2); g.scale(k, k);
  // frosted figures: three nested growths, each adding a 20% teal tint → stepped blur
  over(() => { for (const grow of [24, 12, 0]) for (const i of [1, 0]) { g.fillStyle = ink(.2); g.fill(figPath(i, tf, grow).p); } });
  // speech: soft rings and rounded shapes, born every .45 s from whoever is speaking
  const life = 1.7;
  for (let n = Math.floor((tf - life) / .45); n <= Math.floor(tf / .45); n++) {
    const tb = n * .45, age = tf - tb, who = speaker(tb);
    if (who < 0 || age < 0 || age > life) continue;
    const h = figPath(who, tb, 0), f = age / life;
    if (hash(n * 31 + 7) < .62) {
      g.beginPath(); g.arc(h.x, h.y, 36 + age * 70, 0, TAU);
      g.lineWidth = 3 + 9 * (1 - f); g.strokeStyle = ink(0, step(.3 + .7 * f, 5)); g.stroke();
    } else {
      const dir = who === 0 ? -1 : 1, w = 30 + hash(n) * 30;
      g.beginPath(); g.roundRect(h.x + dir * (20 + age * 22) - w / 2, h.y - 52 - age * 52, w, 18, 9);
      g.fillStyle = ink(0, step(.3 + .7 * f, 5)); g.fill();
    }
  }
  g.restore();
}

// ---------- the words, clear: a crisp speech shape with abstract bands ----------
function bubble(tf) {
  const t0 = at(4); if (tf < t0) return;
  const u = eoutBack((tf - t0) / .5);
  const [cx, cy] = proj(-.6, 2.2, ZEND), [gx, gy] = proj(-.12, 1.75, ZEND);
  const m = F / (ZEND - C.z);                                         // px per metre on the end wall
  const w = .66 * m * u, h = .36 * m * u;
  const x = gx + (cx - gx) * u, y = gy + (cy - gy) * u;
  g.fillStyle = ink(0);
  g.beginPath(); g.roundRect(x - w / 2, y - h / 2, w, h, h * .45); g.fill();
  g.beginPath(); g.moveTo(x + w * .14, y + h * .3); g.lineTo(x + w * .38, y + h * .8); g.lineTo(x + w * .32, y + h * .3); g.closePath(); g.fill();
  const BANDS = [[-.36, -.16, .34], [.08, -.16, .24], [-.36, .16, .2], [-.08, .16, .42]];   // x, y, len (fractions of w/h)
  BANDS.forEach(([bx, by, bl], i) => {
    if (tf < t0 + .55 + i * .42) return;
    g.beginPath(); g.roundRect(x + bx * w, y + by * h - h * .085, bl * w, h * .17, h * .085);
    g.fillStyle = ink(0, 1); g.fill();
  });
}

// ---------- captions: shared serif, printed on the teal plate over a paper strip ----------
function caption(t) {
  const cur = S.find(x => t >= x.start - .1 && t < x.end + .5);
  if (!cur) return;
  g.font = 'italic 500 42px "Cormorant Garamond"'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  const w = g.measureText(cur.text).width + 70;
  g.beginPath(); g.roundRect(960 - w / 2, 963, w, 66, 6); g.fillStyle = ink(0); g.fill();
  g.fillStyle = ink(1); g.fillText(cur.text, 960, 1010);
}

// ---------- registration: fixed per shot, a kick on the overheard line, drift through "But..." ----------
function registration(t) {
  const off = [[0, 0], [5, -3]];
  const kick = (t0, a) => { const d = t - t0; return d < 0 ? 0 : a * Math.exp(-d / .25) * Math.cos(d * 26); };
  const k = kick(Q, 12) + kick(at(7), 6);
  off[1][0] += k; off[1][1] -= k * .6;
  const dr = t >= at(6) && t < at(7) ? ss((t - at(6)) / (at(7) - at(6))) * 22 : 0;
  off[1][0] -= dr; off[1][1] += dr * .4;
  return off;
}

// ---------- page contract ----------
const out = document.getElementById('c');
const print = makeRiso(out, W, H);
await document.fonts.ready;
await document.fonts.load('italic 500 42px "Cormorant Garamond"', 'Ab');

window.DUR = DUR;
window.render = t => {
  const tf = Math.floor(t * 12) / 12;                                 // room acts on twos, camera on ones
  C = cam(t);
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over';
  g.fillStyle = ink(0); g.fillRect(0, 0, W, H);
  hallway();
  const [x0, y0] = proj(GLASS.x0, GLASS.y1, ZEND), [x1, y1] = proj(GLASS.x1, GLASS.y0, ZEND);
  g.fillStyle = ink(0, 1); g.fillRect(x0, y0, x1 - x0, y1 - y0);                                    // the lit glass
  room(tf, [x0, x1], [y0, y1], (x1 - x0) / 219);
  // the overheard line leaks through the door: three rings overprint the hallway in orange
  for (let j = 0; j < 3; j++) {
    const age = tf - (Q + j * .35); if (age < 0 || age > 1.7) continue;
    const [hx, hy] = [x0 + (x1 - x0) * .3, y0 + (y1 - y0) * .42];
    over(() => { g.beginPath(); g.arc(hx, hy, 90 + age * 520, 0, TAU); g.lineWidth = 26 * (1 - age / 1.7) + 4; g.strokeStyle = ink(0, step(.34 * (1 - age / 2.2), 5)); g.stroke(); });
  }
  bubble(tf);
  caption(t);
  const sw = -120 + clamp((t - .1) / 1.0) * 2200;                    // the orange plate rolls in
  print(plate, {
    inks: [TEAL, ORANGE, [0, 0, 0]], off: [...registration(t), [0, 0]], rot: [0, .0012, 0],
    ang: [.2618, 1.309, 0], gate: [1, 1, 0], sweep: [1e5, t > 1.2 ? 1e5 : sw, 1e5],
    seed: Math.floor(t * 12), sheet: 4, boil: .35, period: 7,
  });
};
window.TEXTS = t => S.filter(s => t >= s.start - .1 && t < s.end + .5).map(s => s.text);
window.EV = [
  { t: .1, name: 'orange plate rolls in' }, ...S.map((s, i) => ({ t: s.start, name: 'line ' + (i + 1) })),
  { t: T_ARRIVE, name: 'walker stops at the door' }, { t: Q, name: 'overheard line, rings leak, kick' },
  { t: at(4), name: 'speech shape unfolds' }, { t: at(6), name: 'registration drift' }, { t: at(7), name: 'snap' },
];
window.render(0);
window.READY = true;
