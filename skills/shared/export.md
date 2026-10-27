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

Before generating integration files, list the intended project-relative targets in `.variant-work/targets.json` (a JSON array, for example `["src/App.tsx", "src/variant.css"]`). Prepare a new plan to capture the current source revision, owned-file hashes, brand constraints and target hashes. Then write every final project file into staging with matching paths, such as `.variant-work/integrate-B/src/App.tsx`. Use the bundled helper:

```bash
node <skill-root>/scripts/variant-integrate.mjs prepare variant-output B .variant-work/targets.json .variant-work/integration-plan.json
# Generate staged files only after prepare succeeds.
node <skill-root>/scripts/variant-integrate.mjs apply variant-output B .variant-work/integrate-B .variant-work/integration-plan.json
node <skill-root>/scripts/variant-integrate.mjs rollback variant-output <integration-id>
node <skill-root>/scripts/variant-integrate.mjs list variant-output
```

`apply` requires the prepared plan; source or target changes and added/removed staging targets refuse before any project writes. Existing plan files cannot be overwritten by `prepare`. Keep conflicted staging and the old plan, prepare a new plan, and reconcile explicitly. Selection changes alone are not conflicts. Both commands accept an optional final project root for nested output.

`apply` saves the prior bytes of every target in `variant-output/.integrations/<id>.json` before writing, refuses targets inside `variant-output/`, `.git/`, `node_modules/` or `.variant-work/`, and records each file as created, overwritten or unchanged. `rollback` restores those files and deletes created ones, but refuses without writing anything if the user edited an integrated file afterwards. In the delivery summary, give the changed files, the checks that actually ran, the preview URL, and the exact rollback command.

Preparation, apply and rollback share the history helper lock. External editors do not honor it; avoid simultaneous editing during commit. Ordinary write failures restore completed writes when they still match this integration; conflicting later edits preserve the backup for manual recovery. Multi-file process interruption is not globally atomic.

Run the target project's production build after integrating the named export. With Vite multiple HTML entries, register the comparison and A/B/C entries in `build.rollupOptions.input`; a working dev URL does not mean the preview survives a production build. Open the built application and every preview route and verify real controls, not just HTTP 200 (an SPA fallback can return the wrong page with 200).

## Verify before claiming delivery

Before claiming verified delivery, record and recheck version-bound evidence following `references/workflow/artifact-verification.md`. Missing runtime checks remain unverified; static readiness cannot substitute for them.

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
