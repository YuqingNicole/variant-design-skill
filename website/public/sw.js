// Variant Design service worker. It does two things: shows an offline page when a navigation fails, and keeps hashed build files
// so a repeat visit does not download them again. It never touches other origins, non-GET requests, /api/, or any address with a
// query string (sign-in callbacks carry one), and it never stores a page that was redirected or answered with an error.
const VERSION = 'v1', SHELL = `vd-shell-${VERSION}`, PAGES = `vd-pages-${VERSION}`, ASSETS = `vd-assets-${VERSION}`, OFFLINE = '/offline.html';

const storable = r => r.ok && r.type === 'basic' && !r.redirected;
async function keep(name, request, response, max) {
  const cache = await caches.open(name);
  await cache.put(request, response);
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - max)).map(k => cache.delete(k)));
}

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll([OFFLINE, '/icon-192.png', '/favicon.svg'])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('vd-') && ![SHELL, PAGES, ASSETS].includes(k)).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

// The network answers first; the stored copy is only for when it cannot.
async function navigate(e) {
  try {
    const response = await fetch(e.request);
    if (storable(response)) e.waitUntil(keep(PAGES, e.request, response.clone(), 40));
    return response;
  } catch {
    return (await caches.match(e.request, { cacheName: PAGES })) || (await caches.match(OFFLINE, { cacheName: SHELL })) || Response.error();
  }
}
// Files under /assets/ have the build hash in their name, so a stored copy never goes stale.
async function hashed(e) {
  const cached = await caches.match(e.request, { cacheName: ASSETS });
  if (cached) return cached;
  const response = await fetch(e.request);
  if (storable(response)) e.waitUntil(keep(ASSETS, e.request, response.clone(), 120));
  return response;
}

self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin || u.pathname.startsWith('/api/')) return;
  if (r.mode === 'navigate') { if (!u.search) e.respondWith(navigate(e)); }
  else if (u.pathname.startsWith('/assets/')) e.respondWith(hashed(e));
});
