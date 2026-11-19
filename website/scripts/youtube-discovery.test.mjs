import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { validateConfig, planSearches, seconds, extractCandidates, mergeCandidates, libraryIndex, run, saveKey, loadKey, readConfig } from './youtube-discovery.mjs';

const config = { groups: [{ id: 'weekly', weekly: true, days: 7, maxSeconds: 120, queries: [{ q: 'ui animation', minViews: 1000 }, { q: 'logo', minViews: 10 }] }, { id: 'more', days: 30, maxSeconds: 200, queries: [{ q: 'ui animation', minViews: 1000 }] }] };
const video = (id, duration, views, extra = {}) => ({ id, snippet: { title: ` T ${id} `, channelTitle: 'Chan', channelId: 'UC1', publishedAt: '2026-11-10T00:00:00Z', description: 'd'.repeat(400), ...extra }, contentDetails: { duration }, statistics: { viewCount: String(views), likeCount: '5' } });

test('the shipped config is valid and the plan has no key and one search per query', async () => {
  const shipped = await readConfig();
  assert.ok(planSearches(shipped, { groups: 'all' }).length >= 4);
  const plan = planSearches(config, { groups: 'all', now: new Date('2026-11-19T00:00:00Z') });
  assert.equal(plan.length, 3);
  for (const search of plan) { assert.equal(search.params.videoEmbeddable, 'true'); assert.equal(search.params.safeSearch, 'strict'); assert.ok(!('key' in search.params)); }
  assert.equal(plan[0].params.publishedAfter, '2026-11-12T00:00:00.000Z');
  assert.throws(() => planSearches(config, { days: '0' }), /--days/);
  assert.throws(() => planSearches(config, { groups: 'nope' }), /Unknown discovery group/);
  for (const bad of [{ groups: [] }, { groups: [{ ...config.groups[0], maxSeconds: 5 }] }, { groups: [{ ...config.groups[0], weekly: undefined }] }, { groups: [{ ...config.groups[0], queries: [{ q: 'x' }] }] }]) assert.throws(() => validateConfig(bad));
});

test('durations parse, and only short, watched, embeddable-length videos become candidates', () => {
  assert.equal(seconds('PT1M5S'), 65); assert.equal(seconds('PT2H'), 7200); assert.equal(seconds('P0D'), 0); assert.equal(seconds(undefined), 0);
  const search = { label: 'q', group: 'weekly', minViews: 1000, maxSeconds: 120 };
  const out = extractCandidates([video('a', 'PT45S', 5000), video('b', 'PT45S', 10), video('c', 'PT5M', 9999), video('d', 'PT2S', 9999), video('e', 'P0D', 9999), video('f', 'PT30S', 2000)], 'T', search, new Map([['f', 'yt-f']]));
  assert.deepEqual(out.map(c => c.id), ['a', 'f']);
  assert.equal(out[0].title, 'T a'); assert.equal(out[0].text.length, 280); assert.equal(out[0].channelUrl, 'https://www.youtube.com/channel/UC1'); assert.equal(out[1].inLibrary, 'yt-f');
});

test('merging never touches a reviewed candidate, and the library index reads video ids', () => {
  const reviewed = { id: 'a', status: 'rejected', reason: 'x', capturedAt: '2026-11-01T00:00:00Z', group: 'weekly', views: 1 };
  const merged = mergeCandidates([reviewed], [{ ...reviewed, status: 'pending', capturedAt: '2026-11-19T00:00:00Z' }, { id: 'b', group: 'weekly', capturedAt: '2026-11-19T00:00:00Z', views: 5, status: 'pending' }]);
  assert.equal(merged.added, 1); assert.equal(merged.candidates.find(c => c.id === 'a').status, 'rejected');
  const source = `export const inspirationItems = [\n  {"id":"yt-a","video":{"platform":"youtube","id":"a"}},\n  {"id":"x","post":{"id":"9"}}\n];\n`;
  assert.deepEqual([...libraryIndex(source)], [['a', 'yt-a']]);
});

test('a run searches, then reads details in one call, and an API error leaves the inbox alone', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'yd-test-')), file = path.join(dir, 'cfg.json'), inbox = path.join(dir, 'inbox.json'), lib = path.join(dir, 'lib.ts');
  await fs.writeFile(file, JSON.stringify(config)); await fs.writeFile(lib, 'export const inspirationItems = [\n];\n');
  const calls = [];
  const fetchImpl = async url => {
    const u = new URL(url); calls.push(u.pathname.split('/').pop());
    assert.equal(u.searchParams.get('key'), 'KEY');
    const body = u.pathname.endsWith('/search') ? { items: [{ id: { videoId: 'a' } }, { id: { videoId: 'b' } }] } : { items: [video('a', 'PT45S', 5000), video('b', 'PT45S', 5)] };
    return { ok: true, status: 200, json: async () => body };
  };
  const lines = [];
  const merged = await run({ groups: 'weekly', config: file, inbox, library: lib, fetchImpl, key: 'KEY', pause: 0, log: m => lines.push(m) });
  assert.equal(merged.added, 1); assert.deepEqual(calls, ['search', 'videos', 'search', 'videos']);
  assert.equal(JSON.parse(await fs.readFile(inbox, 'utf8')).candidates[0].id, 'a');
  const before = await fs.readFile(inbox, 'utf8');
  await assert.rejects(run({ groups: 'weekly', config: file, inbox, library: lib, key: 'KEY', pause: 0, log() {}, fetchImpl: async () => ({ ok: false, status: 403, json: async () => ({ error: { message: 'quota' } }) }) }), /403 quota/);
  assert.equal(await fs.readFile(inbox, 'utf8'), before);
});

test('the key is stored outside the repo with owner-only permissions, and bad keys are refused', async () => {
  const file = path.join(await fs.mkdtemp(path.join(os.tmpdir(), 'yk-test-')), 'youtube.json');
  await assert.rejects(saveKey('short', { file }), /does not look like/);
  await saveKey(' AIzaSyExampleExampleExample12345 ', { file });
  assert.equal((await fs.stat(file)).mode & 0o777, 0o600);
  assert.equal(await loadKey({ file, env: {} }), 'AIzaSyExampleExampleExample12345');
  assert.equal(await loadKey({ file: '/nowhere', env: { YOUTUBE_API_KEY: 'E' } }), 'E');
  await assert.rejects(loadKey({ file: '/nowhere', env: {} }), /No YouTube API key/);
});
