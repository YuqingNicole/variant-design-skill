---
name: variant-design
description: AI-driven visual/UI design generation inspired by Variant (variant.com) community. Generates 3 distinct design variations from a prompt with built-in scenario materials (prompts, palettes, typography, layouts). Supports variation actions: Vary strong/subtle, Change style, Remix colors, Shuffle layout, See other views. Exports to HTML or React. Use when users want design directions, visual variations, or UI exploration. Triggers on: "design options for X", "show me variations", "give me UI directions", "vary this design", "change the style", "remix colors", "shuffle layout", "design a dashboard/landing page/app/editorial".
---

# Variant Design

Solve the blank canvas problem. Prompt → 3 fully-formed distinct designs → vary → export.

## Scenario Detection → Load Reference

Identify the scenario and load the corresponding reference file before designing:

| User asks about... | Load |
|---|---|
| Dashboard, analytics, metrics, monitoring, data viz | `references/dashboard.md` |
| Editorial, magazine, journalism, news, article | `references/editorial.md` |
| Landing page, SaaS, product page, startup, B2B | `references/saas.md` |
| E-commerce, shopping, product, fintech card, consumer | `references/ecommerce.md` |
| Education, learning app, quiz, language, science | `references/education.md` |
| Generative art, music tool, 3D, creative tool, synthesizer | `references/creative.md` |
| Mobile app, iOS, Android, onboarding, home screen | `references/mobile.md` |
| Unsure / general | Use aesthetic directions table below + `references/palettes.md` |

## Core Workflow

### 1. Parse → Detect → Load
Identify scenario, load reference file, pick 3 starter prompts and palettes from it.

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

## Design Principles

- **Real content wins.** Plausible headlines, real data values, actual copy. Makes designs feel alive.
- **Commit fully.** Half-executed aesthetics look worse than simple ones.
- **Never converge.** If A is dark, B cannot also be dark. Each must feel like a different studio.
- **Match type to domain.** Don't default to generic app UI — load the right reference.
- **Typography first.** Distinctive display + reliable body. Use Google Fonts `@import`.
- **Color = one bold choice.** One dominant color used with conviction beats five timid colors.

---

## Code Export

- **HTML**: Single-file, embedded CSS, optional vanilla JS. **Default.**
- **React**: Functional components, Tailwind or CSS modules — state assumptions upfront.
