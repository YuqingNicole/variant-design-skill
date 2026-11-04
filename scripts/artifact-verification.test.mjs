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

test('registered system extensions invalidate evidence without caller-supplied dependencies',async t=>{
 for(const kind of ['edit','delete','reorder','binding']){
  const {root,project}=setup(t),context=path.join(root,'.variant-context.json'),state=JSON.parse(fs.readFileSync(context));
  for(const name of ['brand.css','extension.css','second.css'])fs.writeFileSync(path.join(project,name),':root{--color-text:#111}');
  state.designSystem.file='brand.css';state.designSystem.extensions=['extension.css','second.css'];state.variants.B.systemBinding={status:'pending',digest:'approved-definition'};fs.writeFileSync(context,JSON.stringify(state));
  const result=await verifyArtifact(root,'B',{},observations);assert.equal(result.status,'passed');
  assert.deepEqual(result.report.dependencies,[]);assert.ok(result.report.fingerprint.dependencies['extension.css']);assert.ok(result.report.fingerprint.dependencies['second.css']);assert.equal(result.report.fingerprint.systemBinding.status,'pending');
  if(kind==='edit')fs.appendFileSync(path.join(project,'extension.css'),'\n:root{--color-text:#222}');
  if(kind==='delete')fs.unlinkSync(path.join(project,'extension.css'));
  if(kind==='reorder'){state.designSystem.extensions.reverse();fs.writeFileSync(context,JSON.stringify(state));}
  if(kind==='binding'){state.variants.B.systemBinding.status='applied';fs.writeFileSync(context,JSON.stringify(state));}
  assert.equal(inspectVerification(root,result.file).status,'stale',kind);
 }
});

test('extension edits during observation are stale and symlinked extensions cannot produce a report',async t=>{
 const {root,project}=setup(t),context=path.join(root,'.variant-context.json'),state=JSON.parse(fs.readFileSync(context));
 const extension=path.join(project,'extension.css');fs.writeFileSync(extension,':root{--color-text:#111}');state.designSystem.extensions=['extension.css'];fs.writeFileSync(context,JSON.stringify(state));
 const result=await verifyArtifact(root,'B',{},async()=>{fs.appendFileSync(extension,'\n/* changed during observation */');return observations()});assert.equal(result.status,'stale');assert.equal(result.report.changedDuringRun,true);
 fs.renameSync(extension,path.join(project,'real-extension.css'));fs.symlinkSync(path.join(project,'real-extension.css'),extension);const before=fs.readdirSync(path.dirname(result.file));
 await assert.rejects(()=>verifyArtifact(root,'B',{},observations),/symbolic|symlink/i);assert.deepEqual(fs.readdirSync(path.dirname(result.file)),before);
});

test('missing extension coverage stays stale and malformed extension paths are refused',async t=>{
 const {root,project}=setup(t),context=path.join(root,'.variant-context.json'),state=JSON.parse(fs.readFileSync(context));fs.writeFileSync(path.join(project,'extension.css'),':root{--color-text:#111}');state.designSystem.extensions=['extension.css'];fs.writeFileSync(context,JSON.stringify(state));
 const result=await verifyArtifact(root,'B',{},observations),legacy=structuredClone(result.report);delete legacy.fingerprint.dependencies['extension.css'];const file=path.join(path.dirname(result.file),'missing-extension-coverage.json');fs.writeFileSync(file,JSON.stringify(legacy),{flag:'wx'});assert.equal(inspectVerification(root,file).status,'stale');
 for(const extensions of [null,'extension.css',{},[''],['../outside.css']]){state.designSystem.extensions=extensions;fs.writeFileSync(context,JSON.stringify(state));await assert.rejects(()=>verifyArtifact(root,'B',{},observations),/relative/)}
});
test('missing tools, failed checks and invalid attestations stay explicit',async t=>{
 const {root}=setup(t);const missing=await verifyArtifact(root,'B',{},()=>{throw new Error('Browser unavailable');});assert.equal(missing.status,'unverified');assert.match(missing.report.checks[0].reason,/Browser unavailable/);
 const failed=await verifyArtifact(root,'B',{},()=>observations().map(c=>c.id==='brand'?{...c,status:'failed',reason:'Arial differs from Georgia'}:c));assert.equal(failed.status,'failed');
 await assert.rejects(()=>verifyArtifact(root,'B',{},()=>[{id:'brand',status:'passed',reason:'trust me'}]),/require tool/);
 await assert.rejects(()=>verifyArtifact(root,'B',{dependencies:['../outside']}),/relative/);
});

test('failure comparison separates observed-before diagnostics from new or changed failures',async t=>{
 const {compareVerificationReports}=await import('./artifact-verification.mjs');
 const {root}=setup(t);
 const run=reason=>verifyArtifact(root,'B',{},()=>observations().map(c=>c.id==='project-checks'?{...c,status:'failed',reason}:c));
 const before=await run('Existing type error');
 const same=await run('Existing type error');
 assert.equal(compareVerificationReports(before.report,same.report).failures[0].classification,'observed-before');
 const changed=await run('Different type error');
 assert.equal(compareVerificationReports(before.report,changed.report).failures[0].classification,'new-or-changed');
 assert.equal(changed.status,'failed');
 assert.throws(()=>compareVerificationReports(before.report,{...changed.report,fingerprint:{...changed.report.fingerprint,id:'A'}}),/same project/);
});
