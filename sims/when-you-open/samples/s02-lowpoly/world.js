// Scene 02 world: a straight row of chapter blocks that lifts and becomes a chain of six linked low-poly islands.
// Everything is a pure function of t (update(t)); arrivals use the style's rise / drop / pop curves.
import * as THREE from 'three';
import { clamp, seg, ss, eo, eio, lerp, hash, TAU } from './lib.js';
import { waveH, STORM } from './sea.js';

const DEG = Math.PI / 180, SQ3 = Math.sqrt(3);
export const A0 = 25;                                    // the chain runs along this bearing
const RX = Math.cos(A0 * DEG), RZ = -Math.sin(A0 * DEG), TX = Math.sin(A0 * DEG), TZ = Math.cos(A0 * DEG);
export const wp = (u, w) => [u * RX + w * TX, u * RZ + w * TZ];

// ---- timing (seconds) ----
export const TM = {
  blockIn: i => .55 + i * .26,                           // chapters laid down one by one
  lift: [4.9, 5.8],                                      // the row lifts as one
  move: i => [5.8 + i * .06, 7.45 + i * .06],            // and breaks apart along the chain
  sink: i => 7.5 + i * .1,                               // each block settles into its island
  bridge: b => 8.75 + b * .14,
  stars: 16.1,
  flash: [23.15, 23.75],
};

// ---- materials ----
const MC = new Map();
export function mat(hex, o = {}) {
  const k = hex + JSON.stringify(o);
  if (!MC.has(k)) MC.set(k, new THREE.MeshStandardMaterial({ color: hex, flatShading: true, roughness: .9, metalness: 0, ...o }));
  return MC.get(k);
}
const jit = (hex, a) => { const c = new THREE.Color(hex), h = {}; c.getHSL(h); c.setHSL(h.h, h.s, clamp(h.l * (1 + a))); return '#' + c.getHexString(); };
const M = (g, m, cast = true) => { const x = new THREE.Mesh(g, m); x.castShadow = cast; x.receiveShadow = true; return x; };
export const winMat = new THREE.MeshStandardMaterial({ color: '#4d5c74', emissive: '#ffbe6a', emissiveIntensity: 0, flatShading: true, roughness: .6 });
export const starMat = new THREE.MeshStandardMaterial({ color: '#fff3d0', emissive: '#ffeec0', emissiveIntensity: 0, flatShading: true, roughness: .8 });
export const lampMat = new THREE.MeshStandardMaterial({ color: '#f3e2b8', emissive: '#ffb860', emissiveIntensity: 0, flatShading: true, roughness: .6 });
export const cloudMat = new THREE.MeshStandardMaterial({ color: '#7f8898', emissive: '#e6eeff', emissiveIntensity: 0, flatShading: true, roughness: 1 });

// ---- curves ----
const riseY = s => s < -.4 ? null : s < 0 ? -2.6 * Math.pow(1 - seg(s, -.4, 0), 2) : .12 * Math.sin(s * 15) * Math.exp(-s * 6);
const pop = s => s <= 0 ? 0 : 1 - Math.exp(-6 * s) * Math.cos(14 * s);
function dropY(s) {                                       // fast ease-in fall, damped bounce; returns [yOff, squash]
  if (s < -.3) return null;
  if (s < 0) { const u = -s / .3; return [1.5 * u * u, 1]; }
  return [.05 * Math.abs(Math.sin(s * 18)) * Math.exp(-s * 9), 1 - .25 * Math.sin(s * 22) * Math.exp(-s * 12)];
}

// ---- primitives ----
const TR = .56;                                           // hex tile circumradius
const hexXZ = (q, r) => [SQ3 * TR * (q + r / 2), 1.5 * TR * r];
function hexTile(h, top, side) {
  const g = new THREE.Group(), y0 = -2.4, bt = h - .1;
  const body = M(new THREE.CylinderGeometry(TR * .94, TR * .94, bt - y0, 6, 1), mat(side)); body.position.y = (bt + y0) / 2; g.add(body);
  const cap = M(new THREE.CylinderGeometry(TR * .955, TR * .955, .14, 6, 1), mat(top)); cap.position.y = h - .07; g.add(cap);
  return g;
}
function gable(w, d, h, over = .06) {
  const W = w / 2 + over, D = d / 2 + over, g = new THREE.BufferGeometry();
  const v = [-W, 0, -D, W, 0, -D, W, h, 0, -W, 0, -D, W, h, 0, -W, h, 0, -W, 0, D, -W, h, 0, W, h, 0, -W, 0, D, W, h, 0, W, 0, D,
    -W, 0, -D, -W, 0, D, W, 0, D, -W, 0, -D, W, 0, D, W, 0, -D];
  g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.computeVertexNormals(); return g;
}
function gableEnds(w, d, h) {
  const W = w / 2, D = d / 2, g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([W, 0, -D, W, 0, D, W, h, 0, -W, 0, D, -W, 0, -D, -W, h, 0], 3)); g.computeVertexNormals(); return g;
}
function windows(g, w, d, y, n = 1, size = [.11, .15]) {
  const wg = new THREE.PlaneGeometry(...size);
  for (let s = 0; s < 4; s++) {
    const a = s * Math.PI / 2, half = (s % 2 ? w : d) / 2, span = (s % 2 ? d : w);
    for (let j = 0; j < n; j++) {
      const off = n === 1 ? 0 : (j / (n - 1) - .5) * span * .5;
      const m = new THREE.Mesh(wg, winMat); m.position.set(Math.sin(a) * (half + .004) + Math.cos(a) * off, y, Math.cos(a) * (half + .004) - Math.sin(a) * off); m.rotation.y = a; g.add(m);
    }
  }
}
function flatHouse(w, d, h, wall) {                       // cubic flat-roofed house with a parapet
  const g = new THREE.Group();
  const b = M(new THREE.BoxGeometry(w, h, d), mat(wall)); b.position.y = h / 2; g.add(b);
  const p = M(new THREE.BoxGeometry(w + .04, .06, d + .04), mat(jit(wall, -.08))); p.position.y = h + .03; g.add(p);
  for (let f = 0; f < Math.round(h / .34); f++) windows(g, w, d, .2 + f * .34, w > .5 ? 2 : 1);
  return g;
}
function pitchedHouse(w, d, h, wall, roof) {
  const g = new THREE.Group();
  const b = M(new THREE.BoxGeometry(w, h, d), mat(wall)); b.position.y = h / 2; g.add(b);
  const r = new THREE.Group(); r.add(M(gable(w, d, .36), mat(roof))); r.add(M(gableEnds(w - .01, d - .01, .36), mat(wall))); r.position.y = h; g.add(r);
  const ch = M(new THREE.BoxGeometry(.1, .3, .1), mat('#b88a6e')); ch.position.set(w * .25, h + .3, -d * .15); g.add(ch);
  windows(g, w, d, h * .55, 2);
  const door = new THREE.Mesh(new THREE.PlaneGeometry(.13, .22), mat('#7d5436')); door.position.set(-.1, .11, d / 2 + .006); g.add(door);
  return g;
}
function tree(kind, s = 0) {
  const g = new THREE.Group();
  if (kind === 'palm') {
    const tr = M(new THREE.CylinderGeometry(.035, .055, .75, 5), mat('#b98b5e')); tr.position.set(.06, .37, 0); tr.rotation.z = -.16; g.add(tr);
    for (let k = 0; k < 5; k++) {
      const lf = M(new THREE.ConeGeometry(.075, .5, 3), mat(['#7fc36a', '#9ad06f', '#6fb35e'][k % 3])), a = k / 5 * TAU + s;
      lf.position.set(.12 + Math.cos(a) * .18, .77, Math.sin(a) * .18); lf.rotation.set(Math.sin(a) * 1.25, 0, -Math.cos(a) * 1.25); g.add(lf);
    }
  } else if (kind === 'pine') {
    const tr = M(new THREE.CylinderGeometry(.04, .06, .22, 5), mat('#8a5a3c')); tr.position.y = .11; g.add(tr);
    const c1 = M(new THREE.ConeGeometry(.26, .46, 6), mat('#3f8a5a')); c1.position.y = .42; g.add(c1);
    const c2 = M(new THREE.ConeGeometry(.19, .36, 6), mat('#4f9c63')); c2.position.y = .68; c2.rotation.y = .5; g.add(c2);
  } else {
    const big = kind === 'big', R = big ? .46 : .26;
    const tr = M(new THREE.CylinderGeometry(.05, .07, big ? .45 : .26, 5), mat('#8a5a3c')); tr.position.y = big ? .22 : .13; g.add(tr);
    const c = M(new THREE.IcosahedronGeometry(R, 0), mat(['#7fc36a', '#9ad06f', '#6fb35e'][Math.floor(s * 3) % 3])); c.position.y = big ? .72 : .44; c.rotation.set(s * 3, s * 5, 0); g.add(c);
  }
  return g;
}
function pawn(col, seated) {                             // a featureless figure: cone body + plain ball head
  const g = new THREE.Group(), h = seated ? .13 : .2;
  const b = M(new THREE.CylinderGeometry(.03, .06, h, 6), mat(col)); b.position.y = h / 2; g.add(b);
  const hd = M(new THREE.IcosahedronGeometry(.042, 0), mat('#e8d6c0')); hd.position.y = h + .04; g.add(hd);
  return g;
}
function lamp(h = .5) {
  const g = new THREE.Group();
  const p = M(new THREE.CylinderGeometry(.018, .022, h, 5), mat('#6d5a4a')); p.position.y = h / 2; g.add(p);
  const l = M(new THREE.BoxGeometry(.08, .1, .08), lampMat, false); l.position.y = h + .05; g.add(l);
  return g;
}
function crescent(R0 = .42, R1 = .36, d = .2) {
  const x = (d * d + R0 * R0 - R1 * R1) / (2 * d), y = Math.sqrt(Math.max(0, R0 * R0 - x * x));
  const a0 = Math.atan2(y, x), b0 = Math.atan2(y, x - d), sh = new THREE.Shape();
  const N = 28;
  for (let i = 0; i <= N; i++) { const a = lerp(a0, TAU - a0, i / N); const p = [Math.cos(a) * R0, Math.sin(a) * R0]; i ? sh.lineTo(...p) : sh.moveTo(...p); }
  for (let i = 0; i <= N; i++) { const a = lerp(TAU - b0, b0, i / N); sh.lineTo(d + Math.cos(a) * R1, Math.sin(a) * R1); }
  return new THREE.ExtrudeGeometry(sh, { depth: .08, bevelEnabled: false, curveSegments: 4 });
}
function boat() {
  const g = new THREE.Group();
  const hull = M(new THREE.CylinderGeometry(.3, .2, .16, 4, 1), mat('#a8764e')); hull.rotation.y = Math.PI / 4; hull.scale.set(1.6, 1, .6); hull.position.y = .05; g.add(hull);
  const mast = M(new THREE.CylinderGeometry(.015, .015, .6, 4), mat('#7d5436')); mast.position.y = .4; g.add(mast);
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute([.02, .15, 0, .02, .68, 0, .3, .16, 0], 3)); sg.computeVertexNormals();
  g.add(M(sg, mat('#f6f0e2', { side: THREE.DoubleSide })));
  return g;
}

// ---- the six environments ----
// tile(c) → { h, top, side } ; props(api) places things on tiles: api.on(q, r, obj, dx, dz, popDelay)
const ISL = [
  { name: 'desert', drop: .8,
    tile(c) { if (c.d === 0) return { h: .24, top: '#7fd6cf', side: '#d9bc84' };
      if (c.r <= -1 && c.q >= 0 && c.d === 2) return { h: 1.15 + c.hs * .45, top: '#e0a27a', side: '#c4815c' };
      return { h: .36 + c.hs * .3, top: jit('#f3dfab', (c.hs - .5) * .08), side: '#e2c68e' }; },
    props(P) { P.on(1, 0, tree('palm', .3), .05, -.1); P.on(-1, 0, tree('palm', 1.4), 0, .1); P.on(0, 1, tree('palm', 2.2), -.1, 0);
      const tent = new THREE.Group(); tent.add(M(gable(.5, .44, .32, 0), mat('#c9504a'))); tent.add(M(gableEnds(.49, .43, .32), mat('#efd9b4'))); tent.rotation.y = .5; P.on(1, 1, tent);
      const rk = M(new THREE.IcosahedronGeometry(.16, 0), mat('#c4a07e')); rk.scale.y = .6; P.on(-2, 1, rk); } },
  { name: 'city', drop: .82,
    tile(c) { return { h: .5 + (c.d === 2 ? c.hs * .08 : 0), top: jit('#e9dfcc', (c.hs - .5) * .06), side: '#cbbda6' }; },
    props(P) {
      const m = new THREE.Group(); m.add(flatHouse(.9, .9, .5, '#f6eedf'));
      const dome = M(new THREE.SphereGeometry(.34, 8, 4, 0, TAU, 0, Math.PI / 2), mat('#3f8f86')); dome.position.y = .53; m.add(dome);
      P.on(0, 0, m);
      const mn = new THREE.Group(); const sh = M(new THREE.CylinderGeometry(.08, .1, 1.25, 8), mat('#f3ead8')); sh.position.y = .62; mn.add(sh);
      const bal = M(new THREE.CylinderGeometry(.13, .13, .05, 8), mat('#d8cbb2')); bal.position.y = 1.0; mn.add(bal);
      const cn = M(new THREE.ConeGeometry(.1, .24, 8), mat('#3f8f86')); cn.position.y = 1.37; mn.add(cn); P.on(1, -1, mn, .05, .1);
      const walls = ['#fbf3e6', '#f3dcc0', '#e9c9a6', '#f6e7cf', '#ead7bd'];
      [[-1, 0, .7, .6, .68], [0, 1, .62, .62, .34], [-1, 1, .6, .7, .68], [1, 0, .55, .6, 1.02], [0, -1, .66, .58, .34], [2, -1, .6, .6, .68], [-2, 1, .6, .55, .34], [1, 1, .62, .6, .68], [-1, 2, .58, .6, .34], [-2, 0, .6, .6, .68], [2, 0, .5, .55, .34], [0, -2, .62, .6, .68]]
        .forEach(([q, r, w, d, h], k) => P.on(q, r, flatHouse(w, d, h, walls[k % 5]), 0, 0)); } },
  { name: 'gathering', drop: .8,
    tile(c) { return c.d <= 1 ? { h: .45, top: jit('#ddd5c4', (c.hs - .5) * .05), side: '#bfb39c' } : { h: .5 + c.hs * .12, top: jit('#93c96c', (c.hs - .5) * .1), side: '#c99c6e' }; },
    props(P) { P.on(0, 0, tree('big', .4));
      const cols = ['#e9dcc4', '#c9907a', '#8fa3b8', '#e0c08a', '#a9b89a', '#d8c8b4'];
      for (let k = 0; k < 10; k++) { const a = k / 10 * TAU + .2, p = pawn(cols[k % 6], true); P.at(Math.cos(a) * .92, .45, Math.sin(a) * .92, p, -a + Math.PI / 2); }
      for (const [q, r] of [[2, -1], [-2, 1], [0, 2], [1, -2]]) P.on(q, r, lamp(.5));
      P.on(-1, -1, tree('round', .7)); P.on(2, 0, tree('pine', .2)); P.on(-2, 2, tree('round', 1.3)); } },
  { name: 'night', drop: .76,
    tile(c) { return { h: c.d === 0 ? 1.5 : c.d === 1 ? .9 + c.hs * .3 : .45 + c.hs * .2, top: jit(c.d === 0 ? '#a7a3bd' : '#8fae7e', (c.hs - .5) * .08), side: c.d === 0 ? '#7f7b98' : '#9c8a74' }; },
    props(P) { P.on(1, -1, tree('pine', .3)); P.on(-1, 1, tree('pine', .9)); P.on(-2, 1, tree('pine', .5)); P.on(2, 0, tree('pine', 1.1));
      const st = new THREE.Group(); const b = M(new THREE.CylinderGeometry(.16, .2, .3, 8), mat('#d9d5cc')); b.position.y = .15; st.add(b); P.on(0, 0, st); P.stars(); } },
  { name: 'home', drop: .8,
    tile(c) { return { h: .55 + (c.d === 2 ? c.hs * .1 : 0), top: jit(c.d === 0 || (c.q === 1 && c.r === -1) ? '#a8d47c' : '#93c96c', (c.hs - .5) * .1), side: '#c99c6e' }; },
    props(P) { const h = pitchedHouse(.86, .7, .52, '#fbf3e6', '#d9644a'); P.on(0, 0, h, 0, -.05); P.home = h;
      P.on(1, -1, tree('round', .2)); P.on(-1, 0, tree('round', 1.7)); P.on(-1, -1, tree('pine', .4)); P.on(2, -1, tree('pine', 1.0)); P.on(0, 1, lamp(.42), .25, 0);
      for (let k = 0; k < 5; k++) { const b = M(new THREE.IcosahedronGeometry(.1, 0), mat(['#7fc36a', '#9ad06f'][k % 2])); b.scale.y = .7; P.on(1, 0, b, (k - 2) * .16, .2 * Math.sin(k)); }
      for (let k = 0; k < 6; k++) { const f = M(new THREE.BoxGeometry(.03, .16, .03), mat('#f3ead8')); P.on(-1, 1, f, (k - 2.5) * .14, .3); } } },
  { name: 'storm', drop: .6,
    tile(c) { return { h: .4 + c.hs * .45 + (c.d === 0 ? .5 : 0), top: jit('#a4a9b0', (c.hs - .5) * .1), side: '#80868f' }; },
    props(P) { P.on(0, 0, M(new THREE.ConeGeometry(.32, .7, 5), mat('#8d939b')), 0, 0); P.on(1, 0, tree('pine', .6)); P.storm(); } },
];

// ---- build ----
export const ISL_U = [-15.5, -9.3, -3.1, 3.1, 9.3, 15.5], ISL_W = [0, -1.0, .7, -.7, .8, -.3];
export const ISL_P = ISL_U.map((u, i) => wp(u, ISL_W[i]));
export const ROW_U = i => (i - 2.5) * 1.56;
const CH_COL = ['#e0874f', '#4f7fb8', '#7fbd62', '#6a5a8e', '#d9644a', '#3f8f86'];

export function buildWorld(scene) {
  const tiles = [], props = [], stars = [], blocks = [], planks = [], rings = [];
  let rain = null, cloud = null, boatO = null, smoke = [], homeP = null;

  ISL.forEach((spec, i) => {
    const G = new THREE.Group(); G.position.set(ISL_P[i][0], 0, ISL_P[i][1]); scene.add(G);
    const t0 = TM.sink(i) + .25;                      // centre tile breaks the surface as the block settles
    const map = new Map();
    for (let q = -2; q <= 2; q++) for (let r = -2; r <= 2; r++) {
      const d = Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r)); if (d > 2) continue;
      const hs = hash(i * 97 + q * 13 + r * 31 + 7);
      if (d === 2 && hash(i * 53 + q * 7 + r * 19) > spec.drop) continue;
      const [x, z] = hexXZ(q, r), c = { q, r, d, x, z, hs }, s = spec.tile(c);
      const o = hexTile(s.h, s.top, s.side); o.position.set(x, 0, z); G.add(o);
      const te = t0 + d * .13 + hs * .09; c.h = s.h; c.te = te; map.set(q + ',' + r, c);
      tiles.push({ obj: o, te, wx: G.position.x + x, wz: G.position.z + z });
    }
    let k = 0;
    const P = {
      on(q, r, obj, dx = 0, dz = 0) { const c = map.get(q + ',' + r); if (!c) return; this.at(c.x + dx, c.h, c.z + dz, obj); },
      at(x, y, z, obj, ry = 0) { obj.position.set(x, y, z); obj.rotation.y += ry; G.add(obj); props.push({ obj, te: t0 + .55 + k++ * .07 }); },
      stars() {
        for (let j = 0; j < 9; j++) {
          const a = j * 2.4 + .3, rr = .4 + hash(j + 3) * 1.4, s = M(new THREE.IcosahedronGeometry(.06 + hash(j + 11) * .06, 0), starMat, false);
          s.position.set(Math.cos(a) * rr, 2.4 + hash(j + 5) * 1.1, Math.sin(a) * rr); G.add(s); stars.push({ obj: s, te: TM.stars + j * .14, y: s.position.y, ph: j });
        }
        const m = M(crescent(), starMat, false); m.position.set(-.7, 3.55, 0); m.rotation.set(0, 45 * DEG, -.5); G.add(m); stars.push({ obj: m, te: TM.stars - .25, y: 3.55, ph: 0, moon: true });
      },
      storm() {
        cloud = new THREE.Group();
        for (let j = 0; j < 8; j++) { const b = M(new THREE.IcosahedronGeometry(.42 + hash(j + 40) * .35, 0), cloudMat); const a = j * 2.1;
          b.position.set(Math.cos(a) * .75 * hash(j + 2), hash(j + 9) * .35, Math.sin(a) * .6 * hash(j + 4)); b.scale.y = .62; cloud.add(b); }
        cloud.position.set(0, 3.2, 0); G.add(cloud); props.push({ obj: cloud, te: t0 + 1.2 });
        const N = 260, pos = new Float32Array(N * 6);
        const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        rain = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: '#d4dde8', transparent: true, opacity: .45, depthWrite: false }));
        rain.frustumCulled = false; G.add(rain); rain.userData.N = N;
        boatO = boat(); G.add(boatO);
      },
    };
    spec.props(P); if (P.home) homeP = P.home;
    // splash ring when the island breaks the surface
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.0, 1.12, 32), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2; ring.position.set(G.position.x, .12, G.position.z); scene.add(ring); rings.push({ obj: ring, te: t0 });
    // the chapter block for this island
    const B = new THREE.Group(), bw = 1.48, bh = .42, bd = 2.2;
    const body = M(new THREE.BoxGeometry(bw, bh, bd), mat('#f4ead6')); B.add(body);
    const top = M(new THREE.BoxGeometry(bw - .06, .02, bd - .06), mat('#fbf6ea')); top.position.y = bh / 2 + .005; B.add(top);
    for (let j = 0; j < 7; j++) { const ln = M(new THREE.BoxGeometry(j % 3 === 2 ? .7 : 1.08, .014, .07), mat('#d8ccb4'), false); ln.position.set(j % 3 === 2 ? -.19 : 0, bh / 2 + .02, -.78 + j * .24); B.add(ln); }
    const spine = M(new THREE.BoxGeometry(bw + .01, .12, bd + .01), mat(CH_COL[i])); spine.position.y = -.06; B.add(spine);
    B.rotation.y = A0 * DEG; scene.add(B); blocks.push({ obj: B, i });
  });
  // bridges between neighbours
  for (let b = 0; b < 5; b++) {
    const [px, pz] = ISL_P[b], [qx, qz] = ISL_P[b + 1]; let dx = qx - px, dz = qz - pz; const L = Math.hypot(dx, dz); dx /= L; dz /= L;
    const a = 2.05, len = L - 2 * a, n = Math.floor(len / .25), ry = Math.atan2(dx, dz);
    for (let j = 0; j < n; j++) {
      const u = (j + .5) / n, pl = M(new THREE.BoxGeometry(.6, .05, .19), mat(j % 2 ? '#a8764e' : '#b98a5e'));
      pl.position.set(px + dx * (a + u * len), .62 + .26 * Math.sin(Math.PI * u), pz + dz * (a + u * len)); pl.rotation.y = ry; pl.rotation.x = -Math.cos(Math.PI * u) * .3;
      scene.add(pl); planks.push({ obj: pl, te: TM.bridge(b) + j * .028, y: pl.position.y });
    }
    for (const e of [a - .05, L - a + .05]) for (const sd of [-1, 1]) {
      const po = M(new THREE.CylinderGeometry(.03, .03, .9, 5), mat('#7d5436')); po.position.set(px + dx * e + dz * .3 * sd, .3, pz + dz * e - dx * .3 * sd); scene.add(po);
      planks.push({ obj: po, te: TM.bridge(b) - .05, y: .3 });
    }
  }
  // smoke from the home chimney
  for (let j = 0; j < 5; j++) { const s = new THREE.Mesh(new THREE.IcosahedronGeometry(.06, 0), new THREE.MeshStandardMaterial({ color: '#e8e4ee', flatShading: true, transparent: true, opacity: 0, depthWrite: false })); scene.add(s); smoke.push(s); }

  const SP = ISL_P[5]; STORM[0] = SP[0]; STORM[1] = SP[1];
  const tmp = new THREE.Vector3();

  function update(t, { night, sea }) {
    const blobs = [];
    // chapter blocks: rise in a row → lift → spread along the chain → settle into their islands
    for (const { obj, i } of blocks) {
      const tin = TM.blockIn(i), r = riseY(t - tin), [m0, m1] = TM.move(i), sk = TM.sink(i);
      if (r === null || t > sk + .5) { obj.visible = false; continue; }
      obj.visible = true;
      const lift = eio(seg(t, TM.lift[0] + i * .03, TM.lift[1] + i * .03)), mv = eio(seg(t, m0, m1));
      const [x0, z0] = wp(ROW_U(i), 0), [x1, z1] = ISL_P[i];
      const y = .11 + r + lift * 1.25 + Math.sin(Math.PI * mv) * .5 - eio(seg(t, sk, sk + .45)) * 1.1;
      obj.position.set(lerp(x0, x1, mv), y, lerp(z0, z1, mv));
      obj.rotation.set(Math.sin(Math.PI * mv) * .08 * (i % 2 ? 1 : -1), A0 * DEG + mv * (-A0 * DEG), Math.sin(Math.PI * mv) * .06);
      const sc = 1 - .75 * eio(seg(t, sk, sk + .45)); obj.scale.setScalar(sc);
      if (t > sk + .44) obj.visible = false;
      if (lift < .5) blobs.push([x0, z0, 1.6, ss(seg(t, tin - .2, tin + .3)) * (1 - lift * 2)]);
    }
    for (const T of tiles) {
      const y = riseY(t - T.te); T.obj.visible = y !== null; if (y === null) continue;
      T.obj.position.y = y; blobs.push([T.wx, T.wz, 1.0, ss(seg(t, T.te - .3, T.te + .4))]);
    }
    for (const R of rings) { const s = t - R.te; R.obj.visible = s > 0 && s < 1.1; if (!R.obj.visible) continue; R.obj.scale.setScalar(1 + s * 1.9); R.obj.material.opacity = .6 * (1 - s / 1.1); }
    for (const p of props) { const s = pop(t - p.te); p.obj.visible = s > .001; p.obj.scale.setScalar(Math.max(.001, s)); }
    for (const p of planks) { const d = dropY(t - p.te); p.obj.visible = d !== null; if (!d) continue; p.obj.position.y = p.y + d[0]; p.obj.scale.set(1 / Math.sqrt(d[1]), d[1], 1 / Math.sqrt(d[1])); }
    for (const s of stars) {
      const k = pop(t - s.te); s.obj.visible = k > .001; if (!s.obj.visible) continue;
      s.obj.scale.setScalar(Math.max(.001, k)); s.obj.position.y = s.y + Math.sin(t * .9 + s.ph) * .05;
      if (!s.moon) s.obj.rotation.set(t * .4 + s.ph, t * .3, 0);
    }
    starMat.emissiveIntensity = .4 + 1.6 * ss(seg(night, .1, .8));
    const lit = ss(seg(night, .12, .6));
    winMat.emissiveIntensity = 2.0 * lit; lampMat.emissiveIntensity = 2.4 * lit;
    // storm: swell, cloud, rain, a soft flash, the boat riding the waves
    const st = ss(seg(t, TM.sink(5) + 1.2, TM.sink(5) + 2.5));
    STORM[2] = 2.2 * st; sea.U.uStorm.value.set(STORM[0], STORM[1], STORM[2]);
    const fl = Math.exp(-Math.pow((t - TM.flash[0]) / .06, 2)) + .6 * Math.exp(-Math.pow((t - TM.flash[1]) / .05, 2));
    cloudMat.emissiveIntensity = .9 * fl;
    if (cloud) cloud.rotation.y = t * .05;
    if (rain) {
      rain.visible = st > .01; rain.material.opacity = .45 * st;
      const pos = rain.geometry.attributes.position.array, N = rain.userData.N;
      for (let j = 0; j < N; j++) {
        const a = hash(j * 3.1) * TAU, rr = Math.sqrt(hash(j * 7.7)) * 2.0, fall = (t * 5.5 + hash(j * 1.3) * 3) % 3, x = Math.cos(a) * rr, z = Math.sin(a) * rr, y = 3.0 - fall;
        pos.set([x, y, z, x - .05, y - .26, z + .03], j * 6);
      }
      rain.geometry.attributes.position.needsUpdate = true;
    }
    if (boatO) {
      const bx = 2.15, bz = .7, wx = SP[0] + bx, wz = SP[1] + bz;
      const h = waveH(wx, wz, t), hx = waveH(wx + .3, wz, t) - waveH(wx - .3, wz, t), hz = waveH(wx, wz + .3, t) - waveH(wx, wz - .3, t);
      boatO.position.set(bx, h, bz); boatO.rotation.set(hz * 1.6, .9, -hx * 1.6);
      boatO.visible = t > TM.sink(5) + .9; boatO.scale.setScalar(pop(t - TM.sink(5) - .9) || .001);
      blobs.push([wx, wz, .5, .3]);
    }
    // chimney smoke
    if (homeP) {
      homeP.updateMatrixWorld(); tmp.set(.86 * .25, .52 + .48, -.7 * .15); homeP.localToWorld(tmp);
      smoke.forEach((s, j) => { const u = ((t * .35 + j / 5) % 1); s.visible = homeP.visible && homeP.scale.x > .9;
        s.position.set(tmp.x + u * .3, tmp.y + u * .9, tmp.z - u * .1); s.scale.setScalar(.6 + u * 1.4); s.material.opacity = .55 * Math.sin(Math.PI * u); });
    }
    sea.drawShallow(blobs);
  }
  return { update };
}
