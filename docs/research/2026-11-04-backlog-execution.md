# Backlog execution · 2026-11-04

## Objective and boundaries

Complete, in order, the backlog summarized in the maintainer's conversation: website repositioning, browsing interaction and visual refinement, submissions and permissions, design-system checks, skill quality, content, distribution, positioning and maintenance, and the nine open delivery/commercial/hosted-AI issues. Preserve the full scope until evidence establishes completion; an implementation or a local pass alone is not a production launch or a user acceptance result.

Work in `/Users/nicole/orca/variant-backlog-work` on task branches. The original `codex/navigation-home` worktree contains uncommitted navigation changes belonging to another session and is untouched. Runtime promises in AGENTS.md remain required. No release/version bump, production deployment, real payment, model budget, domain purchase, or third-party message is implied by local implementation. Human review and account-dependent actions remain explicit gates.

## Execution index

| Area | Current state | Acceptance / remaining evidence |
|---|---|---|
| Website positioning, PR #138 | Updated at `f1d6001`; local and GitHub loop/landing checks passed | Review findings fixed; final review, deployed preview and production merge remain separate |
| Unified inspiration feed / interaction / appearance | Implemented, 44 local Chrome checks passed; screenshot review pending | RFC-008 P2: one chronological feed; URL filters; hover/focus/touch credits; visible-only videos; reduced motion; shared-element detail; keyboard/back/scroll; 320/390/1440 in both languages; style budget |
| Submission and permission intake | Not started | RFC P3: media URL/file workflow, attribution, distinct usage rights, withdrawal, manual review and evaluated storage |
| Design system checks | Partially implemented before this task | RFC-007 P1 remaining checks and grouping decision; unit tests and real chain evidence |
| Premium / adjective evals | Not started | Real Agent fixture and style-budget comparison; preserve task and brand |
| Region selection / public code checker | Needs product decision | Concrete proposal and bounded implementation after scope decision |
| English guides and comparison page | Needs review | Five English guides reviewed, comparison facts rechecked and destination chosen |
| Other skill entries | Not started | Actual permitted runs, public evidence, entry content and review |
| Design sample collection | Ongoing backlog | Watch and annotate new unique authors; preserve source and media evidence |
| Domain / indexing / directories / GEO | Account-dependent; preparatory work available | Domain binding, redirects, Search Console indexing evidence, permitted submissions, initial ten-query measurement |
| Positioning / pricing / attribution | Not started | README and GitHub metadata clarity; pricing matches live availability; attribution decision; consistent copy |
| Website style maintenance | Not started | Measured docs/sponsor/home counts, rendered review |
| Artifact evidence, #18 | Partially implemented before this task | Automatic plans and complete real-delivery coverage; classify existing failures |
| Project integration, #19 | Partially implemented before this task | Real Vite aliases/provider/global styles matrix; preview cleanup ownership; complete delivery receipt |
| Paid definition / rights / distribution / support, #22–26 | Product and user gates pending | Updated commercial baseline, actual installation/upgrade/rollback/entitlement evidence, two independent human trial users |
| Hosted AI and cost protection, #39–40 | Needs explicit budget/account decision | Confirm exposure policy and cap; real configured production generation and enforced cost protection if approved |
| Legacy README PR #2 | Needs review against current direction | Review current diff; integrate useful changes or record why superseded |

## Evidence ledger

### P1 integration attempt (local)

Input: PR #138 head `0459f3a`, merged with master `9606048`. GitHub reported the PR conflicting. Resolved only the RFC index, removed-home tests versus retained-home tests, and obsolete `/inspiration` prerender route. Both distinct RFC proposals are retained. Reference count reflects all 95 current records.

| Check | Result |
|---|---|
| `npm test --prefix website` | Passed (61 tests) |
| `npm run build --prefix website` | Passed, 239 prerendered routes |
| `node --test scripts/*.test.mjs` | 70 passed |
| `python3 scripts/plugin-package.test.py` | 4 passed |
| `node --test evals/grade.test.mjs` | 9 passed; no real Agent run claimed |
| `PLAYWRIGHT_CHANNEL=chrome npx playwright test -c landing.config.mjs` in tests | 39 passed |
| `PLAYWRIGHT_CHANNEL=chrome npx playwright test` in tests | 11 passed |
| `npm run typecheck --prefix tests` | Passed after loop fixtures generated; initial fresh-worktree invocation had no inputs |
| `node scripts/quality-gate.mjs --self-test` | Passed |
| `node scripts/quality-gate.mjs examples/coffee-brand-interactive.html --strict` | 0 errors, 0 warnings, 10 review findings (not claimed absent) |

Ego-browser space 42 inspected the actual local site. Baseline screenshots and raw style-budget probe samples: `/Users/nicole/orca/variant-backlog-evidence/before.json` and `before-{zh,en}-{320,390,1440}.png`. At 390px: 8 sizes and 5 radii; at 1440px: 9 sizes and 5 radii, both languages. These exceed P2's 7/3 budgets and are the starting measurement, not a pass. Local Vercel-image optimization is unavailable; live source preview/fallback rendering is not a production CDN verification.

## Next action

Publish the verified P2 branch for review, then implement P3 submission and permission intake. Keep P1/P2 preview, reviewer and production gates explicit; later requirements remain in scope.


### P1 follow-up review

Verified the three 2026-11-04 CodeRabbit findings against current code: Chinese `/cases` prerender/client titles differed; active Motion depended on a stale address after a category change; direct reference detail lacked a current navigation link. The header now receives the current inspiration category, detail routes belong to the inspiration section, and the Chinese case title matches its prerendered title. The existing positioning browser regression now exercises category highlighter changes, direct-detail navigation and the `/cases` title, and checks the static font explanation and IPA switch.

Validation: website 61 tests passed; production build passed; the focused `home leads` Chrome regression passed (1 test, port 4199 through an ignored local config). No production merge or deployment performed.


### P2 browsing implementation (local)

Implementation commit `04aa377`; the subsequent merge of P1 follow-up `f1d6001` changed only this evidence document relative to the tested implementation. The positioning RFC was renumbered 008 because RFC-006 already describes the product architecture.

Implemented: one paginated feed for all 95 records; timestamps recovered from each record's first Git source commit; URL category/topic/query/sort preservation; a retained editorial sort; image-first cards with focus/hover/touch credits and author avatars; keyboard-accessible modal and standalone details; unique shared-element names; back/forward navigation and focus/scroll recovery; lazy visible-only video playback with runtime reduced-motion and background-tab pause. The X draft generator now records an explicit collection timestamp for future entries.

Failures found and addressed during verification:

- Rapid independent filters could lose a choice through the shared animation helper's latest-update queue. Filters now apply immediately; detail changes retain shared-element transitions. The rapid-filter regression verifies every query parameter after reload.
- A manual paging test could chase a button removed by automatic paging. The test now scrolls the real list boundary and checks that the actual card count grows; no production paging contract was weakened.
- A fresh-worktree test invocation from repository root failed an older cwd-relative evidence check; final runs use the documented `tests/` directory. A concurrent multi-page language regression hit its 30-second test limit; it passed on the final documented run without increasing the timeout.
- Mobile screenshots showed search squeezed between two selects. Search now occupies a full row, and touch credits keep known author avatars visible.

| Check | Latest result |
|---|---|
| `npm test --prefix website` | 61 passed, including collection timestamp validation and draft generation |
| `npm run build --prefix website` | Passed; 239 prerendered routes |
| `cd tests && PLAYWRIGHT_CHANNEL=chrome npx playwright test -c landing.config.mjs` | 44 passed in 1.7 minutes; five new browsing regressions plus all 39 existing regressions |
| `git diff --check` | Passed |
| Actual local Ego browser, both languages × 320/390/1440 | Six before/after screenshots and probe samples; all after samples meet the budget |

The browser regressions use a self-generated 2-second, 64×40 solid-color WebM for real playback/pause assertions and isolate external X requests. They do not prove availability of X's servers or any official embed service. Actual local screenshots use live external sources, with reduced motion and settled metadata opacity for the final comparison. All screenshots and raw probes remain outside Git at `/Users/nicole/orca/variant-backlog-evidence/`; they are not rehosted third-party media. Committed count summary: `docs/research/2026-11-04-inspiration-budget.json`.

| Width | Sizes before → after | Text colors before → after | Radii before → after |
|---|---|---|---|
| 320 | 7 → 5 | 5 → 4 | 5 → 2 |
| 390 | 8 → 5 | 5 → 4 | 5 → 2 |
| 1440 | 9 → 7 | 5 → 4 | 5 → 2 |

The counts match in Chinese and English. Actual screenshots were inspected; the 1440 desktop grid exposes two complete rows. Local passes do not establish production CDN behavior, cross-browser coverage or final maintainer visual acceptance. No skill UX or WCAG certification is claimed, and no real Agent eval was needed or run for this website-only behavior change.

Remaining gates: publish PR, verify its exact CI/preview, maintainer screenshot review and separately authorized production merge; continue with P3, then design-system checks and all later rows above. The overall backlog objective remains active.
