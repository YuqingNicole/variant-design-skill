// Independent replay for the self-authored native-vite fixture. Never mutate the Agent project.
import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { isDeepStrictEqual as same } from 'node:util';
import { fileURLToPath } from 'node:url';
import { localFile, readContext, prepareVariant, applyVariant, undoVariant } from '../scripts/variant-history.mjs';
import { prepareIntegration, integrateVariant, rollbackIntegration } from '../scripts/variant-integrate.mjs';

const here = path.dirname(fileURLToPath(import.meta.url)), ids = ['A', 'B', 'C'];
export const nativeOriginalFiles = ['.gitignore', 'README.md', 'index.html', 'package.json', 'package-lock.json', 'vite.config.ts', 'tsconfig.json', 'variant-preview.html', 'src/App.tsx', 'src/main.tsx', 'src/global.css', 'src/workspace.tsx', 'src/workspaces.json', 'src/workshop-mark.svg', 'src/vite-env.d.ts'];
const need = (value, message) => { if (!value) throw new Error(message); };
const digest = (value, algorithm = 'sha256') => createHash(algorithm).update(value).digest('hex');
const read = (root, file) => fs.readFileSync(localFile(root, file));
const json = (root, file) => JSON.parse(read(root, file));
const fileHash = (root, file) => digest(read(root, file));
const workFile = (root, file) => { need(typeof file === 'string' && file.startsWith('.variant-work/'), 'Delivery files belong under .variant-work/'); return localFile(root, file); };
const files = root => fs.readdirSync(root, { withFileTypes: true }).flatMap(entry => {
  need(!entry.isSymbolicLink(), `Symlink not allowed in replay input: ${entry.name}`);
  return entry.isDirectory() ? files(path.join(root, entry.name)).map(file => `${entry.name}/${file}`) : [entry.name];
});
const owned = (project, state) => Object.fromEntries(ids.flatMap(id => (state.variants[id].files ?? []).map(file => [`variant-output/${file}`, fileHash(project, `variant-output/${file}`)])));
const copyProject = (project, destination, modules = false) => fs.cpSync(project, destination, { recursive: true, filter: file => !['.git', 'dist', ...(modules ? [] : ['node_modules'])].includes(path.relative(project, file).split(path.sep)[0]) });
const tree = project => Object.fromEntries(fs.readdirSync(project).filter(file => !['node_modules', '.git', 'dist'].includes(file)).flatMap(file => {
  const full = localFile(project, file);
  return (fs.statSync(full).isDirectory() ? files(full).map(child => `${file}/${child}`) : [file]).map(child => [child, fileHash(project, child)]);
}));

export function inspectNativeDelivery(project, { generated, baseline, delivery = '.variant-work/native-delivery.json' } = {}) {
  project = fs.realpathSync(project);
  const output = localFile(project, 'variant-output'), state = readContext(output), previous = generated?.context;
  need(previous?.variants && ids.every(id => previous.variants[id]?.files?.length), 'Need the real generate-turn snapshot');
  need(previous.selectedVariant == null && state.selectedVariant == null && state.activeVariant === 'B', 'History/delivery must keep selection empty and B active');
  need(same(state.designSystem, previous.designSystem), 'Delivery changed the original design system');
  for (const id of ids) {
    need(same(state.variants[id].files, previous.variants[id].files), `Delivery changed ${id} file membership`);
    for (const file of state.variants[id].files) need(digest(read(output, file), 'sha1') === generated.files?.[`variant-output/${file}`], `Delivery did not restore ${id}/${file}`);
    if (id !== 'B') need(same(state.variants[id], previous.variants[id]), `Delivery changed ${id} metadata`);
  }
  for (const file of nativeOriginalFiles) need(baseline?.fingerprint?.[file] && fileHash(project, file) === baseline.fingerprint[file], `Original file not restored: ${file}`);
  const before = previous.variants.B, after = state.variants.B, prefix = before.history ?? [], history = after.history ?? [];
  need(same(history.slice(0, prefix.length), prefix), 'B history prefix changed');
  const added = history.slice(prefix.length), undo = added.at(-1), applies = added.slice(0, -1);
  need(undo?.action === 'undo' && applies.length && applies.every(item => item.action === 'apply'), 'Need recorded B apply followed by one undo');
  need(after.version === before.version + added.length, 'B history/version progression differs');
  need(same(undo.restoredSnapshots ?? [undo.restored], applies.map(item => item.snapshot)), 'Undo did not restore exactly this request');
  let last, first;
  for (const item of applies) {
    const saved = json(output, item.snapshot); first ??= saved;
    need(saved.expectedAfter && same(Object.keys(saved.files).sort(), [...before.files].sort()), 'Apply snapshot is incomplete');
    if (last) need(same(saved.files, last.expectedAfter), 'Apply snapshots do not form a continuous edit');
    last = saved;
  }
  need(same(first.variant, before), 'Apply snapshot does not start at the generated revision');
  for (const file of before.files) need(digest(Buffer.from(first.files[file], 'base64'), 'sha1') === generated.files[`variant-output/${file}`], 'Saved baseline differs from generated bytes');
  const recovery = json(output, undo.snapshot);
  need(same(recovery.files, last.expectedAfter), 'Undo recovery snapshot does not contain the applied bytes');
  need(Object.keys(recovery.files).some(file => recovery.files[file] !== first.files[file]), 'Recorded edit did not change B');
  for (const key of ['tokens', 'comparison', 'entry', 'systemBinding', 'undo']) need(same(after[key], before[key]), `Undo did not restore B ${key}`);
  workFile(project, delivery);
  const manifest = json(project, delivery);
  need(manifest.schemaVersion === 1 && same(manifest.changedFiles, ['src/App.tsx']), 'Delivery must declare only src/App.tsx');
  workFile(project, manifest.plan); workFile(project, manifest.staging);
  need(typeof manifest.integrationId === 'string' && /^[\w-]+$/.test(manifest.integrationId), 'Invalid integration id');
  const plan = json(project, manifest.plan), recordPath = `variant-output/.integrations/${manifest.integrationId}.json`, record = json(project, recordPath);
  need(plan.schemaVersion === 1 && plan.project === project && plan.output === output && plan.variant === 'B', 'Recorded plan belongs to another project/variant');
  need(record.schemaVersion === 1 && record.id === manifest.integrationId && record.project === project && record.variant === 'B' && record.selectedVariant == null && Number.isFinite(Date.parse(record.rolledBackAt)), 'Need the real rolled-back B integration record');
  need(same(record.source, plan.source) && record.version === after.version && same(Object.keys(plan.targets), ['src/App.tsx']) && plan.targets['src/App.tsx'] === baseline.fingerprint['src/App.tsx'], 'Integration plan/backup baseline differs');
  const stage = localFile(project, manifest.staging);
  need(same(files(stage), ['src/App.tsx']) && record.files?.length === 1, 'Unexpected staging or backup file set');
  const entry = record.files[0], original = read(project, 'src/App.tsx');
  need(entry.path === 'src/App.tsx' && entry.action === 'overwrite' && entry.before?.sha256 === digest(original) && digest(Buffer.from(entry.before.content, 'base64')) === digest(original) && entry.after?.sha256 === fileHash(stage, 'src/App.tsx'), 'Staging, restored target or backup content differs');
  const logs = [];
  for (const phase of ['beforeChecks', 'afterChecks']) {
    const checks = manifest[phase]; need(Array.isArray(checks) && checks.length === 2 && same(checks.map(c => c.tool).sort(), ['build', 'typecheck']), `Missing ${phase} typecheck/build records`);
    for (const check of checks) {
      const pkg = check.tool === 'build' ? 'vite' : 'typescript', version = json(project, `node_modules/${pkg}/package.json`).version;
      need(check.exitCode === 0 && check.version === version && typeof check.command === 'string' && check.command.trim(), `Invalid ${phase} ${check.tool} receipt`);
      workFile(project, check.log); need(read(project, check.log).length, 'Empty check log'); logs.push(check.log);
    }
  }
  need(manifest.rollback?.completed === true, 'Rollback not confirmed'); workFile(project, manifest.rollback.log); need(read(project, manifest.rollback.log).length, 'Empty rollback log'); logs.push(manifest.rollback.log);
  need(new Set(logs).size === logs.length, 'Check/rollback logs must be distinct');
  return { manifest, state, plan, recordPath, record, draftFiles: recovery.files, logs: Object.fromEntries(logs.map(file => [file, fileHash(project, file)])), snapshots: [...applies.map(item => item.snapshot), undo.snapshot] };
}

export const nativeDeliveryGates = ['recorded-delivery', 'source-identity', 'history-replayed', 'undo-drift-refused', 'stale-integration-refused', 'integration-replayed', 'rollback-drift-refused', 'original-restored', 'source-project-unchanged'];
export function gradeNativeDelivery(report) {
  const complete = !report?.error && report?.source === 'host native delivery replay' && Array.isArray(report.checks) && report.checks.every(c => c && typeof c.pass === 'boolean' && Array.isArray(c.details)) && nativeDeliveryGates.every(id => report.checks.filter(c => c.id === id).length === 1);
  return { pass: Boolean(complete && report.checks.every(c => c.pass === true)), details: complete ? report.checks.filter(c => !c.pass).flatMap(c => [`${c.id}: ${c.details.join('; ')}`]) : [report?.error ?? 'Missing independent integration/history/rollback replay'] };
}

export async function replayNativeDelivery(project, { out, browser, generated, baseline, delivery, manifest } = {}) {
  project = fs.realpathSync(project);
  need(out && path.relative(project, path.resolve(out)).startsWith('..' + path.sep), 'Replay evidence must stay outside the Agent project');
  fs.mkdirSync(out, { recursive: true }); need(path.relative(project, fs.realpathSync(out)).startsWith('..' + path.sep), 'Replay evidence must stay outside the Agent project'); need(!fs.readdirSync(out).length, 'Preserve existing delivery evidence');
  // The helper canonicalizes project roots; keep plan paths on the same side of /var aliases too.
  out = fs.realpathSync(out);
  const startedAt = new Date().toISOString();
  const beforeTree = tree(project), checks = [], actions = [], captures = {};
  const add = (id, pass, details = []) => checks.push({ id, pass: Boolean(pass), details });
  const invoke = (operation, inputs, run) => { const action = { operation, inputs, at: new Date().toISOString() }; actions.push(action); try { const result = run(); action.status = 'passed'; return result; } catch (error) { action.status = 'failed'; action.error = error.message; throw error; } };
  const refuse = (operation, inputs, run, expected) => { try { invoke(operation, inputs, run); return false; } catch (error) { return expected.test(error.message); } };
  let inspection, copy, error;
  try {
    inspection = inspectNativeDelivery(project, { generated, baseline, delivery }); add('recorded-delivery', true);
    copy = path.join(out, 'project'); copyProject(project, copy, true);
    const output = localFile(copy, 'variant-output'), initial = readContext(output), prior = owned(copy, initial);
    const planFile = localFile(copy, `.variant-work/native-host-${randomUUID()}.json`);
    const originalPlan = invoke('prepareIntegration:source-check', [output, 'B', ['src/App.tsx'], planFile, copy], () => prepareIntegration(output, 'B', ['src/App.tsx'], planFile, copy));
    need(same(JSON.parse(JSON.stringify(originalPlan.source)), inspection.plan.source), 'Recorded integration source differs from current registered B'); add('source-identity', true);
    const candidate = localFile(copy, `.variant-work/native-host-${randomUUID()}`);
    invoke('prepareVariant', [output, 'B', candidate, copy], () => prepareVariant(output, 'B', candidate, copy));
    for (const [file, value] of Object.entries(inspection.draftFiles)) fs.writeFileSync(localFile(candidate, file), Buffer.from(value, 'base64'));
    invoke('applyVariant', [output, 'B', candidate], () => applyVariant(output, 'B', candidate, { summary: 'Host replay of recorded temporary heading', request: 'native-host-replay' }));
    const { captureNativeVite, gradeNativeVite } = await import('./native-vite.mjs');
    const originalPass = capture => gradeNativeVite({ baseline: capture }).checks.filter(check => check.id.startsWith('baseline-')).every(check => check.pass);
    captures.draft = await captureNativeVite(copy, { out: path.join(out, 'draft'), browser, manifest, variants: ['B'] });
    const draftVisible = captures.draft.samples.length === 2 && captures.draft.samples.every(s => s.task && s.identity && !s.errors.length && !s.failedRequests.length && s.heading?.trim().endsWith('— Draft'));
    const undoGuard = path.join(out, 'undo-guard'); copyProject(copy, undoGuard);
    const guardOutput = localFile(undoGuard, 'variant-output'), guardFile = localFile(guardOutput, initial.variants.B.entry);
    fs.appendFileSync(guardFile, '\n/* simulated user edit after apply */\n'); const editedHash = digest(fs.readFileSync(guardFile));
    const undoRefused = refuse('undoVariant:drift-probe', [guardOutput, 'B'], () => undoVariant(guardOutput, 'B'), /Files changed since/);
    add('undo-drift-refused', undoRefused && editedHash === digest(fs.readFileSync(guardFile)));
    invoke('undoVariant', [output, 'B'], () => undoVariant(output, 'B'));
    const postHistory = readContext(output);
    add('history-replayed', draftVisible && same(prior, owned(copy, postHistory)) && postHistory.selectedVariant == null && ['A', 'C'].every(id => same(initial.variants[id], postHistory.variants[id])) && ['tokens', 'comparison', 'systemBinding', 'entry', 'files', 'undo'].every(key => same(initial.variants.B[key], postHistory.variants.B[key])) && same(initial.designSystem, postHistory.designSystem));
    const guard = path.join(out, 'integration-guard'); copyProject(copy, guard);
    const guardOut = localFile(guard, 'variant-output'), guardStage = localFile(guard, inspection.manifest.staging), guardPlan = localFile(guard, `.variant-work/native-host-${randomUUID()}.json`), guardTarget = localFile(guard, 'src/App.tsx');
    invoke('prepareIntegration:stale-probe', [guardOut, guardPlan], () => prepareIntegration(guardOut, 'B', ['src/App.tsx'], guardPlan, guard));
    fs.appendFileSync(guardTarget, '\n/* simulated user edit after prepare */\n'); const userHash = digest(fs.readFileSync(guardTarget));
    const staleRefused = refuse('integrateVariant:stale-probe', [guardOut, guardStage, guardPlan], () => integrateVariant(guardOut, 'B', guardStage, guard, guardPlan), /Integration conflict/);
    add('stale-integration-refused', staleRefused && userHash === digest(fs.readFileSync(guardTarget)));
    const guardFresh = localFile(guard, `.variant-work/native-host-${randomUUID()}.json`);
    invoke('prepareIntegration:rollback-probe', [guardOut, guardFresh], () => prepareIntegration(guardOut, 'B', ['src/App.tsx'], guardFresh, guard));
    const guardRecord = invoke('integrateVariant:rollback-probe', [guardOut, guardStage, guardFresh], () => integrateVariant(guardOut, 'B', guardStage, guard, guardFresh));
    fs.appendFileSync(guardTarget, '\n/* simulated user edit after integration */\n'); const laterHash = digest(fs.readFileSync(guardTarget));
    const rollbackRefused = refuse('rollbackIntegration:drift-probe', [guardOut, guardRecord.id], () => rollbackIntegration(guardOut, guardRecord.id, guard), /Files changed after integration/);
    add('rollback-drift-refused', rollbackRefused && laterHash === digest(fs.readFileSync(guardTarget)));
    const fresh = localFile(copy, `.variant-work/native-host-${randomUUID()}.json`), stage = localFile(copy, inspection.manifest.staging);
    invoke('prepareIntegration', [output, fresh], () => prepareIntegration(output, 'B', ['src/App.tsx'], fresh, copy));
    const record = invoke('integrateVariant', [output, stage, fresh], () => integrateVariant(output, 'B', stage, copy, fresh));
    try {
      captures.integrated = await captureNativeVite(copy, { out: path.join(out, 'integrated'), browser, original: true, expectedVariant: 'B' });
      add('integration-replayed', originalPass(captures.integrated) && same(postHistory, readContext(output)) && same(prior, owned(copy, readContext(output))));
    } finally { invoke('rollbackIntegration', [output, record.id, copy], () => rollbackIntegration(output, record.id, copy)); }
    captures.restored = await captureNativeVite(copy, { out: path.join(out, 'restored'), browser, original: true });
    add('original-restored', nativeOriginalFiles.every(file => fileHash(copy, file) === baseline.fingerprint[file]) && same(prior, owned(copy, readContext(output))) && same(postHistory, readContext(output)) && originalPass(captures.restored));
  } catch (caught) { error = caught.stack; }
  for (const id of nativeDeliveryGates.filter(id => id !== 'source-project-unchanged')) if (!checks.some(c => c.id === id)) add(id, false, [error ?? 'Replay stopped before this gate']);
  const afterTree = tree(project); add('source-project-unchanged', same(beforeTree, afterTree));
  const report = { source: 'host native delivery replay', startedAt, finishedAt: new Date().toISOString(), project, copy, checks, actions, captures, ...(error ? { error } : {}), originalBefore: beforeTree, originalAfter: afterTree,
    helperSha256: Object.fromEntries(['variant-history.mjs', 'variant-integrate.mjs'].map(file => [file, digest(fs.readFileSync(path.join(here, '../scripts', file)))])),
    recorded: inspection && { manifest: inspection.manifest, plan: inspection.plan, record: inspection.record, snapshots: inspection.snapshots, logs: inspection.logs } };
  report.pass = gradeNativeDelivery(report).pass;
  fs.writeFileSync(path.join(out, 'replay.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  return report;
}
