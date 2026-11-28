#!/usr/bin/env node
// Runs the screening over the benchmark set (website/content/benchmark.json) in dry run and compares the model with the labels:
// band agreement per rubric, veto agreement, how far totals land from the standard's calibration estimates, and per dimension
// how well the scores separate accepted items from rejected ones. Nothing is written to an inbox or the library.
// Each item goes through the same steps as a weekly run (screening-rubric.mjs and the source's own prompt), without the
// "already in the library" checks, since many labelled items are in the library. Costs one model call per item (two on a retry).
// Usage: node website/scripts/benchmark.mjs [--only id,id] [--rubric design|video] [--jobs n] [--json file]
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { RUBRICS, BANDS, rubricBlock, answerBlock, screen, builderHost } from './screening-rubric.mjs';
import * as xp from './x-publish.mjs';
import * as tp from './threads-publish.mjs';
import { parsePostUrl, fromOembed } from './x-post.mjs';
import { pickMedia, syndicationToken } from './x-media.mjs';
import { parsePreview } from './link-preview.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const setPath = path.resolve(here, '../content/benchmark.json');

// X posts the owner added as design references (the Videos prompt would turn them away as design work): six frames, the design rubric.
export function designPostPrompt(candidate, meta, sheet) {
  return `You are scoring one X post for Variant Design's design inspiration library (interfaces, websites, brands, motion design).
Read the image at ${sheet}: six frames from the post's video, left to right, top to bottom. You cannot play the video, so judge only what the frames show.

Post: https://x.com/${candidate.handle}/status/${candidate.id} by ${meta.author} (@${meta.handle}), ${meta.date}.
Post text: ${JSON.stringify(meta.text)}

${rubricBlock('design', { outOfScope: 'not design work: a creative video with no design subject, a meme, a screenshot of someone else\'s product with nothing of the author\'s own' })}
Score a brand identity, logo or icon set on extensibility instead of hierarchy.

${answerBlock('design', '"name": "<short title, at most 60 characters>"')}`;
}
const nameOnly = json => { const v = JSON.parse(json); if (typeof v.name !== 'string' || !v.name.trim() || v.name.length > 60) throw new Error('"name" must be 1–60 characters'); return { name: v.name.trim() }; };

async function fetchJson(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`${res.status} from ${new URL(url).host}`);
  return res.json();
}
const defaults = {
  ask: xp.askClaude,
  syndication: id => fetchJson(`https://cdn.syndication.twimg.com/tweet-result?id=${id}&lang=en&token=${syndicationToken(id)}`),
  oembed: post => fetchJson(`https://publish.x.com/oembed?url=${encodeURIComponent(post.url)}&omit_script=1&dnt=1`),
  sheet: xp.makeSheet, page: tp.fetchPage, screenshot: tp.screenshot,
};

// One item, screened as its source would. Returns the scored screening (or a code-level veto), never writes anything.
export async function screenItem(item, dep, dir) {
  const c = item.candidate;
  if (item.source === 'x') {
    const post = parsePostUrl(c.url);
    const media = pickMedia(await dep.syndication(post.id));
    if (!media) throw new Error('the post has no video the embed endpoint serves');
    const meta = fromOembed(await dep.oembed(post), post), sheet = await dep.sheet(media.video, dir);
    return item.rubric === 'video' ? screen(dep.ask, xp.buildPrompt(c, meta, sheet), dir, 'video', xp.parseVerdict) : screen(dep.ask, designPostPrompt(c, meta, sheet), dir, 'design', nameOnly);
  }
  if (item.source === 'site') {
    if (builderHost(c.link)) return { band: 'reject', vetoes: ['template'], total: null, max: RUBRICS.design.max, scores: {}, reason: 'Veto template: site-builder subdomain (checked in code)' };
    const page = await dep.page(c.link);
    if (!page.html) throw new Error(`the site answered HTTP ${page.status}`);
    const preview = parsePreview(page.html, page.url) ?? { title: '' };
    return screen(dep.ask, tp.buildPrompt(c, preview, await dep.screenshot(c.link, dir)), dir, 'design', tp.parseVerdict);
  }
  throw new Error(`unknown source ${item.source}`);
}

const pct = (n, d) => (d ? `${Math.round((100 * n) / d)}%` : '–');
const mean = xs => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

// `results`: [{ item, screening } | { item, error }]. Pure, so the arithmetic is tested without a model.
export function agreement(results) {
  const done = results.filter(r => r.screening), out = { screened: done.length, errors: results.length - done.length, rubrics: {} };
  for (const kind of Object.keys(RUBRICS)) {
    const rs = done.filter(r => r.item.rubric === kind);
    if (!rs.length) continue;
    const confusion = Object.fromEntries(BANDS.map(l => [l, Object.fromEntries(BANDS.map(p => [p, 0]))]));
    for (const r of rs) confusion[r.item.label][r.screening.band]++;
    const same = rs.filter(r => r.item.label === r.screening.band).length;
    const independent = rs.filter(r => !r.item.calibration), sameIndependent = independent.filter(r => r.item.label === r.screening.band).length;
    // Collect or not: the decision that puts a card on the site. Review counts as "not collected".
    const collect = rs.filter(r => (r.item.label === 'accept') === (r.screening.band === 'accept')).length;
    const vetoItems = rs.filter(r => r.item.expected?.vetoes?.length), vetoHits = vetoItems.filter(r => r.item.expected.vetoes.some(v => r.screening.vetoes?.includes(v))).length;
    const totals = rs.filter(r => r.item.expected?.total != null && r.screening.total != null).map(r => Math.abs(r.screening.total - r.item.expected.total));
    const dims = RUBRICS[kind].dims.map(d => {
      const scoreOf = r => r.screening.scores?.[d.key]?.score ?? (d.alt ? r.screening.scores?.[d.alt.key]?.score : undefined);
      const by = label => mean(rs.filter(r => r.item.label === label).map(scoreOf).filter(n => n != null));
      const a = by('accept'), j = by('reject');
      return { key: d.key, accept: a, review: by('review'), reject: j, gap: a != null && j != null ? a - j : null };
    });
    out.rubrics[kind] = { n: rs.length, same, independent: independent.length, sameIndependent, collect, vetoItems: vetoItems.length, vetoHits, totalGap: mean(totals), totalsCompared: totals.length, confusion, dims };
  }
  return out;
}

const f1 = n => (n == null ? '–' : n.toFixed(1));
export function format(results, a = agreement(results)) {
  const lines = [];
  for (const r of results) {
    if (r.error) { lines.push(`? ${r.item.id} [${r.item.rubric}] label ${r.item.label}: could not screen (${r.error})`); continue; }
    const s = r.screening, mark = s.band === r.item.label ? '=' : '≠';
    lines.push(`${mark} ${r.item.id} [${r.item.rubric}] label ${r.item.label} → ${s.band}${s.total != null ? ` ${s.total}/${s.max}` : ''}${s.vetoes?.length ? ` veto ${s.vetoes.join(',')}` : ''}${r.item.calibration ? ' (calibration item)' : ''}`);
  }
  lines.push('', `Screened ${a.screened}, could not screen ${a.errors}.`);
  for (const [kind, k] of Object.entries(a.rubrics)) {
    lines.push('', `${kind}: band agreement ${k.same}/${k.n} (${pct(k.same, k.n)}); without calibration items ${k.sameIndependent}/${k.independent} (${pct(k.sameIndependent, k.independent)}); collect-or-not ${k.collect}/${k.n} (${pct(k.collect, k.n)}).`);
    lines.push(`  vetoes found ${k.vetoHits}/${k.vetoItems}; totals vs the standard's estimates: mean gap ${f1(k.totalGap)} points over ${k.totalsCompared}.`);
    lines.push(`  label → model   ${BANDS.map(b => b.padStart(7)).join('')}`);
    for (const l of BANDS) lines.push(`  ${l.padEnd(14)} ${BANDS.map(b => String(k.confusion[l][b]).padStart(7)).join('')}`);
    lines.push('  mean score by label (accept / review / reject; gap = accept − reject):');
    for (const d of k.dims) lines.push(`  ${d.key.padEnd(14)} ${f1(d.accept)} / ${f1(d.review)} / ${f1(d.reject)}   gap ${f1(d.gap)}`);
  }
  return lines.join('\n');
}

export async function run({ set = setPath, only = null, rubric = null, jobs = 3, io = {} } = {}) {
  const dep = { ...defaults, ...io };
  const items = JSON.parse(await fs.readFile(set, 'utf8')).items.filter(i => (!only || only.includes(i.id)) && (!rubric || i.rubric === rubric));
  const results = new Array(items.length);
  // Sites open Chrome one at a time; X items run `jobs` at once.
  const lanes = [items.map((item, i) => [item, i]).filter(([item]) => item.source === 'site'), items.map((item, i) => [item, i]).filter(([item]) => item.source !== 'site')];
  const worker = async queue => {
    for (let next; (next = queue.shift());) {
      const [item, i] = next, dir = await fs.mkdtemp(path.join(os.tmpdir(), 'benchmark-'));
      try { results[i] = { item, screening: await screenItem(item, dep, dir) }; } catch (error) { results[i] = { item, error: error.message.slice(0, 160) }; } finally { await fs.rm(dir, { recursive: true, force: true }); }
      process.stderr.write(`${results[i].screening ? '.' : '?'}`);
    }
  };
  await Promise.all([worker(lanes[0]), ...Array.from({ length: Math.max(1, jobs) }, () => worker(lanes[1]))]);
  process.stderr.write('\n');
  return results;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2), at = flag => (args.includes(flag) ? args[args.indexOf(flag) + 1] : null);
  const results = await run({ only: at('--only')?.split(','), rubric: at('--rubric'), jobs: Number(at('--jobs') ?? 3) });
  if (at('--json')) await fs.writeFile(at('--json'), `${JSON.stringify(results, null, 2)}\n`);
  console.log(format(results));
}
