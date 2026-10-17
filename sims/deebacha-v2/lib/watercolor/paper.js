// Warm cotton paper, generated at init with a seed (the style's paper.py, in canvas):
// warm base, three octaves of smooth noise ±3.5 %, a few thousand curved fibres, fine grain, light vignette,
// plus a soft gutter shade on the left edge so the sheet reads as a journal page.
import { mulberry } from '/core/lib.js';
const W = 1920, H = 1080;
const cache = {};

function smooth(rng, scale) {
  const w = Math.ceil(W / scale) + 3, h = Math.ceil(H / scale) + 3;
  const s = document.createElement('canvas'); s.width = w; s.height = h;
  const sc = s.getContext('2d'), id = sc.createImageData(w, h);
  for (let i = 0; i < w * h; i++) { const v = rng() * 255; id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = v; id.data[i * 4 + 3] = 255; }
  sc.putImageData(id, 0, 0);
  const b = document.createElement('canvas'); b.width = W; b.height = H;
  const bc = b.getContext('2d'); bc.imageSmoothingEnabled = true; bc.imageSmoothingQuality = 'high';
  bc.drawImage(s, -scale, -scale, w * scale, h * scale);
  const d = bc.getImageData(0, 0, W, H).data, out = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) out[i] = d[i * 4] / 255 - .5;
  return out;
}

export function paper(seed = 3) {
  if (cache[seed]) return cache[seed];
  const rng = mulberry(seed);
  const n1 = smooth(rng, 240), n2 = smooth(rng, 90), n3 = smooth(rng, 25), n4 = smooth(rng, 6);
  // fibres
  const fc = document.createElement('canvas'); fc.width = W; fc.height = H;
  const f = fc.getContext('2d'); f.fillStyle = '#000'; f.fillRect(0, 0, W, H); f.lineWidth = 1;
  for (let i = 0; i < 2600; i++) {
    let x = rng() * W, y = rng() * H, a = rng() * Math.PI; const L = 8 + rng() * 32, g = Math.round(40 + rng() * 100);
    f.strokeStyle = `rgb(${g},${g},${g})`; f.beginPath(); f.moveTo(x, y);
    for (let k = 0; k < 4; k++) { a += (rng() + rng() + rng() - 1.5) * .6; x += Math.cos(a) * L / 4; y += Math.sin(a) * L / 4; f.lineTo(x, y); }
    f.stroke();
  }
  const fb = document.createElement('canvas'); fb.width = W; fb.height = H;
  const fbc = fb.getContext('2d'); fbc.filter = 'blur(0.6px)'; fbc.drawImage(fc, 0, 0);
  const fib = fbc.getImageData(0, 0, W, H).data;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const c = cv.getContext('2d'), id = c.createImageData(W, H), D = id.data;
  const base = [241, 233, 218];
  for (let y = 0, i = 0; y < H; y++) for (let x = 0; x < W; x++, i++) {
    const m = n1[i] * .9 + n2[i] * .5 + n3[i] * .25;
    const fi = fib[i * 4] / 255 * .035 * (n4[i] > 0 ? 1 : -1);
    const vx = (x - W / 2) / (W * .62), vy = (y - H / 2) / (H * .62), v = Math.min(1.5, vx * vx + vy * vy);
    const gut = x < 70 ? (1 - x / 70) ** 2 * .05 : 0;
    const k = (1 + m * .035) * (1 - fi) * (1 - .05 * v) * (1 - gut);
    const g = (rng() + rng() + rng() - 1.5) * 2.2;
    D[i * 4] = base[0] * k + g; D[i * 4 + 1] = base[1] * k + g; D[i * 4 + 2] = base[2] * k + g; D[i * 4 + 3] = 255;
  }
  c.putImageData(id, 0, 0);
  return (cache[seed] = cv);
}
