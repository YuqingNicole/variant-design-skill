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
  const zh = state.language === 'zh';
  const label = zh ? {
    title: '比较三个方案', selected: '最终选择', active: '正在修改', none: '尚未选择', recommendation: '推荐',
    revision: '版本', optimizes: '优化什么', tradeoff: '牺牲什么', bestFor: '适合场景', open: '完整打开',
    desktop: '桌面布局', mobile: '手机布局', views: '预览尺寸', tip: '预览按统一尺寸缩放，完整打开后可操作全部功能。',
    next: '在 agent 对话中继续：选定用 pick B，局部修改用 B vary subtle — hero，撤回用 undo B，导出用 react B。'
  } : {
    title: 'Compare A / B / C', selected: 'Selected', active: 'Editing', none: 'none', recommendation: 'Recommendation',
    revision: 'revision', optimizes: 'Optimizes', tradeoff: 'Trade-off', bestFor: 'Best for', open: 'Open',
    desktop: 'Desktop layout', mobile: 'Mobile layout', views: 'Preview viewport', tip: 'Previews share one viewport size. Open a full page to use every feature.',
    next: 'Continue in your agent chat: pick B to select, B vary subtle — hero to edit, undo B to undo, or react B to export.'
  };
  const rec = state.recommendation;
  const dark = state.preview?.colorScheme === 'dark';
  const html = `<!doctype html><html lang="${zh ? 'zh-CN' : 'en'}"><head><link rel="icon" href="data:,"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${label.title}</title><style>
:root{color-scheme:${dark ? 'dark' : 'light'};--bg:${dark ? '#0a0b0c' : '#f4f5f7'};--panel:${dark ? '#111315' : '#ffffff'};--ink:${dark ? '#f2f0eb' : '#162031'};--muted:${dark ? '#aeb2b7' : '#49586b'};--line:${dark ? '#44494f' : '#8995a4'}}
*{box-sizing:border-box}body{margin:0;padding:clamp(16px,3vw,40px);font:16px/1.6 system-ui;background:var(--bg);color:var(--ink)}header{max-width:1000px;margin-bottom:24px}h1{margin:0 0 16px;font-size:clamp(1.6rem,4vw,2.5rem)}h2{font-size:1.25rem;margin:0}p{margin:12px 0}.summary{color:var(--muted)}main{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}article{display:flex;flex-direction:column;min-width:0;background:var(--panel);padding:16px;border:1px solid var(--line);border-radius:12px}dl{font-size:14px;flex:1}dl>div{margin:12px 0}dt{color:var(--muted)}dd{margin:0}a{color:var(--ink);text-underline-offset:4px}button{font:inherit;border:1px solid var(--line);padding:8px 16px;background:var(--panel);color:var(--ink);border-radius:6px;cursor:pointer}button[aria-pressed=true]{background:var(--ink);color:var(--bg)}:focus-visible{outline:3px solid var(--ink);outline-offset:3px}.viewport-controls{display:flex;flex-wrap:wrap;gap:8px}.stage{position:relative;overflow:hidden;background:var(--bg);border:1px solid var(--line)}iframe{display:block;position:absolute;left:0;top:0;border:0;transform-origin:top left;width:1200px;height:960px}.tip{font-size:14px;color:var(--muted)}@media(max-width:900px){main{grid-template-columns:1fr}}
</style></head><body><header><h1>${label.title}</h1><p class="summary">${label.selected}: ${escape(state.selectedVariant ?? label.none)} · ${label.active}: ${escape(state.activeVariant ?? label.none)}</p>${rec ? `<p>${label.recommendation}: ${escape(rec.variant)} — ${escape(rec.reason)}</p>` : ''}<div class="viewport-controls" role="group" aria-label="${label.views}"><button data-width="1200" aria-pressed="true">${label.desktop}</button><button data-width="390" aria-pressed="false">${label.mobile}</button></div><p class="tip">${label.tip}</p><details><summary>${zh ? '如何继续修改或导出' : 'Continue editing or export'}</summary><p>${label.next}</p></details></header><main>${['A','B','C'].map(id => {
    const v = state.variants[id], c = v.comparison;
    return `<article><h2>${id} · ${label.revision} ${escape(v.version)}</h2><dl><div><dt>${label.optimizes}</dt><dd>${escape(c.optimizes)}</dd></div><div><dt>${label.tradeoff}</dt><dd>${escape(c.tradeoff)}</dd></div><div><dt>${label.bestFor}</dt><dd>${escape(c.bestFor)}</dd></div></dl><p><a href="${escape(urls[id])}" target="_blank" rel="noopener">${label.open} ${id} ↗</a></p><div class="stage"><iframe title="Variant ${id} preview" src="${escape(urls[id])}"></iframe></div></article>`;
  }).join('')}</main><script>
let viewport = 1200;
function resizePreviews() {
  document.querySelectorAll('.stage').forEach(stage => {
    const frame = stage.querySelector('iframe');
    const scale = Math.min(1, stage.clientWidth / viewport);
    const height = viewport === 390 ? 844 : 960;
    frame.style.width = viewport + 'px'; frame.style.height = height + 'px';
    frame.style.transform = 'scale(' + scale + ')'; stage.style.height = (height * scale) + 'px';
  });
}
document.querySelectorAll('[data-width]').forEach(button => button.addEventListener('click', () => {
  viewport = Number(button.dataset.width);
  document.querySelectorAll('[data-width]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  resizePreviews();
}));
new ResizeObserver(resizePreviews).observe(document.body);
resizePreviews();
</script></body></html>`;
  fs.writeFileSync(localFile(root, '_compare.html'), html);
  return { react, urls, comparison: '_compare.html' };
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { console.log(JSON.stringify(buildPreview(path.resolve(process.argv[2] ?? 'variant-output')), null, 2)); }
  catch(error) { console.error(error.message); process.exitCode = 1; }
}
