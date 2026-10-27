# History: edits, undo and selection

Read this before any edit to an existing direction (a variation action, a zone edit, a fix after review), and for `undo B`, `pick B` or `recover`. Editing is not selecting: apply and undo set `activeVariant`; only the user's explicit pick runs `select` and sets `selectedVariant`.

## Prepare, apply, undo, select

Before generating any patch, prepare a **new, nonexistent** candidate directory from current output:

```bash
node <skill-root>/scripts/variant-history.mjs prepare variant-output B .variant-work/candidate-B
```

Keep all working files (candidates, change files, screenshots, backups) under one `.variant-work/` directory in the project root, never in the project's source folders or outside the project. Create it first; it contains project source, so do not commit it. The command copies all B-owned files and writes `.candidate-baseline.json` with their original bytes, SHA-256 digests, version, task/brand constraints and the registered design-system file digest. The project root defaults to the parent of `variant-output`; for nested output pass the actual project root as the final argument. `designSystem.file` is resolved relative to that root. Missing registered design-system files fail preparation.

Generate local patches **inside this prepared candidate**, preserving the same relative file paths for **all files owned by the target variant**. Do not modify its baseline or write the live artifact first. Write `change.json` with `summary`, optional `zone`, optional full `tokens` and `comparison` updates, and a `request` id naming the user's request. For a hero edit:

```json
{"summary":"Emphasize primary CTA", "zone":"hero", "request":"B-vary-subtle-hero-1"}
```

One user request should normally be one apply: inspect and fix the candidate before applying it. When one request needs several applies (marking zones first, or fixing a problem found after rendering), give them all the same `request` id. `undo B` then reverts the whole request at once, matching what the user asked to undo. Use a new id for every new user request.

```bash
node <skill-root>/scripts/variant-history.mjs apply variant-output B .variant-work/candidate-B .variant-work/change.json
node <skill-root>/scripts/variant-history.mjs undo variant-output B
node <skill-root>/scripts/variant-history.mjs select variant-output B
```

Apply first checks the prepared baseline against current version, owned files, file contents, entry, tokens, comparison, task constraints and the registered design-system file. Changes made directly in an editor are detected even without a version bump. Selection changes alone do not invalidate the candidate. It then validates unique ownership, snapshots all B files and B metadata, verifies snapshot persistence, then replaces the files and updates context. It rejects changes outside exact zone markers for scoped actions. A file may mark the same zone once in markup and once in styles (`/* zone:hero:start */` … `/* zone:hero:end */`); edits are accepted inside either pair. Owned files without the zone's markers must stay byte-identical. CSS overrides must stay in a marked zone; a local edit cannot alter shared root tokens. Keep the owned file set stable during one apply. To introduce a new owned file, explicitly register it with its initial content **before preparing a new candidate**. Registration after preparation invalidates that candidate.

For configuration-driven React pages, `/* zone:hero:start */` / `/* zone:hero:end */` also delimit a standard JS/TS configuration block. Keep shared components read-only during that local edit and compare the rendered non-target sections; preserving wrapper bytes alone cannot prove rendered scope.

The helper checks token metadata under a DS lock; it cannot prove that arbitrary CSS/JS obeys those tokens. Also compare the rendered fonts and token usage against `design-system.css`. Undo first checks that files and variant metadata still match the recorded post-edit state. If the user has edited them since, it refuses without changing live files. Undo restores files, tokens, and comparison together; version numbers advance to record the undo event. It does not change A/C or the selected winner. Saved snapshots are retained even after undo. Do not claim history exists until it has been written.

## Conflicts, legacy history, and recovery

History mutations use an exclusive `.variant-lock` directory. If another operation is active, wait for that operation to finish. After a crash, inspect the live files, context and snapshots before removing a stale lock; do not automatically steal locks.

Snapshots from before 1.1 do not record the post-edit baseline, so automatic undo refuses them rather than guessing whether later user edits are safe to discard. Recover either legacy or conflicting history into a new, separate directory:

```bash
node <skill-root>/scripts/variant-history.mjs recover variant-output B .variant-work/recovered-B
```

The parent directory must exist and the destination must not exist. This extracts the last undo snapshot's files and metadata, leaving live files and history unchanged. Compare the recovered candidate with current files; reconcile user edits into a new candidate before using `apply`. Snapshots support crash recovery; multiple file replacements are not a filesystem-wide atomic commit. The operation lock coordinates these helpers, not external editors.

## Stale candidates and baseline migration

A missing, invalid or obsolete candidate baseline is rejected before live writes. There is no force flag or command to retrofit a baseline onto existing candidates. Keep the old candidate for comparison, prepare a new directory from current output, and reconcile the intended change there. Original source bytes are retained as base64 in the old baseline for manual three-way comparison; do not restore them over live files without review.

The baseline is project/variant-specific and must remain local with its candidate. Do not publish it: it contains project source. Copying a candidate to a different project does not make it valid there. A successfully applied candidate cannot be applied again, including after undo, because the revision has advanced.

Preflight failures preserve output files, context and history and leave the candidate available. Preparation refuses existing destinations (even empty ones). If preparation fails partway, partial copies may remain, but no usable baseline is retained; inspect them and prepare another new directory.

The helper rechecks before snapshot/commit, but an external editor can still write after the last check. Its lock is cooperative, not an operating-system-wide lock; avoid editing the same files during commit. Multi-file process-crash recovery remains snapshot-based and manual; this change does not claim to eliminate that limitation.
