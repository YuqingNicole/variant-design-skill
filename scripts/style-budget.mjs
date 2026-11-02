#!/usr/bin/env node
// Counts the distinct type sizes, families, weights, text colors, radii and shadows a rendered
// page uses, and grades the counts against a budget. Vague briefs such as "premium" or "cleaner"
// mostly ask for fewer of these (references/workflow/adjective-translation.md).
// The probe runs in the caller's browser (Playwright page.evaluate, devtools); no bundled browser.
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

export const defaults = { families: 2, sizes: 7, weights: 3, textColors: 5, radii: 3, shadows: 2 };
export const keys = Object.keys(defaults);

// Self-contained: it is serialized and evaluated in the page, so it cannot use module scope.
export function probe() {
  const counts = { families: {}, sizes: {}, weights: {}, textColors: {}, radii: {}, shadows: {} };
  const add = (key, value) => { counts[key][value] = (counts[key][value] || 0) + 1; };
  for (const el of document.querySelectorAll('body *')) {
    const s = getComputedStyle(el), box = el.getBoundingClientRect();
    if (s.visibility === 'hidden' || box.width <= 1 || box.height <= 1) continue;
    if ([...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) {
      add('sizes', s.fontSize); add('weights', s.fontWeight); add('textColors', s.color);
      // Code samples keep their monospace face; it is not a design family.
      if (!el.closest('code,pre,kbd,samp')) add('families', s.fontFamily.split(',')[0].trim().replace(/^["']|["']$/g, ''));
    }
    if (s.borderTopLeftRadius !== '0px') add('radii', s.borderTopLeftRadius.endsWith('%') || parseFloat(s.borderTopLeftRadius) >= Math.min(box.width, box.height) / 2 ? 'full' : s.borderTopLeftRadius);
    if (s.boxShadow !== 'none') add('shadows', s.boxShadow);
  }
  return { url: location.href, viewport: { width: innerWidth, height: innerHeight }, counts };
}

export const measure = page => page.evaluate(probe);

export function parseBudget(text = '') {
  const budget = { ...defaults };
  for (const pair of text.split(',').filter(Boolean)) {
    const [key, value] = pair.split('=');
    if (!keys.includes(key) || !/^\d+$/.test(value ?? '')) throw new Error(`Budget entries look like sizes=6; known keys: ${keys.join(', ')}.`);
    budget[key] = Number(value);
  }
  return budget;
}

export function grade(sample, budget = defaults, before) {
  if (!sample?.counts) throw new Error('A sample needs the counts object that probe() returns.');
  const rows = keys.map(key => {
    const values = Object.keys(sample.counts[key] ?? {});
    const row = { key, count: values.length, limit: budget[key], over: values.length > budget[key], values };
    if (before?.counts) row.before = Object.keys(before.counts[key] ?? {}).length;
    return row;
  });
  return { url: sample.url, rows, over: rows.filter(r => r.over).map(r => r.key) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
  const args = process.argv.slice(2), option = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
  const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
  if (args[0] === 'probe') console.log(`(${probe})()`);
  else if (args[0] === 'check' && args[1]) {
    const before = option('--before'), result = grade(read(args[1]), parseBudget(option('--budget')), before && read(before));
    if (args.includes('--json')) console.log(JSON.stringify(result, null, 2));
    else {
      for (const r of result.rows) console.log(`${r.over ? '✗' : '✓'} ${r.key}: ${r.before === undefined ? '' : `${r.before} → `}${r.count} (budget ${r.limit})${r.over ? ` · ${r.values.join(' | ')}` : ''}`);
      console.log(result.over.length ? `style budget exceeded: ${result.over.join(', ')}` : 'style budget met. Counts measure restraint, not taste; review the rendered page.');
    }
    process.exitCode = result.over.length ? 1 : 0;
  } else {
    console.log('Usage: style-budget.mjs probe | check <sample.json> [--before <sample.json>] [--budget sizes=6,radii=2] [--json]');
    process.exitCode = 2;
  }
}
