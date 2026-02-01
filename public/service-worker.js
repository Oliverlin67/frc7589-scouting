//定義常數(const) cacheName="槽的名字"
const cacheName = "frc7589_scouting";   



//定義 contentToCache =在下載app時要抓取下來的資料(沒有填入路徑的話離線時就不會出現那個東西)
const contentToCache = [    
    "./assets/app.css",
    "./index.html",
    "./showData.html",
    "./icons/icon-192x192.png",
];

self.addEventListener("install", (e) => {
    console.log("[Service Worker] Install");

    e.waitUntil(
        (async () => {
            const cache = await caches.open(cacheName);
            console.log("[Service Worker] Caching all: app shell and content");
            await cache.addAll(contentToCache);
        })()
    );
});

self.addEventListener("activate", (event) => {
    console.log("ready to handle fetches!");

    e.waitUntil(
        caches.keys().then((keyList) => {
            Promise.all(
                keyList.map((key) => {
                    if (key === cacheName) {
                        return;
                    }
                    caches.delete(key);
                })
            );
        })
    );
});

self.addEventListener("fetch", (e) => {
    e.respondWith(
        (async () => {
            const r = await caches.match(e.request);
            console.log(`[Service Worker] Fetching resource: ${e.request.url}`);
            if (r) return r;
            const response = await fetch(e.request);
            const cache = await caches.open(cacheName);
            console.log(`[Service Worker] Caching new resource: ${e.request.url}`);
            cache.put(e.request, response.clone());
            return response;
        })()
    );
});