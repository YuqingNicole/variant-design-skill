<!-- Part of the variant-design skill. Read it when the user exports or integrates a direction: `react B`, `export to next`, `integrate B`, `copy`, or a request to ship the chosen design. -->

# Export and integrate

Export the explicitly named direction, otherwise `selectedVariant`. If neither exists, ask which one; do not silently use `activeVariant`. Exporting or integrating never selects: run `select` (`references/workflow/history.md`) only when the user picks.

## Export

Export from the direction's current revision and tokens, and preserve its source files and history. Include framework integration files, dependencies and a short record of the checks performed. Rerun the appropriate typecheck and open the exported artifact before reporting completion. For React, mount the export with the preview workflow in `references/workflow/preview.md`; never leave a manual import as the only way to see it.

When the user says "export to [framework]" or `react [A/B/C]`, transform the chosen direction into the target structure:

| Target | Action |
|---|---|
| `export to next` | Next.js App Router .tsx — `"use client"` where needed, tokens in CSS file |
| `export to vite` | Vite React .tsx — `src/App.tsx` structure, preview via `npm run dev` |
| `export to vue` | Vue 3 SFC .vue — `<script setup lang="ts">` + scoped styles |
| `export to astro` | Astro .astro — frontmatter + template + scoped styles, interactive parts as `client:load` islands |
| `export to svelte` | Svelte .svelte — `svelte/transition` animations, `tweened()` for counters, no Framer Motion |
| `export to static` | Clean HTML — remove dev scripts, inline critical CSS |
| `react [A/B/C]` | Shorthand for `export to react` — auto-detects Next vs Vite vs generic from cwd |
| `vue [A/B/C]` | Shorthand for `export to vue` on the specified variation |
| `astro [A/B/C]` | Shorthand for `export to astro` on the specified variation |
| `svelte [A/B/C]` | Shorthand for `export to svelte` on the specified variation |

## Integrate into the project

Before generating integration files, list the intended project-relative targets in `.variant-work/targets.json` (a JSON array, for example `["src/App.tsx", "src/variant.css"]`). Prepare a new plan to capture the current source revision, owned-file hashes, brand constraints, every registered system extension, any adoption binding and target hashes. Then write every final project file into staging with matching paths, such as `.variant-work/integrate-B/src/App.tsx`. Use the bundled helper:

```bash
node <skill-root>/scripts/variant-integrate.mjs prepare variant-output B .variant-work/targets.json .variant-work/integration-plan.json
# Generate staged files only after prepare succeeds.
node <skill-root>/scripts/variant-integrate.mjs apply variant-output B .variant-work/integrate-B .variant-work/integration-plan.json
node <skill-root>/scripts/variant-integrate.mjs rollback variant-output <integration-id>
node <skill-root>/scripts/variant-integrate.mjs recover variant-output <interrupted-integration-id>
node <skill-root>/scripts/variant-integrate.mjs list variant-output
```

`apply` requires the prepared plan; source or target changes and added/removed staging targets refuse before any project writes. Existing plan files cannot be overwritten by `prepare`. Keep conflicted staging and the old plan, prepare a new plan, and reconcile explicitly. Plans written before extension/binding coverage are not upgraded in place: keep the old plan and prepare a new one. Selection changes alone are not conflicts. Both commands accept an optional final project root for nested output.

`apply` saves the prior bytes of every target in `variant-output/.integrations/<id>.json` before writing, refuses targets inside `variant-output/`, `.git/`, `node_modules/` or `.variant-work/`, and records each file as created, overwritten or unchanged. `rollback` restores those files and deletes created ones, but refuses without writing anything if the user edited an integrated file afterwards. In the delivery summary, give the changed files, the checks that actually ran, the preview URL, and the exact rollback command.

Include current comparison/static/native preview ownership receipts and their project roots with the handoff. Cleanup is separate from integration rollback: stop only this preview's managed process, then use `preview-files.mjs cleanup` as described in `references/workflow/preview.md`. Preserve changed adapters and all unlisted files; never delete variant source, staging, checks or backups as a cleanup shortcut.

For an actual integration, read `references/workflow/delivery-receipt.md` at handoff. Before rolling back or cleaning its preview, seal a local delivery receipt from the real plan, staging, backup, version-bound before/after reports and current preview ownership. Include all integration targets in post-integration verification dependencies. Missing reports stay unverified; inventory validity is separate from check results. Give the receipt path and recheck its status before using it as current evidence. Keep `.deliveries/` with history/backups; rollback retires current verification without deleting the historical handoff.

Preparation, apply, rollback and recovery share the history helper lock. External editors do not honor it; avoid simultaneous editing during commit. Multi-file process interruption is not globally atomic and this is not a power-loss durability guarantee.

### Recover an interrupted operation

`list` reports `appliedAt: null` for an interrupted new integration; a completed apply records a timestamp. Old backups without this field are not assumed interrupted. A normal completed integration must use strict `rollback`, which refuses any changed target before creating a recovery intent. `recover` cannot bypass that check. A rollback interrupted after its preflight has a saved intent in `.integrations/recovery/<id>.json` bound to the exact backup; use the same `recover` command to continue it.

After a crash, first confirm the owning process is no longer running and inspect the backup, target files and any recovery intent. Only then remove its **empty** `variant-output/.variant-lock` directory (`rmdir`, never recursive deletion). Helpers never steal or automatically remove a lock. Run `list`, then `recover` with the retained id and optional final project root. Keep staging, plans, backups and recovery intents.

Recovery validates the whole backup and checks every changed target before writing. Each must exactly match its recorded before or after hash (absence is the before state of a created file). Unknown contents, missing overwritten files, symlinks or an invalid/mismatched intent refuse recovery without initial writes. Keep these files and diagnostics; reconcile them explicitly with the user instead of deleting evidence or forcing recovery. If an external edit arrives during restoration, completed restores remain recorded by their before bytes, unknown edits are preserved, and retry is still guarded. An interrupted recovery can be rerun with the same id.

Ordinary apply I/O errors attempt the same controlled restoration and retain the backup plus intent. If restoration also fails, the error prints the retained backup and executable recovery command. A successful recovery restores prior bytes, removes created targets and records `rolledBackAt`; it does not select, alter variants/history/staging or establish runtime acceptance. An unfinished apply or started restoration cannot create a current delivery receipt. After recovery, prepare a **new** plan before trying integration again.

Run the target project's production build after integrating the named export. With Vite multiple HTML entries, register the comparison and A/B/C entries in `build.rollupOptions.input`; a working dev URL does not mean the preview survives a production build. Open the built application and every preview route and verify real controls, not just HTTP 200 (an SPA fallback can return the wrong page with 200).

## Verify before claiming delivery

Include the design-system check's coverage and unverified pairs in the delivery record. `ds-check.mjs` checks explicitly named or annotated pairs and component aliases; pass brand files with `--brand`. Confirmed contrast issues are delivery warnings, while generated component-layer violations are errors. Exporting DTCG with `ds-export.mjs` preserves aliases and use notes; keep the existing type grouping unless the user chooses `--group-by layer`, and list skipped or conditional values. None of these static checks proves rendered contrast.

Before claiming verified delivery, record and recheck version-bound evidence following `references/workflow/artifact-verification.md`. Registered systems/extensions/bindings and supported transitive local dependencies are tracked automatically. Record actual wrapper/alias/config facts and additional dynamic/data-driven roots before preparing integration. The plan and backup bind the current closure; source, resource, compiler input or resolver/fact changes require a NEW plan, preserving old plans/staging. Old plans without closure coverage are not retrofitted. Partial dependency coverage is listed, not certified as accepted runtime delivery. Missing runtime checks remain unverified; static readiness cannot substitute for them.

The skill's own regression suite checks these mechanics with fixture projects in a real browser:

1. Brand lock: A/B/C computed font families match the locked fonts after a layout edit.
2. Hero-only edit: outside-zone bytes and other rendered sections remain unchanged; reject a candidate that edits the footer/shared CSS.
3. Undo B: B files/tokens/comparison return to the previous revision; A/C and selection stay unchanged.
4. React preview: comparison plus A/B/C direct URLs render working controls without console/page errors.
5. Reduced motion: final counter values are available immediately, no animation frame loop runs, and toggling the setting during motion stops it. Check keyboard focus using computed styles as a separate regression.

Fixture tests verify the mechanics, not the quality of future generated designs. Run the same task-specific browser checks on the actual delivered output. If browser tooling is unavailable, list those checks as unverified.

## Production hardening

Apply when the design will be used in real products:

**Text resilience:**
- All text containers handle overflow: `overflow: hidden; text-overflow: ellipsis` for single-line, `-webkit-line-clamp` for multi-line
- Test with 2× expected content length — does the layout survive?
- Test with 0 content — does the empty state make sense?
- Headings: `overflow-wrap: break-word` to prevent horizontal scroll on mobile

**i18n readiness:**
- No fixed-width containers for text — allow 30% expansion for German/French
- Use logical properties: `margin-inline-start` not `margin-left` (RTL support)
- Numbers: use `Intl.NumberFormat` for locale-aware formatting
- Dates: use `Intl.DateTimeFormat` — never hardcode date formats

**Error & edge states:**
- Network failure: show last-known data with "Unable to update" banner, not a blank screen
- Slow connection: skeleton screens appear within 200ms if data isn't ready
- Invalid data: graceful degradation (show "--" for missing numbers, not NaN/undefined)

**Input robustness:**
- Debounce search/filter inputs (300ms)
- Prevent double-submit on forms (disable button after first click, re-enable on error)
- Paste handling: strip formatting on paste into plain-text inputs

## Handoff

After exporting, append a brief guide so users know how to own the code:

> **Making it yours:**
> - **Colors:** Edit the `--color-*` CSS custom properties in `:root` — all colors flow from these tokens
> - **Fonts:** Swap the Google Fonts `@import` URL and update `--font-display` / `--font-body`
> - **Spacing:** Adjust `--space-*` tokens to scale the entire layout proportionally
> - **New pages:** Copy the HTML structure, keep the same `<style>` block — the token system ensures visual consistency
> - **Dark mode:** Redefine `--color-*` semantic tokens inside `@media (prefers-color-scheme: dark)` — primitives stay unchanged
> - **Framework migration:** The CSS custom properties work in any framework. For React/Vue, map tokens to your theme object

## Clipboard

If the user says "copy" or "clipboard", copy the HTML to system clipboard instead of (or in addition to) writing the file:

```bash
# macOS
cat variant-output/variant-coffee-A.html | pbcopy

# Windows PowerShell
Get-Content -Raw variant-output/variant-coffee-A.html | clip.exe

# Linux (choose what is installed)
wl-copy < variant-output/variant-coffee-A.html
xclip -selection clipboard < variant-output/variant-coffee-A.html
```

If no clipboard utility is available, return the exact file path instead of treating clipboard support as required.

Rebuild `_compare.html` before delivery to include the preview-first cards and expandable comparison statements. Full-page links remain available above each preview.

For a system derived from the picked page, confirmation and adoption are separate. If its binding is pending, explicitly report that it has not adopted the new generated system. A requested `apply ds B` must use the history helper's prepared `apply-system` operation so code, aligned tokens and binding share a snapshot and undo. Exports preserve the actual current state; they never mark a pending page applied. System identities and candidate checks cover all registered extensions.

For automatic task-specific runtime checks, follow `references/workflow/runtime-plans.md` at the actual preview/verification step. Keep source-bound plans, genuine before/after observations and explicit gaps with the delivery receipt. Include integrated targets among source dependencies; a candidate preview plan does not prove the installed application. Changed plans, drafts or baseline inputs stale dependent reports.

When reporting failed project checks, preserve actual structured diagnostics and compare them individually using `references/workflow/artifact-verification.md`. Keep original logs and old/new classifications; an observed-before failure still fails and never establishes delivery acceptance.
