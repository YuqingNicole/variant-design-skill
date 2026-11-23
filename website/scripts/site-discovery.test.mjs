import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { validateConfig, parseFeed, visitLink, namedLink, slugMatches, imageDomain, nameMatches, run } from './site-discovery.mjs';
import { buildPrompt } from './threads-publish.mjs';

const feed = items => `<?xml version="1.0"?><rss><channel><title>G</title>${items.map(i => `<item><title><![CDATA[${i.title}]]></title><link>${i.page}</link><pubDate>${i.date}</pubDate>${i.extra ?? ''}</item>`).join('')}</channel></rss>`;

test('the shipped source list is valid, and bad entries are refused', async () => {
  validateConfig(JSON.parse(await fs.readFile(new URL('../content/site-discovery.json', import.meta.url), 'utf8')));
  const ok = { id: 'g', name: 'G', feed: 'https://g.test/feed', resolve: 'visit-link', days: 7, max: 5 };
  assert.throws(() => validateConfig({ sources: [{ ...ok, feed: 'http://g.test/feed' }] }), /https/);
  assert.throws(() => validateConfig({ sources: [{ ...ok, resolve: 'guess' }] }), /resolve/);
  assert.throws(() => validateConfig({ sources: [ok, ok] }), /twice/);
  assert.throws(() => validateConfig({ sources: [{ ...ok, max: 30 }] }), /max/);
  assert.throws(() => validateConfig({ sources: [{ ...ok, confirm: 'title' }] }), /confirm/);
  assert.throws(() => validateConfig({ sources: [{ ...ok, pathPrefix: '/website/' }] }), /pathPrefix/);
});

test('a heading link named after the item resolves the site, and a slug check drops a link to someone else', () => {
  const html = `<a href="https://www.csswinner.com/profile/morimichi/1">MORIMICHI</a><a href="https://m0r1m1ch1.com" rel="nofollow"><span>Site of the Day</span></a><h1><a href="https://m0r1m1ch1.com" target="_blank">MORIMICHI</a></h1>`;
  assert.equal(namedLink(html, 'csswinner.com', 'MORIMICHI'), 'https://m0r1m1ch1.com/');
  assert.equal(namedLink(html, 'csswinner.com', 'Snapa'), null);
  assert.equal(slugMatches('https://m.test/website/study-hall-agency-website', 'https://studyhall.design/'), true);
  assert.equal(slugMatches('https://m.test/website/gssi-latam', 'https://www.gssilatam.org/'), true);
  assert.equal(slugMatches('https://m.test/website/opentrade', 'https://www.shoreditchdesign.com/'), false);
});

test('each gallery adds at most its cap, galleries take turns in the inbox, and a site seen through two galleries is added once', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'site-discovery-')), now = new Date('2026-11-22T00:00:00Z');
  const config = path.join(dir, 'config.json'), inbox = path.join(dir, 'inbox.json'), library = path.join(dir, 'library.ts');
  const date = 'Sat, 21 Nov 2026 10:00:00 +0000';
  await fs.writeFile(config, JSON.stringify({ sources: [
    { id: 'a', name: 'A', feed: 'https://a.test/feed', resolve: 'visit-link', days: 14, max: 2 },
    { id: 'b', name: 'B', feed: 'https://b.test/feed', resolve: 'visit-link', pathPrefix: 'https://b.test/website/', confirm: 'slug', days: 14, max: 2 },
  ] }));
  await fs.writeFile(library, 'export const inspirationItems = [\n];\n');
  const visit = site => `<a href="https://${site}/" title="Visit website">Visit</a>`;
  const pages = {
    'https://a.test/feed': feed(['one', 'two', 'three', 'shared'].map(n => ({ title: n, page: `https://a.test/${n}`, date }))),
    'https://b.test/feed': feed([{ title: 'Shared', page: 'https://b.test/website/shared', date }, { title: 'Branding', page: 'https://b.test/designs/logo', date }, { title: 'Made by a studio', page: 'https://b.test/website/kite', date }, { title: 'Four', page: 'https://b.test/website/four', date }]),
    'https://a.test/one': visit('one.test'), 'https://a.test/two': visit('two.test'), 'https://a.test/three': visit('three.test'), 'https://a.test/shared': visit('shared.test'),
    'https://b.test/website/shared': visit('shared.test'), 'https://b.test/website/kite': visit('studio.test'), 'https://b.test/website/four': visit('four.test'),
  };
  const fetchPage = async url => pages[url] ? { status: 200, url, text: pages[url] } : { status: 404, url, text: '' };
  const result = await run({ config, inbox, library, fetchPage, now });
  assert.deepEqual(result.added.map(a => a[2]), ['https://one.test/', 'https://two.test/', 'https://shared.test/', 'https://four.test/']);
  assert.deepEqual(result.unresolved, [['b', 'Made by a studio']]);
  assert.deepEqual(result.skipped.filter(s => s[0] === 'a').map(s => s[2]), ["over this gallery's 2 a run", "over this gallery's 2 a run"]);
  const stored = JSON.parse(await fs.readFile(inbox, 'utf8')).candidates;
  assert.deepEqual(stored.map(c => c.link), ['https://one.test/', 'https://shared.test/', 'https://two.test/', 'https://four.test/']);
});

test('a gallery page resolves to the site its own Visit link names, without tracking parameters', () => {
  const html = `<a href="https://other.test/?ref=g" aria-label="Launch website">x</a><a href="https://www.soma.test/?ref=onepagelove" title="Visit Soma Website">Visit Website</a><a href="https://g.test/next">Visit next</a>`;
  assert.equal(visitLink(html, 'g.test', 'Soma'), 'https://www.soma.test/');
  assert.equal(visitLink(html, 'g.test', ''), 'https://other.test/');
  assert.equal(visitLink('<a href="https://x.test/">About</a>', 'g.test', 'X'), null);
});

test('a screenshot file name gives a domain guess that the site title must confirm', () => {
  assert.equal(imageDomain('<img src="https://g.test/wp-content/uploads/2026/11/studioplato.co_.jpg">'), 'studioplato.co');
  assert.equal(imageDomain('<img src="https://g.test/u/louielouie.co_.nz_-1920x1066.jpg">'), 'louielouie.co.nz');
  assert.equal(imageDomain('<img src="https://g.test/u/screenshot-1.jpg">'), null);
  assert.equal(nameMatches('Studio Plato', '<title>Studio Plato — Architecture</title>'), true);
  assert.equal(nameMatches('Studio Plato', '<title>Domain for sale</title>'), false);
});

test('a run adds recent, resolvable sites once, and skips what the library or inbox already has', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'site-discovery-')), now = new Date('2026-11-22T00:00:00Z');
  const config = path.join(dir, 'config.json'), inbox = path.join(dir, 'inbox.json'), library = path.join(dir, 'library.ts');
  await fs.writeFile(config, JSON.stringify({ sources: [{ id: 'opl', name: 'One Page Love', feed: 'https://opl.test/feed', resolve: 'visit-link', titlePrefix: 'Website Inspiration:', days: 14, max: 5 }] }));
  await fs.writeFile(library, 'export const inspirationItems = [\n  {"id":"linear","name":"Linear","url":"https://linear.app/","kind":"official-site"}\n];\n');
  const pages = {
    'https://opl.test/feed': feed([
      { title: 'Website Inspiration: Soma', page: 'https://opl.test/soma', date: 'Sat, 21 Nov 2026 10:00:00 +0000' },
      { title: 'Website Inspiration: Linear', page: 'https://opl.test/linear', date: 'Fri, 20 Nov 2026 10:00:00 +0000' },
      { title: 'Template: Not a site', page: 'https://opl.test/template', date: 'Fri, 20 Nov 2026 10:00:00 +0000' },
      { title: 'Website Inspiration: Old', page: 'https://opl.test/old', date: 'Sat, 01 Nov 2026 10:00:00 +0000' },
    ]),
    'https://opl.test/soma': '<a href="https://soma.test/?ref=onepagelove" title="Visit Soma Website">Visit</a>',
    'https://opl.test/linear': '<a href="https://linear.app/?ref=onepagelove" title="Visit Linear Website">Visit</a>',
  };
  const fetchPage = async url => pages[url] ? { status: 200, url, text: pages[url] } : { status: 404, url, text: '' };
  const first = await run({ config, inbox, library, fetchPage, now });
  assert.deepEqual(first.added.map(a => a[2]), ['https://soma.test/']);
  assert.deepEqual(first.skipped.map(s => s[2]), ['library has it (linear)']);
  const stored = JSON.parse(await fs.readFile(inbox, 'utf8')).candidates;
  assert.deepEqual(stored.map(c => [c.id, c.sourceName, c.url, c.link, c.title, c.status]), [['opl-soma-test', 'One Page Love', 'https://opl.test/soma', 'https://soma.test/', 'Soma', 'pending']]);
  const second = await run({ config, inbox, library, fetchPage, now });
  assert.equal(second.added.length, 0);
  // The screening prompt credits the gallery instead of a Threads author.
  assert.match(buildPrompt(stored[0], { title: 'Soma' }, '/tmp/x.png'), /picked by One Page Love, a curated website gallery, as "Soma"/);
});
