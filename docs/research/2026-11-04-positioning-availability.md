# Positioning and availability review · 2026-11-04

Branch: `codex/positioning-honesty`, based on style checkpoint `1df0ab4`. This is a concrete maintainer review draft for TODO §1, not authorization to publish metadata, deploy, sell subscriptions or contact third parties.

## Evidence and proposal

- Read the current README pair, pricing component, prerender/llms generator, server status contract, paid-product PRD, NOTICE and legacy PR #2.
- Public read-only GET `https://variant-design-skill.vercel.app/api/status` returned `{"configured":false}`. The web reader could not access this endpoint; curl succeeded. No model generation or paid request was made. This is one observation of the public environment, not every deployment.
- Current GitHub metadata was read with `gh repo view`: description still references the Variant design community and homepage points to the repository. Exact proposed replacement is `docs/drafts/github-metadata.json`; it preserves existing topics and adds agent-skills, codex and design-system. It has **not** been applied.
- Actual pricing CTAs open the GitHub issue editor. There is no checkout in this flow; the problem is that early-access/feature language can imply availability. The proposed page explicitly marks both paid tiers, prices and features as proposals; changes inquiry wording and the slogan; and aligns README, metadata and llms. Existing dollar numbers remain draft discussion figures, not validated prices or a new commercial commitment.
- Local model wording now describes the user's agent/model account rather than requiring an API key. Files are stored locally, while model requests follow the user's agent/provider configuration; no claim that model context never leaves the machine is made.
- The seven Impeccable references and all their notice/license material remain untouched. `docs/drafts/positioning-and-availability.md` recommends retaining them with disclosure unless the maintainer chooses a rewrite. No author contact was attempted.

## Legacy PR #2

Read [the actual diff](https://github.com/YuqingNicole/variant-design-skill/pull/2), head `7d6e70e`. Its Vue/Astro/Svelte source-format additions agree with existing code-output/framework instructions. The useful information is incorporated into a bilingual table here, with explicit agent-prompt semantics and the preview/integration boundary. No new framework matrix was run and no broader adapter support is claimed. The old PR remains open pending this change's review/merge and a maintainer closure decision; no comment or review was sent to its author.

## Verification

- Website unit tests: 67 passed on the final copy.
- Website typecheck/build: passed; 239 preview-mode routes.
- First focused Chrome run: 4 passed, including pricing, bilingual no-JS pages and language navigation. Final pricing wording and aligned price labels passed the two pricing cases (5.5s).
- Actual prerender/llms assertions passed; draft metadata parses, has unique topics and meets the description-length bound.
- Six no-JS screenshots at both languages × 320/390/1440 were generated; English 390 and Chinese 1440 were inspected. Final-label screenshots are preserved at `/Users/nicole/orca/variant-backlog-evidence/positioning-pricing-final/`; exact PR CI remains pending.
- No production merge/deployment, GitHub metadata mutation, checkout, payment, message or model-key change.

Maintainer decisions remain separate: retain explicitly planned paid cards versus remove them; approve public GitHub metadata changes; retain versus rewrite third-party references. Human confirmation of direction does not automatically authorize a production deployment. The prepared review draft links these exact choices to the applicable TODO rows.
