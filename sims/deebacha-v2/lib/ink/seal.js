// Vermilion 白文 seal drawn by code: lines knocked out of a slightly irregular red square, with ink-paste speckles.
// The knocked-out lines are an abstract seal-script pattern chosen by seed (no real characters).
import { vnoise, clamp, mulberry } from '/core/lib.js';
export const VERM = [176, 46, 34];

const PATS = [
  // each: polylines in a unit square
  [[[.22, .15], [.22, .85]], [[.22, .32], [.46, .32]], [[.22, .62], [.46, .62]], [[.6, .15], [.6, .5], [.8, .5], [.8, .85]], [[.6, .7], [.8, .7]], [[.62, .22], [.82, .22]]],
  [[[.15, .22], [.85, .22]], [[.5, .22], [.5, .52]], [[.2, .52], [.8, .52], [.8, .82], [.2, .82], [.2, .52]], [[.5, .52], [.5, .82]]],
  [[[.2, .16], [.2, .84], [.42, .84]], [[.2, .5], [.42, .5]], [[.58, .16], [.82, .16], [.82, .5], [.58, .5]], [[.58, .66], [.82, .66]], [[.7, .5], [.7, .86]]],
  [[[.16, .2], [.84, .2]], [[.16, .5], [.84, .5]], [[.16, .8], [.84, .8]], [[.35, .2], [.35, .8]], [[.65, .2], [.65, .5]], [[.65, .62], [.65, .8]]],
];

export function seal(c, x, y, size, am = 1, seed = 3) {
  if (am <= 0) return;
  c.save(); c.translate(x, y);
  const S = size, jit = S * .022, R = mulberry(seed * 97 + 1);
  c.beginPath();
  const N = 28;
  for (let i = 0; i < N; i++) {
    const t = i / N * 4, side = Math.floor(t), u = t - side;
    let px, py; if (side === 0) { px = u * S; py = 0; } else if (side === 1) { px = S; py = u * S; } else if (side === 2) { px = S - u * S; py = S; } else { px = 0; py = S - u * S; }
    px += (vnoise(seed + i * 1.3) - .5) * jit * 2; py += (vnoise(seed + 40 + i * 1.3) - .5) * jit * 2;
    i ? c.lineTo(px, py) : c.moveTo(px, py);
  }
  c.closePath(); c.globalAlpha = 1; c.fillStyle = `rgba(${VERM.join(',')},${clamp(am)})`; c.fill();
  c.globalCompositeOperation = 'destination-out';
  c.fillStyle = '#000'; c.strokeStyle = '#000'; c.lineCap = 'square'; c.lineJoin = 'miter';
  c.lineWidth = Math.max(1.2, S * .075);
  for (const pl of PATS[seed % PATS.length]) {
    c.beginPath();
    pl.forEach(([a, b], i) => { const X = a * S + (R() - .5) * jit, Y = b * S + (R() - .5) * jit; i ? c.lineTo(X, Y) : c.moveTo(X, Y); });
    c.stroke();
  }
  // inner border (white line just inside the edge) on larger seals
  if (S > 40) { c.lineWidth = S * .03; c.strokeRect(S * .07, S * .07, S * .86, S * .86); }
  for (let i = 0; i < 60; i++) { c.globalAlpha = .4 + .6 * R(); c.beginPath(); c.arc(R() * S, R() * S, S * (.004 + .014 * R()), 0, 7); c.fill(); }
  c.restore();
}
