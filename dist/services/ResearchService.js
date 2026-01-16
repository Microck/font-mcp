import axios from 'axios';
import * as cheerio from 'cheerio';
import { RedditService } from './RedditService.js';
export class ResearchService {
    userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
    redditService;
    constructor() {
        this.redditService = new RedditService();
    }
    async searchTypewolf(vibe) {
        try {
            // Search Typewolf
            const searchUrl = `https://www.typewolf.com/?s=${encodeURIComponent(vibe)}`;
            const response = await axios.get(searchUrl, {
                headers: { 'User-Agent': this.userAgent }
            });
            const $ = cheerio.load(response.data);
            const results = [];
            // Parse article previews
            $('article').each((i, el) => {
                if (i >= 5)
                    return; // Limit to top 5 results
                const title = $(el).find('h2 a').text().trim();
                const link = $(el).find('h2 a').attr('href');
                const imgUrl = $(el).find('img').attr('src'); // NEW: Get image preview
                const fonts = [];
                // Typewolf usually lists fonts in the meta or content
                $(el).find('p a').each((j, link) => {
                    const text = $(link).text().trim();
                    if (text && !text.includes('Site of the Day') && !text.includes('Read More')) {
                        fonts.push(text);
                    }
                });
                if (link && fonts.length > 0) {
                    results.push({
                        source: 'Typewolf',
                        fonts: [...new Set(fonts)], // Dedup
                        context: title,
                        url: link,
                        imageUrl: imgUrl // Pass it through
                    });
                }
            });
            return results;
        }
        catch (error) {
            console.error('Error researching Typewolf:', error);
            return [];
        }
    }
    async searchFontsInUse(vibe) {
        try {
            // Search FontsInUse
            const searchUrl = `https://fontsinuse.com/search?terms=${encodeURIComponent(vibe)}`;
            const response = await axios.get(searchUrl, {
                headers: { 'User-Agent': this.userAgent }
            });
            const $ = cheerio.load(response.data);
            const results = [];
            $('.usage-item').each((i, el) => {
                if (i >= 5)
                    return;
                const title = $(el).find('.usage-title').text().trim();
                const link = 'https://fontsinuse.com' + $(el).find('a.usage-link').attr('href');
                const fonts = [];
                $(el).find('.typeface-name').each((j, font) => {
                    fonts.push($(font).text().trim());
                });
                if (link && fonts.length > 0) {
                    results.push({
                        source: 'FontsInUse',
                        fonts: [...new Set(fonts)],
                        context: title,
                        url: link,
                        imageUrl: $(el).find('img').attr('data-src') || $(el).find('img').attr('src') // Try lazy load attr
                    });
                }
            });
            return results;
        }
        catch (error) {
            console.error('Error researching FontsInUse:', error);
            return [];
        }
    }
    async getExpertRecommendations(vibe) {
        const [typewolf, fontsInUse, reddit] = await Promise.all([
            this.searchTypewolf(vibe),
            this.searchFontsInUse(vibe),
            this.redditService.searchReddit(vibe)
        ]);
        // Convert Reddit results to ResearchResult format
        const redditResults = reddit.map(post => ({
            source: `Reddit (r/${post.subreddit})`,
            fonts: [], // We'd need NLP to extract fonts accurately, but titles often have them
            context: post.title,
            url: post.url
        }));
        const allResults = [...typewolf, ...fontsInUse, ...redditResults];
        if (allResults.length === 0) {
            return `I searched top design archives (Typewolf, FontsInUse) and Reddit discussions from the last year for "${vibe}" but couldn't find specific live examples. This is rare! I'd recommend sticking to versatile classics or refining the search term.`;
        }
        // Format the output
        let output = `I've researched live examples and discussions for "${vibe}" from top design sources:\n\n`;
        allResults.forEach(res => {
            output += `### ${res.context}\n`;
            if (res.imageUrl) {
                output += `![Preview](${res.imageUrl})\n`;
            }
            output += `*Source:* ${res.source}\n`;
            if (res.fonts.length > 0) {
                output += `*Fonts Identified:* ${res.fonts.join(', ')}\n`;
            }
            output += `*Link:* ${res.url}\n\n`;
        });
        return output;
    }
}
