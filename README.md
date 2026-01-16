# font mcp

an expert design advisor mcp that finds the best fonts for your project.

it doesn't just list fonts. it researches live discussions (reddit, typewolf) and scans your project files to give opinionated, context-aware recommendations.

## features

- **live research**: searches reddit (r/typography, r/web_design) and design archives for real-world usage examples from the last year.
- **project scanning**: analyzes your `package.json` and config files to detect your project's "vibe" (e.g., "tech startup" vs "luxury fashion").
- **curated vault**: includes a hardcoded database of s-tier fonts (helvetica now, ogg, satoshi) as a fallback.
- **expert pairings**: suggests proven font combinations.

## usage

### tools

- `consult_font_expert`: get recommendations based on a vibe or description.
- `analyze_project_and_recommend`: auto-detects vibe from your project path and recommends fonts.
- `get_font_details`: get history, download links, and pricing for a specific font.

### example

```json
{
  "name": "consult_font_expert",
  "arguments": {
    "vibe": "brutalist architecture portfolio",
    "allow_paid": true
  }
}
```

## installation

```bash
git clone https://github.com/microck/font-mcp.git
cd font-mcp
npm install
npm run build
```

add to your mcp client config:

```json
{
  "mcpServers": {
    "font-mcp": {
      "command": "node",
      "args": ["/path/to/font-mcp/dist/index.js"]
    }
  }
}
```

## license

mit
