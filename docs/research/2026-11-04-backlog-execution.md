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
| Artifact evidence, #18 | Draft PR #156; exact CI passed; Codex ledger-pick 20/20 and installed-helper extension invalidation confirmed | Automatic plans and complete real-delivery coverage; static brand warnings and missing runtime checks remain explicit |
| Project integration, #19 | Draft PR #157 at d646948; exact CI passed; registered-system drift refused on actual generated B via CLI | RFC-011 and native Vite fixture baseline prepared; host grader/Agent matrix, cleanup ownership and full delivery receipt remain |
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


### Native Vite matrix preparation

PR #157 head `d646948` has both push/PR loop and landing CI passed. The next independent #19 phase follows RFC-011 in `/Users/nicole/orca/variant-native-vite-matrix` (`codex/native-vite-matrix`): a self-authored Workshop Ledger fixture with the actual alias, Vite define, provider/business hook, global brand CSS, local SVG and a protected existing preview entry. Original fixture typecheck/build passed on exact React 19.1.1 / Vite 7.1.7 / Rollup 4.65.1. Actual Chrome verified search/combined filters, owner mark-paid, viewer read-only, workspace state, brand CSS, resource and no overflow at 320/390/1440; a real missing-provider entry throws. These are fixture-baseline results, not a real Agent or native delivery acceptance. Host capture/grading integration and the two-turn Agent run are next. No new support claim or production action.

### Native Vite host preview checkpoint

The runner now independently captures baseline/per-turn previews and a disposable dependency probe with actual project Vite/TypeScript, source hashes, browser business/role/brand/resource checks at 1440/390, actual typecheck file coverage and emitted build entries. Copied-provider, missing-provider, broken comparison/console, undecodable image despite HTTP 200, missing build/typecheck coverage and malformed/symlink manifest cases are exercised against real tools. Data/provider/CSS probe mutations stay in a copy; six owned ephemeral loopback servers shut down successfully. The reused-plan test-directory defect found on a repeat run was fixed without weakening helper conflict refusal.

Local final gates: 20 Chrome regressions (five native), 14 grader tests, tests typecheck and four package checks passed; the affected integration regression also passed two focused repetitions. Source-bound summary: `2026-11-04-native-vite-host-checkpoint.json`; full record: `2026-11-04-native-vite-matrix.md`. The host score still has `deliver-observed` and `delivery-replayed` failing, with overall native acceptance false. No real native Agent run or full #19 acceptance is claimed. Next: implement independent history/integration/rollback replay and its negative cases, run the installed skill's two-turn scenario, then inspect actual generated output. Existing maintainer choices, Claude authentication, shared-import/cleanup gaps and production approval remain open; the overall backlog objective remains active.

### Native Vite independent delivery replay

Draft PR #158 preview checkpoint `d0ca6f0` has both push/PR loop and landing CI passed on Node 22. The next implementation adds independent recorded-history, fresh integration and rollback replay in a disposable copy, original-source/variant/selection preservation, real browser/typing/build checks and actual refusal of later edits in three guard copies. New regressions reject false/missing receipts, wrong snapshots/backup hashes, symlink logs and an actual A entry labelled B in its receipt. Source-bound evidence: `2026-11-04-native-vite-delivery-checkpoint.json`; full record: `2026-11-04-native-vite-delivery-replay.md`. Final local checks: 23 Chrome regressions, 14 grader tests, tests typecheck and four package checks passed. The timeout and earlier test-wiring failure remain documented. This proves the handwritten harness cases, not a real native Agent delivery; that two-turn installed-skill run is next. All later backlog work and human gates remain open.

### Native real-run corrective loop

The actual `5e3827a` Codex attempt completed both processes but failed overall: 28/45 checks, 404s, 15,888 skill words, 1,105,346 cache-inclusive tokens. Both push/PR loop/landing CI jobs passed on that head, but they are not Agent acceptance. The run exposed a host false negative for nested equal direction markers, ambiguous fixture output-directory wording leading to missing formal context and transaction copies, and preview typechecking of staging source after delivery. Original output/receipt requirements were retained; the corrective host observes all visible markers and rejects conflicts, while the fixture explicitly separates formal output from adapters and active sources from staging. The original failed report is preserved in `2026-11-04-native-vite-agent-runs.json` and its raw directory. Corrective real-browser regressions and a fresh installed-skill run follow; no #19 completion or production action is claimed.

### Native real-output mechanical acceptance

The second actual run `98756c4` preserved proper formal output/ownership, real B history 1→2→3, integration receipts and original source, but its original score remains failed (34/45, 464s) because the host required textbox rather than the valid searchbox. The host now uses the unchanged accessible name with actual task interactions, normalizes only presentation case and binds real Vite HTTP/WebSocket to its owned ephemeral port. Eight affected Chrome regressions, 14 grader tests, tests typecheck and four package checks passed. Both push/PR loop/landing CI passed at `98756c4`; corrected-head CI remains separate.

A separately labelled corrected-host audit verified every preserved generation/delivery fingerprint, recovered only the three known probe mutations in a new copy and independently observed the exact real Agent output. All 45 checks passed in 87 host seconds; both original failed reports and the original Agent tree stayed unchanged. Actual source/staging and three generated desktop/integrated-mobile screenshots were inspected. Aggregate/method: `2026-11-04-native-vite-agent-runs.json`, `2026-11-04-native-vite-delivery-replay.md`. The one Vite fixture is mechanically verified; full #19/RFC approval remains open. Next work includes direct immutable phase archives/full receipts, shared-import coverage and owned preview cleanup, alongside existing human decisions and all later backlog points. No production change or release occurred.

### Direct phase archives

The native runner now captures outside-project baseline/generate/deliver source and complete grader snapshots before observation or the next turn. Host receipts bind manifests/snapshots/source hashes; verification rejects tampering, missing/extra paths, symlinks, mode changes and phase/observation mismatch. Eight archive regressions passed, with 14 grader tests and four package checks. A retained real generation source probe captured 141 files/25 directories, matched the real observation fingerprints and restored B version 1 independently after editing a separate materialized copy. Research: `2026-11-04-native-phase-archives.md`. The next actual CLI run must prove direct runner capture and the three new archive gates (48 total); retrospective archive creation is not substituted for that gate. Full receipts, shared dependencies, cleanup ownership and all prior human/commercial gates remain open.

### Direct archive real-run checkpoint

Fresh installed-skill head `34baa7d` passed 48/48 checks in 354 seconds (Codex generation 170s/delivery 113s, both exit 0, no timeout). Direct baseline/generation/delivery archives contained 104/143/177 files and matched every corresponding browser fingerprint. Independent post-delivery verification and two fresh materializations preserved generation B1 separately from delivered B3; editing one restored copy left the other, all archives, original Agent tree and result JSON unchanged. The earlier persisted baseline receipt also matched the final result. Exact implementation-head push/PR loop/landing CI passed. Evidence: `2026-11-04-native-phase-archive-run.json`, method and limitations in `2026-11-04-native-phase-archives.md`. This satisfies the direct-archive CLI gate above; full #19 still needs shared-import coverage, preview cleanup/full receipts and human acceptance. Other backlog issues and prior decisions remain open; no production change or release.


### Preview ownership implementation in progress

#19 I9 exposed direct comparison/mount overwrites and recursive static-directory removal. Separate branch `codex/preview-file-ownership`, based on PR #158 head `7798f46`, implements RFC-012: prepare absent native paths before writing, seal immutable receipts, guard complete rebuilds, persist operation backups and clean matching files only. Comparison/static builders now use this mechanism; existing/changed/replaced files and unlisted files remain protected, and directories are not recursively deleted. Native manifests use a stable ownershipGroup to avoid self-referential receipt paths. New runtime helper is required in the plugin package; shared workflows, generate route and bilingual docs are synchronized.

Initial 132 helper/grader/archive checks, four package checks and 14 existing Chrome loop cases passed. The tests typecheck initially ran too early (no generated input); after the actual browser fixture existed it passed. The new actual static rebuild/cleanup Chrome regression also passed, including three interactive file URLs, safe repeat build, conflict preservation and untouched source/selection. Four host cleanup and 14 ownership/API/CLI regressions passed afterward. An initial internal pointer-path bug and overstrict symlink validation were fixed without weakening user path guards. The explicit three-turn native-vite-cleanup real CLI gate, final combined checks and exact-head CI are next; no real-run or full #19 acceptance is claimed yet. Other backlog and human/production boundaries remain intact.

### Preview ownership real-run checkpoint · local 2026-11-05

Draft PR #159 implementation `97db577` passed a fresh actual installed-skill Codex generation/delivery/cleanup run, **58/58** in 414s. It removed nine matching native adapters, retained the host's later edit and unowned note, preserved all 15 original files and the complete variant-output/history/backup tree, and kept selection null. Current ownership was refreshed through guarded publish; all four direct phase archives and backup/result hashes passed a separate post-run audit without modifying original evidence. Source-bound summary/method: `2026-11-05-preview-ownership-run.json`, `2026-11-05-preview-file-ownership.md`.

Final local gates: 138 combined Node tests, 23 focused ownership/host/link tests, four package checks, 15 loop Chrome cases, two corrected native replay cases, two docs Chrome cases, tests typecheck and website tests/build (239 routes) passed. Earlier two full-suite native failures exposed a host canonical-path bug; the unchanged integration guard remains, and explicit alias regression passes after correcting the host. A warm static fixture correctly refused development-format metadata; tests now get unique output paths, preserving old artifacts. Exact implementation-head CI remains queued, not accepted. Full #19 still needs shared-import discovery and complete delivery inventory/receipts; #18 automatic plans, other backlog issues and human/production decisions remain open.

### Shared dependency closure implementation · local 2026-11-05

Separate `codex/shared-dependency-closure` worktree implements RFC-013: supported static transitive local imports/resources and compiler-config inputs now bind evidence and integration plans, together with reviewed wrapper/alias/config facts. Actual project TypeScript parses script syntax; missing parsers/dynamic or unresolved relations remain partial/unverified. Known shared changes invalidate old evidence and reject old plans before writes; original candidate/undo semantics and selection remain intact. Generic source and guard tests, private/symlink/limit checks and copy-stable identity use actual files/compiler, not mocks.

Local preparation: 153 combined Node tests, 32 final focused checks, existing 24 Chrome cases, one corrected new real-browser dependency probe, package/typecheck and website tests/build passed. Preserved initial failures include missing test parser context, false CSS candidates, a wrong working directory and a B-only host capture passed to the full-matrix grader. The host now captures all A/B/C samples, preserving that grader. Research: `2026-11-05-shared-dependency-closure.md`. Next: explicit three-turn installed-skill `native-vite-dependencies` run (68 gates), inspect real source-bound receipts and exact-head CI. Full delivery receipts, automatic runtime plans, other backlog and human/production boundaries remain open.

### Shared dependency real-run checkpoint · local 2026-11-05

PR #160 implementation `dfc688b` passed a new actual installed-skill Codex generation/delivery/cleanup case, **68/68** in 402s. The reviewed ten adapter roots and configs produce a 29-file/50-edge static closure. Fresh host browser/command observations remain explicitly partial runtime evidence; six separate provider/data/CSS/SVG/ambient/config changes stale that evidence and make real integration refuse without discarding any changed data, target, context or backup. A new plan after restoration applies/rolls back; all original Agent source is unchanged by the probe. The Agent's own five runtime checks remain unverified rather than fabricated.

All four phase archives and source/helper/compiler/receipt hashes passed independent post-run audit. Real generation versions A2/B2/C2 (history corrections) become A2/B4/C2 after temporary edit/undo, and stay so through cleanup with selection null. Original 15 files, owned source, full output/history and unowned dependency facts survive. Evidence/method: `2026-11-05-shared-dependency-run.json`, `2026-11-05-shared-dependency-closure.md`. Exact implementation push loop/landing CI passed; its log confirms Node 22, 153 Node tests and 25 Chrome cases. Same-head PR loop/landing also passed on a fresh commit check-runs query; follow-up documentation CI remains separate. Next safe scope: complete version-bound delivery inventory/receipts; #18 automatic plans and all later backlog/human decisions remain open. No production change or release.

### Version-bound delivery receipts implementation · local 2026-11-05

#160 evidence-only head `4f597a0` now also has both push/PR loop/landing checks passed. The next independent #19 phase is in `/Users/nicole/orca/variant-delivery-receipts`, branch `codex/delivery-receipts`, RFC-014. It seals actual integration inventory, plan/staging/backup/report/preview identities and recovery argv without duplicating raw source or inventing observations. Inventory validity and verification status stay separate; missing/failed checks stay explicit, drift invalidates the handoff and real rollback preserves a historical receipt.

Initial corrected nine receipt regressions and combined 163 Node tests passed. One actual Chrome host case passed: fresh original/integrated app observations, source/target/report drift, true rollback refusal/restoration and original preservation. Four package checks, website 67 tests/build (239 routes) and two docs Chrome cases passed. Final full browser/resource-limit gates and actual installed-skill 78-gate CLI run remain outstanding; full #18/#19, commercial/installation/trial-user/production gates and all prior human decisions remain open. Evidence: `2026-11-05-delivery-receipts.md`. No production action or release.

Final receipt preparation: **164 combined Node** and ten focused receipt tests passed, four package checks and test-workspace typecheck passed. Full Chrome was 25/26 because the new test mixed macOS temporary-root aliases when making a report-relative path; the actual normalized-path guard correctly refused it. Canonicalizing that test root passed the affected real Chrome case 1/1; exact-head CI will run all 26. No guard was weakened. Freeze implementation and start the 78-gate real installed-skill run; do not claim receipt UX/full #19 acceptance before that evidence.

Receipt first real run `4d2527d` completed all three processes but failed **60/78** in 584s. Actual receipt sealing/history/rollback/cleanup worked; a new native confirmation dialog was auto-dismissed by the host, so payment totals never changed and subsequent measurement gates were unavailable. The original failed score and all four verified archives remain recorded. Corrective host acknowledges the authorized confirm/alert step and retains exact business/role assertions; three actual Chrome regressions passed. Unobserved brand/command data remains unverified, rather than a fabricated measurement. The exact old head's two CI runs passed (Node 22/164 Node/26 Chrome); a new installed-skill run follows the correction. All full-issue, original-backlog and human gates remain open.
