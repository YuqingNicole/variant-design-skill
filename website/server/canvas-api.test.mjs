import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {Readable} from 'node:stream';
import {handleCanvasApi} from './canvas-api.mjs';
import {createLanding} from '../shared/landing-document.mjs';
async function invoke(url,body,method='POST'){
 const req=Readable.from([Buffer.from(JSON.stringify(body??{}))]);req.url=url;req.method=method;req.headers={host:'127.0.0.1:4188',origin:'http://127.0.0.1:4188'};
 let status,payload;const res={writeHead:s=>status=s,end:s=>payload=JSON.parse(s)};await handleCanvasApi(req,res);return{status,payload};
}
test('model documents validate before saving; proposals remain unapplied, scoped and revision-bound',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'canvas-api-')),oldFetch=global.fetch,oldEnv={...process.env};process.env.CANVAS_DATA_DIR=dir;process.env.ANTHROPIC_API_KEY='test-only';let calls=0,mode='generate';
 global.fetch=async(_url,init)=>{
  calls++;const prompt=JSON.parse(init.body).messages[0].content;const direction=prompt.match(/Direction ([ABC]):/)?.[1];
  const value=mode==='generate'?createLanding(direction):mode==='bad'?{bad:'document'}:mode==='scope'?{summary:'Outside scope',commands:[{type:'text',nodeId:'intro',text:'Should not be changed'}]}:{summary:'Shorten headline',commands:[{type:'text',nodeId:'headline',text:'Proposed title'}]};
  return new Response(JSON.stringify({content:[{type:'text',text:JSON.stringify(value)}]}),{status:200});
 };
 try{
  const created=await invoke('/api/canvas/generate',{brief:'Test a model-created landing'});assert.equal(created.status,201);assert.equal(created.payload.origin,'model');assert.equal(calls,3);const p=created.payload;
  mode='propose';const proposal=await invoke(`/api/canvas/projects/${p.id}/propose`,{expectedRevision:1,direction:'B',nodeId:'headline',instruction:'Shorten it'});assert.equal(proposal.status,200);assert.equal(proposal.payload.expectedRevision,1);
  const unchanged=await invoke(`/api/canvas/projects/${p.id}`,null,'GET');assert.equal(unchanged.payload.revision,1);assert.deepEqual(unchanged.payload.documents,p.documents);
  mode='scope';assert.equal((await invoke(`/api/canvas/projects/${p.id}/propose`,{expectedRevision:1,direction:'B',nodeId:'headline',instruction:'Shorten it'})).status,400);
  await invoke(`/api/canvas/projects/${p.id}/edit`,{expectedRevision:1,direction:'B',commands:[{type:'text',nodeId:'headline',text:'Human edit'}]});
  const stale=await invoke(`/api/canvas/projects/${p.id}/edit`,{expectedRevision:proposal.payload.expectedRevision,direction:'B',commands:proposal.payload.commands});assert.equal(stale.status,409);
  mode='bad';const before=fs.readdirSync(dir).length;const bad=await invoke('/api/canvas/generate',{brief:'Invalid model response'});assert.equal(bad.status,400);assert.equal(fs.readdirSync(dir).length,before);
 }finally{global.fetch=oldFetch;for(const key of ['CANVAS_DATA_DIR','ANTHROPIC_API_KEY']){if(oldEnv[key]===undefined)delete process.env[key];else process.env[key]=oldEnv[key];}fs.rmSync(dir,{recursive:true,force:true});}
});
