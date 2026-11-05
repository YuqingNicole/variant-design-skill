import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { preparePreview, sealPreview, publishPreview, cleanupPreview } from './preview-files.mjs';
import { buildPreview } from './build-preview.mjs';
import { fixture } from '../tests/fixture.mjs';

function setup(t) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'variant-preview-owned-')));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return { root, file: relative => path.join(root, relative), read: relative => fs.readFileSync(path.join(root, relative), 'utf8') };
}
test('publish refuses existing files before touching any target, including byte-identical files', t => {
  const { root, file, read } = setup(t); fs.writeFileSync(file('keep.html'), 'same');
  assert.throws(() => publishPreview(root, 'collision', { 'new.html': 'new', 'keep.html': 'same' }), /Preserve existing/);
  assert.equal(read('keep.html'), 'same'); assert(!fs.existsSync(file('new.html')));
  assert(!fs.existsSync(file('.variant-work/preview-files/collision/plan.json')));
});
test('native ownership starts with absent paths, seals once, preserves unknown files and changed adapters', t => {
  const { root, file, read } = setup(t);
  fs.mkdirSync(file('src')); fs.writeFileSync(file('src/existing.tsx'), 'original');
  assert.throws(() => preparePreview(root, 'bad', ['src/existing.tsx']), /Preserve existing/);
  preparePreview(root, 'native', ['src/preview.tsx', 'compare.html']);
  fs.writeFileSync(file('src/preview.tsx'), 'adapter'); fs.writeFileSync(file('compare.html'), 'compare');
  const receipt = sealPreview(root, 'native');
  assert.throws(() => sealPreview(root, 'native'), /already sealed/);
  fs.appendFileSync(file('src/preview.tsx'), ' user edit'); fs.writeFileSync(file('unknown.html'), 'user');
  const result = cleanupPreview(root, receipt.receipt);
  assert.deepEqual(result.removed, ['compare.html']); assert.deepEqual(result.conflicts, ['src/preview.tsx']);
  assert.equal(read('src/existing.tsx'), 'original'); assert.equal(read('src/preview.tsx'), 'adapter user edit'); assert.equal(read('unknown.html'), 'user');
  const backup = JSON.parse(read(result.operation)); assert.equal(Buffer.from(backup.before['compare.html'].content, 'base64').toString(), 'compare');
  assert(fs.statSync(file('src')).isDirectory());
});
test('refresh guards all old paths, updates ownership, retires obsolete files and rejects old receipts', t => {
  const { root, file, read } = setup(t);
  const first = publishPreview(root, 'compare', { 'compare.html': 'v1', 'mount.tsx': 'mount' });
  const second = publishPreview(root, 'compare', { 'compare.html': 'v2', 'next.tsx': 'next' });
  assert.equal(read('compare.html'), 'v2'); assert(!fs.existsSync(file('mount.tsx')));
  assert.throws(() => cleanupPreview(root, first.receipt), /Stale/);
  assert.equal(read('next.tsx'), 'next');
  assert.deepEqual(cleanupPreview(root, second.receipt).removed, ['compare.html', 'next.tsx']);
  assert.deepEqual(cleanupPreview(root, second.receipt).missing, ['compare.html', 'next.tsx']);
});
test('edited bytes or permissions stop the whole refresh and survive cleanup', t => {
  for (const edit of ['bytes', 'mode']) {
    const { root, file, read } = setup(t);
    const first = publishPreview(root, 'compare', { 'a.html': 'a', 'b.html': 'b' });
    if (edit === 'bytes') fs.appendFileSync(file('b.html'), ' edit'); else fs.chmodSync(file('b.html'), 0o600);
    assert.throws(() => publishPreview(root, 'compare', { 'a.html': 'changed', 'b.html': 'changed' }), /Preview conflict/);
    assert.equal(read('a.html'), 'a');
    const result = cleanupPreview(root, first.receipt); assert.deepEqual(result.removed, ['a.html']); assert.deepEqual(result.conflicts, ['b.html']);
    assert(fs.existsSync(file('b.html')));
  }
});
test('recreated same-name same-byte files are preserved, including after a completed cleanup', t => {
  const { root, file } = setup(t); const first = publishPreview(root, 'compare', { 'a.html': 'a' });
  // Rename keeps the old inode allocated, avoiding inode reuse in the test itself.
  fs.renameSync(file('a.html'), file('user-kept-original.html')); fs.writeFileSync(file('a.html'), 'a');
  assert.deepEqual(cleanupPreview(root, first.receipt).conflicts, ['a.html']);
  const second = publishPreview(root, 'other', { 'b.html': 'b' }); cleanupPreview(root, second.receipt);
  fs.writeFileSync(file('b.html'), 'b'); assert.deepEqual(cleanupPreview(root, second.receipt).conflicts, ['b.html']);
  assert(fs.existsSync(file('a.html')) && fs.existsSync(file('b.html')));
});
test('paths, symlinks, directories, hard links and special files cannot be owned', t => {
  const { root, file } = setup(t);
  for (const relative of ['../outside', '/absolute', '.git/config', '.history/x', '.variant-context.json', '.variant-work/preview-files/x']) assert.throws(() => preparePreview(root, 'bad', [relative]));
  fs.mkdirSync(file('dir')); assert.throws(() => preparePreview(root, 'directory', ['dir']), /regular/);
  fs.symlinkSync(file('dir'), file('alias')); assert.throws(() => preparePreview(root, 'alias', ['alias/a.html']), /Symlink/);
  fs.writeFileSync(file('original'), 'original'); fs.linkSync(file('original'), file('hard')); assert.throws(() => preparePreview(root, 'hard', ['hard']), /unlinked/);
  if (process.platform !== 'win32') { execFileSync('mkfifo', [file('pipe')]); assert.throws(() => preparePreview(root, 'pipe', ['pipe']), /regular/); }
  assert.throws(() => preparePreview(root, 'duplicates', ['new.html', 'new.html']), /unique/);
});
test('a linked adapter or parent is preserved at cleanup rather than followed', t => {
  const { root, file, read } = setup(t); const first = publishPreview(root, 'native', { 'adapter/a.html': 'a', 'other.html': 'b' });
  fs.renameSync(file('adapter'), file('kept')); fs.symlinkSync(file('kept'), file('adapter'));
  const result = cleanupPreview(root, first.receipt); assert.deepEqual(result.conflicts, ['adapter/a.html']); assert.deepEqual(result.removed, ['other.html']); assert.equal(read('kept/a.html'), 'a');
});
test('receipt or plan tampering and a busy lock fail without deleting source', t => {
  const { root, file, read } = setup(t); const receipt = publishPreview(root, 'native', { 'a.html': 'a' });
  const raw = read(receipt.receipt); fs.appendFileSync(file(receipt.receipt), ' '); assert.throws(() => cleanupPreview(root, receipt.receipt), /changed/); assert.equal(read('a.html'), 'a');
  fs.writeFileSync(file(receipt.receipt), raw);
  fs.mkdirSync(file('.variant-work/preview-files/.lock')); assert.throws(() => cleanupPreview(root, receipt.receipt), /holds the lock/); fs.rmdirSync(file('.variant-work/preview-files/.lock'));
  fs.appendFileSync(file('.variant-work/preview-files/native/plan.json'), ' '); assert.throws(() => cleanupPreview(root, receipt.receipt), /plan or receipt changed/); assert.equal(read('a.html'), 'a');
});
test('cleanup persists backup first and continues after an actual unlink failure', t => {
  const { root, file, read } = setup(t); const receipt = publishPreview(root, 'native', { 'a.html': 'a', 'b.html': 'b' });
  const unlink = fs.unlinkSync; let backupObserved = false;
  t.mock.method(fs, 'unlinkSync', target => {
    if (target === file('a.html')) { const record = fs.readdirSync(file('.variant-work/preview-files/native')).find(x => x.endsWith('.cleanup.json')); backupObserved = Boolean(JSON.parse(read(`.variant-work/preview-files/native/${record}`)).before['a.html'].content); throw new Error('injected filesystem failure'); }
    return unlink(target);
  });
  const result = cleanupPreview(root, receipt.receipt); assert(backupObserved); assert.deepEqual(result.removed, ['b.html']); assert.equal(result.errors[0].file, 'a.html'); assert.equal(read('a.html'), 'a');
  t.mock.restoreAll(); assert.deepEqual(cleanupPreview(root, receipt.receipt).removed, ['a.html']);
});
test('write failure restores only helper writes and retains the operation backup', t => {
  const { root, file, read } = setup(t); publishPreview(root, 'native', { 'a.html': 'a', 'b.html': 'b' });
  const rename = fs.renameSync; let injected = false;
  t.mock.method(fs, 'renameSync', (from, to) => { if (to === file('b.html') && !injected) { injected = true; throw new Error('injected second write failure'); } return rename(from, to); });
  assert.throws(() => publishPreview(root, 'native', { 'a.html': 'new a', 'b.html': 'new b' }), /Backup:.*Recovery conflicts: none/);
  assert.equal(read('a.html'), 'a'); assert.equal(read('b.html'), 'b');
  assert(fs.readdirSync(file('.variant-work/preview-files/native')).some(x => x.endsWith('.operation.json')));
  const pointer = JSON.parse(read('.variant-work/preview-files/native/current.json'));
  t.mock.restoreAll(); assert.deepEqual(cleanupPreview(root, pointer.receipt).removed, ['a.html', 'b.html']);
});
test('publish recovery preserves a later user edit and reports its exact path', t => {
  const { root, file, read } = setup(t); publishPreview(root, 'native', { 'a.html': 'a', 'b.html': 'b' });
  const rename = fs.renameSync;
  t.mock.method(fs, 'renameSync', (from, to) => { if (to === file('b.html')) { fs.appendFileSync(file('a.html'), ' user edit'); throw new Error('injected interruption'); } return rename(from, to); });
  assert.throws(() => publishPreview(root, 'native', { 'a.html': 'new a', 'b.html': 'new b' }), /Recovery conflicts: a.html/);
  assert.equal(read('a.html'), 'new a user edit'); assert.equal(read('b.html'), 'b');
});
test('cleanup rechecks after backup and preserves an edit arriving before deletion', t => {
  const { root, file, read } = setup(t); const receipt = publishPreview(root, 'native', { 'a.html': 'a', 'b.html': 'b' });
  const write = fs.writeFileSync;
  t.mock.method(fs, 'writeFileSync', (target, ...args) => { const result = write(target, ...args); if (String(target).endsWith('.cleanup.json')) fs.appendFileSync(file('a.html'), ' late edit'); return result; });
  const result = cleanupPreview(root, receipt.receipt); assert.deepEqual(result.conflicts, ['a.html']); assert.deepEqual(result.removed, ['b.html']); assert.equal(read('a.html'), 'a late edit');
});
test('bundled comparison owns adapters, preserves edits on rebuild, and cleanup leaves variants and selection', t => {
  const { root, file, read } = setup(t), output = file('variant-output'); fixture(output);
  const context = read('variant-output/.variant-context.json'), variant = read('variant-output/VariantB.tsx');
  const result = buildPreview(output); assert(result.ownership?.receipt);
  fs.appendFileSync(file('variant-output/_preview/B.tsx'), '\n// user edit');
  assert.throws(() => buildPreview(output), /Preview conflict/);
  const cleaned = cleanupPreview(root, result.ownership.receipt); assert(cleaned.conflicts.includes('variant-output/_preview/B.tsx'));
  assert.equal(read('variant-output/.variant-context.json'), context); assert.equal(read('variant-output/VariantB.tsx'), variant);
});
test('CLI prepares before creation, seals, publishes staged bytes and returns cleanup conflicts as exit 2', t => {
  const { root, file, read } = setup(t), script = path.resolve('scripts/preview-files.mjs');
  fs.mkdirSync(file('.variant-work')); fs.writeFileSync(file('.variant-work/paths.json'), JSON.stringify(['adapter.html']));
  execFileSync(process.execPath, [script, 'prepare', root, 'cli', file('.variant-work/paths.json')]); fs.writeFileSync(file('adapter.html'), 'first');
  execFileSync(process.execPath, [script, 'seal', root, 'cli']);
  fs.mkdirSync(file('.variant-work/stage')); fs.writeFileSync(file('.variant-work/stage/adapter.html'), 'staged');
  const published = JSON.parse(execFileSync(process.execPath, [script, 'publish', root, 'cli', file('.variant-work/stage')], { encoding: 'utf8' }));
  assert.equal(read('adapter.html'), 'staged'); fs.appendFileSync(file('adapter.html'), ' user edit');
  let failure; try { execFileSync(process.execPath, [script, 'cleanup', root, published.receipt], { encoding: 'utf8', stdio: 'pipe' }); } catch (error) { failure = error; }
  assert.equal(failure.status, 2); assert.deepEqual(JSON.parse(failure.stdout).conflicts, ['adapter.html']); assert.equal(read('adapter.html'), 'staged user edit');
});
test('a filesystem without creation identity is rejected before publishing a new target', t => {
  const { root, file } = setup(t), stat = fs.lstatSync;
  t.mock.method(fs, 'lstatSync', (target, options) => { const result = stat(target, options); if (options?.bigint && String(target).endsWith('.tmp')) result.birthtimeNs = 0n; return result; });
  assert.throws(() => publishPreview(root, 'unsupported', { 'a.html': 'a' }), /does not provide preview creation identity/);
  assert(!fs.existsSync(file('a.html')));
});
