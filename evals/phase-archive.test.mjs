import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createPhaseArchive, verifyPhaseArchive, materializePhaseArchive, gradePhaseArchives } from './phase-archive.mjs';

const digest = (value, algorithm = 'sha256') => createHash(algorithm).update(value).digest('hex');
function setup(t) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'phase-archive-'))), project = path.join(root, 'project'); fs.mkdirSync(project);
  const write = (file, bytes) => { const full = path.join(project, file); fs.mkdirSync(path.dirname(full), { recursive: true }); fs.writeFileSync(full, bytes); };
  write('README.md', 'Original project\n'); write('src/app.js', 'export const app=1;\n'); write('variant-output/B.tsx', 'export default function B(){return <h1>Initial</h1>}');
  const context = { schemaVersion: 2, selectedVariant: null, variants: { B: { entry: 'B.tsx', files: ['B.tsx'], version: 1 } } };
  write('variant-output/.variant-context.json', JSON.stringify(context)); write('variant-output/.history/B/saved.json', '{"before":"kept"}');
  write('.variant-work/staging/src/App.tsx', 'export {default} from "../../../variant-output/B";'); write('.agents/skills/variant-design/SKILL.md', 'Installed skill text');
  write('scripts/run.sh', '#!/bin/sh\nexit 0\n'); fs.chmodSync(path.join(project, 'scripts/run.sh'), 0o751);
  write('assets/bytes.bin', Buffer.from([0, 255, 10, 1])); fs.mkdirSync(path.join(project, 'empty'));
  for (const file of ['node_modules/ignored.js', '.git/config', 'dist/index.html', '.variant-work/harness/node_modules/ignored.js']) write(file, 'Not source');
  const snapshot = { context, files: { 'variant-output/B.tsx': digest(fs.readFileSync(path.join(project, 'variant-output/B.tsx')), 'sha1') }, quality: [], delivery: { errors: [], warnings: [] } };
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return { root, project, write, snapshot, directory: path.join(root, 'phases/generate') };
}
test('phase archive preserves old source, context, hidden history, empty directories, modes and bytes after later edits', t => {
  const s = setup(t), receipt = createPhaseArchive(s.project, { directory: s.directory, phase: 'generate', snapshot: s.snapshot });
  const archive = verifyPhaseArchive(receipt), original = fs.readFileSync(path.join(archive.source, 'variant-output/B.tsx'));
  assert.deepEqual(archive.manifest.inventory.excluded, ['.git', '.variant-work/harness/node_modules', 'dist', 'node_modules']);
  assert.equal(fs.existsSync(path.join(archive.source, 'node_modules')), false); assert.equal(fs.existsSync(path.join(archive.source, 'dist')), false);
  s.write('variant-output/B.tsx', 'A later draft'); s.write('variant-output/.variant-context.json', JSON.stringify({ ...s.snapshot.context, selectedVariant: 'B' }));
  const restored = materializePhaseArchive(receipt, path.join(s.root, 'restored'));
  assert.deepEqual(restored.snapshot, s.snapshot); assert.deepEqual(fs.readFileSync(path.join(restored.directory, 'variant-output/B.tsx')), original);
  assert.equal(fs.readFileSync(path.join(s.project, 'variant-output/B.tsx'), 'utf8'), 'A later draft');
  for (const file of ['.variant-work/staging/src/App.tsx', '.agents/skills/variant-design/SKILL.md', 'variant-output/.history/B/saved.json', 'assets/bytes.bin']) assert.deepEqual(fs.readFileSync(path.join(restored.directory, file)), fs.readFileSync(path.join(archive.source, file)));
  assert.deepEqual(fs.readdirSync(path.join(restored.directory, 'empty')), []); assert.equal(fs.statSync(path.join(restored.directory, 'scripts/run.sh')).mode & 0o777, 0o751);
  assert.equal(verifyPhaseArchive(receipt).manifest.sourceDigest, receipt.sourceDigest);
});

test('fresh destinations and canonical source boundaries preserve existing and partial data', t => {
  const s = setup(t), receipt = createPhaseArchive(s.project, { directory: s.directory, phase: 'generate', snapshot: s.snapshot }), saved = fs.readFileSync(path.join(receipt.directory, 'archive.json'));
  assert.throws(() => createPhaseArchive(s.project, { directory: s.directory, phase: 'generate', snapshot: s.snapshot }), /Preserve existing/);
  assert.deepEqual(fs.readFileSync(path.join(receipt.directory, 'archive.json')), saved);
  assert.throws(() => createPhaseArchive(s.project, { directory: path.join(s.project, 'nested/new'), phase: 'generate', snapshot: s.snapshot }), /outside/);
  assert.equal(fs.existsSync(path.join(s.project, 'nested')), false);
  fs.symlinkSync(s.project, path.join(s.root, 'alias'));
  assert.throws(() => createPhaseArchive(s.project, { directory: path.join(s.root, 'alias/new'), phase: 'generate', snapshot: s.snapshot }), /outside/);
  assert.throws(() => materializePhaseArchive(receipt, path.join(receipt.directory, 'source/new')), /outside/);
  const existing = path.join(s.root, 'existing'); fs.mkdirSync(existing);
  assert.throws(() => materializePhaseArchive(receipt, existing), /Preserve existing/); assert.deepEqual(fs.readdirSync(existing), []);
});

test('stale grader context and source hashes cannot be saved as current phase evidence', t => {
  for (const change of ['context', 'source']) {
    const s = setup(t);
    if (change === 'context') s.write('variant-output/.variant-context.json', JSON.stringify({ ...s.snapshot.context, activeVariant: 'B' })); else s.write('variant-output/B.tsx', 'Changed after snapshot');
    assert.throws(() => createPhaseArchive(s.project, { directory: s.directory, phase: 'generate', snapshot: s.snapshot }), /context differs|snapshot is stale/);
    assert.equal(fs.existsSync(s.directory), false);
  }
});

test('symlinks and special source files are refused before a completion receipt exists', t => {
  for (const kind of ['file', 'directory']) {
    const s = setup(t); fs.symlinkSync(kind === 'file' ? path.join(s.project, 'README.md') : path.join(s.project, 'src'), path.join(s.project, 'linked'));
    assert.throws(() => createPhaseArchive(s.project, { directory: s.directory, phase: 'generate', snapshot: s.snapshot }), /Symlink/); assert.equal(fs.existsSync(s.directory), false);
  }
  if (process.platform !== 'win32') {
    const s = setup(t); execFileSync('mkfifo', [path.join(s.project, 'pipe')]);
    assert.throws(() => createPhaseArchive(s.project, { directory: s.directory, phase: 'generate', snapshot: s.snapshot }), /regular files/);
  }
});

test('tampering, deleted and extra files, permissions and linked archive directories fail verification', t => {
  const changes = [
    root => fs.appendFileSync(path.join(root, 'source/README.md'), 'tampered'),
    root => fs.unlinkSync(path.join(root, 'source/src/app.js')),
    root => { fs.mkdirSync(path.join(root, 'source/node_modules')); fs.writeFileSync(path.join(root, 'source/node_modules/untracked.js'), 'must not be skipped'); },
    root => fs.mkdirSync(path.join(root, 'source/extra-empty')),
    root => fs.chmodSync(path.join(root, 'source/scripts/run.sh'), 0o644),
    root => fs.appendFileSync(path.join(root, 'snapshot.json'), ' '),
    root => fs.appendFileSync(path.join(root, 'archive.json'), ' '),
    root => fs.appendFileSync(path.join(root, 'receipt.json'), ' '),
    root => fs.writeFileSync(path.join(root, 'extra.txt'), 'extra'),
    (root, s) => { fs.unlinkSync(path.join(root, 'snapshot.json')); fs.symlinkSync(path.join(s.project, 'README.md'), path.join(root, 'snapshot.json')); },
    (root, s) => { fs.unlinkSync(path.join(root, 'archive.json')); fs.symlinkSync(path.join(s.project, 'README.md'), path.join(root, 'archive.json')); },
    (root, s) => { fs.unlinkSync(path.join(root, 'receipt.json')); fs.symlinkSync(path.join(s.project, 'README.md'), path.join(root, 'receipt.json')); },
    (root, s) => { fs.rmSync(path.join(root, 'source/src'), { recursive: true }); fs.symlinkSync(path.join(s.project, 'src'), path.join(root, 'source/src')); },
    (root, s) => { fs.rmSync(path.join(root, 'source'), { recursive: true }); fs.symlinkSync(s.project, path.join(root, 'source')); },
  ];
  for (const change of changes) {
    const s = setup(t), receipt = createPhaseArchive(s.project, { directory: s.directory, phase: 'generate', snapshot: s.snapshot }); change(receipt.directory, s);
    assert.throws(() => verifyPhaseArchive(receipt), /changed|Unexpected|Symlink/);
    assert.throws(() => materializePhaseArchive(receipt, path.join(s.root, 'restore'))); assert.equal(fs.existsSync(path.join(s.root, 'restore')), false);
  }
});

test('an invalid project context is preserved as failed-phase evidence without migration', t => {
  const s = setup(t); s.write('variant-output/.variant-context.json', 'broken JSON'); s.snapshot.context = null;
  const receipt = createPhaseArchive(s.project, { directory: s.directory, phase: 'generate', snapshot: s.snapshot }), archive = verifyPhaseArchive(receipt);
  assert.equal(archive.snapshot.context, null); assert.equal(typeof archive.manifest.contextError, 'string');
  assert.equal(fs.readFileSync(path.join(archive.source, 'variant-output/.variant-context.json'), 'utf8'), 'broken JSON');
});

test('a concurrent unowned-source edit leaves an incomplete archive that cannot be reused', t => {
  const s = setup(t), write = fs.writeFileSync; let changed = false;
  t.mock.method(fs, 'writeFileSync', (file, ...args) => {
    if (!changed && String(file).endsWith('/source/README.md')) { changed = true; fs.appendFileSync(path.join(s.project, 'README.md'), 'User changed shared source'); }
    return write(file, ...args);
  });
  assert.throws(() => createPhaseArchive(s.project, { directory: s.directory, phase: 'generate', snapshot: s.snapshot }), /Project changed/);
  assert.equal(changed, true); assert.equal(fs.existsSync(path.join(s.directory, 'archive.json')), false);
  assert.throws(() => createPhaseArchive(s.project, { directory: s.directory, phase: 'generate', snapshot: s.snapshot }), /Preserve existing/);
  assert.match(fs.readFileSync(path.join(s.project, 'README.md'), 'utf8'), /User changed/);
});

test('archive grading fails closed and binds actual observations to their exact phase source', t => {
  const s = setup(t), receipts = {}, reports = {};
  for (const phase of ['baseline', 'generate', 'deliver']) {
    receipts[phase] = createPhaseArchive(s.project, { directory: path.join(s.root, phase), phase, snapshot: s.snapshot });
    reports[phase] = { fingerprint: { 'variant-output/B.tsx': digest(fs.readFileSync(path.join(s.project, 'variant-output/B.tsx'))) } };
  }
  assert(gradePhaseArchives(receipts, reports).every(c => c.pass));
  for (const missing of [undefined, {}, { baseline: { pass: true } }]) assert(gradePhaseArchives(missing, reports).every(c => !c.pass));
  reports.generate.fingerprint['variant-output/B.tsx'] = '0'.repeat(64);
  assert.deepEqual(gradePhaseArchives(receipts, reports).filter(c => !c.pass).map(c => c.id), ['archive:generate']);
  assert.equal(gradePhaseArchives({ ...receipts, deliver: receipts.baseline }, reports).find(c => c.id === 'archive:deliver').pass, false);
});
