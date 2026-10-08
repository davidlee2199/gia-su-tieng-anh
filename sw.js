// Cache vỏ app để mở được khi mạng yếu; gọi AI vẫn cần mạng.
const C = 'gia-su-v22';
self.addEventListener('install', e => e.waitUntil(caches.open(C).then(c => c.addAll(['./', 'manifest.json', 'icon-192.png']))));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
