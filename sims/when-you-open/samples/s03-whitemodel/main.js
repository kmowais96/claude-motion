// SCENE 03 "Revelation in the Midst of Life" in Projection on White Model.
// A white study model of an old Arabian town on a dark plinth. Life and time arrive only as projected light:
// people as small featureless light shapes, day and night, a real low sun at dawn, a dry season, a caravan,
// market stalls switching on. A thread of light along the plate's front rim marks the years of the mission.
// render(t) is a pure function of t (seeded hashes only).
import * as THREE from 'three';
import { makePost } from './lib/post.js';
import { clamp, lerp, seg, ss, eio, eo, hash, track, env } from './lib/lib.js';
import { estimate } from './timing.js';
import { drawCaption } from './caption.js';

const W = 1920, H = 1080, DUR = 26.5;
const QS = new URLSearchParams(location.search);

// ------------------------------------------------------------------ narration (script, scene 03, lines 1–8)
const LINES = ['People were asking questions.', 'They were arguing.', 'Some were searching for the truth.', 'Others were resisting it.',
  'There was fear.', 'There was hope.', 'There were moments of hardship...', 'And moments of victory.'];
const SUBS = estimate(LINES, 1.6);

// ------------------------------------------------------------------ beats
const T = {
  lightsOut: .9, lamp: 1.2, washEnd: 2.8,
  night0: 12.4, night1: 13.1, sun0: 14.7, sun1: 17.4, day2: 16.8,
  dust0: 17.2, dust1: 20.7, stall0: 21.0, stallDT: .13,
  y0: 1.6, y1: 24.2, lightsUp: 24.9,
};

// ------------------------------------------------------------------ the model (all white; 1 unit = 1 model metre, scale 1:300)
const PW = 1.4, PD = .9, RIM = .05, PT = .022;
const M0 = [0.02, 0.04], WELL = [-0.26, 0.12];
const ROADW = [[-0.75, 0.14], [-0.45, 0.13], WELL, [-0.13, 0.08], M0];
const ROADS = [[0.08, 0.47], [0.065, 0.25], M0];
const ROADE = [M0, [0.2, 0.0], [0.36, -0.02]];
const segDist = (p, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], k = clamp(((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / (dx * dx + dz * dz)); return Math.hypot(p[0] - a[0] - dx * k, p[1] - a[1] - dz * k); };
const polyDist = (p, L) => Math.min(...L.slice(1).map((b, i) => segDist(p, L[i], b)));

const pos = [], nor = [], dat = [];
const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpE = new THREE.Euler();
function add(geo, m, d) {
  const g = geo.index ? geo.toNonIndexed() : geo; g.applyMatrix4(m);
  const P = g.attributes.position.array, N = g.attributes.normal.array;
  for (let i = 0; i < P.length; i += 3) { pos.push(P[i], P[i + 1], P[i + 2]); nor.push(N[i], N[i + 1], N[i + 2]); dat.push(...d); }
}
const mat = (x, y, z, rx = 0, ry = 0, rz = 0) => tmpM.compose(new THREE.Vector3(x, y, z), tmpQ.setFromEuler(tmpE.set(rx, ry, rz, 'YXZ')), new THREE.Vector3(1, 1, 1)).clone();
// kinds in aData.x: 0 house, 1 stall, 2 palm, 3 well, 4 hill
let hi = 0;
for (let gx = -0.62; gx <= 0.62; gx += .058) for (let gz = -0.22; gz <= 0.4; gz += .056) {
  hi++;
  const x = gx + (hash(hi * 3.1) - .5) * .022, z = gz + (hash(hi * 5.7) - .5) * .02, p = [x, z];
  if (((x + .02) / .64) ** 2 + ((z - .08) / .34) ** 2 > 1) continue;
  if (Math.hypot(x - M0[0], z - M0[1]) < .145 || Math.hypot(x - WELL[0], z - WELL[1]) < .085) continue;
  if (polyDist(p, ROADW) < .036 || polyDist(p, ROADS) < .032 || polyDist(p, ROADE) < .03) continue;
  if (x > .31 && z < .16) continue;                      // the palm garden
  const w = .03 + hash(hi * 1.3) * .022, d = .03 + hash(hi * 2.9) * .02, h = .012 + hash(hi * 4.3) * .01, ry = (hash(hi * 7.7) - .5) * .35;
  const r = hash(hi * 9.1), D = [0, r, hi, 0];
  add(new THREE.BoxGeometry(w, h, d), mat(x, h / 2, z, 0, ry), D);
  if (hash(hi * 11.3) < .35) {                           // an upper room on some roofs
    const w2 = w * .45, d2 = d * .45, h2 = .009;
    add(new THREE.BoxGeometry(w2, h2, d2), mat(x + Math.cos(ry) * (w - w2) * .4, h + h2 / 2, z - Math.sin(ry) * (w - w2) * .4, 0, ry), D);
  }
  // a low parapet on the roof edge (flat roofs)
  const pw = .0012, ph = .0028;
  add(new THREE.BoxGeometry(w, ph, pw), mat(x + Math.sin(ry) * (d / 2 - pw / 2), h + ph / 2, z + Math.cos(ry) * (d / 2 - pw / 2), 0, ry), D);
  add(new THREE.BoxGeometry(w, ph, pw), mat(x - Math.sin(ry) * (d / 2 - pw / 2), h + ph / 2, z - Math.cos(ry) * (d / 2 - pw / 2), 0, ry), D);
}
// market stalls: a ring of low counters with awnings around the square
const NST = 12;
for (let i = 0; i < NST; i++) {
  const a = i / NST * Math.PI * 2 + .2, R = .102, x = M0[0] + Math.cos(a) * R, z = M0[1] + Math.sin(a) * R, ry = -a + Math.PI / 2;
  const order = [0, 6, 3, 9, 1, 7, 4, 10, 2, 8, 5, 11].indexOf(i);
  add(new THREE.BoxGeometry(.024, .008, .012), mat(x, .004, z, 0, ry), [1, hash(i), order, 0]);
  add(new THREE.BoxGeometry(.03, .0012, .02), mat(x, .0125, z, -.12, ry), [1, hash(i), order, 0]);
  for (const s of [-1, 1]) add(new THREE.BoxGeometry(.0014, .012, .0014), mat(x + Math.cos(ry) * .013 * s, .006, z - Math.sin(ry) * .013 * s, 0, ry), [1, hash(i), order, 0]);
}
// the well: a ring in its own square
add(new THREE.CylinderGeometry(.013, .013, .008, 28, 1, true), mat(WELL[0], .004, WELL[1]), [3, 0, 0, 0]);
add(new THREE.CylinderGeometry(.0105, .0105, .008, 28, 1, true), mat(WELL[0], .004, WELL[1]), [3, 0, 0, 0]);
add(new THREE.RingGeometry(.0105, .013, 28).rotateX(-Math.PI / 2), mat(WELL[0], .008, WELL[1]), [3, 0, 0, 0]);
// palms: a thin trunk and drooping fronds
function palm(x, z, k) {
  const h = .045 + hash(k * 2.3) * .02, lean = (hash(k * 3.3) - .5) * .15, ry = hash(k * 5.1) * 6.28;
  add(new THREE.CylinderGeometry(.0014, .0022, h, 6), mat(x, h / 2, z, lean, ry), [2, 0, 0, 0]);
  const tx = x + Math.sin(ry) * Math.sin(lean) * h, tz = z + Math.cos(ry) * Math.sin(lean) * h;
  for (let f = 0; f < 8; f++) {
    const a = f / 8 * 6.28 + hash(k + f) * .4, L = .022 + hash(k * 7 + f) * .006;
    add(new THREE.BoxGeometry(L, .0008, .0055).translate(L / 2, 0, 0), mat(tx, h, tz, 0, a, -.45 - hash(k * 9 + f) * .2), [2, 0, 0, 0]);
  }
}
let pk = 0;
for (let gx = .35; gx < .64; gx += .045) for (let gz = -.17; gz < .15; gz += .045) { pk++; palm(gx + (hash(pk * 1.9) - .5) * .02, gz + (hash(pk * 2.7) - .5) * .02, pk); }
palm(WELL[0] + .05, WELL[1] - .045, 99); palm(WELL[0] - .052, WELL[1] + .04, 98); palm(M0[0] + .16, M0[1] + .11, 97);
// hills behind the town
{
  const g = new THREE.PlaneGeometry(PW, .34, 140, 40).rotateX(-Math.PI / 2);
  const P = g.attributes.position;
  for (let i = 0; i < P.count; i++) {
    const x = P.getX(i), z = P.getZ(i) - PD / 2 + .17;
    const back = ss(seg(z, -.25, -.44));
    const h = back * (.04 + .045 * Math.exp(-((x + .35) ** 2) / .03) + .06 * Math.exp(-((x - .3) ** 2) / .05) + .02 * Math.sin(x * 9 + 1.3) * Math.sin(z * 14));
    P.setXYZ(i, x, Math.max(0, h), z);
  }
  g.computeVertexNormals();
  add(g, new THREE.Matrix4(), [4, 0, 0, 0]);
}

// ------------------------------------------------------------------ the studio (after the lemo-opuscar white-model engine)
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
const RS = QS.has('full') ? 1 : 2;   // software GL: the 3D layer renders at 960×540 and is scaled up; the 2D layer stays 1080p
renderer.setPixelRatio(1); renderer.setSize(W / RS, H / RS, false); renderer.domElement.style.width = W + 'px'; renderer.domElement.style.height = H + 'px';
renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap; renderer.shadowMap.autoUpdate = false;
document.getElementById('stage').appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, W / H, 0.05, 9);
const post = makePost(renderer, scene, camera, W / RS, H / RS, { ssaa: 1, ao: false });
post.bloom.strength = .3; post.bloom.radius = .55; post.bloom.threshold = .85;
post.vig.uniforms.amt.value = .42;
if (QS.has('nobloom')) post.bloom.enabled = false;
if (QS.has('nomsaa')) post.dof.rt.samples = 0;
{
  const c = document.createElement('canvas'); c.width = 512; c.height = 288;
  const g = c.getContext('2d'), gr = g.createRadialGradient(256, 150, 10, 256, 160, 320);
  gr.addColorStop(0, '#1b1e22'); gr.addColorStop(.5, '#0b0c0e'); gr.addColorStop(1, '#030304');
  g.fillStyle = gr; g.fillRect(0, 0, 512, 288);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; scene.background = tex;
}
// no environment map: Lambert surfaces take the hemisphere light instead

const col = h => new THREE.Color(h);
const PAL = { day: '#fff3e2', night: '#1c2c66', shade: '#1c2c66', dust: '#c98a45', amber: '#ffa13d', fig: '#fff0d8', line: '#ffd59a' };
const NF = QS.has('nofig') ? 1 : 64;
const U = {
  uProj: { value: 0 }, uNow: { value: 0 }, uWashR: { value: -1 }, uWashRim: { value: 0 },
  uDay: { value: 0 }, uNight: { value: 0 }, uDawn: { value: 0 }, uDust: { value: 0 }, uLamp: { value: 0 },
  uStallOn: { value: 0 }, uStallT0: { value: 99 }, uStallDT: { value: .1 }, uLine: { value: 0 }, uLineOn: { value: 0 },
  uNFig: { value: 0 }, uFig: { value: Array.from({ length: NF }, () => new THREE.Vector4()) }, uSunMask: { value: 1 },
  uProjPos: { value: new THREE.Vector3(.2, 2.4, 2.2) }, uPlate: { value: new THREE.Vector2(PW, PD) },
  cDay: { value: col(PAL.day) }, cNight: { value: col(PAL.night) }, cShade: { value: col(PAL.shade) }, cDust: { value: col(PAL.dust) },
  cAmber: { value: col(PAL.amber) }, cFig: { value: col(PAL.fig) }, cLine: { value: col(PAL.line) },
};
const HEAD = /* glsl */`
uniform float uProj, uNow, uWashR, uWashRim, uDay, uNight, uDawn, uDust, uLamp, uStallOn, uStallT0, uStallDT, uLine, uLineOn;
uniform vec4 uFig[${NF}]; uniform int uNFig;
uniform vec3 uProjPos; uniform vec2 uPlate;
uniform vec3 cDay, cNight, cShade, cDust, cAmber, cFig, cLine;
varying vec4 vData; varying vec3 vWP; varying vec3 vWN;
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p), u = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), u.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), u.x), u.y); }
// kind 0 model, 1 plate, 2 plinth
vec3 projLight(float kind){
  vec3 N = normalize(vWN);
  float dirK = .42 + .58 * max(dot(N, normalize(uProjPos - vWP)), 0.);
  vec2 q = abs(vWP.xz) - (uPlate * .5 + .06);
  float thr = 1. - smoothstep(0., .03, max(q.x, q.y));
  float r = length(vWP.xz - vec2(.02, .04)), s1 = r - uWashR;
  float wash = smoothstep(.08, -.08, s1);
  float rim = uWashRim * exp(-s1 * s1 / .004) * .5;
  float k = kind < .5 ? vData.x : -1.;
  vec3 c = cDay * uDay * .5 + cNight * uNight * .55 + cShade * uDawn * .42;
  float n = vn(vWP.xz * 7. + vec2(uNow * .32, uNow * .07)) * .6 + vn(vWP.xz * 19. - vec2(uNow * .5, 0.)) * .4;
  c += cDust * uDust * (.12 + .62 * n * n);
  c *= wash;
  // night: a few homes keep a lamp lit (warm light on their roofs)
  if (k > -.5 && k < .5 && vData.y < .09 && N.y > .5) c += cAmber * uLamp * (.45 + 3. * vData.y);
  // market stalls switch on one by one with a short flash
  if (k > .5 && k < 1.5 && uStallOn > .5) {
    float e = uNow - (uStallT0 + vData.z * uStallDT), a = smoothstep(0., .2, e), fl = e > 0. ? exp(-e / .16) : 0.;
    c = mix(c, cAmber * 1.25, a) + cAmber * fl * 1.4 + vec3(.5) * fl;
  }
  // people: small featureless light shapes at ground level
  float gy = 1. - smoothstep(.0, .009, vWP.y);
  if (gy > 0. && kind < 1.5) {
    float acc = 0.;
    for (int i = 0; i < ${NF}; i++) { if (i >= uNFig) break; vec4 f = uFig[i];
      vec2 d = vWP.xz - f.xy; float d2 = dot(d, d), rr = f.z * f.z;
      acc += f.w * (smoothstep(rr * 1.1, rr * .35, d2) * 1.2 + .3 * exp(-d2 / (rr * 5.))); }
    c += cFig * acc * gy * 3.2;
  }
  // the years of the mission: a thread of light along the plate's front rim, a tick for every year
  if (kind > .5 && kind < 1.5 && vWP.y > -.001) {
    float zl = uPlate.y * .5 + .026, dz = abs(vWP.z - zl);
    float x0 = -uPlate.x * .5 + .05, x1 = uPlate.x * .5 - .05, L = x1 - x0, u = (vWP.x - x0) / L;
    float inside = smoothstep(-.002, 0., u) * smoothstep(1.002, 1., u);
    float lit = smoothstep(uLine + .003, uLine - .003, u);
    float line = exp(-dz * dz / 1.3e-6) * inside;
    float yi = u * 22., fy = abs(fract(yi + .5) - .5) * L / 22.;
    float major = (abs(yi - 0.) < .5 || abs(yi - 12.) < .5 || abs(yi - 22.) < .5) ? 1. : 0.;
    float tick = exp(-fy * fy / 4e-7) * smoothstep(.0035 + major * .006, .0025 + major * .005, dz) * inside;
    float hd = length(vec2((u - uLine) * L, dz));
    c += cLine * uLineOn * ((line * (.1 + 1.5 * lit)) + tick * (.12 + 1.6 * lit) * (.6 + .4 * major) + exp(-hd * hd / 1.5e-5) * 1.8 * step(.0005, uLine) * inside);
  }
  return (c + vec3(1., .93, .82) * rim) * dirK * thr * uProj;
}`;
function projMaterial(kind, opts) {
  const { roughness, metalness, ...o2 } = opts;
  const m = new THREE.MeshLambertMaterial(o2);   // matte white; Lambert keeps a frame affordable on software GL
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>\nattribute vec4 aData; varying vec4 vData; varying vec3 vWP; varying vec3 vWN;`)
      .replace('#include <fog_vertex>', `#include <fog_vertex>\n vData = aData; vWP = (modelMatrix * vec4(transformed, 1.)).xyz; vWN = normalize(mat3(modelMatrix) * objectNormal);`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\n${HEAD}`)
      .replace('#include <opaque_fragment>', `outgoingLight += projLight(${kind}.0) * mix(diffuseColor.rgb, vec3(1.), .1) * 1.35;\n#include <opaque_fragment>`);
  };
  m.customProgramCacheKey = () => 'proj' + kind;
  return m;
}
const zero = g => { g.setAttribute('aData', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 4), 4)); return g; };
{
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aData', new THREE.Float32BufferAttribute(dat, 4));
  const town = new THREE.Mesh(g, projMaterial(0, { color: '#f3f3f1', roughness: .88, metalness: 0, side: THREE.DoubleSide }));
  town.castShadow = town.receiveShadow = true; scene.add(town);
  const plateTop = new THREE.Mesh(zero(new THREE.PlaneGeometry(PW + RIM * 2, PD + RIM * 2).rotateX(-Math.PI / 2)), projMaterial(1, { color: '#f3f3f1', roughness: .9 }));
  plateTop.receiveShadow = true; scene.add(plateTop);
  const plateBox = new THREE.Mesh(zero(new THREE.BoxGeometry(PW + RIM * 2, PT, PD + RIM * 2)), projMaterial(1, { color: '#e9e6e0', roughness: .9 }));
  plateBox.position.y = -PT / 2 - .0005; plateBox.receiveShadow = true; scene.add(plateBox);
  const plinth = new THREE.Mesh(zero(new THREE.BoxGeometry(PW + .34, .9, PD + .34)), projMaterial(2, { color: '#17181a', roughness: .5 }));
  plinth.position.y = -PT - .45; plinth.receiveShadow = true; scene.add(plinth);
}
// lights: index 0 house, index 1 sun (a real directional light with shadows)
const house = new THREE.DirectionalLight('#ffffff', 2);
house.position.setFromSphericalCoords(4, THREE.MathUtils.degToRad(40), THREE.MathUtils.degToRad(215)); house.castShadow = true;
Object.assign(house.shadow.camera, { left: -1.1, right: 1.1, top: 1.1, bottom: -1.1, near: .5, far: 9 });
house.shadow.mapSize.set(2048, 2048); house.shadow.radius = 5; house.shadow.bias = -.0006; house.shadow.normalBias = .002;
scene.add(house, house.target);
const sun = new THREE.DirectionalLight('#ffd9ad', 0);
sun.castShadow = true;
Object.assign(sun.shadow.camera, { left: -1.1, right: 1.1, top: 1.1, bottom: -1.1, near: .5, far: 11 });
sun.shadow.mapSize.set(2048, 2048); sun.shadow.radius = 1.5; sun.shadow.bias = -.0008; sun.shadow.normalBias = .002;
scene.add(sun, sun.target);
const hemi = new THREE.HemisphereLight('#dfe7f2', '#141414', .3); scene.add(hemi);

// ------------------------------------------------------------------ people as light (featureless shapes; never a face, never a person singled out)
const plen = L => { let s = 0; for (let i = 1; i < L.length; i++) s += Math.hypot(L[i][0] - L[i - 1][0], L[i][1] - L[i - 1][1]); return s; };
function along(L, k) {
  let d = plen(L) * clamp(k);
  for (let i = 1; i < L.length; i++) { const s = Math.hypot(L[i][0] - L[i - 1][0], L[i][1] - L[i - 1][1]); if (d <= s || i === L.length - 1) { const f = s ? Math.min(1, d / s) : 0; return [lerp(L[i - 1][0], L[i][0], f), lerp(L[i - 1][1], L[i][1], f)]; } d -= s; }
  return L[L.length - 1];
}
const F = [];   // {path, tIn, tOut, ta, tb, r, a, sway}
const fig = o => F.push({ r: .0038, a: 1, sway: 1, ta: 0, tb: 1, ...o });
const off = (p, dx, dz) => [p[0] + dx, p[1] + dz];
// asking: three small clusters in the market square
[[-.035, -.02], [-.028, -.03], [-.044, -.034], [.03, -.03], [.042, -.022], [.036, -.04], [.0, .035], [.012, .043], [-.012, .044]]
  .forEach(([dx, dz], i) => fig({ path: [off(M0, dx, dz)], tIn: 1.75 + i * .13, tOut: T.night0 + .4 }));
// arguing: two groups facing each other across the well
[[-.034, -.022], [-.042, -.012], [-.04, -.032]].forEach(([dx, dz], i) => fig({ path: [off(WELL, dx, dz)], tIn: 4.2 + i * .1, tOut: T.night0 + .3, argue: 1 }));
[[.032, .024], [.042, .016], [.038, .036]].forEach(([dx, dz], i) => fig({ path: [off(WELL, dx, dz)], tIn: 4.35 + i * .1, tOut: T.night0 + .3, argue: -1 }));
// searching: walkers come up the south lane into the market
for (let i = 0; i < 4; i++) fig({ path: [[0.085, 0.47], [0.065, 0.25], off(M0, .02 - i * .012, .06)], tIn: 6.5 + i * .45, tOut: T.night0 + .4, ta: 6.5 + i * .45, tb: 9.9 + i * .45 });
// resisting: some leave the market by the west road and walk out of town
for (let i = 0; i < 3; i++) fig({ path: [off(M0, .03, -.02), [0.2, 0.0], [0.36, -0.02], [0.47, -0.2], [0.5, -0.36]], tIn: 9.9 + i * .2, tOut: 12.5, ta: 10.1 + i * .3, tb: 13.6 + i * .3, fade: 1 });
// hope: at dawn two come out to the well
for (let i = 0; i < 2; i++) fig({ path: [[-0.2 - i * .05, 0.22], off(WELL, .006 - i * .02, .03)], tIn: 15.7 + i * .4, tOut: DUR + 1, ta: 16.0 + i * .4, tb: 18.6 + i * .4 });
// hardship: a few walk slowly to the well in the dry season
for (let i = 0; i < 3; i++) fig({ path: [[-0.4 + i * .03, 0.3], [-0.33, 0.2], off(WELL, -.018 + i * .016, .022)], tIn: 17.6 + i * .5, tOut: DUR + 1, ta: 17.8 + i * .5, tb: 21.0 + i * .5, sway: .4 });
// victory: a caravan comes in along the west road; the market fills
for (let i = 0; i < 9; i++) {
  const camel = i % 3 !== 0, t0 = 20.7 + i * .2;
  fig({ path: [[0.1, 0.52], [0.065, 0.25], off(M0, -.012 + (i % 3) * .014, .055 - Math.floor(i / 3) * .016)], tIn: t0, tOut: DUR + 1, ta: t0, tb: t0 + 3.3, r: camel ? .0056 : .0038, sway: .3 });
}
for (let i = 0; i < 14; i++) {
  const a = hash(i * 3.7) * 6.28, R = .02 + hash(i * 5.3) * .055;
  fig({ path: [off(M0, Math.cos(a) * R, Math.sin(a) * R)], tIn: 21.3 + i * .11, tOut: DUR + 1 });
}
const vis = [];   // screen positions of the living lights (for nothing but checks)
function setFigs(t) {
  let n = 0;
  for (const [i, f] of F.entries()) {
    const a = env(t, f.tIn, f.tOut, .35, .6) * f.a * (f.fade ? lerp(1, .35, seg(t, f.ta + 1.5, f.tb)) : 1);
    if (a <= 0 || n >= NF) continue;
    let [x, z] = f.path.length > 1 ? along(f.path, eio(seg(t, f.ta, f.tb))) : f.path[0];
    x += Math.sin(t * 1.1 + i * 2.3) * .0011 * f.sway; z += Math.cos(t * .9 + i * 1.7) * .0011 * f.sway;
    if (f.argue) { const k = Math.max(0, Math.sin((t - 4.3) * 4.2)) * env(t, 4.3, 6.6, .2, .6); x += f.argue * k * .006; z += f.argue * k * .004; }
    const pop = 1 + .8 * Math.exp(-Math.max(0, t - f.tIn) / .15) * (t > f.tIn ? 1 : 0);
    U.uFig.value[n++].set(x, z, f.r, a * pop);
  }
  U.uNFig.value = n;
  for (; n < NF; n++) U.uFig.value[n].set(0, 0, .001, 0);
}

// ------------------------------------------------------------------ camera: [t, [tx, ty, tz, azimuth°, elevation°, distance]] (azimuth 0 = from the south)
const CAM = track([
  [0.0, [-0.02, .012, .07, -28, 8, .42]],
  [1.6, [-0.03, .01, .07, -22, 13, .56]],
  [3.6, [-0.12, .0, .08, -16, 20, .66]],
  [5.6, [-0.33, .0, .12, -10, 25, .66]],
  [8.6, [-0.08, .0, .14, -2, 28, .82]],
  [11.6, [0.12, .0, .06, 8, 31, .92]],
  [14.0, [0.0, .0, .02, 12, 36, 1.18]],
  [16.6, [-0.05, .0, .03, 14, 30, 1.0]],
  [19.4, [-0.3, .0, .1, 6, 27, .74]],
  [22.4, [-0.05, .0, .12, 0, 25, .8]],
  [24.4, [-0.03, .0, .14, -6, 30, 1.45]],
  [DUR, [0.0, .0, .14, -9, 33, 1.85]],
]);
const tgt = new THREE.Vector3();
function setCamera(t) {
  const [tx, ty, tz, az, el, d] = CAM(t);
  tgt.set(tx, ty, tz);
  const a = THREE.MathUtils.degToRad(az), e = THREE.MathUtils.degToRad(el);
  camera.position.set(tx + d * Math.sin(a) * Math.cos(e), ty + d * Math.sin(e), tz + d * Math.cos(a) * Math.cos(e));
  camera.updateProjectionMatrix(); camera.lookAt(tgt); camera.updateMatrixWorld();
  post.dof.focus = d; post.dof.aper = lerp(5.5, 2.0, seg(d, .45, 1.8)); post.dof.maxCoc = 0;   // software GL here: depth of field off to keep a frame well under 10 s
}

// ------------------------------------------------------------------ projection state
const yearK = t => seg(t, T.y0, T.y1);                     // 0 → 1 over Year 1 → Year 23
const sunVec = (alt, az) => { const a = THREE.MathUtils.degToRad(alt), z = THREE.MathUtils.degToRad(az); return new THREE.Vector3(Math.sin(z) * Math.cos(a), Math.sin(a), -Math.cos(z) * Math.cos(a)); };
function setLight(t) {
  const out = ss(seg(t, T.lightsOut, T.lightsOut + .25)), back = ss(seg(t, T.lightsUp, T.lightsUp + 1.2));
  const houseK = lerp(1, .07, out) * (1 - back) + .45 * back;
  const sunK = ss(seg(t, T.sun0, T.sun0 + 1.2)) * (1 - ss(seg(t, T.sun1 - .5, T.sun1 + .4)));
  house.intensity = 2.3 * houseK * (1 - sunK); hemi.intensity = 1.6 * houseK + .03;
  scene.environmentIntensity = lerp(.06, .75, houseK); scene.backgroundIntensity = lerp(.5, 1, houseK);
  post.bloom.threshold = lerp(1.6, .85, out * (1 - back));
  const strike = seg(t, T.lamp, T.lamp + .12), flick = t > T.lamp && t < T.lamp + .25 ? .75 + .25 * Math.sin((t - T.lamp) * 90) : 1;
  U.uProj.value = strike * flick;
  U.uNow.value = t;
  U.uWashR.value = t < T.lamp ? -1 : lerp(0, 1.4, eo(seg(t, T.lamp, T.washEnd)));
  U.uWashRim.value = 1 - ss(seg(t, T.washEnd - .6, T.washEnd + .2));
  const night = ss(seg(t, T.night0, T.night1)) * (1 - ss(seg(t, T.sun0, T.sun0 + 1.4)));
  const dust = ss(seg(t, T.dust0, T.dust0 + 1)) * (1 - ss(seg(t, T.dust1, T.dust1 + .8)));
  const day = (1 - ss(seg(t, T.night0, T.night1))) + ss(seg(t, T.day2, T.day2 + 1.2));
  U.uDay.value = clamp(day) * (1 - dust * .85) * (1 - back * .6);
  U.uNight.value = night;
  U.uLamp.value = ss(seg(t, T.night0 + .3, T.night0 + 1.0)) * (1 - ss(seg(t, T.sun0 + .4, T.sun0 + 1.6)));
  U.uDawn.value = sunK;
  U.uDust.value = dust;
  // the sun rises in the east over the hills' shoulder: a real light, low and warm
  const sk = seg(t, T.sun0, T.sun1), sv = sunVec(lerp(3, 24, sk), lerp(82, 100, sk));
  sun.position.copy(sv).multiplyScalar(5); sun.target.position.set(0, 0, 0); sun.target.updateMatrixWorld();
  sun.intensity = 3.4 * sunK;
  house.target.position.set(0, 0, 0); house.target.updateMatrixWorld();
  U.uStallOn.value = t > T.stall0 ? 1 : 0; U.uStallT0.value = T.stall0; U.uStallDT.value = T.stallDT;
  U.uLineOn.value = seg(t, T.lamp + .3, T.lamp + .9);
  U.uLine.value = yearK(t);
  setFigs(t);
}

// ------------------------------------------------------------------ overlay (readout left third, rim labels pinned to the model, captions)
const ov = document.getElementById('ov').getContext('2d');
const FONT = { num: '200 {}px InterF', lab: '400 {}px InterF', lab3: '300 {}px InterF', mono: '400 {}px "IBM Plex Mono"' };
const font = (k, px) => FONT[k].replace('{}', px);
let TX = [];
function txt(id, s, x, y, k, px, c, a = 1, o = {}) {
  if (a <= .001) return 0;
  const g = ov; g.save(); g.globalAlpha = a; g.font = font(k, px); g.fillStyle = c;
  if (o.ls) g.letterSpacing = o.ls + 'px';
  if (o.shadow) { g.shadowColor = 'rgba(0,0,0,.65)'; g.shadowBlur = o.shadow; }
  const w = g.measureText(s).width, xx = o.right ? x - w : o.center ? x - w / 2 : x;
  g.fillText(s, xx, y); g.restore();
  if (id && a > .98) TX.push({ id, text: s, x0: xx, y0: y - px * .9, x1: xx + w, y1: y + px * .25 });
  return w;
}
const proj3 = (x, y, z) => { const v = new THREE.Vector3(x, y, z).project(camera); return v.z < 1 && Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05 ? [(v.x * .5 + .5) * W, (-v.y * .5 + .5) * H] : null; };
const LAYERS = [
  [T.lamp + .5, T.night0 + .2, 'People and the market square'],
  [T.night0 + .2, T.sun0 + .2, 'Night'],
  [T.sun0 + .2, T.dust0 + .2, 'Dawn  ·  the sun from the east'],
  [T.dust0 + .2, T.dust1 + .1, 'A dry season'],
  [T.dust1 + .1, DUR + 1, 'A caravan arrives  ·  the market opens'],
];
function drawOverlay(t) {
  const g = ov; g.clearRect(0, 0, W, H); TX = [];
  const ra = env(t, T.lamp + .6, DUR + 1, .5, .3);
  if (ra > 0) {   // soft dark field behind the readout
    const gr = g.createRadialGradient(300, 560, 40, 300, 560, 620);
    gr.addColorStop(0, `rgba(4,5,8,${.55 * ra})`); gr.addColorStop(.55, `rgba(4,5,8,${.32 * ra})`); gr.addColorStop(1, 'rgba(4,5,8,0)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
  }
  { // bottom strip for the captions
    const g3 = g.createLinearGradient(0, H, 0, H - 220); g3.addColorStop(0, 'rgba(4,5,8,.62)'); g3.addColorStop(1, 'rgba(4,5,8,0)');
    g.fillStyle = g3; g.fillRect(0, H - 220, W, 220);
  }
  // identity, top-left
  const ia = env(t, .3, DUR + 1, .6, .3);
  txt('id1', 'AN ARABIAN TOWN  ·  7TH CENTURY  ·  1:300', 96, 92, 'lab', 22, '#f2f4f6', ia, { ls: 3, shadow: 10 });
  txt('id2', 'study massing model  ·  illustrative, not a survey', 96, 124, 'mono', 18, 'rgba(225,230,236,.66)', ia, { ls: 1 });
  // readout: the years of the mission
  if (ra > 0) {
    const k = eo(seg(t, T.lamp + .6, T.lamp + 1.1)), X = 96, Y = 560 + (1 - k) * 22;
    g.save(); g.globalAlpha = ra; g.fillStyle = PAL.line; g.fillRect(X, Y - 122, 46 * k + 2, 2); g.restore();
    txt('ri', '03', X, Y - 136, 'mono', 20, 'rgba(235,238,242,.72)', ra, { ls: 2 });
    txt('rn', 'THE YEARS OF THE MISSION', X + 52, Y - 135, 'lab', 22, '#eef1f4', ra, { ls: 3 });
    // no year numbers: the moments are illustrative, not dated
    txt(null, 'Twenty-three years', X, Y + 40, 'lab3', 40, 'rgba(255,255,255,.9)', ra, { shadow: 12 });
    for (const [a0, a1, s] of LAYERS) {
      const la = env(t, a0, a1, .45, .35) * ra; if (la <= 0) continue;
      txt('L' + a0, s, X, Y + 108, 'lab', 30, '#f4f5f6', la, { shadow: 10 });
    }
    txt('rs', 'projected light on a white model', X, Y + 146, 'mono', 19, 'rgba(225,230,236,.7)', ra, { ls: 1 });
    // the legend: the thread itself
    g.save(); g.globalAlpha = ra; g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(X, Y + 176, 300, 2);
    g.fillStyle = PAL.line; g.fillRect(X, Y + 175, 300 * yearK(t), 4); g.restore();
  }
  // the rim labels: Year 1, Year 13, Year 23 (appear as the thread reaches them)
  const x0 = -PW / 2 + .05, x1 = PW / 2 - .05, zl = PD / 2 + .026;
  for (const [yy, kk] of [[1, 0], [23, 1]]) {
    const a = U.uLineOn.value * env(t, T.y0 + kk * (T.y1 - T.y0) - .2, DUR + 1, .4, .3); if (a <= 0) continue;
    const p = proj3(lerp(x0, x1, kk), 0, zl + .012); if (!p || p[1] > 960) continue;
    txt('rim' + yy, `Year ${yy}`, p[0], p[1] + 26, 'mono', 20, '#ffe2bd', a, { center: true, shadow: 10 });
  }
  drawCaption(g, SUBS, t);
}

// ------------------------------------------------------------------ page contract
window.DUR = DUR;
window.render = t => {
  setCamera(t); setLight(t);
  renderer.shadowMap.needsUpdate = true;
  post.composer.render();
  drawOverlay(t);
};
window.TEXTS = t => { window.render(t); const c = SUBS.find(x => t >= x.start - .1 && t < x.end + .5); return c ? [...TX, { id: 'cap', text: c.text }] : TX; };
window.EV = [
  { t: T.lightsOut, type: 'relay' }, { t: T.lamp, type: 'lamp' }, { t: T.night0, type: 'night' }, { t: T.sun0, type: 'sun' },
  { t: T.dust0, type: 'dust' }, { t: T.stall0, type: 'stalls' }, { t: T.lightsUp, type: 'lights' },
];
await document.fonts.ready;
await Promise.all(['italic 500 42px "Cormorant Garamond"', '200 40px InterF', '300 40px InterF', '400 40px InterF', '400 20px "IBM Plex Mono"'].map(f => document.fonts.load(f, 'Ab1')));
window.render(0);
window.READY = true;
