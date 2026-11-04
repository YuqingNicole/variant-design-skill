# Verification system dependencies · 2026-11-04

Branch: `codex/evidence-system-dependencies`, based on positioning draft `47b8b77`. This addresses a specific freshness gap under issue #18/PRD-002. It does not complete automatic task-plan generation or full delivery coverage.

## Reproduction and contract

`artifact-verification.mjs` automatically fingerprinted the main system file but omitted registered extensions and the variant's adoption binding. Without callers redundantly declaring an extension, changing it after or during observation left a controlled report `passed`. Two new negative regressions reproduced that false-current result before the fix; log: `/tmp/variant-evidence-extensions-before.log`.

The capture now includes every registered extension and any existing binding. Extension metadata must be an array of nonempty path strings; all paths pass existing root/symlink guards. Editing/deleting an extension, changing extension order or changing a binding invalidates earlier evidence. Mutation during observation cannot produce current evidence. Old coverage is not silently filled in: reports lacking required digests are stale and require a new run. No report schema or context-v2 migration is introduced. Selection changes still do not substitute for source/constraint identity.

Other shared files still require explicit dependencies. This is not import-graph discovery, operating-system locking, browser/environment attestation or full design-system compliance. Runtime observations and unknown checks keep their existing semantics.

## Local evidence

| Check | Result |
|---|---|
| Targeted artifact tests | 8 passed, including 3 new cases across edits/deletion/order/binding, during-run changes, symlinks, malformed paths and missing old coverage |
| All helper + grader tests | 107 passed |
| Plugin package tests | 4 passed |
| Actual Chrome loop | 14 passed (47.4s), including real CSS extension/visible color change with stale report and unchanged B bytes |
| Loop typecheck | Passed |
| Website tests / build | 67 passed; 239 preview-mode routes built |
| `git diff --check` | Passed |

The new browser case records actual computed Georgia/color on an HTML page with shared brand and extension CSS, changes only extension bytes, checks the old report is stale, reloads to observe the new color and exercises the unchanged button. Its aggregate remains unverified for checks it did not run. Unit adapter observations are controlled infrastructure fixtures, not browser or user evidence.

## Real CLI follow-up

Next run the installed working tree through the existing Codex `ledger-pick` fixture. On a disposable copy of its real generated output, explicitly confirm its generated brand extension as controlled test setup, record installed-helper evidence, and mutate only that extension to verify stale status. Distinguish the Agent result from host post-run checks; never describe the host's setup as human product acceptance or an automatically inferred runtime plan. Claude remains gated by the previously observed account verification failure and is not retried here.

No production or metadata change, model-key change or user-project source commit. The original dirty navigation worktree remains untouched. #18 remains open for automatic plans and comprehensive real-delivery evidence; #19's adapter/dependency matrix is separate.
