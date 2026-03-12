# variant-design

> Solve the blank canvas problem. Prompt → 3 fully-formed distinct designs → vary → export.

A Claude Code skill inspired by the [Variant](https://variant.com) design community. Give it a prompt, get three divergent design directions — each from a different studio's aesthetic — then iterate with one-word actions.

---

## What it does

1. **Detects your scenario** — dashboard, SaaS landing page, editorial, e-commerce, mobile app, creative tool, education
2. **Generates 3 distinct variations** — each pulls from a different aesthetic direction (Minimal/Editorial, Bold/Expressive, Dark/Premium, Warm/Human, Neo-brutalist, Luxury/Silence…)
3. **Ships working code** — HTML single-file by default, or React. Real content, no lorem ipsum
4. **Offers variation actions** — push further, polish, swap styles, remix colors, shuffle layouts, see other views

---

## Installation

### Claude Code (recommended)

```bash
claude skill install https://github.com/YuqingNicole/variant-design-skill
```

Or add manually to your project's `SKILL.md` — copy the contents of [`SKILL.md`](./SKILL.md) into your existing skill file.

### Other Claude interfaces

**Claude.ai (web/desktop):** Paste the contents of `SKILL.md` into a Project's custom instructions, or drop it at the top of a conversation as a system prompt.

**API / custom integrations:** Include `SKILL.md` as a system message before your user turn.

---

## Usage

### Basic triggers

The simplest way — just describe what you want:

```
design a dashboard for a crypto trading terminal
show me 3 directions for a SaaS landing page
give me UI options for a wellness app
```

### Directed triggers — lock in a style or reference a site

You can be more specific by naming an aesthetic direction, a palette, or even an existing site you want to match:

```
developer tools homepage, code-first hero with CLI snippet, dark Data/Technical direction

landing page for an AI agent tool — Dark Indigo palette, Geist font, Code-First layout from saas.md

3 variations for a food delivery app — one Warm/Human, one Bold/Expressive, one Neo-brutalist

reproduce the visual style of [site you described] — dark navy, monospace, swim lane diagrams
```

**Tip:** the more constraints you name (direction + palette + layout pattern), the more targeted the output. The more open the prompt, the more divergent the three variations will be.

### Anatomy of a directed prompt

```
[what it is] + [domain] + [aesthetic direction or palette] + [layout hint] + [any signature detail]
```

Examples:

| Goal | Prompt |
|---|---|
| Match a specific site's vibe | `"developer tool landing page — dark Data/Technical, CLI code hero, Dark Indigo palette"` |
| Explore freely | `"landing page for a mindfulness app"` |
| One fixed + two free | `"3 directions for a finance dashboard — one must be Amber Finance dark terminal"` |
| Multi-screen flow | `"3-screen onboarding flow for a meditation app, Wellness Soft palette"` |

### Variation actions

After seeing the initial 3 variations, iterate with:

| Action | What happens |
|---|---|
| **Vary strong** | Push current direction to its extreme |
| **Vary subtle** | Polish and refine, same aesthetic |
| **Change style** | Keep layout, swap entire visual language |
| **Remix colors** | 3 alternative palettes: analogous / complementary / unexpected |
| **Shuffle layout** | Same content + style, different composition |
| **See other views** | Mobile / dark mode / empty state / hover states |

---

## Reference library

Domain-specific materials (starter prompts, palettes, typography, layouts, real community examples):

| File | Domain |
|---|---|
| `references/dashboard.md` | Data dashboards, analytics, monitoring, trading terminals |
| `references/editorial.md` | Magazines, journalism, long-form, news |
| `references/saas.md` | SaaS landing pages, B2B, developer tools |
| `references/ecommerce.md` | E-commerce, consumer apps, fintech cards |
| `references/education.md` | Learning apps, quizzes, language tools |
| `references/creative.md` | Generative art, music tools, creative software |
| `references/mobile.md` | iOS/Android apps, onboarding, home screens |
| `references/palettes.md` | Universal palette library — 27 palettes × 7 aesthetic directions |

---

## Design principles

- **Real content wins.** Plausible headlines, real data, actual copy. Makes designs feel alive.
- **Commit fully.** Half-executed aesthetics look worse than simple ones.
- **Never converge.** If A is dark, B cannot also be dark. Each must feel like a different studio.
- **Typography first.** Distinctive display font + reliable body. Never Inter, Roboto, Arial, system-ui.
- **Color = one bold choice.** One dominant color used with conviction beats five timid colors.

---

## Contributing

PRs welcome. Each reference file follows a consistent 6-section schema:

1. Starter Prompts (domain-grouped)
2. Color Palettes (CSS custom properties)
3. Typography Pairings
4. Layout Patterns
5. Signature Details
6. Real Community Examples

---

Built with [Claude Code Skills](https://claude.ai/code).
