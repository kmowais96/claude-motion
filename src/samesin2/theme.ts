import timeline from './timeline.json';

export const ST = timeline;
export const FPS = ST.fps;
export const END = ST.end;

/** Ink on pale paper, one cobalt hero, a green ground, red for the sin, gold for the light. */
export const K = {
  paper: '#EEF2F9',
  ink: '#121628',
  inkSoft: 'rgba(18,22,40,0.55)',
  hero: '#3557E0',
  heroDark: '#2440B8',
  ground: '#2A9A5A',
  groundDark: '#22814B',
  red: '#E8453C',
  gold: '#F6C443',
  light: '#FFE9A6',
  leaf: '#CFE9D4',
  water: '#9CC8F2',
  white: '#FFFFFF',
  night: '#0F1530',
};
export const TYPE = '"Inter Variable", "Helvetica Neue", Arial, sans-serif';
export const AR = '"Amiri", serif';

export type SWord = {t: string; c: 'r' | 'g' | 't' | null; s: number; e: number};
export type SLine = {key: string; group: string; s: number; e: number; words: SWord[]};
export const LINES = ST.lines as SLine[];

export const L = (k: string) => {
  const l = LINES.find((x) => x.key === k);
  if (!l) throw new Error(`no line ${k}`);
  return l;
};
export const s = (k: string) => L(k).s;
export const e = (k: string) => L(k).e;
const n = (x: string) => x.toLowerCase().replace(/[^a-z0-9]/g, '');
/** Start of the `nth` word of line k that starts with `word`. */
export const w = (k: string, word: string, nth = 0) => {
  const hits = L(k).words.filter((x) => n(x.t).startsWith(n(word)));
  if (!hits[nth]) throw new Error(`no word ${word} in ${k}`);
  return hits[nth].s;
};
