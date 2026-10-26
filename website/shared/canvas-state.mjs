import { applyCommands, createLanding, findNode, validateDocument } from './landing-document.mjs';
// Project state transitions shared by the local file store and the browser (IndexedDB) store.
const fail = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });
export const stateStamp = state => `${state.revision}:${state.active}:${state.selection ?? ''}:${state.selected ?? ''}`;
export function publicState(state){const {undo,redo,...rest}=state;return {...rest,undoDepth:undo.length,redoDepth:redo.length};}
export function newProject(id, brief, documents, {origin = documents ? 'model' : 'template', selected = null, now = new Date().toISOString()} = {}) {
  if(typeof brief!=='string'||!brief.trim()||brief.length>600)throw fail('请输入 1–600 字的设计命题。');
  if(documents)for(const d of ['A','B','C']){validateDocument(documents[d]);if(documents[d].direction!==d)throw new Error('Direction mismatch.');}
  if(selected!==null&&!['A','B','C'].includes(selected))throw new Error('Invalid direction.');
  return {id,revision:1,brief,origin,active:selected??'B',selected,selection:null,documents:documents||Object.fromEntries(['A','B','C'].map(d=>[d,createLanding(d,brief)])),undo:[],redo:[],log:[],createdAt:now};
}
// A portable copy of a project: documents and the chosen direction, without undo history.
export const backupFormat = 'variant-canvas-project';
export const projectBackup = state => ({format:backupFormat,version:1,brief:state.brief,selected:state.selected,documents:state.documents,exportedAt:new Date().toISOString()});
export function projectFromBackup(id, backup) {
  if(!backup||backup.format!==backupFormat||backup.version!==1||!backup.documents)throw Object.assign(new Error('这不是 Variant 画布的项目备份文件。'),{statusCode:400});
  return newProject(id,backup.brief,backup.documents,{origin:'import',selected:backup.selected??null});
}
// Mutates and returns `state`; callers persist it. Throws 409 when the revision is stale.
export function transition(state, expectedRevision, action, now = new Date().toISOString()) {
  if(!Number.isInteger(expectedRevision)||state.revision!==expectedRevision)throw fail('页面已有新修改。已保留当前版本，请刷新后重试。',409);
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
    if(!state.documents[action.direction])throw new Error('Invalid direction.');
    if(action.type==='edit'){state.documents[action.direction]=applyCommands(state.documents[action.direction],action.commands);state.active=action.direction;}
    else if(action.type==='select'){state.selected=action.direction;state.active=action.direction;}
    else if(action.type==='replace'){const doc=validateDocument(action.document);if(doc.direction!==action.direction)throw new Error('Direction mismatch.');state.documents[action.direction]=doc;}
    else throw new Error('Unknown action.');
    if(action.type!=='select'){state.undo.push(before);state.undo=state.undo.slice(-30);state.redo=[];}
  }
  if(state.selection&&!findNode(state.documents[state.active],state.selection))state.selection=null;
  if(action.type!=='selection'){state.revision++;state.log.push({revision:state.revision,action:action.type,summary:typeof action.summary==='string'?action.summary.slice(0,200):action.type,at:now});state.log=state.log.slice(-100);}
  return state;
}
// Undo snapshots copy whole documents. Store each embedded image once so 30 snapshots of a
// page with a 2 MB photo stay one photo in storage, not 60 MB rewritten on every edit.
export function packAssets(state, key){
  const assets={},seen=new Map();
  const packed=JSON.parse(JSON.stringify(state,(name,value)=>{
    if(name!=='src'||typeof value!=='string'||!value.startsWith('data:'))return value;
    let id=seen.get(value);if(!id){id=key(value,seen.size);seen.set(value,id);assets[id]=value;}
    return 'asset:'+id;
  }));
  return Object.keys(assets).length?{...packed,assets}:packed;
}
export function unpackAssets(state){
  const {assets,...rest}=state;if(!assets)return state;
  const visit=value=>{if(Array.isArray(value))value.forEach(visit);else if(value&&typeof value==='object')for(const [name,item] of Object.entries(value)){if(name==='src'&&typeof item==='string'&&item.startsWith('asset:')){if(!assets[item.slice(6)])throw new Error('Missing image asset.');value[name]=assets[item.slice(6)];}else visit(item);}};
  visit(rest);return rest;
}
