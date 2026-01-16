import fs from 'fs/promises';
import path from 'path';
export class ProjectScannerService {
    async analyzeProject(projectPath) {
        const keywords = new Set();
        const techStack = new Set();
        let vibe = "modern clean"; // Default fallback
        try {
            // 1. Scan package.json for tech stack and potential descriptors
            try {
                const pkgPath = path.join(projectPath, 'package.json');
                const pkgData = await fs.readFile(pkgPath, 'utf-8');
                const pkg = JSON.parse(pkgData);
                if (pkg.name)
                    keywords.add(pkg.name.replace(/-/g, ' '));
                if (pkg.description)
                    keywords.add(pkg.description);
                if (pkg.keywords)
                    pkg.keywords.forEach((k) => keywords.add(k));
                // Detect tech for context
                const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
                if (allDeps['react'])
                    techStack.add('React');
                if (allDeps['next'])
                    techStack.add('Next.js');
                if (allDeps['tailwindcss']) {
                    techStack.add('Tailwind');
                    keywords.add('utility-first');
                }
                if (allDeps['three']) {
                    techStack.add('Three.js');
                    keywords.add('3D webgl immersive');
                    vibe = "immersive 3D creative";
                }
            }
            catch (e) {
                // No package.json, continue
            }
            // 2. Scan for specific config files (tailwind, styling)
            // This is a naive scan - in a real scenario we'd parse CSS but that's heavy.
            // We'll look for filenames that imply structure.
            // 3. Heuristic Vibe Detection
            const kwString = Array.from(keywords).join(' ').toLowerCase();
            if (kwString.includes('crypto') || kwString.includes('web3') || kwString.includes('blockchain')) {
                vibe = "futuristic tech crypto";
            }
            else if (kwString.includes('fashion') || kwString.includes('luxury') || kwString.includes('store')) {
                vibe = "luxury elegant high-end";
            }
            else if (kwString.includes('blog') || kwString.includes('journal') || kwString.includes('content')) {
                vibe = "editorial clean readable";
            }
            else if (kwString.includes('dashboard') || kwString.includes('admin') || kwString.includes('saas')) {
                vibe = "clean ui dashboard legible";
            }
            else if (kwString.includes('portfolio') || kwString.includes('creative')) {
                vibe = "creative portfolio bold";
            }
            else if (kwString.includes('game') || kwString.includes('gaming')) {
                vibe = "gaming playful retro";
            }
            return {
                vibe,
                keywords: Array.from(keywords),
                technicalStack: Array.from(techStack)
            };
        }
        catch (error) {
            console.error("Error analyzing project:", error);
            return { vibe: "general modern", keywords: [], technicalStack: [] };
        }
    }
}
