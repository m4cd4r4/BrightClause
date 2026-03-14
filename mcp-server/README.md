# BrightClause MCP Server

MCP (Model Context Protocol) server that exposes BrightClause's contract analysis API to Claude.

## Features

Enables Claude to:
- **List and query documents** - See all uploaded contracts and their status
- **Extract clauses** - Trigger AI clause extraction with risk assessment
- **Search contracts** - Semantic search across all contracts
- **Knowledge graphs** - Access entity relationships
- **Risk analysis** - Get clause summaries with risk levels

## Available Tools

| Tool | Description |
|------|-------------|
| `list_documents` | List all uploaded contracts |
| `get_document` | Get details of a specific document |
| `get_clauses` | Get extracted clauses with risk levels |
| `extract_clauses` | Trigger AI clause extraction |
| `search_contracts` | Semantic search across contracts |
| `get_knowledge_graph` | Get entity relationship graph |
| `extract_entities` | Trigger entity extraction |
| `get_analysis_summary` | Get risk summary for a document |
| `get_clause_types` | List all 26 supported clause types |
| `search_clauses` | Search by clause type or risk level |

## Installation

```bash
cd mcp-server
npm install
```

## Configuration

Add to `~/.claude/mcp_settings.json`:

```json
{
  "mcpServers": {
    "brightclause": {
      "command": "node",
      "args": ["I:\\Scratch\\BrightClause\\mcp-server\\index.js"],
      "env": {
        "BRIGHTCLAUSE_API_URL": "http://45.77.233.102:8003"
      }
    }
  }
}
```

## Usage Examples

Once configured, Claude can:

- "List all my contracts"
- "What are the high-risk clauses in document X?"
- "Search for termination clauses across all contracts"
- "Extract clauses from the latest uploaded document"
- "Show me the knowledge graph for the SaaS agreement"

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BRIGHTCLAUSE_API_URL` | `http://45.77.233.102:8003` | Backend API URL |

## Development

```bash
# Run locally
node index.js

# Test with MCP Inspector
npx @modelcontextprotocol/inspector node index.js
```
