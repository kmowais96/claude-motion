import timeline from './timeline.json';
import {SpringConfig} from 'remotion';
import {clamp01, easeInOut, prog, sp} from '../lib';

export const CT = timeline;
export const CFPS = CT.fps;
export const CW = 1080;
export const CH = 1920;
export const P = CT.phrases;

export const K = {
  cream: '#ECE4DA',
  creamDim: 'rgba(236,228,218,0.62)',
  creamFaint: 'rgba(236,228,218,0.22)',
  green: '#1C4B36',
  greenHi: '#2A6A4C',
  ink: '#12100C',
  inkDim: 'rgba(18,16,12,0.55)',
  inkFaint: 'rgba(18,16,12,0.16)',
  gold: '#E2CF9F',
  goldDeep: '#B89A55',
  smoke: '#7E786E',
  ash: '#4A4640',
  heavy: '#6E5A3A',
};

export const KF = {
  serif: '"Instrument Serif", Georgia, serif',
  sans: '"Inter Variable", Inter, system-ui, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
};

/** Scene starts (the wipe begins here). */
export const S = {
  hook: 0,
  intro: P[2].t0 - 0.15,
  c1: P[3].t0 - 0.4,
  c2: P[8].t0 - 0.4,
  c3: P[11].t0 - 0.4,
  c4: P[14].t0 - 0.4,
  c5: P[17].t0 - 0.4,
  recap: P[19].t0 - 0.45,
  end: P[21].t1 + 1.4,
};
export const WIPE = 0.5;

/** Heart damage, one value per corrupter, and the final restore. */
export const damage = (t: number) => {
  const r = prog(t, P[21].t0 + 0.05, P[21].t0 + 1.0, easeInOut);
  const d = [
    prog(t, P[4].t0 + 0.4, P[5].t1, easeInOut),
    prog(t, P[10].t0 + 0.3, P[10].t1 + 0.2, easeInOut),
    prog(t, P[13].t0 + 0.05, P[13].t0 + 0.55, (x) => 1 - Math.pow(1 - x, 3)),
    prog(t, P[16].t0 - 0.1, P[16].t1 + 0.2, easeInOut),
    prog(t, P[18].t0 + 0.2, P[18].t1 + 0.2, easeInOut),
  ];
  return {d: d.map((v) => v * (1 - r)), r};
};

export const mix = (a: string, b: string, k: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const kk = clamp01(k);
  return (
    '#' +
    pa
      .map((v, i) => Math.round(v + (pb[i] - v) * kk).toString(16).padStart(2, '0'))
      .join('')
  );
};

/** Spring at this video's fps (the shared `sp` defaults to the example's 60 fps). */
export const csp = (frame: number, startSec: number, config: Partial<SpringConfig> = {}) =>
  sp(frame, startSec, config, CFPS);
