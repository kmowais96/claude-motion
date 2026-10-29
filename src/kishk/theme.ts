import timeline from './timeline.json';

export const KT = timeline;
export const KFPS = KT.fps;
export const KEY = KT.key as Record<string, number[]>;
export type KLine = {s: number; e: number; text: string; key: string};
export type KName = {s: number; hit: number; e: number; name: string};
export const LINES = KT.lines as KLine[];
export const NAMES = KT.names as KName[];
export const FINAL = KT.final as {s: number; e: number; text: string};
export const END = FINAL.e + 0.35;
