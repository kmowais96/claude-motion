// Shared by every section: timing, captions, the sheet transition.
import { clamp, seg, eio, eo, ei } from '/core/lib.js';

export const W = 1920, H = 1080;

// Section timing handle. Sentence indices are local to the section (0 = its first sentence).
export function timing(sents) {
  const s = sents;
  return {
    s,
    t0: s[0].start,
    t1: s[s.length - 1].end,
    at: i => s[i].start,
    end: i => s[i].end,
    // fraction k (0..1) of the way through sentence i
    k: (i, f) => s[i].start + (s[i].end - s[i].start) * f,
    // the i-th spoken word of sentence i, approximated by character position
    word: (i, w) => {
      const words = s[i].text.split(' ');
      const before = words.slice(0, w).join(' ').length, all = s[i].text.length;
      return s[i].start + (s[i].end - s[i].start) * (before / all);
    },
  };
}

// Caption looks, one per style (from each STYLE.md §4).
export const CAP = {
  woodcut:   { font: '42px "IM Fell English"', ink: '#17130f', y: 1006, halo: null, max: 1500, fadeIn: .1, fadeOut: .15 },
  lightbox:  { font: '500 40px "Cormorant Garamond"', ink: '#f4e8d4', y: 1006, halo: 'shadow', max: 1500, fadeIn: .3, fadeOut: .3 },
  ink:       { font: 'italic 500 42px "Cormorant Garamond"', ink: '#1f1b17', y: 990, halo: '#f2ecde', max: 1400, fadeIn: .12, fadeOut: .3, seal: '#b02e22' },
  oneline:   { font: '600 46px "Caveat"', ink: 'rgba(29,26,23,.86)', y: 994, halo: '#f4efe4', max: 1400, fadeIn: 0, fadeOut: .45, write: true },
  engraving: { font: '600 40px "Cormorant Garamond"', ink: '#1c1510', y: 996, halo: 'slip', max: 1360, fadeIn: .12, fadeOut: .3 },
  watercolor:{ font: 'italic 500 40px "Cormorant Garamond"', ink: 'rgba(40,32,26,.84)', y: 996, halo: '#f3ead9', max: 1400, fadeIn: .2, fadeOut: .35 },
};

// Group short neighbouring sentences of one paragraph into one caption, so nothing flashes.
export function captionCues(sents, skip = new Set()) {
  const cues = [];
  for (let i = 0; i < sents.length; i++) {
    if (skip.has(i)) continue;
    const s = sents[i], last = cues[cues.length - 1];
    if (last && !last.closed && last.para === s.para && last.part === s.part &&
        (last.text + ' ' + s.text).length <= 86 && s.start - last.end < 1.2 && last.end - last.start < 2.4) {
      last.text += ' ' + s.text; last.end = s.end; last.idx.push(i);
    } else cues.push({ text: s.text, start: s.start, end: s.end, para: s.para, part: s.part, idx: [i] });
    if (skip.has(i + 1)) cues[cues.length - 1].closed = true;
  }
  for (const c of cues) c.show = c.start - .12;
  for (let j = 0; j < cues.length; j++) {
    const c = cues[j], next = cues[j + 1];
    const want = Math.max(c.end + .45, c.show + 1.8);
    c.hide = next ? Math.min(want, next.show - .05) : want;
  }
  return cues;
}

function wrap(ctx, text, max) {
  if (ctx.measureText(text).width <= max) return [text];
  // two balanced lines: split at the space nearest the middle, preferring a comma
  const words = text.split(' '); let best = null;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' '), b = words.slice(i).join(' ');
    const wa = ctx.measureText(a).width, wb = ctx.measureText(b).width;
    const cost = Math.abs(wa - wb) - (/[,:;]$/.test(words[i - 1]) ? 120 : 0) + (Math.max(wa, wb) > max ? 1e4 : 0);
    if (!best || cost < best.cost) best = { cost, l: [a, b] };
  }
  return best.l;
}

const capBox = { list: [] };
export const capTexts = () => capBox.list;

export function drawCaption(ctx, style, cue, t) {
  const S = CAP[style];
  const k = Math.min(S.fadeIn ? seg(t, cue.show, cue.show + S.fadeIn) : 1, 1 - seg(t, cue.hide, cue.hide + S.fadeOut));
  if (k <= 0) return;
  ctx.save();
  ctx.font = S.font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const lines = wrap(ctx, cue.text, S.max), lh = parseInt(S.font.match(/(\d+)px/)[1]) * 1.18;
  const y0 = S.y - (lines.length - 1) * lh / 2;
  const wmax = Math.max(...lines.map(l => ctx.measureText(l).width));
  capBox.list.push({ id: 'cap', text: cue.text, x0: W / 2 - wmax / 2, y0: y0 - lh / 2, x1: W / 2 + wmax / 2, y1: y0 + lh * (lines.length - .5) });
  ctx.globalAlpha = k;
  if (S.halo === 'slip') {
    // a deckled paper slip behind script, as on an engraved plate
    const pw = wmax + 90, ph = lh * lines.length + 34;
    ctx.fillStyle = '#efe4c9'; ctx.shadowColor = 'rgba(40,25,10,.25)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 3;
    ctx.beginPath();
    const x = W / 2 - pw / 2, y = S.y - ph / 2;
    for (let i = 0; i <= 40; i++) ctx.lineTo(x + pw * i / 40, y + Math.sin(i * 2.7) * 1.6);
    for (let i = 0; i <= 12; i++) ctx.lineTo(x + pw + Math.sin(i * 3.1) * 1.6, y + ph * i / 12);
    for (let i = 40; i >= 0; i--) ctx.lineTo(x + pw * i / 40, y + ph + Math.sin(i * 1.9) * 1.6);
    for (let i = 12; i >= 0; i--) ctx.lineTo(x + Math.sin(i * 2.3) * 1.6, y + ph * i / 12);
    ctx.fill(); ctx.shadowColor = 'transparent';
  }
  const shownOf = (l, n) => {
    if (!S.write) return l;
    // written on left to right: ~0.2 s + 17 ms per character, line after line
    const before = lines.slice(0, n).join(' ').length;
    return l.slice(0, Math.max(0, Math.floor((t - cue.show - .05) / .017) - before));
  };
  const xOf = l => S.write ? W / 2 - ctx.measureText(l).width / 2 : W / 2;
  ctx.textAlign = S.write ? 'left' : 'center';
  if (S.halo && S.halo !== 'slip' && S.halo !== 'shadow') {
    ctx.strokeStyle = S.halo; ctx.lineWidth = 14; ctx.lineJoin = 'round'; ctx.globalAlpha = k * .85;
    lines.forEach((l, n) => ctx.strokeText(shownOf(l, n), xOf(l), y0 + n * lh));
    ctx.globalAlpha = k;
  }
  if (S.halo === 'shadow') { ctx.shadowColor = 'rgba(0,0,0,.75)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 2; }
  ctx.fillStyle = S.ink;
  lines.forEach((l, n) => ctx.fillText(shownOf(l, n), xOf(l), y0 + n * lh));
  ctx.shadowColor = 'transparent';
  if (S.seal) {
    ctx.textAlign = 'center';
    const x = W / 2 - ctx.measureText(lines[0]).width / 2 - 26;
    ctx.fillStyle = S.seal; ctx.fillRect(x - 7, y0 - 8, 14, 16);
  }
  ctx.restore();
}
export const resetTexts = () => { capBox.list = []; };

// Between sections the next sheet is laid over the last, like a print placed on a stack.
export function sheetOver(ctx, A, B, p) {
  const e = eio(p);
  ctx.drawImage(A, 0, 0);
  ctx.fillStyle = `rgba(0,0,0,${.35 * e})`; ctx.fillRect(0, 0, W, H);
  ctx.save();
  const x = (1 - e) * W * 1.04, r = (1 - e) * .035;
  ctx.translate(x + W / 2, H / 2 + (1 - e) * 40); ctx.rotate(r); ctx.translate(-W / 2, -H / 2);
  ctx.shadowColor = `rgba(0,0,0,${.55 * (1 - ei(p))})`; ctx.shadowBlur = 50; ctx.shadowOffsetX = -18;
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  ctx.shadowColor = 'transparent';
  ctx.drawImage(B, 0, 0);
  ctx.restore();
}

export { clamp, seg, eio, eo, ei };
