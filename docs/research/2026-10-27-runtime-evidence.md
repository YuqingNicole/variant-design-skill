# Runtime verification follow-up — 2026-10-27

Issue #18; implementation commit `1bfab6b`. The reusable browser runner consumes a caller-owned Playwright Page and explicit task expectations. It does not install tools or infer complete product coverage.

## Automated regression

Executed locally (Node 26.3.0, Chrome via the installed Playwright):

- `node --test scripts/*.test.mjs`: 49 passed.
- `python3 scripts/plugin-package.test.py`: 2 passed.
- `cd tests && PLAYWRIGHT_CHANNEL=chrome npx playwright test`: 8 passed.
- `cd tests && npm run typecheck`: passed.
- `npm test --prefix website`: 27 passed.
- `npm run build --prefix website`: passed.

The new browser case records a passing font, Tab-reached box-shadow focus indicator, stopped JavaScript animation under initial and changed reduced-motion preferences, and a non-target counter interaction. It then changes each behavior, observes four failed checks, verifies the earlier report becomes stale, and confirms missing browser tools leave checks unverified. The unit comparison case distinguishes identical prior project-check diagnostics from changed failures without converting either into a pass.

## Real CLI run and actual generated page

Started with `node evals/run.mjs --agent codex --fixture bakery`. The runner installed the working-tree skill in the throwaway project's `.agents/skills/variant-design`. Codex completed in 326 seconds; all six grader checks passed, recommendation B, no selection, baseline project untouched. It read 6,323 words across five skill files. Reported usage was 664,558 tokens including cached input; this is not a dollar estimate.

Local run: `/var/folders/rp/358rrpnn0h59r_3vd4fxhyn80000gn/T/variant-evals-2026-10-27T09-19-08-107Z/`.

After generation, a separate manual adapter in the fixture's `.variant-work/runtime-check.mjs` exercised the real generated output with Chrome. All three HTML directions opened and populated their three menu entries. On B it checked:

- `h1` computed font `"Songti SC", serif` and body text color `rgb(43, 33, 24)` against the existing brand stylesheet.
- The form submit button reached through Tab with a changed visible outline.
- Stable menu content and no observed RAF callbacks under reduced motion, initially and after switching preferences while exercising the button hover. This output has no deliberate running animation; the regression fixture separately tests an active JS loop.
- Invalid-phone form feedback and the unchanged shop address before and after a hero-only edit through the real history helper.
- No project build/typecheck is applicable: this fixture has no package manifest or build system. That check is explicitly not-applicable, not a fabricated command result.

Before report `a762b3ea-9951-48a4-97b4-bee1e72d7a27` and after report `37c28205-e5b5-48a6-ad64-2ea8c2e67385` both passed within this declared scope; source editing invalidated the before report. The comparison had no failures; negative classification is covered by the unit case. No page errors were observed. The later undo invalidates the after report too, as intended. Reports, adapter and screenshot stay local; no generated project source is committed here.

## Limits and remaining acceptance

This is one generated plain HTML project, one desktop viewport and one browser. It does not demonstrate complete task coverage, visual contrast/occlusion, timer/canvas/video animation coverage, arbitrary framework adapters or automatic derivation of correct expectations. Focus alternatives still require visual review; a static outline finding is not silently removed by runtime evidence. Keep #18 open for automatic project-specific plans and wider delivery coverage. No general user-experience improvement or WCAG compliance is claimed.
