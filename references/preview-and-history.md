# Preview, comparison, history, and export

## Register and compare

Use schema v2 in [project-context.md](project-context.md). Register A/B/C with their complete owned file sets, exact tokens, and the three comparison statements. Record the shared task/data/required functions and a reasoned recommendation. Do not set a winner merely because one is recommended or edited.

```bash
node <skill-root>/scripts/build-preview.mjs variant-output
```

This writes `_compare.html`. HTML entries load directly; React entries get separate `_preview/A.html`, B.html, C.html documents and React mounts, isolating global styles between variants. The comparison page is read-only; selection, iteration, undo, and export commands run in the agent chat. Refresh the builder after edits/undo/selection so cards and revision numbers stay current. Set `language: "zh"` for Chinese comparison labels and `preview: {colorScheme: "dark"}` for a dark comparison shell. Desktop/mobile controls render each iframe at the same 1200px/390px viewport, scaled to fit, so three narrow columns do not accidentally compare only mobile layouts.

## React preview

For standalone React components in a project with Vite already installed:

```bash
node <skill-root>/scripts/react-preview.mjs <project-root> <project-root>/variant-output
```

Start it as a managed background process. Open the printed comparison URL, then verify all three direct URLs render. The server binds localhost and chooses an available port. Report the actual URL and how to stop the process. It uses the project's React and Vite without editing its package or production entrypoint.

The helper intentionally does not load arbitrary project Vite configuration: import each variant's CSS and dependencies explicitly. If output depends on Tailwind/PostCSS, aliases, a router, providers, Next image/font/server components, or other framework behavior, choose a native isolated adapter instead. The agent must build this adapter; do not hand manual import work to the user:

- Next App Router: find the existing app directory; create a collision-free preview route such as `app/variant-preview/page.tsx` and a `[variant]/page.tsx` route (or three explicit subroutes). Import and mount A/B/C in separate pages with required providers; compare through iframes. Preserve layouts and middleware; verify the actual URLs, including basePath/auth behavior. Do not overwrite a pre-existing route. Track generated adapter files for cleanup.
- Vite with project styling/plugins: add an isolated HTML entry with three iframe entrypoints and a dedicated Vite config derived from the needed aliases/plugins. Reuse the existing dependency versions and global CSS. Do not replace `src/App` or the production entry.
- Generic React without a bundler: create a separate preview package under `variant-output/_harness/`, install React/React DOM matching the target and Vite there using the user's package manager, and pass that harness as `<project-root>` above. Copy only required public assets; document dependencies. Do not mutate the application's dependency manifest. If installation is unavailable, deliver the adapter files and state that preview is unverified.

Read the project's scripts and run its existing typecheck/check command using its package manager. If the generated directory is excluded, add a temporary preview tsconfig that extends the project config and includes generated TSX plus needed source/assets declarations, then run the installed `tsc --noEmit -p <preview-config>`. A successful Vite transform is not a typecheck. Report pre-existing failures separately; never claim a passing project check when none exists or was run.

## Safe iteration

Generate local patches into a separate candidate directory, preserving the same relative file paths for **all files owned by the target variant**. Do not write the live artifact first. Write `change.json` with `summary`, optional `zone`, optional full `tokens` and `comparison` updates. For a hero edit:

```json
{"summary":"Emphasize primary CTA", "zone":"hero"}
```

```bash
node <skill-root>/scripts/variant-history.mjs apply variant-output B work/candidate-B work/change.json
node <skill-root>/scripts/variant-history.mjs undo variant-output B
node <skill-root>/scripts/variant-history.mjs select variant-output B
```

Apply validates unique ownership, snapshots all B files and B metadata, verifies snapshot persistence, then replaces the files and updates context. It rejects changes outside exact zone markers for scoped actions. CSS overrides must stay in the marked zone; a local edit cannot alter shared root tokens. Keep the owned file set stable during one apply. To introduce a new owned file, explicitly register it with its initial content before the next transaction.

For configuration-driven React pages, `/* zone:hero:start */` / `/* zone:hero:end */` also delimit a standard JS/TS configuration block. Keep shared components read-only during that local edit and compare the rendered non-target sections; preserving wrapper bytes alone cannot prove rendered scope.

The helper checks token metadata under a DS lock; it cannot prove that arbitrary CSS/JS obeys those tokens. Also compare the rendered fonts and token usage against `design-system.css`. Undo first checks that files and variant metadata still match the recorded post-edit state. If the user has edited them since, it refuses without changing live files. Undo restores files, tokens, and comparison together; version numbers advance to record the undo event. It does not change A/C or the selected winner. Saved snapshots are retained even after undo. Do not claim history exists until it has been written.

## Verification and export

Run `node --test scripts/variant-loop.test.mjs` for file/metadata and static scanner regressions. For real rendering, install `tests/` dependencies and run its browser suite as described in `tests/README.md`. Required scenarios:

1. Brand lock: A/B/C computed font families match the locked fonts after a layout edit.
2. Hero-only edit: outside-zone bytes and other rendered sections remain unchanged; reject a candidate that edits the footer/shared CSS.
3. Undo B: B files/tokens/comparison return to the previous revision; A/C and selection stay unchanged.
4. React preview: comparison plus A/B/C direct URLs render working controls without console/page errors.
5. Reduced motion: final counter values are available immediately, no animation frame loop runs, and toggling the setting during motion stops it. Check keyboard focus using computed styles as a separate regression.

Fixture tests verify the mechanics, not the quality of future generated designs. Run the same task-specific browser checks on the actual delivered output. If browser tooling is unavailable, list those checks as unverified.

Export the explicitly named variant or selected winner from its current revision and tokens. Preserve source files/history. Include framework integration files, dependencies, and a short record of checks performed. Re-run the appropriate typecheck and open the exported artifact before reporting completion.

## Integration checkpoint learned from the landing page

Run the target project's production build after integrating the named export. With Vite multiple HTML entries, register the comparison and A/B/C entries in `build.rollupOptions.input`; a working dev URL does not mean the preview survives a production build. Open the built application and every preview route and verify real controls, not just HTTP 200 (an SPA fallback can return the wrong page with 200).

The repository's `website/` is a runnable dogfood project. `npm run export:landing -- B` exports the named hero configuration into its real React entrypoint, backs up the previous integration, and leaves the user's winner selection untouched. The three wrappers keep the complete site functional while sharing the locked brand system. See `website/iteration-log.md` for observed evidence and limitations.


## Conflicts, legacy history, and recovery

History mutations use an exclusive `.variant-lock` directory. If another operation is active, wait for that operation to finish. After a crash, inspect the live files, context and snapshots before removing a stale lock; do not automatically steal locks.

Snapshots from before 1.1 do not record the post-edit baseline, so automatic undo refuses them rather than guessing whether later user edits are safe to discard. Recover either legacy or conflicting history into a new, separate directory:

```bash
node <skill-root>/scripts/variant-history.mjs recover variant-output B work/recovered-B
```

The parent directory must exist and the destination must not exist. This extracts the last undo snapshot's files and metadata, leaving live files and history unchanged. Compare the recovered candidate with current files; reconcile user edits into a new candidate before using `apply`. Snapshots support crash recovery; multiple file replacements are not a filesystem-wide atomic commit. The operation lock coordinates these helpers, not external editors.
