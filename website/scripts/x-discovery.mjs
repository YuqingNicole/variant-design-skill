#!/usr/bin/env node
// Weekly discovery runs inside Ego Lite's Node runtime. It stores only links and public post metadata;
// a person still watches each post and writes the bilingual research notes before publication.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const inboxPath = path.resolve(here, '../content/x-post-inbox.json');

export function parseCount(value) {
  const match = String(value ?? '').match(/([\d,.]+)\s*([KMB])?/i);
  if (!match) return 0;
  const amount = Number(match[1].replace(/,/g, ''));
  return Math.round(amount * ({ k: 1e3, m: 1e6, b: 1e9 }[match[2]?.toLowerCase()] ?? 1));
}

export function makeSearchUrl(date) {
  const query = `(design OR UI OR interaction OR motion) filter:videos min_faves:100 since:${date}`;
  return `https://x.com/search?q=${encodeURIComponent(query)}&src=typed_query&f=top`;
}

// Design engineers whose posts the weekly run checks one by one, besides the keyword search. `minLikes` is per account
// because a small account's best post would never reach the keyword search's 100. A person still reviews every candidate.
export const watchedAccounts = [
  { handle: 'raunofreiberg', minLikes: 300 },
  { handle: 'jakubkrehel', minLikes: 100 },
  { handle: 'jh3yy', minLikes: 300 },
  { handle: 'mattgperry', minLikes: 100 },
  { handle: 'lochieaxon', minLikes: 50 },
  { handle: 'ibelick', minLikes: 50 },
  { handle: 'steveruizok', minLikes: 200 },
];

export function makeAccountSearchUrl(handle, date, minLikes) {
  const query = `from:${handle} -filter:replies filter:videos min_faves:${minLikes} since:${date}`;
  return `https://x.com/search?q=${encodeURIComponent(query)}&src=typed_query&f=top`;
}

// `options.handle` keeps only that account's own posts (an account search can show others' reposts) and marks them as watched.
export function extractCandidates(rows, capturedAt, query, { minLikes = 100, handle: only } = {}) {
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
      capturedAt, query, status: 'pending', ...(only ? { watched: true } : {}),
    });
  }
  return [...byId.values()];
}

async function readInbox() {
  try {
    const parsed = JSON.parse(await fs.readFile(inboxPath, 'utf8'));
    return Array.isArray(parsed.candidates) ? parsed : { candidates: [] };
  } catch (error) {
    if (error.code === 'ENOENT') return { candidates: [] };
    throw error;
  }
}

async function readRows(page, url) {
  await page.goto(url);
  await page.waitForSelector('article', { timeout: 20000 });
  return page.evaluate(() => [...document.querySelectorAll('article')].map(article => {
    const status = [...article.querySelectorAll('a[href*="/status/"]')]
      .map(a => a.href.split(/[?#]/)[0]).find(href => /\/status\/\d+$/.test(href));
    const group = article.querySelector('[role="group"]');
    const author = article.querySelector('[data-testid="User-Name"]')?.innerText ?? '';
    const publishedAt = article.querySelector('time')?.getAttribute('datetime') ?? '';
    return status ? { url: status, metrics: group?.getAttribute('aria-label') ?? '', author, publishedAt } : null;
  }).filter(Boolean));
}

export async function run() {
  const now = new Date();
  const capturedAt = now.toISOString();
  const since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const task = await taskSpace(`X design discovery ${capturedAt.replace(/[:.]/g, '-')}`);
  const page = task.page('p1');

  // The keyword search must read posts, or the run stops and the inbox is left unchanged, as before.
  const url = makeSearchUrl(since);
  const query = new URL(url).searchParams.get('q');
  const rows = await readRows(page, url);
  if (!rows.length) throw new Error('X returned no readable posts; the inbox was left unchanged.');
  let found = extractCandidates(rows, capturedAt, query);

  // An account with nothing in the week and one X would not show look the same on the page, so a miss is counted, not treated as an error.
  const quiet = [];
  for (const { handle, minLikes } of watchedAccounts) {
    await new Promise(resolve => setTimeout(resolve, 3000));
    const accountUrl = makeAccountSearchUrl(handle, since, minLikes);
    try {
      const accountRows = await readRows(page, accountUrl);
      const own = extractCandidates(accountRows, capturedAt, new URL(accountUrl).searchParams.get('q'), { minLikes, handle });
      if (!own.length) quiet.push(handle);
      found = found.concat(own);
    } catch { quiet.push(handle); }
  }

  const inbox = await readInbox();
  const byId = new Map(inbox.candidates.map(item => [item.id, item]));
  let added = 0;
  for (const candidate of found) {
    if (byId.has(candidate.id)) continue;
    byId.set(candidate.id, candidate);
    added++;
  }
  const output = {
    updatedAt: capturedAt,
    source: 'Ego Lite on X search',
    reviewPolicy: 'Candidates are not published until a person watches the original post and writes bilingual research notes.',
    candidates: [...byId.values()].sort((a, b) => b.capturedAt.localeCompare(a.capturedAt) || a.id.localeCompare(b.id)),
  };
  const temporary = `${inboxPath}.tmp`;
  await fs.writeFile(temporary, `${JSON.stringify(output, null, 2)}\n`);
  await fs.rename(temporary, inboxPath);
  await task.finish({ keep: [] });
  console.log(`X design discovery: ${found.length} qualifying posts, ${added} new; ${quiet.length}/${watchedAccounts.length} watched accounts gave nothing this week (${quiet.join(', ') || 'none'}); ${inboxPath}`);
}
