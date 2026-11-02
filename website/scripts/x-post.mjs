#!/usr/bin/env node
// Drafts a Best practice entry from a public X post through X's official oEmbed endpoint (the one its embed
// button uses). It records only author, date, language and text; media stays on X and is shown through X's
// own embed on request. Our notes (focus, application) are left for a person who has watched the post.
// Usage: node website/scripts/x-post.mjs https://x.com/<handle>/status/<id> [--tag Interaction]
import { pathToFileURL } from 'node:url';

export function parsePostUrl(url) {
  const m = /^https:\/\/(?:x|twitter)\.com\/([A-Za-z0-9_]{1,15})\/status\/(\d{5,25})(?:[/?#].*)?$/.exec(url);
  if (!m) throw new Error(`Not an X post URL: ${url}`);
  return { handle: m[1], id: m[2], url: `https://x.com/${m[1]}/status/${m[2]}` };
}
const entities = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", mdash: '—', nbsp: ' ' };
const decode = s => s.replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (all, e) => e[0] === '#' ? String.fromCodePoint(e[1] === 'x' ? parseInt(e.slice(2), 16) : +e.slice(1)) : entities[e] ?? all);
// The oEmbed blockquote is `<p lang>text</p>&mdash; Name (@handle) <a>Month D, YYYY</a>`; media links are pic.twitter.com.
export function fromOembed(json, post) {
  const p = /<p lang="([^"]*)"[^>]*>([\s\S]*?)<\/p>/.exec(json.html);
  const date = /<a href="[^"]*">([A-Z][a-z]+ \d{1,2}, \d{4})<\/a><\/blockquote>/.exec(json.html);
  if (!p || !date) throw new Error('Unexpected oEmbed markup');
  const text = decode(p[2].replace(/<br\s*\/?>/g, '\n').replace(/<a [^>]*>pic\.twitter\.com\/\w+<\/a>/g, '').replace(/<[^>]+>/g, '')).trim();
  const d = new Date(`${date[1]} UTC`);
  return { author: decode(json.author_name), handle: post.handle, date: d.toISOString().slice(0, 10), lang: p[1], text, hasMedia: /pic\.twitter\.com/.test(json.html) };
}
export function draftEntry(post, meta, tag = 'Interaction', today = new Date().toISOString().slice(0, 10)) {
  return { id: `x-${post.handle.toLowerCase()}-${post.id.slice(-6)}`, name: 'TODO', category: 'practice', tag, url: post.url, source: 'link-only',
    focus: { zh: 'TODO 研究什么', en: 'TODO Study' }, application: { zh: 'TODO 用在哪里', en: 'TODO Apply' }, publisher: `${meta.author} (@${meta.handle})`, kind: 'social-post',
    designer: meta.author, checkedAt: today, verification: 'public-post', mobile: 'not-tested', post: { id: post.id, author: meta.author, handle: meta.handle, date: meta.date, lang: meta.lang, text: meta.text, hasMedia: meta.hasMedia } };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [url, ...rest] = process.argv.slice(2), tag = rest[rest.indexOf('--tag') + 1];
  const post = parsePostUrl(url ?? '');
  const res = await fetch(`https://publish.x.com/oembed?url=${encodeURIComponent(post.url)}&omit_script=1&dnt=1`);
  if (!res.ok) throw new Error(`oEmbed ${res.status}: the post may be private, deleted or age-restricted`);
  console.log(JSON.stringify(draftEntry(post, fromOembed(await res.json(), post), rest.includes('--tag') ? tag : undefined), null, 2));
}
