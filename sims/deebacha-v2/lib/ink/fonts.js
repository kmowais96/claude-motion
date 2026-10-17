// The ink sections measure text in init(), before main.js waits for fonts: load what they use first.
let P = null;
export function loadInkFonts() {
  return P || (P = Promise.all(['italic 500 40px "Cormorant Garamond"', 'italic 400 40px "Cormorant Garamond"', '500 40px "Cormorant Garamond"', '600 40px "Cormorant Garamond"',
    '400 60px "Amiri"', '700 60px "Amiri"'].map(f => document.fonts.load(f, f.includes('Amiri') ? 'الْحَمْدُ' : 'Tarjumānī'))).then(() => document.fonts.ready));
}
