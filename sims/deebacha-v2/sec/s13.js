// Section 13 · The prison gave him time — woodcut, hard cuts as new impressions.
// Plates: a calendar, February 1942 → the desk: the stack rises, a bookmark at 12 (Surah Yusuf), the nib stops,
// the lamp goes out → two plates side by side (bars | lamp and page) → a barred gate carved fast, snap zoom →
// behind the bars the lamp is lit again and the page fills → the last lines → a black panel:
// وَمَا تَوْفِيقِي إِلَّا بِاللَّهِ carved, copper glowing in the letters (Hud 11:88).
import { clamp, eio, eo, mulberry } from '/core/lib.js';
import { m, c, begin, end, print, jolt } from '../lib/woodcut/print2d.js';
import { WC, carveText, border, lampBody, flame, flameRing, lampLight, q12 } from '../lib/woodcut/kit.js';
import { drawDesk } from '../lib/woodcut/desk.js';

const AYAH = 'وَمَا تَوْفِيقِي إِلَّا بِاللَّهِ', REF = "Qur'an, Hud 11:88";
let K = null;

function plates(T) {
  return [
    { from: -1e9, id: 'cal' }, { from: T.at(1), id: 'desk' }, { from: T.at(3), id: 'two' }, { from: T.at(4), id: 'gate' },
    { from: T.at(5), id: 'relit' }, { from: T.at(6), id: 'last' }, { from: T.at(7), id: 'panel' },
  ];
}
const plateAt = (T, t) => { const P = plates(T); let n = 0; while (n + 1 < P.length && t >= P[n + 1].from) n++; return [P[n], n]; };

// calendar sheet: February 1942 began on a Sunday, so 28 days fill four rows
const CAL = { x0: 640, y0: 150, x1: 1280, y1: 860 };
function calText(g) {
  g.fillStyle = '#000'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  g.font = '76px "IM Fell English SC"'; g.fillText('FEBRUARY', 960, 290);
  g.font = '56px "IM Fell English"'; g.fillText('1942', 960, 368);
  g.fillRect(760, 400, 400, 3);
  g.font = '40px "IM Fell English"';
  for (let d = 1; d <= 28; d++) { const col = (d - 1) % 7, row = Math.floor((d - 1) / 7); g.fillText(String(d), 710 + col * 83.3, 500 + row * 92); }
}

// two small plates side by side: the window bars | the lamp and an open page
function twoPlates(g, cp, t) {
  const L = [150, 130, 790, 760], R = [980, 130, 790, 760];
  // left: a window full of night sky, crossed by bars
  g.fillStyle = '#fff'; g.fillRect(L[0], L[1], L[2], L[3]);
  g.fillStyle = '#000'; g.fillRect(L[0] + 20, L[1] + 20, L[2] - 40, L[3] - 40);
  const sx0 = L[0] + 170, sy0 = L[1] + 130, sw = 450, sh = 470;
  g.fillStyle = '#fff'; g.beginPath();
  for (let y = sy0; y < sy0 + sh; y += 10) { const k = (y - sy0) / sh, w = 1 + 8 * k * k; g.rect(sx0, y + 5 - w / 2, sw, w); }
  g.fill();
  const rnd = mulberry(4); g.beginPath();
  for (let i = 0; i < 14; i++) { const x = sx0 + rnd() * sw, y = sy0 + rnd() * sh * .4, r = 2 + rnd() * 2.5; g.moveTo(x + r, y); g.arc(x, y, r, 0, 7); }
  g.fill();
  g.fillStyle = '#000';
  for (let i = 1; i < 5; i++) g.fillRect(sx0 + i * sw / 5 - 9, sy0 - 6, 18, sh + 12);
  g.fillRect(sx0 - 6, sy0 + sh * .5 - 8, sw + 12, 16);
  g.strokeStyle = '#fff'; g.lineWidth = 3; g.strokeRect(sx0 - 22, sy0 - 22, sw + 44, sh + 44);
  for (let i = 0; i < 4; i++) { g.lineWidth = 2.4 - i * .4; g.beginPath(); g.moveTo(sx0 - 30, sy0 + sh + 34 + i * 7); g.lineTo(sx0 + sw + 30, sy0 + sh + 34 + i * 7); g.stroke(); }
  // right: the lamp lit beside an open page
  g.fillStyle = '#fff'; g.fillRect(R[0], R[1], R[2], R[3]);
  g.fillStyle = '#000'; g.fillRect(R[0] + 20, R[1] + 20, R[2] - 40, R[3] - 40);
  WC.drawStrokes(g, K.twoRays, {});
  K.twoLamp.draw(g, 1e9);
  const pg = [[1400, 520], [1680, 510], [1700, 700], [1384, 712]];
  WC.fillPoly(g, [WC.offsetPoly(pg, 4)], '#000'); WC.fillPoly(g, [pg], '#fff');
  g.strokeStyle = '#000'; g.lineWidth = 2.2;
  for (let i = 0; i < 7; i++) { const y = 540 + i * 24; g.beginPath(); g.moveTo(1660, y - i * .3); g.lineTo(1420 + (i === 6 ? 120 : 0), y + 2); g.stroke(); }
  flameRing(g, K.twoF, 1.6, 1); flame(g, cp, t, K.twoF, 1.6, 1); lampLight(cp, K.twoF, 300, 1);
}

// a barred gate: the light beyond is carved fast between the bars
const GATE = { x0: 330, x1: 1590, y0: 100, y1: 880, n: 9 };
function gate(g, t, t0) {
  const { x0, x1, y0, y1, n } = GATE, bw = 30, step = (x1 - x0) / n;
  // stone frame: lit edge cuts
  WC.drawStrokes(g, K.gateFrame, { t: t - t0 + 1 });
  g.save(); g.beginPath(); g.rect(x0, y0, x1 - x0, y1 - y0); g.clip();
  WC.drawStrokes(g, K.gateLight, { t: t - t0 });
  g.restore();
  g.fillStyle = '#000';
  for (let i = 1; i < n; i++) g.fillRect(x0 + i * step - bw / 2, y0 - 10, bw, y1 - y0 + 20);
  for (const y of [y0 + 150, y1 - 170]) g.fillRect(x0 - 10, y - 14, x1 - x0 + 20, 28);
  // knife halo on the flat bars only where light already is
  return step;
}

export default {
  style: 'woodcut',
  page: 'pp. 8–9',
  async init(T) {
    await Promise.all(['76px "IM Fell English SC"', '40px "IM Fell English"', '150px "Amiri"', '34px "IM Fell English SC"'].map(f => document.fonts.load(f, f.includes('Amiri') ? 'وما' : 'Ab')));
    const c0 = T.at(0) - .7;
    const calR = new WC.Region([[[CAL.x0, CAL.y0], [CAL.x1, CAL.y0], [CAL.x1, CAL.y1], [CAL.x0, CAL.y1]]], { res: 2 });
    const rnd = mulberry(9);
    // the light beyond the gate: tall vertical gouges, brighter in the middle (a lit corridor)
    const gl = [];
    for (let x = GATE.x0 + 4; x < GATE.x1; x += 9) {
      const k = 1 - Math.abs((x - 960) / 700), w = 3 + 8 * clamp(k) ** .7;
      for (let y = GATE.y0 - 20; y < GATE.y1 + 20; y += 160 + rnd() * 120) {
        const y2 = Math.min(GATE.y1 + 30, y + 150 + rnd() * 140), gi = Math.floor((x - GATE.x0) / ((GATE.x1 - GATE.x0) / GATE.n));
        gl.push(Object.assign(WC.mkStroke([[x + (rnd() - .5) * 2, y], [x + (rnd() - .5) * 3, y2]], w * (.75 + rnd() * .4), { kind: 'u', seed: rnd() * 999 }), { t0: gi * .045 + rnd() * .05, dur: .09 }));
      }
    }
    const fr = [[GATE.x0 - 40, GATE.y0 - 40], [GATE.x1 + 40, GATE.y0 - 40], [GATE.x1 + 40, GATE.y1 + 40], [GATE.x0 - 40, GATE.y1 + 40]];
    K = {
      calCut: WC.hatch(calR, { dir: WC.dirAngle(0), tone: () => 1, sp: 6, wmax: 11, lo: 0, hi: 1, kind: 'u', seed: 21, seg: [120, 300], gap: [0, 2],
        reveal: { t0: c0, t1: c0 + 1.1, key: (x, y) => (y - CAL.y0) / (CAL.y1 - CAL.y0), speed: 2600, jit: .03 } }),
      calRing: WC.cutAlong(WC.ellipse(710, 487, 34, 30, 40, -1.2), { closed: true, w: 3.4, kind: 'v', seg: [260, 300], seed: 22, reveal: { t0: T.word(0, 3) + .2, t1: T.word(0, 3) + .6, speed: 500 } }),
      nail: WC.cutAlong([[960, 70], [700, 150]], { w: 2.2, kind: 'k', seed: 23 }).concat(WC.cutAlong([[960, 70], [1220, 150]], { w: 2.2, kind: 'k', seed: 24 })),
      twoF: [1290, 520], twoLamp: lampBody([1290, 520], 1.6),
      twoRays: WC.rays(1290, 494, { n: 54, r0: 50, r1: [120, 300], w: 9, kind: 'u', seed: 25, jit: .7 }),
      gateLight: gl,
      gateFrame: WC.cutAlong(fr, { closed: true, w: 4, kind: 'v', seed: 26 }),
      border: border(160, 150, 1600, 680, { w: 5, reveal: { t0: T.at(7) + .1, t1: T.at(7) + .7, speed: 5000 } }),
      ayah: carveText({ text: AYAH, font: '150px "Amiri"', x: 960, y: 500, rtl: true, t0: T.at(8) - .05, t1: T.at(8) + 1.4, sp: 4, angle: -.9, seed: 31 }),
      ref: carveText({ text: REF, font: '34px "IM Fell English SC"', x: 960, y: 700, t0: T.at(8) + 1.4, t1: T.at(8) + 1.9, sp: 2.5, angle: -1.1, seed: 32 }),
      rule: WC.cutAlong([[800, 640], [1120, 640]], { w: 3, kind: 'v', seg: [400, 500], seed: 33, reveal: { t0: T.at(8) + 1.3, t1: T.at(8) + 1.5, speed: 1600 } }),
    };
  },
  render(ctx, t, T) {
    const [P, n] = plateAt(T, t), J = jolt(t, P.from);
    let cam = { dx: J[0], dy: J[1] };
    if (P.id === 'cal') {
      begin(cam);
      WC.drawStrokes(m, K.nail, { t });
      WC.drawStrokes(m, K.calCut, { t });
      calText(m);
      WC.drawStrokes(m, K.calRing, { t, color: '#000' });
    } else if (P.id === 'desk') {
      const grow = eo(clamp((t - P.from) / (T.word(1, 13) - P.from)));
      const tStop = T.word(2, 4), tOut = T.word(2, 11);
      const wr = 1.5 + (Math.min(t, tStop) - P.from) * .55;
      const la = 1 - clamp((t - tOut) / .35), dark = eo(clamp((t - tOut - .3) / 1.1));
      cam = { x: 1080, y: 560, z: 1.1, dx: J[0], dy: J[1] };
      begin(cam);
      drawDesk(m, c, t, { cam, write: wr, nib: t < tStop + .5, nibOff: 900 * clamp((t - tStop) / .5) ** 2, stackH: 10 + 230 * grow, bookmark: clamp((t - T.word(1, 13)) / .6), lamp: la, dark });
    } else if (P.id === 'two') {
      begin(cam);
      twoPlates(m, c, t);
    } else if (P.id === 'gate') {
      const tA = T.word(4, 5), tS = T.word(4, 6);
      const zk = eo(clamp((t - tS) / .2)), shake = t > tS + .2 && t < tS + .34 ? [((Math.floor(t * 24) % 2) ? 4 : -4), 2] : [0, 0];
      cam = { x: 960, y: 470, z: 1 + .55 * zk, dx: J[0] + shake[0], dy: J[1] + shake[1] };
      begin(cam);
      gate(m, t, tA);
    } else if (P.id === 'relit') {
      const tl = P.from + .35, la = eo(clamp((t - tl) / .3));
      cam = { x: 1020, y: 600, z: 1.12, dx: J[0], dy: J[1] };
      begin(cam);
      drawDesk(m, c, t, { cam, write: clamp((t - tl - .2) / (T.end(5) - tl - .2)) * 10, nib: t > tl + .2, stackH: 240, bookmark: 1, lamp: la, bars: eo(clamp((t - P.from) / .6)) });
    } else if (P.id === 'last') {
      const k = clamp((t - P.from) / (T.end(6) - P.from));
      cam = { x: 1000, y: 760, z: 1.75 + .1 * k, dx: J[0], dy: J[1] };
      begin(cam);
      const wr = 8 + 1.98 * eo(k);
      drawDesk(m, c, t, { cam, write: wr, nib: true, nibOff: 900 * clamp((t - T.end(6) + .1) / .5) ** 2, stackH: 240, bookmark: 1, bars: 1 });
    } else {
      begin(cam);
      WC.drawStrokes(m, K.border, { t });
      K.ayah.draw(m, t);
      WC.drawStrokes(m, K.rule, { t });
      K.ref.draw(m, t);
      // the copper plate glows in the carved letters, breathing slowly once they are cut
      const a = clamp((t - T.at(8) - .1) / 1.4) * (.9 + .1 * Math.sin(t * 2.1));
      if (a > 0) {
        c.save(); c.globalAlpha = a; c.fillStyle = '#000'; c.font = '150px "Amiri"'; c.direction = 'rtl'; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
        c.shadowColor = '#000'; c.shadowBlur = 18; c.fillText(AYAH, 960, 500); c.shadowBlur = 0; c.fillText(AYAH, 960, 500); c.restore();
      }
    }
    end();
    print(ctx, { imp: 20 + n });
  },
  texts(t, T) {
    const [P] = plateAt(T, t), out = [];
    if (P.id === 'cal' && t > T.at(0) + .5) out.push({ id: 'cal', text: 'FEBRUARY 1942', x0: 700, y0: 220, x1: 1220, y1: 375 });
    if (P.id === 'desk' && t > T.word(1, 13) + .5) out.push({ id: 'bm', text: '12', x0: 1615, y0: 412, x1: 1670, y1: 478 });
    if (P.id === 'panel') {
      if (t > T.at(8) + 1.45) out.push({ id: 'ayah', text: AYAH, x0: K.ayah.bbox[0], y0: K.ayah.bbox[1], x1: K.ayah.bbox[2], y1: K.ayah.bbox[3] });
      if (t > T.at(8) + 2.0) out.push({ id: 'ref', text: REF, x0: K.ref.bbox[0], y0: K.ref.bbox[1], x1: K.ref.bbox[2], y1: K.ref.bbox[3] });
    }
    return out;
  },
  events(T) {
    const ev = [{ t: T.at(0) - .7, type: 'cut' }, { t: T.word(0, 3) + .2, type: 'cut' }];
    for (const p of plates(T).slice(1)) ev.push({ t: p.from, type: 'paper' });
    ev.push({ t: T.at(1) + .1, type: 'nib' }, { t: T.word(1, 13), type: 'paper' });
    ev.push({ t: T.word(2, 11), type: 'light' });
    ev.push({ t: T.word(4, 5), type: 'cut' }, { t: T.word(4, 6), type: 'thud' });
    ev.push({ t: T.at(5) + .35, type: 'light' }, { t: T.at(5) + .55, type: 'nib' }, { t: T.at(6) + .1, type: 'nib' });
    ev.push({ t: T.at(7) + .1, type: 'cut' }, { t: T.at(8) - .05, type: 'cut' }, { t: T.at(8) + .2, type: 'light' });
    return ev.sort((a, b) => a.t - b.t);
  },
};
