import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fixture} from '../tests/fixture.mjs';
import {verifyArtifact,inspectVerification} from './artifact-verification.mjs';
const ids=['brand','keyboard-focus','reduced-motion','scope-preservation','project-checks'];
function setup(t){const project=fs.mkdtempSync(path.join(os.tmpdir(),'variant-evidence-'));t.after(()=>fs.rmSync(project,{recursive:true,force:true}));const root=path.join(project,'output');fixture(root);return {root,project};}
const observations=()=>ids.map(id=>({id,status:'passed',reason:'Controlled adapter observation',tool:{name:'test-adapter',version:'1'},environment:{fixture:true},evidence:['Explicit test result']}));
test('static-only evidence never implies runtime verification',async t=>{
 const {root}=setup(t);const result=await verifyArtifact(root,'B');assert.equal(result.status,'unverified');assert.equal(result.report.checks.filter(c=>c.status==='unverified').length,5);
 assert.equal(result.report.fingerprint.version,1);assert.ok(result.report.fingerprint.files['VariantB.tsx']);
});
test('file, declared dependency, package and constraint drift stale evidence; selection does not',async t=>{
 for(const kind of ['file','dependency','package','constraint','revision']){
  const {root,project}=setup(t);fs.writeFileSync(path.join(project,'shared.css'),'body{}');fs.writeFileSync(path.join(project,'package.json'),'{}');
  const result=await verifyArtifact(root,'B',{dependencies:['shared.css']},observations);assert.equal(result.status,'passed');
  const context=path.join(root,'.variant-context.json'),state=JSON.parse(fs.readFileSync(context));state.selectedVariant='C';fs.writeFileSync(context,JSON.stringify(state));assert.equal(inspectVerification(root,result.file).status,'passed');
  if(kind==='file')fs.appendFileSync(path.join(root,'VariantB.tsx'),'\n// edited');
  if(kind==='dependency')fs.writeFileSync(path.join(project,'shared.css'),'body{color:red}');
  if(kind==='package')fs.writeFileSync(path.join(project,'package.json'),'{"changed":true}');
  if(kind==='constraint'){state.designSystem.fonts=['Arial'];fs.writeFileSync(context,JSON.stringify(state));}
  if(kind==='revision'){state.variants.B.version++;fs.writeFileSync(context,JSON.stringify(state));}
  assert.equal(inspectVerification(root,result.file).status,'stale');
 }
});
test('mutations during verification never get fresh evidence',async t=>{
 const {root}=setup(t);const result=await verifyArtifact(root,'B',{},async()=>{fs.appendFileSync(path.join(root,'VariantB.tsx'),'\n// late edit');return observations();});
 assert.equal(result.status,'stale');assert.equal(result.report.changedDuringRun,true);
});
test('missing tools, failed checks and invalid attestations stay explicit',async t=>{
 const {root}=setup(t);const missing=await verifyArtifact(root,'B',{},()=>{throw new Error('Browser unavailable');});assert.equal(missing.status,'unverified');assert.match(missing.report.checks[0].reason,/Browser unavailable/);
 const failed=await verifyArtifact(root,'B',{},()=>observations().map(c=>c.id==='brand'?{...c,status:'failed',reason:'Arial differs from Georgia'}:c));assert.equal(failed.status,'failed');
 await assert.rejects(()=>verifyArtifact(root,'B',{},()=>[{id:'brand',status:'passed',reason:'trust me'}]),/require tool/);
 await assert.rejects(()=>verifyArtifact(root,'B',{dependencies:['../outside']}),/relative/);
});
