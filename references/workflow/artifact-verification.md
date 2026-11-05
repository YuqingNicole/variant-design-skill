# Verification evidence tied to an artifact

Verification is scoped evidence, not a quality score or a promise that the whole product is ready. The HTML model audit and CLI share `scanSource`; HTML audit output explicitly says static-only and runtime unverified. A suppressed focus outline requires browser review; static rejection is conservative and does not prove that every alternative focus indicator is invalid.

## Record static findings

Static status is `failed` on any quality-gate error, `unverified` on any warning, and `passed` otherwise. Generator-habit findings (`review`) are taste, not evidence: they do not change the status, and they are reported with the presentation.

```sh
node <skill-root>/scripts/artifact-verification.mjs run <output> B [config.json]
node <skill-root>/scripts/artifact-verification.mjs status <output> <report-file>
```

Configuration may name `projectRoot` (default: output parent) and `dependencies` (additional relative project file paths). Owned files, registered systems/extensions, package/lock manifests, existing project HTML entry and supported config inputs start a read-only local dependency closure. Static imports, re-exports, literal dynamic imports/require, CSS imports/URLs and HTML resources follow transitively. The target project's existing TypeScript API parses script syntax and compiler-config inputs; no compiler is installed and no project/Vite configuration is executed. A missing/incompatible parser, unresolved/dynamic reference, ambiguous candidate, unsupported syntax or limit leaves coverage partial and aggregate status **unverified**, retaining actual per-check results.

Before verification or integration preparation, review actual aliases, native wrappers and separate build/typecheck configs. Save only the needed facts in a new `.variant-work/dependency-resolution.json` (preserve an existing file until reviewed):

```json
{"schemaVersion":1,"entries":[".variant-work/entry-B.tsx",".variant-work/native-preview.json"],"aliases":{"@":"src"},"configFiles":[".variant-work/vite.preview.config.ts",".variant-work/tsconfig.preview.json"]}
```

Use actual project paths, not these example names. Register every relevant wrapper/adapter and config; include data-driven assets explicitly when static imports cannot identify them. Entries are roots whose local references are then followed; tsconfig/jsconfig paths and local extends/references are read without executing config. TypeScript paths do not prove equivalent Vite runtime resolution. Conservative module candidates are all hashed; ambiguity stays explicit. Installed package contents, remote resources, plugin-generated dependencies and runtime environment need separate review/fresh observations. Do not rewrite facts or suppress unknowns to manufacture a passing status.

For a read-only scope report, run `node <skill-root>/scripts/project-dependencies.mjs <project-root> <entry> [more-entries...]` (0 within supported static syntax, 2 partial, 1 invalid operation). It writes no project files. The JSON contains relative paths/digests/edges and unknown codes, not source or full external URLs. Default bounds are 256 files, 64 MiB of fingerprinted source/assets and 1 MiB per parsed text file; limits are not completeness claims.

`run` captures owned-file contents, version, entry, tokens, comparison, task/brand constraints, any system binding, and dependency digests before checking, and checks identity again afterward. It writes an immutable report under `.verification/<variant>/`. No browser or typechecker is run by this CLI command, so its runtime checks are **unverified**, not passed. Exit codes: 0 = recorded checks passed within their scope; 2 = failed, stale or unverified; 1 = invalid operation. Keep reports local; diagnostics can contain source excerpts.

Always call `status` before using a report for delivery. A raw saved JSON result does not establish current validity. File changes without version increments, dependency changes, metadata drift or apply/undo revision changes invalidate old evidence. Selection alone does not. Runtime environment changes require a fresh run even if files are unchanged; the tool cannot independently discover every environment change.

For an integration handoff, explicitly include every current integration target in the verification dependencies, run fresh checks against the installed project during the callback, then follow `references/workflow/delivery-receipt.md` to seal the current inventory and references. Before reports include existing targets; absent new targets have no before hash. The read-only `fingerprintArtifact(root, id, options)` export exposes the same current fingerprint for this inventory plumbing; it never runs checks or creates a report. Receipts retain missing/failed checks and cannot turn preview-only observations into integrated-app acceptance.

## Browser/project adapters

The exported asynchronous `verifyArtifact(root, id, options, runChecks)` captures the identity **before** calling the adapter. The adapter must run new checks during that callback, not import observations made earlier. It must also confirm that the preview has finished rebuilding and is serving the captured artifact; loading an old dev-server transform does not verify current source. Missing observations or runner errors remain unverified. Returned checks use these IDs:

- `brand`: observed computed fonts/token use on named elements against the locked system.
- `keyboard-focus`: actual keyboard navigation; visible outline or a verified alternative indicator. CSS keyword presence is insufficient.
- `reduced-motion`: initial reduced-motion and switching the preference while animation runs, including JavaScript loops.
- `scope-preservation`: representative non-target layout and functionality against a recorded before state.
- `project-checks`: project typecheck/build commands with pre-existing failures distinguished from new failures.

Each check requires `id`, `status` (`passed`, `failed`, `unverified`, `not-applicable`) and a concrete `reason`. Observed passed/failed checks also require `tool.name`, `tool.version`, `environment` and `evidence` entries identifying observations or logs. Unknown/not-applicable checks must explain why. This is a trusted adapter interface, not cryptographic attestation of arbitrary claims.

Registered `designSystem.file` and every `designSystem.extensions` file are fingerprinted automatically, using the same root/path/symlink guards as explicit dependencies. Editing, deleting or reordering an extension, or changing the variant binding, makes prior evidence stale; edits during observation cannot produce current evidence. The new closure also binds transitive local source/assets, actual compiler identity, resolver implementation and reviewed resolution facts. Related source/config/reference changes invalidate evidence even without owned-file edits. Legacy reports lacking the closure must be rerun; do not backfill old observations. Unsupported/dynamic dependencies still need review and explicit roots, with remaining unknowns preserved.

A report's aggregate status describes only the recorded checks and declared dependency coverage. All not-applicable claims must be justified; they are not a shortcut to asserting the product is production-ready. Never claim every element was checked when the adapter measured one heading. Missing browser tools or unknown expected styles must produce unverified checks.

## Task observations

The JavaScript API `observeTask(task, profile, asyncAdapter)` runs a trusted adapter between source freshness checks. It does not open a browser by itself. Use the available browser/test runner to perform the actual observations and return:

```js
{
  conditions: {
    url, browser, language, theme, dataState, interactionState,
    viewport: { width, height }, reducedMotion: 'reduce' // or 'no-preference'
  },
  checks: [{ id, status: 'passed', reason, tool, toolVersion, evidence }]
}
```

Allowed check statuses: passed, failed, unverified. Never invent tool results; missing/failed adapters or incomplete evidence remain unverified. Reports bind task content and profile content, record conditions/time, and become stale on changes during observation. `inspectObservation(report, task, profile)` checks source bindings; it always reports that current browser/environment freshness is not established. Evidence strings are trusted adapter assertions, not signed proof or screenshot storage. Do not include tokens, personal data or credential-bearing URLs.

A passing report covers only its listed observations, not every acceptance criterion or the whole project. Screenshots, automatic adapter selection, task revision history, selection/change receipts and integration remain separate follow-up work. Preserve existing candidate snapshots and verification flows.

## Reusable Playwright checks

For new artifacts, automatically author/seal task-specific checks using `references/workflow/runtime-plans.md`. The Agent chooses actual locators, actions and expectations from the task/source/observations; the helper validates and executes declarations without a bundled model or importing Agent code. Baseline scope measurements stay unverified until a real comparison. The lower-level API below remains available for trusted adapters outside that vocabulary.

`scripts/browser-verification.mjs` exports `verificationPlan(url)` and `verifyInBrowser(output, id, options, adapter)`. Reuse a Playwright Page available in the target project or agent environment; this helper does not install dependencies or launch a browser. Start with the empty plan and fill expectations from the task and brand rules. Missing entries remain unverified.

```js
const plan = {
  url: previewURL,
  brand: [{selector:'h1', property:'font-family', expected:'Georgia'}],
  'keyboard-focus': [{selector:'#primary', maxTabs:40}],
  'reduced-motion': {settled:[{selector:'#counter', property:'text', expected:'100'}]},
  'scope-preservation': [{selector:'#outside-count', property:'text', expected:'1'}]
};
const result = await verifyInBrowser(output, 'B', {plan, dependencies}, {
  page, version: browser.version(),
  ready: async page => { /* assert rebuilt preview identity, not just HTTP success */ },
  startMotion: async page => { /* trigger the actual animation */ },
  exerciseScope: async page => { /* perform a representative non-target interaction */ },
  projectChecks: async () => { /* run existing checks; return a project-checks observation */ }
});
```

Implement callbacks with real assertions and interactions; the comments illustrate required adapter responsibilities, not runnable verification. Keep the plan and adapter in `.variant-work/` and include their relative paths in `dependencies`. `ready` must confirm the preview's current source identity on every navigation. No callback means no evidence for that behavior.

Focus checks use Tab navigation and compare focused/unfocused styles. An alternative may specify `indicator: {property:'boxShadow', expected:'rgb(0, 0, 255) 0px 0px 0px 3px'}` (or `backgroundColor`). An always-present decoration does not qualify. These measurements do not establish contrast, occlusion or WCAG compliance; visually review the indicator too. Static outline findings remain visible even when a runtime alternative passes.

Motion checks run with reduced motion initially and switch to it during an exercised animation. They compare declared settled values and observe requestAnimationFrame callbacks over a bounded interval (defaults: 100 ms settle, 150 ms sample). This covers exercised callbacks and selectors, not every timer, canvas, video or future animation. Specify `startMs`, `settleMs`, `sampleMs` when the actual interaction requires different timing. Missing expectations or callbacks remain unverified. Scope assertions must come from a recorded pre-edit observation; do not invent the expected result after editing.

`compareVerificationReports(before.report, after.report)` lists identical failed diagnostics as `observed-before`, and other failures as `new-or-changed`. Run the before checks before edits, under the same environment and plan, and retain both report IDs. This comparison never turns failures into passes and does not infer their root causes. Changed checker implementations invalidate newly recorded evidence. Continue to inspect current report status at delivery.

## Current coverage and remaining work

Regression coverage includes actual computed font/focus drift in a React fixture and a heading-font observation on the real landing B artifact with shared website source tracked. Remaining checks in that real landing report deliberately stay unverified. Existing reduced-motion regression still checks the coffee example, not every new generated artifact.

This is the evidence infrastructure for PRD-002. Project-specific expectations, complete task coverage, and real-delivery validation still require an adapter and recorded observations. The reusable runner covers explicit alternate focus, motion and scope checks; it does not infer the correct assertions for arbitrary products. These gaps must stay open on the tracking issue; this implementation must not be described as full PRD-002 completion.


Optional `inputs` bind project-relative non-source observation files, such as a sealed plan or baseline report, without parsing historical evidence as source dependencies. Their hashes are captured before/after and on status. Inputs must be regular unlinked project files: at most 128, 16 MiB each and 64 MiB total, excluding environment and private tool directories. Source path/symlink guards still apply. Changed inputs stale the report; never rewrite a baseline to make old observations current. A project-check runner exception preserves any browser failures already observed.
