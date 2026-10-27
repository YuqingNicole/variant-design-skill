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
