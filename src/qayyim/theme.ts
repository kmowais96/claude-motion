import {SpringConfig} from 'remotion';
import {sp} from '../lib';

export const QW = 1080;
export const QH = 1920;

export type Card = {in: number; out: number; text: string};
export type Book = {in: number; ar: string; en: string; sub?: string};
export type ReelTimeline = {
  fps: number;
  duration: number;
  label: string;
  tag: string;
  motif: string;
  cards: Card[];
  marks: number[];
  book: Book;
};

/** Ink, parchment and lamp-gold. */
export const Q = {
  bg: '#13110E',
  bgHi: '#1C1915',
  cream: '#EFE6D2',
  creamDim: 'rgba(239,230,210,0.62)',
  muted: 'rgba(239,230,210,0.38)',
  faint: 'rgba(239,230,210,0.14)',
  gold: '#D4A85A',
  goldHi: '#EBC77E',
  goldFaint: 'rgba(212,168,90,0.16)',
};

export const QF = {
  serif: '"Instrument Serif", "Amiri", Georgia, serif',
  arabic: '"Amiri", serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
};

/** Spring at this reel's fps (lib's `sp` defaults to the 60 fps example). */
export const qsp = (frame: number, startSec: number, fps: number, config: Partial<SpringConfig> = {}) =>
  sp(frame, startSec, config, fps);
