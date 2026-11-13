import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const hrefs = [...html.matchAll(/<link rel="(icon|apple-touch-icon|manifest)"[^>]*href="([^"?]+)/g)].map(m => [m[1], m[2]]);

test('every icon and the manifest that index.html links ships in public/', () => {
  assert.ok(hrefs.some(([rel, href]) => rel === 'manifest' && href === '/site.webmanifest'));
  for (const [, href] of hrefs) assert.ok(fs.existsSync(path.join(root, 'public', href)), href);
});

test('the favicon covers 16, 32 and 48 pixels, and the manifest offers 192 and 512', () => {
  const ico = fs.readFileSync(path.join(root, 'public/favicon.ico'));
  assert.equal(ico.readUInt16LE(2), 1, 'ICO type');
  const sizes = Array.from({ length: ico.readUInt16LE(4) }, (_, i) => ico[6 + i * 16]);
  assert.deepEqual(sizes, [16, 32, 48]);
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'public/site.webmanifest'), 'utf8'));
  assert.deepEqual(manifest.icons.map(i => i.sizes).sort(), ['192x192', '512x512']);
  for (const icon of manifest.icons) {
    const png = fs.readFileSync(path.join(root, 'public', icon.src)), [w, h] = [png.readUInt32BE(16), png.readUInt32BE(20)];
    assert.equal(`${w}x${h}`, icon.sizes, icon.src);
  }
});
