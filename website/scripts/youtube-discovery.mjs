#!/usr/bin/env node
// Weekly YouTube discovery through the official YouTube Data API v3 (search.list, then videos.list for length and views), not by
// reading youtube.com pages. It stores links and public metadata only; youtube-publish.mjs screens each candidate from YouTube's own
// thumbnails, and its weekly pull request merges once CI passes. No video or frame is downloaded or kept (RFC-008).
// A search costs 100 of the key's 10,000 free daily units, so a run of eight searches is under 10% of a day.
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const inboxPath = path.resolve(here, '../content/youtube-video-inbox.json');
const configPath = path.resolve(here, '../content/youtube-discovery.json');
const libraryPath = path.resolve(here, '../src/inspiration-data.ts');
// The key lives outside the repository. YOUTUBE_API_KEY overrides the file.
export const keyPath = process.env.YOUTUBE_KEY_FILE || path.join(os.homedir(), '.config/variant-design/youtube.json');
const api = 'https://www.googleapis.com/youtube/v3';
const reviewPolicy = 'Candidates reach the library only through youtube-publish.mjs, which reads YouTube\'s own thumbnails and writes bilingual notes into a pull request that merges itself once CI passes. Nothing from a video is downloaded or kept.';

const idPattern = /^[a-z0-9][a-z0-9-]*$/;
const wholeNumber = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;

// A group has an id, a window in `days`, a `maxSeconds` cap on length and `queries` ({ q, minViews }). Groups marked `weekly` run on the schedule.
export function validateConfig(config) {
  const fail = message => { throw new Error(`youtube-discovery.json: ${message}`); };
  if (!Array.isArray(config?.groups) || !config.groups.length) fail('"groups" must be a non-empty list');
  const ids = new Set();
  for (const group of config.groups) {
    const id = group?.id;
    if (typeof id !== 'string' || !idPattern.test(id) || id === 'all') fail(`group id ${JSON.stringify(id)} must be lowercase letters, digits or hyphens, and not "all"`);
    if (ids.has(id)) fail(`group "${id}" is listed twice`);
    ids.add(id);
    if (!wholeNumber(group.days, 1, 365)) fail(`group "${id}" needs "days" from 1 to 365`);
    if (!wholeNumber(group.maxSeconds, 10, 1200)) fail(`group "${id}" needs "maxSeconds" from 10 to 1200`);
    if (group.weekly !== undefined && typeof group.weekly !== 'boolean') fail(`group "${id}": "weekly" must be true or false`);
    if (!Array.isArray(group.queries) || !group.queries.length) fail(`group "${id}" needs at least one query`);
    for (const query of group.queries) {
      if (typeof query?.q !== 'string' || !query.q.trim()) fail(`group "${id}" has a query without "q"`);
      if (!wholeNumber(query.minViews, 0, 1e9)) fail(`group "${id}": "minViews" must be a whole number (${query.q})`);
    }
  }
  if (!config.groups.some(group => group.weekly)) fail('at least one group must be marked "weekly"');
  return config;
}
export async function readConfig(file = configPath) { return validateConfig(JSON.parse(await fs.readFile(file, 'utf8'))); }

export function selectGroups(config, names) {
  const wanted = String(names ?? '').split(',').map(name => name.trim()).filter(Boolean);
  if (!wanted.length) return config.groups.filter(group => group.weekly);
  if (wanted.includes('all')) return config.groups;
  const unknown = wanted.filter(name => !config.groups.some(group => group.id === name));
  if (unknown.length) throw new Error(`Unknown discovery group: ${unknown.join(', ')}. Known groups: ${config.groups.map(group => group.id).join(', ')}, or "all".`);
  return config.groups.filter(group => wanted.includes(group.id));
}

// The searches of one run as API parameters (without the key). The same search reached through two groups runs once.
export function planSearches(config, { groups, days, now = new Date() } = {}) {
  const override = days === undefined || days === '' ? undefined : Number(days);
  if (override !== undefined && !wholeNumber(override, 1, 365)) throw new Error(`--days must be a whole number from 1 to 365, got ${JSON.stringify(days)}.`);
  const searches = [], seen = new Set();
  for (const group of selectGroups(config, groups)) {
    const publishedAfter = new Date(now.getTime() - (override ?? group.days) * 864e5).toISOString();
    for (const { q, minViews } of group.queries) {
      // `videoDuration=short` is under four minutes; the exact cap is applied afterwards from each video's own length.
      const params = { part: 'snippet', type: 'video', q: q.trim(), order: 'viewCount', publishedAfter, videoEmbeddable: 'true', videoDuration: 'short', safeSearch: 'strict', maxResults: '25' };
      const key = JSON.stringify(params);
      if (seen.has(key)) continue;
      seen.add(key);
      searches.push({ group: group.id, label: q.trim(), params, minViews, maxSeconds: group.maxSeconds });
    }
  }
  return searches;
}

// ISO 8601 duration ("PT1M5S") to seconds; a live stream ("P0D") or anything odd is 0 and so never qualifies.
export function seconds(duration) {
  const m = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(String(duration ?? ''));
  return m ? (+m[1] || 0) * 86400 + (+m[2] || 0) * 3600 + (+m[3] || 0) * 60 + (+m[4] || 0) : 0;
}

// Candidates from the details of one search's videos: short enough, enough views, not already in the library.
export function extractCandidates(videos, capturedAt, search, library = new Map()) {
  const out = [];
  for (const v of videos ?? []) {
    const length = seconds(v.contentDetails?.duration), views = Number(v.statistics?.viewCount ?? 0);
    if (!v.id || !v.snippet || length < 5 || length > search.maxSeconds || views < search.minViews) continue;
    out.push({
      id: v.id, url: `https://www.youtube.com/watch?v=${v.id}`, title: String(v.snippet.title ?? '').trim(), channel: String(v.snippet.channelTitle ?? '').trim(),
      channelUrl: v.snippet.channelId ? `https://www.youtube.com/channel/${v.snippet.channelId}` : null, publishedAt: v.snippet.publishedAt ?? null,
      seconds: length, views, likes: Number(v.statistics?.likeCount ?? 0), text: String(v.snippet.description ?? '').trim().slice(0, 280),
      ...(library.has(v.id) ? { inLibrary: library.get(v.id) } : {}), capturedAt, query: search.label, group: search.group, status: 'pending',
    });
  }
  return out;
}

// Video id → library entry id, so a candidate already collected says so.
export function libraryIndex(source) {
  const index = new Map(), array = /export const inspirationItems = (\[[\s\S]*?\n\])/.exec(source)?.[1];
  for (const item of array ? JSON.parse(array) : []) if (item?.video?.platform === 'youtube' && !index.has(item.video.id)) index.set(item.video.id, item.id);
  return index;
}

// Adds what a run found without touching candidates already there (they may be reviewed), and counts per group.
export function mergeCandidates(existing, found) {
  const byId = new Map(existing.map(item => [item.id, item]));
  const fresh = new Set(), groups = new Map();
  for (const candidate of found) {
    if (fresh.has(candidate.id)) continue;
    fresh.add(candidate.id);
    const tally = groups.get(candidate.group) ?? groups.set(candidate.group, { found: 0, added: 0 }).get(candidate.group);
    tally.found++;
    if (!byId.has(candidate.id)) { byId.set(candidate.id, candidate); tally.added++; }
  }
  const candidates = [...byId.values()].sort((a, b) => b.capturedAt.localeCompare(a.capturedAt) || b.views - a.views || a.id.localeCompare(b.id));
  return { candidates, groups, found: fresh.size, added: [...groups.values()].reduce((sum, t) => sum + t.added, 0) };
}

async function readJson(file, fallback) {
  try { return JSON.parse(await fs.readFile(file, 'utf8')); } catch (error) { if (error.code === 'ENOENT') return fallback; throw error; }
}
async function writeJson(file, value, mode) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.${Date.now()}.tmp`;
  try {
    await fs.writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx', ...(mode ? { mode } : {}) });
    await fs.rename(temporary, file);
  } catch (error) { await fs.rm(temporary, { force: true }); throw error; }
}

// The key goes in the query string, as the API requires; error messages never print the request URL, so it never reaches a log.
async function call(fetchImpl, endpoint, params, key) {
  const response = await fetchImpl(`${api}/${endpoint}?${new URLSearchParams({ ...params, key })}`);
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.error) throw new Error(`YouTube API ${endpoint}: ${response.status} ${body.error?.message ?? 'no error message'}`);
  return body;
}

export async function loadKey({ file = keyPath, env = process.env } = {}) {
  if (env.YOUTUBE_API_KEY) return env.YOUTUBE_API_KEY;
  const saved = await readJson(file, null);
  if (!saved?.apiKey) throw new Error(`No YouTube API key. Create one in Google Cloud (YouTube Data API v3) and save it with: node website/scripts/youtube-discovery.mjs --save-key (it reads the key from standard input and writes ${file}).`);
  return saved.apiKey;
}
export async function saveKey(key, { file = keyPath } = {}) {
  const value = String(key ?? '').trim();
  if (!/^[A-Za-z0-9_-]{20,}$/.test(value)) throw new Error('That does not look like a YouTube API key.');
  await writeJson(file, { apiKey: value }, 0o600);
}

// Any API error stops the run and leaves the inbox unchanged; an empty result is normal.
export async function run({ groups, days, config = configPath, inbox: inboxFile = inboxPath, library = libraryPath, fetchImpl = fetch, key, pause = 300, log = console.log } = {}) {
  const now = new Date(), capturedAt = now.toISOString();
  const searches = planSearches(await readConfig(config), { groups, days, now });
  const apiKey = key ?? await loadKey();
  const index = libraryIndex(await fs.readFile(library, 'utf8').catch(() => ''));
  let found = [];
  const quiet = new Map();
  for (const [i, search] of searches.entries()) {
    if (i && pause) await new Promise(resolve => setTimeout(resolve, pause));
    const hits = await call(fetchImpl, 'search', search.params, apiKey);
    const ids = (hits.items ?? []).map(item => item.id?.videoId).filter(Boolean);
    const details = ids.length ? await call(fetchImpl, 'videos', { part: 'snippet,contentDetails,statistics', id: ids.join(',') }, apiKey) : { items: [] };
    const own = extractCandidates(details.items, capturedAt, search, index);
    if (!own.length) quiet.set(search.group, [...(quiet.get(search.group) ?? []), search.label]);
    found = found.concat(own);
  }
  const inbox = await readJson(inboxFile, { candidates: [] });
  const merged = mergeCandidates(Array.isArray(inbox.candidates) ? inbox.candidates : [], found);
  await writeJson(inboxFile, { updatedAt: capturedAt, source: 'YouTube Data API v3 search', reviewPolicy, candidates: merged.candidates });
  log(`YouTube discovery: ${merged.found} videos, ${merged.added} new, from ${searches.length} searches; ${inboxFile}`);
  for (const group of new Set(searches.map(search => search.group))) {
    const tally = merged.groups.get(group) ?? { found: 0, added: 0 }, misses = quiet.get(group) ?? [];
    log(`  ${group}: ${tally.found} videos, ${tally.added} new; ${misses.length}/${searches.filter(s => s.group === group).length} searches gave nothing (${misses.join('; ') || 'none'})`);
  }
  return merged;
}

const usage = `Usage:
  node website/scripts/youtube-discovery.mjs [--groups a,b|all] [--days n]   search and update the inbox
  node website/scripts/youtube-discovery.mjs --plan [--groups a,b|all]       list the searches, no network
  node website/scripts/youtube-discovery.mjs --save-key < key.txt            store an API key outside the repo`;

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), value = flag => args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined;
  try {
    if (args.includes('--help')) console.log(usage);
    else if (args.includes('--save-key')) {
      let input = '';
      for await (const chunk of process.stdin) input += chunk;
      await saveKey(input);
      console.log(`Saved to ${keyPath} (readable only by you).`);
    } else if (args.includes('--plan')) {
      const config = await readConfig();
      console.log(`Groups: ${config.groups.map(group => `${group.id}${group.weekly ? ' (weekly)' : ''}`).join(', ')}`);
      for (const search of planSearches(config, { groups: value('--groups'), days: value('--days') })) console.log(`${search.group}\t${search.label}\t≥${search.minViews} views, ≤${search.maxSeconds}s, since ${search.params.publishedAfter.slice(0, 10)}`);
    } else await run({ groups: value('--groups'), days: value('--days') });
  } catch (error) { console.error(error.message); process.exit(1); }
}
