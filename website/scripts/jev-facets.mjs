#!/usr/bin/env node
// Drafts facets for published references that have none, with a small local decision model (OneJev-0.8B, "Jev") for the one
// judgement it proved reliable at: whether a work is predominantly dark (docs/research/2026-11-24-jev-eval.md: AUC 0.98 on
// sites and videos, about 95% right at 0.95). Everything else is left empty, and medium comes from the kind of reference.
// Drafts are marked draftedBy: "jev" with the model's probability, so they can be found and checked (`npm run review:facets`);
// nothing here makes a facet public, since collections count only reviewed records.
// The model runs locally behind the qev server (JEV_URL, e.g. http://127.0.0.1:8799); without it this script does nothing.
// Usage: JEV_URL=… node website/scripts/jev-facets.mjs [--limit n] [--dry-run]
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { referenceRecords } from './reference-records.mjs';
import { readFacets, facetsFile, facetsModule } from './reference-facets.mjs';
import { serializeFacets } from './facet-review.mjs';
import { importTs } from './ts-module.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const sections = await importTs(path.join(here, '../src/inspiration-sections.ts'));
export const DARK = 0.95;
const question = { dark: { type: 'noul', instructions: 'The image is predominantly dark (a dark background covers most of it)' } };

// One request to the qev server: an image and yes/no questions; returns the probability of "yes" for each.
export async function ask(url, image, questions = question, { timeout = 120000 } = {}) {
  const media = [{ type: 'image', data: `data:${image.type};base64,${image.bytes.toString('base64')}` }];
  const res = await fetch(`${url.replace(/\/$/, '')}/v1/systemone`, { method: 'POST', headers: { 'content-type': 'application/json' }, signal: AbortSignal.timeout(timeout),
    body: JSON.stringify({ state: { task: 'Judge this design reference', screen: '<image:1>' }, questions, media }) });
  if (!res.ok) throw new Error(`jev answered HTTP ${res.status}`);
  const data = await res.json();
  return Object.fromEntries(Object.entries(data.answers ?? {}).map(([k, v]) => [k, Number(v?.noul)]));
}

// What the work is, from the kind of reference alone (the model is not asked): sites are websites, videos are film or motion.
export function mediumOf(item) {
  if (item.kind === 'social-post' || item.kind === 'youtube-video') return sections.sectionOf(item) === 'videos' ? 'film' : 'motion-graphics';
  return 'website';
}
export function draftFor(item, p) {
  return { status: 'draft', draftedBy: 'jev', jev: { dark: Math.round(p.dark * 1000) / 1000 }, industry: null, medium: mediumOf(item),
    pageTypes: [], patterns: [], components: [], techniques: [], styles: p.dark >= DARK ? ['dark'] : [] };
}

const download = async url => { const res = await fetch(url, { signal: AbortSignal.timeout(30000) }); if (!res.ok) throw new Error(`image answered HTTP ${res.status}`);
  return { bytes: Buffer.from(await res.arrayBuffer()), type: (res.headers.get('content-type') || 'image/jpeg').split(';')[0] }; };
// The picture the model judges: a site's first screen (the same capture the screening uses), a video's poster.
async function imageOf(item, dir, media, capture) {
  if (item.kind === 'social-post') { const m = media[item.id]; if (!m?.poster) throw new Error('no stored video poster'); return download(m.poster); }
  if (item.kind === 'youtube-video') return download(`https://i.ytimg.com/vi/${item.video?.id}/hqdefault.jpg`);
  const file = path.join(dir, `${item.id}.png`); await capture(item.url, file); return { bytes: await fs.readFile(file), type: 'image/png' };
}

export async function run({ url = process.env.JEV_URL, limit = 15, dryRun = false, io = {} } = {}) {
  if (!url) return { skipped: 'JEV_URL is not set', drafted: [], failed: [] };
  const facets = readFacets(), media = JSON.parse(await fs.readFile(path.join(here, '../src/x-media.json'), 'utf8'));
  const capture = io.capture ?? (async (u, f) => (await import('./site-capture.mjs')).captureScreens(u, f, { screens: 1 }));
  const judge = io.ask ?? ask, picture = io.image ?? ((item, dir) => imageOf(item, dir, media, capture));
  // Newest first, so the references the daily jobs just added are drafted before older ones.
  const todo = referenceRecords().published.filter(r => !facets[r.id]).sort((a, b) => String(b.addedAt).localeCompare(String(a.addedAt))).slice(0, limit);
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'jev-facets-')), drafted = [], failed = [];
  try {
    for (const item of todo) {
      try {
        const draft = draftFor(item, await judge(url, await picture(item, dir)));
        const problems = facetsModule.facetProblems(item.id, draft); if (problems.length) throw new Error(problems.join('; '));
        facets[item.id] = draft; drafted.push([item.id, draft.jev.dark, draft.styles.includes('dark')]);
      } catch (error) { failed.push([item.id, error.message]); }
    }
  } finally { await fs.rm(dir, { recursive: true, force: true }); }
  if (!dryRun && drafted.length) await fs.writeFile(facetsFile, serializeFacets(facets));
  return { drafted, failed };
}

export function report(r) {
  if (r.skipped) return `Jev facets skipped: ${r.skipped}.`;
  return [`Jev drafted facets for ${r.drafted.length}, failed ${r.failed.length}.`, ...r.drafted.map(([id, p, dark]) => `+ ${id} dark ${p}${dark ? ' → dark' : ''}`), ...r.failed.map(([id, e]) => `! ${id}: ${e}`)].join('\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2), limit = args.includes('--limit') ? Number(args[args.indexOf('--limit') + 1]) : 15;
  if (!Number.isInteger(limit) || limit < 1) { console.error('Usage: jev-facets.mjs [--limit n] [--dry-run]'); process.exit(2); }
  console.log(report(await run({ limit, dryRun: args.includes('--dry-run') })));
}
