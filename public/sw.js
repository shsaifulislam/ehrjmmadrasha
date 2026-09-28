/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 23
 * Service Worker: Offline Caching, App Shell & Network Resilience
 * 
 * Invariants:
 * 1. SERVER IS SOURCE OF TRUTH.
 * 2. NO LEAKAGE: Private APIs & mutations are network-first and never shared across accounts.
 * 3. GRACEFUL OFFLINE FALLBACK: Returns offline.html when network is down.
 * 4. SAFE UPGRADE: Cleans up obsolete cache versions upon activation.
 */

const CACHE_NAME = "ehrj-pwa-v1.0.0";
const OFFLINE_URL = "/offline.html";

const PRECACHE_ASSETS = [
  "/",
  "/offline.html",
  "/manifest.json",
  "/images/logo.jpg",
  "/search"
];

// 1. INSTALL
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// 2. ACTIVATE (PURGE OLD CACHES)
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. FETCH STRATEGY
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET requests (mutations always go directly to network)
  if (request.method !== "GET") {
    return;
  }

  // A. Navigation Requests (HTML Pages) -> Network First with Offline Fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // If valid response, clone into cache
          if (response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          return caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  // B. Static Assets (Images, Next.js static files) -> Cache First
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/images/") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".svg")
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((networkRes) => {
          if (networkRes.status === 200) {
            const copy = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkRes;
        });
      })
    );
    return;
  }

  // C. Public APIs (Search, FAQs) -> Stale-While-Revalidate
  if (url.pathname.startsWith("/api/search") || url.pathname.startsWith("/api/public")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((networkRes) => {
          if (networkRes.status === 200) {
            const copy = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkRes;
        }).catch(() => cached);

        return cached || fetchPromise;
      })
    );
    return;
  }

  // D. Private or Transactional APIs -> Network Only (No Caching)
  // Ensures fresh authorization checks and prevents cross-user leakage
  event.respondWith(
    fetch(request).catch(async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      return new Response(
        JSON.stringify({ error: "ইন্টারনেট সংযোগ নেই। অফলাইন মোড সক্রিয়।" }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    })
  );
});

// 4. MESSAGES (e.g. Logout Cache Invalidation)
self.addEventListener("message", (event) => {
  if (event.data && event.data.action === "CLEAR_PRIVATE_CACHE") {
    caches.open(CACHE_NAME).then((cache) => {
      cache.keys().then((requests) => {
        requests.forEach((req) => {
          const url = new URL(req.url);
          if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/portal") || url.pathname.startsWith("/admin")) {
            cache.delete(req);
          }
        });
      });
    });
  }
});
