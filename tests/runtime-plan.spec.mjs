import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { recordVerificationPlan, inspectVerificationPlan, runVerificationPlan } from '../scripts/verification-plan.mjs';
import { inspectVerification } from '../scripts/artifact-verification.mjs';
import { prepareVariant, applyVariant, undoVariant } from '../scripts/variant-history.mjs';
import { observeRuntimePlan } from '../evals/runtime-plans.mjs';

const compiler = path.dirname(createRequire(import.meta.url).resolve('typescript/package.json'));
let project, output;
const write = (file, text) => { const full = path.join(project, file); fs.mkdirSync(path.dirname(full), { recursive: true }); fs.writeFileSync(full, text); };
const read = file => fs.readFileSync(path.join(project, file), 'utf8');
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Report</title><link rel="stylesheet" href="../brand.css"><style>button:focus-visible{outline:2px solid rgb(0, 0, 255);outline-offset:3px}</style></head><body data-variant="B"><main><!-- zone:hero:start --><section><h1>Report</h1><button id="animate">Animate</button><output data-testid="progress">100</output></section><!-- zone:hero:end --></main><footer><button id="inspect">Inspect footer</button><output data-testid="footer-count">0</output></footer><script>
const progress=document.querySelector('[data-testid="progress"]'),counter=document.querySelector('[data-testid="footer-count"]'),preference=matchMedia('(prefers-reduced-motion: reduce)');let frame;
document.querySelector('#inspect').onclick=()=>{counter.textContent=String(Number(counter.textContent)+1)};
document.querySelector('#animate').onclick=()=>{cancelAnimationFrame(frame);if(preference.matches){progress.textContent='100';return;}const tick=()=>{progress.textContent='50';frame=requestAnimationFrame(tick)};tick()};
preference.addEventListener('change',()=>{if(preference.matches){cancelAnimationFrame(frame);progress.textContent='100'}});
</script></body></html>`;
function setup() {
  project = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'runtime-plan-browser-'))); output = path.join(project, 'variant-output');
  write('package.json', '{"type":"module","scripts":{"check":"node check.mjs"}}'); fs.mkdirSync(path.join(project, 'node_modules')); fs.symlinkSync(compiler, path.join(project, 'node_modules/typescript'), process.platform === 'win32' ? 'junction' : 'dir');
  write('brand.css', 'body{font-family:Georgia;color:#142536;background:#f7fafc}');
  write('variant-output/B.html', html); write('index.html', '<h1>Original</h1>');
  write('check.mjs', `import fs from 'node:fs';import vm from 'node:vm';const html=fs.readFileSync(new URL('./variant-output/B.html',import.meta.url),'utf8');for(const match of html.matchAll(/<script>([\\s\\S]*?)<\\/script>/g))new vm.Script(match[1]);console.log('Actual generated script syntax checked');`);
  write('variant-output/.variant-context.json', JSON.stringify({ schemaVersion: 2, selectedVariant: null, taskContract: { primaryJob: 'Read report and inspect its activity', data: 'local counter state', requiredFunctions: ['Read report', 'Play progress', 'Inspect footer'] }, designSystem: { confirmed: true, file: 'brand.css', fonts: ['Georgia'] }, variants: { B: { entry: 'B.html', files: ['B.html'], version: 1, tokens: { fonts: ['Georgia'] }, history: [], undo: [] } } }));
}
const byRole = name => ({ by: 'role', role: 'button', name });
const byTest = value => ({ by: 'testId', value });
function draft() {
  const plan = { brand: [{ locator: { by: 'css', value: 'h1' }, property: 'font-family', expected: 'Georgia' }], 'keyboard-focus': ['Animate', 'Inspect footer'].map(name => ({ locator: byRole(name), maxTabs: 10 })), 'reduced-motion': { settled: [{ locator: byTest('progress'), property: 'text', expected: '100' }], startMs: 30, settleMs: 50, sampleMs: 80 }, 'scope-preservation': [{ locator: byTest('footer-count'), property: 'text', expected: '1' }] };
  return { schemaVersion: 1, target: 'variant-output/B.html', viewport: { width: 390, height: 844 }, purpose: 'baseline', plan,
    actions: { motion: [{ action: 'click', locator: byRole('Animate') }, { action: 'assert', locator: byTest('progress'), property: 'text', expected: '50', whenMotion: 'no-preference' }], scope: [{ action: 'click', locator: byRole('Inspect footer') }, { action: 'assert', locator: byTest('footer-count'), property: 'text', expected: '1', timeoutMs: 250 }] },
    basis: Object.fromEntries(['brand', 'keyboard-focus', 'reduced-motion', 'scope-preservation', 'project-checks'].map(id => [id, [{ file: id === 'brand' ? 'brand.css' : id === 'project-checks' ? 'check.mjs' : 'variant-output/B.html', reason: `Actual fixture source for ${id}; controlled regression, not a generated product acceptance` }]])), gaps: {}, projectChecks: true,
    coverage: [{ requirement: 'Read report', status: 'planned', checks: ['brand'], reason: 'Read the preserved heading with its original font' }, { requirement: 'Play progress', status: 'planned', checks: ['reduced-motion', 'keyboard-focus'], reason: 'Trigger normal progress then test initial and switched reduced preference' }, { requirement: 'Inspect footer', status: 'planned', checks: ['scope-preservation', 'keyboard-focus'], reason: 'Exercise the actual unaffected footer counter before and after the heading edit' }] };
}
function seal(spec, name) { const file = `.variant-work/${name}.json`; write(file, JSON.stringify(spec)); return recordVerificationPlan(output, 'B', file, { projectRoot: project }); }
function edit(transform, request) { const candidate = path.join(project, '.variant-work', request); prepareVariant(output, 'B', candidate, project); fs.writeFileSync(path.join(candidate, 'B.html'), transform(fs.readFileSync(path.join(candidate, 'B.html'), 'utf8'))); applyVariant(output, 'B', candidate, { request, summary: request }); }
const adapter = (page, browser, title) => ({ page, version: browser.version(), ready: async p => { await expect(p.locator('body')).toHaveAttribute('data-variant', 'B'); await expect(p.locator('h1')).toHaveText(title); }, projectChecks: async () => { const stdout = execFileSync(process.execPath, [path.join(project, 'check.mjs')], { cwd: project, encoding: 'utf8' }); return { id: 'project-checks', status: 'passed', reason: 'Actual project syntax command completed', tool: { name: 'Node vm syntax check', version: process.version }, environment: { command: ['node', 'check.mjs'] }, evidence: [stdout] }; } });
test.afterEach(() => fs.rmSync(project, { recursive: true, force: true }));

test('sealed declarative plans run real focus/motion/actions and require an observed before baseline', async ({ page, browser }) => {
  setup(); const spec = draft(), beforePlan = seal(spec, 'before'), before = await runVerificationPlan(output, beforePlan.file, adapter(page, browser, 'Report'));
  expect(before.report.checks.find(c => c.id === 'scope-preservation').status).toBe('unverified'); expect(before.report.checks.find(c => c.id === 'scope-preservation').evidence.every(e => e.matches)).toBe(true); expect(before.report.checks.filter(c => c.status === 'passed')).toHaveLength(4);
  edit(source => source.replace('<h1>Report</h1>', '<h1>Report draft</h1>'), 'heading-edit'); expect(inspectVerificationPlan(output, beforePlan.file).status).toBe('stale');
  const afterSpec = { ...spec, purpose: 'comparison', baselineReport: path.relative(output, before.file) }, afterPlan = seal(afterSpec, 'after');
  const wrongViewport = { ...afterSpec, viewport: { width: 1440, height: 900 } }; expect(() => seal(wrongViewport, 'wrong-viewport')).toThrow(/viewport or tools differ/);
  const originalBrand=read('brand.css');write('brand.css',originalBrand+'\n/* external shared edit */');expect(()=>seal(afterSpec,'changed-shared')).toThrow(/shared, task or brand inputs changed/);write('brand.css',originalBrand);
  const baselineDraft=read(beforePlan.record.draftFile);write(beforePlan.record.draftFile,baselineDraft+'\n');expect(()=>seal(afterSpec,'changed-baseline-draft')).toThrow(/Baseline observation inputs changed/);write(beforePlan.record.draftFile,baselineDraft);
  const after = await runVerificationPlan(output, afterPlan.file, adapter(page, browser, 'Report draft')); expect(after.report.checks.map(c => [c.id, c.status])).toEqual(['brand', 'keyboard-focus', 'reduced-motion', 'scope-preservation', 'project-checks'].map(id => [id, 'passed'])); expect(after.status).toBe('passed');
  expect(JSON.parse(read('variant-output/.variant-context.json')).selectedVariant).toBe(null);
  edit(source => source.replace('outline:2px solid rgb(0, 0, 255)', 'outline:none').replace('if(preference.matches)', 'if(false)').replace("if(preference.matches){cancel", "if(false){cancel").replace('Number(counter.textContent)+1', 'Number(counter.textContent)+2').replace('</style>', 'body{font-family:Arial}</style>'), 'negative-render');
  const badPlan = seal(afterSpec, 'bad'), bad = await runVerificationPlan(output, badPlan.file, adapter(page, browser, 'Report draft')); expect(bad.report.checks.filter(c => c.status === 'failed').map(c => c.id)).toEqual(['brand', 'keyboard-focus', 'reduced-motion', 'scope-preservation']); expect(bad.status).toBe('failed'); expect(bad.report.checks.find(c => c.id === 'scope-preservation').evidence[0].actual).toBe('2');
  const interrupted = adapter(page, browser, 'Report draft'); interrupted.projectChecks = async () => { throw new Error('Project tool unavailable'); }; const retained = await runVerificationPlan(output, badPlan.file, interrupted); expect(retained.report.checks.filter(c => c.status === 'failed')).toHaveLength(4); expect(retained.report.checks.find(c => c.id === 'project-checks').status).toBe('unverified'); expect(retained.status).toBe('failed');
  expect(inspectVerification(output, after.file).status).toBe('stale'); undoVariant(output, 'B');
  const fresh = seal(afterSpec, 'input-mutation'), runAdapter = adapter(page, browser, 'Report draft'), originalChecks = runAdapter.projectChecks;
  runAdapter.projectChecks = async () => { const checked = await originalChecks(); fs.appendFileSync(before.file, '\n'); return checked; };
  const changed = await runVerificationPlan(output, fresh.file, runAdapter); expect(changed.status).toBe('stale'); expect(changed.report.changedDuringRun).toBe(true); expect(inspectVerificationPlan(output, fresh.file).status).toBe('stale');
});
test('missing browser/ready never fabricates browser results and keeps actual independent project checks', async () => {
  setup(); const sealed = seal(draft(), 'no-browser'), actual = adapter(null, { version: () => 'not used' }, 'Report'); delete actual.page; delete actual.ready;
  const result = await runVerificationPlan(output, sealed.file, actual); expect(result.report.checks.filter(c => c.id !== 'project-checks').every(c => c.status === 'unverified')).toBe(true); expect(result.report.checks.find(c => c.id === 'project-checks').status).toBe('passed'); expect(result.status).toBe('unverified');
});
test('independent host executes authored JSON against exact file response bytes and actual project commands', async ({browser}, info) => {
  setup();write('index.html','<!doctype html><html><head><title>Original</title></head><body>Original</body></html>');write('check.mjs',fs.readFileSync(new URL('../evals/fixtures/runtime-plan-html/project/check.mjs',import.meta.url)));
  write('variant-output/B.html',read('variant-output/B.html').replace('data-variant="B"','data-variant="B" data-runtime-variant="B"'));
  for(const file of ['verification-plan.mjs','browser-verification.mjs','artifact-verification.mjs','variant-history.mjs','project-dependencies.mjs','dependency-references.mjs','quality-gate.mjs'])write(`.agents/skills/variant-design/scripts/${file}`,fs.readFileSync(new URL(`../scripts/${file}`,import.meta.url)));
  const sealed=seal(draft(),'host-before');write('.variant-work/runtime-plan.json',JSON.stringify({schemaVersion:1,bundle:path.relative(project,sealed.file)}));
  const baseline=await observeRuntimePlan(project,{out:info.outputPath('host-before'),phase:'generate',browser});expect(baseline.pass,baseline.error).toBe(true);expect(baseline.preserved).toBe(true);expect(JSON.parse(read('.variant-work/runtime-baseline.json')).report).toBe(path.relative(output,baseline.result.file));
  edit(source=>source.replace('<h1>Report</h1>','<h1>Report draft</h1>'),'host-edit');const spec={...draft(),purpose:'comparison',baselineReport:path.relative(output,baseline.result.file)},after=seal(spec,'host-after');write('.variant-work/runtime-plan.json',JSON.stringify({schemaVersion:1,bundle:path.relative(project,after.file)}));
  const observed=await observeRuntimePlan(project,{out:info.outputPath('host-after'),phase:'plan-edit',browser});expect(observed.pass,observed.error).toBe(true);expect(observed.result.report.checks.every(c=>c.status==='passed')).toBe(true);expect(observed.result.report.fingerprint.version).toBe(2);
});
test('declarative label locators fill, select and press real controls before asserting state',async({page,browser})=>{
  setup();const controls='<label>Query<input aria-label="Query"></label><label>Mode<select aria-label="Mode"><option value="viewer">Viewer</option><option value="owner">Owner</option></select></label><output data-testid="query-value"></output><output data-testid="mode-value">viewer</output><output data-testid="last-key"></output>';
  write('variant-output/B.html',read('variant-output/B.html').replace('<footer>','<footer>'+controls).replace('<script>',`<script>document.querySelector('[aria-label="Query"]').oninput=e=>document.querySelector('[data-testid="query-value"]').textContent=e.target.value;document.querySelector('[aria-label="Query"]').onkeyup=e=>document.querySelector('[data-testid="last-key"]').textContent=e.key;document.querySelector('[aria-label="Mode"]').onchange=e=>document.querySelector('[data-testid="mode-value"]').textContent=e.target.value;`));
  const spec=draft();spec.actions.scope.unshift({action:'fill',locator:{by:'label',name:'Query'},value:'Canopy'},{action:'select',locator:{by:'label',name:'Mode'},value:'owner'},{action:'press',locator:{by:'label',name:'Query'},value:'Enter'});
  spec.plan['scope-preservation'].push(...[['query-value','Canopy'],['mode-value','owner'],['last-key','Enter']].map(([value,expected])=>({locator:byTest(value),property:'text',expected})));
  const sealed=seal(spec,'controls'),result=await runVerificationPlan(output,sealed.file,adapter(page,browser,'Report'));const scope=result.report.checks.find(c=>c.id==='scope-preservation');expect(scope.status).toBe('unverified');expect(scope.evidence).toHaveLength(4);expect(scope.evidence.every(e=>e.matches)).toBe(true);
});
