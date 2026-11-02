import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { pickMedia, syndicationToken } from './x-media.mjs';

const v = (w, h, bitrate) => ({ content_type: 'video/mp4', bitrate, url: `https://video.twimg.com/amplify_video/1/vid/avc1/${w}x${h}/a.mp4` });

test('picks the largest mp4 up to 720p, with poster, size and a larger avatar', () => {
  const json = { user: { profile_image_url_https: 'https://pbs.twimg.com/profile_images/1/a_normal.jpg' },
    mediaDetails: [{ type: 'video', media_url_https: 'https://pbs.twimg.com/thumb.jpg', original_info: { width: 1440, height: 900 },
      video_info: { variants: [{ content_type: 'application/x-mpegURL', url: 'https://video.twimg.com/pl/a.m3u8' }, v(432, 270, 256000), v(1152, 720, 2176000), v(1440, 900, 10368000)] } }] };
  assert.deepEqual(pickMedia(json), { video: 'https://video.twimg.com/amplify_video/1/vid/avc1/1152x720/a.mp4', poster: 'https://pbs.twimg.com/thumb.jpg', width: 1440, height: 900, avatar: 'https://pbs.twimg.com/profile_images/1/a_bigger.jpg' });
});

test('a post without video yields nothing; the token matches the embed widget', () => {
  assert.equal(pickMedia({ mediaDetails: [{ type: 'photo' }] }), null);
  assert.equal(pickMedia({}), null);
  assert.match(syndicationToken('2114898325451444419'), /^[0-9a-z]+$/);
});

test('stored media belongs to X post entries and streams from X', () => {
  const source = fs.readFileSync(new URL('../src/inspiration-data.ts', import.meta.url), 'utf8');
  const from = source.indexOf('[', source.indexOf('export const inspirationItems = '));
  const items = new Map(JSON.parse(source.slice(from, source.indexOf('\n];', from) + 2)).map(i => [i.id, i]));
  for (const [id, m] of Object.entries(JSON.parse(fs.readFileSync(new URL('../src/x-media.json', import.meta.url), 'utf8')))) {
    assert.ok(items.get(id)?.post, id);
    assert.match(m.video, /^https:\/\/video\.twimg\.com\/[^?]+\.mp4(\?tag=\d+)?$/, id);
    assert.match(m.poster, /^https:\/\/pbs\.twimg\.com\//, id);
    assert.ok(m.width > 0 && m.height > 0, id);
  }
});
