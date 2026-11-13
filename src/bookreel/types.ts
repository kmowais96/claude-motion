export type Word = {w: string; style: 'n' | 'gold' | 'red'; t?: number};
export type Chunk = {start: number; words: Word[]};
export type Arabic = {kind: 'ayah' | 'his'; text: string; ref: string; y: number; start: number};
export type Scene = {
  start: number;
  end: number;
  still: string;
  hook: boolean;
  turn: boolean;
  y: number;
  chunks: Chunk[];
  arabic: Arabic | null;
};
/** Written by scripts/bookreel.py to public/bookreel/<id>/timeline.json. */
export type Reel = {
  fps: number;
  duration: number;
  id: string;
  number: number;
  total: number;
  series: string;
  book: string;
  /** A printed page, or a reference such as "no. 5075" for a Reel outside the series. */
  page: number | string;
  handle: string;
  hook: Word[];
  action: Word[];
  next: string;
  cover: {still: string; y: number};
  turn: number;
  endAt: number;
  scenes: Scene[];
};

export const EMPTY: Reel = {
  fps: 30,
  duration: 4,
  id: 'empty',
  number: 0,
  total: 72,
  series: 'IBN AL-QAYYIM',
  book: 'Tuhfat al-Mawdud',
  page: 0,
  handle: '@TheTazkiyyahGuide',
  hook: [{w: 'Run scripts/bookreel.py first.', style: 'n'}],
  action: [{w: 'Run scripts/bookreel.py first.', style: 'n'}],
  next: '',
  cover: {still: '', y: 1180},
  turn: 0,
  endAt: 0,
  scenes: [],
};
