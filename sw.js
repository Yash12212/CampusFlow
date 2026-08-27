// sw.js — CampusFlow Advanced Service Worker

const CACHE_VERSION = 'v3';
const APP_SHELL_CACHE = `cf-shell-${CACHE_VERSION}`;
const WEB_FONTS_CACHE = `cf-fonts-${CACHE_VERSION}`;
const RUNTIME_CACHE   = `cf-runtime-${CACHE_VERSION}`;

// Core assets to precache on install
const PRECACHE_URLS = [
  './',
  './index.html',
  './bundle.json',
  './icon.png'
];

// ==========================================
// 1. INSTALL: Precache & Skip Waiting
// ==========================================
self.addEventListener('install', event => {
  // Force the waiting SW to become active immediately
  self.skipWaiting(); 
  
  event.waitUntil(
    caches.open(APP_SHELL_CACHE)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .catch(err => console.warn('[SW] Precache failed:', err))
  );
});

// ==========================================
// 2. ACTIVATE: Cleanup & Navigation Preload
// ==========================================
self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      // A. Clean up old caches
      caches.keys().then(keys => 
        Promise.all(
          keys
            .filter(k => k !== APP_SHELL_CACHE && k !== WEB_FONTS_CACHE && k !== RUNTIME_CACHE)
            .map(k => caches.delete(k))
        )
      ),
      // B. Enable Navigation Preload (Speeds up HTML fetch)
      self.registration.navigationPreload 
        ? self.registration.navigationPreload.enable() 
        : Promise.resolve(),
      // C. Take control of all open clients immediately
      self.clients.claim()
    ])
  );
});

// ==========================================
// 3. FETCH: Routing Strategies
// ==========================================
self.addEventListener('fetch', event => {
  // Ignore non-GET requests (e.g., POST, analytics)
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // --- STRATEGY A: Navigation (Network First + Preload + Offline Fallback) ---
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // 1. Try Navigation Preload first (Fastest)
          const preloadResponse = await event.preloadResponse;
          if (preloadResponse) return preloadResponse;

          // 2. Fallback to standard Network fetch
          const networkResponse = await fetch(event.request);
          
          // Update cache with the fresh copy
          const cache = await caches.open(APP_SHELL_CACHE);
          cache.put(event.request, networkResponse.clone());
          
          return networkResponse;
        } catch (err) {
          // 3. Offline Fallback
          const cache = await caches.open(APP_SHELL_CACHE);
          // Try to serve index.html, or a dedicated offline page if you created one
          return (await cache.match('./index.html')) || (await cache.match('./offline.html'));
        }
      })()
    );
    return;
  }

  // --- STRATEGY B: Data Bundle (Stale-While-Revalidate) ---
  // Serves cached timetable instantly, but updates it in the background for next time.
  if (url.pathname.endsWith('bundle.json')) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(APP_SHELL_CACHE);
        const cachedResponse = await cache.match(event.request);
        
        // Fetch promise that updates cache in background
        const fetchPromise = fetch(event.request)
          .then(networkResponse => {
            if (networkResponse.ok) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => cachedResponse); // Network failed, ensure we return cache

        // Return cache immediately if it exists, otherwise wait for network
        return cachedResponse || fetchPromise;
      })()
    );
    return;
  }

  // --- STRATEGY C: Google Fonts (Cache First) ---
  if (url.origin.includes('fonts.googleapis.com') || url.origin.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        
        return fetch(event.request).then(response => {
          // Fonts are CORS, so they return "opaque" responses (status 0). 
          // We must check for opaque OR 200 to cache them successfully.
          if (response && (response.status === 200 || response.type === 'opaque')) {
            const clone = response.clone();
            caches.open(WEB_FONTS_CACHE).then(cache => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // --- STRATEGY D: Local Assets & Images (Cache First, Network Fallback) ---
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      
      return fetch(event.request)
        .then(response => {
          // Cache successful basic responses
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(RUNTIME_CACHE).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          // Final fallback for broken images
          if (event.request.destination === 'image') {
            return caches.match('./icon.png');
          }
        });
    })
  );
});

// ==========================================
// 4. MESSAGE PASSING (App Update Prompt)
// ==========================================
// Listens for the "Skip Waiting" message from your index.html UI
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});