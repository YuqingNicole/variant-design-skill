#!/usr/bin/env node
// Closes the loop after Threads discovery. A Threads post is a lead; what the library collects is the site it points to.
// For each `pending` candidate with a link, this opens the site once in headless Chrome (a 1280×800 viewport, scrolled
// screen by screen, the first three screens stacked as one image; see site-capture.mjs), reads its share preview, and asks a model to accept it with bilingual notes or reject it with a reason.
// Nothing here publishes by itself: run-threads-weekly.sh puts the change in a pull request that merges once CI passes, with no person reviewing it.
// The same screening serves the curated-gallery inbox (site-discovery.mjs): pass --inbox website/content/site-inbox.json.
// Usage: node website/scripts/threads-publish.mjs [--inbox file] [--limit n] [--dry-run]
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readItems, appendItems, askClaude } from './x-publish.mjs';
import { parsePreview } from './link-preview.mjs';
import { fetchImageSize } from './image-size.mjs';
import { captureScreens } from './site-capture.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const inboxPath = path.resolve(here, '../content/threads-post-inbox.json');
const dataPath = path.resolve(here, '../src/inspiration-data.ts');
const previewsPath = path.resolve(here, '../src/link-previews.json');

export const SITE_TAGS = ['Developer', 'SaaS', 'AI', 'Commerce', 'Studio', 'Creative', 'Fintech', 'Knowledge', 'Analytics'];
const cjk = /[㐀-鿿]/, latin = /[A-Za-z]{3}/;

const hostOf = url => { try { return new URL(url).hostname.replace(/^www\./, '').toLowerCase(); } catch { return null; } };
export const siteInLibrary = (items, url) => { const host = hostOf(url); return host ? items.find(i => !i.post && i.kind !== 'youtube-video' && hostOf(i.url) === host) ?? null : null; };
// `drinkpoppi.com` → `drinkpoppi`; a clash gets the next free number, so ids never repeat.
export function idFor(url, taken) {
  const base = (hostOf(url) ?? 'site').split('.').slice(0, -1).join('-').replace(/[^a-z0-9-]/g, '') || 'site';
  let id = base, n = 2;
  while (taken.has(id)) id = `${base}-${n++}`;
  return id;
}

export function buildPrompt(candidate, preview, sheet) {
  return `You are screening one website for Variant Design's design inspiration library, entries you accept go live without a person reviewing them, so reject when unsure.
Read the image at ${sheet}: the first three screens of ${candidate.link} in a 1280×800 browser window, one above the other with a thin grey line between them. Each screen was reached by scrolling the mouse wheel one screen height and waiting for the page to settle, so a screen that repeats the one above means the page did not scroll further (or swapped a slide in place). You cannot interact with the site or see it on a phone, so describe only what the screens show.

${candidate.source ? `It was picked by ${candidate.sourceName}, a curated website gallery, as ${JSON.stringify(candidate.title)}; a gallery pick is a lead, not proof of quality.` : `It was found in a Threads post by @${candidate.username ?? 'unknown'}: ${JSON.stringify(candidate.text)}`}
Its share preview title: ${JSON.stringify(preview.title)}

Reject (accept=false) when any applies: the screens are a block page, a verification or age gate, a subscription or discount gate, or a pop-up covering the main content; the page is empty or did not render past the first screen; only one screen of content; a shutdown, acquisition or farewell notice; a redirect to an unrelated site; a link-in-bio or template page; a page whose design is plain or dated with nothing to study; a small cookie banner alone is not a reason.
Otherwise accept, and write notes a designer can use: "focus" walks the page top to bottom with an arrow between sections, using only what the screens show (real copy in quotes), in at most 450 characters per language; "application" at most 100. Do not invent names, claims or tools.

Answer with one JSON object and nothing else:
{"accept": true, "name": "<the site's own name>", "tag": "<one of ${SITE_TAGS.join(', ')}>", "focus": {"zh": "<what to study>", "en": "<same, in English>"}, "application": {"zh": "<where it applies, a short phrase>", "en": "<same, in English>"}}
or {"accept": false, "reason": "<one sentence in English>"}`;
}

const text = (value, max) => typeof value === 'string' && value.trim() && value.trim().length <= max && !/TODO/i.test(value);
export function parseVerdict(output) {
  const match = /\{[\s\S]*\}/.exec(String(output ?? ''));
  if (!match) throw new Error('no JSON object in the model answer');
  let v;
  try { v = JSON.parse(match[0]); } catch { throw new Error('the model answer is not valid JSON'); }
  if (v.accept === false) {
    if (!text(v.reason, 400)) throw new Error('a rejection needs a reason');
    return { accept: false, reason: v.reason.trim() };
  }
  if (v.accept !== true) throw new Error('"accept" must be true or false');
  if (!text(v.name, 60)) throw new Error('"name" must be 1–60 characters');
  if (!SITE_TAGS.includes(v.tag)) throw new Error(`"tag" must be one of ${SITE_TAGS.join(', ')}`);
  for (const [key, max] of [['focus', 700], ['application', 160]]) {
    if (!text(v[key]?.zh, max) || !text(v[key]?.en, max)) throw new Error(`"${key}" needs zh and en text of at most ${max} characters`);
    if (!cjk.test(v[key].zh) || !latin.test(v[key].en)) throw new Error(`"${key}" zh must be Chinese and en must be English`);
  }
  return { accept: true, name: v.name.trim(), tag: v.tag, focus: { zh: v.focus.zh.trim(), en: v.focus.en.trim() }, application: { zh: v.application.zh.trim(), en: v.application.en.trim() } };
}

export function entryFor(candidate, verdict, id, at) {
  const page = new URL(candidate.link);
  return {
    id, name: verdict.name, category: 'landing', tag: verdict.tag, url: `${page.origin}${page.pathname === '/' ? '/' : page.pathname}`, source: 'link-only',
    focus: verdict.focus, application: verdict.application, publisher: verdict.name, kind: 'official-site', designer: null,
    checkedAt: at.slice(0, 10), addedAt: at, verification: 'official-public-source', mobile: 'not-tested', via: candidate.url,
  };
}

export function review(candidate, patch, today) {
  const { reason, entry, ...rest } = candidate;
  return { ...rest, ...patch, reviewedAt: today };
}

// One headless load, the page's first three screens as a single image.
export async function screenshot(url, dir) {
  return (await captureScreens(url, path.join(dir, 'site.png'))).file;
}

async function fetchPage(url) {
  const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; VariantDesignLinkPreview/1.0)', accept: 'text/html' }, signal: AbortSignal.timeout(20000), redirect: 'follow' });
  return { status: res.status, url: res.url, html: res.ok ? await res.text() : '' };
}
// An answer that fails validation is sent back once with the reason, because a note that runs long is the usual miss.
export async function judged(ask, prompt, dir) {
  const first = await ask(prompt, dir);
  try { return parseVerdict(first); } catch (error) {
    return parseVerdict(await ask(`${prompt}\n\nYour previous answer was rejected: ${error.message}. Answer again with the corrected JSON object only.`, dir));
  }
}
// `size` reads the preview image's width and height so the feed can lay its cover out before it loads.
const defaults = { page: fetchPage, screenshot, ask: askClaude, size: url => fetchImageSize(url).catch(() => null) };

// A candidate that cannot be read this time (network, Chrome, the model) stays `pending`; only a decision changes it.
export async function run({ inbox: inboxFile = inboxPath, data: dataFile = dataPath, previews: previewsFile = previewsPath, limit = 10, dryRun = false, now = new Date(), io = {} } = {}) {
  const dep = { ...defaults, ...io };
  const inbox = JSON.parse(await fs.readFile(inboxFile, 'utf8'));
  let source = await fs.readFile(dataFile, 'utf8');
  const items = readItems(source), today = now.toISOString().slice(0, 10), stamp = now.toISOString();
  const previews = JSON.parse(await fs.readFile(previewsFile, 'utf8')), newPreviews = {};
  const added = [], summary = { accepted: [], rejected: [], kept: [] };
  const queue = inbox.candidates.filter(c => c.status === 'pending' || !c.status).slice(0, limit);
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'threads-publish-'));
  const decide = (candidate, patch) => { inbox.candidates[inbox.candidates.indexOf(candidate)] = review(candidate, patch, today); };
  const reject = (candidate, label, reason) => { decide(candidate, { status: 'rejected', reason }); summary.rejected.push([label, reason]); };
  try {
    for (const candidate of queue) {
      const label = candidate.source ? `${candidate.sourceName}: ${candidate.title}` : `@${candidate.username ?? '?'} ${candidate.id}`;
      try {
        if (!candidate.link || !/^https:\/\//.test(candidate.link)) { reject(candidate, label, 'The lead points to no website; the library collects sites, not posts'); continue; }
        const own = siteInLibrary([...items, ...added], candidate.link);
        if (own) { reject(candidate, label, `The library already has this site (${own.id})`); continue; }
        const page = await dep.page(candidate.link);
        if (!page.html) { reject(candidate, label, `The site answered HTTP ${page.status}`); continue; }
        const preview = parsePreview(page.html, page.url);
        if (!preview) { reject(candidate, label, 'The site publishes no share preview image'); continue; }
        if (siteInLibrary([...items, ...added], page.url)) { reject(candidate, label, 'The link redirects to a site the library already has'); continue; }
        const prompt = buildPrompt(candidate, preview, await dep.screenshot(candidate.link, dir));
        const verdict = await judged(dep.ask, prompt, dir);
        if (!verdict.accept) { reject(candidate, label, verdict.reason); continue; }
        const id = idFor(candidate.link, new Set([...items, ...added].map(i => i.id)));
        const entry = entryFor(candidate, verdict, id, stamp);
        added.push(entry); newPreviews[id] = { ...preview, ...(await dep.size(preview.image) ?? {}), fetchedAt: today };
        decide(candidate, { status: 'published', entry: id });
        summary.accepted.push([label, id, entry.tag, entry.name]);
      } catch (error) { summary.kept.push([label, error.message]); }
    }
  } finally { await fs.rm(dir, { recursive: true, force: true }); }
  if (!dryRun && (added.length || summary.rejected.length)) {
    await fs.writeFile(dataFile, appendItems(source, added));
    if (added.length) await fs.writeFile(previewsFile, `${JSON.stringify({ ...previews, ...newPreviews }, null, 2)}\n`);
    inbox.updatedAt = stamp;
    const temporary = `${inboxFile}.tmp`;
    await fs.writeFile(temporary, `${JSON.stringify(inbox, null, 2)}\n`);
    await fs.rename(temporary, inboxFile);
  }
  return { ...summary, entries: added };
}

export function report(summary) {
  const lines = [`Accepted ${summary.accepted.length}, rejected ${summary.rejected.length}, left pending ${summary.kept.length}.`];
  for (const [label, id, tag, name] of summary.accepted) lines.push(`+ ${label} → ${id} (${tag}) ${name}`);
  for (const [label, reason] of summary.rejected) lines.push(`- ${label}: ${reason}`);
  for (const [label, reason] of summary.kept) lines.push(`? ${label}: ${reason}`);
  return lines.join('\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2), at = flag => args[args.indexOf(flag) + 1];
  const limit = args.includes('--limit') ? Number(at('--limit')) : 10;
  if (!Number.isInteger(limit) || limit < 1) { console.error('Usage: threads-publish.mjs [--inbox file] [--limit n] [--dry-run]'); process.exit(2); }
  console.log(report(await run({ limit, dryRun: args.includes('--dry-run'), ...(args.includes('--inbox') ? { inbox: path.resolve(at('--inbox')) } : {}) })));
}
