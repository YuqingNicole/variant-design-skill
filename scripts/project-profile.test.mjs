import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { discoverProject, inspectProfile } from './project-profile.mjs';
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'project-profile-'));
  t.after(() => fs.rmSync(root, { recursive:true, force:true }));
  const put = (name, text) => { fs.mkdirSync(path.dirname(path.join(root,name)),{recursive:true}); fs.writeFileSync(path.join(root,name),text); };
  return {root,put};
}
test('HTML dependency discovery is read-only and does not expose contents or execute scripts', t => {
  const {root,put}=fixture(t);
  put('index.html','<link href="./style.css"><script src="./app.js"></script>');
  put('style.css','body {font-family: Georgia}'); put('app.js','fetch("/purchase")');
  put('package.json',JSON.stringify({scripts:{start:'touch SHOULD_NOT_EXIST'},dependencies:{vite:'7'}}));
  put('.env','SECRET_VALUE_123'); put('credentials/key.pem','PRIVATE_KEY_123');
  const before=fs.readFileSync(path.join(root,'index.html'));
  const p=discoverProject(root,'index.html');
  assert.deepEqual(Object.keys(p.dependencyScope.files).sort(),['app.js','index.html','package.json','style.css']);
  assert.equal(p.environment.declarations.vite.declared,true);
  assert.equal(inspectProfile(p).status,'current-within-declared-scope');
  assert.ok(!JSON.stringify(p).includes('SECRET_VALUE_123'));
  assert.ok(!JSON.stringify(p).includes('touch SHOULD_NOT_EXIST'));
  assert.ok(!fs.existsSync(path.join(root,'SHOULD_NOT_EXIST')));
  assert.deepEqual(fs.readFileSync(path.join(root,'index.html')),before);
  put('style.css','body {font-family: Arial}');
  assert.equal(inspectProfile(p).status,'stale');
});
test('React traverses local components, flags aliases and runtime dependencies',t=>{
  const {root,put}=fixture(t);
  put('src/Page.tsx',`import Nav from './Nav'; import '@/theme'; import('optional'); export default Nav;`);
  put('src/Nav.tsx',`import './nav.css'; export default function Nav(){return <a href="/pricing">Pricing</a>}`);
  put('src/nav.css','nav { color:red }');
  const p=discoverProject(root,'src/Page.tsx');
  assert.ok(p.dependencyScope.files['src/Nav.tsx']);
  assert.ok(p.dependencyScope.files['src/nav.css']);
  assert.ok(p.unknowns.some(x=>x.code==='package-or-alias'));
  assert.ok(p.unknowns.some(x=>x.code==='dynamic-or-commonjs'));
  assert.equal(p.suitability.integration,'unverified');
  put('src/Nav.tsx',`import './other.css'`);put('src/other.css','');
  assert.equal(inspectProfile(p).status,'stale');
});
test('excludes traversal, secrets and symlinks even when referenced',t=>{
  const {root,put}=fixture(t);
  put('index.html','<script src="./.env"></script><script src="./link.js"></script>');
  put('.env','hidden');fs.symlinkSync(path.join(root,'.env'),path.join(root,'link.js'));
  const p=discoverProject(root,'index.html');
  assert.deepEqual(Object.keys(p.dependencyScope.files),['index.html']);
  for(const entry of ['../outside','.env','link.js']) assert.throws(()=>discoverProject(root,entry));
  assert.throws(()=>inspectProfile({schemaVersion:99}));
});
test('records dirty Git state without changing tracked content',t=>{
  const {root,put}=fixture(t);execFileSync('git',['init','-q'],{cwd:root});
  put('index.html','<main>Hello</main>');execFileSync('git',['add','index.html'],{cwd:root});
  const p=discoverProject(root,'index.html');
  assert.equal(p.workingTree.status,'observed');assert.equal(p.workingTree.entries[0].status,'A ');
  put('index.html','<main>Edited</main>');
  assert.equal(inspectProfile(p).status,'stale');
  assert.equal(fs.readFileSync(path.join(root,'index.html'),'utf8'),'<main>Edited</main>');
});
