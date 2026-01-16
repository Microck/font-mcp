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

add the following to your agent's MCP configuration file (e.g., `claude_desktop_config.json` or cursor settings):

```json
{
  "mcpServers": {
    "font-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/home/font-mcp/dist/index.js"]
    }
  }
}
```

*note: replace `/absolute/path/to/home` with your actual home directory path.*

### 3. restart

restart your ide or agent service.

## usage

ask your agent:
> find me a font for a luxury tech brand
