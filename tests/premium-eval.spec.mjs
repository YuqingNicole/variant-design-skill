import {test,expect} from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {capturePremium,gradePremium,premiumUndo} from '../evals/premium.mjs';
import {snapshot,gradeChain,loadFixture} from '../evals/grade.mjs';
import {prepareVariant,applyVariant} from '../scripts/variant-history.mjs';

const project=path.resolve('.premium-eval');
const refined=`*{box-sizing:border-box}body{margin:0;font:16px/1.5 var(--font-ui);background:var(--paper);color:var(--ink)}main{max-width:1100px;margin:auto;padding:24px 16px}header{display:flex;justify-content:space-between;align-items:center;gap:16px}h1,h2{font-family:var(--font-heading);color:var(--ink)}h1{font-size:32px;line-height:1.2}h2{font-size:18px}.brand{font-weight:600}.intro{font-size:16px}.catalogue-info,.book-author,.book-genre,.footnote{font-size:14px;color:var(--muted-text)}.tools{display:flex;gap:16px;margin:24px 0}.tools label{display:grid;gap:8px}input,select,button{font:inherit;color:var(--ink);min-height:44px;padding:8px 12px;border:1px solid #91a2b3;border-radius:8px;background:var(--surface)}button{font-weight:600;cursor:pointer;color:var(--accent)}#saved-view{background:var(--accent);color:white;border-color:var(--accent)}#books{list-style:none;padding:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.book{padding:16px;background:var(--surface);border:1px solid #cbd4de;border-radius:8px}li[hidden]{display:none!important}:focus-visible{outline:2px solid var(--accent);outline-offset:3px}@media(max-width:600px){header{flex-wrap:wrap}h1{font-size:28px}.tools{flex-direction:column}#books{grid-template-columns:1fr}}`;
test.afterEach(()=>fs.rmSync(project,{recursive:true,force:true}));

test('premium host evidence measures the actual page, rejects hidden tasks and palette drift, and verifies one real undo',async({browser})=>{
 fs.rmSync(project,{recursive:true,force:true});fs.cpSync('../evals/fixtures/premium/project',project,{recursive:true});
 const git=(...args)=>execFileSync('git',args,{cwd:project,stdio:'pipe'});git('init','-q','-b','fixture-baseline');git('add','-A');git('-c','user.name=eval','-c','user.email=eval@localhost','commit','-qm','fixture baseline');
 const evidence=path.join(project,'.variant-work/evidence'),initial=snapshot(project),before=await capturePremium(project,{browser,out:path.join(evidence,'before')});
 for(const sample of before.samples){expect(sample.task,sample.errors.join('\n')).toBe(true);expect(Object.keys(sample.probe.counts.sizes).length).toBeGreaterThan(7);expect(Object.keys(sample.probe.counts.radii).length).toBeGreaterThan(3);}
 await expect(capturePremium(project,{browser,out:path.join(evidence,'before')})).rejects.toThrow(/Preserve existing browser evidence/);
 const output=path.join(project,'variant-output'),candidate=path.join(project,'.variant-work/candidate');prepareVariant(output,'B',candidate);
 const file=path.join(candidate,'B.html'),html=fs.readFileSync(file,'utf8');fs.writeFileSync(file,html.replace(/<style id="local">[\s\S]*?<\/style>/,`<style id="local">${refined}</style>`));
 applyVariant(output,'B',candidate,{summary:'fixture refinement',request:'fixture-premium'});
 const after=await capturePremium(project,{browser,out:path.join(evidence,'after')}),metrics=gradePremium(before,after);
 expect(metrics.checks.filter(c=>!c.pass)).toEqual([]);
 const undo=premiumUndo(project,initial,evidence);expect(undo.pass,undo.details.join('\n')).toBe(true);
 const result=gradeChain(project,{fixture:loadFixture('premium'),initial,turns:[{id:'premium',snapshot:snapshot(project)}],measurements:{before,after,undo}});
 expect(result.checks.filter(c=>!c.pass)).toEqual([]);
 const actual=path.join(output,'B.html'),good=fs.readFileSync(actual,'utf8');
 fs.writeFileSync(actual,good.replace('</head>','<style>body{background:#111}#saved-view{background:#d4af37}</style></head>'));
 const dark=gradePremium(before,await capturePremium(project,{browser,out:path.join(evidence,'dark')}));expect(dark.checks.find(c=>c.id==='brand-rendered').pass).toBe(false);
 fs.writeFileSync(actual,good.replace('</head>','<style>.book{display:none!important}</style></head>'));
 const hidden=gradePremium(before,await capturePremium(project,{browser,out:path.join(evidence,'hidden')}));expect(hidden.pass).toBe(false);expect(hidden.checks.find(c=>c.id==='task-preserved').pass).toBe(false);
});
