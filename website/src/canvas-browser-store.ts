import { applyCommands, findNode, inspectLanding, renderLanding } from '../shared/landing-document.mjs';
import { newProject, packAssets, projectFromBackup, publicState, stateStamp, transition, unpackAssets, type CanvasState } from '../shared/canvas-state.mjs';
// Web mode: the hosted site has no canvas server, so the same API runs in this tab and stores
// projects in this browser only. Local mode (loopback host) keeps the file store and MCP access.
const loopback = /^(localhost|127\.0\.0\.1|\[::1\])$/;
function forcedBrowserMode(){try{if(new URLSearchParams(location.search).get('storage')==='browser')sessionStorage.setItem('variant-canvas-storage','browser');return sessionStorage.getItem('variant-canvas-storage')==='browser';}catch{return false;}}
export const browserMode = !loopback.test(location.hostname) || forcedBrowserMode();
// Keeps a forced web mode in project links, so reloads and new tabs on localhost stay in it.
export const projectPath = (id:string) => `/canvas?project=${id}${browserMode&&loopback.test(location.hostname)?'&storage=browser':''}`;
type Stored = CanvasState & { assets?: Record<string,string> };
const memory = new Map<string,Stored>();
let persistent = true, database: Promise<IDBDatabase> | null = null;
export const browserStorageIsPersistent = () => persistent;
function open(){return database??=new Promise<IDBDatabase>((resolve,reject)=>{const request=indexedDB.open('variant-canvas',1);request.onupgradeneeded=()=>request.result.createObjectStore('projects',{keyPath:'id'});request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
const fail = (message:string,statusCode=400) => Object.assign(new Error(message),{statusCode});
const pack = (state:CanvasState) => packAssets(state,(_value,index)=>String(index)) as Stored;
// Read, transform and write in one transaction, so two tabs cannot interleave a save.
async function update(id:string, change:(state:CanvasState|null)=>CanvasState, write=true):Promise<CanvasState>{
  let db:IDBDatabase|null=null;
  if(persistent)try{db=await open();}catch{persistent=false;}
  if(!db){const next=change(memory.has(id)?unpackAssets(structuredClone(memory.get(id)!)):null);if(write)memory.set(next.id,pack(next));return next;}
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('projects',write?'readwrite':'readonly'),store=tx.objectStore('projects');let result:CanvasState,failure:unknown;
    const get=store.get(id);
    get.onsuccess=()=>{try{result=change(get.result?unpackAssets(get.result as Stored):null);if(write)store.put(pack(result));}catch(error){failure=error;tx.abort();}};
    tx.oncomplete=()=>resolve(result);tx.onabort=()=>reject(failure??tx.error??fail('浏览器存储写入失败。',500));
  });
}
async function read(id:string){return update(id,state=>{if(!state)throw fail('Project not found.',404);return state;},false);}
const json = (value:unknown,status=200) => new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json'}});
const html = (doc:Parameters<typeof renderLanding>[0]) => new Response(renderLanding(doc),{headers:{'content-type':'text/html; charset=utf-8'}});
// The site's stateless model routes return documents or commands; this tab decides what to save.
async function remote(path:string,body:unknown){
  const res=await fetch(path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
  let data:{error?:string}&Record<string,unknown>;try{data=await res.json();}catch{throw fail('这个网站没有可用的模型服务。',res.ok?502:res.status);}
  if(!res.ok)throw fail(data.error||'模型请求失败。',res.status);return data;
}
// Mirrors server/canvas-api.mjs for the routes the canvas UI uses.
export async function browserFetch(input:string,init?:RequestInit):Promise<Response>{
  const url=new URL(input,location.origin),body=init?.body?JSON.parse(String(init.body)):{};
  try{
    if(url.pathname==='/api/status')return fetch('/api/status').then(r=>r.ok?r:json({configured:false})).catch(()=>json({configured:false}));
    if(url.pathname==='/api/canvas/generate'){const {documents}=await remote('/api/canvas/documents',{brief:body.brief});const id=crypto.randomUUID();return json(publicState(await update(id,()=>newProject(id,body.brief,documents as CanvasState['documents']))),201);}
    if(url.pathname==='/api/canvas/projects'&&init?.method==='POST'){const id=crypto.randomUUID();return json(publicState(await update(id,()=>newProject(id,body.brief))),201);}
    if(url.pathname==='/api/canvas/import'&&init?.method==='POST'){const id=crypto.randomUUID();return json(publicState(await update(id,()=>projectFromBackup(id,body))),201);}
    const match=url.pathname.match(/^\/api\/canvas\/projects\/([a-f\d-]{36})(?:\/(\w+))?$/);
    if(!match)throw fail('Not found.',404);
    const [,id,operation]=match;
    if(!init?.method||init.method==='GET'){
      const state=await read(id),direction=(url.searchParams.get('direction')||state.active) as 'A'|'B'|'C',doc=state.documents[direction];if(!doc)throw fail('Invalid direction.');
      if(!operation)return url.searchParams.get('stamp')===stateStamp(state)?new Response(null,{status:204}):json(publicState(state));
      if(operation==='validate')return json(inspectLanding(doc));
      if(operation==='export'&&inspectLanding(doc).issues.length)throw fail('请先修复交付检查中的问题。',422);
      if(operation==='preview'||operation==='export')return html(doc);
      throw fail('Not found.',404);
    }
    if(operation==='propose'){
      const state=await read(id);if(state.revision!==body.expectedRevision)throw fail('页面已更新，请重新发起修改。',409);
      const doc=state.documents[body.direction as 'A'|'B'|'C'],node=doc&&findNode(doc,body.nodeId);if(!node)throw fail('请选择元素并输入修改要求。');
      const result=await remote('/api/canvas/suggest',{node,instruction:body.instruction}) as {summary:string;commands:Parameters<typeof applyCommands>[1]};
      applyCommands(doc,result.commands);
      // Like the local server, a proposal is only shown; applying it is a normal revision-checked edit.
      return json({...result,expectedRevision:state.revision,direction:body.direction});
    }
    if(!['edit','selection','undo','redo','select'].includes(operation))throw fail('Not found.',404);
    return json(publicState(await update(id,state=>{if(!state)throw fail('Project not found.',404);return transition(state,body.expectedRevision,{...body,type:operation});})));
  }catch(error){const e=error as {message?:string;statusCode?:number};return json({error:e.message||'Canvas request failed.'},e.statusCode||400);}
}
export const canvasFetch = (input:string,init?:RequestInit) => browserMode ? browserFetch(input,init) : fetch(input,init);
