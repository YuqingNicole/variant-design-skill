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
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('只修改 C 的 hero');
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
  await page.goto('/');
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
  await page.locator('.site-footer a[href="/workbench"]').click();
  await expect(page.locator('#generator')).toBeVisible();
});

 test('capability studies preserve data across directions and undo only the example title', async ({page}) => {
 await page.goto('/');
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
 await page.goto('/');
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
 await page.goto('/');
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
 await page.locator('.site-footer a[href="/workbench"]').click();
 await expect(page.locator('.site-workbench')).toHaveCSS('background-color','rgb(247, 247, 242)');
 await expect(page.locator('.site-nav')).toBeVisible();
 });

test('case library links to working details and docs recover from clipboard denial', async ({page})=>{
 await page.goto('/showcase');
 await expect(page.locator('.content-case-grid article')).toHaveCount(3);
 await page.getByRole('button',{name:'已验证项目',exact:true}).click();
 await expect(page.locator('.content-case-grid article')).toHaveCount(1);
 await page.locator('.content-case-grid article>a').click();
 await expect(page).toHaveURL(/\/showcase\/variant-site$/);
 await page.locator('.content-directions button').first().click();
 await expect(page.frameLocator('.content-detail-preview iframe').locator('main')).toHaveAttribute('data-landing-direction','A');
 await expect(page.locator('.content-reading a')).toHaveAttribute('href',/\/pull\/10$/);
 for(const id of ['offscript','forma']){
 await page.goto(`/showcase/${id}`);
 await page.locator('.content-directions button').last().click();
 await expect(page.locator('.content-detail-preview')).toHaveAttribute('href',/direction=C/);
 }
 await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:()=>Promise.reject(new Error('denied'))}}));
 await page.goto('/docs');
 await page.getByRole('button',{name:'复制安装命令'}).click();
 await expect(page.getByRole('status')).toContainText('手动复制');
 await expect(page.getByRole('textbox',{name:'安装命令'})).toHaveValue(/git clone.*variant-design/);
 for(const url of ['/docs','/showcase','/showcase/offscript']){
 await page.goto(url);
 for(const width of [320,390,1440]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)}
 }
 await page.getByRole('button',{name:'切换到英文'}).click();
 await expect(page.locator('h1')).toHaveText('One brand. Three personalities.');
});

test('inspiration references filter, create an original brief and recover from copy denial', async ({page})=>{
 await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:()=>Promise.reject(new Error('denied'))}}));
 await page.goto('/showcase');
 await page.locator('.content-library a[href="/inspiration"]').click();
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
