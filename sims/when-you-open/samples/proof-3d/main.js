// Proof slice for the unified "Ivory room": one real still-life in three.js, one morning light.
// The window light creeps across the table to the closed mushaf, the camera glides in with a focus pull,
// the cover opens, a blank leaf turns, and the wall behind becomes a camera-obscura screen: desert, town, sea.
// render(t) is a pure function of t (seeded hashes only).
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { makePost } from './lib/post.js';
import { clamp, lerp, seg, ss, eio, hash, vnoise, track, TAU } from './lib/lib.js';
import { COVER, GOLD } from './cover.js';

const W = 1920, H = 1080, DUR = 45;
const QS = new URLSearchParams(location.search);
const RS = QS.has('full') ? 1 : 2;

// ------------------------------------------------------------------ beats
const T = { beam0: 0, beam1: 8, open0: 13, open1: 16.4, leaf0: 17.4, leaf1: 21, slit0: 21.6, slit1: 25.2, city: 31, sea: 38.2, out0: 43.6 };
const breeze = t => .55 * Math.sin(t * .9) + .3 * Math.sin(t * 2.3 + 1.3) + .15 * Math.sin(t * 5.1 + .4) + .6 * Math.exp(-Math.pow((t % 11) - 6, 2) * .6);

// ------------------------------------------------------------------ renderer
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W / RS, H / RS, false); renderer.domElement.style.width = W + 'px'; renderer.domElement.style.height = H + 'px';
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.shadowMap.autoUpdate = false;
document.getElementById('stage').appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color('#2a241c');
const pm = new THREE.PMREMGenerator(renderer);
scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture; scene.environmentIntensity = .16;
const camera = new THREE.PerspectiveCamera(30, W / H, .02, 12);
const post = makePost(renderer, scene, camera, W / RS, H / RS, { ssaa: 1, ao: false });
post.bloom.strength = .22; post.bloom.radius = .6; post.bloom.threshold = .92;
post.vig.uniforms.amt.value = .38; post.vig.uniforms.warm.value = .35; post.vig.uniforms.contrast.value = .12; post.vig.uniforms.sat.value = .92;

const canvas = (w, h = w) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const tex = (c, srgb = true) => { const x = new THREE.CanvasTexture(c); if (srgb) x.colorSpace = THREE.SRGBColorSpace; x.anisotropy = 8; return x; };
let sd = 7; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
function noiseCanvas(n, oct, base, amp, sx = 1, sy = 1) {             // value-noise field, grey
  const c = canvas(n), g = c.getContext('2d'), d = g.createImageData(n, n), G = [];
  for (let o = 0; o < oct; o++) { const m = 4 << o; G.push(Array.from({ length: (m + 1) * (m + 1) }, rnd)); }
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    let v = 0, a = 1, s = 0;
    for (let o = 0; o < oct; o++) { const m = 4 << o, fx = (x / n * sx * m) % m, fy = (y / n * sy * m) % m, ix = Math.floor(fx), iy = Math.floor(fy), ux = fx - ix, uy = fy - iy, q = G[o], r = m + 1;
      const k = (i, j) => q[(j % m) * r + (i % m)], sm = u => u * u * (3 - 2 * u);
      v += a * lerp(lerp(k(ix, iy), k(ix + 1, iy), sm(ux)), lerp(k(ix, iy + 1), k(ix + 1, iy + 1), sm(ux)), sm(uy)); s += a; a *= .55; }
    const p = (y * n + x) * 4, val = base + (v / s - .5) * amp; d.data[p] = d.data[p + 1] = d.data[p + 2] = val; d.data[p + 3] = 255;
  }
  g.putImageData(d, 0, 0); return c;
}

// ------------------------------------------------------------------ the room: an ivory lime-plaster wall and a pale limewashed table
const WALLZ = -.55;
{
  const bump = tex(noiseCanvas(512, 6, 128, 120), false); bump.wrapS = bump.wrapT = THREE.RepeatWrapping; bump.repeat.set(3, 1.6);
  const colC = noiseCanvas(512, 4, 236, 14); const cg = colC.getContext('2d'); cg.globalCompositeOperation = 'multiply'; cg.fillStyle = '#efe4cf'; cg.fillRect(0, 0, 512, 512);
  const col = tex(colC); col.wrapS = col.wrapT = THREE.RepeatWrapping; col.repeat.set(1.5, .8);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(5, 2.4), new THREE.MeshStandardMaterial({ map: col, bumpMap: bump, bumpScale: 1.2, roughness: .96 }));
  wall.position.set(0, 1.2, WALLZ); wall.receiveShadow = true; scene.add(wall);
  // table: streaky limewashed grain along x
  const tc = canvas(1024), tg = tc.getContext('2d'); tg.fillStyle = '#e6dac2'; tg.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 900; i++) { const y = rnd() * 1024, l = 120 + rnd() * 700, x = rnd() * 1024; tg.strokeStyle = `rgba(${120 + rnd() * 40},${100 + rnd() * 30},${70 + rnd() * 20},${.03 + rnd() * .06})`; tg.lineWidth = .6 + rnd() * 2.2; tg.beginPath(); tg.moveTo(x, y); tg.bezierCurveTo(x + l * .3, y + (rnd() - .5) * 6, x + l * .6, y + (rnd() - .5) * 6, x + l, y + (rnd() - .5) * 4); tg.stroke(); }
  for (let i = 0; i < 9; i++) { const y = i * 114 + 4; tg.fillStyle = 'rgba(90,72,50,.16)'; tg.fillRect(0, y, 1024, 1.5); }   // board seams
  const tt = tex(tc); tt.wrapS = tt.wrapT = THREE.RepeatWrapping; tt.repeat.set(2.2, 2.2);
  const tb = tex(noiseCanvas(256, 5, 128, 60, 1, 6), false); tb.wrapS = tb.wrapT = THREE.RepeatWrapping; tb.repeat.set(4, 4);
  const table = new THREE.Mesh(new THREE.PlaneGeometry(5, 3), new THREE.MeshStandardMaterial({ map: tt, bumpMap: tb, bumpScale: .5, roughness: .82 }));
  table.rotation.x = -Math.PI / 2; table.position.set(0, 0, WALLZ + 1.5); table.receiveShadow = true; scene.add(table);
}

// ------------------------------------------------------------------ the mushaf: dark cloth binding, gold tooling, spine on the right
const BW = .2, BL = .27, TH = .034, CT = .0032, XS = BW / 2;
const cloth = new THREE.MeshStandardMaterial({ color: '#1a2130', roughness: .8 });
const coverMat = (() => {
  const s = COVER.width, rm = canvas(s, COVER.height), g = rm.getContext('2d');
  g.fillStyle = 'rgb(0,215,0)'; g.fillRect(0, 0, s, COVER.height);
  const gd = canvas(s, COVER.height), gg = gd.getContext('2d'); gg.drawImage(GOLD, 0, 0); gg.globalCompositeOperation = 'source-in'; gg.fillStyle = 'rgb(0,85,255)'; gg.fillRect(0, 0, s, COVER.height);
  g.drawImage(gd, 0, 0);
  const bc = canvas(s, COVER.height), bg = bc.getContext('2d'); bg.fillStyle = '#fff'; bg.fillRect(0, 0, s, COVER.height); bg.filter = 'blur(2px)'; bg.globalCompositeOperation = 'difference'; bg.drawImage(GOLD, 0, 0);
  const R = tex(rm, false);
  return new THREE.MeshStandardMaterial({ map: tex(COVER), roughnessMap: R, metalnessMap: R, metalness: 1, roughness: 1, bumpMap: tex(bc, false), bumpScale: 1.6, envMapIntensity: 2.2 });
})();
const insideMat = (() => {
  const c = canvas(512, 692), g = c.getContext('2d'); g.fillStyle = '#151b27'; g.fillRect(0, 0, 512, 692);
  g.fillStyle = '#e8dcc2'; g.fillRect(22, 22, 468, 648); g.strokeStyle = 'rgba(150,110,50,.5)'; g.lineWidth = 2; g.strokeRect(36, 36, 440, 620);
  return new THREE.MeshStandardMaterial({ map: tex(c), roughness: .9 });
})();
const edgeMat = (() => {
  const c = canvas(64, 256), g = c.getContext('2d'); g.fillStyle = '#efe5cf'; g.fillRect(0, 0, 64, 256);
  for (let y = 0; y < 256; y += 2) { g.fillStyle = `rgba(120,95,60,${.05 + rnd() * .12})`; g.fillRect(0, y, 64, 1); }
  const t = tex(c); return new THREE.MeshStandardMaterial({ map: t, roughness: .95 });
})();
const paper = new THREE.MeshStandardMaterial({ color: '#f2e9d6', roughness: .92 });
const book = new THREE.Group(); book.rotation.y = .1; scene.add(book);
const shadowAll = m => { m.castShadow = m.receiveShadow = true; return m; };
const back = shadowAll(new THREE.Mesh(new THREE.BoxGeometry(BW, CT, BL), cloth)); back.position.y = CT / 2; book.add(back);
const block = shadowAll(new THREE.Mesh(new THREE.BoxGeometry(BW - .007, TH - 2 * CT, BL - .008), [paper, edgeMat, paper, paper, edgeMat, edgeMat]));
block.position.set(-.002, TH / 2, 0); book.add(block);
const spine = shadowAll(new THREE.Mesh(new THREE.CylinderGeometry(TH / 2, TH / 2, BL, 20), cloth)); spine.rotation.x = Math.PI / 2; spine.position.set(XS - TH * .22, TH / 2, 0); spine.scale.set(.55, 1, 1); book.add(spine);
const coverPivot = new THREE.Group(); book.add(coverPivot);
const cover = shadowAll(new THREE.Mesh(new THREE.BoxGeometry(BW, CT, BL), [cloth, cloth, coverMat, insideMat, cloth, cloth])); cover.position.x = -BW / 2; coverPivot.add(cover);
// the blank leaf: a bending sheet hinged at the spine
const LN = 40, LL = BW - .009;
const leafGeo = new THREE.PlaneGeometry(1, BL - .01, LN, 2);
const leaf = shadowAll(new THREE.Mesh(leafGeo, new THREE.MeshStandardMaterial({ color: '#f4ecdb', roughness: .9, side: THREE.DoubleSide, shadowSide: THREE.DoubleSide })));
book.add(leaf);
function bendLeaf(p, lift) {
  const P = leafGeo.attributes.position, yb = TH - CT + .0006, th = Math.PI * eio(p), curl = 1.15 * Math.sin(Math.PI * p);
  const land = ss(seg(p, .72, 1)), drop = Math.asin(clamp((yb - CT - .0012) / (LL * .22), 0, 1));
  const pts = [[XS - .003, yb]];
  for (let i = 1; i <= LN; i++) {
    const u = (i - .5) / LN, a = th - curl * u + land * (u < .22 ? drop : 0) + lift * Math.pow(u, 3);
    const [x, y] = pts[i - 1]; pts.push([x - Math.cos(a) * LL / LN, y + Math.sin(a) * LL / LN]);
  }
  for (let k = 0; k < P.count; k++) { const i = k % (LN + 1), z = leafGeo.userData.z[k]; P.setXYZ(k, pts[i][0], pts[i][1], z); }
  P.needsUpdate = true; leafGeo.computeVertexNormals();
}
leafGeo.userData.z = Array.from({ length: leafGeo.attributes.position.count }, (_, k) => -leafGeo.attributes.position.getY(k));
function setBook(t) {
  const k = eio(seg(t, T.open0, T.open1));
  coverPivot.rotation.z = -Math.PI * k;
  coverPivot.position.set(XS, lerp(TH - CT / 2, CT / 2 + .0004, ss(seg(k, .55, 1))), 0);
  const p = seg(t, T.leaf0, T.leaf1);
  leaf.visible = k > .02;
  const lift = .25 * ss(seg(t, T.open1, T.leaf0)) * (1 - p) * (.5 + .5 * Math.sin(t * 3.1)) + .05 * breeze(t) * (1 - p);
  bendLeaf(p, Math.max(0, lift));
}

// ------------------------------------------------------------------ the morning light: a window (two panes, a mullion) with a tree outside
const SUN = new THREE.Vector3(-2.3, 1.45, 1.25);
const GOBO = canvas(512), goboTex = tex(GOBO);
const key = new THREE.SpotLight('#ffe6bf', 6.5, 0, .2, .05, 0);
key.position.copy(SUN); key.map = goboTex; key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -.0003; key.shadow.normalBias = .0015; key.shadow.radius = 3;
key.shadow.camera.near = 1; key.shadow.camera.far = 6; scene.add(key, key.target);
const LEAVES = Array.from({ length: 70 }, () => ({ x: rnd(), y: rnd() * .55, r: 8 + rnd() * 22, ph: rnd() * TAU, s: .5 + rnd() }));
function drawGobo(t) {
  const g = GOBO.getContext('2d'), n = 512; g.fillStyle = '#000'; g.fillRect(0, 0, n, n);
  g.save(); g.filter = 'blur(5px)';
  const x0 = 70, y0 = 70, w = 372, h = 372, m = 14;
  g.fillStyle = '#fff'; g.fillRect(x0, y0, w, h);
  g.fillStyle = '#000'; g.fillRect(x0 + w / 2 - m / 2, y0, m, h); g.fillRect(x0, y0 + h * .38, w, m * .8);
  // a bough outside the window, moving in the breeze
  const b = breeze(t);
  for (const L of LEAVES) { const sx = Math.sin(t * .7 * L.s + L.ph) * 6 + b * 10 * (1 - L.y); g.fillStyle = `rgba(0,0,0,${.55})`; g.beginPath(); g.ellipse(x0 + L.x * w + sx, y0 + L.y * h * .7 + Math.cos(t * .9 + L.ph) * 3, L.r, L.r * .6, L.ph + b * .2, 0, TAU); g.fill(); }
  g.restore();
  // cloud shade: the whole window dims softly now and then
  const cl = .82 + .18 * vnoise(t * .22 + 3);
  g.fillStyle = `rgba(0,0,0,${1 - cl})`; g.fillRect(0, 0, n, n);
  goboTex.needsUpdate = true;
}
const hemi = new THREE.HemisphereLight('#f6ecd9', '#b9a689', .55); scene.add(hemi);
const bounce = new THREE.PointLight('#ffe2b8', .25, 0, 0); bounce.position.set(.4, .25, .4); scene.add(bounce);

// the shaft: a faint additive prism from the window to the table
const shaftMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  uniforms: { amt: { value: .05 }, t: { value: 0 } },
  vertexShader: `varying vec3 vN, vV; varying float vA; void main(){ vec4 w = modelMatrix*vec4(position,1.); vN = normalize(mat3(modelMatrix)*normal); vV = normalize(cameraPosition - w.xyz); vA = uv.y; gl_Position = projectionMatrix*viewMatrix*w; }`,
  fragmentShader: `varying vec3 vN, vV; varying float vA; uniform float amt, t; void main(){ float f = pow(abs(dot(vN, vV)), 1.6); float a = amt * f * smoothstep(0., .5, 1.-vA) * smoothstep(0., .12, vA); gl_FragColor = vec4(vec3(1., .9, .72)*a, 1.); }`,
});
const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.055, .5, 1, 4, 1, true), shaftMat); scene.add(shaft);

// ------------------------------------------------------------------ the projector: the wall becomes a camera obscura
const PROJ = canvas(1024), projTex = tex(PROJ);
const proj = new THREE.SpotLight('#fff0d8', 0, 0, .22, 0, 0);
proj.position.set(.75, .62, 1.7); proj.target.position.set(.16, .66, WALLZ); proj.map = projTex; proj.castShadow = true; proj.shadow.mapSize.set(1024, 1024); proj.shadow.bias = -.0004;
scene.add(proj, proj.target);

const SX = 112, SY = 232, SW = 800, SH = 500;   // the picture inside the projector frame
function skyGrad(g, c0, c1, c2) { const s = g.createLinearGradient(0, SY, 0, SY + SH); s.addColorStop(0, c0); s.addColorStop(.55, c1); s.addColorStop(1, c2); g.fillStyle = s; g.fillRect(SX, SY, SW, SH); }
function ridge(g, y, A, f, ph, col, t, drift = 0) {
  g.beginPath(); g.moveTo(SX, SY + SH);
  for (let x = 0; x <= SW; x += 8) { const u = x + drift; g.lineTo(SX + x, SY + y + A * Math.sin(u * f + ph) + A * .4 * Math.sin(u * f * 2.7 + ph * 1.7)); }
  g.lineTo(SX + SW, SY + SH); g.closePath(); g.fillStyle = col; g.fill();
}
function camel(g, x, y, s, ph, rider) {           // a walking silhouette, side on, facing right
  g.save(); g.translate(x, y); g.scale(s, s); g.beginPath();
  g.ellipse(0, -20, 15, 7, 0, 0, TAU); g.ellipse(-2, -27, 7, 6, 0, 0, TAU);
  g.moveTo(11, -22); g.quadraticCurveTo(20, -26, 20, -36); g.lineTo(24, -37); g.lineTo(26, -34); g.lineTo(22, -33); g.quadraticCurveTo(22, -24, 13, -17); g.fill();
  for (const [lx, o] of [[-10, 0], [-7, Math.PI], [8, Math.PI], [11, 0]]) { const sw = Math.sin(ph + o) * 4; g.fillRect(lx + sw * .4, -15, 2.2, 15); g.fillRect(lx + sw, -2, 2.4, 2); }
  if (rider) { g.beginPath(); g.ellipse(-2, -38, 3.2, 6, .1, 0, TAU); g.arc(-1.5, -46, 2.6, 0, TAU); g.fill(); }
  g.fill(); g.restore();
}
function walker(g, x, y, s, ph) { g.save(); g.translate(x, y); g.scale(s, s); g.beginPath(); g.ellipse(0, -16, 3.4, 9, 0, 0, TAU); g.arc(0, -28, 2.8, 0, TAU); g.fill(); g.fillRect(-1.6 + Math.sin(ph) * 2, -8, 1.8, 8); g.fillRect(.2 - Math.sin(ph) * 2, -8, 1.8, 8); g.restore(); }
function desert(g, t) {
  skyGrad(g, '#f3dcae', '#fbe9c7', '#f6d9a2');
  const sun = g.createRadialGradient(SX + 600, SY + 150, 0, SX + 600, SY + 150, 220); sun.addColorStop(0, 'rgba(255,250,232,1)'); sun.addColorStop(.12, 'rgba(255,240,205,.9)'); sun.addColorStop(1, 'rgba(255,230,180,0)');
  g.fillStyle = sun; g.fillRect(SX, SY, SW, SH);
  ridge(g, 250, 14, .006, 1, '#e7c38b', t, t * 2); ridge(g, 300, 22, .0045, 2.2, '#cf9a5c', t, t * 4);
  // the caravan along the near crest
  const cy = 365; g.fillStyle = '#5a3a20';
  for (let i = 0; i < 6; i++) { const x = ((t - T.slit0) * 16 + 40 - i * 70) % (SW + 160) - 60; if (x < -40) continue; const yy = cy + 26 * Math.sin((x + t * 6) * .0042 + 3.1) - 4; camel(g, SX + x, SY + yy, 1.35, t * 5 + i, i % 2 === 0); }
  { const x = (t - T.slit0) * 16 + 95; walker(g, SX + x, SY + cy + 26 * Math.sin((x + t * 6) * .0042 + 3.1) - 4, 1.35, t * 6); }
  ridge(g, 380, 26, .0042, 3.1, '#a8703c', t, t * 6);
  ridge(g, 440, 20, .006, .4, '#7a4b26', t, t * 9);
  // wind lifting sand off the crests
  for (let i = 0; i < 40; i++) { const x = ((i * 97 + t * 60) % SW), y = 300 + (i * 53) % 150; g.fillStyle = `rgba(255,236,200,${.12 * hash(i)})`; g.fillRect(SX + x, SY + y, 30 + 40 * hash(i + 9), 1.5); }
}
function town(g, t) {
  skyGrad(g, '#c9a27a', '#efc58c', '#f6dcae');
  ridge(g, 210, 40, .009, 2, '#a98466', t); ridge(g, 245, 26, .013, 4, '#977259', t);
  // smoke from two hearths
  for (const [sx, sy, k] of [[310, 300, 0], [560, 320, 3]]) for (let i = 0; i < 16; i++) { const a = ((t * .35 + i / 16 + k * .17) % 1), r = 6 + a * 34; g.fillStyle = `rgba(250,236,214,${.22 * (1 - a)})`; g.beginPath(); g.arc(SX + sx + a * 60 + Math.sin(t + i) * 6, SY + sy - a * 150, r, 0, TAU); g.fill(); }
  // flat-roofed houses terraced up the slope: one dark mass at dusk, lighter with distance, a few lamps
  for (let row = 0; row < 4; row++) {
    const v = 120 - row * 28; g.fillStyle = `rgb(${v + 22},${v + 4},${v - 14})`;
    g.beginPath(); g.moveTo(SX, SY + SH);
    for (let i = 0; i < 26; i++) { const x = i * 34 + row * 13 - 20 + 8 * hash(i + row * 31), h = 22 + 34 * hash(i * 3 + row * 11) + (hash(i * 5 + row) > .9 ? 30 : 0), y = 286 + row * 46 - h, w = 26 + 14 * hash(i * 7 + row);
      g.lineTo(SX + x, SY + y); g.lineTo(SX + x + 3, SY + y - 4); g.lineTo(SX + x + w - 3, SY + y - 4); g.lineTo(SX + x + w, SY + y); g.lineTo(SX + x + w, SY + y + 10); }
    g.lineTo(SX + SW, SY + SH); g.closePath(); g.fill();
    for (let i = 0; i < 26; i++) if (hash(i * 13 + row * 7) > .62) { const x = i * 34 + row * 13 - 6 + 8 * hash(i + row * 31), y = 300 + row * 46 - 14 * hash(i + 2), on = .55 + .45 * Math.sin(t * 1.7 + i * 3 + row); g.fillStyle = `rgba(255,186,96,${on * (.5 + row * .15)})`; g.fillRect(SX + x, SY + y, 3 + row * .6, 5 + row); }
  }
  // palms in the breeze
  for (const [px, py, s] of [[90, 470, 1], [690, 480, 1.2], [760, 470, .9]]) {
    g.strokeStyle = '#5f4129'; g.lineWidth = 5 * s; g.beginPath(); g.moveTo(SX + px, SY + py); g.quadraticCurveTo(SX + px + 10 * s, SY + py - 80 * s, SX + px + 4 * s, SY + py - 150 * s); g.stroke();
    for (let f = 0; f < 8; f++) { const a = f / 8 * TAU + Math.sin(t * 1.3 + f) * .12, L = 55 * s; g.lineWidth = 3 * s; g.beginPath(); g.moveTo(SX + px + 4 * s, SY + py - 150 * s); g.quadraticCurveTo(SX + px + 4 * s + Math.cos(a) * L * .6, SY + py - 150 * s + Math.sin(a) * L * .3 - 18 * s, SX + px + 4 * s + Math.cos(a) * L, SY + py - 150 * s + Math.abs(Math.sin(a)) * L * .5 + 10 * s); g.stroke(); }
  }
  // a flock crossing
  g.strokeStyle = '#4a3322'; g.lineWidth = 2;
  for (let i = 0; i < 7; i++) { const x = (t - T.city) * 55 - i * 26 + 30 * hash(i), y = 120 + 30 * hash(i + 3) + 8 * Math.sin(t * 2 + i), f = Math.sin(t * 9 + i * 2) * 4; if (x < 0 || x > SW) continue; g.beginPath(); g.moveTo(SX + x - 8, SY + y - f); g.quadraticCurveTo(SX + x - 3, SY + y - 4, SX + x, SY + y); g.quadraticCurveTo(SX + x + 3, SY + y - 4, SX + x + 8, SY + y - f); g.stroke(); }
}
function sea(g, t) {
  skyGrad(g, '#e9d3b0', '#f7e6c8', '#f3dcb4');
  const hz = 250;
  const sun = g.createRadialGradient(SX + 420, SY + hz - 60, 0, SX + 420, SY + hz - 60, 200); sun.addColorStop(0, 'rgba(255,250,235,1)'); sun.addColorStop(.1, 'rgba(255,240,210,.85)'); sun.addColorStop(1, 'rgba(255,230,190,0)');
  g.fillStyle = sun; g.fillRect(SX, SY, SW, hz);
  const sg = g.createLinearGradient(0, SY + hz, 0, SY + SH); sg.addColorStop(0, '#c9b08e'); sg.addColorStop(1, '#7f6a52'); g.fillStyle = sg; g.fillRect(SX, SY + hz, SW, SH - hz);
  // glitter path under the sun and moving swell lines
  for (let i = 0; i < 220; i++) { const yy = hz + 4 + Math.pow(hash(i), 1.6) * 240, sp = (yy - hz) * .9 + 10, x = 420 + (hash(i + 7) - .5) * sp, on = Math.max(0, Math.sin(t * 4 + i * 1.7)); g.fillStyle = `rgba(255,246,220,${.85 * on})`; g.fillRect(SX + x, SY + yy, 3 + (yy - hz) * .04, 1.4); }
  for (let i = 0; i < 18; i++) { const yy = hz + 8 + i * i * .8; g.strokeStyle = `rgba(60,44,30,${.12 + i * .008})`; g.lineWidth = 1 + i * .12; g.beginPath(); for (let x = 0; x <= SW; x += 10) g.lineTo(SX + x, SY + yy + 2 * Math.sin(x * .03 - t * 1.2 + i)); g.stroke(); }
  // a dhow under a lateen sail, crossing slowly
  const bx = 120 + (t - T.sea) * 14, by = hz + 26 + 2 * Math.sin(t * 1.4), rk = .04 * Math.sin(t * 1.1);
  g.save(); g.translate(SX + bx, SY + by); g.rotate(rk); g.fillStyle = '#3c2a1c';
  g.beginPath(); g.moveTo(-50, -6); g.lineTo(52, -10); g.quadraticCurveTo(40, 8, 30, 8); g.lineTo(-38, 8); g.closePath(); g.fill();
  g.fillRect(-2, -78, 3, 72);
  g.beginPath(); g.moveTo(-46, -24); g.lineTo(40, -92); g.quadraticCurveTo(26, -40, 4, -10); g.closePath(); g.fillStyle = 'rgba(70,52,36,.92)'; g.fill();
  g.restore();
  g.strokeStyle = '#4a3322'; g.lineWidth = 2;
  for (let i = 0; i < 2; i++) { const x = 600 - (t - T.sea) * 22 + i * 30, y = 120 + i * 14 + 6 * Math.sin(t * .8 + i), f = Math.sin(t * 6 + i) * 5; g.beginPath(); g.moveTo(SX + x - 10, SY + y - f); g.quadraticCurveTo(SX + x - 4, SY + y - 5, SX + x, SY + y); g.quadraticCurveTo(SX + x + 4, SY + y - 5, SX + x + 10, SY + y - f); g.stroke(); }
}
const LAYER = canvas(1024);
function drawProj(t) {
  const g = PROJ.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, 1024, 1024);
  const open = eio(seg(t, T.slit0, T.slit1));
  if (open <= 0) { projTex.needsUpdate = true; return 0; }
  const l = LAYER.getContext('2d'); l.clearRect(0, 0, 1024, 1024);
  const scenes = [[desert, T.slit0 - 1, T.city + 1], [town, T.city - 1, T.sea + 1], [sea, T.sea - 1, DUR + 1]];
  for (const [fn, a, b] of scenes) {
    const k = Math.min(seg(t, a, a + 2), 1 - seg(t, b - 2, b)); if (k <= 0) continue;
    const c = canvas(1024), cg = c.getContext('2d'); cg.beginPath(); cg.rect(SX, SY, SW, SH); cg.clip(); fn(cg, t); l.globalAlpha = k; l.drawImage(c, 0, 0); l.globalAlpha = 1;
  }
  // the slit: a line of light that opens into the picture, soft-edged like a lens
  const cx = SX + SW * .5, half = lerp(2, SW / 2 + 40, open);
  g.save(); g.filter = 'blur(2.5px)'; g.beginPath(); g.rect(cx - half, SY - 10, half * 2, SH + 20); g.clip(); g.drawImage(LAYER, 0, 0); g.restore();
  const v = g.createRadialGradient(512, SY + SH / 2, 120, 512, SY + SH / 2, 560); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.75)'); g.fillStyle = v; g.fillRect(0, 0, 1024, 1024);
  projTex.needsUpdate = true; return open;
}

// ------------------------------------------------------------------ dust: motes drifting through the light
const ND = 900, dPos = new Float32Array(ND * 3), dA = new Float32Array(ND), DUST = [];
for (let i = 0; i < ND; i++) DUST.push({ x: -1.1 + rnd() * 1.7, y: .02 + rnd() * .9, z: -.5 + rnd() * 1.3, s: rnd(), ph: rnd() * TAU });
const dGeo = new THREE.BufferGeometry(); dGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3)); dGeo.setAttribute('a', new THREE.BufferAttribute(dA, 1));
const dMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { sz: { value: 1 }, k: { value: 1 } },
  vertexShader: `attribute float a; varying float vA; uniform float sz; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vA = a; gl_PointSize = sz * 3.2 / -mv.z; gl_Position = projectionMatrix*mv; }`,
  fragmentShader: `varying float vA; uniform float k; void main(){ float d = length(gl_PointCoord-.5)*2.; float a = k * vA * smoothstep(1., 0., d); gl_FragColor = vec4(vec3(1., .93, .78)*a, 1.); }`,
});
scene.add(new THREE.Points(dGeo, dMat));
const _ax = new THREE.Vector3(), _p = new THREE.Vector3();
function setDust(t, tgt, rad) {
  _ax.copy(tgt).sub(SUN); const L = _ax.length(); _ax.normalize();
  for (let i = 0; i < ND; i++) {
    const d = DUST[i], b = breeze(t);
    const x = d.x + .04 * Math.sin(t * .13 * (1 + d.s) + d.ph) + .02 * b * (d.y), y = d.y + .03 * Math.sin(t * .09 + d.ph * 2) - ((t * .004 * (1 + d.s)) % .9), z = d.z + .03 * Math.cos(t * .11 + d.ph);
    const yy = ((y % .92) + .92) % .92 + .02;
    dPos[i * 3] = x; dPos[i * 3 + 1] = yy; dPos[i * 3 + 2] = z;
    _p.set(x, yy, z).sub(SUN); const along = _p.dot(_ax), perp = Math.sqrt(Math.max(0, _p.lengthSq() - along * along)), r = rad * along / L;
    const inBeam = 1 - ss(seg(perp, r * .55, r * 1.05));
    dA[i] = .7 * inBeam * (.35 + .65 * Math.pow(.5 + .5 * Math.sin(t * (1.5 + d.s * 3) + d.ph * 5), 3)) * (.4 + .6 * d.s);
  }
  dGeo.attributes.position.needsUpdate = true; dGeo.attributes.a.needsUpdate = true;
}

// ------------------------------------------------------------------ camera: a slow motion-control move with focus pulls
const CAM = track([
  [0, [-.62, .6, 1.3, -.08, .02, -.08]],
  [5, [-.5, .5, 1.12, -.04, .02, -.06]],
  [10.5, [-.2, .25, .52, .0, .025, -.01]],
  [13, [-.12, .23, .45, .01, .03, 0]],
  [16.8, [.02, .3, .5, .07, .03, -.02]],
  [20.6, [.08, .31, .55, .09, .07, -.12]],
  [24.8, [.1, .4, 1.12, .15, .6, WALLZ]],
  [34, [.14, .44, 1.0, .16, .64, WALLZ]],
  [45, [.16, .46, .9, .16, .66, WALLZ]],
]);
const BOOKC = new THREE.Vector3(.02, .03, 0), WALLC = new THREE.Vector3(.16, .65, WALLZ);
function setCamera(t) {
  const c = CAM(t), hx = .004 * (vnoise(t * .5) - .5) + .002 * (vnoise(t * 1.3 + 7) - .5), hy = .003 * (vnoise(t * .45 + 3) - .5);
  camera.position.set(c[0] + hx, c[1] + hy, c[2]); camera.lookAt(c[3] + hx * .5, c[4] + hy * .5, c[5]);
  // focus: a near mote in the light at the start pulls to the book, later the book hands focus to the wall
  const dBook = camera.position.distanceTo(BOOKC), dWall = camera.position.distanceTo(WALLC);
  let f = lerp(.32, dBook, eio(seg(t, 2.2, 6.2)));
  f = lerp(f, dWall, eio(seg(t, 21.2, 24.6)));
  post.dof.focus = f; post.dof.aper = t < 21 ? 5.5 : 4; post.dof.maxCoc = 14;
}

// ------------------------------------------------------------------ light over time
const _tg = new THREE.Vector3();
function setLight(t) {
  // the patch of window light creeps across the table and settles over the book, then keeps drifting with the sun
  const k = eio(seg(t, T.beam0, T.beam1));
  _tg.set(lerp(-.95, -.02, k) + .05 * seg(t, T.beam1, DUR), 0, lerp(.2, -.02, k));
  key.target.position.copy(_tg); key.target.updateMatrixWorld();
  drawGobo(t);
  key.intensity = 6.5 * lerp(.92, 1, ss(seg(t, 0, 3)));
  // shaft prism from the window to the patch
  const mid = _tg.clone().add(SUN).multiplyScalar(.5), len = SUN.distanceTo(_tg);
  shaft.position.copy(mid); shaft.scale.set(1, len, 1); shaft.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), SUN.clone().sub(_tg).normalize()); shaft.rotateY(Math.PI / 4);
  shaftMat.uniforms.amt.value = .045 * (1 - .5 * seg(t, T.slit0, T.slit1));
  setDust(t, _tg, Math.tan(key.angle) * len * .8);
  const open = drawProj(t);
  proj.intensity = 7 * open * (1 - seg(t, T.out0, DUR));
  const dim = ss(seg(t, T.leaf1 - .5, T.slit1)); scene.environmentIntensity = .16 - .1 * dim; dMat.uniforms.k.value = 1 - .7 * dim; bounce.intensity = .25 - .22 * dim;
  hemi.intensity = .55 - .37 * ss(seg(t, T.leaf1 - .5, T.slit1));          // the room settles darker so the picture reads
  key.intensity *= 1 - .8 * ss(seg(t, T.leaf1 - .5, T.slit1));          // a cloud takes the sun as the picture opens
}

// ------------------------------------------------------------------ 2D overlay: film grain and the final fade
const OV = document.getElementById('ov'), og = OV.getContext('2d');
const GR = (() => { const c = canvas(512), g = c.getContext('2d'), d = g.createImageData(512, 512); for (let i = 0; i < d.data.length; i += 4) { const v = 128 + (rnd() - .5) * 90; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } g.putImageData(d, 0, 0); return c; })();
function drawOverlay(t) {
  og.clearRect(0, 0, W, H);
  og.globalCompositeOperation = 'overlay'; og.globalAlpha = .1;
  const ox = Math.floor(hash(Math.floor(t * 24)) * 512), oy = Math.floor(hash(Math.floor(t * 24) + 9) * 512);
  for (let y = -oy; y < H; y += 512) for (let x = -ox; x < W; x += 512) og.drawImage(GR, x, y);
  og.globalAlpha = 1; og.globalCompositeOperation = 'source-over';
  const f = Math.max(1 - seg(t, 0, 1.4), seg(t, DUR - 1.2, DUR));
  if (f > 0) { og.fillStyle = `rgba(8,6,4,${f})`; og.fillRect(0, 0, W, H); }
}

// ------------------------------------------------------------------ page contract
window.DUR = DUR;
window.render = t => {
  setBook(t); setLight(t); setCamera(t);
  renderer.shadowMap.needsUpdate = true;
  post.composer.render();
  drawOverlay(t);
};
window.TEXTS = t => { window.render(t); return []; };
window.EV = [{ t: T.open0, type: 'cover' }, { t: T.leaf0, type: 'leaf' }, { t: T.slit0, type: 'projector' }, { t: T.city, type: 'town' }, { t: T.sea, type: 'sea' }];
window.render(0);
window.READY = true;
