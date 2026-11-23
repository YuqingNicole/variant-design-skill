#!/usr/bin/env node
// Weekly discovery from curated website galleries, through the RSS feeds they publish, not by crawling their pages.
// A gallery item is a lead; what the library collects is the site itself, so each item must resolve to the site's own
// address. Candidates go to website/content/site-inbox.json; threads-publish.mjs (--inbox) opens each site, reads a
// screenshot and writes bilingual notes, crediting the gallery in `via`. The weekly pull request merges once CI passes.
// Galleries that refuse automated requests (HTTP 403) or whose feed and page give no site address are not used, and
// their protections are never worked around (docs/site-discovery.md).
// Each gallery adds at most `max` sites a run, and the inbox gets them in turns (one per gallery, then the next round), so
// the screening queue, which takes the first pending rows, never fills up from one gallery.
// Usage: node website/scripts/site-discovery.mjs [--sources a,b|all] [--days n] [--dry-run]
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readItems } from './x-publish.mjs';
import { siteInLibrary } from './threads-publish.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const inboxPath = path.resolve(here, '../content/site-inbox.json');
const configPath = path.resolve(here, '../content/site-discovery.json');
const libraryPath = path.resolve(here, '../src/inspiration-data.ts');
const agent = 'Mozilla/5.0 (compatible; VariantDesignDiscovery/1.0; +https://variantdesign.xyz/privacy)';

// How a gallery item becomes a site address. `visit-link`: the item page links the site with a "Visit"/"Launch" link.
// `image-domain`: the feed's screenshot file is named after the site's domain (studioplato.co_.jpg); the guess is kept
// only when that site's own title contains the item's name. `named-link`: the item page links the site with the item's
// name as the link text (CSS Winner's heading). `confirm: "slug"` keeps a site only when its domain and the item page's
// slug name the same thing (Mindsparkle's Visit link sometimes points at the studio that made the site, not the site).
const resolvers = ['visit-link', 'image-domain', 'named-link'];
const idPattern = /^[a-z0-9][a-z0-9-]*$/;
export function validateConfig(config) {
  const fail = message => { throw new Error(`site-discovery.json: ${message}`); };
  if (!Array.isArray(config?.sources) || !config.sources.length) fail('"sources" must be a non-empty list');
  const ids = new Set();
  for (const s of config.sources) {
    if (typeof s?.id !== 'string' || !idPattern.test(s.id) || s.id === 'all') fail(`source id ${JSON.stringify(s?.id)} must be lowercase letters, digits or hyphens, and not "all"`);
    if (ids.has(s.id)) fail(`source "${s.id}" is listed twice`);
    ids.add(s.id);
    if (typeof s.name !== 'string' || !s.name.trim()) fail(`source "${s.id}" needs a "name"`);
    if (typeof s.feed !== 'string' || !s.feed.startsWith('https://')) fail(`source "${s.id}" needs an https "feed"`);
    if (!resolvers.includes(s.resolve)) fail(`source "${s.id}": "resolve" must be one of ${resolvers.join(', ')}`);
    if (!Number.isInteger(s.days) || s.days < 1 || s.days > 60) fail(`source "${s.id}" needs "days" from 1 to 60`);
    if (!Number.isInteger(s.max) || s.max < 1 || s.max > 10) fail(`source "${s.id}" needs "max" (sites added per run) from 1 to 10`);
    if (s.titlePrefix !== undefined && typeof s.titlePrefix !== 'string') fail(`source "${s.id}": "titlePrefix" must be text`);
    if (s.pathPrefix !== undefined && (typeof s.pathPrefix !== 'string' || !s.pathPrefix.startsWith('https://'))) fail(`source "${s.id}": "pathPrefix" must be an https address`);
    if (s.confirm !== undefined && s.confirm !== 'slug') fail(`source "${s.id}": "confirm" can only be "slug"`);
  }
  return config;
}

const decode = value => value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&amp;/g, '&').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").trim();
const tag = (block, name) => { const m = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`)); return m ? decode(m[1]) : ''; };
// RSS 2.0 items only (all the configured galleries publish RSS). Returns title, item page, date and the raw item for resolvers.
export function parseFeed(xml) {
  return xml.split(/<item[\s>]/).slice(1).map(block => {
    const raw = block.split('</item>')[0];
    return { title: tag(raw, 'title'), page: tag(raw, 'link'), date: tag(raw, 'pubDate'), raw };
  }).filter(i => i.title && i.page.startsWith('https://'));
}

// The site address behind a "Visit website" / "Launch website" link, with tracking parameters removed. Gallery pages also
// list other sites with the same kind of link, so a link whose label names the item ("Visit Soma Website") wins.
export function visitLink(html, galleryHost, name = '') {
  const links = [];
  for (const m of html.matchAll(/<a\b[^>]*>/gi)) {
    const a = m[0], href = (a.match(/href="([^"]+)"/i) || [])[1];
    if (!href || !/^https:\/\//.test(href)) continue;
    const label = `${(a.match(/title="([^"]*)"/i) || [])[1] ?? ''} ${(a.match(/aria-label="([^"]*)"/i) || [])[1] ?? ''} ${html.slice(m.index + a.length, m.index + a.length + 80).split('<')[0]}`;
    if (!/\b(visit|launch)\b/i.test(label)) continue;
    try { const url = new URL(href); if (url.hostname.endsWith(galleryHost)) continue; for (const k of [...url.searchParams.keys()]) if (/^(ref|via|utm_.*)$/i.test(k)) url.searchParams.delete(k); links.push({ href: url.href, named: !!name && letters(label).includes(letters(name)) }); } catch { continue; }
  }
  return (links.find(l => l.named) ?? links[0])?.href ?? null;
}
// The external link whose visible text is the item's name: <h1><a href="https://m0r1m1ch1.com">MORIMICHI</a></h1>.
export function namedLink(html, galleryHost, name) {
  const want = letters(name);
  if (want.length < 3) return null;
  for (const m of html.matchAll(/<a\b([^>]*)>([\s\S]{0,200}?)<\/a>/gi)) {
    const href = (m[1].match(/href="([^"]+)"/i) || [])[1];
    if (!href || !/^https?:\/\//.test(href) || letters(decode(m[2].replace(/<[^>]+>/g, ''))) !== want) continue;
    try { const url = new URL(href); if (!url.hostname.endsWith(galleryHost)) return url.href; } catch { continue; }
  }
  return null;
}
// mindsparklemag.com/website/study-hall-agency-website and studyhall.design name the same thing; …/website/opentrade and
// shoreditchdesign.com do not. Compares the domain's first label with the slug, letters only.
export function slugMatches(page, link) {
  const slug = letters(new URL(page).pathname.split('/').filter(Boolean).pop() ?? ''), label = letters(new URL(link).hostname.replace(/^www\./, '').split('.')[0]);
  return label.length >= 3 && slug.length >= 3 && (slug.includes(label) || label.includes(slug));
}
// studioplato.co_.jpg → studioplato.co, louielouie.co_.nz_.jpg → louielouie.co.nz. A guess; `nameMatches` must confirm it.
export function imageDomain(raw) {
  const src = (raw.match(/<img[^>]+src="([^"]+)"/i) || [])[1];
  const file = src ? decodeURIComponent(src.split('/').pop()).replace(/\.(jpe?g|png|webp)$/i, '').replace(/-\d+x\d+$/, '') : '';
  const domain = file.replace(/_\./g, '.').replace(/_$/, '').toLowerCase();
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(domain) && domain.includes('.') ? domain : null;
}
const letters = value => value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]/g, '');
export function nameMatches(name, html) {
  const title = tag(html, 'title') + ' ' + ((html.match(/<meta[^>]+property="og:(?:title|site_name)"[^>]+content="([^"]*)"/i) || [])[1] ?? '');
  const want = letters(name);
  return want.length >= 3 && letters(title).includes(want);
}

async function get(url) {
  const res = await fetch(url, { headers: { 'user-agent': agent, accept: 'text/html,application/rss+xml,application/xml' }, redirect: 'follow', signal: AbortSignal.timeout(20000) });
  // CSS Winner's feed is ISO-8859-1; res.text() would read every page as UTF-8.
  const charset = (res.headers.get('content-type')?.match(/charset="?([\w-]+)/i) || [])[1] ?? 'utf-8';
  let decoder; try { decoder = new TextDecoder(charset); } catch { decoder = new TextDecoder(); }
  return { status: res.status, url: res.url, text: res.ok ? decoder.decode(await res.arrayBuffer()) : '' };
}

export async function resolveSite(source, item, fetchPage = get) {
  if (source.resolve === 'visit-link' || source.resolve === 'named-link') {
    const page = await fetchPage(item.page);
    if (!page.text) throw new Error(`gallery page answered HTTP ${page.status}`);
    const host = new URL(source.feed).hostname.replace(/^www\./, '');
    const link = source.resolve === 'visit-link' ? visitLink(page.text, host, item.name) : namedLink(page.text, host, item.name);
    return link && source.confirm === 'slug' && !slugMatches(item.page, link) ? null : link;
  }
  const domain = imageDomain(item.raw);
  if (!domain) return null;
  const site = await fetchPage(`https://${domain}/`);
  return site.text && nameMatches(item.title, site.text) ? `https://${domain}/` : null;
}

const hostOf = url => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; } };
export async function run({ sources: only = '', days, dryRun = false, now = new Date(), config = configPath, inbox: inboxFile = inboxPath, library = libraryPath, fetchPage = get } = {}) {
  const settings = validateConfig(JSON.parse(await fs.readFile(config, 'utf8')));
  const wanted = only && only !== 'all' ? new Set(only.split(',')) : null;
  const chosen = settings.sources.filter(s => wanted ? wanted.has(s.id) : s.weekly !== false);
  let inbox; try { inbox = JSON.parse(await fs.readFile(inboxFile, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; inbox = { candidates: [] }; }
  const items = readItems(await fs.readFile(library, 'utf8'));
  const seenPages = new Set(inbox.candidates.map(c => c.url)), seenHosts = new Set(inbox.candidates.map(c => hostOf(c.link)));
  const summary = { added: [], skipped: [], unresolved: [], failed: [] }, stamp = now.toISOString(), found = [];
  for (const source of chosen) {
    let feedItems;
    try { const feed = await fetchPage(source.feed); if (!feed.text) throw new Error(`feed answered HTTP ${feed.status}`); feedItems = parseFeed(feed.text); }
    catch (error) { summary.failed.push([source.id, error.message]); continue; }
    const since = now.getTime() - (days ?? source.days) * 864e5;
    const recent = feedItems.filter(i => (!source.titlePrefix || i.title.startsWith(source.titlePrefix)) && (!source.pathPrefix || i.page.startsWith(source.pathPrefix))).filter(i => !i.date || Date.parse(i.date) >= since);
    const mine = [];
    for (const item of recent) {
      if (mine.length >= source.max) { summary.skipped.push([source.id, item.title, `over this gallery's ${source.max} a run`]); continue; }
      const name = source.titlePrefix ? item.title.slice(source.titlePrefix.length).trim() : item.title;
      if (seenPages.has(item.page)) { summary.skipped.push([source.id, name, 'already in the inbox']); continue; }
      let link;
      try { link = await resolveSite(source, { ...item, name }, fetchPage); } catch (error) { summary.failed.push([source.id, `${name}: ${error.message}`]); continue; }
      if (!link) { summary.unresolved.push([source.id, name]); continue; }
      const own = siteInLibrary(items, link);
      if (own) { summary.skipped.push([source.id, name, `library has it (${own.id})`]); continue; }
      if (seenHosts.has(hostOf(link))) { summary.skipped.push([source.id, name, 'site already in the inbox']); continue; }
      const candidate = { id: `${source.id}-${hostOf(link).replace(/[^a-z0-9]+/g, '-')}`, source: source.id, sourceName: source.name, url: item.page, link, title: name, publishedAt: item.date ? new Date(item.date).toISOString() : null, foundAt: stamp, status: 'pending' };
      mine.push(candidate); seenPages.add(item.page); seenHosts.add(hostOf(link));
      summary.added.push([source.id, name, link]);
    }
    found.push(mine);
  }
  // In turns: the first site from each gallery, then the second from each, and so on.
  for (let i = 0; found.some(list => i < list.length); i++) for (const list of found) if (list[i]) inbox.candidates.push(list[i]);
  if (!dryRun && summary.added.length) {
    inbox.updatedAt = stamp;
    await fs.writeFile(`${inboxFile}.tmp`, `${JSON.stringify(inbox, null, 2)}\n`);
    await fs.rename(`${inboxFile}.tmp`, inboxFile);
  }
  return summary;
}

export function report(s) {
  const lines = [`Added ${s.added.length}, skipped ${s.skipped.length}, no site address ${s.unresolved.length}, failed ${s.failed.length}.`];
  for (const [src, name, link] of s.added) lines.push(`+ ${src}: ${name} → ${link}`);
  for (const [src, name, why] of s.skipped) lines.push(`= ${src}: ${name} (${why})`);
  for (const [src, name] of s.unresolved) lines.push(`? ${src}: ${name} (no site address found)`);
  for (const [src, why] of s.failed) lines.push(`! ${src}: ${why}`);
  return lines.join('\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2), at = flag => args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined;
  const days = at('--days') === undefined ? undefined : Number(at('--days'));
  if (days !== undefined && (!Number.isInteger(days) || days < 1)) { console.error('Usage: site-discovery.mjs [--sources a,b|all] [--days n] [--dry-run]'); process.exit(2); }
  console.log(report(await run({ sources: at('--sources') ?? '', days, dryRun: args.includes('--dry-run') })));
}
