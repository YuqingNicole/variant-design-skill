import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { preparePreview, sealPreview, cleanupPreview } from '../scripts/preview-files.mjs';
import { createPhaseArchive } from './phase-archive.mjs';
import { armPreviewCleanup, observePreviewCleanup, gradePreviewCleanup } from './preview-cleanup.mjs';
import { fixture } from '../tests/fixture.mjs';
import { gradeChain, snapshot } from './grade.mjs';

function setup(t) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'native-cleanup-host-'))), project = path.join(root, 'project');
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.cpSync(fileURLToPath(new URL('./fixtures/native-vite/project', import.meta.url)), project, { recursive: true });
  const git = (...args) => execFileSync('git', args, { cwd: project, stdio: 'pipe' });
  git('init', '-q'); git('add', '-A'); git('-c', 'user.name=eval', '-c', 'user.email=eval@localhost', 'commit', '-qm', 'baseline');
  const write = (file, value) => { const target = path.join(project, file); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, value); };
  write('.agents/skills/variant-design/scripts/preview-files.mjs', fs.readFileSync(fileURLToPath(new URL('../scripts/preview-files.mjs', import.meta.url))));
  const baselineArchive = createPhaseArchive(project, { directory: path.join(root, 'baseline'), phase: 'baseline', snapshot: { context: null, files: {} } });
  const context = fixture(path.join(project, 'variant-output')); context.designSystem.file = 'src/global.css'; write('variant-output/.variant-context.json', JSON.stringify(context));
  const value = { schemaVersion: 1, ownershipGroup: 'native', compare: '.variant-work/native/compare.html', entries: { A: '.variant-work/native/A.html', B: '.variant-work/native/B.html', C: '.variant-work/native/C.html' }, buildConfig: '.variant-work/native/vite.config.ts', typecheckConfig: '.variant-work/native/tsconfig.json', adapterFiles: ['.variant-work/native/compare.html', '.variant-work/native/A.html', '.variant-work/native/B.html', '.variant-work/native/C.html', '.variant-work/native/mount.tsx', '.variant-work/native/vite.config.ts', '.variant-work/native/tsconfig.json'], dependencies: ['src/workspace.tsx', 'src/workspaces.json', 'src/global.css', 'src/workshop-mark.svg', 'vite.config.ts', 'tsconfig.json'] };
  const manifest = '.variant-work/native-preview.json';
  preparePreview(project, 'native', [...value.adapterFiles, manifest]);
  for (const file of value.adapterFiles) write(file, file.endsWith('.json') ? '{}' : '/* Host filesystem regression adapter; not a browser acceptance fixture. */');
  write(manifest, JSON.stringify(value));
  const receipt = sealPreview(project, 'native');
  return { root, project, baselineArchive, value, manifest, receipt, write };
}
test('actual helper cleanup satisfies host checks while preserving later edits, original files and all output', t => {
  const input = setup(t), armed = armPreviewCleanup(input.project, input);
  const cleaned = cleanupPreview(input.project, input.receipt.receipt); assert.deepEqual(cleaned.conflicts, [armed.edited]);
  const after = observePreviewCleanup(input.project, armed); assert(after.pass); assert.equal(after.checks.length, 6); assert(gradePreviewCleanup({ after }).every(c => c.pass));
  const grade = receipt => gradeChain(input.project, { turns: [], fixture: { previewOwnership: true }, measurements: { previewCleanup: { before: armed, after }, native: { archives: { cleanup: receipt } } } }).checks.filter(c => c.id.startsWith('cleanup:'));
  assert.equal(grade(input.baselineArchive).find(c => c.id === 'cleanup:archive').pass, false);
  const archived = createPhaseArchive(input.project, { directory: path.join(input.root, 'cleanup'), phase: 'cleanup', snapshot: snapshot(input.project) });
  assert.equal(grade(archived).length, 7); assert(grade(archived).every(c => c.pass));
});
test('missing cleanup, deletion of user edits and changes to original/variant files are independent failures', t => {
  const input = setup(t), armed = armPreviewCleanup(input.project, input);
  let after = observePreviewCleanup(input.project, armed); assert.equal(after.checks.find(c => c.id === 'owned-removed').pass, false); assert.equal(after.checks.find(c => c.id === 'cleanup-recorded').pass, false);
  cleanupPreview(input.project, input.receipt.receipt);
  fs.unlinkSync(path.join(input.project, armed.edited)); fs.unlinkSync(path.join(input.project, armed.unknown));
  input.write('src/App.tsx', 'changed original'); input.write('variant-output/.history/deleted-proof.json', 'unexpected change');
  after = observePreviewCleanup(input.project, armed);
  for (const id of ['user-edit-preserved', 'unowned-preserved', 'original-preserved', 'variants-preserved']) assert.equal(after.checks.find(c => c.id === id).pass, false, id);
});
test('manual deletion plus an Agent success claim cannot substitute for actual cleanup backups and results', t => {
  const input = setup(t), armed = armPreviewCleanup(input.project, input);
  for (const file of armed.expectedRemoved) fs.unlinkSync(path.join(input.project, file));
  input.write('.variant-work/agent-cleanup-success.json', JSON.stringify({ pass: true, removed: armed.expectedRemoved }));
  const after = observePreviewCleanup(input.project, armed); assert.equal(after.checks.find(c => c.id === 'owned-removed').pass, true); assert.equal(after.checks.find(c => c.id === 'cleanup-recorded').pass, false); assert(!after.pass);
  for (const value of [undefined, {}, { after: { pass: true } }, { before: { error: 'failed controls' } }]) assert(gradePreviewCleanup(value).every(c => !c.pass));
});
test('missing native ownership and an installed helper mismatch fail before injecting user edits', t => {
  const input = setup(t), mount = path.join(input.project, '.variant-work/native/mount.tsx'), before = fs.readFileSync(mount);
  input.write('.agents/skills/variant-design/scripts/preview-files.mjs', 'different helper');
  assert.throws(() => armPreviewCleanup(input.project, input), /differs/); assert.deepEqual(fs.readFileSync(mount), before);
  input.write(input.manifest, JSON.stringify({ ...input.value, ownershipGroup: undefined })); assert.throws(() => armPreviewCleanup(input.project, input), /ownershipGroup/);
});
