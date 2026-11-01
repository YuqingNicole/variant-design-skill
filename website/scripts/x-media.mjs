#!/usr/bin/env node
// Reads the video address, poster and author avatar of each X post entry from the endpoint X's own embed widget
// uses (cdn.syndication.twimg.com). The maintainer chose this on 2026-11-01 over the paid X API; it is
// undocumented and may stop working, in which case cards fall back to the poster or the stored text.
// Nothing is downloaded: the page streams the video from video.twimg.com.
// Usage: node website/scripts/x-media.mjs   (rewrites src/x-media.json)
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

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const source = fs.readFileSync(new URL('../src/inspiration-data.ts', import.meta.url), 'utf8');
  const from = source.indexOf('[', source.indexOf('export const inspirationItems = '));
  const posts = JSON.parse(source.slice(from, source.indexOf('\n];', from) + 2)).filter(i => i.post);
  const file = new URL('../src/x-media.json', import.meta.url), stored = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
  const out = {}, today = new Date().toISOString().slice(0, 10);
  for (const { id, post } of posts) {
    try {
      const res = await fetch(`https://cdn.syndication.twimg.com/tweet-result?id=${post.id}&lang=en&token=${syndicationToken(post.id)}`, { signal: AbortSignal.timeout(15000) });
      const media = res.ok ? pickMedia(await res.json()) : null;
      if (media) out[id] = { ...media, fetchedAt: today }; else if (stored[id]) out[id] = stored[id];
      console.error(`${media ? 'ok  ' : 'none'} ${id}${res.ok ? '' : ` (${res.status})`}`);
    } catch (e) { if (stored[id]) out[id] = stored[id]; console.error(`fail ${id} (${e.message})`); }
  }
  fs.writeFileSync(file, `${JSON.stringify(out, null, 2)}\n`);
}
