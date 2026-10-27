<!-- Part of the variant-generate route (../../SKILL.md → skills/variant-generate/SKILL.md). Read it when the user asks for a variation action such as `A vary strong`, `Mix A + B`, `Polish C`, `Critique B` or `tokens A`. -->

# Variation actions

Every action that changes a direction is a history transaction: prepare a candidate first and apply it afterwards, following `references/workflow/history.md`. Critique and Extract tokens only read. To limit an action to one section, see `skills/variant-generate/zones.md`.

### Vary strong
Amplify current direction to maximum. More contrast, stronger type, bolder color, more dramatic composition. Consult `references/design-system/typography.md` for scale ratios and `references/design-system/color-and-contrast.md` for high-contrast palette construction.

*Before → After example:*
- Body text 16px, heading 32px → Body 15px, heading 72px (ratio 1.25 → 1.5+)
- Accent used on buttons only → Accent dominates hero section, bleeds into nav
- Subtle 200ms fade-in → Dramatic 600ms staggered reveal with scale transform

### Vary subtle
Tighten spacing, refine hierarchy, soften where needed. Same direction, higher craft. Focus on vertical rhythm, optical alignment, and micro-interactions per `references/design-system/spatial-design.md` and `references/design-system/motion-design.md`.

*Before → After example:*
- Inconsistent padding (16/20/24px) → Locked to 4pt grid (16/24/32px)
- Generic hover (opacity change) → Contextual hover (card lifts 2px, button darkens accent)
- Missing OpenType → `tabular-nums` on data, `font-kerning: normal` on headlines

### Distill
Strip the design to its absolute essence. Inspired by the Impeccable *distill* philosophy — ruthless simplification reveals what truly matters.

**Process:**
1. Identify the single core purpose of the interface
2. For each element, ask: "Does removing this break the core purpose?" If no, remove it.
3. Simplify across all dimensions:
   - **Information:** Reduce visible options, use progressive disclosure (`<details>`, hover reveals)
   - **Visual:** Fewer colors (aim for 2–3 total), fewer type sizes, remove decorative elements
   - **Layout:** Collapse sections, merge related content, eliminate redundant containers
   - **Interaction:** Fewer clicks to complete the primary task, remove confirmation steps where undo works
   - **Content:** Shorter headlines, tighter copy, remove introductory paragraphs that restate the heading
4. Verify: Can a new user complete the core task faster? If not, you removed the wrong things.

*Before → After example:*
- 5-section landing page → 2 sections: hero with value prop + single CTA
- Dashboard with 12 metric cards → 3 key metrics large + "Show all" expandable
- Nav with 8 items → 4 primary + overflow menu

### Change style
Extract structure/layout DNA, replace the entire visual language with a different direction from the table in `skills/variant-generate/SKILL.md`.

### Remix colors
Keep all shapes, type, layout. Generate 3 palettes using OKLCH color space (per `references/design-system/color-and-contrast.md`):
1. Analogous to current — shift hue ±30°, adjust chroma
2. Complementary contrast — opposite hue, rebalanced lightness
3. Unexpected/left-field — completely different mood

Always tint neutrals toward the brand hue. Never use pure gray, pure black (#000), or pure white (#fff).

*Before → After example (palette 3, unexpected):*
- Dark indigo tech dashboard → Warm cream editorial palette with rust accent
- All neutrals shift from cool blue-gray → warm stone-tinted

### Add motion
Layer additional micro-interactions and animations onto the current design. Consult `references/design-system/micro-interactions.md` for the full pattern library.

**Process:**
1. Audit current interactions — list what already moves and what's dead
2. Add only motion that clarifies state, hierarchy, or the requested expressive direction; scroll reveals and card lifts are optional. Honor reduced motion in CSS and JavaScript.
3. Choose relevant enhancements from the "Picking Micro-Interactions by Domain" table; no quota
4. Wire up any static data displays: counter animations for numbers, bar/donut animations for charts
5. Verify reduced motion fallbacks exist for every new animation

*Before → After example:*
- Static hero → Staggered entrance (title 100ms → subtitle 250ms → CTA 400ms → image 300ms)
- Cards appear instantly → Scroll-triggered fade-up with 80ms stagger
- Numbers display as-is → Count up from 0 with easeOutExpo on scroll into view
- Image gallery static → Lightbox on click with keyboard navigation

### Dramatize
Push existing interactions to their cinematic maximum. Not just "add hover" — make the page feel like a directed experience.

**Process:**
1. Replace subtle scroll reveals with more expressive entrances (word-by-word text reveal, curtain reveal, scale-from-zero)
2. Add parallax layers to hero sections (foreground moves faster than background)
3. Upgrade hover effects: card lift → tilt-3D, link underline → magnetic cursor pull
4. Add page-level choreography: scroll progress bar, sticky header morph, section transitions
5. Include a "hero moment" — one interaction that makes the user pause (e.g., counter hitting a big number, image comparison slider, infinite marquee of client logos)

*Before → After example:*
- Simple fade-in on scroll → Staggered word reveal + parallax background + scroll progress bar
- Card hover lifts 4px → Card tilts toward cursor in 3D perspective with glow
- Static hero → Curtain reveal on page load + magnetic CTA button + background parallax

### Make interactive
Add functional interaction patterns that turn the design from a visual into a working prototype. Consult `references/interactive-patterns.md` for full implementations.

**Process:**
1. Identify what should be functional: Is there a form? Add validation + multi-step. Gallery? Add lightbox. Products? Add filtering. Data? Add live charts.
2. Add the most impactful interaction from `references/interactive-patterns.md` for this domain (see "Picking Patterns by Domain" table)
3. Wire up navigation: tabs work, accordions expand, drawers slide, modals open with proper focus trap
4. Add data interactions: sorting, filtering, search — with animated transitions between states
5. Add feedback loops: toast on action, copy-to-clipboard confirmation, form submission success state

*Before → After example:*
- Static product grid → Filter by category with animated show/hide + sort by price with FLIP animation
- Image gallery → Lightbox with keyboard nav (←→ Esc) + zoom on hover + dot indicators
- Contact form → Multi-step with progress bar, floating labels, real-time validation, submit→loading→success
- Dashboard metrics → Animated bar chart on scroll, donut chart that draws in, sparklines that trace, flash-on-update for live data

### Shuffle layout
Same content + style. Rearrange structure: try full-bleed → asymmetric grid → editorial columns → card masonry. Consult `references/design-system/spatial-design.md` for grid systems and visual hierarchy principles.

*Before → After example:*
- Centered hero + 3-column grid → Full-bleed left-aligned hero + asymmetric 2-column with oversized feature

### Polish
Apply Impeccable design system refinements systematically:
- **Typography** (`references/design-system/typography.md`): vertical rhythm, modular scale, OpenType features (tabular-nums for data, proper fractions), font-display: swap, size-adjust fallback metrics
- **Spatial** (`references/design-system/spatial-design.md`): squint test, hierarchy through multiple dimensions, optical alignment (text negative margin -0.05em, icon center offsets)
- **Interaction** (`references/design-system/interaction-design.md`): all 8 interactive states (default/hover/focus/active/disabled/loading/error/success), focus-visible rings, proper form design (visible labels, blur validation, `aria-describedby` errors)
- **Motion** (`references/design-system/motion-design.md`): 100/300/500 rule, ease-out-expo for enters, exit at 75% of enter duration, staggered animations with CSS custom properties
- **UX Writing** (`references/design-system/ux-writing.md`): specific button labels (verb + object), error formula (what → why → fix), empty states that teach the interface, link text with standalone meaning
- **Clarify copy**: Scan all visible text — replace vague labels with specific ones, remove redundant intros, ensure every word earns its place. "Submit" → "Create account". "Error" → "Email needs to be in name@example.com format."

### Critique
Systematic audit against design system principles. Score each dimension and provide specific fixes:

1. **Typography:** Is hierarchy clear? Scale ratio consistent? Fonts distinctive? Vertical rhythm locked?
2. **Color:** WCAG contrast passing? Neutrals tinted? 60-30-10 balance? No pure black/white?
3. **Layout:** Passes squint test? Varied spacing creates rhythm? Cards justified? No nested cards?
4. **Motion:** Durations appropriate (100/300/500)? Ease-out for enters? Reduced motion respected? Only transform+opacity animated?
5. **Interaction:** All 8 states designed? Focus rings present? Touch targets ≥44px? Skeleton > spinner?
6. **Responsive:** Mobile-first? Content-driven breakpoints? Input method detected (`pointer`/`hover`)? Safe areas?
7. **Writing:** Specific button labels? Helpful errors (what/why/fix)? Empty states that teach? No redundant copy?
8. **Resilience:** Text truncation handled? Long content graceful? Loading/error states present? i18n-ready spacing?

### Extract tokens
Export the design's token system in the requested format:

**CSS Custom Properties (default):**
```css
:root {
  /* Primitives */
  --blue-500: oklch(55% 0.2 260);
  --stone-100: oklch(95% 0.01 60);
  /* Semantic */
  --color-primary: var(--blue-500);
  --color-surface: var(--stone-100);
  /* Typography */
  --font-display: 'Fraunces', serif;
  --font-body: 'Instrument Sans', sans-serif;
  --text-xs: clamp(0.7rem, 0.65rem + 0.25vw, 0.75rem);
  --text-base: clamp(0.95rem, 0.9rem + 0.25vw, 1.0625rem);
  --text-xl: clamp(1.5rem, 1rem + 2.5vw, 3rem);
  /* Spacing */
  --space-xs: 4px; --space-sm: 8px; --space-md: 16px;
  --space-lg: 24px; --space-xl: 48px; --space-2xl: 96px;
  /* Motion */
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --duration-instant: 100ms;
  --duration-fast: 200ms;
  --duration-normal: 350ms;
}
```

**JSON (for design tools / Figma):** Same structure as flat key-value JSON.

**Tailwind config:** Extend `theme` with `colors`, `fontFamily`, `spacing`, `transitionTimingFunction`.

### See other views
Render additional views with full design system compliance:

- **Empty state** — not just "No items." Design as an onboarding moment:
  1. Acknowledge briefly ("No projects yet")
  2. Explain the value of filling it ("Create your first project to start tracking progress")
  3. Provide a clear primary action (prominent CTA button)
  4. Add visual interest (illustration, icon, or subtle pattern — never a sad face)
  5. If applicable, show a preview of what it will look like when populated

- **Data-filled state** — realistic volume: 3–7 items for lists, 6–12 months of data for charts, edge cases included (one very long name, one empty optional field)

- **Mobile viewport** — not a shrunk desktop. Per `references/design-system/responsive-design.md`:
  - Rethink for thumb zones (primary actions bottom-right for right-handed)
  - Touch targets ≥44px with padding
  - Navigation collapses to hamburger + drawer or bottom tab bar
  - Tables transform to cards with `data-label` attributes
  - Use `@media (pointer: coarse)` for larger tap areas

- **Dark ↔ Light toggle** — per `references/design-system/color-and-contrast.md`:
  - Dark mode uses lighter surfaces for depth (no shadows)
  - Desaturate accent colors slightly for dark backgrounds
  - Reduce font weight (light text on dark appears heavier)
  - Never pure black (#000) background — use oklch(12-18% ...) tinted

- **Onboarding flow** — per Impeccable *onboard* principles:
  - Show Don't Tell: inline demos > text instructions
  - Make It Optional: skip button always visible, no forced tours
  - Time to Value: reach the "aha moment" in ≤3 steps
  - Context Over Ceremony: teach at the moment of need, not upfront
  - Respect User Intelligence: no condescending language, allow power-user shortcuts

- **Hover / active / focus states** — all interactive elements with visible state changes

### Mix
Combine two variations into one. Accepts forms like "Mix A + B" or "A's layout + C's colors."

**Process:**
1. Use the first-named variation as the **structural base** (layout, hierarchy, component structure)
2. Layer the second variation's **visual language** (palette, typography, motion, signature details)
3. When elements conflict (e.g. both have a distinctive nav pattern), explicitly state the trade-off and pick the one that better serves the content
4. Label result as "Mix [A+B]" and present with a Summary Card showing which parts came from where

## After every action

1. Prepare a new candidate, edit it, and apply it with the history helper (`references/workflow/history.md`). The helper snapshots before replacing files. An edit sets `activeVariant`, never `selectedVariant`; `undo B` leaves A, C and any selection alone.
2. **Rebuild and reopen the preview** (`references/workflow/preview.md`), then rerun `quality-gate.mjs` and `delivery-check.mjs` on the changed direction.
3. **Show a 2-3 line diff summary** in the terminal — what changed, not the full code
4. Offer the grouped action menu again — the loop never ends until the user moves on
5. If the user has iterated 3+ times on the same direction, proactively suggest: "Want to branch? I can apply this to one of the other variations."
6. **At iteration 2:** Ask a direction-check — *"Still feeling this direction, or want to pivot?"*
7. **At iteration 4:** Show a change summary — *"Over 4 rounds: [list key changes]. Want to keep refining or export?"*
8. **At iteration 5+:** Suggest convergence — *"You've refined this 5 times — it's looking solid. Ready to export, or one more pass?"*
