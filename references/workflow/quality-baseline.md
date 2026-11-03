# Quality baseline

Use this reference for generated UI and for style audits. Mechanical checks catch known defects; a rendered review decides whether the design is coherent and distinctive.

## Mechanical gate

Run:

```bash
node <skill-root>/scripts/quality-gate.mjs <file-or-directory> --strict
```

The scanner checks common accessibility, resilience, copy, and AI-slop indicators in HTML, CSS, JSX, TSX, Vue, Svelte, and Astro files. Inspect matches before changing code because pattern-based checks can produce false positives.

Strict mode fails on warnings as well as errors. Use `--json` for machine-readable output and `--self-test` to validate the scanner itself.

For A/B/C deliveries, also run `node <skill-root>/scripts/delivery-check.mjs variant-output [--project <root>] [--json]`. It reads `.variant-context.json` and the owned files: three registered directions with distinct comparisons, a shared task contract, a recommendation without a selection, and, under a design-system lock, recorded and declared fonts and recorded colors that match the locked file. Under a brand-file lock it also reads `designSystem.extensions`: an extension that redefines a brand variable is an error. Hex colors outside the system, and spacing, font-size or radius values off its scale (CSS or JSX style objects; `clamp()`/`calc()` and `var()` are skipped), are warnings that name the nearest token: explain them or replace them, not errors. A confirmed system's own text/surface pairs below 4.5:1 (`scripts/ds-check.mjs`) are warnings too. Under a system the skill generated (`variant-output/design-system.css`), a direct reference to a primitive (`--p-*`) is a warning: product code uses semantic tokens. When the system records `source` (it was derived from a picked direction), only that direction is held to it; the other directions predate the system.

## Style budget

When the request is about restraint (premium, cleaner, polished), count what the rendered page uses with `node <skill-root>/scripts/style-budget.mjs` before and after the change. Budgets and the translation of these words are in `references/workflow/adjective-translation.md`.

## Visual gate

Check the rendered result, not just source code:

- hierarchy is obvious at a squint;
- Exploration: A/B/C express distinct task trade-offs through layout and interaction; type and palette may differ when appropriate. Brand-locked: fonts, colors, components, and token scales remain identical; compare hierarchy, density, and structure;
- text rhythm, spacing, and alignment come from a small token set;
- mobile is recomposed rather than merely shrunk;
- actions provide hover, focus, active, loading, error, and success feedback when relevant;
- motion communicates state or hierarchy and respects reduced-motion preferences;
- realistic long, empty, and failure content does not break the layout.

## Generator habits

Generated interfaces converge on the same moves whatever the product. Each one below needs a reason that is about this product's task; "it looks designed" is not one. Remove the rest before presenting. `quality-gate.mjs` lists the first three as `review` findings (they never fail `--strict`, because a brand page may use them on purpose): remove each, or say in the report why it stays.

- Uppercase letter-spaced eyebrow labels above headings (`eyebrow-label`).
- Decorative numbers: zero-padded counts and step numbers (`04`, `01–03`), oversized stats that answer no question, round fake metrics (`decorative-number`).
- A direction's name inside the product UI ("Direction B · Room to grow"); names belong in the comparison page (`direction-label-in-ui`).
- A slogan or marketing hero on a product page. A settings, admin or tool page keeps its noun title ("Members") and the project's own description; invent no taglines ("Your people. One place.").
- A promotional card inside a tool ("Grow your team · Good work starts with people").
- Every block in a bordered, rounded, shadowed card; cards inside cards.
- A palette chosen for mood rather than meaning: cream or beige paper with sage, lime, terracotta or forest green; purple-blue gradients; glass.
- Pill-shaped buttons and inputs everywhere.
- `system-ui`, Inter, Roboto or Arial as the only face (see Typography).
- Three directions that share one skeleton (same header, same hero, same stat, same card grid) and differ only in palette. A light and a dark version of the same layout are one direction.
- An outward arrow (↗) on a button that does not leave the page.

## Typography

- Use a distinctive display face only when it fits the product; body type must remain readable.
- Preserve existing or confirmed brand fonts, including any families listed below. In free exploration, avoid defaulting display text to Inter, Roboto, Arial, Open Sans, Lato, Montserrat, `system-ui`, or an unspecified system font.
- Suitable alternatives include Instrument Sans, Plus Jakarta Sans, Outfit, Onest, Figtree, Urbanist, Fraunces, Newsreader, and Lora.
- Use no more than two families, a deliberate type scale, balanced headings, and body line-height around 1.5–1.7.
- Use tabular numerals for comparable data.

## Buttons

- Button labels use the interface sans, weight 500–600, sentence case, even when headings use a serif.
- One solid primary per view or group; danger on the page is a red label, solid red only in the confirmation dialog.
- Hover and pressed are derived from the button's own colors (`color-mix`), not picked per variant; focus is one 2px `:focus-visible` outline; disabled is neutral.
- Radius comes from the shared control token (about 0.15–0.25 of the height, or a pill). Details: the Button section of `references/ux/component-specs.md`.

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

## Implementation details

Adapted from Vercel's [Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines) (MIT). The scanner flags disabled zoom, `transition: all` and blocked paste. Check the rest in code and in the rendered result:

- Use `<button>` for actions and `<a href>` for navigation. Do not put click handlers on `div` or `span`.
- Give inputs the right `type`, `inputmode`, `autocomplete` and `name`. A checkbox or radio and its label share one hit target.
- Keep submit enabled until the request starts, then show progress. Show errors inline and move focus to the first one.
- Animate `transform` and `opacity`, list the transitioned properties, and let input interrupt an animation.
- Text containers handle long content by truncating, clamping or wrapping. Flex children that truncate need `min-width: 0`.
- Give images explicit `width` and `height`, or an `aspect-ratio`, so they do not shift layout.
- Modals, drawers and sheets use `overscroll-behavior: contain`. Sticky headers must not cover the focused element (`scroll-padding-top`).
- Dark themes set `color-scheme: dark` so scrollbars and native controls follow.
- Destructive actions need a confirmation or an undo window.
- Format dates and numbers with `Intl.DateTimeFormat` and `Intl.NumberFormat`.
- Announce async status such as toasts and validation with `aria-live="polite"`.

## Behavioral evidence

Scanner success is only a static preflight. Keyboard-tab through actual controls and inspect the computed focus indicator; an unrelated `:focus-visible` selector proves nothing. Test the same output under `prefers-reduced-motion: reduce`: counters must show final values immediately, reveals must leave content visible, and JavaScript loops, timers, and smooth scrolling must honor the preference (including a change while running).

Run browser checks with, in order: the environment's own browser tooling; the project's installed Playwright or Puppeteer; or a locally installed Chrome or Chromium in headless mode (`--headless=new --screenshot` or `--dump-dom` with a small probe script). Do not borrow `node_modules` from the skill directory; user installs do not ship them. If none of these is available, report the rendered checks as unverified. Put probe scripts, screenshots and other check files in the project's `.variant-work/`, not in `/tmp` or the project's source folders.

Record the artifact, viewport, action, expected result, actual result, and any untested behavior. Do not describe fixture coverage as validation of every future generated page.

## Product integrity

For money, privacy, permissions, deletion, health, safety, or AI-derived conclusions, also run `references/workflow/product-integrity-gate.md`. Report it separately:

```text
Product Integrity: pass | conditional | block
P0: 0 · P1: 1 · P2: 2
Fix next: [short concrete action]
```

Do not present a P0 result as complete.
