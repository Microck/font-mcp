# font mcp
<p>
  <a href="https://github.com/Microck/opencode-studio"><img src="https://img.shields.io/badge/opencode-studio-brown?logo=data%3Aimage%2Fpng%3Bbase64%2CiVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAABiElEQVR4nF2Sv0tWcRTGPyeVIpCWwmyJGqQagsqCsL2hhobsD3BvdWhoj/6CiIKaoqXBdMjKRWwQgqZ%2BokSvkIhg9BOT9xPn9Vx79cD3cu6953zP8zznCQB1V0S01d3AKeAKcBVYA94DjyJioru2k9SHE%2Bqc%2Bkd9rL7yf7TUm%2BpQ05yPUM%2Bo626Pp%2BqE2q7GGfWrOpjNnWnAOPAGeAK8Bb4U5D3AJ%2BAQsAAMAHfVvl7gIrAf2Kjiz8BZYB3YC/wFpoGDwHfgEnA0oU7tgHiheEShyXxY/Vn/n6ljye8DcBiYAloRcV3tAdrV1xMRG%2Bo94DywCAwmx33AJHASWK7iiAjzNFOBl7WapPYtYdyo8RlLqVpOVPvq9KoH1NUuOneycaRefqnP1ftdUyiOt5KS%2BqLWdDpVzTXMl5It4Jr6u%2BQ/nhyBc8C7jpowGxGvmxuPqT9qyYuFIKdP71B8WT3SOKexXLrntvqxq3BefaiuFMQ0wqZftxl3M78MjBasfiDN/SAi0kFbtf8ACtKBWZBDoJEAAAAASUVORK5CYII%3D" alt="Add with OpenCode Studio" /></a>
</p>

an expert design advisor mcp that finds, pairs, and sets up the best fonts for your project.

it doesn't just list fonts. it researches live discussions (reddit, typewolf), scans your project files for "vibe", and automatically hunts down font files for your setup.

## quickstart for ai agents

**opencode**
tell opencode:
```
fetch and follow instructions from https://raw.githubusercontent.com/microck/font-mcp/master/.opencode/INSTALL.md
```

**codex**
tell codex:
```
fetch and follow instructions from https://raw.githubusercontent.com/microck/font-mcp/master/.codex/INSTALL.md
```

## features

- **live research**: searches reddit (r/typography, r/web_design) and design archives for real-world usage examples.
- **project scanning**: analyzes your `package.json` and config files to detect your project's "vibe".
- **steal this look**: scans any website url to identify what fonts they are using.
- **auto-setup**: generates tailwind or css config and automatically downloads font files.
- **font hunter v2**: exhaustive search engine that tries github, gitlab, vk, archive.org, and open directories to find your font files.
- **no-free fallback**: strictly stays on s-tier/paid fonts unless you explicitly enable free fallback in config.

## usage

### tools

- `consult_font_expert`: get recommendations based on a vibe or description.
- `analyze_project_and_recommend`: auto-detects vibe from your project path and recommends fonts.
- `analyze_website`: reverse-engineers the typography of any website url.
- `setup_font_config`: generates setup code and executes the font hunter to download files automatically.

### example

```json
{
  "name": "setup_font_config",
  "arguments": {
    "font_name": "Helvetica Now",
    "is_paid": true,
    "type": "tailwind"
  }
}
```

## font hunter logic

the tool assumes you own a valid license for any commercial font. it uses multiple strategies to locate files:
1. direct cdn/github raw patterns.
2. community sharing hubs (vk, telegram indices).
3. open directory dorking (google/browser search).
4. last resort: writes a `HUNTING_INSTRUCTIONS.txt` with specific search queries if auto-download fails.

## configuration

you can tweak the behavior in your mcp config:
- `maxDownloadAttempts`: number of strategies to try (default: 10).
- `allowFreeFontsFallback`: set to `true` to allow google fonts fallback (default: `false`).

## installation

```bash
git clone https://github.com/microck/font-mcp.git
cd font-mcp
npm install
npm run build
```

## license

mit
