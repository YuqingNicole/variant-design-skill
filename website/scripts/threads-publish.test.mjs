import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { readItems } from './x-publish.mjs';
import { judged, parseVerdict, buildPrompt, idFor, siteInLibrary, run, report, SITE_TAGS } from './threads-publish.mjs';

const good = { accept: true, name: 'Acme', tag: 'SaaS', focus: { zh: '主张 → 产品界面 → 定价', en: 'Proposition → interface → pricing' }, application: { zh: '软件产品首页', en: 'Software product homepages' } };
const site = (id, url) => ({ id, name: id, category: 'landing', url, kind: 'official-site' });
const source = `export const inspirationItems = [\n  ${JSON.stringify(site('old', 'https://www.old.example/'), null, 2).replace(/\n/g, '\n  ')}\n];\n\nexport const inspirationTopics = [];\n`;
const cand = (id, link, extra = {}) => ({ id, url: `https://www.threads.com/@u/post/${id}`, username: 'u', text: 'launch', link, capturedAt: '2026-11-17T00:00:00Z', status: 'pending', ...extra });
const html = '<html lang="en"><head><meta property="og:image" content="https://cdn.acme.example/og.png"><meta property="og:title" content="Acme"></head></html>';

test('a site is the same site with or without www, and ids never repeat', () => {
  assert.equal(siteInLibrary([site('old', 'https://www.old.example/')], 'https://old.example/pricing').id, 'old');
  assert.equal(siteInLibrary([{ id: 'p', url: 'https://x.com/old.example/status/1', post: { id: '1' } }], 'https://old.example/'), null);
  // A YouTube video is not the site youtube.com: a post linking to it must not be rejected as a site the library already has.
  assert.equal(siteInLibrary([{ id: 'yt-a', url: 'https://www.youtube.com/watch?v=aaaaaaaaaaa', kind: 'youtube-video', video: { platform: 'youtube' } }], 'https://youtube.com/'), null);
  assert.equal(idFor('https://www.drinkpoppi.com/', new Set()), 'drinkpoppi');
  assert.equal(idFor('https://acme.co.uk/', new Set(['acme-co', 'acme-co-2'])), 'acme-co-3');
});

test('parseVerdict takes site tags only and needs both languages', () => {
  assert.equal(parseVerdict(JSON.stringify(good)).tag, 'SaaS');
  for (const b of [{ ...good, tag: 'Interaction' }, { ...good, focus: { zh: 'English', en: 'English' } }, { ...good, name: '' }, { accept: false }])
    assert.throws(() => parseVerdict(JSON.stringify(b)), undefined, JSON.stringify(b));
  assert.match(buildPrompt(cand('1', 'https://a.example/'), { title: 'A' }, '/s.png'), /block page[\s\S]*SaaS/);
});

test('the prompt says when the capture checked that the page did not move, and stays silent otherwise', () => {
  const stuck = buildPrompt(cand('1', 'https://a.example/'), { title: 'A' }, { file: '/s.png', moved: [null, false, false] });
  assert.match(stuck, /Read the image at \/s\.png/);
  assert.match(stuck, /did not move to reach screen 2 or 3, even after a second wheel pass and the Page Down key/);
  assert.match(stuck, /only one screen of content/, 'the rule that rejects it is unchanged');
  assert.doesNotMatch(buildPrompt(cand('1', 'https://a.example/'), { title: 'A' }, { file: '/s.png', moved: [null, true, true] }), /did not move/);
});

test('a run records every decision, adds the preview, and keeps unreadable sites pending', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'tp-test-'));
  const inbox = path.join(dir, 'inbox.json'), data = path.join(dir, 'data.ts'), previews = path.join(dir, 'previews.json');
  const candidates = [
    cand('1', 'https://acme.example/'), cand('2', null), cand('3', 'https://www.old.example/about'), cand('4', 'https://gone.example/'),
    cand('5', 'https://bare.example/'), cand('6', 'https://flaky.example/'), cand('7', 'https://gate.example/'), cand('8', 'https://x.example/', { status: 'rejected', reason: 'earlier' }),
  ];
  await fs.writeFile(inbox, JSON.stringify({ candidates })); await fs.writeFile(data, source); await fs.writeFile(previews, '{"old":{"image":"https://o/x.png"}}');
  const asked = [];
  const io = {
    page: async url => url.includes('gone') ? { status: 404, url, html: '' } : url.includes('flaky') ? Promise.reject(new Error('timeout')) : { status: 200, url, html: url.includes('bare') ? '<html></html>' : html },
    screenshot: () => '/s.png', size: async () => ({ width: 1200, height: 630 }),
    ask: prompt => { asked.push(prompt); return prompt.includes('gate.example') ? '{"accept": false, "reason": "A verification gate covers the page."}' : JSON.stringify(good); },
  };
  const result = await run({ inbox, data, previews, io, now: new Date('2026-11-17T01:00:00Z') });
  assert.equal(asked.length, 2, 'only the readable sites reach the model');
  const stored = JSON.parse(await fs.readFile(inbox, 'utf8')), by = id => stored.candidates.find(c => c.id === id);
  assert.deepEqual([by('1').status, by('1').entry, by('1').reviewedAt], ['published', 'acme', '2026-11-17']);
  assert.match(by('2').reason, /no website/); assert.match(by('3').reason, /already has this site \(old\)/);
  assert.match(by('4').reason, /HTTP 404/); assert.match(by('5').reason, /no share preview/);
  assert.equal(by('6').status, 'pending'); assert.equal(by('7').reason, 'A verification gate covers the page.'); assert.equal(by('8').reason, 'earlier');
  const entry = readItems(await fs.readFile(data, 'utf8')).at(-1);
  assert.deepEqual([entry.id, entry.url, entry.kind, entry.designer, entry.via, entry.source], ['acme', 'https://acme.example/', 'official-site', null, 'https://www.threads.com/@u/post/1', 'link-only']);
  const p = JSON.parse(await fs.readFile(previews, 'utf8'));
  assert.equal(p.acme.image, 'https://cdn.acme.example/og.png'); assert.equal(p.acme.fetchedAt, '2026-11-17'); assert.ok(p.old);
  assert.deepEqual([p.acme.width, p.acme.height], [1200, 630], 'the preview keeps its image size for the feed');
  assert.match(report(result), /Accepted 1, rejected 5, left pending 1/);
});

test('a dry run, and two posts for one site, publish once and write nothing', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'tp-test-'));
  const inbox = path.join(dir, 'inbox.json'), data = path.join(dir, 'data.ts'), previews = path.join(dir, 'previews.json');
  const body = JSON.stringify({ candidates: [cand('1', 'https://acme.example/'), cand('2', 'https://www.acme.example/pricing')] });
  await fs.writeFile(inbox, body); await fs.writeFile(data, source); await fs.writeFile(previews, '{}');
  const io = { page: async url => ({ status: 200, url, html }), screenshot: () => '/s.png', ask: () => JSON.stringify(good), size: async () => null };
  const r = await run({ inbox, data, previews, io, dryRun: true });
  assert.equal(r.accepted.length, 1); assert.equal(r.rejected.length, 1);
  assert.equal(await fs.readFile(inbox, 'utf8'), body); assert.equal(await fs.readFile(data, 'utf8'), source); assert.equal(await fs.readFile(previews, 'utf8'), '{}');
  assert.ok(SITE_TAGS.includes('Fintech'));
});

test('an answer that fails validation is retried once with the reason, then the failure stands', async () => {
  const seen = [];
  const bad = JSON.stringify({ ...good, focus: { zh: '长'.repeat(800), en: 'long' } });
  assert.equal((await judged(p => { seen.push(p); return seen.length === 1 ? bad : JSON.stringify(good); }, 'P', '/d')).name, 'Acme');
  assert.match(seen[1], /previous answer was rejected: "focus" needs/i);
  await assert.rejects(judged(() => bad, 'P', '/d'), /"focus" needs/);
});
