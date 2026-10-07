# Release gates — Variant Design for Codex

Target: a person opens an existing project, installs the plugin, obtains three meaningful options, refines one without damaging other work, and integrates working output. “200%” means repeatable evidence, not a numerical quality claim.

## Implemented and locally verified

- Full distributable plugin with stable name, RC version, listing metadata and square icons.
- Reproducible ZIP; checksum verification and fresh-directory unpack smoke test.
- Installed-path comparison, scoped apply and undo execute outside the source checkout.
- Undo detects external file/metadata edits; sequential undo works with increasing revisions.
- History helpers coordinate mutations with a lock; conflicting/legacy snapshots recover to a separate new directory.
- Previous real React landing project and regression suite cover brand consistency, scope, responsive preview and reduced motion.

## Required before public submission

1. **Fresh plugin installation:** install through the actual plugin manager in a clean test environment; confirm entrypoint discovery and all relative resources; repeat after an upgrade. Pending. Unpack smoke is narrower evidence.
2. **Real project matrix:** run one new HTML project, one existing Vite/React brand-locked project, and one existing Next/router/provider project. Record generated files, preview URLs, existing-check results, functional behavior and boundary preservation. Only the real Vite landing case has prior evidence; Next is not verified.
3. **Cold-start usability:** observe a first-time user's path from installation through comparison, edit, undo and integration without manual imports or unexplained commands. Record where they need help. Pending.
4. **Integration recovery:** general export into an existing project must back up overwritten targets and detect edits before rollback. The landing-specific exporter exists; generic framework integration remains agent-authored and needs real-project evidence.
5. **Resilience:** exercise process interruption between writes and manual snapshot recovery, multi-file conflicts, missing dependencies and invalid context. Current lock coordinates helpers, not external editors; process-crash recovery is documented but not fully tested.
6. **Submission:** verified developer identity, accurate final listing, complete ZIP, successful platform metadata/skill checks and applicable review. Pending; do not publish before these gates.

## Next iteration order

First close install/discovery and upgrade evidence. Then run the project matrix and repair observed failures. Then record the full first-use demo and prepare the final submission. Keep the website as proof of actual work; do not expand into a hosted generation service for this Codex release.

## Test record for this candidate

Local package test and seven history/preview/scanner tests pass. Four website Node tests pass. CI repeats package/history tests and existing browser suites. Runtime tests are not a visual quality score. No public upload or policy attestation has been made.
