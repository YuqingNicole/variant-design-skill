#!/usr/bin/env node
// Weekly Threads discovery through Meta's official Threads API (keyword search), not by reading threads.com pages.
// It stores only links and public post text; a person still opens each post and the site it points to before anything
// goes into the library, and media from a post is never copied without the author's permission (RFC-008).
// Until Meta approves the app's `threads_keyword_search` permission, search only returns the token owner's own posts.
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const inboxPath = path.resolve(here, '../content/threads-post-inbox.json');
const configPath = path.resolve(here, '../content/threads-discovery.json');
const libraryPath = path.resolve(here, '../src/inspiration-data.ts');
// The token lives outside the repository. THREADS_ACCESS_TOKEN overrides the file (and is then never refreshed).
export const tokenPath = process.env.THREADS_TOKEN_FILE || path.join(os.homedir(), '.config/variant-design/threads.json');
const api = 'https://graph.threads.com/v1.0';
const fields = 'id,text,media_type,permalink,timestamp,username,is_reply,is_quote_post,link_attachment_url';
const reviewPolicy = 'Candidates are not published until a person opens the post and the site it points to and writes bilingual research notes. Media from a post needs the author\'s permission.';

// Search groups live in `website/content/threads-discovery.json`: a group has an id, a window in `days` and `queries`
// ({ q, mode?: KEYWORD|TAG, mediaType?: TEXT|IMAGE|VIDEO, author? }). Groups marked `weekly` run on the schedule.
// The API returns no like counts, so every query asks for Threads' TOP results instead of filtering by likes.
const idPattern = /^[a-z0-9][a-z0-9-]*$/, userPattern = /^[A-Za-z0-9._]{1,30}$/;
const wholeNumber = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;

export function validateConfig(config) {
  const fail = message => { throw new Error(`threads-discovery.json: ${message}`); };
  if (!Array.isArray(config?.groups) || !config.groups.length) fail('"groups" must be a non-empty list');
  const ids = new Set();
  for (const group of config.groups) {
    const id = group?.id;
    if (typeof id !== 'string' || !idPattern.test(id) || id === 'all') fail(`group id ${JSON.stringify(id)} must be lowercase letters, digits or hyphens, and not "all"`);
    if (ids.has(id)) fail(`group "${id}" is listed twice`);
    ids.add(id);
    if (!wholeNumber(group.days, 1, 90)) fail(`group "${id}" needs "days" from 1 to 90`);
    if (group.weekly !== undefined && typeof group.weekly !== 'boolean') fail(`group "${id}": "weekly" must be true or false`);
    if (!Array.isArray(group.queries) || !group.queries.length) fail(`group "${id}" needs at least one query`);
    for (const query of group.queries) {
      if (typeof query?.q !== 'string' || !query.q.trim()) fail(`group "${id}" has a query without "q"`);
      if (query.mode !== undefined && !['KEYWORD', 'TAG'].includes(query.mode)) fail(`group "${id}": "mode" must be KEYWORD or TAG (${query.q})`);
      if (query.mediaType !== undefined && !['TEXT', 'IMAGE', 'VIDEO'].includes(query.mediaType)) fail(`group "${id}": "mediaType" must be TEXT, IMAGE or VIDEO (${query.q})`);
      if (query.author !== undefined && !userPattern.test(query.author)) fail(`group "${id}": "author" must be a Threads username without @ (${query.q})`);
    }
  }
  if (!config.groups.some(group => group.weekly)) fail('at least one group must be marked "weekly"');
  return config;
}

export async function readConfig(file = configPath) {
  return validateConfig(JSON.parse(await fs.readFile(file, 'utf8')));
}

// Nothing named means the weekly groups, "all" means every group, otherwise the named ids in config order.
export function selectGroups(config, names) {
  const wanted = String(names ?? '').split(',').map(name => name.trim()).filter(Boolean);
  if (!wanted.length) return config.groups.filter(group => group.weekly);
  if (wanted.includes('all')) return config.groups;
  const unknown = wanted.filter(name => !config.groups.some(group => group.id === name));
  if (unknown.length) throw new Error(`Unknown discovery group: ${unknown.join(', ')}. Known groups: ${config.groups.map(group => group.id).join(', ')}, or "all".`);
  return config.groups.filter(group => wanted.includes(group.id));
}

// The searches of one run as API parameters (without the token). The same search reached through two groups runs once.
export function planSearches(config, { groups, days, now = new Date() } = {}) {
  const override = days === undefined || days === '' ? undefined : Number(days);
  if (override !== undefined && !wholeNumber(override, 1, 90)) throw new Error(`--days must be a whole number from 1 to 90, got ${JSON.stringify(days)}.`);
  const searches = [], seen = new Set();
  for (const group of selectGroups(config, groups)) {
    const since = new Date(now.getTime() - (override ?? group.days) * 864e5).toISOString().slice(0, 10);
    for (const { q, mode, mediaType, author } of group.queries) {
      const params = { q: q.trim(), search_type: 'TOP', search_mode: mode ?? 'KEYWORD', since, limit: '50', fields,
        ...(mediaType ? { media_type: mediaType } : {}), ...(author ? { author_username: author } : {}) };
      const key = JSON.stringify(params);
      if (seen.has(key)) continue;
      seen.add(key);
      searches.push({ group: group.id, label: `${mode === 'TAG' ? '#' : ''}${q.trim()}${mediaType ? ` (${mediaType})` : ''}${author ? ` @${author}` : ''}`, params });
    }
  }
  return searches;
}

const normalize = url => { try { const u = new URL(url); return `${u.hostname.replace(/^www\./, '')}${u.pathname.replace(/\/+$/, '')}`.toLowerCase(); } catch { return null; } };

// Site URL → library entry id, so a candidate that points at a site the library already has says so.
export function libraryIndex(source) {
  const index = new Map();
  for (const [, id, url] of source.matchAll(/"id": "([^"]+)",[\s\S]*?"url": "([^"]+)"/g)) {
    const key = normalize(url);
    if (key && !index.has(key)) index.set(key, id);
  }
  return index;
}

// Replies and reposts are dropped; quotes stay because people often quote a site launch with their own comment.
export function extractCandidates(posts, capturedAt, search, library = new Map()) {
  const out = [];
  for (const post of posts ?? []) {
    if (!post?.id || !post.permalink || post.is_reply || post.media_type === 'REPOST_FACADE') continue;
    const link = post.link_attachment_url || null, entry = link && library.get(normalize(link));
    out.push({
      id: String(post.id), url: post.permalink, username: post.username ?? null,
      text: String(post.text ?? '').trim().slice(0, 280), mediaType: post.media_type ?? null,
      publishedAt: post.timestamp ?? null, link, ...(entry ? { inLibrary: entry } : {}),
      capturedAt, query: search.label, group: search.group, status: 'pending',
    });
  }
  return out;
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
  const candidates = [...byId.values()].sort((a, b) => b.capturedAt.localeCompare(a.capturedAt) || a.id.localeCompare(b.id));
  return { candidates, groups, found: fresh.size, added: [...groups.values()].reduce((sum, t) => sum + t.added, 0) };
}

async function readJson(file, fallback) {
  try { return JSON.parse(await fs.readFile(file, 'utf8')); } catch (error) { if (error.code === 'ENOENT') return fallback; throw error; }
}

async function writeJson(file, value, mode) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.tmp`;
  await fs.writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, mode ? { mode } : undefined);
  await fs.rename(temporary, file);
}

async function call(fetchImpl, endpoint, params) {
  const response = await fetchImpl(`${api}/${endpoint}?${new URLSearchParams(params)}`);
  const body = await response.json().catch(() => ({}));
  // Error messages from the API never include the token, so they are safe to print.
  if (!response.ok || body.error) throw new Error(`Threads API ${endpoint}: ${response.status} ${body.error?.message ?? 'no error message'}`);
  return body;
}

// A long-lived token lasts 60 days and can be refreshed once it is a day old; refreshing weekly keeps it alive
// as long as the weekly run keeps running. An expired token cannot be refreshed: make a new one (docs/threads-discovery.md).
export async function loadToken({ file = tokenPath, env = process.env, fetchImpl = fetch, now = new Date() } = {}) {
  if (env.THREADS_ACCESS_TOKEN) return env.THREADS_ACCESS_TOKEN;
  const saved = await readJson(file, null);
  if (!saved?.accessToken) throw new Error(`No Threads token. Save one with: node website/scripts/threads-discovery.mjs --save-token (it reads the token from standard input and writes ${file}).`);
  const age = now - new Date(saved.refreshedAt ?? 0);
  if (age > 6 * 864e5) {
    const body = await call(fetchImpl, 'refresh_access_token', { grant_type: 'th_refresh_token', access_token: saved.accessToken });
    await writeJson(file, { accessToken: body.access_token, refreshedAt: now.toISOString(), expiresIn: body.expires_in }, 0o600);
    return body.access_token;
  }
  return saved.accessToken;
}

export async function saveToken(token, { file = tokenPath, now = new Date() } = {}) {
  const value = String(token ?? '').trim();
  if (!/^[A-Za-z0-9_|-]{20,}$/.test(value)) throw new Error('That does not look like a Threads access token.');
  await writeJson(file, { accessToken: value, refreshedAt: now.toISOString() }, 0o600);
}

// Any API error stops the run and leaves the inbox unchanged; an empty result is normal (and, before Meta approves
// keyword search, every query that matches none of the token owner's own posts is empty).
export async function run({ groups, days, config = configPath, inbox: inboxFile = inboxPath, library = libraryPath, fetchImpl = fetch, token, pause = 1000, log = console.log } = {}) {
  const now = new Date(), capturedAt = now.toISOString();
  const searches = planSearches(await readConfig(config), { groups, days, now });
  const accessToken = token ?? await loadToken({ fetchImpl, now });
  const index = libraryIndex(await fs.readFile(library, 'utf8').catch(() => ''));
  let found = [];
  const quiet = new Map();
  for (const [i, search] of searches.entries()) {
    if (i && pause) await new Promise(resolve => setTimeout(resolve, pause));
    const body = await call(fetchImpl, 'keyword_search', { ...search.params, access_token: accessToken });
    const own = extractCandidates(body.data, capturedAt, search, index);
    if (!own.length) quiet.set(search.group, [...(quiet.get(search.group) ?? []), search.label]);
    found = found.concat(own);
  }
  const inbox = await readJson(inboxFile, { candidates: [] });
  const merged = mergeCandidates(Array.isArray(inbox.candidates) ? inbox.candidates : [], found);
  await writeJson(inboxFile, { updatedAt: capturedAt, source: 'Threads API keyword search', reviewPolicy, candidates: merged.candidates });
  log(`Threads discovery: ${merged.found} posts, ${merged.added} new, from ${searches.length} searches; ${inboxFile}`);
  for (const group of new Set(searches.map(search => search.group))) {
    const tally = merged.groups.get(group) ?? { found: 0, added: 0 }, misses = quiet.get(group) ?? [];
    log(`  ${group}: ${tally.found} posts, ${tally.added} new; ${misses.length}/${searches.filter(s => s.group === group).length} searches gave nothing (${misses.join('; ') || 'none'})`);
  }
  return merged;
}

const usage = `Usage:
  node website/scripts/threads-discovery.mjs [--groups a,b|all] [--days n]   search and update the inbox
  node website/scripts/threads-discovery.mjs --plan [--groups a,b|all]       list the searches, no network
  node website/scripts/threads-discovery.mjs --save-token < token.txt        store a long-lived token outside the repo`;

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), value = flag => args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined;
  try {
    if (args.includes('--help')) console.log(usage);
    else if (args.includes('--save-token')) {
      let input = '';
      for await (const chunk of process.stdin) input += chunk;
      await saveToken(input);
      console.log(`Saved to ${tokenPath} (readable only by you).`);
    } else if (args.includes('--plan')) {
      const config = await readConfig();
      console.log(`Groups: ${config.groups.map(group => `${group.id}${group.weekly ? ' (weekly)' : ''}`).join(', ')}`);
      for (const search of planSearches(config, { groups: value('--groups'), days: value('--days') })) console.log(`${search.group}\t${search.label}\tsince ${search.params.since}`);
    } else await run({ groups: value('--groups'), days: value('--days') });
  } catch (error) { console.error(error.message); process.exit(1); }
}
