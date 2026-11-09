import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { bumpVersion, release, replaceManifestVersion, updateVersionRecord } from './release-version.mjs';

test('bumps stable semver and handles release candidates', () => {
  assert.equal(bumpVersion('1.1.0', 'patch'), '1.1.1');
  assert.equal(bumpVersion('1.1.0', 'minor'), '1.2.0');
  assert.equal(bumpVersion('1.1.0', 'major'), '2.0.0');
  assert.equal(bumpVersion('1.2.0', 'rc'), '1.2.0-rc.1');
  assert.equal(bumpVersion('1.2.0-rc.1', 'rc'), '1.2.0-rc.2');
  assert.equal(bumpVersion('1.2.0-rc.2', 'finalize'), '1.2.0');
  assert.throws(() => bumpVersion('1.2.0-rc.1', 'patch'), /Finalize/);
  assert.throws(() => bumpVersion('1.2.0', 'finalize'), /not a release candidate/);
});

test('replaces one exact manifest version and rejects drift', () => {
  assert.equal(replaceManifestVersion('{"version": "1.1.0", "other": "1.1.0"}', '1.1.0', '1.1.1', 'manifest'), '{"version": "1.1.1", "other": "1.1.0"}');
  assert.throws(() => replaceManifestVersion('{"version": "1.0.0"}', '1.1.0', '1.1.1', 'manifest'), /exactly one version field/);
});

test('updates the recorded current version for each product', () => {
  const record = '- **Variant Design skill and plugin: `1.1.0`** — the canonical value is `VERSION`.\n- **Website package: `0.1.0`** — recorded in `website/package.json`.';
  assert.match(updateVersionRecord(record, 'skill', '1.1.0', '1.1.1'), /skill and plugin: `1\.1\.1`/);
  assert.match(updateVersionRecord(record, 'website', '0.1.0', '0.2.0'), /Website package: `0\.2\.0`/);
  assert.throws(() => updateVersionRecord(record, 'skill', '9.0.0', '9.0.1'), /does not record/);
});

test('previews a skill version bump from the real repository without writing files', async () => {
  const result = await release('skill', 'patch', { dryRun: true });
  // Read from VERSION so the test does not need an edit at every release.
  const current = fs.readFileSync(new URL('../VERSION', import.meta.url), 'utf8').trim();
  assert.deepEqual(result, {
    product: 'skill', current, next: bumpVersion(current, 'patch'),
    files: ['VERSION', 'plugin/plugin.json', '.claude-plugin/marketplace.json', 'docs/versioning.md'], dryRun: true,
  });
});
