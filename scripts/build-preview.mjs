#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { localFile, readContext } from './variant-history.mjs';

const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
export function buildPreview(root) {
  const state = readContext(root);
  const react = ['A', 'B', 'C'].every(id => /\.[jt]sx$/.test(state.variants?.[id]?.entry ?? ''));
  const urls = {};
  for (const id of ['A', 'B', 'C']) {
    const variant = state.variants?.[id];
    if (!variant?.entry || !variant.files.includes(variant.entry)) throw new Error(`Missing registered entry for ${id}`);
    for (const field of ['optimizes', 'tradeoff', 'bestFor']) {
      if (!variant.comparison?.[field]) throw new Error(`Missing ${id} comparison.${field}`);
    }
    if (!fs.existsSync(localFile(root, variant.entry))) throw new Error(`Missing file: ${variant.entry}`);
    if (!react && !/\.html$/.test(variant.entry)) throw new Error('Use a native framework adapter for mixed/non-React output.');
    urls[id] = react ? `_preview/${id}.html` : variant.entry.split('/').map(encodeURIComponent).join('/');
  }
  // Validate the full manifest before writing anything.
  if (react) {
    const dir = localFile(root, '_preview');
    fs.mkdirSync(dir, { recursive: true });
    for (const id of ['A', 'B', 'C']) {
      const entry = path.relative(dir, localFile(root, state.variants[id].entry)).split(path.sep).join('/').replace(/\.[jt]sx$/, '');
      const js = `import React from 'react';\nimport {createRoot} from 'react-dom/client';\nimport Variant from ${JSON.stringify(entry)};\ncreateRoot(document.getElementById('root')!).render(<Variant />);\n`;
      fs.writeFileSync(localFile(root, `_preview/${id}.tsx`), js);
      fs.writeFileSync(localFile(root, `_preview/${id}.html`), `<!doctype html><html lang="en"><head><link rel="icon" href="data:,"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Variant ${id}</title></head><body><div id="root"></div><script type="module" src="./${id}.tsx"></script></body></html>`);
    }
  }
  const rec = state.recommendation;
  const html = `<!doctype html><html lang="en"><head><link rel="icon" href="data:,"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Compare variants</title><style>
body{margin:0;padding:24px;font:16px/1.5 system-ui;background:#f4f5f7;color:#162031}main{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}article{min-width:0;background:white;padding:16px}iframe{width:100%;height:65dvh;border:1px solid #687387}a{color:#174ea6}a:focus-visible{outline:3px solid #174ea6;outline-offset:3px}@media(max-width:900px){main{grid-template-columns:1fr}}
</style></head><body><header><h1>Compare A / B / C</h1><p>Selected: ${escape(state.selectedVariant ?? 'none')} · Editing: ${escape(state.activeVariant ?? 'none')}</p>${rec ? `<p>Recommendation: ${escape(rec.variant)} — ${escape(rec.reason)}</p>` : ''}<p>Use <code>pick B</code> to select, <code>B vary subtle — hero</code> to edit, <code>undo B</code> to undo, or <code>react B</code> to export in the agent chat.</p></header><main>${['A','B','C'].map(id => {
    const v = state.variants[id], c = v.comparison;
    return `<article><h2>${id} · revision ${escape(v.version)}</h2><p>Optimizes: ${escape(c.optimizes)}</p><p>Trade-off: ${escape(c.tradeoff)}</p><p>Best for: ${escape(c.bestFor)}</p><p><a href="${escape(urls[id])}" target="_blank" rel="noopener">Open ${id}</a></p><iframe title="Variant ${id} preview" src="${escape(urls[id])}" loading="lazy"></iframe></article>`;
  }).join('')}</main></body></html>`;
  fs.writeFileSync(localFile(root, '_compare.html'), html);
  return { react, urls, comparison: '_compare.html' };
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { console.log(JSON.stringify(buildPreview(path.resolve(process.argv[2] ?? 'variant-output')), null, 2)); }
  catch(error) { console.error(error.message); process.exitCode = 1; }
}
