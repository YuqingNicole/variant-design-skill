# Integration system dependencies · 2026-11-04

Branch: `codex/integration-system-dependencies`, following evidence PR #156. Scope: the integration plan's registered-system and adoption-state baseline under #19. No automatic framework adapter or cleanup ownership is implemented here.

## Negative baseline and fix

The integration source identity tracked the main design-system file but omitted extension bytes and the variant binding. A new real-helper regression prepared a plan, changed the registered extension, and observed integration write the fixture target instead of refusing. The pre-fix test failed with “Missing expected exception”; log: `/tmp/variant-integration-extensions-before.log`.

Plans and backup receipts now include registered extension hashes and any adoption binding. Current checks compare these with the prepared source identity before backup/writing and at the existing commit recheck. Old plans missing required fields are not patched: the caller keeps staging and prepares a new plan. A context without these optional fields retains its existing behavior. Paths keep the same project-root and symlink guards. No context migration, force flag, selection change or weaker target protection is introduced.

Rollback still concerns its own target files. It does not restore or delete a separately edited shared extension. Cooperative-lock and multi-file interruption limits remain unchanged; this is not an OS-wide exclusion guarantee or automatic discovery of unrelated imports.

## Local validation

- 9 integration unit tests passed, including 3 new cases for extension/binding drift, selection-independent receipts and rollback, old missing coverage, malformed paths and symlinks.
- 110 helper/grader tests passed; 4 package tests passed.
- 15 real Chrome loop cases passed (48.7s). The added case blocks stale integration, verifies the original target bytes and absent integration record, then opens the actual original file and exercises its button. Existing tests retain all their assertions.
- Loop typecheck passed; 67 website tests and the 239-route build passed; four final skill-link checks passed.
- `git diff --check` passed.

## Real-output follow-up

The preceding evidence branch's exact installed Codex ledger-pick run passed 20/20 checks at `4fbfb35`. Its original output will remain untouched. Next exercise this integration implementation's CLI against a disposable copy of that actual generated project: prepare/stage B, change only its registered extension, verify conflict and no target, then prepare a fresh plan, integrate and roll back. Record this host check separately; do not imply that the earlier Agent used this later integration implementation.

Exact PR CI and that host result are pending. #19 stays open for the real alias/provider/global-style matrix, cleanup ownership, full receipts and other shared dependencies. No production action, metadata update, account change or third-party message.
