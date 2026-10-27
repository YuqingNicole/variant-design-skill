import { handleApi } from '../website/server/api-handler.mjs';
// Vercel entry for the website's /api routes. Projects are not stored here: off loopback hosts
// the canvas store routes refuse with 403, and web mode keeps projects in the visitor's browser.
// Model routes spend the configured key for every visitor, so they stay off unless the project
// sets PUBLIC_MODEL_ROUTES=1 (RFC-002 §7).
export default async function handler(request, response) {
  const pathname = new URL(request.url || '/', 'http://localhost').pathname;
  if (process.env.PUBLIC_MODEL_ROUTES !== '1') {
    const status = pathname === '/api/status' && request.method === 'GET';
    response.writeHead(status ? 200 : 404, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
    response.end(JSON.stringify(status ? { configured: false } : { error: 'not_found' }));
    return;
  }
  if (!(await handleApi(request, response))) { response.statusCode = 404; response.end(); }
}
