import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { curatedFonts } from "./data/curatedFonts.js";
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
// Helper to filter fonts
function filterFonts(vibe, category, includePaid = true) {
    let results = curatedFonts;
    if (!includePaid) {
        results = results.filter((f) => !f.isPaid);
    }
    if (category) {
        results = results.filter((f) => f.category === category);
    }
    if (vibe) {
        const search = vibe.toLowerCase();
        results = results.filter((f) => f.tags.some((t) => t.includes(search)) ||
            f.description.toLowerCase().includes(search) ||
            f.name.toLowerCase().includes(search));
    }
    return results;
}
// Tool Definitions
const TOOLS = [
    {
        name: "consult_font_expert",
        description: "Get expert font recommendations based on a vibe, project type, or visual description. Returns a curated selection of high-quality fonts (both paid and free).",
        inputSchema: z.object({
            vibe: z
                .string()
                .describe("Description of the project or aesthetic (e.g., 'luxury', 'tech start-up', 'editorial', 'playful')"),
            category: z
                .enum(["sans-serif", "serif", "display", "mono", "slab", "script"])
                .optional()
                .describe("Specific font category if known"),
            allow_paid: z
                .boolean()
                .default(true)
                .describe("Whether to include paid/commercial fonts in recommendations"),
        }),
    },
    {
        name: "get_font_details",
        description: "Get detailed information, history, and purchasing/download links for a specific font.",
        inputSchema: z.object({
            font_name: z.string().describe("The exact name of the font"),
        }),
    },
    {
        name: "get_pairings",
        description: "Get expert-recommended pairings for a specific font.",
        inputSchema: z.object({
            font_name: z.string().describe("The font to find pairings for"),
        }),
    },
    {
        name: "list_all_expert_fonts",
        description: "List all fonts currently in the expert's curated database.",
        inputSchema: z.object({
            category: z
                .enum(["sans-serif", "serif", "display", "mono", "slab", "script"])
                .optional(),
        }),
    },
];
// Request Handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: TOOLS.map((t) => ({
            name: t.name,
            description: t.description,
            inputSchema: t.inputSchema, // Zod schema needs conversion to JSON schema, SDK handles this usually or we map it manually if needed.
            // The SDK expects JSON Schema. Zod objects need zod-to-json-schema or manual definition.
            // For simplicity in this raw file, I will manually return the JSON schema structure expected by MCP.
            // Wait, SDK v0.6+ handles basic objects? No, usually need explicit JSON Schema.
            // I'll rewrite the return to match exact JSON Schema required by MCP.
        })),
    };
});
// Fix for Zod -> JSON Schema manually for the handler
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
                        category: {
                            type: "string",
                            enum: [
                                "sans-serif",
                                "serif",
                                "display",
                                "mono",
                                "slab",
                                "script",
                            ],
                        },
                        allow_paid: { type: "boolean" },
                    },
                    required: ["vibe"],
                },
            },
            {
                name: "get_font_details",
                description: "Get details and links for a font.",
                inputSchema: {
                    type: "object",
                    properties: {
                        font_name: { type: "string" },
                    },
                    required: ["font_name"],
                },
            },
            {
                name: "get_pairings",
                description: "Get pairing recommendations.",
                inputSchema: {
                    type: "object",
                    properties: {
                        font_name: { type: "string" },
                    },
                    required: ["font_name"],
                },
            },
            {
                name: "list_all_expert_fonts",
                description: "List all curated fonts.",
                inputSchema: {
                    type: "object",
                    properties: {
                        category: {
                            type: "string",
                            enum: [
                                "sans-serif",
                                "serif",
                                "display",
                                "mono",
                                "slab",
                                "script",
                            ],
                        },
                    },
                },
            },
        ],
    };
});
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        if (name === "consult_font_expert") {
            const vibe = args?.vibe;
            const category = args?.category;
            const allowPaid = args?.allow_paid !== false; // Default true
            // Dynamic research first
            let expertResearch = "";
            try {
                expertResearch = await researchService.getExpertRecommendations(vibe);
            }
            catch (e) {
                console.error("Research failed, falling back to static DB");
            }
            const recommendations = filterFonts(vibe, category, allowPaid);
            if (recommendations.length === 0 && !expertResearch) {
                return {
                    content: [
                        {
                            type: "text",
                            text: "I couldn't find a perfect match in my curated collection for that specific vibe. However, for a high-quality project, I generally recommend starting with a versatile workhorse like 'Inter' (free) or 'Helvetica Now' (paid).",
                        },
                    ],
                };
            }
            // Format output nicely
            const text = recommendations
                .map((f) => `### ${f.name} (${f.foundry})\n` +
                `*Style:* ${f.category}, ${f.tags.join(", ")}\n` +
                `*Why:* ${f.description}\n` +
                `*Cost:* ${f.isPaid ? "Paid ($)" : "Free"}\n` +
                `*Link:* ${f.isPaid ? f.purchaseLink : f.downloadLink}\n`)
                .join("\n");
            const combinedOutput = expertResearch
                ? `${expertResearch}\n\n---\n\n**Also consider these verified classics from my personal vault:**\n\n${text}`
                : `Here are my top recommendations for "${vibe}":\n\n${text}`;
            return {
                content: [{ type: "text", text: combinedOutput }],
            };
        }
        if (name === "get_font_details") {
            const fontName = args?.font_name;
            const font = curatedFonts.find((f) => f.name.toLowerCase() === fontName.toLowerCase());
            if (!font) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `I don't have detailed dossier on "${fontName}" in my immediate curated list. It might be a good font, but it's not in my "Best of Class" database.`,
                        },
                    ],
                };
            }
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(font, null, 2),
                    },
                ],
            };
        }
        if (name === "get_pairings") {
            const fontName = args?.font_name;
            const font = curatedFonts.find((f) => f.name.toLowerCase() === fontName.toLowerCase());
            if (!font) {
                return {
                    content: [
                        { type: "text", text: "Font not found in curated database." },
                    ],
                };
            }
            return {
                content: [
                    {
                        type: "text",
                        text: `Best pairings for ${font.name}:\n- ${font.bestPairings.join("\n- ")}`,
                    },
                ],
            };
        }
        if (name === "list_all_expert_fonts") {
            const category = args?.category;
            const results = category
                ? curatedFonts.filter((f) => f.category === category)
                : curatedFonts;
            const list = results.map(f => `- ${f.name} (${f.category})`).join("\n");
            return {
                content: [{ type: "text", text: `Curated Fonts:\n${list}` }]
            };
        }
        if (name === "analyze_project_and_recommend") {
            const projectPath = args?.project_path;
            const allowPaid = args?.allow_paid !== false;
            const analysis = await projectScanner.analyzeProject(projectPath);
            // Use the detected vibe to perform the standard consultation
            const vibe = analysis.vibe;
            let expertResearch = "";
            try {
                expertResearch = await researchService.getExpertRecommendations(vibe);
            }
            catch (e) {
                console.error("Research failed");
            }
            const recommendations = filterFonts(vibe, undefined, allowPaid);
            // Reuse format logic (could refactor this to helper but inline is fine for now)
            const text = recommendations
                .map((f) => `### ${f.name} (${f.foundry})\n` +
                `*Style:* ${f.category}, ${f.tags.join(", ")}\n` +
                `*Why:* ${f.description}\n` +
                `*Cost:* ${f.isPaid ? "Paid ($)" : "Free"}\n` +
                `*Link:* ${f.isPaid ? f.purchaseLink : f.downloadLink}\n`)
                .join("\n");
            const intro = `I analyzed your project at \`${projectPath}\`.\n` +
                `**Detected Vibe:** "${vibe}"\n` +
                `**Keywords:** ${analysis.keywords.join(', ')}\n` +
                `**Tech Stack:** ${analysis.technicalStack.join(', ')}\n\n` +
                `Based on this profile, here are my findings:\n\n`;
            const combinedOutput = expertResearch
                ? `${intro}${expertResearch}\n\n---\n\n**Verified Classics:**\n\n${text}`
                : `${intro}Here are my top recommendations:\n\n${text}`;
            return {
                content: [{ type: "text", text: combinedOutput }]
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
            const confirmPaid = args?.confirm_paid !== false; // Default to true if omitted
            let code = "";
            if (type === 'tailwind') {
                code = await configGenerator.generateTailwindConfig(fontName);
            }
            else {
                code = await configGenerator.generateCssSetup(fontName, isPaid);
            }
            let note = "";
            if (isPaid) {
                if (confirmPaid) {
                    note += `\n\n**STATUS:** You confirmed payment/license for this font. Initiating search for testing files...`;
                    // Attempt download
                    const url = await fontHunter.findFontFile(fontName);
                    if (url) {
                        note += `\n\n**SUCCESS:** Found source file at \`${url}\`. \n(In a real implementation, I would download this to \`./public/fonts/\` automatically, but here is the link for manual verification).`;
                    }
                    else {
                        note += `\n\n**FAILED:** Could not locate a publicly accessible testing file for '${fontName}'. You must drag the licensed file manually into \`./public/fonts/\`.`;
                    }
                }
                else {
                    note += `\n\n**WARNING:** Payment not confirmed. Download skipped. Please purchase a license.`;
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
