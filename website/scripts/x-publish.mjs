#!/usr/bin/env node
// Closes the loop after weekly discovery: every `pending` candidate in the X inbox gets its video frames read by a model,
// which accepts it with bilingual notes or rejects it with a reason; the result is written to the inbox and the library.
// Nothing here publishes: run-x-weekly.sh puts the change in a pull request, and a person merging it is the review.
// Usage: node website/scripts/x-publish.mjs [--limit n] [--dry-run]
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parsePostUrl, fromOembed, draftEntry } from './x-post.mjs';
import { pickMedia, syndicationToken } from './x-media.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const inboxPath = path.resolve(here, '../content/x-post-inbox.json');
const dataPath = path.resolve(here, '../src/inspiration-data.ts');

export const TAGS = ['Interaction', 'Motion', 'Web', 'Branding', 'Illustration', 'Poster', 'Print'];
const cjk = /[㐀-鿿]/, latin = /[A-Za-z]{3}/;

// The library is a TS module of JSON literals: `export const inspirationItems = [ ... ];`.
export function readItems(source) {
  const from = source.indexOf('[', source.indexOf('export const inspirationItems = '));
  const end = source.indexOf('\n];', from);
  if (from < 0 || end < 0) throw new Error('inspiration-data.ts: inspirationItems array not found');
  return JSON.parse(source.slice(from, end + 2));
}
export function appendItems(source, entries) {
  if (!entries.length) return source;
  const from = source.indexOf('[', source.indexOf('export const inspirationItems = '));
  const end = source.indexOf('\n];', from);
  const body = entries.map(entry => JSON.stringify(entry, null, 2).replace(/^/gm, '  ')).join(',\n');
  return `${source.slice(0, end)},\n${body}${source.slice(end)}`;
}

// A second video from an author already in the library is not collected (maintainer's batch rule).
export function authorInLibrary(items, handle) {
  const h = handle.toLowerCase();
  return items.find(i => i.post?.handle?.toLowerCase() === h) ?? null;
}

export function buildPrompt(candidate, meta, sheet) {
  return `You are screening one X video post for Variant Design's design inspiration library, for a pull request a person will review.
Read the image at ${sheet}: six frames from the post's video, left to right, top to bottom. You cannot play the video, so describe only what the frames show.

Post: https://x.com/${candidate.handle}/status/${candidate.id} by ${meta.author} (@${meta.handle}), ${meta.date}, ${candidate.likes} likes.
Post text: ${JSON.stringify(meta.text)}

Reject (accept=false) when any applies: a resource list or "bookmark these" thread; a tool, product, course or sponsor promotion; a repost of someone else's work or an unclear original author; merchandise or pre-sale; a portfolio montage; tutorials and news; content that is not interface, motion, brand, print, poster, illustration or web design; frames too unclear to describe.
Otherwise accept, and write notes a designer can use. Do not invent: no names, claims or tools the frames and the text do not show. Keep the author's own credit if the text gives one.

Answer with one JSON object and nothing else:
{"accept": true, "name": "<short title, at most 60 characters>", "tag": "<one of ${TAGS.join(', ')}>", "focus": {"zh": "<what to study, one sentence, at most 300 characters>", "en": "<same, in English>"}, "application": {"zh": "<where it applies, a short phrase>", "en": "<same, in English>"}}
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
  if (!TAGS.includes(v.tag)) throw new Error(`"tag" must be one of ${TAGS.join(', ')}`);
  for (const [key, max] of [['focus', 400], ['application', 160]]) {
    if (!text(v[key]?.zh, max) || !text(v[key]?.en, max)) throw new Error(`"${key}" needs zh and en text of at most ${max} characters`);
    if (!cjk.test(v[key].zh) || !latin.test(v[key].en)) throw new Error(`"${key}" zh must be Chinese and en must be English`);
  }
  return { accept: true, name: v.name.trim(), tag: v.tag, focus: { zh: v.focus.zh.trim(), en: v.focus.en.trim() }, application: { zh: v.application.zh.trim(), en: v.application.en.trim() } };
}

// An answer that fails validation is sent back once with the reason, because a note that runs long is the usual miss.
export async function judged(ask, prompt, dir) {
  const first = await ask(prompt, dir);
  try { return parseVerdict(first); } catch (error) {
    return parseVerdict(await ask(`${prompt}\n\nYour previous answer was rejected: ${error.message}. Answer again with the corrected JSON object only.`, dir));
  }
}

export function entryFor(candidate, meta, verdict, at) {
  const post = parsePostUrl(candidate.url);
  const entry = draftEntry(post, meta, verdict.tag, at);
  // X labels Indonesian `in`; the library writes the standard code, as the earlier batches did.
  const lang = { in: 'id' }[entry.post.lang] ?? entry.post.lang;
  return { ...entry, name: verdict.name, focus: verdict.focus, application: verdict.application, post: { ...entry.post, lang } };
}

export function review(candidate, patch, today) {
  const { reason, entry, ...rest } = candidate;
  return { ...rest, ...patch, reviewedAt: today };
}

// Six frames into one contact sheet, streamed from the post's own video address; nothing is kept but the sheet.
export function makeSheet(videoUrl, dir) {
  const probe = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', videoUrl], { encoding: 'utf8', timeout: 60000 });
  const duration = Number(probe.stdout);
  if (!(duration > 0)) throw new Error('ffprobe could not read the video duration');
  const sheet = path.join(dir, 'sheet.jpg');
  const made = spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', videoUrl, '-vf', `fps=6/${duration.toFixed(3)},scale=480:-2,tile=3x2`, '-frames:v', '1', sheet], { timeout: 120000 });
  if (made.status !== 0) throw new Error(`ffmpeg failed: ${String(made.stderr).slice(0, 200)}`);
  return sheet;
}

// The model runs through the Claude Code CLI the maintainer already has; `--allowedTools Read` lets it open the sheet and nothing else.
export function askClaude(prompt, dir) {
  const run = spawnSync('claude', ['-p', '--allowedTools', 'Read', '--add-dir', dir, '--output-format', 'json', prompt], { encoding: 'utf8', timeout: 300000, cwd: dir });
  if (run.status !== 0) throw new Error(`claude exited ${run.status}: ${String(run.stderr).slice(0, 200)}`);
  return JSON.parse(run.stdout).result;
}

async function fetchJson(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`${res.status} from ${new URL(url).host}`);
  return res.json();
}
const defaults = {
  oembed: post => fetchJson(`https://publish.x.com/oembed?url=${encodeURIComponent(post.url)}&omit_script=1&dnt=1`),
  syndication: id => fetchJson(`https://cdn.syndication.twimg.com/tweet-result?id=${id}&lang=en&token=${syndicationToken(id)}`),
  sheet: makeSheet,
  ask: askClaude,
};

// A candidate that cannot be read this time (network, X, the model) stays `pending` for the next run; only a decision changes it.
export async function run({ inbox: inboxFile = inboxPath, data: dataFile = dataPath, limit = 10, dryRun = false, now = new Date(), io = {} } = {}) {
  const dep = { ...defaults, ...io };
  const inbox = JSON.parse(await fs.readFile(inboxFile, 'utf8'));
  let source = await fs.readFile(dataFile, 'utf8');
  const items = readItems(source), today = now.toISOString().slice(0, 10);
  const added = [], summary = { accepted: [], rejected: [], kept: [] };
  const queue = inbox.candidates.filter(c => c.status === 'pending' || !c.status).sort((a, b) => b.likes - a.likes).slice(0, limit);
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'x-publish-'));
  const decide = (candidate, patch) => { inbox.candidates[inbox.candidates.indexOf(candidate)] = review(candidate, patch, today); };
  try {
    for (const candidate of queue) {
      const label = `@${candidate.handle} ${candidate.id}`;
      try {
        const own = authorInLibrary([...items, ...added], candidate.handle);
        if (own) { decide(candidate, { status: 'rejected', reason: `The library already has a post by this author (${own.id})` }); summary.rejected.push([label, 'author already in the library']); continue; }
        const post = parsePostUrl(candidate.url);
        const media = pickMedia(await dep.syndication(post.id));
        if (!media) { decide(candidate, { status: 'rejected', reason: 'The post has no video the embed endpoint serves' }); summary.rejected.push([label, 'no video']); continue; }
        const meta = fromOembed(await dep.oembed(post), post);
        const prompt = buildPrompt(candidate, meta, await dep.sheet(media.video, dir));
        const verdict = await judged(dep.ask, prompt, dir);
        if (!verdict.accept) { decide(candidate, { status: 'rejected', reason: verdict.reason }); summary.rejected.push([label, verdict.reason]); continue; }
        const entry = entryFor(candidate, meta, verdict, now.toISOString());
        if (items.some(i => i.id === entry.id) || added.some(i => i.id === entry.id)) throw new Error(`entry id ${entry.id} already exists`);
        added.push(entry);
        decide(candidate, { status: 'published', entry: entry.id });
        summary.accepted.push([label, entry.id, entry.tag, entry.name]);
      } catch (error) { summary.kept.push([label, error.message]); }
    }
  } finally { await fs.rm(dir, { recursive: true, force: true }); }
  if (!dryRun && (added.length || summary.rejected.length)) {
    source = appendItems(source, added);
    await fs.writeFile(dataFile, source);
    inbox.updatedAt = now.toISOString();
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
  if (!Number.isInteger(limit) || limit < 1) { console.error('Usage: x-publish.mjs [--limit n] [--dry-run]'); process.exit(2); }
  console.log(report(await run({ limit, dryRun: args.includes('--dry-run') })));
}
