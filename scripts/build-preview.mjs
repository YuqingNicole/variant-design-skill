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
    details: '方案说明', reason: '推荐理由', revision: '版本', optimizes: '优化什么', tradeoff: '牺牲什么', bestFor: '适合场景', open: '完整打开',
    desktop: '桌面布局', mobile: '手机布局', views: '预览尺寸', tip: '预览按统一尺寸缩放，完整打开后可操作全部功能。',
    next: '在 agent 对话中继续：选定用 pick B，局部修改用 B vary subtle — hero，撤回用 undo B，导出用 react B。'
  } : {
    title: 'Compare A / B / C', selected: 'Selected', active: 'Editing', none: 'none', recommendation: 'Recommendation',
    details: 'Direction details', reason: 'Why this direction', revision: 'revision', optimizes: 'Optimizes', tradeoff: 'Trade-off', bestFor: 'Best for', open: 'Open',
    desktop: 'Desktop layout', mobile: 'Mobile layout', views: 'Preview viewport', tip: 'Previews share one viewport size. Open a full page to use every feature.',
    next: 'Continue in your agent chat: pick B to select, B vary subtle — hero to edit, undo B to undo, or react B to export.'
  };
  const rec = state.recommendation;
  const dark = state.preview?.colorScheme === 'dark';
  const html = `<!doctype html><html lang="${zh ? 'zh-CN' : 'en'}"><head><link rel="icon" href="data:,"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${label.title}</title><style>
:root{color-scheme:${dark ? 'dark' : 'light'};--bg:${dark ? '#151817' : '#f5f5f2'};--panel:${dark ? '#1d2220' : '#ffffff'};--ink:${dark ? '#edf1ed' : '#202b28'};--muted:${dark ? '#a4b1aa' : '#63706a'};--line:${dark ? '#38433d' : '#dde2dc'};--soft:${dark ? '#262e29' : '#eef1ec'};--accent:${dark ? '#b0d8bd' : '#345c46'};--accent-bg:${dark ? '#293b30' : '#eaf2eb'}}
*{box-sizing:border-box}body{margin:0;padding:clamp(16px,2.2vw,36px);font:14px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:var(--bg);color:var(--ink);-webkit-font-smoothing:antialiased}.shell{max-width:1920px;margin:auto}header{margin-bottom:20px}.eyebrow{font-size:10px;letter-spacing:.18em;font-weight:650;color:var(--muted);margin:0 0 8px}h1{margin:0;font-size:clamp(24px,2.3vw,32px);font-weight:600;line-height:1.25;letter-spacing:-.035em}h2{display:flex;align-items:center;gap:10px;font-size:16px;margin:0;white-space:nowrap}p{margin:8px 0}.heading-row,.toolbar,.card-heading{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}.summary{display:flex;gap:8px;flex-wrap:wrap;color:var(--muted);font-size:11px}.status{padding:5px 10px;border:1px solid var(--line);border-radius:6px}.status strong{font-weight:500;color:var(--ink);margin-left:6px}.toolbar{margin-top:14px;padding-top:16px;border-top:1px solid var(--line)}.tip{font-size:12px;color:var(--muted);margin:0}.viewport-controls{display:flex;gap:3px;padding:3px;background:var(--soft);border:1px solid var(--line);border-radius:9px}button{font:inherit;font-size:12px;border:1px solid transparent;padding:7px 14px;background:transparent;color:var(--muted);border-radius:6px;cursor:pointer}button[aria-pressed=true]{background:var(--panel);color:var(--ink);border-color:var(--line);box-shadow:0 1px 3px #00000008}button:hover{color:var(--ink)}main{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));align-items:start;gap:20px}article{min-width:0;background:var(--panel);border:1px solid var(--line);border-radius:12px;overflow:hidden;box-shadow:0 3px 5px -4px #14291a18,0 12px 32px -24px #14291a30}.card-heading{padding:14px 16px;gap:8px}.direction-id{display:grid;place-items:center;width:30px;height:30px;border:1px solid var(--line);background:var(--soft);border-radius:7px;font-size:14px}.revision{font-weight:400;color:var(--muted);font-size:11px}.badge{font-size:10px;background:var(--accent-bg);color:var(--accent);border-radius:4px;padding:3px 7px;font-weight:500}.card-heading a{font-size:11px;text-decoration:none;padding:6px 8px;border:1px solid var(--line);border-radius:6px;white-space:nowrap}.card-heading a:hover{background:var(--soft)}a{color:var(--ink);text-underline-offset:4px}:focus-visible{outline:2px solid var(--accent);outline-offset:3px}.stage{position:relative;overflow:hidden;background:var(--soft);border-top:1px solid var(--line)}iframe{display:block;position:absolute;left:0;top:0;border:0;transform-origin:top left;width:1200px;height:960px}.direction-details{border-top:1px solid var(--line);font-size:12px}.direction-details>summary{padding:14px 16px;display:flex;align-items:center;justify-content:space-between;color:var(--muted)}summary{cursor:pointer;list-style:none}summary::-webkit-details-marker{display:none}summary::after{content:'+';font-size:16px;font-weight:400;line-height:1;display:inline-block;margin-left:12px;color:var(--muted)}details[open]>summary::after{content:'−'}summary:hover{color:var(--ink)}dl{font-size:13px;margin:0;padding:0 16px 16px}dl>div{padding:12px 0;border-top:1px solid var(--line)}dl>div:last-child{padding-bottom:0}dt{font-size:11px;color:var(--muted);margin-bottom:4px}dd{margin:0;overflow-wrap:anywhere;line-height:1.8}.guidance{margin-top:24px;border-top:1px solid var(--line);padding-top:16px;display:grid;grid-template-columns:1fr 1fr;gap:16px 40px;color:var(--muted);font-size:12px}.guidance summary{display:flex;justify-content:space-between;align-items:center}.guidance p{max-width:80ch;line-height:1.9;margin:12px 0}.recommendation summary{color:var(--accent)}@media(max-width:1100px){main{gap:12px}.card-heading{padding:12px;gap:6px}h2{gap:6px}}@media(max-width:900px){main{grid-template-columns:1fr;gap:20px}.heading-row{gap:8px}.toolbar{align-items:flex-start;margin-top:16px;gap:12px}.tip{max-width:42ch}.guidance{grid-template-columns:1fr}.card-heading{padding:14px 16px}header{margin-bottom:20px}}

</style></head><body><div class="shell"><header><p class="eyebrow">VARIANT DESIGN / ${zh ? "方案比较" : "DIRECTION REVIEW"}</p><div class="heading-row"><h1>${label.title}</h1><p class="summary"><span class="status">${label.selected}<strong>${escape(state.selectedVariant ?? label.none)}</strong></span><span class="status">${label.active}<strong>${escape(state.activeVariant ?? label.none)}</strong></span></p></div><div class="toolbar"><div class="viewport-controls" role="group" aria-label="${label.views}"><button data-width="1200" aria-pressed="true">${label.desktop}</button><button data-width="390" aria-pressed="false">${label.mobile}</button></div><p class="tip">${label.tip}</p></div></header><main>${['A','B','C'].map(id => {
    const v = state.variants[id], c = v.comparison;
    return `<article aria-label="${id}"><div class="card-heading"><h2><span class="direction-id">${id}</span><span class="revision">${label.revision} ${escape(v.version)}</span>${rec?.variant === id ? `<span class="badge">${label.recommendation}</span>` : ''}</h2><a href="${escape(urls[id])}" target="_blank" rel="noopener">${label.open} ${id} ↗</a></div><div class="stage"><iframe title="Variant ${id} preview" src="${escape(urls[id])}"></iframe></div><details class="direction-details"><summary>${label.details}</summary><dl><div><dt>${label.optimizes}</dt><dd>${escape(c.optimizes)}</dd></div><div><dt>${label.tradeoff}</dt><dd>${escape(c.tradeoff)}</dd></div><div><dt>${label.bestFor}</dt><dd>${escape(c.bestFor)}</dd></div></dl></details></article>`;
  }).join('')}</main><footer><div class="guidance">${rec ? `<details class="recommendation"><summary>${label.recommendation}: ${escape(rec.variant)} · ${label.reason}</summary><p>${escape(rec.reason)}</p></details>` : ''}<details><summary>${zh ? '如何继续修改或导出' : 'Continue editing or export'}</summary><p>${label.next}</p></details></div></footer></div><script>
let viewport = 1200;
function resizePreviews() {
  document.querySelectorAll('.stage').forEach(stage => {
    const frame = stage.querySelector('iframe');
    const scale = Math.min(1, stage.clientWidth / viewport);
    const height = viewport === 390 ? 844 : 960;
    frame.style.width = viewport + 'px'; frame.style.height = height + 'px';
    frame.style.left = Math.max(0, (stage.clientWidth - viewport * scale) / 2) + 'px';
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
if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
  try { console.log(JSON.stringify(buildPreview(path.resolve(process.argv[2] ?? 'variant-output')), null, 2)); }
  catch(error) { console.error(error.message); process.exitCode = 1; }
}
