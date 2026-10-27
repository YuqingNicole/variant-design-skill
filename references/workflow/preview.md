# Preview and comparison

Read this when building or reopening previews: after the first generation, after every edit, undo or selection, and for `open B` or `compare`.

## Register and compare

Use schema v2 in `references/workflow/project-context.md`. Register A/B/C with their complete owned file sets, exact tokens, and the three comparison statements. Record the shared task/data/required functions and a reasoned recommendation. Do not set a winner merely because one is recommended or edited.

```bash
node <skill-root>/scripts/build-preview.mjs variant-output
```

This writes `_compare.html`. HTML entries load directly; React entries get separate `_preview/A.html`, B.html, C.html documents and React mounts, isolating global styles between variants. The comparison page is read-only; selection, iteration, undo, and export commands run in the agent chat. Refresh the builder after edits/undo/selection so cards and revision numbers stay current. Set `language: "zh"` for Chinese comparison labels and `preview: {colorScheme: "dark"}` for a dark comparison shell. Desktop/mobile controls render each iframe at the same 1200px/390px viewport, scaled to fit, so three narrow columns do not accidentally compare only mobile layouts.

## React preview

For standalone React components in a project with Vite already installed:

```bash
node <skill-root>/scripts/react-preview.mjs <project-root> <project-root>/variant-output
```

Start it as a managed background process. Open the printed comparison URL, then verify all three direct URLs render. The server binds localhost and chooses an available port. Report the actual URL and how to stop the process.

When the agent cannot bind a local port or open a browser (sandboxed Codex, CI, a headless session), build a self-contained snapshot instead:

```bash
node <skill-root>/scripts/react-preview.mjs <project-root> <project-root>/variant-output --static
```

It writes `variant-output/_static/` with the comparison page and A/B/C pages that open directly from `file://`, with scripts and styles inlined. Rebuild it after every edit, undo or selection. A hanging bundler fails after 180 seconds (`VARIANT_STATIC_TIMEOUT_MS` overrides it). Report the printed `file://` paths. When nothing can be rendered, give the user one command they can run themselves to start the live server, and list the visual checks as unverified. It uses the project's React and Vite without editing its package or production entrypoint.

The helper intentionally does not load arbitrary project Vite configuration: import each variant's CSS and dependencies explicitly. If output depends on Tailwind/PostCSS, aliases, a router, providers, Next image/font/server components, or other framework behavior, choose a native isolated adapter instead. The agent must build this adapter; do not hand manual import work to the user:

- Next App Router: find the existing app directory; create a collision-free preview route such as `app/variant-preview/page.tsx` and a `[variant]/page.tsx` route (or three explicit subroutes). Import and mount A/B/C in separate pages with required providers; compare through iframes. Preserve layouts and middleware; verify the actual URLs, including basePath/auth behavior. Do not overwrite a pre-existing route. Track generated adapter files for cleanup.
- Vite with project styling/plugins: add an isolated HTML entry with three iframe entrypoints and a dedicated Vite config derived from the needed aliases/plugins. Reuse the existing dependency versions and global CSS. Do not replace `src/App` or the production entry.
- Generic React without a bundler: create a separate preview package under `variant-output/_harness/`, install React/React DOM matching the target and Vite there using the user's package manager, and pass that harness as `<project-root>` above. Copy only required public assets; document dependencies. Do not mutate the application's dependency manifest. If installation is unavailable, deliver the adapter files and state that preview is unverified.

Read the project's scripts and run its existing typecheck/check command using its package manager. If the generated directory is excluded, add a temporary preview tsconfig that extends the project config and includes generated TSX plus needed source/assets declarations, then run the installed `tsc --noEmit -p <preview-config>`. A successful Vite transform is not a typecheck. Report pre-existing failures separately; never claim a passing project check when none exists or was run.

## Open the result

After writing a previewable artifact, show it with the environment's browser/UI tooling when available. Otherwise use the cross-platform helper from the skill root:

```bash
node <skill-root>/scripts/open-preview.mjs variant-output/variant-dashboard-A.html
```

If the runtime cannot open a browser, provide the exact file path or preview URL instead of failing the task. Re-open or refresh after iterations so the user never has to locate the artifact manually.

Sandboxed agents often cannot bind a port or open `file://` pages. HTML output still opens by double-click, so give its path. React output needs a server; build the self-contained snapshot with `react-preview.mjs ... --static` as described above, and give its `file://` paths. Never ask the user to wire up a preview by hand.

## Live preview server (optional)

If the user asks for live preview or says "watch mode", start the bundled static server:

```bash
node <skill-root>/scripts/preview-server.mjs variant-output
```

It starts at port 3333 and automatically tries the next available port when occupied. Use the printed URL; never assume a fixed port. Do not inject development polling code into exported files.
