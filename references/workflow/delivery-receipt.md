# Delivery receipt

Read this when handing off an actual integration. A receipt joins the real integration plan/backup, staged target inventory, current artifact fingerprint, verification reports and preview ownership. It records local facts and references; it never selects, writes application files, executes commands or certifies acceptance.

## Record while the integration is present

1. Before integration, run task-specific checks with `verifyArtifact` (`artifact-verification.md`). Include every existing integration target in `dependencies`; a new target cannot have a before hash. Keep the report and actual diagnostic output for prior-failure comparison. Missing checks stay unverified.
2. Prepare the real integration plan **before** writing staging, then apply with `variant-integrate.mjs`. Run checks on the integrated project inside a **new** `verifyArtifact` callback. Include **all** integration targets in `dependencies` so those checks bind the installed target bytes as well as the generated direction. A preview-only report cannot establish integrated application behavior.
3. While those integrated bytes still exist, create `.variant-work/delivery-config.json` with actual project-relative plan/staging paths and output-relative report paths. Use the exact current preview ownership receipt paths, never a guessed receipt or a hand-written success field:

```json
{
  "plan": ".variant-work/integration-plan.json",
  "staging": ".variant-work/integrate-B",
  "beforeReport": ".verification/B/<before-id>.json",
  "afterReport": ".verification/B/<after-id>.json",
  "previewReceipts": [".variant-work/preview-files/<group>/<receipt-id>.receipt.json"]
}
```

```bash
node <skill-root>/scripts/delivery-receipt.mjs record variant-output <integration-id> .variant-work/delivery-config.json
node <skill-root>/scripts/delivery-receipt.mjs status variant-output <printed-receipt-file>
```

`projectRoot` is optional for nested output. Omit unavailable reports or preview receipts instead of inventing them. A missing after report leaves verification unverified; a missing before report leaves prior-error classification unverified. Observed failures remain failed. Preview conflicts retain their inventory and cap verification at unverified. Give the user the receipt path, actual preview URL/run instructions, remaining checks and the returned recovery argv (run from its `cwd`). No command in a configuration or receipt is executed by this helper.

Report paths in this receipt config are output-relative (`.verification/B/…`). The separate `artifact-verification.mjs status` command takes the printed absolute report file, or a cwd-relative path such as `variant-output/.verification/B/…`; do not pass a config's output-relative path as a cwd-relative CLI filename.

## Read the result

- `inventoryStatus: current` means the recorded project, version, plan, exact staging/target sets and bytes, dependencies, reports, preview ownership and checker implementations still match. It is separate from `verificationStatus`.
- `verificationStatus` preserves only the supplied current after-report checks within their scope. Even `passed` is not human acceptance, full accessibility, environment attestation or a production release. Missing focus/motion/non-target checks must remain unverified.
- `baseline.status: recorded` means before/after report fingerprints match the real source and target baselines. Its comparison labels identical prior diagnostics; it does not prove causation. Without both reports, baseline status is unverified.
- Drift, a missing reference or a retired preview makes the saved receipt stale. Preserve it and run fresh checks before recording another receipt; never rewrite old observations to match new files.
- Actual rollback returns phase `rolled-back` and stale current verification while retaining the historical result. Later edits to restored targets return `rolled-back-drifted`. Keep the original receipt, backups and reports; cleanup must not remove them.

The receipt is written once, exclusively, beneath `variant-output/.deliveries/`; repeated record calls create distinct receipts. Keep it local with its referenced files. It contains paths/hashes/metadata, not another copy of staged or backup source bytes. It is unsigned and relies on the same trusted adapter and machine as the verification module. Hashes detect content drift; they do not authenticate an observer. Inputs are bounded to 512 staged/target files, 512 staging directories, 64 MiB total staging bytes, 16 preview receipts and 16 MiB per referenced file. Unsupported larger inputs are refused explicitly.

Exit codes: 0 = current inventory and recorded checks passed within scope; 2 = unverified, failed, stale or rolled back; 1 = invalid operation. Recording a candidate can successfully persist a receipt and return 2. Status only reads files; recording shares the history lock and never changes final selection.

When reporting failed project checks, preserve actual structured diagnostics and compare them individually using `references/workflow/artifact-verification.md`. Keep original logs and old/new classifications; an observed-before failure still fails and never establishes delivery acceptance.
