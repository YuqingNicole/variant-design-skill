// Independent drift probes on actual native output. All mutations stay in a fresh host-owned copy.
import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { localFile, readContext } from '../scripts/variant-history.mjs';
import { prepareIntegration, integrateVariant, rollbackIntegration, listIntegrations } from '../scripts/variant-integrate.mjs';
import { verifyArtifact, inspectVerification } from '../scripts/artifact-verification.mjs';
import { collectProjectDependencies } from '../scripts/project-dependencies.mjs';
import { captureNativeVite, nativeManifest, nativeObservationChecks } from './native-vite.mjs';
import { inspectNativeDelivery } from './native-delivery.mjs';

const hash = value => createHash('sha256').update(value).digest('hex');
const read = (project, file) => fs.readFileSync(localFile(project, file));
const digest = (project, file) => hash(read(project, file));
const need = (condition, message) => { if (!condition) throw new Error(message); };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const cases = { provider: 'src/workspace.tsx', data: 'src/workspaces.json', css: 'src/global.css', asset: 'src/workshop-mark.svg', ambient: 'src/vite-env.d.ts', config: 'tsconfig.json' };
export const sharedDependencyGates = ['closure-discovered', 'fresh-observation', ...Object.keys(cases).map(id => `drift-${id}`), 'fresh-apply-rollback', 'source-project-unchanged'];
const tree = project => {
  const files = {}, walk = (directory, prefix = '') => { for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
    if (!prefix && ['.git', 'node_modules', 'dist'].includes(item.name)) continue;
    const relative = prefix ? `${prefix}/${item.name}` : item.name; need(!item.isSymbolicLink(), 'Symlink source in dependency probe');
    if (item.isDirectory()) walk(localFile(project, relative), relative); else { need(item.isFile(), 'Special source in dependency probe'); files[relative] = digest(project, relative); }
  } };
  walk(project); return Object.fromEntries(Object.entries(files).sort(([a], [b]) => a.localeCompare(b)));
};
function destination(project, out) {
  need(typeof out === 'string', 'Provide a fresh dependency evidence path'); let parent = path.dirname(path.resolve(out));
  while (!fs.existsSync(parent)) parent = path.dirname(parent);
  const full = path.join(fs.realpathSync(parent), path.relative(parent, path.resolve(out))), relative = path.relative(project, full);
  need(relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative), 'Dependency evidence must stay outside the Agent project');
  need(!fs.existsSync(full), 'Preserve existing dependency evidence'); fs.mkdirSync(path.dirname(full), { recursive: true }); fs.mkdirSync(full); return full;
}
function mutation(id, original) {
  if (id === 'data') { const value = JSON.parse(original); value.north.name += ' · host dependency probe'; return Buffer.from(JSON.stringify(value)); }
  if (id === 'asset') return Buffer.from(original.toString().replace('</svg>', '<path d="M0 0h1v1H0z" fill="#7b2544"/></svg>'));
  if (id === 'css') return Buffer.concat([original, Buffer.from('\n:root{--brand-accent:#7b2544}\n')]);
  if (id === 'config') { const value = JSON.parse(original); value.compilerOptions.paths['@/*'] = ['changed-by-host/*']; return Buffer.from(JSON.stringify(value)); }
  return Buffer.concat([original, Buffer.from('\n/* host dependency drift */\n')]);
}
export async function probeSharedDependencies(project, { out, browser, generated, baseline, delivery, manifest } = {}) {
  project = fs.realpathSync(project); out = destination(project, out);
  const originalTree = tree(project), checks = [], actions = [], helperSha256 = {}, add = (id, pass, details = []) => checks.push({ id, pass: Boolean(pass), details });
  let copy, observation, evidence, error;
  try {
    const inspected = inspectNativeDelivery(project, { generated, baseline, delivery });
    for (const file of ['variant-history.mjs', 'variant-integrate.mjs', 'artifact-verification.mjs', 'browser-verification.mjs', 'project-dependencies.mjs', 'dependency-references.mjs']) {
      const installed = ['.agents', '.claude', '.codex'].map(prefix => `${prefix}/skills/variant-design/scripts/${file}`).find(relative => fs.existsSync(localFile(project, relative)));
      const expected = hash(fs.readFileSync(fileURLToPath(new URL(`../scripts/${file}`, import.meta.url))));
      need(installed && digest(project, installed) === expected, `Installed helper differs: ${file}`); helperSha256[file] = expected;
    }
    copy = path.join(out, 'project'); fs.cpSync(project, copy, { recursive: true, filter: file => !['.git', 'dist'].includes(path.relative(project, file).split(path.sep)[0]) }); copy = fs.realpathSync(copy);
    const output = localFile(copy, 'variant-output'), state = readContext(output), roots = state.variants.B.files.map(file => `variant-output/${file}`), closure = collectProjectDependencies(copy, roots), native = nativeManifest(copy, manifest);
    const expected = [...Object.values(cases), ...native.adapterFiles, manifest ?? '.variant-work/native-preview.json'];
    add('closure-discovered', closure.coverage.status === 'within-supported-static-syntax' && Boolean(closure.resolution.factsFile) && expected.every(file => closure.files[file]), [...closure.coverage.unknowns.map(item => `${item.code}: ${item.file}`), ...expected.filter(file => !closure.files[file]).map(file => `not tracked: ${file}`)]);
    evidence = await verifyArtifact(output, 'B', { projectRoot: copy }, async () => {
      observation = await captureNativeVite(copy, { out: path.join(out, 'observation'), browser, manifest });
      return nativeObservationChecks(observation, { evidence: 'observation/report.json' });
    });
    add('fresh-observation', evidence.status === 'unverified' && !evidence.report.changedDuringRun && evidence.report.coverage.status === 'within-supported-static-syntax' && observation.samples.length === 6 && observation.samples.every(sample => sample.task && sample.identity && !sample.errors.length && !sample.failedRequests.length) && evidence.report.checks.filter(check => ['brand', 'project-checks'].includes(check.id)).every(check => check.status === 'passed'), ['Focus, motion and non-target checks are not inferred from these observations and remain unverified.']);
    const stage = localFile(copy, `${inspected.manifest.staging}/host-dependency-${randomUUID()}`), staged = read(copy, `${inspected.manifest.staging}/src/App.tsx`);
    const initialContext = read(copy, 'variant-output/.variant-context.json'), originalTarget = read(copy, 'src/App.tsx');
    for (const [id, file] of Object.entries(cases)) {
      const planFile = localFile(copy, `.variant-work/shared-${id}-${randomUUID()}.json`), before = read(copy, file), changed = mutation(id, before), priorBackups = listIntegrations(output);
      need(!before.equals(changed), `Probe did not change ${file}`);
      prepareIntegration(output, 'B', ['src/App.tsx'], planFile, copy);
      if (!fs.existsSync(stage)) { fs.mkdirSync(path.join(stage, 'src'), { recursive: true }); fs.writeFileSync(path.join(stage, 'src/App.tsx'), staged, { flag: 'wx' }); }
      fs.writeFileSync(localFile(copy, file), changed);
      let refused = false, refusal;
      try { integrateVariant(output, 'B', stage, copy, planFile); } catch (failure) { refusal = failure.message; refused = /Integration conflict/.test(refusal); }
      const stale = inspectVerification(output, evidence.file).status === 'stale', untouched = read(copy, 'src/App.tsx').equals(originalTarget) && read(copy, 'variant-output/.variant-context.json').equals(initialContext) && same(listIntegrations(output), priorBackups) && read(copy, file).equals(changed);
      actions.push({ id, file, before: hash(before), after: hash(changed), evidenceStale: stale, integrationRefused: refused, refusal, targetContextBackupsAndUserChangePreserved: untouched });
      add(`drift-${id}`, stale && refused && untouched, refusal ? [refusal] : ['Integration unexpectedly succeeded']);
      need(read(copy, file).equals(changed), 'Preserve unexpected later edits in the host copy'); fs.writeFileSync(localFile(copy, file), before);
    }
    const fresh = localFile(copy, `.variant-work/shared-fresh-${randomUUID()}.json`); prepareIntegration(output, 'B', ['src/App.tsx'], fresh, copy);
    const integrated = integrateVariant(output, 'B', stage, copy, fresh), applied = read(copy, 'src/App.tsx').equals(staged);
    const rolledBack = rollbackIntegration(output, integrated.id, copy);
    add('fresh-apply-rollback', applied && Boolean(rolledBack.rolledBackAt) && read(copy, 'src/App.tsx').equals(originalTarget) && read(copy, 'variant-output/.variant-context.json').equals(initialContext) && inspectVerification(output, evidence.file).status === 'unverified');
  } catch (failure) { error = failure.stack; }
  add('source-project-unchanged', same(originalTree, tree(project)));
  for (const id of sharedDependencyGates) if (!checks.some(check => check.id === id)) add(id, false, [error ?? 'Probe incomplete']);
  const report = { source: 'host-shared-dependency-probe-v1', at: new Date().toISOString(), project, copy, helperSha256, checks, actions, evidence: evidence && { file: evidence.file, initialStatus: evidence.status, fingerprintIdentity: evidence.report.fingerprint.dependencyClosure.identity, reportSha256: hash(fs.readFileSync(evidence.file)) }, observation: observation && path.join(out, 'observation/report.json'), originalBefore: originalTree, originalAfter: tree(project), ...(error ? { error } : {}) };
  report.pass = !error && checks.every(check => check.pass); fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' }); return report;
}
export function gradeSharedDependencies(report) {
  return sharedDependencyGates.map(id => { const matches = report?.checks?.filter(check => check.id === id) ?? []; return { id, pass: report?.source === 'host-shared-dependency-probe-v1' && !report.error && matches.length === 1 && matches[0].pass === true, details: matches[0]?.details ?? [report?.error ?? 'No independent shared-dependency probe'] }; });
}
