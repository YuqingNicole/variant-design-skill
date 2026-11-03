#!/usr/bin/env node
// Exports a design system's CSS custom properties as Design Tokens Community Group (DTCG 2025.10) JSON,
// the interchange format Figma variables and token tools import. CSS stays the working format; this file
// is generated, never edited. Values DTCG cannot express (clamp(), color-mix(), percentages, shorthands)
// are listed in `skipped` instead of being approximated.
// Usage: node ds-export.mjs <design-system.css> [more.css ...] [--out design-system.tokens.json] [--json]
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const round = n => Math.round(n * 10000) / 10000;
const hex2 = n => Math.round(n * 255).toString(16).padStart(2, '0');
const srgb = (r, g, b, a = 1) => ({ colorSpace: 'srgb', components: [r, g, b].map(round), ...(a < 1 ? { alpha: round(a) } : {}), hex: `#${[r, g, b].map(hex2).join('')}` });
const num = s => { const m = String(s).trim().match(/^(-?\d*\.?\d+)(%?)$/); return m ? Number(m[1]) / (m[2] ? 100 : 1) : null; };
const args = inner => inner.trim().split(/\s*\/\s*|\s*,\s*|\s+/).filter(Boolean);

function color(value) {
  const v = value.trim().toLowerCase();
  let m = v.match(/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/);
  if (m) {
    const h = m[1].length <= 4 ? [...m[1]].map(c => c + c).join('') : m[1];
    const [r, g, b, a = 255] = h.match(/../g).map(x => parseInt(x, 16));
    return srgb(r / 255, g / 255, b / 255, a / 255);
  }
  if (v === 'white') return srgb(1, 1, 1);
  if (v === 'black') return srgb(0, 0, 0);
  if ((m = v.match(/^rgba?\((.*)\)$/))) {
    const p = args(m[1]); if (p.length < 3) return null;
    const ch = p.slice(0, 3).map(x => x.endsWith('%') ? num(x) : num(x) / 255), a = p[3] === undefined ? 1 : num(p[3]);
    return ch.every(x => x != null) && a != null ? srgb(...ch, a) : null;
  }
  if ((m = v.match(/^oklch\((.*)\)$/))) {
    const p = args(m[1]); if (p.length < 3) return null;
    const l = num(p[0]), c = p[1].endsWith('%') ? num(p[1]) * 0.4 : num(p[1]), h = num(p[2].replace(/deg$/, '')), a = p[3] === undefined ? 1 : num(p[3]);
    return [l, c, h, a].every(x => x != null) ? { colorSpace: 'oklch', components: [l, c, h].map(round), ...(a < 1 ? { alpha: round(a) } : {}) } : null;
  }
  if ((m = v.match(/^hsla?\((.*)\)$/))) {
    const p = args(m[1]); if (p.length < 3) return null;
    const [h, s, l] = [num(p[0].replace(/deg$/, '')), num(p[1]) * 100, num(p[2]) * 100], a = p[3] === undefined ? 1 : num(p[3]);
    return [h, s, l, a].every(x => x != null && !Number.isNaN(x)) ? { colorSpace: 'hsl', components: [h, s, l].map(round), ...(a < 1 ? { alpha: round(a) } : {}) } : null;
  }
  return null;
}

const dimension = value => { const m = value.trim().match(/^(-?\d*\.?\d+)(px|rem)$/); return m ? { value: Number(m[1]), unit: m[2] } : value.trim() === '0' ? { value: 0, unit: 'px' } : null; };

// Splits on commas outside parentheses: shadow lists, font stacks.
function topLevel(value, sep = ',') {
  const parts = []; let depth = 0, cur = '';
  for (const ch of value) { if (ch === '(') depth++; if (ch === ')') depth--; if (ch === sep && depth === 0) { parts.push(cur.trim()); cur = ''; } else cur += ch; }
  return [...parts, cur.trim()].filter(Boolean);
}

function shadow(value) {
  const layers = [];
  for (const layer of topLevel(value)) {
    const words = topLevel(layer.replace(/\s+/g, ' '), ' '), inset = words[0] === 'inset' || words.at(-1) === 'inset';
    const rest = words.filter(w => w !== 'inset'), lengths = rest.filter(dimension), colors = rest.filter(w => !dimension(w));
    if (lengths.length < 2 || lengths.length > 4 || colors.length !== 1) return null;
    const ref = colors[0].match(/^var\((--[\w-]+)\)$/), c = ref ? { ref: ref[1] } : color(colors[0]);
    if (!c) return null;
    const [x, y, blur = '0', spread = '0'] = lengths;
    layers.push({ color: c, offsetX: dimension(x), offsetY: dimension(y), blur: dimension(blur), spread: dimension(spread), ...(inset ? { inset: true } : {}) });
  }
  return layers.length ? layers : null;
}

function classify(name, raw) {
  const value = raw.trim(), ref = value.match(/^var\((--[\w-]+)\)$/);
  if (ref) return { ref: ref[1] };
  const fn = value.match(/\b(clamp|calc|min|max|color-mix|env)\(/);
  if (fn) return { skip: `uses ${fn[1]}(), which DTCG cannot express` };
  let v;
  if ((v = color(value))) return { type: 'color', value: v };
  if ((v = value.match(/^(\d*\.?\d+)(ms|s)$/))) return { type: 'duration', value: { value: Number(v[1]), unit: v[2] } };
  if ((v = value.match(/^cubic-bezier\((.*)\)$/))) { const p = args(v[1]).map(Number); return p.length === 4 && p.every(Number.isFinite) ? { type: 'cubicBezier', value: p } : { skip: 'malformed cubic-bezier()' }; }
  if (value !== '0' || /space|gap|radius|size|width|height|inset|offset/.test(name)) if ((v = dimension(value))) return { type: 'dimension', value: v };
  if (/weight/.test(name)) { const w = { normal: 400, bold: 700 }[value] ?? num(value); if (w >= 1 && w <= 1000) return { type: 'fontWeight', value: w }; }
  if (/^-?\d*\.?\d+$/.test(value)) return { type: 'number', value: Number(value) };
  if (/font|family|typeface/.test(name) && /[a-z]/i.test(value) && !/\d(px|rem|em|%)/.test(value)) return { type: 'fontFamily', value: topLevel(value).map(f => f.replace(/^['"]|['"]$/g, '').trim()) };
  if ((v = shadow(value))) return { type: 'shadow', value: v };
  if (/%$/.test(value)) return { skip: 'percentages are not a DTCG dimension' };
  if (/^-?\d*\.?\d+(em|vw|vh|ch|ex)$/.test(value)) return { skip: 'DTCG dimensions are px or rem only' };
  return { skip: 'not a DTCG type (shorthands, keywords and other units are left out)' };
}

export function exportTokens(sources) {
  const vars = new Map();
  for (const source of sources) for (const [, name, value] of String(source).matchAll(/(--[\w-]+)\s*:\s*([^;}]+)/g)) vars.set(name, value.trim());
  const parsed = new Map([...vars].map(([name, value]) => [name, classify(name, value)]));
  // Aliases take the type of the token they point to, following chains.
  const typeOf = (name, seen = new Set()) => {
    const p = parsed.get(name);
    if (!p || p.skip || seen.has(name)) return null;
    return p.ref ? typeOf(p.ref, seen.add(name)) : p.type;
  };
  const alias = target => `{${typeOf(target)}.${target.slice(2)}}`;
  const tokens = { $description: 'Generated by variant-design scripts/ds-export.mjs from the design system CSS; edit the CSS, not this file.' }, skipped = [];
  for (const [name, p] of parsed) {
    if (p.skip) { skipped.push({ name, value: vars.get(name), reason: p.skip }); continue; }
    let type = p.type, value = p.value;
    if (p.ref) {
      type = typeOf(name);
      if (!type) { skipped.push({ name, value: vars.get(name), reason: vars.has(p.ref) ? `refers to ${p.ref}, which could not be exported` : `refers to ${p.ref}, which no file defines` }); continue; }
      value = alias(p.ref);
    }
    if (type === 'shadow') {
      const bad = value.find(l => l.color.ref && typeOf(l.color.ref) !== 'color');
      if (bad) { skipped.push({ name, value: vars.get(name), reason: `its color refers to ${bad.color.ref}, which is not an exported color` }); continue; }
      value = value.map(l => ({ ...l, color: l.color.ref ? alias(l.color.ref) : l.color }));
    }
    tokens[type] ??= { $type: type };
    tokens[type][name.slice(2)] = { $value: value };
  }
  return { tokens, skipped };
}

if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
  const argv = process.argv.slice(2), at = argv.indexOf('--out'), out = at >= 0 ? argv[at + 1] : null;
  const files = argv.filter((a, i) => !a.startsWith('--') && i !== at + 1);
  if (!files.length) { console.error('Usage: node ds-export.mjs <design-system.css> [more.css ...] [--out design-system.tokens.json] [--json]'); process.exit(2); }
  const { tokens, skipped } = exportTokens(files.map(f => fs.readFileSync(f, 'utf8')));
  const json = JSON.stringify(tokens, null, 2) + '\n';
  if (out) fs.writeFileSync(out, json);
  if (argv.includes('--json')) console.log(JSON.stringify({ out, tokens, skipped }, null, 2));
  else {
    if (!out) process.stdout.write(json);
    const count = Object.entries(tokens).filter(([k]) => !k.startsWith('$')).reduce((n, [, g]) => n + Object.keys(g).filter(k => !k.startsWith('$')).length, 0);
    // With --out, stdout is free for the report; without it, stdout carries the JSON.
    const log = out ? console.log : console.error;
    log(`${count} tokens exported${out ? ` to ${out}` : ''}, ${skipped.length} left out (DTCG 2025.10).`);
    for (const s of skipped) log(`  ${s.name}: ${s.value} — ${s.reason}`);
  }
}
