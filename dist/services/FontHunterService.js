import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { getConfig } from '../config.js';
export class FontHunterService {
    sources = [
        {
            name: 'GitHub Raw Files',
            searchUrl: 'https://raw.githubusercontent.com/search',
            directUrlPattern: 'https://raw.githubusercontent.com/username/repo/refs/heads/main/fonts'
        },
        {
            name: 'Internet Archive',
            searchUrl: 'https://archive.org/advancedsearch.php',
            directUrlPattern: 'https://archive.org/download/{name}/{name}.zip'
        },
        {
            name: 'NPM Registry (webfonts)',
            searchUrl: 'https://www.npmjs.com/search?q={name}',
            directUrlPattern: 'https://unpkg.com/{name}/fonts'
        },
        {
            name: 'CDN Fonts',
            searchUrl: 'https://cdn.jsdelivr.net/gh/search',
            directUrlPattern: 'https://cdn.jsdelivr.net/gh/{repo}/{path}'
        },
        {
            name: 'Font Squirrel',
            searchUrl: 'https://www.fontsquirrel.com/search?q={name}'
        },
        {
            name: 'Google Search Patterns',
            searchUrl: 'https://www.google.com/search?q={name}'
        },
        {
            name: 'VK (Vkontakte)',
            searchUrl: 'https://vk.com/search?c%5Bsection%5D=communities&q={name}'
        },
        {
            name: 'Open Directories',
            searchUrl: 'https://www.google.com/search?q=intitle%3A%22index+of%22+fonts+{name}'
        }
    ];
    fontExtensions = ['.woff2', '.woff', '.ttf', '.otf', '.eot'];
    fontWeights = ['Regular', 'Bold', 'Medium', 'Light', 'Black', 'Thin', 'ExtraBold', 'SemiBold'];
    fontStyles = ['Italic', 'Normal'];
    async findFontFile(fontName) {
        const config = getConfig();
        const cleanName = fontName.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
        const keywords = this.generateSearchKeywords(fontName);
        console.error(`[FontHunter] Searching for font: ${fontName}`);
        const directMatch = await this.tryDirectPatterns(cleanName);
        if (directMatch)
            return directMatch;
        const searchMatch = await this.tryGoogleSearchPatterns(fontName, cleanName, keywords);
        if (searchMatch)
            return searchMatch;
        const sourceMatch = await this.searchAllSources(fontName, cleanName, keywords);
        if (sourceMatch)
            return sourceMatch;
        const cdnMatch = await this.tryCdnPatterns(cleanName);
        if (cdnMatch)
            return cdnMatch;
        const archiveMatch = await this.tryArchivePatterns(cleanName);
        if (archiveMatch)
            return archiveMatch;
        return null;
    }
    async tryDirectPatterns(cleanName) {
        for (const weight of this.fontWeights) {
            for (const ext of this.fontExtensions) {
                const url = this.tryDirectPattern(cleanName, weight, ext);
                if (await this.testUrl(url)) {
                    console.error(`[FontHunter] Found via direct pattern: ${url}`);
                    return url;
                }
            }
        }
        return null;
    }
    async searchAllSources(fontName, cleanName, keywords) {
        for (const source of this.sources) {
            console.error(`[FontHunter] Trying source: ${source.name}`);
            const urls = await this.searchSource(source, fontName, cleanName, keywords);
            for (const url of urls) {
                if (await this.testUrl(url)) {
                    console.error(`[FontHunter] Found via ${source.name}: ${url}`);
                    return url;
                }
            }
        }
        return null;
    }
    async tryCdnPatterns(cleanName) {
        const cdnUrls = this.generateCdnPatterns(cleanName);
        for (const url of cdnUrls) {
            if (await this.testUrl(url)) {
                console.error(`[FontHunter] Found via CDN: ${url}`);
                return url;
            }
        }
        return null;
    }
    async tryArchivePatterns(cleanName) {
        const archiveUrls = this.generateArchivePatterns(cleanName);
        for (const url of archiveUrls) {
            if (await this.testUrl(url)) {
                console.error(`[FontHunter] Found via archive: ${url}`);
                return url;
            }
        }
        return null;
    }
    async tryGoogleSearchPatterns(fontName, cleanName, keywords) {
        console.error(`[FontHunter] Trying Google/Browser search patterns`);
        const searchPatterns = this.generateGoogleSearchPatterns(fontName, cleanName, keywords);
        for (const pattern of searchPatterns) {
            if (await this.testUrl(pattern.url)) {
                console.error(`[FontHunter] Found via Google search pattern: ${pattern.url}`);
                return pattern.url;
            }
        }
        return null;
    }
    generateGoogleSearchPatterns(fontName, cleanName, keywords) {
        const patterns = [];
        for (const keyword of keywords) {
            for (const ext of this.fontExtensions) {
                patterns.push({
                    url: `https://raw.githubusercontent.com/search?q=${encodeURIComponent(keyword + ext)}`,
                    query: `site:github.com "${keyword}" filetype:${ext.replace('.', '')}`
                });
                patterns.push({
                    url: `https://vk.com/search?c%5Bsection%5D=statuses&q=${encodeURIComponent(keyword + ext)}`,
                    query: `site:vk.com "${keyword}" "${ext}"`
                });
                patterns.push({
                    url: `https://www.google.com/search?q=${encodeURIComponent('intitle:"index of" "fonts" ' + keyword + ext)}`,
                    query: `intitle:"index of" "fonts" "${keyword}${ext}"`
                });
                patterns.push({
                    url: `https://gitlab.com/search?search=${encodeURIComponent(keyword + ext)}`,
                    query: `site:gitlab.com "${keyword}" filetype:${ext.replace('.', '')}`
                });
                patterns.push({
                    url: `https://bitbucket.org/search?q=${encodeURIComponent(keyword + ext)}`,
                    query: `site:bitbucket.org "${keyword}" filetype:${ext.replace('.', '')}`
                });
                patterns.push({
                    url: `https://raw.githubusercontent.com/${keyword}/${keyword}-${ext}`,
                    query: `site:raw.githubusercontent.com "${keyword}"`
                });
                patterns.push({
                    url: `https://cdn.jsdelivr.net/gh/${keyword}/${keyword}-${ext}`,
                    query: `site:jsdelivr.net "${keyword}"`
                });
            }
        }
        return [...new Set(patterns.map(p => p.url))].map(url => ({ url, query: '' }));
    }
    generateSearchKeywords(fontName) {
        const words = fontName.split(/\s+/);
        const variants = [fontName];
        variants.push(fontName.replace(/\s+/g, ''));
        variants.push(fontName.replace(/\s+/g, '-'));
        if (words.length > 1) {
            variants.push(words.join(''));
            variants.push(words.join('-'));
        }
        return [...new Set(variants)];
    }
    tryDirectPattern(cleanName, weight, ext) {
        const patterns = [
            `https://cdn.jsdelivr.net/gh/${cleanName}/${cleanName}-${weight}${ext}`,
            `https://raw.githubusercontent.com/search/${cleanName}-${weight}${ext}`,
            `https://unpkg.com/${cleanName}@latest/${cleanName}-${weight}${ext}`,
            `https://fonts.gstatic.com/s/${cleanName}/${cleanName}-${weight}${ext}`,
        ];
        return patterns[Math.floor(Math.random() * patterns.length)];
    }
    generateCdnPatterns(cleanName) {
        const patterns = [];
        for (const weight of this.fontWeights) {
            for (const ext of this.fontExtensions) {
                patterns.push(`https://cdn.jsdelivr.net/npm/@fontsource/${cleanName.toLowerCase()}/files/${cleanName.toLowerCase()}-${weight.toLowerCase()}${ext}`);
                patterns.push(`https://unpkg.com/${cleanName}/${weight}${ext}`);
                patterns.push(`https://cdnjs.cloudflare.com/ajax/libs/${cleanName}/${weight}${ext}`);
            }
        }
        return patterns;
    }
    generateArchivePatterns(cleanName) {
        const patterns = [];
        patterns.push(`https://archive.org/download/${cleanName}/${cleanName}.zip`);
        patterns.push(`https://archive.org/download/${cleanName.toLowerCase()}/${cleanName.toLowerCase()}.zip`);
        patterns.push(`https://gitlab.com/api/v4/projects/search?q=${cleanName}`);
        patterns.push(`https://bitbucket.org/search?q=${cleanName}`);
        return patterns;
    }
    async searchSource(source, fontName, cleanName, keywords) {
        const urls = [];
        try {
            // Generate candidate URLs based on source
            for (const keyword of keywords) {
                for (const ext of this.fontExtensions) {
                    if (source.directUrlPattern) {
                        const url = source.directUrlPattern
                            .replace('{name}', keyword)
                            .replace('{repo}', keyword)
                            .replace('{path}', `${keyword}-${ext}`);
                        urls.push(url);
                    }
                    // Try search-based URLs
                    urls.push(`${source.searchUrl}?q=${encodeURIComponent(keyword + ext)}`);
                }
            }
        }
        catch (e) {
            console.error(`[FontHunter] Error searching ${source.name}:`, e);
        }
        return urls;
    }
    async testUrl(url) {
        const config = getConfig();
        try {
            const response = await axios.head(url, {
                timeout: config.downloadTimeoutMs,
                validateStatus: (status) => status >= 200 && status < 400
            });
            return response.status >= 200 && response.status < 400;
        }
        catch (e) {
            return false;
        }
    }
    async downloadFont(url, fontName) {
        const config = getConfig();
        const cleanName = fontName.replace(/\s+/g, '-').toLowerCase();
        const outputDir = config.outputDir;
        const fileName = path.basename(url);
        const destPath = path.join(outputDir, cleanName, fileName);
        try {
            // Ensure directory exists
            await fs.mkdir(path.dirname(destPath), { recursive: true });
            const response = await axios.get(url, {
                responseType: 'arraybuffer',
                timeout: config.downloadTimeoutMs,
                validateStatus: (status) => status >= 200 && status < 400
            });
            await fs.writeFile(destPath, response.data);
            console.error(`[FontHunter] Successfully downloaded ${fontName} to ${destPath}`);
            return {
                success: true,
                filePath: destPath
            };
        }
        catch (e) {
            const errorMsg = e instanceof Error ? e.message : String(e);
            console.error(`[FontHunter] Download failed for ${url}:`, errorMsg);
            return {
                success: false,
                error: errorMsg
            };
        }
    }
    async huntWithMultipleAttempts(fontName) {
        const config = getConfig();
        console.error(`[FontHunter] Starting hunt for ${fontName} with ${config.maxDownloadAttempts} attempts`);
        for (let attempt = 1; attempt <= config.maxDownloadAttempts; attempt++) {
            console.error(`[FontHunter] Attempt ${attempt}/${config.maxDownloadAttempts}`);
            const url = await this.findFontFile(fontName);
            if (url) {
                const result = await this.downloadFont(url, fontName);
                if (result.success) {
                    return {
                        success: true,
                        filePath: result.filePath
                    };
                }
            }
            if (attempt < config.maxDownloadAttempts) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        const searchQueries = this.generateLastResortQueries(fontName);
        const lastResortInfo = this.formatLastResortMessage(fontName, searchQueries);
        await this.writeLastResortFile(fontName, lastResortInfo);
        return {
            success: false,
            lastResortInfo: lastResortInfo
        };
    }
    async writeLastResortFile(fontName, content) {
        const config = getConfig();
        const cleanName = fontName.replace(/\s+/g, '-').toLowerCase();
        const filePath = path.join(config.outputDir, cleanName, 'HUNTING_INSTRUCTIONS.txt');
        try {
            await fs.mkdir(path.dirname(filePath), { recursive: true });
            await fs.writeFile(filePath, content);
            console.error(`[FontHunter] Wrote last resort instructions to ${filePath}`);
        }
        catch (e) {
            console.error(`[FontHunter] Failed to write last resort file:`, e);
        }
    }
    generateLastResortQueries(fontName) {
        const cleanName = fontName.replace(/\s+/g, '');
        const keywords = this.generateSearchKeywords(fontName);
        const queries = [];
        for (const keyword of keywords) {
            queries.push(`site:github.com "${keyword}" (filetype:otf OR filetype:woff2 OR filetype:ttf)`);
            queries.push(`site:vk.com "${keyword}" (filetype:otf OR filetype:woff2 OR filetype:ttf)`);
            queries.push(`intitle:"index of" "fonts" "${keyword}"`);
            queries.push(`"${keyword}" filetype:otf download`);
            queries.push(`"${keyword}" filetype:woff2 download`);
            queries.push(`"${keyword}" webfont download`);
            queries.push(`"${keyword}" site:archive.org`);
        }
        return [...new Set(queries)];
    }
    formatLastResortMessage(fontName, queries) {
        const searchQueries = queries.slice(0, 10).map(q => `  - ${q}`).join('\n');
        return `
================================================================================
FONT DOWNLOAD FAILED - LAST RESORT OPTIONS
================================================================================

Could not automatically find font files for: "${fontName}"

Try these search queries manually:

${searchQueries}

================================================================================
`.trim();
    }
}
