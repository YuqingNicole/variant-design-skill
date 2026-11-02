import test from 'node:test';
import assert from 'node:assert/strict';
import { draftEntry, fromOembed, parsePostUrl } from './x-post.mjs';

test('accepts x.com and twitter.com post URLs and normalises them', () => {
  assert.deepEqual(parsePostUrl('https://twitter.com/AreadneMaria/status/2114898325451444419?s=20'), { handle: 'AreadneMaria', id: '2114898325451444419', url: 'https://x.com/AreadneMaria/status/2114898325451444419' });
  for (const bad of ['https://x.com/AreadneMaria', 'http://x.com/a/status/12345', 'https://evil.com/a/status/12345', 'https://x.com/a/status/12345abc']) assert.throws(() => parsePostUrl(bad), /Not an X post/);
});

test('reads author, date, language and text from oEmbed markup without media links or HTML', () => {
  const html = '<blockquote class="twitter-tweet" data-dnt="true"><p lang="en" dir="ltr">sheep &amp; grass! <a href="https://t.co/x">pic.twitter.com/FpiYu34XyS</a></p>&mdash; areadne (@AreadneMaria) <a href="https://x.com/AreadneMaria/status/2114898325451444419?ref_src=twsrc%5Etfw">October 27, 2026</a></blockquote>\n';
  const post = parsePostUrl('https://x.com/AreadneMaria/status/2114898325451444419');
  const meta = fromOembed({ author_name: 'areadne', html }, post);
  assert.deepEqual(meta, { author: 'areadne', handle: 'AreadneMaria', date: '2026-10-27', lang: 'en', text: 'sheep & grass!', hasMedia: true });
  const entry = draftEntry(post, meta, 'Interaction', '2026-11-01');
  assert.equal(entry.category, 'practice'); assert.equal(entry.id, 'x-areadnemaria-444419'); assert.match(entry.focus.zh, /^TODO/); assert.match(entry.application.en, /^TODO/);
  assert.throws(() => fromOembed({ author_name: 'x', html: '<div></div>' }, post), /Unexpected oEmbed/);
});
