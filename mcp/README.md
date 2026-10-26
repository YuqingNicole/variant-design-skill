# Variant Design MCP

Local stdio MCP server for existing `variant-output/.variant-context.json` schema v2 projects. Uses the official MCP TypeScript SDK (v1) and the repository's existing history/conflict implementation. Node.js 20+ required.

```sh
npm ci --prefix /absolute/path/to/variant-design-skill/mcp
node /absolute/path/to/variant-design-skill/mcp/server.mjs /absolute/path/to/project/variant-output /absolute/path/to/project
```

The second path is the project root containing the output directory; it defaults to the output's parent. The process waits for an MCP client on stdin. Stdout is reserved for protocol messages.

For Codex, add a local server (substitute actual absolute paths):

```toml
[mcp_servers.variant_design]
command = "node"
args = ["/absolute/path/to/variant-design-skill/mcp/server.mjs", "/absolute/path/to/project/variant-output", "/absolute/path/to/project"]
```

For clients using JSON configuration:

```json
{
  "mcpServers": {
    "variant-design": {
      "command": "node",
      "args": ["/absolute/path/to/variant-design-skill/mcp/server.mjs", "/absolute/path/to/project/variant-output", "/absolute/path/to/project"]
    }
  }
}
```

## Tools (13)

| Tool | Purpose |
| --- | --- |
| `get_guide` | Workflow and limitations |
| `get_basic_info` | Persisted project context |
| `get_selection` | Active variant and selected winner |
| `list_files` | Registered variant-owned files |
| `read_file` | Source or base64 asset contents |
| `get_tokens` | Persisted token metadata |
| `get_history` | Revision history and undo depth |
| `prepare_variant` | Durable candidate plus baseline |
| `write_candidate_file` | Edit candidate-owned files |
| `apply_variant` | Check conflicts, snapshot, apply |
| `undo_variant` | Restore previous revision safely |
| `select_variant` | Explicitly select winner |
| `build_preview` | Write comparison and React mounts |

## Example workflow

1. Call `get_guide`, `get_basic_info`, and `read_file` for B.
2. Call `prepare_variant` with `{"variant":"B"}`; keep its `candidateId`.
3. Call `write_candidate_file` with that ID, an owned filename and its full revised content.
4. Call `apply_variant` with the ID and a summary. Optionally supply `zone`, token metadata, and comparison metadata.
5. Call `build_preview`; use the existing project preview workflow to render/check the result.

Candidates survive server restarts in `<project>/.variant-mcp-candidates/`. Conflicted candidates are retained for inspection. Prepare a new candidate from current files and reconcile instead of rewriting the old baseline. Mutation operations reuse the output's lock, snapshots and conflict checks; candidates should have one writer. Multi-file commits have the same crash-recovery limitations as `variant-history.mjs`.

## Scope

This is an adapter for the local skill output, not a Paper protocol clone or a connection to the website's browser-local workspace. It does not create initial projects, invent a node tree, manipulate canvas selections, render screenshots, compute browser styles, convert HTML to JSX, or provide comments. `read_file` returns original React source when a registered file is JSX/TSX. `build_preview` does not start a server. Token changes update metadata only; agents must update corresponding source/CSS in the candidate. Adding/removing owned files requires the existing project registration workflow.

No global agent configuration is changed by installation. Generated files are executable application content: inspect and run normal project checks before using them. Existing locked design systems and unrelated variants are preserved by the history layer.

## Test

Run a persistent, isolated HTML demonstration through all 13 tools:

```sh
node mcp/demo.mjs
# Use the printed output directory:
node scripts/preview-server.mjs mcp/.demo-XXXXXX/variant-output 3333
```

Open `http://127.0.0.1:3333/` (or the port printed by the server). The demo keeps before/after pages, the A/B/C comparison, and `mcp-report.json` with actual tool responses. Each run creates a new ignored `.demo-*` project. Initial sample files are seeded by the demo script; subsequent edits, undo, selection and preview building use the MCP client.

```sh
npm test --prefix mcp
```

The regression uses an actual MCP SDK client over stdio and temporary fixtures. It checks tool discovery, input validation, ownership, deferred edits, locked tokens, stale candidates, external edits, undo, winner isolation and preview generation.

## Editable canvas adapter

For the new `/canvas` editor, use **`canvas-server.mjs`** instead. It exposes 18 node-level tools over the same local HTTP API as the browser, with revision checks, selection synchronization, undo/redo and HTML export. Start the website before connecting. See [canvas setup and limitations](../website/CANVAS.md). The 13 file-based tools documented above remain a separate connection.
