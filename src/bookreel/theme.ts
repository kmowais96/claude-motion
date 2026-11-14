import {useEffect, useState} from 'react';
import {continueRender, delayRender} from 'remotion';

/** Palette and fonts for every BookReel. Nothing else in src/bookreel/ names a colour or a font. */
export const P = {
  cream: '#F4ECDD',
  ink: '#1B1A17',
  gold: '#D9A441',
  red: '#C8442B',
  inkSoft: 'rgba(27,26,23,0.62)',
  inkFaint: 'rgba(27,26,23,0.18)',
  creamSoft: 'rgba(244,236,221,0.42)',
  goldWash: 'rgba(217,164,65,0.6)',
  shadow: 'rgba(27,26,23,0.28)',
};

export const T = {
  serif: '"EB Garamond", Georgia, serif',
  sans: '"Inter Variable", Inter, system-ui, sans-serif',
  arabic: 'Amiri, serif',
  quran: '"Amiri Quran", Amiri, serif',
};

/** Safe area for Instagram's interface on a 1080x1920 Reel. */
export const SAFE = {left: 90, right: 990, top: 270, bottom: 1500};

export const useBookFonts = () => {
  const [handle] = useState(() => delayRender('bookreel fonts'));
  useEffect(() => {
    Promise.all([
      document.fonts.load('500 60px "EB Garamond"'),
      document.fonts.load('600 60px "EB Garamond"'),
      document.fonts.load('italic 600 60px "EB Garamond"'),
      document.fonts.load('italic 500 60px "EB Garamond"'),
      document.fonts.load('600 20px "Inter Variable"'),
      document.fonts.load('700 60px Amiri', 'الله ﷺ رضي عنه'),
      document.fonts.load('400 60px "Amiri Quran"', 'ٱللَّهُ'),
    ]).then(() => continueRender(handle));
  }, [handle]);
};
