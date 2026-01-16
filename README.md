# font mcp

an expert design advisor mcp that finds, pairs, and sets up the best fonts for your project.

it doesn't just list fonts. it researches live discussions (reddit, typewolf), scans your project files for "vibe", and even helps you hunt down font files for testing.

## quickstart for ai agents

**opencode**
tell opencode:
> fetch and follow instructions from https://raw.githubusercontent.com/microck/font-mcp/master/.opencode/INSTALL.md

**codex / cursor / other**
tell your agent:
> fetch and follow instructions from https://raw.githubusercontent.com/microck/font-mcp/master/.codex/INSTALL.md

## features

- **live research**: searches reddit (r/typography, r/web_design) and design archives for real-world usage examples from the last year.
- **project scanning**: analyzes your `package.json` and config files to detect your project's "vibe" (e.g., "tech startup" vs "luxury fashion").
- **steal this look**: scans any website url to identify what fonts they are using (even hidden adobe/typekit ones).
- **auto-setup**: generates tailwind or css config for your chosen font.
- **font hunter**: attempts to find testing/trial files for paid fonts (if you confirm you have a license).
- **curated vault**: includes a hardcoded database of s-tier fonts (helvetica now, ogg, satoshi) as a fallback.

## usage

### tools

- `consult_font_expert`: get recommendations based on a vibe or description.
- `analyze_project_and_recommend`: auto-detects vibe from your project path and recommends fonts.
- `analyze_website`: reverse-engineers the typography of any website url.
- `setup_font_config`: generates tailwind/css code and attempts to download font files for verified license holders.
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

```json
{
  "name": "setup_font_config",
  "arguments": {
    "font_name": "Helvetica Now",
    "is_paid": true,
    "type": "tailwind",
    "confirm_paid": true
  }
}
```

## legal warning

**read this before using.**

this tool includes a "font hunter" feature that helps you find font files for testing. **you must own a valid license** for any commercial font you use.

- downloading fonts you haven't paid for is piracy.
- this tool assumes you have purchased a license and simply need the files for local dev.
- the creators of this tool accept no liability for misuse. **pay your type designers.**

## installation

```bash
git clone https://github.com/microck/font-mcp.git
cd font-mcp
npm install
npm run build
```

add to your mcp client config (e.g., `claude_desktop_config.json` or `opencode`):

```json
{
  "mcpServers": {
    "font-mcp": {
      "command": "node",
      "args": ["C:/Users/Microck/Documents/GitHub/font-mcp/dist/index.js"]
    }
  }
}
```

## license

mit
