# Evals

Runs the skill from this working tree in real agent CLIs on small fixture projects, then grades what the agent left behind. Use it before claiming that a change to the skill's text or helpers improved, or did not break, the user experience.

```sh
node evals/run.mjs                                   # every fixture × claude and codex
node evals/run.mjs --agent dsh --fixture pulse       # DeepSeek Harness
node evals/run.mjs --agent claude --fixture pulse    # one run
node evals/run.mjs --agent claude --fixture pulse --install plugin   # install through the Claude Code plugin marketplace
PLAYWRIGHT_CHANNEL=chrome node evals/run.mjs --agent codex --fixture premium  # one refinement, with independent host browser evidence
node evals/run.mjs --agent codex --fixture harbor-chain   # the multi-turn chain: six fresh processes in a row
node evals/run.mjs --agent codex --fixture harbor-chain --turns generate,pick   # only the turns named
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
| `premium` | Existing self-authored light-brand HTML catalogue | One B refinement: real before/after style budgets, unchanged brand/task/A/C/selection, one undo |
| `ledger-pick` | The brand-locked `ledger` project, two turns | Generation and pick preserve brand naming and validate only generated extension layers |
| `harbor-chain` | The `harbor` project, six turns | The loop after generation: pick, design system, apply, undo, and new work on the confirmed system. See below |
| `native-vite` | Workshop Ledger: original alias/define, provider, role-aware business hook, global CSS and local asset | Two-turn fixture with host preview/configuration/dependency checks and independent history/integration/rollback replay. Real installed-skill Agent acceptance is separate from harness regressions. |

A fixture is a `project/` folder and a `fixture.json` with `description`, `prompt` and optional `locked: {file, fonts}`. Keep fixtures small and written by us.

### Multi-turn fixtures

A fixture with `turns` (and optionally `project`, the name of the fixture whose project it reuses, and `note`, appended to every prompt) runs one fresh agent process per turn in the same project, the way a user comes back to it later. Nothing carries over between turns except the files, so a turn passes only when the skill's state in the project is enough to continue. They run only when named with `--fixture`, because each costs several runs: a Claude Code chain costs about six times one run.

After each turn the runner records a snapshot (the context, a hash of every file under `variant-output/`, delivery-check, and how far each variant is from a confirmed design system), and each turn is graded against the snapshots before it. A failed turn does not stop the chain; later turns are graded on what it left. Every turn reports `<turn>:delivery-check`; `generate` and `component` also report `<turn>:quality-gate`. `project-untouched` and `skill-under-test` (over every turn's transcript) are checked once at the end.

| Turn | Prompt | Fails when |
|---|---|---|
| `generate` | the `harbor` prompt | `generated`: no context; `not-selected`: a direction was selected |
| `pick` | `pick B` | `picked`: `selectedVariant` is not B; `pick-is-not-an-edit`: a variant's files or B's version changed; `ds-drafted`: `design-system.css`, `design-system-preview.html` or `DESIGN.md` is missing from `variant-output/`; `ds-waits-for-user`: `designSystem` changed before `ds confirm`; `ds-contrast`: a generated pair fails 4.5:1 or remains unverified; `ds-layers`: a generated component token is not a semantic/brand alias; `ds-decisions`: `design-system.css` does not open with a comment naming its decisions; `ds-use-notes`: a `--color-*` token has no trailing `/* use: … */` note |
| `confirm` | `ds confirm` | `ds-confirmed`: not confirmed, `source` is not B, or the file is missing; `ds-registered`: no current helper-registered identity and pending binding; `tokens-exported`: no readable `design-system.tokens.json`; `confirm-is-not-an-edit`: a variant’s files/tokens/version/undo changed or the selection moved |
| `apply` | `apply ds B` | `system-adopted`: no current applied binding; `applied`: B's version did not rise, or B is not active and selected; `apply-stays-in-B`: A, C or the design system changed; `drift-reduced`: B uses as many colors and lengths outside the system as before (zero passes) |
| `undo` | `undo B` | `undone`: B's files, token metadata or binding differ from the snapshot before `apply ds B`, or B is no longer selected; `undo-stays-in-B`: A, C or the design system changed |
| `component` | an invite-member dialog on the confirmed system | `component-built`: no new HTML, CSS or component file in `variant-output/`; `component-on-system`: a new file uses a hex color or a spacing, type or radius length the system does not define, or references a primitive (`--p-*`) or another component’s tokens outside its declared owning CSS; `component-leaves-variants`: a variant, the design system or the selection changed |

`drift-reduced` and `component-on-system` use `systemDrift` from `scripts/delivery-check.mjs`: hex colors and `padding`, `margin`, `gap`, `font-size` and `border-radius` lengths, not every value a page uses.

## Blind review

`docs/trials/blind-review.md` compares the skill with the same agent asked plainly for three directions. To build a review package:

```sh
node evals/run.mjs --agent claude --no-skill --out <plain-runs>     # control group: no skill, prompt in evals/blind/plain-prompt.txt
PLAYWRIGHT_CHANNEL=chrome node evals/blind/pack.mjs --skill <skill-runs> --plain <plain-runs> --out <package>
```

The package is an `index.html` with screenshots of the original page and both groups (desktop and mobile), their trade-off notes and recommendation, labelled X and Y at random. The answer key is written next to it as `<package>-key.json`; keep it from reviewers. `pack.mjs` uses the Playwright install in `tests/`.


Draft system checks use the CSS captured at that turn, not the final CSS left after later turns. Brand-only contrast limitations remain warnings; extensions need explicit pairs or surface notes. `ledger-pick` permits a brand extension with no new colors rather than requiring it to redefine the brand.

### Premium fixture evidence

`premium` starts with existing A/B/C artifacts and a brand file. Before the single refinement turn, the host records an initial snapshot and measures the real page at 1440×900 and 390×844, then places the genuine before-count samples under the project's `.variant-work/`. After the Agent finishes, host Playwright independently measures the result, saves screenshots/raw samples beside the run, exercises all six records/search/combined filters/save/unsave/saved-only controls, and verifies one actual undo in a disposable copy. It never grades the Agent's own claimed samples. Use a fresh output directory; existing browser evidence is refused. Chrome/Playwright failure is not a budget pass.

The grader requires final default budgets, a lower combined sizes/text-colors/radii inventory at both widths, readable heading/body hierarchy and no overflow. Computed body/heading families, page backdrop and primary-action fill must retain the initial brand; this samples explicit brand anchors, not every pixel or all CSS semantics. A/C and the original brand remain unchanged, selectedVariant stays unchanged, and the recorded B refinement is reversible in one undo. A real premium run must read the adjective translation and action references. Nonzero/timed-out Agent processes are reported as incomplete, even if partial output exists. Counts and fixture passes do not prove aesthetic quality; review the screenshots.

### Native Vite evaluation in progress

`native-vite.mjs` measures this self-authored fixture through its own installed Vite and TypeScript. The runner independently records the original baseline, each turn's previews, and a dependency probe in a disposable copy. The probe changes the original JSON labels, provider-derived labels and a global CSS marker; copying a provider while importing the original JSON still fails. It leaves the Agent's project unchanged. This is a bounded task contract, not a generic evaluator for arbitrary apps.

The host checks A/B/C at 1440 and 390 widths: identity, all original records/currency/roles, keyboard access, search and combined empty-state recovery, owner payment state, viewer restrictions, state across workspace changes, computed brand anchors, the actual local SVG, overflow, comparison links and runtime/resource errors. A missing implicit `/favicon.ico` is recorded separately as an optional browser warning; other resource failures remain errors. SVGs may be transformed to data URLs, so the rendered logo is compared with the original asset's actual Vite import rather than a hardcoded URL spelling. HTTP 200 alone does not prove an image decoded.

Direction identity observes every visible marker. Nested mount/component markers with the same expected ID are valid; a B-labelled wrapper around a visible A component is a conflict. A marker is part of this fixture's explicit contract and does not replace reviewing the generated/staged source and actual design.

Search uses the preserved accessible name and real editing/filter behavior, accepting both text and search inputs. Role/payment labels are case-insensitive; the underlying records, totals, permissions and state transitions remain mandatory. The middleware host binds HTTP and Vite's actual WebSocket to the same owned ephemeral listener and disables file watching for stable observations. It records real connected frames and sanitized socket URLs; it does not filter out connection errors or depend on another local server's default HMR port.

Typecheck runs list their actual covered files; omitting generated components fails even if `tsc` exits zero. Both original and isolated builds must emit their expected HTML entries. Dev and build run in separate child processes to isolate Vite/plugin environment changes. A Node HTTP listener owns an ephemeral loopback port around Vite's middleware API; only that child handle is stopped, with its exit log preserved. No Agent-supplied shell command string is executed by the host. Configurations remain executable project code, as with an ordinary Vite build; this is not a sandbox for untrusted plugins.

Manifest paths must be project relative, exist and contain no symlinks; isolated adapters/configurations stay under `.variant-work/`. Raw reports bind source/manifest/adapter hashes, actual tool versions, command arguments and exit codes, screenshots, URLs, errors and shutdown evidence. Evidence directories must be fresh and outside the Agent project. Missing or partial browser evidence fails in both chain grading and the standalone grader.

Run the real-browser regression without a model call:

```sh
cd tests && PLAYWRIGHT_CHANNEL=chrome npx playwright test native-vite-eval.spec.mjs
```

`native-delivery.mjs` first inspects the generate-turn hashes, continuous apply/undo snapshots, restored original files, plan/staging/backup identity and separate check/rollback log files. It then works exclusively in a copy: prepares a fresh candidate from current context, replays the recorded temporary B bytes and actually observes the heading ending in `— Draft`, invokes one real undo, prepares a new integration plan, applies the retained staging, opens the actual original entry with its original provider/configuration and requires B identity plus all baseline behavior/brand/build checks, then rolls back and verifies source/variant/selection preservation. It does not edit an old plan's absolute paths. Hashes of the complete Agent source tree before/after prove the host left it unchanged (installed modules, Git and build output are excluded).

Separate guard copies introduce controlled later edits and require actual undo, stale integration apply and rollback refusal without discarding those bytes. Reports distinguish the Agent's original records from host API calls, save helper hashes and per-call timestamps, and preserve both browser captures and original check logs. The log command strings are never executed as host instructions; a self-reported successful receipt alone cannot make the replay pass. Missing, malformed or partial replay observations fail closed.

The delivery manifest uses `schemaVersion:1`, project-relative `plan`/`staging`, `integrationId`, and `changedFiles:["src/App.tsx"]`. `beforeChecks` and `afterChecks` each contain two entries with `tool` (`typecheck` or `build`), `command`, package semver `version`, `exitCode` and distinct `.variant-work/` `log` files. `rollback` is `{completed:true,log:".variant-work/..."}`. The integrated app must expose `data-native-variant="B"`; the host checks what actually rendered rather than trusting the receipt's B label.

**Harness regressions do not prove real Agent acceptance or design quality.** RFC-011 requires at least one real installed-skill two-turn run and separate visual review. Run that explicitly with `PLAYWRIGHT_CHANNEL=chrome node evals/run.mjs --agent codex --fixture native-vite`; it costs actual model usage. This evaluation does not add universal framework support or automatic preview cleanup.

### Native phase archives

The native chain now writes `<fixture>-<agent>.phases/baseline`, `generate` and `deliver` directly, before host observations and before a later turn can edit the project. Each fresh phase directory contains `source/`, the complete host grader `snapshot.json`, a completion `archive.json` and durable `receipt.json`. The receipt plus its own hash is retained in `measurements.native.archives`; turn receipts also appear in the result's `turns`. A host interruption before the final result does not discard the already-written phase files. Archive failure is recorded with the other diagnostics and fails overall acceptance. Existing and incomplete destinations are preserved and never reused.

Source capture includes hidden context/history, staging, manifests and installed skill text, along with ordinary files, original executable modes and empty directories. It explicitly excludes `.git`/`node_modules` at any depth and root `dist`; actual excluded paths are listed. This is a source archive, not an installed-dependency or filesystem image. Raw archives contain project source and stay outside Git.

`evals/phase-archive.mjs` exports `createPhaseArchive`, `verifyPhaseArchive` and `materializePhaseArchive`. Creation binds every included file's SHA-256/size/mode and the source directory set, validates the grader snapshot against the copied context/owned-file hashes, and checks the source tree again before writing its completion receipt. Receipts anchor manifest/snapshot/source digests. Verification rejects extra or missing files, permission/type changes and symlinks; it scans archived source without applying exclusions again, so adding a new ignored-looking dependency directory is still tampering. Malformed project context is preserved as diagnostic data, without migration or a product-validity claim.

Materialization only copies verified bytes into a new directory outside both original project and archive. It does not install dependencies, execute commands, alter old integration plans, overwrite a working project or modify the archive. Consumers must install from the retained lock and record actual tools before runtime reobservation. The helper's write-once contract and tamper detection do not claim OS-level WORM or an atomic filesystem snapshot.

Native grading adds three archive gates. Each phase must have a verified receipt, the expected phase ID, and matching hashes for every corresponding host observation fingerprint. Old reports remain historical evidence under their original gates; missing archives are never silently synthesized or replaced by a later phase's files. New native runs require these gates in addition to the existing browser/undo/integration checks.


### Native preview ownership and cleanup

`node evals/run.mjs --agent codex --fixture native-vite-cleanup --out <new-directory> --jobs 1` reuses the native Vite project in a separate three-turn case. Generate prepares absent adapter paths and seals real ownership; delivery retains the original two-turn browser/history/integration gates. After delivery capture/replay, the host independently verifies the current native ownership group, complete adapter coverage, baseline absence and installed helper bytes. It appends a later user edit to one real adapter and creates an unowned note. Cleanup must use the real helper, remove matching adapters and preserve the edit, note, all original files and the entire variant-output tree. Cleanup does not start or kill servers.

The host records controls before the third CLI turn and observes actual files and complete cleanup backups/results afterward; Agent success text cannot substitute. A fourth direct source archive captures the cleanup phase. Seven cleanup gates plus the third turn's normal process/delivery/brand checks bring the complete case to 58 checks. Original baseline/generate/deliver browser observations remain bound to their pre-cleanup archives; intentionally removed previews are not recaptured as if still present. Missing ownership, changed adapters before the host control, missing backups, deletion of user files or missing cleanup archives fail. This is explicit opt-in model usage; the default fixture matrix is unchanged. Handwritten host regressions do not count as a real CLI result.
