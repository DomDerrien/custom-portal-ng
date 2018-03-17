const currentCacheVersion: string = 'v1';
const cacheableResources: Array<string> = [
    '/favicon.ico',
    '/main.css',
    '/'
];

console.log('service worker loaded');

// self.addEventListener('install', function (event: ExtendableEvent) {
//     event.waitUntil(async function (): Promise<void> {
//         const cache: Cache = await caches.open(currentCacheVersion);
//         await cache.addAll(cacheableResources);
//     }());
// });

// self.addEventListener('activate', function (event: ExtendableEvent) {
//     event.waitUntil(async function (): Promise<void> {
//         const keys: Array<string> = await caches.keys();
//         await Promise.all(keys.map((key: string) => {
//             if (currentCacheVersion.indexOf(key) === -1) {
//                 return caches.delete(key);
//             }
//         }));
//     }());
// });


// self.addEventListener('fetch', function (event: FetchEvent) {
//     event.respondWith(async function (): Promise<Response> {
//         let response: Response = await caches.match(event.request);
//         if (!response) {
//             try {
//                 response = await fetch(event.request);
//                 const cache: Cache = await caches.open(currentCacheVersion);
//                 await cache.put(event.request, response.clone());
//             }
//             catch (error) {
//                 response = await caches.match('/...'); // FIXME: identify the fallback with the event MIME type
//             }
//         }
//         return response;
//     }());
// });

// References:
// - https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers
// - https://developers.google.com/web/ilt/pwa/caching-files-with-service-worker
// - https://serviceworke.rs/strategy-cache-update-and-refresh_service-worker_doc.html
// - https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/