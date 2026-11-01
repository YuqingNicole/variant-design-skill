import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parsePreview, withImageHosts } from './link-preview.mjs';

test('reads og tags in either attribute order and resolves relative images', () => {
  const html = `<html lang="en-US"><title>Fallback</title><meta content="/og.png" property="og:image"><meta property="og:title" content="Acme &amp; Co"><meta name="description" content="Plain">`;
  assert.deepEqual(parsePreview(html, 'https://acme.com/a/'), { image: 'https://acme.com/og.png', title: 'Acme & Co', description: 'Plain', lang: 'en-US' });
  assert.equal(parsePreview('<meta property=og:image content=https://cdn.a/i.png>', 'https://a.com/').image, 'https://cdn.a/i.png');
});

test('falls back to twitter:image and the page title; no image means no preview', () => {
  assert.deepEqual(parsePreview(`<title>T</title><meta name='twitter:image' content='https://cdn.x/i.jpg'>`, 'https://a.com/'), { image: 'https://cdn.x/i.jpg', title: 'T', description: '', lang: '' });
  assert.equal(parsePreview('<meta property="og:image" content="http://a/i.png"><meta name="twitter:image" content="https://a/t.png">', 'https://a.com/').image, 'https://a/t.png');
  assert.equal(parsePreview('<title>Only text</title>', 'https://a.com/'), null);
  assert.equal(parsePreview('<meta property="og:image" content="http://insecure/i.png">', 'https://a.com/'), null);
});

test('stored previews belong to existing link entries and point at https images', () => {
  const source = fs.readFileSync(new URL('../src/inspiration-data.ts', import.meta.url), 'utf8');
  const from = source.indexOf('[', source.indexOf('export const inspirationItems = '));
  const items = new Map(JSON.parse(source.slice(from, source.indexOf('\n];', from) + 2)).map(i => [i.id, i]));
  const previews = JSON.parse(fs.readFileSync(new URL('../src/link-previews.json', import.meta.url), 'utf8'));
  for (const [id, p] of Object.entries(previews)) {
    assert.ok(items.has(id) && !items.get(id).post, id);
    assert.equal(new URL(p.image).protocol, 'https:', id);
    assert.equal(typeof p.lang, 'string', id);
    assert.match(p.fetchedAt, /^\d{4}-\d{2}-\d{2}$/, id);
  }
});

test('every preview image host may be resized by Vercel, and syncing keeps existing hosts', () => {
  const config = JSON.parse(fs.readFileSync(new URL('../../vercel.json', import.meta.url), 'utf8'));
  const previews = JSON.parse(fs.readFileSync(new URL('../src/link-previews.json', import.meta.url), 'utf8'));
  assert.deepEqual(withImageHosts(config, previews), config);
  assert.deepEqual(config.images.sizes, [640, 1280]);
  const next = withImageHosts({ images: { sizes: [640], remotePatterns: [{ protocol: 'https', hostname: 'old.example' }] } }, { a: { image: 'https://new.example/og.png' }, b: { image: 'http://plain.example/og.png' }, c: {} });
  assert.deepEqual(next.images, { sizes: [640], remotePatterns: [{ protocol: 'https', hostname: 'old.example' }, { protocol: 'https', hostname: 'new.example' }] });
});
