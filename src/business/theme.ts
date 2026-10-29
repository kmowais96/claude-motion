import timeline from '../../business/timeline.json';
import {clamp01, easeOut} from '../lib';

export const BT = timeline;
export const BFPS = BT.fps;
export const BW = 1080;
export const BH = 1920;

export const P = {
  bg: '#0A1310',
  panel: '#12211B',
  panelHi: '#1A2E26',
  line: 'rgba(243,238,223,0.12)',
  cream: '#F3EEDF',
  creamDim: 'rgba(243,238,223,0.66)',
  muted: 'rgba(243,238,223,0.38)',
  gold: '#D8B25A',
  goldHi: '#F0CF84',
  green: '#3E9B73',
  red: '#D2573F',
  ink: '#0A1310',
};

export const FN = {
  serif: '"Instrument Serif", Georgia, serif',
  sans: '"Inter Variable", Inter, system-ui, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
};

/** 0→1 ease-out ramp starting at `t0` lasting `d` seconds. */
export const rise = (t: number, t0: number, d = 0.45) => easeOut(clamp01((t - t0) / d));
