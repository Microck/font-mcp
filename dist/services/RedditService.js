import axios from 'axios';
export class RedditService {
    userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
    async searchReddit(query) {
        const subreddits = ['typography', 'fonts', 'design', 'web_design'];
        const limit = 5;
        const oneYearAgo = Math.floor(Date.now() / 1000) - (365 * 24 * 60 * 60);
        const results = [];
        // Search in parallel
        const promises = subreddits.map(async (sub) => {
            try {
                // Using generic search for better reach across subreddits or just specific ones
                // t=year ensures we get posts from the last year
                const url = `https://www.reddit.com/r/${sub}/search.json?q=${encodeURIComponent(query)}&restrict_sr=1&sort=relevance&t=year&limit=${limit}`;
                const response = await axios.get(url, {
                    headers: { 'User-Agent': this.userAgent }
                });
                if (response.data && response.data.data && response.data.data.children) {
                    const posts = response.data.data.children;
                    for (const post of posts) {
                        const p = post.data;
                        if (p.created_utc < oneYearAgo)
                            continue; // Double check time (though t=year handles it mostly)
                        // Basic extraction of top comment if available could be tricky via search API alone
                        // as search results don't include comments. We might need to fetch the post detail
                        // OR just rely on title/selftext.
                        // For efficiency, we'll stick to title + selftext for now.
                        results.push({
                            title: p.title,
                            url: `https://reddit.com${p.permalink}`,
                            subreddit: p.subreddit,
                            comments: [p.selftext], // treating body as a 'comment' for analysis
                            score: p.score,
                            created_utc: p.created_utc
                        });
                    }
                }
            }
            catch (error) {
                // individual subreddit failure shouldn't stop others
                // console.error(`Failed to search r/${sub}:`, error); 
            }
        });
        await Promise.all(promises);
        // Sort by score and take top 5 overall
        return results.sort((a, b) => b.score - a.score).slice(0, 5);
    }
}
