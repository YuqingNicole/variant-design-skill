import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fixture } from '../tests/fixture.mjs';
import { readContext } from './variant-history.mjs';
import { prepareIntegration, integrateVariant, rollbackIntegration, listIntegrations } from './variant-integrate.mjs';
function setup(t) {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'variant-integrate-'));
  t.after(()=>fs.rmSync(project,{recursive:true,force:true}));
  const output=path.join(project,'variant-output'), staging=path.join(project,'.variant-work','integrate-B');
  fixture(output);fs.mkdirSync(path.join(project,'src'));
  fs.writeFileSync(path.join(project,'index.html'),'<h1>Original</h1>');fs.writeFileSync(path.join(project,'src','App.tsx'),'export const App=()=>null;');
  fs.mkdirSync(path.join(staging,'src'),{recursive:true});
  fs.writeFileSync(path.join(staging,'index.html'),'<h1>Direction B</h1>');fs.writeFileSync(path.join(staging,'src','Hero.tsx'),'export const Hero=()=>null;');
  fs.writeFileSync(path.join(staging,'src','App.tsx'),'export const App=()=>null;');
  const planFile=path.join(project,'.variant-work','plan.json');
  prepareIntegration(output,'B',['index.html','src/Hero.tsx','src/App.tsx'],planFile);
  return {project,output,staging,planFile};
}
const read=(project,file)=>fs.readFileSync(path.join(project,file),'utf8');
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
