# History: edits, undo and selection

Read this before any edit to an existing direction (a variation action, a zone edit, a fix after review), and for `undo B`, `pick B` or `recover`. After a successful `select`, derive the design system from the picked direction: `skills/variant-design-system/ROUTE.md` → Step 1b. Editing is not selecting: apply and undo set `activeVariant`; only the user's explicit pick runs `select` and sets `selectedVariant`.

## Prepare, apply, undo, select

After a system edit, rerun `ds-check.mjs` on the generated file and any extensions, with `--brand <file>` for an existing brand lock. Missing or unresolvable contrast pairs remain unverified; component tokens must alias semantic tokens, not primitives or other components. Regenerate the DTCG file in its existing format after `ds confirm` or `ds edit`. These read-only checks do not select, apply or undo a direction.

Before generating any patch, prepare a **new, nonexistent** candidate directory from current output:

```bash
node <skill-root>/scripts/variant-history.mjs prepare variant-output B .variant-work/candidate-B
```

Keep all working files (candidates, change files, screenshots, backups) under one `.variant-work/` directory in the project root, never in the project's source folders or outside the project. Create it first; it contains project source, so do not commit it. The command copies all B-owned files and writes `.candidate-baseline.json` with their original bytes, SHA-256 digests, version, task/brand constraints, registered main/extension file digests and any binding. The project root defaults to the parent of `variant-output`; for nested output pass the actual project root as the final argument. `designSystem.file` and extensions are resolved relative to that root. Missing registered system or extension files fail preparation.

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

Rebuild static previews after apply or undo. If React uses an isolated bundler, retain the same original project root and `--vite-root` argument described in `references/workflow/preview.md`.

Preview rebuilds use separate ownership receipts and preserve later user edits; history apply/undo never grants ownership of adapters or selects a direction. On a preview conflict keep the conflicting files and receipt, then follow the fresh-path workflow in `references/workflow/preview.md`. File cleanup uses that receipt, not the variant's owned source list or recursive deletion.

Integration handoffs use the separate immutable records in `.deliveries/` (`references/workflow/delivery-receipt.md`). Edits/undo may stale their recorded version; integration rollback retires their current verification. Preserve the receipts and referenced backups/reports. They do not replace history or authorize selection, cleanup or forced recovery.

Checker implementation changes also stale existing observations. A shared online/CLI strict gate is static-only; retain the recorded policy and runtime gaps and rerun evidence rather than relabelling older reports after a checker update.

After shared imports/resources, compiler inputs or reviewed dependency-resolution facts change, rerun artifact verification; an owned file's unchanged bytes do not keep its old observations current. Integration preparation reads that closure again. This does not replace the history helper's own immediate candidate/undo baselines or change selection.

Before a scoped edit, record representative non-target behavior with the browser plan in `references/workflow/artifact-verification.md`, then rerun the same assertions after applying. Byte preservation alone does not prove rendered behavior. Retain pre-edit project-check failures so delivery can distinguish identical prior diagnostics from new or changed errors.

Project integration uses the same `.variant-lock` and a separate prepared source/target baseline. See `skills/shared/export.md` before generating integration files. Candidate preparation for edits does not replace integration preparation.

Interrupted integration/rollback uses the guarded `recover` command in `skills/shared/export.md`, not variant undo. Confirm a crashed process has stopped before removing its empty stale lock; never steal it. Keep integration backups and `.integrations/recovery/` intents. Unknown target contents refuse restoration; a completed integration still requires strict rollback preflight. Recovery preserves variant history and selection.

Rebuilding the comparison after an edit or undo retains the preview-first layout and expandable direction details; expanding details or switching viewport does not select a direction.

## Confirm and apply a design system

After explicit `ds confirm`, write the approved definition (file, fonts, optional source/extensions) to `.variant-work/system-confirm.json` and run `variant-history.mjs confirm-system variant-output .variant-work/system-confirm.json`. It verifies a context backup, registers the main/extension identity, and marks the picked source pending without editing its files, tokens, version, undo or selection. Do not hand-edit context to claim adoption. Existing brand files and fonts stay locked.

For explicit `apply ds B`, prepare a new candidate as above, align its code and complete token record with the confirmed system, then run `variant-history.mjs apply-system variant-output B <candidate> <change.json>`. The JSON uses the usual summary/request/optional zone, with fonts exactly matching the confirmed list and colors resolving in that system. It is a constrained adoption operation, not a force flag; ordinary apply still rejects token changes. A current registered identity is required. Unsupported color records must be resolved before this operation, not approximated. Undo restores code, tokens and binding together.

Candidate baselines now cover every design-system extension and any binding. Artifact verification also fingerprints these automatically; prior reports become stale on their changes and must be rerun. Integration preparation binds extension content and the variant binding too; old plans missing this coverage are rejected and must be prepared again. A legacy baseline without extension coverage is refused explicitly; keep it for comparison and prepare a new one. System changes invalidate pending/applied bindings until the current system is explicitly approved and registered again. A pending generated source is reported as not yet adopted; it is not certified against the future font/color set. Legacy contexts without a binding retain strict checks.

Before a scoped edit, derive/record a runtime baseline with `references/workflow/runtime-plans.md` when tools are available. The edit/undo stales the old bundle; after semantic review seal a new comparison against the original measured actions/expectations. Do not rewrite a baseline to match the new output. Preserve plan bundles and report input hashes; they neither authorize selection nor replace content snapshots.

When reporting failed project checks, preserve actual structured diagnostics and compare them individually using `references/workflow/artifact-verification.md`. Keep original logs and old/new classifications; an observed-before failure still fails and never establishes delivery acceptance.
