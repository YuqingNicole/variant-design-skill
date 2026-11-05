# Generate task-specific runtime checks

After the actual preview exists, automatically author a plan from the current taskContract, available task brief, original source/brand and browser observations. Do not ask the user to write selectors or JavaScript. Semantic choices belong to the user's Agent; the helper binds and executes the resulting declarations. Missing facts/tools remain explicit gaps.

## Draft and seal

Write a new `.variant-work/<name>.json` with these fields. Keep older drafts/bundles:

- `schemaVersion: 1`, `target`: actual project-relative HTML preview entry, `viewport: {width,height}`, `purpose: "baseline"` before an edit or `"comparison"` afterwards.
- `plan`: existing `brand`, `keyboard-focus`, `reduced-motion`, `scope-preservation` definitions. Omitted/null checks need concrete reasons in `gaps[checkId]`; never infer not-applicable.
- `actions: {motion:[...],scope:[...]}` for planned motion/scope checks. `projectChecks` is a boolean: whether a real reviewed project-check callback is planned.
- `basis[checkId]`: each planned check needs actual `{file,reason}` source references. Include original task/brand facts. These declarations explain intent; they do not prove semantic completeness.
- `coverage`: exactly one `{requirement,status,checks,reason}` for every current `taskContract.requiredFunctions` value. Use `planned` with named planned check IDs, or `unverified` with an empty checks list and a reason. This reviews coverage; it is not a passing result.

Locators: `{by:"role",role:"button",name:"Inspect footer"}`, `{by:"label",name:"Search invoices"}`, `{by:"testId",value:"invoice-count"}` or `{by:"css",value:"h1"}`. Names are exact. Prefer stable user-facing names/test IDs; explicit CSS is available. Every target must resolve uniquely. Brand/scope assertions are `{locator,property,expected}` with literal actual CSS/text expectations. Supported properties: text, font-family/size/weight, line-height, color, background-color, display, visibility, opacity, transform, width and height.

Focus rules are `{locator,maxTabs?,indicator?}`; alternate indicators retain the boxShadow/backgroundColor contract in `artifact-verification.md`. Motion is `{settled:[assertions],startMs?,settleMs?,sampleMs?}`. Include the actual trigger and a normal-motion intermediate-state assertion when appropriate, not only a reduced-motion final value.

Actions: `click`, `fill`, `select`, `press`, `assert`. Each has `locator`; fill/select/press also have literal `value`. An assert has `property,expected,timeoutMs?` and a bounded retry. Motion actions may have `whenMotion:"reduce"|"no-preference"`. There are no arbitrary conditions, evaluate, navigation, imports or shell commands. For example, adapt these names/states to the actual task:

```json
{
  "motion": [
    {"action":"click","locator":{"by":"role","role":"button","name":"Animate"}},
    {"action":"assert","locator":{"by":"testId","value":"progress"},"property":"text","expected":"50","whenMotion":"no-preference"}
  ],
  "scope": [
    {"action":"click","locator":{"by":"role","role":"button","name":"Inspect footer"}},
    {"action":"assert","locator":{"by":"testId","value":"footer-count"},"property":"text","expected":"1"}
  ]
}
```

Only exercise actions already authorized by the task. A plan does not create permission for destructive production actions.

```sh
node <skill-root>/scripts/verification-plan.mjs record variant-output B .variant-work/check-before.json
node <skill-root>/scripts/verification-plan.mjs status variant-output <printed-plan-file>
```

An optional final project root supports nested output. Sealing writes a new bundle exclusively inside project `.variant-work/.runtime-plans/`. Current means source, task, inputs and tool identities match, not that a browser ran. Drift makes the bundle stale; review facts and seal a fresh draft instead of rewriting a bundle or silently rebinding it.

## Run with real tools

Import `runVerificationPlan` from `<skill-root>/scripts/verification-plan.mjs` and supply the existing Playwright Page and trusted preview/project adapters:

```js
await runVerificationPlan(output, printedPlanFile, {
  page, version: browser.version(), baseURL: actualLocalPreviewRoot,
  ready: async page => { /* assert this preview's actual rebuilt identity */ },
  projectChecks: async () => { /* run reviewed commands; return actual project-checks observation */ }
});
```

Those comments describe required callbacks, not runnable assertions or fabricated observations. Generate the ready check from the real preview/version mechanism, retain actual command/log evidence, and include any additional adapter source among the verification inputs/dependencies. JSON never supplies callbacks or code. The trusted preview manager supplies `baseURL` as the actual loopback HTTP root. Omitting it uses the target's actual file URL. The module does not install dependencies, start browsers/servers or change source/selection.

Without a browser or trustworthy ready callback, browser checks stay unverified. Independent project checks can still run through their real callback. A project-runner error preserves earlier observed browser failures. Inspect artifact report status before delivery.

## Preserve a real before baseline

A baseline run really performs the scope actions and records values, but scope-preservation stays unverified: there is no after comparison yet. After the authorized edit/undo, the old bundle is stale. Review the task and create a new comparison draft, adding `baselineReport: ".verification/B/<baseline-id>.json"` using the output-relative report path from the actual baseline run.

Task, brand, scope actions/assertions and viewport must match that baseline; it must contain successful actual observations under the same tools. Known shared/task/brand files must still match, except the variant's owned files. Changed shared assumptions require a new before baseline. Do not invent a new expected value after editing. Seal/run the comparison; only then can matching scope results pass within the declared scope. Keep originals untouched.

The report binds bundle, draft and baseline through non-source `inputs` hashes. Changed inputs or source during execution stale the report. Actual action assertion mismatches remain failed; missing/ambiguous controls or tools remain explicit. Wrong/empty baselines and changed actions/viewport/tools are refused.

Bounds: 2 MiB draft/bundle, 64 assertions/check, 32 actions/sequence, 32 focus controls and 100 tabs/control; viewport dimensions 240–3840; action waits at most 5s and motion intervals at most 10s. Separate observation input limits apply. `record/status` exits 0=current, 2=stale, 1=invalid; browser results use artifact-verification semantics. Local hashes do not authenticate observers, prove full task/animation coverage, WCAG compliance, environment freshness or human acceptance. Review screenshots and remaining unknowns too.
