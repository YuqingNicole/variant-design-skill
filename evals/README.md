# Evals

Runs the skill from this working tree in real agent CLIs on small fixture projects, then grades what the agent left behind. Use it before claiming that a change to the skill's text or helpers improved, or did not break, the user experience.

```sh
node evals/run.mjs                                   # every fixture × claude and codex
node evals/run.mjs --agent dsh --fixture pulse       # DeepSeek Harness
node evals/run.mjs --agent claude --fixture pulse    # one run
node evals/run.mjs --agent claude --fixture pulse --install plugin   # install through the Claude Code plugin marketplace
node evals/run.mjs --prepare-only --out /tmp/evals   # set up projects without running an agent
node evals/grade.mjs <project> --fixture pulse --transcript <run>.jsonl   # grade an existing project
node --test evals/grade.test.mjs                     # grader tests; no agent, no cost
```

Every run calls a real model: a Claude Code run has cost about $2–3 and 5–15 minutes. Runs go to a temporary directory outside the repository (`--out` to choose), with each transcript, the graded JSON and `summary.md`. Record conclusions in `docs/research/`; do not commit run output.

## What a run does

1. Copies `fixtures/<name>/project/` to a fresh directory, commits it as the baseline and runs `npm ci` when there is a lockfile.
2. Installs the skill files from this working tree (uncommitted changes included) at project level: `.claude/skills/variant-design` for Claude Code, `.agents/skills/variant-design` for Codex and DeepSeek Harness, the folders `npx skills add` uses.
   - With `--install plugin` (Claude Code only), it instead copies the tree with `.claude-plugin/marketplace.json` into `<out>/marketplace` and runs `claude plugin marketplace add` and `claude plugin install variant-design@variant-design` with `--scope local` in each project, the way a user installs the plugin. Claude Code reads a plugin from a local directory marketplace in place (a GitHub install reads the same files from `~/.claude/plugins/cache/`), so `skill-under-test` expects `<out>/marketplace`. Claude Code also registers the marketplace in its own config and writes a copy under `~/.claude/plugins/cache/variant-design/`, so the runner refuses to start when a `variant-design` marketplace is already added, and removes both when the runs end. `--prepare-only` leaves the install in place and prints the command that removes it.
3. Sends the fixture's prompt: the first-run prompt from `/docs`, plus a note that the run is unattended and must not start a long-running server.
   - Claude Code: `claude -p --setting-sources project,local`. Leaving out `user` stops a global `~/.claude/skills/variant-design` from shadowing the copy under test.
   - Codex: `codex exec -s workspace-write`, which has no network and cannot bind ports. It also runs with `--ignore-user-config --ignore-rules --ephemeral -c features.hooks=false`, so the runner's own `~/.codex` setup stays out: on 2026-11-03 a run without them called the Computer Use MCP server on the host machine, waited on a hook and tried to update an unrelated plugin marketplace. Login still comes from `~/.codex`. These flags were checked with Codex CLI 0.166.0-alpha.5.1; an older CLI without them fails at once with `unexpected argument`, so update Codex before running.
   - DeepSeek Harness: `dsh headless --json`, the shipped headless profile from `~/.dsh/profiles/headless`, which uses the runner's own dsh login and model settings. dsh also lists the runner's `~/.agents/skills` in its catalog; the project copy outranks a same-name user copy, and `skill-under-test` still checks which copy was read. `--agent dsh` was checked with dsh 0.2.0-rc.2.
   - Neither CLI can skip the runner's global instructions (`~/.claude/CLAUDE.md`, `~/.codex/AGENTS.md`); keep them free of design guidance when you run evals, or note them in the record.
4. Grades the project.

## Checks

| Check | Fails when |
|---|---|
| `generated` | there is no `variant-output/.variant-context.json` |
| `delivery-check` | `scripts/delivery-check.mjs` reports an error |
| `not-selected` | `selectedVariant` is set, although the prompt asks not to pick |
| `project-untouched` | a baseline file changed or a file was created outside `variant-output/`, `.variant-work/` and the skill folders. Appending to `.gitignore` is allowed. New files under a `variant…` directory (a framework preview adapter such as `app/variant-preview/`) are listed as warnings |
| `quality-gate` | `scripts/quality-gate.mjs` finds an error in the variants (generated preview bundles excluded) |
| `brand-kept` | brand-locked fixtures only: the lock was not recorded, or a variant file declares a font outside the locked fonts |
| `skill-under-test` | the transcript never reads the installed copy, or also references another copy (another skill folder, or another cached plugin version) |

Each result also reports `reading`: the skill files the agent asked to read (tool inputs and commands, with shell aliases such as `S=.claude/skills/variant-design` expanded) and their total words. It measures progressive disclosure and is not a pass/fail check. The 2026-10-27 baseline is in `docs/research/2026-10-27-eval-baseline.md`.

The checks are deterministic and cover promises, not taste. Whether the three directions are good, distinct and well recommended still needs a person to open the previews.

## Fixtures

| Fixture | Project | What it tests |
|---|---|---|
| `pulse` | Vite + React weekly analytics report | Brand lock from `src/tokens.css` |
| `harbor` | Vite + React members and permissions page | Exploration without brand constraints; destructive actions |
| `bakery` | Plain HTML and CSS bakery page, in Chinese | Output without a framework or build step |
| `ledger` | Next.js App Router pricing page with a shared plans module and a client context provider | A framework without Vite: the preview needs a native adapter route; brand lock from `app/globals.css` |

A fixture is a `project/` folder and a `fixture.json` with `description`, `prompt` and optional `locked: {file, fonts}`. Keep fixtures small and written by us.

## Blind review

`docs/trials/blind-review.md` compares the skill with the same agent asked plainly for three directions. To build a review package:

```sh
node evals/run.mjs --agent claude --no-skill --out <plain-runs>     # control group: no skill, prompt in evals/blind/plain-prompt.txt
PLAYWRIGHT_CHANNEL=chrome node evals/blind/pack.mjs --skill <skill-runs> --plain <plain-runs> --out <package>
```

The package is an `index.html` with screenshots of the original page and both groups (desktop and mobile), their trade-off notes and recommendation, labelled X and Y at random. The answer key is written next to it as `<package>-key.json`; keep it from reviewers. `pack.mjs` uses the Playwright install in `tests/`.

