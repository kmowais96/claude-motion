// Sample · Scene 06, Who Is Being Addressed? (lemo-opuscar paper-popup).
// An illustrated book lies open on a desk. A leaf turns; then four small paper scenes stand up out of the spread one
// after another (a traveller in the wilderness, a community deciding around a fire, one person helping another,
// someone turning away down a road that runs off the page). The camera drifts over each, then cranes up to the spread.
import * as THREE from 'three';
import { clamp, lerp, seg, ss, eio, back, track, mulberry } from './lib.js';
import * as A from './art.js';
import { estimate } from './timing.js';
import { drawCaption } from './caption.js';

const W = 1920, H = 1080, QS = new URLSearchParams(location.search), SC = +(QS.get('scale') ?? .667);
const LINES = ["Whenever you read the Qur'an...", 'Ask yourself:', 'Who is being spoken to?', 'Is it a message to the believers?',
  'A warning to those rejecting the truth?', 'An instruction to the Prophet?', 'Or an invitation to humanity?'];
const S = estimate(LINES, 1.0);
export const DUR = 26.6;

await document.fonts.load('italic 500 42px "Cormorant Garamond"', 'Ab');
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(Math.round(W * SC), Math.round(H * SC), false);
Object.assign(renderer.domElement.style, { width: W + 'px', height: H + 'px' });
renderer.toneMapping = THREE.NeutralToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('stage').appendChild(renderer.domElement);
const ov = document.getElementById('o'), OX = ov.getContext('2d');
const scene = new THREE.Scene(); scene.background = new THREE.Color('#2a1f19');
const cam = new THREE.PerspectiveCamera(30, W / H, .01, 10);

const texOf = (c, rep) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); } return t; };

// ---------- the room ----------
const desk = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.6), new THREE.MeshStandardMaterial({ map: texOf(A.woodArt(), 2), roughness: .7, color: '#d8b898' }));
desk.rotation.x = -Math.PI / 2; desk.position.z = -.2; desk.receiveShadow = true; scene.add(desk);
const wall = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.7), new THREE.MeshBasicMaterial({ map: texOf(A.roomArt()), color: '#d9c9b8' }));
wall.position.set(0, .45, -1.0); scene.add(wall);
{ // a mug on the desk, a real object next to the book
  const prof = [[0, 0], [.036, 0], [.038, .004], [.038, .085], [.035, .085], [.034, .006], [0, .006]].map(p => new THREE.Vector2(p[0], p[1]));
  const mug = new THREE.Mesh(new THREE.LatheGeometry(prof, 40), new THREE.MeshStandardMaterial({ color: '#e9ddc8', roughness: .35 }));
  const tea = new THREE.Mesh(new THREE.CircleGeometry(.034, 32), new THREE.MeshStandardMaterial({ color: '#6a3a1a', roughness: .15 })); tea.rotation.x = -Math.PI / 2; tea.position.y = .07;
  const handle = new THREE.Mesh(new THREE.TorusGeometry(.022, .006, 10, 24, Math.PI), mug.material); handle.rotation.z = -Math.PI / 2; handle.position.set(.038, .045, 0);
  const g = new THREE.Group(); g.add(mug, tea, handle); g.position.set(.36, 0, -.08); g.rotation.y = 2.4;
  g.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; }); scene.add(g);
}

// ---------- the book, lying open flat ----------
const PGW = A.PGW, PGD = A.PGD, PY = .019;
const cloth = new THREE.MeshStandardMaterial({ color: '#6e2c26', roughness: .85 });
const cover = new THREE.Mesh(new THREE.BoxGeometry(2 * PGW + .014, .006, PGD + .012), cloth); cover.position.y = .003;
const edgeMat = new THREE.MeshStandardMaterial({ color: '#efe4cc', roughness: .95 });
const blocks = [-1, 1].map(s => { const m = new THREE.Mesh(new THREE.BoxGeometry(PGW - .002, .0128, PGD), edgeMat); m.position.set(s * (PGW / 2 + .001), .006 + .0064, 0); return m; });
[cover, ...blocks].forEach(m => { m.castShadow = m.receiveShadow = true; scene.add(m); });
const leftTex = texOf(A.pageArt(-1)), rightTex = texOf(A.pageArt(1)), textTex = texOf(A.textPage());
function pagePlane(s, tex) {
  const g = new THREE.PlaneGeometry(PGW, PGD, 24, 1); g.rotateX(-Math.PI / 2); g.translate(s * PGW / 2, 0, 0);
  const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, -.004 * Math.exp(-Math.abs(p.getX(i)) / .01) + .0012 * Math.sin(Math.abs(p.getX(i)) / PGW * Math.PI));
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: tex, roughness: .92 })); m.position.y = PY + .0002; m.receiveShadow = true; scene.add(m); return m;
}
const leftPage = pagePlane(-1, textTex), rightPage = pagePlane(1, rightTex);
// the turning leaf: front = a page of text bands, back = the left half of the illustration
const NS = 40, leafF = new THREE.PlaneGeometry(1, 1, NS, 1), leafB = leafF.clone();
{ const uv = leafB.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, 1 - uv.getX(i)); }
const leafMeshF = new THREE.Mesh(leafF, new THREE.MeshStandardMaterial({ map: textTex, roughness: .92, side: THREE.FrontSide, emissive: new THREE.Color(.25, .23, .2), emissiveMap: textTex }));
const leafMeshB = new THREE.Mesh(leafB, new THREE.MeshStandardMaterial({ map: leftTex, roughness: .92, side: THREE.BackSide, emissive: new THREE.Color(.25, .23, .2), emissiveMap: leftTex }));
[leafMeshF, leafMeshB].forEach(m => { m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; scene.add(m); });
function setLeaf(u) {
  const vis = u > 0 && u < 1; leafMeshF.visible = leafMeshB.visible = vis; if (!vis) return;
  const th = Math.PI * u, L = .6 * Math.sin(Math.PI * u), ds = PGW / NS, X = [0], Y = [0];
  for (let i = 1; i <= NS; i++) { const phi = th * (1 - L * (i / NS - .5 / NS)); X.push(X[i - 1] + Math.cos(phi) * ds); Y.push(Y[i - 1] + Math.sin(phi) * ds); }
  for (const g of [leafF, leafB]) {
    const p = g.attributes.position;
    for (let iy = 0; iy < 2; iy++) for (let ix = 0; ix <= NS; ix++) { const k = iy * (NS + 1) + ix; p.setXYZ(k, X[ix], PY + .0009 + Y[ix], iy ? PGD / 2 - .001 : -PGD / 2 + .001); }
    p.needsUpdate = true; g.computeVertexNormals(); g.computeBoundingSphere();
  }
}
const LEAF = [.5, 2.7];

// ---------- cut-paper cards ----------
const matCache = new Map();
function mats(tex) {
  if (matCache.has(tex)) return matCache.get(tex);
  const front = new THREE.MeshStandardMaterial({ map: tex, alphaTest: .5, alphaToCoverage: true, roughness: .88, side: THREE.FrontSide });
  const backM = new THREE.MeshStandardMaterial({ map: tex, alphaTest: .5, alphaToCoverage: true, roughness: .92, side: THREE.BackSide });
  backM.onBeforeCompile = s => { s.fragmentShader = s.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n diffuseColor.rgb = vec3(.87,.83,.76);'); };
  backM.customProgramCacheKey = () => 'paperback';
  const depth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: .5, side: THREE.DoubleSide });
  const r = { front, back: backM, depth }; matCache.set(tex, r); return r;
}
function cutMesh(item) {
  const tex = texOf(item.c), w = item.w, h = item.h;
  const geo = new THREE.PlaneGeometry(w, h); geo.translate(w / 2 - item.ax * w, item.ay * h - h / 2, 0);
  const m = mats(tex), f = new THREE.Mesh(geo, m.front), b = new THREE.Mesh(geo, m.back);
  f.castShadow = b.castShadow = true; f.customDepthMaterial = b.customDepthMaterial = m.depth; f.receiveShadow = b.receiveShadow = true;
  const g = new THREE.Group(); g.add(f, b); return g;
}
const mirror = fn => (x, w, h) => { x.translate(w, 0); x.scale(-1, 1); fn(x, w, h); };
const CARDS = [];
// pop: rises around its bottom edge. Far pieces lie back face-up, near pieces lie forward face-down.
function pop(item, x, z, rise, o = {}) {
  const pivot = new THREE.Group(), inner = new THREE.Group(); pivot.add(inner); scene.add(pivot);
  const poses = (Array.isArray(item) ? item : [item]).map(it => { const m = cutMesh(it); inner.add(m); return m; });
  const c = { pivot, inner, poses, x, z, rise, dir: o.dir ?? (z > o.cz ? 1 : -1), yaw: o.yaw || 0, side: x < 0 ? -1 : 1, lift: .0007 + CARDS.length * .00004, anim: o.anim };
  CARDS.push(c); return c;
}
function updateCards(t, u) {
  for (const c of CARDS) {
    const shown = c.side > 0 ? u > 0 : u >= 1; c.pivot.visible = shown;
    const k = back(seg(t, c.rise, c.rise + .75), 2.2), st = { x: c.x, z: c.z, pose: 0, flip: 1, yaw: c.yaw };
    if (c.anim) c.anim(t, st);
    c.pivot.position.set(st.x, PY + c.lift, st.z);
    c.pivot.rotation.set(-c.dir * Math.PI / 2 * (1 - k), st.yaw, 0, 'YXZ');
    c.inner.scale.x = st.flip;
    c.poses.forEach((m, i) => m.visible = i === st.pose);
  }
}

// --- scene 1: a traveller crossing the wilderness (left page, back) ---
const tT = S[1].start - .4;
{
  const cz = -.06;
  pop(A.card(.17, .05, (x, w, h) => A.mesa(x, w, h, '#c97a4a', 3)), -.125, -.135, tT, { cz });
  pop(A.card(.03, .075, A.sun), -.075, -.128, tT + .5, { cz });
  pop(A.card(.16, .03, (x, w, h) => A.dunes(x, w, h, '#e8b46a', 5, .6)), -.12, -.105, tT + .15, { cz });
  pop(A.card(.055, .065, A.acacia), -.185, -.085, tT + .3, { cz });
  pop(A.card(.03, .016, (x, w, h) => A.rock(x, w, h, '#b88a5a', 2)), -.065, -.07, tT + .35, { cz });
  const walk = [0, 1, 2, 3].map(i => A.card(.05, .046, (x, w, h) => A.figure(x, w, h, { h, robe: '#c2452e', cloth: '#efe3c8', skin: '#a8714a', walk: 1, phase: i / 4 * Math.PI * 2, arm: .35, staff: 1, pack: '#7a5a3a' })));
  const x0 = -.185, x1 = -.095, w0 = tT + 1.1, w1 = 12.2;
  pop(walk, x0, -.055, tT + .45, { cz, dir: -1, anim: (t, st) => { const d = (x1 - x0) * ss(seg(t, w0 - .6, w1 + .6)) ; st.x = x0 + d; st.z = -.055 + Math.sin(d * 40) * .002; st.pose = Math.floor(d / .006) % 4; } });
  pop(A.card(.12, .02, (x, w, h) => A.dunes(x, w, h, '#efc27e', 8, .5)), -.14, -.03, tT + .6, { cz });
}
// --- scene 2: a community gathered to decide (left page, front) ---
const tC = S[3].start - .55;
{
  const cz = .07, fx = -.1, fz = .075;
  pop(A.card(.065, .045, A.tent), -.16, .045, tC, { cz, yaw: .25 });
  pop(A.card(.05, .08, (x, w, h) => A.palm(x, w, h, 3)), -.045, .04, tC + .1, { cz, yaw: -.2 });
  pop([0, 1, 2].map(f => A.card(.016, .018, (x, w, h) => A.fire(x, w, h, f))), fx, fz, tC + .35, { cz, dir: -1, anim: (t, st) => { st.pose = Math.floor(t * 7) % 3; } });
  const F = (o, mir) => A.card(.05, .04, mir ? mirror((x, w, h) => A.figure(x, w, h, { h, ...o })) : (x, w, h) => A.figure(x, w, h, { h, ...o }));
  pop(F({ robe: '#3f6f8a', skin: '#8a5a3a', arm: 1.9 }), -.13, .066, tC + .3, { cz, dir: -1 });
  pop(F({ robe: '#7a7a3a', cloth: '#e8dcc0', skin: '#c98d62', arm: .4 }), -.122, .085, tC + .4, { cz, dir: -1 });
  pop(F({ robe: '#8a4a5a', skin: '#a86b45', arm: .9 }, 1), -.07, .07, tC + .35, { cz, dir: -1 });
  pop(A.card(.05, .028, (x, w, h) => A.figure(x, w, h, { h: h / .62, view: 'sit', robe: '#5a7a5a', skin: '#b9805a' })), -.098, .056, tC + .25, { cz, dir: -1 });
  pop(F({ view: 'back', robe: '#b0703a', cloth: '#efe3c8' }), -.112, .1, tC + .5, { cz });
  pop(F({ view: 'back', robe: '#4a5a7a', cloth: '#d8c8a8' }), -.086, .098, tC + .55, { cz });
}
// --- scene 3: one person helping another (right page, front) ---
const tH = S[4].start - 1.4;
{
  const cz = .07;
  pop(A.card(.055, .075, (x, w, h) => A.roundTree(x, w, h, '#7aa64e', 6)), .195, .09, tH, { cz });
  pop(A.card(.042, .05, A.well), .155, .042, tH + .15, { cz, yaw: -.15 });
  pop(A.card(.05, .03, (x, w, h) => A.figure(x, w, h, { h: h / .62, view: 'sit', robe: '#6a6a7a', skin: '#a8714a', pack: '#7a5a3a' })), .088, .088, tH + .3, { cz, dir: -1 });
  const help = [.2, .7, 1.25].map(a => A.card(.05, .042, mirror((x, w, h) => A.figure(x, w, h, { h, robe: '#2f8a86', cloth: '#f2e6cc', skin: '#c98d62', arm: a, lean: .3, cup: a > 1 }))));
  pop(help, .128, .086, tH + .4, { cz, dir: -1, anim: (t, st) => { st.pose = t < tH + 1.4 ? 0 : t < tH + 1.8 ? 1 : 2; } });
}
// --- scene 4: someone turning away (right page, back): faces the lit house, turns, walks off the page ---
const tA = S[4].start + .25;
{
  const cz = -.07;
  pop(A.card(.065, .055, A.house), .06, -.075, tA, { cz, yaw: .2 });
  pop(A.card(.022, .06, A.lanternPost), .028, -.055, tA + .2, { cz });
  pop(A.card(.03, .015, (x, w, h) => A.rock(x, w, h, '#a8a49a', 7)), .165, -.13, tA + .3, { cz });
  const fig = ph => A.card(.05, .044, (x, w, h) => A.figure(x, w, h, { h, robe: '#5a6478', cloth: '#d8d2c4', skin: '#9a6a4a', walk: 1, phase: ph, arm: .1 }));
  const facing = A.card(.05, .044, mirror((x, w, h) => A.figure(x, w, h, { h, robe: '#5a6478', cloth: '#d8d2c4', skin: '#9a6a4a', walk: 0, arm: .3 })));
  const turn = tA + 1.6, go = turn + .5;
  pop([facing, ...[0, 1, 2, 3].map(i => fig(i / 4 * Math.PI * 2))], .105, -.058, tA + .35, { cz, dir: -1, anim: (t, st) => {
    const f = seg(t, turn, turn + .4); st.flip = Math.max(.02, Math.abs(Math.cos(f * Math.PI)));
    if (f < .5) { st.pose = 0; return; }
    const d = .1 * seg(t, go, 24.5); st.x = .105 + d; st.z = -.058 - d * .45; st.yaw = -.35 * seg(t, go, go + 1);
    st.pose = 1 + Math.floor(d / .006) % 4;
  } });
}

// ---------- light ----------
const hemi = new THREE.HemisphereLight('#fff2df', '#7a5a40', 1.15); scene.add(hemi);
const key = new THREE.DirectionalLight('#ffe2b8', 2.6); key.position.set(-.55, .85, .6); key.target.position.set(0, 0, 0);
key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -.0002; key.shadow.normalBias = .0005; key.shadow.radius = 3;
Object.assign(key.shadow.camera, { left: -.34, right: .34, top: .3, bottom: -.3, near: .2, far: 2.5 }); scene.add(key, key.target);
const fill = new THREE.DirectionalLight('#c8d8ff', .35); fill.position.set(.6, .4, -.3); scene.add(fill);

// ---------- camera ----------
const CK = [
  [0, [0, .62, .42], [0, 0, .0], 30],
  [2.9, [-.03, .38, .34], [-.05, .01, -.02], 30],
  [5.4, [-.085, .092, .105], [-.13, .03, -.075], 30],
  [8.8, [-.065, .085, .095], [-.115, .03, -.07], 30],
  [10.5, [-.045, .09, .28], [-.105, .022, .07], 30],
  [12.3, [-.03, .085, .27], [-.095, .022, .07], 30],
  [13.9, [.055, .085, .27], [.105, .022, .07], 30],
  [15.6, [.02, .13, .1], [.13, .025, -.07], 30],
  [18.6, [.05, .12, .08], [.16, .02, -.09], 30],
  [21.0, [.1, .3, .42], [0, .01, -.01], 30],
  [DUR, [.02, .43, .52], [0, 0, 0], 30],
];
const camT = track(CK.map(k => [k[0], [...k[1], ...k[2], k[3]]]));

export function events() {
  const ev = [{ t: LEAF[0], type: 'leaf' }]; for (const c of CARDS) ev.push({ t: +c.rise.toFixed(2), type: 'pop' });
  return ev.sort((a, b) => a.t - b.t);
}
export function texts(t) { return S.filter(s => t >= s.start - .1 && t < s.end + .5).map(s => s.text); }

export function render(t) {
  const u = eio(seg(t, LEAF[0], LEAF[1]));
  setLeaf(u); leftPage.material.map = u >= 1 ? leftTex : textTex;
  updateCards(t, u);
  const v = camT(t); cam.position.set(v[0], v[1], v[2]); cam.lookAt(v[3], v[4], v[5]); cam.fov = v[6]; cam.updateProjectionMatrix();
  renderer.render(scene, cam);
  OX.clearRect(0, 0, W, H);
  const g = OX.createRadialGradient(W / 2, H * .48, H * .35, W / 2, H * .5, H * .95); g.addColorStop(0, 'rgba(30,18,10,0)'); g.addColorStop(1, 'rgba(30,18,10,.5)');
  OX.fillStyle = g; OX.fillRect(0, 0, W, H);
  const fade = Math.min(seg(t, 0, .6), 1 - seg(t, DUR - .6, DUR));
  if (fade < 1) { OX.fillStyle = `rgba(0,0,0,${1 - fade})`; OX.fillRect(0, 0, W, H); }
  const b = OX.createLinearGradient(0, 860, 0, H); b.addColorStop(0, 'rgba(20,12,6,0)'); b.addColorStop(1, 'rgba(20,12,6,.55)'); OX.fillStyle = b; OX.fillRect(0, 860, W, H - 860);
  drawCaption(OX, S, t);
}
