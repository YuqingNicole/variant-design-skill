import type { DesignDirection } from './direction-engine';
import type { WorkspaceVersion } from './workspace-engine';

export const workspaceStorageKey='variant-workspace-v2';
const object=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
const strings=(value:unknown):value is string[]=>Array.isArray(value)&&value.every(v=>typeof v==='string');
export function validDirection(value:unknown):value is DesignDirection {
 if(!object(value)||!['A','B','C'].includes(String(value.id))||!['editorial','system','expressive'].includes(String(value.layout)))return false;
 if(!['name','thesis','typography','density','layoutLabel','motion','reason','sampleTitle','sampleMeta'].every(key=>typeof value[key]==='string'))return false;
 if(!strings(value.colors)||value.colors.length!==4||value.colors.some(c=>!/^#[0-9a-f]{6}$/i.test(c)))return false;
 if(value.html!==undefined&&typeof value.html!=='string')return false;
 if(value.contract!==undefined&&(!object(value.contract)||typeof value.contract.artDirection!=='string'||typeof value.contract.signatureMove!=='string'||!strings(value.contract.contentPlan)||!strings(value.contract.avoid)))return false;
 return true;
}
export function validDirections(value:unknown):value is DesignDirection[] {
 return Array.isArray(value)&&value.length===3&&value.every(validDirection)&&new Set(value.map(d=>d.id)).size===3;
}
function validVersion(value:unknown):value is WorkspaceVersion {
 if(!object(value)||(value.schemaVersion!==undefined&&value.schemaVersion!==2))return false;
 return typeof value.id==='string'&&!!value.id&&typeof value.brief==='string'&&['generated','built','varied','remixed','mixed'].includes(String(value.action))
  &&['A','B','C'].includes(String(value.selectedId))&&typeof value.createdAt==='string'&&Number.isFinite(Date.parse(value.createdAt))&&new Date(value.createdAt).toISOString()===value.createdAt&&validDirections(value.directions);
}
export function loadWorkspace(storage:Pick<Storage,'getItem'>):{history:WorkspaceVersion[];issue:boolean} {
 try {
  const raw=storage.getItem(workspaceStorageKey);if(!raw)return {history:[],issue:false};
  const parsed:unknown=JSON.parse(raw);if(!Array.isArray(parsed))return {history:[],issue:true};
  const seen=new Set<string>();
  const history=parsed.filter((item):item is WorkspaceVersion=>{if(!validVersion(item)||seen.has(item.id))return false;seen.add(item.id);return true;});
  return {history:history.slice(0,12),issue:history.length!==parsed.length};
 }catch{return {history:[],issue:true};}
}
export function persistWorkspace(storage:Pick<Storage,'setItem'>,history:WorkspaceVersion[]) {
 try {storage.setItem(workspaceStorageKey,JSON.stringify(history.slice(0,12)));return true;}catch{return false;}
}
// Each async operation owns a generation. Restore/unmount revoke it even if abort is ignored.
export class WorkspaceLifecycle {
 private generation=0;
 private controller:AbortController|null=null;
 begin(){this.invalidate();const generation=this.generation;this.controller=new AbortController();return {signal:this.controller.signal,current:()=>generation===this.generation};}
 invalidate(){this.generation++;this.controller?.abort();this.controller=null;}
}
export function readPreference(key:string){try{return window.localStorage.getItem(key);}catch{return null;}}
export function writePreference(key:string,value:string){try{window.localStorage.setItem(key,value);}catch{/* Preferences never block the workspace. */}}
