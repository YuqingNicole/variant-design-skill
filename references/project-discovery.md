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
