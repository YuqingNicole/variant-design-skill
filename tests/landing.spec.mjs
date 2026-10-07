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
  await page.goto('/');
  await expect(page.locator('main')).toHaveAttribute('data-landing-direction', 'B');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.locator('.hero-actions a').first().evaluate(el => el.getBoundingClientRect().bottom)).toBeLessThan(844);
  await expect(page.locator('#generator button[type="submit"]')).toBeDisabled();
  await page.locator('.mobile-navigation summary').click();
  await page.locator('.mobile-navigation a[href="/pricing"]').click();
  await expect(page).toHaveURL(/\/pricing$/);
  await page.goto('/');
  await page.locator('#design-prompt').fill('A landing page for the real Variant Design project');
  await page.getByRole('button', { name: '切换到英文' }).click();
  await expect(page.locator('#design-prompt')).toHaveValue('A landing page for the real Variant Design project');
  await expect(page.locator('h1')).toContainText('Three directions.');
  await expect(page.locator('html')).toHaveCSS('scroll-behavior', 'auto');
  await page.goto('/');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Switch to Chinese' })).toBeFocused();
  await expect(page.getByRole('button', { name: 'Switch to Chinese' })).toHaveCSS('outline-style', 'solid');
});

test('guided case previews real variants and hands off scoped, reversible prompts without selecting a winner', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
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
  await page.goto('/#guided-demo');
  await page.locator('.demo-steps details').first().getByRole('button', { name: '复制指令' }).click();
  await expect(page.locator('.demo-notice')).toContainText('文本框');
  await expect(page.getByRole('textbox', { name: '第 1 步指令' })).toBeVisible();
});

test('direction artwork switches accessibly and reduced motion cancels active entrances', async ({ page }) => {
  await page.goto('/');
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
