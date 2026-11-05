# Interrupted integration recovery · 2026-11-05

Scope: #19 I10 and the ordinary-write-failure requirement. RFC-017 adds a completion marker, guarded resumable recovery and a separately persisted backup-bound restore intent. It preserves strict rollback for completed integrations, legacy records, source/history/selection and unknown later edits. This is process-interruption recovery, not multi-file atomicity or power-loss durability.

## Implementation checkpoint

Actual helper/CLI tests inject I/O faults at the filesystem boundary and SIGKILL real child processes after actual renames. They inspect actual partial writes, retained locks/backups/intents and restored bytes. No integration result is mocked. The parent waits for each child to exit before manually removing its empty stale lock; the helper itself never steals a lock.

Covered: mid-apply death; all targets written but completion marker absent; interrupted strict rollback; second interruption during recovery; ordinary write error; failed automatic restoration; external edit during failed apply; completed and legacy records refusing recovery bypass; whole-inventory preflight on unknown edits/missing/created targets; corrupt backup bytes/duplicate/protected paths/symlink/mismatched intent; intent publication failure before writes; pending apply or restore rejecting delivery acceptance. Existing receipt rollback semantics continue to run against the real helper.

The first fault-test attempt had six harness failures: on macOS the fixture used `/var` while the helper correctly resolved `/private/var`, so exact fault target comparisons did not fire. The fixture now canonicalizes its root. Product path guards were retained. Focused corrective tests passed 29/29; the later expanded combined run passed 189 Node checks. Raw final log: `/tmp/variant-recovery-all-units.log`. Four package checks passed (`/tmp/variant-recovery-package.log`); website 67 tests/build 241 routes and MCP two tests passed. Full browser and installed-skill gates are still pending at this checkpoint. These mechanical tests alone do not establish improved real-agent experience or close #19.
