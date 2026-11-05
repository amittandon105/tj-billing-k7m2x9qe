// Keeps the sign-in page so the app still opens when the internet is down. Always tries the internet first, so updates arrive at once.
const CACHE = 'tj-app';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin || r.mode !== 'navigate') return;
  e.respondWith(fetch(r).then(res => { if (res.ok){ const copy = res.clone(); caches.open(CACHE).then(c => c.put(self.registration.scope, copy)); } return res; })
    .catch(() => caches.match(self.registration.scope).then(hit => hit || new Response('You are offline, and this laptop has not opened the app before.', {status: 503}))));
});
