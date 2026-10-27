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

It writes `variant-output/_static/` with the comparison page and A/B/C pages that open directly from `file://`, with scripts and styles inlined. Rebuild it after every edit, undo or selection. A hanging bundler fails after 180 seconds (`VARIANT_STATIC_TIMEOUT_MS` overrides it). Report the printed `file://` paths. When nothing can be rendered, give the user one command they can run themselves to start the live server, and list the visual checks as unverified. It uses the project's React and Vite without editing its package or production entrypoint. When Vite is absent, use the isolated bundler path below; do not hand-write a bundler or transpile React into an improvised loader.

The helper intentionally does not load arbitrary project Vite configuration: import each variant's CSS and dependencies explicitly. If output depends on Tailwind/PostCSS, aliases, a router, providers, Next image/font/server components, or other framework behavior, choose a native isolated adapter instead. The agent must build this adapter; do not hand manual import work to the user:

- Next App Router: find the existing app directory; create a collision-free preview route such as `app/variant-preview/page.tsx` and a `[variant]/page.tsx` route (or three explicit subroutes). Import and mount A/B/C in separate pages with required providers; compare through iframes. Preserve layouts and middleware; verify the actual URLs, including basePath/auth behavior. Do not overwrite a pre-existing route. Track generated adapter files for cleanup.
- Vite with project styling/plugins: add an isolated HTML entry with three iframe entrypoints and a dedicated Vite config derived from the needed aliases/plugins. Reuse the existing dependency versions and global CSS. Do not replace `src/App` or the production entry.
- React without Vite (including portable client components from a Next project): install only the preview bundler into `.variant-work/preview-harness/` and pass `--vite-root` while retaining the original project root. The helper still resolves React/React DOM and public assets from the actual project, so providers using the same React instance continue to work. Do not copy or replace the application's dependency manifest.

```bash
npm install --prefix .variant-work/preview-harness --no-audit --no-fund --save-exact vite@7.3.6 rollup@4.65.0
node <skill-root>/scripts/react-preview.mjs . variant-output --static --vite-root .variant-work/preview-harness
```

Use the project's package manager equivalent when appropriate. The isolated versions above match the tested preview toolchain; the helper itself does not install packages. Reuse an existing compatible isolated install when available. Keep its lockfile local with the harness.

For Next in an environment that cannot run a server, first determine whether the generated entries are portable client components with explicit CSS, relative imports and any required client provider wrapper. Those can use the isolated static build. This is not a Next renderer: `next/font`, server components/actions, middleware, image optimization, routing and project aliases may require the native adapter. Do not stub those APIs or claim equivalent rendering. If the native adapter requires a server that cannot run, preserve the components and adapter, give the exact project command to run outside the sandbox, and mark preview unverified. If installing the isolated bundler is unavailable, do the same; never substitute a custom transpiler/bundler.

For a Next project whose preview routes can be statically exported, a native build is another server-free fallback when Vite installation is unavailable. Create an isolated Next app under `.variant-work/next-preview/`, reuse the installed Next/React versions, add explicit A/B/C routes and their needed layout/providers, and set `output: 'export'` with relative asset URLs (`assetPrefix: './'`). Run the project's installed Next binary against that directory, then retain the complete exported asset tree with the comparison page. Verify the actual file URLs and interactive hydration; checking that HTML files exist is insufficient. Server-only behavior, dynamic routes without static params, auth/middleware and remote assets may prevent this route from working. Keep those cases unverified rather than rewriting the application or stubbing features.

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
