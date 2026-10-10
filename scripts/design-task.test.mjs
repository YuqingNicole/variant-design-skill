import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { discoverProject } from './project-profile.mjs';
import {createTask,inspectTask,observeTask,inspectObservation} from './design-task.mjs';
function fixture(t){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'design-task-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 fs.writeFileSync(path.join(root,'index.html'),'<button>Buy</button>');
 const profile=discoverProject(root,'index.html');
 const brief={goal:'Clarify purchase',audience:'New visitors',route:'/pricing',coreTask:'Compare plans',allowedFiles:['index.html'],preserve:['Purchase action'],acceptance:['Purchase button remains operable'],brandConstraints:[],unknowns:[],discoveryReview:profile.unknowns.map((x,index)=>({index,status:'unresolved',reason:x.detail,blocking:false}))};
 return {root,profile,brief,task:createTask(profile,brief)};
}
const observation=()=>({conditions:{url:'http://localhost/pricing',browser:'Chromium',language:'en',theme:'light',dataState:'fixture',interactionState:'initial',viewport:{width:800,height:600},reducedMotion:'reduce'},checks:[{id:'button',status:'passed',reason:'Button exists',tool:'Playwright',toolVersion:'1',evidence:'Role=button count=1'}]});
test('brief enforces inspected scope, explicit criteria and discovery review',t=>{
 const {profile,brief}=fixture(t);
 assert.throws(()=>createTask(profile,{...brief,allowedFiles:['outside.ts']}));
 assert.throws(()=>createTask(profile,{...brief,acceptance:[]}));
 assert.throws(()=>createTask(profile,{...brief,discoveryReview:[]}));
 assert.equal(createTask(profile,{...brief,unknowns:[{reason:'Unknown payment handler',blocking:true}]}).readiness,'blocked');
});
test('source changes invalidate task and observations',async t=>{
 const {root,profile,task}=fixture(t);const report=await observeTask(task,profile,async()=>observation());
 assert.equal(report.status,'passed-within-observed-scope');
 assert.equal(inspectObservation(report,task,profile).runtimeFreshness,'not-established');
 fs.writeFileSync(path.join(root,'index.html'),'<button>Changed</button>');
 assert.equal(inspectTask(task,profile).status,'stale');assert.equal(inspectObservation(report,task,profile).status,'stale');
 await assert.rejects(observeTask(task,profile,async()=>observation()));
});
test('missing, failed and incomplete runtime adapters remain unverified',async t=>{
 const {profile,task}=fixture(t);
 assert.equal((await observeTask(task,profile)).status,'unverified');
 assert.equal((await observeTask(task,profile,async()=>{throw Error('private message')})).reason,'Runtime adapter failed or returned invalid evidence');
 assert.equal((await observeTask(task,profile,async()=>({checks:[]}))).status,'unverified');
 const failed=observation();failed.checks[0].status='failed';
 assert.equal((await observeTask(task,profile,async()=>failed)).status,'failed');
});
test('edits during observation and later brief changes invalidate bindings',async t=>{
 const {profile,task}=fixture(t);
 const report=await observeTask(task,profile,async()=>{task.brief.goal='New goal';return observation()});
 assert.equal(report.status,'stale');
 const next=await observeTask(task,profile,async()=>observation());task.brief.goal='Different goal';
 assert.equal(inspectObservation(next,task,profile).status,'stale');
});

test('design references preserve provenance and distinguish inspiration from reuse',async t=>{
 const {profile,brief}=fixture(t);
 const ref={id:'pricing-layout',title:'Pricing comparison reference',url:'https://example.com/pricing',usage:'inspiration',borrow:'Plan comparison hierarchy',rationale:'Helps visitors compare required features',constraints:'Keep project typography and purchase action',directions:['A'],review:{status:'unverified'}};
 const task=createTask(profile,{...brief,designReferences:[ref]});
 assert.deepEqual(task.brief.designReferences,[ref]);
 assert.throws(()=>createTask(profile,{...brief,designReferences:[ref,ref]}));
 for(const patch of [{url:'javascript:alert(1)'},{directions:['D']},{rationale:''},{usage:'code'},{review:{status:'verified'}}]) assert.throws(()=>createTask(profile,{...brief,designReferences:[{...ref,...patch}]}));
 const code={...ref,usage:'code',license:{status:'unknown',evidence:'Original license not checked'}};
 assert.equal(createTask(profile,{...brief,designReferences:[code]}).brief.designReferences[0].license.status,'unknown');
 const report=await observeTask(task,profile,async()=>observation());
 task.brief.designReferences[0].borrow='Different interaction';
 assert.equal(inspectObservation(report,task,profile).status,'stale');
});
