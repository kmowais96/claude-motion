// Brushed inscriptions: the font gives the letter shapes, the brush engine gives the ink inside them
// (bristle tracks, flying white at the edges), and the reveal runs along the writing direction, wet at the front, dry behind.
import { clamp, vnoise, mulberry } from '/core/lib.js';
import { mk, draw } from './ink.js';

const mkc = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(2, Math.ceil(w)); c.height = Math.max(2, Math.ceil(h)); return c; };
const scratch = mkc(8, 8).getContext('2d');

// o: {text, font, size, x, y (anchor), align: 'left'|'center'|'right', rtl, tremble (0..1), seed, tex (true), tone, rot (radians), track (px)}
export function brushText(o) {
  const size = o.size, font = o.font, rtl = !!o.rtl, seed = o.seed ?? 1, trem = o.tremble || 0, track = o.track || 0;
  scratch.font = font; scratch.direction = rtl ? 'rtl' : 'ltr';
  const chars = rtl ? null : [...o.text];
  let tw;
  if (rtl) tw = scratch.measureText(o.text).width;
  else { tw = 0; for (const ch of chars) tw += scratch.measureText(ch).width + track; tw -= track; }
  // character widths (kerning ignored per char; for Latin inscriptions this reads as hand-set)
  const pad = size * .9, w = tw + pad * 2, h = size * (rtl ? 2.4 : 1.9);
  const base = rtl ? size * 1.45 : size * 1.25;
  const mask = mkc(w, h), mc = mask.getContext('2d');
  mc.font = font; mc.fillStyle = '#000'; mc.textBaseline = 'alphabetic';
  if (rtl) { mc.direction = 'rtl'; mc.textAlign = 'right'; mc.fillText(o.text, pad + tw, base); }
  else {
    let x = pad;
    chars.forEach((ch, i) => {
      const cw = mc.measureText(ch).width;
      const dy = trem ? ((vnoise(seed + i * .83) - .5) * .11 + Math.sin(i * .9 + seed) * .025) * size * trem : 0;
      const dr = trem ? (vnoise(seed * 3 + i * 1.37) - .5) * .12 * trem : 0;
      mc.save(); mc.translate(x + cw / 2, base + dy); mc.rotate(dr); mc.fillText(ch, -cw / 2, 0); mc.restore();
      x += cw + track;
    });
  }
  const fin = mkc(w, h), fc = fin.getContext('2d');
  if (o.tex !== false) {
    // brush texture: broad strokes along the line, then clipped to the letters
    const tex = mkc(w, h), tc = tex.getContext('2d'), I = { wet: null, dry: tc, col: null };
    const R = mulberry(seed * 13 + 5), rows = 3;
    for (let r = 0; r < rows; r++) {
      const yy = base - size * .78 + (r + .5) * size * 1.15 / rows, pts = [];
      for (let k = 0; k <= 8; k++) pts.push([pad * .4 + (w - pad * .8) * k / 8, yy + (R() - .5) * size * .12 + (trem ? Math.sin(k * 2.3 + seed) * size * .05 * trem : 0), .9 + R() * .25]);
      if (rtl) pts.reverse();
      draw(I, mk(pts, { w: size * 1.15 / rows * 1.9, tone: o.tone ?? .96, dry: o.dry ?? .32, prof: 'even', rough: .1, nb: 46, solid: true, seed: seed * 31 + r, gapLen: 900 }), 1, 1);
    }
    fc.drawImage(tex, 0, 0); fc.globalCompositeOperation = 'destination-in'; fc.drawImage(mask, 0, 0);
    fc.globalCompositeOperation = 'destination-over'; fc.globalAlpha = (o.base ?? .42) * (o.tone ?? .96); fc.drawImage(mask, 0, 0);
    fc.globalAlpha = 1; fc.globalCompositeOperation = 'source-over';
  } else { fc.globalAlpha = o.tone ?? .9; fc.drawImage(mask, 0, 0); fc.globalAlpha = 1; }
  // placement
  const align = o.align || 'center';
  const ax = align === 'left' ? 0 : align === 'right' ? tw : tw / 2;
  const T = { w, h, tw, size, fin, x: o.x, y: o.y, rot: o.rot || 0, pad, base, rtl };
  const tmp = mkc(w, h), tmpc = tmp.getContext('2d');
  // the bounding box in world coordinates (unrotated case) for texts()
  T.box = () => { const x0 = o.x - ax, y0 = o.y - size * .8; return [x0, y0, x0 + tw, y0 + size * 1.05]; };
  const place = c => { c.translate(o.x, o.y); if (T.rot) c.rotate(T.rot); c.translate(-ax - pad, -base); };
  const masked = (from, to, peak) => {
    // gradient along the writing direction: 1 behind the front, 0 ahead; for the wet copy only near the front
    tmpc.globalCompositeOperation = 'source-over'; tmpc.clearRect(0, 0, w, h); tmpc.drawImage(fin, 0, 0);
    const g = rtl ? tmpc.createLinearGradient(w, 0, 0, 0) : tmpc.createLinearGradient(0, 0, w, 0);
    const st = (u, a) => g.addColorStop(clamp(u), `rgba(0,0,0,${a})`);
    if (peak) { st(from - .18, 0); st(from - .02, 1); st(to, 0); st(1, 0); }
    else { st(0, 1); st(from, 1); st(to, 0); st(1, 0); }
    tmpc.globalCompositeOperation = 'destination-in'; tmpc.fillStyle = g; tmpc.fillRect(0, 0, w, h);
    tmpc.globalCompositeOperation = 'source-over';
    return tmp;
  };
  // p: 0..1 writing progress; am: opacity; wet: extra wetness (e.g. while it dries after writing)
  T.paint = (L, p = 1, am = 1, wet = 0) => {
    if (p <= 0 || am <= 0) return;
    const soft = size * .7 / w, u0 = (pad + (p * (tw + size * .4)) - size * .2) / w;
    for (const [c, k] of [[L.cd, 1], [L.cw, 1]]) { c.save(); place(c); c.globalAlpha = 1; void k; }
    if (p >= 1) {
      L.cd.globalAlpha = clamp(am); L.cd.drawImage(fin, 0, 0);
      L.cw.globalAlpha = clamp(am * (.1 + wet * .6)); L.cw.drawImage(fin, 0, 0);
    } else {
      L.cd.globalAlpha = clamp(am); L.cd.drawImage(masked(u0 - soft, u0, false), 0, 0);
      L.cw.globalAlpha = clamp(am * .55); L.cw.drawImage(masked(u0, u0 + soft * .3, true), 0, 0);
      L.cw.globalAlpha = clamp(am * .1); L.cw.drawImage(masked(u0 - soft, u0, false), 0, 0);
    }
    L.cd.restore(); L.cw.restore();
  };
  return T;
}
