import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { ResearchService } from "./services/ResearchService.js";
import { ProjectScannerService } from "./services/ProjectScannerService.js";
import { WebFontDetectorService } from "./services/WebFontDetectorService.js";
import { ConfigGeneratorService } from "./services/ConfigGeneratorService.js";
import { FontHunterService } from "./services/FontHunterService.js";
const researchService = new ResearchService();
const projectScanner = new ProjectScannerService();
const webDetector = new WebFontDetectorService();
const configGenerator = new ConfigGeneratorService();
const fontHunter = new FontHunterService();
// Initialize Server
const server = new Server({
    name: "font-mcp",
    version: "1.0.0",
}, {
    capabilities: {
        tools: {},
    },
});
// Tool Definitions
const TOOLS = [
    {
        name: "consult_font_expert",
        description: "Get expert font recommendations based on a vibe, project type, or visual description. Uses live research from Reddit, Typewolf, and FontsInUse.",
        inputSchema: z.object({
            vibe: z
                .string()
                .describe("Description of the project or aesthetic (e.g., 'luxury', 'tech start-up', 'editorial', 'playful')"),
            allow_paid: z
                .boolean()
                .default(true)
                .describe("Whether to include paid/commercial fonts in recommendations"),
        }),
    },
    {
        name: "analyze_project_and_recommend",
        description: "Scans the project directory (package.json, config) to automatically detect the 'vibe' and recommend suitable fonts.",
        inputSchema: z.object({
            project_path: z.string().describe("Absolute path to the project root"),
            allow_paid: z.boolean().default(true)
        })
    },
    {
        name: "analyze_website",
        description: "Analyze a live website URL to identify which fonts they are using ('Steal this look').",
        inputSchema: z.object({
            url: z.string().url().describe("The website URL to analyze")
        })
    },
    {
        name: "setup_font_config",
        description: "Generate CSS/Tailwind configuration and setup instructions for a specific font. It will automatically attempt to download the font files for testing purposes, assuming you have a valid license.",
        inputSchema: z.object({
            font_name: z.string().describe("Name of the font"),
            is_paid: z.boolean().describe("Is this a paid font?"),
            type: z.enum(["tailwind", "css"]).default("tailwind")
        })
    }
];
// Request Handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "consult_font_expert",
                description: "Get expert font recommendations based on a vibe or project.",
                inputSchema: {
                    type: "object",
                    properties: {
                        vibe: {
                            type: "string",
                            description: "Project vibe (e.g. 'luxury', 'tech')",
                        },
                        allow_paid: { type: "boolean" },
                    },
                    required: ["vibe"],
                },
            },
            {
                name: "analyze_project_and_recommend",
                description: "Auto-detect project vibe and recommend fonts.",
                inputSchema: {
                    type: "object",
                    properties: {
                        project_path: { type: "string" },
                        allow_paid: { type: "boolean" }
                    },
                    required: ["project_path"]
                }
            },
            {
                name: "analyze_website",
                description: "Steal the look: Identify fonts from a website URL.",
                inputSchema: {
                    type: "object",
                    properties: {
                        url: { type: "string" }
                    },
                    required: ["url"]
                }
            },
            {
                name: "setup_font_config",
                description: "Generate setup code for a font.",
                inputSchema: {
                    type: "object",
                    properties: {
                        font_name: { type: "string" },
                        is_paid: { type: "boolean" },
                        type: { type: "string", enum: ["tailwind", "css"] }
                    },
                    required: ["font_name", "is_paid"]
                }
            }
        ],
    };
});
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        if (name === "consult_font_expert") {
            const vibe = args?.vibe;
            // Dynamic research only
            let expertResearch = "";
            try {
                expertResearch = await researchService.getExpertRecommendations(vibe);
            }
            catch (e) {
                console.error("Research failed", e);
                return {
                    content: [{ type: "text", text: "I tried to research this vibe but encountered an error connecting to my design sources. Please try again or refine your query." }],
                    isError: true
                };
            }
            if (!expertResearch) {
                return {
                    content: [
                        {
                            type: "text",
                            text: "I searched my live sources (Reddit, Typewolf, FontsInUse) but couldn't find high-quality discussions for this specific vibe. Try a broader term (e.g. 'modern sans' instead of 'neo-grotesque for pet shop').",
                        },
                    ],
                };
            }
            return {
                content: [{ type: "text", text: expertResearch }],
            };
        }
        if (name === "analyze_project_and_recommend") {
            const projectPath = args?.project_path;
            const analysis = await projectScanner.analyzeProject(projectPath);
            // Use the detected vibe to perform the standard consultation
            const vibe = analysis.vibe;
            let expertResearch = "";
            try {
                expertResearch = await researchService.getExpertRecommendations(vibe);
            }
            catch (e) {
                console.error("Research failed");
                expertResearch = "I detected the vibe but couldn't fetch live recommendations at the moment.";
            }
            const intro = `I analyzed your project at \`${projectPath}\`.\n` +
                `**Detected Vibe:** "${vibe}"\n` +
                `**Keywords:** ${analysis.keywords.join(', ')}\n` +
                `**Tech Stack:** ${analysis.technicalStack.join(', ')}\n\n` +
                `Based on this profile, here are my findings:\n\n`;
            return {
                content: [{ type: "text", text: intro + expertResearch }]
            };
        }
        if (name === "analyze_website") {
            const url = args?.url;
            try {
                const fonts = await webDetector.analyzeUrl(url);
                if (fonts.length === 0) {
                    return {
                        content: [{ type: "text", text: `I couldn't detect specific font families on ${url}. They might be using complex canvas rendering or obscured classes.` }]
                    };
                }
                const fontList = fonts.map(f => `- **${f.family}** (${f.source})\n  *Type:* ${f.isPaidLikely ? 'Likely Paid/Custom' : 'Free/Open Source'}`).join('\n');
                return {
                    content: [{ type: "text", text: `I found the following fonts on ${url}:\n\n${fontList}\n\nTo get setup instructions, use 'setup_font_config'.` }]
                };
            }
            catch (e) {
                return {
                    content: [{ type: "text", text: `Error analyzing website: ${e}` }],
                    isError: true
                };
            }
        }
        if (name === "setup_font_config") {
            const fontName = args?.font_name;
            const isPaid = args?.is_paid;
            const type = args?.type || 'tailwind';
            let code = "";
            if (type === 'tailwind') {
                code = await configGenerator.generateTailwindConfig(fontName);
            }
            else {
                code = await configGenerator.generateCssSetup(fontName, isPaid);
            }
            let note = "";
            if (isPaid) {
                note += `\n\n**STATUS:** Automatic font download initiated. Searching for font files...`;
                const result = await fontHunter.huntWithMultipleAttempts(fontName);
                if (result.success && result.filePath) {
                    note += `\n\n**SUCCESS:** Font downloaded to \`${result.filePath}\`\n\nThe font files are now ready for use. Update your CSS/Tailwind config to reference these files.`;
                }
                else if (result.lastResortInfo) {
                    note += `\n\n**FAILED:** Could not automatically locate font files.\n\n${result.lastResortInfo}`;
                }
            }
            else {
                note = `\n\n**Note:** This setup assumes standard webfont formats.`;
            }
            return {
                content: [{ type: "text", text: "```javascript\n" + code + "\n```" + note }]
            };
        }
        throw new Error(`Tool ${name} not found`);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            content: [{ type: "text", text: `Error: ${errorMessage}` }],
            isError: true,
        };
    }
});
// Start Server
async function run() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Font MCP Server running on stdio");
}
run().catch((error) => {
    console.error("Fatal error running server:", error);
    process.exit(1);
});
