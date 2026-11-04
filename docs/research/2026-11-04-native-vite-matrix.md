# Native Vite matrix preparation · 2026-11-04

Branch: `codex/native-vite-matrix`, based on integration checkpoint `d646948`. Execution scope: RFC-011 and the existing #19/PRD-003 Vite alias/provider/global-style requirement.

## Fixture baseline

Workshop Ledger is self-authored, with fictional in-memory invoice/workspace state and no payment or external service. Its original `@` alias and Vite currency define are needed by the business hook; the original provider owns role/payment/filter state and throws if missing. The app imports global brand CSS and a local SVG. A pre-existing `variant-preview.html` is protected by the source-preservation contract.

Copied the harbor fixture's exact dependency set and lock, changing only the fixture name and adding an explicit typecheck script: React 19.1.1, Vite 7.1.7, Rollup 4.65.1. Original source typecheck/build passed. Current Vite documentation describes a newer bundler; the implementation plan instead checked official v7.1.7 source documentation for the fixture's pinned APIs. No runtime-helper dependency or target-project version was changed.

Actual headless Chrome 156.0.8078.80 used the fixture's own Vite server/config. Search, combined status/search empty states and recovery, owner mark-paid, read-only viewer, workspace return state, original CSS and local asset passed. It had no JS error or horizontal overflow at 320/390/1440. A separate bare entry without the provider produced the actual expected runtime error. This negative confirms that an isolated component rendered without its project wrapper cannot silently pass the baseline.

Metadata summary: `2026-11-04-native-vite-baseline.json`. Raw project/build, screenshots and observations remain outside Git under `/Users/nicole/orca/variant-backlog-evidence/native-fixture-baseline/`. Screenshots show the fixture after exercising its state; they are not a fresh-state visual comparison against model output. The fixture's installed modules/build were moved outside the repository before future eval preparation so the runner cannot copy stale build output into a new project.

## Remaining work

The fixture declares a two-turn generate/deliver scenario and explicit preview/delivery manifests. **No real Agent run for this fixture has occurred.** Do not describe the matrix as passed from these baseline tests. The host preview/configuration/dependency capture is now wired; independent history/integration/rollback replay remains unfinished and explicitly fails its gate. After that replay and its positive/negative regressions exist, run the installed skill and independently inspect the full delivery.

This is evaluation preparation, not new universal native adapter support, automatic cleanup ownership, full shared-import discovery or complete #19 acceptance. The current draft branch has no production deployment or public metadata change. Existing human gates remain open.

## Host preview checkpoint

The new host uses each copied fixture's own Vite 7.1.7 and TypeScript 5.9.2, retaining original configuration. Independent browser samples cover original/A/B/C at 1440/390, original business behavior and role restrictions, real keyboard access/focus, computed brand anchors, local SVG decoding/source, comparison links and overflow. Actual typecheck file listings and emitted HTML entries prevent an empty/incomplete isolated configuration from passing on exit code alone. Source/context/adapter/manifest hashes, commands, versions, browser failures and owned server shutdown are preserved outside Git. Builds and dev use separate processes. Node's HTTP listener provides an ephemeral loopback port around Vite's documented middleware API; Vite's own configured port 0 resolved to 5173 during the initial audit, so relying on that value would risk a fixed-port conflict.

The disposable dependency probe changes the original JSON, the original provider's derived name and a global CSS marker. A copied provider which still imports original JSON cannot pass from the JSON nonce alone. The positive adapters deliberately reuse the original App for harness validation; they are not Agent-generated designs and do not prove direction quality.

Initial failures were in the new host/tests, not hidden model successes: small SVGs were actually inlined as data URLs, while the initial grader expected a fixed asset path; the original page's implicit favicon request returned 404; a deliberately missing image returned HTTP 200 through Vite's SPA fallback but failed real image decoding. The corrected host compares the rendered SVG with the original module's real Vite import, records the optional implicit favicon warning separately, and rejects a bad logo from actual decoding/source even when HTTP succeeds. Other application resource errors remain failures.

Missing/empty/duplicated/Agent-authored reports fail closed, including the standalone grader and a chain with no native measurements. The native delivery gate is still explicitly unobserved; no fabricated `pass: true` delivery result is supplied to make the fixture green. This remains an unfinished evaluation, with no new claim about shipped skill UX.

Primary API references rechecked for this implementation: [Vite v7.1.7 JS API](https://github.com/vitejs/vite/blob/v7.1.7/docs/guide/api-javascript.md), [Vite v7.1.7 build options](https://github.com/vitejs/vite/blob/v7.1.7/docs/config/build-options.md) and [Playwright Browser API](https://playwright.dev/docs/api/class-browser). The first attempt to open Vite's assets guide returned a web cache miss; no claim depends on having read that page. Current local runtime is Node 26.3.0; a Node 22 CI result is a separate gate.

A full-suite rerun exposed an existing test-isolation defect: the system-extension integration regression reused `tests/.generated/integration-system/.variant-work/plan.json`, so a second run hit the helper's correct `EEXIST` refusal. Only the regression setup changed: an owned `mkdtemp` project is now used per invocation and removed after success. No plan-overwrite permission or runtime guard was relaxed. The focused case passed twice in fresh Playwright workers (6.6s). Initial failed attempts remain part of the run history; they are not native model failures.

### Verified local checkpoint

Final source hashes and observations: `2026-11-04-native-vite-host-checkpoint.json`. All 20 Chrome Playwright regressions passed (2.3 minutes), including five native cases; all 14 grader tests passed; the tests workspace typecheck and four plugin package tests passed. This checkpoint used Chrome 156.0.8078.80 / Node 26.3.0, with the fixture's actual Vite 7.1.7 / TypeScript 5.9.2. No additional Agent/model run was made.

The stored host grading has 24 passing preview/baseline/probe checks and two deliberately failing delivery gates (`deliver-observed`, `delivery-replayed`); **overall native acceptance remains false**. Six owned Vite server processes recorded exit 0 without timeout. A real request after capture also confirms that its server was stopped. The probe records equal before/after hashes of the original data/provider/CSS; all mutations occurred in its disposable copy. The actual final desktop/mobile screenshots show the original App after exercising payment/workspace state, not three newly generated directions.

Raw final evidence: `/Users/nicole/orca/variant-backlog-evidence/native-host-checkpoint/native-vite-eval-UJQT40/`. Earlier failing and intermediate runs remain under the sibling `native-host-regression/` and `native-host-final/` directories. They are not substituted for the final source's samples. Next implement independent recorded history/integration/rollback replay, test its failure cases, then run the real two-turn installed-skill scenario. Node 22 CI, maintainer review, original Claude-account failure, full shared-import coverage and safe preview cleanup remain separate open gates. Nothing was merged or deployed to production.
