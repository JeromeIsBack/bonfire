/* Bonfire service worker — app-shell offline cache */
const CACHE = "bonfire-v1";
const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  // Cache-first for the app shell; network fallback for everything else (e.g. Google Fonts, future API).
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      // opportunistically cache same-origin GETs
      try {
        const url = new URL(req.url);
        if (url.origin === location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
      } catch (_) {}
      return res;
    }).catch(() => caches.match("./index.html")))
  );
});
