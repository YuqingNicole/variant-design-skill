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
const [projectArg, outputArg] = args.filter(arg => arg !== '--static');
const project = path.resolve(projectArg ?? '.');
const output = path.resolve(outputArg ?? path.join(project, 'variant-output'));
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
        .replace('</head>', `<style>${css}</style></head>`).replace('</body>', `<script>${js}</script></body>`);
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
  try { vite = await import(pathToFileURL(require.resolve('vite')).href); }
  catch { throw new Error('Vite is not installed in this project. Use a native framework adapter or the isolated harness described in references/preview-and-history.md.'); }
  if (staticMode) await buildStatic(vite, require, result);
  else {
    const server = await vite.createServer({ ...viteOptions(require), appType: 'mpa',
      server: { host: '127.0.0.1', port: 3333, fs: { allow: [project, output] } } });
    await server.listen();
    const base = server.resolvedUrls.local[0];
    console.log(`Comparison: ${base}_compare.html`);
    for (const [id, url] of Object.entries(result.urls)) console.log(`${id}: ${base}${url}`);
    const stop = async () => { await server.close(); process.exit(0); };
    process.on('SIGINT', stop); process.on('SIGTERM', stop);
  }
} catch (error) { console.error(error.message); process.exit(1); }
