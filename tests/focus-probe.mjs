// Tabs through a page and reports each focused element's focus ring and its contrast against the background behind it.
// WCAG 2.2 asks 3:1 for a focus indicator against adjacent colours; this checks the ring colour, not full compliance.
const luminance = ([r, g, b]) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
export const contrast = (a, b) => { const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
export async function probeFocus(page, { tabs = 14 } = {}) {
  const found = [];
  for (let i = 0; i < tabs; i++) {
    await page.keyboard.press('Tab');
    found.push(await page.evaluate(() => {
      const el = document.activeElement; if (!el || el === document.body) return null;
      const s = getComputedStyle(el), parse = c => (c.match(/[\d.]+/g) || []).map(Number);
      // The ring sits outside the element when it has an offset, so it is judged against what is behind it, not the element's own fill.
      let bg = parseFloat(s.outlineOffset) >= 1 ? el.parentElement : el, color = [255, 255, 255];
      while (bg) { const c = parse(getComputedStyle(bg).backgroundColor); if (c.length >= 3 && (c[3] ?? 1) > 0.5) { color = c.slice(0, 3); break; } bg = bg.parentElement; }
      const r = el.getBoundingClientRect();
      return { tag: el.tagName.toLowerCase(), label: (el.getAttribute('aria-label') || el.textContent || el.getAttribute('href') || '').trim().slice(0, 28), ring: s.outlineStyle === 'none' || s.outlineWidth === '0px' ? null : parse(s.outlineColor).slice(0, 3), width: s.outlineWidth, background: color, visible: r.width > 0 && r.height > 0 };
    }));
  }
  return found.filter(Boolean).filter(f => f.visible).map(f => ({ ...f, ratio: f.ring ? +contrast(f.ring, f.background).toFixed(2) : 0 }));
}
if (process.argv[1] && import.meta.url === new URL(process.argv[1], 'file:').href) {
  const { chromium } = await import('@playwright/test'), { spawn } = await import('node:child_process');
  const server = spawn('node', ['../website/server.mjs'], { env: { ...process.env, PORT: '4197' }, stdio: 'ignore' }); await new Promise(r => setTimeout(r, 1500));
  const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined }), page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.route(u => u.origin !== 'http://127.0.0.1:4197', r => r.abort());
  for (const path of process.argv.slice(2).length ? process.argv.slice(2) : ['/', '/browse/web', '/inspiration/linear', '/cases', '/skills', '/guides', '/docs', '/pricing', '/about', '/sponsor', '/submit', '/changelog', '/lab']) {
    await page.goto('http://127.0.0.1:4197' + path); await page.waitForTimeout(700);
    const rows = await probeFocus(page), colors = [...new Set(rows.map(r => r.ring ? r.ring.join(',') : 'none'))];
    console.log(path.padEnd(22), 'rings:', colors.join(' | '), '| min ratio', Math.min(...rows.map(r => r.ratio)).toFixed(2), '| focused', rows.length);
  }
  await browser.close(); server.kill();
}
