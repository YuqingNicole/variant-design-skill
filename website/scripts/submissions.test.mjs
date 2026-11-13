import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {model,referenceRecords} from './reference-records.mjs';
import {admit,withdraw,writeRegistry} from './submissions.mjs';
import {draft,editorial} from './submission-fixtures.mjs';
import {renderSite,indexableRoutes,sitemap,draftRoutes,withoutDrafts,referenceIndex} from './prerender.mjs';
import {inspirationPlugin} from './inspiration-split.mjs';
const candidate=(kind='image',id=`submission-${kind}`,complete=true)=>model.reviewSubmission(draft(kind),editorial(id,complete),'2026-11-04T09:00:00Z');
const temp=t=>{const dir=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'variant-submissions-')));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));const file=path.join(dir,'registry.json');fs.writeFileSync(file,'[]\n');return {dir,file}};

test('image/video intake requires authorship, display consent and safe media URLs; review requires evidence',()=>{
 for(const kind of ['image','video'])assert.equal(candidate(kind).media.kind,kind);
 for(const change of [d=>d.permission.display=false,d=>d.permission.download=true,d=>d.permission.date='2026-02-30',d=>d.credit.url='javascript:alert(1)',d=>d.media.url='https://name:password@media.example/x',d=>{d.media.kind='video';delete d.media.poster}]){const d=draft();change(d);assert.throws(()=>model.parseSubmission(d),/Invalid submission/)}
 for(const change of [e=>delete e.permissionRecord,e=>delete e.review,e=>e.media.width=0,e=>delete e.translations,e=>delete e.translations.en.reviewedAt]){const e=editorial();change(e);assert.throws(()=>model.reviewSubmission(draft(),e),/Invalid reference registry/)}
 const e=editorial();e.privateNotes='must not ship';const r=model.reviewSubmission(draft(),e);assert.equal('privateNotes' in r,false);assert.throws(()=>model.parseRegistry([{...r,privateNotes:'bad'}]),/unknown published/);assert.throws(()=>model.parseRegistry([{...r,review:{...r.review,privateNote:'must not ship'}}]),/review/);assert.throws(()=>model.parseRegistry([{...r,media:{...r.media,poster:'private unused field'}}]),/poster/);
 const input=draft();input.notes='```\n<script>alert(1)</script>\n```';assert.ok(model.submissionMarkdown(input).includes('\\`\\`\\`'));assert.doesNotMatch(model.submissionMarkdown(input),/\n```/);
});

test('real admission and withdrawal preserve a backup, reject duplicates and strip withdrawn media',t=>{
 const {file}=temp(t),r=candidate();const admitted=admit(file,r);assert.equal(fs.readFileSync(admitted.backup,'utf8'),'[]\n');assert.equal(referenceRecords(file).published.at(-1).id,r.id);
 assert.throws(()=>admit(file,r),/already exists/);assert.throws(()=>admit(file,{...r,id:'linear'}),/already exists/);
 const result=withdraw(file,r.id,{date:'2026-11-04',reason:{zh:'测试撤下',en:'Test removal'}});assert.equal(JSON.parse(fs.readFileSync(result.backup,'utf8'))[0].media.url,r.media.url);
 assert.deepEqual(Object.keys(result.records[0]),['id','name','status','withdrawnAt','reason']);const contents=fs.readFileSync(file,'utf8');assert.ok(!contents.includes('media.example'));assert.equal(referenceRecords(file).withdrawn[0].id,r.id);assert.equal(referenceRecords(file).published.some(x=>x.id===r.id),false);
 assert.throws(()=>model.parseRegistry([{...result.records[0],media:r.media}]),/retain no media/);
});

test('registry edits reject stale work, locks and symlinks without overwriting it',t=>{
 const {file,dir}=temp(t);fs.writeFileSync(file+'.lock','busy');assert.throws(()=>admit(file,candidate()),/locked/);fs.unlinkSync(file+'.lock');
 const other=path.join(dir,'other.json');fs.writeFileSync(other,'[]');const link=path.join(dir,'link.json');fs.symlinkSync(file,link);assert.throws(()=>writeRegistry(link,r=>r),/regular file/);
 assert.throws(()=>writeRegistry(file,r=>{fs.writeFileSync(file,'[ ]\n');return r}),/changed/);assert.equal(fs.readFileSync(file,'utf8'),'[ ]\n');assert.equal(fs.existsSync(file+'.lock'),false);
 const hostile=temp(t),target=path.join(hostile.dir,'outside');fs.mkdirSync(target);fs.symlinkSync(target,path.join(hostile.dir,'.variant-work'));assert.throws(()=>admit(hostile.file,candidate()),/backup directory/);assert.deepEqual(fs.readdirSync(target),[]);
});

test('CLI prepares a review candidate without publishing and rejects invalid admission',t=>{
 const {file,dir}=temp(t),input=path.join(dir,'draft.json'),notes=path.join(dir,'editorial.json'),output=path.join(dir,'candidate.json');fs.writeFileSync(input,JSON.stringify(draft()));fs.writeFileSync(notes,JSON.stringify(editorial()));
 const run=args=>spawnSync(process.execPath,[new URL('./submissions.mjs',import.meta.url).pathname,...args],{encoding:'utf8'});
 assert.equal(run(['review',input,notes,'--output',output]).status,0);assert.deepEqual(JSON.parse(fs.readFileSync(file,'utf8')),[]);assert.ok(fs.existsSync(output));
 assert.equal(run(['admit',output,'--registry',file]).status,0);assert.notEqual(run(['admit',output,'--registry',file]).status,0);
});

test('the build marks display permission, drops draft English and serves unindexed media-free withdrawal pages',()=>{
 const r=candidate(),pending=candidate('image','translation-draft',false),gone=model.withdrawReference(candidate('video'),{date:'2026-11-04',reason:{zh:'作者撤回',en:'Permission withdrawn'}}),refs=[r,pending],template='<html><head><title>Old</title></head><body><div id="root"></div></body></html>';
 const drafts=draftRoutes({references:refs});assert.deepEqual(drafts,['/inspiration/translation-draft']);const english=withoutDrafts({'/':'<main><h1>Feed</h1></main>','/inspiration/submission-image':'<main><h1>Work</h1></main>','/inspiration/translation-draft':'<main><h1>Draft</h1></main>'},drafts);
 const pages=renderSite([],template,'https://example.test',refs,{english,withdrawn:[gone]});assert.match(pages.get('/inspiration/submission-image'),/作者授权/);assert.match(pages.get('/inspiration/submission-image'),/不含下载/);assert.equal(pages.has('/en/inspiration/translation-draft'),false);
 for(const route of ['/inspiration/submission-video','/en/inspiration/submission-video']){assert.match(pages.get(route),/name="robots" content="noindex"/);assert.ok(!pages.get(route).includes('media.example'));assert.ok(!sitemap(indexableRoutes(pages),'https://example.test').includes(route+'</loc>'))}
 assert.ok(!referenceIndex(refs).includes('/inspiration/submission-video'));
});

test('the actual SSR build renders reviewed media and excludes removed URLs and draft English from delivery',async t=>{
 const {dir}=temp(t),root=path.join(dir,'site');fs.mkdirSync(root);fs.copyFileSync(new URL('../../CHANGELOG.md',import.meta.url),path.join(dir,'CHANGELOG.md'));fs.copyFileSync(new URL('../../VERSION',import.meta.url),path.join(dir,'VERSION'));fs.cpSync(new URL('../src',import.meta.url),path.join(root,'src'),{recursive:true});fs.symlinkSync(new URL('../node_modules',import.meta.url).pathname,path.join(root,'node_modules'),'dir');fs.writeFileSync(path.join(root,'package.json'),'{"type":"module"}');
 const image=candidate(),video=candidate('video'),pending=candidate('image','translation-draft',false),original={...candidate('video','removed-build-fixture'),media:{...candidate('video').media,url:'https://media.example/removed-private-test-video'}};const gone=model.withdrawReference(original,{date:'2026-11-04',reason:{zh:'作者撤回',en:'Author withdrew permission'}});fs.writeFileSync(path.join(root,'src/authorized-references.json'),JSON.stringify([image,video,pending,gone]));
 // The reference library reaches the page through the split plugin (links from the real data file, the registry from this copy).
 const {build}=await import('vite');await build({root,configFile:false,logLevel:'silent',plugins:[inspirationPlugin()],esbuild:{jsx:'automatic'},define:{__SHOW_TRANSLATION_DRAFTS__:'false'},build:{ssr:path.join(root,'src/ssr-pages.tsx'),outDir:'ssr',rollupOptions:{output:{entryFileNames:'ssr.js'}}}});
 const {pathToFileURL}=await import('node:url');const {renderPages}=await import(pathToFileURL(path.join(root,'ssr/ssr.js')).href),{zh,en}=renderPages();assert.match(zh['/inspiration/submission-image'],/作者授权/);assert.ok(zh['/inspiration/submission-image'].includes('https://media.example/image'));assert.match(en['/inspiration/submission-video'],/Author permission/);
 for(const slug of ['undo-ai-design-changes','git-or-snapshot-undo','design-references-with-sources']){assert.ok(zh['/guides'].includes(`/guides/${slug}`));assert.ok(!en['/guides'].includes(`/en/guides/${slug}`));assert.match(en[`/guides/${slug}`],/Not found/)}assert.ok(en['/guides'].includes('/en/guides/compare-design-directions'));
 const refs=[image,video,pending],english=withoutDrafts(en,draftRoutes({references:refs})),template='<html><head><title>Fixture</title></head><body><div id="root"></div></body></html>',pages=renderSite([],template,'https://example.test',refs,{rendered:zh,english,withdrawn:[gone]});assert.equal(pages.has('/en/inspiration/translation-draft'),false);assert.ok(!english['/'].includes('href="/en/inspiration/translation-draft"'));for(const lang of ['','/en']){const html=pages.get(lang+'/inspiration/removed-build-fixture');assert.match(html,/noindex/);assert.ok(!html.includes('removed-private-test-video'));assert.ok(!html.includes('<video'));}
 assert.ok(!fs.readFileSync(path.join(root,'ssr/ssr.js'),'utf8').includes('removed-private-test-video'));
});
