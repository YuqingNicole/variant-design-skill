import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { readItems } from './x-publish.mjs';
import { videoId, channelInLibrary, buildPrompt, entryFor, candidateFromUrl, run, report } from './youtube-publish.mjs';

const good = { accept: true, name: 'Paper city', tag: 'Craft', ai: false, focus: { zh: '纸折的城市一格一格立起来，再被一阵风吹平', en: 'A folded paper city rises frame by frame, then a gust flattens it' }, application: { zh: '定格动画的节奏感', en: 'The rhythm of stop-motion' } };
const HIGH = { idea: 5, completeness: 4, craft: 4, originality: 4, shareability: 4 };
const scored = (scores, card = good) => JSON.stringify({ vetoes: [], scores: Object.fromEntries(Object.entries(scores).map(([k, n]) => [k, { score: n, reason: `${k} line` }])), ai: false, ...card });
const idOf = n => String(n).padStart(11, 'a');
const cand = (n, extra = {}) => ({ id: idOf(n), url: `https://www.youtube.com/watch?v=${idOf(n)}`, title: `T${n}`, channel: `Chan${n}`, channelUrl: `https://www.youtube.com/channel/UC${n}`, publishedAt: '2026-11-10T00:00:00Z', seconds: 40, views: 1000 + n, text: '', capturedAt: '2026-11-17T00:00:00Z', status: 'pending', ...extra });
const existing = { id: 'yt-old', name: 'Old', url: 'https://www.youtube.com/watch?v=ooooooooooo', kind: 'youtube-video', video: { platform: 'youtube', id: 'ooooooooooo', channel: 'Taken', channelUrl: 'https://www.youtube.com/channel/UCtaken' } };
const source = `export const inspirationItems = [\n  ${JSON.stringify(existing, null, 2).replace(/\n/g, '\n  ')}\n];\n\nexport const inspirationTopics = [];\n`;

test('addresses give a video id only for watch pages, and a channel is only collected once', () => {
  assert.equal(videoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=3'), 'dQw4w9WgXcQ'); assert.equal(videoId('https://youtu.be/dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  for (const bad of ['https://www.youtube.com/@x', 'https://example.com/watch?v=dQw4w9WgXcQ', 'not a url']) assert.equal(videoId(bad), null, bad);
  assert.equal(channelInLibrary([existing], { channel: 'Other', channelUrl: 'https://www.youtube.com/channel/UCtaken' }).id, 'yt-old');
  assert.equal(channelInLibrary([existing], { channel: ' taken ' }).id, 'yt-old');
  assert.equal(channelInLibrary([existing], { channel: 'New', channelUrl: 'https://www.youtube.com/channel/UCnew' }), null);
  assert.match(buildPrompt(cand(1), '/s.jpg'), /2×2 grid[\s\S]*design work of any kind[\s\S]*tutorial[\s\S]*Live action/);
  assert.match(buildPrompt(cand(1), '/s.jpg'), /Reject fan work[\s\S]*First check the vetoes[\s\S]*a tutorial[\s\S]*Calibration/);
  // YouTube shares the X tag rules and the AI marker (2026-11-28).
  assert.match(buildPrompt(cand(1), '/s.jpg'), /1\. VFX[\s\S]*4\. Real-time/); assert.match(buildPrompt(cand(1), '/s.jpg'), /"ai": true when[\s\S]*"ai": <true or false>/);
});

test('an entry carries the video facts and no X post fields; an address alone leaves length and date out', () => {
  const entry = entryFor(cand(1), good, '2026-11-19T01:02:03.000Z');
  assert.equal(entry.id, `yt-${idOf(1)}`); assert.equal(entry.kind, 'youtube-video'); assert.equal(entry.category, 'practice'); assert.ok(!('post' in entry));
  assert.deepEqual(entry.video, { platform: 'youtube', id: idOf(1), channel: 'Chan1', channelUrl: 'https://www.youtube.com/channel/UC1', date: '2026-11-10', seconds: 40 });
  assert.ok(!('ai' in entry)); assert.equal(entryFor(cand(1), { ...good, ai: true }, '2026-11-19T00:00:00Z').ai, true);
  assert.deepEqual(Object.keys(entryFor({ ...cand(2), seconds: undefined, publishedAt: undefined }, good, '2026-11-19T00:00:00Z').video), ['platform', 'id', 'channel', 'channelUrl']);
});

test('--url builds a candidate from oEmbed and refuses a video YouTube will not embed', async () => {
  const dep = { oembed: async id => id === idOf(9) ? { status: 401 } : { title: 'A film', author_name: 'Studio', author_url: 'https://www.youtube.com/@studio' } };
  const c = await candidateFromUrl(`https://youtu.be/${idOf(1)}`, dep, new Date('2026-11-19T00:00:00Z'));
  assert.deepEqual([c.id, c.title, c.channel, c.channelUrl, c.group], [idOf(1), 'A film', 'Studio', 'https://www.youtube.com/@studio', 'manual']);
  await assert.rejects(candidateFromUrl(`https://youtu.be/${idOf(9)}`, dep), /embedding \(HTTP 401\)/);
  await assert.rejects(candidateFromUrl('https://www.youtube.com/@studio', dep), /Not a YouTube watch address/);
});

test('a run records every decision, adds accepted videos, and keeps unreadable ones pending', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'yp-test-')), inbox = path.join(dir, 'inbox.json'), data = path.join(dir, 'data.ts');
  const candidates = [cand(1), cand(2, { channel: 'Taken', channelUrl: 'https://www.youtube.com/channel/UCtaken' }), cand(3), cand(4), cand(5), cand(6, { status: 'rejected', reason: 'earlier' }), { ...cand(7), id: 'bad' }];
  await fs.writeFile(inbox, JSON.stringify({ candidates })); await fs.writeFile(data, source);
  const io = {
    oembed: async id => id === idOf(3) ? { status: 403 } : { title: 'x' },
    sheet: async id => { if (id === idOf(4)) throw new Error('frame 1 is missing'); return '/s.jpg'; },
    ask: async prompt => prompt.includes('T5') ? JSON.stringify({ vetoes: ['promo'], reason: 'A product promotion' }) : scored(HIGH),
  };
  const dry = await run({ inbox, data, io, dryRun: true, now: new Date('2026-11-19T00:00:00Z') });
  assert.equal(await fs.readFile(data, 'utf8'), source);
  const summary = await run({ inbox, data, io, now: new Date('2026-11-19T00:00:00Z') });
  assert.deepEqual(summary.accepted.map(a => a[1]), [`yt-${idOf(1)}`]); assert.equal(dry.accepted.length, 1);
  assert.deepEqual(summary.rejected.map(r => r[1]).sort(), ['Not a YouTube video id', 'The library already has a video from this channel (yt-old)', 'Veto promo: A product promotion', 'YouTube does not serve this video for embedding (HTTP 403)']);
  assert.equal(summary.rejected.length, 4); assert.equal(summary.kept.length, 1);
  const stored = JSON.parse(await fs.readFile(inbox, 'utf8')).candidates, by = id => stored.find(c => c.id === id);
  assert.deepEqual([by(idOf(1)).status, by(idOf(1)).entry, by(idOf(2)).status, by(idOf(4)).status, by(idOf(6)).reason], ['published', `yt-${idOf(1)}`, 'rejected', 'pending', 'earlier']);
  assert.equal(readItems(await fs.readFile(data, 'utf8')).at(-1).id, `yt-${idOf(1)}`);
  assert.match(report(summary), /Accepted 1, rejected 4, left pending 1[\s\S]*\+ Chan1/);
});

test('--url screens one video even when the inbox file does not exist yet', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'yp-url-')), inbox = path.join(dir, 'none.json'), data = path.join(dir, 'data.ts');
  await fs.writeFile(data, source);
  const io = { oembed: async () => ({ title: 'x' }), sheet: async () => '/s.jpg', ask: async () => scored(HIGH) };
  const only = await candidateFromUrl(`https://youtu.be/${idOf(1)}`, io);
  const summary = await run({ inbox, data, io, only });
  assert.equal(summary.entries.length, 1); assert.equal(JSON.parse(await fs.readFile(inbox, 'utf8')).candidates[0].status, 'published');
});
