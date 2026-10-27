#!/usr/bin/env node
// Reads a Variant Design direction card (published at /d/<slug>.json on the library site, or a local
// copy) and turns one of its directions into a brief.designReferences record for design-task.mjs.
// A card is inspiration only: it never carries reuse rights for its images, text or code.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const cardFormat = 'variant-direction-card';
const text = v => typeof v === 'string' && v.trim().length > 0;
const pair = v => Array.isArray(v) && v.length === 2 && v.every(text);
const https = v => { try { const u = new URL(v); return u.protocol === 'https:' && !u.username && !u.password; } catch { return false; } };

export function validateCard(card) {
  const errors = [], fail = m => errors.push(m);
  if (!card || typeof card !== 'object') return ['Card must be a JSON object'];
  if (card.format !== cardFormat || card.version !== 1) fail(`Card must declare format "${cardFormat}" and version 1`);
  if (!https(card.url)) fail('Card url must be an https address without credentials');
  for (const key of ['title', 'summary', 'brief']) if (!pair(card[key])) fail(`Card ${key} needs [zh, en] text`);
  if (!['own', 'permission', 'link-only'].includes(card.source)) fail('Card source must be own, permission or link-only');
  if (card.source === 'own' && !['verified', 'concept'].includes(card.kind)) fail('Own cards need kind verified or concept');
  if (!text(card.reuse)) fail('Card must state its reuse terms');
  if ('selected' in card) fail('Cards never record a selected direction');
  const directions = Array.isArray(card.directions) ? card.directions : [];
  if (directions.map(d => d?.id).join('') !== 'ABC') fail('Card directions must be A, B and C in order');
  for (const d of directions) {
    if (!pair(d?.name)) fail(`Direction ${d?.id} needs a [zh, en] name`);
    for (const key of ['optimizes', 'tradeoff', 'bestFor']) if (!pair(d?.comparison?.[key])) fail(`Direction ${d?.id} comparison.${key} needs [zh, en]`);
    if (d?.image !== undefined && !https(d.image)) fail(`Direction ${d?.id} image must be an https address`);
    if (card.source === 'link-only' && d?.image !== undefined) fail('Link-only cards cannot include images');
  }
  if (card.recommendation !== undefined && (!['A', 'B', 'C'].includes(card.recommendation?.variant) || !pair(card.recommendation?.reason))) fail('Recommendation needs a variant and a [zh, en] reason');
  return errors;
}

// Reads a card from an https URL or a local file. Network failure is reported, never retried silently:
// sandboxed agents (for example codex exec) may have no network, and the user can paste the card instead.
export async function loadCard(source, { fetchImpl = globalThis.fetch, root = process.cwd() } = {}) {
  let card;
  if (/^https?:/i.test(source)) {
    if (!https(source)) throw new Error('Card URL must use https without credentials');
    let response;
    try { response = await fetchImpl(source, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(15_000) }); }
    catch (error) { throw new Error(`Could not fetch the card (${error.message}). Ask the user to paste the card JSON or save it as a file.`); }
    if (!response.ok) throw new Error(`Card request failed with HTTP ${response.status}`);
    try { card = await response.json(); } catch { throw new Error('Card response is not JSON'); }
  } else {
    const file = path.resolve(root, source);
    if (fs.lstatSync(file).isSymbolicLink()) throw new Error('Card file cannot be a symlink');
    card = JSON.parse(fs.readFileSync(file, 'utf8'));
  }
  const errors = validateCard(card);
  if (errors.length) throw new Error(`Invalid direction card:\n- ${errors.join('\n- ')}`);
  return card;
}

// direction: which card direction to borrow (default: its recommendation, else A).
// targets: which of the project's A/B/C should follow it (default: A; the others stay contrasts).
export function cardToReference(card, { direction, targets = ['A'], language = 'en', constraints } = {}) {
  const ix = language === 'zh' ? 0 : 1;
  const id = direction ?? card.recommendation?.variant ?? 'A';
  const chosen = card.directions.find(d => d.id === id);
  if (!chosen) throw new Error(`Card has no direction ${id}`);
  if (!Array.isArray(targets) || !targets.length || !targets.every(t => ['A', 'B', 'C'].includes(t)) || new Set(targets).size !== targets.length) throw new Error('Targets must be distinct A, B or C');
  return {
    id: `card-${card.url.split('/').pop().replace(/\.json$/, '')}-${id}`.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
    title: `${card.title[ix]} · ${id} ${chosen.name[ix]}`,
    url: card.url,
    usage: 'inspiration',
    borrow: chosen.comparison.optimizes[ix],
    rationale: `${chosen.comparison.bestFor[ix]} (${language === 'zh' ? '取舍' : 'tradeoff'}: ${chosen.comparison.tradeoff[ix]})`,
    constraints: constraints ?? (language === 'zh'
      ? '项目的品牌、现有设计系统和可访问性优先于方向卡；只借鉴结构与取舍，不复制卡片的截图、文案或代码。'
      : 'The project brand, existing design system and accessibility outrank the card; borrow structure and tradeoffs, never the card’s screenshots, copy or code.'),
    directions: targets,
    review: { status: 'unverified' },
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const args = process.argv.slice(2), option = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
  const source = args.find((a, i) => !a.startsWith('--') && !['--direction', '--targets', '--language'].includes(args[i - 1]));
  if (!source) { console.error('Usage: direction-card.mjs <card-url-or-file> [--direction A|B|C] [--targets A,B] [--language zh|en]'); process.exit(2); }
  try {
    const card = await loadCard(source);
    const reference = cardToReference(card, { direction: option('--direction'), targets: option('--targets')?.split(','), language: option('--language') });
    console.log(JSON.stringify({ card: { title: card.title, source: card.source, kind: card.kind, reuse: card.reuse, recommendation: card.recommendation?.variant }, reference }, null, 2));
  } catch (error) { console.error(error.message); process.exit(1); }
}
