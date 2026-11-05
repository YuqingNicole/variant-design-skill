# Guide and comparison review · 2026-11-04

Draft PR [#153](https://github.com/YuqingNicole/variant-design-skill/pull/153), branch `codex/content-review`, based on RFC-010 proposal `c9763ff`. This is an agent fact/language audit and a human review pack. It is not the maintainer's English approval, legal review, a competitor benchmark or a production publication.

## Five-guide audit

| Guide | Evidence inspected | Action / remaining gate |
|---|---|---|
| compare-design-directions | `docs-content.ts`, history/select contract, `2026-10-27-eval-baseline.md` | Six runs and stated timing/cost ranges match the dated record. Existing English unchanged; human review remains open. |
| undo-ai-design-changes | `variant-history.mjs` legacy `expectedAfter` refusal; integration/recovery docs | Replace an unsupported pre-1.1 version boundary with the actual missing-baseline condition. Revised English is draft. |
| avoid-generic-ai-ui | Pulse brand-lock evidence in the Oct 27 baseline; current comparison/reference workflow | The dated claim and explicit absence of a controlled user study remain bounded. Existing English unchanged; human review remains open. |
| git-or-snapshot-undo | Official Git restore, stash and revert documentation; actual snapshot/integration semantics | Distinguish index/working tree/HEAD, commit/path/request units, untracked/ignored stash scope and recovery limits. Remove blanket guarantees. Revised English is draft. |
| design-references-with-sources | `reference-library.ts`, submission model, manual review and display-right contract | Distinguish link references from authorized media; check date is a viewing/review record, not present accuracy or reuse permission. Remove base-data-only totals and universal mobile/license claims. Revised English is draft. |

No `complete` or `reviewedAt` was invented. The two unchanged legacy translations retain their existing publication status; that is compatibility, not approval. The three revised English guides remain available locally/in previews and are excluded from production routes, hreflang, sitemap and LLM lists by the existing publication gate. Chinese remains available.

The audit exposed an additional gate defect: `GuidesPage` previously displayed every guide on the English index and on a direct client route even when prerender omitted it. The component now filters by the same draft status. Production-mode SSR and real Chrome checks exercise the actual component, including direct draft addresses and all Chinese guides. The copied browser fixture remains isolated under the existing ignored `.submission-site`; it is removed after server shutdown.

Primary Git references, read 2026-11-04: [restore](https://git-scm.com/docs/git-restore), [stash](https://git-scm.com/docs/git-stash), [revert](https://git-scm.com/docs/git-revert). These were read only; no restore, stash or revert was run on the maintainer's work.

## Comparison draft

`docs/drafts/compare-page.md` remains unpublished. Rechecked the primary [Impeccable generate](https://impeccable.style/docs/generate) and [detector](https://impeccable.style/docs/detector) docs, [Taste Skill README](https://github.com/Leonxlnx/taste-skill), and [frontend-design source](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md).

Corrections: separate Taste's website and app routes; identify generate's beta dependency; distinguish documented instructions from observed results; remove unverified marketplace availability. License names were checked against each repository's actual license file. The frontend-design directory currently contains Apache-2.0, replacing the old unspecified cell. This records source licensing only; it does not resolve hosted-service terms or asset rights.

Maintainer gates remain: `/compare` versus `/guides`, Anthropic comparison publication terms, English approval. No competitor service was run, benchmarked, scraped or reverse engineered. No public page or genuine authorization record was added.

## Validation

- Website unit tests: 67 passed.
- Website typecheck/build: passed; 239 preview-mode routes, including all five English drafts/legacy guides for review.
- Focused Chrome regressions: 7 passed, including production-mode client gating, bilingual no-JS routes and all four existing submission scenarios.
- Local production build: 236 routes. Artifact assertions confirmed the three draft English routes, index links, hreflang, sitemap entries and llms links are absent; all Chinese guides and two legacy English guides remain. Exact PR CI is pending.
- `git diff --check`: passed before validation checkpoint.

The first external temporary Playwright config used `/tmp` as the server working directory and could not locate the server. Its explicit cwd was corrected before rerunning; this is a harness startup failure, not a rendering pass. The original dirty navigation worktree is untouched.
