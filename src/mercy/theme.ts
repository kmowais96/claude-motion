import {SpringConfig} from 'remotion';
import timeline from './timeline.json';
import {sp as spBase} from '../lib';

export const MT = timeline;
export const MFPS = MT.fps;
export const MW = 1080;
export const MH = 1920;

/** Palette for the mercy reel: warm paper on near-black, one red, one gold. */
export const M = {
  bg: '#181614',
  bgWarm: '#201C18',
  cream: '#ECE4D6',
  creamDim: 'rgba(236,228,214,0.66)',
  muted: 'rgba(236,228,214,0.40)',
  faint: 'rgba(236,228,214,0.14)',
  line: 'rgba(236,228,214,0.22)',
  paper: '#DED4C3',
  ink: '#1D1814',
  red: '#B5302E',
  redHi: '#D2433D',
  gold: '#E4BD7D',
  goldHi: '#F6DCA8',
  goldDeep: '#B9853F',
  navy: '#1B2133',
  navyHi: '#2A3552',
  land: '#B7AC9A',
  ocean: '#1E293C',
  block: '#2E2A27',
  blockHi: '#3D3834',
};

export const MF = {
  serif: '"Instrument Serif", Georgia, serif',
  sans: '"Inter Variable", Inter, system-ui, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
};

export const HANDLE = '@TheTazkiyyahGuide';

export const msp = (frame: number, startSec: number, config: Partial<SpringConfig> = {}) =>
  spBase(frame, startSec, config, MFPS);

export const POP: Partial<SpringConfig> = {damping: 10, stiffness: 210, mass: 0.7};
export const HEAVY: Partial<SpringConfig> = {damping: 17, stiffness: 170, mass: 0.9};
export const SETTLE: Partial<SpringConfig> = {damping: 14, stiffness: 140, mass: 0.8};

/** Visibility of a scene window with short overlapping fades. */
export const win = (t: number, a: number, b: number, fin = 0.35, fout = 0.3) =>
  Math.max(0, Math.min(1, (t - a) / fin, (b - t) / fout));
