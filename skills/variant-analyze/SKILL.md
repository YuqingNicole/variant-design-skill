---
name: variant-analyze
description: Audit existing sites, extract design tokens, generate style-matched pages. Runs consistency checks and Visual Quality Audit (40-item anti-slop checklist, Quality Score XX/100). Triggers on: analyze my site, audit this, match this style, extract tokens, what's wrong with this design, migrate, add a page to my site, compare old new
---

## Site Analysis Mode

When the user points to existing code (file paths, a directory, or says "analyze/audit/check my site"), switch from generation mode to analysis mode. Load `references/design-system/style-audit.md` for the full methodology.

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

**Step 3.5: Visual Quality Audit** — In addition to consistency checks from `style-audit.md`, run this anti-slop checklist. Flag any item that fails with severity **warning** or **error**:

**Typography**
- [ ] Display font is NOT Inter/Roboto/Arial/Open Sans — use something with character
- [ ] Headlines have presence: tight tracking, compressed line-height, strong weight contrast
- [ ] Body text max-width ~65ch; line-height ≥ 1.5
- [ ] Weight range uses at least 3 stops (e.g. 400 / 500 / 700) — not just Regular + Bold
- [ ] Numbers in data contexts use `font-variant-numeric: tabular-nums` or monospace
- [ ] No orphaned single words on last line — use `text-wrap: balance` / `text-wrap: pretty`
- [ ] Headers use sentence case — not Title Case On Every Word

**Color & Surfaces**
- [ ] No pure `#000000` background — use off-black / dark charcoal / tinted dark
- [ ] Accent saturation below 80% — no neon or screaming accents
- [ ] Only one accent color — remove all others
- [ ] Grays are from one family — no mixing warm and cool grays
- [ ] No purple-to-blue "AI gradient" aesthetic
- [ ] Shadows are tinted to match background hue — not pure black at low opacity
- [ ] No random isolated dark section in a light-mode page (or vice versa)

**Layout**
- [ ] Not everything centered and symmetrical — break with offset, left-align, or asymmetry
- [ ] No 3 equal-column feature card row — use zig-zag, asymmetric grid, or horizontal scroll
- [ ] Uses `min-height: 100dvh` not `height: 100vh` (iOS Safari viewport jump)
- [ ] Has `max-width` container constraint — content doesn't stretch edge-to-edge
- [ ] Cards vary in size or weight — not uniformly identical
- [ ] Card group CTAs pin to bottom so buttons align across variable-length cards

**Interactivity & States**
- [ ] All buttons/links/cards have hover state (not just `opacity: 0.8`)
- [ ] Active/pressed feedback: `scale(0.98)` or `translateY(1px)`
- [ ] Transitions have non-zero duration (200-300ms)
- [ ] Visible `:focus-visible` ring — never `outline: none` alone
- [ ] Loading state exists — skeleton loaders, not generic spinners
- [ ] Empty state has content: acknowledge → explain value → CTA
- [ ] Error state has inline message — no `window.alert()`

**Content**
- [ ] No generic names: John Doe, Acme Corp, Nexus, SmartFlow
- [ ] No fake round numbers: `99.99%`, `$100.00`, `50,000 users`
- [ ] No AI clichés: Elevate, Seamless, Unleash, Next-Gen, Game-changer, Delve
- [ ] No Lorem Ipsum
- [ ] No exclamation marks in success/confirmation messages
- [ ] No passive voice in errors

**Iconography**
- [ ] Not using only Lucide/Feather icons — consider Phosphor or Radix UI Icons
- [ ] Consistent stroke width across all icons
- [ ] Favicon exists

**Code Quality**
- [ ] Semantic HTML: `<nav>`, `<main>`, `<article>`, `<section>` — not div soup
- [ ] No arbitrary z-index values (`9999`)
- [ ] All `<img>` have meaningful `alt` text
- [ ] Animations use only `transform` and `opacity` — no `top`/`left`/`width`/`height`

Score: subtract 2 points per failed item from 100. Present as `Quality Score: XX/100`.

**Step 4: Report** — Present findings using the compact terminal format from `style-audit.md` Section 3. Score out of 100. List priority fixes.

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
