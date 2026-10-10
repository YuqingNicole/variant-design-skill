import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fixture } from './fixture.mjs';
import { prepareVariant, applyVariant, undoVariant } from '../scripts/variant-history.mjs';
const root=path.resolve('.generated'),candidate=path.resolve('.candidate');
let server, base;
test.beforeAll(async()=>{
  fixture(root);
  server=spawn(process.execPath,['../scripts/react-preview.mjs',process.cwd(),root],{stdio:['ignore','pipe','pipe']});
  base=await new Promise((resolve,reject)=>{let output='';const timeout=setTimeout(()=>reject(new Error(output)),20000);server.stdout.on('data',b=>{output+=b;const match=output.match(/Comparison: (http:\/\/[^\s]+)\/\_compare.html/);if(match){clearTimeout(timeout);resolve(match[1]);}});server.stderr.on('data',b=>output+=b);server.on('exit',code=>{clearTimeout(timeout);reject(new Error(`Preview exited ${code}: ${output}`));});});
});
test.afterAll(()=>{server?.kill();fs.rmSync(candidate,{recursive:true,force:true});});
test('React A/B/C render with working controls, locked font, comparison and keyboard focus',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));page.on('console',msg=>{if(msg.type()==='error')errors.push(`${msg.text()} ${msg.location().url}`);});
  for(const id of ['A','B','C']){
    await page.goto(`${base}/_preview/${id}.html`);await expect(page.getByRole('heading')).toHaveText(`Direction ${id}`);
    await expect(page.locator('main')).toHaveCSS('font-family','Georgia');
    await page.keyboard.press('Tab');const button=page.getByRole('button');await expect(button).toBeFocused();
    expect(await button.evaluate(el=>getComputedStyle(el).outlineStyle)).not.toBe('none');
    await button.click();await expect(button).toHaveText('Inspect 1');
  }
  await page.goto(`${base}/_compare.html`);await expect(page.getByRole('link',{name:'Open B'})).toBeVisible();
  await expect(page.locator('iframe')).toHaveCount(3);await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
});
test('hero edit and undo render only B changes, preserve brand and footer',async({page})=>{
  prepareVariant(root,'B',candidate);const file=path.join(candidate,'VariantB.tsx');fs.writeFileSync(file,fs.readFileSync(file,'utf8').replace('Direction B','Evidence first'));
  applyVariant(root,'B',candidate,{summary:'hero',zone:'hero'});
  await page.goto(`${base}/_preview/B.html`);await expect(page.getByRole('heading')).toHaveText('Evidence first');await expect(page.locator('main')).toHaveCSS('font-family','Georgia');await expect(page.locator('footer')).toHaveText('Evidence retained');
  undoVariant(root,'B');await page.reload();await expect(page.getByRole('heading')).toHaveText('Direction B');
});
test('actual coffee example settles counters immediately and stops frames on preference change',async({page})=>{
  await page.route('https://**/*',route=>route.fulfill({status:200,body:''}));
  fs.copyFileSync('../examples/coffee-brand-interactive.html',path.join(root,'coffee.html'));
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.addInitScript(()=>{window.frameCalls=0;const original=window.requestAnimationFrame;window.requestAnimationFrame=cb=>{window.frameCalls++;return original(cb);};});
  await page.goto(`${base}/coffee.html`);
  const finalValues=()=>page.locator('[data-counter]').evaluateAll(elements=>elements.every(el=>el.textContent===(el.dataset.prefix||'')+new Intl.NumberFormat().format(Number(el.dataset.target))+(el.dataset.suffix||'')));
  expect(await finalValues()).toBe(true);await page.locator('.stats-section').scrollIntoViewIfNeeded();await page.waitForTimeout(150);expect(await page.evaluate(()=>window.frameCalls)).toBe(0);
  await page.emulateMedia({reducedMotion:'no-preference'});await page.evaluate(()=>document.querySelectorAll('[data-counter]').forEach(animateCounter));await page.waitForTimeout(50);
  expect(await page.evaluate(()=>window.frameCalls)).toBeGreaterThan(0);
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(50);const calls=await page.evaluate(()=>window.frameCalls);await page.waitForTimeout(150);expect(await page.evaluate(()=>window.frameCalls)).toBe(calls);expect(await finalValues()).toBe(true);
});

test('artifact evidence records computed font and focus, then detects implementation drift',async({page,browser})=>{
 const {verifyArtifact,inspectVerification}=await import('../scripts/artifact-verification.mjs');
 const file=path.join(root,'VariantB.tsx'),original=fs.readFileSync(file,'utf8');
 let expectedFixtureFont='Georgia';
 const observe=async()=>{
  await page.goto(`${base}/_preview/B.html`);
  // Wait for the dev server to serve the changed fixture, not its prior transform.
  await expect(page.locator('main')).toHaveCSS('font-family',expectedFixtureFont);
  const font=await page.locator('main').evaluate(el=>getComputedStyle(el).fontFamily);
  await page.keyboard.press('Tab');
  const outline=await page.getByRole('button').evaluate(el=>{const css=getComputedStyle(el);return {style:css.outlineStyle,width:parseFloat(css.outlineWidth)};});
  const tool={name:'Chromium via Playwright',version:browser.version()},environment={url:`${base}/_preview/B.html`,viewport:page.viewportSize()};
  return [{id:'brand',status:font==='Georgia'?'passed':'failed',reason:'Compare main computed font with locked Georgia',tool,environment,evidence:[font]},
   {id:'keyboard-focus',status:outline.style!=='none'&&outline.width>0?'passed':'failed',reason:'Tab to the fixture button and measure its outline; this fixture has no alternative indicator',tool,environment,evidence:[JSON.stringify(outline)]}];
 };
 try{
  const good=await verifyArtifact(root,'B',{},observe);expect(good.report.checks.find(c=>c.id==='brand').status).toBe('passed');expect(good.status).toBe('unverified');
  fs.writeFileSync(file,original.replace("fontFamily:'Georgia'","fontFamily:'Arial'").replace('<button onClick',"<button style={{outline:'none'}} onClick"));
  expect(inspectVerification(root,good.file).status).toBe('stale');
  expectedFixtureFont='Arial';
  const bad=await verifyArtifact(root,'B',{},observe);expect(bad.status).toBe('failed');expect(bad.report.checks.filter(c=>c.status==='failed').map(c=>c.id)).toEqual(['brand','keyboard-focus']);
 }finally{fs.writeFileSync(file,original);}
});

test('runtime observations bind real browser checks to the reviewed task',async({page,browser})=>{
  const {discoverProject}=await import('../scripts/project-profile.mjs');
  const {createTask,observeTask,inspectObservation}=await import('../scripts/design-task.mjs');
  const profile=discoverProject(root,'VariantB.tsx');
  const task=createTask(profile,{goal:'Preserve interactive preview',audience:'Project author',route:'/_preview/B.html',coreTask:'Inspect direction B',allowedFiles:['VariantB.tsx'],preserve:['Inspect counter'],acceptance:['Counter increments'],brandConstraints:[{rule:'Georgia font',evidence:'Fixture component styles'}],unknowns:[],discoveryReview:profile.unknowns.map((x,index)=>({index,status:'unresolved',reason:'This test observes only the known fixture counter and font; other semantics are not covered',blocking:false}))});
  const report=await observeTask(task,profile,async()=>{
    await page.setViewportSize({width:800,height:600});await page.emulateMedia({reducedMotion:'reduce',colorScheme:'light'});
    await page.goto(`${base}/_preview/B.html`);
    await expect(page.getByRole('heading')).toHaveText('Direction B');
    await expect(page.locator('main')).toHaveCSS('font-family','Georgia');
    await page.getByRole('button').click();await expect(page.getByRole('button')).toHaveText('Inspect 1');
    return {conditions:{url:page.url(),browser:browser.version(),language:await page.evaluate(()=>navigator.language),theme:'light',dataState:'fixture B',interactionState:'after one counter click',viewport:page.viewportSize(),reducedMotion:'reduce'},checks:[{id:'counter-and-brand',status:'passed',reason:'Counter incremented and Georgia font retained',tool:'Playwright',toolVersion:JSON.parse(fs.readFileSync('node_modules/@playwright/test/package.json','utf8')).version,evidence:'Heading Direction B; main computed font Georgia; button text Inspect 1'}]};
  });
  expect(report.status).toBe('passed-within-observed-scope');
  expect(inspectObservation(report,task,profile).runtimeFreshness).toBe('not-established');
  const original=fs.readFileSync(path.join(root,'VariantB.tsx'),'utf8');
  try {fs.writeFileSync(path.join(root,'VariantB.tsx'),original+'\n// subsequent edit');expect(inspectObservation(report,task,profile).status).toBe('stale');}
  finally {fs.writeFileSync(path.join(root,'VariantB.tsx'),original);}
});
