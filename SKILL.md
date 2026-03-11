---
name: variant-design
description: AI-driven visual/UI design generation inspired by Variant (variant.com) community. Generates multiple distinct design variations from a text prompt, supports variation actions (Vary strong/subtle, Change style, Remix colors, Shuffle layout, See other views), and exports to HTML or React. Use when users want to explore design directions, create visual variations, or iterate on existing designs. Triggers on: "give me design directions", "show me variations", "design options for X", "vary this design", "change the style", "remix the colors", "shuffle the layout", "help me explore UI/visual designs".
---

# Variant Design

Solve the blank canvas problem. Input a concept → generate multiple fully-formed, distinct interpretations → vary, remix, export.

## Core Workflow

### 1. Parse the Prompt

Extract:
- **Subject**: what to design (dashboard, editorial card, landing page, app, poster, etc.)
- **Domain**: fintech, health, science, language learning, e-commerce, B2B SaaS, etc.
- **Constraints**: dark/light, framework (HTML/React), brand colors

### 2. Generate 3 Distinct Variations

Each variation must feel like a different studio made it. Never two variations in the same direction.

**Aesthetic directions** (pick 3 that suit the domain):

| Direction | Feel | Signature |
|-----------|------|-----------|
| Minimal / Editorial | Clean, type-driven, generous space | One strong font, minimal color |
| Bold / Expressive | High contrast, vivid, graphic | Dominant color block, strong hierarchy |
| Dark / Premium | Moody, refined, atmospheric | Deep backgrounds, subtle glows |
| Warm / Human | Rounded, approachable | Soft palette, organic forms |
| Data / Technical | Information-dense, systematic | Grid, monospace accents, tight spacing |
| Neo-brutalist | Raw, direct, unconventional | Bold outlines, flat color, broken grid |
| Editorial / Magazine | Print-inspired, layered | Mixed type scales, asymmetry |
| Luxury / Silence | Maximal negative space, nothing extra | One image, sparse text, refined |

**For each variation define before coding:**
- Color palette: 1 dominant + 1 accent + neutral
- Typography: display font + body font (never Inter, Roboto, Arial, system-ui)
- Layout: masonry / full-bleed / card grid / editorial columns / dashboard grid
- One signature detail worth remembering

### 3. Implement Each Variation

Generate working code (HTML/CSS or React):
- Real content — no "lorem ipsum" in headlines, plausible data/copy
- Visually complete — backgrounds, type, spacing, icons (unicode or inline SVG)
- Responsive basics included

Label each: **Variation A — [Direction Name]**, **B — [Direction Name]**, **C — [Direction Name]**

### 4. Offer Variation Actions

> Which direction resonates? I can:
> - **Vary strong** — push the aesthetic to its extreme, bigger changes
> - **Vary subtle** — polish and refine, same direction
> - **Change style** — keep layout, swap the entire visual language
> - **Remix colors** — keep everything, try 3 alternative palettes
> - **Shuffle layout** — same content/style, rearrange spatial composition
> - **See other views** — same concept as different screen/state (empty, mobile, dark mode)

---

## Variation Actions

**Vary strong** — amplify current aesthetic to extreme. More contrast, stronger type, bolder color.

**Vary subtle** — polish. Tighten spacing, soften edges, improve hierarchy. Same feel, higher craft.

**Change style** — extract layout/structure DNA, replace entire visual language.

**Remix colors** — keep all shapes, type, layout. Generate 3 palettes: analogous / complementary / unexpected.

**Shuffle layout** — keep content + style. Try: full-bleed → asymmetric grid → editorial columns.

**See other views** — empty state, filled state, mobile, dark/light toggle, hover/active states.

---

## Design Categories & Real Examples

From the Variant community. Use these as inspiration for what to generate — go far beyond generic "app UI":

### Data Dashboards & Analytics
- Financial monitoring: stock tickers, stability indicators, integrity scores, dark dense grid
- Political analysis: election probability charts, swing state maps, trend lines on green/yellow
- Cloud infrastructure: uptime metrics, cluster status, latency heatmaps

### Editorial & Journalism
- Science magazine: planetary database (Mars elements table + orbital stats on red/orange)
- Science article: long-form with pull quotes, planetary rover timeline
- Luxury editorial: full-bleed photography, "silence is a luxury", minimal type overlay
- Election brief: large statement text + supporting analytics chart

### B2B SaaS Landing Pages
- AI data product: "Mosaic builds datasets for humans and agents" — feature grid, stats (2.4B+, 14K+), competitive intelligence
- Infrastructure product: "Structural Efficiency." — dark, three-column feature cards (Fluid Instance / Synthetic Ri / Geo-Cluster)

### Education & Learning Apps
- Language learning: sentence translation exercise, bilingual side-by-side (Japanese/English), CHECK ANSWER flow
- Science education: planetary database cards with element breakdowns

### Generative Art & Creative Tools
- 3D parameter controller: vortex/tube shape with sliders (Radius, Rows, Columns, Density, Velocity, Decay), live 3D wireframe preview
- Music synthesizer: AETHERIC SYNTH, dark with LIVE indicator

### E-commerce & Consumer Apps
- Chinese wellness e-commerce: crystal bracelet energy app (今日能量配置), element classification (金属/木/水/火/土), 加入购物车
- Premium fintech: black credit card (VISA, dark background, card number + holder name + expiry)

### Astronomy & Nature Apps
- Sky observation: "Current visibility is optimal. The Lyrid meteor shower is entering peak activity" — dark, star field
- Observatory log: Observation Log + Sky Map dual-panel

### Brand Identity
- Sportswear: OAKLEY — rainbow gradient logo treatment
- Typography-first: oversized serif, single bold statement

### Productivity & Workspace
- Workspace command center: @GPI_WORKSPACE with TAKE / CONTINUE / GO action buttons
- Smart home control: minimal circular dial/knob UI

---

## Design Principles

**Real content beats placeholders.** Write plausible headlines, actual data values, real UI copy. It makes designs feel alive.

**Commit to an aesthetic direction.** Half-executed looks worse than simple. Bold maximalism and restrained minimalism both work — intentionality is the key.

**Typography is the first impression.** Distinctive display font + reliable body font. Use Google Fonts. Avoid convergent choices.

**Color = personality.** One dominant color used boldly beats five colors used timidly. CSS custom properties throughout.

**Never two variations the same.** If A is dark and moody, B cannot also be dark. Each must feel like a different studio.

**Match design type to content.** Don't default to generic app UI when the content calls for editorial, dashboard, or e-commerce.

---

## Code Export

- **HTML**: Single-file with embedded CSS, optional vanilla JS. Default.
- **React**: Functional components with Tailwind or CSS modules — state assumptions upfront.

Default to HTML unless user specifies React or a framework.
