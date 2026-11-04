// Host-owned browser evidence for the premium fixture. Never trust samples written by the Agent.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { probe, grade as budgetGrade, keys } from '../scripts/style-budget.mjs';
import { localFile, readContext, undoVariant } from '../scripts/variant-history.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const viewports = [{ width: 1440, height: 900 }, { width: 390, height: 844 }];
const need = (condition, message) => { if (!condition) throw new Error(message); };

async function exercise(page, books) {
  const visible = () => page.locator('[data-book]:visible').count();
  need(await visible() === books.length, 'All book records must remain visible before filtering');
  for (const book of books) {
    const text = await page.locator(`[data-book="${book.id}"]`).innerText();
    need(text.includes(book.title) && text.includes(book.author), `Missing title/author for ${book.id}`);
  }
  await page.locator('#search').fill(books[0].title);
  need(await visible() === 1 && await page.locator(`[data-book="${books[0].id}"]`).isVisible(), 'Search must find the requested title');
  await page.locator('#category').selectOption('nonfiction');
  need(await visible() === 0 && await page.locator('#empty').isVisible(), 'Combined filters need a real empty state');
  await page.locator('#category').selectOption('all'); await page.locator('#search').fill('');
  need(await visible() === books.length, 'Clearing filters must restore every book');
  const button = page.locator(`[data-save="${books[0].id}"]`);
  await button.click(); need(await button.getAttribute('aria-pressed') === 'true', 'Save state must be visible');
  need(await page.locator('#saved-count').innerText() === '1 saved', 'Saved counter must increment');
  await page.locator('#saved-view').click(); need(await visible() === 1, 'Saved-only view must show the saved book');
  await page.locator('#saved-view').click(); need(await visible() === books.length, 'All-books view must restore every book');
  await button.click(); need(await button.getAttribute('aria-pressed') === 'false', 'Unsave must clear the selection');
  need(await page.locator('#saved-count').innerText() === '0 saved', 'Saved counter must return to zero');
}

export async function capturePremium(project, { out, browser, variant = 'B', content = 'src/books.json' } = {}) {
  const root = path.join(project, 'variant-output'), context = readContext(root), file = localFile(root, context.variants[variant].entry);
  need(file.endsWith('.html'), 'Premium fixture measurement requires a real HTML entry');
  const books = JSON.parse(fs.readFileSync(localFile(project, content), 'utf8'));
  need(Array.isArray(books) && books.length === 6, 'Premium fixture requires the complete six-book data source');
  fs.mkdirSync(out, { recursive: true });
  need(!fs.readdirSync(out).length, 'Preserve existing browser evidence; choose a new empty output directory');
  const own = !browser;
  if (!browser) {
    const { chromium } = createRequire(path.join(here, '../tests/package.json'))('playwright');
    browser = await chromium.launch(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {});
  }
  const environment = { browser: browser.version(), reducedMotion: 'reduce', source: 'host Playwright' };
  const samples = [];
  try {
    for (const viewport of viewports) {
      const page = await browser.newPage({ viewport, reducedMotion: 'reduce' }), errors = [];
      page.setDefaultTimeout(5000); page.on('pageerror', e => errors.push(e.message));
      const sample = { viewport, task: false, errors, probe: null, anchors: null, screenshot: null };
      try {
        await page.goto(pathToFileURL(file).href, { waitUntil: 'load', timeout: 15000 });
        await page.evaluate(() => document.fonts.ready);
        await exercise(page, books); sample.task = true;
      } catch (error) { errors.push(error.message); }
      try {
        sample.probe = await page.evaluate(probe);
        sample.anchors = await page.evaluate(() => {
          const body = getComputedStyle(document.body), heading = document.querySelector('h1'), primary = document.querySelector('#saved-view');
          const h = heading && getComputedStyle(heading), p = primary && getComputedStyle(primary);
          const first = value => value.split(',')[0].trim().replace(/^["']|["']$/g, '');
          return { bodyFont: first(body.fontFamily), headingFont: h && first(h.fontFamily), headingFonts: [...new Set([...document.querySelectorAll('h1,h2,h3')].map(el => first(getComputedStyle(el).fontFamily)))].sort(), headingVisible: !!heading && heading.getBoundingClientRect().height > 0 && h.visibility !== 'hidden', background: body.backgroundColor,
            primary: p?.backgroundColor ?? null, bodySize: parseFloat(body.fontSize), headingSize: h ? parseFloat(h.fontSize) : 0,
            overflow: document.documentElement.scrollWidth > innerWidth };
        });
        sample.screenshot = path.join(out, `${viewport.width}.png`);
        await page.screenshot({ path: sample.screenshot, fullPage: true });
      } catch (error) { errors.push(error.message); }
      finally { await page.close(); }
      fs.writeFileSync(path.join(out, `${viewport.width}.json`), JSON.stringify(sample, null, 2) + '\n');
      samples.push(sample);
    }
  } finally { if (own) await browser.close(); }
  return { environment, samples };
}

export function gradePremium(before, after) {
  const checks = [], add = (id, pass, details) => checks.push({ id, pass, details });
  const valid = report => !report?.error && Array.isArray(report?.samples) && report.samples.length === 2 && viewports.every(v => report.samples.some(s => s?.viewport?.width === v.width && s.probe && keys.every(k => s.probe.counts?.[k] && typeof s.probe.counts[k] === 'object' && !Array.isArray(s.probe.counts[k])) && ['families', 'sizes', 'weights', 'textColors'].every(k => Object.keys(s.probe.counts[k]).length)));
  const measured = valid(before) && valid(after);
  add('budget-measured', measured, measured ? [] : [before?.error, after?.error, 'Need complete nonempty host samples at both 1440 and 390 widths'].filter(Boolean));
  if (!measured) return { pass: false, checks };
  const rows = after.samples.map(next => { const previous = before.samples.find(s => s.viewport.width === next.viewport.width); return { next, previous, budget: budgetGrade(next.probe, undefined, previous.probe) }; });
  add('budget-met', rows.every(r => !r.budget.over.length), rows.flatMap(r => r.budget.over.map(k => `${r.next.viewport.width}: ${k}`)));
  add('budget-reduced', rows.every(r => r.budget.rows.filter(v => ['sizes', 'textColors', 'radii'].includes(v.key)).reduce((n, v) => n + v.count, 0) < r.budget.rows.filter(v => ['sizes', 'textColors', 'radii'].includes(v.key)).reduce((n, v) => n + v.before, 0)), rows.map(r => `${r.next.viewport.width}: ` + r.budget.rows.map(v => `${v.key} ${v.before} → ${v.count}`).join(', ')));
  add('task-preserved', [...before.samples, ...after.samples].every(s => s.task && !s.errors.length), [...before.samples, ...after.samples].flatMap(s => s.errors.map(e => `${s.viewport.width}: ${e}`)));
  add('brand-rendered', rows.every(({ next, previous }) => next.anchors && previous.anchors && ['bodyFont', 'headingFont', 'headingFonts', 'background', 'primary'].every(k => next.anchors[k] && JSON.stringify(next.anchors[k]) === JSON.stringify(previous.anchors[k]))), rows.map(r => `${r.next.viewport.width}: ${JSON.stringify(r.next.anchors)}`));
  add('readable', after.samples.every(s => s.anchors?.headingVisible && s.anchors?.bodySize >= 14 && s.anchors.headingSize >= s.anchors.bodySize * 1.5), ['Visible heading; body ≥14px; heading ≥1.5× body. Counts are not an aesthetic score.']);
  add('no-overflow', after.samples.every(s => s.anchors?.overflow === false), after.samples.filter(s => s.anchors?.overflow).map(s => String(s.viewport.width)));
  return { pass: checks.every(c => c.pass), checks, budgets: rows.map(r => ({ viewport: r.next.viewport, rows: r.budget.rows })) };
}

export function premiumUndo(project, initial, out, variant = 'B') {
  let copy;
  try {
    fs.mkdirSync(out, { recursive: true });
    copy = fs.mkdtempSync(path.join(out, 'undo-copy-'));
    fs.cpSync(path.join(project, 'variant-output'), copy, { recursive: true, errorOnExist: true, force: false });
    undoVariant(copy, variant);
    const state = readContext(copy), before = initial.context?.variants?.[variant], restored = state.variants?.[variant];
    const files = before?.files ?? [];
    const pass = files.length > 0 && isDeepStrictEqual(files, restored?.files) && files.every(file => createHash('sha1').update(fs.readFileSync(localFile(copy, file))).digest('hex') === initial.files[`variant-output/${file}`])
      && ['tokens', 'comparison', 'undo', 'systemBinding'].every(key => isDeepStrictEqual(before[key], restored[key])) && state.selectedVariant === initial.context.selectedVariant;
    return { pass, details: [pass ? 'One real undo in an isolated copy restores B files, tokens, comparison and prior undo/binding; selection stays unchanged' : 'One undo did not restore the original refinement state'] };
  } catch (error) { return { pass: false, details: [error.message] }; }
  finally { if (copy) fs.rmSync(copy, { recursive: true, force: true }); }
}
