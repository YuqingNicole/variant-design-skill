import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fixture } from '../tests/fixture.mjs';
import { prepareVariant, applyVariant, undoVariant, recoverVariant, readContext } from './variant-history.mjs';
import { buildPreview } from './build-preview.mjs';
function setup(t) {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'variant-loop-'));
  t.after(()=>fs.rmSync(base,{recursive:true,force:true}));
  const root=path.join(base,'output'), candidate=path.join(base,'candidate');
  fixture(root);prepareVariant(root,'B',candidate);return {root,candidate};
}
test('locked tokens reject changes before overwriting; active edit is not selection',t=>{
  const {root,candidate}=setup(t);
  assert.throws(()=>applyVariant(root,'B',candidate,{summary:'font change',tokens:{fonts:['Arial']}}),/Locked/);
  applyVariant(root,'B',candidate,{summary:'layout review'});
  assert.equal(readContext(root).selectedVariant,'A');assert.equal(readContext(root).activeVariant,'B');
});
test('hero-only patch rejects outside changes, preserves other bytes, undo restores B metadata and files',t=>{
  const {root,candidate}=setup(t), file='VariantB.tsx', original=fs.readFileSync(path.join(root,file),'utf8');
  fs.writeFileSync(path.join(candidate,file),original.replace('Evidence retained','Changed footer'));
  assert.throws(()=>applyVariant(root,'B',candidate,{summary:'bad scope',zone:'hero'}),/Outside-zone/);
  assert.equal(fs.readFileSync(path.join(root,file),'utf8'),original);
  const prior=readContext(root);
  fs.writeFileSync(path.join(candidate,file),original.replace('Direction B','Investigate B'));
  applyVariant(root,'B',candidate,{summary:'hero title',zone:'hero',comparison:{optimizes:'Evidence',tradeoff:'Density',bestFor:'Audits'}});
  assert.match(fs.readFileSync(path.join(root,file),'utf8'),/Investigate B/);
  undoVariant(root,'B');
  assert.equal(fs.readFileSync(path.join(root,file),'utf8'),original);
  const next=readContext(root);assert.deepEqual(next.variants.A,prior.variants.A);assert.deepEqual(next.variants.C,prior.variants.C);
  assert.deepEqual(next.variants.B.tokens,prior.variants.B.tokens);assert.deepEqual(next.variants.B.comparison,prior.variants.B.comparison);
  assert.equal(next.selectedVariant,'A');assert.equal(next.variants.B.version,3);
  assert.throws(()=>undoVariant(root,'B'),/No earlier/);
});
test('a zone marked in both styles and markup accepts edits inside either pair only',t=>{
  const base=fs.mkdtempSync(path.join(os.tmpdir(),'variant-zone-'));t.after(()=>fs.rmSync(base,{recursive:true,force:true}));
  const root=path.join(base,'output'),file='VariantB.tsx';fixture(root);
  const original=`const css=`+'`/* zone:hero:start */h1{color:red}/* zone:hero:end */ footer{color:blue}`'+`;\n`+fs.readFileSync(path.join(root,file),'utf8');
  fs.writeFileSync(path.join(root,file),original);
  const outside=path.join(base,'outside');prepareVariant(root,'B',outside);
  fs.writeFileSync(path.join(outside,file),original.replace('footer{color:blue}','footer{color:green}'));
  assert.throws(()=>applyVariant(root,'B',outside,{summary:'footer style',zone:'hero'}),/Outside-zone/);
  const inside=path.join(base,'inside');prepareVariant(root,'B',inside);
  fs.writeFileSync(path.join(inside,file),original.replace('h1{color:red}','h1{color:teal}').replace('Direction B','Tidal B'));
  applyVariant(root,'B',inside,{summary:'hero style and copy',zone:'hero'});
  assert.match(fs.readFileSync(path.join(root,file),'utf8'),/h1\{color:teal\}[\s\S]*Tidal B/);
});
test('applies sharing a request id undo together; a different request stays separate',t=>{
  const {root,candidate}=setup(t),file='VariantB.tsx',original=fs.readFileSync(path.join(root,file),'utf8');
  fs.writeFileSync(path.join(candidate,file),original.replace('Direction B','Earlier B'));
  applyVariant(root,'B',candidate,{summary:'earlier request',zone:'hero',request:'r1'});
  const steps=[['Earlier B','Tidal B'],['Tidal B','Tidal-B']];
  steps.forEach(([from,to],i)=>{const next=path.join(path.dirname(candidate),`step-${i}`);prepareVariant(root,'B',next);
    fs.writeFileSync(path.join(next,file),fs.readFileSync(path.join(next,file),'utf8').replace(from,to));
    applyVariant(root,'B',next,{summary:`vary subtle step ${i}`,zone:'hero',request:'r2'});});
  assert.match(fs.readFileSync(path.join(root,file),'utf8'),/Tidal-B/);
  undoVariant(root,'B');
  assert.match(fs.readFileSync(path.join(root,file),'utf8'),/Earlier B/);
  const state=readContext(root);assert.equal(state.variants.B.undo.length,1);assert.equal(state.variants.B.history.at(-1).restoredSnapshots.length,2);
  undoVariant(root,'B');assert.equal(fs.readFileSync(path.join(root,file),'utf8'),original);
  assert.throws(()=>applyVariant(root,'B',candidate,{summary:'bad',request:''}),/request/);
});
test('React comparison writes three real mounts, escapes summary text',t=>{
  const {root}=setup(t);const context=readContext(root);context.recommendation.reason='<script>bad()</script>';
  fs.writeFileSync(path.join(root,'.variant-context.json'),JSON.stringify(context));
  const result=buildPreview(root);assert.equal(result.react,true);
  for(const id of ['A','B','C'])assert.match(fs.readFileSync(path.join(root,`_preview/${id}.tsx`),'utf8'),new RegExp(`Variant${id}`));
  assert.match(fs.readFileSync(path.join(root,'_compare.html'),'utf8'),/&lt;script&gt;/);
});
test('focus-visible keyword and CSS reduced-motion do not hide unsafe JS/focus',t=>{
  const {root}=setup(t), bad=path.join(root,'bad.html');
  fs.writeFileSync(bad,'<style>button:focus-visible{outline:none}@media(prefers-reduced-motion:reduce){*{animation:none}}</style><script>requestAnimationFrame(tick)</script>');
  let output;try{execFileSync(process.execPath,['scripts/quality-gate.mjs',bad,'--strict','--json']);}catch(e){output=JSON.parse(e.stdout.toString());}
  assert.ok(output.findings.some(f=>f.rule==='focus-visible-suppressed'));assert.ok(output.findings.some(f=>f.rule==='js-motion-review'));
});
test('quality gate flags disabled zoom, transition-all and blocked paste in JSX',t=>{
  const {root}=setup(t), bad=path.join(root,'Bad.tsx'), good=path.join(root,'Good.tsx');
  fs.writeFileSync(bad,'export const viewport={width:"device-width",maximumScale:1,userScalable:false};\nexport const Code=()=><input className="transition-all" onPaste={(e)=>e.preventDefault()}/>;');
  fs.writeFileSync(good,'export const viewport={width:"device-width",initialScale:1,maximumScale:5};\nexport const Code=()=><input className="transition-colors" onPaste={handlePaste}/>;');
  const scan=file=>{let out;try{out=execFileSync(process.execPath,['scripts/quality-gate.mjs',file,'--json'],{encoding:'utf8'});}catch(e){out=e.stdout;}return JSON.parse(out).findings.map(f=>f.rule);};
  const rules=scan(bad);for(const rule of ['zoom-disabled','transition-all','paste-blocked'])assert.ok(rules.includes(rule),rule);
  assert.deepEqual(scan(good).filter(r=>['zoom-disabled','transition-all','paste-blocked'].includes(r)),[]);
});
test('quality gate skips generated preview bundles in an output directory',t=>{
  const {root}=setup(t);
  for(const dir of ['_static','_preview']){fs.mkdirSync(path.join(root,dir),{recursive:true});fs.writeFileSync(path.join(root,dir,'A.html'),'<img src="bundled.png"><div style="transition: all 1s">');}
  let out;try{out=execFileSync(process.execPath,['scripts/quality-gate.mjs',root,'--json'],{encoding:'utf8'});}catch(e){out=e.stdout;}
  assert.deepEqual(JSON.parse(out).findings.filter(f=>/_static|_preview/.test(f.file)),[]);
});
test('undo preserves edits made outside the history helper and releases its lock', t => {
  const {root,candidate}=setup(t);
  applyVariant(root,'B',candidate,{summary:'baseline'});
  const file=path.join(root,'VariantB.tsx');fs.appendFileSync(file,'\n// user edit');
  const context=fs.readFileSync(path.join(root,'.variant-context.json'),'utf8');
  assert.throws(()=>undoVariant(root,'B'),/Files changed/);
  assert.match(fs.readFileSync(file,'utf8'),/user edit/);
  assert.equal(fs.readFileSync(path.join(root,'.variant-context.json'),'utf8'),context);
  assert.equal(fs.existsSync(path.join(root,'.variant-lock')),false);
});
test('two sequential undo operations restore their own revision despite advancing versions', t => {
  const {root,candidate}=setup(t),file='VariantB.tsx',original=fs.readFileSync(path.join(root,file),'utf8');
  for (const title of ['First B','Second B']) {
    fs.rmSync(candidate,{recursive:true});prepareVariant(root,'B',candidate);
    fs.writeFileSync(path.join(candidate,file),original.replace('Direction B',title));
    applyVariant(root,'B',candidate,{summary:title,zone:'hero'});
  }
  undoVariant(root,'B');assert.match(fs.readFileSync(path.join(root,file),'utf8'),/First B/);
  undoVariant(root,'B');assert.equal(fs.readFileSync(path.join(root,file),'utf8'),original);
});
test('concurrent and legacy operations fail without overwriting current work', t => {
  const {root,candidate}=setup(t);
  fs.mkdirSync(path.join(root,'.variant-lock'));
  assert.throws(()=>applyVariant(root,'B',candidate,{summary:'locked'}),/Another history/);
  fs.rmdirSync(path.join(root,'.variant-lock'));
  applyVariant(root,'B',candidate,{summary:'legacy fixture'});
  const key=readContext(root).variants.B.undo.at(-1),file=path.join(root,key),saved=JSON.parse(fs.readFileSync(file));
  delete saved.expectedAfter;fs.writeFileSync(file,JSON.stringify(saved));
  assert.throws(()=>undoVariant(root,'B'),/Legacy snapshot/);
  const destination=path.join(path.dirname(root),'recovery');
  const context=fs.readFileSync(path.join(root,'.variant-context.json'),'utf8');
  recoverVariant(root,'B',destination);
  assert.equal(fs.readFileSync(path.join(destination,'VariantB.tsx'),'utf8'),Buffer.from(saved.files['VariantB.tsx'],'base64').toString());
  assert.equal(fs.readFileSync(path.join(root,'.variant-context.json'),'utf8'),context);
  assert.throws(()=>recoverVariant(root,'B',destination),/EEXIST/);
});

function tree(root) {
  return Object.fromEntries(fs.readdirSync(root,{recursive:true}).filter(name=>fs.statSync(path.join(root,name)).isFile()).sort().map(name=>[name,fs.readFileSync(path.join(root,name)).toString('base64')]));
}
test('stale hero candidate preserves user edits, context, history and candidate',t=>{
  const {root,candidate}=setup(t),file='VariantB.tsx';
  fs.writeFileSync(path.join(candidate,file),fs.readFileSync(path.join(candidate,file),'utf8').replace('Direction B','Candidate hero'));
  fs.writeFileSync(path.join(root,file),fs.readFileSync(path.join(root,file),'utf8').replace('Direction B','New user hero'));
  const before=tree(root),staged=tree(candidate);
  assert.throws(()=>applyVariant(root,'B',candidate,{summary:'stale',zone:'hero'}),/Candidate conflict: file changed: VariantB.tsx/);
  assert.deepEqual(tree(root),before);assert.deepEqual(tree(candidate),staged);
  assert.equal(fs.existsSync(path.join(root,'.variant-lock')),false);
});
test('two candidates from one base cannot overwrite one another; selection alone is not a conflict',t=>{
  const {root,candidate}=setup(t),other=path.join(path.dirname(root),'other');prepareVariant(root,'B',other);
  const state=readContext(root);state.selectedVariant='C';fs.writeFileSync(path.join(root,'.variant-context.json'),JSON.stringify(state));
  applyVariant(root,'B',candidate,{summary:'first'});
  const before=tree(root);assert.throws(()=>applyVariant(root,'B',other,{summary:'stale second'}),/version changed/);
  assert.deepEqual(tree(root),before);assert.equal(readContext(root).selectedVariant,'C');
});
test('metadata, membership, missing files and entry changes are rejected without writes',t=>{
  for(const mutate of [
    (state,root)=>{state.variants.B.tokens={fonts:['Arial']};},
    state=>{state.variants.B.comparison.optimizes='Changed';},
    state=>{state.designSystem.confirmed=false;},
    state=>{state.taskContract={primaryJob:'Another task'};},
    (state,root)=>{state.variants.B.files.push('extra.css');fs.writeFileSync(path.join(root,'extra.css'),'body{}');},
    (state,root)=>{fs.unlinkSync(path.join(root,'VariantB.tsx'));},
    state=>{state.variants.B.entry='another.tsx';},
  ]){
    const {root,candidate}=setup(t),state=readContext(root);mutate(state,root);fs.writeFileSync(path.join(root,'.variant-context.json'),JSON.stringify(state));
    const before=tree(root);assert.throws(()=>applyVariant(root,'B',candidate,{summary:'conflict'}),/Candidate conflict/);assert.deepEqual(tree(root),before);
  }
});
test('shared design system content changes invalidate candidates even with unchanged metadata',t=>{
  const {root,candidate}=setup(t),project=path.dirname(root),state=readContext(root);
  state.designSystem.file='brand.css';fs.writeFileSync(path.join(project,'brand.css'),'body{font-family:Georgia}');fs.writeFileSync(path.join(root,'.variant-context.json'),JSON.stringify(state));
  fs.rmSync(candidate,{recursive:true});prepareVariant(root,'B',candidate);
  fs.writeFileSync(path.join(project,'brand.css'),'body{font-family:Arial}');const before=tree(root);
  assert.throws(()=>applyVariant(root,'B',candidate,{summary:'brand changed'}),/design system file content changed/);assert.deepEqual(tree(root),before);
});
test('missing, corrupt and unknown baselines cannot be retrofitted onto existing candidates',t=>{
  for(const value of [null,'not json',JSON.stringify({schemaVersion:99})]){
    const {root,candidate}=setup(t),manifest=path.join(candidate,'.candidate-baseline.json');
    if(value===null)fs.unlinkSync(manifest);else fs.writeFileSync(manifest,value);
    const before=tree(root),staged=tree(candidate);
    assert.throws(()=>applyVariant(root,'B',candidate,{summary:'legacy'}),/baseline/i);
    assert.throws(()=>prepareVariant(root,'B',candidate),/EEXIST/);
    assert.deepEqual(tree(root),before);assert.deepEqual(tree(candidate),staged);
  }
});
test('candidate baseline binds project and variant and preserves original bytes for reconciliation',t=>{
  const {root,candidate}=setup(t),saved=JSON.parse(fs.readFileSync(path.join(candidate,'.candidate-baseline.json')));
  assert.equal(Buffer.from(saved.files['VariantB.tsx'].content,'base64').toString(),fs.readFileSync(path.join(root,'VariantB.tsx'),'utf8'));
  assert.throws(()=>applyVariant(root,'A',candidate,{summary:'wrong variant'}),/different project or variant/);
  const other=path.join(path.dirname(root),'other-output');fixture(other);
  assert.throws(()=>applyVariant(other,'B',candidate,{summary:'wrong project'}),/different project or variant/);
});
test('incomplete candidates, illegal ownership and symlinks fail before any live write',t=>{
  const {root,candidate}=setup(t);fs.unlinkSync(path.join(candidate,'VariantB.tsx'));const before=tree(root);
  assert.throws(()=>applyVariant(root,'B',candidate,{summary:'missing'}),/ENOENT/);assert.deepEqual(tree(root),before);
  fs.symlinkSync(path.join(root,'VariantB.tsx'),path.join(candidate,'VariantB.tsx'));
  assert.throws(()=>applyVariant(root,'B',candidate,{summary:'symlink'}),/Symlink/);assert.deepEqual(tree(root),before);
  const state=readContext(root);state.variants.B.files=['../escape.tsx'];fs.writeFileSync(path.join(root,'.variant-context.json'),JSON.stringify(state));
  assert.throws(()=>prepareVariant(root,'B',path.join(path.dirname(root),'invalid')),/cannot be variant-owned|relative file paths/);
});
