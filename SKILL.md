---
name: variant-design
description: AI-driven visual/UI design generation with Impeccable design system. Generates 3 distinct design variations from a prompt with built-in scenario materials, design system references (typography, color, spatial, motion, interaction, responsive, UX writing), and anti-AI-slop quality gates. Supports variation actions: Vary strong/subtle, Change style, Remix colors, Shuffle layout, Polish, Critique, See other views. Exports to HTML or React. Triggers on: "design options for X", "show me variations", "give me UI directions", "vary this design", "change the style", "remix colors", "shuffle layout", "polish this", "critique this", "design a dashboard/landing page/app/editorial".
---

# Variant Design

Solve the blank canvas problem. Prompt → 3 fully-formed distinct designs → vary → export.

## About

Inspired by the [Variant](https://variant.com) design community — a space where designers share divergent takes on the same brief. This skill brings that practice into Claude Code: every prompt yields three designs that feel like they came from different studios, then lets you iterate with one-word actions.

Built on the **Impeccable design system** — a comprehensive set of design references covering typography, color theory, spatial design, motion, interaction patterns, responsive design, and UX writing. Every design decision is grounded in these principles.

**Supports:** HTML (default) · React · 7 domain reference libraries · 27 palettes · design system references · variation actions

## Scenario Detection → Load Reference

Identify the scenario and load the corresponding reference file before designing:

| User asks about... | Also matches | Load |
|---|---|---|
| Dashboard, analytics, metrics, monitoring, data viz | 后台, admin panel, management system, backoffice, CRM, internal tool | `references/dashboard.md` |
| Editorial, magazine, journalism, news, article | blog post, report, white paper, newsletter | `references/editorial.md` |
| Landing page, SaaS, product page, startup, B2B | website, 官网, corporate site, personal site, portfolio, agency | `references/saas.md` |
| E-commerce, shopping, product, fintech card, consumer | store, shop, marketplace, cart, checkout | `references/ecommerce.md` |
| Education, learning app, quiz, language, science | lesson, flashcard, tutorial, training, course | `references/education.md` |
| Generative art, music tool, 3D, creative tool, synthesizer | tool, studio, editor, canvas, sequencer, DAW | `references/creative.md` |
| Mobile app, iOS, Android, onboarding, home screen | app, 应用, 界面, UI screen | `references/mobile.md` |
| Unsure / general | | Use aesthetic directions table below + `references/palettes.md` |

**Always also load the relevant design system references** from `references/design-system/` based on what matters most for the design:

| Design challenge | Load |
|---|---|
| Font selection, type scale, hierarchy | `references/design-system/typography.md` |
| Color palette, dark mode, contrast | `references/design-system/color-and-contrast.md` |
| Layout, spacing, grids, visual hierarchy | `references/design-system/spatial-design.md` |
| Animations, transitions, loading states | `references/design-system/motion-design.md` |
| Forms, states, focus, keyboard nav | `references/design-system/interaction-design.md` |
| Mobile-first, breakpoints, fluid design | `references/design-system/responsive-design.md` |
| Labels, errors, empty states, microcopy | `references/design-system/ux-writing.md` |

For initial generation, load at minimum: **typography**, **color-and-contrast**, and **spatial-design**. Load others as the design demands.

## Core Workflow

### 1. Parse → Detect → Load
Identify scenario, load domain reference file + relevant design system references, pick 3 starter prompts and palettes. Study the Real Community Examples for composition patterns and what makes each design work — extract the principle, not the surface style.

### 2. Generate 3 Distinct Variations

Each variation = a different studio's interpretation. Never two in the same direction.

**Universal aesthetic directions:**

| Direction | Feel | Signature |
|---|---|---|
| Minimal / Editorial | Type-driven, generous space | One strong font, minimal color |
| Bold / Expressive | High contrast, graphic | Dominant color block |
| Dark / Premium | Moody, atmospheric | Deep bg, elevated surfaces (not shadows) |
| Warm / Human | Rounded, approachable | Soft palette, organic forms |
| Data / Technical | Dense, systematic | Grid, monospace, tight |
| Neo-brutalist | Raw, unconventional | Bold outlines, broken grid |
| Luxury / Silence | Maximum negative space | One image, sparse text |

**For each variation, define before coding:**
- Starter prompt (from reference or custom)
- Color palette (from reference or `palettes.md`) — use OKLCH for perceptually uniform colors where possible
- Typography: display font + body font (see banned fonts list below)
- Layout pattern (from reference) — consult `spatial-design.md` for grid and hierarchy principles
- Motion strategy — consult `motion-design.md` for timing and easing
- One signature detail that makes this variation unforgettable

### 3. Implement

Working code — HTML (default) or React. Real content, no lorem ipsum. Visually complete.

Label: **Variation A — [Name]** / **B — [Name]** / **C — [Name]**

### 4. AI Slop Test (Quality Gate)

Before presenting, run this check on each variation:

> If you showed this interface to someone and said "AI made this," would they believe you immediately? If yes, redesign.

A distinctive interface should make someone ask "how was this made?" not "which AI made this?" Review the Anti-Patterns table below — they are the fingerprints of AI-generated work.

### 5. Offer Variation Actions

After presenting, always offer:

> Which direction resonates? Options:
> - **Vary strong** — push aesthetic to its extreme
> - **Vary subtle** — polish, same direction
> - **Change style** — keep layout, swap visual language
> - **Remix colors** — 3 alternative palettes using OKLCH
> - **Shuffle layout** — same content/style, different composition
> - **Polish** — refine spacing, typography, and micro-details
> - **Critique** — audit against design system principles and identify improvements
> - **See other views** — mobile / dark mode / empty state / hover states

---

## Variation Action Definitions

**Vary strong** — amplify current direction to maximum. More contrast, stronger type, bolder color, more dramatic composition. Consult `references/design-system/typography.md` for scale ratios and `references/design-system/color-and-contrast.md` for high-contrast palette construction.

**Vary subtle** — tighten spacing, refine hierarchy, soften where needed. Same direction, higher craft. Focus on vertical rhythm, optical alignment, and micro-interactions per `references/design-system/spatial-design.md` and `references/design-system/motion-design.md`.

**Change style** — extract structure/layout DNA, replace entire visual language with a different direction from the table above.

**Remix colors** — keep all shapes, type, layout. Generate 3 palettes using OKLCH color space (per `references/design-system/color-and-contrast.md`):
1. Analogous to current — shift hue ±30°, adjust chroma
2. Complementary contrast — opposite hue, rebalanced lightness
3. Unexpected/left-field — completely different mood

Always tint neutrals toward the brand hue. Never use pure gray, pure black (#000), or pure white (#fff).

**Shuffle layout** — same content + style. Rearrange structure: try full-bleed → asymmetric grid → editorial columns → card masonry. Consult `references/design-system/spatial-design.md` for grid systems and visual hierarchy principles.

**Polish** — apply Impeccable design system refinements:
- Audit typography against `references/design-system/typography.md`: vertical rhythm, modular scale, OpenType features (tabular-nums for data, proper fractions)
- Check spatial relationships per `references/design-system/spatial-design.md`: squint test, hierarchy through multiple dimensions
- Refine interactions per `references/design-system/interaction-design.md`: all 8 interactive states, focus-visible, proper form design
- Verify motion per `references/design-system/motion-design.md`: 100/300/500 rule, ease-out-expo for enters, staggered animations
- Validate UX writing per `references/design-system/ux-writing.md`: specific button labels, error formulas, empty states as opportunities

**Critique** — systematic audit against design system principles:
1. Typography: Is hierarchy clear? Scale ratio consistent? Fonts distinctive?
2. Color: WCAG contrast passing? Neutrals tinted? 60-30-10 balance?
3. Layout: Passes squint test? Varied spacing creates rhythm? Cards justified?
4. Motion: Durations appropriate? Ease-out for enters? Reduced motion respected?
5. Interaction: All 8 states designed? Focus rings present? Touch targets ≥44px?
6. Responsive: Mobile-first? Content-driven breakpoints? Input method detected?
7. Writing: Specific button labels? Helpful errors? Empty states that teach?

**See other views** — render: empty state / data-filled state / mobile viewport / dark↔light toggle / active/hover states. Follow `references/design-system/responsive-design.md` for mobile adaptations and `references/design-system/color-and-contrast.md` for dark mode (dark mode ≠ inverted light mode).

---

## Variation Loop

After any variation action, always:
1. Present the updated design (labelled with the action taken, e.g. "Variation A — Vary Strong")
2. Offer the full action menu again — the loop never ends until the user moves on
3. If the user has iterated 3+ times on the same direction, proactively suggest: "Want to branch? I can apply this to one of the other variations."

---

## Design Principles

Grounded in the Impeccable design system. Consult individual references for deep implementation guidance.

### Content & Intent
- **Real content wins.** Plausible headlines, real data values, actual copy. Makes designs feel alive.
- **Commit fully.** Half-executed aesthetics look worse than simple ones. Bold maximalism and refined minimalism both work — the key is intentionality, not intensity.
- **Never converge.** If A is dark, B cannot also be dark. Each must feel like a different studio.
- **Match type to domain.** Don't default to generic app UI — load the right reference.

### Typography *(→ `references/design-system/typography.md`)*
- **Distinctive display + reliable body.** Use Google Fonts `@import`, always specify weights.
- **Banned display fonts:** Inter, Roboto, Arial, Open Sans, Lato, Montserrat, system-ui, system defaults.
- **Better alternatives:** Instrument Sans, Plus Jakarta Sans, Outfit, Onest, Figtree, Urbanist, Fraunces, Newsreader, Lora.
- **Modular scale:** Use fewer sizes with more contrast (5-size system: xs/sm/base/lg/xl+). Popular ratios: 1.25, 1.333, 1.5.
- **Fluid type:** Use `clamp(min, preferred, max)` for responsive sizing. Not for buttons/labels.
- **Vertical rhythm:** Line-height as base unit for all vertical spacing.
- **OpenType features:** `tabular-nums` for data tables, `diagonal-fractions` for recipes, `all-small-caps` for abbreviations.
- Never mix more than 2 typefaces. One well-chosen family in multiple weights often suffices.

### Color *(→ `references/design-system/color-and-contrast.md`)*
- **Use OKLCH** for perceptually uniform palettes. Reduce chroma as you approach white/black.
- **Tint your neutrals** toward the brand hue — even chroma 0.01 creates subconscious cohesion.
- **60-30-10 rule:** 60% neutral, 30% secondary, 10% accent. Accent colors work because they're rare.
- **Never pure black/white.** Always tint. Pure black/white never appears in nature.
- **Never gray on color.** Gray text on colored backgrounds looks washed out — use a darker shade of the background color.
- **Two-layer tokens:** Primitive (`--blue-500`) + semantic (`--color-primary: var(--blue-500)`). Dark mode redefines semantic only.

### Layout & Space *(→ `references/design-system/spatial-design.md`)*
- **4pt base grid** (not 8pt — too coarse). Scale: 4, 8, 12, 16, 24, 32, 48, 64, 96px.
- **Use `gap`** instead of margins for sibling spacing.
- **Squint test:** Blur your eyes — can you identify the most important element, second most, and clear groupings?
- **Hierarchy through multiple dimensions:** Combine size, weight, color, position, and space (2-3 at once).
- **Cards are not required.** Spacing and alignment create grouping naturally. Never nest cards inside cards.
- **Container queries** for component-level responsiveness.

### Motion *(→ `references/design-system/motion-design.md`)*
- **100/300/500 rule:** 100-150ms instant feedback, 200-300ms state changes, 300-500ms layout changes, 500-800ms entrances.
- **Ease-out-expo** (`cubic-bezier(0.16, 1, 0.3, 1)`) for elements entering. Exit at 75% of enter duration.
- **Only animate `transform` and `opacity`.** For height: use `grid-template-rows: 0fr → 1fr`.
- **Stagger with CSS custom properties:** `animation-delay: calc(var(--i) * 50ms)`. Cap total stagger time.
- **Reduced motion is not optional.** Always include `@media (prefers-reduced-motion: reduce)`.
- **Never bounce/elastic easing.** Real objects decelerate smoothly.

### Interaction *(→ `references/design-system/interaction-design.md`)*
- **Design all 8 states:** default, hover, focus, active, disabled, loading, error, success.
- **Focus rings:** Never `outline: none` without replacement. Use `:focus-visible`.
- **Forms:** Visible labels (not just placeholders), validate on blur, errors below fields with `aria-describedby`.
- **Skeleton screens > spinners.** Optimistic UI for low-stakes actions.
- **Undo > confirm dialogs.** Users click through confirmations mindlessly.
- **Modals only as last resort.** Prefer native `<dialog>` when needed. Consider Popover API for non-modal overlays.

### UX Writing *(→ `references/design-system/ux-writing.md`)*
- **Specific button labels:** "Save changes" not "OK", "Create account" not "Submit".
- **Error formula:** What happened → Why → How to fix. Never blame the user.
- **Empty states are opportunities:** Acknowledge, explain value, provide clear action.
- **Link text must standalone:** "View pricing plans" not "Click here".

---

## Code Export

- **HTML**: Single-file, embedded CSS, optional vanilla JS. **Default.**
- **React**: Functional components, Tailwind or CSS modules — state assumptions upfront.

### HTML Output Spec
- CSS custom properties for all colors — use OKLCH where supported with hex fallback: `--accent: oklch(65% 0.2 250); /* fallback: #6366F1 */`
- Semantic token layer: `--color-primary`, `--color-surface`, `--color-text` mapping to primitives
- Google Fonts via `@import` in `<style>` — always specify weights used, include `font-display: swap`
- Responsive: mobile-first, breakpoints at `640px` and `1024px`. Use `clamp()` for fluid values
- No frameworks by default — vanilla CSS + HTML. CDN Tailwind only if user asks
- Hover states + focus-visible rings on all interactive elements
- `@media (prefers-reduced-motion: reduce)` block for all animations
- Minimum visual completeness: populated data, real copy, working nav state

### React Output Spec
- Functional components only — no class components
- Declare color tokens as `const theme = { ... }` with OKLCH values and hex fallbacks
- Google Fonts: add a `<link>` in the returned JSX or instruct user to add to `index.html`
- Prefer inline styles for one-off values; extract repeated patterns to a `styles` object
- State assumptions upfront in a comment block: which components are stateful, what props to pass
- If Tailwind: use `@apply` for repeated patterns; if CSS modules: one `.module.css` per component
- No `useEffect` for layout — CSS-only animations and transitions preferred
- Prop defaults must be realistic content (no `undefined`, no "Lorem ipsum")

### Multi-Screen / Flow Support

When a user asks for a flow (onboarding, checkout, wizard, multi-step form):
1. Render all screens side-by-side horizontally, each in a `390px` frame with label above
2. Use a shared `currentStep` state variable to show/hide screens if making it interactive
3. Annotate transitions: "→ swipe left to advance" or "→ tab triggers step 2"
4. Each screen must be visually complete — never leave a screen empty as placeholder

---

## Anti-Patterns (AI Slop Fingerprints)

Avoid these in every output — they are the telltale signs of AI-generated design:

| Anti-pattern | Instead |
|---|---|
| Two variations in the same aesthetic direction | Ensure A/B/C feel like different studios — re-check the direction table |
| `Inter`, `Roboto`, `Arial`, `system-ui` as display fonts | Distinctive fonts: Instrument Sans, Fraunces, Outfit, Newsreader |
| Hardcoded hex values in CSS rules | CSS custom properties with OKLCH: `color: var(--text)` |
| Lorem ipsum or placeholder text | Real, domain-plausible content |
| Generic "Feature 1 / Feature 2 / Feature 3" copy | Specific feature names that match the domain |
| Five or more colors used at similar weight | 60-30-10: one dominant color used with conviction |
| Cards with identical sizes and equal visual weight | Vary card sizes to create rhythm and hierarchy |
| Hover states missing on interactive elements | Every button, link, and card needs hover + focus-visible |
| Mobile layouts that are just desktop shrunk down | Rethink for thumb zones, touch targets, and vertical flow |
| Gradient abuse (5+ color gradient backgrounds) | One solid color or a two-stop gradient maximum |
| Purple-to-blue gradients, cyan-on-dark, neon accents | Intentional palette from OKLCH, tinted neutrals |
| Glassmorphism everywhere (blur, glow borders) | Purposeful decorative elements that reinforce brand |
| Big rounded icons above every heading | They rarely add value — use typography for hierarchy |
| Cards nested inside cards | Flatten hierarchy — use spacing and dividers |
| Everything centered | Left-aligned with asymmetric layouts feels more designed |
| Same spacing everywhere | Varied spacing creates rhythm — tight groups, generous separations |
| Gradient text on headings/metrics | Decorative, not meaningful — use solid color with weight |
| Dark mode as default with glowing accents | Earn dark mode: different surface depths, desaturated accents, no shadows |
| Bounce/elastic easing | Exponential ease-out — real objects decelerate smoothly |
| `outline: none` without replacement | `:focus-visible` with 2-3px offset ring |
| Modals for everything | Consider alternatives: inline expansion, drawers, popovers |
| Pure black (#000) or pure white (#fff) | Always tint — pure extremes don't exist in nature |
| Gray text on colored backgrounds | Use darker shade of the background color |

---

## Accessibility Baseline

Apply to every output — non-negotiable:
- Text contrast minimum: **4.5:1** for body, **3:1** for large text (≥24px bold or ≥18.5px normal)
- All interactive elements: minimum **44×44px** touch/click target (use pseudo-elements if visual size is smaller)
- Focus rings: never `outline: none` without a custom visible `:focus-visible` replacement
- Don't convey meaning by color alone — pair with icon, label, or pattern
- Avoid pure white on pure black for long-form text — slightly off-white/off-black (`#F0EDE8` on `#111`) reduces eye strain
- `@media (prefers-reduced-motion: reduce)` — preserve functional animations (progress, loading), remove spatial movement
- Use `rem`/`em` for font sizes, never `px` for body text — respect browser settings
- Minimum 16px body text on all viewports
