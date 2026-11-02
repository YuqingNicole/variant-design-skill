# Translating vague adjectives

Read this when a brief or an edit request rests on a quality adjective instead of a concrete change: "premium", "高级", "more polished", "cleaner", "简洁", "更有质感", "techy", "younger". These words name an impression, not a style. Translate the word into properties you can check before generating, write them into the task contract, and verify them afterwards.

## Premium is restraint, not a palette

"Premium" or "高级" does not mean a dark background, gold accents or a serif. That reading produces the cheapest-looking version of the request. Most of what people perceive as premium comes from:

| Property | What it means | How to check |
|---|---|---|
| Restraint | Few type sizes, one accent, few radii and shadows, generous space | `style-budget.mjs` counts against a budget |
| Precision | Spacing and sizes come from tokens; edges align | Computed values sit on the token scale; nothing is off by 1–3px |
| Type craft | Clear steps between sizes, 60–75 characters per line, tabular numerals for data, care with mixed CJK and Latin | Size ratios, measured line length |
| Material | Real screenshots or photography with one consistent treatment; no emoji icons or stock illustration | Inspect the image sources |
| Confident copy | Specific, short, no hype, fewer claims | The cliché list in `references/workflow/quality-baseline.md` |
| Quiet motion | Few animations, used to show state | Count animated elements; reduced motion honored |

Start from the budget below unless the project's own system is stricter:

```text
families ≤ 2 (code samples excluded) · sizes ≤ 7 · weights ≤ 3 · text colors ≤ 5 · radii ≤ 3 (pill counts once) · shadows ≤ 2
```

## Three readings for A/B/C

When exploring without a locked design system, give each direction a different reading of the same adjective instead of three styles:

- **Quiet** — maximum space, one image or one statement per screen, sparse type, one accent.
- **Editorial** — a display serif with a strong type scale, magazine rhythm, rules and captions instead of cards.
- **Precise** — dense but strictly aligned, small type set carefully, fine dividers, data shown with tabular numerals.

Use dark surfaces with metallic accents only when the brand or the product category asks for them, and then as one direction, never the default. Under a design-system lock, colors and fonts stay; premium then means fewer sizes, fewer surfaces, stricter alignment and better copy.

## Other adjectives

| Word | Translate into |
|---|---|
| Cleaner, 简洁 | Fewer elements per screen, fewer containers, one primary action; the same budget as premium |
| Techy, 科技感 | Precision and real product data; monospace for data only; not neon gradients |
| Younger, 年轻 | Larger type contrast, warmer color, shorter copy; not emoji or stickers |
| Warmer, 温暖 | Tinted neutrals, softer radii, human photography, first-person copy |
| Bolder | Use `Vary strong` in `skills/variant-generate/actions.md` |

If the word still has two plausible readings after looking at the project, generate both as directions instead of asking.

## Verify

Measure the rendered page before and after the change, in the same viewport:

```bash
node <skill-root>/scripts/style-budget.mjs probe     # prints an expression to evaluate in the page
node <skill-root>/scripts/style-budget.mjs check .variant-work/style-after.json --before .variant-work/style-before.json
```

With Playwright, `measure(page)` from the same script returns the sample directly. Save samples in `.variant-work/`. Report the counts that changed. Lower counts are evidence of restraint, not proof of taste: still review the rendered page with `references/workflow/quality-baseline.md`.
