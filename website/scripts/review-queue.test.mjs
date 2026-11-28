import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { readItems } from './x-publish.mjs';
import { list, decide } from './review-queue.mjs';

const source = 'export const inspirationItems = [\n  {\n    "id": "old"\n  }\n];\n\nexport const inspirationTopics = [];\n';
const screening = { rubric: 'video', band: 'review', total: 27, max: 40, vetoes: [], scores: {} };

async function setup() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'rq-test-')), content = path.join(dir, 'content');
  await fs.mkdir(content);
  const data = path.join(dir, 'data.ts'), previews = path.join(dir, 'previews.json');
  await fs.writeFile(data, source); await fs.writeFile(previews, '{"old":{}}');
  await fs.writeFile(path.join(content, 'x-post-inbox.json'), JSON.stringify({ candidates: [
    { id: '1', url: 'https://x.com/a/status/1', status: 'review', reason: 'Score 27/40 → review.', draft: { id: 'x-a-000001', name: 'Test', addedAt: 'then', checkedAt: 'then' }, screening },
    { id: '2', status: 'published', entry: 'old' },
    { id: '3', status: 'review', reason: 'Score 25/40 → review.', draft: { id: 'x-b-000003' }, screening },
  ] }));
  await fs.writeFile(path.join(content, 'site-inbox.json'), JSON.stringify({ candidates: [
    { id: 'gal-site', link: 'https://site.example/', status: 'review', reason: 'Score 30/45 → review.', draft: { id: 'site', name: 'Site' }, draftPreview: { image: 'https://site.example/og.png' }, screening },
  ] }));
  return { dir, content, data, previews, now: new Date('2026-11-29T02:00:00Z') };
}

test('list shows every held row across inboxes', async () => {
  const { content } = await setup();
  assert.deepEqual((await list({ content })).map(r => [r.inbox, r.row.id]), [['x-post-inbox.json', '1'], ['x-post-inbox.json', '3'], ['site-inbox.json', 'gal-site']]);
});

test('accept publishes the draft card, with its preview for a site, and keeps the scores on the row', async () => {
  const io = await setup();
  const row = await decide({ ...io, id: '1', action: 'accept' });
  assert.deepEqual([row.status, row.entry, row.decidedBy, row.reviewedAt, row.draft, row.reason], ['published', 'x-a-000001', 'owner', '2026-11-29', undefined, undefined]);
  assert.equal(row.screening.total, 27);
  const added = readItems(await fs.readFile(io.data, 'utf8')).at(-1);
  assert.deepEqual([added.id, added.addedAt, added.checkedAt], ['x-a-000001', '2026-11-29T02:00:00.000Z', '2026-11-29']);
  await decide({ ...io, id: 'gal-site', action: 'accept' });
  assert.equal(JSON.parse(await fs.readFile(io.previews, 'utf8')).site.image, 'https://site.example/og.png');
  const site = JSON.parse(await fs.readFile(path.join(io.content, 'site-inbox.json'), 'utf8')).candidates[0];
  assert.equal(site.draftPreview, undefined);
});

test('reject records the owner and the screening reason, and nothing reaches the library', async () => {
  const io = await setup();
  const row = await decide({ ...io, id: '3', action: 'reject', reason: 'only a test' });
  assert.equal(row.status, 'rejected'); assert.equal(row.draft, undefined);
  assert.equal(row.reason, 'Rejected by the owner from the review band: only a test. Screening said: Score 25/40 → review.');
  assert.equal(await fs.readFile(io.data, 'utf8'), source);
});

test('only a held row can be decided, and a taken entry id is refused with nothing written', async () => {
  const io = await setup();
  await assert.rejects(decide({ ...io, id: '2', action: 'accept' }), /published, not held for review/);
  await assert.rejects(decide({ ...io, id: 'nope', action: 'reject' }), /No inbox row/);
  await assert.rejects(decide({ ...io, id: '1', action: 'maybe' }), /accept or reject/);
  const file = path.join(io.content, 'x-post-inbox.json'), inbox = JSON.parse(await fs.readFile(file, 'utf8'));
  inbox.candidates[0].draft.id = 'old'; await fs.writeFile(file, JSON.stringify(inbox));
  const before = await fs.readFile(file, 'utf8');
  await assert.rejects(decide({ ...io, id: '1', action: 'accept' }), /already has an entry old/);
  assert.equal(await fs.readFile(file, 'utf8'), before); assert.equal(await fs.readFile(io.data, 'utf8'), source);
});
