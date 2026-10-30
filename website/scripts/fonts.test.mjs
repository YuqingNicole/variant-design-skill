import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const dir = new URL('../src/fonts/lxgw-neo-zhisong/', import.meta.url);

test('LXGW Neo ZhiSong slices match their CSS and ship with the IPA license', () => {
 const css = fs.readFileSync(new URL('index.css', dir), 'utf8');
 const urls = [...css.matchAll(/url\(\.\/([0-9]{3}\.woff2)\)/g)].map(m => m[1]);
 const files = fs.readdirSync(dir).filter(f => f.endsWith('.woff2'));
 assert.equal(urls.length, 100);
 assert.deepEqual([...urls].sort(), [...files].sort());
 assert.equal(fs.readFileSync(new URL('./zhisong-ranges.txt', import.meta.url), 'utf8').trim().split(/\s+/).length, urls.length);
 const licenses = fs.readFileSync(new URL('../public/fonts/LICENSES.txt', import.meta.url), 'utf8');
 assert.match(licenses, /IPA Font License Agreement v1\.0/);
 assert.match(licenses, /moji\.or\.jp\/ipafont\/ipafontdownload/);
});
