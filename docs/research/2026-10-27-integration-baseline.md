# Integration baseline follow-up — 2026-10-27

Issue #19: integration previously took backups only when applying staged files. A source/target edit during staging could therefore be overwritten without a conflict. Preparation now records source revision, owned bytes, task/brand constraints, design-system content, and every intended target's content or absence. Apply rejects drift and a changed target set. Plans live in `.variant-work/`, are created exclusively, and share the history lock with apply/rollback.

## Checks actually run

- `node --test scripts/*.test.mjs`: 52 passed, including six integration cases.
- `python3 scripts/plugin-package.test.py`: two passed.
- `git diff --check`: passed.

Regression cases cover edited source, version drift, target edits/deletion/creation, staging membership changes, missing plans, duplicate preparation, selection-only changes, protected paths, cooperative locks, backup/rollback and later user edits.

## Real generated HTML project

The Codex bakery run recorded in `2026-10-27-runtime-evidence.md` generated a real HTML/CSS/JS B direction. A manual follow-up adapter prepared five target files before staging: `index.html`, direction CSS, shared app/data JS and shared brand CSS. It integrated them, opened the real project entry with Chrome, verified the edited heading and invalid-phone form feedback, then rolled back and undid the candidate hero edit.

Integration ID: `2026-10-27T09-25-42-853Z-B`. The record retains source file hashes, revision, target before bytes, actions and after hashes. Source, reports and backups remain in the throwaway fixture, not this repository.

## Limits

External editors do not honor the helper lock; a final-check race remains possible. Crash recovery across several files is not globally atomic. Shared dependencies other than the registered design system are not automatically discovered by the integration plan. The prior browser evidence mechanism can track explicitly declared dependencies separately.

This covers the HTML flow and core conflict semantics. It does not complete #19's real Vite alias/provider/global-style matrix, preview cleanup ownership, or comprehensive revision-bound handoff receipts. Keep #19 open for those items.
