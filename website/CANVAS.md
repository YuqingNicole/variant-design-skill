# Landing canvas

The `/lab/canvas` route (formerly `/canvas`, which still redirects) is a local authoring application. It shares one versioned node document and renderer with the canvas MCP server. This is separate from the legacy `/workbench` HTML generator and the schema-v2 file-based MCP adapter.

## Run

```sh
npm ci --prefix website
npm run dev --prefix website -- --port 4188
```

Open `http://127.0.0.1:4188/lab/canvas`. The default create action starts with three explicitly labeled built-in layouts. With a provider configured, the separate AI generation action requests three structured documents and saves them only after all pass validation. The brief becomes editable introductory copy. Use the layer list or double-click canvas text to edit. Images are PNG/JPEG/WebP up to 2 MB and are embedded in the document/export.

Projects persist to `website/.canvas-data/<uuid>.json`. Embedded images are stored once per file, however many undo snapshots reference them; set `CANVAS_DATA_DIR` to use another local directory. The browser remembers the last project ID, not the document itself. Keep this directory backed up. Project links work on the same server; they are not public sharing links. New projects retain old project files.

The authoring API accepts loopback hosts only and rejects cross-origin browser requests. Do not expose this process as a multi-user service. Publishing an exported static landing does not publish the editor or its stored projects.

## Web mode

On any host other than `localhost`, `127.0.0.1` or `[::1]`, such as the published website, `/lab/canvas` runs without the canvas server. `src/canvas-browser-store.ts` answers the same API routes inside the tab and keeps projects in this browser's IndexedDB (`variant-canvas` database). The state rules are shared with the local file store (`shared/canvas-state.mjs`): the same revisions, 30-step undo/redo, stale-write refusal and one stored copy of each image. Web mode never calls `/api/canvas`.

- Projects stay in that browser profile. Clearing site data deletes them, and they do not sync to other devices. Keep a copy with **下载项目备份 / Download project backup** in the delivery panel.
- To continue a web project with an agent, import that backup on the local canvas start page (**导入项目备份**). Import creates a new project with the documents and chosen direction; undo history is not included. Both modes accept the same backup file.
- Two tabs on the same project are protected by revisions: a tab working from an older revision is refused and reloads the current one.
- AI generation and proposals use the site's model when the site enables it (see Deployment). The browser sends the brief, or the selected subtree with embedded images replaced by a placeholder, to the stateless `POST /api/canvas/documents` and `POST /api/canvas/suggest` routes, validates the result and saves it locally. The server keeps nothing. Without a configured model these controls stay disabled.
- Agents and MCP cannot reach a web project. The editor shows how to run the canvas locally and import a backup.
- If the browser blocks IndexedDB, the project lives in memory for that tab and the editor warns that a reload will lose it.

Add `?storage=browser` on localhost to try web mode against the local server (used by the browser regression); the choice stays in project links for that tab.

## Deployment

The public site is deployed to Vercel. `vercel.json` at the repository root installs and builds `website/`, serves `website/dist`, and rewrites `/api/*` to one function, `api/index.mjs`, which runs the same `handleApi` as the local server. Library routes are prerendered files (RFC-002); other page routes fall back to `app.html`, the unmodified app shell. `/canvas`, `/workbench` and the old `/showcase` case pages redirect with 301. `.vercelignore` uploads only `website/`, `scripts/` and `api/`, and excludes `website/.env` and `website/.canvas-data/`. Merging to `master` deploys production through the Vercel GitHub integration; pull requests get preview deployments.

On Vercel, the canvas project routes refuse with 403 (the host is not loopback), so the canvas runs in web mode. **Model routes are off by default**: `api/index.mjs` answers `GET /api/status` with `{configured:false}` and every other route with 404 unless the project sets `PUBLIC_MODEL_ROUTES=1`. To enable them, also configure a provider with the same variables as `website/.env.example`:

```sh
vercel env add PUBLIC_MODEL_ROUTES production # value: 1
vercel env add ANTHROPIC_API_KEY production   # paste the key when prompted
vercel env add ANTHROPIC_MODEL production     # optional
vercel deploy --prod                          # or merge to master
```

Once enabled, these routes are public: anyone who can open the site can spend that key on canvas generation, proposals and the `/lab/workbench` generator. Cross-origin browser requests are refused, but that does not stop scripted clients. Set a spending limit on the provider key, and consider a Vercel Firewall rate-limit rule for `/api/`. The function's `maxDuration` is 300 seconds; generation makes three parallel model calls, each limited by `MODEL_TIMEOUT_MS`.

## Canvas operations

- Compare A/B/C, choose a delivery direction explicitly.
- Select elements; double-click text; edit text, link destination, styles and image description.
- While editing on the canvas, Enter saves and Esc discards. Headings, links and labels are single-line; in a paragraph, Shift+Enter adds a line break.
- Style fields accept everyday input: `48` becomes `48px`, and color names or `rgb()` become hex values. Text color and background color also have a color picker. A rejected value shows a message and the field returns to its previous value.
- Each starter has its own type family, section order and hero treatment. `fontFamily` accepts the generic `serif`, `sans-serif` or `monospace`; `padding` accepts one or two values, such as `40px 0`.
- Pan and zoom; switch between 1120px desktop and 390px mobile frames.
- Reorder top-level sections using drag handles or accessible up/down buttons. A navigation that leads the page stays first and a closing footer stays last; the document rules reject any move that breaks this, including moves sent through MCP or the API.
- Duplicate, hide, delete and insert images. Generic node insertion is available through MCP.
- Undo/redo document edits (30 snapshots), from the header buttons or with ⌘Z / Ctrl+Z and ⇧⌘Z / Ctrl+Y while focus is outside a text field. Selecting a direction is separate; undo/redo never changes the selected delivery winner.
- Preview and export standalone HTML. Heading, image and internal-link checks block incomplete exports. These are structural checks, not a full accessibility audit or link-availability test.

Only validated node types, properties and CSS styles are rendered. All text and attributes are escaped. The editor bridge is trusted application code, not model-supplied JavaScript. Its iframe is sandboxed with `allow-scripts` only, so the page inside has an opaque origin and cannot reach the editor, its storage or the API; it talks to the editor through `postMessage`. Still, never put arbitrary generated HTML into this iframe. The exported page contains no editing bridge or dependency on React.

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

Example: `get_selection({projectId})`, then `set_text_content({projectId,direction:"B",nodeId:"headline",expectedRevision:5,text:"Your revised headline"})`. The browser polls for external changes every two seconds, except while a local input is being edited or saved. A poll sends the current `stamp` (revision, active direction, selection and winner) and receives `204` when nothing changed. If an external edit arrives while you type on the canvas, your text is still saved, unless that same text was changed in the meantime; in that case the editor shows what you typed instead of overwriting the other change. Conflicting writes fail with HTTP 409; read, reconcile, then issue a new edit. Never silently retry using a fresh revision.

## HTTP API

`POST /api/canvas/documents` (`{brief}` → `{documents}`) and `POST /api/canvas/suggest` (`{node, instruction}` → `{summary, commands}`) call the model without reading or writing projects, accept any same-origin host, and are what web mode uses. `POST /api/canvas/projects` accepts `{brief}` for template starts; `POST /api/canvas/import` accepts a project backup (`format: "variant-canvas-project"`, `version: 1`, `brief`, `selected`, `documents`), validates every document and creates a new project with `origin: "import"` (up to 30 MB, for embedded images); `POST /api/canvas/generate` accepts `{brief}` for provider-backed generation. `GET /api/canvas/projects/:id` returns documents, revision, active direction, selection, winner and history counts. With `?stamp=<revision>:<active>:<selection>:<winner>` it returns `204` when that is still current. A save lock older than 30 seconds is treated as left by a crashed process and is replaced.

`POST /api/canvas/projects/:id/{edit,selection,select,undo,redo}` accepts `expectedRevision` and operation parameters. `edit` accepts `{direction,commands,summary}`. A selection changes UI context without creating an undo step or changing the content revision.

`POST .../propose` takes `{expectedRevision,direction,nodeId,instruction}`. `GET .../{preview,export,validate}?direction=B` reads the current direction. Export returns a download; preview preserves anchors and native FAQ interactions.

## Boundaries

This version handles structured landing pages. It does not round-trip arbitrary existing HTML/React into editable nodes, expose computed styles/screenshots as MCP tools, submit forms, host a shared editing backend (web mode stores projects per browser), or automatically deploy from the editor. Downloaded HTML can be published with a hosting service; that is a separate operation. Uploaded image data is self-contained; HTTPS images supplied through MCP still depend on those external URLs.

The old file MCP (`mcp/server.mjs`) still has its original 13 tools and schema-v2 workflow. The new canvas MCP (`mcp/canvas-server.mjs`) has 18 tools and uses schema-v1 structured documents. These are distinct adapters, not 31 tools on one connection.

## Validation

```sh
npm test --prefix website
npm test --prefix mcp
npm run build --prefix website
cd tests
PLAYWRIGHT_CHANNEL=chrome npx playwright test -c canvas.config.mjs
```

The browser regression covers creation, double-click editing, undo/redo, external synchronization, stale writes, drag ordering, mobile width, image upload, export download, persistence, FAQ and anchor navigation, plus web mode: IndexedDB persistence with one stored copy of an image, a refused stale undo from a second tab, preview, export and no `/api/canvas` requests, then importing its backup into the local canvas; and web-mode AI generation and proposals against mocked model routes. MCP tests use a real SDK stdio client and HTTP server. Model-backed generation and proposals have mocked-provider regression coverage and still need provider-enabled quality acceptance testing.
