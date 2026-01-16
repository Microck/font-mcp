# font mcp installer

this script installs the font-mcp server and configures it for your ai agent.

1. clones the repo to `~/font-mcp`.
2. builds the project.
3. adds the mcp server config.

## instructions for agent

run the following bash command:

```bash
git clone https://github.com/microck/font-mcp.git ~/font-mcp && \
cd ~/font-mcp && \
npm install && \
npm run build && \
echo "add this to your mcp config: {\"mcpServers\":{\"font-mcp\":{\"command\":\"node\",\"args\":[\"$(pwd)/dist/index.js\"]}}}"
```
