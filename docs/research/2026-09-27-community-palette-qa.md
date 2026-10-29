# Design QA — Community Palette Archive

## Scope

- Feature: built-in community palettes for the landing-page direction engine.
- Source reference: `/Users/nicole/Documents/Codex/2026-09-26/https-github-com-jakubantalik-libraries-dev/outputs/palette-audit-2026-09-27/02-reference-thread-palettes.png`.
- Desktop implementation evidence: `/Users/nicole/Documents/Codex/2026-09-26/https-github-com-jakubantalik-libraries-dev/outputs/palette-audit-2026-09-27/03-implementation-desktop.png`.
- Mobile implementation evidence: `/Users/nicole/Documents/Codex/2026-09-26/https-github-com-jakubantalik-libraries-dev/outputs/palette-audit-2026-09-27/04-implementation-mobile.png`.
- Typography refinement evidence: `/Users/nicole/Documents/Codex/2026-09-26/https-github-com-jakubantalik-libraries-dev/outputs/palette-audit-2026-09-27/05-typography-system-desktop.png`.
- Source URL: `https://www.threads.com/share/_4EmJsY_E/`.

## Comparison setup

- Desktop source and implementation were compared together at 1280 × 720 CSS pixels, DPR 1.
- Mobile implementation was checked at 390 × 844 CSS pixels, DPR 1.
- Selected state: `Ancient Gild · Slate` / `古金 · 岩蓝`.
- Languages checked independently: English and Simplified Chinese.
- The source is a set of portrait palette cards; the implementation intentionally adapts its art direction into a responsive editorial archive rather than reproducing the Threads layout.

## Visual findings

- The main atmospheric image now carries the palette's emotional tone while the three exact color values remain explicit and usable.
- A single selected stage plus a restrained numbered index replaces the earlier equal-weight card strip, producing a clearer visual hierarchy.
- Thin rules, large editorial type, generous whitespace, and the existing blue/acid design tokens keep the new section consistent with the rest of the landing page.
- The seven palette rows remain scannable without competing with the selected artwork.
- Mobile stacking preserves the same hierarchy: artwork → name and mood → exact swatches → palette index.
- Dark and mid-tone swatches use computed light foreground text; light swatches use dark text.
- Typography now has two explicit roles: one shared sans family for brand display, headings, and body copy; one mono family reserved for indices, states, and color data.
- English emphasis stays inside the display family through weight and italic styling. Chinese uses weight, scale, and color instead of synthetic italic styling.

## Interaction and responsive checks

- Selecting a palette updates the selected stage and all three generated direction color systems.
- Palette selection persists in local storage.
- `Smart match` remains available as the prompt-driven option.
- Selection is exposed through semantic buttons with `aria-pressed`.
- Chinese mode contains localized headings, body copy, palette names, moods, and color names; English mode is equally self-contained.
- Mobile viewport has no horizontal overflow (`scrollWidth = innerWidth = 390`).
- Browser console produced no warnings or errors during the final interaction pass.
- Production build and TypeScript validation pass.

## Comparison history

1. P1 — Switching from a four-color direction to a repeated three-color palette could retain an obsolete swatch because repeated hex values were used as React keys. Fixed by including the color role index in each key; verified that every direction now contains exactly four intended role swatches.
2. P1 — Labels on dark swatches were unreadable because all swatch text was dark. Fixed with luminance-based foreground selection and verified against the darkest, mid-tone, and lightest values.
3. P2 — The equal-weight palette presentation did not match the source's atmospheric confidence. Replaced it with one dominant stage and a quiet archive index, then rechecked desktop and mobile hierarchy against the source reference.
4. P2 — Serif display accents, sans body text, and pervasive mono labels created too many competing voices. Replaced the serif role with the shared display family, centralized weight/tracking tokens, restricted mono to data, and verified both English and Chinese at the same desktop breakpoint.

## Final result

passed
