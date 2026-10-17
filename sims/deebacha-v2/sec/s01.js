// Section 1 · The cell — woodcut, one copper plate for the lamp flame and its light.
// Plates: the cell carved from the flame outward → the page being written (nib shadow) → the name, a title
// plate → the desk and the growing stack → outside, roads carved out from the prison → تفهيم القرآن →
// nine sheets in a row: carved, riffled, the first one stopped in the lamp's light.
import { clamp, eio, eo, ei, mulberry } from '/core/lib.js';
import { m, c, begin, end, print, jolt } from '../lib/woodcut/print2d.js';
import { WC, carveText, border, carved, lampTone, lampBody, flame, flameRing, lampLight, bricks, brickVar, dist, q12 } from '../lib/woodcut/kit.js';
import { drawCell, F } from '../lib/woodcut/cell.js';
import { drawDesk } from '../lib/woodcut/desk.js';

const NAME = "SAYYID ABUL A'LA MAWDUDI", RAH = 'rahimahullah', TAFHIM = 'تفهيم القرآن';
let K = null;   // things built in init (they need T and the fonts)

// ---------- outside: the prison on the plain, roads carved outward ----------
const HZ = 432, G = [960, 514];
let LAND = null;
function land() {
  if (LAND) return LAND;
  const sky = WC.hatch(new WC.Region([[[0, 0], [1920, 0], [1920, HZ], [0, HZ]]], { res: 3 }), { dir: WC.dirAngle(0), tone: (x, y) => .02 + .98 * clamp(y / HZ) ** 2.2, sp: 9, wmax: 9, lo: .18, hi: .98, kind: 'u', seed: 101, seg: [90, 300], gap: [3, 9] });
  const rnd = mulberry(5), pts = [];
  for (let i = 0; i < 70; i++) { const x = rnd() * 1920, y = 40 + rnd() * 220; if (Math.hypot(x - 420, y - 160) > 80) pts.push([x, y, 1.6 + rnd() * 2.2]); }
  const stars = WC.flecks(pts, { seed: 6 });
  // fields: radial strips × depth bands, each with its own moonlit tone
  const VP = [960, HZ], fields = [], bands = [HZ + 4, 470, 540, 650, 820, 1200], rays = [];
  for (let k = -14; k <= 14; k++) rays.push(960 + k * 300 + (rnd() - .5) * 120);
  const atx = (xb, y) => VP[0] + (xb - VP[0]) * (y - HZ) / (1200 - HZ);
  const ftone = [];
  for (let j = 0; j < bands.length - 1; j++) for (let i = 0; i < rays.length - 1; i++) {
    const y0 = bands[j] + 2.5, y1 = bands[j + 1] - 2.5;
    fields.push([[atx(rays[i], y0) + 3, y0], [atx(rays[i + 1], y0) - 3, y0], [atx(rays[i + 1], y1) - 3, y1], [atx(rays[i], y1) + 3, y1]]);
    ftone.push(.2 + rnd() * .45);
  }
  const freg = new WC.Region(fields, { res: 2 });
  const fieldIdx = (x, y) => { const j = bands.findIndex((b, n) => y >= b && y < bands[n + 1]); let i = 0; while (i < rays.length - 2 && atx(rays[i + 1], y) < x) i++; return Math.max(0, j) * (rays.length - 1) + i; };
  const fl = WC.hatch(freg, { dir: (x, y) => (Math.floor(fieldIdx(x, y)) % 3 === 0 ? 0 : Math.atan2(y - VP[1], x - VP[0])), tone: (x, y) => ftone[fieldIdx(x, y)] * (.6 + .5 * clamp((y - HZ) / 500)), sp: 7, wmax: 6, lo: .12, seed: 102, seg: [40, 140] });
  // the prison: a long wall, a gatehouse, a lit cell window
  const wall = [[740, 452], [1180, 452], [1180, 516], [740, 516]], gate = [[905, 418], [1015, 418], [1015, 516], [905, 516]];
  const walls = WC.shape([wall, gate], { light: WC.light(-.7, -.6, .4), sp: 4, R: 10, dir: Math.PI / 2, halo: 3, seed: 103, lo: .5 });
  const crest = WC.cutAlong([[740, 452], [905, 452], [905, 418], [1015, 418], [1015, 452], [1180, 452]], { w: 2.4, kind: 'k', seed: 104 });
  const moon = gg => { gg.fillStyle = '#fff'; gg.beginPath(); gg.arc(420, 160, 34, 0, 7); gg.fill(); gg.fillStyle = '#000'; gg.beginPath(); gg.arc(436, 150, 30, 0, 7); gg.fill(); };
  const parts = [{ draw: (g, t, q) => { WC.drawStrokes(g, sky, { ...q, t }); WC.drawStrokes(g, stars, { ...q, t }); if (q.fill !== false) moon(g); WC.drawStrokes(g, fl, { ...q, t }); } },
    { draw: (g, t, q) => { walls.draw(g, t, q); WC.drawStrokes(g, crest, { ...q, t }); }, occ: [wall, gate] }];
  // roads: from the gate out to the horizon and toward us, wider as they come near
  const ends = [[120, HZ + 6], [430, HZ + 3], [1480, HZ + 3], [1820, HZ + 6], [-60, 760], [260, 1000], [760, 1000], [1240, 1000], [1700, 1000], [2000, 700]];
  const roads = ends.map(([ex, ey], i) => {
    const r2 = mulberry(20 + i), mx = (G[0] + ex) / 2 + (r2() - .5) * 220, my = (G[1] + ey) / 2 + (r2() - .5) * 60;
    const path = WC.spline([G, [G[0] + (ex - G[0]) * .12, G[1] + (ey - G[1]) * .12 + 6], [mx, Math.max(HZ + 4, my)], [ex, ey]], 4);
    return WC.cutAlong(path, { w: (u, p) => 1.6 + Math.max(0, p[1] - HZ) * .07, kind: 'u', seg: [400, 900], gap: [0, 1], seed: 30 + i, reveal: { t0: i * .07, t1: 2.2 + i * .07, speed: 700 } });
  }).flat();
  const towns = [[120, HZ - 4], [430, HZ - 4], [1480, HZ - 4], [1820, HZ - 4]].map(([x, y], i) => {
    const r3 = mulberry(50 + i), sq = [];
    for (let k = 0; k < 5; k++) { const hx = x - 34 + k * 15 + r3() * 4, hh = 6 + r3() * 10; sq.push(WC.mkStroke([[hx, y + 2], [hx, y - hh]], 6, { kind: 'u', seed: 60 + k, t0: 2.0 + i * .12 + k * .05, dur: .1 })); }
    return sq;
  }).flat();
  LAND = { draw: carved('land', parts, 0), roads, towns };
  return LAND;
}
function drawLand(g, cp, t, t0, cam) {
  const L = land();
  L.draw(g, 1e9, cam);
  WC.drawStrokes(g, L.roads, { t: t - t0 });
  WC.drawStrokes(g, L.towns, { t: t - t0 });
  // the lamp-lit cell window in the wall: copper light behind two bars
  const wx = 1088, wy = 470;
  g.fillStyle = '#fff'; g.fillRect(wx - 12, wy - 9, 24, 18);
  g.fillStyle = '#000'; g.fillRect(wx - 5, wy - 9, 2.6, 18); g.fillRect(wx + 3, wy - 9, 2.6, 18);
  cp.fillStyle = '#000'; cp.fillRect(wx - 12, wy - 9, 24, 18);
  const gr = cp.createRadialGradient(wx, wy, 4, wx, wy, 26); gr.addColorStop(0, 'rgba(0,0,0,.6)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); cp.fillStyle = gr; cp.fillRect(wx - 30, wy - 30, 60, 60);
}

// ---------- nine sheets on the desk, lamp at right ----------
const F3 = [1700, 470], S3 = 1.7;
const sheetQuad = i => { const cx = 1372 - i * 147, y0 = 560, y1 = 760; return [[cx - 62, y0], [cx + 62, y0], [cx + 68, y1], [cx - 68, y1]]; };
let NINE = null;
function nine() {
  if (NINE) return NINE;
  const lt = lampTone(F3, 1600, 1.15, 1.7), bw = 150, bh = 58, bv = brickVar(bw, bh, .1);
  const wall = WC.hatch(new WC.Region(bricks(20, 20, 1900, 520, bw, bh, 10, 12), { res: 2 }), { dir: WC.dirAngle(0), tone: (x, y) => lt(x, y) * .85 + bv(x, y), sp: 9, wmax: 8, lo: .05, gamma: 1.3, seed: 111, seg: [50, 150], gap: [2, 7] });
  const deskR = new WC.Region([[[0, 532], [1920, 528], [1920, 1100], [0, 1100]]], { res: 3 });
  const desk = WC.hatch(deskR, { dir: (x, y) => Math.sin(x * .003 + y * .03) * .03, tone: (x, y) => lt(x, y) * .8, sp: 11, wmax: 9, lo: .04, gamma: 1.4, seed: 112, seg: [90, 280], gap: [3, 10] });
  const edge = WC.cutAlong([[0, 526], [1920, 522]], { w: (u, p) => 7 * lt(p[0], p[1]) + 1, kind: 'v', seed: 113 });
  const lamp = lampBody(F3, S3);
  const rays = WC.rays(F3[0], F3[1] - 30, { n: 60, r0: 70, r1: [160, 420], w: 11, kind: 'u', seed: 114, jit: .7 });
  const parts = [{ draw: (g, t, q) => { WC.drawStrokes(g, wall, { ...q, t }); WC.drawStrokes(g, edge, { ...q, t }); WC.drawStrokes(g, desk, { ...q, t }); WC.drawStrokes(g, rays, { ...q, t }); } },
    { draw: (g, t, q) => lamp.draw(g, t, q), occ: lamp.occ }];
  NINE = { draw: carved('nine', parts, 0) };
  return NINE;
}
// one sheet: carved white (cut strokes while carving), seven lines of writing left in wood, its page number.
// k = carve progress 0..1, th = flip angle (rad) about its right edge
function sheet(g, i, k, th) {
  if (k <= 0) return;
  const Q = sheetQuad(i), xr = (Q[1][0] + Q[2][0]) / 2, cs = Math.cos(th), sn = Math.sin(th);
  const X = ([x, y]) => [xr - (xr - x) * cs, y - (xr - x) * sn * .22];
  const P = Q.map(X);
  // halo (black keep-line) then the white sheet, carved top to bottom
  g.save();
  g.beginPath(); g.rect(0, Q[0][1] - 80, 1920, (Q[3][1] - Q[0][1] + 100) * eo(k)); g.clip();
  WC.fillPoly(g, [WC.offsetPoly(P, 4)], '#000');
  WC.fillPoly(g, [P], '#fff');
  g.restore();
  if (k < 1 || Math.abs(cs) < .15) return;
  g.strokeStyle = '#000'; g.lineWidth = 2;
  const rnd = mulberry(200 + i);
  for (let l = 0; l < 7; l++) {
    const v = .14 + l * .1, x1 = .88, x0 = .12 + (l === 6 ? .35 : rnd() * .12);
    const a = X([Q[0][0] + (Q[1][0] - Q[0][0]) * x1, Q[0][1] + (Q[3][1] - Q[0][1]) * v]), b = X([Q[0][0] + (Q[1][0] - Q[0][0]) * x0, Q[0][1] + (Q[3][1] - Q[0][1]) * v]);
    g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke();
  }
  // Urdu page number at the foot
  const n = X([(Q[2][0] + Q[3][0]) / 2, Q[3][1] - 22]);
  g.save(); g.translate(n[0], n[1]); g.scale(cs, 1); g.fillStyle = '#000'; g.font = '30px "Amiri"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.direction = 'rtl';
  g.fillText('۱۲۳۴۵۶۷۸۹'[i], 0, 0); g.restore();
}

// ---------- the plates ----------
function plates(T) {
  return [
    { from: -1e9, id: 'cell' }, { from: T.at(4), id: 'page' }, { from: T.at(5), id: 'name' }, { from: T.at(6), id: 'desk' },
    { from: T.at(7), id: 'land' }, { from: T.at(8), id: 'title' }, { from: T.at(10), id: 'nine' },
  ];
}
const plateAt = (T, t) => { const P = plates(T); let n = 0; while (n + 1 < P.length && t >= P[n + 1].from) n++; return [P[n], n]; };
// writing progress on the page (lines), continuous across the two page plates
const writeAt = (T, t) => 3 + Math.max(0, t - T.at(4)) * .5;

export default {
  style: 'woodcut',
  page: 'p. 9',
  noCaption: [5],
  async init(T) {
    await Promise.all(['88px "IM Fell English SC"', 'italic 52px "IM Fell English"', '170px "Amiri"', '30px "Amiri"'].map(f => document.fonts.load(f, f.includes('Amiri') ? 'تفهيم ۱۲' : 'Ab')));
    const t5 = T.at(5);
    K = {
      nameBorder: border(170, 250, 1580, 480, { w: 5, reveal: { t0: t5 + .02, t1: t5 + .5, speed: 4000 } }),
      name: carveText({ text: NAME, font: '88px "IM Fell English SC"', x: 960, y: 480, t0: t5 + .25, t1: t5 + 1.45, sp: 4, angle: -1.2 }),
      rule: WC.cutAlong([[760, 538], [1160, 538]], { w: 3, kind: 'v', seg: [400, 500], seed: 9, reveal: { t0: t5 + 1.45, t1: t5 + 1.7, speed: 1600 } }),
      rah: carveText({ text: RAH, font: 'italic 52px "IM Fell English"', x: 960, y: 620, t0: t5 + 1.6, t1: t5 + 2.3, sp: 3, angle: -1.1, seed: 8 }),
      title: carveText({ text: TAFHIM, font: '170px "Amiri"', x: 960, y: 450, rtl: true, t0: T.at(8) + .1, t1: T.at(8) + 1.3, sp: 4, angle: -.9, seed: 12 }),
      titleBorder: border(300, 170, 1320, 600, { w: 5, reveal: { t0: T.at(8) - .05, t1: T.at(8) + .4, speed: 5000 } }),
      titleLamp: lampBody([1020, 682], .9),
      titleRays: WC.rays(1020, 668, { n: 40, r0: 30, r1: [60, 140], w: 6, kind: 'u', seed: 15, jit: .7, reveal: { t0: T.at(9) - .2, t1: T.at(9) + .7, jit: .4 } }),
    };
  },
  render(ctx, t, T) {
    const [P, n] = plateAt(T, t);
    let cam = {}, imp = n + 1;
    const J = jolt(t, P.from);
    if (P.id === 'cell') {
      const A = T.at(0) - 1.1, u = t - A;
      const k = eio(clamp((u - 1.6) / 6.0)), k2 = eio(clamp((t - T.at(3) + .2) / (T.end(3) - T.at(3) + 1.2)));
      const z = 3 + (1 - 3) * k + .2 * k2;
      cam = { x: F[0] + (960 - F[0]) * k - 120 * k2, y: F[1] - 10 + (483 - F[1] + 10) * k + 10 * k2, z };
      begin(cam);
      if (u > 0) drawCell(m, c, u, t, { cam });
    } else if (P.id === 'page') {
      const k = clamp((t - P.from) / (T.at(5) - P.from));
      cam = { x: 1010 + 20 * k, y: 640, z: 1.42 + .1 * k, dx: J[0], dy: J[1] };
      begin(cam);
      drawDesk(m, c, t, { cam, write: writeAt(T, t), nib: true });
    } else if (P.id === 'name') {
      cam = { dx: J[0], dy: J[1] };
      begin(cam);
      WC.drawStrokes(m, K.nameBorder, { t });
      K.name.draw(m, t); WC.drawStrokes(m, K.rule, { t }); K.rah.draw(m, t);
    } else if (P.id === 'desk') {
      const kb = clamp((t - T.word(6, 7)) / (T.end(6) - T.word(6, 7) + .3));
      const k = eio(clamp((t - P.from) / (T.at(7) - P.from)));
      cam = { x: 1000 + 90 * k, y: 560, z: 1.12, dx: J[0], dy: J[1] };
      begin(cam);
      drawDesk(m, c, t, { cam, write: writeAt(T, t), nib: true, stackH: 6 + 170 * eo(kb) });
    } else if (P.id === 'land') {
      const k = eio(clamp((t - P.from) / (T.end(7) - P.from + .4)));
      const z = Math.exp(Math.log(3.6) * (1 - k));
      cam = { x: 1088 + (960 - 1088) * k, y: 470 + (483 - 470) * k, z, dx: J[0], dy: J[1] };
      begin(cam);
      drawLand(m, c, t, P.from + .5, cam);
    } else if (P.id === 'title') {
      cam = { dx: J[0], dy: J[1] };
      begin(cam);
      WC.drawStrokes(m, K.titleBorder, { t });
      K.title.draw(m, t);
      // the lamp under the title: lit as "understood" is said
      const la = clamp((t - T.at(9) + .3) / .3);
      WC.drawStrokes(m, K.titleRays, { t });
      K.titleLamp.draw(m, 1e9);
      flameRing(m, [1020, 682], .9, la); flame(m, c, t, [1020, 682], .9, la); lampLight(c, [1020, 682], 130 * la, la);
    } else {
      cam = { dx: J[0], dy: J[1] };
      begin(cam);
      nine().draw(m, 1e9, cam);
      const tw = T.word(10, 6), t11 = T.at(11) + .2, t12 = T.at(12) + .12, t14 = T.at(14) + .15;
      const lift = eo(clamp((t - t14) / .5)) * .75 - .1 * Math.sin(clamp((t - t14 - .5) / .4) * Math.PI);
      for (let i = 8; i >= 0; i--) {
        const k = i === 0 ? clamp((t - tw) / .4) : clamp((t - t11 - (i - 1) * .12) / .25);
        const p = clamp((q12(t) - t12 - i * .085) / .34);
        let th = Math.sin(p * Math.PI) * 1.35;
        if (i === 0) th = Math.max(th, lift);
        sheet(m, i, k, th);
        if (i === 0 && lift > .05) {   // the lifted edge catches the lamp: copper
          const Q = sheetQuad(0), xr = (Q[1][0] + Q[2][0]) / 2, x = xr - (xr - Q[0][0]) * Math.cos(th), dy = (xr - Q[0][0]) * Math.sin(th) * .22;
          c.fillStyle = `rgba(0,0,0,${clamp(lift * 1.2)})`; c.beginPath(); c.moveTo(x - 3, Q[0][1] - dy - 2); c.lineTo(x + 16, Q[0][1] - dy); c.lineTo(x + 16, Q[3][1] - dy); c.lineTo(x - 3, Q[3][1] - dy + 2); c.closePath(); c.fill();
        }
      }
      // the light spreads over the pages as he "tells you how to meet the Book", then draws back
      const spread = eio(clamp((t - T.at(13)) / 2.2)) * (1 - eio(clamp((t - T.at(14)) / .9)));
      flameRing(m, F3, S3, 1); flame(m, c, t, F3, S3, 1);
      lampLight(c, F3, 300 + 1300 * spread, 1);
    }
    end();
    print(ctx, { imp });
  },
  texts(t, T) {
    const [P] = plateAt(T, t), out = [];
    if (P.id === 'name') {
      if (t > T.at(5) + 1.5) out.push({ id: 'name', text: NAME, x0: K.name.bbox[0], y0: K.name.bbox[1], x1: K.name.bbox[2], y1: K.name.bbox[3] });
      if (t > T.at(5) + 2.4) out.push({ id: 'rah', text: RAH, x0: K.rah.bbox[0], y0: K.rah.bbox[1], x1: K.rah.bbox[2], y1: K.rah.bbox[3] });
    }
    if (P.id === 'title' && t > T.at(8) + 1.4) out.push({ id: 'tafhim', text: TAFHIM, x0: K.title.bbox[0], y0: K.title.bbox[1], x1: K.title.bbox[2], y1: K.title.bbox[3] });
    return out;
  },
  events(T) {
    const A = T.at(0) - 1.1, ev = [];
    ev.push({ t: A + .3, type: 'ignite' }, { t: A + .35, type: 'cut' });
    for (const u of [1.0, 2.0, 3.0, 4.2, 5.4, 6.6]) ev.push({ t: A + u, type: 'cut' });
    for (const p of plates(T).slice(1)) ev.push({ t: p.from, type: 'paper' });
    ev.push({ t: T.at(4) + .1, type: 'pen', dur: T.at(5) - T.at(4) - .2 }, { t: T.at(6) + .1, type: 'pen', dur: T.at(7) - T.at(6) - .2 });
    ev.push({ t: T.at(5) + .25, type: 'cut' }, { t: T.at(5) + 1.6, type: 'cut' });
    ev.push({ t: T.at(7) + .5, type: 'cut' });
    ev.push({ t: T.at(8) + .1, type: 'cut' }, { t: T.at(9) - .3, type: 'ignite', soft: true });
    ev.push({ t: T.word(10, 6), type: 'cut' }, { t: T.at(11) + .2, type: 'cut' });
    ev.push({ t: T.at(12) + .12, type: 'paper' }, { t: T.at(13), type: 'light' }, { t: T.at(14) + .15, type: 'paper' });
    return ev.sort((a, b) => a.t - b.t);
  },
};
