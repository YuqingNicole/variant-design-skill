# Style Audit & Extraction

Patterns for analyzing existing codebases, extracting design tokens, detecting inconsistencies, and generating style-matched new pages.

---

## 1. Token Extraction

When analyzing an existing site, extract these design primitives from the source CSS/HTML:

### Colors
```javascript
// Extraction targets (in priority order):
// 1. CSS custom properties: --color-*, --bg-*, --text-*, etc.
// 2. Tailwind classes: bg-blue-500, text-gray-900, etc.
// 3. Inline/hardcoded: hex (#xxx), rgb(), hsl(), oklch()
// 4. Computed from component patterns (button bg, card bg, link color)

// Group by semantic role:
{
  backgrounds: [],      // page bg, surface bg, card bg
  text: [],             // headings, body, muted/secondary
  borders: [],          // dividers, card borders, input borders
  accents: [],          // buttons, links, active states, badges
  feedback: [],         // success/error/warning/info
  shadows: [],          // box-shadow values
}
```

### Typography
```javascript
{
  families: [],         // all font-family declarations (display, body, mono)
  imports: [],          // Google Fonts URLs, @font-face sources
  sizes: [],            // all font-size values (px, rem, clamp)
  weights: [],          // all font-weight values used
  lineHeights: [],      // all line-height values
  letterSpacing: [],    // tracking values
  // Derived:
  scaleRatio: null,     // computed ratio between heading sizes
  fluidType: false,     // uses clamp() or not
  systemStack: false,   // relies on system fonts
}
```

### Spacing
```javascript
{
  paddings: [],         // all padding values
  margins: [],          // all margin values
  gaps: [],             // all gap values
  // Derived:
  baseUnit: null,       // 4px or 8px grid?
  consistent: false,    // follows a scale or ad-hoc?
  scale: [],            // if consistent, the scale values
}
```

### Components
```javascript
{
  borderRadius: [],     // all border-radius values
  breakpoints: [],      // media query breakpoints
  transitions: [],      // transition/animation durations + easings
  zIndices: [],         // all z-index values
  maxWidths: [],        // container max-width values
}
```

---

## 2. Consistency Detection Rules

After extracting tokens, run these checks. Each produces a finding with severity (error/warning/info) and a specific fix.

### Color Consistency

**Near-duplicate colors** — Colors within ΔE < 5 (perceptual difference) that should be unified.
```
Rule: If two colors are used in the same semantic role (e.g., both as text colors)
and their OKLCH distance is < 0.03 lightness + 0.02 chroma, flag as duplicate.

Example finding:
  ⚠ Near-duplicate grays: #64748B and #6B7280 (ΔE=2.1) — unify to one --muted token
```

**Too many unique colors** — More than 12 unique color values suggests no token system.
```
Rule: Count unique color values (excluding transparent, inherit, currentColor).
> 20: error "No color system detected — X unique colors found"
> 12: warning "Color palette is fragmented — consider consolidating"
≤ 12: info "Color count is manageable"
```

**Pure black/white** — #000000 or #FFFFFF used in UI (not in images).
```
Rule: Flag any use of #000, #fff, rgb(0,0,0), rgb(255,255,255) in CSS properties.
Fix: Replace with tinted near-black/near-white from the dominant hue.
```

**Gray on color** — Gray text on colored backgrounds.
```
Rule: If a text color has chroma < 0.01 (pure gray) and its parent background
has chroma > 0.02 (colored), flag as washed-out.
Fix: Use a darker shade of the background color instead.
```

**No semantic token layer** — Hardcoded values instead of CSS custom properties.
```
Rule: If > 50% of color values are hardcoded (not var(--*)), flag.
Fix: Generate a token map and suggest variable names.
```

### Typography Consistency

**Too many font sizes** — More than 7 unique sizes suggests no type scale.
```
Rule: Count unique font-size values.
> 10: error "No type scale — X unique sizes found"
> 7: warning "Type scale is loose — consider a 5-size system"
≤ 7: info "Type scale is tight"
```

**Banned fonts in display role** — Generic fonts used for headings.
```
Rule: Check if h1-h3, .hero, .title elements use:
Inter, Roboto, Arial, Open Sans, Lato, Montserrat, system-ui
Fix: Suggest distinctive alternatives from typography.md.
```

**Missing font-display** — @import or @font-face without font-display: swap.
```
Rule: Check all font loading for font-display declaration.
Fix: Add font-display: swap to prevent FOIT.
```

**Inconsistent weights** — Same element type with varying weights across pages.
```
Rule: If <h2> elements use both 600 and 700 in different places, flag.
Fix: Standardize to one weight per heading level.
```

### Spacing Consistency

**Off-grid values** — Spacing that doesn't align to a base grid.
```
Rule: Check if padding/margin/gap values are multiples of 4px (or 8px).
Flag any value that's not on the grid (e.g., 13px, 18px, 22px).
Fix: Snap to nearest grid value.
```

**Inconsistent component spacing** — Same component type with different internal padding.
```
Rule: Compare padding/gap values across elements with same class or role.
e.g., .card has padding: 24px in one place, 20px in another.
Fix: Standardize to one value.
```

### Interaction & Motion Consistency

**Missing hover states** — Interactive elements without :hover styling.
```
Rule: Check all <a>, <button>, [role="button"], .card elements for :hover rules.
Fix: Add hover states following micro-interactions.md patterns.
```

**Missing focus-visible** — No :focus-visible or outline: none without replacement.
```
Rule: Check for outline: none without a :focus-visible rule nearby.
Fix: Add :focus-visible with accent-colored ring.
```

**Inconsistent transitions** — Different durations/easings on similar elements.
```
Rule: Collect all transition declarations. Flag if:
- Same element type has different durations (button: 200ms vs 300ms)
- More than 3 unique easing functions used
Fix: Standardize to motion tokens (--duration-fast, --ease-out-expo).
```

### Responsive Consistency

**Desktop-only patterns** — Fixed widths or hover-dependent interactions.
```
Rule: Check for:
- width: [fixed px] on containers without max-width
- Interactions only triggered by :hover with no touch alternative
- font-size in px (not rem/em/clamp)
Fix: Add responsive alternatives.
```

**Too many breakpoints** — More than 4 unique @media breakpoints.
```
Rule: Count unique breakpoint values in media queries.
> 4: warning "Consider consolidating breakpoints"
```

### Accessibility Baseline

**Contrast failures** — Text/background combinations below WCAG AA.
```
Rule: For each text color + background color pair, compute contrast ratio.
< 4.5:1 for body text: error
< 3:1 for large text (≥24px bold or ≥18.5px): error
Fix: Suggest adjusted color with minimum modification to meet ratio.
```

**Small touch targets** — Interactive elements below 44×44px.
```
Rule: Check computed size of buttons, links, inputs.
< 44px in either dimension: warning
Fix: Add padding or use ::before/::after to extend hit area.
```

---

## 3. Audit Report Format

Present findings as a structured report in the terminal:

```
✦ Style Audit: [project name or file path]

  Scanned: 3 HTML files, 2 CSS files, 847 declarations

  ─── COLOR ──────────────────────────────────────────
  ✗ 23 unique colors found (no token system)         [error]
    → 4 near-duplicate pairs detected
    → 3 pure black/white uses
  ✓ No gray-on-color issues

  ─── TYPOGRAPHY ─────────────────────────────────────
  ⚠ 9 unique font sizes (loose scale)               [warning]
  ✗ Inter used as display font on hero               [error]
  ✓ font-display: swap present
  ⚠ Inconsistent h2 weights (600 vs 700)            [warning]

  ─── SPACING ────────────────────────────────────────
  ⚠ 5 off-grid values (13px, 18px, 22px, 7px, 15px) [warning]
  ✗ .card padding varies: 16px, 20px, 24px          [error]
  ✓ Uses gap for flex/grid siblings

  ─── INTERACTION ────────────────────────────────────
  ✗ 4 buttons missing :hover state                   [error]
  ✗ outline: none on 2 inputs without :focus-visible [error]
  ⚠ 3 different transition durations on buttons      [warning]

  ─── RESPONSIVE ─────────────────────────────────────
  ⚠ 2 fixed-width containers without max-width       [warning]
  ✓ Mobile-first breakpoints at 640px, 1024px

  ─── ACCESSIBILITY ──────────────────────────────────
  ✗ 2 contrast failures (body text on surface)       [error]
  ⚠ 3 touch targets below 44px                      [warning]

  ─── SUMMARY ────────────────────────────────────────
  Score: 52/100
  Errors: 6  Warnings: 7  Passing: 5

  Priority fixes (most impact first):
  1. Create CSS custom property system for colors (fixes 23→8 unique values)
  2. Add :hover + :focus-visible to all interactive elements
  3. Fix 2 contrast failures (muted text on surface)
  4. Replace Inter display font with distinctive alternative
  5. Snap 5 off-grid spacing values to 4pt grid
```

---

## 4. Token Generation

After audit, generate a token file that consolidates the extracted values:

```css
/* Generated from style audit — [date] */
/* Maps existing hardcoded values to semantic tokens */

:root {
  /* ─── Colors (consolidated from 23 → 8) ─── */
  --bg:        #F8FAFC;   /* was: #F8FAFC, #F9FAFB, #FAFAFA */
  --surface:   #FFFFFF;   /* was: #FFFFFF, #FFF */
  --card:      #FFFFFF;
  --border:    #E2E8F0;   /* was: #E2E8F0, #E5E7EB, #D1D5DB */
  --text:      #0F172A;   /* was: #0F172A, #111827, #1A1A1A */
  --muted:     #64748B;   /* was: #64748B, #6B7280, #71717A */
  --accent:    #6366F1;   /* was: #6366F1, #5B21B6 */
  --danger:    #EF4444;

  /* ─── Typography ─── */
  --font-display: 'Plus Jakarta Sans', sans-serif;  /* replacing Inter */
  --font-body: 'Plus Jakarta Sans', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  --text-xs:   0.75rem;   /* 12px */
  --text-sm:   0.875rem;  /* 14px — was also 13px, 15px */
  --text-base: 1rem;      /* 16px */
  --text-lg:   1.25rem;   /* 20px — was also 18px, 22px */
  --text-xl:   2rem;      /* 32px */
  --text-2xl:  3rem;      /* 48px */

  /* ─── Spacing (snapped to 4pt grid) ─── */
  --space-xs:  4px;
  --space-sm:  8px;
  --space-md:  16px;   /* was: 13px, 15px, 16px, 18px */
  --space-lg:  24px;   /* was: 20px, 22px, 24px */
  --space-xl:  48px;
  --space-2xl: 96px;

  /* ─── Components ─── */
  --radius-sm: 6px;
  --radius-md: 8px;    /* was: 6px, 8px, 10px */
  --radius-lg: 12px;
  --radius-full: 9999px;

  /* ─── Motion ─── */
  --duration-fast:   150ms;
  --duration-normal: 250ms;  /* was: 200ms, 250ms, 300ms */
  --duration-slow:   400ms;
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
}
```

---

## 5. Style Matching

When generating new pages for an existing project, the extracted tokens become **constraints**:

### Match Strategy

1. **Lock tokens** — All generated code must use `var(--*)` referencing the extracted tokens. No new colors, no new font sizes.
2. **Match component patterns** — If existing cards use `padding: 24px; border-radius: 8px; border: 1px solid var(--border)`, new cards must match.
3. **Match interaction patterns** — If existing buttons have `transition: all 200ms ease`, new buttons must too.
4. **Match layout grid** — If existing layout uses `max-width: 1280px; margin: 0 auto; padding: 0 24px`, new pages must use the same container.
5. **Match naming conventions** — If existing CSS uses BEM (`.card__title`), Tailwind classes, or CSS modules, match the convention.

### What to preserve vs. improve

| Preserve (match exactly) | Improve (if below baseline) |
|---|---|
| Color palette and token names | Missing hover/focus states |
| Font families and weights | Accessibility failures (contrast, targets) |
| Spacing scale and grid | Missing reduced-motion support |
| Component shapes (radius, shadows) | Missing responsive breakpoints |
| Naming conventions (BEM, Tailwind) | Hardcoded values that should be tokens |
| Layout patterns (container, grid) | Missing semantic HTML (landmarks, labels) |

---

## 6. Migration Plan

When consolidating an inconsistent codebase, generate a migration checklist:

```
✦ Migration Plan: [project]

  Phase 1: Token foundation (no visual change)
  ☐ Create tokens.css with :root custom properties
  ☐ Find-replace top 10 hardcoded colors → var(--*)
  ☐ Find-replace top 5 hardcoded font-sizes → var(--text-*)
  ☐ Find-replace top 5 hardcoded spacing → var(--space-*)

  Phase 2: Interaction baseline (subtle improvement)
  ☐ Add :hover states to 4 bare buttons
  ☐ Add :focus-visible rings to all interactive elements
  ☐ Standardize transition timing to --duration-normal

  Phase 3: Accessibility fixes (compliance)
  ☐ Fix 2 contrast failures: --muted on --surface
  ☐ Increase 3 touch targets to 44px minimum

  Phase 4: Polish (optional refinement)
  ☐ Replace Inter display font with Plus Jakarta Sans
  ☐ Snap 5 off-grid spacing values to 4pt grid
  ☐ Add prefers-reduced-motion media query

  Estimated token coverage after migration: 85%
```
