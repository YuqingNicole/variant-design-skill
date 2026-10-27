# Evals

Runs the skill from this working tree in real agent CLIs on small fixture projects, then grades what the agent left behind. Use it before claiming that a change to the skill's text or helpers improved, or did not break, the user experience.

```sh
node evals/run.mjs                                   # every fixture × claude and codex
node evals/run.mjs --agent claude --fixture pulse    # one run
node evals/run.mjs --prepare-only --out /tmp/evals   # set up projects without running an agent
node evals/grade.mjs <project> --fixture pulse --transcript <run>.jsonl   # grade an existing project
node --test evals/grade.test.mjs                     # grader tests; no agent, no cost
```

Every run calls a real model: a Claude Code run has cost about $2–3 and 5–15 minutes. Runs go to a temporary directory outside the repository (`--out` to choose), with each transcript, the graded JSON and `summary.md`. Record conclusions in `docs/research/`; do not commit run output.

## What a run does

1. Copies `fixtures/<name>/project/` to a fresh directory, commits it as the baseline and runs `npm ci` when there is a lockfile.
2. Installs the skill files from this working tree (uncommitted changes included) at project level: `.claude/skills/variant-design` for Claude Code, `.agents/skills/variant-design` for Codex, the folders `npx skills add` uses.
3. Sends the fixture's prompt: the first-run prompt from `/docs`, plus a note that the run is unattended and must not start a long-running server.
   - Claude Code: `claude -p --setting-sources project,local`. Leaving out `user` stops a global `~/.claude/skills/variant-design` from shadowing the copy under test.
   - Codex: `codex exec -s workspace-write`, which has no network and cannot bind ports.
4. Grades the project.

## Checks

| Check | Fails when |
|---|---|
| `generated` | there is no `variant-output/.variant-context.json` |
| `delivery-check` | `scripts/delivery-check.mjs` reports an error |
| `not-selected` | `selectedVariant` is set, although the prompt asks not to pick |
| `project-untouched` | a baseline file changed or a file was created outside `variant-output/`, `.variant-work/` and the skill folders. Appending to `.gitignore` is allowed |
| `quality-gate` | `scripts/quality-gate.mjs` finds an error in the variants (generated preview bundles excluded) |
| `brand-kept` | brand-locked fixtures only: the lock was not recorded, or a variant file declares a font outside the locked fonts |
| `skill-under-test` | the transcript never reads the installed copy, or also references another copy |

Each result also reports `reading`: the skill files the agent asked to read (tool inputs and commands, with shell aliases such as `S=.claude/skills/variant-design` expanded) and their total words. It measures progressive disclosure and is not a pass/fail check. The 2026-10-27 baseline is in `docs/research/2026-10-27-eval-baseline.md`.

The checks are deterministic and cover promises, not taste. Whether the three directions are good, distinct and well recommended still needs a person to open the previews.

## Fixtures

| Fixture | Project | What it tests |
|---|---|---|
| `pulse` | Vite + React weekly analytics report | Brand lock from `src/tokens.css` |
| `harbor` | Vite + React members and permissions page | Exploration without brand constraints; destructive actions |
| `bakery` | Plain HTML and CSS bakery page, in Chinese | Output without a framework or build step |

A fixture is a `project/` folder and a `fixture.json` with `description`, `prompt` and optional `locked: {file, fonts}`. Keep fixtures small and written by us.
