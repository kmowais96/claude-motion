import timeline from './timeline.json';

export const MT = timeline;
export const MFPS = MT.fps;
export const MW = 1080;
export const MH = 1920;
export const END = MT.end;

/** Paper, ink and the three accent colours of the piece. */
export const P = {
  paper: '#F5EFE1',
  paperDeep: '#EDE4D0',
  dot: 'rgba(120,100,60,0.07)',
  ink: '#2A2521',
  inkSoft: 'rgba(42,37,33,0.55)',
  line: '#D9CCB0',
  gold: '#C8932C',
  goldSoft: '#F1DDAE',
  teal: '#23806A',
  tealSoft: '#CFE6DD',
  red: '#C9483A',
  green: '#2F8A6E',
  blue: '#5E88C8',
  mustard: '#D3A23E',
  white: '#FFFDF8',
  skin: '#FFFDF8',
};

export const FONT = '"Baloo 2", "Inter Variable", system-ui, sans-serif';

export type MWord = {t: string; c: 'r' | 'g' | 't' | null; s: number; e: number};
export type MLine = {key: string; group: string; s: number; e: number; words: MWord[]};
export const LINES = MT.lines as MLine[];

export const L = (k: string) => {
  const l = LINES.find((x) => x.key === k);
  if (!l) throw new Error(`no line ${k}`);
  return l;
};
/** Start of line k. */
export const s = (k: string) => L(k).s;
/** End of line k. */
export const e = (k: string) => L(k).e;
/** Start of the first word of line k that starts with `w` (case-insensitive, punctuation ignored). */
export const w = (k: string, word: string) => {
  const n = (x: string) => x.toLowerCase().replace(/[^a-z0-9]/g, '');
  const hit = L(k).words.find((x) => n(x.t).startsWith(n(word)));
  if (!hit) throw new Error(`no word ${word} in ${k}`);
  return hit.s;
};
