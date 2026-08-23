const CACHE_NAME = 'mahdi-cache-v1';
const ASSETS = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './manifest.json'
];

// Installation : Mise en cache initiale
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

// Activation : Nettoyage des anciens caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((name) => {
                    if (name !== CACHE_NAME) return caches.delete(name);
                })
            );
        })
    );
    self.clients.claim();
});

// Interception des requêtes : Network-First pour HTML, Stale-While-Revalidate pour le reste
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    const isHTML = event.request.headers.get('accept').includes('text/html');

    if (isHTML) {
        // Network-first avec fallback Cache
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    const clonedResponse = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clonedResponse));
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
    } else {
        // Stale-While-Revalidate pour les assets (CSS, JS)
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                const networkFetch = fetch(event.request).then((response) => {
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
                    return response;
                });
                return cachedResponse || networkFetch;
            })
        );
    }
});

// Écoute des messages pour forcer la mise à jour
self.addEventListener('message', (event) => {
    if (event.data && event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});