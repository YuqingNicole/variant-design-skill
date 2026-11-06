# Versioning

The repository has two versioned products. Keep their versions independent:

- **Variant Design skill and plugin: `1.1.0`** — the canonical value is `VERSION`. The Codex manifest at `plugin/plugin.json` and Claude marketplace entry in `.claude-plugin/marketplace.json` must match it. This release is recorded in [CHANGELOG.md](../CHANGELOG.md#110--2026-10-27).
- **Website package: `0.1.0`** — recorded in `website/package.json`. This is package metadata, not a separate public release tag.

## When to bump

- Every merged skill update that changes user-facing behavior, workflow instructions or bundled helper behavior gets a version bump in the same release PR. Use patch for compatible fixes, minor for compatible capabilities, and major for breaking behavior or data changes.
- A website runtime or user-facing capability release bumps `website/package.json` independently. Editorial content, research notes and internal maintenance scripts do not change either product version by themselves.
- Add the release summary to `CHANGELOG.md` in the same PR. Update this file's current-version record when either version changes.
- For a skill release, update `VERSION`, both plugin manifests, and the changelog heading together. Tag the release only after the release PR is merged.

Do not bump versions for every commit. A PR may contain several commits; one shipped product update gets one version increment.
