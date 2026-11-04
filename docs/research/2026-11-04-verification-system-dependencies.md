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


## Installed-run checkpoint

Installed implementation `4fbfb35`: real Codex ledger-pick passed 20/20 grader checks in 388s; both processes exited 0 without timeout. Reading: 27,690 words across generate/pick (15 distinct files), reported without a claim that this change optimized reading. Usage: 1,314,466 cache-inclusive tokens, not a dollar estimate. Existing brand accent/muted contrast warnings remain; the user explicitly picked B, so the selected-state warning is recorded rather than hidden.

The model already registered `variant-output/system-extension.css` during generation and preserved that system through pick; the newly derived `design-system.css` stayed a separate draft. Host setup therefore did not need the prospective extra confirmation. On a disposable complete project copy, the exact installed helper hash was checked against this implementation. A static-only report was unverified, changing the registered extension made it stale, and a new run remained unverified for all five missing runtime checks. The old report and original Agent output were unchanged. This host observation is separate from model execution, not a new Agent action, human acceptance or inferred runtime plan.

Aggregate evidence: `2026-11-04-verification-extension-run.json`; full output, transcripts, installed source and immutable reports stay outside Git in `/Users/nicole/orca/variant-backlog-evidence/evidence-extension-evals/`. Draft PR [#156](https://github.com/YuqingNicole/variant-design-skill/pull/156) has both push/PR loop and landing CI passed at the implementation head. #18's automatic plans and complete real-delivery matrix remain open.
