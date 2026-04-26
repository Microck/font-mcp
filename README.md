# Font MCP

<p>
  <a href="https://github.com/Microck/opencode-studio"><img src="https://img.shields.io/badge/opencode-studio-brown?logo=data%3Aimage%2Fpng%3Bbase64%2CiVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAABiElEQVR4nF2Sv0tWcRTGPyeVIpCWwmyJGqQagsqCsL2hhobsD3BvdWhoj/6CiIKaoqXBdMjKRWwQgqZ%2BokSvkIhg9BOT9xPn9Vx79cD3cu6953zP8zznCQB1V0S01d3AKeAKcBVYA94DjyJioru2k9SHE%2Bqc%2Bkd9rL7yf7TUm%2BpQ05yPUM%2Bo626Pp%2BqE2q7GGfWrOpjNnWnAOPAGeAK8Bb4U5D3AJ%2BAQsAAMAHfVvl7gIrAf2Kjiz8BZYB3YC/wFpoGDwHfgEnA0oU7tgHiheEShyXxY/Vn/n6ljye8DcBiYAloRcV3tAdrV1xMRG%2Bo94DywCAwmx33AJHASWK7iiAjzNFOBl7WapPYtYdyo8RlLqVpOVPvq9KoH1NUuOneycaRefqnP1ftdUyiOt5KS%2BqLWdDpVzTXMl5It4Jr6u%2BQ/nhyBc8C7jpowGxGvmxuPqT9qyYuFIKdP71B8WT3SOKexXLrntvqxq3BefaiuFMQ0wqZftxl3M78MjBasfiDN/SAi0kFbtf8ACtKBWZBDoJEAAAAASUVORK5CYII%3D" alt="Add with OpenCode Studio" /></a>
  <img src="https://img.shields.io/github/license/Microck/font-mcp" alt="License: MIT" />
  <img src="https://img.shields.io/badge/MCP-Server-blue" alt="MCP Server" />
</p>

An expert design advisor MCP server that finds, pairs, and sets up the best fonts for your project.

Font MCP doesn't just list fonts — it researches live discussions (Reddit, Typewolf), scans your project files for "vibe", and automatically hunts down font files for your setup.

## Table of Contents

- [Quick Start](#quick-start)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Tools Reference](#tools-reference)
- [Font Hunter Logic](#font-hunter-logic)
- [Configuration](#configuration)
- [How It Works](#how-it-works)
- [License](#license)

## Quick Start

**OpenCode**

Tell OpenCode:
```
fetch and follow instructions from https://raw.githubusercontent.com/Microck/font-mcp/master/.opencode/INSTALL.md
```

**Codex**

Tell Codex:
```
fetch and follow instructions from https://raw.githubusercontent.com/Microck/font-mcp/master/.codex/INSTALL.md
```

## Features

- **Live Research** — Searches Reddit (r/typography, r/web_design) and design archives (Typewolf, FontsInUse) for real-world usage examples and expert recommendations.
- **Project Scanning** — Analyzes your `package.json` and config files to detect your project's "vibe" and technical stack automatically.
- **Steal This Look** — Scans any website URL to identify what fonts they are using and whether they're paid or free.
- **Auto-Setup** — Generates Tailwind or CSS configuration and automatically downloads font files.
- **Font Hunter v2** — Exhaustive search engine that tries GitHub, GitLab, VK, Archive.org, and open directories to find your font files.
- **No-Free Fallback** — Strictly stays on S-tier/paid fonts unless you explicitly enable free fallback in config.

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- npm or your preferred package manager

### Build from Source

```bash
git clone https://github.com/Microck/font-mcp.git
cd font-mcp
npm install
npm run build
```

### Development

```bash
npm run dev
```

## Usage

### Tools Reference

| Tool | Description |
|------|-------------|
| `consult_font_expert` | Get recommendations based on a vibe or description |
| `analyze_project_and_recommend` | Auto-detect vibe from your project path and recommend fonts |
| `analyze_website` | Reverse-engineer the typography of any website URL |
| `setup_font_config` | Generate setup code and download font files automatically |

### `consult_font_expert`

Get expert font recommendations based on a vibe, project type, or visual description. Uses live research from Reddit, Typewolf, and FontsInUse.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `vibe` | string | Yes | Description of the project or aesthetic (e.g., `"luxury"`, `"tech startup"`, `"editorial"`, `"playful"`) |
| `allow_paid` | boolean | No | Whether to include paid/commercial fonts (default: `true`) |

### `analyze_project_and_recommend`

Scans the project directory (`package.json`, config files) to automatically detect the "vibe" and recommend suitable fonts.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `project_path` | string | Yes | Absolute path to the project root |
| `allow_paid` | boolean | No | Whether to include paid/commercial fonts (default: `true`) |

### `analyze_website`

Analyze a live website URL to identify which fonts it uses ("Steal this look").

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string | Yes | The website URL to analyze |

### `setup_font_config`

Generate CSS or Tailwind configuration and setup instructions for a specific font. Automatically attempts to download the font files for testing purposes (assuming you have a valid license).

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `font_name` | string | Yes | Name of the font |
| `is_paid` | boolean | Yes | Whether this is a paid font |
| `type` | string | No | Output format: `"tailwind"` or `"css"` (default: `"tailwind"`) |

### Example

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

## Font Hunter Logic

The tool assumes you own a valid license for any commercial font. It uses multiple strategies to locate files:

1. **Direct CDN / GitHub raw** patterns.
2. **Community sharing hubs** (VK, Telegram indices).
3. **Open directory dorking** (Google/browser search).
4. **Last resort**: Writes a `HUNTING_INSTRUCTIONS.txt` with specific search queries if auto-download fails.

## Configuration

You can tweak the behavior in your MCP config:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxDownloadAttempts` | number | `10` | Number of download strategies to try |
| `downloadTimeoutMs` | number | `30000` | Timeout in milliseconds for each font download request |
| `outputDir` | string | `'./public/fonts'` | Directory where downloaded font files and hunt artifacts are written |
| `allowFreeFontsFallback` | boolean | `false` | Set to `true` to allow Google Fonts fallback |

## How It Works

```
┌─────────────────┐     ┌──────────────┐     ┌──────────────────┐
│   AI Agent      │────▶│   Font MCP   │────▶│  Research Service │
│  (MCP Client)   │     │   Server     │     │  (Reddit, Typewolf)│
└─────────────────┘     └──────┬───────┘     └──────────────────┘
                               │
                    ┌──────────┼──────────┐
                    ▼          ▼          ▼
            ┌──────────┐ ┌──────────┐ ┌──────────┐
            │ Project  │ │   Web    │ │   Font   │
            │ Scanner  │ │ Detector │ │  Hunter  │
            └──────────┘ └──────────┘ └──────────┘
```

- **ResearchService** — Queries Reddit, Typewolf, and FontsInUse for live font recommendations.
- **ProjectScannerService** — Reads `package.json` and config files to detect project vibe and tech stack.
- **WebFontDetectorService** — Scrapes websites to identify font families in use.
- **ConfigGeneratorService** — Produces Tailwind or vanilla CSS configuration snippets.
- **FontHunterService** — Multi-strategy font file downloader (CDN, GitHub, community hubs, open directories).

## License

[MIT](LICENSE)
