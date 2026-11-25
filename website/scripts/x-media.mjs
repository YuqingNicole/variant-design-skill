#!/usr/bin/env node
// Reads the video address, poster and author avatar of each X post entry from the endpoint X's own embed widget
// uses (cdn.syndication.twimg.com). An entry that stands for one picture of a photo post (`post.photo`, X's 1-based
// /photo/N index) gets that picture as its poster and no video. The maintainer chose this on 2026-11-01 over the paid X API; it is
// undocumented and may stop working, in which case cards fall back to the poster or the stored text.
// Nothing is downloaded: the page streams the video from video.twimg.com.
// Usage: node website/scripts/x-media.mjs [--refresh]   (adds records for new posts to src/x-media.json; --refresh re-reads every post)
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

// The token the embed widget sends with each request, derived from the post id.
export const syndicationToken = id => ((Number(id) / 1e15) * Math.PI).toString(36).replace(/(0+|\.)/g, '');

// Cards are about 500px wide, so 720p is enough on 2x screens; larger files only slow the first frame.
export function pickMedia(json, maxHeight = 720) {
  const media = json.mediaDetails?.find(m => m.type === 'video' || m.type === 'animated_gif');
  const mp4 = (media?.video_info?.variants ?? []).filter(v => v.content_type === 'video/mp4' && v.url?.startsWith('https://video.twimg.com/'));
  const height = v => +(/\/(\d+)x(\d+)\//.exec(v.url)?.[2] ?? 0);
  const video = mp4.filter(v => height(v) <= maxHeight).sort((a, b) => height(b) - height(a))[0] ?? mp4.sort((a, b) => height(a) - height(b))[0];
  if (!video) return null;
  const { width, height: h } = media.original_info ?? {};
  return { video: video.url, poster: media.media_url_https, width, height: h, avatar: json.user?.profile_image_url_https?.replace('_normal.', '_bigger.') ?? null };
}

// One picture of a photo post, as a poster-only record; null when the post has no picture at that index.
export function pickPhoto(json, photo) {
  const media = (json.mediaDetails ?? []).filter(m => m.type === 'photo')[photo - 1];
  if (!media?.media_url_https?.startsWith('https://pbs.twimg.com/')) return null;
  const { width, height } = media.original_info ?? {};
  return { poster: media.media_url_https, width, height, avatar: json.user?.profile_image_url_https?.replace('_normal.', '_bigger.') ?? null };
}

// Only posts with no stored record are fetched, so a run adds records and never rewrites the ones already there (the poster and
// video addresses X returns change between calls). `refresh` re-reads every post, keeping the stored record when X gives none.
export async function collect({ posts, stored = {}, refresh = false, today = new Date().toISOString().slice(0, 10), fetchJson, log = () => {} }) {
  const out = { ...stored }, added = [], answers = new Map();
  // Every picture of a photo post is its own entry; the post is asked for once per run.
  const answer = id => { if (!answers.has(id)) answers.set(id, fetchJson(id).then(async res => ({ status: res.status, json: res.ok ? await res.json() : null }))); return answers.get(id); };
  for (const { id, post } of posts) {
    if (stored[id] && !refresh) continue;
    try {
      const { status, json } = await answer(post.id);
      const media = json && (post.photo ? pickPhoto(json, post.photo) : pickMedia(json));
      if (media) { out[id] = { ...media, fetchedAt: today }; added.push(id); }
      log(`${media ? 'ok  ' : 'none'} ${id}${json ? '' : ` (${status})`}`);
    } catch (e) { log(`fail ${id} (${e.message})`); }
  }
  return { out, added };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const source = fs.readFileSync(new URL('../src/inspiration-data.ts', import.meta.url), 'utf8');
  const from = source.indexOf('[', source.indexOf('export const inspirationItems = '));
  const posts = JSON.parse(source.slice(from, source.indexOf('\n];', from) + 2)).filter(i => i.post);
  const file = new URL('../src/x-media.json', import.meta.url), stored = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
  const fetchJson = id => fetch(`https://cdn.syndication.twimg.com/tweet-result?id=${id}&lang=en&token=${syndicationToken(id)}`, { signal: AbortSignal.timeout(15000) });
  const { out, added } = await collect({ posts, stored, refresh: process.argv.includes('--refresh'), fetchJson, log: m => console.error(m) });
  if (added.length) fs.writeFileSync(file, `${JSON.stringify(out, null, 2)}\n`);
  console.error(`${added.length} record${added.length === 1 ? '' : 's'} written${added.length ? '' : '; nothing to add'}`);
}
