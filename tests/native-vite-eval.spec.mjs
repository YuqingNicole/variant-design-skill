import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { captureNativeVite, probeNativeDependencies, gradeNativeVite, nativeManifest } from '../evals/native-vite.mjs';

let root, project, evidence;
const write = (file, text) => { const full = path.join(project, file); fs.mkdirSync(path.dirname(full), { recursive: true }); fs.writeFileSync(full, text); };
function adapters() {
  const spec = { schemaVersion: 1, compare: '.variant-work/native/compare.html', entries: {}, buildConfig: '.variant-work/native/vite.config.ts', typecheckConfig: '.variant-work/native/tsconfig.json', adapterFiles: [], dependencies: ['src/workspace.tsx', 'src/workspaces.json', 'src/global.css', 'src/workshop-mark.svg', 'vite.config.ts', 'tsconfig.json'] };
  for (const id of ['A', 'B', 'C']) {
    spec.entries[id] = `.variant-work/native/${id}.html`;
    write(spec.entries[id], `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Direction ${id}</title></head><body><div id="root"></div><script type="module" src="./${id}.tsx"></script></body></html>`);
    write(`.variant-work/native/${id}.tsx`, `import {createRoot} from 'react-dom/client';import {WorkspaceProvider} from '@/workspace';import App from '@/App';import '@/global.css';createRoot(document.getElementById('root')!).render(<WorkspaceProvider><div data-native-variant="${id}"><App/></div></WorkspaceProvider>);`);
    spec.adapterFiles.push(spec.entries[id], `.variant-work/native/${id}.tsx`);
  }
  write(spec.compare, '<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Compare</title><body><h1>Compare directions</h1><a href="./A.html">Open A</a> <a href="./B.html">Open B</a> <a href="./C.html">Open C</a></body></html>');
  write(spec.buildConfig, `import {mergeConfig} from 'vite';import base from '../../vite.config';import {fileURLToPath} from 'node:url';export default mergeConfig(base,{build:{rollupOptions:{input:{original:fileURLToPath(new URL('../../index.html',import.meta.url)),compare:fileURLToPath(new URL('./compare.html',import.meta.url)),A:fileURLToPath(new URL('./A.html',import.meta.url)),B:fileURLToPath(new URL('./B.html',import.meta.url)),C:fileURLToPath(new URL('./C.html',import.meta.url))}}}});`);
  write(spec.typecheckConfig, JSON.stringify({ extends: '../../tsconfig.json', include: ['../../src', './*.tsx'] }));
  spec.adapterFiles.push(spec.compare, spec.buildConfig, spec.typecheckConfig);
  write('.variant-work/native-preview.json', JSON.stringify(spec));
  return spec;
}
test.beforeAll(() => {
  if (process.env.NATIVE_VITE_EVIDENCE) fs.mkdirSync(process.env.NATIVE_VITE_EVIDENCE, { recursive: true });
  root = fs.mkdtempSync(path.join(process.env.NATIVE_VITE_EVIDENCE ?? os.tmpdir(), 'native-vite-eval-')); project = path.join(root, 'project'); evidence = path.join(root, 'evidence');
  fs.cpSync('../evals/fixtures/native-vite/project', project, { recursive: true });
  execFileSync('npm', ['ci', '--prefer-offline', '--no-audit', '--no-fund', '--loglevel=error'], { cwd: project, stdio: 'pipe' });
});
test.afterAll(() => { if (process.env.NATIVE_VITE_EVIDENCE) console.log(`Native test evidence: ${root}`); else fs.rmSync(root, { recursive: true, force: true }); });

test('native manifest refuses missing/duplicate entries, escaped paths, missing originals and symlinks', () => {
  const spec = adapters(), save = value => write('.variant-work/native-preview.json', JSON.stringify(value));
  expect(nativeManifest(project).entries.B).toBe(spec.entries.B);
  save({ ...spec, entries: { ...spec.entries, C: spec.entries.B } }); expect(() => nativeManifest(project)).toThrow(/distinct/);
  save({ ...spec, entries: { A: spec.entries.A, B: spec.entries.B } }); expect(() => nativeManifest(project)).toThrow(/exactly/);
  save({ ...spec, dependencies: ['../outside.json'] }); expect(() => nativeManifest(project)).toThrow(/normalized relative/);
  save({ ...spec, dependencies: ['src/global.css'] }); expect(() => nativeManifest(project)).toThrow(/provider/);
  save(spec); fs.symlinkSync(path.join(project, 'index.html'), path.join(project, '.variant-work/native/linked.html'));
  save({ ...spec, entries: { ...spec.entries, C: '.variant-work/native/linked.html' } }); expect(() => nativeManifest(project)).toThrow(/Symlink/);
  fs.unlinkSync(path.join(project, '.variant-work/native/linked.html')); save(spec);
});

test('real native capture verifies tasks/configs/assets and nonce changes follow original dependencies', async ({ browser }) => {
  test.setTimeout(120000); adapters();
  const baseline = await captureNativeVite(project, { browser, original: true, out: path.join(evidence, 'baseline') });
  const generate = await captureNativeVite(project, { browser, out: path.join(evidence, 'generate') });
  const probe = await probeNativeDependencies(project, { browser, out: path.join(evidence, 'probe') });
  // Preview gates are exercised here. No fabricated delivery is supplied to make the overall matrix green.
  const result = gradeNativeVite({ baseline, generate, probe });
  expect(result.checks.filter(c => !c.pass).map(c => c.id)).toEqual(['deliver-observed', 'delivery-replayed']);
  expect(result.pass).toBe(false);
  expect(JSON.parse(fs.readFileSync(path.join(evidence, 'generate/server.json'), 'utf8')).exit).toBe(0);
  await expect(fetch(generate.samples[0].url)).rejects.toThrow();
  await expect(captureNativeVite(project, { browser, out: path.join(evidence, 'generate') })).rejects.toThrow(/Preserve existing/);
  await expect(captureNativeVite(project, { browser, out: path.join(project, '.variant-work/evidence') })).rejects.toThrow(/outside/);
  for (const capture of [baseline, generate, probe]) for (const sample of capture.samples) expect(sample.errors).toEqual([]);
});

test('real browser rejects a missing provider and a comparison linking to the wrong entry', async ({ browser }) => {
  test.setTimeout(120000); adapters();
  const entry = path.join(project, '.variant-work/native/B.tsx');
  fs.writeFileSync(entry, fs.readFileSync(entry, 'utf8').replace('<WorkspaceProvider>', '').replace('</WorkspaceProvider>', ''));
  const original = fs.readFileSync(path.join(project, 'src/App.tsx'), 'utf8');
  write('.variant-work/native/BrokenLogo.tsx', original.replace('src={logo}', 'src="/missing-workshop-logo.svg"'));
  const c = path.join(project, '.variant-work/native/C.tsx'); fs.writeFileSync(c, fs.readFileSync(c, 'utf8').replace("'@/App'", "'./BrokenLogo'"));
  write('.variant-work/native/compare.html', '<!doctype html><a href="./A.html">A</a><a href="./A.html">B</a><a href="./C.html">C</a><script>console.error("comparison runtime failure")</script>');
  const report = await captureNativeVite(project, { browser, out: path.join(evidence, 'missing-provider') });
  expect(report.samples.filter(s => s.id === 'B').every(s => !s.task && s.errors.some(error => error.includes('original WorkspaceProvider')))).toBe(true);
  const result = gradeNativeVite({ generate: report });
  expect(result.checks.find(c => c.id === 'generate-tasks').pass).toBe(false);
  expect(result.checks.find(c => c.id === 'generate-comparison').pass).toBe(false);
  expect(report.compare.every(s => s.errors.some(error => error.includes('comparison runtime failure')))).toBe(true);
  // Vite's SPA fallback can return HTTP 200 for the nonexistent image. Its real decode/URL still fails.
  expect(report.samples.filter(s => s.id === 'C').every(s => s.brand?.logo?.loaded === false && s.brand.logo.url.includes('missing-workshop-logo.svg'))).toBe(true);
  expect(result.checks.find(c => c.id === 'generate-brand-assets').pass).toBe(false);
});

test('nonce probe rejects a copied provider even when it imports original data, preserving the actual project', async ({ browser }) => {
  test.setTimeout(120000); adapters();
  write('.variant-work/native/workspace.tsx', fs.readFileSync(path.join(project, 'src/workspace.tsx'), 'utf8'));
  for (const id of ['A', 'B', 'C']) {
    const file = path.join(project, '.variant-work/native', `${id}.tsx`);
    const source = fs.readFileSync(path.join(project, 'src/App.tsx'), 'utf8').replace("'@/workspace'", "'./workspace'");
    write(`.variant-work/native/App${id}.tsx`, source);
    fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace("'@/workspace'", "'./workspace'").replace("'@/App'", `'./App${id}'`));
  }
  const before = fs.readFileSync(path.join(project, 'src/workspaces.json'), 'utf8');
  const report = await probeNativeDependencies(project, { browser, out: path.join(evidence, 'copied-provider') });
  expect(report.sourceProjectUnchanged).toBe(true); expect(fs.readFileSync(path.join(project, 'src/workspaces.json'), 'utf8')).toBe(before);
  expect(gradeNativeVite({ probe: report }).checks.find(c => c.id === 'probe-tasks').pass).toBe(false);
  expect(report.samples.every(s => !s.task)).toBe(true);
});

test('actual checks reject native configs which omit generated typechecking and preview build entries', async ({ browser }) => {
  test.setTimeout(120000); const spec = adapters();
  write(spec.typecheckConfig, JSON.stringify({ extends: '../../tsconfig.json', include: ['../../src'] }));
  write(spec.buildConfig, "export {default} from '../../vite.config';");
  const report = await captureNativeVite(project, { browser, out: path.join(evidence, 'incomplete-configs') });
  expect(report.checks.previewTypecheck.exit).toBe(0); expect(report.checks.previewBuild.exit).toBe(0);
  expect(report.samples.every(s => s.task && !s.errors.length)).toBe(true);
  expect(report.checks.previewTypecheck.coverage.missing).toEqual(['.variant-work/native/A.tsx', '.variant-work/native/B.tsx', '.variant-work/native/C.tsx']);
  expect(report.checks.previewBuild.outputs).toBe(false);
  expect(gradeNativeVite({ generate: report }).checks.find(c => c.id === 'generate-build-coverage').pass).toBe(false);
});
