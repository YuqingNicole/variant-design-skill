import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';
import { fixture } from '../tests/fixture.mjs';
import { prepareIntegration, integrateVariant, rollbackIntegration } from './variant-integrate.mjs';
import { verifyArtifact } from './artifact-verification.mjs';
import { preparePreview, sealPreview, cleanupPreview } from './preview-files.mjs';
import { createDeliveryReceipt, inspectDeliveryReceipt } from './delivery-receipt.mjs';

const compiler = path.dirname(createRequire(new URL('../tests/package.json', import.meta.url)).resolve('typescript/package.json'));
const ids = ['brand', 'keyboard-focus', 'reduced-motion', 'scope-preservation', 'project-checks'];
// Controlled observations test receipt binding, not browser or product acceptance.
const observed = (failure = false) => ids.map(id => ({ id, status: failure && id === 'project-checks' ? 'failed' : 'passed', reason: failure && id === 'project-checks' ? 'Controlled existing diagnostic' : 'Controlled receipt contract observation', tool: { name: 'receipt-test-adapter', version: '1' }, environment: { contractTest: true }, evidence: ['Controlled observation for schema/binding only'] }));
async function setup(t, { reports = true, failure = false } = {}) {
  const project = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'variant-delivery-'))), output = path.join(project, 'variant-output');
  t.after(() => fs.rmSync(project, { recursive: true, force: true }));
  fixture(output);
  const write = (file, content) => { const full = path.join(project, file); fs.mkdirSync(path.dirname(full), { recursive: true }); fs.writeFileSync(full, content); };
  fs.mkdirSync(path.join(project, 'node_modules')); fs.symlinkSync(compiler, path.join(project, 'node_modules/typescript'), process.platform === 'win32' ? 'junction' : 'dir');
  write('package.json', '{"dependencies":{"react":"19.1.1"}}'); write('tsconfig.json', '{"include":["src","variant-output"]}');
  write('index.html', '<h1>Original</h1>'); write('src/App.tsx', 'export const App=()=>null;'); write('src/global.css', 'body{color:blue}');
  fs.appendFileSync(path.join(output, 'VariantB.tsx'), "\nimport '../src/global.css';\n");
  const options = { projectRoot: project, plan: '.variant-work/plan.json', staging: '.variant-work/stage' };
  if (reports) { const result = await verifyArtifact(output, 'B', { projectRoot: project, dependencies: ['index.html', 'src/App.tsx'] }, () => observed(failure)); options.beforeReport = path.relative(output, result.file).split(path.sep).join('/'); }
  prepareIntegration(output, 'B', ['index.html', 'src/App.tsx', 'src/New.txt'], path.join(project, options.plan), project);
  write(options.staging + '/index.html', '<h1>Direction B</h1>'); write(options.staging + '/src/App.tsx', 'export const App=()=>null;'); write(options.staging + '/src/New.txt', 'export const New=()=>null;');
  const integration = integrateVariant(output, 'B', path.join(project, options.staging), project, path.join(project, options.plan));
  if (reports) { const result = await verifyArtifact(output, 'B', { projectRoot: project, dependencies: integration.files.map(f => f.path) }, () => observed(failure)); options.afterReport = path.relative(output, result.file).split(path.sep).join('/'); assert.notEqual(result.status, 'stale'); }
  return { project, output, options, integration, write };
}
const receiptCount = output => fs.existsSync(path.join(output, '.deliveries')) ? fs.readdirSync(path.join(output, '.deliveries')).length : 0;
test('pending integration or restoration cannot create or retain current delivery acceptance', async t => {
  for (const pending of ['apply','rollback']) {
    const { output, options, integration } = await setup(t), receipt = createDeliveryReceipt(output,integration.id,options);
    if (pending === 'apply') {
      const file=path.join(output,'.integrations',integration.id+'.json'),record=JSON.parse(fs.readFileSync(file));record.appliedAt=null;fs.writeFileSync(file,JSON.stringify(record));
    } else {
      const dir=path.join(output,'.integrations/recovery');fs.mkdirSync(dir);fs.writeFileSync(path.join(dir,integration.id+'.json'),'{}');
    }
    assert.throws(()=>createDeliveryReceipt(output,integration.id,options),/interrupted|restoration has started/);
    assert.equal(inspectDeliveryReceipt(output,receipt.file).inventoryStatus,'stale');assert.equal(receiptCount(output),1);
  }
});
test('receipt inventories real create/overwrite/unchanged, binds checks and leaves project/selection unchanged', async t => {
  const { project, output, options, integration } = await setup(t), context = fs.readFileSync(path.join(output, '.variant-context.json'), 'utf8');
  const result = createDeliveryReceipt(output, integration.id, options);
  assert.equal(result.inventoryStatus, 'current'); assert.equal(result.verificationStatus, 'passed');
  assert.deepEqual(result.record.inventory.map(f => `${f.action} ${f.path}`), ['overwrite index.html', 'unchanged src/App.tsx', 'create src/New.txt']);
  assert(result.record.inventory.every(f => !Object.hasOwn(f, 'content') && !Object.hasOwn(f, 'next')));
  assert.equal(result.record.baseline.status, 'recorded'); assert.equal(result.record.baseline.comparison.failures.length, 0);
  assert.equal(inspectDeliveryReceipt(output, result.file).inventoryStatus, 'current');
  assert.equal(fs.readFileSync(path.join(output, '.variant-context.json'), 'utf8'), context); assert.equal(fs.readFileSync(path.join(project, 'index.html'), 'utf8'), '<h1>Direction B</h1>');
  const old = fs.readFileSync(result.file); const another = createDeliveryReceipt(output, integration.id, options); assert.notEqual(another.file, result.file); assert.deepEqual(fs.readFileSync(result.file), old);
  assert.equal(result.record.recovery.argv.at(-2), integration.id);
});
test('missing checks stay unverified and real failures retain prior-diagnostic classification', async t => {
  const missing = await setup(t, { reports: false }); const candidate = createDeliveryReceipt(missing.output, missing.integration.id, missing.options);
  assert.equal(candidate.verificationStatus, 'unverified'); assert.equal(candidate.record.baseline.status, 'unverified');
  const failed = await setup(t, { failure: true }); const failure = createDeliveryReceipt(failed.output, failed.integration.id, failed.options);
  assert.equal(failure.verificationStatus, 'failed'); assert.equal(failure.record.baseline.comparison.failures[0].classification, 'observed-before');
});
test('selection-only changes preserve validity; source revision, targets, shared files and staging changes stale receipt', async t => {
  for (const change of ['revision', 'target', 'shared', 'stage', 'extra', 'missing', 'plan', 'backup', 'report', 'checker']) {
    const { project, output, options, integration, write } = await setup(t), receipt = createDeliveryReceipt(output, integration.id, options), context = path.join(output, '.variant-context.json'), state = JSON.parse(fs.readFileSync(context));
    state.selectedVariant = 'C'; state.activeVariant = 'A'; fs.writeFileSync(context, JSON.stringify(state)); assert.equal(inspectDeliveryReceipt(output, receipt.file).inventoryStatus, 'current');
    if (change === 'revision') { state.variants.B.version++; fs.writeFileSync(context, JSON.stringify(state)); }
    if (change === 'target') write('index.html', '<h1>User edit</h1>');
    if (change === 'shared') write('src/global.css', 'body{color:red}');
    if (change === 'stage') write(options.staging + '/index.html', 'changed staging');
    if (change === 'extra') write(options.staging + '/extra.html', 'extra');
    if (change === 'missing') fs.unlinkSync(path.join(project, options.staging, 'src/New.txt'));
    if (change === 'plan') fs.appendFileSync(path.join(project, options.plan), '\n');
    if (change === 'backup') fs.appendFileSync(path.join(output, '.integrations', integration.id + '.json'), '\n');
    if (change === 'report') fs.appendFileSync(path.join(output, options.afterReport), '\n');
    if (change === 'checker') { const altered=JSON.parse(fs.readFileSync(receipt.file));altered.implementation['delivery-receipt.mjs']='0'.repeat(64);fs.writeFileSync(receipt.file,JSON.stringify(altered)); }
    const old = fs.readFileSync(receipt.file); assert.equal(inspectDeliveryReceipt(output, receipt.file).inventoryStatus, 'stale', change); assert.deepEqual(fs.readFileSync(receipt.file), old);
  }
});
test('invalid plan, source, backup contents, staged set and target never produce a receipt', async t => {
  for (const change of ['plan-source', 'plan-target', 'duplicate', 'before-bytes', 'action', 'source', 'shared', 'stage-extra', 'target', 'rolled-back']) {
    const { project, output, options, integration, write } = await setup(t), file = path.join(output, '.integrations', integration.id + '.json'), record = JSON.parse(fs.readFileSync(file)), planFile = path.join(project, options.plan), plan = JSON.parse(fs.readFileSync(planFile));
    if (change === 'plan-source') { plan.source.version++; fs.writeFileSync(planFile, JSON.stringify(plan)); }
    if (change === 'plan-target') { plan.targets['index.html'] = null; fs.writeFileSync(planFile, JSON.stringify(plan)); }
    if (change === 'duplicate') record.files.push(record.files[0]);
    if (change === 'before-bytes') record.files.find(f => f.before).before.content = 'YQ==';
    if (change === 'action') record.files.find(f => f.action === 'unchanged').action = 'overwrite';
    if (['duplicate', 'before-bytes', 'action'].includes(change)) fs.writeFileSync(file, JSON.stringify(record));
    if (change === 'source') fs.appendFileSync(path.join(output, 'VariantB.tsx'), '\n// later');
    if (change === 'shared') write('src/global.css', 'body{color:red}');
    if (change === 'stage-extra') write(options.staging + '/extra.txt', 'extra');
    if (change === 'target') write('index.html', 'user edit');
    if (change === 'rolled-back') rollbackIntegration(output, integration.id, project);
    assert.throws(() => createDeliveryReceipt(output, integration.id, options), /differs|differ|Invalid|changed|rolled back/); assert.equal(receiptCount(output), 0, change);
  }
});
test('wrong-direction, missing target coverage, stale and wrong-baseline reports cannot certify delivery', async t => {
  for (const change of ['wrong-direction', 'no-targets', 'stale', 'before']) {
    const { output, project, options, integration } = await setup(t);
    if (change === 'wrong-direction' || change === 'no-targets') {
      const result = await verifyArtifact(output, change === 'wrong-direction' ? 'A' : 'B', { projectRoot: project }, () => observed());
      // An unimported text target is outside the implicit TS/HTML closure.
      options.afterReport = path.relative(output, result.file).split(path.sep).join('/');
    }
    if (change === 'stale') fs.appendFileSync(path.join(project, 'src/global.css'), '/* changed */');
    if (change === 'before') options.beforeReport = options.afterReport;
    assert.throws(() => createDeliveryReceipt(output, integration.id, options), /another|baseline|stale|changed/); assert.equal(receiptCount(output), 0);
  }
});
test('real rollback retires receipt, preserves history and reports later user edits without overwriting', async t => {
  const { project, output, options, integration, write } = await setup(t), receipt = createDeliveryReceipt(output, integration.id, options), saved = fs.readFileSync(receipt.file);
  rollbackIntegration(output, integration.id, project);
  assert.equal(inspectDeliveryReceipt(output, receipt.file).phase, 'rolled-back'); assert.equal(inspectDeliveryReceipt(output, receipt.file).verificationStatus, 'stale');
  write('index.html', 'user after rollback'); assert.equal(inspectDeliveryReceipt(output, receipt.file).phase, 'rolled-back-drifted'); assert.equal(fs.readFileSync(path.join(project, 'index.html'), 'utf8'), 'user after rollback'); assert.deepEqual(fs.readFileSync(receipt.file), saved);
  const backupFile = path.join(output, '.integrations', integration.id + '.json'), backup = JSON.parse(fs.readFileSync(backupFile)); backup.selectedVariant = 'C'; fs.writeFileSync(backupFile, JSON.stringify(backup)); assert.equal(inspectDeliveryReceipt(output, receipt.file).phase, 'drifted');
});
test('preview receipts bind current ownership, retain conflicts and become stale after cleanup', async t => {
  const { project, output, options, integration, write } = await setup(t);
  preparePreview(project, 'handoff-preview', ['.variant-work/preview.html']); write('.variant-work/preview.html', '<h1>Preview</h1>'); const preview = sealPreview(project, 'handoff-preview'); options.previewReceipts = [preview.receipt];
  const receipt = createDeliveryReceipt(output, integration.id, options); assert.equal(receipt.record.previews[0].status, 'current');
  write('.variant-work/preview.html', '<h1>Edited</h1>'); const conflict = createDeliveryReceipt(output, integration.id, options); assert.equal(conflict.record.previews[0].status, 'conflicts'); assert.equal(conflict.verificationStatus, 'unverified'); assert.equal(inspectDeliveryReceipt(output, receipt.file).inventoryStatus, 'stale');
  const cleanup = cleanupPreview(project, preview.receipt); assert(cleanup.conflicts.length); assert.equal(fs.existsSync(receipt.file), true);
});
test('path traversal, symlinks, special files and foreign receipt paths refuse without partial writes', async t => {
  const { project, output, options, integration, write } = await setup(t);
  for (const patch of [{ plan: '../outside' }, { staging: 'src' }, { afterReport: '../outside' }, { previewReceipts: ['../outside'] }]) assert.throws(() => createDeliveryReceipt(output, integration.id, { ...options, ...patch }), /relative|inside/);
  const staged = path.join(project, options.staging, 'src/New.txt'), content = fs.readFileSync(staged); fs.unlinkSync(staged); fs.symlinkSync(path.join(project, 'src/New.txt'), staged);
  assert.throws(() => createDeliveryReceipt(output, integration.id, options), /Symlink/); fs.unlinkSync(staged); fs.writeFileSync(staged, content);
  if (process.platform !== 'win32') { execFileSync('mkfifo', [path.join(project, options.staging, 'pipe')]); assert.throws(() => createDeliveryReceipt(output, integration.id, options), /regular/); fs.unlinkSync(path.join(project, options.staging, 'pipe')); }
  assert.throws(()=>preparePreview(project,'bad-receipt-target',['variant-output/.deliveries/overwrite.json']),/Protected/);
  assert.equal(receiptCount(output), 0); write('.variant-work/foreign.json', '{}'); assert.throws(() => inspectDeliveryReceipt(output, path.join(project, '.variant-work/foreign.json')), /relative/);
});
test('CLI candidates use exit 2, status is read-only and history lock prevents recording', async t => {
  const { project, output, options, integration, write } = await setup(t, { reports: false }), script = fileURLToPath(new URL('./delivery-receipt.mjs', import.meta.url));
  write('.variant-work/receipt-config.json', JSON.stringify(options));
  const args = ['record', output, integration.id, path.join(project, '.variant-work/receipt-config.json')], cli = spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });
  assert.equal(cli.status, 2, cli.stderr); const result = JSON.parse(cli.stdout), saved = fs.readFileSync(result.file);
  const status = spawnSync(process.execPath, [script, 'status', output, result.file], { encoding: 'utf8' }); assert.equal(status.status, 2, status.stderr); assert.deepEqual(fs.readFileSync(result.file), saved);
  fs.mkdirSync(path.join(output, '.variant-lock')); assert.throws(() => createDeliveryReceipt(output, integration.id, options), /Another history operation/); fs.rmdirSync(path.join(output, '.variant-lock'));
  assert.equal(spawnSync(process.execPath, [script, '--help']).status, 0);
});
test('oversize files, total staging, directory limits and hard links refuse before sealing', async t => {
  for (const kind of ['file', 'total', 'directories', 'hardlink']) {
    const { project, output, options, integration } = await setup(t, { reports: false }), stage = path.join(project, options.staging);
    if (kind === 'file') { const large = path.join(stage, 'oversize.bin'); fs.writeFileSync(large, ''); fs.truncateSync(large, 16 * 1024 * 1024 + 1); }
    if (kind === 'total') for (let i = 0; i < 5; i++) { const large = path.join(stage, `large-${i}.bin`); fs.writeFileSync(large, ''); fs.truncateSync(large, 13 * 1024 * 1024); }
    if (kind === 'directories') for (let i = 0; i < 513; i++) fs.mkdirSync(path.join(stage, `empty-${i}`));
    if (kind === 'hardlink') fs.linkSync(path.join(stage, 'src/New.txt'), path.join(stage, 'linked.txt'));
    assert.throws(() => createDeliveryReceipt(output, integration.id, options), /16 MiB|64 MiB|512 directories|unlinked/); assert.equal(receiptCount(output), 0);
  }
});
