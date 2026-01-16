# installing font-mcp for opencode

## prerequisites

- [opencode.ai](https://opencode.ai) installed
- node.js 18+ installed
- git installed

## installation steps

### 1. clone and build

download the server code to your local machine:

```bash
git clone https://github.com/microck/font-mcp.git ~/font-mcp
cd ~/font-mcp
npm install
npm run build
```

### 2. register the mcp server

configure opencode to use this server by creating the config file:

```bash
mkdir -p ~/.config/opencode/mcp
echo '{
  "mcpServers": {
    "font-mcp": {
      "command": "node",
      "args": ["'$(pwd)'/dist/index.js"]
    }
  }
}' > ~/.config/opencode/mcp/font-mcp.json
```

### 3. restart opencode

restart opencode to load the new configuration.

## usage

### check status

ask opencode:
> check font-mcp status

### use tools

you can now use commands like:
> consult_font_expert with vibe: "cyberpunk minimalist"

## troubleshooting

### server not found

1. check if the file exists: `ls ~/font-mcp/dist/index.js`
2. verify config: `cat ~/.config/opencode/mcp/font-mcp.json`
3. ensure node is in your path.

### permission denied

if getting eacces errors, try running:
`chmod +x ~/font-mcp/dist/index.js` (though usually not needed as we run via node command).
