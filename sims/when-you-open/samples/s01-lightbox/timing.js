// Estimated narration timing until the real voice exists: ~125 wpm, longer rests after "...".
export function estimate(lines, t0 = 0) {
  let t = t0;
  return lines.map(text => {
    const words = text.split(/\s+/).filter(Boolean).length;
    const dur = .35 + words * .44;
    const s = { text, start: t, end: t + dur };
    t = s.end + (/\.\.\.$/.test(text) ? 1.1 : /\?$/.test(text) ? 1.0 : .6);
    return s;
  });
}
export function T(s) {
  return { s, t0: s[0].start, t1: s[s.length - 1].end, at: i => s[i].start, end: i => s[i].end, k: (i, f) => s[i].start + (s[i].end - s[i].start) * f };
}
