# Verification evidence tied to an artifact

Verification is scoped evidence, not a quality score or a promise that the whole product is ready. The HTML model audit and CLI share `scanSource`; HTML audit output explicitly says static-only and runtime unverified. A suppressed focus outline requires browser review; static rejection is conservative and does not prove that every alternative focus indicator is invalid.

## Record static findings

```sh
node <skill-root>/scripts/artifact-verification.mjs run <output> B [config.json]
node <skill-root>/scripts/artifact-verification.mjs status <output> <report-file>
```

Configuration may name `projectRoot` (default: output parent) and `dependencies` (explicit relative project file paths). List imported shared source, global CSS, routing/provider configuration and relevant build configuration. The registered design system and existing package/lock manifests are tracked automatically. Dependency discovery is not automatic: unlisted imports and external resources remain outside coverage.

`run` captures owned-file contents, version, entry, tokens, comparison, task/brand constraints and dependency digests before checking, and checks identity again afterward. It writes an immutable report under `.verification/<variant>/`. No browser or typechecker is run by this CLI command, so its runtime checks are **unverified**, not passed. Exit codes: 0 = recorded checks passed within their scope; 2 = failed, stale or unverified; 1 = invalid operation. Keep reports local; diagnostics can contain source excerpts.

Always call `status` before using a report for delivery. A raw saved JSON result does not establish current validity. File changes without version increments, dependency changes, metadata drift or apply/undo revision changes invalidate old evidence. Selection alone does not. Runtime environment changes require a fresh run even if files are unchanged; the tool cannot independently discover every environment change.

## Browser/project adapters

The exported asynchronous `verifyArtifact(root, id, options, runChecks)` captures the identity **before** calling the adapter. The adapter must run new checks during that callback, not import observations made earlier. It must also confirm that the preview has finished rebuilding and is serving the captured artifact; loading an old dev-server transform does not verify current source. Missing observations or runner errors remain unverified. Returned checks use these IDs:

- `brand`: observed computed fonts/token use on named elements against the locked system.
- `keyboard-focus`: actual keyboard navigation; visible outline or a verified alternative indicator. CSS keyword presence is insufficient.
- `reduced-motion`: initial reduced-motion and switching the preference while animation runs, including JavaScript loops.
- `scope-preservation`: representative non-target layout and functionality against a recorded before state.
- `project-checks`: project typecheck/build commands with pre-existing failures distinguished from new failures.

Each check requires `id`, `status` (`passed`, `failed`, `unverified`, `not-applicable`) and a concrete `reason`. Observed passed/failed checks also require `tool.name`, `tool.version`, `environment` and `evidence` entries identifying observations or logs. Unknown/not-applicable checks must explain why. This is a trusted adapter interface, not cryptographic attestation of arbitrary claims.

A report's aggregate status describes only the recorded checks and declared dependency coverage. All not-applicable claims must be justified; they are not a shortcut to asserting the product is production-ready. Never claim every element was checked when the adapter measured one heading. Missing browser tools or unknown expected styles must produce unverified checks.

## Current coverage and remaining work

Regression coverage includes actual computed font/focus drift in a React fixture and a heading-font observation on the real landing B artifact with shared website source tracked. Remaining checks in that real landing report deliberately stay unverified. Existing reduced-motion regression still checks the coffee example, not every new generated artifact.

This is the evidence infrastructure for PRD-002. Automatic project-specific browser check plans, comprehensive non-target behavior comparison, runtime acceptance of alternative focus indicators, and complete verification of every newly generated artifact remain adapter work. These gaps must stay open on the tracking issue; this implementation must not be described as full PRD-002 completion.
