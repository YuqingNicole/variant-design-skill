import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { confirmSystem, applySystemVariant, prepareVariant, applyVariant, undoVariant, readContext, systemIdentity } from './variant-history.mjs';
import { checkDelivery } from './delivery-check.mjs';

function setup(t) {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'ds-state-')), root = path.join(project, 'variant-output');
  t.after(() => fs.rmSync(project, { recursive: true, force: true }));
  fs.mkdirSync(root);
  const state = { schemaVersion: 2, selectedVariant: 'B', activeVariant: null,
    taskContract: { primaryJob: 'Read members', data: 'shared members', requiredFunctions: ['invite'] },
    recommendation: { variant: 'B', reason: 'Member rows' }, variants: {} };
  for (const id of ['A', 'B', 'C']) {
    fs.writeFileSync(path.join(root, `${id}.html`), `<style>body{font-family:Arial;color:#123456}</style><h1>Members ${id}</h1>`);
    state.variants[id] = { entry: `${id}.html`, files: [`${id}.html`], version: 1, tokens: { fonts: ['Arial'], colors: { text: '#123456' } }, comparison: { optimizes: `${id} rows`, tradeoff: `${id} space`, bestFor: `${id} teams` }, history: [], undo: [] };
  }
  const definition = { file: 'variant-output/design-system.css', source: 'B', fonts: ['Source Sans 3'] };
  fs.writeFileSync(path.join(root, 'design-system.css'), ':root{--font-ui:"Source Sans 3",sans-serif;--color-bg:#fff;--color-on-bg:#14213d}');
  const write = state => fs.writeFileSync(path.join(root, '.variant-context.json'), JSON.stringify(state, null, 2));
  write(state);
  const candidate = name => { const dir = path.join(project, name); prepareVariant(root, 'B', dir); fs.writeFileSync(path.join(dir, 'B.html'), '<style>body{font-family:"Source Sans 3";color:#14213d}</style><h1>Members B</h1>'); return dir; };
  const change = { summary: 'apply ds B', tokens: { fonts: ['Source Sans 3'], colors: { text: '#14213d' } } };
  return { project, root, state, definition, write, candidate, change };
}

test('confirm records pending adoption and a verified context backup without editing or selecting', t => {
  const { root, state, definition } = setup(t), before = fs.readFileSync(path.join(root, '.variant-context.json'), 'utf8');
  const next = confirmSystem(root, definition);
  assert.equal(next.selectedVariant, 'B'); assert.equal(next.activeVariant, null);
  assert.deepEqual(next.variants.A, state.variants.A); assert.deepEqual(next.variants.C, state.variants.C);
  const { systemBinding, ...variant } = next.variants.B;
  assert.deepEqual(variant, state.variants.B); assert.equal(systemBinding.status, 'pending');
  assert.equal(systemBinding.digest, systemIdentity(next, path.dirname(root)));
  assert.equal(fs.readFileSync(path.join(root, 'B.html'), 'utf8').includes('Arial'), true);
  const backups = fs.readdirSync(path.join(root, '.history/system'));
  assert.equal(backups.length, 1);
  assert.equal(JSON.parse(fs.readFileSync(path.join(root, '.history/system', backups[0]), 'utf8')).context, before);
  const result = checkDelivery(root);
  assert.deepEqual(result.errors, []); assert.ok(result.warnings.some(w => /pending.*apply ds B/i.test(w)));
});

test('explicit system application aligns tokens and code atomically; undo restores pending state', t => {
  const { root, definition, candidate, change } = setup(t);
  confirmSystem(root, definition); const before = readContext(root), original = fs.readFileSync(path.join(root, 'B.html'));
  const dir = candidate('aligned');
  assert.throws(() => applyVariant(root, 'B', dir, change), /Locked/);
  applySystemVariant(root, 'B', dir, change);
  const applied = readContext(root);
  assert.equal(applied.variants.B.systemBinding.status, 'applied');
  assert.deepEqual(applied.variants.B.tokens, change.tokens);
  assert.equal(applied.variants.B.version, 2); assert.equal(applied.activeVariant, 'B'); assert.equal(applied.selectedVariant, 'B');
  assert.deepEqual(applied.variants.A, before.variants.A); assert.deepEqual(applied.variants.C, before.variants.C);
  assert.deepEqual(checkDelivery(root).errors, []);
  undoVariant(root, 'B'); const restored = readContext(root);
  assert.deepEqual(fs.readFileSync(path.join(root, 'B.html')), original);
  assert.deepEqual(restored.variants.B.tokens, before.variants.B.tokens);
  assert.deepEqual(restored.variants.B.systemBinding, before.variants.B.systemBinding);
  assert.equal(restored.selectedVariant, 'B'); assert.deepEqual(checkDelivery(root).errors, []);
});

test('system apply rejects unconfirmed locks and metadata outside the confirmed system before writing', t => {
  const { root, definition, candidate, change } = setup(t);
  const dir = candidate('unconfirmed');
  assert.throws(() => applySystemVariant(root, 'B', dir, change), /confirmed/i);
  confirmSystem(root, definition); const valid = candidate('confirmed'), before = fs.readFileSync(path.join(root, 'B.html'));
  for (const tokens of [{ fonts: ['Comic Sans MS'] }, { fonts: definition.fonts, colors: { text: '#ff00ff' } }, { fonts: definition.fonts, colors: { text: 'var(--missing)' } }]) {
    assert.throws(() => applySystemVariant(root, 'B', valid, { ...change, tokens }), /system|font|color/i);
    assert.deepEqual(fs.readFileSync(path.join(root, 'B.html')), before);
    assert.equal(readContext(root).variants.B.version, 1);
  }
});

test('system identity and candidate baselines include every extension', t => {
  const { root, definition, candidate, change } = setup(t);
  fs.writeFileSync(path.join(root, 'extension.css'), ':root{--space-4:16px}');
  fs.writeFileSync(path.join(root, 'second.css'), ':root{--radius-control:8px}');
  confirmSystem(root, { ...definition, extensions: ['variant-output/extension.css', 'variant-output/second.css'] });
  const dir = candidate('stale'), before = readContext(root), identity = systemIdentity(before, path.dirname(root));
  const reordered = structuredClone(before); reordered.designSystem.extensions.reverse();
  assert.notEqual(systemIdentity(reordered, path.dirname(root)), identity);
  const baseline = path.join(dir, '.candidate-baseline.json'), bytes = fs.readFileSync(baseline, 'utf8'), legacy = JSON.parse(bytes);
  delete legacy.designSystemFiles; fs.writeFileSync(baseline, JSON.stringify(legacy));
  assert.throws(() => applySystemVariant(root, 'B', dir, change), /Legacy candidate baseline.*extensions/);
  fs.writeFileSync(baseline, bytes);
  fs.appendFileSync(path.join(root, 'extension.css'), '\n:root{--space-8:32px}');
  assert.notEqual(systemIdentity(before, path.dirname(root)), identity);
  assert.throws(() => applySystemVariant(root, 'B', dir, change), /system.*changed|system.*content|extension/i);
  assert.deepEqual(readContext(root), before);
});

test('legacy v2 states remain strict and stale bindings cannot masquerade as pending adoption', t => {
  const { root, definition, write } = setup(t);
  const legacy = readContext(root); legacy.designSystem = { ...definition, confirmed: true }; write(legacy);
  assert.ok(checkDelivery(root).errors.some(e => /records fonts/.test(e)));
  confirmSystem(root, definition);
  const state = readContext(root); state.variants.B.systemBinding.digest = '0'.repeat(64); write(state);
  assert.ok(checkDelivery(root).errors.some(e => /binding.*stale|system.*identity/i.test(e)));
});

test('brand confirmation cannot replace the main lock or reclassify its fonts as pending', t => {
  const { root, project, definition, write } = setup(t);
  fs.writeFileSync(path.join(project, 'brand.css'), ':root{--font-ui:Arial;--ink:#123456;--paper:#fff}');
  const state = readContext(root); state.designSystem = { confirmed: true, file: 'brand.css', fonts: ['Arial'] }; write(state);
  assert.throws(() => confirmSystem(root, definition), /brand|locked/i);
  confirmSystem(root, { file: 'brand.css', fonts: ['Arial'], source: 'B' });
  const changed = readContext(root); changed.variants.A.tokens.fonts = ['Comic Sans MS']; changed.variants.B.tokens.fonts = ['Comic Sans MS']; write(changed);
  assert.ok(checkDelivery(root).errors.some(e => /records fonts/.test(e)));
  assert.ok(checkDelivery(root).errors.some(e => /Variant A records fonts/.test(e)));
});

test('confirmation requires explicit picked source and refuses symlinked system files', t => {
  const { root, project, definition, write } = setup(t);
  const state = readContext(root); state.selectedVariant = null; write(state);
  assert.throws(() => confirmSystem(root, definition), /select|pick/i);
  state.selectedVariant = 'B'; write(state);
  fs.unlinkSync(path.join(root, 'design-system.css')); fs.writeFileSync(path.join(project, 'outside.css'), ':root{}'); fs.symlinkSync(path.join(project, 'outside.css'), path.join(root, 'design-system.css'));
  assert.throws(() => confirmSystem(root, definition), /Symlink/);
});

test('adoption undo still protects later edits and groups one request', t => {
  const { root, definition, candidate, change } = setup(t);
  confirmSystem(root, definition); const before = readContext(root);
  applySystemVariant(root, 'B', candidate('one'), { ...change, request: 'adopt' });
  const second = candidate('two'); fs.appendFileSync(path.join(second, 'B.html'), '<p>Aligned</p>');
  applySystemVariant(root, 'B', second, { ...change, request: 'adopt' });
  undoVariant(root, 'B');
  assert.deepEqual(readContext(root).variants.B.systemBinding, before.variants.B.systemBinding);
  applySystemVariant(root, 'B', candidate('three'), change);
  fs.appendFileSync(path.join(root, 'B.html'), '<p>User work</p>');
  assert.throws(() => undoVariant(root, 'B'), /changed since/);
  assert.match(fs.readFileSync(path.join(root, 'B.html'), 'utf8'), /User work/);
});

test('an explicitly adopted exploration is checked too, without selecting it', t => {
  const { root, project, definition, change, write } = setup(t);
  confirmSystem(root, definition);
  const dir = path.join(project, 'align-A'); prepareVariant(root, 'A', dir);
  fs.writeFileSync(path.join(dir, 'A.html'), '<style>body{font-family:"Source Sans 3";color:#14213d}</style><h1>Members A</h1>');
  applySystemVariant(root, 'A', dir, change);
  assert.equal(readContext(root).selectedVariant, 'B'); assert.equal(readContext(root).activeVariant, 'A');
  assert.deepEqual(checkDelivery(root).errors, []);
  const state = readContext(root); state.variants.A.tokens.fonts = ['Comic Sans MS']; write(state);
  assert.ok(checkDelivery(root).errors.some(e => /Variant A records fonts/.test(e)));
});

test('confirmation and adoption work through the installed CLI contract', t => {
  const { root, project, definition, candidate, change } = setup(t), cli = fileURLToPath(new URL('./variant-history.mjs', import.meta.url));
  const system = path.join(project, 'system.json'), meta = path.join(project, 'change.json');
  fs.writeFileSync(system, JSON.stringify(definition)); fs.writeFileSync(meta, JSON.stringify(change));
  execFileSync(process.execPath, [cli, 'confirm-system', root, system]);
  execFileSync(process.execPath, [cli, 'apply-system', root, 'B', candidate('cli'), meta]);
  assert.equal(readContext(root).variants.B.systemBinding.status, 'applied');
});

test('confirmation does not write context if its durable backup fails', t => {
  const { root, definition } = setup(t), before = fs.readFileSync(path.join(root, '.variant-context.json'), 'utf8'), write = fs.writeFileSync;
  fs.writeFileSync = (file, ...args) => { if (String(file).includes(`${path.sep}.history${path.sep}system${path.sep}`)) throw new Error('Injected backup failure'); return write(file, ...args); };
  try { assert.throws(() => confirmSystem(root, definition), /Injected backup failure/); }
  finally { fs.writeFileSync = write; }
  assert.equal(fs.readFileSync(path.join(root, '.variant-context.json'), 'utf8'), before);
  assert.equal(fs.existsSync(path.join(root, '.variant-lock')), false);
});
