import {API_URL} from "../../api/api";

const ANALYTICS_ENDPOINT = "/scitylana/event"; // adjust to your backend
const STORAGE_KEY = "__analytics_queue__";
const FLUSH_INTERVAL = 10000; // 10 seconds
const MAX_QUEUE_SIZE = 20;

let queue = [];

// --- Load existing queue from storage ---
try {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) queue = JSON.parse(stored);
} catch (_) { queue = []; }

function saveQueue() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch (_) { }
}

function clearQueue() {
  queue = [];
  localStorage.removeItem(STORAGE_KEY);
}

function enqueue(event) {
  queue.push({ ...event, ts: Date.now() });
  saveQueue();
  if (queue.length >= MAX_QUEUE_SIZE) flushQueue();
}

async function flushQueue() {
  if (!queue.length) return;

  const payload = [...queue];
  try {
    const res = await fetch(`${API_URL}${ANALYTICS_ENDPOINT}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events: payload })
    });

    if (res.ok) {
      clearQueue();
    }
  } catch (_) {
    // don't clear; try next time
  }
}

// --- Flush periodically ---
setInterval(flushQueue, FLUSH_INTERVAL);

// --- Flush before unload (sync) ---
window.addEventListener("beforeunload", () => {
  navigator.sendBeacon?.(); // intentionally not used
  flushQueue(); // async fire-and-forget
});

// --- Utility event tracking ---
function track(eventType, data = {}) {
  enqueue({
    type: eventType,
    data,
    url: location.href,
    ua: navigator.userAgent,
  });
}

// --- Common automatic events ---
track("pageview");

document.addEventListener("click", (e) => {
  const target = e.target.closest("a, button");
  if (!target) return;

  const tag = target.tagName.toLowerCase();
  const label = target.innerText?.slice(0, 40) || target.getAttribute("aria-label") || "";
  const href = target.href || null;

  track("click", { tag, label, href });
});

document.addEventListener("scroll", throttle(() => {
  const scrollPercent = Math.round(window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100);
  track("scroll", { scrollPercent });
}, 5000));

function throttle(fn, delay) {
  let lastCall = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    }
  };
}

// --- Expose custom tracking ---
export { track  as trackEvent };

// export function trackEvent(eventName, data = {}) {
//   return fetch("/scitylana/event", "POST", {
//     event: eventName,
//     data,
//     timestamp: Date.now(),
//     path: location.pathname
//   });
// }
