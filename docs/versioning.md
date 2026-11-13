# Versioning

The repository has two versioned products. Keep their versions independent:

- **Variant Design skill and plugin: `1.2.0`** — the canonical value is `VERSION`. The Codex manifest at `plugin/plugin.json` and Claude marketplace entry in `.claude-plugin/marketplace.json` must match it. See [CHANGELOG.md](../CHANGELOG.md) for this release's notes.
- **Website package: `0.5.0`** — recorded in `website/package.json`. This is package metadata, not a separate public release tag.

## When to bump

- Every merged skill update that changes user-facing behavior, workflow instructions or bundled helper behavior gets a version bump in the same release PR. Use patch for compatible fixes, minor for compatible capabilities, and major for breaking behavior or data changes.
- A website runtime or user-facing capability release bumps `website/package.json` independently. Editorial content, research notes and internal maintenance scripts do not change either product version by themselves.
- Add the release summary to `CHANGELOG.md` in the same PR. Update this file's current-version record when either version changes.
- A website release goes under the release's `### Website` heading as a bullet that starts with ``Website package `x.y.z`:`` (Chinese: ``网站包 `x.y.z`：`` in `website/src/changelog-zh.ts`). The bullets after it, up to the next such bullet, belong to that package version: `/changelog` groups them under it, and `website/scripts/changelog.test.mjs` checks that the newest one matches `website/package.json`.
- For a skill release, update `VERSION`, both plugin manifests, and the changelog heading together. Tag the release only after the release PR is merged.

Do not bump versions for every commit. A PR may contain several commits; one shipped product update gets one version increment.

## Skill release command

Use the release helper so the version manifests and current-version record stay in sync. The command does not publish a release; add the release summary and any required Chinese translation in the same PR:

```sh
node scripts/release-version.mjs skill patch   # 1.1.0 → 1.1.1
node scripts/release-version.mjs skill minor   # 1.1.0 → 1.2.0
node scripts/release-version.mjs skill major   # 1.1.0 → 2.0.0
node scripts/release-version.mjs skill rc      # start or advance a release candidate
node scripts/release-version.mjs skill finalize # finalize the current release candidate
node scripts/release-version.mjs website patch # 0.1.0 → 0.1.1
node scripts/release-version.mjs skill patch --dry-run
```

For a skill release, the command updates `VERSION` and both plugin manifests. For a website release, it updates `website/package.json`. Both update the recorded current version. `--dry-run` previews the change without writing files.
