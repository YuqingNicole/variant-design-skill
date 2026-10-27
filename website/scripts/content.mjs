#!/usr/bin/env node
// Direction library entries (RFC-002 §6): one brief and its A/B/C directions per file.
// Validates structure, the hosting rule for each source, image files, and, for verified
// entries, that the directions match the skill's recorded variant-output context.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
export const contentRoot = path.resolve(here, '../content');
const repoRoot = path.resolve(here, '../..');
const categories = ['landing', 'product', 'data', 'brand', 'component'];
const sources = ['own', 'permission', 'link-only'];
const imageTypes = { '.jpg': 'jpeg', '.jpeg': 'jpeg', '.png': 'png', '.webp': 'webp' };
export const maxImageBytes = 400_000;
const text = v => typeof v === 'string' && v.trim().length > 0;
const pair = v => Array.isArray(v) && v.length === 2 && v.every(text);
const url = v => text(v) && /^https:\/\/[^\s]+$/.test(v);

// Reads width and height from PNG, JPEG or WebP headers so recorded sizes cannot drift from the file.
export function imageSize(buffer) {
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    for (let i = 2; i + 9 < buffer.length;) {
      if (buffer[i] !== 0xff) { i++; continue; }
      const marker = buffer[i + 1], length = buffer.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) return { width: buffer.readUInt16BE(i + 7), height: buffer.readUInt16BE(i + 5) };
      i += 2 + length;
    }
  }
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    const chunk = buffer.toString('ascii', 12, 16);
    if (chunk === 'VP8X') return { width: 1 + buffer.readUIntLE(24, 3), height: 1 + buffer.readUIntLE(27, 3) };
    if (chunk === 'VP8 ') return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
    if (chunk === 'VP8L') { const b = buffer.readUInt32LE(21); return { width: (b & 0x3fff) + 1, height: ((b >> 14) & 0x3fff) + 1 }; }
  }
  return null;
}

function inside(root, relative) {
  const full = path.resolve(root, relative);
  return full.startsWith(root + path.sep) && fs.existsSync(full) && !fs.lstatSync(full).isSymbolicLink() ? full : null;
}

export function validateEntry(entry, { root = contentRoot, repo = repoRoot, file } = {}) {
  const errors = [], fail = message => errors.push(message);
  if (!entry || typeof entry !== 'object') return ['Entry must be an object'];
  if (!/^[a-z0-9][a-z0-9-]{2,60}$/.test(entry.slug ?? '')) fail('slug must be 3–61 lowercase letters, digits or hyphens');
  if (file && path.basename(file, '.json') !== entry.slug) fail('slug must match the file name');
  for (const key of ['title', 'summary', 'brief']) if (!pair(entry[key])) fail(`${key} needs [zh, en] text`);
  if (!categories.includes(entry.category)) fail(`category must be one of ${categories.join(', ')}`);
  if (!Array.isArray(entry.tags) || !entry.tags.every(text)) fail('tags must be a list of text');
  if (!sources.includes(entry.source)) fail(`source must be one of ${sources.join(', ')}`);
  if (!entry.credit || !text(entry.credit.name) || !url(entry.credit.url)) fail('credit needs a name and an https url');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.publishedAt ?? '')) fail('publishedAt must be YYYY-MM-DD');
  if (typeof entry.featured !== 'boolean') fail('featured must be true or false');
  if ('selected' in entry) fail('entries never record a selected direction; use recommendation');
  if (entry.source === 'own' && !['verified', 'concept'].includes(entry.kind)) fail('own entries need kind verified or concept');
  if (entry.source !== 'own' && 'kind' in entry) fail('kind applies only to own entries');
  if (entry.source === 'permission') {
    const p = entry.permission;
    if (!p || !text(p.grantor) || !text(p.scope) || !/^\d{4}-\d{2}-\d{2}$/.test(p.date ?? '') || !url(p.record)) fail('permission needs grantor, scope, date and an https record');
  } else if ('permission' in entry) fail('permission applies only to permission entries');
  if (entry.source === 'link-only' && !url(entry.url)) fail('link-only entries need the source url');
  if (entry.recommendation !== undefined && (!['A', 'B', 'C'].includes(entry.recommendation?.variant) || !pair(entry.recommendation?.reason))) fail('recommendation needs a variant A/B/C and a [zh, en] reason');

  const directions = Array.isArray(entry.directions) ? entry.directions : [];
  if (directions.map(d => d?.id).join('') !== 'ABC') fail('directions must be A, B and C in order');
  for (const d of directions) {
    const label = `direction ${d?.id ?? '?'}`;
    if (!pair(d?.name)) fail(`${label} name needs [zh, en]`);
    for (const key of ['optimizes', 'tradeoff', 'bestFor']) if (!pair(d?.comparison?.[key])) fail(`${label} comparison.${key} needs [zh, en]`);
    const media = Array.isArray(d?.media) ? d.media : [];
    if (entry.source === 'link-only') { if (media.length) fail(`${label}: link-only entries cannot host media`); continue; }
    if (!media.length) fail(`${label} needs at least one image`);
    for (const m of media) {
      if (!pair(m?.alt)) fail(`${label} image ${m?.file} needs [zh, en] alt text`);
      const ext = path.extname(m?.file ?? '').toLowerCase();
      if (!imageTypes[ext] || !/^[\w.-]+$/.test(m?.file ?? '')) { fail(`${label} image ${m?.file} must be a plain .jpg, .png or .webp name`); continue; }
      const full = inside(path.join(root, 'media'), path.join(entry.slug ?? '', m.file));
      if (!full) { fail(`${label} image ${m.file} is missing`); continue; }
      const bytes = fs.readFileSync(full);
      if (bytes.length > maxImageBytes) fail(`${label} image ${m.file} is ${bytes.length} bytes; limit ${maxImageBytes}`);
      const size = imageSize(bytes);
      if (!size || size.width !== m.width || size.height !== m.height) fail(`${label} image ${m.file} is ${size ? `${size.width}×${size.height}` : 'unreadable'}, not ${m.width}×${m.height}`);
    }
  }

  if (entry.source === 'own' && entry.kind === 'verified') {
    const contextPath = entry.evidence?.context;
    const full = text(contextPath) && contextPath.endsWith('.variant-context.json') ? inside(repo, contextPath) : null;
    if (!full) fail('verified entries need evidence.context pointing to a .variant-context.json in this repository');
    else {
      let context;
      try { context = JSON.parse(fs.readFileSync(full, 'utf8')); } catch { fail('evidence context is not valid JSON'); }
      if (context) {
        if (context.schemaVersion !== 2) fail('evidence context must be schema v2');
        // Directions shown in the library must be the ones the skill recorded, not rewritten after the fact.
        for (const d of directions) {
          const recorded = context.variants?.[d?.id]?.comparison;
          if (!recorded) { fail(`evidence has no variant ${d?.id}`); continue; }
          for (const key of ['optimizes', 'tradeoff', 'bestFor']) if (recorded[key] !== d?.comparison?.[key]?.[0]) fail(`direction ${d.id} comparison.${key} differs from the recorded context`);
        }
        if (entry.recommendation && context.recommendation?.variant !== entry.recommendation.variant) fail('recommendation differs from the recorded context');
      }
    }
  } else if ('evidence' in entry && entry.kind !== 'verified') fail('evidence applies only to verified entries');
  return errors;
}

export function loadEntries(root = contentRoot, options = {}) {
  const dir = path.join(root, 'entries');
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort() : [];
  const entries = [], problems = [], slugs = new Set();
  for (const name of files) {
    const file = path.join(dir, name);
    let entry;
    try { entry = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (error) { problems.push(`${name}: invalid JSON (${error.message})`); continue; }
    const errors = validateEntry(entry, { root, file, ...options });
    if (slugs.has(entry.slug)) errors.push('duplicate slug');
    slugs.add(entry.slug);
    problems.push(...errors.map(e => `${name}: ${e}`));
    entries.push(entry);
  }
  return { entries, problems };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const { entries, problems } = loadEntries();
  if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
  console.log(`${entries.length} entries valid: ${entries.map(e => `${e.slug} (${e.source}${e.kind ? `/${e.kind}` : ''})`).join(', ')}`);
}
