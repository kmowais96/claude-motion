// Captions on the 2D overlay: plain serif in a calm band (impasto STYLE §4).
export function drawCaption(c, s, t) {
  const cur = s.find(x => t >= x.start - .1 && t < x.end + .5);
  if (!cur) return;
  const a = Math.min(1, (t - cur.start + .1) / .25, (cur.end + .5 - t) / .3);
  c.save(); c.globalAlpha = Math.max(0, a);
  c.font = 'italic 500 42px "Cormorant Garamond"'; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  c.shadowColor = 'rgba(10,6,4,.95)'; c.shadowBlur = 18; c.fillStyle = '#f6ecda';
  c.fillText(cur.text, 960, 1010); c.shadowBlur = 6;
  c.fillText(cur.text, 960, 1010);
  c.restore();
}
