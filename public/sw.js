const CACHE = "dlme-v2";
self.addEventListener("install", (e) => {
    e.waitUntil(
        caches.open(CACHE).then((cache) => {
            return cache.addAll(["/", "/style.css", "/script.js", "/icon-192.png", "/icon-512.png", "/slash.mp3"]);
        })
    );
});
self.addEventListener("fetch", (e) => {
    e.respondWith(
        caches.match(e.request).then((r) => r || fetch(e.request))
    );
});
