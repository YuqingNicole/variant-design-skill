# Changelog

## 1.1.0 — 2026-10-27

The skill now works inside an existing project from discovery to integration, and keeps the user's work safe at every step.

### Project-aware workflow
- Read-only project discovery before generating (`scripts/project-profile.mjs`), and task briefs bound to that profile with runtime observations (`scripts/design-task.mjs`).
- Design references recorded in the brief with their reuse terms. Direction cards from the Variant Design library convert into those records (`scripts/direction-card.mjs`).
- A delivery check before presenting A/B/C (`scripts/delivery-check.mjs`): three registered directions with distinct trade-offs, a shared task contract, a recommendation that is not a selection, and an intact design-system lock.

### Safe edits and integration
- Candidates carry a content baseline; stale candidates and edits outside a zone are rejected (`variant-history.mjs prepare` / `apply`).
- One user request is one undo, even across several applies.
- `variant-integrate.mjs` backs up every target before integrating a direction and refuses to roll back files edited afterwards.
- Version-bound artifact verification records which checks ran against which revision.

### Previews
- React previews mount from the project's own Vite; `react-preview.mjs --static` builds previews that open without a server, for sandboxed agents.
- Fixed a static-preview bug that corrupted bundled code containing `$&`, `$$` or `` $` ``.

### Skill text
- Loads by phase. The router is a route table plus shared rules; the generate route opens with a load map. Variation actions, zone edits, history, previews, and export and integration are separate files, each read only when that step comes up. `code-output.md` no longer forces the interaction pattern libraries on every run.
- References grouped by role: `workflow/`, `sources/`, `domains/`, `design-system/`, `ux/`, `tasks/`.
- The quality gate skips generated preview bundles (`_static/`, `_preview/`), so a whole `variant-output/` can be scanned in strict mode.
- Removed transcribed third-party "community examples" from the domain references.
- Only the root `SKILL.md` declares a skill, so Codex and `npx skills` no longer register sub-workflows as broken standalone skills.
- Component handoff specs and web interface checks.

### Install
- `npx skills add YuqingNicole/variant-design-skill -a claude-code -a codex` installs the complete skill.

### For contributors
- `evals/run.mjs` runs the working tree in Claude Code and Codex on fixture projects and grades the result.
- `scripts/skill-links.test.mjs` checks that every file the skill names exists and every reference is reachable.

Upgrading: `git -C <install path> pull --ff-only` for a Git clone, or `npx skills update variant-design`. The update check now prints the `npx skills` command for installs without `.git`. Project files in `variant-output/` are unchanged by an upgrade; context schema stays v2.
