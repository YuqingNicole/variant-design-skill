import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { run, extractCandidates, makeAccountSearchUrl, makeSearchUrl, mergeCandidates, parseCount, planSearches, readConfig, selectGroups, validateConfig } from './x-discovery.mjs';

const config = await readConfig();
const now = new Date('2026-11-14T01:00:00.000Z');

test('parses X engagement counts and creates a seven-day eligible search URL', () => {
  assert.equal(parseCount('11,181 Likes'), 11181);
  assert.equal(parseCount('2.4K likes'), 2400);
  assert.equal(parseCount('1.2M views'), 1200000);
  assert.equal(parseCount('none'), 0);
  const url = new URL(makeSearchUrl('(design OR UI)', '2026-10-30', 100));
  assert.equal(url.hostname, 'x.com');
  assert.equal(url.searchParams.get('q'), '(design OR UI) filter:videos min_faves:100 since:2026-10-30');
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

test('the shipped config is valid and the weekly group still makes the searches the schedule has always run', () => {
  const weekly = planSearches(config, { now });
  assert.deepEqual([...new Set(weekly.map(s => s.group))], ['weekly']);
  assert.deepEqual(weekly[0], {
    group: 'weekly', screens: 0, query: '(design OR UI OR interaction OR motion) filter:videos min_faves:100 since:2026-11-07',
    kind: 'query', label: '(design OR UI OR interaction OR motion)', url: makeSearchUrl('(design OR UI OR interaction OR motion)', '2026-11-07', 100),
    minLikes: 100, required: true,
  });
  assert.deepEqual(weekly.slice(1).map(s => [s.handle, s.minLikes]), [
    ['raunofreiberg', 300], ['jakubkrehel', 100], ['jh3yy', 300], ['mattgperry', 100], ['lochieaxon', 50], ['ibelick', 50], ['steveruizok', 200],
  ]);
  assert.ok(weekly.slice(1).every(s => s.kind === 'account' && !s.required && s.query.startsWith(`from:${s.handle} -filter:replies`)));
});

test('a run covers the weekly groups unless groups are named; named groups keep config order, their own window and screens', () => {
  assert.deepEqual(selectGroups(config).map(g => g.id), config.groups.filter(g => g.weekly).map(g => g.id));
  assert.deepEqual(selectGroups(config, '').map(g => g.id), selectGroups(config).map(g => g.id));
  assert.deepEqual(selectGroups(config, 'designers, print').map(g => g.id), ['print', 'designers']);
  assert.deepEqual(selectGroups(config, ['all']).map(g => g.id), config.groups.map(g => g.id));
  assert.throws(() => selectGroups(config, 'print,nope'), /Unknown discovery group: nope\. Known groups: weekly,/);

  const print = planSearches(config, { groups: 'print', now });
  assert.equal(print.length, 1);
  assert.match(print[0].query, /^\("packaging design" OR .* filter:videos min_faves:150 since:2026-10-15$/);
  assert.equal(print[0].screens, 3);
  assert.equal(print[0].required, false);
  assert.match(planSearches(config, { groups: 'print', days: '14', now })[0].query, /since:2026-10-31$/);
  assert.ok(planSearches(config, { groups: 'weekly', days: 3, now }).every(s => s.query.endsWith('since:2026-11-11')));
  for (const bad of ['0', '91', '7.5', 'week']) assert.throws(() => planSearches(config, { days: bad, now }), /--days must be a whole number from 1 to 90/);
  assert.equal(planSearches(config, { groups: 'all', now }).length, config.groups.reduce((n, g) => n + (g.queries?.length ?? 0) + (g.accounts?.length ?? 0), 0));
});

test('the same search reached through two groups runs once, under the first', () => {
  const twice = { groups: [
    { id: 'a', weekly: true, days: 7, queries: [{ terms: 'zine', minLikes: 150 }], accounts: [{ handle: 'akella', minLikes: 100 }] },
    { id: 'b', days: 7, queries: [{ terms: 'zine', minLikes: 150 }, { terms: 'zine', minLikes: 200 }], accounts: [{ handle: 'akella', minLikes: 100 }] },
  ] };
  assert.deepEqual(planSearches(validateConfig(twice), { groups: 'all', now }).map(s => [s.group, s.label, s.minLikes]), [['a', 'zine', 150], ['a', '@akella', 100], ['b', 'zine', 200]]);
});

test('a config that would search the wrong thing is refused with the reason', () => {
  const group = extra => ({ groups: [{ id: 'g', weekly: true, days: 7, queries: [{ terms: 'zine', minLikes: 150 }], ...extra }] });
  assert.doesNotThrow(() => validateConfig(group({})));
  const cases = [
    [{}, /"groups" must be a non-empty list/],
    [group({ id: 'All Posters' }), /group id "All Posters" must be lowercase/],
    [group({ id: 'all' }), /not "all"/],
    [{ groups: [...group({}).groups, ...group({}).groups] }, /group "g" is listed twice/],
    [group({ days: 0 }), /needs "days" from 1 to 90/],
    [group({ screens: 9 }), /"screens" must be from 0 to 5/],
    [group({ weekly: 'yes' }), /"weekly" must be true or false/],
    [group({ weekly: false }), /at least one group must be marked "weekly"/],
    [group({ queries: [] }), /needs at least one query or account/],
    [group({ queries: [{ terms: ' ', minLikes: 150 }] }), /a query without "terms"/],
    [group({ queries: [{ terms: 'zine min_faves:10', minLikes: 150 }] }), /leave filter:videos, min_faves:, since: and until: out of "terms"/],
    [group({ queries: [{ terms: 'zine', minLikes: 0 }] }), /"minLikes" must be a positive whole number/],
    [group({ queries: [{ terms: 'zine', minLikes: 150, required: 1 }] }), /"required" must be true or false/],
    [group({ accounts: [{ handle: '@akella', minLikes: 100 }] }), /invalid handle "@akella"/],
    [group({ accounts: [{ handle: 'akella', minLikes: 100 }, { handle: 'Akella', minLikes: 50 }] }), /lists @Akella twice/],
    [group({ accounts: [{ handle: 'akella' }] }), /@akella needs a positive whole "minLikes"/],
  ];
  for (const [bad, message] of cases) assert.throws(() => validateConfig(bad), message);
});

test('new posts join the inbox with their group, reviewed candidates are left as they are, and the report counts per group', () => {
  const capturedAt = '2026-11-14T01:00:00.000Z';
  const row = (handle, id, likes) => ({ url: `https://x.com/${handle}/status/${id}`, metrics: `${likes} likes`, author: handle, publishedAt: '2026-11-12' });
  const weekly = extractCandidates([row('one', '2120000000000000011', 400), row('two', '2120000000000000012', 400)], capturedAt, 'q1', { group: 'weekly' });
  const print = extractCandidates([row('two', '2120000000000000012', 400), row('three', '2120000000000000013', 160)], capturedAt, 'q2', { minLikes: 150, group: 'print' });
  assert.equal(weekly[0].group, 'weekly');
  assert.equal('group' in extractCandidates([row('one', '2120000000000000011', 400)], capturedAt, 'q1')[0], false);
  const reviewed = { id: '2120000000000000011', capturedAt: '2026-11-07T01:00:00.000Z', status: 'rejected', reason: 'tool promotion', reviewedAt: '2026-11-08' };
  const merged = mergeCandidates([reviewed], [...weekly, ...print]);
  assert.deepEqual(merged.candidates.map(c => [c.id, c.status, c.group]), [
    ['2120000000000000012', 'pending', 'weekly'], ['2120000000000000013', 'pending', 'print'], ['2120000000000000011', 'rejected', undefined],
  ]);
  assert.equal(merged.candidates.at(-1), reviewed);
  assert.deepEqual([merged.qualifying, merged.added], [3, 2]);
  assert.deepEqual([...merged.groups], [['weekly', { qualifying: 2, added: 1 }], ['print', { qualifying: 1, added: 1 }]]);
});

// A stand-in for Ego Lite's task space: each search URL answers with the rows listed for its query, or times out.
async function runWith(pages, options = {}) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'x-discovery-'));
  const configFile = path.join(dir, 'x-discovery.json'), inbox = path.join(dir, 'inbox.json');
  await fs.writeFile(configFile, JSON.stringify({ groups: [
    { id: 'weekly', weekly: true, days: 7, queries: [{ terms: 'design', minLikes: 100, required: true }], accounts: [{ handle: 'akella', minLikes: 50 }] },
    { id: 'print', days: 30, queries: [{ terms: 'zine', minLikes: 150 }, { terms: 'letterpress', minLikes: 150 }] },
  ] }));
  if (options.existing) await fs.writeFile(inbox, JSON.stringify({ candidates: options.existing }));
  const visited = [], lines = [];
  let current, finished = false;
  const page = {
    goto: async url => { current = new URL(url).searchParams.get('q'); visited.push(current); },
    waitForSelector: async () => { if (!Object.keys(pages).some(key => current.startsWith(key))) throw new Error('Timeout 20000ms exceeded'); },
    evaluate: async () => pages[Object.keys(pages).find(key => current.startsWith(key))],
  };
  const log = console.log;
  globalThis.taskSpace = async () => ({ page: () => page, finish: async () => { finished = true; } });
  console.log = line => lines.push(line);
  let error;
  try { await run({ groups: options.groups, config: configFile, inbox, pause: 0 }); } catch (caught) { error = caught; } finally { console.log = log; delete globalThis.taskSpace; }
  const written = await fs.readFile(inbox, 'utf8').then(JSON.parse, () => null);
  await fs.rm(dir, { recursive: true });
  return { visited, lines, error, written, finished };
}
const post = (handle, id, likes) => ({ url: `https://x.com/${handle}/status/${id}`, metrics: `${likes} likes, 9,000 views`, author: handle, publishedAt: '2026-11-12' });

test('a run reads each planned search, writes new candidates with their group and reports each group separately', async () => {
  const reviewed = { id: '2120000000000000021', capturedAt: '2026-11-07T01:00:00.000Z', status: 'published', entry: 'x-one' };
  const got = await runWith({
    design: [post('one', '2120000000000000021', 500), post('two', '2120000000000000022', 99)],
    'from:akella': [post('akella', '2120000000000000023', 60)],
    zine: [post('four', '2120000000000000024', 150)],
  }, { groups: 'all', existing: [reviewed] });
  assert.equal(got.error, undefined);
  assert.deepEqual(got.visited.map(q => q.split(' ')[0]), ['design', 'from:akella', 'zine', 'letterpress']);
  assert.deepEqual(got.written.candidates.map(c => [c.id, c.status, c.group, c.watched]), [
    ['2120000000000000023', 'pending', 'weekly', true], ['2120000000000000024', 'pending', 'print', undefined], ['2120000000000000021', 'published', undefined, undefined],
  ]);
  assert.match(got.lines[0], /^X design discovery: 3 qualifying posts, 2 new, from 4 searches; /);
  assert.deepEqual(got.lines.slice(1), [
    '  weekly: 2 qualifying, 1 new; 0/2 searches gave nothing (none)',
    '  print: 1 qualifying, 1 new; 1/2 searches gave nothing (letterpress)',
  ]);
  assert.equal(got.finished, true);
});

test('with no groups named only the weekly group is searched', async () => {
  const got = await runWith({ design: [post('one', '2120000000000000021', 500)] });
  assert.deepEqual(got.visited.map(q => q.split(' ')[0]), ['design', 'from:akella']);
  assert.deepEqual(got.lines.slice(1), ['  weekly: 1 qualifying, 1 new; 1/2 searches gave nothing (@akella)']);
});

test('the inbox is left unchanged when a required search, or every search of the run, reads nothing', async () => {
  const existing = [{ id: '2120000000000000021', capturedAt: '2026-11-07T01:00:00.000Z', status: 'published', entry: 'x-one' }];
  const loggedOut = await runWith({ 'from:akella': [post('akella', '2120000000000000023', 60)] }, { existing });
  assert.match(loggedOut.error?.message, /^X returned no readable posts; the inbox was left unchanged\. Open x\.com in Ego Lite first and check that it is still logged in\. \(Timeout 20000ms exceeded\)$/);
  assert.deepEqual(loggedOut.visited.map(q => q.split(' ')[0]), ['design'], 'the run stops at the required search');
  assert.deepEqual(loggedOut.written, { candidates: existing });

  const empty = await runWith({ design: [] }, { existing });
  assert.match(empty.error?.message, /^X returned no readable posts; the inbox was left unchanged\./);
  const nothing = await runWith({}, { groups: 'print', existing });
  assert.match(nothing.error?.message, /^X returned no readable posts; the inbox was left unchanged\./);
  assert.equal(nothing.visited.length, 2, 'a group with no required search tries all of its searches first');
  assert.deepEqual(nothing.written, { candidates: existing });
});
