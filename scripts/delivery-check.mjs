#!/usr/bin/env node
// Deterministic checks before presenting A/B/C: the recorded context must describe three
// distinct, comparable directions, recommend without selecting, and keep a locked design system.
// It reads files only; rendered quality still needs quality-gate.mjs and a browser.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { localFile, readContext } from './variant-history.mjs';

const ids = ['A', 'B', 'C'];
const keys = ['optimizes', 'tradeoff', 'bestFor'];
const text = v => typeof v === 'string' && v.trim().length > 0;
const norm = v => String(v).trim().replace(/\s+/g, ' ').toLowerCase();
const generic = new Set(['inherit', 'initial', 'unset', 'revert', 'system-ui', 'sans-serif', 'serif', 'monospace', 'cursive', 'fantasy', 'ui-monospace', 'ui-sans-serif', 'ui-serif', 'ui-rounded', '-apple-system', 'blinkmacsystemfont', 'normal', 'bold', 'bolder', 'lighter', 'italic']);
const plainColors = new Set(['#fff', '#ffffff', '#000', '#000000']);

const first = value => String(value).split(',')[0].trim().replace(/^['"`]|['"`]$/g, '').trim();
// The first family of every font declaration in source: CSS, custom properties and inline styles.
export function declaredFonts(source) {
  const fonts = new Set();
  for (const m of source.matchAll(/(?:font-family|--font-[\w-]+)\s*:\s*([^;}\n]+)/g)) {
    const name = first(m[1]);
    if (name && !/^(var\(|\d|[{$])/.test(name) && !generic.has(name.toLowerCase())) fonts.add(name);
  }
  for (const m of source.matchAll(/fontFamily\s*:\s*(['"`])([^'"`]+)\1/g)) {
    const name = first(m[2]);
    if (name && !/^var\(/.test(name) && !generic.has(name.toLowerCase())) fonts.add(name);
  }
  return [...fonts];
}
const hexes = source => [...new Set((source.match(/#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?(?:[0-9a-fA-F]{2})?\b/g) ?? []).map(h => h.toLowerCase()))];

// Custom properties a design-system file defines, with their raw values.
const cssVars = source => new Map([...source.matchAll(/(--[\w-]+)\s*:\s*([^;}]+)/g)].map(m => [m[1], m[2].trim()]));
const px = value => { const m = String(value).trim().match(/^(-?\d*\.?\d+)(px|rem)$/); return m ? Number(m[1]) * (m[2] === 'rem' ? 16 : 1) : null; };
// Spacing, type and radius declarations in CSS (padding-top) or JSX style objects (paddingTop, fontSize: 13).
const lengthKind = name => { const p = name.toLowerCase().replace(/-/g, ''); return p === 'fontsize' ? 'text' : p.endsWith('radius') ? 'radius' : /^(padding|margin)/.test(p) || /gap$/.test(p) ? 'space' : null; };
function offScale(source, scale) {
  const found = [];
  for (const [, name, raw] of source.matchAll(/([A-Za-z-]+)\s*:\s*([^;}{\n,]+)/g)) {
    const kind = lengthKind(name);
    if (!kind || /\b(clamp|calc|min|max)\(/.test(raw)) continue;
    const value = raw.replace(/var\([^)]*\)/g, '').replace(/['"`]/g, '').trim();
    const values = /^-?\d*\.?\d+$/.test(value) ? [Number(value)] : [...value.matchAll(/(-?\d*\.?\d+)(px|rem)\b/g)].map(m => Number(m[1]) * (m[2] === 'rem' ? 16 : 1));
    for (const v of values.map(Math.abs)) {
      if (v === 0 || scale.some(t => t.px === v)) continue;
      const pool = scale.filter(t => t.kind === kind).length ? scale.filter(t => t.kind === kind) : scale;
      const near = pool.reduce((a, b) => Math.abs(b.px - v) < Math.abs(a.px - v) ? b : a);
      const note = `${v}px (nearest ${near.name} ${near.px}px)`;
      if (!found.includes(note)) found.push(note);
    }
  }
  return found;
}

export function checkDelivery(root = 'variant-output', { project = path.dirname(path.resolve(root)) } = {}) {
  const errors = [], warnings = [];
  let state;
  try { state = readContext(root); } catch (error) { return { errors: [`Cannot read .variant-context.json: ${error.message}`], warnings }; }
  const sources = {}, owners = new Map();
  for (const id of ids) {
    const v = state.variants?.[id];
    if (!v) { errors.push(`Variant ${id} is not registered; register A, B and C before presenting`); continue; }
    const files = Array.isArray(v.files) ? v.files : [];
    if (!files.length || new Set(files).size !== files.length) errors.push(`Variant ${id} needs a list of unique owned files`);
    if (!files.includes(v.entry)) errors.push(`Variant ${id} entry ${v.entry ?? '(missing)'} is not one of its files`);
    sources[id] = {};
    for (const file of files) {
      if (owners.has(file)) errors.push(`${file} is owned by both ${owners.get(file)} and ${id}; shared files must stay outside the variants`);
      owners.set(file, id);
      let full;
      try { full = localFile(root, file); } catch (error) { errors.push(`Variant ${id}: ${error.message}`); continue; }
      if (!fs.existsSync(full) || !fs.statSync(full).isFile()) { errors.push(`Variant ${id} file ${file} does not exist`); continue; }
      const source = fs.readFileSync(full, 'utf8');
      if (!source.trim()) errors.push(`Variant ${id} file ${file} is empty`);
      sources[id][file] = source;
    }
    for (const key of keys) if (!text(v.comparison?.[key])) errors.push(`Variant ${id} comparison.${key} is empty; say what it ${key === 'bestFor' ? 'is best for' : key === 'tradeoff' ? 'gives up' : 'optimizes'}`);
  }
  const present = ids.filter(id => state.variants?.[id]);
  for (const [i, a] of present.entries()) for (const b of present.slice(i + 1)) {
    for (const key of keys) {
      const x = state.variants[a].comparison?.[key], y = state.variants[b].comparison?.[key];
      if (text(x) && text(y) && norm(x) === norm(y)) errors.push(`${a} and ${b} have the same comparison.${key}; each direction needs its own position`);
    }
    const ea = sources[a]?.[state.variants[a].entry], eb = sources[b]?.[state.variants[b].entry];
    if (ea !== undefined && eb !== undefined && ea === eb) errors.push(`${a} and ${b} entry files are identical`);
  }

  const contract = state.taskContract;
  if (!text(contract?.primaryJob) || !text(contract?.data) || !Array.isArray(contract?.requiredFunctions) || !contract.requiredFunctions.length) errors.push('taskContract needs primaryJob, data and requiredFunctions shared by all three directions');
  const r = state.recommendation;
  if (!ids.includes(r?.variant) || !text(r?.reason)) errors.push('recommendation needs a variant A/B/C and a reason');
  if (state.selectedVariant != null) warnings.push(`selectedVariant is ${state.selectedVariant}. Only the user's explicit pick sets it; a recommendation or an edit never does`);

  const ds = state.designSystem;
  if (ds?.confirmed) {
    let dsSource = null;
    try {
      const full = localFile(project, ds.file);
      if (fs.existsSync(full)) dsSource = fs.readFileSync(full, 'utf8'); else errors.push(`Locked design system file ${ds.file} does not exist in ${project}`);
    } catch (error) { errors.push(`Locked design system file: ${error.message}`); }
    // Under a brand-file lock, extensions add the layers the brand leaves open; they refer to the brand and never redefine it.
    const brandVars = cssVars(dsSource ?? ''), extensions = [];
    for (const file of ds.extensions ?? []) {
      try {
        const full = localFile(project, file);
        if (!fs.existsSync(full)) { errors.push(`Design system extension ${file} does not exist in ${project}`); continue; }
        const source = fs.readFileSync(full, 'utf8'); extensions.push(source);
        for (const name of cssVars(source).keys()) if (brandVars.has(name)) errors.push(`${file} redefines ${name}, which ${ds.file} defines; extensions refer to brand variables with var() and never redefine them`);
      } catch (error) { errors.push(`Design system extension: ${error.message}`); }
    }
    const system = [dsSource ?? '', ...extensions].join('\n');
    const scale = [...cssVars(system)].flatMap(([name, value]) => { const n = px(value), kind = /text|font/.test(name) ? 'text' : /radius/.test(name) ? 'radius' : /space|gap/.test(name) ? 'space' : null; return n != null && kind ? [{ name, px: n, kind }] : []; });
    const locked = (ds.fonts ?? []).map(f => first(f).toLowerCase());
    const dsHexes = new Set(dsSource ? hexes(system) : []);
    // A system derived from a picked direction binds that direction and later work; the other directions were explorations that predate it.
    for (const id of ds.source && present.includes(ds.source) ? [ds.source] : present) {
      const v = state.variants[id];
      const recorded = (v.tokens?.fonts ?? []).map(f => first(f).toLowerCase());
      if (locked.length && (recorded.length !== locked.length || recorded.some(f => !locked.includes(f)))) errors.push(`Variant ${id} records fonts ${JSON.stringify(v.tokens?.fonts ?? [])}, not the locked ${JSON.stringify(ds.fonts)}`);
      for (const [file, source] of Object.entries(sources[id] ?? {})) {
        if (locked.length) for (const font of declaredFonts(source)) if (!locked.includes(font.toLowerCase())) errors.push(`Variant ${id} ${file} declares font "${font}", outside the locked fonts ${JSON.stringify(ds.fonts)}`);
        if (dsSource) for (const hex of hexes(source)) if (!dsHexes.has(hex) && !plainColors.has(hex)) warnings.push(`Variant ${id} ${file} uses ${hex}, which is not in ${ds.file}; use the locked tokens or explain why`);
        const off = scale.length ? offScale(source, scale) : [];
        if (off.length) warnings.push(`Variant ${id} ${file} uses lengths outside the design system: ${off.slice(0, 6).join(', ')}${off.length > 6 ? ` and ${off.length - 6} more` : ''}; ${ds.source === id ? `\`apply ds ${id}\` replaces them with tokens` : "use the system's tokens or explain why"}`);
      }
      if (dsSource) for (const [name, value] of Object.entries(v.tokens?.colors ?? {})) {
        if (typeof value === 'string' && /^#[0-9a-f]{3,8}$/i.test(value) && !dsHexes.has(value.toLowerCase())) errors.push(`Variant ${id} records color ${name} ${value}, which is not in ${ds.file}`);
      }
    }
  }
  return { errors, warnings, variants: present };
}

if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
  const args = process.argv.slice(2), json = args.includes('--json');
  const at = args.indexOf('--project'), project = at >= 0 ? args[at + 1] : undefined;
  const root = args.find((a, i) => !a.startsWith('--') && (at < 0 || i !== at + 1)) ?? 'variant-output';
  const result = checkDelivery(root, project ? { project } : {});
  if (json) console.log(JSON.stringify(result, null, 2));
  else {
    for (const e of result.errors) console.log(`✗ ${e}`);
    for (const w of result.warnings) console.log(`! ${w}`);
    console.log(result.errors.length ? `delivery check failed: ${result.errors.length} error(s), ${result.warnings.length} warning(s)` : `delivery check passed for ${result.variants.join('/')}: ${result.warnings.length} warning(s). Rendering, accessibility and taste are not checked here.`);
  }
  process.exitCode = result.errors.length ? 1 : 0;
}
