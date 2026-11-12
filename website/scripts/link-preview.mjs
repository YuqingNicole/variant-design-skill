#!/usr/bin/env node
// Reads each reference's own link preview: the og:/twitter: title, description and image a site publishes so
// that shared links unfurl. One request per link, like a chat app's unfurl; nothing else on the page is read.
// We store only the image's address. On the site, Vercel fetches it and serves a resized copy, so each image host
// must be listed in vercel.json `images.remotePatterns`; the CLI keeps that list in step.
// Usage: node website/scripts/link-preview.mjs   (rewrites src/link-previews.json)
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const entities = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", apos: "'", nbsp: ' ' };
const decode = s => s.replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (all, e) => e[0] === '#' ? String.fromCodePoint(e[1] === 'x' ? parseInt(e.slice(2), 16) : +e.slice(1)) : entities[e] ?? all);
const attr = (tag, name) => { const m = new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>\`]+))`, 'i').exec(tag); return m ? decode(m[1] ?? m[2] ?? m[3]).trim() : ''; };

export function parsePreview(html, base) {
  const meta = {};
  for (const [tag] of html.matchAll(/<meta\b[^>]*>/gi)) {
    const key = (attr(tag, 'property') || attr(tag, 'name')).toLowerCase(), content = attr(tag, 'content');
    if (key && content && !(key in meta)) meta[key] = content;
  }
  let image = null;
  for (const raw of ['og:image:secure_url', 'og:image', 'twitter:image', 'twitter:image:src'].map(k => meta[k]).filter(Boolean)) {
    try { const u = new URL(raw, base); if (u.protocol === 'https:') { image = u.href; break; } } catch {}
  }
  const title = meta['og:title'] || meta['twitter:title'] || decode(/<title[^>]*>([^<]*)<\/title>/i.exec(html)?.[1] ?? '').trim();
  const description = meta['og:description'] || meta['twitter:description'] || meta.description || '';
  // The page's own language, so screen readers read its title and description with the right rules.
  const lang = /<html\b[^>]*>/i.exec(html)?.[0].match(/\slang\s*=\s*["']?([A-Za-z]{2,3}(?:-[A-Za-z0-9]+)*)/)?.[1] ?? '';
  return image ? { image, title, description, lang } : null;
}

// The https image hosts of the previews, added to the existing remotePatterns (others are kept). Vercel accepts at most
// 50 patterns, so once the list is full the hosts used by the most previews come first and the rest are left out: their
// cards fall back to the original image after the optimizer refuses (InspirationPage `sized`), which costs one request.
export const imageHostCap = 50;
export function withImageHosts(config, previews, cap = imageHostCap) {
  const patterns = config.images?.remotePatterns ?? [];
  const known = new Set(patterns.map(p => p.hostname));
  const uses = {};
  for (const p of Object.values(previews)) if (p.image?.startsWith('https://')) { const h = new URL(p.image).hostname; uses[h] = (uses[h] ?? 0) + 1; }
  const added = Object.keys(uses).filter(h => !known.has(h)).sort((a, b) => uses[b] - uses[a] || a.localeCompare(b)).slice(0, Math.max(0, cap - patterns.length));
  return { ...config, images: { ...config.images, remotePatterns: [...patterns, ...added.map(hostname => ({ protocol: 'https', hostname }))] } };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const source = fs.readFileSync(new URL('../src/inspiration-data.ts', import.meta.url), 'utf8');
  const from = source.indexOf('[', source.indexOf('export const inspirationItems = '));
  const items = JSON.parse(source.slice(from, source.indexOf('\n];', from) + 2)).filter(i => !i.post);
  // A failed request keeps the stored record; only a page that loads without a preview drops it.
  const stored = JSON.parse(fs.readFileSync(new URL('../src/link-previews.json', import.meta.url), 'utf8'));
  const out = {}, today = new Date().toISOString().slice(0, 10);
  for (const i of items) {
    try {
      const res = await fetch(i.url, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; VariantDesignLinkPreview/1.0)', accept: 'text/html' }, signal: AbortSignal.timeout(15000) });
      const preview = res.ok ? parsePreview(await res.text(), res.url) : null;
      if (preview) out[i.id] = { ...preview, fetchedAt: today };
      else if (!res.ok && stored[i.id]) out[i.id] = stored[i.id];
      console.error(`${preview ? 'ok  ' : 'none'} ${i.id}${res.ok ? '' : ` (${res.status})`}`);
    } catch (e) { if (stored[i.id]) out[i.id] = stored[i.id]; console.error(`fail ${i.id} (${e.message})`); }
  }
  fs.writeFileSync(new URL('../src/link-previews.json', import.meta.url), `${JSON.stringify(out, null, 2)}\n`);
  const vercel = new URL('../../vercel.json', import.meta.url);
  fs.writeFileSync(vercel, `${JSON.stringify(withImageHosts(JSON.parse(fs.readFileSync(vercel, 'utf8')), out), null, 2)}\n`);
}
