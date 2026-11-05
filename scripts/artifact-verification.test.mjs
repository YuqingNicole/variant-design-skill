import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createRequire} from 'node:module';
import {fixture} from '../tests/fixture.mjs';
import {verifyArtifact,inspectVerification} from './artifact-verification.mjs';
const ids=['brand','keyboard-focus','reduced-motion','scope-preservation','project-checks'];
const compiler=path.dirname(createRequire(new URL('../tests/package.json',import.meta.url)).resolve('typescript/package.json'));
function setup(t){const project=fs.mkdtempSync(path.join(os.tmpdir(),'variant-evidence-'));t.after(()=>fs.rmSync(project,{recursive:true,force:true}));const root=path.join(project,'output');fixture(root);fs.mkdirSync(path.join(project,'node_modules'));fs.symlinkSync(compiler,path.join(project,'node_modules/typescript'),process.platform==='win32'?'junction':'dir');fs.writeFileSync(path.join(project,'package.json'),'{"dependencies":{"react":"19.1.1"}}');return {root,project};}
const observations=()=>ids.map(id=>({id,status:'passed',reason:'Controlled adapter observation',tool:{name:'test-adapter',version:'1'},environment:{fixture:true},evidence:['Explicit test result']}));
test('non-source observation inputs bind baseline evidence without parsing private report directories',async t=>{
 const {root,project}=setup(t),input='output/.verification/baseline.json';fs.mkdirSync(path.dirname(path.join(project,input)),{recursive:true});fs.writeFileSync(path.join(project,input),'{"observation":"original"}');
 const result=await verifyArtifact(root,'B',{inputs:[input]},observations);assert.equal(result.status,'passed');assert(result.report.fingerprint.inputs[input]);assert.equal(result.report.fingerprint.dependencyClosure.files[input],undefined);
 fs.appendFileSync(path.join(project,input),'\n');assert.equal(inspectVerification(root,result.file).status,'stale');
 const changed=await verifyArtifact(root,'B',{inputs:[input]},()=>{fs.appendFileSync(path.join(project,input),' ');return observations()});assert.equal(changed.status,'stale');assert(changed.report.changedDuringRun);
 await assert.rejects(()=>verifyArtifact(root,'B',{inputs:'bad'}),/Inputs/);await assert.rejects(()=>verifyArtifact(root,'B',{inputs:['../outside']}),/relative/);
 fs.writeFileSync(path.join(project,'.env'),'NEVER_EXPOSE_THIS=secret');await assert.rejects(()=>verifyArtifact(root,'B',{inputs:['.env']}),/private environment/);
});
test('static-only evidence never implies runtime verification',async t=>{
 const {root}=setup(t);const result=await verifyArtifact(root,'B');assert.equal(result.status,'unverified');assert.equal(result.report.checks.filter(c=>c.status==='unverified').length,5);
 assert.equal(result.report.fingerprint.version,1);assert.ok(result.report.fingerprint.files['VariantB.tsx']);
});
test('file, declared dependency, package and constraint drift stale evidence; selection does not',async t=>{
 for(const kind of ['file','dependency','package','constraint','revision']){
  const {root,project}=setup(t);fs.writeFileSync(path.join(project,'shared.css'),'body{}');
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

test('transitive provider/data/CSS/assets and compiler inputs stale evidence without manually listing them',async t=>{
 for(const kind of ['provider','data','css','asset','ambient','alias']){
  const {root,project}=setup(t),write=(file,text)=>{const full=path.join(project,file);fs.mkdirSync(path.dirname(full),{recursive:true});fs.writeFileSync(full,text)};
  write('tsconfig.json','{"compilerOptions":{"baseUrl":".","paths":{"@/*":["src/*"]}},"include":["src"]}');
  write('src/provider.ts',`import data from './data.json';import './provider.css';import logo from './mark.svg';export const shared={data,logo};`);write('src/data.json','{"x":1}');write('src/provider.css','body{color:blue}');write('src/mark.svg','<svg/>');write('src/env.d.ts','declare const flag: string;');
  fs.appendFileSync(path.join(root,'VariantB.tsx'),`\nimport {shared} from '@/provider'; console.log(shared);`);
  const result=await verifyArtifact(root,'B',{},observations);assert.equal(result.status,'passed',kind);assert.deepEqual(result.report.dependencies,[]);
  for(const file of ['src/provider.ts','src/data.json','src/provider.css','src/mark.svg','src/env.d.ts'])assert(result.report.fingerprint.dependencies[file],file);
  const mutations={provider:['src/provider.ts',`export const shared=2;`],data:['src/data.json','{"x":2}'],css:['src/provider.css','body{color:red}'],asset:['src/mark.svg','<svg><path/></svg>'],ambient:['src/env.d.ts','declare const flag: number;'],alias:['tsconfig.json','{"compilerOptions":{"baseUrl":".","paths":{"@/*":["other/*"]}},"include":["src"]}']};
  write(...mutations[kind]);assert.equal(inspectVerification(root,result.file).status,'stale',kind);
 }
});
test('shared changes during observation are stale, while unresolved imports preserve observations as unverified',async t=>{
 const {root,project}=setup(t),data=path.join(project,'shared.json');fs.writeFileSync(data,'{"x":1}');fs.appendFileSync(path.join(root,'VariantB.tsx'),`\nimport shared from '../shared.json';console.log(shared);`);
 const result=await verifyArtifact(root,'B',{},()=>{fs.writeFileSync(data,'{"x":2}');return observations()});assert.equal(result.status,'stale');assert(result.report.changedDuringRun);
 fs.appendFileSync(path.join(root,'VariantB.tsx'),`\nimport './not-yet-created';`);
 const partial=await verifyArtifact(root,'B',{},observations);assert.equal(partial.status,'unverified');assert(partial.report.checks.every(c=>c.status==='passed'));assert(partial.report.coverage.unknowns.some(c=>c.code==='unresolved-local-reference'));
 fs.writeFileSync(path.join(root,'not-yet-created.ts'),'export {};');assert.equal(inspectVerification(root,partial.file).status,'stale');
});
test('reports without closure identity stay stale and are never retrofitted',async t=>{
 const {root}=setup(t),result=await verifyArtifact(root,'B',{},observations),legacy=structuredClone(result.report);delete legacy.fingerprint.dependencyClosure;
 const file=path.join(path.dirname(result.file),'legacy-closure.json'),text=JSON.stringify(legacy);fs.writeFileSync(file,text);assert.equal(inspectVerification(root,file).status,'stale');assert.equal(fs.readFileSync(file,'utf8'),text);
});

 test('explicit actual diagnostics compare individually while changed logs retain provenance',async t=>{
 const {compareVerificationReports}=await import('./artifact-verification.mjs'),{root}=setup(t);
 const prior={id:'legacy',message:'Original failure',file:'project-health.json'},introduced={id:'syntax',message:'Unexpected end of input',file:'delivered/app.js'};
 const run=(diagnostics,evidence,extra={})=>verifyArtifact(root,'B',{},()=>observations().map(c=>c.id==='project-checks'?{...c,status:'failed',reason:'Actual health check',diagnostics,evidence:[evidence],...extra}:c));
 const before=await run([prior],'before.log'),after=await run([prior,introduced],'after.log',{reason:'Two actual failures'});
 const compared=compareVerificationReports(before.report,after.report);assert.deepEqual(compared.failures.map(f=>[f.diagnostic.id,f.classification]),[['legacy','observed-before'],['syntax','new-or-changed']]);assert.deepEqual(compared.failures[0].evidence,['after.log']);assert.equal(after.status,'failed');
 for(const extra of [{tool:{name:'different checker',version:'2'}},{environment:{url:'different'}}]){const changed=await run([prior],'different.log',extra);assert.equal(compareVerificationReports(before.report,changed.report).failures[0].classification,'new-or-changed');}
 const changed=await run([{...prior,message:'Different diagnostic'}],'new.log');assert.equal(compareVerificationReports(before.report,changed.report).failures[0].classification,'new-or-changed');
 });
 test('invalid or invented diagnostic structures cannot be recorded as observations',async t=>{
 const {root}=setup(t);for(const diagnostics of [[],[{id:'x',message:'x'},{id:'x',message:'y'}],[{id:'x',message:'x',file:'../secret'}],[{id:'x',message:'x',line:0}],[{id:'x',message:'x',command:'fake'}],Array.from({length:257},(_,i)=>({id:String(i),message:'x'}))])await assert.rejects(()=>verifyArtifact(root,'B',{},()=>observations().map(c=>c.id==='project-checks'?{...c,status:'failed',diagnostics}:c)),/diagnostic|Diagnostic/);
 await assert.rejects(()=>verifyArtifact(root,'B',{},()=>observations().map(c=>({...c,diagnostics:[{id:'fake',message:'not a failed observation'}]}))),/Failed diagnostics/);
 });
