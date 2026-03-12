---
name: variant-design
description: AI-driven visual/UI design generation inspired by Variant (variant.com) community. Generates 3 distinct design variations from a prompt with built-in scenario materials (prompts, palettes, typography, layouts). Supports variation actions: Vary strong/subtle, Change style, Remix colors, Shuffle layout, See other views. Exports to HTML or React. Use when users want design directions, visual variations, or UI exploration. Triggers on: "design options for X", "show me variations", "give me UI directions", "vary this design", "change the style", "remix colors", "shuffle layout", "design a dashboard/landing page/app/editorial".
---

# Variant Design

Solve the blank canvas problem. Prompt → 3 fully-formed distinct designs → vary → export.

## About

Inspired by the [Variant](https://variant.com) design community — a space where designers share divergent takes on the same brief. This skill brings that practice into Claude Code: every prompt yields three designs that feel like they came from different studios, then lets you iterate with one-word actions.

**Supports:** HTML (default) · React · 7 domain reference libraries · 27 palettes · variation actions

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

## Core Workflow

### 1. Parse → Detect → Load
Identify scenario, load reference file, pick 3 starter prompts and palettes from it. Study the Real Community Examples for composition patterns and what makes each design work — extract the principle, not the surface style.

### 2. Generate 3 Distinct Variations

Each variation = a different studio's interpretation. Never two in the same direction.

**Universal aesthetic directions:**

| Direction | Feel | Signature |
|---|---|---|
| Minimal / Editorial | Type-driven, generous space | One strong font, minimal color |
| Bold / Expressive | High contrast, graphic | Dominant color block |
| Dark / Premium | Moody, atmospheric | Deep bg, subtle glows |
| Warm / Human | Rounded, approachable | Soft palette, organic forms |
| Data / Technical | Dense, systematic | Grid, monospace, tight |
| Neo-brutalist | Raw, unconventional | Bold outlines, broken grid |
| Luxury / Silence | Maximum negative space | One image, sparse text |

**For each variation, define before coding:**
- Starter prompt (from reference or custom)
- Color palette (from reference or `palettes.md`)
- Typography: display font + body font (never Inter, Roboto, Arial, system-ui)
- Layout pattern (from reference)
- One signature detail

### 3. Implement

Working code — HTML (default) or React. Real content, no lorem ipsum. Visually complete.

Label: **Variation A — [Name]** / **B — [Name]** / **C — [Name]**

### 4. Offer Variation Actions

After presenting, always offer:

> Which direction resonates? Options:
> - **Vary strong** — push aesthetic to its extreme
> - **Vary subtle** — polish, same direction
> - **Change style** — keep layout, swap visual language
> - **Remix colors** — 3 alternative palettes
> - **Shuffle layout** — same content/style, different composition
> - **See other views** — mobile / dark mode / empty state / hover states

---

## Variation Action Definitions

**Vary strong** — amplify current direction to maximum. More contrast, stronger type, bolder color, more dramatic composition.

**Vary subtle** — tighten spacing, refine hierarchy, soften where needed. Same direction, higher craft.

**Change style** — extract structure/layout DNA, replace entire visual language with a different direction from the table above.

**Remix colors** — keep all shapes, type, layout. Generate 3 palettes: (1) analogous to current, (2) complementary contrast, (3) unexpected/left-field.

**Shuffle layout** — same content + style. Rearrange structure: try full-bleed → asymmetric grid → editorial columns → card masonry.

**See other views** — render: empty state / data-filled state / mobile viewport / dark↔light toggle / active/hover states.

---

## Variation Loop

After any variation action, always:
1. Present the updated design (labelled with the action taken, e.g. "Variation A — Vary Strong")
2. Offer the full action menu again — the loop never ends until the user moves on
3. If the user has iterated 3+ times on the same direction, proactively suggest: "Want to branch? I can apply this to one of the other variations."

---

## Design Principles

- **Real content wins.** Plausible headlines, real data values, actual copy. Makes designs feel alive.
- **Commit fully.** Half-executed aesthetics look worse than simple ones.
- **Never converge.** If A is dark, B cannot also be dark. Each must feel like a different studio.
- **Match type to domain.** Don't default to generic app UI — load the right reference.
- **Typography first.** Distinctive display + reliable body. Use Google Fonts `@import`. Scale: display 48–96px, section header 24–32px, body 15–17px, caption 12–13px. Line-height: 1.2 for headlines, 1.6–1.8 for body. Never mix more than 2 typefaces.
- **Color = one bold choice.** One dominant color used with conviction beats five timid colors.

---

## Code Export

- **HTML**: Single-file, embedded CSS, optional vanilla JS. **Default.**
- **React**: Functional components, Tailwind or CSS modules — state assumptions upfront.

### HTML Output Spec
- CSS custom properties (`--bg`, `--accent`, etc.) for all colors — never hardcode hex in rules
- Google Fonts via `@import` in `<style>` — always specify weights used
- Responsive: mobile-first, breakpoints at `640px` and `1024px`
- No frameworks by default — vanilla CSS + HTML. CDN Tailwind only if user asks
- Hover states required on all interactive elements
- Minimum visual completeness: populated data, real copy, working nav state

### React Output Spec
- Functional components only — no class components
- Declare all color tokens as a `const theme = { bg: '...', accent: '...' }` object at the top of the file, reference via `style={{ background: theme.bg }}`
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

## Anti-Patterns

Avoid these in every output:

| Anti-pattern | Instead |
|---|---|
| Two variations in the same aesthetic direction | Ensure A/B/C feel like different studios — re-check the direction table |
| `Inter`, `Roboto`, `Arial`, `system-ui` as display fonts | Pick a distinctive display font from the reference pairing list |
| Hardcoded hex values in CSS rules (e.g., `color: #0F172A`) | Use CSS custom properties: `color: var(--text)` |
| Lorem ipsum or placeholder text | Write real, domain-plausible content |
| Generic "Feature 1 / Feature 2 / Feature 3" copy | Specific feature names that match the domain |
| Five or more colors used at similar weight | One dominant color used with conviction |
| Cards with identical sizes and equal visual weight | Vary card sizes to create rhythm and hierarchy |
| Hover states missing on interactive elements | Every button, link, and card needs a visible hover |
| Mobile layouts that are just desktop shrunk down | Rethink for thumb zones, touch targets, and vertical flow |
| Gradient abuse (5+ color gradient backgrounds) | One solid color or a two-stop gradient maximum |

---

## Accessibility Baseline

Apply to every output — non-negotiable:
- Text contrast minimum: **4.5:1** for body, **3:1** for large text (≥24px bold or ≥18.5px normal)
- All interactive elements: minimum **44×44px** touch/click target
- Focus rings: never `outline: none` without a custom visible replacement
- Don't convey meaning by color alone — pair with icon, label, or pattern
- Avoid pure white on pure black for long-form text — slightly off-white/off-black (`#F0EDE8` on `#111`) reduces eye strain
