import fs from 'fs/promises';
import path from 'path';

export class ConfigGeneratorService {
    
    async generateTailwindConfig(fontName: string, format: 'modern' | 'legacy' = 'modern'): Promise<string> {
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

    async generateCssSetup(fontName: string, isPaid: boolean): Promise<string> {
        const familyName = fontName;
        const fileName = fontName.replace(/ /g, '');
        
        if (isPaid) {
            return `
/* 
   SETUP INSTRUCTIONS FOR PAID FONT: ${fontName}
   1. Buy/License the font from the foundry.
   2. Download the webfont files (.woff2, .woff).
   3. Place them in: /public/fonts/${fileName}/
*/

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
        } else {
             return `
/* 
   SETUP FOR FREE FONT: ${fontName}
   (Assuming Google Fonts import for simplicity, or download)
*/
@import url('https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:wght@400;700&display=swap');

body {
    font-family: '${familyName}', sans-serif;
}
`.trim();
        }
    }
}
