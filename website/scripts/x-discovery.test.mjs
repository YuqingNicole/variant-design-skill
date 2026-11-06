import test from 'node:test';
import assert from 'node:assert/strict';
import { extractCandidates, makeSearchUrl, parseCount } from './x-discovery.mjs';

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
