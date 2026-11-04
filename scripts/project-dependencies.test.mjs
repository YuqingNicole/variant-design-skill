import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { collectProjectDependencies } from './project-dependencies.mjs';

const require = createRequire(new URL('../tests/package.json', import.meta.url));
const compiler = path.dirname(require.resolve('typescript/package.json'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
function setup(t, withCompiler = true) {
  const project = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'variant-closure-')));
  t.after(() => fs.rmSync(project, { recursive: true, force: true }));
  const write = (file, value) => { const full = path.join(project, file); fs.mkdirSync(path.dirname(full), { recursive: true }); fs.writeFileSync(full, value); };
  if (withCompiler) { fs.mkdirSync(path.join(project, 'node_modules')); fs.symlinkSync(compiler, path.join(project, 'node_modules/typescript'), process.platform === 'win32' ? 'junction' : 'dir'); }
  write('package.json', JSON.stringify({ dependencies: { react: '19.1.1' }, devDependencies: { typescript: '5.9.2' } }));
  return { project, write, collect: (entries = ['src/main.tsx'], options) => collectProjectDependencies(project, entries, options) };
}
test('real TypeScript AST finds transitive shared data/CSS/assets and ignores comments and strings', t => {
  const { write, collect } = setup(t);
  write('tsconfig.json', '{/* JSONC */"compilerOptions":{"baseUrl":".","paths":{"@/*":["src/*"]}},"include":["src"]}');
  write('src/main.tsx', `import React from 'react'; import {x} from '@/provider'; import './main.css'; const text="import './fake.ts'"; // import './also-fake.ts'\nexport const view=<h1>{x}</h1>;`);
  write('src/provider.ts', `export {default as x} from './data.json';`); write('src/data.json', '{"x":1}');
  write('src/main.css', `/* url(fake.png) */ @import './base.css'; h1{background:url('../assets/bg.png?v=1')}`); write('src/base.css', 'h1{color:blue}'); write('assets/bg.png', Buffer.from([0, 255, 4])); write('src/env.d.ts', 'declare const environment: string;');
  const result = collect(); assert.equal(result.coverage.status, 'within-supported-static-syntax');
  for (const file of ['src/provider.ts', 'src/data.json', 'src/main.css', 'src/base.css', 'assets/bg.png', 'src/env.d.ts']) assert(result.files[file], file);
  assert(!Object.keys(result.files).some(file => file.includes('fake'))); assert.equal(result.resolver.compiler.version, '5.9.2');
  assert.equal(result.identity, collect().identity);
});
test('HTML inline modules, quoted delimiters, CSS escapes, srcset and SVG references preserve actual file identity', t => {
  const { write, collect } = setup(t);
  write('index.html', `<!-- <img src="fake.png"> --><link rel="stylesheet" href="./style.css" title="a > b"><img src="./one.png" srcset="one.png 1x, two.png 2x"><style>@import './inline.css';</style><script type="module">import './runtime.js'; const s="import './fake.js'";</script><svg><use href="./icons.svg#mark"/></svg>`);
  for (const file of ['one.png', 'two.png', 'font.woff2']) write(file, Buffer.from([0, 2, 255]));
  write('style.css', `@font-face{src:url('./font\\2e woff2')} .x{background:url('./one.png')}`); write('inline.css', 'body{color:black}'); write('runtime.js', 'export const x=1'); write('icons.svg', '<svg><symbol id="mark"/></svg>');
  const result = collect(['index.html']); assert.equal(result.coverage.status, 'within-supported-static-syntax');
  for (const file of ['style.css', 'inline.css', 'runtime.js', 'icons.svg', 'font.woff2', 'one.png', 'two.png']) assert(result.files[file], file);
  assert(!JSON.stringify(result).includes('fake.'));
});
test('local config extends/references and reviewed adapter entries are bound without executing config', t => {
  const { project, write, collect } = setup(t);
  write('tsconfig.json', '{"extends":"./config/base.json","references":[{"path":"./types"}],"include":["src"]}');
  write('config/base.json', '{"compilerOptions":{"baseUrl":"..","paths":{"@/*":["src/*"]},"typeRoots":["../local-types"]}}'); write('types/tsconfig.json', '{"include":["ambient.d.ts"]}'); write('types/ambient.d.ts', 'declare const flag: boolean;');write('local-types/custom/index.d.ts','declare const customFlag: string;');
  write('src/main.tsx', `import React from 'react'; import {x} from '@/shared'; export default ()=> <h1>{x}</h1>`); write('src/shared.ts', 'export const x=1');
  write('vite.config.ts', `import './config/helper'; throw new Error('Do not execute this config');`); write('config/helper.ts', `throw new Error('Do not execute config imports'); export {};`);
  write('.variant-work/wrapper.tsx', `export {default} from '../src/main';`); write('.variant-work/dependency-resolution.json', JSON.stringify({ schemaVersion: 1, entries: ['.variant-work/wrapper.tsx'], aliases: { '~': 'src' }, configFiles: ['vite.config.ts'] }));
  const result = collect(); assert(result.files['config/helper.ts']); assert(result.files['types/ambient.d.ts']); assert(result.files['local-types/custom/index.d.ts']);assert(result.files['.variant-work/wrapper.tsx']); assert(result.files['.variant-work/dependency-resolution.json']); assert.equal(result.coverage.status, 'within-supported-static-syntax');
  const before = result.identity; write('types/ambient.d.ts', 'declare const flag: number;'); assert.notEqual(collect().identity, before); assert(!fs.existsSync(path.join(project, 'side-effect')));
});
test('missing, dynamic, unsupported and external references remain explicit without leaking their values', t => {
  const { write, collect } = setup(t);
  write('src/main.tsx', `import './missing'; import '@/unknown'; import '/@fs/private/file.ts'; const key='x'; import(key); require(key); import.meta.glob('./pages/*.tsx');`);
  write('index.html', '<img src="https://private:secret@example.invalid/photo?token=never-record-this"><base href="/app/">');
  const result = collect(), codes = result.coverage.unknowns.map(item => item.code); assert.equal(result.coverage.status, 'partial');
  for (const code of ['unresolved-local-reference', 'unresolved-package-or-alias', 'dynamic-module-reference', 'glob-needs-review', 'external-resource', 'html-base-needs-review', 'runtime-resolved-resource']) assert(codes.includes(code), code);
  assert(!JSON.stringify(result).includes('never-record-this')); assert(!JSON.stringify(result).includes('private:secret'));
});
test('missing compiler is unverified syntax coverage, not a lexical script success', t => {
  const { write, collect } = setup(t, false); write('src/main.tsx', 'export const view=<h1>Hi</h1>');
  const result = collect(); assert.equal(result.resolver.compiler, null); assert(result.coverage.unknowns.some(item => item.code === 'compiler-unavailable')); assert(result.files['src/main.tsx']);
});
test('new files, aliases and ambiguous candidates change the closure; every candidate is fingerprinted', t => {
  const { write, collect } = setup(t); write('src/main.tsx', `import './shared.js'; import '~data/value';`);
  const missing = collect(); write('src/shared.ts', 'export const x=1'); write('src/shared.js', 'export const x=2'); write('data/value.ts', 'export const x=3');
  write('.variant-work/dependency-resolution.json', JSON.stringify({ schemaVersion: 1, aliases: { '~data': 'data' } }));
  const found = collect(); assert.notEqual(found.identity, missing.identity); assert(found.files['src/shared.ts'] && found.files['src/shared.js'] && found.files['data/value.ts']); assert(found.coverage.unknowns.some(item => item.code === 'ambiguous-local-reference'));
  const before = found.identity; write('src/shared.js', 'export const x=4'); assert.notEqual(collect().identity, before);
});
test('unsafe references never read symlinks or sensitive paths and explicit unsafe roots are refused', t => {
  const { project, write, collect } = setup(t); write('.env', 'DO_NOT_COPY_SECRET'); write('src/main.tsx', `import '../.env'; import './linked'; import '../../outside';`);
  fs.symlinkSync(path.join(project, '.env'), path.join(project, 'src/linked.ts'));
  const result = collect(); assert.equal(result.coverage.status, 'partial'); assert(!result.files['.env'] && !result.files['src/linked.ts']); assert(!JSON.stringify(result).includes('DO_NOT_COPY_SECRET'));
  for (const file of ['../outside', '.env', 'src/linked.ts']) assert.throws(() => collect([file]), /Unsafe|Symlink/);
  write('.variant-work/dependency-resolution.json', '{"schemaVersion":1,"aliases":{"@":"../outside"}}'); assert.throws(() => collect(), /Unsafe/);
});
test('limits are explicit and binary assets are hashed in chunks, without raw contents', t => {
  const { write, collect } = setup(t); write('index.html', '<img src="large.bin">'); const asset = Buffer.alloc(1500000, 17); write('large.bin', asset);
  const result = collect(['index.html']); assert.equal(result.files['large.bin'].sha256, hash(asset)); assert.equal(result.coverage.status, 'within-supported-static-syntax');
  const limited = collect(['index.html'], { maxFiles: 2 }); assert.equal(limited.coverage.status, 'partial'); assert(Object.keys(limited.files).length <= 2);
  const tiny = collect(['index.html'], { maxBytes: 10 }); assert.equal(tiny.coverage.status, 'partial'); assert(Object.values(tiny.files).reduce((n, file) => n + file.bytes, 0) <= 10);
});
test('copying a project preserves closure identity; read-only collection leaves all source bytes unchanged', t => {
  const { project, write, collect } = setup(t); write('src/main.tsx', `import React from 'react'; export const view=<h1>Hi</h1>`);
  const before = fs.readFileSync(path.join(project, 'src/main.tsx')), original = collect();
  const copy = project + '-copy'; t.after(() => fs.rmSync(copy, { recursive: true, force: true })); fs.cpSync(project, copy, { recursive: true, filter: file => !path.relative(project, file).split(path.sep).includes('node_modules') });
  fs.mkdirSync(path.join(copy, 'node_modules')); fs.symlinkSync(compiler, path.join(copy, 'node_modules/typescript'), process.platform === 'win32' ? 'junction' : 'dir');
  assert.equal(collectProjectDependencies(copy, ['src/main.tsx']).identity, original.identity); assert.deepEqual(fs.readFileSync(path.join(project, 'src/main.tsx')), before);
});
test('CLI reports complete, partial, invalid and help states without writing project artifacts', t => {
  const { project, write } = setup(t); write('entry.html', '<h1>Read only</h1>');
  const script = path.resolve('scripts/project-dependencies.mjs'), run = args => spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });
  const good = run([project, 'entry.html']); assert.equal(good.status, 0); assert.equal(JSON.parse(good.stdout).coverage.status, 'within-supported-static-syntax');
  write('entry.html', '<img src="missing.png">'); const partial = run([project, 'entry.html']); assert.equal(partial.status, 2); assert.equal(JSON.parse(partial.stdout).coverage.status, 'partial');
  assert.equal(run([project, '../outside']).status, 1); assert.equal(run(['--help']).status, 0); assert(!fs.existsSync(path.join(project, '.variant-work'))); assert(!fs.existsSync(path.join(project, '.verification')));
});
