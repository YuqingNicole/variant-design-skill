import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

// Always create a new project: never overwrite a previous demonstration.
const project = fs.mkdtempSync(path.join(fileURLToPath(new URL('.', import.meta.url)), '.demo-'));
const output = path.join(project, 'variant-output');
fs.mkdirSync(output);
const themes = { A: ['#f5f1e8', '#20392b', '#a84b2e'], B: ['#131e2b', '#eef3fa', '#83c5ff'], C: ['#f9e958', '#222222', '#a72b22'] };
const state = { schemaVersion: 2, language: 'zh', activeVariant: 'A', selectedVariant: 'A', variants: {}, recommendation: { variant: 'B', reason: '清晰展示从需求到可交付代码的过程。' } };
for (const id of ['A', 'B', 'C']) {
  const [bg, ink, accent] = themes[id];
  const name = { A: '内容优先', B: '工作流优先', C: '行动优先' }[id];
  const html = `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Variant ${id} · ${name}</title><style>:root{--bg:${bg};--ink:${ink};--accent:${accent}}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:18px/1.7 system-ui}main{max-width:1100px;margin:auto;padding:36px}nav,footer{display:flex;justify-content:space-between;gap:24px}nav{border-bottom:1px solid;padding-bottom:20px;font-size:14px}section{padding:80px 0}h1{font-size:clamp(38px,6vw,72px);line-height:1.15;max-width:850px;letter-spacing:-2px}p{max-width:660px;opacity:.8}a{color:inherit}button{background:var(--accent);color:${id === 'B' ? '#131e2b' : '#ffffff'};border:0;padding:16px 24px;font:inherit;cursor:pointer;border-radius:4px}:focus-visible{outline:3px solid var(--ink);outline-offset:5px}ol{padding:24px 24px 24px 44px;border:1px solid;max-width:660px}footer{font-size:13px;padding-top:24px;border-top:1px solid}@media(max-width:600px){main{padding:24px}section{padding:36px 0}nav,footer{flex-direction:column;gap:8px}}</style><main><nav><strong>VARIANT / DESIGN STUDIO</strong><span>${id} · ${name}</span></nav><!-- zone:hero:start --><section><span>从一个想法开始</span><h1>把想法变成三个设计方向。</h1><p>比较不同取舍，找到适合你的产品的表达方式，再继续打磨细节。</p><button type="button" onclick="document.getElementById('status').textContent='已开始体验：比较 A / B / C，然后选择一个方向。'">开始体验</button><p id="status" role="status" aria-live="polite"></p></section><!-- zone:hero:end --><ol><li>描述你的产品与目标</li><li>比较三个不同设计方向</li><li>选择、打磨并导出代码</li></ol><footer><span>本地 MCP 演示 · 示例内容</span><span>HTML / CSS · 可编辑源文件</span></footer></main></html>`;
  fs.writeFileSync(path.join(output, `${id}.html`), html);
  state.variants[id] = { entry: `${id}.html`, files: [`${id}.html`], tokens: { background: bg, foreground: ink, accent }, version: 1, history: [], undo: [], comparison: { optimizes: name, tradeoff: { A: '行动入口较克制', B: '品牌故事较少', C: '长篇阅读空间较少' }[id], bestFor: { A: '介绍产品价值', B: '展示产品使用过程', C: '活动与发布页面' }[id] } };
}
fs.writeFileSync(path.join(output, '.variant-context.json'), JSON.stringify(state, null, 2));
const client = new Client({ name: 'variant-demo', version: '1.0.0' });
const transcript = [];
async function call(name, args = {}, expectedError = false) {
  const result = await client.callTool({ name, arguments: args });
  transcript.push({ tool: name, arguments: { ...args, ...(args.content ? { content: '[full HTML omitted from log]' } : {}) }, isError: !!result.isError, result: result.content });
  assert.equal(!!result.isError, expectedError, `${name}: ${JSON.stringify(result)}`);
  return expectedError ? result.content[0].text : JSON.parse(result.content[0].text);
}
try {
  await client.connect(new StdioClientTransport({ command: process.execPath, args: [fileURLToPath(new URL('server.mjs', import.meta.url)), output, project], stderr: 'inherit' }));
  const tools = await client.listTools();
  assert.equal(tools.tools.length, 13);
  await call('get_guide');
  await call('get_basic_info');
  await call('list_files');
  await call('get_tokens', { variant: 'B' });
  const original = (await call('read_file', { variant: 'B', file: 'B.html' })).content;
  fs.writeFileSync(path.join(output, 'B-before.html'), original);
  const updated = original.replace('把想法变成三个设计方向。', '让设计与代码，在同一个流程里迭代。').replace('比较不同取舍，找到适合你的产品的表达方式，再继续打磨细节。', 'Agent 先准备候选修改，你保留选择权。每次应用都有版本记录，也可以撤回。').replace('开始体验</button>', '体验设计到代码</button>');
  const candidate = await call('prepare_variant', { variant: 'B' });
  await call('write_candidate_file', { candidateId: candidate.candidateId, file: 'B.html', content: updated });
  assert.equal(fs.readFileSync(path.join(output, 'B.html'), 'utf8'), original);
  await call('apply_variant', { candidateId: candidate.candidateId, summary: '把 B 的首屏改为设计与代码迭代主题', zone: 'hero' });
  assert.equal((await call('get_selection')).selectedVariant, 'A');
  const conflict = await call('apply_variant', { candidateId: candidate.candidateId, summary: '尝试重复应用旧候选' }, true);
  await call('undo_variant', { variant: 'B' });
  assert.equal(fs.readFileSync(path.join(output, 'B.html'), 'utf8'), original);
  const next = await call('prepare_variant', { variant: 'B' });
  await call('write_candidate_file', { candidateId: next.candidateId, file: 'B.html', content: updated });
  await call('apply_variant', { candidateId: next.candidateId, summary: '重新应用 B，保留可查看的最终演示', zone: 'hero' });
  await call('select_variant', { variant: 'B' });
  const history = await call('get_history', { variant: 'B' });
  assert.equal(history.version, 4);
  for (const id of ['A', 'C']) assert.equal((await call('read_file', { variant: id, file: `${id}.html` })).content.includes('让设计与代码，在同一个流程里迭代。'), false);
  await call('build_preview');
  const report = { tools: tools.tools.map(t => t.name), calls: transcript.length, all13ToolsCalled: new Set(transcript.map(t => t.tool)).size === 13, checks: { candidateDoesNotChangeLiveFiles: true, editingDoesNotSelectWinner: true, staleCandidateRejected: true, undoRestoresExactBytes: true, finalVersion: history.version, selectedVariant: 'B' }, conflict, transcript };
  fs.writeFileSync(path.join(output, 'mcp-report.json'), JSON.stringify(report, null, 2));
  fs.writeFileSync(path.join(output, 'index.html'), `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MCP 初步实现 · 实测结果</title><style>body{margin:0;padding:32px;background:#f4f5f7;color:#162031;font:16px/1.7 system-ui}h1{font-size:32px}a{color:#174e9c}main{display:grid;grid-template-columns:1fr 1fr;gap:24px}iframe{width:100%;height:780px;border:1px solid #aab3c0;background:white}li{margin:8px 0}@media(max-width:800px){main{grid-template-columns:1fr}}</style><h1>MCP 初步实现 · 实测结果</h1><p>真实 stdio 客户端调用了全部 13 个接口。以下是同一方案 B 的修改前后。</p><ul><li>候选写入不影响正式文件；修改 B 不会自动改变最终选择。</li><li>重复应用旧候选被拒绝；撤销后内容逐字节恢复。</li><li>重新应用后 B 为版本 4，最终显式选择 B。</li></ul><p><a href="_compare.html">查看 A / B / C 最终比较 →</a>　<a href="mcp-report.json">查看真实调用记录 →</a></p><main><section><h2>修改前 · B v1</h2><iframe title="修改前" src="B-before.html"></iframe></section><section><h2>修改后 · B v4</h2><iframe title="修改后" src="B.html"></iframe></section></main></html>`);
  console.log(JSON.stringify({ project, output, toolCount: tools.tools.length, callCount: transcript.length, checks: report.checks }, null, 2));
} finally { await client.close(); }
