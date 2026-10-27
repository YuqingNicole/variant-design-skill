<!-- Sub-workflow of the variant-design skill, reached through the route table in ../../SKILL.md. It has no skill frontmatter on purpose: agents that scan folders recursively (Codex, `npx skills`) must not register it as a standalone skill, because its paths are relative to the skill root. -->

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
| Checking before presenting | `references/workflow/quality-baseline.md` |
| Money, privacy, permissions, deletion, health, safety or AI-derived conclusions | `references/workflow/design-declaration.md`, then `references/workflow/product-integrity-gate.md` |

| Later turn | Example | Read |
|---|---|---|
| Variation action | `A vary strong`, `B remix colors`, `Mix A + B`, `Polish C`, `Critique B`, `tokens A`, `C → mobile` | `skills/variant-generate/actions.md`, then `references/workflow/history.md` |
| Zone edit | `B vary subtle — hero`, `zones A` | `skills/variant-generate/zones.md`, then `references/workflow/history.md` |
| Undo, pick, recover | `undo B`, `pick B` | `references/workflow/history.md` |
| Reopen or compare | `open B`, `compare` | `references/workflow/preview.md` |
| Export or integrate (prepare target baseline before staging) | `react B`, `export to next`, `integrate B`, `copy` | `skills/shared/export.md` |
| Context | `show context`, `reset context` | `references/workflow/project-context.md` |

## 1. Context and fast path

Read `variant-output/.variant-context.json` when it exists and apply its known values as soft constraints; the current request overrides them. In an existing project, run the discovery in `references/workflow/project-discovery.md` before generating.

Use the fast path when the brief or repository already reveals the product, audience, tone and constraints: state consequential assumptions in one line and generate. Ask at most two questions, only when the answers would materially change the result. An explicit request to build or generate needs no separate confirmation turn. If the user says "surprise me", choose three maximally different directions and proceed.

If the user points to a direction card (a library `/d/<slug>` page or its `.json`), follow `references/sources/direction-cards.md` and add the card to the task brief before generating.

## 2. Lock or explore, then load one domain reference

**Design system confirmed** (`designSystem.confirmed: true`, or a brand file the project marks as locked): read `designSystem.file` relative to the project root and use its tokens. Print `✦ DS locked: [palette] · [fonts] · variations differ in layout only`. Skip palette and font selection; the domain reference supplies layout and interaction patterns only.

**No confirmed system:** identify the scenario, then pick three starter prompts and palettes from the domain reference and `references/palettes.md`.

Load the one domain reference that best matches the request:

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
- **No confirmed system:** each direction is a different studio's interpretation; never two in the same aesthetic.

| Direction | Feel | Signature |
|---|---|---|
| Minimal / Editorial | Type-driven, generous space | One strong font, minimal color |
| Bold / Expressive | High contrast, graphic | Dominant color block |
| Dark / Premium | Moody, atmospheric | Deep background, elevated surfaces |
| Warm / Human | Rounded, approachable | Soft palette, organic forms |
| Data / Technical | Dense, systematic | Grid, monospace, tight |
| Neo-brutalist | Raw, unconventional | Bold outlines, broken grid |
| Luxury / Silence | Maximum negative space | One image, sparse text |

Before coding, define for each direction: starter prompt, palette (OKLCH where possible), display and body fonts (guidance and banned defaults in `references/workflow/quality-baseline.md`), layout pattern, motion strategy, the interactions that serve the task (no motion quota), and one signature detail.

## 4. Implement and record

Follow `skills/shared/code-output.md` for format detection, file paths and the output spec. Write each direction to its own files in `variant-output/` with real content; never paste full code into the chat. Put shared data in one file all three import, so they compare the same content.

Mark the major sections so later zone edits are possible: `data-zone="hero"` on the element, and `<!-- zone:hero:start -->` / `<!-- zone:hero:end -->` around it (TSX: `{/* zone:hero:start */}` / `{/* zone:hero:end */}`), plus `/* zone:hero:start */` / `/* zone:hero:end */` around its styles.

Register A, B and C in `.variant-context.json` following `references/workflow/project-context.md`: owned files, tokens, version 1, and `comparison` with three sentences each (optimizes, tradeoff, bestFor). Record the `taskContract` and a `recommendation: {variant, reason}` that separates hypotheses from tested evidence. Leave `selectedVariant` empty: a recommendation is not a selection.

## 5. Preview

Build and open the comparison page with A/B/C direct links and the recommendation, following `references/workflow/preview.md`. Show the actual URL or `file://` path. For portable React without Vite, use the isolated `--vite-root` path in that reference; native framework features still need their adapter.

## 6. Check

```bash
node <skill-root>/scripts/quality-gate.mjs variant-output --strict
node <skill-root>/scripts/delivery-check.mjs variant-output
```

Scan only the current deliverables (name the files when the directory holds older output). Inspect quality-gate findings in context and fix confirmed ones. Fix every delivery-check error: missing or shared files, empty or repeated comparisons, a missing task contract or recommendation, or a changed locked font or color. A `selectedVariant` warning means a direction was selected without the user. Then review the rendered pages with `references/workflow/quality-baseline.md`: hierarchy, distinctness, responsive behavior and working interactions.

When recording version-bound runtime checks, use `references/workflow/artifact-verification.md`: fill the browser plan from task expectations, and retain unverified items explicitly. For edits, compare pre-edit and post-edit observations.

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
> **Refine** — Polish · Critique · See other views
> **Deliver** — pick B · react B · integrate B · tokens A

The generated comparison shows previews before expandable direction details. Keep the full optimization, trade-off and suitable-scenario text in the manifest; rebuilding the comparison preserves it.
