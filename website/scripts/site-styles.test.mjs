import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

// Pages load on demand but their styles must not: a stylesheet left out of site-styles.ts would ship in a page chunk,
// arrive after the others and change which rule wins.
test('every stylesheet a source file imports is listed in site-styles.ts', () => {
  const dir = new URL('../src/', import.meta.url);
  const listed = new Set([...fs.readFileSync(new URL('site-styles.ts', dir), 'utf8').matchAll(/^import "(.+\.css)";$/gm)].map(m => m[1]));
  const missing = fs.readdirSync(dir).filter(f => /\.tsx?$/.test(f) && f !== 'site-styles.ts')
    .flatMap(f => [...fs.readFileSync(new URL(f, dir), 'utf8').matchAll(/^import ['"](.+\.css)['"];?$/gm)].map(m => `${f}: ${m[1]}`))
    .filter(entry => !listed.has(entry.split(': ')[1]));
  assert.deepEqual(missing, []);
});
