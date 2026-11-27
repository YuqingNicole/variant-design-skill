#!/usr/bin/env node
// Weekly discovery runs inside Ego Lite's Node runtime. It stores only links and public post metadata;
// x-publish.mjs screens each candidate and writes the bilingual notes; the weekly pull request merges once CI passes.
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
// a small account's best post would never reach a keyword search's floor. The top-level `exclude` is appended to every
// keyword query, and `skipHandles` ({ handle, reason }) lists accounts that only ever brought reposts or promotion.
const idPattern = /^[a-z0-9][a-z0-9-]*$/, handlePattern = /^[A-Za-z0-9_]{1,15}$/;
const wholeNumber = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
const addedByScript = /\b(filter:videos|min_faves:|since:|until:)/i;

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
      if (addedByScript.test(query.terms)) fail(`group "${id}": leave filter:videos, min_faves:, since: and until: out of "terms" (${query.terms})`);
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
  if (config.exclude !== undefined && (typeof config.exclude !== 'string' || addedByScript.test(config.exclude))) fail('"exclude" must be text without filter:videos, min_faves:, since: or until:');
  const skipped = new Set();
  for (const entry of config.skipHandles ?? []) {
    if (typeof entry?.handle !== 'string' || !handlePattern.test(entry.handle)) fail(`skipHandles has an invalid handle ${JSON.stringify(entry?.handle)}`);
    if (typeof entry.reason !== 'string' || !entry.reason.trim()) fail(`skipHandles: @${entry.handle} needs a "reason"`);
    if (skipped.has(entry.handle.toLowerCase())) fail(`skipHandles lists @${entry.handle} twice`);
    skipped.add(entry.handle.toLowerCase());
  }
  return config;
}

export async function readConfig(file = configPath) {
  return validateConfig(JSON.parse(await fs.readFile(file, 'utf8')));
}

const maxQuery = 500;
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
      const query = new URL(search.url).searchParams.get('q');
      // X's web search shows no results at all for a longer query (a 516-character one failed, 483 worked; 2026-11-23).
      if (query.length > maxQuery) throw new Error(`group "${group.id}": the search for ${search.label} is ${query.length} characters with the exclusions and filters; X shows nothing past ${maxQuery}. Shorten the terms or "exclude".`);
      searches.push({ group: group.id, screens: group.screens ?? 0, query, ...search });
    };
    const exclude = config.exclude?.trim();
    for (const { terms, minLikes, required } of group.queries ?? []) add({ kind: 'query', label: terms, url: makeSearchUrl(exclude ? `${terms.trim()} ${exclude}` : terms.trim(), since, minLikes), minLikes, required: Boolean(required) });
    for (const { handle, minLikes } of group.accounts ?? []) add({ kind: 'account', label: `@${handle}`, handle, url: makeAccountSearchUrl(handle, since, minLikes), minLikes, required: false });
  }
  return searches;
}

// Cheap checks before a candidate costs a model screening. Each pattern is a kind of post x-publish.mjs rejected again and
// again (inbox, 2026-11-16 to 11-22): repo and tool lists, reposts of someone else's video, growth and income posts,
// promotion, and showcases of an AI model. A quote post is skipped too: its video is usually the quoted account's.
// Fan work and shots made for someone else's video are out too (owner, 2026-11-26). Only explicit markers are matched, since a bare franchise name
// can sit in an original post ("my OC in a FNAF style"); the screening prompt catches the rest from the frames. After the 2026-11-27 run screened six
// posts and kept none, the markers grew to what those posts and their accounts actually carried: fan tags inside hashtags (#deadlockfanart), fandom
// hashtags (only as hashtags, from rejected posts), "AU", someone else's rig or model, and game-asset or commission sales (#robloxugc, ko-fi shop links).
const fandomTags = 'fnaf|hazbinhotel|helluvaboss|alastor|deltarune|undertale|dandysworld|wemmbu|unstableuniverse|dreamsmp|smg4|mrpuzzles|tlok|looneytunes|wileroad|monsterhunter|deadlock';
export const SKIP_TEXT = [
  ['resource list', /\b\d+\s+(?:[\w-]+\s+){0,2}(?:repos?|repositories|tools|skills|prompts|resources|websites|plugins)\b|\bbookmark (?:this|these|it)\b|🧵/iu],
  ['repo or tool promotion', /\bgithub\b|\brepo\b|\bremotion\b|\bcomfyui\b|\bopen[- ]source\b/i],
  ['repost', /\bwho made this\b|\bcredits?\s*(?::|to\b|goes\b)|\bvia\s+@|\bnot mine\b|(?:^|\s)(?:source|🎥|📹)\s*:|\binstagram\s*(?:🎥|📸|story|post|update|live)/iu],
  ['income or growth claim', /\$\s?\d[\d,.]*\s*[km]?\s*(?:\/|per|a|in)\s*(?:month|mo|week|day)\b|\bpassive income\b|\bmake money\b|\bfollowers in \d+\s*(?:days|weeks)\b/i],
  ['promotion', /\blink in bio\b|\buse code\b|\bpre-?order\b|\bkickstarter\b|\bgiveaway\b|\bsponsored\b|#ad\b|\bwishlist\b/i],
  ['fan work', new RegExp(String.raw`\bfan[- ]?(?:art|animation|animatic|film|game|remake|made)s?\b|\bfanart\b|#\w*fan(?:art|made|anim|animation|animatic|work|fic)s?\b|#(?:${fandomTags})\b|\boc\s*x\s*canon\b|\bcanon\s*x\s*oc\b`, 'i')],
  // Case-sensitive: "my Undertale AU", "ACTOR AU", #UndertaleAU, but not "shipping to AU" or #artnouveau.
  ['fan work', /#\w*AU\b|(?<!\b(?:to|in|from|across)\s)\bAU\b(?![$\d])/],
  ["someone else's rig or model", /\b(?:rig|model|face animation)s?\s*(?:by|credits?)\b(?!\s*:?\s*(?:me|myself|hand)\b)/i],
  ['asset or commission sale', /#robloxugc\b|\bugc\b|\b(?:animation|asset|emote|model|vfx|sprite)\s+packs?\b|\bemotes?\s+(?:is|are)\s+(?:on sale|out)\b|\bon sale\b|\bavailable (?:now )?on (?:the )?(?:roblox|marketplace|gumroad|itch|booth|fab|ko-?fi|unity asset store|blender ?market|superhive)\b|\b(?:commissions?|comms)\s+(?:are\s+)?open\b|\bopen(?:ed)? for (?:commissions?|comms)\b|ko-?fi\.com\/s\/|gumroad\.com|itch\.io\b/i],
  ['made for someone else', /\b(?:shots?|scenes?|parts?|stuff|bits)\s+(?:i|we)\s+(?:animated|made|did)\s+for\s+(?:@?\w+'s\b|an?\s+client)|\bcommissioned by\b|\bcommission for @/i],
  ['AI model showcase', /\b(?:fable|opus|sonnet|claude|gpt|chatgpt|gemini|veo|sora|kling|midjourney|seedance|dreamina|higgsfield)(?:[\s-]+[a-z]+)?[\s-]*\d|\bearly access to @/i],
];

// Why a row from the results page is not worth screening, or null. `skipHandles` holds lowercased handles from the config.
export function skipReason(row, skipHandles = new Set()) {
  const handle = /^https:\/\/x\.com\/([A-Za-z0-9_]{1,15})\//.exec(row.url ?? '')?.[1]?.toLowerCase();
  if (handle && skipHandles.has(handle)) return 'skipped account';
  if (row.quote) return 'quote post';
  return SKIP_TEXT.find(([, pattern]) => pattern.test(row.text ?? ''))?.[0] ?? null;
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
    // The text is read for skipReason only and is not stored. A second author name inside the article is a quoted post.
    const text = article.querySelector('[data-testid="tweetText"]')?.innerText ?? '';
    const quote = article.querySelectorAll('[data-testid="User-Name"]').length > 1;
    return status ? { url: status, metrics: group?.getAttribute('aria-label') ?? '', author, publishedAt, text, quote } : null;
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
  const settings = await readConfig(config);
  const searches = planSearches(settings, { groups, days, now });
  const skipHandles = new Set((settings.skipHandles ?? []).map(entry => entry.handle.toLowerCase()));
  const skipped = new Map();
  const task = await taskSpace(`X creative video discovery ${capturedAt.replace(/[:.]/g, '-')}`);
  const page = task.page('p1');

  // A search marked `required` must read posts, or the run stops and the inbox is left unchanged. For any other search,
  // nothing in the window and a page X would not show look the same, so a miss is counted, not treated as an error.
  const quiet = new Map();
  let found = [], read = 0;
  for (const [index, search] of searches.entries()) {
    if (index) await new Promise(resolve => setTimeout(resolve, pause));
    // X sometimes leaves a results page empty partway through a run, and the same search reads fine a minute later
    // (2026-11-23: three of five searches timed out in one run and returned posts when tried again), so a timeout gets one retry.
    let rows = [];
    try { rows = await readRows(page, search.url, search.screens); } catch {
      await new Promise(resolve => setTimeout(resolve, pause * 5));
      try { rows = await readRows(page, search.url, search.screens); } catch (error) { if (search.required) throw new Error(`${noPosts} (${error.message})`); }
    }
    if (search.required && !rows.length) throw new Error(noPosts);
    read += rows.length;
    const kept = rows.filter(row => {
      const reason = skipReason(row, skipHandles);
      if (reason) skipped.set(reason, (skipped.get(reason) ?? new Set()).add(row.url));
      return !reason;
    });
    const own = extractCandidates(kept, capturedAt, search.query, { minLikes: search.minLikes, handle: search.handle, group: search.group });
    if (!own.length) quiet.set(search.group, [...(quiet.get(search.group) ?? []), search.label]);
    found = found.concat(own);
  }
  if (!read) throw new Error(noPosts);

  const inbox = await readInbox(inboxFile);
  const merged = mergeCandidates(inbox.candidates, found);
  const output = {
    updatedAt: capturedAt,
    source: 'Ego Lite on X search',
    reviewPolicy: 'Candidates reach the library only through x-publish.mjs, which reads video frames and writes bilingual notes into a pull request that merges itself once CI passes; nobody reviews entries one by one.',
    candidates: merged.candidates,
  };
  const temporary = `${inboxFile}.tmp`;
  await fs.writeFile(temporary, `${JSON.stringify(output, null, 2)}\n`);
  await fs.rename(temporary, inboxFile);
  await task.finish({ keep: [] });
  console.log(`X creative video discovery: ${merged.qualifying} qualifying posts, ${merged.added} new, from ${searches.length} searches; ${inboxFile}`);
  for (const group of new Set(searches.map(search => search.group))) {
    const tally = merged.groups.get(group) ?? { qualifying: 0, added: 0 }, misses = quiet.get(group) ?? [];
    const total = searches.filter(search => search.group === group).length;
    console.log(`  ${group}: ${tally.qualifying} qualifying, ${tally.added} new; ${misses.length}/${total} searches gave nothing (${misses.join('; ') || 'none'})`);
  }
  if (skipped.size) console.log(`  skipped before screening: ${[...skipped].map(([reason, urls]) => `${urls.size} ${reason}`).join(', ')}`);
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
