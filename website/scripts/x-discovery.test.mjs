import test from 'node:test';
import assert from 'node:assert/strict';
import { extractCandidates, makeAccountSearchUrl, makeSearchUrl, parseCount, watchedAccounts } from './x-discovery.mjs';

test('parses X engagement counts and creates a seven-day eligible search URL', () => {
  assert.equal(parseCount('11,181 Likes'), 11181);
  assert.equal(parseCount('2.4K likes'), 2400);
  assert.equal(parseCount('1.2M views'), 1200000);
  assert.equal(parseCount('none'), 0);
  const url = new URL(makeSearchUrl('2026-10-30'));
  assert.equal(url.hostname, 'x.com');
  assert.match(url.searchParams.get('q'), /filter:videos min_faves:100 since:2026-10-30/);
});

test('keeps only qualified X posts and deduplicates status ids', () => {
  const capturedAt = '2026-11-06T07:18:09.000Z';
  const rows = [
    { url: 'https://x.com/designer/status/2114049200749175174/analytics', metrics: '11,181 Likes, 876,755 views', author: 'Elaya', publishedAt: '2026-10-25' },
    { url: 'https://x.com/designer/status/2114049200749175174', metrics: '11,181 Likes, 876,755 views', author: 'Elaya', publishedAt: '2026-10-25' },
    { url: 'https://x.com/other/status/2114049200749175175', metrics: '99 likes', author: 'Other' },
    { url: 'https://example.com/not-an-x-post', metrics: '1000 likes', author: 'Invalid' },
  ];
  assert.deepEqual(extractCandidates(rows, capturedAt, 'design search'), [{
    id: '2114049200749175174', url: 'https://x.com/designer/status/2114049200749175174', handle: 'designer',
    author: 'Elaya', publishedAt: '2026-10-25', likes: 11181, views: 876755,
    capturedAt, query: 'design search', status: 'pending',
  }]);
});

test('an account search keeps only that account, uses its own like threshold and marks the posts as watched', () => {
  const url = new URL(makeAccountSearchUrl('ibelick', '2026-11-03', 50));
  assert.equal(url.searchParams.get('q'), 'from:ibelick -filter:replies filter:videos min_faves:50 since:2026-11-03');
  const capturedAt = '2026-11-10T01:00:00.000Z';
  const rows = [
    { url: 'https://x.com/ibelick/status/2120000000000000001', metrics: '62 likes, 4,100 views', author: 'Ibelick', publishedAt: '2026-11-08' },
    { url: 'https://x.com/IBELICK/status/2120000000000000002', metrics: '49 likes', author: 'Ibelick' },
    { url: 'https://x.com/someoneelse/status/2120000000000000003', metrics: '9,000 likes', author: 'Someone' },
  ];
  const got = extractCandidates(rows, capturedAt, 'q', { minLikes: 50, handle: 'ibelick' });
  assert.deepEqual(got.map(c => [c.id, c.watched]), [['2120000000000000001', true]]);
  assert.equal(extractCandidates(rows, capturedAt, 'q').length, 1, 'the keyword search keeps its 100-like floor and has no watched mark');
});

test('the watch list has unique, valid handles and a positive threshold each', () => {
  assert.ok(watchedAccounts.length >= 5);
  assert.equal(new Set(watchedAccounts.map(a => a.handle.toLowerCase())).size, watchedAccounts.length);
  for (const { handle, minLikes } of watchedAccounts) { assert.match(handle, /^[A-Za-z0-9_]{1,15}$/); assert.ok(Number.isInteger(minLikes) && minLikes > 0, handle); }
});
