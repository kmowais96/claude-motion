import timeline from './timeline.json';

export const GT = timeline;
export const GFPS = GT.fps;
export const KEY = GT.key as Record<string, number[]>;
export const WORD = GT.word as Record<string, number>;
export type GWord = {t: string; s: number; e: number};
export type GLine = {s: number; e: number; text: string; key: string; words: GWord[]};
export const LINES = GT.lines as GLine[];
export const END = GT.end;

export const s = (k: string) => KEY[k][0];
export const e = (k: string) => KEY[k][1];
/** Start of a spoken word, as `line.word` (see build.py). */
export const w = (k: string) => {
  if (!(k in WORD)) throw new Error(`no word ${k}`);
  return WORD[k];
};
