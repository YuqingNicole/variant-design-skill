import fs from 'node:fs';
import path from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { newProject, packAssets, publicState, stateStamp, transition, unpackAssets } from '../shared/canvas-state.mjs';
import { localFile } from '../../scripts/variant-history.mjs';
const defaultDirectory = fileURLToPath(new URL('../.canvas-data/',import.meta.url));
const staleLockMs = 30_000;
const sha256 = value => createHash('sha256').update(value).digest('hex');
export { stateStamp, publicState };
export function canvasStore(directory = process.env.CANVAS_DATA_DIR || defaultDirectory) {
  fs.mkdirSync(directory,{recursive:true});
  if(fs.lstatSync(directory).isSymbolicLink())throw new Error('Canvas data directory cannot be a symlink.');
  const file = id => { if(!/^[a-f\d-]{36}$/.test(id)) throw Object.assign(new Error('Invalid project ID.'),{statusCode:400}); return localFile(directory,id+'.json'); };
  function save(state) { const target=file(state.id),tmp=target+'.'+randomUUID()+'.tmp',content=JSON.stringify(packAssets(state,sha256)); try{fs.writeFileSync(tmp,content,{flag:'wx',flush:true});if(fs.readFileSync(tmp,'utf8')!==content)throw new Error('Snapshot verification failed.');fs.renameSync(tmp,target);}finally{if(fs.existsSync(tmp))fs.unlinkSync(tmp);} return state; }
  function read(id) { try{return unpackAssets(JSON.parse(fs.readFileSync(file(id),'utf8')));}catch(e){if(e.code==='ENOENT')throw Object.assign(new Error('Project not found.'),{statusCode:404});throw e;} }
  const create = (brief, documents) => save(newProject(randomUUID(),brief,documents));
  function mutate(id,expectedRevision,action) {
    const lock = file(id)+'.lock';
    const acquire=()=>{try{fs.mkdirSync(lock);return true;}catch(e){if(e.code!=='EEXIST')throw e;return false;}};
    // A crash between mkdir and rmdir would otherwise lock the project forever.
    if(!acquire()){let stale=false;try{stale=Date.now()-fs.statSync(lock).mtimeMs>staleLockMs;}catch{}if(stale){fs.rmSync(lock,{recursive:true,force:true});}if(!stale||!acquire())throw Object.assign(new Error('项目正在保存，请重试。'),{statusCode:409});}
    try{
      return save(transition(read(id),expectedRevision,action));
    }finally{fs.rmdirSync(lock);}
  }
  return {read,create,mutate,directory};
}
