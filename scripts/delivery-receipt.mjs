#!/usr/bin/env node
// Local handoff inventory. References observations; never executes handoff commands or selects.
import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { localFile, withHistoryLock } from './variant-history.mjs';
import { fingerprintArtifact, inspectVerification, compareVerificationReports } from './artifact-verification.mjs';
import { readPreviewReceipt } from './preview-files.mjs';

const need = (test, message) => { if (!test) throw new Error(message); };
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const sorted = value => Array.isArray(value) ? value.map(sorted) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, sorted(value[key])])) : value;
const same = (a, b) => JSON.stringify(sorted(a)) === JSON.stringify(sorted(b));
const sha = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const implementation = () => Object.fromEntries(['delivery-receipt.mjs', 'variant-history.mjs', 'variant-integrate.mjs', 'preview-files.mjs', 'artifact-verification.mjs', 'browser-verification.mjs', 'quality-gate.mjs', 'project-dependencies.mjs', 'dependency-references.mjs'].map(file => [file, hash(fs.readFileSync(new URL(file, import.meta.url)))]));
function name(value, prefix = '') {
  need(typeof value === 'string' && value && !value.includes('\\') && !path.isAbsolute(value) && !value.split('/').some(part => !part || part === '.' || part === '..') && value.startsWith(prefix), `Use normalized relative paths${prefix ? ` inside ${prefix}` : ''}`);
  return value;
}
function bytes(root, relative) {
  const file = localFile(root, name(relative)), stat = fs.lstatSync(file);
  need(stat.isFile() && stat.nlink === 1 && stat.size <= 16 * 1024 * 1024, `Expected a regular, unlinked file of at most 16 MiB: ${relative}`);
  return fs.readFileSync(file);
}
const read = (root, relative) => JSON.parse(bytes(root, relative));
const fileHash = (root, relative) => hash(bytes(root, relative));
function stageFiles(project, staging) {
  const base = localFile(project, name(staging, '.variant-work/')), list = {};
  let directories = 0, totalBytes = 0;
  const visit = (dir, prefix = '') => {
    need(++directories <= 512, 'Staging inventory exceeds 512 directories');
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      need(!entry.isSymbolicLink(), `Symlink in staging: ${relative}`);
      if (entry.isDirectory()) visit(localFile(base, relative), relative);
      else { need(Object.keys(list).length < 512, 'Staging inventory exceeds 512 files'); const content = bytes(base, relative); totalBytes += content.length; need(totalBytes <= 64 * 1024 * 1024, 'Staging inventory exceeds 64 MiB'); list[relative] = hash(content); }
    }
  };
  visit(base); return list;
}
function roots(output, project) {
  const out = fs.realpathSync(output), base = fs.realpathSync(project);
  need(out.startsWith(base + path.sep), 'Project must contain variant output');
  return { out, base, relative: path.relative(base, out).split(path.sep).join('/') };
}
function backup(output, id, project, relative) {
  need(typeof id === 'string' && /^[\w-]+$/.test(id), 'Invalid integration id');
  const file = `.integrations/${id}.json`, record = read(output, file);
  need(record.schemaVersion === 1 && record.id === id && record.project === project && ['A', 'B', 'C'].includes(record.variant) && record.source?.dependencyClosure?.files && record.version === record.source.version, 'Invalid integration backup or missing source coverage');
  need(Array.isArray(record.files) && record.files.length && record.files.length <= 512 && new Set(record.files.map(f => f.path)).size === record.files.length, 'Invalid integration target inventory');
  for (const entry of record.files) {
    name(entry.path);
    need(![relative, '.git', 'node_modules', '.variant-work'].some(dir => entry.path === dir || entry.path.startsWith(dir + '/')), 'Protected integration target');
    localFile(project, entry.path);
    need(sha(entry.after?.sha256) && ['create', 'overwrite', 'unchanged'].includes(entry.action), 'Invalid integration target action/hash');
    need(entry.action === 'create' ? entry.before === null : entry.before && sha(entry.before.sha256) && typeof entry.before.content === 'string' && hash(Buffer.from(entry.before.content, 'base64')) === entry.before.sha256, 'Integration backup prior bytes/hash differ');
    need(entry.action === 'create' || (entry.action === 'unchanged') === (entry.before.sha256 === entry.after.sha256), 'Integration target action differs from hashes');
  }
  need(record.rolledBackAt === null || typeof record.rolledBackAt === 'string' && Number.isFinite(Date.parse(record.rolledBackAt)), 'Invalid rollback lifecycle');
  return { file, record };
}
const sourceView = source => ({ version: source.version, entry: source.entry, tokens: source.tokens, comparison: source.comparison, taskContract: source.taskContract, designSystem: source.designSystem, systemBinding: source.systemBinding, files: source.files });
function observation(output, file, project, record, after) {
  if (!file) return null;
  name(file, '.verification/');
  const rawHash = fileHash(output, file), inspected = inspectVerification(output, localFile(output, file)), report = inspected.report, fp = report.fingerprint;
  need(fp.output === output && fp.project === project && fp.id === record.variant && same(sourceView(fp), sourceView(record.source)), 'Verification report belongs to another project, variant, revision or source');
  for (const entry of record.files) {
    // A missing-before target is represented by its absence, never a made-up hash.
    const expected = after ? entry.after.sha256 : entry.before?.sha256;
    need(expected ? fp.dependencies[entry.path] === expected : !Object.hasOwn(fp.dependencies, entry.path), 'Verification report lacks the integration target baseline');
  }
  if (after) need(inspected.status !== 'stale', 'After-integration verification is stale; run checks again');
  return { file, sha256: rawHash, status: inspected.status, report };
}
function preview(project, file) {
  name(file, '.variant-work/preview-files/');
  const receipt = readPreviewReceipt(project, file), files = {};
  for (const [relative, expected] of Object.entries(receipt.files)) {
    let actual = null;
    try {
      const full = localFile(project, relative), stat = fs.lstatSync(full, { bigint: true });
      need(stat.isFile() && stat.nlink === 1n, 'Preview file is not a regular unlinked file');
      actual = { sha256: fileHash(project, relative), mode: Number(stat.mode & 0o777n), identity: { dev: String(stat.dev), ino: String(stat.ino), birthtimeNs: String(stat.birthtimeNs) } };
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
    files[relative] = { expected: { sha256: expected.sha256, mode: expected.mode, identity: expected.identity }, actual };
  }
  return { file, sha256: fileHash(project, file), group: receipt.group, status: Object.values(files).every(item => same(item.actual, item.expected)) ? 'current' : 'conflicts', files };
}
function capture(output, id, options) {
  const { out, base, relative } = roots(output, options.projectRoot ?? path.dirname(path.resolve(output)));
  name(options.plan, '.variant-work/'); name(options.staging, '.variant-work/');
  const { file, record } = backup(out, id, base, relative);
  need(record.rolledBackAt === null, 'Integration is already rolled back; preserve its historical receipt');
  const plan = read(base, options.plan), staged = stageFiles(base, options.staging);
  need(plan.schemaVersion === 1 && plan.project === base && plan.output === out && plan.variant === record.variant && same(plan.source, record.source), 'Integration plan differs from backup source/project');
  const files = [...record.files].sort((a, b) => a.path.localeCompare(b.path));
  need(same(Object.keys(plan.targets).sort(), files.map(f => f.path).sort()) && same(Object.keys(staged).sort(), files.map(f => f.path).sort()), 'Plan, staging and backup target sets differ');
  for (const entry of files) {
    need(plan.targets[entry.path] === (entry.before?.sha256 ?? null), 'Plan target baseline differs from backup');
    need(staged[entry.path] === entry.after.sha256, `Staging differs from integrated bytes: ${entry.path}`);
    need(fileHash(base, entry.path) === entry.after.sha256, `Integrated target changed: ${entry.path}`);
  }
  const targets = files.map(f => f.path), fingerprint = fingerprintArtifact(out, record.variant, { projectRoot: base, dependencies: targets });
  need(same(sourceView(fingerprint), sourceView(record.source)), 'Integrated source, revision or constraints changed');
  for (const [dependency, expected] of Object.entries(record.source.dependencyClosure.files)) if (!targets.includes(dependency)) need(fileHash(base, dependency) === expected.sha256, `Shared dependency changed after integration: ${dependency}`);
  const before = observation(out, options.beforeReport, base, record, false), after = observation(out, options.afterReport, base, record, true);
  if (before) for (const [dependency, expected] of Object.entries(before.report.fingerprint.dependencies)) if (!targets.includes(dependency)) need(fileHash(base, dependency) === expected, 'Baseline report shared dependencies differ from current source');
  need(options.previewReceipts === undefined || Array.isArray(options.previewReceipts) && options.previewReceipts.length <= 16 && new Set(options.previewReceipts).size === options.previewReceipts.length, 'List at most 16 distinct preview receipts');
  const previews = (options.previewReceipts ?? []).map(file => preview(base, file));
  const summary = item => item && { file: item.file, sha256: item.sha256, status: item.status, version: item.report.fingerprint.version, checks: item.report.checks.map(({ id, status, reason }) => ({ id, status, reason })), static: item.report.static.status };
  const coverage = fingerprint.dependencyClosure.coverage;
  const verificationStatus = !after ? 'unverified' : after.status === 'failed' ? 'failed' : coverage.status !== 'within-supported-static-syntax' || previews.some(p => p.status !== 'current') ? 'unverified' : after.status;
  return { project: base, output: out, variant: record.variant, version: record.version, integrationId: id,
    fingerprint, inventory: files.map(({ path, action, before, after }) => ({ path, action, before: before?.sha256 ?? null, after: after.sha256 })),
    integration: { file, sha256: fileHash(out, file), contentIdentity: hash(JSON.stringify(sorted(record))), source: record.source, selectedAtIntegration: record.selectedVariant ?? null },
    plan: { file: options.plan, sha256: fileHash(base, options.plan) }, staging: { directory: options.staging, files: staged },
    reports: { before: summary(before), after: summary(after) }, previews, verificationStatus,
    baseline: before && after ? { status: 'recorded', comparison: compareVerificationReports(before.report, after.report) } : { status: 'unverified', reason: 'Both version-bound before/after reports are required to classify recorded prior diagnostics.' },
    recovery: { cwd: base, argv: ['node', fileURLToPath(new URL('./variant-integrate.mjs', import.meta.url)), 'rollback', relative, id, base] },
    implementation: implementation() };
}
export function createDeliveryReceipt(output, id, options = {}) {
  return withHistoryLock(output, () => {
    const snapshot = capture(output, id, options);
    need(same(snapshot, capture(output, id, options)), 'Delivery changed while recording; preserve files and retry with fresh evidence');
    const record = { schemaVersion: 1, id: randomUUID(), at: new Date().toISOString(), ...snapshot,
      limitation: 'Local unsigned inventory and recorded observations only. Digests do not authenticate observers, execute commands, prove full environment freshness or establish product acceptance.' };
    const file = localFile(output, `.deliveries/${record.id}.json`), text = JSON.stringify(record, null, 2) + '\n';
    fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, text, { flag: 'wx', flush: true });
    need(fs.readFileSync(file, 'utf8') === text, 'Delivery receipt verification failed');
    return { file, inventoryStatus: 'current', phase: 'integrated', verificationStatus: record.verificationStatus, record };
  });
}
export function inspectDeliveryReceipt(output, receiptFile) {
  const out = fs.realpathSync(output), relative = path.isAbsolute(receiptFile) ? path.relative(out, receiptFile).split(path.sep).join('/') : receiptFile;
  name(relative, '.deliveries/'); const record = read(out, relative);
  need(record.schemaVersion === 1 && record.output === out && typeof record.integrationId === 'string' && record.plan?.file && record.staging?.directory && record.fingerprint, 'Invalid delivery receipt or different project/output');
  const stale = (reason, phase = 'drifted') => ({ file: localFile(out, relative), inventoryStatus: 'stale', phase, verificationStatus: 'stale', reason, recordedVerificationStatus: record.verificationStatus, record });
  try {
    roots(out, record.project);
    need(record.integration?.file === `.integrations/${record.integrationId}.json`, 'Invalid backup reference');
    const { record: integration } = backup(out, record.integrationId, record.project, path.relative(record.project, out).split(path.sep).join('/'));
    if (integration.rolledBackAt !== null) {
      const original = { ...integration, rolledBackAt: null };
      // The only allowed historical mutation is the helper's rollback timestamp.
      need(hash(JSON.stringify(sorted(original))) === record.integration.contentIdentity, 'Rolled-back backup identity or inventory changed');
      const restored = record.inventory.every(entry => { const full = localFile(record.project, entry.path); return entry.before === null ? !fs.existsSync(full) : fileHash(record.project, entry.path) === entry.before; });
      return stale(restored ? 'Integration was rolled back; observations describe the historical integrated output.' : 'Integration was rolled back and restored targets changed afterwards.', restored ? 'rolled-back' : 'rolled-back-drifted');
    }
    const current = capture(out, record.integrationId, { projectRoot: record.project, plan: record.plan.file, staging: record.staging.directory, beforeReport: record.reports?.before?.file, afterReport: record.reports?.after?.file, previewReceipts: record.previews.map(p => p.file) });
    const { schemaVersion, id, at, limitation, ...expected } = record;
    if (!same(expected, current)) return stale('Delivery source, targets, evidence, preview, inventory or checker implementation changed.');
    return { file: localFile(out, relative), inventoryStatus: 'current', phase: 'integrated', verificationStatus: current.verificationStatus, record };
  } catch (error) { return stale(error.message); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
  const [action, output, idOrFile, config] = process.argv.slice(2);
  try {
    if (action === '--help') console.log('delivery-receipt.mjs record <output> <integration-id> <config.json> | status <output> <receipt-file>');
    else {
      const result = action === 'record' && config ? createDeliveryReceipt(output, idOrFile, JSON.parse(fs.readFileSync(config))) : action === 'status' ? inspectDeliveryReceipt(output, idOrFile) : null;
      need(result, 'Usage: delivery-receipt.mjs record <output> <integration-id> <config.json> | status <output> <receipt-file>');
      console.log(JSON.stringify(result, null, 2)); process.exitCode = result.inventoryStatus === 'current' && result.verificationStatus === 'passed' ? 0 : 2;
    }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
