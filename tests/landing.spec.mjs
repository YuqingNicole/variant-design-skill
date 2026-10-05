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
