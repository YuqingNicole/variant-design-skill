# Agent-authored runtime plans · 2026-11-05

Task branch `codex/task-runtime-plans`, based on merged master `b2db7b7`. Scope/design: RFC-015, #18 automatic task-specific plans and source-bound observations, with #19/#25 follow-up coverage. The maintainer explicitly authorized continued edits and merge; verified #161 and its ancestor PRs are now merged and its production alias READY/HTTP checked. This does not close the broader backlog or decide commercial/account/product questions.

## Mechanism and boundaries

The Agent authors meaning from current taskContract/source/brand/observations. `verification-plan.mjs` validates task coverage and evidence reasons, seals an immutable source/input/tool-bound bundle, and executes only declarative locators/actions through the existing browser verifier. There is no bundled model, heuristic selector/expectation inference, Agent-code import, package installation, server launch, shell execution from JSON or source/selection write. Exact role/label/testId and explicit CSS locators, click/fill/select/press/assert, bounded waits and preference-conditioned motion are supported.

The initial scope run really measures a baseline but cannot call preservation passed. A later reviewed comparison must retain identical task/brand/scope/viewport and genuine baseline observations. Before drafts/bundles must remain unchanged; known shared/task/brand inputs must match except variant-owned source. Wrong/empty baselines, task changes, missing provenance and changed tools refuse. Changes during observation stale its report. Observation inputs are hashed separately from source discovery, avoiding parsing historical evidence as project code. Baseline expectations are not rewritten after an edit.

Measured action mismatches remain failed; unavailable tools or incomplete actions stay explicit. Project-runner errors cannot erase earlier browser failures. A missing browser/ready callback does not stop actual independent project commands from producing their real observation. The same local/trusted-adapter/environment limits apply; a current plan or declared task coverage is not proof of semantic completeness or full product acceptance.

Official design inputs: Playwright locators/best practices/ARIA snapshot docs; actual compatibility uses the locked 1.56.1 API, not newer AI snapshot options. Current task/profile/verification/receipt/history modules were inspected before RFC/implementation.

## Local evidence

Initial focused parser/plan/evidence checks passed 19, then 175 combined Node checks including the new host grader/resource case. Full Chrome passed **31/31** before the final baseline-input provenance tightening. The new real-browser cases exercise actual keyboard controls, initial/switched RAF motion, before/edit/undo scope, changed brand/shared/task/viewport/plan inputs, visible failures retained through project-tool errors, missing-browser behavior and all declarative action types. The independent host case checks real file response bytes and original project command execution. These are handwritten regressions, not Agent-authored-plan acceptance.

After the final baseline-input provenance guard, all 175 combined Node tests and all four affected Chrome cases passed. Four package checks, tests typecheck, website 67 tests/build (239 routes) and two docs/sponsor Chrome cases passed. New runtime is required in the package, explicitly tested in CI; shared workflows/routes and bilingual user copy are synchronized. The real Agent fixture must prove the new authoring path.

## Actual CLI gate

`runtime-plan-html` is a self-authored local HTML project with original brand, a real RAF progress simulation, independent activity counter, Node syntax command and existing TypeScript parser. Three real Agent processes generate A/B/C plus a baseline declaration, edit B's heading through real history, and undo it while sealing fresh comparison bundles. The independent host executes JSON against actual pages and source bytes, retains source/selection, records real reports, and supplies the genuine baseline for subsequent turns. All original source stays protected; tools stay local. No Agent code is imported by the host.

Required next evidence: fresh installed-skill run, real authored draft/bundle inspection and direct phase/input/source audit; then exact-head CI/review and merge. A separate branded Vite planner matrix and complete cross-project/HTML delivery integration remain required. No full #18/#19/#25 or complete-backlog acceptance is claimed by the implementation or these local checks.

## First actual attempt and correction

Installed-skill Codex run at `f9fdd70` completed three turns in 337 seconds: **23/25** gates passed. All five runtime checks after edit and undo passed individually, but aggregate remained unverified because HTML `script src="shared/data.js"` was incorrectly treated as a bare module import. The real dependency unknown remained visible and correctly prevented a passing aggregate. The failed attempt is retained unchanged under `/Users/nicole/orca/variant-backlog-evidence/runtime-plans-evals-f9fdd70`.

Correction: HTML script src uses exact document-relative URL resolution; script imports continue module resolution. A regression proves relative script discovery, transitive imports, source mutation invalidation and missing-extension refusal. Comparison sealing now explicitly checks the recorded compiler identity, and execution checks the actual browser version. Four affected real Chrome cases passed, including wrong browser and removed compiler (fresh CLI process to avoid Node require cache). No original expectations or failing-result semantics were weakened. A fresh installed-skill run of this corrected source is required before merge.

## Corrected actual installed-skill acceptance

At source commit `8873b9f`, the fresh real Codex run completed all three turns in **315 seconds**, with **25/25 gates passed**. Command:

```sh
PLAYWRIGHT_CHANNEL=chrome node evals/run.mjs --agent codex --fixture runtime-plan-html --out /Users/nicole/orca/variant-backlog-evidence/runtime-plans-evals-8873b9f --jobs 1
```

The Agent authored its own source-derived locators, original Georgia/palette assertions, native button focus, normal progress 50, initial/switched reduced-motion 100, independent Activity 0→1 and original project check. Generate records a genuine scope baseline (four passed checks and scope unverified); edit/undo each passed all five checks and the aggregate. All phases now have supported static dependency coverage with no unknowns. B versions are 1→2→3. The actual edit changes only the heading text, and undo restores all B source bytes. A/C, original files and selectedVariant null are preserved.

Independent direct audit verified all four archive receipts/manifest inventories, every phase source dependency, owned source and observation-input hash; installed seven helper hashes against Git commit `8873b9f`; unchanged recorded reports/drafts/bundles and baseline references; observer before/after preservation, A/C, selection and B restoration. Raw result/screenshots/phase archives remain at the above external evidence root. Screenshots for generated and edited B were visually inspected at 390×844: the requested title change is visible, controls and independent activity remain visible. This does not establish universal design quality or other viewports.

Committed audit summaries retain both the failed 23/25 and corrected 25/25 attempts: [first attempt](2026-11-05-runtime-plans-f9fdd70-audit.json), [corrected attempt](2026-11-05-runtime-plans-8873b9f-audit.json). The audit script is `/tmp/audit-variant-runtime-plans.mjs`; it reads actual archives and Git/helper hashes, not model narratives. New full local validation passed **176 Node tests**, **31 Chrome cases**, and four package checks. Both push and PR loop/landing CI passed at `8873b9f`. Earlier website/guide checks remain recorded above. Final evidence changes only research/RFC status, and must receive their own final-head CI before merge.

This proves the local original HTML/Codex runtime-plan slice. Branded Vite plans, complete cross-project/HTML delivery, genuine human trials, full visual acceptance and account/commercial decisions remain open. Issues #18/#19/#25 and the full backlog are not closed. The maintainer's current authorization covers merging this verified slice and its existing master deployment.

## Final missing-tool review

An additional comparison regression exposed a wrapper boundary: a Page and ready callback with no browser version must preserve the verifier's unverified browser observations and actual independent project check. Version mismatch refusal now applies only when a version is actually available. The four affected Chrome cases passed with this missing-version comparison added. A final installed-skill run of this runtime change is required; the earlier 25/25 result remains explicitly bound to `8873b9f`.
