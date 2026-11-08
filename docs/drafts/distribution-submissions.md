# Distribution submission packet — 2026-11-08

Status: submission copy is prepared. No external directory has been submitted to or published from this pass.

## skills.sh — already listed

- Listing: https://www.skills.sh/yuqingnicole/variant-design-skill
- The page is live and describes one skill, `variant-design`; no manual submission form is needed. The skills.sh docs describe the CLI-driven catalog and install-based ranking.
- Install command: `npx skills add YuqingNicole/variant-design-skill`
- The existing README already shows the command with explicit Claude Code and Codex targets. The live page was fetched successfully on 2026-11-08; this channel is already covered and is not a submission action.

## Claude Marketplaces — draft ready

Submission page: https://claudemarketplaces.com/submit

The directory accepts a skill repository and requires GitHub sign-in. Standard submission is free; priority review is paid and is not part of this plan.

- Type: Skill repo
- Repository: https://github.com/YuqingNicole/variant-design-skill
- Name: Variant Design
- Suggested description: `Turn one brief into three distinct interface directions inside your own project. Compare trade-offs, refine one scoped region with snapshots and undo, then integrate the chosen direction with a rollback path.`
- Install: `claude plugin marketplace add YuqingNicole/variant-design-skill` then `claude plugin install variant-design@variant-design`

## OpenAI Plugins directory (ChatGPT and Codex) — package prepared; review gates remain

Submission reference: https://developers.openai.com/plugins/deploy/submission

The official directory accepts a ZIP package. Uploading creates a draft; a verified developer identity and an account with submission access are required. Approval and publication are separate steps. This plugin is skills-only, with no remote MCP server.

- A candidate package was generated locally for handoff and was not committed. Recreate it with `python3 scripts/build-plugin.py /absolute/path/variant-design-codex.zip`, then inspect it with `python3 scripts/verify-plugin.py /absolute/path/variant-design-codex.zip`.
- Built from version `1.1.0`; the existing verifier reported `valid`, 106 files, 1,337,183 uncompressed bytes.
- Listing name: Variant Design
- Short description: `Compare, refine, ship UI`
- Repository: https://github.com/YuqingNicole/variant-design-skill
- Submission must wait for the remaining release-readiness gates in `plugin/release-readiness.md`: clean installation and discovery through the real plugin manager, the project matrix, cold-start usability, and generic integration/recovery evidence. The archive verifier alone does not satisfy them.

## Codex Plugin Marketplace (third-party) — packaging path needed

Submission page: https://www.codex-marketplace.com/submit

This directory accepts a public GitHub repository or tree URL and expects `.codex-plugin/plugin.json` at the root of the submitted plugin tree. The current repository stores the source manifest at `plugin/plugin.json`; the package builder creates `.codex-plugin/plugin.json` only inside the ZIP above. The current GitHub tree is therefore not directly ready for this directory. Do not claim it submitted until a stable source tree with the expected layout is published and accepted.

## Maintainer actions

1. Complete or explicitly defer the OpenAI plugin release-readiness gates.
2. Sign in to Claude Marketplaces and submit the prepared skill listing.
3. If targeting the third-party Codex Plugin Marketplace, first publish a maintained GitHub tree with the required plugin layout.
4. Do not pay for priority review or publish an approved OpenAI plugin without a separate maintainer decision.

## Source checks

- `docs/research/2026-10-27-skill-distribution.md` records a prior real `npx skills add` installation and the absence of a skills.sh submission flow at that time.
- The current skills.sh page was fetched on 2026-11-08 and exposed the repository and its single skill.
- Current directory requirements were read from each directory's own submission page or official documentation on 2026-11-08.
