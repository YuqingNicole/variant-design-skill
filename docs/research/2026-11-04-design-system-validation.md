# Design-system validation · 2026-11-04

## Scope and failure baseline

RFC-007 P1: explicit color pairing and honest coverage, component-to-semantic aliases, brand-file exemptions, token exports, and real CLI chains. Worktree: `/Users/nicole/orca/variant-backlog-work`; branch: `codex/design-system-validation`, based on `c4d375a`. Production and the original dirty navigation worktree remain untouched.

Before the change, the real `contrastIssues` helper returned `[]` for `:root{--color-muted:#777777;--color-panel:#ffffff;--p-blue-500:#0000ff;--button-primary-bg:var(--p-blue-500)}`. Neither the missing pairing nor the component's primitive reference was reported. This is the negative baseline, not a pass.

## Contracts

- `checkSystem(sources)` returns `checked`, `issues`, `unverified` and `layers`. The old `contrastIssues` API still returns only measurable failing pairs; callers needing coverage use the full report. Draft CLI exit 1 means failed or incomplete contrast, layer errors or requested unused-token findings; exit 2 is an input/option error. Zero checked pairs are printed explicitly, never described as a contrast pass.
- Generated/extension colors pair exactly as `--color-on-<role>` on `--color-<role>`. Shared text declares surfaces in a trailing `/* use: body; on: --color-bg --color-surface */` note. Chart/decorative colors may explicitly declare `contrast: non-text`; this is not valid for meaningful text. Named border/focus/overlay roles are non-text. Unpaired roles, missing/cyclic aliases, unsupported/translucent values and multiple conditional values remain unverified. No CSS cascade evaluation or rendered compliance is claimed. Threshold comparison uses the unrounded ratio.
- Existing brand files are supplied with `--brand <file>` (or `{source, origin:'brand'}` in JavaScript). Only these use legacy text/surface guessing. Their naming and token layers are exempt; generated extensions may reference brand variables but must not redefine them. Context remains schema v2; origin is derived from the existing main-file/extension contract, not an invented migration.
- Generated component tokens are single semantic/brand aliases. Raw/fallback/composite, missing, primitive or other-component targets fail the layer check. Semantic namespaces and explicit Semantic/Components headings classify custom names. A product component file may declare its owning namespace with `/* component: button */`; references to other component namespaces are warnings. The marker describes the file; it is not proof of rendered use.
- A shared dependency-free token reader ignores comments and quoted declaration lookalikes, preserves source origins and use notes, and retains conflicting declarations as multiple values. Exports omit those values and dependent aliases instead of arbitrarily selecting a mode.
- Export grouping stays `type` until the maintainer decides RFC-007 §7.2. The concrete alternative is available as `--group-by layer`, with per-token `$type`, primitive/semantic/component/brand groups and rewritten aliases, including shadow color aliases. Both options preserve resolved values. CSS remains the source of truth.
- The chain grader snapshots the draft CSS at each turn, so later repairs cannot erase a pick-time failure. It checks missing contrast coverage and component layers. `ledger-pick` adds the brand-locked two-turn case without demanding invented brand color names.

## Primary-source check

Read the [DTCG 2025.10 format](https://www.designtokens.org/tr/2025.10/format/) and [Material Web color documentation](https://github.com/material-components/material-web/blob/main/docs/theming/color.md) directly on 2026-11-04. DTCG supports type inheritance, token-level types and alias chains but does not define our layers; the layer convention is this product's rule, not a DTCG mandate. Material encodes the role/on-role relationship in names. No third-party service was reverse engineered, scraped or benchmarked.

## Evidence and remaining gates

Initial focused run: 28/29 passed; the brand test had two legitimate legacy surfaces (paper and button background), not one. Corrected the test's coverage expectation. The next run passed 39/39. The initial full helper/grader run passed 89/89. Website validation caught a missing Chinese changelog block; the corresponding bilingual block was added, and website tests then passed 67/67. These runs precede the final color-boundary regression and are checkpoints, not final-head claims.

Pending: final helper/package/website checks; complete six-turn harbor-chain on Codex and Claude; brand-locked ledger-pick; inspect actual CLI outputs and generated previews/screenshots; record failures and rerun only after justified changes; maintainer visual acceptance; export default decision. No UX improvement or completed RFC acceptance is claimed before that evidence exists.

### Deterministic checkpoint

Final pre-eval helper and grader invocation (`node --test scripts/*.test.mjs evals/grade.test.mjs`): **91 passed**. Packaging (`python3 scripts/plugin-package.test.py`): **4 passed**. Website tests after adding the Chinese changelog block: **67 passed**. Production build: **239 prerendered routes**, completed locally; this is not a production deployment. The later threshold test verifies that a rounded display of 4.50 cannot pass a measured value below 4.5; malformed color channels stay unsupported instead of becoming zero through JavaScript coercion. The new ledger chain also checks the expected brand file/fonts each turn and reports the skill files/word counts read across fresh CLI processes.

### Real CLI attempt and follow-up

The runner started `harbor-chain,ledger-pick` for Codex and Claude from implementation commit `74aa122` at `/Users/nicole/orca/variant-backlog-evidence/ds-evals` (live exec session 54084). Claude's six harbor turns all returned the same account-level HTTP 403 authentication/verification failure, with zero reported model cost and no generated artifact. This is an external prerequisite failure, not a model-quality or implementation pass. Codex's actual processes are still running; no restart was made after initial model-list timeouts because the same process later progressed.

A follow-up to the unused-token check excludes original brand tokens from the remove-or-use list while retaining reachability through them. Brand files are locked and cannot be trimmed to a single preview's inventory. The new brand regression and all ten ds-check tests passed. This follow-up was made after the real runner had copied `74aa122`; the current run does not prove this later delta, which has its own direct helper regression. Do not label the entire current tree as real-CLI verified from the older install.

### Completed attempt, incomplete acceptance

The runner finished (session 54084). Codex ledger-pick passed all checks in 454 seconds; skill reading was 9,949 words on generate and 8,230 on pick. The existing brand's unpaired accent/muted colors remained warnings, not false layer failures. Codex harbor completed all six turns, with nine measured contrast pairs and no failing/unverified pairs or layer errors in the generated system. However, confirm/apply/undo/component delivery checks failed because the newly confirmed font set differed from B's old token record. Ordinary apply forbids changing locked tokens. This is a real workflow defect; the run as a whole failed. All other chain checks passed.

Claude harbor (107s) and ledger (11s) failed at account verification with no generated artifact. Exact current PR #150 head `99ce595` has green loop/landing CI and preview checks; these do not override the real-chain failure. RFC-009 defines the corrective state/operation contract and negative regression matrix. The phase remains incomplete.

### Corrective adoption implementation · RFC-009

Implemented `confirm-system` and constrained `apply-system` in the existing history helper. Confirmation verifies a context backup, records a content/order/font identity and explicitly marks the picked source pending without changing its files/tokens/version/undo. Application checks the approved identity and supported aligned token record, and snapshots code, tokens and binding together; undo restores all three. Ordinary variation token locks, zones, cooperative locks and stale-write checks remain. Candidate baselines now cover every extension; legacy baselines without extension coverage are rejected explicitly rather than reinterpreted. Original brand constraints remain strict for all variants, including after a picked-source extension. An explicitly adopted A/C is also checked rather than retaining the exploration exemption.

The first red test failed because the new operation did not exist. The implementation then passed 101 helper/grader tests. Further coverage adds backup failure, legacy extension-baseline refusal and extension loading order. The chain grader now requires registered pending/applied identities and checks token/binding restoration; confirm cannot secretly edit tokens, version or undo. It uses the real helpers in its own regression driver.

The actual Chrome loop suite passed **12/12**, including the new confirmation → adoption → undo test: computed Georgia remains at confirmation, changes to Arial on adoption, and returns to Georgia on undo while the counter still works and A/C bytes/selection remain intact. This is a local built-in-font observation, not downloaded-font coverage. Package tests passed **4/4**, website tests **67/67**, website typecheck/build **239 routes**, and actual stdio/HTTP MCP tests **2/2**. A combined local run caught the submission fixture copy polluting the loop typecheck; its separate fixture-isolation fix lives on the P3 branch. The cleaned loop typecheck passed; no compiler rule was weakened.

These deterministic/browser results precede the corrective real-CLI rerun. The earlier full-chain failure remains recorded; no successful corrected real run is claimed yet. Claude verification, replacement browser-space authorization, final visual review, grouping default and production approval remain independent gates.

Final corrective helper/grader run: **102/102 passed**, including the injected backup failure and current extension/order/legacy-baseline guards. No ordinary token-lock regression was relaxed. The next real run must test the corrected installed copy, not reinterpret or overwrite the earlier failed artifacts.

### Corrective real CLI checkpoint · passed within declared scope

Installed implementation `eacfee0d4ec54721366f9317d7ee075c540499c9`, runner session 9076, artifacts at `/Users/nicole/orca/variant-backlog-evidence/ds-adoption-evals`: **Codex harbor-chain 34/34 checks passed (843s)** and **Codex ledger-pick 18/18 passed (444s)**. Actual transcripts invoke `confirm-system` and `apply-system`; application took two prepared steps under one request and a single undo restored the pre-application state. B's off-system values were 4 → 0 → 4 across confirmation/application/undo; A/C stayed at their original 9/11. Selection stayed B. The system's seven declared contrast pairs measured without failing/unverified pairs or layer errors.

The pending warning after undo is intentional: it accurately distinguishes the restored old page from new components built on the confirmed system. The original overlay color and off-scale lengths remain visible as warnings, not certified compliant. Ledger retains brand accent/muted contrast limitations and existing radius warnings; they were not deleted to obtain a pass. Source/reading checks passed. Word counts across fresh processes: harbor 58,503, ledger 28,273; these are observed totals, not a context-efficiency improvement claim.

Committed summary: `2026-11-04-system-adoption-runs.json`; raw transcripts/generated code stay outside Git. Exact implementation-head loop and landing CI jobs passed, and the preview build succeeded. No production merge/deployment occurred. Claude still needs account verification; generated-page screenshot/maintainer visual review and the grouping-default decision remain outstanding. The draft PR therefore stays open and the overall backlog stays active.
