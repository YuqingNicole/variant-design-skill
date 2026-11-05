# Content page style budget · 2026-11-04

Branch: `codex/content-style-budget`, baseline `f528240` (content review PR #153). Scope: the rendered docs and sponsor pages; recheck the already-refined inspiration homepage. No skill runtime or copy changed.

## Observation and change

The dated TODO counts were a lead, not current measurements. Actual baseline Chrome samples found ten desktop sizes and nine text colors on docs; sponsor had seven desktop sizes and nine at 390px. Both new browser cases failed on the baseline. The first run attached in-memory reports to the list reporter without retaining raw files; the second saved raw JSON and twelve viewport PNGs before edits. Neither baseline failure is reported as a pass.

Docs now has a dedicated page class. Body/command fields use 16px, utility text and short commands 14px, section/closing headings share 30px (26px on phones), h3 remains 20px. Body, links, command fields, controls and focus use the existing palette; controls share the existing 6px radius. Sponsor lead, row titles and body share 16px, with weight distinguishing row titles. No text, source data, selection or interaction was removed to reduce counts.

| Page | Width | Sizes before → after | Text colors before → after | Radii before → after |
|---|---|---|---|---|
| docs | 320 | 8 → 6 | 9 → 4 | 2 → 1 |
| docs | 390 | 9 → 7 | 9 → 4 | 2 → 1 |
| docs | 1440 | 10 → 6 | 9 → 4 | 2 → 1 |
| sponsor | 320 | 8 → 6 | 5 → 5 | 1 → 1 |
| sponsor | 390 | 9 → 7 | 5 → 5 | 1 → 1 |
| sponsor | 1440 | 7 → 6 | 5 → 5 | 1 → 1 |

Counts match in Chinese and English. Docs retains three families because the probe counts its command textareas as text; the pre-existing website design spec allows heading/body/code families. The test explicitly uses that existing three-family allowance, keeping every other default limit. Sponsor retains two. The helper/probe was not changed. Aggregate raw-derived summary: `2026-11-04-content-style-counts.json`.

## Validation and limits

- `npm test --prefix website`: 67 passed.
- `npm run build --prefix website`: passed, 239 preview-mode routes.
- Focused real Chrome: 9 passed (48s), covering all twelve content-page budget samples, the six homepage language/width samples, clipboard failure, sponsor links, IPA font switching, bilingual no-JS routes, language navigation and phone touch/input rules. Existing assertions remain.
- Exported screenshot inspection: docs desktop before/after and sponsor English 390px after were viewed. All twelve before and twelve after viewport PNGs and reports remain outside Git at `/Users/nicole/orca/variant-backlog-evidence/content-style/`.
- The required homepage Impeccable 4.8.0 URL scan was attempted against the local server. It exited 1 with a 30-second navigation timeout. Its stdout was `[]`; that empty array is **not** a successful zero-finding scan. Detector acceptance remains unverified. Logs: `/tmp/variant-style-detector.{json,err}`.
- Exact PR CI and maintainer visual acceptance: pending. No production merge/deploy.

Samples describe hydrated local pages. Chinese no-JS docs retain their separate existing `docsBody` layout; successful no-JS content checks do not establish identical styling or budgets. Counts are restraint evidence, not an aesthetic score or WCAG certification. External X media are isolated by the existing landing regression fixture; no third-party artwork is committed. The untouched original navigation worktree is separate from this branch.
