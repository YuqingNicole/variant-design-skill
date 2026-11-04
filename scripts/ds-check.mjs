#!/usr/bin/env node
// Checks declared color pairs and component aliases. Only --brand files use legacy name guessing.
// Missing pairs, unresolved aliases, conditional and translucent values remain unverified.
// With --used-by, it also lists tokens nothing uses: a system is sized to the product
// (references/design-system/system-decisions.md), so a token no consumer reaches through var() is inventory.
// Usage: node ds-check.mjs <generated.css> ... [--brand <brand.css>] [--used-by <file> ...] [--json]
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { color } from './ds-export.mjs';
import { tokenMap, layerIssues } from './ds-tokens.mjs';

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
const contrast = (x, y) => { const [a, b] = [luminance(x), luminance(y)].sort((p, q) => q - p); return (a + 0.05) / (b + 0.05); };
const displayRatio = value => Math.round(value * 100) / 100;
export const ratio = (a, b) => displayRatio(contrast(color(a), color(b)));

const parts = name => name.replace(/^--/, '').split('-');
const isText = name => { const p = parts(name); return p.some(x => ['text', 'ink', 'fg', 'foreground'].includes(x)) && !p.includes('on') && !p.some(x => ['tertiary', 'placeholder', 'disabled', 'border', 'size'].includes(x)); };
const isSurface = name => { const p = parts(name); return p.some(x => ['bg', 'background', 'surface', 'paper', 'canvas'].includes(x)) && !p.some(x => ['text', 'ink', 'fg', 'border', 'on'].includes(x)); };
// --color-text-on-accent pairs with --color-accent (or --accent).
const onTarget = name => { const m = name.match(/-on-([\w-]+)$/); return m ? m[1] : null; };

export function checkSystem(sources, min = 4.5) {
  const vars = tokenMap(sources);
  const resolve = (name, seen = new Set()) => {
    const token = vars.get(name);
    if (!token) return { reason: `${name} is not defined` };
    if (seen.has(name)) return { reason: `cyclic alias at ${name}` };
    if (token.values.length > 1) return { reason: `${name} has multiple values; check each rendered mode` };
    const v = token.value, ref = v.match(/^var\(\s*(--[\w-]+)\s*\)$/);
    if (ref) return resolve(ref[1], new Set([...seen, name]));
    const parsed = color(v);
    if (!parsed || !parsed.components.every(Number.isFinite)) return { reason: `${name} has an unsupported color value (${v})` };
    if (parsed.alpha < 1) return { reason: `${name} is translucent; its rendered backdrop is required` };
    return { color: parsed };
  };
  const checked = [], issues = [], unverified = [], paired = new Set(), surfaces = new Set();
  const add = (text, surface) => {
    const key = `${text}:${surface}`;
    if (paired.has(key)) return;
    paired.add(key); surfaces.add(surface);
    const a = resolve(text), b = resolve(surface);
    if (!a.color || !b.color) { unverified.push({ text, surface, reason: [a.reason, b.reason].filter(Boolean).join('; ') }); return; }
    const measured = contrast(a.color, b.color), item = { text, surface, ratio: displayRatio(measured), min };
    checked.push(item);
    if (measured < min) issues.push(item);
  };
  for (const [name, token] of vars) {
    if (token.layer === 'component' || token.layer === 'primitive') continue;
    const role = name.match(/^--color-on-(.+)$/)?.[1];
    if (role) add(name, `--color-${role}`);
    for (const surface of token.on ?? []) add(name, surface);
  }
  const brand = [...vars.keys()].filter(name => vars.get(name).origin === 'brand');
  for (const text of brand.filter(isText)) for (const surface of brand.filter(isSurface)) add(text, surface);
  for (const text of brand.filter(onTarget)) {
    const target = onTarget(text), exact = [`--color-${target}`, `--${target}`].find(n => vars.has(n));
    const candidates = exact ? [exact] : brand.filter(n => n.endsWith(`-${target}`) && !onTarget(n));
    if (candidates.length === 1) add(text, candidates[0]);
    else if (![...paired].some(k => k.startsWith(`${text}:`))) unverified.push({ text, reason: candidates.length ? 'ambiguous legacy on-color pair' : 'no matching surface for legacy on-color token' });
  }
  for (const [name, token] of vars) {
    if (token.layer === 'primitive' || token.layer === 'component' || token.nonText || surfaces.has(name) || [...paired].some(k => k.startsWith(`${name}:`))) continue;
    const textLike = isText(name) && (!/^--(?:text|font)-/.test(name) || /color/.test(name));
    // Unnamed color roles can carry text; require a pair or an explicit non-text declaration.
    const unknownRole = /^--color-/.test(name) && !isSurface(name) && !/^--color-(?:border|focus|outline|overlay|veil)(?:-|$)/.test(name);
    if (textLike || unknownRole) unverified.push({ text: name, reason: 'no declared surface; use --color-on-<role> or a trailing /* on: --surface-token */ note (non-text colors: /* contrast: non-text */)' });
  }
  return { checked, issues, unverified, layers: layerIssues(sources) };
}

// Compatibility API: only failing measurable pairs; use checkSystem for coverage and layer results.
export const contrastIssues = (sources, min = 4.5) => checkSystem(sources, min).issues;

// Tokens the system defines that no consumer reaches: used directly with var(--x), or through a used token's value.
export function unusedTokens(sources, consumers) {
  const defined = new Map([...tokenMap(sources)].map(([name, token]) => [name, token.values.join(' ')]));
  const refs = text => [...String(text).matchAll(/var\(\s*(--[\w-]+)/g)].map(m => m[1]);
  const used = new Set(), queue = consumers.flatMap(refs);
  while (queue.length) { const name = queue.pop(); if (used.has(name)) continue; used.add(name); queue.push(...refs(defined.get(name) ?? '')); }
  return [...defined.keys()].filter(name => !used.has(name));
}

if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
  const argv = process.argv.slice(2), files = [], brands = [], users = [];
  let mode = files, json = false, useRequested = false;
  try {
    for (let i = 0; i < argv.length; i++) {
      const arg = argv[i];
      if (arg === '--json') { json = true; continue; }
      if (arg === '--brand') { if (!argv[i + 1] || argv[i + 1].startsWith('--')) throw new Error('--brand requires a file'); brands.push(argv[++i]); continue; }
      if (arg === '--used-by') { mode = users; useRequested = true; continue; }
      if (arg.startsWith('--')) throw new Error(`Unknown option ${arg}`);
      mode.push(arg);
    }
    if (!files.length && !brands.length || useRequested && !users.length) throw new Error('Supply system files and at least one consumer after --used-by');
    const sources = [...brands.map(f => ({ source: fs.readFileSync(f, 'utf8'), origin: 'brand' })), ...files.map(f => fs.readFileSync(f, 'utf8'))];
    const report = checkSystem(sources), { issues, unverified, layers, checked } = report;
    const unused = useRequested ? unusedTokens(sources.map(s => typeof s === 'string' ? s : s.source), users.map(f => fs.readFileSync(f, 'utf8'))) : [];
    if (json) console.log(JSON.stringify({ ...report, ...(useRequested ? { unused } : {}) }, null, 2));
  else {
    for (const i of issues) console.log(`✗ ${i.text} on ${i.surface} is ${i.ratio}:1, below ${i.min}:1 for text`);
    for (const i of unverified) console.log(`? ${i.text}${i.surface ? ` on ${i.surface}` : ''}: unverified — ${i.reason}`);
    for (const i of layers) console.log(`✗ ${i.token}${i.target ? ` → ${i.target}` : ''}: ${i.reason}`);
    console.log(`design-system: ${checked.length} contrast pair(s) checked, ${issues.length} failed, ${unverified.length} unverified; ${layers.length} layer error(s). Rendered pages are not checked here.`);
    if (useRequested) console.log(unused.length ? `✗ ${unused.length} token(s) that ${users.join(', ')} never use: ${unused.join(', ')}. Use each in a composition or remove it.` : `every token is used by ${users.join(', ')}.`);
  }
    process.exitCode = issues.length || unverified.length || layers.length || unused.length ? 1 : 0;
  } catch (error) { console.error(`ds-check: ${error.message}\nUsage: node ds-check.mjs <generated.css> ... [--brand <brand.css>] [--used-by <file> ...] [--json]`); process.exitCode = 2; }
}
