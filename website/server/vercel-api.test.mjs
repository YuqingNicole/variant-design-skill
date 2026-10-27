import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import handler from '../../api/index.mjs';
async function call(url, method = 'POST', body = { brief: 'Test' }) {
  const request = Readable.from([Buffer.from(JSON.stringify(body))]); request.url = url; request.method = method; request.headers = { host: 'variant.example', origin: 'https://variant.example' };
  let status, payload; const response = { statusCode: 200, writeHead(s) { status = s; }, end(s) { payload = s ? JSON.parse(s) : undefined; status ??= this.statusCode; } };
  await handler(request, response); return { status, payload };
}
test('model routes stay off on the published site unless explicitly enabled', async () => {
  const old = { routes: process.env.PUBLIC_MODEL_ROUTES, key: process.env.ANTHROPIC_API_KEY };
  try {
    delete process.env.PUBLIC_MODEL_ROUTES; process.env.ANTHROPIC_API_KEY = 'test-only';
    assert.deepEqual(await call('/api/status', 'GET'), { status: 200, payload: { configured: false } });
    for (const route of ['/api/generate', '/api/canvas/documents', '/api/canvas/suggest']) assert.equal((await call(route)).status, 404);
    process.env.PUBLIC_MODEL_ROUTES = '1';
    assert.equal((await call('/api/status', 'GET')).payload.configured, true);
    assert.equal((await call('/api/canvas/projects')).status, 403);
  } finally {
    for (const [name, value] of [['PUBLIC_MODEL_ROUTES', old.routes], ['ANTHROPIC_API_KEY', old.key]]) if (value === undefined) delete process.env[name]; else process.env[name] = value;
  }
});
