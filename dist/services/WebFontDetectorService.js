import axios from 'axios';
import * as cheerio from 'cheerio';
import { URL } from 'url';
export class WebFontDetectorService {
    userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
    async analyzeUrl(targetUrl) {
        try {
            const response = await axios.get(targetUrl, {
                headers: { 'User-Agent': this.userAgent }
            });
            const $ = cheerio.load(response.data);
            const fonts = [];
            const processedFamilies = new Set();
            // 1. Analyze <link> tags for known providers (Google, Adobe/Typekit, Typography.com)
            $('link[rel="stylesheet"]').each((i, el) => {
                const href = $(el).attr('href');
                if (!href)
                    return;
                if (href.includes('fonts.googleapis.com')) {
                    // Extract family from URL params
                    const url = new URL(href);
                    const families = url.searchParams.get('family')?.split('|') || [];
                    families.forEach(f => {
                        const name = f.split(':')[0].replace(/\+/g, ' ');
                        if (!processedFamilies.has(name)) {
                            fonts.push({
                                family: name,
                                source: 'Google Fonts',
                                isPaidLikely: false
                            });
                            processedFamilies.add(name);
                        }
                    });
                }
                else if (href.includes('use.typekit.net') || href.includes('p.typekit.net')) {
                    // Adobe Fonts are usually paid/subscription
                    fonts.push({
                        family: 'Adobe Fonts (Typekit Hidden)',
                        source: 'Adobe Fonts',
                        isPaidLikely: true
                    });
                }
                else if (href.includes('cloud.typography.com')) {
                    fonts.push({
                        family: 'Hoefler&Co / Typography.com',
                        source: 'Typography.com',
                        isPaidLikely: true
                    });
                }
            });
            // 2. Scan inline styles and style tags for font-family
            // This is "dirty" regex matching but effective for static analysis
            const htmlContent = response.data;
            const styleContent = $('style').text();
            // Regex to find font-family: "Name", sans-serif;
            const fontFamilyRegex = /font-family:\s*["']?([^;"'}]+)["']?/gi;
            let match;
            const combinedContent = htmlContent + styleContent;
            while ((match = fontFamilyRegex.exec(combinedContent)) !== null) {
                // Get the first font in the stack
                const fullStack = match[1];
                const primaryFont = fullStack.split(',')[0].trim().replace(/['"]/g, '');
                // Filter out generic keywords and system fonts
                const ignored = ['inherit', 'sans-serif', 'serif', 'monospace', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial'];
                if (primaryFont && !ignored.includes(primaryFont) && !processedFamilies.has(primaryFont)) {
                    // If it's not Google/Adobe (checked above), it's likely a custom webfont (often Paid/Premium)
                    fonts.push({
                        family: primaryFont,
                        source: 'Custom / Self-Hosted',
                        isPaidLikely: true // Assumption: Unique self-hosted fonts are often premium
                    });
                    processedFamilies.add(primaryFont);
                }
            }
            return fonts;
        }
        catch (error) {
            console.error(`Error analyzing ${targetUrl}:`, error);
            return [];
        }
    }
}
