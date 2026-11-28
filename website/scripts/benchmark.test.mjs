import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { agreement, format, screenItem, designPostPrompt, run } from './benchmark.mjs';
import { VETOES } from './screening-rubric.mjs';

const setFile = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../content/benchmark.json');

test('the benchmark set is about 40 labelled items, half design and half video, with draft labels the owner can correct', async () => {
  const { items } = JSON.parse(await fs.readFile(setFile, 'utf8'));
  assert.equal(new Set(items.map(i => i.id)).size, items.length, 'ids are unique');
  assert.deepEqual([items.filter(i => i.rubric === 'design').length, items.filter(i => i.rubric === 'video').length], [20, 20]);
  for (const i of items) {
    assert.ok(['accept', 'review', 'reject'].includes(i.label), i.id);
    assert.ok(['draft', 'confirmed'].includes(i.labelStatus), i.id);
    assert.ok(['x', 'site'].includes(i.source) && i.candidate && i.basis, i.id);
    for (const v of i.expected?.vetoes ?? []) assert.ok(VETOES.some(x => x.code === v && x.kinds.includes(i.rubric)), `${i.id} ${v}`);
  }
  for (const kind of ['design', 'video']) {
    const k = items.filter(i => i.rubric === kind);
    assert.ok(k.some(i => i.label === 'accept') && k.some(i => i.label === 'reject'), kind);
  }
  // Owner decisions are in the set: Snapa and the #338 fan-work takedowns are rejects, owner-added posts are accepts.
  const by = id => items.find(i => i.id === id);
  assert.equal(by('site-csswinner-snapa-sites-uprock-pro').label, 'reject'); assert.equal(by('x-2125370608468775114').label, 'reject');
  assert.equal(by('x-2126107363191234774').label, 'accept');
});

const item = (id, rubric, label, extra = {}) => ({ id, rubric, label, source: 'x', ...extra });
const s = (band, total, scores = {}, vetoes = []) => ({ band, total, max: 40, vetoes, scores: Object.fromEntries(Object.entries(scores).map(([k, n]) => [k, { score: n, reason: 'r' }])) });

test('agreement counts bands, collect-or-not, vetoes and per-dimension separation', () => {
  const results = [
    { item: item('a', 'video', 'accept', { calibration: true, expected: { total: 34 } }), screening: s('accept', 32, { idea: 5 }) },
    { item: item('b', 'video', 'accept'), screening: s('review', 27, { idea: 3 }) },
    { item: item('c', 'video', 'reject', { expected: { vetoes: ['fan-work'] } }), screening: s('reject', null, {}, ['fan-work']) },
    { item: item('d', 'video', 'reject'), screening: s('reject', 20, { idea: 2 }) },
    { item: item('e', 'video', 'review'), error: 'timeout' },
  ];
  const a = agreement(results), v = a.rubrics.video;
  assert.deepEqual([a.screened, a.errors, v.n, v.same, v.independent, v.sameIndependent, v.collect, v.vetoItems, v.vetoHits, v.totalGap], [4, 1, 4, 3, 3, 2, 3, 1, 1, 2]);
  assert.equal(v.confusion.accept.review, 1);
  assert.deepEqual(v.dims.find(d => d.key === 'idea'), { key: 'idea', accept: 4, review: null, reject: 2, gap: 2 });
  const text = format(results, a);
  assert.match(text, /≠ b \[video\] label accept → review 27\/40/); assert.match(text, /\? e .*timeout/);
  assert.match(text, /video: band agreement 3\/4 \(75%\); without calibration items 2\/3 \(67%\); collect-or-not 3\/4 \(75%\)/);
});

const ok = '{"vetoes": [], "scores": {"concept": {"score": 4, "reason": "r"}, "craft": {"score": 4, "reason": "r"}, "originality": {"score": 4, "reason": "r"}, "extensibility": {"score": 4, "reason": "r"}, "consistency": {"score": 3, "reason": "r"}, "learnability": {"score": 3, "reason": "r"}}, "name": "Icons"}';

test('an item is screened like its source, and a site-builder subdomain never reaches the model', async () => {
  const asked = [];
  const dep = {
    ask: p => { asked.push(p); return ok; },
    syndication: () => ({ mediaDetails: [{ type: 'video', video_info: { variants: [{ content_type: 'video/mp4', url: 'https://video.twimg.com/a/720x720/v.mp4' }] } }] }),
    oembed: () => ({ author_name: 'D', html: '<blockquote><p lang="en">icons</p>&mdash; D (@d) <a href="https://twitter.com/d/status/1">November 1, 2026</a></blockquote>' }),
    sheet: () => '/s.jpg', page: () => { throw new Error('no page expected'); }, screenshot: () => '/s.png',
  };
  const design = await screenItem({ id: 'x-1', rubric: 'design', source: 'x', candidate: { id: '2100000000000000001', url: 'https://x.com/d/status/2100000000000000001', handle: 'd' } }, dep, '/tmp');
  assert.deepEqual([design.band, design.total, design.notes.name], ['accept', 34, 'Icons']);
  assert.match(asked[0], /design inspiration library/); assert.match(asked[0], /extensibility instead of hierarchy/);
  const snapa = await screenItem({ id: 's', rubric: 'design', source: 'site', candidate: { link: 'https://snapa.sites.uprock.pro/' } }, dep, '/tmp');
  assert.deepEqual(snapa.vetoes, ['template']); assert.equal(asked.length, 1);
  assert.match(designPostPrompt({ id: '1', handle: 'd' }, { author: 'D', handle: 'd', date: 'x', text: '"quoted"' }, '/s.jpg'), /Post text: "\\"quoted\\""/);
});

test('a run keeps an unreadable item as an error and screens the rest, writing nothing', async () => {
  const dir = await fs.mkdtemp(path.join((await import('node:os')).tmpdir(), 'bm-test-')), set = path.join(dir, 'set.json');
  await fs.writeFile(set, JSON.stringify({ items: [
    { id: 'x-1', rubric: 'design', source: 'x', label: 'accept', candidate: { id: '2100000000000000001', url: 'https://x.com/d/status/2100000000000000001', handle: 'd' } },
    { id: 'x-2', rubric: 'design', source: 'x', label: 'reject', candidate: { id: '2100000000000000002', url: 'https://x.com/d/status/2100000000000000002', handle: 'd' } },
  ] }));
  const io = {
    ask: () => ok, sheet: () => '/s.jpg',
    syndication: id => (id === '2100000000000000002' ? { mediaDetails: [] } : { mediaDetails: [{ type: 'video', video_info: { variants: [{ content_type: 'video/mp4', url: 'https://video.twimg.com/a/720x720/v.mp4' }] } }] }),
    oembed: () => ({ author_name: 'D', html: '<blockquote><p lang="en">x</p>&mdash; D (@d) <a href="https://twitter.com/d/status/1">November 1, 2026</a></blockquote>' }),
  };
  const before = await fs.readFile(set, 'utf8');
  const results = await run({ set, io, jobs: 2 });
  assert.equal(results[0].screening.band, 'accept'); assert.match(results[1].error, /no video/);
  assert.equal(await fs.readFile(set, 'utf8'), before);
});

test('an item that never answers times out as an error, and every finished item is saved as it lands', async () => {
  const dir = await fs.mkdtemp(path.join((await import('node:os')).tmpdir(), 'bm-test-')), set = path.join(dir, 'set.json');
  await fs.writeFile(set, JSON.stringify({ items: [{ id: 's-1', rubric: 'design', source: 'site', label: 'accept', candidate: { link: 'https://hang.example/' } }] }));
  const saved = [];
  const results = await run({ set, timeout: 50, io: { page: () => new Promise(() => {}) }, save: done => { saved.push(done.length); } });
  assert.match(results[0].error, /no answer within/); assert.deepEqual(saved, [1]);
});
