const CACHE_NAME = 'rutawater-v37';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon.jpg',
  './js/config.js',
  './js/helpers.js',
  './js/icons.js',
  './js/components.js',
  './js/modals.js',
  './js/app.js'
];

// CDNs que la app necesita para funcionar
const cdnUrls = [
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone/babel.min.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js',
  'https://cdnjs.cloudflare.com/ajax/libs/Sortable/1.15.0/Sortable.min.js'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Cachear archivos locales (obligatorio)
      return cache.addAll(urlsToCache).then(() => {
        // Cachear CDNs (best-effort, no falla si alguno no carga)
        return Promise.allSettled(
          cdnUrls.map(url =>
            fetch(url, { mode: 'cors' })
              .then(response => {
                if (response.ok) {
                  return cache.put(url, response);
                }
              })
              .catch(() => {}) // Ignorar errores individuales
          )
        );
      });
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // No interceptar requests a Firebase APIs (Firestore, Auth)
  if (url.hostname.includes('googleapis.com') || url.hostname.includes('firebaseio.com')) {
    return;
  }

  // Para archivos locales y CDNs cacheados: network-first con fallback a cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Solo cachear respuestas exitosas de origen propio o CDNs conocidos
        if (response.ok && (url.origin === self.location.origin || cdnUrls.some(cdn => event.request.url.startsWith(cdn.split('?')[0])))) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
