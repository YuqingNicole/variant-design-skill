import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('Forma lab page and assets have stable standalone routes', async () => {
  const config = JSON.parse(await readFile(new URL('../../vercel.json', import.meta.url), 'utf8'));
  for (const source of ['/lab/forma', '/lab/forma/']) {
    assert.ok(config.rewrites.some(rule => rule.source === source && rule.destination === '/lab/forma/index.html'));
  }
  const html = await readFile(new URL('../public/lab/forma/index.html', import.meta.url), 'utf8');
  assert.match(html, /\/lab\/forma\/style\.css/);
  assert.match(html, /\/lab\/forma\/app\.js/);
  const app = await readFile(new URL('../public/lab/forma/app.js', import.meta.url), 'utf8');
  assert.match(app, /\/lab\/forma\/perfume-demo\.png/);
  assert.match(app, /localStorage/);
});
