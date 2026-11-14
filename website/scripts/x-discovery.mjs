#!/usr/bin/env node
// Weekly discovery runs inside Ego Lite's Node runtime. It stores only links and public post metadata;
// a person still watches each post and writes the bilingual research notes before publication.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const inboxPath = path.resolve(here, '../content/x-post-inbox.json');
const configPath = path.resolve(here, '../content/x-discovery.json');

export function parseCount(value) {
  const match = String(value ?? '').match(/([\d,.]+)\s*([KMB])?/i);
  if (!match) return 0;
  const amount = Number(match[1].replace(/,/g, ''));
  return Math.round(amount * ({ k: 1e3, m: 1e6, b: 1e9 }[match[2]?.toLowerCase()] ?? 1));
}

// Search groups live in `website/content/x-discovery.json`. A group has an id, keyword `queries` ({ terms, minLikes,
// required? }) and `accounts` ({ handle, minLikes }), a window in `days` and, optionally, how many extra `screens` to
// scroll. Groups marked `weekly` run on the schedule; the others run only when named. `minLikes` is per search because
// a small account's best post would never reach a keyword search's floor. A person still reviews every candidate.
const idPattern = /^[a-z0-9][a-z0-9-]*$/, handlePattern = /^[A-Za-z0-9_]{1,15}$/;
const wholeNumber = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;

export function validateConfig(config) {
  const fail = message => { throw new Error(`x-discovery.json: ${message}`); };
  if (!Array.isArray(config?.groups) || !config.groups.length) fail('"groups" must be a non-empty list');
  const ids = new Set();
  for (const group of config.groups) {
    const id = group?.id;
    if (typeof id !== 'string' || !idPattern.test(id) || id === 'all') fail(`group id ${JSON.stringify(id)} must be lowercase letters, digits or hyphens, and not "all"`);
    if (ids.has(id)) fail(`group "${id}" is listed twice`);
    ids.add(id);
    if (!wholeNumber(group.days, 1, 90)) fail(`group "${id}" needs "days" from 1 to 90`);
    if (group.screens !== undefined && !wholeNumber(group.screens, 0, 5)) fail(`group "${id}": "screens" must be from 0 to 5`);
    if (group.weekly !== undefined && typeof group.weekly !== 'boolean') fail(`group "${id}": "weekly" must be true or false`);
    const queries = group.queries ?? [], accounts = group.accounts ?? [];
    if (!Array.isArray(queries) || !Array.isArray(accounts) || !(queries.length + accounts.length)) fail(`group "${id}" needs at least one query or account`);
    for (const query of queries) {
      if (typeof query?.terms !== 'string' || !query.terms.trim()) fail(`group "${id}" has a query without "terms"`);
      // The script adds these itself; a second copy in the terms would silently fight the configured values.
      if (/\b(filter:videos|min_faves:|since:|until:)/i.test(query.terms)) fail(`group "${id}": leave filter:videos, min_faves:, since: and until: out of "terms" (${query.terms})`);
      if (!wholeNumber(query.minLikes, 1, 1e7)) fail(`group "${id}": "minLikes" must be a positive whole number (${query.terms})`);
      if (query.required !== undefined && typeof query.required !== 'boolean') fail(`group "${id}": "required" must be true or false (${query.terms})`);
    }
    const handles = new Set();
    for (const account of accounts) {
      if (typeof account?.handle !== 'string' || !handlePattern.test(account.handle)) fail(`group "${id}" has an invalid handle ${JSON.stringify(account?.handle)}`);
      if (handles.has(account.handle.toLowerCase())) fail(`group "${id}" lists @${account.handle} twice`);
      handles.add(account.handle.toLowerCase());
      if (!wholeNumber(account.minLikes, 1, 1e7)) fail(`group "${id}": @${account.handle} needs a positive whole "minLikes"`);
    }
  }
  if (!config.groups.some(group => group.weekly)) fail('at least one group must be marked "weekly"');
  return config;
}

export async function readConfig(file = configPath) {
  return validateConfig(JSON.parse(await fs.readFile(file, 'utf8')));
}

const searchUrl = query => `https://x.com/search?q=${encodeURIComponent(query)}&src=typed_query&f=top`;

export function makeSearchUrl(terms, date, minLikes) {
  return searchUrl(`${terms} filter:videos min_faves:${minLikes} since:${date}`);
}

export function makeAccountSearchUrl(handle, date, minLikes) {
  return searchUrl(`from:${handle} -filter:replies filter:videos min_faves:${minLikes} since:${date}`);
}

// Which groups a run covers: nothing named means the weekly ones, "all" means every group, otherwise the named ids in config order.
export function selectGroups(config, names) {
  const wanted = (Array.isArray(names) ? names : String(names ?? '').split(',')).map(name => name.trim()).filter(Boolean);
  if (!wanted.length) return config.groups.filter(group => group.weekly);
  if (wanted.includes('all')) return config.groups;
  const unknown = wanted.filter(name => !config.groups.some(group => group.id === name));
  if (unknown.length) throw new Error(`Unknown discovery group: ${unknown.join(', ')}. Known groups: ${config.groups.map(group => group.id).join(', ')}, or "all".`);
  return config.groups.filter(group => wanted.includes(group.id));
}

// The searches of one run, in order: each selected group's keyword queries, then its accounts. `days` overrides every
// group's own window. The same search reached through two groups runs once, under the first.
export function planSearches(config, { groups, days, now = new Date() } = {}) {
  const override = days === undefined || days === '' ? undefined : Number(days);
  if (override !== undefined && !wholeNumber(override, 1, 90)) throw new Error(`--days must be a whole number from 1 to 90, got ${JSON.stringify(days)}.`);
  const searches = [], seen = new Set();
  for (const group of selectGroups(config, groups)) {
    const since = new Date(now.getTime() - (override ?? group.days) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const add = search => {
      if (seen.has(search.url)) return;
      seen.add(search.url);
      searches.push({ group: group.id, screens: group.screens ?? 0, query: new URL(search.url).searchParams.get('q'), ...search });
    };
    for (const { terms, minLikes, required } of group.queries ?? []) add({ kind: 'query', label: terms, url: makeSearchUrl(terms.trim(), since, minLikes), minLikes, required: Boolean(required) });
    for (const { handle, minLikes } of group.accounts ?? []) add({ kind: 'account', label: `@${handle}`, handle, url: makeAccountSearchUrl(handle, since, minLikes), minLikes, required: false });
  }
  return searches;
}

// `options.handle` keeps only that account's own posts (an account search can show others' reposts) and marks them as watched.
// `options.group` records which configured group found the post.
export function extractCandidates(rows, capturedAt, query, { minLikes = 100, handle: only, group } = {}) {
  const byId = new Map();
  for (const row of rows) {
    const match = /^https:\/\/x\.com\/([A-Za-z0-9_]{1,15})\/status\/(\d{5,25})/.exec(row.url ?? '');
    const likes = parseCount(row.metrics?.match(/([\d,.]+\s*[KMB]?)\s*likes?/i)?.[1]);
    if (!match || likes < minLikes) continue;
    const [, handle, id] = match;
    if (only && handle.toLowerCase() !== only.toLowerCase()) continue;
    byId.set(id, {
      id, url: `https://x.com/${handle}/status/${id}`, handle,
      author: String(row.author ?? '').trim(), publishedAt: row.publishedAt || null,
      likes, views: parseCount(row.metrics?.match(/([\d,.]+\s*[KMB]?)\s*views?/i)?.[1]),
      capturedAt, query, status: 'pending', ...(only ? { watched: true } : {}), ...(group ? { group } : {}),
    });
  }
  return [...byId.values()];
}

async function readInbox(file) {
  try {
    const parsed = JSON.parse(await fs.readFile(file, 'utf8'));
    return Array.isArray(parsed.candidates) ? parsed : { candidates: [] };
  } catch (error) {
    if (error.code === 'ENOENT') return { candidates: [] };
    throw error;
  }
}

async function readRows(page, url, screens = 0) {
  await page.goto(url);
  await page.waitForSelector('article', { timeout: 20000 });
  for (let i = 0; i < screens; i++) {
    await page.evaluate(() => window.scrollBy(0, window.innerHeight * 2));
    await new Promise(resolve => setTimeout(resolve, 1800));
  }
  return page.evaluate(() => [...document.querySelectorAll('article')].map(article => {
    const status = [...article.querySelectorAll('a[href*="/status/"]')]
      .map(a => a.href.split(/[?#]/)[0]).find(href => /\/status\/\d+$/.test(href));
    const group = article.querySelector('[role="group"]');
    const author = article.querySelector('[data-testid="User-Name"]')?.innerText ?? '';
    const publishedAt = article.querySelector('time')?.getAttribute('datetime') ?? '';
    return status ? { url: status, metrics: group?.getAttribute('aria-label') ?? '', author, publishedAt } : null;
  }).filter(Boolean));
}

// Adds what a run found to the inbox without touching candidates already there (they may be reviewed), and counts per group.
export function mergeCandidates(existing, found) {
  const byId = new Map(existing.map(item => [item.id, item]));
  const fresh = new Set(), groups = new Map();
  const count = group => groups.get(group) ?? groups.set(group, { qualifying: 0, added: 0 }).get(group);
  for (const candidate of found) {
    if (fresh.has(candidate.id)) continue;
    const known = byId.has(candidate.id);
    if (!known) byId.set(candidate.id, candidate);
    fresh.add(candidate.id);
    const tally = count(candidate.group ?? 'ungrouped');
    tally.qualifying++;
    if (!known) tally.added++;
  }
  const candidates = [...byId.values()].sort((a, b) => b.capturedAt.localeCompare(a.capturedAt) || a.id.localeCompare(b.id));
  return { candidates, groups, qualifying: fresh.size, added: [...groups.values()].reduce((sum, tally) => sum + tally.added, 0) };
}

const noPosts = 'X returned no readable posts; the inbox was left unchanged. Open x.com in Ego Lite first and check that it is still logged in.';

// `groups` is a comma-separated list of group ids or "all"; empty means the groups marked weekly. `days` overrides each group's window.
// `config`, `inbox` and `pause` (milliseconds between searches) are there for the tests.
export async function run({ groups, days, config = configPath, inbox: inboxFile = inboxPath, pause = 3000 } = {}) {
  const now = new Date();
  const capturedAt = now.toISOString();
  const searches = planSearches(await readConfig(config), { groups, days, now });
  const task = await taskSpace(`X design discovery ${capturedAt.replace(/[:.]/g, '-')}`);
  const page = task.page('p1');

  // A search marked `required` must read posts, or the run stops and the inbox is left unchanged. For any other search,
  // nothing in the window and a page X would not show look the same, so a miss is counted, not treated as an error.
  const quiet = new Map();
  let found = [], read = 0;
  for (const [index, search] of searches.entries()) {
    if (index) await new Promise(resolve => setTimeout(resolve, pause));
    let rows = [];
    try { rows = await readRows(page, search.url, search.screens); } catch (error) { if (search.required) throw new Error(`${noPosts} (${error.message})`); }
    if (search.required && !rows.length) throw new Error(noPosts);
    read += rows.length;
    const own = extractCandidates(rows, capturedAt, search.query, { minLikes: search.minLikes, handle: search.handle, group: search.group });
    if (!own.length) quiet.set(search.group, [...(quiet.get(search.group) ?? []), search.label]);
    found = found.concat(own);
  }
  if (!read) throw new Error(noPosts);

  const inbox = await readInbox(inboxFile);
  const merged = mergeCandidates(inbox.candidates, found);
  const output = {
    updatedAt: capturedAt,
    source: 'Ego Lite on X search',
    reviewPolicy: 'Candidates are not published until a person watches the original post and writes bilingual research notes.',
    candidates: merged.candidates,
  };
  const temporary = `${inboxFile}.tmp`;
  await fs.writeFile(temporary, `${JSON.stringify(output, null, 2)}\n`);
  await fs.rename(temporary, inboxFile);
  await task.finish({ keep: [] });
  console.log(`X design discovery: ${merged.qualifying} qualifying posts, ${merged.added} new, from ${searches.length} searches; ${inboxFile}`);
  for (const group of new Set(searches.map(search => search.group))) {
    const tally = merged.groups.get(group) ?? { qualifying: 0, added: 0 }, misses = quiet.get(group) ?? [];
    const total = searches.filter(search => search.group === group).length;
    console.log(`  ${group}: ${tally.qualifying} qualifying, ${tally.added} new; ${misses.length}/${total} searches gave nothing (${misses.join('; ') || 'none'})`);
  }
}

// `node website/scripts/x-discovery.mjs --plan [--groups a,b|all] [--days n]` lists the searches a run would make, without a browser.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), value = flag => args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined;
  if (!args.includes('--plan')) {
    console.error('Usage: node website/scripts/x-discovery.mjs --plan [--groups a,b|all] [--days n]\nA real run needs Ego Lite: website/scripts/run-x-discovery.sh [--groups a,b|all] [--days n]');
    process.exit(2);
  }
  try {
    const config = await readConfig();
    console.log(`Groups: ${config.groups.map(group => `${group.id}${group.weekly ? ' (weekly)' : ''}`).join(', ')}`);
    for (const search of planSearches(config, { groups: value('--groups'), days: value('--days') })) console.log(`${search.group}\t${search.query}`);
  } catch (error) { console.error(error.message); process.exit(1); }
}
