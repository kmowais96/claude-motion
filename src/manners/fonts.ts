import {useEffect, useState} from 'react';
import {continueRender, delayRender} from 'remotion';

export const useMannersFonts = () => {
  const [handle] = useState(() => delayRender('manners fonts'));
  useEffect(() => {
    Promise.all([
      document.fonts.load('800 80px "Baloo 2"'),
      document.fonts.load('700 30px "Baloo 2"'),
      document.fonts.load('600 30px "Baloo 2"'),
    ]).then(() => continueRender(handle));
  }, [handle]);
};
