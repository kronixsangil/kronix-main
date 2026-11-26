const CACHE = 'pingos-score-v1';
const shell = ['./score.html','./score.mjs','./show.css','./icon-192.png','./icon-512.png'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(shell))));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys =>
  Promise.all(keys.filter(key => key.startsWith('pingos-score-') && key !== CACHE).map(key => caches.delete(key))))));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== location.origin) return;
  const asset = shell.find(path => new URL(path, self.registration.scope).pathname === url.pathname);
  if (asset) event.respondWith(fetch(event.request).catch(() => caches.open(CACHE).then(cache => cache.match(asset))));
});
