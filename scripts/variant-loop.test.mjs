import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fixture } from '../tests/fixture.mjs';
import { applyVariant, undoVariant, readContext } from './variant-history.mjs';
import { buildPreview } from './build-preview.mjs';
function setup(t) {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'variant-loop-'));
  t.after(()=>fs.rmSync(base,{recursive:true,force:true}));
  const root=path.join(base,'output'), candidate=path.join(base,'candidate');
  fixture(root);fs.cpSync(root,candidate,{recursive:true});return {root,candidate};
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
