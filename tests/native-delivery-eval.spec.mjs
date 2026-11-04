import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { snapshot } from '../evals/grade.mjs';
import { inspectNativeDelivery, replayNativeDelivery, gradeNativeDelivery, nativeOriginalFiles } from '../evals/native-delivery.mjs';
import { prepareVariant, applyVariant, undoVariant } from '../scripts/variant-history.mjs';
import { prepareIntegration, integrateVariant, rollbackIntegration } from '../scripts/variant-integrate.mjs';

let root, base;
const hash = value => createHash('sha256').update(value).digest('hex');
const write = (project, file, text) => { const full = path.join(project, file); fs.mkdirSync(path.dirname(full), { recursive: true }); fs.writeFileSync(full, text); };
test.beforeAll(() => {
  if (process.env.NATIVE_VITE_EVIDENCE) fs.mkdirSync(process.env.NATIVE_VITE_EVIDENCE, { recursive: true });
  root = fs.mkdtempSync(path.join(process.env.NATIVE_VITE_EVIDENCE ?? os.tmpdir(), 'native-delivery-')); base = path.join(root, 'base');
  fs.cpSync('../evals/fixtures/native-vite/project', base, { recursive: true }); execFileSync('npm', ['ci', '--prefer-offline', '--no-audit', '--no-fund', '--loglevel=error'], { cwd: base, stdio: 'pipe' });
});
test.afterAll(() => { if (process.env.NATIVE_VITE_EVIDENCE) console.log(`Delivery evidence: ${root}`); else fs.rmSync(root, { recursive: true, force: true }); });

function generatedProject(name) {
  const project = path.join(root, name); fs.cpSync(base, project, { recursive: true });
  const context = { schemaVersion: 2, selectedVariant: null, designSystem: { confirmed: true, file: 'src/global.css', fonts: ['Arial', 'Georgia'] }, variants: {} };
  const spec = { schemaVersion: 1, compare: '.variant-work/native/compare.html', entries: {}, buildConfig: '.variant-work/native/vite.config.ts', typecheckConfig: '.variant-work/native/tsconfig.json', adapterFiles: [], dependencies: ['src/workspace.tsx', 'src/workspaces.json', 'src/global.css', 'src/workshop-mark.svg', 'vite.config.ts', 'tsconfig.json'] };
  for (const id of ['A', 'B', 'C']) {
    const entry = `Variant${id}.tsx`; context.variants[id] = { entry, files: [entry], version: 1, tokens: { fonts: ['Arial', 'Georgia'] }, history: [], undo: [] };
    write(project, `variant-output/${entry}`, fs.readFileSync(path.join(base, 'src/App.tsx'), 'utf8').replace('<main className="desk">', `<main className="desk" data-native-variant="${id}">`));
    spec.entries[id] = `.variant-work/native/${id}.html`;
    write(project, spec.entries[id], `<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Direction ${id}</title><body><div id="root"></div><script type="module" src="./${id}.tsx"></script></body></html>`);
    write(project, `.variant-work/native/${id}.tsx`, `import {createRoot} from 'react-dom/client';import {WorkspaceProvider} from '@/workspace';import App from '../../variant-output/${entry.slice(0, -4)}';import '@/global.css';createRoot(document.getElementById('root')!).render(<WorkspaceProvider><App/></WorkspaceProvider>);`);
    spec.adapterFiles.push(spec.entries[id], `.variant-work/native/${id}.tsx`);
  }
  write(project, 'variant-output/.variant-context.json', JSON.stringify(context));
  write(project, spec.compare, '<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><h1>Compare</h1><a href="./A.html">A</a> <a href="./B.html">B</a> <a href="./C.html">C</a>');
  write(project, spec.buildConfig, `import {mergeConfig} from 'vite';import base from '../../vite.config';import {fileURLToPath} from 'node:url';export default mergeConfig(base,{build:{rollupOptions:{input:Object.fromEntries(['../../index.html','./compare.html','./A.html','./B.html','./C.html'].map((file,i)=>[String(i),fileURLToPath(new URL(file,import.meta.url))]))}}});`);
  write(project, spec.typecheckConfig, JSON.stringify({ extends: '../../tsconfig.json', include: ['../../src', '../../variant-output', './*.tsx'] })); spec.adapterFiles.push(spec.compare, spec.buildConfig, spec.typecheckConfig);
  write(project, '.variant-work/native-preview.json', JSON.stringify(spec));
  const baseline = { fingerprint: Object.fromEntries(nativeOriginalFiles.map(file => [file, hash(fs.readFileSync(path.join(project, file)))])) }, generated = snapshot(project);
  return { project, baseline, generated };
}

function recordedDelivery(input, direction = 'B') {
  const { project } = input, output = path.join(project, 'variant-output'), candidate = path.join(project, '.variant-work/draft');
  prepareVariant(output, 'B', candidate, project); const b = path.join(candidate, 'VariantB.tsx'); fs.writeFileSync(b, fs.readFileSync(b, 'utf8').replace('</h1>', ' — Draft</h1>'));
  applyVariant(output, 'B', candidate, { summary: 'Temporary heading', request: 'test-heading' }); undoVariant(output, 'B');
  const check = phase => ['typecheck', 'build'].map(tool => {
    const argv = tool === 'typecheck' ? ['node_modules/typescript/bin/tsc', '--noEmit'] : ['node_modules/vite/bin/vite.js', 'build', '--outDir', `.variant-work/check-${phase}`];
    const stdout = execFileSync(process.execPath, argv, { cwd: project, encoding: 'utf8' }), version = JSON.parse(fs.readFileSync(path.join(project, `node_modules/${tool === 'build' ? 'vite' : 'typescript'}/package.json`))).version;
    const log = `.variant-work/${phase}-${tool}.log`, command = [process.execPath, ...argv].join(' '); write(project, log, JSON.stringify({ command, version, exitCode: 0 }) + '\n' + stdout);
    return { tool, command, version, exitCode: 0, log };
  });
  const beforeChecks = check('before'), plan = '.variant-work/delivery-plan.json', staging = '.variant-work/staging';
  prepareIntegration(output, 'B', ['src/App.tsx'], path.join(project, plan), project); write(project, `${staging}/src/App.tsx`, direction === 'B' ? "export {default} from '../variant-output/VariantB';\n" : "import App from '../variant-output/VariantA';export default function Staged(){return <div data-native-variant=\"B\"><App/></div>}\n");
  const record = integrateVariant(output, 'B', path.join(project, staging), project, path.join(project, plan)), afterChecks = check('after'), rollback = rollbackIntegration(output, record.id, project);
  write(project, '.variant-work/rollback.log', JSON.stringify(rollback));
  const manifest = { schemaVersion: 1, plan, staging, integrationId: record.id, changedFiles: ['src/App.tsx'], beforeChecks, afterChecks, rollback: { completed: true, log: '.variant-work/rollback.log' } };
  write(project, '.variant-work/native-delivery.json', JSON.stringify(manifest)); return { ...input, manifest };
}

test('inspection rejects missing/forged receipts, unrestored files, mismatched snapshots and symlink logs', () => {
  test.setTimeout(120000); const input = recordedDelivery(generatedProject('inspection')), { project, manifest } = input;
  expect(inspectNativeDelivery(project, input).record.variant).toBe('B');
  const file = path.join(project, '.variant-work/native-delivery.json'), save = value => fs.writeFileSync(file, JSON.stringify(value));
  save({ ...manifest, rollback: { ...manifest.rollback, completed: false } }); expect(() => inspectNativeDelivery(project, input)).toThrow(/Rollback/);
  save({ ...manifest, beforeChecks: [] }); expect(() => inspectNativeDelivery(project, input)).toThrow(/beforeChecks/);
  save({ ...manifest, changedFiles: ['src/main.tsx'] }); expect(() => inspectNativeDelivery(project, input)).toThrow(/only src/); save(manifest);
  const app = path.join(project, 'src/App.tsx'), original = fs.readFileSync(app); fs.appendFileSync(app, '\n/* later user edit */'); expect(() => inspectNativeDelivery(project, input)).toThrow(/Original file not restored/); fs.writeFileSync(app, original);
  const record = path.join(project, `variant-output/.integrations/${manifest.integrationId}.json`), saved = fs.readFileSync(record), receipt = JSON.parse(saved); receipt.files[0].after.sha256 = '0'.repeat(64); fs.writeFileSync(record, JSON.stringify(receipt)); expect(() => inspectNativeDelivery(project, input)).toThrow(/Staging/); fs.writeFileSync(record, saved);
  const c = path.join(project, 'variant-output/.variant-context.json'), context = JSON.parse(fs.readFileSync(c)), snapshotFile = path.join(project, 'variant-output', context.variants.B.history[0].snapshot), snapshot = fs.readFileSync(snapshotFile), broken = JSON.parse(snapshot); broken.expectedAfter['VariantB.tsx'] = Buffer.from('forged draft').toString('base64'); fs.writeFileSync(snapshotFile, JSON.stringify(broken)); expect(() => inspectNativeDelivery(project, input)).toThrow(/recovery snapshot/); fs.writeFileSync(snapshotFile, snapshot);
  const log = path.join(project, manifest.beforeChecks[0].log), actual = fs.readFileSync(log); fs.unlinkSync(log); fs.symlinkSync(app, log); expect(() => inspectNativeDelivery(project, input)).toThrow(/Symlink/); fs.unlinkSync(log); fs.writeFileSync(log, actual);
  expect(gradeNativeDelivery({ pass: true }).pass).toBe(false);
});

test('real history, browser integration and rollback replay preserve the original project and refuse later edits', async ({ browser }) => {
  test.setTimeout(180000); const input = recordedDelivery(generatedProject('positive'));
  const report = await replayNativeDelivery(input.project, { generated: input.generated, baseline: input.baseline, browser, out: path.join(root, 'positive-replay') });
  expect(report.checks.filter(c => !c.pass), report.error).toEqual([]); expect(gradeNativeDelivery(report).pass).toBe(true);
  expect(report.originalAfter).toEqual(report.originalBefore);
  expect(report.captures.draft.samples.every(s => s.heading.endsWith('— Draft'))).toBe(true);
  expect(report.captures.integrated.samples.every(s => s.identity && s.task)).toBe(true);
  await expect(replayNativeDelivery(input.project, { generated: input.generated, baseline: input.baseline, browser, out: path.join(root, 'positive-replay') })).rejects.toThrow(/Preserve existing/);
});

test('a receipt labelled B cannot pass when the actual original entry renders A', async ({ browser }) => {
  test.setTimeout(180000); const input = recordedDelivery(generatedProject('wrong-direction'), 'A');
  const report = await replayNativeDelivery(input.project, { generated: input.generated, baseline: input.baseline, browser, out: path.join(root, 'wrong-direction-replay') });
  expect(report.checks.find(c => c.id === 'recorded-delivery').pass).toBe(true);
  expect(report.checks.find(c => c.id === 'integration-replayed').pass).toBe(false); expect(report.pass).toBe(false);
  expect(report.captures.integrated.samples.every(s => !s.identity && s.task)).toBe(true);
  expect(report.captures.integrated.samples.every(s => s.markers.includes('B') && s.markers.includes('A'))).toBe(true);
  expect(report.checks.find(c => c.id === 'original-restored').pass).toBe(true); expect(report.originalAfter).toEqual(report.originalBefore);
});
