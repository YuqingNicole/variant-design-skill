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
