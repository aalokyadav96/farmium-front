import { API_URL } from "../../api/api";

const ENDPOINT = "/scitylana/event";
const STORAGE_KEY = "__analytics_queue__";
const INTERVAL = 10000;
const MAX = 20;

// --- IDs ---
const SESSION_ID = (() => {
  const key = "__session_id__";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
  }
  return id;
})();

const USER_ID = (() => {
  const key = "__user_id__";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
})();

// --- Queue ---
let queue = loadQueue();

function loadQueue() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (_) {
    return [];
  }
}

function saveQueue() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch (_) {}
}

function clearQueue() {
  queue = [];
  localStorage.removeItem(STORAGE_KEY);
}

function enqueue(event) {
  queue.push({ ...event, ts: Date.now() });
  saveQueue();
  if (queue.length >= MAX) flush();
}

async function flush() {
  if (!queue.length || !navigator.onLine) return;

  const payload = queue.slice();
  try {
    const res = await fetch(`${API_URL}${ENDPOINT}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events: payload }),
    });

    if (res.ok) clearQueue();
  } catch (_) {
    // silent failure
  }
}

// --- Tracking ---
function getEnvInfo() {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    lang: navigator.language,
    platform: navigator.platform,
  };
}

function track(type, data = {}) {
  enqueue({
    type,
    data,
    url: location.href,
    ua: navigator.userAgent,
    session: SESSION_ID,
    user: USER_ID,
    ...getEnvInfo(),
  });
}

function dedupTrack(key, type, data = {}) {
  if (seenEvents.has(key)) return;
  seenEvents.add(key);
  track(type, data);
}

const seenEvents = new Set();

function throttle(fn, delay) {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= delay) {
      last = now;
      fn(...args);
    }
  };
}

// --- Automatic Events ---
const REFERRER = document.referrer;

track("pageview", { referrer: REFERRER });

document.addEventListener("click", (e) => {
  const el = e.target.closest("a, button");
  if (!el) return;
  const tag = el.tagName.toLowerCase();
  const label = el.getAttribute("aria-label") || el.innerText?.slice(0, 40) || "";
  const href = el.href || null;
  track("click", { tag, label, href });
});

document.addEventListener(
  "scroll",
  throttle(() => {
    const scroll = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
    track("scroll", { scroll });
  }, 5000)
);

document.addEventListener("focusin", (e) => {
  const el = e.target;
  if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
    track("input_focus", {
      name: el.name || el.id || "",
      type: el.type || "unknown",
    });
  }
});

// --- Time on Page ---
let pageStart = Date.now();

// --- Before Unload ---
window.addEventListener("beforeunload", () => {
  const duration = Date.now() - pageStart;
  enqueue({
    type: "time_on_page",
    data: { duration },
    url: location.href,
    ua: navigator.userAgent,
    session: SESSION_ID,
    user: USER_ID,
    ...getEnvInfo(),
    ts: Date.now(),
  });

  flush();
});

// --- Network Events ---
window.addEventListener("online", flush);
window.addEventListener("offline", () => {
  // optionally track offline here
});

// --- Periodic Flush ---
setInterval(flush, INTERVAL);

// --- Public API ---
export { track as trackEvent };

// import { API_URL } from "../../api/api";

// const ENDPOINT = "/scitylana/event";
// const STORAGE_KEY = "__analytics_queue__";
// const INTERVAL = 10000;
// const MAX = 20;

// let queue = load() || [];

// function load() {
//   try {
//     return JSON.parse(localStorage.getItem(STORAGE_KEY));
//   } catch (_) {
//     return [];
//   }
// }

// function save() {
//   try {
//     localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
//   } catch (_) {}
// }

// function clear() {
//   queue = [];
//   localStorage.removeItem(STORAGE_KEY);
// }

// function enqueue(event) {
//   queue.push({ ...event, ts: Date.now() });
//   save();
//   if (queue.length >= MAX) flush();
// }

// async function flush() {
//   if (!queue.length) return;

//   const payload = queue.slice();
//   try {
//     const res = await fetch(`${API_URL}${ENDPOINT}`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ events: payload }),
//     });

//     if (res.ok) clear();
//   } catch (_) {
//     // silent fail
//   }
// }

// function track(type, data = {}) {
//   enqueue({
//     type,
//     data,
//     url: location.href,
//     ua: navigator.userAgent,
//   });
// }

// function throttle(fn, delay) {
//   let last = 0;
//   return (...args) => {
//     const now = Date.now();
//     if (now - last >= delay) {
//       last = now;
//       fn(...args);
//     }
//   };
// }

// // Auto
// track("pageview");

// document.addEventListener("click", (e) => {
//   const el = e.target.closest("a, button");
//   if (!el) return;
//   const tag = el.tagName.toLowerCase();
//   const label = el.getAttribute("aria-label") || el.innerText?.slice(0, 40) || "";
//   const href = el.href || null;
//   track("click", { tag, label, href });
// });

// document.addEventListener(
//   "scroll",
//   throttle(() => {
//     const scroll = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
//     track("scroll", { scroll });
//   }, 5000)
// );

// window.addEventListener("beforeunload", () => flush());

// // Expose
// export { track as trackEvent };

// // import {API_URL} from "../../api/api";

// // const ANALYTICS_ENDPOINT = "/scitylana/event"; // adjust to your backend
// // const STORAGE_KEY = "__analytics_queue__";
// // const FLUSH_INTERVAL = 10000; // 10 seconds
// // const MAX_QUEUE_SIZE = 20;

// // let queue = [];

// // // --- Load existing queue from storage ---
// // try {
// //   const stored = localStorage.getItem(STORAGE_KEY);
// //   if (stored) queue = JSON.parse(stored);
// // } catch (_) { queue = []; }

// // function saveQueue() {
// //   try {
// //     localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
// //   } catch (_) { }
// // }

// // function clearQueue() {
// //   queue = [];
// //   localStorage.removeItem(STORAGE_KEY);
// // }

// // function enqueue(event) {
// //   queue.push({ ...event, ts: Date.now() });
// //   saveQueue();
// //   if (queue.length >= MAX_QUEUE_SIZE) flushQueue();
// // }

// // async function flushQueue() {
// //   if (!queue.length) return;

// //   const payload = [...queue];
// //   try {
// //     const res = await fetch(`${API_URL}${ANALYTICS_ENDPOINT}`, {
// //       method: "POST",
// //       headers: { "Content-Type": "application/json" },
// //       body: JSON.stringify({ events: payload })
// //     });

// //     if (res.ok) {
// //       clearQueue();
// //     }
// //   } catch (_) {
// //     // don't clear; try next time
// //   }
// // }

// // // --- Flush periodically ---
// // setInterval(flushQueue, FLUSH_INTERVAL);

// // // --- Flush before unload (sync) ---
// // window.addEventListener("beforeunload", () => {
// //   navigator.sendBeacon?.(); // intentionally not used
// //   flushQueue(); // async fire-and-forget
// // });

// // // --- Utility event tracking ---
// // function track(eventType, data = {}) {
// //   enqueue({
// //     type: eventType,
// //     data,
// //     url: location.href,
// //     ua: navigator.userAgent,
// //   });
// // }

// // // --- Common automatic events ---
// // track("pageview");

// // document.addEventListener("click", (e) => {
// //   const target = e.target.closest("a, button");
// //   if (!target) return;

// //   const tag = target.tagName.toLowerCase();
// //   const label = target.innerText?.slice(0, 40) || target.getAttribute("aria-label") || "";
// //   const href = target.href || null;

// //   track("click", { tag, label, href });
// // });

// // document.addEventListener("scroll", throttle(() => {
// //   const scrollPercent = Math.round(window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100);
// //   track("scroll", { scrollPercent });
// // }, 5000));

// // function throttle(fn, delay) {
// //   let lastCall = 0;
// //   return (...args) => {
// //     const now = Date.now();
// //     if (now - lastCall >= delay) {
// //       lastCall = now;
// //       fn(...args);
// //     }
// //   };
// // }

// // // --- Expose custom tracking ---
// // export { track  as trackEvent };

// // // export function trackEvent(eventName, data = {}) {
// // //   return fetch("/scitylana/event", "POST", {
// // //     event: eventName,
// // //     data,
// // //     timestamp: Date.now(),
// // //     path: location.pathname
// // //   });
// // // }
