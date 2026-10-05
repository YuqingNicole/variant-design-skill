# Quality baseline

Use this reference for generated UI and for style audits. Mechanical checks catch known defects; a rendered review decides whether the design is coherent and distinctive.

## Mechanical gate

Run:

```bash
node <skill-root>/scripts/quality-gate.mjs <file-or-directory> --strict
```

The scanner checks common accessibility, resilience, copy, and AI-slop indicators in HTML, CSS, JSX, TSX, Vue, Svelte, and Astro files. Inspect matches before changing code because pattern-based checks can produce false positives.

Strict mode fails on warnings as well as errors. Use `--json` for machine-readable output and `--self-test` to validate the scanner itself.

## Visual gate

Check the rendered result, not just source code:

- hierarchy is obvious at a squint;
- Exploration: A/B/C express distinct task trade-offs through layout and interaction; type and palette may differ when appropriate. Brand-locked: fonts, colors, components, and token scales remain identical; compare hierarchy, density, and structure;
- text rhythm, spacing, and alignment come from a small token set;
- mobile is recomposed rather than merely shrunk;
- actions provide hover, focus, active, loading, error, and success feedback when relevant;
- motion communicates state or hierarchy and respects reduced-motion preferences;
- realistic long, empty, and failure content does not break the layout.

## Typography

- Use a distinctive display face only when it fits the product; body type must remain readable.
- Preserve existing or confirmed brand fonts, including any families listed below. In free exploration, avoid defaulting display text to Inter, Roboto, Arial, Open Sans, Lato, Montserrat, `system-ui`, or an unspecified system font.
- Suitable alternatives include Instrument Sans, Plus Jakarta Sans, Outfit, Onest, Figtree, Urbanist, Fraunces, Newsreader, and Lora.
- Use no more than two families, a deliberate type scale, balanced headings, and body line-height around 1.5–1.7.
- Use tabular numerals for comparable data.

## Color and surfaces

- Prefer semantic tokens over scattered literals.
- Tint neutrals toward the brand; avoid pure black backgrounds and arbitrary mixed gray families.
- Use accent color sparingly and preserve text contrast.
- Avoid default purple-blue gradients, indiscriminate glass, glow borders, and unrelated dark sections.

## Layout and content

- Avoid universal centering, nested cards, and repetitive equal-weight three-card rows.
- Use constrained content widths, intentional asymmetry, and a spacing rhythm.
- Use real domain copy. Reject lorem ipsum, generic feature labels, fake round metrics, and generic names such as Acme Corp or John Doe.
- Avoid clichés such as “Elevate,” “Seamless,” “Unleash,” “Next-Gen,” “Game-changer,” and “Delve.”
- Error messages must explain what happened and how to recover. The scanner covers common English and Chinese generic errors.

## Accessibility baseline

- Body text contrast targets WCAG AA: 4.5:1, or 3:1 for qualifying large text.
- Interactive targets should be at least 44×44 CSS pixels where touch is expected.
- Every interactive control needs a visible accessible name and keyboard focus.
- Every meaningful image needs useful alternative text; decorative images use empty `alt`.
- Never remove focus outlines without a visible `:focus-visible` replacement.
- Pair color with text, shape, icon, or pattern when it conveys meaning.
- Add `prefers-reduced-motion` handling whenever animation or transition is used.

## Behavioral evidence

Scanner success is only a static preflight. Keyboard-tab through actual controls and inspect the computed focus indicator; an unrelated `:focus-visible` selector proves nothing. Test the same output under `prefers-reduced-motion: reduce`: counters must show final values immediately, reveals must leave content visible, and JavaScript loops, timers, and smooth scrolling must honor the preference (including a change while running).

For the five regression scenarios and executable checks, read `references/preview-and-history.md`. Record the artifact, viewport, action, expected result, actual result, and any untested behavior. Do not describe fixture coverage as validation of every future generated page.

## Product integrity

For money, privacy, permissions, deletion, health, safety, or AI-derived conclusions, also run `references/product-integrity-gate.md`. Report it separately:

```text
Product Integrity: pass | conditional | block
P0: 0 · P1: 1 · P2: 2
Fix next: [short concrete action]
```

Do not present a P0 result as complete.
