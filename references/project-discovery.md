# Project discovery before design changes

For an existing project, read applicable AGENTS instructions and locate the target entry first. Use CodeGraph before source search when the project is indexed. Do not scan the installed skill as if it were the user's project.

Run the bounded read-only helper with an explicit package root and source entry:

```sh
node <skill-root>/scripts/project-profile.mjs scan <project-root> <relative-entry>
```

The helper prints JSON to stdout and does not write project files, execute package scripts, install dependencies or fetch resources. Save the reviewed result as `project-profile.json` in your task artifacts when useful; do not overwrite existing artifacts. It records content hashes and lexical dependency edges, known framework declarations and Git status when the supplied root is the Git root. It omits raw source, package script values and arbitrary dependency values. Source files may still contain sensitive content: this is scope minimization, not a secret detector or offline-model guarantee.

## Complete the semantic review

This helper is not a compiler or complete project-understanding engine. Import syntax can be missed or matched in comments. Package aliases, providers, dynamic imports, routes, shared consumers, brand rules and real actions require targeted review. Resolve these with the project's existing tools and relevant source; record evidence locations and unknowns. Do not label an untested framework or preview as supported.

Create a concise task brief using:

- User goal and target page/route; authorized regions and files.
- Core task, shared data and necessary actions preserved across A/B/C.
- Existing brand constraints and evidence; absence of detected tokens is not permission to replace a brand.
- Related shared components and affected consumers; unresolved impact.
- Actual commands reviewed for preview/checks, separated from commands executed.
- Acceptance checks, available runtime observations, and blocking unknowns.

Only ask about missing facts that change the task or scope, within the existing two-question budget. Read-only discovery does not create new write authorization. When the critical entry or behavior is unresolved, preserve the task brief and explain the limitation before any overwrite.

## Freshness and handoff

```sh
node <skill-root>/scripts/project-profile.mjs status <saved-profile.json>
```

Exit 0 means current **within the declared lexical scope**, 2 means stale, and 1 means invalid/unreadable input. The status command repeats discovery, including newly resolved local references and Git state. It cannot establish browser/environment freshness or detect all files outside that scope. Review those separately. Re-scan and refresh the task brief when dependencies or requirements change.

Pass reviewed dependency paths to artifact verification where available. Existing candidate preparation and integration must still read their own current baselines; a profile is neither a lock nor a replacement for transaction checks. Continue using the current snapshot/undo contract; this helper does not implement generic project integration.

## Structured task and runtime observations

After semantic review, create a task using the saved profile and a brief JSON:

```sh
node <skill-root>/scripts/design-task.mjs create <profile.json> <brief.json>
node <skill-root>/scripts/design-task.mjs status <profile.json> <task.json>
```

Both commands emit JSON to stdout. Store artifacts outside the scanned Git working tree when possible: adding an untracked report inside it changes the recorded working-tree state. Never redirect over the input or business files. The brief fields are:

- `goal`, `audience`, `route`, `coreTask`: nonempty strings.
- `allowedFiles`: existing paths present in the profile. Adding new files needs a future explicit integration plan; do not pretend they were inspected.
- `preserve`, `acceptance`: nonempty arrays of explicit behavior/criteria strings.
- `brandConstraints`: array of `{rule, evidence}`. Empty means no rules recorded, not permission to discard a brand.
- `unknowns`: additional `{reason, blocking}` items.
- `discoveryReview`: one item per profile unknown, in the same order, with `{index, status, reason, blocking, evidence?}`. Status is `resolved` or `unresolved`; resolved items need evidence. Runtime-unobserved remains unresolved here and is addressed by observations.

Do not dismiss unknowns just to obtain readiness. Explain why an unresolved item does or does not block this specific task. A blocking unknown yields `readiness: blocked` and exit 2. Stale input is rejected. Task IDs and profile digests bind the brief to its inputs. A changed brief is a new task record, not an in-place edit of a published record; creation currently starts at version 1 and does not implement revision history.

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
