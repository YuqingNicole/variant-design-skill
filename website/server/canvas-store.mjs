import fs from 'node:fs';
import path from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { applyCommands, createLanding, findNode, validateDocument } from '../shared/landing-document.mjs';
import { localFile } from '../../scripts/variant-history.mjs';
const defaultDirectory = fileURLToPath(new URL('../.canvas-data/',import.meta.url));
const staleLockMs = 30_000;
// Undo snapshots copy whole documents. Store each embedded image once so 30 snapshots of a
// page with a 2 MB photo stay one photo on disk, not 60 MB rewritten on every edit.
function packAssets(state){
  const assets={},seen=new Map();
  const json=JSON.stringify(state,(key,value)=>{
    if(key!=='src'||typeof value!=='string'||!value.startsWith('data:'))return value;
    let hash=seen.get(value);if(!hash){hash=createHash('sha256').update(value).digest('hex');seen.set(value,hash);assets[hash]=value;}
    return 'asset:'+hash;
  });
  return Object.keys(assets).length?JSON.stringify({...JSON.parse(json),assets}):json;
}
function unpackAssets(state){
  const {assets,...rest}=state;if(!assets)return state;
  const visit=value=>{if(Array.isArray(value))value.forEach(visit);else if(value&&typeof value==='object')for(const [key,item] of Object.entries(value)){if(key==='src'&&typeof item==='string'&&item.startsWith('asset:')){if(!assets[item.slice(6)])throw new Error('Missing image asset.');value[key]=assets[item.slice(6)];}else visit(item);}};
  visit(rest);return rest;
}
export const stateStamp = state => `${state.revision}:${state.active}:${state.selection ?? ''}:${state.selected ?? ''}`;
export function canvasStore(directory = process.env.CANVAS_DATA_DIR || defaultDirectory) {
  fs.mkdirSync(directory,{recursive:true});
  if(fs.lstatSync(directory).isSymbolicLink())throw new Error('Canvas data directory cannot be a symlink.');
  const file = id => { if(!/^[a-f\d-]{36}$/.test(id)) throw Object.assign(new Error('Invalid project ID.'),{statusCode:400}); return localFile(directory,id+'.json'); };
  function save(state) { const target=file(state.id),tmp=target+'.'+randomUUID()+'.tmp',content=packAssets(state); try{fs.writeFileSync(tmp,content,{flag:'wx',flush:true});if(fs.readFileSync(tmp,'utf8')!==content)throw new Error('Snapshot verification failed.');fs.renameSync(tmp,target);}finally{if(fs.existsSync(tmp))fs.unlinkSync(tmp);} return state; }
  function read(id) { try{return unpackAssets(JSON.parse(fs.readFileSync(file(id),'utf8')));}catch(e){if(e.code==='ENOENT')throw Object.assign(new Error('Project not found.'),{statusCode:404});throw e;} }
  function create(brief, documents) {
    if(typeof brief!=='string'||!brief.trim()||brief.length>600)throw Object.assign(new Error('请输入 1–600 字的设计命题。'),{statusCode:400});
    if(documents)for(const id of ['A','B','C']){validateDocument(documents[id]);if(documents[id].direction!==id)throw new Error('Direction mismatch.');}
    return save({id:randomUUID(),revision:1,brief,origin:documents?'model':'template',active:'B',selected:null,selection:null,documents:documents||Object.fromEntries(['A','B','C'].map(id=>[id,createLanding(id,brief)])),undo:[],redo:[],log:[],createdAt:new Date().toISOString()});
  }
  function mutate(id,expectedRevision,action) {
    const lock = file(id)+'.lock';
    const acquire=()=>{try{fs.mkdirSync(lock);return true;}catch(e){if(e.code!=='EEXIST')throw e;return false;}};
    // A crash between mkdir and rmdir would otherwise lock the project forever.
    if(!acquire()){let stale=false;try{stale=Date.now()-fs.statSync(lock).mtimeMs>staleLockMs;}catch{}if(stale){fs.rmSync(lock,{recursive:true,force:true});}if(!stale||!acquire())throw Object.assign(new Error('项目正在保存，请重试。'),{statusCode:409});}
    try{
      const state=read(id);
      if(!Number.isInteger(expectedRevision)||state.revision!==expectedRevision)throw Object.assign(new Error('页面已有新修改。已保留当前版本，请刷新后重试。'),{statusCode:409});
      const snapshot=()=>({documents:structuredClone(state.documents),selected:state.selected,active:state.active});
      if(action.type==='selection') {
        if(!['A','B','C'].includes(action.direction))throw new Error('Invalid direction.');
        if(action.nodeId!==null&&!findNode(state.documents[action.direction],action.nodeId))throw new Error('Node not found.');
        state.active=action.direction; state.selection=action.nodeId;
      }else if(action.type==='undo'||action.type==='redo'){
        const from=action.type==='undo'?state.undo:state.redo,to=action.type==='undo'?state.redo:state.undo;
        if(!from.length)throw new Error('没有可恢复的版本。');
        to.push(snapshot()); const previous=from.pop(),selected=state.selected;Object.assign(state,previous,{selected});state.selection=null;
      }else{
        const before=snapshot();
        if(action.type==='edit'){
          if(!state.documents[action.direction])throw new Error('Invalid direction.');
          state.documents[action.direction]=applyCommands(state.documents[action.direction],action.commands);state.active=action.direction;
        }else if(action.type==='select'){
          if(!state.documents[action.direction])throw new Error('Invalid direction.');state.selected=action.direction;state.active=action.direction;
        }else if(action.type==='replace'){
          if(!state.documents[action.direction])throw new Error('Invalid direction.');
          const doc=validateDocument(action.document);if(doc.direction!==action.direction)throw new Error('Direction mismatch.');state.documents[action.direction]=doc;
        }else throw new Error('Unknown action.');
        if(action.type!=='select'){state.undo.push(before);state.undo=state.undo.slice(-30);state.redo=[];}
      }
      if(state.selection&&!findNode(state.documents[state.active],state.selection))state.selection=null;
      if(action.type!=='selection'){state.revision++;state.log.push({revision:state.revision,action:action.type,summary:typeof action.summary==='string'?action.summary.slice(0,200):action.type,at:new Date().toISOString()});state.log=state.log.slice(-100);}
      return save(state);
    }finally{fs.rmdirSync(lock);}
  }
  return {read,create,mutate,directory};
}
export function publicState(state){const {undo,redo,...rest}=state;return {...rest,undoDepth:undo.length,redoDepth:redo.length};}
