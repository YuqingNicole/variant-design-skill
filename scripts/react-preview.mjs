#!/usr/bin/env node
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { buildPreview } from './build-preview.mjs';

const project = path.resolve(process.argv[2] ?? '.');
const output = path.resolve(process.argv[3] ?? path.join(project, 'variant-output'));
try {
  const result = buildPreview(output);
  if (!result.react) throw new Error('React preview requires three React entries. Use preview-server.mjs for HTML.');
  const require = createRequire(path.join(project, 'package.json'));
  for (const name of ['react', 'react-dom/client']) require.resolve(name);
  let vite;
  try { vite = await import(pathToFileURL(require.resolve('vite')).href); }
  catch { throw new Error('Vite is not installed in this project. Use a native framework adapter or the isolated harness described in references/preview-and-history.md.'); }
  const server = await vite.createServer({
    configFile: false, root: output, publicDir: path.join(project, 'public'),
    appType: 'mpa', esbuild: { jsx: 'automatic' },
    resolve: { dedupe: ['react', 'react-dom'], alias: [
      { find: /^react-dom(?=\/|$)/, replacement: path.dirname(require.resolve('react-dom/package.json')) },
      { find: /^react(?=\/|$)/, replacement: path.dirname(require.resolve('react/package.json')) },
    ] },
    server: { host: '127.0.0.1', port: 3333, fs: { allow: [project, output] } },
  });
  await server.listen();
  const base = server.resolvedUrls.local[0];
  console.log(`Comparison: ${base}_compare.html`);
  for (const [id, url] of Object.entries(result.urls)) console.log(`${id}: ${base}${url}`);
  const stop = async () => { await server.close(); process.exit(0); };
  process.on('SIGINT', stop); process.on('SIGTERM', stop);
} catch (error) { console.error(error.message); process.exitCode = 1; }
