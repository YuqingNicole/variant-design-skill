import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { validateConfig, planSearches, selectGroups, extractCandidates, mergeCandidates, libraryIndex, loadToken, saveToken, readConfig, run } from './threads-discovery.mjs';

const config = { groups: [
  { id: 'weekly', weekly: true, days: 7, queries: [{ q: 'landing page' }, { q: 'webdesign', mode: 'TAG' }] },
  { id: 'video', days: 30, queries: [{ q: 'landing page' }, { q: 'ui animation', mediaType: 'VIDEO', author: 'someone.design' }] },
] };
const now = new Date('2026-11-17T01:00:00Z');

test('the shipped config is valid and has a weekly group', async () => {
  const shipped = await readConfig();
  assert.ok(selectGroups(shipped).length >= 1);
});

test('config validation names the problem', () => {
  assert.throws(() => validateConfig({ groups: [{ id: 'a', days: 7, queries: [{ q: 'x' }] }] }), /weekly/);
  assert.throws(() => validateConfig({ groups: [{ id: 'a', weekly: true, days: 7, queries: [{ q: 'x', mode: 'HASH' }] }] }), /KEYWORD or TAG/);
  assert.throws(() => validateConfig({ groups: [{ id: 'a', weekly: true, days: 7, queries: [{ q: 'x', author: '@me' }] }] }), /without @/);
  assert.throws(() => validateConfig({ groups: [{ id: 'all', weekly: true, days: 7, queries: [{ q: 'x' }] }] }), /not "all"/);
});

test('plans TOP searches with a since date, and runs a repeated search once', () => {
  const weekly = planSearches(config, { now });
  assert.deepEqual(weekly.map(s => s.label), ['landing page', '#webdesign']);
  assert.equal(weekly[0].params.since, '2026-11-10');
  assert.equal(weekly[0].params.search_type, 'TOP');
  assert.equal(weekly[1].params.search_mode, 'TAG');
  const all = planSearches(config, { groups: 'all', now });
  assert.equal(all.length, 4, 'the video group repeats "landing page" with another window, so it is a different search');
  assert.equal(planSearches(config, { groups: 'all', days: '7', now }).length, 3, 'with one window the repeat runs once');
  const video = planSearches(config, { groups: 'video', now })[1];
  assert.equal(video.params.media_type, 'VIDEO');
  assert.equal(video.params.author_username, 'someone.design');
  assert.ok(!('access_token' in video.params));
  assert.throws(() => planSearches(config, { groups: 'nope' }), /Unknown discovery group/);
  assert.throws(() => planSearches(config, { days: '0' }), /--days/);
});

test('keeps posts and quotes, drops replies and reposts, and marks sites already in the library', () => {
  const library = libraryIndex('{\n "id": "linear",\n "name": "Linear",\n "url": "https://linear.app/",\n}');
  const posts = [
    { id: '1', permalink: 'https://www.threads.com/@a/post/1', username: 'a', text: ' new site ', media_type: 'IMAGE', timestamp: '2026-11-15T00:00:00+0000', link_attachment_url: 'https://www.linear.app' },
    { id: '2', permalink: 'https://www.threads.com/@b/post/2', is_reply: true },
    { id: '3', permalink: 'https://www.threads.com/@c/post/3', media_type: 'REPOST_FACADE' },
    { id: '4', permalink: 'https://www.threads.com/@d/post/4', is_quote_post: true, text: 'x'.repeat(600) },
    { id: '5' },
  ];
  const found = extractCandidates(posts, 'T', { group: 'weekly', label: 'landing page' }, library);
  assert.deepEqual(found.map(c => c.id), ['1', '4']);
  assert.equal(found[0].text, 'new site');
  assert.equal(found[0].inLibrary, 'linear');
  assert.equal(found[1].text.length, 280);
  assert.equal(found[1].status, 'pending');
});

test('merging keeps reviewed candidates untouched and counts new ones per group', () => {
  const reviewed = { id: '1', capturedAt: '2026-11-10', status: 'rejected', reason: 'ad' };
  const merged = mergeCandidates([reviewed], [
    { id: '1', capturedAt: '2026-11-17', group: 'weekly', status: 'pending' },
    { id: '2', capturedAt: '2026-11-17', group: 'weekly', status: 'pending' },
    { id: '2', capturedAt: '2026-11-17', group: 'video', status: 'pending' },
  ]);
  assert.equal(merged.candidates.find(c => c.id === '1').status, 'rejected');
  assert.deepEqual(merged.groups.get('weekly'), { found: 2, added: 1 });
  assert.equal(merged.added, 1);
});

test('the token is stored outside the repo, private, and refreshed after six days', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'threads-token-'));
  const file = path.join(dir, 'nested', 'threads.json');
  await assert.rejects(loadToken({ file, env: {} }), /--save-token/);
  await assert.rejects(saveToken('short', { file }), /does not look like/);
  await saveToken('THAAold-token-1234567890\n', { file, now: new Date('2026-11-01T00:00:00Z') });
  assert.equal((await fs.stat(file)).mode & 0o777, 0o600);
  const calls = [];
  const fetchImpl = async url => { calls.push(url); return new Response(JSON.stringify({ access_token: 'THAAnew-token-1234567890', expires_in: 5183944 })); };
  assert.equal(await loadToken({ file, env: {}, fetchImpl, now: new Date('2026-11-03T00:00:00Z') }), 'THAAold-token-1234567890');
  assert.equal(calls.length, 0);
  assert.equal(await loadToken({ file, env: {}, fetchImpl, now }), 'THAAnew-token-1234567890');
  assert.match(calls[0], /refresh_access_token\?grant_type=th_refresh_token/);
  assert.equal(JSON.parse(await fs.readFile(file, 'utf8')).accessToken, 'THAAnew-token-1234567890');
  assert.equal(await loadToken({ file, env: { THREADS_ACCESS_TOKEN: 'from-env' } }), 'from-env');
});

test('a run writes the inbox, and an API error leaves it unchanged', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'threads-run-'));
  const configFile = path.join(dir, 'config.json'), inbox = path.join(dir, 'inbox.json'), library = path.join(dir, 'lib.ts');
  await fs.writeFile(configFile, JSON.stringify(config));
  await fs.writeFile(library, '');
  const seen = [];
  const ok = async url => { seen.push(new URL(url)); return new Response(JSON.stringify({ data: [{ id: String(seen.length), permalink: `https://www.threads.com/@a/post/${seen.length}`, text: 'hi' }] })); };
  const merged = await run({ config: configFile, inbox, library, fetchImpl: ok, token: 'T', pause: 0, log: () => {} });
  assert.equal(merged.added, 2);
  assert.equal(seen[0].searchParams.get('access_token'), 'T');
  const written = JSON.parse(await fs.readFile(inbox, 'utf8'));
  assert.equal(written.source, 'Threads API keyword search');
  assert.equal(written.candidates.length, 2);
  const failing = async () => new Response(JSON.stringify({ error: { message: 'Application does not have permission' } }), { status: 403 });
  await assert.rejects(run({ config: configFile, inbox, library, fetchImpl: failing, token: 'T', pause: 0, log: () => {} }), /403 Application does not have permission/);
  assert.deepEqual(JSON.parse(await fs.readFile(inbox, 'utf8')), written);
});
