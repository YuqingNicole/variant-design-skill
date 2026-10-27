# Comparison layout regression — 2026-10-27

The supplied Ledger comparison screenshot placed long direction explanations before the previews, leaving only the tops of the previews visible. The generator now places aligned previews immediately below each card heading and full-page link. Complete comparison statements and recommendation rationale remain available in native details disclosures. The recommendation badge does not change selection. Phone frames are centered.

## Observed evidence

- Rebuilt the exact existing Ledger Claude artifact identified by the screenshot's recommendation text. Updated its comparison and static comparison, retaining its existing static bundles and context. This is an existing real agent artifact, not a new successful agent run.
- Chrome at 1440 × 900: all three preview stages start at y=239.92, each 358.39px high. Screenshot inspected at `/tmp/variant-comparison-after.png`. Full-page links remain above the previews.
- New browser regression uses long Chinese comparison text and rationale: all previews remain aligned and visible within the first desktop viewport; keyboard expansion reveals complete text without moving the previews; phone frames use 390px and are centered; embedded interaction works; 390px outer viewport does not overflow; context remains byte-equivalent in meaning.
- All 10 Chrome loop tests, the production comparison browser test, 52 helper tests, 2 package tests, test typecheck and website production build passed.

## Fresh CLI attempts and limits

Started with `node evals/run.mjs --agent codex --fixture ledger --out /tmp/variant-comparison-layout-eval`. Codex failed to spawn: the local binary symlink points to a missing application binary.

Retried with `node evals/run.mjs --agent claude --fixture ledger --out /tmp/variant-comparison-layout-claude`. Claude returned a session-limit error without generating output; the grader subsequently failed with `q.errors is not iterable`. Neither attempt is a passing eval. No new full agent-workflow validation or measured user-performance improvement is claimed. The rendered evidence and regression tests cover the comparison layout only.

## Presentation refinement

Follow-up styling uses warm neutral surfaces, lighter dividers, restrained card shadows, compact status labels, a segmented viewport control and a muted green recommendation badge. Recommendation rationale and agent guidance move below the previews. No external fonts, assets or animation dependencies were introduced. The original variant contents are unchanged.

Rebuilt the same real Ledger artifact and inspected desktop and narrow screenshots. The regression also checks English dark mode, keyboard expansion of the recommendation rationale, and narrow-width overflow. The previous fresh CLI failures remain the limits on agent-workflow evidence; styling is not evidence of a user-performance gain.

After refinement, all 10 Chrome loop tests, the production comparison browser test, 52 helper tests, 2 package tests, typecheck and website build passed again. At 1440 × 900 the real Ledger preview starts at y=256.05 and is 355.19px high. Screenshots: `/tmp/variant-comparison-polished.png` and `/tmp/variant-comparison-mobile.png`.
