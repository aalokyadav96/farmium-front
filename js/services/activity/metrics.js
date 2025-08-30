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
