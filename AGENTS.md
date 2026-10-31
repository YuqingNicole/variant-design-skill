# AGENTS.md

Guidance for coding agents (Codex, Claude Code, others) working **on** this repository. To use the skill for design work in another project, read `SKILL.md` instead.

## What this repository is

Variant Design is an agent skill. It turns one brief into three comparable design directions (A/B/C) inside the user's own project. It supports scoped edits with snapshots and undo, and integrates the chosen direction with a rollback path. There is no hosted service: the user's agent supplies the model, and the bundled Node scripts do the stateful work.

**This directory is itself an installed skill.** Users clone it whole into `~/.codex/skills/variant-design` or `~/.claude/skills/variant-design`, and the maintainer's own install may be a symlink to this working tree. Every file you change here takes effect in live agent sessions immediately.

## Layout

| Path | Role | Notes |
|---|---|---|
| `SKILL.md` | Router entry point | Keep it short. It routes to one sub-skill; do not inline workflows here |
| `skills/*/SKILL.md` | Sub-skills: generate, design-system, component, analyze, ux | Shared phases each have one source of truth: `skills/shared/code-output.md` (writing code), `references/workflow/preview.md`, `references/workflow/history.md` and `skills/shared/export.md`. Each route starts with a load map; files are read at the step that needs them. Only the root `SKILL.md` has skill frontmatter: Codex and `npx skills` scan folders recursively and would register sub-skills as broken standalone skills (enforced by `plugin-package.test.py`) |
| `references/` | Loaded on demand by the routes | Grouped by role: `workflow/` (context, discovery, history, quality and integrity rules shared by routes), `sources/` (design references and direction cards), `domains/`, `design-system/`, `ux/`, `tasks/` (routes the router sends straight to a reference), plus the shared `palettes.md` and `interactive-patterns.md`. Domain references follow the five-part structure in `README.md` → Contributing. `scripts/skill-links.test.mjs` fails on a named file that does not ship with the skill and on a reference no route reaches |
| `scripts/*.mjs` | Runtime helpers that run inside **user projects** | Zero dependencies, Node 22+, ESM. Each has a CLI and exported functions |
| `scripts/*.test.mjs` | `node:test` unit tests for the helpers | Excluded from the plugin package |
| `tests/` | Playwright browser regressions (`loop.spec.mjs`, `landing.spec.mjs`) | Has its own `package.json` |
| `website/` | Bilingual React + Vite marketing site and online lab | Also the dogfood project: `website/variant-output/` holds real A/B/C history. `website/content/` holds direction-library entries (RFC-002), validated by `website/scripts/content.mjs`. Visual rules (tokens, type, components, motion, known deviations) are in `docs/design-system.md` |
| `mcp/` | Local stdio MCP adapter over the same history helpers | Has its own `package.json` and tests |
| `evals/` | Real agent runs on fixture projects, graded automatically | See `evals/README.md`. Runs cost model usage; the grader tests do not |
| `plugin/` | Codex plugin manifest and release-readiness notes | Built by `scripts/build-plugin.py` |
| `docs/prd`, `docs/rfc` | Requirements and architecture, written in Chinese | GitHub Issues track status. Writing a PRD is not shipping it |
| `docs/research/` | Dated dogfood records and competitor notes | Record evidence here; do not rewrite history |

## Invariants of the helpers

These rules are product promises. Tests enforce them, and agents in user projects rely on them. Do not weaken them to make a change easier.

- **Editing is not selecting.** `apply` and `undo` set `activeVariant`. Only an explicit `select` (the user saying `pick B`) sets `selectedVariant`. Export and integration never select.
- **Never overwrite unseen user work.**
  - Candidates are prepared with a content baseline (`variant-history.mjs prepare`).
  - `apply` rejects stale candidates and changes outside the zone.
  - `undo` refuses if files changed after the recorded revision.
  - `variant-integrate.mjs rollback` refuses if integrated files were edited afterwards.
  - There is no force flag, and none should be added.
- **Persist the snapshot or backup before writing**, and verify it was written.
- **Zones.** A file may mark a zone once in markup (`<!-- zone:x:start -->` or `{/* zone:x:start */}`) and once in styles (`/* zone:x:start */`). A zoned edit must leave owned files without those markers byte-identical.
- **One user request is one undo.** Applies that share `change.request` are reverted together.
- **Paths stay inside their roots.** Symlinks are rejected (`localFile`). Working files belong in the target project's `.variant-work/`. Integration refuses `variant-output/`, `.git/`, `node_modules/` and `.variant-work/` as targets.
- **Context schema is v2** (`references/workflow/project-context.md`). Do not silently migrate or reinterpret legacy fields.

## Commands

From the repository root:

```sh
node --test scripts/*.test.mjs                          # helper unit tests
python3 scripts/plugin-package.test.py                  # package contents and smoke test
node scripts/quality-gate.mjs --self-test
node scripts/quality-gate.mjs examples/coffee-brand-interactive.html --strict

cd tests && npm ci && PLAYWRIGHT_CHANNEL=chrome npx playwright test     # loop browser suite
cd tests && npm run typecheck
npm ci --prefix website && npm test --prefix website && npm run build --prefix website
cd tests && PLAYWRIGHT_CHANNEL=chrome npx playwright test -c landing.config.mjs   # needs the website build

npm ci --prefix mcp && npm test --prefix mcp

node --test evals/grade.test.mjs                        # eval grader; no agent runs
node evals/run.mjs --agent claude --fixture pulse       # one real, graded agent run (costs model usage)
```

- Use `PLAYWRIGHT_CHANNEL=chrome` when the Playwright browser is not downloaded. CI downloads Playwright's own Chromium without `--with-deps`, because installing its system dependencies there hangs intermittently; the runner image already has them.
- CI (`.github/workflows/variant-loop.yml`) runs a `loop` job and a `landing` job on Node 22. When you add a `scripts/*.test.mjs` file, add it to the `node --test` line there.
- When you add a runtime script that the skill depends on, add it to `required` in `scripts/build-plugin.py`.

## Conventions

- **Code style.** Match the surrounding file: compact ESM, short functions, comments only for non-obvious constraints. The website TSX is dense on purpose. Keep large bilingual copy in data structures (see `website/src/DocsGuide.tsx`), not inline JSX.
- **Language.**
  - Skill files, references, scripts and the README: English.
  - `README_CN.md`, PRDs and RFCs: Chinese.
  - Website copy: both languages, with the `[zh, en]` order used in the existing data.
- **The skill's own text is the product.** When you change behavior in `scripts/`, update every place that describes it in the same change: `references/workflow/preview.md`, `references/workflow/history.md`, `skills/shared/export.md`, `skills/shared/code-output.md`, the relevant `skills/*/SKILL.md`, and user-facing docs (`website/src/DocsGuide.tsx`, `README.md`, `README_CN.md`).
- **Progressive loading.** `SKILL.md` routes to one sub-skill. Each sub-skill opens with a load map that names which file to read at which step; split files by the phase that needs them (first generation, edit, export), not only by topic. Do not add "read everything" or "always load" instructions. `node evals/run.mjs` reports the skill text each run read; check it when you change what a route loads.
- **Rule precedence** across routes: user constraints → product task and existing design system → accessibility → style suggestions.
- **Dependencies.** Helpers stay dependency-free and reuse the target project's own React and Vite. Pin exact versions in `tests/`, `website/` and `mcp/` lockfiles. Rollup 4.64.0 hangs on production builds; keep `tests/` on 4.65.0 or later.

## Verification and honesty

- Report only checks that actually ran. Never claim WCAG compliance, browser coverage, a quality score or marketplace availability from inspection alone. Static scans and HTTP 200 do not prove that a page renders correctly.
- Behavior changes need a regression test: unit tests for helper semantics, Playwright for rendering. Test against the real helper, not a mock of it.
- Before claiming that the skill's user experience improved, dogfood it in a real CLI and record the evidence in `docs/research/`:
  - Start with `node evals/run.mjs`. It installs this working tree at project level in throwaway fixture projects, runs Claude Code and Codex, and grades the result. Add a fixture when a change needs a scenario the existing ones do not cover.
  - A global install of the same skill can take precedence. In Claude Code 2.1.311, runs read `~/.claude/skills/variant-design` even with a project-level copy present, unless started with `--setting-sources project,local` (the eval runner does this). In manual runs, check the paths in the run's tool calls (`--output-format stream-json --verbose`); the `skill-under-test` check does this for eval runs.
  - `codex exec` runs in a sandbox that cannot bind ports. `claude -p` stays alive while a background preview server runs.

## Git and collaboration

- Do not commit to `master`. Use a branch per task (the history uses `codex/<topic>`) and open a pull request.
- Deployments (Vercel project `variant-design-skill`): `master` is production at `https://variant-design-skill.vercel.app`; the `dev` branch is always deployed to `https://variant-design-skill-dev.vercel.app`, which sits behind Vercel Authentication (team members only, not indexed). Pull requests still target `master`. To try a change on dev before merging, merge its branch into `dev` and push; never force-push `dev`. After a release, bring `dev` back level with `master` by merging `master` into it. Every pull request also gets its own preview URL.
- Other agent sessions may be working in this tree at the same time (for example on `mcp/`). Before committing, check `git status` and stage only the files you changed. Do not revert or reformat other people's in-progress work.
- Never commit `.variant-work/`, `.verification/`, `.integrations/` from test projects, `website/.env`, or anything containing a user's project source.
- `VERSION` follows semver with release-candidate tags (currently `1.1.0`). Change it only as part of a release.

## Third-party products

Competitor research uses public pages read manually. Do not reverse engineer, decompile, scrape or benchmark services whose terms prohibit it (for example Paper and Claude). See `docs/research/paper-design-comparison.md`.
