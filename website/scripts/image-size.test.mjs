import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { imageSize } from './image-size.mjs';

test('reads width and height from PNG, GIF, JPEG and WebP headers', () => {
  const png = Buffer.alloc(24); png.writeUInt32BE(0x89504e47, 0); png.write('IHDR', 12, 'ascii'); png.writeUInt32BE(1200, 16); png.writeUInt32BE(630, 20);
  assert.deepEqual(imageSize(png), { width: 1200, height: 630 });
  const gif = Buffer.alloc(10); gif.write('GIF89a', 0, 'ascii'); gif.writeUInt16LE(320, 6); gif.writeUInt16LE(180, 8);
  assert.deepEqual(imageSize(gif), { width: 320, height: 180 });
  // SOI, an APP0 segment to skip, then SOF0: length, precision, height 900, width 1600.
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x04, 0x00, 0x00, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x03, 0x84, 0x06, 0x40, 0x03, 0, 0, 0, 0, 0]);
  assert.deepEqual(imageSize(jpeg), { width: 1600, height: 900 });
  const webp = Buffer.alloc(30); webp.write('RIFF', 0, 'ascii'); webp.write('WEBP', 8, 'ascii'); webp.write('VP8X', 12, 'ascii'); webp.writeUIntLE(1199, 24, 3); webp.writeUIntLE(629, 27, 3);
  assert.deepEqual(imageSize(webp), { width: 1200, height: 630 });
  assert.equal(imageSize(Buffer.from('<!doctype html>')), null);
});

test('stored preview sizes are whole positive numbers when present', () => {
  const previews = JSON.parse(fs.readFileSync(new URL('../src/link-previews.json', import.meta.url), 'utf8'));
  for (const [id, p] of Object.entries(previews)) if ('width' in p || 'height' in p) assert.ok(Number.isInteger(p.width) && p.width > 0 && Number.isInteger(p.height) && p.height > 0, id);
});
