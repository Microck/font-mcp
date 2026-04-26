import { getConfig } from '../config.js';
/**
 * Generates CSS and Tailwind configuration snippets for web fonts.
 * Supports both free (Google Fonts) and paid/self-hosted font setups.
 */
export class ConfigGeneratorService {
    /**
     * Generates a Tailwind CSS fontFamily extension snippet for the given font.
     * @param fontName - Display name of the font (e.g. "Inter").
     * @returns Tailwind config extension as a string.
     */
    async generateTailwindConfig(fontName) {
        const safeName = fontName.replace(/ /g, '-').toLowerCase();
        const familyName = fontName;
        const snippet = `
// tailwind.config.js extension
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        '${safeName}': ['"${familyName}"', 'sans-serif'],
      }
    }
  }
}
`;
        return snippet.trim();
    }
    /**
     * Generates a self-hosted @font-face CSS block for the given font.
     * For free fonts without a paid flag, falls back to a Google Fonts @import.
     * @param fontName - Display name of the font.
     * @param isPaid - Whether the font requires a commercial license.
     * @returns CSS @font-face block or Google Fonts @import as a string.
     */
    async generateCssSetup(fontName, isPaid) {
        const config = getConfig();
        const familyName = fontName;
        const fileName = fontName.replace(/ /g, '');
        if (isPaid || !config.allowFreeFontsFallback) {
            return `
@font-face {
  font-family: '${familyName}';
  src: url('/fonts/${fileName}/${fileName}-Regular.woff2') format('woff2'),
       url('/fonts/${fileName}/${fileName}-Regular.woff') format('woff');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: '${familyName}';
  src: url('/fonts/${fileName}/${fileName}-Bold.woff2') format('woff2'),
       url('/fonts/${fileName}/${fileName}-Bold.woff') format('woff');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
`.trim();
        }
        else {
            return `
/* 
   SETUP FOR FREE FONT: ${fontName}
*/
@import url('https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:wght@400;700&display=swap');

body {
    font-family: '${familyName}', sans-serif;
}
`.trim();
        }
    }
}
