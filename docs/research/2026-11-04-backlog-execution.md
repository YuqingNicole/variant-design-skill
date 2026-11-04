# Backlog execution · 2026-11-04

## Objective and boundaries

Complete, in order, the backlog summarized in the maintainer's conversation: website repositioning, browsing interaction and visual refinement, submissions and permissions, design-system checks, skill quality, content, distribution, positioning and maintenance, and the nine open delivery/commercial/hosted-AI issues. Preserve the full scope until evidence establishes completion; an implementation or a local pass alone is not a production launch or a user acceptance result.

Work in `/Users/nicole/orca/variant-backlog-work` on task branches. The original `codex/navigation-home` worktree contains uncommitted navigation changes belonging to another session and is untouched. Runtime promises in AGENTS.md remain required. No release/version bump, production deployment, real payment, model budget, domain purchase, or third-party message is implied by local implementation. Human review and account-dependent actions remain explicit gates.

## Execution index

| Area | Current state | Acceptance / remaining evidence |
|---|---|---|
| Website positioning, PR #138 | Updated at `f1d6001`; local and GitHub loop/landing checks passed | Review findings fixed; final review, deployed preview and production merge remain separate |
| Unified inspiration feed / interaction / appearance | PR #148, local and remote checks passed; preview sampled; screenshot review pending | RFC-008 P2: one chronological feed; URL filters; hover/focus/touch credits; visible-only videos; reduced motion; shared-element detail; keyboard/back/scroll; 320/390/1440 in both languages; style budget |
| Submission and permission intake | PR #149 updated at a3929bb; exact loop/landing CI passed; APPROVED | Preview/maintainer acceptance and production permission remain separate; genuine registry stays empty |
| Design system checks | Draft PR #150; exact CI passed; corrective Codex Harbor 34/34 and Ledger 18/18 passed; Claude account 403 | RFC-009 adoption fix, full chain rerun, Claude/account and screenshot gates; grouping default still pending |
| Premium / adjective evals | PR #151; real Codex 18/18 passed, exact implementation CI passed | Maintainer screenshot review and merge; one controlled case is not universal taste evidence |
| Region selection / public code checker | Draft PR #152, RFC-010; two product decisions pending | Concrete scopes prepared; neither feature accepted or implemented |
| English guides and comparison page | Draft PR #153; agent audit and local checks complete | Three revised English guides remain draft; five-guide human review, comparison terms and destination remain pending |
| Other skill entries | Not started | Actual permitted runs, public evidence, entry content and review |
| Design sample collection | Ongoing backlog | Watch and annotate new unique authors; preserve source and media evidence |
| Domain / indexing / directories / GEO | Account-dependent; preparatory work available | Domain binding, redirects, Search Console indexing evidence, permitted submissions, initial ten-query measurement |
| Positioning / pricing / attribution | Draft PR #155 at 47b8b77; exact loop/landing CI passed; public metadata untouched | Maintainer pricing direction, metadata permission and attribution choice; production gate |
| Website style maintenance | Draft PR #154; exact loop/landing CI passed; docs/sponsor/home budget checked | 9 local Chrome cases passed; detector timeout and maintainer visual acceptance remain |
| Artifact evidence, #18 | Registered extension/binding freshness fix implemented locally; 107 helper/grader + 14 Chrome passed | Installed CLI follow-up, automatic plans and complete real-delivery coverage; prior failure classification remains |
| Project integration, #19 | Partially implemented before this task | Real Vite aliases/provider/global styles matrix; preview cleanup ownership; complete delivery receipt |
| Paid definition / rights / distribution / support, #22–26 | Product and user gates pending | Updated commercial baseline, actual installation/upgrade/rollback/entitlement evidence, two independent human trial users |
| Hosted AI and cost protection, #39–40 | Needs explicit budget/account decision | Confirm exposure policy and cap; real configured production generation and enforced cost protection if approved |
| Legacy README PR #2 | Actual diff reviewed at 7d6e70e; useful source-format notes in the positioning draft | Review/merge of replacement, then maintainer closure decision; no author message sent |

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

Content PR #153 and premium readiness follow-up have exact-head loop/landing CI passed. Style PR #154 has exact-head CI passed. Finish the concrete positioning/availability draft and maintainer choices, then continue independent distribution/core preparation. P1–P3 production permission, P4 grouping/Claude/visual gates, premium visual review, content human review and RFC-010 feature choices remain pending. Preserve those gates and all later requirements.


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


### P2 published checkpoint

PR [#148](https://github.com/YuqingNicole/variant-design-skill/pull/148), exact head `a1d0ee0d0b94f495a80a182b293af7989e2aa9e5`: both push/PR `loop` and `landing` jobs passed; Vercel preview deployed successfully; CodeRabbit skipped this run (not an approval). Runs: `41791805557` and `41791861973`.

Ego-browser inspected [the deployed preview](https://variant-design-skill-git-codex-ce9c51-nicolechen-9191s-projects.vercel.app), then selected Landing. Twelve visible reference images rendered with nonzero natural dimensions through `/_vercel/image` (Attio, Ramp, Cal.com, Rive, tldraw, Pitch, Resend, Impeccable, Linear, Notion, Raycast, Cursor). Actual screenshot and per-image results: `/Users/nicole/orca/variant-backlog-evidence/preview-landing.png` and `preview-images.json`. This is a sampled preview check, not an all-route or production acceptance claim.

The task continues on `codex/submission-permissions` in the same isolated worktree, based on the verified P2 head. Next inspect `website/src/SubmitPage.tsx`, `.github/ISSUE_TEMPLATE/submission.md`, the permission schema in `website/scripts/content.mjs`, and RFC-008 §4. Existing submissions collect only work/permission text; they have no media intake fields. Evaluate repository storage, Blob and author-hosted URLs before implementing intake, review and withdrawal. No third-party submission has been sent. The original worktree is still untouched. For later browser work, reuse Ego space 42; the local preview server is live on port 4198 (exec session 50547).


### P3 submission intake (local)

Worktree/branch: `/Users/nicole/orca/variant-backlog-work`, `codex/submission-permissions`, based on P2 `a1d0ee0`. This is implementation of RFC-008 §4. Storage comparison and acceptance baseline: `docs/research/2026-11-04-submission-intake.md`; maintainer workflow: `website/SUBMISSIONS.md`.

Implemented:

- A bilingual local-only author form collects image/video URLs, a video poster, alt text, author credit, grantor/authority, date, display scope and withdrawal method. Authors may upload local media in GitHub’s own editor and use its URL. The page prepares readable submission text and a downloadable JSON file; it never posts an issue or persists the draft. Copy/download failures retain readable content.
- The same validated authorized-reference registry feeds browser and prerender. Local review prepares a candidate; admission requires an evidence URL, review identity/date, media details, credit and translation status. Records cannot collide with link-only or withdrawn IDs. The genuine registry remains `[]`; no test permissions were published.
- Authorized cards/details and reference briefs distinguish permission from link-only use and state the display-only scope. Images/video use author-provided URLs; video follows visibility, background and runtime reduced-motion behavior. Complete and draft English follow the existing production translation gate.
- Removal replaces the current registry record with only ID, name, date and reason; current media URLs disappear from shipped records. The old address renders an unindexed no-media notice; feed and sitemap omit it. Private saved notes stay local, are labeled unavailable and are excluded from new briefs.
- Registry writes preserve verified backups and use a cooperative lock, drift checks and a verified temporary file. Symlinks, duplicate IDs and stale writes are refused. Backups stay under ignored `.variant-work/`. Crash recovery and external media availability are not claimed as globally transactional guarantees.

| Check | Result |
|---|---|
| `npm test --prefix website` | 67 passed, including six admission/withdrawal/SSR cases |
| `npm run build --prefix website` | Passed, 239 prerendered routes with the empty genuine registry |
| `cd tests && PLAYWRIGHT_CHANNEL=chrome npx playwright test -c landing.config.mjs` | 48 passed (2.7 minutes): all earlier 44 regressions plus four intake/authorized-media/removal scenarios |
| `node website/scripts/submissions.mjs check` | 95 published link references, 0 withdrawn; no genuine authorized submission claimed |
| `git diff --check` | Passed |
| Actual local Ego browser | Both languages at 320/390/1440: no horizontal overflow; observed inputs ≥44px tall and ≥16px text; synthetic unsent readable draft prepared successfully |

The additional SSR test compiles the actual SSR entry in an isolated copy, checks authorized media and labels in server-rendered HTML, removes draft English, and verifies that a unique revoked media URL is absent from the built artifact. Browser media tests use the self-generated 64×40 image and two-second video on reserved example hosts. They do not prove anyone’s legal authority or a real third-party submission. The test Vite server’s initial font allow-list error and a copied SSR fixture’s missing CHANGELOG dependency were corrected; the final test run has no such errors. Manual inspection replaced an early raw-JSON review display with readable sections; the final readable text remains copyable and the machine JSON remains downloadable.

Screenshots and measurements: `/Users/nicole/orca/variant-backlog-evidence/submissions/{zh,en}-{320,390,1440}.png`, `layout.json`, `draft-review.png` and `local-draft.md`. The synthetic draft explicitly says not to submit; no GitHub submission, upload or third-party message was sent. The original working tree’s nine modified files and untracked ReferenceCard are preserved.

Remaining gates for this phase: exact PR CI, deployed form preview, maintainer review and production merge approval. A real author submission requires the author and a human permission review; the empty registry is intentional, not evidence of real uptake. The full backlog objective remains active; RFC-007 checks are next.

Before publication, the registry validator was tightened to reject extra nested review/translation/media fields and an unused image-poster field, so editorial-only metadata cannot accidentally enter the public record. Regression tests cover the refusal; all 67 website tests and the build passed again. This adds no genuine submission or production write.


### P3 published checkpoint and P4 baseline

PR #149 head `c4d375a`: both push/PR loop and landing CI jobs passed; the actual deployed `/submit` preview was inspected at 390px with no overflow. CodeRabbit completed and requested changes: shared-write boundary documentation, submission spacing tokens, the collapsed media disclosure and rapid arrow navigation. These findings are being verified and addressed on the P3 branch; a green CI alone is not reviewer approval. No production merge occurred.

RFC-007 P1 work is on `codex/design-system-validation`; negative baseline, contracts and current gates are recorded in `2026-11-04-design-system-validation.md`. The grouping-default question remains open; the existing default is preserved while an explicit layer format is available for review. Next: final deterministic gates, actual harbor-chain/ledger-pick runs, fix valid P3 review findings and retain the full backlog scope.


### P4 real CLI result and next corrective loop

Draft PR [#150](https://github.com/YuqingNicole/variant-design-skill/pull/150), head `99ce595`: both loop and landing CI jobs and Vercel preview checks passed. P3 review fix head `508d884` also has both loop/landing CI jobs passed; its four inline threads are resolved, but reviewDecision still says CHANGES_REQUESTED. No review was dismissed and no production merge occurred.

Real runner session 54084 completed. `ledger-pick` Codex passed every check (454s, 18,179 words read across two fresh processes). Harbor Codex measured nine declared contrast pairs with zero failing/unverified pairs and zero layer errors, but the overall chain failed four delivery checks after confirmation: old variant font metadata differs from the new confirmed system. Ordinary apply cannot update locked token metadata, and undo restores the old metadata. This is an actual product workflow contradiction, not a reason to remove the grader. Corrective contract and acceptance matrix: RFC-009. The overall design-system phase stays incomplete.

Both Claude fixtures failed with the same account-level verification 403 and no generated artifact. These cannot count as quality results. No account settings or providers were changed. The original Ego space 42 is no longer present; resuming it failed and inventory confirmed its absence. A question to authorize a replacement space is pending under the browser skill's recovery rule; unrelated user spaces were not claimed. Automated tests continue independently.

Next action: implement and test explicit system confirmation/adoption with shared snapshots and undo as RFC-009 specifies, then rerun the real chain. Keep the DTCG default decision, visual review, Claude verification and production approval separate from deterministic test passes; all later backlog rows remain open.

### RFC-009 corrective checkpoint

Confirmation/adoption/undo is now implemented in the existing history helper and documented across the skill. Helper/grader tests: 102 passed; real Chrome loop: 12 passed; package: 4 passed; website: 67 passed plus 239-route build; MCP: 2 passed. These are local checks. Corrective real Codex harbor/ledger reruns are next; the old real-chain failure is retained. P3's isolated submission-fixture follow-up is `a3929bb` and has four focused Chrome passes; exact-head CI remains a separate check.


### P4 corrective real-run checkpoint

Corrected installed head `eacfee0`: Codex harbor six-turn 34/34 checks and ledger two-turn 18/18 passed; source/install identity and actual helper calls were inspected. Seven actual system contrast pairs had no failing/unverified result or layer errors. Existing pending-page/brand warnings remain explicit. Summary: `2026-11-04-system-adoption-runs.json`. Exact loop/landing CI passed. Claude authentication and screenshot/maintainer review still prevent calling RFC-007 fully accepted; no production merge or default-grouping decision was assumed.

Premium evaluation preparation proceeds separately in `/Users/nicole/orca/variant-premium-eval-work` (`codex/premium-evaluation`, based on `eacfee0`). Its self-authored baseline is measured at 1440/390: two families, eleven sizes, six weights, twelve text colors, nine radii, three shadows; all search/filter/save controls work and there is no overflow. New host evidence/fixture regression is under development. This does not count as a real premium Agent result yet.


### Premium real-run checkpoint

Installed head `0e03d16`: actual Codex premium refinement passed 18/18 checks (156s). Both 1440/390 samples changed sizes 11→4, weights 6→2, text colors 12→3, radii 9→1, shadows 3→0, preserving two families, the light/blue brand, all catalogue behavior, A/C, final selection and one real undo. Actual generated source and exported screenshots were inspected; no fake after-sample or API override was used. Exact implementation-head loop/landing CI passed. Research and aggregate JSON are committed under `2026-11-04-premium-*`. User/maintainer visual acceptance and merge remain separate; no global taste claim.

The next safe scope is the two unresolved feature decisions (visual region selection and a public code-check page). A separate `codex/product-feature-decisions` worktree is preparing a concrete proposal; no feature choice or production action is assumed. All later content/distribution/core/commercial rows remain open.


### Feature decision proposal

RFC-010 makes the region-picker and public-checker choices concrete: read-only selection of declared editable zones (HTML/Vite first, no auto selection/write), and a local-only `/checks` page using a shared Node-free scanner core. Existing comparison/scanner call paths and primary messaging/origin standards were inspected. Neither feature is implemented or chosen yet; the two decisions can be accepted independently. The full backlog remains active.

### Content audit checkpoint

All five guides received an agent fact/language audit. Git restore/stash/revert scope, legacy snapshot baseline and per-record media permission claims were corrected. Three revised English guides are draft; two unchanged legacy guides retain their old status without an invented approval. Actual production-mode SSR and Chrome expose the previously missing client gate and verify its fix. Website tests: 67 passed; preview build: 239 routes; production build: 236 routes; focused Chrome: 7 passed; actual production artifact route/index/hreflang/sitemap/llms assertions passed. Evidence: `2026-11-04-content-review.md`. Comparison primary documents and source license files were rechecked; its publication location, terms and English remain human gates. No production publication occurred.

Remote status audit found a current-head PR #151 push run with one existing inspiration scroll regression failing on a detached prerendered element, while the PR run at the same head passed. This remains a real failed check on that head. A semantic client-readiness wait was added in `c61f3dc`, passed ten independent Chrome repetitions and is included here; exact new-head CI remains a separate gate. It is unrelated to premium model scoring and is not hidden by the successful duplicate run.


### Website/content/positioning checkpoints

Content PR #153 head `f528240`, premium follow-up `c61f3dc` and style PR #154 head `1df0ab4` have both push/PR loop and landing jobs passed. Draft/skipped review is not approval. The homepage detector attempt timed out and its empty JSON does not count as a clean scan; style visual acceptance remains open.

Positioning/availability draft prepares removal of the misleading Variant inspiration line, accurate site/lab README copy, explicit proposed paid tiers, synchronized llms/metadata, and a public GitHub metadata candidate. The public status endpoint returned configured false on a read-only request; no generation or account changes were made. Legacy PR #2's useful framework-format notes were checked against the existing skill and incorporated with preview/integration limits. Maintainer choices remain; original NOTICE and the seven third-party references are unchanged.
