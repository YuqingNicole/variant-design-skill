import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { fixture } from './fixture.mjs';
import { prepareVariant, applyVariant, undoVariant } from '../scripts/variant-history.mjs';
const root=path.resolve('.generated'),candidate=path.resolve('.candidate');
let server, base;
test.beforeAll(async()=>{
  fixture(root);
  server=spawn(process.execPath,['../scripts/react-preview.mjs',process.cwd(),root],{stdio:['ignore','pipe','pipe']});
  base=await new Promise((resolve,reject)=>{let output='';const timeout=setTimeout(()=>reject(new Error(output)),20000);server.stdout.on('data',b=>{output+=b;const match=output.match(/Comparison: (http:\/\/[^\s]+)\/\_compare.html/);if(match){clearTimeout(timeout);resolve(match[1]);}});server.stderr.on('data',b=>output+=b);server.on('exit',code=>{clearTimeout(timeout);reject(new Error(`Preview exited ${code}: ${output}`));});});
});
// Tests rewrite fixture files and then navigate. Vite would push full reloads over its HMR socket at
// unpredictable moments, so pages get a silent mock socket, and `open` retries until the dev server
// serves the changed content instead of its previous transform.
test.beforeEach(async({context})=>{await context.routeWebSocket(/./,()=>{});});
const open=(page,url,ready)=>expect(async()=>{await page.goto(url);await ready();}).toPass({timeout:20000});
test.afterAll(()=>{server?.kill();fs.rmSync(candidate,{recursive:true,force:true});});
test('React A/B/C render with working controls, locked font, comparison and keyboard focus',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));page.on('console',msg=>{if(msg.type()==='error')errors.push(`${msg.text()} ${msg.location().url}`);});
  for(const id of ['A','B','C']){
    await open(page,`${base}/_preview/${id}.html`,()=>expect(page.getByRole('heading')).toHaveText(`Direction ${id}`,{timeout:2000}));
    await expect(page.locator('main')).toHaveCSS('font-family','Georgia');
    await page.keyboard.press('Tab');const button=page.getByRole('button');await expect(button).toBeFocused();
    expect(await button.evaluate(el=>getComputedStyle(el).outlineStyle)).not.toBe('none');
    await button.click();await expect(button).toHaveText('Inspect 1');
  }
  await page.goto(`${base}/_compare.html`);await expect(page.getByRole('link',{name:'Open B'})).toBeVisible();
  await expect(page.locator('iframe')).toHaveCount(3);await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
});
test('static React preview opens from file:// without a server for sandboxed agents',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text());});
  const run=spawnSync(process.execPath,['../scripts/react-preview.mjs',process.cwd(),root,'--static'],{encoding:'utf8'});
  expect(run.status,run.stderr).toBe(0);expect(run.stdout).toMatch(/Comparison: file:\/\//);
  const base=pathToFileURL(path.join(root,'_static')).href;
  for(const id of ['A','B','C']){
    await open(page,`${base}/_preview/${id}.html`,()=>expect(page.getByRole('heading')).toHaveText(`Direction ${id}`,{timeout:2000}));
    // Inlining must not treat $&, $` and $$ in the bundle as replacement patterns.
    await expect(page.locator('[data-literal]')).toHaveText("$&|$`|$'|$$");
    await expect(page.locator('main')).toHaveCSS('font-family','Georgia');await page.getByRole('button').click();await expect(page.getByRole('button')).toHaveText('Inspect 1');
  }
  await page.goto(`${base}/_compare.html`);await expect(page.locator('iframe')).toHaveCount(3);
  await expect(page.frameLocator('iframe[title="Variant C preview"]').getByRole('heading')).toHaveText('Direction C');expect(errors).toEqual([]);
});
test('hero edit and undo render only B changes, preserve brand and footer',async({page})=>{
  prepareVariant(root,'B',candidate);const file=path.join(candidate,'VariantB.tsx');fs.writeFileSync(file,fs.readFileSync(file,'utf8').replace('Direction B','Evidence first'));
  applyVariant(root,'B',candidate,{summary:'hero',zone:'hero'});
  await open(page,`${base}/_preview/B.html`,()=>expect(page.getByRole('heading')).toHaveText('Evidence first',{timeout:2000}));await expect(page.locator('main')).toHaveCSS('font-family','Georgia');await expect(page.locator('footer')).toHaveText('Evidence retained');
  undoVariant(root,'B');await open(page,`${base}/_preview/B.html`,()=>expect(page.getByRole('heading')).toHaveText('Direction B',{timeout:2000}));
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
  await open(page,`${base}/_preview/B.html`,()=>expect(page.locator('main')).toHaveCSS('font-family',expectedFixtureFont,{timeout:2000}));
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
  let failure;
  const report=await observeTask(task,profile,async()=>{try{
    await page.setViewportSize({width:800,height:600});await page.emulateMedia({reducedMotion:'reduce',colorScheme:'light'});
    await open(page,`${base}/_preview/B.html`,()=>expect(page.locator('main')).toHaveCSS('font-family','Georgia',{timeout:2000}));
    await expect(page.getByRole('heading')).toHaveText('Direction B');
    await page.getByRole('button').click();await expect(page.getByRole('button')).toHaveText('Inspect 1');
    return {conditions:{url:page.url(),browser:browser.version(),language:await page.evaluate(()=>navigator.language),theme:'light',dataState:'fixture B',interactionState:'after one counter click',viewport:page.viewportSize(),reducedMotion:'reduce'},checks:[{id:'counter-and-brand',status:'passed',reason:'Counter incremented and Georgia font retained',tool:'Playwright',toolVersion:JSON.parse(fs.readFileSync('node_modules/@playwright/test/package.json','utf8')).version,evidence:'Heading Direction B; main computed font Georgia; button text Inspect 1'}]};
  }catch(error){failure=error;throw error;}});
  // observeTask records adapter errors only as a generic reason; surface the real one.
  expect(report.status,String(failure?.message??report.reason)).toBe('passed-within-observed-scope');
  expect(inspectObservation(report,task,profile).runtimeFreshness).toBe('not-established');
  const original=fs.readFileSync(path.join(root,'VariantB.tsx'),'utf8');
  try {fs.writeFileSync(path.join(root,'VariantB.tsx'),original+'\n// subsequent edit');expect(inspectObservation(report,task,profile).status).toBe('stale');}
  finally {fs.writeFileSync(path.join(root,'VariantB.tsx'),original);}
});
test('preview serves a rewrite made right after the previous change',async()=>{
  const file=path.join(root,'VariantB.tsx'),original=fs.readFileSync(file,'utf8');
  const served=async()=>(await (await fetch(`${base}/VariantB.tsx`)).text()).match(/fontFamily:\s*"(\w+)"/)?.[1];
  await new Promise(resolve=>setTimeout(resolve,100)); // start outside the window of an earlier test's write
  try{
    fs.writeFileSync(file,original.replace("fontFamily:'Georgia'","fontFamily:'Arial'"));
    await expect.poll(served,{intervals:[5]}).toBe('Arial');
    // Linux watchers dropped this second change when it landed within 50ms of the first one.
    fs.writeFileSync(file,original);
    await expect.poll(served,{timeout:3000}).toBe('Georgia');
  }finally{if(fs.readFileSync(file,'utf8')!==original)fs.writeFileSync(file,original);}
});

test('static preview uses an isolated Vite package with the target project React',async({page})=>{
 const os=await import('node:os');const project=fs.mkdtempSync(path.join(os.tmpdir(),'variant-no-vite-'));
 try {
  const output=path.join(project,'variant-output');fixture(output);
  const manifest='{"name":"without-vite","dependencies":{"react":"19.1.1","react-dom":"19.1.1"}}';fs.writeFileSync(path.join(project,'package.json'),manifest);
  for(const name of ['react','react-dom','scheduler'])fs.cpSync(path.resolve('node_modules',name),path.join(project,'node_modules',name),{recursive:true});
  const command=['../scripts/react-preview.mjs',project,output,'--static'];
  const missing=spawnSync(process.execPath,command,{encoding:'utf8'});expect(missing.status).not.toBe(0);expect(missing.stderr).toContain('--vite-root');
  const built=spawnSync(process.execPath,[...command,'--vite-root',process.cwd()],{encoding:'utf8'});expect(built.status,built.stderr).toBe(0);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const id of ['A','B','C']){await page.goto(pathToFileURL(path.join(output,`_static/_preview/${id}.html`)).href);await expect(page.getByRole('heading')).toHaveText(`Direction ${id}`);await page.getByRole('button').click();await expect(page.getByRole('button')).toHaveText('Inspect 1');}
  expect(errors).toEqual([]);expect(fs.readFileSync(path.join(project,'package.json'),'utf8')).toBe(manifest);expect(fs.existsSync(path.join(project,'node_modules/vite'))).toBe(false);
 }finally{fs.rmSync(project,{recursive:true,force:true});}
});

test('reusable browser plan checks alternate focus, JS motion and non-target behavior on the recorded revision',async({page,browser})=>{
 const {verifyInBrowser,verificationPlan}=await import('../scripts/browser-verification.mjs');
 const {inspectVerification}=await import('../scripts/artifact-verification.mjs');
 const dir=path.join(root,'runtime-plan');fs.mkdirSync(dir,{recursive:true});
 const file=path.join(dir,'B.html');
 const state={schemaVersion:2,variants:{B:{entry:'B.html',files:['B.html'],version:1,tokens:{fonts:['Georgia']}}}};
 fs.writeFileSync(path.join(dir,'.variant-context.json'),JSON.stringify(state));
 const html=`<!doctype html><html><head><style>body{font-family:Georgia}button:focus-visible{outline:none;box-shadow:rgb(0, 0, 255) 0px 0px 0px 3px}@media(prefers-reduced-motion:reduce){*{animation:none}}</style></head><body><h1>Report</h1><button id="outside">Inspect</button><output>0</output><span id="motion">100</span><script>
 document.querySelector('button').onclick=()=>document.querySelector('output').textContent='1';
 const preference=matchMedia('(prefers-reduced-motion: reduce)');let frame;
 window.startMotion=()=>{cancelAnimationFrame(frame);if(preference.matches){document.querySelector('#motion').textContent='100';return;}const tick=()=>{document.querySelector('#motion').textContent='50';frame=requestAnimationFrame(tick)};tick()};
 preference.addEventListener('change',()=>{if(preference.matches){cancelAnimationFrame(frame);document.querySelector('#motion').textContent='100'}});
 </script></body></html>`;
 fs.writeFileSync(file,html);
 const plan={...verificationPlan(pathToFileURL(file).href),brand:[{selector:'h1',property:'font-family',expected:'Georgia'}],
  'keyboard-focus':[{selector:'button',indicator:{property:'boxShadow',expected:'rgb(0, 0, 255) 0px 0px 0px 3px'}}],
  'reduced-motion':{settled:[{selector:'#motion',property:'text',expected:'100'}]},
  'scope-preservation':[{selector:'output',property:'text',expected:'1'}]};
 const adapter={page,version:browser.version(),ready:async()=>expect(page.locator('h1')).toHaveText('Report'),startMotion:p=>p.evaluate(()=>window.startMotion()),exerciseScope:p=>p.locator('button').click()};
 const good=await verifyInBrowser(dir,'B',{plan},adapter);
 expect(good.report.checks.filter(c=>c.status==='passed').map(c=>c.id)).toEqual(['brand','keyboard-focus','reduced-motion','scope-preservation']);
 expect(good.report.checks.find(c=>c.id==='project-checks').status).toBe('unverified');
 fs.writeFileSync(file,html.replace('font-family:Georgia','font-family:Arial').replace('box-shadow:rgb(0, 0, 255) 0px 0px 0px 3px','box-shadow:none').replace('if(preference.matches){document','if(false){document').replace("if(preference.matches){cancelAnimationFrame(frame)","if(false){cancelAnimationFrame(frame)").replace("textContent='1'","textContent='2'"));
 expect(inspectVerification(dir,good.file).status).toBe('stale');
 const bad=await verifyInBrowser(dir,'B',{plan},adapter);
 expect(bad.report.checks.filter(c=>c.status==='failed').map(c=>c.id)).toEqual(['brand','keyboard-focus','reduced-motion','scope-preservation']);
 const missing=await verifyInBrowser(dir,'B',{plan},null);
 expect(missing.report.checks.every(c=>c.status==='unverified')).toBe(true);
});

test('comparison keeps long explanations below aligned previews and centers phone layouts',async({page})=>{
 const {buildPreview}=await import('../scripts/build-preview.mjs');
 const dir=path.join(root,'comparison-layout');fs.mkdirSync(dir,{recursive:true});
 const variants=Object.fromEntries(['A','B','C'].map(id=>{
  fs.writeFileSync(path.join(dir,`${id}.html`),`<!doctype html><html><body><h1>Direction ${id}</h1><button onclick="this.textContent='Done'">Inspect</button></body></html>`);
  return [id,{entry:`${id}.html`,files:[`${id}.html`],version:1,comparison:{optimizes:'逐项对比。'.repeat(35),tradeoff:'信息密度高。'.repeat(30),bestFor:'了解需求的访客。'.repeat(20)}}];
 }));
 const state={schemaVersion:2,language:'zh',variants,recommendation:{variant:'B',reason:'推荐原因，尚未经过测试。'.repeat(40)}};
 const context=path.join(dir,'.variant-context.json');fs.writeFileSync(context,JSON.stringify(state));buildPreview(dir);
 await page.setViewportSize({width:1440,height:900});await page.goto(pathToFileURL(path.join(dir,'_compare.html')).href);
 const stages=page.locator('.stage');
 await expect(stages).toHaveCount(3);
 const boxes=await stages.evaluateAll(elements=>elements.map(el=>{const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom};}));
 expect(Math.max(...boxes.map(b=>b.top))-Math.min(...boxes.map(b=>b.top))).toBeLessThan(1);
 for(const box of boxes){expect(box.top).toBeLessThan(260);expect(box.bottom).toBeLessThan(900);}
 const explanation=page.locator('.direction-details').first();await explanation.locator('summary').focus();await page.keyboard.press('Enter');await expect(explanation.locator('dd').first()).toHaveText(variants.A.comparison.optimizes);
 expect((await stages.first().boundingBox()).y).toBe(boxes[0].top);
 await page.getByRole('button',{name:'手机布局'}).click();await expect(page.getByRole('button',{name:'手机布局'})).toHaveAttribute('aria-pressed','true');
 const phone=await page.locator('iframe').first().evaluate(el=>{const a=el.getBoundingClientRect(),b=el.parentElement.getBoundingClientRect();return {width:el.style.width,left:a.left-b.left,right:b.right-a.right};});
 expect(phone.width).toBe('390px');expect(Math.abs(phone.left-phone.right)).toBeLessThan(2);
 await page.frameLocator('iframe').first().getByRole('button').click();await expect(page.frameLocator('iframe').first().getByRole('button')).toHaveText('Done');
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await expect(page.getByRole('link',{name:'完整打开 A'})).toBeVisible();
 expect(JSON.parse(fs.readFileSync(context,'utf8'))).toEqual(state);
 state.language='en';state.preview={colorScheme:'dark'};fs.writeFileSync(context,JSON.stringify(state));buildPreview(dir);
 await page.goto(pathToFileURL(path.join(dir,'_compare.html')).href);
 await expect(page.locator('html')).toHaveCSS('color-scheme','dark');
 await expect(page.getByRole('button',{name:'Desktop layout'})).toBeVisible();
 await page.locator('.recommendation summary').focus();await page.keyboard.press('Enter');
 await expect(page.locator('.recommendation p')).toHaveText(state.recommendation.reason);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
