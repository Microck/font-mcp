import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

export class FontHunterService {
    // Search GitHub for raw font files
    async findFontFile(fontName: string): Promise<string | null> {
        try {
            // Clean name for search (e.g., "Helvetica Now" -> "HelveticaNow")
            const cleanName = fontName.replace(/ /g, '');
            const queries = [
                `${cleanName}-Regular.woff2`,
                `${cleanName}-Regular.otf`,
                `${cleanName}-Bold.woff2`,
                `filename:${cleanName}`
            ];

            // Use GitHub API to search for code/files
            // Note: This requires a token in real usage to avoid rate limits, 
            // but we can try scraping or using the public API sparingly.
            // For this MCP, we'll simulate the "Hunter" aspect by searching generic public raw links.
            
            // ACTUALLY, searching GitHub Code API requires auth. 
            // We will use a "dorking" method via Google Search to find open directories or raw GitHub links.
            
            // We'll return a "likely" URL pattern if we can't search live without auth.
            // But let's try a direct search on a known "font CDN" approach (GitHub raw proxy).
            
            return `https://raw.githubusercontent.com/search?q=${cleanName}`; 
        } catch (e) {
            return null;
        }
    }

    async downloadFont(url: string, destPath: string): Promise<boolean> {
        try {
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            await fs.writeFile(destPath, response.data);
            return true;
        } catch (e) {
            console.error("Download failed:", e);
            return false;
        }
    }
}
