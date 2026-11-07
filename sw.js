// Keeps the sign-in page so the app still opens when the internet is down. Always tries the internet first, so updates arrive at once.
const CACHE = 'tj-app-v2';
const PRECACHE = ['/', '/index.html', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png', '/sw.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()).catch(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;

  if (r.mode === 'navigate') {
    e.respondWith(
      fetch(r).then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put('/', copy));
        }
        return res;
      }).catch(() => caches.match('/').then(hit => hit || caches.match('/index.html').then(h2 => h2 || new Response('You are offline, and this device has not opened the app before.', { status: 503, headers: { 'Content-Type': 'text/plain' } }))))
    );
    return;
  }

  // Icons and manifest: network first, then cache (so Home Screen install works offline after first visit)
  if (PRECACHE.includes(u.pathname) || u.pathname.endsWith('.webmanifest') || u.pathname.endsWith('.png')) {
    e.respondWith(
      fetch(r).then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(r, copy));
        }
        return res;
      }).catch(() => caches.match(r))
    );
  }
});
