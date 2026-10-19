// Sample · Scene 02, A Book Unlike Others (lemo-opuscar lowpoly-island).
// A conventional book: a neat straight row of chapter blocks on calm water. The row lifts and breaks apart into a chain
// of six linked low-poly islands (desert, city, gathering place, night sky, peaceful home, storm at sea). The camera
// trucks along the chain while light moves through the day, then zooms out to show them as one composition.
import * as THREE from 'three';
import { seg, ss, eio, lerp } from './lib.js';
import { makePost } from './post.js';
import { makeSea } from './sea.js';
import { buildWorld, wp, ISL_U, ISL_W, TM } from './world.js';
import { estimate } from './timing.js';
import { drawCaption } from './caption.js';

const W = 1920, H = 1080, QS = new URLSearchParams(location.search), DEG = Math.PI / 180;
const LINES = ['Imagine opening a book...', "And finding that it doesn't follow the pattern you're used to.",
  "One moment, you're reading about the creation of the heavens and the earth.", 'Then, the story of a prophet.',
  'Then, a warning about the Day of Judgment.', 'And suddenly, a question.'];
const S = estimate(LINES, .9);
const DUR = 28.4;

await document.fonts.load('italic 500 42px "Cormorant Garamond"', 'Ab');
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.shadowMap.enabled = !QS.get('nosh'); renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('stage').appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-10, 10, 5, -5, 1, 1600);
const post = makePost(renderer, scene, camera, W, H, { ssaa: +(QS.get('ssaa') ?? 1), aoRadius: .5, aoScale: 1.4, aoThickness: .8 });
post.bloom.threshold = .95; if (QS.get('noao')) { post.sp.noAO = true; post.comp.aoAmt.value = 0; } post.bloom.radius = .55;
const sea = makeSea(scene);
const world = buildWorld(scene);
const hemi = new THREE.HemisphereLight('#eef6fb', '#c6b89c', 1.1); scene.add(hemi);
const sun = new THREE.DirectionalLight('#fff6e8', 2.5); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0006; sun.shadow.normalBias = .02; sun.shadow.radius = 3;
scene.add(sun, sun.target);

// ---- light as clock: [t, zenith, horizon, deep, shallow, sun, sunI, hemiSky, hemiGround, hemiI, sunEl, sunAz, night]
const SKY = [
  [0.0, '#a9c4dc', '#f6dccd', '#4f93a8', '#93d0c8', '#ffe2c8', 1.9, '#e3ecf6', '#bfa590', 1.1, 30, 135, 0],
  [9.6, '#8fcbe6', '#e9f3f0', '#3aa3b8', '#86e0d2', '#fff4e2', 2.5, '#eef6fb', '#c2b59a', 1.15, 44, 140, 0],
  [12.6, '#8fcbe6', '#eef2e6', '#3aa3b8', '#86e0d2', '#fff0d8', 2.4, '#eef6fb', '#c2b59a', 1.12, 38, 138, 0],
  [14.8, '#9ab8d8', '#ffd9b0', '#4f8fb0', '#9ed6c8', '#ffc98e', 2.2, '#f3e2d4', '#c89a80', 1.0, 20, 132, 0],
  [16.0, '#6f6fa8', '#ffa888', '#5a6a9e', '#b08aa6', '#ff9a68', 1.4, '#d8b8c8', '#a07a80', .8, 8, 128, .15],
  [17.2, '#141a40', '#4a4478', '#23264a', '#363a66', '#a9b0e8', .9, '#5c5ea8', '#2a2640', .58, 32, 315, 1],
  [18.8, '#141a40', '#4a4478', '#23264a', '#363a66', '#a9b0e8', .9, '#5c5ea8', '#2a2640', .58, 32, 315, 1],
  [20.2, '#2f3a72', '#9a7fa8', '#2e3a66', '#4a5a88', '#c8b8e0', .85, '#7a80b8', '#4a4466', .62, 14, 312, .72],
  [21.7, '#5d6676', '#8d95a0', '#34495a', '#4f6672', '#c9d2dc', .9, '#9aa6b4', '#55606a', .78, 36, 140, .3],
  [24.2, '#5d6676', '#8d95a0', '#34495a', '#4f6672', '#c9d2dc', .9, '#9aa6b4', '#55606a', .78, 36, 140, .3],
  [27.2, '#6f6fa8', '#ffb08e', '#4f5f96', '#9a88a8', '#ffa070', 1.4, '#d8b8c8', '#a07a80', .8, 10, 132, .42],
  [DUR + 1, '#6f6fa8', '#ffb08e', '#4f5f96', '#9a88a8', '#ffa070', 1.4, '#d8b8c8', '#a07a80', .8, 10, 132, .42],
];
const C = h => new THREE.Color(h);
const SK = SKY.map(k => ({ t: k[0], zen: C(k[1]), hor: C(k[2]), deep: C(k[3]), shal: C(k[4]), sun: C(k[5]), sunI: k[6], hs: C(k[7]), hg: C(k[8]), hI: k[9], el: k[10], az: k[11], night: k[12] }));
function skyAt(t) {
  let i = 0; while (i < SK.length - 2 && t > SK[i + 1].t) i++;
  const a = SK[i], b = SK[i + 1], u = ss(seg(t, a.t, b.t)), o = {};
  for (const k of ['zen', 'hor', 'deep', 'shal', 'sun', 'hs', 'hg']) o[k] = a[k].clone().lerp(b[k], u);
  for (const k of ['sunI', 'hI', 'el', 'az', 'night']) o[k] = lerp(a[k], b[k], u);
  return o;
}

// ---- camera: orthographic, isometric; the shot list is the scene's grammar ----
const TRUCK = [9.6, 22.6], OUT = [24.3, 27.4];
const dwell = x => x - .7 * Math.sin(10 * Math.PI * x) / (10 * Math.PI);   // slows at each island
const wAt = u => { const k = Math.max(0, Math.min(4.999, (u - ISL_U[0]) / 6.2)), i = Math.floor(k); return lerp(ISL_W[i], ISL_W[i + 1], ss(k - i)); };
let CAM = {};
function cam(t) {
  let tg, az, el, fh;
  const row = wp(0, 0);
  if (t < 5.4) { tg = [row[0], .35, row[1]]; az = lerp(43, 46, t / 5.4); el = 31; fh = lerp(6.3, 6.8, t / 5.4); }
  else if (t < TRUCK[0]) { const z = eio(seg(t, 5.5, 8.9)); tg = [row[0], .4, row[1]]; az = lerp(46, 47, z); el = lerp(31, 35, z); fh = lerp(6.8, 21.5, z); }
  else {
    const x = seg(t, ...TRUCK), u = lerp(ISL_U[0], ISL_U[5], dwell(x)), p = wp(u, wAt(u));
    tg = [p[0], .6, p[1]]; az = 43 + 4 * x; el = 29; fh = lerp(7.6, 7.2, seg(t, TRUCK[1], OUT[0]));
    if (t > OUT[0]) { const z = eio(seg(t, ...OUT)); tg = [lerp(p[0], row[0], z), lerp(.6, .4, z), lerp(p[1], row[1], z)]; fh = lerp(7.2, 21.5, z); el = lerp(29, 34, z); }
  }
  const D = Math.max(300, fh * 3), ce = Math.cos(el * DEG);
  camera.position.set(tg[0] + D * ce * Math.sin(az * DEG), tg[1] + D * Math.sin(el * DEG), tg[2] + D * ce * Math.cos(az * DEG));
  camera.up.set(0, 1, 0); camera.lookAt(...tg);
  const fw = fh * W / H; Object.assign(camera, { left: -fw / 2, right: fw / 2, top: fh / 2, bottom: -fh / 2, near: 1, far: D + fh * 5 + 800 }); camera.updateProjectionMatrix();
  const cot = 1 / Math.tan(el * DEG);
  post.comp.camDist.value = D; post.comp.hz0.value = .1 * fh * cot; post.comp.hz1.value = .52 * fh * cot;
  post.tilt.fy.value = .5; post.tilt.band.value = .3;
  CAM = { tg, az, el, fh, fw };
}

const ov = document.getElementById('o').getContext('2d');
function render(t) {
  const sk = skyAt(t); cam(t);
  const night = sk.night;
  sea.U.uTime.value = t; sea.U.uAmp.value = 1 + night * .2; sea.U.uDeep.value.copy(sk.deep); sea.U.uShal.value.copy(sk.shal);
  sea.U.uFoam.value.set(night > .5 ? '#9fb0e0' : '#ffffff'); sea.U.uNight.value = night;
  const fl = Math.exp(-Math.pow((t - TM.flash[0]) / .07, 2)) + .6 * Math.exp(-Math.pow((t - TM.flash[1]) / .06, 2));
  hemi.color.copy(sk.hs); hemi.groundColor.copy(sk.hg); hemi.intensity = sk.hI + .5 * fl;
  const se = sk.el * DEG, sa = sk.az * DEG, [cx, , cz] = CAM.tg;
  sun.color.copy(sk.sun); sun.intensity = sk.sunI;
  sun.target.position.set(cx, 0, cz); sun.position.set(cx + Math.cos(se) * Math.sin(sa) * 60, Math.sin(se) * 60, cz + Math.cos(se) * Math.cos(sa) * 60);
  const sh = Math.max(9, CAM.fw * .62); Object.assign(sun.shadow.camera, { left: -sh, right: sh, top: sh, bottom: -sh, near: 1, far: 140 }); sun.shadow.camera.updateProjectionMatrix();
  post.comp.zen.value.copy(sk.zen); post.comp.hor.value.copy(sk.hor);
  post.comp.stars.value = ss(seg(night, .3, 1)); post.comp.starOff.value = CAM.az / 60; post.comp.time.value = t;
  const gd = post.grade;
  gd.sat.value = lerp(1.04, 1.1, night); gd.contrast.value = lerp(.06, .12, night); gd.lift.value.setRGB(lerp(.018, .012, night), lerp(.016, .016, night), lerp(.024, .045, night));
  gd.vig.value = lerp(.16, .3, night); post.bloom.strength = lerp(.2, .5, night);
  { const f = new THREE.Vector3(); camera.getWorldDirection(f); const fl2 = Math.hypot(f.x, f.z) || 1; sea.U.uFwd.value.set(f.x / fl2, f.z / fl2); sea.U.uTgt.value.set(cx, cz); sea.U.uSpanF.value = CAM.fh / Math.tan(CAM.el * DEG) * .5; }
  world.update(t, { night, sea });
  post.composer.render();
  ov.clearRect(0, 0, W, H);
  if (!QS.get('nocap')) drawCaption(ov, S, t);
}

window.DUR = DUR;
window.render = render;
window.TEXTS = t => { const c = S.find(x => t >= x.start - .1 && t < x.end + .5); return c ? [{ id: 'cap', text: c.text, x0: 200, y0: 970, x1: 1720, y1: 1030 }] : []; };
window.EV = [
  ...[0, 1, 2, 3, 4, 5].map(i => ({ t: TM.blockIn(i), type: 'chapter', i })),
  { t: TM.lift[0], type: 'lift' }, { t: TM.move(0)[0], type: 'break' },
  ...[0, 1, 2, 3, 4, 5].map(i => ({ t: TM.sink(i) + .25, type: 'island', i })),
  { t: TM.bridge(0), type: 'bridges' }, { t: TRUCK[0], type: 'cut' }, { t: TM.stars, type: 'stars' },
  { t: TM.flash[0], type: 'flash' }, { t: OUT[0], type: 'zoomout' },
  ...S.map((s, i) => ({ t: s.start, type: 'vo', i, text: s.text })),
].sort((a, b) => a.t - b.t);
render(0);
window.READY = true;
