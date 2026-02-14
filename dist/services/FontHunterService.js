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
        },
        {
            name: 'Foundry Trials',
            searchUrl: 'https://www.google.com/search?q={name}+trial+fonts'
        },
        {
            name: 'GetTheFont.com',
            searchUrl: 'https://getthefont.com/search?q={name}',
            directUrlPattern: 'https://getthefont.com/font/{name}'
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
        // Try Google search for fonts
        const googleMatches = await this.searchGoogleForFonts(fontName);
        if (googleMatches.length > 0) {
            // Test the first valid URL
            for (const url of googleMatches) {
                if (await this.testUrl(url)) {
                    console.error(`[FontHunter] Found via Google search: ${url}`);
                    return url;
                }
            }
        }
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
                // Only test if it looks like a font URL
                if (this.isFontUrl(url) && await this.testUrl(url)) {
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
                // Only test URLs that look like font files
                if (this.isFontUrl(url) && await this.testUrl(url)) {
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
            if (this.isFontUrl(url) && await this.testUrl(url)) {
                console.error(`[FontHunter] Found via CDN: ${url}`);
                return url;
            }
        }
        return null;
    }
    async tryArchivePatterns(cleanName) {
        const archiveUrls = this.generateArchivePatterns(cleanName);
        for (const url of archiveUrls) {
            if (this.isFontUrl(url) && await this.testUrl(url)) {
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
            if (this.isFontUrl(pattern.url) && await this.testUrl(pattern.url)) {
                console.error(`[FontHunter] Found via Google search pattern: ${pattern.url}`);
                return pattern.url;
            }
        }
        return null;
    }
    generateGoogleSearchPatterns(fontName, cleanName, keywords) {
        const patterns = [];
        for (const keyword of keywords) {
            // Primary search: [Font name].ttf OR [Font name].otf
            patterns.push({
                url: `https://www.google.com/search?q=${encodeURIComponent(`"${keyword}.ttf" OR "${keyword}.otf"`)}`,
                query: `"${keyword}.ttf" OR "${keyword}.otf"`
            });
            // Alternative searches for vk.com
            patterns.push({
                url: `https://www.google.com/search?q=${encodeURIComponent(`site:vk.com "${keyword}.ttf"`)}`,
                query: `site:vk.com "${keyword}.ttf"`
            });
            patterns.push({
                url: `https://www.google.com/search?q=${encodeURIComponent(`site:vk.com "${keyword}.otf"`)}`,
                query: `site:vk.com "${keyword}.otf"`
            });
            // Alternative searches for GitHub
            patterns.push({
                url: `https://www.google.com/search?q=${encodeURIComponent(`intitle:"${keyword}.ttf" github`)}`,
                query: `intitle:"${keyword}.ttf" github`
            });
            patterns.push({
                url: `https://www.google.com/search?q=${encodeURIComponent(`site:github.com "${keyword}.ttf"`)}`,
                query: `site:github.com "${keyword}.ttf"`
            });
            patterns.push({
                url: `https://www.google.com/search?q=${encodeURIComponent(`site:github.com "${keyword}.otf"`)}`,
                query: `site:github.com "${keyword}.otf"`
            });
            // Search for raw GitHub URLs directly
            patterns.push({
                url: `https://raw.githubusercontent.com/search?q=${encodeURIComponent(keyword + '.ttf')}`,
                query: `site:raw.githubusercontent.com "${keyword}.ttf"`
            });
            patterns.push({
                url: `https://raw.githubusercontent.com/search?q=${encodeURIComponent(keyword + '.otf')}`,
                query: `site:raw.githubusercontent.com "${keyword}.otf"`
            });
            // VK specific searches
            patterns.push({
                url: `https://vk.com/search?c%5Bsection%5D=statuses&q=${encodeURIComponent(keyword + '.ttf')}`,
                query: `site:vk.com "${keyword}" ".ttf"`
            });
            patterns.push({
                url: `https://vk.com/search?c%5Bsection%5D=statuses&q=${encodeURIComponent(keyword + '.otf')}`,
                query: `site:vk.com "${keyword}" ".otf"`
            });
            // Open directory searches
            patterns.push({
                url: `https://www.google.com/search?q=${encodeURIComponent('intitle:"index of" "fonts" ' + keyword + '.ttf')}`,
                query: `intitle:"index of" "fonts" "${keyword}.ttf"`
            });
            patterns.push({
                url: `https://www.google.com/search?q=${encodeURIComponent('intitle:"index of" "fonts" ' + keyword + '.otf')}`,
                query: `intitle:"index of" "fonts" "${keyword}.otf"`
            });
            // GetTheFont.com search
            patterns.push({
                url: `https://getthefont.com/search?q=${encodeURIComponent(keyword)}`,
                query: `site:getthefont.com "${keyword}"`
            });
            // Try variations with font weights
            for (const weight of this.fontWeights) {
                patterns.push({
                    url: `https://www.google.com/search?q=${encodeURIComponent(`site:github.com "${keyword}-${weight}.ttf"`)}`,
                    query: `site:github.com "${keyword}-${weight}.ttf"`
                });
                patterns.push({
                    url: `https://www.google.com/search?q=${encodeURIComponent(`site:github.com "${keyword}-${weight}.otf"`)}`,
                    query: `site:github.com "${keyword}-${weight}.otf"`
                });
                patterns.push({
                    url: `https://www.google.com/search?q=${encodeURIComponent(`site:vk.com "${keyword}-${weight}.ttf"`)}`,
                    query: `site:vk.com "${keyword}-${weight}.ttf"`
                });
            }
            // GitLab and BitBucket
            patterns.push({
                url: `https://gitlab.com/search?search=${encodeURIComponent(keyword + '.ttf')}`,
                query: `site:gitlab.com "${keyword}" filetype:ttf`
            });
            patterns.push({
                url: `https://gitlab.com/search?search=${encodeURIComponent(keyword + '.otf')}`,
                query: `site:gitlab.com "${keyword}" filetype:otf`
            });
            patterns.push({
                url: `https://bitbucket.org/search?q=${encodeURIComponent(keyword + '.ttf')}`,
                query: `site:bitbucket.org "${keyword}" filetype:ttf`
            });
            // CDN patterns
            patterns.push({
                url: `https://raw.githubusercontent.com/${keyword}/${keyword}-Regular.ttf`,
                query: `site:raw.githubusercontent.com "${keyword}"`
            });
            patterns.push({
                url: `https://cdn.jsdelivr.net/gh/${keyword}/${keyword}-Regular.ttf`,
                query: `site:jsdelivr.net "${keyword}"`
            });
            // Archive.org searches
            patterns.push({
                url: `https://archive.org/search?query=${encodeURIComponent(`${keyword} font ttf`)}`,
                query: `site:archive.org "${keyword}" "ttf"`
            });
            patterns.push({
                url: `https://archive.org/search?query=${encodeURIComponent(`${keyword} font otf`)}`,
                query: `site:archive.org "${keyword}" "otf"`
            });
        }
        return [...new Set(patterns.map(p => p.url))].map(url => ({ url, query: '' }));
    }
    /**
     * Search for fonts using Google search patterns
     * This method tries multiple Google dork patterns to find font files
     */
    async searchGoogleForFonts(fontName) {
        console.error(`[FontHunter] Searching Google for font: ${fontName}`);
        const cleanName = fontName.replace(/\s+/g, '');
        const keywords = this.generateSearchKeywords(fontName);
        const foundUrls = [];
        // Define Google search queries to try
        const searchQueries = [
            // Primary: [Font name].ttf OR [Font name].otf
            `"${cleanName}.ttf" OR "${cleanName}.otf"`,
            // vk.com searches
            `site:vk.com "${cleanName}.ttf"`,
            `site:vk.com "${cleanName}.otf"`,
            // GitHub searches
            `intitle:"${cleanName}.ttf" github`,
            `site:github.com "${cleanName}.ttf"`,
            `site:github.com "${cleanName}.otf"`,
            // Archive.org
            `site:archive.org "${cleanName}" "ttf"`,
            `site:archive.org "${cleanName}" "otf"`,
            // Open directories
            `intitle:"index of" "fonts" "${cleanName}"`,
            // GetTheFont.com
            `site:getthefont.com "${cleanName}"`,
            // Try variations
            ...keywords.flatMap(kw => [
                `"${kw}.ttf" OR "${kw}.otf"`,
                `site:github.com "${kw}.ttf"`,
                `site:vk.com "${kw}.ttf"`,
            ])
        ];
        // Remove duplicates
        const uniqueQueries = [...new Set(searchQueries)];
        for (const query of uniqueQueries) {
            try {
                console.error(`[FontHunter] Trying Google search: ${query}`);
                // Construct Google search URL
                const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
                // Fetch search results
                const response = await axios.get(searchUrl, {
                    timeout: 10000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                        'Accept-Language': 'en-US,en;q=0.5',
                    },
                    validateStatus: (status) => status === 200
                });
                // Extract font URLs from search results
                const urls = this.extractFontUrlsFromHtml(response.data, cleanName, keywords);
                for (const url of urls) {
                    if (await this.testUrl(url)) {
                        console.error(`[FontHunter] Found valid font URL via Google: ${url}`);
                        foundUrls.push(url);
                    }
                }
                // If we found enough URLs, return them
                if (foundUrls.length >= 5) {
                    break;
                }
                // Small delay to be respectful
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            catch (e) {
                console.error(`[FontHunter] Google search failed for query "${query}":`, e);
            }
        }
        return foundUrls;
    }
    /**
     * Extract font file URLs from HTML content
     */
    extractFontUrlsFromHtml(html, cleanName, keywords) {
        const urls = [];
        // Pattern to match GitHub raw URLs
        const githubRawPattern = /https:\/\/raw\.githubusercontent\.com\/[^"\s<>]+\.(ttf|otf|woff2|woff)/gi;
        const githubMatches = html.match(githubRawPattern);
        if (githubMatches) {
            console.error(`[FontHunter] Found ${githubMatches.length} GitHub raw URLs`);
            urls.push(...githubMatches);
        }
        // Pattern to match GitHub blob URLs (need to convert to raw)
        const githubBlobPattern = /https:\/\/github\.com\/([^"\s<>]+)\/blob\/([^"\s<>]+\.)(ttf|otf|woff2|woff)/gi;
        let blobMatch;
        while ((blobMatch = githubBlobPattern.exec(html)) !== null) {
            const rawUrl = blobMatch[0].replace('/blob/', '/raw/');
            urls.push(rawUrl);
        }
        // Pattern to match any font URLs
        const fontUrlPattern = /https?:\/\/[^"\s<>]+\.(ttf|otf|woff2|woff)/gi;
        const fontMatches = html.match(fontUrlPattern);
        if (fontMatches) {
            console.error(`[FontHunter] Found ${fontMatches.length} font URLs`);
            urls.push(...fontMatches);
        }
        // Pattern for archive.org direct download links
        const archivePattern = /https:\/\/archive\.org\/download\/[^"\s<>]+\.(ttf|otf|woff2|woff|zip)/gi;
        const archiveMatches = html.match(archivePattern);
        if (archiveMatches) {
            console.error(`[FontHunter] Found ${archiveMatches.length} Archive.org URLs`);
            urls.push(...archiveMatches);
        }
        // Pattern for GetTheFont.com
        const gtfPattern = /https:\/\/getthefont\.com\/[^"\s<>]+/gi;
        const gtfMatches = html.match(gtfPattern);
        if (gtfMatches) {
            urls.push(...gtfMatches);
        }
        // Remove duplicates and filter by font name relevance
        const uniqueUrls = [...new Set(urls)];
        const relevantUrls = uniqueUrls.filter(url => {
            const lowerUrl = url.toLowerCase();
            const lowerName = cleanName.toLowerCase();
            return lowerUrl.includes(lowerName) ||
                keywords.some((kw) => lowerUrl.includes(kw.toLowerCase()));
        });
        const finalUrls = relevantUrls.length > 0 ? relevantUrls : uniqueUrls;
        console.error(`[FontHunter] Extracted ${finalUrls.length} unique font URLs from HTML`);
        return finalUrls;
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
    isFontUrl(url) {
        const fontExtensions = ['.ttf', '.otf', '.woff', '.woff2', '.eot'];
        const lowerUrl = url.toLowerCase();
        return fontExtensions.some(ext => lowerUrl.endsWith(ext));
    }
    async testUrl(url) {
        const config = getConfig();
        // Only test URLs that actually look like font files
        if (!this.isFontUrl(url)) {
            console.error(`[FontHunter] Skipping non-font URL: ${url}`);
            return false;
        }
        try {
            const response = await axios.head(url, {
                timeout: config.downloadTimeoutMs,
                validateStatus: (status) => status >= 200 && status < 400
            });
            // Check content type to ensure it's a font file
            const contentType = response.headers['content-type'] || '';
            const isFontContent = contentType.includes('font') ||
                contentType.includes('octet-stream') ||
                contentType.includes('application/x-font') ||
                contentType === '' || // Some servers don't set content-type
                this.isFontUrl(url);
            if (!isFontContent) {
                console.error(`[FontHunter] URL returned non-font content-type: ${contentType}`);
                return false;
            }
            return response.status >= 200 && response.status < 400;
        }
        catch (e) {
            return false;
        }
    }
    isValidFontBuffer(buffer) {
        // Check font file magic bytes
        if (buffer.length < 4)
            return false;
        // TrueType / OpenType (ttf/otf)
        if (buffer[0] === 0x00 && buffer[1] === 0x01 && buffer[2] === 0x00 && buffer[3] === 0x00)
            return true;
        // OpenType with CFF (otf)
        if (buffer[0] === 0x4F && buffer[1] === 0x54 && buffer[2] === 0x54 && buffer[3] === 0x4F)
            return true;
        // WOFF
        if (buffer[0] === 0x77 && buffer[1] === 0x4F && buffer[2] === 0x46 && buffer[3] === 0x46)
            return true;
        // WOFF2
        if (buffer[0] === 0x77 && buffer[1] === 0x4F && buffer[2] === 0x46 && buffer[3] === 0x32)
            return true;
        // EOT
        if (buffer[0] === 0x50 && buffer[1] === 0x4C && buffer[2] === 0x53 && buffer[3] === 0x59)
            return true;
        // Check if it's HTML (should reject)
        const header = buffer.slice(0, 100).toString('utf-8').toLowerCase();
        if (header.includes('<!doctype html') || header.includes('<html') || header.includes('<head')) {
            console.error('[FontHunter] Rejecting HTML content');
            return false;
        }
        // If it has a font extension and reasonable size, assume it's valid
        return buffer.length > 1000;
    }
    extractFontFilename(url) {
        try {
            // Remove query parameters
            const urlWithoutQuery = url.split('?')[0];
            let fileName = path.basename(urlWithoutQuery);
            // Ensure it has a font extension
            if (!this.isFontUrl(fileName)) {
                return null;
            }
            // Clean up the filename
            fileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
            return fileName;
        }
        catch (e) {
            return null;
        }
    }
    async downloadFont(url, fontName) {
        const config = getConfig();
        const cleanName = fontName.replace(/\s+/g, '-').toLowerCase();
        const outputDir = config.outputDir;
        // Extract proper filename from URL
        let fileName = this.extractFontFilename(url);
        // If we can't extract a filename, generate one from the font name
        if (!fileName) {
            // Try to guess extension from URL
            const urlLower = url.toLowerCase();
            let ext = '.ttf';
            if (urlLower.includes('.otf'))
                ext = '.otf';
            else if (urlLower.includes('.woff2'))
                ext = '.woff2';
            else if (urlLower.includes('.woff'))
                ext = '.woff';
            fileName = `${cleanName}${ext}`;
            console.error(`[FontHunter] Generated filename: ${fileName}`);
        }
        const destPath = path.join(outputDir, cleanName, fileName);
        try {
            // Ensure directory exists
            await fs.mkdir(path.dirname(destPath), { recursive: true });
            console.error(`[FontHunter] Downloading from: ${url}`);
            const response = await axios.get(url, {
                responseType: 'arraybuffer',
                timeout: config.downloadTimeoutMs,
                validateStatus: (status) => status >= 200 && status < 400,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            const buffer = Buffer.from(response.data);
            // Validate it's actually a font file
            if (!this.isValidFontBuffer(buffer)) {
                console.error(`[FontHunter] Downloaded content is not a valid font file: ${url}`);
                return {
                    success: false,
                    error: 'Downloaded content is not a valid font file'
                };
            }
            await fs.writeFile(destPath, buffer);
            console.error(`[FontHunter] Successfully downloaded ${fontName} to ${destPath} (${buffer.length} bytes)`);
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
        console.error(`[FontHunter] Starting AGGRESSIVE hunt for ${fontName} with ${config.maxDownloadAttempts} attempts`);
        const downloadedFiles = [];
        let attemptCount = 0;
        // Strategy 1: Aggressive GitHub raw file search (no API limits)
        console.error('[FontHunter] Strategy 1: Aggressive GitHub search');
        const aggressiveGithubUrls = await this.aggressiveGitHubSearch(fontName);
        for (const url of aggressiveGithubUrls) {
            if (attemptCount >= config.maxDownloadAttempts)
                break;
            attemptCount++;
            const result = await this.downloadFont(url, fontName);
            if (result.success && result.filePath) {
                downloadedFiles.push(result.filePath);
                console.error(`[FontHunter] ✓ Downloaded from GitHub: ${url}`);
            }
        }
        // Strategy 2: Try GitHub API search
        if (downloadedFiles.length === 0 && attemptCount < config.maxDownloadAttempts) {
            console.error('[FontHunter] Strategy 2: GitHub API search');
            const githubUrls = await this.searchGitHubApi(fontName);
            for (const url of githubUrls) {
                if (attemptCount >= config.maxDownloadAttempts)
                    break;
                attemptCount++;
                const result = await this.downloadFont(url, fontName);
                if (result.success && result.filePath) {
                    downloadedFiles.push(result.filePath);
                }
            }
        }
        // Strategy 3: Aggressive Google scraping
        if (downloadedFiles.length === 0 && attemptCount < config.maxDownloadAttempts) {
            console.error('[FontHunter] Strategy 3: Aggressive Google scraping');
            const aggressiveGoogleUrls = await this.aggressiveGoogleSearch(fontName);
            for (const url of aggressiveGoogleUrls) {
                if (attemptCount >= config.maxDownloadAttempts)
                    break;
                attemptCount++;
                const result = await this.downloadFont(url, fontName);
                if (result.success && result.filePath) {
                    downloadedFiles.push(result.filePath);
                    console.error(`[FontHunter] ✓ Downloaded from Google search: ${url}`);
                }
            }
        }
        // Strategy 4: Try GetTheFont.com
        if (downloadedFiles.length === 0 && attemptCount < config.maxDownloadAttempts) {
            console.error('[FontHunter] Strategy 4: GetTheFont.com');
            const gtfUrls = await this.searchGetTheFont(fontName);
            for (const url of gtfUrls) {
                if (attemptCount >= config.maxDownloadAttempts)
                    break;
                attemptCount++;
                const result = await this.downloadFont(url, fontName);
                if (result.success && result.filePath) {
                    downloadedFiles.push(result.filePath);
                }
            }
        }
        // Strategy 5: Try Archive.org
        if (downloadedFiles.length === 0 && attemptCount < config.maxDownloadAttempts) {
            console.error('[FontHunter] Strategy 5: Archive.org');
            const archiveUrls = await this.searchArchiveOrg(fontName);
            for (const url of archiveUrls) {
                if (attemptCount >= config.maxDownloadAttempts)
                    break;
                attemptCount++;
                const result = await this.downloadFont(url, fontName);
                if (result.success && result.filePath) {
                    downloadedFiles.push(result.filePath);
                }
            }
        }
        // Strategy 6: Direct pattern matching
        if (downloadedFiles.length === 0 && attemptCount < config.maxDownloadAttempts) {
            console.error('[FontHunter] Strategy 6: Direct patterns');
            const url = await this.findFontFile(fontName);
            if (url) {
                attemptCount++;
                const result = await this.downloadFont(url, fontName);
                if (result.success && result.filePath) {
                    downloadedFiles.push(result.filePath);
                }
            }
        }
        // Strategy 7: Try well-known font repositories
        if (downloadedFiles.length === 0 && attemptCount < config.maxDownloadAttempts) {
            console.error('[FontHunter] Strategy 7: Well-known font repositories');
            const repoUrls = await this.searchFontRepositories(fontName);
            for (const url of repoUrls) {
                if (attemptCount >= config.maxDownloadAttempts)
                    break;
                attemptCount++;
                const result = await this.downloadFont(url, fontName);
                if (result.success && result.filePath) {
                    downloadedFiles.push(result.filePath);
                }
            }
        }
        // Strategy 8: Try alternative font sources (GitLab, Bitbucket, etc)
        if (downloadedFiles.length === 0 && attemptCount < config.maxDownloadAttempts) {
            console.error('[FontHunter] Strategy 8: Alternative font sources');
            const altUrls = await this.searchAlternativeSources(fontName);
            for (const url of altUrls) {
                if (attemptCount >= config.maxDownloadAttempts)
                    break;
                attemptCount++;
                const result = await this.downloadFont(url, fontName);
                if (result.success && result.filePath) {
                    downloadedFiles.push(result.filePath);
                }
            }
        }
        // Strategy 9: Try font CDN services
        if (downloadedFiles.length === 0 && attemptCount < config.maxDownloadAttempts) {
            console.error('[FontHunter] Strategy 9: Font CDN services');
            const cdnUrls = this.generateCdnServiceUrls(fontName);
            for (const url of cdnUrls) {
                if (attemptCount >= config.maxDownloadAttempts)
                    break;
                attemptCount++;
                const result = await this.downloadFont(url, fontName);
                if (result.success && result.filePath) {
                    downloadedFiles.push(result.filePath);
                }
            }
        }
        if (downloadedFiles.length > 0) {
            console.error(`[FontHunter] Successfully downloaded ${downloadedFiles.length} font file(s)`);
            return {
                success: true,
                filePaths: downloadedFiles
            };
        }
        const searchQueries = this.generateLastResortQueries(fontName);
        const lastResortInfo = this.formatLastResortMessage(fontName, searchQueries);
        await this.writeLastResortFile(fontName, lastResortInfo);
        return {
            success: false,
            lastResortInfo: lastResortInfo
        };
    }
    /**
     * Search GitHub API for font files
     */
    async searchGitHubApi(fontName) {
        console.error(`[FontHunter] Searching GitHub API for: ${fontName}`);
        const urls = [];
        const cleanName = fontName.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
        const keywords = this.generateSearchKeywords(fontName);
        try {
            for (const keyword of keywords) {
                // Search for .ttf files
                try {
                    const ttfResponse = await axios.get(`https://api.github.com/search/code?q=${encodeURIComponent(keyword)}+extension:ttf&per_page=10`, {
                        timeout: 10000,
                        headers: {
                            'Accept': 'application/vnd.github.v3+json',
                            'User-Agent': 'FontHunter-MCP'
                        }
                    });
                    if (ttfResponse.data && ttfResponse.data.items) {
                        for (const item of ttfResponse.data.items) {
                            if (item.html_url) {
                                const rawUrl = item.html_url
                                    .replace('github.com', 'raw.githubusercontent.com')
                                    .replace('/blob/', '/');
                                urls.push(rawUrl);
                            }
                        }
                        console.error(`[FontHunter] GitHub API found ${ttfResponse.data.items.length} .ttf files for "${keyword}"`);
                    }
                }
                catch (e) {
                    if (e.response?.status === 403) {
                        console.error('[FontHunter] GitHub API rate limited, skipping API search');
                        return [...new Set(urls)]; // Return early if rate limited
                    }
                    console.error(`[FontHunter] GitHub .ttf search failed for "${keyword}":`, e.message);
                }
                // Search for .otf files
                try {
                    const otfResponse = await axios.get(`https://api.github.com/search/code?q=${encodeURIComponent(keyword)}+extension:otf&per_page=10`, {
                        timeout: 10000,
                        headers: {
                            'Accept': 'application/vnd.github.v3+json',
                            'User-Agent': 'FontHunter-MCP'
                        }
                    });
                    if (otfResponse.data && otfResponse.data.items) {
                        for (const item of otfResponse.data.items) {
                            if (item.html_url) {
                                const rawUrl = item.html_url
                                    .replace('github.com', 'raw.githubusercontent.com')
                                    .replace('/blob/', '/');
                                urls.push(rawUrl);
                            }
                        }
                        console.error(`[FontHunter] GitHub API found ${otfResponse.data.items.length} .otf files for "${keyword}"`);
                    }
                }
                catch (e) {
                    if (e.response?.status === 403) {
                        console.error('[FontHunter] GitHub API rate limited, skipping API search');
                        return [...new Set(urls)];
                    }
                    console.error(`[FontHunter] GitHub .otf search failed for "${keyword}":`, e.message);
                }
                // Search for .woff2 files
                try {
                    const woff2Response = await axios.get(`https://api.github.com/search/code?q=${encodeURIComponent(keyword)}+extension:woff2&per_page=10`, {
                        timeout: 10000,
                        headers: {
                            'Accept': 'application/vnd.github.v3+json',
                            'User-Agent': 'FontHunter-MCP'
                        }
                    });
                    if (woff2Response.data && woff2Response.data.items) {
                        for (const item of woff2Response.data.items) {
                            if (item.html_url) {
                                const rawUrl = item.html_url
                                    .replace('github.com', 'raw.githubusercontent.com')
                                    .replace('/blob/', '/');
                                urls.push(rawUrl);
                            }
                        }
                        console.error(`[FontHunter] GitHub API found ${woff2Response.data.items.length} .woff2 files for "${keyword}"`);
                    }
                }
                catch (e) {
                    if (e.response?.status === 403) {
                        console.error('[FontHunter] GitHub API rate limited, skipping API search');
                        return [...new Set(urls)];
                    }
                    console.error(`[FontHunter] GitHub .woff2 search failed for "${keyword}":`, e.message);
                }
            }
        }
        catch (e) {
            console.error('[FontHunter] GitHub API search failed:', e);
        }
        const uniqueUrls = [...new Set(urls)];
        console.error(`[FontHunter] GitHub API found ${uniqueUrls.length} unique font URLs total`);
        return uniqueUrls;
    }
    /**
     * Search GetTheFont.com for font files
     */
    async searchGetTheFont(fontName) {
        console.error(`[FontHunter] Searching GetTheFont.com for: ${fontName}`);
        const urls = [];
        const keywords = this.generateSearchKeywords(fontName);
        try {
            for (const keyword of keywords) {
                const searchUrl = `https://getthefont.com/search?q=${encodeURIComponent(keyword)}`;
                const response = await axios.get(searchUrl, {
                    timeout: 10000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
                // Extract download links from GetTheFont
                const downloadPattern = /href="(https?:\/\/getthefont\.com\/[^"]*download[^"]*)"/gi;
                let match;
                while ((match = downloadPattern.exec(response.data)) !== null) {
                    urls.push(match[1]);
                }
                // Also look for direct font file links
                const fontPattern = /href="(https?:\/\/[^"]*\.(ttf|otf|woff2))"/gi;
                while ((match = fontPattern.exec(response.data)) !== null) {
                    urls.push(match[1]);
                }
            }
        }
        catch (e) {
            console.error('[FontHunter] GetTheFont search failed:', e);
        }
        return [...new Set(urls)];
    }
    /**
     * Search Archive.org for font files
     */
    async searchArchiveOrg(fontName) {
        console.error(`[FontHunter] Searching Archive.org for: ${fontName}`);
        const urls = [];
        const keywords = this.generateSearchKeywords(fontName);
        try {
            for (const keyword of keywords) {
                // Search Archive.org API
                const searchUrl = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(keyword + ' font')}&output=json&rows=10`;
                const response = await axios.get(searchUrl, { timeout: 10000 });
                if (response.data.response && response.data.response.docs) {
                    for (const doc of response.data.response.docs) {
                        if (doc.identifier) {
                            // Try to construct download URL
                            const downloadUrl = `https://archive.org/download/${doc.identifier}/${doc.identifier}_files.xml`;
                            // Fetch file list
                            try {
                                const fileListResponse = await axios.get(downloadUrl, { timeout: 5000 });
                                // Extract font files from XML
                                const fontPattern = /<file name="([^"]*\.(ttf|otf|woff2))"/gi;
                                let match;
                                while ((match = fontPattern.exec(fileListResponse.data)) !== null) {
                                    const fontUrl = `https://archive.org/download/${doc.identifier}/${match[1]}`;
                                    urls.push(fontUrl);
                                }
                            }
                            catch (e) {
                                // If file list fetch fails, try direct download URL
                                urls.push(`https://archive.org/download/${doc.identifier}/${doc.identifier}.zip`);
                            }
                        }
                    }
                }
            }
        }
        catch (e) {
            console.error('[FontHunter] Archive.org search failed:', e);
        }
        return [...new Set(urls)];
    }
    /**
     * Aggressive GitHub search - tries many common patterns without API
     */
    async aggressiveGitHubSearch(fontName) {
        console.error(`[FontHunter] Aggressive GitHub search for: ${fontName}`);
        const urls = [];
        const keywords = this.generateSearchKeywords(fontName);
        // Common GitHub users/orgs that host fonts
        const githubUsers = [
            'Desuvit', 'mozilla', 'google', 'microsoft', 'apple', 'adobe', 'IBM',
            'JetBrains', 'rsms', 'tonsky', 'be5invis', 'adobe-fonts', 'source-foundry'
        ];
        // Common repo names
        const repoPatterns = [
            'Fonts', 'fonts', 'font-collection', 'free-fonts', 'web-fonts',
            'typeface', 'font-family', 'typography', 'font-resources'
        ];
        for (const keyword of keywords) {
            for (const ext of ['.ttf', '.otf', '.woff2', '.woff']) {
                // Try user/fontname patterns
                for (const user of githubUsers) {
                    urls.push(`https://raw.githubusercontent.com/${user}/Fonts/main/${keyword}${ext}`);
                    urls.push(`https://raw.githubusercontent.com/${user}/Fonts/master/${keyword}${ext}`);
                    urls.push(`https://raw.githubusercontent.com/${user}/fonts/main/${keyword}${ext}`);
                    urls.push(`https://raw.githubusercontent.com/${user}/fonts/master/${keyword}${ext}`);
                    urls.push(`https://raw.githubusercontent.com/${user}/${keyword}/main/${keyword}${ext}`);
                    urls.push(`https://raw.githubusercontent.com/${user}/${keyword}/master/${keyword}${ext}`);
                    urls.push(`https://raw.githubusercontent.com/${user}/${keyword}/main/${keyword}-Regular${ext}`);
                    urls.push(`https://raw.githubusercontent.com/${user}/${keyword}/master/${keyword}-Regular${ext}`);
                }
                // Try common repo patterns
                for (const repo of repoPatterns) {
                    urls.push(`https://raw.githubusercontent.com/fontsource/${repo}/main/${keyword}${ext}`);
                    urls.push(`https://raw.githubusercontent.com/fontsource/${repo}/master/${keyword}${ext}`);
                }
                // Try common paths
                urls.push(`https://raw.githubusercontent.com/google/fonts/main/ofl/${keyword.toLowerCase()}/${keyword}${ext}`);
                urls.push(`https://raw.githubusercontent.com/google/fonts/main/apache/${keyword.toLowerCase()}/${keyword}${ext}`);
                urls.push(`https://raw.githubusercontent.com/google/fonts/main/ufl/${keyword.toLowerCase()}/${keyword}${ext}`);
            }
        }
        console.error(`[FontHunter] Generated ${urls.length} GitHub URL candidates`);
        return [...new Set(urls)];
    }
    /**
     * Aggressive Google search - scrape search results for font URLs
     */
    async aggressiveGoogleSearch(fontName) {
        console.error(`[FontHunter] Aggressive Google search for: ${fontName}`);
        const foundUrls = [];
        const cleanName = fontName.replace(/\s+/g, '');
        const keywords = this.generateSearchKeywords(fontName);
        const searchQueries = [
            `${cleanName}.ttf site:github.com`,
            `${cleanName}.otf site:github.com`,
            `${cleanName}.woff2 site:github.com`,
            `${cleanName} font download site:github.com`,
            `${cleanName}.ttf site:gitlab.com`,
            `${cleanName}.ttf "raw.githubusercontent.com"`,
            `${cleanName} font download`,
            `${cleanName} free font download`,
            `"${cleanName}.ttf"`,
            `"${cleanName}.otf"`,
            ...keywords.flatMap(kw => [
                `${kw}.ttf`,
                `${kw}.otf`,
                `${kw} font download`
            ])
        ];
        for (const query of searchQueries) {
            try {
                const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
                console.error(`[FontHunter] Searching Google: ${query}`);
                const response = await axios.get(searchUrl, {
                    timeout: 15000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                        'Accept-Language': 'en-US,en;q=0.5',
                        'Accept-Encoding': 'gzip, deflate, br',
                        'Referer': 'https://www.google.com/',
                    },
                    decompress: true
                });
                const html = response.data;
                // Extract all potential font URLs
                const patterns = [
                    // GitHub raw
                    /https:\/\/raw\.githubusercontent\.com\/[^"\s<>]+?\.(ttf|otf|woff2|woff)/gi,
                    // GitHub blob (will convert later)
                    /https:\/\/github\.com\/[^"\s<>]+?\/blob\/[^"\s<>]+?\.(ttf|otf|woff2|woff)/gi,
                    // GitLab raw
                    /https:\/\/gitlab\.com\/[^"\s<>]+?\/-\/raw\/[^"\s<>]+?\.(ttf|otf|woff2|woff)/gi,
                    // BitBucket raw
                    /https:\/\/bitbucket\.org\/[^"\s<>]+?\/raw\/[^"\s<>]+?\.(ttf|otf|woff2|woff)/gi,
                    // Archive.org
                    /https:\/\/archive\.org\/download\/[^"\s<>]+?\.(ttf|otf|woff2|woff|zip)/gi,
                    // Any direct font URL
                    /https?:\/\/[^"\s<>]+?\.(ttf|otf|woff2|woff)/gi,
                ];
                for (const pattern of patterns) {
                    const matches = html.match(pattern);
                    if (matches) {
                        for (let url of matches) {
                            // Convert GitHub blob to raw
                            if (url.includes('github.com') && url.includes('/blob/')) {
                                url = url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
                            }
                            foundUrls.push(url);
                        }
                    }
                }
                if (foundUrls.length > 0) {
                    console.error(`[FontHunter] Found ${foundUrls.length} URLs from Google search`);
                }
                // Small delay
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            catch (e) {
                if (e.response?.status === 429) {
                    console.error('[FontHunter] Google rate limited, stopping search');
                    break;
                }
                // Continue with other queries
            }
        }
        // Filter unique URLs
        const uniqueUrls = [...new Set(foundUrls)];
        console.error(`[FontHunter] Total unique URLs found: ${uniqueUrls.length}`);
        return uniqueUrls;
    }
    /**
     * Search well-known font repositories for font files
     */
    async searchFontRepositories(fontName) {
        console.error(`[FontHunter] Searching font repositories for: ${fontName}`);
        const urls = [];
        const cleanName = fontName.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
        const keywords = this.generateSearchKeywords(fontName);
        // Try common font repository patterns
        const repositoryPatterns = [
            // Fontsource (npm)
            `https://cdn.jsdelivr.net/npm/@fontsource/${cleanName.toLowerCase()}/files/${cleanName.toLowerCase()}-latin-400-normal.woff2`,
            `https://cdn.jsdelivr.net/npm/@fontsource/${cleanName.toLowerCase()}/files/${cleanName.toLowerCase()}-latin-400-normal.woff`,
            // Google Fonts (if available)
            `https://fonts.gstatic.com/s/${cleanName.toLowerCase()}/${cleanName.toLowerCase()}-regular.woff2`,
            // Common GitHub font repos
            `https://raw.githubusercontent.com/Desuvit/Fonts/main/${cleanName}.ttf`,
            `https://raw.githubusercontent.com/Desuvit/Fonts/main/${cleanName}.otf`,
            `https://raw.githubusercontent.com/Desuvit/Fonts/main/${cleanName}.woff2`,
            // Font Squirrel-style URLs
            `https://www.fontsquirrel.com/fonts/download/${cleanName.toLowerCase()}`,
            // DaFont (direct download attempts)
            `https://dl.dafont.com/dl/?f=${cleanName.toLowerCase().replace(/\s+/g, '_')}`,
        ];
        for (const url of repositoryPatterns) {
            if (this.isFontUrl(url)) {
                urls.push(url);
            }
        }
        // Try searching for font in common GitHub repositories
        const githubRepos = [
            'google/fonts',
            'Desuvit/Fonts',
            'fontsource/font-files',
            'JetBrains/JetBrainsMono',
            'IBM/plex',
            'mozilla/Fira',
            'rsms/inter',
            'adobe-fonts/source-code-pro',
            'adobe-fonts/source-sans-pro',
            'adobe-fonts/source-serif-pro',
        ];
        for (const repo of githubRepos) {
            for (const keyword of keywords) {
                for (const ext of ['.ttf', '.otf', '.woff2', '.woff']) {
                    // Try various naming patterns
                    urls.push(`https://raw.githubusercontent.com/${repo}/main/${keyword}${ext}`);
                    urls.push(`https://raw.githubusercontent.com/${repo}/master/${keyword}${ext}`);
                    urls.push(`https://raw.githubusercontent.com/${repo}/main/fonts/${keyword}${ext}`);
                    urls.push(`https://raw.githubusercontent.com/${repo}/master/fonts/${keyword}${ext}`);
                    urls.push(`https://raw.githubusercontent.com/${repo}/main/${keyword}/${keyword}${ext}`);
                    urls.push(`https://raw.githubusercontent.com/${repo}/master/${keyword}/${keyword}${ext}`);
                }
            }
        }
        return [...new Set(urls)];
    }
    /**
     * Search alternative sources like GitLab, Bitbucket, etc.
     */
    async searchAlternativeSources(fontName) {
        console.error(`[FontHunter] Searching alternative sources for: ${fontName}`);
        const urls = [];
        const cleanName = fontName.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
        const keywords = this.generateSearchKeywords(fontName);
        for (const keyword of keywords) {
            for (const ext of ['.ttf', '.otf', '.woff2', '.woff']) {
                // GitLab
                urls.push(`https://gitlab.com/api/v4/projects?search=${keyword}`);
                // BitBucket
                urls.push(`https://bitbucket.org/!api/2.0/repositories/${keyword}`);
                // SourceForge
                urls.push(`https://sourceforge.net/projects/${keyword}/files/`);
            }
        }
        return [...new Set(urls)];
    }
    /**
     * Generate CDN service URLs
     */
    generateCdnServiceUrls(fontName) {
        console.error(`[FontHunter] Generating CDN URLs for: ${fontName}`);
        const urls = [];
        const cleanName = fontName.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
        const keywords = this.generateSearchKeywords(fontName);
        for (const keyword of keywords) {
            // jsDelivr
            urls.push(`https://cdn.jsdelivr.net/npm/${keyword}@latest/${keyword}.ttf`);
            urls.push(`https://cdn.jsdelivr.net/gh/${keyword}/${keyword}@master/${keyword}.ttf`);
            // unpkg
            urls.push(`https://unpkg.com/${keyword}@latest/${keyword}.ttf`);
            // cdnjs
            urls.push(`https://cdnjs.cloudflare.com/ajax/libs/${keyword}/1.0.0/${keyword}.ttf`);
            // Google Fonts
            urls.push(`https://fonts.googleapis.com/css2?family=${encodeURIComponent(keyword)}`);
        }
        return [...new Set(urls)];
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
