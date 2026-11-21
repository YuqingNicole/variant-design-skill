// A local page for the maintainer to review reference facets collection by collection: open the work, fix the values,
// confirm. Confirming sets `status: "reviewed"` and today's `reviewedAt` in src/reference-facets.json; nothing else is
// written and nothing leaves this machine. Collections go public once six members are reviewed (src/collections.ts).
// node website/scripts/facet-review.mjs [--port 4800]   (or `npm run review:facets --prefix website`)
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { importTs } from './ts-module.mjs';
import { referenceRecords } from './reference-records.mjs';
import { facetsModule, facetsFile, readFacets } from './reference-facets.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const collectionsModule = await importTs(path.join(here, '../src/collections.ts'));
const sectionsModule = await importTs(path.join(here, '../src/inspiration-sections.ts'));
const keys = ['industry', 'medium', 'pageTypes', 'patterns', 'components', 'techniques', 'styles'];

// One line per reference, the same layout the file was created with, so a review shows up as a one-line diff.
export const serializeFacets = all => `{\n${Object.entries(all).map(([id, f]) => `  ${JSON.stringify(id)}: ${JSON.stringify(f)}`).join(',\n')}\n}\n`;
// Applies one edit. `reviewed` true confirms the record (today's date); false keeps or returns it to draft.
// Throws with the validator's messages when a value is outside the vocabulary.
export function reviewRecord(all, id, input, { reviewed, today }) {
  if (!Object.hasOwn(all, id)) throw new Error(`Unknown reference: ${id}`);
  const next = { status: reviewed ? 'reviewed' : 'draft', ...(reviewed ? { reviewedAt: today } : {}) };
  for (const k of keys) next[k] = input?.[k] === undefined ? all[id][k] : input[k];
  const problems = facetsModule.facetProblems(id, next);
  if (problems.length) throw new Error(problems.join('\n'));
  return { ...all, [id]: next };
}

const json = file => { try { return JSON.parse(fs.readFileSync(path.join(here, '../src', file), 'utf8')); } catch { return {}; } };
function state() {
  const facets = readFacets(), rows = referenceRecords().published, previews = json('link-previews.json'), media = json('x-media.json');
  const vocab = Object.fromEntries(keys.map(k => [k, Object.entries(facetsModule.facetVocabulary[k]).map(([value, label]) => ({ value, label }))]));
  const collections = collectionsModule.collections.map(c => { const s = collectionsModule.collectionState(c, facets, rows);
    return { slug: c.slug, short: c.short, title: c.title, members: s.members, reviewed: s.reviewed.length }; });
  const items = Object.fromEntries(rows.map(r => [r.id, { id: r.id, name: r.name, url: r.url, tag: r.tag, section: sectionsModule.sectionOf(r), focus: r.focus, application: r.application,
    post: r.post?.text ?? null, cover: media[r.id]?.poster ?? previews[r.id]?.image ?? null, facets: facets[r.id] }]));
  return { vocab, collections, items, minimum: collectionsModule.minimumReviewed, limit: facetsModule.facetLimit };
}
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(new Date());

export function server() {
  return http.createServer((req, res) => {
    const send = (code, body, type = 'application/json') => { res.writeHead(code, { 'content-type': `${type}; charset=utf-8`, 'cache-control': 'no-store' }); res.end(type === 'application/json' ? JSON.stringify(body) : body); };
    if (req.method === 'GET' && req.url === '/') return send(200, page, 'text/html');
    if (req.method === 'GET' && req.url === '/api/state') return send(200, state());
    if (req.url === '/favicon.ico') { res.writeHead(204); return res.end(); }
    if (req.method === 'POST' && req.url === '/api/review') {
      let body = '';
      req.on('data', chunk => { body += chunk; if (body.length > 20000) req.destroy(); });
      req.on('end', () => {
        try { const { id, facets, reviewed } = JSON.parse(body), next = reviewRecord(readFacets(), id, facets, { reviewed: reviewed === true, today: today() });
          fs.writeFileSync(facetsFile, serializeFacets(next)); send(200, { ok: true, facets: next[id] }); }
        catch (e) { console.error(`Review not saved: ${e.message}`); send(400, { ok: false, error: e.message }); }
      });
      return;
    }
    send(404, { ok: false });
  });
}

const page = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>核对参考属性</title><style>
:root{--ink:#1d1f23;--muted:#5b616b;--line:#dcdfe4;--paper:#f6f7f9;--card:#fff;--ok:#1f7a4d;font-family:-apple-system,"PingFang SC",sans-serif;color:var(--ink);background:var(--paper)}
body{margin:0;display:grid;grid-template-columns:260px 1fr;min-height:100vh}aside{border-right:1px solid var(--line);padding:16px;position:sticky;top:0;height:100vh;overflow:auto;box-sizing:border-box;background:var(--card)}
aside h1{font-size:16px;margin:0 0 4px}aside p{font-size:12px;color:var(--muted);margin:0 0 12px;line-height:1.5}aside button{display:flex;justify-content:space-between;width:100%;text-align:left;border:0;background:none;padding:10px 8px;border-radius:6px;font:inherit;font-size:14px;cursor:pointer;color:var(--ink)}
aside button[aria-current=true]{background:var(--paper);font-weight:600}aside button small{color:var(--muted);font-weight:400}aside button small.ready{color:var(--ok)}
main{padding:16px 24px 80px;max-width:1100px}.toolbar{display:flex;gap:12px;align-items:center;margin-bottom:12px;font-size:14px;color:var(--muted)}
.card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:16px;margin-bottom:16px;display:grid;grid-template-columns:220px 1fr;gap:16px}.card.done{border-color:var(--ok)}
.cover{width:220px;aspect-ratio:4/3;object-fit:cover;border-radius:6px;background:var(--paper)}.head{display:flex;gap:8px;align-items:baseline;flex-wrap:wrap}.head b{font-size:17px}.head a{font-size:14px}.meta{font-size:12px;color:var(--muted)}
.notes{font-size:14px;line-height:1.6;margin:8px 0}.notes div{margin:2px 0}.notes span{color:var(--muted)}.post{font-size:13px;color:var(--muted);border-left:3px solid var(--line);padding-left:8px;margin:6px 0;white-space:pre-wrap}
.facet{margin:8px 0}.facet>span{display:block;font-size:12px;color:var(--muted);margin-bottom:4px}.chips{display:flex;flex-wrap:wrap;gap:6px}
.chips button{border:1px solid var(--line);background:var(--card);border-radius:999px;padding:4px 10px;font:inherit;font-size:13px;cursor:pointer;color:var(--ink)}.chips button[aria-pressed=true]{background:var(--ink);color:#fff;border-color:var(--ink)}.chips button:disabled{opacity:.35;cursor:default}
.actions{display:flex;gap:8px;align-items:center;margin-top:12px;flex-wrap:wrap}.actions button{border:1px solid var(--ink);border-radius:6px;padding:8px 14px;font:inherit;font-size:14px;cursor:pointer;background:var(--card)}.actions .primary{background:var(--ink);color:#fff}
.status{font-size:13px;color:var(--muted)}.status.ok{color:var(--ok)}.status.err{color:#b42318}details summary{cursor:pointer;font-size:13px;color:var(--muted);margin-top:4px}
@media(max-width:800px){body{grid-template-columns:1fr}aside{position:static;height:auto}.card{grid-template-columns:1fr}.cover{width:100%}}
</style></head><body><aside><h1>核对参考属性</h1><p>打开原站，改对属性值，再点“确认已核对”。每个合集核对满 <b id="min"></b> 条，下次部署就会上线。</p><nav id="nav"></nav></aside><main><div class="toolbar"><label><input type="checkbox" id="hide"> 隐藏已核对</label><span id="count"></span></div><div id="list"></div></main>
<script>
const names={industry:'行业（单选，可空）',medium:'作品是什么（单选）',pageTypes:'页面类型',patterns:'页面模式',components:'组件',techniques:'交互技法',styles:'视觉风格'};
const multi=['pageTypes','patterns','components','techniques','styles'];let S,current=null;
const el=(tag,props={},...kids)=>{const e=Object.assign(document.createElement(tag),props);for(const k of kids)e.append(k);return e};
async function load(){S=await (await fetch('/api/state')).json();document.getElementById('min').textContent=S.minimum;if(!current)current=S.collections[0].slug;render()}
function render(){const nav=document.getElementById('nav');nav.replaceChildren();
 const all={slug:'*',short:{zh:'全部参考'},members:Object.keys(S.items),reviewed:Object.values(S.items).filter(i=>i.facets.status==='reviewed').length};
 for(const c of [...S.collections,all]){const ready=c.slug!=='*'&&c.reviewed>=S.minimum;nav.append(el('button',{onclick:()=>{current=c.slug;render();scrollTo(0,0)},ariaCurrent:String(current===c.slug)},el('span',{textContent:c.short.zh}),el('small',{className:ready?'ready':'',textContent:c.slug==='*'?c.reviewed+' / '+c.members.length:c.reviewed+' / '+S.minimum+' · 共 '+c.members.length})))}
 const c=current==='*'?all:S.collections.find(x=>x.slug===current),hide=document.getElementById('hide').checked;
 const ids=[...c.members].sort((a,b)=>(S.items[a].facets.status==='reviewed')-(S.items[b].facets.status==='reviewed')).filter(id=>!hide||S.items[id].facets.status!=='reviewed');
 document.getElementById('count').textContent=ids.length+' 条';const list=document.getElementById('list');list.replaceChildren(...ids.map(card))}
function card(id){const it=S.items[id],f=structuredClone(it.facets),done=f.status==='reviewed';
 const cover=it.cover?el('img',{className:'cover',src:it.cover,loading:'lazy',referrerPolicy:'no-referrer',alt:''}):el('div',{className:'cover'});
 const status=el('span',{className:'status'+(done?' ok':''),textContent:done?'已核对 '+f.reviewedAt:'初稿'});
 const editor=el('div');const draw=()=>{editor.replaceChildren(...Object.keys(names).map(k=>{const isMulti=multi.includes(k),vals=isMulti?f[k]:[f[k]];
  const chips=S.vocab[k].map(v=>el('button',{type:'button',textContent:v.label.zh,title:v.label.en+' · '+v.value,ariaPressed:String(vals.includes(v.value)),disabled:isMulti&&!vals.includes(v.value)&&vals.length>=S.limit,
   onclick:()=>{if(isMulti)f[k]=vals.includes(v.value)?vals.filter(x=>x!==v.value):[...vals,v.value];else f[k]=k==='industry'&&f[k]===v.value?null:v.value;draw()}}));
  return el('div',{className:'facet'},el('span',{textContent:names[k]}),el('div',{className:'chips'},...chips))}))};draw();
 const save=async reviewed=>{status.className='status';status.textContent='保存中…';const r=await fetch('/api/review',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id,facets:f,reviewed})});const out=await r.json();
  if(!out.ok){status.className='status err';status.textContent=out.error;return}const y=scrollY;await load();scrollTo(0,y)};
 const actions=el('div',{className:'actions'},el('button',{className:'primary',type:'button',textContent:'确认已核对',onclick:()=>save(true)}),el('button',{type:'button',textContent:done?'改回初稿':'只保存修改',onclick:()=>save(false)}),status);
 const notes=el('div',{className:'notes'},el('div',{},el('span',{textContent:'研究什么：'}),it.focus.zh),el('div',{},el('span',{textContent:'用在哪里：'}),it.application.zh));
 const body=el('div',{},el('div',{className:'head'},el('b',{textContent:it.name}),el('a',{href:it.url,target:'_blank',rel:'noreferrer',textContent:'打开原站 ↗'}),el('span',{className:'meta',textContent:it.section+' · '+it.tag+' · '+id})),notes);
 if(it.post)body.append(el('details',{},el('summary',{textContent:'帖子原文'}),el('div',{className:'post',textContent:it.post})));
 body.append(editor,actions);return el('div',{className:'card'+(done?' done':'')},cover,body)}
document.getElementById('hide').onchange=render;load();
</script></body></html>`;

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const arg = process.argv.slice(2), port = Number(arg[arg.indexOf('--port') + 1]) || 4800;
  server().listen(port, '127.0.0.1', () => console.log(`Facet review: http://127.0.0.1:${port}/  (writes ${path.relative(process.cwd(), facetsFile)}; Ctrl+C to stop)`));
}
