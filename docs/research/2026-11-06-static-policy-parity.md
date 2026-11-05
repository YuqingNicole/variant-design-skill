# Shared static policy parity · 2026-11-06

Scope: #18 V8. Recovery PR #167 is merged as `770c8ad`; this branch starts from that master. The same-input probe at `/Users/nicole/orca/variant-backlog-evidence/static-parity-probe/result.json` found equal rule findings but contradictory gate results: a pure-black warning made actual CLI `--strict` exit 1 while online HTML readiness returned passed. Valid and suppressed-focus controls also ran. That original probe remains unchanged.

RFC-018 shares one strict summary between CLI and online HTML readiness. JSON now makes policy/pass explicit; default CLI keeps errors-only behavior and review-only suggestions still do not block strict. The online summary applies to the returned sanitized HTML. Separate online document requirements can still fail even when shared rules pass. Runtime remains unverified; the artifact module's warning observation remains unverified, rather than being relabelled failed.

The actual boundary regression was red before implementation: four existing AI tests passed, the warning parity assertion failed (`true !== false`) and the missing summary test failed. Raw log: `/tmp/variant-parity-before.log`. The correction passes all seven focused tests (`/tmp/variant-parity-after.log`), including seven real CLI same-input cases, default-policy compatibility, independent document requirements, and warning-triggered model repair/failure propagation using a controlled provider response. No helper is mocked and no hosted model request/key/budget change occurs.

Full 189 Node checks, 70 website tests/build 241 routes and four package checks passed. Full browser and actual installed-skill gates are pending at this implementation checkpoint. Do not treat the focused tests as whole #18/#19 or backlog completion. Existing failed real runs from the recovery slice remain preserved.


## Final source-bound checkpoint

Actual installed-skill source `685885ed6d86eb5dd4a86e96876bc2b9aed156b1` passed **43/43 in 405s**, generate → scoped edit → undo → integration/failed receipt/rollback, with Chrome observations and independent archive/source/check/receipt audit. Both source-head push/PR loop and landing CI passed. Full local gates: 189 Node, 38 Chrome, 70 website tests/build 241 routes, four package checks, typecheck and two bilingual docs/sponsor cases. [Audit JSON](2026-11-06-static-policy-audit.json) binds raw reports and logs to hashes.

The fixed read-only boundary audit checks seven real CLI cases against online audit of the identical sanitized HTML, explicit strict summaries, default errors-only compatibility, review-only behavior and separate online document failures. The original mismatch and red test remain unchanged. Actual controlled-provider response tests confirm warning diagnostics reach repair and still reject unresolved warnings; they do not claim a hosted model call. Runtime remains unverified in this online result.

Together with the existing actual native Vite matrix, source-bound runtime plans, preview ownership, receipt and interruption records, the [finite acceptance map](2026-11-06-acceptance-map.md) now proves V1–V9 and I1–I10 for the defined HTML/Vite first phase. PRD-002/003 checklists reflect those measured gates; #18/#19 close only after #168 merges. Next, arbitrary-framework/WCAG/human design acceptance, two outside users, marketplace/paid entitlements, account/model keys and budgets are distinct gates. No release/global install/account/key/budget is changed here.
