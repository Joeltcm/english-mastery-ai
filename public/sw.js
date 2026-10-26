const CACHE_NAME = "english-mastery-shell-v3";
const APP_SHELL = ["/", "/offline.html", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png", "/apple-touch-icon.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;
  const url = new URL(event.request.url);
  const isPublicAsset = url.pathname.startsWith("/_next/static/") || url.pathname === "/manifest.webmanifest" || url.pathname === "/sw.js" || /\.(?:png|svg|ico|css|woff2?)$/i.test(url.pathname);
  const isNavigation = event.request.mode === "navigate";
  if (!isPublicAsset && !isNavigation) return;
  event.respondWith(fetch(event.request).then((response) => {
    if (response.ok && (isPublicAsset || isNavigation)) {
      const copy = response.clone();
      void caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
    }
    return response;
  }).catch(() => caches.match(event.request).then((cached) => cached || (isNavigation ? caches.match("/offline.html") : Response.error()))));
});
