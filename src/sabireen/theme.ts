import timeline from './timeline.json';

export const T = timeline;
export const FPS = T.fps;
export const W = 1080;
export const H = 1920;

export const C = {
  bg: '#0B0E13',
  bgHi: '#141A23',
  cream: '#F2EBDD',
  creamDim: 'rgba(242,235,221,0.66)',
  muted: 'rgba(242,235,221,0.38)',
  faint: 'rgba(242,235,221,0.14)',
  line: 'rgba(242,235,221,0.12)',
  teal: '#6FC2B4',
  tealDim: 'rgba(111,194,180,0.32)',
  gold: '#E8B957',
  goldHi: '#F7D58C',
  goldGlow: 'rgba(232,185,87,',
};

export const F = {
  quran: '"Amiri Quran", "Amiri", serif',
  arabic: '"Amiri", serif',
  serif: '"Instrument Serif", Georgia, serif',
  sans: '"Inter Variable", Inter, system-ui, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
};

// Quranic text (Uthmani, as in the Madinah mushaf); each word split where its case ending starts.
export const AR = {
  moofoonStem: 'وَٱلْمُوفُ',
  moofoonRest: 'بِعَهْدِهِمْ إِذَا عَٰهَدُوا۟',
  oon: 'ونَ',
  sabirStemU: 'وَٱلصَّٰبِرُ',
  sabirStemI: 'وَٱلصَّٰبِرِ',
  een: 'ينَ',
  after: 'فِى ٱلْبَأْسَآءِ وَٱلضَّرَّآءِ وَحِينَ ٱلْبَأْسِ',
  basaa: 'فِى ٱلْبَأْسَآءِ',
  darraa: 'وَٱلضَّرَّآءِ',
  baas: 'وَحِينَ ٱلْبَأْسِ',
  term: 'النَّصْبُ عَلَى الْمَدْحِ',
  implied: 'أَمْدَحُ',
  kathir: 'وإنما نصب «والصابرين» على المدح والحث على الصبر في هذه الأحوال لشدته وصعوبته',
  examples: [
    ['ٱلْمُؤْمِنُ', 'ونَ'],
    ['ٱلْمُسْلِمُ', 'ونَ'],
    ['ٱلصَّٰدِقُ', 'ونَ'],
  ],
};
