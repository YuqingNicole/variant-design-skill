# Backlog execution · 2026-11-04

## Objective and boundaries

Complete, in order, the backlog summarized in the maintainer's conversation: website repositioning, browsing interaction and visual refinement, submissions and permissions, design-system checks, skill quality, content, distribution, positioning and maintenance, and the nine open delivery/commercial/hosted-AI issues. Preserve the full scope until evidence establishes completion; an implementation or a local pass alone is not a production launch or a user acceptance result.

Work in `/Users/nicole/orca/variant-backlog-work` on task branches. The original `codex/navigation-home` worktree contains uncommitted navigation changes belonging to another session and is untouched. Runtime promises in AGENTS.md remain required. No release/version bump, production deployment, real payment, model budget, domain purchase, or third-party message is implied by local implementation. Human review and account-dependent actions remain explicit gates.

## Execution index

| Area | Current state | Acceptance / remaining evidence |
|---|---|---|
| Website positioning, PR #138 | Local checks passed; merge conflicts resolved | Update PR, check CI and preview; production merge remains separate |
| Unified inspiration feed / interaction / appearance | Not started | Repositioning RFC P2: one chronological feed; URL filters; hover/focus/touch credits; visible-only videos; reduced motion; shared-element detail; keyboard/back/scroll; 320/390/1440 in both languages; style budget |
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

Push the resolved P1 branch to the existing PR; start P2 from that reviewed integration base. Keep later requirements in this index until independently verified.
