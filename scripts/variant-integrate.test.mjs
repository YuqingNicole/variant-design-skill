import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { fixture } from '../tests/fixture.mjs';
import { readContext } from './variant-history.mjs';
import { prepareIntegration, integrateVariant, rollbackIntegration, recoverIntegration, listIntegrations } from './variant-integrate.mjs';
const compiler=path.dirname(createRequire(new URL('../tests/package.json',import.meta.url)).resolve('typescript/package.json'));
function setup(t) {
  const project = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'variant-integrate-')));
  t.after(()=>fs.rmSync(project,{recursive:true,force:true}));
  const output=path.join(project,'variant-output'), staging=path.join(project,'.variant-work','integrate-B');
  fixture(output);fs.mkdirSync(path.join(project,'src'));
  fs.mkdirSync(path.join(project,'node_modules'));fs.symlinkSync(compiler,path.join(project,'node_modules/typescript'),process.platform==='win32'?'junction':'dir');fs.writeFileSync(path.join(project,'package.json'),'{"dependencies":{"react":"19.1.1"}}');
  fs.writeFileSync(path.join(project,'index.html'),'<h1>Original</h1>');fs.writeFileSync(path.join(project,'src','App.tsx'),'export const App=()=>null;');
  fs.mkdirSync(path.join(staging,'src'),{recursive:true});
  fs.writeFileSync(path.join(staging,'index.html'),'<h1>Direction B</h1>');fs.writeFileSync(path.join(staging,'src','Hero.tsx'),'export const Hero=()=>null;');
  fs.writeFileSync(path.join(staging,'src','App.tsx'),'export const App=()=>null;');
  const planFile=path.join(project,'.variant-work','plan.json');
  prepareIntegration(output,'B',['index.html','src/Hero.tsx','src/App.tsx'],planFile);
  return {project,output,staging,planFile};
}
const read=(project,file)=>fs.readFileSync(path.join(project,file),'utf8');
const helper = fileURLToPath(new URL('./variant-integrate.mjs', import.meta.url));
function cliFault(f, command, code = '') {
  const hook = path.join(f.project, '.variant-work', 'fault.mjs');
  fs.writeFileSync(hook, `import fs from 'node:fs';const rename=fs.renameSync;let calls=0;fs.renameSync=function(from,to){${code}\nreturn rename.call(this,from,to)};`);
  const args = command === 'apply' ? ['B',f.staging,f.planFile,f.project] : [listIntegrations(f.output)[0].id,f.project];
  return spawnSync(process.execPath, ['--import',hook,helper,command,f.output,...args], {encoding:'utf8'});
}
function releaseDeadLock(f, child) {
  assert.equal(child.signal, 'SIGKILL'); // spawnSync has reaped the killed process; no live operation remains.
  assert(fs.existsSync(path.join(f.output,'.variant-lock')));
  assert.throws(()=>recoverIntegration(f.output,listIntegrations(f.output)[0].id,f.project),/Another history operation/);
  fs.rmdirSync(path.join(f.output,'.variant-lock'));
}
function assertRestored(f) {
  assert.equal(read(f.project,'index.html'),'<h1>Original</h1>');
  assert.equal(fs.existsSync(path.join(f.project,'src/Hero.tsx')),false);
  assert.equal(read(f.project,'src/App.tsx'),'export const App=()=>null;');
  assert.equal(readContext(f.output).selectedVariant,'A');
  assert(listIntegrations(f.output)[0].rolledBackAt);
}
test('integration backs up first, records each action, keeps selection, and rolls back created and overwritten files',t=>{
  const {project,output,staging,planFile}=setup(t);
  const record=integrateVariant(output,'B',staging,project,planFile);
  assert.deepEqual(record.files.map(f=>`${f.action} ${f.path}`).sort(),['create src/Hero.tsx','overwrite index.html','unchanged src/App.tsx']);
  assert.equal(read(project,'index.html'),'<h1>Direction B</h1>');assert.equal(readContext(output).selectedVariant,'A');
  assert.equal(listIntegrations(output)[0].id,record.id);
  rollbackIntegration(output,record.id);
  assert.equal(read(project,'index.html'),'<h1>Original</h1>');assert.equal(fs.existsSync(path.join(project,'src','Hero.tsx')),false);
  assert.equal(read(project,'src/App.tsx'),'export const App=()=>null;');
  assert.throws(()=>rollbackIntegration(output,record.id),/already rolled back/);
});

test('real CLI killed mid-apply retains a backup and lock; recovery resumes known mixed states only',t=>{
  const f=setup(t), context=read(f.output,'.variant-context.json');
  const child=cliFault(f,'apply',`if(to===${JSON.stringify(path.join(f.project,'index.html'))}){rename(from,to);process.kill(process.pid,'SIGKILL');}`);
  releaseDeadLock(f,child);
  const record=listIntegrations(f.output)[0];assert.equal(record.appliedAt,null);assert.equal(record.rolledBackAt,null);
  assert.equal(read(f.project,'index.html'),'<h1>Direction B</h1>');assert(!fs.existsSync(path.join(f.project,'src/Hero.tsx')));
  assert.throws(()=>rollbackIntegration(f.output,record.id,f.project),/use recover/);
  const recovered=cliFault(f,'recover');assert.equal(recovered.status,0,recovered.stderr);
  assertRestored(f);assert.equal(read(f.output,'.variant-context.json'),context);
  assert.equal(read(f.staging,'index.html'),'<h1>Direction B</h1>');
  assert(fs.existsSync(path.join(f.output,'.integrations/recovery',record.id+'.json')));
  assert.throws(()=>recoverIntegration(f.output,record.id,f.project),/already rolled back/);
});

test('all targets written but completion marker interrupted still requires recovery',t=>{
  const f=setup(t),child=cliFault(f,'apply',`if(to.includes('/.integrations/')&&!to.includes('/recovery/'))process.kill(process.pid,'SIGKILL');`);
  releaseDeadLock(f,child);assert.equal(read(f.project,'index.html'),'<h1>Direction B</h1>');assert(fs.existsSync(path.join(f.project,'src/Hero.tsx')));
  const record=listIntegrations(f.output)[0];assert.equal(record.appliedAt,null);recoverIntegration(f.output,record.id,f.project);assertRestored(f);
});

test('real rollback interruption has a persisted intent; recover continues after a second interruption',t=>{
  const f=setup(t),record=integrateVariant(f.output,'B',f.staging,f.project,f.planFile);
  assert(record.appliedAt);
  const child=cliFault(f,'rollback',`if(to===${JSON.stringify(path.join(f.project,'index.html'))}){rename(from,to);process.kill(process.pid,'SIGKILL');}`);
  releaseDeadLock(f,child);assert.equal(read(f.project,'index.html'),'<h1>Original</h1>');assert(fs.existsSync(path.join(f.project,'src/Hero.tsx')));
  assert.throws(()=>rollbackIntegration(f.output,record.id,f.project),/use recover/);
  // Interrupt after deleting the created file but before recording restoration completion.
  const again=cliFault(f,'recover',`if(to.includes('/.integrations/')&&!to.includes('/recovery/'))process.kill(process.pid,'SIGKILL');`);
  releaseDeadLock(f,again);assert(!fs.existsSync(path.join(f.project,'src/Hero.tsx')));
  recoverIntegration(f.output,record.id,f.project);assertRestored(f);
});

test('recovery itself killed while restoring a partial apply can be resumed',t=>{
  const f=setup(t),child=cliFault(f,'apply',`if(to.includes('/.integrations/')&&!to.includes('/recovery/'))process.kill(process.pid,'SIGKILL');`);
  releaseDeadLock(f,child);
  const again=cliFault(f,'recover',`if(to===${JSON.stringify(path.join(f.project,'index.html'))}){rename(from,to);process.kill(process.pid,'SIGKILL');}`);
  releaseDeadLock(f,again);assert.equal(read(f.project,'index.html'),'<h1>Original</h1>');assert(fs.existsSync(path.join(f.project,'src/Hero.tsx')));
  recoverIntegration(f.output,listIntegrations(f.output)[0].id,f.project);assertRestored(f);
});

test('ordinary I/O failure restores original targets and retains backup evidence',t=>{
  const f=setup(t),child=cliFault(f,'apply',`if(to===${JSON.stringify(path.join(f.project,'src/Hero.tsx'))})throw new Error('injected disk failure');`);
  assert.equal(child.status,1);assert.match(child.stderr,/injected disk failure.*Original targets restored/);
  assertRestored(f);assert.equal(listIntegrations(f.output)[0].appliedAt,null);
  assert(!fs.existsSync(path.join(f.output,'.variant-lock')));
});

test('failed automatic restoration preserves its backup and executable recovery path',t=>{
  const f=setup(t),child=cliFault(f,'apply',`if(to===${JSON.stringify(path.join(f.project,'src/Hero.tsx'))}||to===${JSON.stringify(path.join(f.project,'index.html'))}&&++calls===2)throw new Error('injected disk failure');`);
  assert.equal(child.status,1);assert.match(child.stderr,/Recovery failed:.*Backup retained.*Recover: node/);
  assert.equal(read(f.project,'index.html'),'<h1>Direction B</h1>');
  recoverIntegration(f.output,listIntegrations(f.output)[0].id,f.project);assertRestored(f);
});

test('later edit during failed apply is preserved and blocks automatic recovery before any restoration',t=>{
  const f=setup(t),child=cliFault(f,'apply',`if(to===${JSON.stringify(path.join(f.project,'index.html'))}){rename(from,to);fs.writeFileSync(to,'later user edit');return;}if(to===${JSON.stringify(path.join(f.project,'src/Hero.tsx'))})throw new Error('disk failure');`);
  assert.equal(child.status,1);assert.match(child.stderr,/Recovery conflict.*index.html.*Backup retained/);
  assert.equal(read(f.project,'index.html'),'later user edit');assert(!fs.existsSync(path.join(f.project,'src/Hero.tsx')));
  const id=listIntegrations(f.output)[0].id;assert.throws(()=>recoverIntegration(f.output,id,f.project),/Recovery conflict/);
  assert.equal(read(f.project,'index.html'),'later user edit');assert.equal(listIntegrations(f.output)[0].rolledBackAt,null);
});

test('failed intent publication leaves no truncated intent or target writes and can be retried',t=>{
  const g=setup(t),integrated=integrateVariant(g.output,'B',g.staging,g.project,g.planFile),hook=path.join(g.project,'.variant-work','intent-fault.mjs');
  fs.writeFileSync(hook,`import fs from 'node:fs';const link=fs.linkSync;fs.linkSync=function(from,to){if(to.includes('/recovery/'))throw new Error('intent disk failure');return link(from,to)};`);
  const failed=spawnSync(process.execPath,['--import',hook,helper,'rollback',g.output,integrated.id,g.project],{encoding:'utf8'});
  assert.equal(failed.status,1);assert.match(failed.stderr,/intent disk failure/);assert.equal(read(g.project,'index.html'),'<h1>Direction B</h1>');assert(fs.existsSync(path.join(g.project,'src/Hero.tsx')));
  assert(!fs.existsSync(path.join(g.output,'.integrations/recovery',integrated.id+'.json')));
  rollbackIntegration(g.output,integrated.id,g.project);assertRestored(g);
});

test('completed integrations cannot use recover to bypass strict rollback, including legacy backups',t=>{
  const f=setup(t),record=integrateVariant(f.output,'B',f.staging,f.project,f.planFile);
  for(const legacy of [false,true]){
    if(legacy){const file=path.join(f.output,'.integrations',record.id+'.json'),saved=JSON.parse(fs.readFileSync(file));delete saved.appliedAt;fs.writeFileSync(file,JSON.stringify(saved));}
    fs.writeFileSync(path.join(f.project,'index.html'),'<h1>Original</h1>');
    assert.throws(()=>recoverIntegration(f.output,record.id,f.project),/requires rollback/);
    assert.throws(()=>rollbackIntegration(f.output,record.id,f.project),/changed after integration/);
    assert(fs.existsSync(path.join(f.project,'src/Hero.tsx')));
  }
  fs.writeFileSync(path.join(f.project,'index.html'),'<h1>Direction B</h1>');rollbackIntegration(f.output,record.id,f.project);assertRestored(f);
});

test('recovery preflight refuses later edits, invalid backups, protected paths and symlinks without writes',t=>{
  for(const mutation of ['edit','missing','new-file','bytes','duplicate','protected','symlink','intent']){
    const f=setup(t),child=cliFault(f,'apply',`if(to===${JSON.stringify(path.join(f.project,'index.html'))}){rename(from,to);process.kill(process.pid,'SIGKILL');}`);
    releaseDeadLock(f,child);
    const id=listIntegrations(f.output)[0].id,file=path.join(f.output,'.integrations',id+'.json'),saved=JSON.parse(fs.readFileSync(file));
    if(mutation==='edit')fs.writeFileSync(path.join(f.project,'index.html'),'user edit');
    if(mutation==='missing')fs.unlinkSync(path.join(f.project,'index.html'));
    if(mutation==='new-file')fs.writeFileSync(path.join(f.project,'src/Hero.tsx'),'user file');
    if(mutation==='bytes')saved.files.find(e=>e.action==='overwrite').before.content=Buffer.from('corrupt').toString('base64');
    if(mutation==='duplicate')saved.files.push(saved.files[0]);
    if(mutation==='protected')saved.files[0].path='.git/config';
    if(mutation==='symlink'){fs.renameSync(path.join(f.project,'index.html'),path.join(f.project,'actual.html'));fs.symlinkSync('actual.html',path.join(f.project,'index.html'));}
    if(mutation==='intent'){const dir=path.join(f.output,'.integrations/recovery');fs.mkdirSync(dir);fs.writeFileSync(path.join(dir,id+'.json'),JSON.stringify({schemaVersion:1,integrationId:id,backupHash:'wrong'}));}
    if(['bytes','duplicate','protected'].includes(mutation))fs.writeFileSync(file,JSON.stringify(saved));
    const before=fs.existsSync(path.join(f.project,'index.html'))?read(f.project,'index.html'):null,hero=fs.existsSync(path.join(f.project,'src/Hero.tsx'))?read(f.project,'src/Hero.tsx'):null,backup=fs.readFileSync(file);
    assert.throws(()=>recoverIntegration(f.output,id,f.project),/Recovery conflict|Invalid|protected|Symlink|differs/);
    assert.equal(fs.existsSync(path.join(f.project,'index.html'))?read(f.project,'index.html'):null,before);
    assert.equal(fs.existsSync(path.join(f.project,'src/Hero.tsx'))?read(f.project,'src/Hero.tsx'):null,hero);assert.deepEqual(fs.readFileSync(file),backup);
  }
});

test('automatically discovered shared dependency drift refuses integration before target/backup writes',t=>{
 for(const kind of ['provider','data','css','asset','ambient','alias','resolution']){
  const {project,output,staging}=setup(t),write=(file,text)=>{const full=path.join(project,file);fs.mkdirSync(path.dirname(full),{recursive:true});fs.writeFileSync(full,text)};
  write('tsconfig.json','{"compilerOptions":{"baseUrl":".","paths":{"@/*":["src/*"]}},"include":["src"]}');write('src/provider.ts',`import data from './data.json';import './global.css';import mark from './mark.svg';export const shared={data,mark};`);write('src/data.json','{"x":1}');write('src/global.css','body{color:blue}');write('src/mark.svg','<svg/>');write('src/env.d.ts','declare const flag: string;');
  fs.appendFileSync(path.join(output,'VariantB.tsx'),`\nimport {shared} from '@/provider';console.log(shared);`);
  const plan=path.join(project,'.variant-work',`shared-${kind}.json`),prepared=prepareIntegration(output,'B',['index.html','src/Hero.tsx','src/App.tsx'],plan,project),context=read(output,'.variant-context.json');assert(prepared.source.dependencyClosure.files['src/provider.ts']);
  const changes={provider:['src/provider.ts','export const shared=2;'],data:['src/data.json','{"x":2}'],css:['src/global.css','body{color:red}'],asset:['src/mark.svg','<svg><path/></svg>'],ambient:['src/env.d.ts','declare const flag: number;'],alias:['tsconfig.json','{"compilerOptions":{"paths":{"@/*":["different/*"]}},"include":["src"]}'],resolution:['.variant-work/dependency-resolution.json','{"schemaVersion":1,"entries":["src/provider.ts"]}']};write(...changes[kind]);
  assert.throws(()=>integrateVariant(output,'B',staging,project,plan),/shared dependencies/);assert.equal(read(project,'index.html'),'<h1>Original</h1>');assert.equal(read(output,'.variant-context.json'),context);assert.deepEqual(listIntegrations(output),[]);assert(fs.existsSync(path.join(staging,'index.html')));
 }
});
test('fresh shared-dependency plans integrate and roll back while old missing-closure plans refuse',t=>{
 const {project,output,staging}=setup(t),plan=path.join(project,'.variant-work','closure.json');
 const prepared=prepareIntegration(output,'B',['index.html','src/Hero.tsx','src/App.tsx'],plan,project);assert.equal(prepared.source.dependencyClosure.coverage.status,'within-supported-static-syntax');
 const legacy=path.join(project,'.variant-work','legacy.json'),saved=structuredClone(prepared);delete saved.source.dependencyClosure;fs.writeFileSync(legacy,JSON.stringify(saved));assert.throws(()=>integrateVariant(output,'B',staging,project,legacy),/Integration conflict/);
 const before=read(output,'.variant-context.json'),record=integrateVariant(output,'B',staging,project,plan);assert(record.source.dependencyClosure.files['variant-output/VariantB.tsx']);rollbackIntegration(output,record.id,project);assert.equal(read(project,'index.html'),'<h1>Original</h1>');assert.equal(read(output,'.variant-context.json'),before);
});
test('rollback refuses without writing when the user edited an integrated file afterwards',t=>{
  const {project,output,staging,planFile}=setup(t);
  const record=integrateVariant(output,'B',staging,project,planFile);
  fs.writeFileSync(path.join(project,'index.html'),'<h1>Direction B, edited by hand</h1>');
  assert.throws(()=>rollbackIntegration(output,record.id),/changed after integration.*index\.html/);
  assert.equal(read(project,'index.html'),'<h1>Direction B, edited by hand</h1>');assert.equal(fs.existsSync(path.join(project,'src','Hero.tsx')),true);
  assert.equal(listIntegrations(output)[0].rolledBackAt,null);
});
test('protected targets and staging inside variant output are refused before any write',t=>{
  const {project,output,staging,planFile}=setup(t);
  for(const target of ['variant-output/VariantB.tsx','.git/config','node_modules/x/index.js']){
    const dir=fs.mkdtempSync(path.join(project,'.variant-work','bad-'));fs.mkdirSync(path.dirname(path.join(dir,target)),{recursive:true});fs.writeFileSync(path.join(dir,target),'x');
    assert.throws(()=>integrateVariant(output,'B',dir),/protected path/);
  }
  assert.throws(()=>integrateVariant(output,'B',output),/outside variant output/);
  assert.equal(read(project,'index.html'),'<h1>Original</h1>');assert.deepEqual(listIntegrations(output),[]);
  assert.throws(()=>integrateVariant(output,'D',staging),/Register variant/);
});


test('integration refuses source and target drift since planning without touching user work',t=>{
 for (const drift of ['source','target','created','missing','targets','version']) {
  const {project,output,staging,planFile}=setup(t);
  if(drift==='source')fs.appendFileSync(path.join(output,'VariantB.tsx'),'// edited');
  if(drift==='target')fs.writeFileSync(path.join(project,'index.html'),'user edit');
  if(drift==='created')fs.writeFileSync(path.join(project,'src/Hero.tsx'),'user file');
  if(drift==='missing')fs.unlinkSync(path.join(project,'index.html'));
  if(drift==='targets')fs.writeFileSync(path.join(staging,'extra.html'),'extra');
  if(drift==='version'){const file=path.join(output,'.variant-context.json'),state=JSON.parse(fs.readFileSync(file));state.variants.B.version++;fs.writeFileSync(file,JSON.stringify(state));}
  const before=fs.existsSync(path.join(project,'index.html'))?read(project,'index.html'):null;
  assert.throws(()=>integrateVariant(output,'B',staging,project,planFile),/Integration conflict/);
  assert.equal(fs.existsSync(path.join(project,'index.html'))?read(project,'index.html'):null,before);
  assert.deepEqual(listIntegrations(output),[]);
  assert.ok(fs.existsSync(path.join(staging,'index.html')));
 }
});
test('integration requires a new plan, keeps source identity and ignores selection-only changes',t=>{
 const {project,output,staging,planFile}=setup(t);
 assert.throws(()=>integrateVariant(output,'B',staging),/Missing integration baseline/);
 assert.throws(()=>prepareIntegration(output,'B',['index.html'],planFile),/EEXIST/);
 const file=path.join(output,'.variant-context.json'),state=JSON.parse(fs.readFileSync(file));state.selectedVariant='C';fs.writeFileSync(file,JSON.stringify(state));
 const record=integrateVariant(output,'B',staging,project,planFile);
 assert.ok(record.source.files['VariantB.tsx']);assert.equal(readContext(output).selectedVariant,'C');
 assert.throws(()=>integrateVariant(output,'B',staging,project,planFile),/target changed/);
});

test('integration shares the history lock and rejects plans outside the working directory',t=>{
 const {project,output,staging,planFile}=setup(t);
 assert.throws(()=>prepareIntegration(output,'B',['index.html'],path.join(project,'plan.json')),/inside project/);
 fs.mkdirSync(path.join(output,'.variant-lock'));
 assert.throws(()=>integrateVariant(output,'B',staging,project,planFile),/Another history operation/);
 assert.equal(read(project,'index.html'),'<h1>Original</h1>');
 fs.rmdirSync(path.join(output,'.variant-lock'));
 integrateVariant(output,'B',staging,project,planFile);
});

test('integration rejects registered extension or adoption drift without writing targets or a backup',t=>{
 for(const change of ['extension','binding']){
  const {project,output,staging}=setup(t),context=path.join(output,'.variant-context.json'),state=readContext(output),extension=path.join(project,'extension.css');
  fs.writeFileSync(extension,':root{--color-text:#111}');state.designSystem.extensions=['extension.css'];state.variants.B.systemBinding={status:'pending',digest:'approved-system'};fs.writeFileSync(context,JSON.stringify(state));
  const planFile=path.join(project,'.variant-work','system-plan.json');prepareIntegration(output,'B',['index.html','src/Hero.tsx','src/App.tsx'],planFile);
  if(change==='extension')fs.appendFileSync(extension,'\n/* edited after planning */');else{state.variants.B.systemBinding.status='applied';fs.writeFileSync(context,JSON.stringify(state));}
  assert.throws(()=>integrateVariant(output,'B',staging,project,planFile),/Integration conflict/);assert.equal(read(project,'index.html'),'<h1>Original</h1>');assert.equal(fs.existsSync(path.join(project,'src/Hero.tsx')),false);assert.deepEqual(listIntegrations(output),[]);assert.ok(fs.existsSync(path.join(staging,'index.html')));
 }
});

test('integration records extension hashes and binding while selection changes and safe rollback remain independent',t=>{
 const {project,output,staging}=setup(t),context=path.join(output,'.variant-context.json'),state=readContext(output),extension=path.join(project,'extension.css');fs.writeFileSync(extension,':root{--color-text:#111}');state.designSystem.extensions=['extension.css'];state.variants.B.systemBinding={status:'applied',digest:'approved-system'};fs.writeFileSync(context,JSON.stringify(state));
 const planFile=path.join(project,'.variant-work','system-plan.json');prepareIntegration(output,'B',['index.html','src/Hero.tsx','src/App.tsx'],planFile);state.selectedVariant='C';state.activeVariant='A';fs.writeFileSync(context,JSON.stringify(state));
 const record=integrateVariant(output,'B',staging,project,planFile);assert.ok(record.source.designSystemExtensionHashes['extension.css']);assert.equal(record.source.systemBinding.status,'applied');assert.equal(readContext(output).selectedVariant,'C');
 fs.appendFileSync(extension,'\n/* user edited shared tokens after integration */');const bytes=fs.readFileSync(extension);rollbackIntegration(output,record.id);assert.equal(read(project,'index.html'),'<h1>Original</h1>');assert.deepEqual(fs.readFileSync(extension),bytes);assert.equal(readContext(output).selectedVariant,'C');
});

test('integration refuses old missing extension coverage and unsafe registered extensions',t=>{
 const {project,output,staging}=setup(t),context=path.join(output,'.variant-context.json'),state=readContext(output),extension=path.join(project,'extension.css');fs.writeFileSync(extension,':root{--color-text:#111}');state.designSystem.extensions=['extension.css'];fs.writeFileSync(context,JSON.stringify(state));
 const planFile=path.join(project,'.variant-work','system-plan.json'),plan=prepareIntegration(output,'B',['index.html','src/Hero.tsx','src/App.tsx'],planFile);delete plan.source.designSystemExtensionHashes;const legacy=path.join(project,'.variant-work','legacy-plan.json');fs.writeFileSync(legacy,JSON.stringify(plan),{flag:'wx'});assert.throws(()=>integrateVariant(output,'B',staging,project,legacy),/Integration conflict/);
 fs.renameSync(extension,path.join(project,'real-extension.css'));fs.symlinkSync(path.join(project,'real-extension.css'),extension);assert.throws(()=>integrateVariant(output,'B',staging,project,planFile),/symbolic|symlink/i);
 for(const extensions of [null,'extension.css',[''],['../outside.css']]){state.designSystem.extensions=extensions;fs.writeFileSync(context,JSON.stringify(state));const next=path.join(project,'.variant-work','unsafe-plan.json');assert.throws(()=>prepareIntegration(output,'B',['index.html'],next),/relative/);assert.equal(fs.existsSync(next),false)}
 assert.equal(read(project,'index.html'),'<h1>Original</h1>');assert.deepEqual(listIntegrations(output),[]);
});
