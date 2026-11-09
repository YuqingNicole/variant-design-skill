# Impeccable vs Variant Design: architecture comparison

Status: draft, 2026-11-09. Nothing in the skill or the site changes because of this file.

## What this is based on

Read for this comparison:

- The public home page of https://impeccable.style/ (fetched once; only its summary of sections, commands, hooks and install was read, not every sub-page).
- The installed skill, `~/.claude/skills/impeccable` (SKILL.md v4.8.1, the `reference/` folder, `scripts/` file names, and the first part of `reference/craft-floor.md`).
- Our own `SKILL.md`, `skills/`, `references/` and `scripts/`.

Not read: the Impeccable launcher binary, `scripts/data`, the detector's rules, the hook implementation, the Chrome extension, and most `reference/*.md` files. Claims about those are marked "not checked".

Earlier we only copied 7 of its reference files (`NOTICE`, commit `6d8c851`) and compared it as a competitor. Our router and load-map structure was not derived from it.

## Side by side

| | Impeccable | Variant Design |
|---|---|---|
| Unit of the skill | One skill, one user-facing entry (`/impeccable <command>`) | One skill, five sub-routes behind a router (`skills/*/ROUTE.md`) |
| Routing | A table of ~24 commands; no argument shows a context-aware menu (`routing.md`); it never auto-runs a command | A request-to-route table; one route is read, a second only when needed |
| Loading | SKILL.md (11.6 KB) then the command's reference, then `craft-floor.md` right before any UI edit | SKILL.md (4.8 KB) then a ROUTE.md with a load map, then files at the step that needs them |
| Persistent context | `PRODUCT.md` (users, goals) and `DESIGN.md` (visual system) in the project, written by `init` and `document`; read by a launcher command | `variant-output/.variant-context.json` (schema v2) plus the confirmed design system (`ds`) |
| Surface model | Four modes: Persuade, Operate, Read, Experience, chosen per surface | Two modes: exploration and brand-locked; domain references per product type |
| What it produces | Edits to the existing frontend, in place | Three comparable directions A/B/C, then a chosen one integrated with rollback |
| Undo and safety | Not checked | Snapshot before write, stale-candidate rejection, one request = one undo, rollback refuses on later edits |
| Verification | Detector with 62 rule checks that runs in code; optional `PostToolUse` and `Stop` hooks feed findings back to the agent | `quality-gate.mjs --strict`, `delivery-check`, browser verification; run by the agent on request, no hooks |
| Runtime helper | A self-contained binary launcher, downloaded on first run, no Node needed | Dependency-free Node 22+ scripts that ship in the skill |
| Sub-agents | Four (asset producer, documenter, finish reviewer, manual-edit applier) installed under `~/.claude/agents` | None |
| Live iteration | `live` and `generate`: pick an element in the running app and iterate on variants in the browser | A preview server and the A/B/C history helpers |
| Distribution | `npx impeccable install/update`, Claude Code marketplace, Codex plugin, `npx skills add`, 12 tools listed; plus a Chrome extension and a CLI for pull requests | Claude Code marketplace, Codex plugin, clone into the skills folder |
| Site | Home, Designing, Gallery, Docs, Slop (rule catalog), Live, Changelog, FAQ, Privacy, Trust Center, case study | Home, library, inspiration, docs, compare, changelog, lab |

## Where the architectures are close

- Progressive loading: neither inlines everything; both read a task-specific file after the router.
- Brief over taste: Impeccable's "the brief wins" matches our precedence rule (user constraints first).
- A refusal list of generic AI patterns: `craft-floor.md` "Refuse" and our `quality-gate` and `style-audit.md` do the same job.
- Verify on the rendered result at the sizes it ships at: both say it.

## Where they differ, and what could be worth borrowing

Each item is a candidate, not a decision. None is scheduled.

1. **A named, per-surface mode (Persuade / Operate / Read / Experience).** It decides how much expression a surface gets. We have domain references but no single switch that says "this is a docs page, restraint wins". Cost: a short section in `SKILL.md` or the generate route. Check first: do our eval fixtures show over-decorated app screens? If not, skip.
2. **A "craft floor" read right before any UI edit.** Ours is spread across `code-output.md`, `quality-baseline.md` and `style-audit.md`. A single short pre-edit checklist could replace some repetition. Risk: it adds one more file to every generate run; the harbor eval already reads 11 files.
3. **PRODUCT.md and DESIGN.md as human-readable project context.** Our context is JSON, which is better for the helpers and worse for a person to read or edit. A generated, readable `DESIGN.md` from the confirmed `ds` would be additive. It must not become a second source of truth.
4. **Hooks that run the checks on every edit.** This is the biggest behavioural gap: our gate runs only when the agent chooses to. Hooks change the user's agent settings, which the maintainer declined when installing Impeccable (no hooks). Opt-in only, and the first step would be measuring how often agents skip the gate in eval runs.
5. **A command menu when no argument is given.** Our router has no "what can you do here" answer. Low cost, small gain.
6. **An installer (`npx`) and update command.** We have `check-update.mjs` only; install is clone or plugin. Cross-tool coverage is the distribution gap, not an architecture one.
7. **Sub-agents for review.** A separate finish reviewer that sees the result without the author's reasoning matches how we already ask for unanchored review. Not checked: how Impeccable invokes it and what it costs.

## Where we are ahead, and should not trade away

- Three comparable options with shared criteria; this is the product, and Impeccable's `generate` is element-level variants in a live browser, not whole-direction comparison.
- The history helpers and their invariants (snapshot first, never overwrite unseen work, no force flag).
- A smaller always-loaded entry (4.8 KB against 11.6 KB) and zero-dependency helpers.
- Licensing is simple: our own text is MIT; only the 7 copied files are Apache-2.0.

## Risks of copying

- Its design rules and prose are Apache-2.0 with a NOTICE requirement; paraphrasing its structure is fine, copying files needs the same treatment as the 7 existing ones.
- It is a larger surface (24 commands, a binary, hooks). Taking the whole shape would break our small-entry rule and the helper invariants.

## Suggested order, if the maintainer wants any of it

1. Measure first: in eval runs, how often does the agent skip `quality-gate` or load fewer files than the route names? (No code change; reads existing run logs.) This decides whether item 4 matters.
2. Try item 1 as a draft section and run the `harbor` and `pulse` fixtures before and after.
3. Prototype item 3 as an export from `ds`, not a new input.

## Open questions for the maintainer

- Is cross-tool install (`npx`) a goal for this skill?
- Are hooks acceptable as an opt-in feature, given the earlier "no hooks" choice for Impeccable?
- Should we read the Impeccable detector's 62 rules against our `quality-gate` checks next? That would be a separate comparison; it is not done here.
