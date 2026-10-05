# Variant Design — Landing system

The implementation in `src/design-system.css` is the token source of truth. The current product shell is monochrome with a bilingual editorial serif stack; the older blue/acid palette and square-corner description no longer describe the site.

- Keep Iowan Old Style/Baskerville and Songti/Source Han Serif fallbacks for display and body; monospace is reserved for metadata and commands.
- Reuse the ink, paper, surface, muted, border, radius, and spacing tokens. Color belongs to the palette examples and generated work.
- A/B/C retain the same site functions, content below the hero, font stack, and palette. Their hero priority and arrangement may differ.
- A explains the product first; B makes the actual comparison the main action; C prioritizes installing the complete skill.
- Keep useful controls in the first viewport. Preserve navigation on mobile through the native details menu.
- Clearly distinguish the built-in site variants, rule-based example contracts, and live model output. Missing model configuration is an unavailable state, not a successful generation.
- Motion communicates state and respects reduced motion. Keyboard focus remains visible.

`variant-output/VariantA.tsx`, B, and C own their hero configurations. Shared `App.tsx` and `LandingIntroduction.tsx` provide the same working site. Local hero edits use the history helper; `npm run export:landing -- B` copies the current B configuration into `src/landing-config.ts` with a backup.
