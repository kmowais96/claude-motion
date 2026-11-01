import timeline from './timeline.json';

export const AT = timeline;
export const AFPS = AT.fps;
export const KEY = AT.key as Record<string, number[]>;
export const WORD = AT.word as Record<string, number>;
export type AWord = {t: string; s: number; e: number};
export type ALine = {s: number; e: number; text: string; key: string; words: AWord[]};
export const LINES = AT.lines as ALine[];
export const END = AT.end;

export const s = (k: string) => KEY[k][0];
export const e = (k: string) => KEY[k][1];
/** Start of a spoken word, as `line.word` (see build.py). */
export const w = (k: string) => {
  if (!(k in WORD)) throw new Error(`no word ${k}`);
  return WORD[k];
};
