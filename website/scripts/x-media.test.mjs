import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { pickMedia, syndicationToken, collect } from './x-media.mjs';

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

const answer = poster => ({ ok: true, json: async () => ({ mediaDetails: [{ type: 'video', media_url_https: poster, video_info: { variants: [v(1152, 720, 1)] } }] }) });

test('a run fetches only posts without a record and leaves the stored ones as they are', async () => {
  const stored = { old: { video: 'https://video.twimg.com/old.mp4', poster: 'https://pbs.twimg.com/old.jpg', fetchedAt: '2026-11-01' } };
  const asked = [];
  const { out, added } = await collect({ posts: [{ id: 'old', post: { id: '1' } }, { id: 'fresh', post: { id: '2' } }], stored, today: '2026-11-19',
    fetchJson: async id => { asked.push(id); return answer('https://pbs.twimg.com/new.jpg'); } });
  assert.deepEqual(asked, ['2']); assert.deepEqual(added, ['fresh']);
  assert.equal(out.old, stored.old); assert.equal(out.fresh.poster, 'https://pbs.twimg.com/new.jpg'); assert.equal(out.fresh.fetchedAt, '2026-11-19');
});

test('a post X does not answer for adds nothing, and refresh re-reads every post but keeps a record when X gives none', async () => {
  const stored = { a: { video: 'x', poster: 'p', fetchedAt: 'then' }, b: { video: 'y', poster: 'q', fetchedAt: 'then' } };
  const posts = [{ id: 'a', post: { id: '1' } }, { id: 'b', post: { id: '2' } }, { id: 'c', post: { id: '3' } }];
  const none = await collect({ posts, stored, fetchJson: async () => ({ ok: false, status: 404 }) });
  assert.deepEqual(none.added, []); assert.deepEqual(Object.keys(none.out), ['a', 'b']);
  const asked = [];
  const again = await collect({ posts, stored, refresh: true, today: '2026-11-19', fetchJson: async id => { asked.push(id); if (id === '2') throw new Error('timeout'); return id === '1' ? answer('https://pbs.twimg.com/a2.jpg') : { ok: false, status: 404 }; } });
  assert.deepEqual(asked, ['1', '2', '3']); assert.deepEqual(again.added, ['a']);
  assert.equal(again.out.a.poster, 'https://pbs.twimg.com/a2.jpg'); assert.equal(again.out.b, stored.b);
});
