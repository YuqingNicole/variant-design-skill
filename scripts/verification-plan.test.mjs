import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { fixture } from '../tests/fixture.mjs';
import { recordVerificationPlan, inspectVerificationPlan, runVerificationPlan, performVerificationActions } from './verification-plan.mjs';

const compiler = path.dirname(createRequire(new URL('../tests/package.json', import.meta.url)).resolve('typescript/package.json'));
function setup(t) {
  const project = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'runtime-plan-'))), output = path.join(project, 'variant-output'); t.after(() => fs.rmSync(project, { recursive: true, force: true }));
  const context = fixture(output); context.taskContract = { primaryJob: 'Inspect the report', data: 'local report', requiredFunctions: ['Inspect results'] }; fs.writeFileSync(path.join(output, '.variant-context.json'), JSON.stringify(context));
  fs.mkdirSync(path.join(project, 'node_modules')); fs.symlinkSync(compiler, path.join(project, 'node_modules/typescript'), process.platform === 'win32' ? 'junction' : 'dir');
  fs.writeFileSync(path.join(project, 'package.json'), '{"dependencies":{"react":"19.1.1"}}'); fs.writeFileSync(path.join(project, 'preview.html'), '<h1 style="font-family:Georgia">Report</h1><button>Inspect</button>');
  const draftFile = '.variant-work/check-draft.json'; fs.mkdirSync(path.join(project, '.variant-work'));
  const draft = { schemaVersion: 1, target: 'preview.html', purpose: 'baseline', viewport: { width: 390, height: 844 },
    plan: { brand: [{ locator: { by: 'role', role: 'heading', name: 'Report' }, property: 'font-family', expected: 'Georgia' }], 'keyboard-focus': null, 'reduced-motion': null, 'scope-preservation': null },
    actions: {}, basis: { brand: [{ file: 'preview.html', reason: 'Actual locked font declaration' }] }, gaps: { 'keyboard-focus': 'Not yet authored for this contract test', 'reduced-motion': 'No tested motion expectation', 'scope-preservation': 'No before observation', 'project-checks': 'No project runner in this contract test' }, projectChecks: false,
    coverage: [{ requirement: 'Inspect results', status: 'unverified', checks: [], reason: 'Task behavior is deliberately not inferred from this structural test' }] };
  const save = value => fs.writeFileSync(path.join(project, draftFile), JSON.stringify(value)); save(draft); return { project, output, draftFile, draft, save, context };
}
test('sealing binds the actual task, inputs and source without selecting or changing application bytes', t => {
  const { project, output, draftFile } = setup(t), before = fs.readFileSync(path.join(output, '.variant-context.json')), html = fs.readFileSync(path.join(project, 'preview.html'));
  const result = recordVerificationPlan(output, 'B', draftFile, { projectRoot: project }); assert.equal(result.status, 'current-within-recorded-scope'); assert(result.record.fingerprint.inputs[draftFile]); assert.equal(result.record.draft.coverage[0].status, 'unverified');
  assert.equal(inspectVerificationPlan(output, result.file).status, 'current-within-recorded-scope'); const saved = fs.readFileSync(result.file), second = recordVerificationPlan(output, 'B', draftFile, { projectRoot: project }); assert.notEqual(second.file, result.file); assert.deepEqual(fs.readFileSync(result.file), saved); assert.deepEqual(fs.readFileSync(path.join(output, '.variant-context.json')), before); assert.deepEqual(fs.readFileSync(path.join(project, 'preview.html')), html);
});
test('draft, source, revision, task, brand and implementation drift stale a plan; selection alone does not', t => {
  for (const kind of ['draft', 'source', 'target', 'revision', 'task', 'brand', 'implementation']) {
    const { project, output, draftFile, context } = setup(t), result = recordVerificationPlan(output, 'B', draftFile), file = path.join(output, '.variant-context.json');
    context.selectedVariant = 'C'; context.activeVariant = 'A'; fs.writeFileSync(file, JSON.stringify(context)); assert.equal(inspectVerificationPlan(output, result.file).status, 'current-within-recorded-scope');
    if (kind === 'draft') fs.appendFileSync(path.join(project, draftFile), '\n');
    if (kind === 'source') fs.appendFileSync(path.join(output, 'VariantB.tsx'), '\n// later source');
    if (kind === 'target') fs.appendFileSync(path.join(project, 'preview.html'), '<p>Changed</p>');
    if (kind === 'revision') { context.variants.B.version++; fs.writeFileSync(file, JSON.stringify(context)); }
    if (kind === 'task') { context.taskContract.primaryJob = 'A different task'; fs.writeFileSync(file, JSON.stringify(context)); }
    if (kind === 'brand') { context.designSystem.fonts = ['Arial']; fs.writeFileSync(file, JSON.stringify(context)); }
    if (kind === 'implementation') { const altered = JSON.parse(fs.readFileSync(result.file)); altered.implementation['verification-plan.mjs'] = '0'.repeat(64); fs.writeFileSync(result.file, JSON.stringify(altered)); }
    const bytes = fs.readFileSync(result.file); assert.equal(inspectVerificationPlan(output, result.file).status, 'stale', kind); assert.deepEqual(fs.readFileSync(result.file), bytes);
  }
});
test('missing task facts, incomplete coverage and unsupported commands cannot be sealed', t => {
  for (const kind of ['task', 'coverage', 'unknown-check', 'unsupported-action', 'extra-code', 'missing-gap', 'viewport', 'source-basis']) {
    const { project, output, draftFile, draft, save, context } = setup(t);
    if (kind === 'task') { delete context.taskContract; fs.writeFileSync(path.join(output, '.variant-context.json'), JSON.stringify(context)); }
    if (kind === 'coverage') draft.coverage = [];
    if (kind === 'unknown-check') draft.coverage[0] = { ...draft.coverage[0], status: 'planned', checks: ['taste'] };
    if (kind === 'unsupported-action') draft.actions.scope = [{ action: 'evaluate', locator: { by: 'css', value: 'body' }, value: 'fetch(secret)' }];
    if (kind === 'extra-code') draft.script = 'process.exit(0)';
    if (kind === 'missing-gap') delete draft.gaps['reduced-motion'];
    if (kind === 'viewport') draft.viewport.width = 9000;
    if (kind === 'source-basis') draft.basis.brand[0].file = '../outside';
    save(draft); assert.throws(() => recordVerificationPlan(output, 'B', draftFile, { projectRoot: project })); assert.equal(fs.existsSync(path.join(project, '.variant-work/.runtime-plans')), false);
  }
});
test('scope comparison requires an actual matching baseline report, not an assertion of success', t => {
  const { project, output, draftFile, draft, save } = setup(t); draft.purpose = 'comparison'; draft.plan['scope-preservation'] = [{ locator: { by: 'css', value: 'output' }, property: 'text', expected: '1' }]; draft.actions.scope = [{ action: 'click', locator: { by: 'role', role: 'button', name: 'Inspect' } }]; draft.basis['scope-preservation'] = [{ file: 'preview.html', reason: 'Footer behavior must survive the edit' }]; delete draft.gaps['scope-preservation']; save(draft);
  assert.throws(() => recordVerificationPlan(output, 'B', draftFile), /relative/);
  draft.baselineReport = '.verification/B/claimed.json'; const file = path.join(output, draft.baselineReport); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, '{"status":"passed"}'); save(draft); assert.throws(() => recordVerificationPlan(output, 'B', draftFile), /Invalid verification/);
});
test('missing browser retains unverified checks and stale plans cannot run', async t => {
  const { output, draftFile, project } = setup(t), result = recordVerificationPlan(output, 'B', draftFile);
  const observed = await runVerificationPlan(output, result.file); assert.equal(observed.status, 'unverified'); assert(observed.report.checks.every(c => c.status === 'unverified')); assert(observed.report.fingerprint.inputs[path.relative(project, result.file)]); assert.equal(observed.report.plan.kind, 'task-runtime-plan');
  fs.appendFileSync(path.join(project, draftFile), '\n'); await assert.rejects(() => runVerificationPlan(output, result.file), /stale/);
});
test('unsafe drafts/bundles and symlinks refuse before reading or sealing foreign files', t => {
  const { output, project, draftFile } = setup(t);
  assert.throws(() => recordVerificationPlan(output, 'B', '../outside'), /relative/); assert.throws(() => inspectVerificationPlan(output, path.join(project, 'package.json')), /inside/);
  const original = path.join(project, draftFile); fs.renameSync(original, original + '.saved'); fs.symlinkSync(original + '.saved', original); assert.throws(() => recordVerificationPlan(output, 'B', draftFile), /Symlink/); fs.unlinkSync(original); fs.renameSync(original + '.saved', original);
  const result = recordVerificationPlan(output, 'B', draftFile), saved = fs.readFileSync(result.file); fs.unlinkSync(result.file); fs.symlinkSync(path.join(project, draftFile), result.file); assert.throws(() => inspectVerificationPlan(output, result.file), /Symlink/); fs.unlinkSync(result.file); fs.writeFileSync(result.file, saved);
  fs.mkdirSync(path.join(output, '.variant-lock')); assert.throws(() => recordVerificationPlan(output, 'B', draftFile), /Another history operation/); fs.rmdirSync(path.join(output, '.variant-lock'));
});
test('CLI records only current plans and status never changes the sealed bundle', t => {
  const { output, project, draftFile } = setup(t), script = fileURLToPath(new URL('./verification-plan.mjs', import.meta.url));
  const run = spawnSync(process.execPath, [script, 'record', output, 'B', draftFile, project], { encoding: 'utf8' }); assert.equal(run.status, 0, run.stderr); const result = JSON.parse(run.stdout), saved = fs.readFileSync(result.file);
  fs.appendFileSync(path.join(project, 'preview.html'), '<!-- changed -->'); const status = spawnSync(process.execPath, [script, 'status', output, result.file], { encoding: 'utf8' }); assert.equal(status.status, 2, status.stderr); assert.deepEqual(fs.readFileSync(result.file), saved); assert.equal(spawnSync(process.execPath, [script, '--help']).status, 0);
});
test('oversize drafts and too many actions refuse without creating a sealed plan',t=>{
 const {project,output,draft,draftFile,save}=setup(t),file=path.join(project,draftFile);fs.truncateSync(file,2*1024*1024+1);assert.throws(()=>recordVerificationPlan(output,'B',draftFile),/bounded regular/);save(draft);
 draft.plan['scope-preservation']=[{locator:{by:'css',value:'output'},property:'text',expected:'1'}];draft.basis['scope-preservation']=[{file:'preview.html',reason:'Actual footer'}];delete draft.gaps['scope-preservation'];draft.actions.scope=Array.from({length:33},()=>({action:'click',locator:{by:'role',role:'button',name:'Inspect'}}));save(draft);assert.throws(()=>recordVerificationPlan(output,'B',draftFile),/1–32/);assert.equal(fs.existsSync(path.join(project,'.variant-work/.runtime-plans')),false);
});

 test('a final transport timeout retains an actually measured assertion mismatch',async()=>{
 let reads=0;const target={waitFor:async()=>{},count:async()=>1,textContent:async({timeout})=>{if(!reads++)return '2';await new Promise(resolve=>setTimeout(resolve,timeout+2));const error=new Error('Transport timed out');error.name='TimeoutError';throw error}},page={locator:()=>target};
 await assert.rejects(()=>performVerificationActions(page,[{action:'assert',locator:{by:'css',value:'output'},property:'text',expected:'1',timeoutMs:90}]),error=>error.verificationEvidence?.[0]?.actual==='2'&&error.verificationEvidence[0].matches===false);
 });
 test('unobserved or non-timeout transport failures do not invent a measured assertion failure',async()=>{
 for(const kind of ['unobserved','ambiguous']){let reads=0;const target={waitFor:async()=>{},count:async()=>1,textContent:async({timeout})=>{if(kind==='ambiguous'&&!reads++)return '2';if(kind==='unobserved')await new Promise(resolve=>setTimeout(resolve,timeout+2));const error=new Error(kind);error.name=kind==='unobserved'?'TimeoutError':'Error';throw error}},page={locator:()=>target};await assert.rejects(()=>performVerificationActions(page,[{action:'assert',locator:{by:'css',value:'output'},property:'text',expected:'1',timeoutMs:90}]),error=>!error.verificationEvidence);}
 });
