# Premium refinement evaluation · 2026-11-04

## Acceptance before implementation

Backlog item: a real Agent refines an existing page after a vague request such as “make it more premium”; rendered `style-budget.mjs` counts fall without a dark/gold reinterpretation or loss of brand/task. This is a new fixture and host-side evidence path, not a taste score. Worktree: `/Users/nicole/orca/variant-premium-eval-work`, branch `codex/premium-evaluation`, based on `eacfee0`. The separate corrected design-system CLI runs remain live and incomplete; this work does not replace their gates.

The fixture is a self-authored, light-brand book catalogue with six fictional books. It starts with deliberately inconsistent sizes, text colors, radii and shadows. A/B/C are existing fixture artifacts, not claimed Agent generations. Only B may be refined; A/C, selection, shared catalogue behavior and brand file remain unchanged. Arial body, Georgia headings and a blue primary action are explicit existing brand requirements. Search, category filtering, save/un-save and the live saved count must work before and after at 1440 and 390 widths.

Host-side Playwright measures real computed styles and saves raw before/after samples and screenshots outside Git. The same source `probe` and default budgets are used in both phases. Each viewport must meet the final budget, reduce the combined sizes/text-colors/radii inventory, preserve readable heading/body hierarchy and avoid horizontal overflow. Brand checks inspect computed families, page backdrop and primary action color as well as the unchanged brand file; they do not use adjective or color-name keyword matching. Functional checks exercise actual controls and all six book records, so hiding data cannot masquerade as restraint.

The runner captures an initial snapshot before a refinement-only turn, records host evidence independently from files the Agent may produce, and grades one prepared apply/undo history step without selecting a winner. Mocks/unit samples may validate the grader, but only the real CLI and actual rendered observations prove this attempt. Missing Chrome, failed measurement or missing data stays unverified/failed, never an empty successful budget.

## Boundaries and gates

No production change, genuine third-party content, external message, real purchase or additional model provider is required. Real runs use the existing eval runner and installed-copy origin check. Run Codex first when the deterministic/browser fixture gates pass; Claude remains pending until its account-level 403 is resolved. Review screenshots and record aesthetic limits separately from counts. The DTCG/grouping, browser-space and production questions remain separate pending decisions.

Primary local references: `references/workflow/adjective-translation.md`, `skills/variant-generate/actions.md` (Refine premium), `scripts/style-budget.mjs`, `evals/run.mjs`, `evals/grade.mjs`, and the existing Playwright capture pattern in `evals/blind/pack.mjs`. The intended behavior already exists in the skill; the change adds the missing real evaluation and evidence, rather than prescribing a dark/metallic style.

Status: contract/fixture preparation; no premium Agent result or visual improvement claimed.

## Deterministic/browser checkpoint

Actual baseline in Chrome at both 1440 and 390: **2 families, 11 sizes, 6 weights, 12 text colors, 9 radii, 3 shadows**; all six records and all controls worked; no overflow. Raw samples/screenshots: `/Users/nicole/orca/variant-backlog-evidence/premium-fixture-baseline`. The first direct capture used the unavailable Playwright Chromium default and failed explicitly; the documented `PLAYWRIGHT_CHANNEL=chrome` invocation succeeded. No missing-browser fallback was counted as a pass.

Host evidence regression passed: a manually authored test refinement meets the budgets, keeps the data/brand and restores B with one actual helper undo in an isolated copy; dark/gold and hidden-book variants fail. The initial regression used the outer repository's Git state because the fixture lacked its own baseline; it was corrected to initialize its own disposable fixture repository and keep candidates under `.variant-work/`. Existing browser evidence is preserved and requires a fresh empty output directory.

Full helper/grader run: **103 passed**. Full Chrome loop including the new evidence regression: **13 passed**. Loop typecheck passed. Prepare-only copied the complete fixture and installed the skill successfully at `/Users/nicole/orca/variant-backlog-evidence/premium-prepare/premium-codex`. These checkpoints precede the final process/route-read gates and do not establish a real premium Agent result.

Final host gates also reject reuse of an existing evidence directory, require the real Agent process to finish without a timeout/error, and require a premium transcript to read both the adjective translation and action references. The updated grader regressions passed (13 cases); the updated real browser evidence case passed. These still validate the harness, not a model's refinement quality. The next run must use a fresh output directory and record the exact installed implementation.
