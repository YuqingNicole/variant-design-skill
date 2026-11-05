// Independent browser execution of Agent-authored JSON; never import Agent adapter code.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { localFile, readContext } from '../scripts/variant-history.mjs';
import { inspectVerificationPlan, runVerificationPlan } from '../scripts/verification-plan.mjs';
import { verifyPhaseArchive } from './phase-archive.mjs';
import { runtimeViteAdapter } from './runtime-vite.mjs';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const need = (test, message) => { if (!test) throw new Error(message); };
const canonical = v => Array.isArray(v) ? v.map(canonical) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, canonical(v[k])])) : v;
const same = (a, b) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
const read = (root, file) => fs.readFileSync(localFile(root, file));
const state = project => { const context = readContext(localFile(project, 'variant-output')); return { context, owned: Object.fromEntries(Object.entries(context.variants).map(([id, v]) => [id, Object.fromEntries(v.files.map(file => [file, hash(read(project, `variant-output/${file}`))]))])) }; };
export async function observeRuntimePlan(project, { out, phase, browser, mode = 'file', archive } = {}) {
  need(['file', 'vite'].includes(mode), 'Unknown runtime preview mode');
  project = fs.realpathSync(project); need(['generate', 'plan-edit', 'plan-undo'].includes(phase), 'Unknown runtime-plan phase');
  need(typeof out === 'string' && !fs.existsSync(out) && path.relative(project, path.resolve(out)).startsWith('..' + path.sep), 'Use fresh runtime evidence outside the Agent project'); fs.mkdirSync(out, { recursive: true }); out = fs.realpathSync(out);
  const before = state(project), helperSha256 = {}, output = localFile(project, 'variant-output'); let ownBrowser, result, error, bundle, screenshot, nativeAdapter, vite;
  try {
    for (const file of ['verification-plan.mjs', 'browser-verification.mjs', 'artifact-verification.mjs', 'variant-history.mjs', 'project-dependencies.mjs', 'dependency-references.mjs', 'quality-gate.mjs']) {
      const expected = hash(fs.readFileSync(new URL(`../scripts/${file}`, import.meta.url))), installed = ['.agents', '.claude', '.codex'].map(root => `${root}/skills/variant-design/scripts/${file}`).find(file => fs.existsSync(localFile(project, file)));
      need(installed && hash(read(project, installed)) === expected, `Installed runtime helper differs: ${file}`); helperSha256[file] = expected;
    }
    const pointer = JSON.parse(read(project, '.variant-work/runtime-plan.json')); need(pointer.schemaVersion === 1 && typeof pointer.bundle === 'string' && pointer.bundle.startsWith('.variant-work/.runtime-plans/'), 'Provide the real project-relative sealed runtime-plan pointer');
    bundle = inspectVerificationPlan(output, localFile(project, pointer.bundle)); need(bundle.status === 'current-within-recorded-scope' && bundle.record.variant === 'B' && bundle.record.draft.purpose === (phase === 'generate' ? 'baseline' : 'comparison'), 'Runtime plan is stale or has the wrong phase/variant');
    if (mode === 'file') { const checker = read(project, 'check.mjs'), trusted = fs.readFileSync(new URL('./fixtures/runtime-plan-html/project/check.mjs', import.meta.url)); need(checker.equals(trusted), 'Original project checker changed; do not execute Agent code'); }
    if (!browser) { const { chromium } = createRequire(new URL('../tests/package.json', import.meta.url))('@playwright/test'); ownBrowser = browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined, headless: true }); }
    const page = await browser.newPage({ serviceWorkers: 'block' }), bodies = new Map(), failures = [];
    page.on('response', response => { if (response.url().startsWith('file:')) bodies.set(response.url(), response.body().then(bytes => ({ bytes })).catch(error => ({ error: error.message }))); });
    page.on('pageerror', error => failures.push(error.message)); page.on('requestfailed', request => failures.push(`${request.url()}: ${request.failure()?.errorText}`));
    const target = bundle.record.draft.target;
    try {
      const execution = mode === 'vite' ? nativeAdapter = await runtimeViteAdapter(project, { out, target, record: bundle.record, archive, browser, page }) : { ready: async current => {
        const loaded = await bodies.get(current.url()); need(loaded?.bytes && loaded.bytes.equals(read(project, target)), 'Browser document bytes differ from current registered target');
        for (const [url, promise] of bodies) { const file = fileURLToPath(url), relative = path.relative(project, file).split(path.sep).join('/'); need(!relative.startsWith('../') && !path.isAbsolute(relative), 'Preview resource left the project'); const actual = await promise; need(actual.bytes?.equals(read(project, relative)), 'Browser resource differs from actual project source'); }
        need(await current.locator('[data-runtime-variant="B"]').count() > 0 && await current.locator('h1').isVisible(), 'Actual B identity and visible heading required'); need(await current.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Actual candidate overflows this viewport');
      }, projectChecks: async () => {
        const args = ['check.mjs', 'index.html', target], checked = spawnSync(process.execPath, args, { cwd: project, encoding: 'utf8', timeout: 10000, maxBuffer: 2 * 1024 * 1024 });
        fs.writeFileSync(path.join(out, 'project-check.json'), JSON.stringify({ command: [process.execPath, ...args], status: checked.status, signal: checked.signal, error: checked.error?.message, stdout: checked.stdout, stderr: checked.stderr }, null, 2) + '\n', { flag: 'wx' });
        return { id: 'project-checks', status: checked.error || checked.signal ? 'unverified' : checked.status === 0 ? 'passed' : 'failed', reason: 'Actual original document/script syntax command; does not execute generated scripts', tool: { name: 'Node project checker', version: process.version }, environment: { cwd: project, command: [process.execPath, ...args] }, evidence: [path.join(out, 'project-check.json')] };
      } };
      result = await runVerificationPlan(output, bundle.file, { page, version: browser.version(), ...execution });
      if (nativeAdapter) vite = await nativeAdapter.finish();
      screenshot = path.join(out, 'B.png'); await page.screenshot({ path: screenshot, fullPage: true }); need(!failures.length, `Browser errors: ${failures.join('; ')}`);
    } finally { await page.close(); if (nativeAdapter) await nativeAdapter.stop(); }
    if (phase === 'generate') {
      const file = localFile(project, '.variant-work/runtime-baseline.json'); need(!fs.existsSync(file), 'Preserve existing runtime baseline pointer');
      fs.writeFileSync(file, JSON.stringify({ schemaVersion: 1, report: path.relative(output, result.file).split(path.sep).join('/'), sha256: hash(fs.readFileSync(result.file)), scopeIdentity: bundle.record.scopeIdentity, status: result.status }, null, 2) + '\n', { flag: 'wx', flush: true });
    }
  } catch (failure) { error = failure.stack; }
  finally { if (ownBrowser) await ownBrowser.close(); }
  const after = state(project), checks = result?.report.checks ?? [], expected = checks.length === 5 && checks.every(check => check.status === (phase === 'generate' && check.id === 'scope-preservation' ? 'unverified' : 'passed'));
  const report = { source: 'host-task-runtime-plan-v1', mode, ...(vite ? { vite } : {}), phase, project, at: new Date().toISOString(), helperSha256, before, after, preserved: same(before, after), bundle: bundle && { file: bundle.file, sha256: hash(fs.readFileSync(bundle.file)), scopeIdentity: bundle.record.scopeIdentity, draft: bundle.record.draft }, result: result && { file: result.file, sha256: hash(fs.readFileSync(result.file)), status: result.status, report: result.report }, screenshot, ...(error ? { error } : {}) };
  report.pass = Boolean(!error && report.preserved && expected && (mode === 'file' || vite?.pass === true) && (phase === 'generate' ? result.status === 'unverified' && result.report.checks.find(c => c.id === 'scope-preservation').evidence?.every(e => e.matches) : result.status === 'passed'));
  fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' }); return report;
}
export function gradeRuntimePlans(measurement, { mode = 'file' } = {}) {
  const reports = ['generate', 'plan-edit', 'plan-undo'].map(phase => measurement?.[phase]), checks = [], add = (id, pass, details = []) => checks.push({ id, pass: Boolean(pass), details });
  reports.forEach((report, i) => add(['baseline-observed', 'edit-observed', 'undo-observed'][i], report?.source === 'host-task-runtime-plan-v1' && report.phase === ['generate', 'plan-edit', 'plan-undo'][i] && report.pass === true, report?.error ? [report.error] : []));
  const [before, edited, undo] = reports;
  add('same-scope', before?.bundle?.scopeIdentity && reports.every(r => r?.bundle?.scopeIdentity === before.bundle.scopeIdentity));
  let history = false;
  try {
    const b = before.after.context.variants.B, e = edited.after.context.variants.B, u = undo.after.context.variants.B, applies = e.history.slice(b.history.length), reverted = u.history.slice(e.history.length);
    history = applies.length > 0 && applies.every(item => item.action === 'apply') && reverted.length === 1 && reverted[0].action === 'undo' && same(reverted[0].restoredSnapshots ?? [reverted[0].restored], applies.map(a => a.snapshot)) && e.version === b.version + applies.length && u.version === e.version + 1 && !same(before.after.owned.B, edited.after.owned.B) && same(before.after.owned.B, undo.after.owned.B);
  } catch {}
  add('history-replayed', history);
  add('others-preserved', before?.after?.context?.variants?.A && before.after.context.variants.C && reports.every(r => r?.after?.context?.selectedVariant == null && ['A', 'C'].every(id => r?.after?.context?.variants?.[id] && same(r.after.context.variants[id], before.after.context.variants[id]) && same(r.after.owned[id], before.after.owned[id]))));
  add('source-bound', reports.every(r => Number.isInteger(r?.result?.report?.fingerprint?.version) && r.result.report.fingerprint.version === r?.after?.context?.variants?.B?.version && r.result.report.fingerprint.inputs && !r.result.report.changedDuringRun));
  add('observer-preserved', reports.every(r => r?.preserved === true));
  add('installed-helpers', reports.every(r => r?.helperSha256 && Object.keys(r.helperSha256).length === 7));
  let archives = false; try { archives = ['baseline', 'generate', 'plan-edit', 'plan-undo'].every(phase => verifyPhaseArchive(measurement.archives[phase]).manifest.phase === phase); } catch {}
  add('phase-archives', archives);
  if (mode === 'vite') {
    add('vite-project-checks', reports.every(r => r?.mode === 'vite' && r.vite?.checks?.typecheck?.exit === 0 && r.vite.checks.build?.exit === 0 && r.vite.checks.typecheck.coverage?.missing?.length === 0 && r.vite.checks.build.outputs === true));
    add('vite-source-probe', reports.every(r => r?.mode === 'vite' && r.vite?.pass === true && r.vite.unchanged === true && r.vite.readyCount > 0 && r.vite.requests?.length > 0 && r.vite.errors?.length === 0 && r.vite.dependencyProbe?.pass === true && r.vite.hostSha256 && Object.keys(r.vite.hostSha256).length === 3));
  }
  return checks;
}
