#!/usr/bin/env node
/**
 * Direct Font Downloader
 * Uses specific search patterns to find and download fonts
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const fontsToDownload = [
  'Akkurat',
  'Akkurat Mono',
  'DIN 2014',
  'FF DIN',
  'DIN Condensed',
  'Eurostile',
  'Bank Gothic',
  'Microgramma',
  'Klavika',
  'The Future',
  'Kontrapunkt',
  'Purista',
  'Vafle',
  'Benchmark',
  'Beau Sans',
  'Blender',
  'QType',
  'T-Star Mono',
  'Biome',
  'Input Mono',
  'Ingram Mono',
  'AOT Serial Mono',
  'Fairline Mono',
  'OCR-B',
  'FF Meta',
  'Quadraat Sans',
  'Museo Sans',
  'Intel Clear Sans'
];

const OUTPUT_DIR = './public/fonts';

// Search patterns based on Reddit tips
function generateSearchUrls(fontName) {
  const cleanName = fontName.replace(/\s+/g, '');
  const kebabName = fontName.replace(/\s+/g, '-');
  const lowerName = fontName.toLowerCase().replace(/\s+/g, '');
  
  const urls = [];
  
  // Direct patterns
  const extensions = ['.ttf', '.otf', '.woff2', '.woff'];
  
  for (const ext of extensions) {
    // GitHub raw patterns
    urls.push(`https://raw.githubusercontent.com/Desuvit/Fonts/main/${cleanName}${ext}`);
    urls.push(`https://raw.githubusercontent.com/fontsource/font-files/main/fonts/${lowerName}/${cleanName}${ext}`);
    
    // Google search equivalent results (simulated direct URLs)
    urls.push(`https://github.com/search?q=${encodeURIComponent(`${cleanName}${ext}`)}`);
    
    // VK patterns
    urls.push(`https://vk.com/search?c%5Bsection%5D=docs&q=${encodeURIComponent(`${cleanName}${ext}`)}`);
    
    // Common naming patterns
    urls.push(`https://raw.githubusercontent.com/search/${cleanName}${ext}`);
    urls.push(`https://raw.githubusercontent.com/fonts/${cleanName}/main/${cleanName}${ext}`);
    urls.push(`https://raw.githubusercontent.com/fonts/${cleanName}/master/${cleanName}${ext}`);
  }
  
  return urls;
}

async function testUrl(url) {
  try {
    const response = await axios.head(url, {
      timeout: 5000,
      validateStatus: (status) => status >= 200 && status < 400
    });
    return response.status >= 200 && response.status < 400;
  } catch (e) {
    return false;
  }
}

async function downloadFont(url, fontName) {
  const cleanName = fontName.replace(/\s+/g, '-').toLowerCase();
  const ext = path.extname(url) || '.ttf';
  const fileName = `${cleanName}${ext}`;
  const destPath = path.join(OUTPUT_DIR, cleanName, fileName);
  
  try {
    await fs.mkdir(path.dirname(destPath), { recursive: true });
    
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000,
      validateStatus: (status) => status >= 200 && status < 400
    });
    
    await fs.writeFile(destPath, response.data);
    console.log(`✓ Downloaded: ${fontName} -> ${destPath}`);
    return true;
  } catch (e) {
    console.error(`✗ Failed: ${fontName} from ${url}`);
    return false;
  }
}

async function huntFont(fontName) {
  console.log(`\n🔍 Hunting for: ${fontName}`);
  const urls = generateSearchUrls(fontName);
  
  for (const url of urls) {
    if (await testUrl(url)) {
      console.log(`  Found: ${url}`);
      if (await downloadFont(url, fontName)) {
        return true;
      }
    }
  }
  
  console.log(`  ❌ Could not find ${fontName}`);
  return false;
}

async function main() {
  console.log('🎯 Font Hunter - Direct Download Script');
  console.log(`📁 Output directory: ${OUTPUT_DIR}`);
  console.log(`📝 Fonts to download: ${fontsToDownload.length}`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const font of fontsToDownload) {
    const success = await huntFont(font);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
    
    // Small delay to be respectful
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📊 Results:');
  console.log(`  ✓ Success: ${successCount}`);
  console.log(`  ✗ Failed: ${failCount}`);
  console.log(`  📁 Check ${OUTPUT_DIR} for downloaded fonts`);
}

main().catch(console.error);
