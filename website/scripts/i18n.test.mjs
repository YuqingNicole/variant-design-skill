import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { importTs } from './ts-module.mjs';
const { locales, localeCodes, publishedLocales, fallbackChain, isLocale, sourceLocale } = await importTs(fileURLToPath(new URL('../src/i18n/locales.ts', import.meta.url)));
const { t, has, resolvedLocale, fromPair, completeIn, isLocalized } = await importTs(fileURLToPath(new URL('../src/i18n/localized.ts', import.meta.url)));
const { formatDate, formatNumber, collator } = await importTs(fileURLToPath(new URL('../src/i18n/format.ts', import.meta.url)));

test('the locale table keeps Chinese unprefixed and every other language on its own prefix', () => {
  assert.equal(sourceLocale, 'zh'); assert.equal(locales.zh.path, ''); assert.equal(locales.zh.fallback, null);
  const paths = localeCodes.map(l => locales[l].path);
  assert.equal(new Set(paths).size, paths.length);
  for (const l of localeCodes.filter(l => l !== 'zh')) assert.match(locales[l].path, /^\/[a-z]{2}(-[a-z]{2,4})?$/, l);
  for (const l of localeCodes) { assert.ok(locales[l].htmlLang && locales[l].label && locales[l].dateLocale, l); if (locales[l].fallback) assert.ok(isLocale(locales[l].fallback), l); }
  assert.deepEqual(publishedLocales, ['zh', 'en']);
  assert.equal(isLocale('en'), true); assert.equal(isLocale('toString'), false); assert.equal(isLocale('fr'), false);
});

test('every fallback chain ends in the source language without loops', () => {
  for (const l of localeCodes) { const chain = fallbackChain(l); assert.equal(chain[0], l); assert.equal(chain.at(-1), 'zh'); assert.equal(new Set(chain).size, chain.length); }
  assert.deepEqual(fallbackChain('en'), ['en', 'zh']);
});

test('t() returns the requested language, falls back when it is missing or empty, and requires the source', () => {
  assert.equal(t({ zh: '灵感参考', en: 'Inspiration' }, 'en'), 'Inspiration');
  assert.equal(t({ zh: '灵感参考' }, 'en'), '灵感参考'); assert.equal(t({ zh: '灵感参考', en: '' }, 'en'), '灵感参考');
  assert.equal(resolvedLocale({ zh: '灵感参考' }, 'en'), 'zh'); assert.equal(resolvedLocale({ zh: 'a', en: 'b' }, 'en'), 'en');
  const count = { zh: n => `${n} 个参考`, en: n => `${n} references` };
  assert.equal(t(count, 'en')(34), '34 references');
  assert.throws(() => t({}, 'en'), /Missing zh/);
  assert.equal(has({ zh: 'a', en: '' }, 'en'), false);
});

test('fromPair bridges the existing [zh, en] pairs without changing what is shown', () => {
  const pair = ['产品界面', 'Product'];
  assert.deepEqual(fromPair(pair), { zh: '产品界面', en: 'Product' });
  for (const [ix, l] of [[0, 'zh'], [1, 'en']]) assert.equal(t(fromPair(pair), l), pair[ix]);
  assert.deepEqual(completeIn(fromPair(pair)), ['zh', 'en']); assert.deepEqual(completeIn({ zh: '只有中文' }), ['zh']);
  assert.equal(isLocalized({ zh: 'a', en: 'b' }), true); assert.equal(isLocalized(['a', 'b']), false); assert.equal(isLocalized({ en: 'b' }), false); assert.equal(isLocalized({ zh: 'a', xx: 'b' }), false);
});

test('dates, numbers and sorting come from the locale table and do not shift with the timezone', () => {
  assert.equal(formatDate('2026-11-01', 'zh'), '2026年11月1日'); assert.equal(formatDate('2026-11-01', 'en'), 'November 1, 2026');
  assert.equal(formatDate('2026-01-01', 'en', 'short'), '01/01/2026');
  assert.equal(formatNumber(12480, 'en'), '12,480');
  assert.deepEqual(['item 10', 'Item 2', 'item 1'].sort(collator('en').compare), ['item 1', 'Item 2', 'item 10']);
});

test('the inventory counts every inline language choice of copy, not choices between language codes', async () => {
  const fs = await import('node:fs'), os = await import('node:os'), path = await import('node:path');
  const { inventory } = await import('./i18n-inventory.mjs');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18n-inventory-'));
  fs.writeFileSync(path.join(dir, 'Page.tsx'), [
    "const a = zh ? '保存' : 'Save';",
    "const b = language === 'zh' ? '取消' : 'Cancel';",
    'const c = language==="zh"?`共 ${n} 条`:`${n} items`;',
    "const d = lang === 'en' ? 'Done' : '完成';",
    "document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';",
    "const next = language === 'zh' ? 'en' : 'zh';",
  ].join('\n'));
  try { assert.equal(inventory(dir).total.ternaries, 4); } finally { fs.rmSync(dir, { recursive: true }); }
});

