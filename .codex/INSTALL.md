# installing font-mcp for codex/cursor/windsurf

## prerequisites

- node.js 18+ installed
- git installed

## installation steps

### 1. clone and build

```bash
git clone https://github.com/microck/font-mcp.git ~/font-mcp
cd ~/font-mcp
npm install
npm run build
```

### 2. configure your agent

add the following to your `~/.config/opencode/opencode.json` file under the `"mcp"` key:

```json
"font-mcp": {
  "type": "local",
  "command": [
    "node",
    "ABSOLUTE_PATH_TO_FONT_MCP/dist/index.js"
  ],
  "enabled": true
}
```

*note: replace `ABSOLUTE_PATH_TO_FONT_MCP` with your actual absolute path to the cloned repository.*


### 3. restart

restart your ide or agent service.

## usage

ask your agent:
> find me a font for a luxury tech brand
