<!-- Sub-workflow of the variant-design skill, reached through the route table in ../../SKILL.md. It is named ROUTE.md and has no skill frontmatter on purpose: agents that scan for SKILL.md files (Codex, `npx skills`, Claude Code plugins) must not register it as a standalone skill, because its paths are relative to the skill root. -->

> **variant-generate**: Generate three distinct design directions from a brief, each with a distinct product trade-off; locked brand tokens stay identical. Then refine them with variation actions, zone edits, undo and export. Triggers on: design options for X, show me variations, give me UI directions, vary this design, change the style, remix colors, shuffle layout, design a dashboard/landing page/app/editorial

# Generate

## Load map

Read files only at the step that names them, and only the section you need. Do not read ahead: the first generation needs the files in the first block, later turns load the second block on demand.

| When | Read |
|---|---|
| Existing project, before generating | `references/workflow/project-discovery.md` |
| The user points to a direction card | `references/sources/direction-cards.md` |
| Writing code | `skills/shared/code-output.md` |
| Vue, Astro or Svelte output | `skills/shared/frameworks.md` |
| Recording `.variant-context.json` | `references/workflow/project-context.md` |
| Building the comparison and previews | `references/workflow/preview.md` |
| The brief rests on a quality adjective (premium, 高级, cleaner, polished, techy) | `references/workflow/adjective-translation.md` |
| Checking the actual preview before presenting; before/after an edit | `references/workflow/quality-baseline.md`, then `references/workflow/runtime-plans.md` |
| Money, privacy, permissions, deletion, health, safety or AI-derived conclusions | `references/workflow/design-declaration.md`, then `references/workflow/product-integrity-gate.md` |

| Later turn | Example | Read |
|---|---|---|
| Variation action | `A vary strong`, `B remix colors`, `Mix A + B`, `Polish C`, `Refine premium B`, `Critique B`, `tokens A`, `C → mobile` | `skills/variant-generate/actions.md`, then `references/workflow/history.md` |
| Zone edit | `B vary subtle — hero`, `zones A` | `skills/variant-generate/zones.md`, then `references/workflow/history.md` |
| Undo, recover | `undo B`, `recover` | `references/workflow/history.md` |
| Pick | `pick B` | `references/workflow/history.md` (select), then `skills/variant-design-system/ROUTE.md` → Design system from a picked direction |
| Reopen, compare or clean previews | `open B`, `compare`, `clean previews` | `references/workflow/preview.md` |
| Export, integrate or recover (prepare target baseline before staging; preserve interrupted backups; seal actual handoff before rollback) | `react B`, `export to next`, `integrate B`, interrupted integration/rollback, `copy` | `skills/shared/export.md`; at integration handoff, `references/workflow/delivery-receipt.md` |
| Context | `show context`, `reset context` | `references/workflow/project-context.md` |

## 1. Context and fast path

Read `variant-output/.variant-context.json` when it exists and apply its known values as soft constraints; the current request overrides them. In an existing project, run the discovery in `references/workflow/project-discovery.md` before generating.

**An existing page keeps its job.** When the project already has the page (a members screen, a billing page, a dashboard), every direction is still that page inside that product: its noun title, the project's own description and copy, the app's navigation around it. Directions change how the page does its job, not what kind of page it is: no marketing hero, tagline or promotional card on a product page.

Use the fast path when the brief or repository already reveals the product, audience, tone and constraints: state consequential assumptions in one line and generate. Ask at most two questions, only when the answers would materially change the result. An explicit request to build or generate needs no separate confirmation turn. If the user says "surprise me", choose three maximally different directions and proceed.

If the user points to a direction card (a library `/d/<slug>` page or its `.json`), follow `references/sources/direction-cards.md` and add the card to the task brief before generating.

## 2. Lock or explore, then load one domain reference

**Design system confirmed** (`designSystem.confirmed: true`, or a brand file the project marks as locked): read `designSystem.file` relative to the project root and use its tokens. Print `✦ DS locked: [palette] · [fonts] · variations differ in layout only`. Skip palette and font selection; the domain reference supplies layout and interaction patterns only. When the lock comes from a project file (such as `src/tokens.css` or `app/globals.css`), record that file in place as `designSystem.file`. Do not copy it into `variant-output/` or add tokens to it: a copy goes stale when the brand changes, and edits are checked against the registered file. When `variant-output/DESIGN.md` exists, read it before building on the system; it says which tokens go where. Read the files in `designSystem.extensions` too: they hold the confirmed layers the brand leaves open (spacing, radius, elevation, motion, component states). Put only tokens neither file defines in the variants' own files.

**No confirmed system:** identify the scenario, then pick three starter prompts and palettes from the domain reference and `references/palettes.md`.

Load the one domain reference that best matches the request. A settings or management page inside an app (members, billing, preferences) uses the dashboard reference for layout patterns only: no KPI header or large metric numbers unless the page's job is monitoring.

| Domain | Reference |
|---|---|
| Dashboard, analytics, admin, CRM | `references/domains/dashboard.md` |
| Landing page, SaaS, B2B, product site | `references/domains/saas.md` |
| Editorial, report, article, newsletter | `references/domains/editorial.md` |
| E-commerce, marketplace, checkout | `references/domains/ecommerce.md` |
| Education, course, quiz, training | `references/domains/education.md` |
| Creative tool, music, 3D, generative art | `references/domains/creative.md` |
| Mobile app or mobile-first flow | `references/domains/mobile.md` |
| Portfolio or case study | `references/domains/portfolio.md` |
| Food, beverage, restaurant, recipe | `references/domains/food-beverage.md` |
| Fashion, beauty, furniture, lifestyle | `references/domains/fashion.md` |

Read a design-system reference only when a direction depends on it, and only the relevant section: type scale → `references/design-system/typography.md`; palette and contrast → `references/design-system/color-and-contrast.md`; grid and spacing → `references/design-system/spatial-design.md`; motion → `references/design-system/motion-design.md`; feedback animation → `references/design-system/micro-interactions.md`; forms and states → `references/design-system/interaction-design.md`; responsive behavior → `references/design-system/responsive-design.md`; interface copy → `references/design-system/ux-writing.md`; a working filter, chart, lightbox or multi-step form → its section of `references/interactive-patterns.md`.

## 3. Task contract and three directions

First define a shared task contract: primary job, identical input data, necessary functions and success criteria. Give each direction a distinct optimization, an explicit cost and a suitable scenario. For a dashboard: A prioritizes anomaly detection, B comparison across objects, C evidence tracing. All three support the same core task and functions. Differences must be visible in layout and interaction, not only described.

- **Design system confirmed:** each direction is a different structural arrangement: grid and layout, information hierarchy, density and rhythm (DS spacing tokens only), and which components lead. Colors, fonts and components do not change between A, B and C.
- **No confirmed system:** start from structure, as above: each direction arranges the task differently (for a members page: a dense table with inline role edits; members grouped under role descriptions; invitations and pending changes first, with an audit trail). Then give each a visual language that serves its trade-off, so no two share an aesthetic. A palette swap on one skeleton is not three directions. On marketing, editorial and brand surfaces, style may lead; the table below is for those.

| Direction | Feel | Signature |
|---|---|---|
| Minimal / Editorial | Type-driven, generous space | One strong font, minimal color |
| Bold / Expressive | High contrast, graphic | Dominant color block |
| Dark / Atmospheric | Moody, cinematic | Deep background, elevated surfaces |
| Warm / Human | Rounded, approachable | Soft palette, organic forms |
| Data / Technical | Dense, systematic | Grid, monospace, tight |
| Neo-brutalist | Raw, unconventional | Bold outlines, broken grid |
| Luxury / Silence | Maximum negative space | One image, sparse text |

These are styles for marketing, editorial and brand surfaces; on product UI they follow the structure. "Premium" or "高级" in a brief is not one of them: translate it with `references/workflow/adjective-translation.md` before choosing.

Before coding, define for each direction: starter prompt, palette (OKLCH where possible), display and body fonts (guidance and banned defaults in `references/workflow/quality-baseline.md`), layout pattern, motion strategy, the interactions that serve the task (no motion quota), and one signature detail that serves the task (a consequence line beside a role change, an inline undo), not a decoration. Check each direction against the Generator habits list in `references/workflow/quality-baseline.md` before coding.

## 4. Implement and record

Follow `skills/shared/code-output.md` for format detection, file paths and the output spec. Write each direction to its own files in `variant-output/` with real content; never paste full code into the chat. Put shared data in one file all three import, so they compare the same content.

Mark the major sections so later zone edits are possible: `data-zone="hero"` on the element, and `<!-- zone:hero:start -->` / `<!-- zone:hero:end -->` around it (TSX: `{/* zone:hero:start */}` / `{/* zone:hero:end */}`), plus `/* zone:hero:start */` / `/* zone:hero:end */` around its styles.

Register A, B and C in `.variant-context.json` following `references/workflow/project-context.md`: owned files, tokens, version 1, and `comparison` with three sentences each (optimizes, tradeoff, bestFor). Record the `taskContract` and a `recommendation: {variant, reason}` that separates hypotheses from tested evidence. Leave `selectedVariant` empty: a recommendation is not a selection.

"Do not pick for me" keeps `selectedVariant: null`; it does not suppress advice. Give a tentative recommendation grounded in the shared criteria, label untested advantages as hypotheses, and leave the user's decision open. If the user explicitly declines recommendations too, honor that request and disclose the missing recommendation instead of inventing advice to pass a check.

## 5. Preview

Build and open the comparison page with A/B/C direct links and the recommendation, following `references/workflow/preview.md`. Show the actual URL or `file://` path. For portable React without Vite, use the isolated `--vite-root` path in that reference; native framework features still need their adapter.

Use the preview reference's ownership protocol before creating native adapters; preserve the receipts returned by native or bundled helpers. Rebuild only from an unchanged ownership baseline. On explicit cleanup, stop the owned process and use receipts to preserve user-edited adapters and original files.

## 6. Check

```bash
node <skill-root>/scripts/quality-gate.mjs variant-output --strict
node <skill-root>/scripts/delivery-check.mjs variant-output
```

Scan only the current deliverables (name the files when the directory holds older output). Inspect quality-gate findings in context and fix confirmed ones. For each `review` finding (a generator habit), remove it or say in the presentation why this product needs it. Fix every delivery-check error: missing or shared files, empty or repeated comparisons, a missing task contract or recommendation, a changed locked font or color, or a design-system extension that redefines a brand variable. Under a confirmed system, colors and lengths outside its tokens, and direct references to its primitives (`--p-*`), are warnings: replace them with semantic tokens or say why. A `selectedVariant` warning means a direction was selected without the user. Then review the rendered pages with `references/workflow/quality-baseline.md`: hierarchy, distinctness, responsive behavior and working interactions.

Keep the scanner's explicit strict gate distinct from runtime acceptance. Its shared online summary applies to sanitized HTML, not raw source before sanitization; extra online document requirements remain separate. Follow `references/workflow/artifact-verification.md` at the evidence step.

When recording version-bound runtime checks, use `references/workflow/artifact-verification.md`: fill expectations from the task, register actual native wrapper/alias/config facts, and retain unknowns explicitly. For edits, compare pre-edit and post-edit observations. Registered systems/bindings and supported transitive local dependencies automatically invalidate old evidence/plans when changed. Dynamic/data-driven roots still need review. Prepare a new integration plan before staging after tracked source, config or dependency facts change.

For product-critical UI, run `references/workflow/product-integrity-gate.md` and report it separately from visual quality; do not present a P0 result as complete. Report only checks that ran; never claim WCAG compliance, browser coverage or "no AI slop" from self-assessment.

## 7. Present

Give a compact card per direction, and the files and preview path:

> **A — [Name]** · [Direction] · [Palette] · [Fonts]
> Layout: [pattern] · Signature: [detail] · Interactions: [list]
> Optimizes: [task advantage]. Trade-off: [specific cost]. Best for: [scenario].

Then the recommendation and its reason, and the next actions:

> **Reshape** — Vary strong · Distill · Shuffle layout · Change style
> **Tune** — Vary subtle · Remix colors · Mix (e.g. "Mix A + B")
> **Animate** — Add motion · Dramatize · Make interactive
> **Refine** — Polish · Refine premium · Critique · See other views
> **Deliver** — pick B (then its design system) · react B · integrate B · tokens A

The generated comparison shows previews before expandable direction details. Keep the full optimization, trade-off and suitable-scenario text in the manifest; rebuilding the comparison preserves it.

When reporting failed project checks, preserve actual structured diagnostics and compare them individually using `references/workflow/artifact-verification.md`. Keep original logs and old/new classifications; an observed-before failure still fails and never establishes delivery acceptance.
