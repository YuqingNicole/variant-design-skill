#!/usr/bin/env node
// Checks a design system's own color pairs: every text token on every surface token, and each
// on-X token on X, must reach 4.5:1 (WCAG 2 relative luminance). Run it on a draft before showing
// it (skills/variant-design-system/ROUTE.md, Step 1b); delivery-check runs it on a confirmed system.
// Pairs come from token names, so the check covers what the system declares, not every page.
// Usage: node ds-check.mjs <design-system.css> [more.css ...] [--json]
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { color } from './ds-export.mjs';

const lin = c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
// Linear sRGB of a parsed color; OKLCH goes through OKLab (Björn Ottosson's matrices).
function linear(c) {
  if (c.colorSpace === 'srgb') return c.components.map(lin);
  if (c.colorSpace === 'hsl') {
    const [h, s, l] = [c.components[0], c.components[1] / 100, c.components[2] / 100], k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
    return [0, 8, 4].map(n => lin(l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))));
  }
  const [L, C, H] = c.components, a = C * Math.cos(H * Math.PI / 180), b = C * Math.sin(H * Math.PI / 180);
  const [l, m, s] = [L + 0.3963377774 * a + 0.2158037573 * b, L - 0.1055613458 * a - 0.0638541728 * b, L - 0.0894841775 * a - 1.291485548 * b].map(x => x ** 3);
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s].map(x => Math.min(1, Math.max(0, x)));
}
const luminance = c => { const [r, g, b] = linear(c); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrast = (x, y) => { const [a, b] = [luminance(x), luminance(y)].sort((p, q) => q - p); return Math.round((a + 0.05) / (b + 0.05) * 100) / 100; };
export const ratio = (a, b) => contrast(color(a), color(b));

const parts = name => name.replace(/^--/, '').split('-');
const isText = name => { const p = parts(name); return p.some(x => ['text', 'ink', 'fg', 'foreground'].includes(x)) && !p.includes('on') && !p.some(x => ['tertiary', 'placeholder', 'disabled', 'border', 'size'].includes(x)); };
const isSurface = name => { const p = parts(name); return p.some(x => ['bg', 'background', 'surface', 'paper', 'canvas'].includes(x)) && !p.some(x => ['text', 'ink', 'fg', 'border', 'on'].includes(x)); };
// --color-text-on-accent pairs with --color-accent (or --accent).
const onTarget = name => { const m = name.match(/-on-([\w-]+)$/); return m ? m[1] : null; };

export function contrastIssues(sources, min = 4.5) {
  const vars = new Map();
  for (const source of sources) for (const [, name, value] of String(source).matchAll(/(--[\w-]+)\s*:\s*([^;}]+)/g)) vars.set(name, value.trim());
  const resolve = (name, seen = new Set()) => {
    const v = vars.get(name), ref = v?.match(/^var\((--[\w-]+)\)$/);
    if (!v || seen.has(name)) return null;
    return ref ? resolve(ref[1], seen.add(name)) : color(v);
  };
  // Translucent colors depend on what is behind them; they are left to the rendered check.
  const colors = new Map([...vars.keys()].map(n => [n, resolve(n)]).filter(([, c]) => c && !(c.alpha < 1)));
  const issues = [], names = [...colors.keys()];
  const add = (text, surface) => { const r = contrast(colors.get(text), colors.get(surface)); if (r < min) issues.push({ text, surface, ratio: r, min }); };
  for (const text of names.filter(isText)) for (const surface of names.filter(isSurface)) add(text, surface);
  for (const text of names.filter(onTarget)) {
    const target = onTarget(text), surface = names.find(n => n === `--${target}` || n.endsWith(`-${target}`) && !onTarget(n));
    if (surface) add(text, surface);
  }
  return issues;
}

if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
  const files = process.argv.slice(2).filter(a => !a.startsWith('--'));
  if (!files.length) { console.error('Usage: node ds-check.mjs <design-system.css> [more.css ...] [--json]'); process.exit(2); }
  const issues = contrastIssues(files.map(f => fs.readFileSync(f, 'utf8')));
  if (process.argv.includes('--json')) console.log(JSON.stringify({ issues }, null, 2));
  else {
    for (const i of issues) console.log(`✗ ${i.text} on ${i.surface} is ${i.ratio}:1, below ${i.min}:1 for text`);
    console.log(issues.length ? `design-system contrast failed: ${issues.length} pair(s)` : 'design-system contrast passed for every text/surface and on-color pair it declares. Rendered pages are not checked here.');
  }
  process.exitCode = issues.length ? 1 : 0;
}
