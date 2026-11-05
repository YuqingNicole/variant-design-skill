import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { recordVerificationPlan, inspectVerificationPlan } from '../scripts/verification-plan.mjs';
import { prepareVariant, applyVariant, undoVariant } from '../scripts/variant-history.mjs';
import { observeRuntimePlan, gradeRuntimePlans } from '../evals/runtime-plans.mjs';
import { viteProcess } from '../evals/native-vite.mjs';
import { snapshot } from '../evals/grade.mjs';
import { createPhaseArchive } from '../evals/phase-archive.mjs';

let project;
const write = (file, value) => { const full = path.join(project, file); fs.mkdirSync(path.dirname(full), { recursive: true }); fs.writeFileSync(full, value); };
const read = file => fs.readFileSync(path.join(project, file), 'utf8');
const role = name => ({ by: 'role', role: 'button', name }), byTest = value => ({ by: 'testId', value });
const assertion = (locator, expected, property = 'text') => ({ locator, property, expected });
const action = (locator, expected) => ({ action: 'assert', ...assertion(locator, expected) });
function setup() {
 project = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'runtime-vite-browser-')));
 fs.cpSync(new URL('../evals/fixtures/runtime-plan-vite/project/', import.meta.url), project, { recursive: true });
 fs.cpSync(new URL('./node_modules/', import.meta.url), path.join(project, 'node_modules'), { recursive: true });
 const app = read('src/App.tsx');
 for (const id of ['A', 'B', 'C']) {
   write(`variant-output/Variant${id}.tsx`, app.replace('<div className="workspace">', `<div className="workspace" data-runtime-variant="${id}">`));
   write(`.variant-work/preview/${id}.html`, `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Runtime ${id}</title></head><body><div id="root"></div><script type="module" src="./main-${id}.tsx"></script></body></html>`);
   write(`.variant-work/preview/main-${id}.tsx`, `import {createRoot} from 'react-dom/client';import {ReviewProvider} from '@/review';import App from '../../variant-output/Variant${id}';import '@/global.css';createRoot(document.getElementById('root')!).render(<ReviewProvider><App/></ReviewProvider>);`);
 }
 write('variant-output/.variant-context.json', JSON.stringify({ schemaVersion: 2, selectedVariant: null, taskContract: { primaryJob: 'Review progress and workspace activity', data: 'src/review-data.json and original ReviewProvider', requiredFunctions: ['Read progress', 'Animate with motion preferences', 'Inspect independent workspace activity and roles'] }, designSystem: { confirmed: true, file: 'src/global.css', fonts: ['Georgia'] }, variants: Object.fromEntries(['A', 'B', 'C'].map(id => [id, { entry: `Variant${id}.tsx`, files: [`Variant${id}.tsx`], version: 1, tokens: { fonts: ['Georgia'] }, history: [], undo: [] }])) }));
 for (const file of ['verification-plan.mjs','browser-verification.mjs','artifact-verification.mjs','variant-history.mjs','project-dependencies.mjs','dependency-references.mjs','quality-gate.mjs']) write(`.agents/skills/variant-design/scripts/${file}`, fs.readFileSync(new URL(`../scripts/${file}`, import.meta.url)));
}
function draft() {
 const plan = { brand: [assertion({ by: 'css', value: 'h1' }, 'Georgia', 'font-family')], 'keyboard-focus': [{ locator: { by: 'label', name: 'Workspace' } }, { locator: role('Animate progress') }, { locator: role('Inspect activity') }], 'reduced-motion': { settled: [assertion(byTest('progress'), '100')], startMs: 30, settleMs: 80, sampleMs: 100 }, 'scope-preservation': [assertion(byTest('activity-count'), '1'), assertion(byTest('progress'), '100'), assertion(byTest('workspace-role'), 'Owner')] };
 const scope = [action(byTest('activity-count'), '0'), { action: 'click', locator: role('Inspect activity') }, action(byTest('activity-count'), '1'), { action: 'select', locator: { by: 'label', name: 'Workspace' }, value: 'archive' }, action(byTest('workspace-role'), 'Read only'), { action: 'assert', ...assertion({ by: 'css', value: 'button[aria-label="Animate progress"]' }, 'none', 'display') }, action(byTest('activity-count'), '0'), { action: 'click', locator: role('Inspect activity') }, action(byTest('activity-count'), '1'), { action: 'select', locator: { by: 'label', name: 'Workspace' }, value: 'studio' }, action(byTest('activity-count'), '1')];
 return { schemaVersion: 1, target: '.variant-work/preview/B.html', viewport: { width: 390, height: 844 }, purpose: 'baseline', plan, actions: { motion: [{ action: 'click', locator: role('Animate progress') }, { ...action(byTest('progress'), '50'), whenMotion: 'no-preference' }], scope }, projectChecks: true, gaps: {}, basis: Object.fromEntries(['brand','keyboard-focus','reduced-motion','scope-preservation','project-checks'].map(id => [id, [{ file: id === 'brand' ? 'src/global.css' : id === 'project-checks' ? 'tsconfig.json' : 'src/review.tsx', reason: 'Controlled regression on actual fixture source, not Agent-authored acceptance' }]])), coverage: [{ requirement: 'Read progress', status: 'planned', checks: ['brand'], reason: 'Original heading typography' }, { requirement: 'Animate with motion preferences', status: 'planned', checks: ['keyboard-focus','reduced-motion'], reason: 'Real control and RAF state' }, { requirement: 'Inspect independent workspace activity and roles', status: 'planned', checks: ['scope-preservation'], reason: 'Original provider state survives workspace switching and viewer role' }] };
}
function seal(spec, name) { const file = `.variant-work/${name}.json`; write(file, JSON.stringify(spec)); const sealed = recordVerificationPlan(path.join(project, 'variant-output'), 'B', file); write('.variant-work/runtime-plan.json', JSON.stringify({ schemaVersion: 1, bundle: path.relative(project, sealed.file) })); return sealed; }
async function observe(browser, info, phase) { const archive = createPhaseArchive(project, { directory: info.outputPath(`${phase}-archive`), phase, snapshot: snapshot(project) }); return observeRuntimePlan(project, { out: info.outputPath(phase), phase, browser, mode: 'vite', archive }); }
test.afterEach(() => { if (project) fs.rmSync(project, { recursive: true, force: true }); });

test('actual React/Vite plans observe source-bound baseline, edit and undo with original provider probes', async ({ browser }, info) => {
 test.setTimeout(120000); setup(); const output = path.join(project, 'variant-output'), spec = draft(), before = seal(spec, 'before');
 const escaped = await viteProcess(project, 'vite.config.ts', { mode: 'build', destination: info.outputPath('escaped-build'), entries: ['../foreign.html'] }); expect(escaped.exit).not.toBe(0); expect(fs.existsSync(info.outputPath('escaped-build'))).toBe(false);
 const baseline = await observe(browser, info, 'generate'); expect(baseline.pass, baseline.error ?? JSON.stringify(baseline.vite)).toBe(true); expect(baseline.vite.dependencyProbe.pass).toBe(true);
 const candidate = path.join(project, '.variant-work/heading-candidate'); prepareVariant(output, 'B', candidate, project); fs.writeFileSync(path.join(candidate, 'VariantB.tsx'), fs.readFileSync(path.join(candidate, 'VariantB.tsx'), 'utf8').replace('{r.title}</h1>', '{r.title} — Draft</h1>')); applyVariant(output, 'B', candidate, { request: 'heading', summary: 'Append draft to heading' });
 expect(inspectVerificationPlan(output, before.file).status).toBe('stale'); const comparison = { ...spec, purpose: 'comparison', baselineReport: path.relative(output, baseline.result.file) }; seal(comparison, 'after');
 const edited = await observe(browser, info, 'plan-edit'); expect(edited.pass, edited.error ?? JSON.stringify(edited.vite)).toBe(true); expect(edited.result.status).toBe('passed');
 undoVariant(output, 'B'); seal(comparison, 'undo'); const undo = await observe(browser, info, 'plan-undo'); expect(undo.pass, undo.error ?? JSON.stringify(undo.vite)).toBe(true); expect(undo.result.status).toBe('passed');
 expect(gradeRuntimePlans({ generate: baseline, 'plan-edit': edited, 'plan-undo': undo }, { mode: 'vite' }).filter(c => c.id.startsWith('vite-')).every(c => c.pass)).toBe(true);
});
test('a copied provider importing original data cannot pass the independent Vite dependency probe', async ({ browser }, info) => {
 test.setTimeout(60000); setup(); write('variant-output/copied-review.tsx', read('src/review.tsx')); write('variant-output/VariantB.tsx', read('variant-output/VariantB.tsx').replace("from '@/review'", "from './copied-review'")); write('.variant-work/preview/main-B.tsx', read('.variant-work/preview/main-B.tsx').replace("from '@/review'", "from '../../variant-output/copied-review'"));
 const context = JSON.parse(read('variant-output/.variant-context.json')); context.variants.B.files.push('copied-review.tsx'); write('variant-output/.variant-context.json', JSON.stringify(context)); seal(draft(), 'copied');
 const result = await observe(browser, info, 'generate'); expect(result.result.report.checks.filter(c => c.status === 'passed')).toHaveLength(4); expect(result.pass).toBe(false); expect(result.vite.dependencyProbe.pass).toBe(false); expect(result.vite.dependencyProbe.error).toContain('actual original data and provider'); expect(result.vite.unchanged).toBe(true);
});
test('real TypeScript failures cannot be reported as accepted', async ({ browser }, info) => {
 test.setTimeout(60000); setup(); write('variant-output/VariantB.tsx', read('variant-output/VariantB.tsx') + "\nconst wrong: number = 'type error';\n"); seal(draft(), 'type-error'); const result = await observe(browser, info, 'generate'); expect(result.pass).toBe(false); expect(result.result.report.checks.find(c => c.id === 'project-checks').status).toBe('failed'); expect(result.vite.checks.typecheck.exit).not.toBe(0); expect(result.vite.unchanged).toBe(true);
});

test('a candidate dropping the original Vite define fails readiness even when it builds', async ({ browser }, info) => {
 test.setTimeout(60000); setup(); write('variant-output/VariantB.tsx', read('variant-output/VariantB.tsx').replace('__REVIEW_LABEL__', "'Wrong configuration'")); seal(draft(), 'wrong-define');
 const result = await observe(browser, info, 'generate'); expect(result.pass).toBe(false); expect(result.vite.readyCount).toBe(0); expect(result.vite.checks.typecheck.exit).toBe(0); expect(result.vite.checks.build.exit).toBe(0); expect(result.result.status).toBe('unverified');
});
