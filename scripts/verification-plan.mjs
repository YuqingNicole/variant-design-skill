#!/usr/bin/env node
// Agents author meaning; this module binds and executes declarative checks without importing their code.
import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { localFile, withHistoryLock } from './variant-history.mjs';
import { fingerprintArtifact, inspectVerification } from './artifact-verification.mjs';
import { verifyInBrowser, verificationLocator } from './browser-verification.mjs';

const ids = ['brand', 'keyboard-focus', 'reduced-motion', 'scope-preservation', 'project-checks'];
const folder = '.variant-work/.runtime-plans/';
const need = (test, message) => { if (!test) throw new Error(message); };
const hash = value => createHash('sha256').update(value).digest('hex');
const sorted = v => Array.isArray(v) ? v.map(sorted) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sorted(v[k])])) : v;
const identity = value => hash(JSON.stringify(sorted(value)) ?? 'undefined');
const same = (a, b) => identity(a) === identity(b);
const text = (v, max = 2048) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
const integer = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;
const keys = (object, allowed) => need(object && typeof object === 'object' && !Array.isArray(object) && Object.keys(object).every(key => allowed.includes(key)), 'Unexpected plan fields or invalid object');
const implementation = () => Object.fromEntries(['verification-plan.mjs', 'browser-verification.mjs', 'artifact-verification.mjs', 'project-dependencies.mjs', 'dependency-references.mjs', 'quality-gate.mjs', 'variant-history.mjs'].map(file => [file, hash(fs.readFileSync(new URL(file, import.meta.url)))]));
function relative(file, prefix = '') {
  need(text(file, 1024) && !path.isAbsolute(file) && !file.includes('\\') && !file.split('/').some(p => !p || p === '.' || p === '..') && file.startsWith(prefix), `Use normalized project-relative paths${prefix ? ` inside ${prefix}` : ''}`); return file;
}
function bytes(project, file, max = 2 * 1024 * 1024) {
  const full = localFile(project, relative(file)), stat = fs.lstatSync(full);
  need(stat.isFile() && stat.nlink === 1 && stat.size <= max, 'Plan input must be a bounded regular unlinked file'); return fs.readFileSync(full);
}
function roots(output, project = path.dirname(path.resolve(output))) {
  const out = fs.realpathSync(output), base = fs.realpathSync(project);
  need(out.startsWith(base + path.sep), 'Project must contain variant output'); return { out, base, prefix: path.relative(base, out).split(path.sep).join('/') };
}
function locator(rule) {
  keys(rule, ['by', 'role', 'name', 'value']);
  const fields = { role: ['by', 'role', 'name'], label: ['by', 'name'], testId: ['by', 'value'], css: ['by', 'value'] }[rule.by];
  need(fields && Object.keys(rule).length === fields.length && fields.every(key => text(rule[key])), 'Use an exact role/name, label, testId or CSS locator');
}
const properties = ['text', 'font-family', 'font-size', 'font-weight', 'line-height', 'color', 'background-color', 'display', 'visibility', 'opacity', 'transform', 'width', 'height'];
function assertion(rule) {
  keys(rule, ['locator', 'property', 'expected']); locator(rule.locator);
  need(properties.includes(rule.property) && typeof rule.expected === 'string' && rule.expected.length <= 2048, 'Assertion needs a supported property and literal expectation');
}
function assertions(rules) { need(Array.isArray(rules) && rules.length > 0 && rules.length <= 64, 'List 1–64 explicit assertions'); rules.forEach(assertion); }
function actions(list, motion = false) {
  need(Array.isArray(list) && list.length > 0 && list.length <= 32, 'List 1–32 declarative actions');
  for (const action of list) {
    keys(action, ['action', 'locator', 'value', 'property', 'expected', 'timeoutMs', 'whenMotion']); locator(action.locator);
    need(action.whenMotion === undefined || motion && ['reduce', 'no-preference'].includes(action.whenMotion), 'Only motion actions may use an explicit motion-preference condition');
    need(['click', 'fill', 'select', 'press', 'assert'].includes(action.action), 'Unsupported plan action; no code, navigation or shell');
    if (action.action === 'assert') { assertion({ locator: action.locator, property: action.property, expected: action.expected }); need(action.timeoutMs === undefined || integer(action.timeoutMs, 1, 5000), 'Assertion wait must be 1–5000 ms'); need(action.value === undefined, 'Assertion actions do not take a value'); }
    else { need(action.property === undefined && action.expected === undefined && action.timeoutMs === undefined, 'Unexpected action assertion fields'); need(action.action === 'click' ? action.value === undefined : typeof action.value === 'string' && action.value.length <= 2048, 'Action value is missing or invalid'); }
  }
}
function validate(draft, task) {
  keys(draft, ['schemaVersion', 'target', 'viewport', 'purpose', 'plan', 'actions', 'basis', 'coverage', 'gaps', 'projectChecks', 'baselineReport']);
  need(draft.schemaVersion === 1 && ['baseline', 'comparison'].includes(draft.purpose), 'Use plan schema 1 and an explicit baseline/comparison purpose');
  relative(draft.target); need(/\.html?$/.test(draft.target), 'Register the actual local HTML preview entry');
  keys(draft.viewport, ['width', 'height']); need(integer(draft.viewport.width, 240, 3840) && integer(draft.viewport.height, 240, 3840), 'Set a bounded actual viewport');
  need(text(task?.primaryJob) && text(task.data) && Array.isArray(task.requiredFunctions) && task.requiredFunctions.length && task.requiredFunctions.every(value => text(value)) && new Set(task.requiredFunctions).size === task.requiredFunctions.length, 'Record the real taskContract before authoring checks');
  keys(draft.plan, ids.slice(0, 4)); keys(draft.actions, ['motion', 'scope']); keys(draft.basis, ids); keys(draft.gaps, ids);
  need(typeof draft.projectChecks === 'boolean', 'Declare whether actual project checks are planned');
  for (const id of ids) {
    const planned = id === 'project-checks' ? draft.projectChecks : Boolean(draft.plan[id]);
    if (!planned) { need(draft.plan[id] === undefined || draft.plan[id] === null, 'Missing checks use null'); need(text(draft.gaps[id]), `Explain the unverified ${id} gap`); continue; }
    need(!draft.gaps[id], 'A planned check cannot also be a gap');
    const basis = draft.basis[id]; need(Array.isArray(basis) && basis.length > 0 && basis.length <= 32, `Record actual file-based reasons for ${id}`);
    for (const item of basis) { keys(item, ['file', 'reason']); relative(item.file); need(!item.file.includes('/.runtime-plans/') && !item.file.endsWith('/.variant-context.json'), 'Task context is already bound; cite concrete business/brand/check source, not mutable context or sealed plans'); need(text(item.reason), 'Explain why the source supports this check'); }
    if (id === 'brand' || id === 'scope-preservation') assertions(draft.plan[id]);
    if (id === 'keyboard-focus') {
      need(Array.isArray(draft.plan[id]) && draft.plan[id].length > 0 && draft.plan[id].length <= 32, 'Name 1–32 keyboard controls');
      for (const rule of draft.plan[id]) { keys(rule, ['locator', 'maxTabs', 'indicator']); locator(rule.locator); need(rule.maxTabs === undefined || integer(rule.maxTabs, 1, 100), 'Set at most 100 tabs per control'); if (rule.indicator) { keys(rule.indicator, ['property', 'expected']); need(['boxShadow', 'backgroundColor'].includes(rule.indicator.property) && text(rule.indicator.expected), 'Use an explicit supported alternative focus indicator'); } }
    }
    if (id === 'reduced-motion') { const config = draft.plan[id]; keys(config, ['settled', 'startMs', 'settleMs', 'sampleMs']); assertions(config.settled); for (const key of ['startMs', 'settleMs', 'sampleMs']) need(config[key] === undefined || integer(config[key], 1, 10000), 'Motion intervals must be 1–10000 ms'); actions(draft.actions.motion, true); }
    if (id === 'scope-preservation') actions(draft.actions.scope);
  }
  need(!draft.actions.motion || draft.plan['reduced-motion'], 'Motion actions require the actual check'); need(!draft.actions.scope || draft.plan['scope-preservation'], 'Scope actions require the actual check');
  need(Array.isArray(draft.coverage) && draft.coverage.length === task.requiredFunctions.length && new Set(draft.coverage.map(c => c.requirement)).size === task.requiredFunctions.length, 'Review each required function exactly once');
  for (const item of draft.coverage) {
    keys(item, ['requirement', 'status', 'checks', 'reason']); need(task.requiredFunctions.includes(item.requirement) && text(item.reason) && ['planned', 'unverified'].includes(item.status) && Array.isArray(item.checks) && new Set(item.checks).size === item.checks.length, 'Invalid task coverage review');
    need(item.status === 'unverified' ? item.checks.length === 0 : item.checks.length > 0 && item.checks.every(id => ids.includes(id) && (id === 'project-checks' ? draft.projectChecks : draft.plan[id])), 'Coverage must name actual planned checks or an explicit gap');
  }
  if (draft.purpose === 'comparison' && draft.plan['scope-preservation']) relative(draft.baselineReport, '.verification/');
  else need(draft.baselineReport === undefined, 'Only a scope comparison references an earlier baseline report');
}
function collect(output, id, draftFile, project) {
  const { out, base, prefix } = roots(output, project); relative(draftFile, '.variant-work/'); need(!draftFile.startsWith(folder), 'Author a separate draft, not a sealed bundle');
  const raw = bytes(base, draftFile), draft = JSON.parse(raw), initial = fingerprintArtifact(out, id, { projectRoot: base }); validate(draft, initial.taskContract);
  const dependencies = [...new Set([draft.target, ...Object.values(draft.basis).flatMap(list => list.map(item => item.file))])].sort();
  const inputs = [draftFile, ...(draft.baselineReport ? [`${prefix}/${draft.baselineReport}`] : [])];
  const fingerprint = fingerprintArtifact(out, id, { projectRoot: base, dependencies, inputs });
  const scopeIdentity = identity({ task: fingerprint.taskContract, brand: fingerprint.designSystem, target: draft.target, viewport: draft.viewport, assertions: draft.plan['scope-preservation'], actions: draft.actions.scope });
  let baseline = null;
  if (draft.baselineReport) {
    const reportBytes = bytes(out, draft.baselineReport, 16 * 1024 * 1024), report = inspectVerification(out, localFile(out, draft.baselineReport)).report, check = report.checks.find(c => c.id === 'scope-preservation');
    need(report.plan?.kind === 'task-runtime-plan' && report.plan.purpose === 'baseline' && report.plan.scopeIdentity === scopeIdentity && same(report.plan.implementation, implementation()), 'Baseline task, actions, expectations, viewport or tools differ');
    need(report.fingerprint.project === base && report.fingerprint.output === out && report.fingerprint.id === id && !report.changedDuringRun, 'Baseline belongs to another source/project or changed during observation');
    need(same(report.fingerprint.dependencyClosure?.resolver.compiler, fingerprint.dependencyClosure?.resolver.compiler), 'Baseline compiler identity differs; establish a new before baseline');
    need(report.fingerprint.inputs && Object.keys(report.fingerprint.inputs).length > 0, 'Baseline has no sealed observation-input provenance');
    for (const [file, expected] of Object.entries(report.fingerprint.inputs)) need(hash(bytes(base, file, 16 * 1024 * 1024)) === expected, 'Baseline observation inputs changed; keep the original draft and sealed plan');
    const owned = new Set([...Object.keys(report.fingerprint.files), ...Object.keys(fingerprint.files)].map(file => `${prefix}/${file}`));
    for (const [file, expected] of Object.entries(report.fingerprint.dependencies)) if (!owned.has(file)) need(fingerprint.dependencies[file] === expected, 'Baseline shared, task or brand inputs changed; establish a new before baseline');
    need(check?.tool?.name && check.tool.version, 'Baseline has no observed browser tool identity');
    need(check?.status === 'unverified' && same(check.environment?.viewport, draft.viewport) && Array.isArray(check.evidence) && check.evidence.length === draft.plan['scope-preservation'].length && check.evidence.every(e => e.matches === true), 'Baseline must contain successful actual scope measurements, not missing observations');
    const expected = draft.plan['scope-preservation'];
    need(check.evidence.every((e, i) => same(e.locator, expected[i].locator) && e.property === expected[i].property && e.expected === expected[i].expected && e.actual === expected[i].expected), 'Scope expectations differ from recorded baseline observations');
    baseline = { file: draft.baselineReport, sha256: hash(reportBytes), id: report.id, version: report.fingerprint.version, tool: check.tool };
  }
  return { schemaVersion: 1, project: base, output: out, variant: id, draftFile, draftSha256: hash(raw), draft, dependencies, inputs, fingerprint, scopeIdentity, baseline, implementation: implementation() };
}
export function recordVerificationPlan(output, id, draftFile, options = {}) {
  return withHistoryLock(output, () => {
    const snapshot = collect(output, id, draftFile, options.projectRoot); need(same(snapshot, collect(output, id, draftFile, options.projectRoot)), 'Plan inputs changed while sealing');
    const record = { ...snapshot, id: randomUUID(), at: new Date().toISOString(), limitation: 'Agent-authored intent and local source binding, not proof of semantic completeness, browser execution or acceptance.' };
    const file = localFile(record.project, `${folder}${record.id}.json`), content = JSON.stringify(record, null, 2) + '\n'; need(Buffer.byteLength(content) <= 2 * 1024 * 1024, 'Sealed plan exceeds 2 MiB; reduce its scope before recording'); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, content, { flag: 'wx', flush: true }); need(fs.readFileSync(file, 'utf8') === content, 'Plan persistence verification failed');
    return { file, status: 'current-within-recorded-scope', record };
  });
}
export function inspectVerificationPlan(output, planFile) {
  need(typeof planFile === 'string', 'Provide the printed plan file');
  const full = path.resolve(planFile), marker = `${path.sep}.variant-work${path.sep}.runtime-plans${path.sep}`, at = full.lastIndexOf(marker); need(at > 0, 'Plan must be inside project/.variant-work/.runtime-plans');
  const out = fs.realpathSync(output), { base } = roots(out, full.slice(0, at)), relativeFile = path.relative(base, full).split(path.sep).join('/'); relative(relativeFile, folder);
  const record = JSON.parse(bytes(base, relativeFile));
  need(record.schemaVersion === 1 && record.project === base && record.output === out && ['A', 'B', 'C'].includes(record.variant), 'Invalid plan or different project/output');
  try { const { id, at, limitation, ...expected } = record; return { file: localFile(base, relativeFile), status: same(expected, collect(out, record.variant, record.draftFile, base)) ? 'current-within-recorded-scope' : 'stale', record }; }
  catch (error) { return { file: localFile(base, relativeFile), status: 'stale', reason: error.message, record }; }
}
export async function performVerificationActions(page, list) {
  for (const action of list) {
    if (action.whenMotion && !await page.evaluate(value => matchMedia(`(prefers-reduced-motion: ${value})`).matches, action.whenMotion)) continue;
    const target = verificationLocator(page, action);
    if (action.action === 'assert') {
      const timeout = action.timeoutMs ?? 2000, deadline = Date.now() + timeout; let actual;
      await target.waitFor({ state: 'attached', timeout }); need(await target.count() === 1, 'Expected exactly one assertion target');
      do { const remaining = Math.max(1, deadline - Date.now()); actual = action.property === 'text' ? await target.textContent({ timeout: remaining }) : await target.evaluate((el, property) => getComputedStyle(el).getPropertyValue(property), action.property, { timeout: remaining }); if (actual === action.expected) break; await new Promise(resolve => setTimeout(resolve, 40)); } while (Date.now() < deadline);
      if (actual !== action.expected) { const error = new Error('Action expectation did not become true'); error.verificationEvidence = [{ locator: action.locator, property: action.property, expected: action.expected, actual, matches: false }]; throw error; }
    } else if (action.action === 'click') await target.click({ timeout: 5000 });
    else if (action.action === 'fill') await target.fill(action.value, { timeout: 5000 });
    else if (action.action === 'select') await target.selectOption(action.value, { timeout: 5000 });
    else await target.press(action.value, { timeout: 5000 });
  }
}
export async function runVerificationPlan(output, planFile, adapter = {}) {
  const inspected = inspectVerificationPlan(output, planFile); need(inspected.status === 'current-within-recorded-scope', 'Runtime plan is stale; review actual facts and seal a new draft before checking');
  const r = inspected.record, d = r.draft, target = localFile(r.project, d.target);
  let url = pathToFileURL(target).href;
  if (adapter.baseURL) { const base = new URL(adapter.baseURL); need(base.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname) && !base.username && !base.password && base.pathname === '/' && !base.search && !base.hash, 'Use the trusted local preview root URL'); url = new URL(d.target, base).href; }
  if (adapter.page && adapter.version && adapter.ready && r.baseline) need(r.baseline.tool.version === adapter.version, 'Baseline browser version differs; establish a new before baseline');
  if (adapter.page) await adapter.page.setViewportSize(d.viewport);
  const plan = { ...d.plan, url, kind: 'task-runtime-plan', bundle: path.relative(r.project, inspected.file).split(path.sep).join('/'), purpose: d.purpose, scopeIdentity: r.scopeIdentity, implementation: r.implementation, coverage: d.coverage, gaps: d.gaps, baseline: r.baseline };
  const relativeFile = path.relative(r.project, inspected.file).split(path.sep).join('/');
  return verifyInBrowser(output, r.variant, { projectRoot: r.project, dependencies: r.dependencies, inputs: [...r.inputs, relativeFile], plan, scopeBaseline: d.purpose === 'baseline' }, {
    page: adapter.page, version: adapter.version, ready: adapter.ready,
    ...(d.plan['reduced-motion'] ? { startMotion: page => performVerificationActions(page, d.actions.motion) } : {}),
    ...(d.plan['scope-preservation'] ? { exerciseScope: page => performVerificationActions(page, d.actions.scope) } : {}),
    ...(d.projectChecks && adapter.projectChecks ? { projectChecks: adapter.projectChecks } : {})
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
  const [action, output, variantOrFile, draftFile, project] = process.argv.slice(2);
  try {
    if (action === '--help') console.log('verification-plan.mjs record <output> A|B|C <project-relative-draft.json> [project-root] | status <output> <printed-plan-file>');
    else { const result = action === 'record' ? recordVerificationPlan(output, variantOrFile, draftFile, { projectRoot: project }) : action === 'status' ? inspectVerificationPlan(output, variantOrFile) : null; need(result, 'Use record or status; browser execution uses runVerificationPlan with the existing Page/ready adapter'); console.log(JSON.stringify(result, null, 2)); process.exitCode = result.status === 'current-within-recorded-scope' ? 0 : 2; }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
