const CACHE_NAME = "app-cache-v10";
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
  "/assets/icon-512.png"
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

// const CACHE_NAME = "app-cache-v9";
// // const CACHE_NAME = "full-app-cache-v1";
// const OFFLINE_URL = "/offline.html";
// const STATIC_ASSETS = [
//   "/",
//   "/index.html",
//   "/offline.html",
//   "/manifest.json",
//   "/js/app.js",
//   "/js/assets/styles.css",
//   "/assets/icon-128.png",
//   "/assets/icon-192.png",
//   "/assets/icon-512.png"
// ];

// self.addEventListener("install", (event) => {
//   self.skipWaiting();
//   event.waitUntil(
//     caches.open(CACHE_NAME).then((cache) => {
//       return cache.addAll(STATIC_ASSETS);
//     })
//   );
// });

// self.addEventListener("activate", (event) => {
//   event.waitUntil(
//     caches.keys().then((keys) =>
//       Promise.all(keys.map((key) => {
//         if (key !== CACHE_NAME) return caches.delete(key);
//       }))
//     ).then(() => self.clients.claim())
//   );
// });

// self.addEventListener("fetch", (event) => {
//   const req = event.request;
//   const url = new URL(req.url);
//   const accept = req.headers.get("accept") || "";

//   if (req.method !== "GET") return;

//   if (accept.includes("text/html")) {
//     event.respondWith(
//       fetch(req)
//         .then((res) => {
//           const cloned = res.clone();
//           caches.open(CACHE_NAME).then((cache) => cache.put(req, cloned));
//           return res;
//         })
//         .catch(() => caches.match(req).then((cached) => cached || caches.match(OFFLINE_URL)))
//     );
//     return;
//   }

//   if (url.pathname.endsWith(".js") || url.pathname.endsWith(".css") || url.pathname.includes("/assets/")) {
//     event.respondWith(
//       caches.match(req).then((cached) => cached || fetch(req).then((res) => {
//         const cloned = res.clone();
//         caches.open(CACHE_NAME).then((cache) => cache.put(req, cloned));
//         return res;
//       }))
//     );
//     return;
//   }

//   if (req.destination === "image") {
//     event.respondWith(staleWhileRevalidate(req));
//     return;
//   }

//   if (url.pathname.startsWith("/api/")) {
//     event.respondWith(
//       fetch(req)
//         .then((res) => {
//           const cloned = res.clone();
//           caches.open(CACHE_NAME).then((cache) => cache.put(req, cloned));
//           return res;
//         })
//         .catch(() => caches.match(req))
//     );
//     return;
//   }
// });

// async function staleWhileRevalidate(req) {
//   const cache = await caches.open(CACHE_NAME);
//   const cachedResponse = await cache.match(req);
//   const fetchPromise = fetch(req)
//     .then((networkResponse) => {
//       if (networkResponse && networkResponse.status === 200) {
//         cache.put(req, networkResponse.clone());
//       }
//       return networkResponse;
//     })
//     .catch(() => cachedResponse);
//   return cachedResponse || fetchPromise;
// }

// // Push notifications
// self.addEventListener("push", (event) => {
//   if (!event.data) return;
//   const { title, message, url } = event.data.json();
//   event.waitUntil(
//     self.registration.showNotification(title, {
//       body: message,
//       icon: "/assets/icon-128.png",
//       data: { url },
//       actions: [{ action: "open", title: "Open" }]
//     })
//   );
// });

// self.addEventListener("notificationclick", (event) => {
//   event.notification.close();
//   const url = event.notification.data?.url || "/";
//   event.waitUntil(clients.openWindow(url));
// });

// // Telemetry
// function sendTelemetry(type, url) {
//   fetch("/telemetry/sw-event", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ type, url, ts: Date.now() })
//   }).catch(() => {});
// }
