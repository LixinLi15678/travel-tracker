/**
 * service-worker.js
 * Basic service worker for caching assets and providing offline capabilities
 */

const CACHE_NAME = 'travel-tracker-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles/main.css',
  '/styles/map.css',
  '/scripts/main.js',
  '/scripts/map.js',
  '/scripts/data.js',
  '/scripts/geo.js',
  '/scripts/countries.js',
  '/scripts/utils.js',
  '/scripts/mobile-enhancements.js',
  '/scripts/statistics.js',
  '/scripts/gallery.js',
  '/scripts/diary.js',
  '/scripts/weather.js',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: All assets cached');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cache => {
            if (cache !== CACHE_NAME) {
              console.log('Service Worker: Clearing old cache', cache);
              return caches.delete(cache);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Now ready to handle fetches');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
  // Skip non-HTTP(S) requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // Skip for API requests - we want fresh data
  if (event.request.url.includes('/api/')) {
    return;
  }
  
  // Skip for external resources not in our static assets list
  if (!event.request.url.startsWith(self.location.origin) && 
      !STATIC_ASSETS.some(asset => event.request.url.includes(asset))) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Return cached response if found
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // If not in cache, fetch from network
        return fetch(event.request)
          .then(response => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone response to cache it
            const responseToCache = response.clone();
            
            // Try to cache the response if it's a valid URL
            if (response.url.startsWith('http')) {
              caches.open(CACHE_NAME)
                .then(cache => {
                  try {
                    cache.put(event.request, responseToCache);
                  } catch (error) {
                    console.warn('Failed to cache item:', error);
                  }
                });
            }
            
            return response;
          })
          .catch(error => {
            console.log('Service Worker: Fetch error', error);
            
            // For image requests, return a fallback image
            if (event.request.url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
              return caches.match('/assets/images/offline.svg');
            }
            
            // For other requests, show offline page
            return caches.match('/offline.html');
          });
      })
  );
});

// Listen for messages from the client
self.addEventListener('message', event => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
