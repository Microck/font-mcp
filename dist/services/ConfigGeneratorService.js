import { getConfig } from '../config.js';
export class ConfigGeneratorService {
    async generateTailwindConfig(fontName, format = 'modern') {
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
