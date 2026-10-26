# Landing canvas

The `/canvas` route is a local authoring application. It shares one versioned node document and renderer with the canvas MCP server. This is separate from the legacy `/workbench` HTML generator and the schema-v2 file-based MCP adapter.

## Run

```sh
npm ci --prefix website
npm run dev --prefix website -- --port 4188
```

Open `http://127.0.0.1:4188/canvas`. The default create action starts with three explicitly labeled built-in layouts. With a provider configured, the separate AI generation action requests three structured documents and saves them only after all pass validation. The brief becomes editable introductory copy. Use the layer list or double-click canvas text to edit. Images are PNG/JPEG/WebP up to 2 MB and are embedded in the document/export.

Projects persist to `website/.canvas-data/<uuid>.json`; set `CANVAS_DATA_DIR` to use another local directory. The browser remembers the last project ID, not the document itself. Keep this directory backed up. Project links work on the same server; they are not public sharing links. New projects retain old project files.

The authoring API accepts loopback hosts only and rejects cross-origin browser requests. Do not expose this process as a multi-user service. Publishing an exported static landing does not publish the editor or its stored projects.

## Canvas operations

- Compare A/B/C, choose a delivery direction explicitly.
- Select elements; double-click text; edit text, link destination, styles and image description.
- Pan and zoom; switch between 1120px desktop and 390px mobile frames.
- Reorder top-level sections using drag handles or accessible up/down buttons.
- Duplicate, hide, delete and insert images. Generic node insertion is available through MCP.
- Undo/redo document edits (30 snapshots). Selecting a direction is separate; undo/redo never changes the selected delivery winner.
- Preview and export standalone HTML. Heading, image and internal-link checks block incomplete exports. These are structural checks, not a full accessibility audit or link-availability test.

Only validated node types, properties and CSS styles are rendered. All text and attributes are escaped. The editor bridge is trusted application code, not model-supplied JavaScript. Its iframe uses same-origin access for browser compatibility; never put arbitrary generated HTML into this iframe. The exported page contains no editing bridge or dependency on React.

Changing UI language leaves authored document content intact. Starter page content is Chinese; edit it to match the desired audience.

## Agent workflow

The optional AI generation and in-app instruction panel use the website's existing model configuration (`website/.env`). With no provider configured, this button is disabled and the editor remains usable. A model receives the selected subtree and may return text/style/property commands. The server validates the scope and renders a proposed result; it never automatically applies the proposal. Applying uses the original revision and rejects changes if the page has moved on. Live model quality has not been verified without provider credentials.

External agents use the canvas MCP without an application model key:

```sh
npm ci --prefix mcp
node /absolute/path/to/variant-design-skill/mcp/canvas-server.mjs http://127.0.0.1:4188
```

Example client configuration:

```json
{
  "mcpServers": {
    "variant-canvas": {
      "command": "node",
      "args": ["/absolute/path/to/variant-design-skill/mcp/canvas-server.mjs", "http://127.0.0.1:4188"]
    }
  }
}
```

Copy the project ID from the browser URL or the delivery panel. All 18 tools use `projectId`; direction-specific tools use `direction: "A" | "B" | "C"`. Every mutation requires `expectedRevision` from a fresh read.

| Tools | Purpose |
| --- | --- |
| `get_basic_info`, `get_selection`, `get_tree_summary`, `get_node_info`, `get_tokens` | Read the shared project, selected node and document |
| `set_selection` | Highlight a node in the user's canvas |
| `set_text_content`, `update_styles`, `update_props`, `rename_node` | Edit a node |
| `move_node`, `duplicate_node`, `delete_node`, `apply_commands` | Edit structure; command batches are one undo step |
| `undo`, `redo` | Restore an edit without changing the winner |
| `validate_landing`, `export_html` | Check and deliver standalone HTML |

Example: `get_selection({projectId})`, then `set_text_content({projectId,direction:"B",nodeId:"headline",expectedRevision:5,text:"Your revised headline"})`. The browser polls for external changes every two seconds, except while a local input is being edited or saved. Conflicting writes fail with HTTP 409; read, reconcile, then issue a new edit. Never silently retry using a fresh revision.

## HTTP API

`POST /api/canvas/projects` accepts `{brief}` for template starts; `POST /api/canvas/generate` accepts `{brief}` for provider-backed generation. `GET /api/canvas/projects/:id` returns documents, revision, active direction, selection, winner and history counts.

`POST /api/canvas/projects/:id/{edit,selection,select,undo,redo}` accepts `expectedRevision` and operation parameters. `edit` accepts `{direction,commands,summary}`. A selection changes UI context without creating an undo step or changing the content revision.

`POST .../propose` takes `{expectedRevision,direction,nodeId,instruction}`. `GET .../{preview,export,validate}?direction=B` reads the current direction. Export returns a download; preview preserves anchors and native FAQ interactions.

## Boundaries

This version handles structured landing pages. It does not round-trip arbitrary existing HTML/React into editable nodes, expose computed styles/screenshots as MCP tools, submit forms, host a shared editing backend, or automatically deploy from the editor. Downloaded HTML can be published with a hosting service; that is a separate operation. Uploaded image data is self-contained; HTTPS images supplied through MCP still depend on those external URLs.

The old file MCP (`mcp/server.mjs`) still has its original 13 tools and schema-v2 workflow. The new canvas MCP (`mcp/canvas-server.mjs`) has 18 tools and uses schema-v1 structured documents. These are distinct adapters, not 31 tools on one connection.

## Validation

```sh
npm test --prefix website
npm test --prefix mcp
npm run build --prefix website
cd tests
PLAYWRIGHT_CHANNEL=chrome npx playwright test -c canvas.config.mjs
```

The browser regression covers creation, double-click editing, undo/redo, external synchronization, stale writes, drag ordering, mobile width, image upload, export download, persistence, FAQ and anchor navigation. MCP tests use a real SDK stdio client and HTTP server. Model-backed generation and proposals have mocked-provider regression coverage and still need provider-enabled quality acceptance testing.
