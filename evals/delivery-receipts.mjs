// Independently inspect an Agent's historical receipt, then seal and exercise a fresh real handoff in a copy.
import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { localFile, readContext } from '../scripts/variant-history.mjs';
import { prepareIntegration, integrateVariant, rollbackIntegration } from '../scripts/variant-integrate.mjs';
import { verifyArtifact } from '../scripts/artifact-verification.mjs';
import { createDeliveryReceipt, inspectDeliveryReceipt } from '../scripts/delivery-receipt.mjs';
import { inspectNativeDelivery } from './native-delivery.mjs';
import { captureNativeVite, gradeNativeVite } from './native-vite.mjs';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const need = (test, message) => { if (!test) throw new Error(message); };
const read = (root, file) => fs.readFileSync(localFile(root, file));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
const equivalent = (a, b) => same(canonical(a), canonical(b));
const inventory = record => record.files.map(({ path, action, before, after }) => ({ path, action, before: before?.sha256 ?? null, after: after.sha256 })).sort((a, b) => a.path.localeCompare(b.path));
const tree = root => {
  const result = {}, visit = (dir, prefix = '') => { for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!prefix && ['.git', 'node_modules', 'dist'].includes(entry.name)) continue;
    const file = prefix ? `${prefix}/${entry.name}` : entry.name; need(!entry.isSymbolicLink(), 'Symlink in receipt probe source');
    if (entry.isDirectory()) visit(localFile(root, file), file); else { need(entry.isFile(), 'Special receipt probe source'); result[file] = hash(read(root, file)); }
  } };
  visit(root); return Object.fromEntries(Object.entries(result).sort(([a], [b]) => a.localeCompare(b)));
};
export const deliveryReceiptGates = ['installed-helpers', 'agent-receipt', 'target-inventory', 'current-observations', 'sealed-receipt', 'target-drift', 'report-drift', 'source-drift', 'rolled-back', 'source-project-unchanged'];
export function gradeDeliveryReceipts(report) {
  return deliveryReceiptGates.map(id => { const matches = report?.checks?.filter(c => c?.id === id) ?? []; return { id, pass: report?.source === 'host-delivery-receipt-probe-v1' && !report.error && matches.length === 1 && matches[0].pass === true, details: matches[0]?.details ?? [report?.error ?? 'Missing independent delivery receipt probe'] }; });
}
export async function probeDeliveryReceipts(project, { out, browser, generated, baseline, delivery, manifest } = {}) {
  project = fs.realpathSync(project);
  need(typeof out === 'string' && !fs.existsSync(out), 'Preserve existing receipt evidence; use a fresh directory');
  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  out = path.join(fs.realpathSync(path.dirname(path.resolve(out))), path.basename(out));
  need(path.relative(project, out).startsWith('..' + path.sep), 'Receipt evidence must be outside the Agent project'); fs.mkdirSync(out);
  const originalBefore = tree(project), checks = [], actions = [], helperSha256 = {}, observations = {}, add = (id, pass, details = []) => checks.push({ id, pass: Boolean(pass), details });
  let copy, agentReceipt, sealed, error;
  try {
    const actual = inspectNativeDelivery(project, { generated, baseline, delivery }), output = localFile(project, 'variant-output');
    for (const file of ['delivery-receipt.mjs', 'variant-history.mjs', 'variant-integrate.mjs', 'artifact-verification.mjs', 'browser-verification.mjs', 'project-dependencies.mjs', 'dependency-references.mjs', 'preview-files.mjs']) {
      const installed = ['.agents', '.claude', '.codex'].map(prefix => `${prefix}/skills/variant-design/scripts/${file}`).find(file => fs.existsSync(localFile(project, file))), expected = hash(fs.readFileSync(new URL(`../scripts/${file}`, import.meta.url)));
      need(installed && hash(read(project, installed)) === expected, `Installed helper differs: ${file}`); helperSha256[file] = expected;
    }
    add('installed-helpers', true);
    const receiptFile = actual.manifest.deliveryReceipt;
    need(typeof receiptFile === 'string' && receiptFile.startsWith('.deliveries/'), 'Delivery must reference its actual output-relative sealed receipt');
    agentReceipt = inspectDeliveryReceipt(output, receiptFile);
    need(agentReceipt.phase === 'rolled-back' && agentReceipt.inventoryStatus === 'stale' && agentReceipt.record.integrationId === actual.record.id && equivalent(agentReceipt.record.inventory, inventory(actual.record)), 'Agent historical receipt differs from real rolled-back delivery');
    need(agentReceipt.record.plan.file === actual.manifest.plan && agentReceipt.record.plan.sha256 === hash(read(project, actual.manifest.plan)), 'Agent receipt plan reference differs');
    need(equivalent(agentReceipt.record.staging.files, Object.fromEntries(actual.record.files.map(entry => [entry.path, entry.after.sha256]))), 'Agent receipt staging inventory differs');
    for (const phase of ['before', 'after']) {
      const reference = agentReceipt.record.reports[phase]; need(reference && hash(read(output, reference.file)) === reference.sha256, 'Missing/changed Agent before/after verification reference');
      const report = JSON.parse(read(output, reference.file)); need(report.fingerprint.id === 'B' && report.fingerprint.version === actual.record.version && report.fingerprint.project === project && report.fingerprint.output === output, 'Agent report scope differs');
      for (const entry of actual.record.files) need(report.fingerprint.dependencies[entry.path] === (phase === 'after' ? entry.after.sha256 : entry.before?.sha256), 'Agent report target baseline differs');
    }
    add('agent-receipt', true, ['Agent report claims remain recorded claims; independent host observations below cover only the checks actually run. The saved integration is historical after rollback.']);
    copy = path.join(out, 'project'); fs.cpSync(project, copy, { recursive: true, filter: file => !['.git', 'dist'].includes(path.relative(project, file).split(path.sep)[0]) }); copy = fs.realpathSync(copy);
    const copiedOutput = localFile(copy, 'variant-output'), state = read(copy, 'variant-output/.variant-context.json'), beforeTarget = read(copy, 'src/App.tsx'), stage = actual.manifest.staging, plan = `.variant-work/receipt-host-${randomUUID()}.json`;
    const observe = async phase => verifyArtifact(copiedOutput, 'B', { projectRoot: copy, dependencies: ['src/App.tsx'] }, async () => {
      const capture = await captureNativeVite(copy, { out: path.join(out, phase), browser, original: true, ...(phase === 'after' ? { expectedVariant: 'B' } : {}) }); observations[phase] = capture;
      const graded = gradeNativeVite({ baseline: capture }).checks.filter(c => c.id.startsWith('baseline-'));
      const check = id => graded.find(c => c.id === id)?.pass === true;
      return [{ id: 'brand', status: check('baseline-brand-assets') ? 'passed' : 'failed', reason: 'Actual integrated/original application fonts and decoded asset observed at desktop/mobile', tool: { name: 'Chrome via native receipt host', version: capture.environment.browser }, environment: capture.environment, evidence: [`${phase}/report.json`] },
        { id: 'project-checks', status: ['baseline-build-typecheck', 'baseline-build-coverage', 'baseline-fresh'].every(check) ? 'passed' : 'failed', reason: 'Original project typecheck/build executed in this callback', tool: { name: 'Native Vite/TypeScript', version: capture.environment.vite }, environment: capture.environment, evidence: [`${phase}/report.json`] }];
    });
    const before = await observe('before'); prepareIntegration(copiedOutput, 'B', ['src/App.tsx'], localFile(copy, plan), copy);
    const integration = integrateVariant(copiedOutput, 'B', localFile(copy, stage), copy, localFile(copy, plan));
    add('target-inventory', equivalent(inventory(integration), inventory(actual.record)) && read(copy, 'src/App.tsx').equals(read(copy, `${stage}/src/App.tsx`)));
    const after = await observe('after');
    add('current-observations', [before, after].every(result => result.status === 'unverified' && !result.report.changedDuringRun && result.report.checks.filter(c => ['brand', 'project-checks'].includes(c.id)).every(c => c.status === 'passed')) && Object.values(observations).every(capture => capture.samples.length === 2 && gradeNativeVite({ baseline: capture }).checks.filter(c => c.id.startsWith('baseline-')).every(c => c.pass)));
    sealed = createDeliveryReceipt(copiedOutput, integration.id, { projectRoot: copy, plan, staging: stage, beforeReport: path.relative(copiedOutput, before.file).split(path.sep).join('/'), afterReport: path.relative(copiedOutput, after.file).split(path.sep).join('/') });
    const saved = fs.readFileSync(sealed.file), current = inspectDeliveryReceipt(copiedOutput, sealed.file);
    add('sealed-receipt', current.inventoryStatus === 'current' && current.verificationStatus === 'unverified' && current.record.baseline.status === 'recorded' && current.record.baseline.comparison.failures.length === 0 && current.record.reports.after.checks.filter(c => c.status === 'unverified').length === 3 && read(copy, 'variant-output/.variant-context.json').equals(state));
    for (const [id, file] of [['target-drift', 'src/App.tsx'], ['report-drift', `variant-output/${sealed.record.reports.after.file}`], ['source-drift', `variant-output/${readContext(copiedOutput).variants.B.entry}`]]) {
      const original = read(copy, file), changed = Buffer.concat([original, Buffer.from('\n/* receipt host drift */\n')]); fs.writeFileSync(localFile(copy, file), changed);
      const stale = inspectDeliveryReceipt(copiedOutput, sealed.file).inventoryStatus === 'stale';
      let refusal = null;
      if (id === 'target-drift') { try { rollbackIntegration(copiedOutput, integration.id, copy); } catch (failure) { refusal = failure.message; } }
      const preserved = read(copy, file).equals(changed) && fs.readFileSync(sealed.file).equals(saved);
      add(id, stale && preserved && (id !== 'target-drift' || /changed after integration/.test(refusal ?? '')));
      actions.push({ id, file, before: hash(original), after: hash(changed), stale, preserved, refusal });
      need(read(copy, file).equals(changed), 'Unexpected later edit during controlled host restoration'); fs.writeFileSync(localFile(copy, file), original);
      need(inspectDeliveryReceipt(copiedOutput, sealed.file).inventoryStatus === 'current', 'Receipt did not restore to its recorded bytes');
    }
    rollbackIntegration(copiedOutput, integration.id, copy);
    add('rolled-back', inspectDeliveryReceipt(copiedOutput, sealed.file).phase === 'rolled-back' && read(copy, 'src/App.tsx').equals(beforeTarget) && fs.readFileSync(sealed.file).equals(saved) && read(copy, 'variant-output/.variant-context.json').equals(state));
  } catch (failure) { error = failure.stack; }
  const originalAfter = tree(project); add('source-project-unchanged', equivalent(originalBefore, originalAfter));
  for (const id of deliveryReceiptGates) if (!checks.some(c => c.id === id)) add(id, false, [error ?? 'Receipt probe incomplete']);
  const report = { source: 'host-delivery-receipt-probe-v1', at: new Date().toISOString(), project, copy, helperSha256, checks, actions, agentReceipt: agentReceipt && { file: agentReceipt.file, sha256: hash(fs.readFileSync(agentReceipt.file)), phase: agentReceipt.phase, recordedVerificationStatus: agentReceipt.record.verificationStatus }, sealed: sealed && { file: sealed.file, sha256: hash(fs.readFileSync(sealed.file)), verificationStatus: sealed.verificationStatus }, observations: Object.fromEntries(Object.entries(observations).map(([phase]) => [phase, path.join(out, phase, 'report.json')])), originalBefore, originalAfter, ...(error ? { error } : {}) };
  report.pass = !error && checks.every(c => c.pass); fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' }); return report;
}
