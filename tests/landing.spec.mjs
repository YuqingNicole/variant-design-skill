import { test, expect } from '@playwright/test';

test('production comparison opens three complete pages with matching brand and true desktop/mobile widths', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/variant-output/_compare.html');
  const frames = page.locator('iframe');
  await expect(frames).toHaveCount(3);
  for (const id of ['A', 'B', 'C']) {
    await expect(page.frameLocator(`iframe[title="Variant ${id} preview"]`).locator('main[data-landing-direction]')).toHaveAttribute('data-landing-direction', id);
  }
  const getWidths = () => frames.evaluateAll(items => items.map(frame => frame.contentWindow.innerWidth));
  expect(await getWidths()).toEqual([1200, 1200, 1200]);
  const fonts = await frames.evaluateAll(items => items.map(frame => frame.contentWindow.getComputedStyle(frame.contentDocument.querySelector('h1')).fontFamily));
  expect(new Set(fonts).size).toBe(1);
  await page.getByRole('button', { name: '手机布局' }).click();
  await expect.poll(getWidths).toEqual([390, 390, 390]);
  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('link', { name: '完整打开 B' }).click();
  const popup = await popupPromise;
  await expect(popup.locator('main')).toHaveAttribute('data-landing-direction', 'B');
  await expect(popup.locator('.hero-context')).toContainText('无需配置模型');
  await popup.close();
  expect(errors).toEqual([]);
});

test('integrated B keeps a mobile action, navigation, brief on language change, and reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/workbench');
  await expect(page.locator('main')).toHaveAttribute('data-landing-direction', 'B');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.locator('.hero-actions a').first().evaluate(el => el.getBoundingClientRect().bottom)).toBeLessThan(844);
  await expect(page.locator('#generator button[type="submit"]')).toBeDisabled();

  await page.locator('.site-nav a[href="/pricing"]').click();
  await expect(page).toHaveURL(/\/pricing$/);
  await page.goto('/workbench');
  await page.locator('#design-prompt').fill('A landing page for the real Variant Design project');
  await page.getByRole('button', { name: '切换到英文' }).click();
  await expect(page.locator('#design-prompt')).toHaveValue('A landing page for the real Variant Design project');
  await expect(page.locator('h1')).toContainText('Three directions.');
  await expect(page.locator('html')).toHaveCSS('scroll-behavior', 'auto');
  await page.goto('/workbench');
  await page.locator('.site-nav-links a').last().focus();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Switch to Chinese' })).toBeFocused();
  await expect(page.getByRole('button', { name: 'Switch to Chinese' })).toHaveCSS('outline-style', 'solid');
});

test('guided case previews real variants and hands off scoped, reversible prompts without selecting a winner', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/workbench');
  await page.locator('.hero-actions a').first().click();
  await expect(page).toHaveURL(/#guided-demo$/);
  await expect(page.locator('.demo-card')).toHaveCount(3);
  for (const id of ['A', 'B', 'C']) {
    const frame = page.frameLocator(`.demo-preview iframe[title^="${id} "]`);
    await expect(frame.locator('main')).toHaveAttribute('data-landing-direction', id);
    await expect(frame.locator('#guided-demo')).toHaveCount(0);
  }
  await page.getByRole('button', { name: '用 C 继续演示' }).click();
  await expect(page.getByRole('button', { name: '正在查看 C' })).toHaveAttribute('aria-pressed', 'true');
  await page.locator('.demo-steps details').nth(1).locator('summary').click();
  const edit = page.locator('.demo-steps details').nth(1);
  await expect(edit.locator('textarea')).toHaveValue(/正在试改 C，不是最终选定/);
  await edit.getByRole('button', { name: '复制指令' }).click();
  // The copy resolves asynchronously; wait for the clipboard instead of reading it once.
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('只修改 C 的 hero');
  await expect(page.locator('.demo-notice')).toContainText('粘贴到项目');
  await page.getByRole('button', { name: '切换到英文' }).click();
  await expect(page.locator('.demo-steps details').nth(1).locator('textarea')).toHaveValue(/Try a local edit of C/);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('guided prompts remain available when clipboard access fails', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('denied')) } }));
  await page.goto('/workbench#guided-demo');
  await page.locator('.demo-steps details').first().getByRole('button', { name: '复制指令' }).click();
  await expect(page.locator('.demo-notice')).toContainText('文本框');
  await expect(page.getByRole('textbox', { name: '第 1 步指令' })).toBeVisible();
});

test('direction artwork switches accessibly and reduced motion cancels active entrances', async ({ page }) => {
  await page.goto('/workbench');
  await expect(page.locator('.direction-stage')).toBeVisible();
  await page.locator('.stage-controls button').first().click();
  await expect(page.locator('.stage-controls button').first()).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.sheet-A')).toHaveClass(/sheet-active/);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').length)).toBe(0);
  await expect(page.locator('.sheet-A')).toHaveCSS('transition-duration', '0s');
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    const bounds = await page.locator('.direction-sheet').evaluateAll(items => items.map(el => { const r=el.getBoundingClientRect(); return {left:r.left,right:r.right}; }));
    expect(bounds.every(r => r.left >= 0 && r.right <= width)).toBe(true);
  }
  await page.locator('.sheet-A').click();
  await expect(page.locator('main')).toHaveAttribute('data-landing-direction', 'A');
});

test('canvas homepage opens real directions and preserves the guided handoff across language and viewport changes', async ({page}) => {
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/about');
  await expect(page.locator('h1')).toContainText('从看见可能开始');
  await page.locator('.canvas-sidebar button').first().click();
  await expect(page.frameLocator('.paper-preview iframe').locator('[data-showcase-direction]')).toHaveAttribute('data-showcase-direction','A');
  await page.getByRole('button',{name:'切换到英文'}).click();
  await expect(page.locator('h1')).toContainText('More possibilities.');
  await expect(page.frameLocator('.paper-preview iframe').locator('html')).toHaveAttribute('lang','en');
  await page.locator('.paper-actions a').first().click();
  await expect(page).toHaveURL(/\/docs$/);
  await expect(page.getByRole('textbox',{name:'First project prompt'})).toContainText('complete Variant Design skill');
  for(const width of [320,390,1440]){
    await page.setViewportSize({width,height:900});
    await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
  await page.locator('.site-footer a[href="/lab"]').click();await page.locator('a[href="/lab/workbench"]').click();
  await expect(page.locator('#generator')).toBeVisible();
});

 test('capability studies preserve data across directions and undo only the example title', async ({page}) => {
 await page.goto('/about');
 const frame=page.frameLocator('.paper-preview iframe');
 for(const [i,id] of ['A','B','C'].entries()){
 await page.locator('.canvas-sidebar button').nth(i).click();
 await expect(frame.locator('[data-showcase-direction]')).toHaveAttribute('data-showcase-direction',id);
 await expect(frame.locator('.cap-stats')).toContainText('$42,340');
 }
 await frame.getByRole('button',{name:/Organic search/}).click();
 await expect(frame.locator('.cap-inspector h3')).toHaveText('Organic search');
 const original=await page.locator('.cap-edit-region h4').textContent();
 const metrics=await page.locator('.cap-edit-kpis').textContent();
 await page.getByRole('button',{name:'试改这个标题 ↗'}).click();
 await expect(page.locator('.cap-edit-region')).toHaveAttribute('data-refined','true');
 await expect(page.locator('.cap-edit-kpis')).toHaveText(metrics);
 await page.getByRole('button',{name:'↶ 撤回示例修改'}).click();
 await expect(page.locator('.cap-edit-region h4')).toHaveText(original);
 await expect(page.locator('.canvas-sidebar button').nth(2)).toHaveAttribute('aria-pressed','true');
 });

test('expressive homepage gallery opens distinct complete directions with working calls to action', async ({page}) => {
 await page.goto('/about');
 for(const id of ['A','B','C']) {
  const frame=page.frameLocator(`.demo-preview iframe[title^="${id} "]`);
  await expect(frame.locator('main')).toHaveAttribute('data-expressive-direction',id);
  const link=page.locator('.demo-preview-link').nth(['A','B','C'].indexOf(id));
  await expect(link).toHaveAttribute('href',`/directions?direction=${id}&language=zh`);
 }
 for(const id of ['A','B','C']) {
  await page.goto(`/directions?direction=${id}&language=en`);
  await expect(page.locator('h1')).toBeVisible();
  for(const width of [390,577,1200]) {
   await page.setViewportSize({width,height:853});
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
  await page.locator('.ex-cta').click();
  await expect(page).toHaveURL(/#guided-demo$/);
 }
});

 test('product pages share their visual system and pricing controls preserve language and values', async ({page})=>{
 await page.goto('/about');
 const homeFont=await page.locator('h1').evaluate(el=>getComputedStyle(el).fontFamily);
 await page.locator('.site-nav a[href="/pricing"]').click();
 await expect(page.locator('h1')).toHaveCSS('font-family',homeFont);
 await expect(page.locator('.pricing-page')).toHaveCSS('background-color','rgb(247, 247, 242)');
 await expect(page.locator('.price strong')).toHaveText(['$0','$20','$41']);
 await page.getByRole('button',{name:'月付',exact:true}).click();
 await expect(page.locator('.price strong')).toHaveText(['$0','$24','$49']);
 await page.locator('.pricing-faq summary').first().click();
 await expect(page.locator('.pricing-faq details').first()).toHaveAttribute('open','');
 await page.getByRole('button',{name:'切换到英文'}).click();
 await expect(page.locator('h1')).toContainText('Taste is free.');
 for(const width of [320,390,577,1440]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)}
 await page.locator('.pricing-card').first().getByRole('link').click();
 await expect(page).toHaveURL(/\/docs$/);
 await expect(page.locator('html')).toHaveAttribute('lang','en');
 await page.locator('.site-footer a[href="/lab"]').click();await page.locator('a[href="/lab/workbench"]').click();
 await expect(page.locator('.site-workbench')).toHaveCSS('background-color','rgb(247, 247, 242)');
 await expect(page.locator('.site-nav')).toBeVisible();
 });

test('direction library pages are prerendered, browsable and keep old links working', async ({page,request})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const raw=await(await request.get('/d/harbor')).text();
 expect(raw).toContain('<title>Harbor：成员与权限的三种管理方式 — Variant Design 方向库</title>');
 expect(raw).toContain('<link rel="canonical" href="https://variant-design-skill.vercel.app/d/harbor">');
 expect(raw).toContain('<meta property="og:image" content="https://variant-design-skill.vercel.app/media/harbor/a.jpg">');
 expect(raw).toContain('Access Ledger');expect(raw).toContain('推荐 A');
 expect(await(await request.get('/lab/canvas')).text()).not.toContain('rel="canonical"');
 const sitemap=await(await request.get('/sitemap.xml')).text();
 for(const slug of ['harbor','pulse','variant-site','offscript','forma'])expect(sitemap).toContain(`/d/${slug}</loc>`);
 expect((await(await request.get('/feed.xml')).text()).match(/<item>/g)).toHaveLength(5);
 await page.goto('/');
 const cards=page.locator('.library-grid .library-card');await expect(cards).toHaveCount(5);await expect(cards.first()).toContainText('Harbor');
 await expect.poll(()=>page.locator('.library-card img').evaluateAll(images=>images.every(img=>img.complete&&img.naturalWidth>0))).toBe(true);
 await page.locator('.content-filters a[href="/c/data"]').click();await expect(page).toHaveURL(/\/c\/data$/);await expect(cards).toHaveCount(2);
 await cards.filter({hasText:'Pulse'}).locator('a').click();await expect(page).toHaveURL(/\/d\/pulse$/);
 await expect(page.locator('.library-tabs button').first()).toHaveAttribute('aria-pressed','true');await expect(page.locator('.library-recommendation')).toContainText('推荐 A');
 await expect(page.locator('.library-recommendation')).toContainText('推荐不等于选定');
 await page.locator('.library-tabs button').nth(1).click();await expect(page).toHaveURL(/\/d\/pulse\?direction=B$/);await expect(page.locator('.library-figure img')).toHaveAttribute('src','/media/pulse/b.jpg');
 await expect(page.locator('.library-evidence a')).toHaveAttribute('href',/\/tree\/master\/website\/content\/evidence\/pulse\/variant-output$/);
 const prompt=page.getByRole('textbox',{name:'给 agent 的指令'});
 await expect(prompt).toHaveValue(/https:\/\/variant-design-skill\.vercel\.app\/d\/pulse\.json 里的 B 方向/);await expect(prompt).toHaveValue(/不要替我选定/);
 await page.locator('.library-tabs button').nth(2).click();await expect(prompt).toHaveValue(/里的 C 方向/);
 const card=await(await request.get('/d/pulse.json')).json();const {validateCard}=await import('../scripts/direction-card.mjs');
 expect(validateCard(card)).toEqual([]);expect(card.url).toBe('https://variant-design-skill.vercel.app/d/pulse.json');expect(card.recommendation.variant).toBe('A');
 await page.goto('/d/offscript');await expect(page.locator('.library-source span')).toHaveText('概念作品');await expect(page.locator('.library-evidence')).toContainText('不是技能的产出');await expect(page.locator('.library-evidence a')).toHaveCount(0);
 await expect(page.locator('.library-figure a')).toHaveAttribute('href','/directions?direction=A&language=zh');
 await page.getByRole('button',{name:'切换到英文'}).click();await expect(page.locator('h1')).toHaveText('offscript: one brand, three personalities');await page.getByRole('button',{name:'Switch to Chinese'}).click();
 for(const url of ['/','/d/harbor','/c/product']){await page.goto(url);for(const width of [320,390,1440]){await page.setViewportSize({width,height:900});await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}}
 await page.goto('/showcase/forma');await expect(page).toHaveURL(/\/d\/forma$/);await expect(page.locator('h1')).toContainText('Forma');
 await page.goto('/showcase');await expect(page).toHaveURL(/\/$/);await expect(cards).toHaveCount(5);
 await page.goto('/showcase?direction=B');await expect(page.locator('[data-showcase-direction]')).toHaveAttribute('data-showcase-direction','B');
 await page.goto('/canvas?new=1');await expect(page).toHaveURL(/\/lab\/canvas\?new=1$/);
 await page.goto('/d/missing-entry');await expect(page.locator('h1')).toHaveText('页面不存在');
 expect(errors).toEqual([]);
});

test('skills page lists only tried skills with records and a verified install command', async ({page,request})=>{
 expect(await(await request.get('/skills')).text()).toContain('<title>设计技能 — Variant Design</title>');
 await page.goto('/');await page.locator('.site-nav a[href="/skills"]').click();await expect(page).toHaveURL(/\/skills$/);
 await expect(page.locator('.skills-entry')).toHaveCount(1);await expect(page.locator('.skills-entry h2')).toContainText('variant-design');
 await expect(page.locator('.skills-entry code')).toHaveText('npx skills add YuqingNicole/variant-design-skill -a claude-code -a codex');
 await expect(page.locator('.skills-records a')).toHaveCount(3);
 for(const href of await page.locator('.skills-records a').evaluateAll(a=>a.map(x=>x.getAttribute('href'))))expect(href).toMatch(/\/blob\/master\/docs\/research\/2026-10-2[67]-[a-z-]+\.md$/);
 for(const url of ['/skills','/','/d/pulse']){await page.goto(url);for(const width of [320,390,1440]){await page.setViewportSize({width,height:900});await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}}
});

test('docs recover from clipboard denial', async ({page})=>{
 await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:()=>Promise.reject(new Error('denied'))}}));
 await page.goto('/d/harbor');await page.getByRole('button',{name:'复制指令'}).click();await expect(page.locator('.library-try [role="status"]')).toContainText('手动复制');
 await page.goto('/docs');
 await page.getByRole('button',{name:'复制安装命令'}).click();
 await expect(page.getByRole('status')).toContainText('手动复制');
 await expect(page.getByRole('textbox',{name:'安装命令'})).toHaveValue(/git clone.*variant-design/);
 for(const width of [320,390,1440]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)}
});

test('inspiration references filter, create an original brief and recover from copy denial', async ({page})=>{
 await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:()=>Promise.reject(new Error('denied'))}}));
 await page.goto('/');
 await page.locator('.library-more a[href="/inspiration"]').click();
 const cards=page.locator('.inspiration-grid article');
 await expect(cards).toHaveCount(24);
 for(const [name,count] of [['Landing',12],['产品界面',8],['关键流程',4]]){
  await page.getByRole('button',{name,exact:true}).click();
  await expect(cards).toHaveCount(count);
 }
 await page.getByRole('button',{name:'产品界面',exact:true}).click();
 await page.getByRole('searchbox').fill('Figma');
 await expect(cards).toHaveCount(1);
 await cards.getByRole('button',{name:'生成参考指令'}).click();
 await expect(page.locator('.inspiration-brief')).toBeFocused();
 await expect(page.getByRole('textbox',{name:'参考设计指令'})).toHaveValue(/https:\/\/www.figma.com\/design\//);
 await expect(page.getByRole('textbox',{name:'参考设计指令'})).toHaveValue(/不复制其文案、商标与素材/);
 await page.getByRole('button',{name:'复制指令',exact:true}).click();
 await expect(page.locator('.inspiration-brief [role="status"]')).toContainText('手动复制');
 await page.getByRole('button',{name:'收起',exact:true}).click();
 await page.getByRole('searchbox').fill('nonexistent-reference');
 await expect(cards).toHaveCount(0);
 await expect(page.locator('.inspiration-empty')).toBeVisible();
 await page.getByRole('searchbox').fill('');
 await page.getByRole('button',{name:'切换到英文'}).click();
 await expect(page.locator('h1')).toHaveText('Turn inspiration into a brief.');
 for(const width of [320,390,1440]){
  await page.setViewportSize({width,height:900});
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 await page.reload();
 await expect(page.locator('html')).toHaveAttribute('lang','en');
});

test('inspiration references host no third-party images and link to their sources', async ({page})=>{
 const imageRequests=[];page.on('request',r=>{if(r.resourceType()==='image'&&!new URL(r.url()).pathname.startsWith('/variant-mark'))imageRequests.push(r.url());});
 await page.goto('/inspiration');
 await expect(page.locator('.inspiration-grid article')).toHaveCount(24);await expect(page.locator('.inspiration-grid .inspiration-link-only')).toHaveCount(24);
 await expect(page.locator('.inspiration-page img:not(.site-brandmark)')).toHaveCount(0);await expect(page.locator('.inspiration-moodboard .inspiration-cover')).toHaveCount(3);
 await expect(page.locator('.inspiration-grid article h2 a').first()).toHaveAttribute('href','https://linear.app/');await expect(page.locator('.inspiration-link-only').first()).toHaveText('仅链接');
 await expect(page.locator('.inspiration-disclosure')).toContainText('不托管对方的截图');await expect(page.locator('.inspiration-disclosure a[href="/submit"]')).toBeVisible();
 expect((await page.request.get('/inspiration/linear.webp')).headers()['content-type']).toContain('text/html');
 for(const width of [320,390,1440]){
  await page.setViewportSize({width,height:900});
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 await page.emulateMedia({reducedMotion:'reduce'});
 expect(await page.locator('.inspiration-moodboard a').first().evaluate(el=>parseFloat(getComputedStyle(el).transitionDuration))).toBeLessThan(0.001);
 expect(imageRequests).toEqual([]);
});

test('submission page states the three entry kinds, permissions and takedown process in both languages', async ({page})=>{
 await page.goto('/inspiration');await page.locator('.site-footer a[href="/submit"]').click();await expect(page).toHaveURL(/\/submit$/);
 await expect(page.locator('h1')).toHaveText('投稿与授权');await expect(page.locator('.submit-sources li')).toHaveCount(3);
 await expect(page.locator('[data-source="link-only"]')).toContainText('不托管对方的截图');await expect(page.getByRole('heading',{name:'撤下请求'})).toBeVisible();
 await expect(page.locator('.content-reading a[href$="/issues/new/choose"]')).toBeVisible();
 await page.getByRole('button',{name:'切换到英文'}).click();await expect(page.locator('h1')).toHaveText('Submissions & permissions');await expect(page.getByRole('heading',{name:'Takedown requests'})).toBeVisible();
 for(const width of [320,1440]){await page.setViewportSize({width,height:900});await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
});

test('actual landing evidence names its observed font and unverified checks',async({page,browser})=>{
 const fs=await import('node:fs');const path=await import('node:path');
 const {verifyArtifact}=await import('../scripts/artifact-verification.mjs');
 const project=path.resolve('../website'),root=path.join(project,'variant-output');
 const dependencies=fs.readdirSync(path.join(project,'src'),{recursive:true}).filter(name=>fs.statSync(path.join(project,'src',name)).isFile()).map(name=>'src/'+name);
 const state=JSON.parse(fs.readFileSync(path.join(root,'.variant-context.json'),'utf8'));
 const result=await verifyArtifact(root,'B',{projectRoot:project,dependencies},async()=>{
  await page.goto('/variant-output/_preview/B.html');await expect(page.locator('h1')).toBeVisible();
  const family=await page.locator('h1').evaluate(el=>getComputedStyle(el).fontFamily);
  return [{id:'brand',status:state.designSystem.fonts.some(font=>family.includes(font))?'passed':'failed',reason:'Observed the real B landing heading; other elements are outside this observation',tool:{name:'Chromium via Playwright',version:browser.version()},environment:{url:page.url(),viewport:page.viewportSize()},evidence:[family]}];
 });
 expect(result.report.checks.find(c=>c.id==='brand').status).toBe('passed');expect(result.status).toBe('unverified');
});

const workspaceDirections=(label,html)=>['A','B','C'].map(id=>({id,name:`${label} ${id}`,thesis:'A test direction',typography:'Georgia',density:'Balanced',layout:'editorial',layoutLabel:'Editorial',motion:'None',reason:'Testing history',colors:['#111111','#ffffff','#336699','#eeeeee'],sampleTitle:label,sampleMeta:'Fixture',contract:{artDirection:'Editorial',signatureMove:'Grid',contentPlan:['Hero'],avoid:['Noise']},...(html?{html:`<!doctype html><html><body><h1>${label}</h1></body></html>`}:{})}));
const workspaceVersion=(label,html=false)=>({id:label,action:'generated',brief:label,selectedId:'A',directions:workspaceDirections(label,html),createdAt:'2026-10-27T00:00:00.000Z'});

for(const action of ['build','iterate','generate']) test(`restoring history discards a pending ${action} result even if cancellation fails`,async({page})=>{
 await page.addInitScript(versions=>localStorage.setItem('variant-workspace-v2',JSON.stringify(versions)),[workspaceVersion('Recent',action==='iterate'),workspaceVersion('Restored')]);
 await page.addInitScript(()=>{const request=window.fetch;window.fetch=(url,options)=>request(url,{...options,signal:undefined});});
 await page.route('**/api/status',route=>route.fulfill({json:{configured:true,provider:'test'}}));
 let release;const gate=new Promise(resolve=>release=resolve);let started;const requested=new Promise(resolve=>started=resolve);
 await page.route(`**/api/${action}`,async route=>{const input=route.request().postDataJSON();started();await gate;await route.fulfill({json:action==='generate'?{directions:workspaceDirections('Late result',true)}:{direction:{...input.direction,name:'Late result',html:'<!doctype html><html><body>Late</body></html>'}}}).catch(()=>{});});
 await page.goto('/workbench');
 await page.locator('.workspace-history li').first().getByRole('button').click();
 await (action==='generate'?page.locator('#generator button[type=submit]'):page.locator('.workspace-actions button').nth(action==='build'?0:1)).click();await requested;
 await page.locator('.workspace-history li').nth(1).getByRole('button').click();
 release();await page.waitForTimeout(300);
 await expect(page.locator('#design-prompt')).toHaveValue('Restored');
 await expect(page.locator('.workspace-history li')).toHaveCount(2);
 await expect(page.locator('#workspace')).not.toContainText('Late result');
});

test('corrupt history is skipped, valid records reload, and quota failure keeps export available',async({page})=>{
 const valid=workspaceVersion('Valid',true);
 const records=[{...valid,id:'bad-date',createdAt:'invalid'}, {...valid,id:'missing',directions:[]},{...valid,id:'future',schemaVersion:99},{...valid,id:'bad-action',action:{toString:null}},{...valid,id:'bad-selected',selectedId:{toString:null}},{...valid,id:'bad-direction',directions:[{...valid.directions[0],id:{toString:null}},...valid.directions.slice(1)]},{...valid,id:'bad-layout',directions:[{...valid.directions[0],layout:{toString:null}},...valid.directions.slice(1)]},valid];
 await page.addInitScript(records=>{
  if(!sessionStorage.getItem('seeded')){localStorage.setItem('variant-workspace-v2',JSON.stringify(records));sessionStorage.setItem('seeded','1');}
  const set=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='variant-workspace-v2')throw new DOMException('Quota full','QuotaExceededError');return set.call(this,key,value);};
 },records);
 await page.route('**/api/status',route=>route.fulfill({json:{configured:true,provider:'test'}}));
 await page.route('**/api/iterate',route=>route.fulfill({json:{direction:{...valid.directions[0],name:'In memory'}}}));
 await page.goto('/workbench');
 await expect(page.locator('.workspace-history li')).toHaveCount(1);
 await expect(page.locator('.workspace-notice')).toContainText('无效记录');
 await expect(page.locator('#design-prompt')).toHaveValue('Valid');
 await page.locator('.workspace-actions button').nth(1).click();
 await expect(page.locator('.workspace-notice')).toContainText('未能保存');
 await expect(page.locator('.workspace-history li')).toHaveCount(2);
 const download=page.waitForEvent('download');await page.locator('.workspace-export').click();expect((await download).suggestedFilename()).toMatch(/\.html$/);
 await page.reload();await expect(page.locator('.workspace-history li')).toHaveCount(1);await expect(page.locator('#design-prompt')).toHaveValue('Valid');
});

test('an obsolete failure cannot clear the busy state of a newer request',async({page})=>{
 await page.addInitScript(versions=>{localStorage.setItem('variant-workspace-v2',JSON.stringify(versions));const request=window.fetch;window.fetch=(url,options)=>request(url,{...options,signal:undefined});},[workspaceVersion('Recent'),workspaceVersion('Restored')]);
 await page.route('**/api/status',route=>route.fulfill({json:{configured:true,provider:'test'}}));
 const requests=[];await page.route('**/api/build',route=>requests.push(route));
 await page.goto('/workbench');await page.locator('.workspace-actions button').first().click();await expect.poll(()=>requests.length).toBe(1);
 await page.locator('.workspace-history li').nth(1).getByRole('button').click();
 await page.locator('.workspace-actions button').first().click();await expect.poll(()=>requests.length).toBe(2);
 await requests[0].fulfill({status:500,json:{error:'old_failure'}});await page.waitForTimeout(100);
 await expect(page.locator('.workspace-actions button').first()).toBeDisabled();await expect(page.locator('.workspace-notice')).not.toHaveClass(/is-error/);
 const direction=requests[1].request().postDataJSON().direction;
 await requests[1].fulfill({json:{direction:{...direction,html:'<!doctype html><html><body>Current result</body></html>'}}});
 await expect(page.locator('.workspace-notice')).toContainText('已保存');
 await expect(page.locator('#design-prompt')).toHaveValue('Restored');
});

test('invalid JSON and denied storage do not prevent the workspace from rendering',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('variant-workspace-v2','{broken'));
 await page.goto('/workbench');await expect(page.locator('.workspace-notice')).toContainText('无法读取');await expect(page.locator('.direction-card')).toHaveCount(3);
 await page.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Denied','SecurityError');}}));
 await page.reload();await expect(page.locator('.direction-card')).toHaveCount(3);await expect(page.locator('.workspace-notice')).toContainText('无法读取');
});

test('history retains twelve entries and retry saves in-memory work without another model call',async({page})=>{
 const records=Array.from({length:15},(_,i)=>workspaceVersion(`Version ${i}`,true));
 await page.addInitScript(records=>{
  if(!sessionStorage.getItem('seeded')){localStorage.setItem('variant-workspace-v2',JSON.stringify(records));sessionStorage.setItem('seeded','1');}
  window.rejectWorkspaceSave=true;const set=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='variant-workspace-v2'&&window.rejectWorkspaceSave)throw new DOMException('Quota full','QuotaExceededError');return set.call(this,key,value);};
 },records);
 await page.route('**/api/status',route=>route.fulfill({json:{configured:true,provider:'test'}}));
 let calls=0;await page.route('**/api/iterate',route=>{calls++;return route.fulfill({json:{direction:{...records[0].directions[0],name:'Saved on retry'}}});});
 await page.goto('/workbench');await expect(page.locator('.workspace-history li')).toHaveCount(12);
 await page.locator('.workspace-actions button').nth(1).click();await expect(page.locator('.workspace-notice')).toContainText('未能保存');
 await page.evaluate(()=>window.rejectWorkspaceSave=false);await page.getByRole('button',{name:'重新保存历史'}).click();
 await expect(page.locator('.workspace-notice')).toContainText('已保存');expect(calls).toBe(1);
 await page.reload();await expect(page.locator('.workspace-history li')).toHaveCount(12);
 await expect(page.locator('.direction-card h3').first()).toHaveText('Saved on retry');
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('variant-workspace-v2')));expect(saved[0].schemaVersion).toBe(2);expect(saved[0].selectedVariant).toBeUndefined();
});

test('reference pack keeps per-item intentions and source links in its brief', async ({page})=>{
 await page.goto('/inspiration');
 const cards=page.locator('.inspiration-grid article');
 await cards.nth(0).getByRole('button',{name:'加入参考包'}).click();
 await cards.nth(1).getByRole('button',{name:'加入参考包'}).click();
 const pack=page.locator('.inspiration-pack');
 await expect(pack.locator('fieldset')).toHaveCount(2);
 await pack.locator('fieldset').first().getByLabel('参考什么',{exact:true}).fill('信息层级');
 await pack.locator('fieldset').first().getByLabel('不参考什么').fill('深色背景');
 await pack.getByRole('button',{name:'生成参考包指令'}).click();
 const brief=page.getByRole('textbox',{name:'参考设计指令'});
 await expect(brief).toHaveValue(/信息层级/);
 await expect(brief).toHaveValue(/深色背景/);
 await expect(brief).toHaveValue(/https:\/\/linear.app\//);
 await expect(brief).toHaveValue(/其他用途未知/);
 await pack.locator('fieldset').nth(1).getByRole('button',{name:'移除'}).click();
 await expect(pack.locator('fieldset')).toHaveCount(1);
});

test('reference pack restores locally and reports storage failures', async ({page})=>{
 await page.goto('/inspiration');
 await page.locator('.inspiration-grid article').first().getByRole('button',{name:'加入参考包'}).click();
 await page.locator('.inspiration-pack').getByLabel('参考什么',{exact:true}).fill('信息层级');
 await page.reload();
 await expect(page.locator('.inspiration-pack').getByLabel('参考什么',{exact:true})).toHaveValue('信息层级',{timeout:15000});
 await page.evaluate(()=>localStorage.setItem('variant-inspiration-pack-v1','invalid'));
 await page.reload();
 await expect(page.getByRole('alert')).toContainText('无法读取或保存');
 await page.locator('.inspiration-grid article').first().getByRole('button',{name:'加入参考包'}).click();
 expect(await page.evaluate(()=>localStorage.getItem('variant-inspiration-pack-v1'))).toBe('invalid');
});

test('reference pack reports failed local writes while keeping current edits', async ({page})=>{
 await page.addInitScript(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='variant-inspiration-pack-v1')throw new Error('storage unavailable');return original.call(this,key,value)}});
 await page.goto('/inspiration');
 await page.locator('.inspiration-grid article').first().getByRole('button',{name:'加入参考包'}).click();
 await expect(page.getByRole('alert')).toContainText('无法读取或保存');
 await expect(page.locator('.inspiration-pack fieldset')).toHaveCount(1);
});

test('home connects reference discovery, cases and the project workflow', async ({page})=>{
 await page.goto('/');
 await expect(page.locator('.library-path li')).toHaveCount(3);
 await expect(page.locator('.site-nav a[href="/inspiration"]')).toBeVisible();
 await expect(page.locator('#works .library-card').first()).toBeVisible();
 await page.getByRole('link',{name:'寻找设计参考 ↗'}).click();
 await expect(page).toHaveURL(/\/inspiration$/);
 await expect(page.locator('.site-nav a[href="/inspiration"]')).toHaveAttribute('aria-current','page');
 await page.goto('/');
 await page.getByRole('button',{name:'切换到英文'}).click();
 await expect(page.getByRole('heading',{name:'From inspiration to your own direction.'})).toBeVisible();
 for(const width of [320,390,1440]){
  await page.setViewportSize({width,height:900});
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await expect(page.locator('.site-nav a[href="/inspiration"]')).toBeVisible();
 }
});
