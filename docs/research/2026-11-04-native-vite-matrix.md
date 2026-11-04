# Native Vite matrix preparation · 2026-11-04

Branch: `codex/native-vite-matrix`, based on integration checkpoint `d646948`. Execution scope: RFC-011 and the existing #19/PRD-003 Vite alias/provider/global-style requirement.

## Fixture baseline

Workshop Ledger is self-authored, with fictional in-memory invoice/workspace state and no payment or external service. Its original `@` alias and Vite currency define are needed by the business hook; the original provider owns role/payment/filter state and throws if missing. The app imports global brand CSS and a local SVG. A pre-existing `variant-preview.html` is protected by the source-preservation contract.

Copied the harbor fixture's exact dependency set and lock, changing only the fixture name and adding an explicit typecheck script: React 19.1.1, Vite 7.1.7, Rollup 4.65.1. Original source typecheck/build passed. Current Vite documentation describes a newer bundler; the implementation plan instead checked official v7.1.7 source documentation for the fixture's pinned APIs. No runtime-helper dependency or target-project version was changed.

Actual headless Chrome 156.0.8078.80 used the fixture's own Vite server/config. Search, combined status/search empty states and recovery, owner mark-paid, read-only viewer, workspace return state, original CSS and local asset passed. It had no JS error or horizontal overflow at 320/390/1440. A separate bare entry without the provider produced the actual expected runtime error. This negative confirms that an isolated component rendered without its project wrapper cannot silently pass the baseline.

Metadata summary: `2026-11-04-native-vite-baseline.json`. Raw project/build, screenshots and observations remain outside Git under `/Users/nicole/orca/variant-backlog-evidence/native-fixture-baseline/`. Screenshots show the fixture after exercising its state; they are not a fresh-state visual comparison against model output. The fixture's installed modules/build were moved outside the repository before future eval preparation so the runner cannot copy stale build output into a new project.

## Remaining work

The fixture declares a two-turn generate/deliver scenario and explicit preview/delivery manifests. **The native host capture and grader are not wired yet, and no real Agent run for this fixture has occurred.** Do not describe the matrix as passed from these baseline tests. Next validate the real capture/grader with positive/negative native entries, then run the installed skill and independently inspect previews, build, provider/global-dependency probes and reversible integration.

This is evaluation preparation, not new universal native adapter support, automatic cleanup ownership, full shared-import discovery or complete #19 acceptance. The current draft branch has no production deployment or public metadata change. Existing human gates remain open.
