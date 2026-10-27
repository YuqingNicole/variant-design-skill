#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { buildPreview } from './build-preview.mjs';

const args = process.argv.slice(2);
const staticMode = args.includes('--static');
const viteRootIndex=args.indexOf('--vite-root');
if(viteRootIndex!==-1 && (!args[viteRootIndex+1] || args[viteRootIndex+1].startsWith('--'))) {console.error('--vite-root requires the isolated package directory.');process.exit(1);}
const viteRoot=viteRootIndex===-1?null:path.resolve(args[viteRootIndex+1]);
const [projectArg, outputArg] = args.filter((arg,i) => arg !== '--static' && (viteRootIndex===-1 || (i!==viteRootIndex && i!==viteRootIndex+1)));
// Vite canonicalizes inputs; match its root on platforms where /tmp or /var are aliases.
const project = fs.realpathSync(path.resolve(projectArg ?? '.'));
const output = fs.realpathSync(path.resolve(outputArg ?? path.join(project, 'variant-output')));
const buildTimeoutMs = Number(process.env.VARIANT_STATIC_TIMEOUT_MS) || 180_000;

// Some bundler releases hang in a busy loop instead of failing, which no in-process timer can
// interrupt. Run the static build in a child process so a hang becomes a clear error.
if (staticMode && !process.env.VARIANT_STATIC_CHILD) {
  const child = spawnSync(process.execPath, [fileURLToPath(import.meta.url), ...process.argv.slice(2)],
    { stdio: 'inherit', timeout: buildTimeoutMs, env: { ...process.env, VARIANT_STATIC_CHILD: '1' } });
  if (child.error?.code === 'ETIMEDOUT') console.error(`Static build did not finish in ${buildTimeoutMs / 1000}s. Check the project's Vite/Rollup install, or start the preview server instead.`);
  process.exit(child.status ?? 1);
}

function viteOptions(require) {
  return {
    configFile: false, root: output, publicDir: path.join(project, 'public'),
    esbuild: { jsx: 'automatic' },
    resolve: { dedupe: ['react', 'react-dom'], alias: [
      { find: /^react-dom(?=\/|$)/, replacement: path.dirname(require.resolve('react-dom/package.json')) },
      { find: /^react(?=\/|$)/, replacement: path.dirname(require.resolve('react/package.json')) },
    ] },
  };
}

// Sandboxed agents often cannot bind a port, and file:// pages cannot load ES modules.
// Build each entry as a classic script and inline it so the pages open by double-click.
async function buildStatic(vite, require, result) {
  const target = path.join(output, '_static');
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'variant-static-'));
  try {
    fs.rmSync(target, { recursive: true, force: true });
    fs.mkdirSync(path.join(target, '_preview'), { recursive: true });
    for (const id of Object.keys(result.urls)) {
      const outDir = path.join(work, id);
      await vite.build({ ...viteOptions(require), base: './', logLevel: 'error', build: {
        outDir, emptyOutDir: true, modulePreload: false, cssCodeSplit: false, assetsInlineLimit: 100_000_000,
        rollupOptions: { input: path.join(output, result.urls[id]), output: { format: 'iife', inlineDynamicImports: true } },
      } });
      const assets = path.join(outDir, 'assets');
      const read = ext => fs.readdirSync(assets).filter(name => name.endsWith(ext)).map(name => fs.readFileSync(path.join(assets, name), 'utf8')).join('\n');
      const js = read('.js').replaceAll('</script', '<\\/script'), css = read('.css').replaceAll('</style', '<\\/style');
      const html = fs.readFileSync(path.join(outDir, result.urls[id]), 'utf8')
        .replace(/\s*<script type="module"[^>]*><\/script>/g, '').replace(/\s*<link rel="stylesheet"[^>]*>/g, '')
        // Replacer functions: a string replacement would expand $&, $` and $$ inside the bundle.
        .replace('</head>', () => `<style>${css}</style></head>`).replace('</body>', () => `<script>${js}</script></body>`);
      fs.writeFileSync(path.join(target, result.urls[id]), html);
    }
    fs.copyFileSync(path.join(output, result.comparison), path.join(target, result.comparison));
  } finally { fs.rmSync(work, { recursive: true, force: true }); }
  console.log(`Comparison: ${pathToFileURL(path.join(target, result.comparison)).href}`);
  for (const [id, url] of Object.entries(result.urls)) console.log(`${id}: ${pathToFileURL(path.join(target, url)).href}`);
  console.log('Static snapshot: rebuild with --static after every edit, undo or selection.');
}

try {
  const result = buildPreview(output);
  if (!result.react) throw new Error('React preview requires three React entries. Use preview-server.mjs for HTML.');
  const require = createRequire(path.join(project, 'package.json'));
  for (const name of ['react', 'react-dom/client']) require.resolve(name);
  let vite;
  try {
    const bundlerRequire=viteRoot?createRequire(path.join(viteRoot,'package.json')):require;
    vite = await import(pathToFileURL(bundlerRequire.resolve('vite')).href);
  } catch { throw new Error('Vite is unavailable. Install a separate preview package in .variant-work/preview-harness with vite@7.3.6 and rollup@4.65.0, then repeat this command with --vite-root .variant-work/preview-harness. Keep the original project root so its React is reused. See references/workflow/preview.md for framework limits; do not write a custom bundler.'); }
  if (staticMode) await buildStatic(vite, require, result);
  else {
    const server = await vite.createServer({ ...viteOptions(require), appType: 'mpa',
      // Vite's watcher drops a second change to the same file within 50ms, which leaves the preview on
      // stale content after a quick apply-then-undo. Waiting for the write to settle coalesces instead.
      server: { host: '127.0.0.1', port: 3333, fs: { allow: [project, output] },
        watch: { awaitWriteFinish: { stabilityThreshold: 50, pollInterval: 10 } } } });
    await server.listen();
    const base = server.resolvedUrls.local[0];
    console.log(`Comparison: ${base}_compare.html`);
    for (const [id, url] of Object.entries(result.urls)) console.log(`${id}: ${base}${url}`);
    const stop = async () => { await server.close(); process.exit(0); };
    process.on('SIGINT', stop); process.on('SIGTERM', stop);
  }
} catch (error) { console.error(error.message); process.exit(1); }
