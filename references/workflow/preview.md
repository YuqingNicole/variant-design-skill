# Preview and comparison

Read this when building or reopening previews: after the first generation, after every edit, undo or selection, and for `open B` or `compare`.

For a generated design-system preview, run `ds-check.mjs <generated.css> --used-by <preview.html>` before presenting it; pass existing brand files with `--brand <file>`. Its JSON separates checked contrast pairs, failures, unverified pairs and component-layer errors. Fix failures and unused tokens; resolve unverified pairs with rendered evidence or report the limitation. A zero-pair report is not contrast validation.

## Register and compare

Use schema v2 in `references/workflow/project-context.md`. Register A/B/C with their complete owned file sets, exact tokens, and the three comparison statements. Record the shared task/data/required functions and a reasoned recommendation. Do not set a winner merely because one is recommended or edited.

```bash
node <skill-root>/scripts/build-preview.mjs variant-output
```

This writes `_compare.html`. HTML entries load directly; React entries get separate `_preview/A.html`, B.html, C.html documents and React mounts, isolating global styles between variants. The comparison page is read-only; selection, iteration, undo, and export commands run in the agent chat. Refresh the builder after edits/undo/selection so cards and revision numbers stay current. Set `language: "zh"` for Chinese comparison labels and `preview: {colorScheme: "dark"}` for a dark comparison shell. Desktop/mobile controls render each iframe at the same 1200px/390px viewport, scaled to fit, so three narrow columns do not accidentally compare only mobile layouts.

The builder records preview ownership under the parent project's `.variant-work/preview-files/` and returns `ownership.project`/`ownership.receipt`. For nested output, pass the actual project root as the second CLI argument. Existing unowned comparison/mount files are preserved, even if identical; use a fresh output path and retain the old one. Rebuilds verify every previously owned file's bytes, permissions and file identity before changing any preview. A conflict preserves all targets; do not delete the old file, change its receipt or re-adopt it to bypass the guard. Variant source, context, history and shared dependencies are never cleanup targets.

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

Static bundling completes in a temporary directory before publishing its files. It never recursively empties `_static/`: unknown files remain, and an edited/replaced owned file blocks that static rebuild. The CLI prints separate comparison and static ownership receipts; keep both for cleanup. A static failure does not imply that an already refreshed comparison was rolled back.

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

## Own and clean native adapters

Before writing any native adapter, choose a new lowercase group and save its complete project-relative file list in `.variant-work/preview-paths.json`. Include the comparison/entry HTML, mount/config files and generated preview manifest. Exclude original files, variant source, history, dependencies, logs and staging. Prepare while **every target is absent**, then create the adapter and seal it once:

```bash
node <skill-root>/scripts/preview-files.mjs prepare <project-root> native-preview .variant-work/preview-paths.json
# Write the prepared adapter files, then:
node <skill-root>/scripts/preview-files.mjs seal <project-root> native-preview
```

Retain the returned receipt in the delivery summary. A native manifest can include the stable `ownershipGroup: "native-preview"`; keep the changing receipt path in the handoff, outside the owned manifest, to avoid a circular receipt dependency. For later adapter changes, stage the complete updated adapter set under `.variant-work/preview-staging/`, mirroring project-relative paths, then run `preview-files.mjs publish <project-root> native-preview <staging-dir>`. This checks the current receipt before writing; do not edit adapters first and seal again. A stale receipt or pre-existing unowned adapter is not automatically adopted.

On an explicit cleanup/exit request, first stop only the server process started for this preview, using its managed process handle. File cleanup neither finds nor kills servers. Use each current ownership receipt:

```bash
node <skill-root>/scripts/preview-files.mjs cleanup <project-root> <receipt-relative-path>
```

The JSON lists removed/missing files, preserved conflicts, filesystem errors and a durable backup operation. Exit 2 means conflicts/errors remain. It deletes matching regular files only, keeps all directories and unlisted files, and preserves changed bytes, permissions, links and same-name replacements. File identity uses exact device/inode/creation-nanosecond strings; filesystems without creation identity are rejected, not assumed safe. Repeated cleanup does not delete recreated files. Missing/old/changed receipts stop cleanup. Never substitute recursive directory removal or forced adoption. A failed publish reports its backup and recovery conflicts; completed writes are restored only while still matching this operation. If recovery produced a fresh receipt, use that receipt. Interrupted processes may leave a lock and backups: inspect the actual owning process, preserve diagnostics and reconcile manually; do not automatically steal a lock or claim global atomicity.

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

The comparison puts aligned previews first. Each card keeps its full-page link above the preview and its complete comparison statements in an expandable section below. Recommendation rationale is expandable; the recommended direction is labeled without selecting it. Phone previews are centered at a shared 390px viewport. Rebuild existing `_compare.html` files to update the layout.

The comparison shell uses neutral light or dark surfaces, compact status labels and a segmented viewport control. Recommendation rationale and next-step guidance sit below the preview grid. These presentation controls do not mutate variant selection or the generated designs.

A confirmed system's preview can show proposed fonts before the picked direction adopts them. Keep the picked page unchanged at confirmation; label it pending until explicit `apply ds B` uses `apply-system`. After apply or undo, rebuild that page's previews and report its actual binding and rendered checks. Pending does not mean the old page passed the new system's font/contrast requirements.


When recording artifact evidence for a preview, registered design-system/extension files, any adoption binding and supported transitive local imports/resources are fingerprinted automatically. Follow `references/workflow/artifact-verification.md` to record actual native wrappers, adapter manifests, aliases and separate check/build configs in `.variant-work/dependency-resolution.json` before checking or preparing integration. It is a reviewed discovery input, not an adapter cleanup target. Do not rely on scanning the whole work directory or guessing Vite config behavior. Missing parsers or unresolved/dynamic relations remain partial/unverified. Integration plans bind the same closure before staging; changing tracked source/config/facts requires a fresh plan. Cleaning a registered preview retires its old observations; missing wrappers do not make old evidence current.

At integration handoff, record the current ownership receipt with the delivery receipt (`references/workflow/delivery-receipt.md`). Preview-only checks do not verify integrated targets. Later cleanup can retire the preview and stale the handoff; it must preserve `.deliveries/`, source, checks and backups.

Preview cleanup also preserves `.integrations/recovery/` intents. For interrupted project writes, follow `skills/shared/export.md` recovery; deleting adapters, backups or a live lock is not recovery. Pending integration or restoration cannot supply current delivery acceptance.

After building the actual preview, automatically author and run task-specific checks following `references/workflow/runtime-plans.md`. Resolve stable controls from the actual task/DOM/source. Confirm rebuilt preview identity in the ready adapter; a URL alone is insufficient. Missing browser/project tools or expectations stay unverified. Capture real scope baseline observations before editing and retain sealed plans/reports through cleanup.

When reporting failed project checks, preserve actual structured diagnostics and compare them individually using `references/workflow/artifact-verification.md`. Keep original logs and old/new classifications; an observed-before failure still fails and never establishes delivery acceptance.
