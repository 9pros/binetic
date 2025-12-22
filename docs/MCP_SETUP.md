# Binetic MCP Server Setup

This MCP server exposes the internal state of the Binetic AGI (Brain, Network, Operators) to external LLM agents (like Claude Desktop).

## Prerequisites

1. Ensure you have Python 3.11+ installed.
2. Install the dependencies:
   ```bash
   pip install -e .
   # or specifically
   pip install mcp
   ```

## Running the Server

You can run the server directly:

```bash
python mcp_server.py
```

## Configuring Claude Desktop

To connect Claude Desktop to this MCP server, add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "binetic": {
      "command": "python",
      "args": ["/absolute/path/to/binetic/mcp_server.py"]
    }
  }
}
```

## Features

### Resources
- `binetic://brain/status`: View current goals, thoughts, and stats.
- `binetic://network/slots`: View active network slots (micro-agents).
- `binetic://operators/list`: List all available operators.

### Tools
- `add_thought(content, type)`: Inject a thought into the brain.
- `execute_operator(name, params)`: Run an operator manually.
- `scan_discovery_source(url)`: Trigger discovery on a URL.

### Prompts
- `analyze_system_health`: A pre-configured prompt to check system status.
