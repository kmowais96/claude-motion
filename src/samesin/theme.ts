import timeline from './timeline.json';
import {P as MP} from '../manners/theme';

export {FONT} from '../manners/theme';
export const ST = timeline;
export const SFPS = ST.fps;
export const END = ST.end;

/** The manners palette, plus night for the whisper and the gold of the door. */
export const P = {
  ...MP,
  night: '#1F2433',
  nightSoft: 'rgba(31,36,51,0.62)',
  glow: '#FFE7A8',
};
export const AR_FONT = '"Amiri", serif';

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
