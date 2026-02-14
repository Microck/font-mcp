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
        const githubRawPattern = /https:\/\/raw\.githubusercontent\.com\/[^"\s<>]+\.(ttf|otf|woff2)/gi;
        const githubMatches = html.match(githubRawPattern);
        if (githubMatches) {
            urls.push(...githubMatches);
        }
        // Pattern to match GitHub blob URLs (need to convert to raw)
        const githubBlobPattern = /https:\/\/github\.com\/([^"\s<>]+)\/blob\/([^"\s<>]+\.)(ttf|otf|woff2)/gi;
        let blobMatch;
        while ((blobMatch = githubBlobPattern.exec(html)) !== null) {
            const rawUrl = blobMatch[0].replace('/blob/', '/raw/');
            urls.push(rawUrl);
        }
        // Pattern to match any .ttf, .otf, or .woff2 URLs
        const fontUrlPattern = /https?:\/\/[^"\s<>]+\.(ttf|otf|woff2)/gi;
        const fontMatches = html.match(fontUrlPattern);
        if (fontMatches) {
            urls.push(...fontMatches);
        }
        // Pattern for vk.com (usually links to files)
        const vkPattern = /https:\/\/vk\.com\/[^"\s<>]+/gi;
        const vkMatches = html.match(vkPattern);
        if (vkMatches) {
            // VK links typically redirect to downloads, we'd need to follow them
            // For now, just log them
            console.error(`[FontHunter] Found VK links: ${vkMatches.length}`);
        }
        // Pattern for archive.org
        const archivePattern = /https:\/\/archive\.org\/download\/[^"\s<>]+/gi;
        const archiveMatches = html.match(archivePattern);
        if (archiveMatches) {
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
        return relevantUrls.length > 0 ? relevantUrls : uniqueUrls;
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
        const downloadedFiles = [];
        let attemptCount = 0;
        // Strategy 1: Try GitHub API search
        console.error('[FontHunter] Strategy 1: GitHub API search');
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
        // Strategy 2: Try Google search patterns
        if (downloadedFiles.length === 0 && attemptCount < config.maxDownloadAttempts) {
            console.error('[FontHunter] Strategy 2: Google search patterns');
            const googleUrls = await this.searchGoogleForFonts(fontName);
            for (const url of googleUrls) {
                if (attemptCount >= config.maxDownloadAttempts)
                    break;
                attemptCount++;
                const result = await this.downloadFont(url, fontName);
                if (result.success && result.filePath) {
                    downloadedFiles.push(result.filePath);
                }
            }
        }
        // Strategy 3: Try GetTheFont.com
        if (downloadedFiles.length === 0 && attemptCount < config.maxDownloadAttempts) {
            console.error('[FontHunter] Strategy 3: GetTheFont.com');
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
        // Strategy 4: Try Archive.org
        if (downloadedFiles.length === 0 && attemptCount < config.maxDownloadAttempts) {
            console.error('[FontHunter] Strategy 4: Archive.org');
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
        // Strategy 5: Direct pattern matching
        if (downloadedFiles.length === 0 && attemptCount < config.maxDownloadAttempts) {
            console.error('[FontHunter] Strategy 5: Direct patterns');
            const url = await this.findFontFile(fontName);
            if (url) {
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
                const ttfResponse = await axios.get(`https://api.github.com/search/code?q=${encodeURIComponent(keyword)}+extension:ttf&per_page=10`, {
                    timeout: 10000,
                    headers: {
                        'Accept': 'application/vnd.github.v3+json',
                        'User-Agent': 'FontHunter-MCP'
                    }
                });
                if (ttfResponse.data.items) {
                    for (const item of ttfResponse.data.items) {
                        if (item.html_url) {
                            const rawUrl = item.html_url
                                .replace('github.com', 'raw.githubusercontent.com')
                                .replace('/blob/', '/');
                            urls.push(rawUrl);
                        }
                    }
                }
                // Search for .otf files
                const otfResponse = await axios.get(`https://api.github.com/search/code?q=${encodeURIComponent(keyword)}+extension:otf&per_page=10`, {
                    timeout: 10000,
                    headers: {
                        'Accept': 'application/vnd.github.v3+json',
                        'User-Agent': 'FontHunter-MCP'
                    }
                });
                if (otfResponse.data.items) {
                    for (const item of otfResponse.data.items) {
                        if (item.html_url) {
                            const rawUrl = item.html_url
                                .replace('github.com', 'raw.githubusercontent.com')
                                .replace('/blob/', '/');
                            urls.push(rawUrl);
                        }
                    }
                }
                // Search for .woff2 files
                const woff2Response = await axios.get(`https://api.github.com/search/code?q=${encodeURIComponent(keyword)}+extension:woff2&per_page=10`, {
                    timeout: 10000,
                    headers: {
                        'Accept': 'application/vnd.github.v3+json',
                        'User-Agent': 'FontHunter-MCP'
                    }
                });
                if (woff2Response.data.items) {
                    for (const item of woff2Response.data.items) {
                        if (item.html_url) {
                            const rawUrl = item.html_url
                                .replace('github.com', 'raw.githubusercontent.com')
                                .replace('/blob/', '/');
                            urls.push(rawUrl);
                        }
                    }
                }
            }
        }
        catch (e) {
            console.error('[FontHunter] GitHub API search failed:', e);
        }
        return [...new Set(urls)];
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
