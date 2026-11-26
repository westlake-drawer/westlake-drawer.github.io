# westlake-drawer-mcp

A local MCP server that gives your own agent the Westlake Drawer resource index and
curated learning paths. It answers **where to look**, not what the material says.

- No API key, no network call, no telemetry: it reads `./data` bundled in this folder.
- Your model stays on your side. This process never generates text.
- It only returns site URLs that already exist in the index.

## Requirements

Node.js 18 or newer. No dependencies.

## Run

```bash
node mcp/index.js
```

Add it to an MCP client. For Claude Code:

```bash
claude mcp add westlake-drawer -- node /absolute/path/to/mcp/index.js
```

For Cursor or another client that uses JSON config:

```json
{
  "mcpServers": {
    "westlake-drawer": {
      "command": "node",
      "args": ["/absolute/path/to/mcp/index.js"]
    }
  }
}
```

## Tools

| Tool | Returns |
| :--- | :--- |
| `search_resources` | Matching notes and tools: title, URL, subject, course, repository |
| `get_learning_path` | A curated path (title, summary, ordered steps with a one-line reason) |
| `get_resource` | One resource by site path or title |
| `list_majors` | Majors and subjects in the index, with counts |

Every URL in a response points at `https://westlake-drawer.github.io`.

## Keeping data fresh

The server reads a snapshot copied from the site build:

```bash
npm run mcp:sync     # refresh mcp/data from the current index
```

Run it after the index changes, or re-clone the repository.

## Privacy

- Reads only `./data/search-index.json` and `./data/paths.json` — files that contain
  public site metadata (titles, descriptions, subjects, repository names, URLs).
- Writes nothing, sends nothing, and keeps no logs.
- It has no access to your key, your conversations, or your machine beyond its folder.
