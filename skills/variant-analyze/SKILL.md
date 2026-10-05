---
name: variant-analyze
description: "Audit existing sites, extract design tokens, generate style-matched pages. Runs consistency checks and Visual Quality Audit (40-item anti-slop checklist, Quality Score XX/100). Triggers on: analyze my site, audit this, match this style, extract tokens, what's wrong with this design, migrate, add a page to my site, compare old new"
---

## Site Analysis Mode

When the user points to existing code (file paths, a directory, or says "analyze/audit/check my site"), switch from generation mode to analysis mode. Load `references/design-system/style-audit.md` for the full methodology and `references/quality-baseline.md` for shared mechanical and visual checks.

### Triggers

| User says | Action |
|---|---|
| "analyze my site" / "audit this" / "check consistency" | Full style audit → report |
| "match this style" / "follow existing design" / "extend my site" | Extract tokens → generate matching pages |
| "extract tokens" (on existing files, not a generated variation) | Token extraction → CSS custom properties file |
| "what's wrong with this design" / "review my CSS" | Style consistency check → findings list |
| "migrate" / "consolidate" / "clean up" | Audit → token generation → migration plan |
| "add a [page] to my site" / "new page matching my existing design" | Extract → match → generate |

### Analysis Workflow

**Step 1: Scan** — Read the files the user points to. If no specific files given, scan for:
```bash
# Auto-detect entry points
find . -name "*.html" -o -name "*.css" -o -name "*.tsx" -o -name "*.jsx" \
  -o -name "*.vue" -o -name "*.svelte" | head -20
# Also check for:
# - tailwind.config.* (Tailwind projects)
# - globals.css / index.css / app.css (common entry CSS)
# - tokens.css / variables.css / theme.* (existing token files)
```

**Step 2: Extract** — Pull all design primitives following the Token Extraction schema in `style-audit.md`: colors, typography, spacing, components, transitions. Group by semantic role.

**Step 3: Detect** — Run all consistency checks from `style-audit.md` Section 2. For each finding, record severity (error/warning/info), the specific values, file locations, and a concrete fix.

**Step 3.5: Visual Quality Audit** — Read `references/quality-baseline.md` and run the deterministic scanner against the scoped files:

```bash
node <skill-root>/scripts/quality-gate.mjs <file-or-directory> --json
```

Confirm every reported match in context before including it. Then inspect the rendered interface for hierarchy, typography, palette coherence, layout rhythm, responsive recomposition, and interaction feedback. Do not derive a numerical score from unchecked self-reporting; if the user requests a score, show the evidence and scoring rubric beside it.

**Step 4: Report** — Present findings using the compact terminal format from `style-audit.md` Section 3. List priority fixes and distinguish mechanically detected evidence from visual judgment.

**Step 5: Act** — Based on what the user wants:
- **Audit only**: Stop after the report. Offer to generate a token file or migration plan.
- **Extract tokens**: Generate a `tokens.css` file consolidating all values (see `style-audit.md` Section 4).
- **Generate matching page**: Lock extracted tokens as constraints, generate new pages that match (see below).
- **Migration plan**: Generate phased checklist for consolidating the codebase (see `style-audit.md` Section 6).

### Style-Matched Generation

When generating new pages for an existing project, the workflow changes:

1. **Extract first** — Always analyze existing code before generating. Never guess the style.
2. **Lock tokens** — All generated code must use `var(--*)` referencing the existing token system. If no token system exists, generate one first and get user approval.
3. **Match patterns** — Study existing component shapes (card radius, shadow, padding), interaction patterns (transition durations, hover effects), layout patterns (container width, grid), and naming conventions (BEM, Tailwind, CSS modules).
4. **Show diff from existing** — In the Summary Card, note which tokens/patterns are being reused vs. which are new additions.
5. **Flag deviations** — If the design system principles (from Impeccable) conflict with the existing style, flag it: *"Your existing buttons have no hover state — I've added one following your color palette. OK?"*

**Summary Card for style-matched generation:**
```
✦ New page: /pricing — matching existing site style

  Reusing: --bg, --surface, --card, --border, --text, --muted, --accent
  Reusing: Plus Jakarta Sans 400/600, 4 font sizes, 8px grid
  Reusing: .card (24px padding, 8px radius, 1px border)
  Reusing: .btn (100px radius, 200ms transition)

  New additions:
  + Pricing toggle (monthly/annual) — uses existing .btn style
  + FAQ accordion — uses existing .card + new grid height animation
  + Comparison table — new component, follows existing spacing/color

  File: variant-output/pricing-matched.html ← opened in browser
```

### Quick Triggers for Analysis

| User types | Action |
|---|---|
| `audit` | Full style audit on current project |
| `audit src/styles/` | Audit specific directory |
| `tokens` | Extract tokens from existing code → CSS file |
| `match` | Enter style-matched generation mode |
| `new page pricing` | Generate /pricing page matching existing style |
| `migrate` | Generate migration plan for token consolidation |
| `compare old new` | Side-by-side: existing page vs. redesigned version |
