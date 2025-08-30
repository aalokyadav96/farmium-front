const CACHE_NAME = "app-cache-v11";
const OFFLINE_URL = "/offline.html";

const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/offline.html",
  "/manifest.json",
  "/js/app.js",
  "/js/assets/styles.css",
  "/assets/icon-128.png",
  "/assets/icon-192.png",
  "/assets/icon-512.png",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
  "https://unpkg.com/leaflet.vectorgrid/dist/Leaflet.VectorGrid.bundled.js"
];

// Precache on install
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

// Clean old caches on activate
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }))
    ).then(() => self.clients.claim())
  );
});

// Fetch handling
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  const accept = req.headers.get("accept") || "";

  if (req.method !== "GET") return;

  // Map tiles (OSM raster or your backend vector .pbf)
  if (
    url.hostname.includes("tile.openstreetmap.org") ||
    url.pathname.startsWith("/tiles/")
  ) {
    event.respondWith(staleWhileRevalidate(req));
    return;
  }
  
  // HTML pages
  if (accept.includes("text/html")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          return res;
        })
        .catch(() => {
          // sendTelemetry("html-fetch-failed", url.pathname);
          return caches.match(req).then((cached) => cached || caches.match(OFFLINE_URL));
        })
    );
    return;
  }

  // Static JS/CSS/assets
  if (url.pathname.endsWith(".js") || url.pathname.endsWith(".css") || url.pathname.includes("/assets/")) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) {
          // sendTelemetry("cache-hit", url.pathname);
          return cached;
        }
        return fetch(req).then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          return res;
        });
      })
    );
    return;
  }

  // Image requests
  if (req.destination === "image") {
    event.respondWith(staleWhileRevalidate(req));
    return;
  }

  // API calls
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }
});

// Stale-while-revalidate for images
async function staleWhileRevalidate(req) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(req);
  const fetchPromise = fetch(req)
    .then((res) => {
      if (res && res.status === 200) {
        cache.put(req, res.clone());
      }
      return res;
    })
    .catch(() => {
      // sendTelemetry("image-fetch-failed", req.url);
      return cached;
    });
  return cached || fetchPromise;
}

// Push notification
self.addEventListener("push", (event) => {
  if (!event.data) return;
  const { title, message, url } = event.data.json();

  event.waitUntil(
    self.registration.showNotification(title, {
      body: message,
      icon: "/assets/icon-128.png",
      badge: "/assets/icon-128.png",
      data: { url },
      actions: [{ action: "open", title: "Open" }]
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(clients.openWindow(url));
});

// Basic telemetry reporting
function sendTelemetry(type, url) {
  fetch("http://localhost:4000/api/v1/telemetry/sw-event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, url, ts: Date.now() })
  }).catch(() => {});
}
