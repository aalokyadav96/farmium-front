// src/utils/activityLogger.js
import {state} from "../../state/state.js";
import Snackbar from "../../components/ui/Snackbar.mjs";

const DEFAULT_API_BASE = "/api/activity";
const DEFAULT_SYNC_PATH = "/log";
const DEFAULT_FEED_PATH = "/feed";
const DEFAULT_TRENDING_PATH = "/trending";

let API_BASE_URL = DEFAULT_API_BASE;
let SYNC_PATH = DEFAULT_SYNC_PATH;
let SYNC_INTERVAL_MS = 10000; // 10 seconds by default
let MAX_RETRY_DELAY = 60000; // 1 minute
let RETRY_MULTIPLIER = 2;

const localStorageKey = "activityQueue_v1";
let activityQueue = [];
let isSyncing = false;
let syncIntervalId = null;
let abortController = null;

// ───────────────────────────────────────────────────────────────────────────────
// 1) Initialization: load any saved queue from localStorage
// ───────────────────────────────────────────────────────────────────────────────
(function loadQueueFromStorage() {
  try {
    const saved = localStorage.getItem(localStorageKey);
    if (saved) {
      activityQueue = JSON.parse(saved);
    }
  } catch (e) {
    console.warn("Could not load activity queue from localStorage:", e);
    activityQueue = [];
  }
})();

// ───────────────────────────────────────────────────────────────────────────────
// 2) Utility: persist queue to localStorage whenever it changes
// ───────────────────────────────────────────────────────────────────────────────
function persistQueue() {
  try {
    localStorage.setItem(localStorageKey, JSON.stringify(activityQueue));
  } catch (e) {
    console.warn("Failed to persist activity queue:", e);
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// 3) Configuration API (optional) 
//    You can call these if you need custom endpoints or intervals.
// ───────────────────────────────────────────────────────────────────────────────
function configure({
  apiBaseUrl = DEFAULT_API_BASE,
  syncPath = DEFAULT_SYNC_PATH,
  syncIntervalMs = 10000,
  maxRetryDelay = 60000,
  retryMultiplier = 2,
} = {}) {
  API_BASE_URL = apiBaseUrl;
  SYNC_PATH = syncPath;
  SYNC_INTERVAL_MS = syncIntervalMs;
  MAX_RETRY_DELAY = maxRetryDelay;
  RETRY_MULTIPLIER = retryMultiplier;
  restartSyncInterval();
}

// ───────────────────────────────────────────────────────────────────────────────
// 4) “Immediate” logging: sends a single activity (wrapped in an array) right away
//    Returns true/false on success, shows a Snackbar on failure.
// ───────────────────────────────────────────────────────────────────────────────
async function logActivity(action, metadata = {}) {
  if (!state.token) {
    Snackbar("Please log in to log activities.", 3000);
    return false;
  }

  const activity = {
    action,
    timestamp: new Date().toISOString(),
    metadata,
  };

  const url = `${API_BASE_URL}${SYNC_PATH}`;
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${state.token}`,
  };

  try {
    const resp = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify([activity]),
    });

    if (!resp.ok) {
      const errBody = await resp.json().catch(() => ({}));
      Snackbar(`Failed to log activity: ${errBody.error || "Unknown error"}`, 3000);
      return false;
    }

    Snackbar("Activity logged successfully.", 3000);
    return true;
  } catch (err) {
    console.error("Activity logging failed:", err);
    Snackbar("Failed to log activity. Please try again.", 3000);
    return false;
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// 5) Batched logging: queueActivity(...) pushes into activityQueue; 
//    syncActivities() flushes the queue in one POST.
// ───────────────────────────────────────────────────────────────────────────────

// 5.1) Gather metadata about user/device/environment
function getUserMetadata() {
  return {
    userAgent: navigator.userAgent,
    screenSize: `${window.innerWidth}x${window.innerHeight}`,
    referrer: document.referrer || "Direct",
    url: window.location.href,
  };
}

// 5.2) Add one activity to the in‐memory queue (and persist)
function queueActivity(action, additionalData = {}) {
  if (!state.token) {
    Snackbar("Please log in to log activities.", 3000);
    return;
  }

  const activity = {
    userId: state.user || "guest",
    action,
    timestamp: new Date().toISOString(),
    metadata: getUserMetadata(),
    ...additionalData,
  };

  activityQueue.push(activity);
  persistQueue();
}

// 5.3) Core sync function: tries to POST all queued activities
//     Implements exponential‐backoff on network errors (max delay = MAX_RETRY_DELAY)
async function syncActivities() {
  if (
    !state.token ||
    activityQueue.length === 0 ||
    isSyncing
  ) {
    return;
  }

  isSyncing = true;
  if (abortController) {
    abortController.abort();
  }
  abortController = new AbortController();
  const signal = abortController.signal;

  const url = `${API_BASE_URL}${SYNC_PATH}`;
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${state.token}`,
  };

  const payload = JSON.stringify(activityQueue);
  let attemptDelay = 1000; // start at 1 second

  async function attemptPost() {
    try {
      const resp = await fetch(url, {
        method: "POST",
        headers,
        body: payload,
        signal,
      });

      if (!resp.ok) {
        const errBody = await resp.json().catch(() => ({}));
        console.error(`Failed to log activities: ${errBody.message || "Unknown error"}`);
        Snackbar(`Failed to log activities: ${errBody.message || "Unknown error"}`, 3000);
        isSyncing = false;
        return;
      }

      // Success: clear queue, persist empty queue, notify user
      activityQueue = [];
      persistQueue();
      Snackbar("Activities logged successfully.", 3000);
      isSyncing = false;
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Activity sync aborted");
        isSyncing = false;
        return;
      }

      console.warn(`Network error during activity sync: ${error.message}`);
      // Retry with exponential backoff, up to MAX_RETRY_DELAY
      attemptDelay = Math.min(attemptDelay * RETRY_MULTIPLIER, MAX_RETRY_DELAY);
      setTimeout(() => {
        if (!signal.aborted) {
          attemptPost();
        } else {
          isSyncing = false;
        }
      }, attemptDelay);
    }
  }

  attemptPost();
}

// 5.4) Start the periodic sync loop (if not already running)
function startActivitySync() {
  if (!syncIntervalId) {
    syncIntervalId = setInterval(syncActivities, SYNC_INTERVAL_MS);
  }
}

// 5.5) Stop the periodic sync loop
function stopActivitySync() {
  if (syncIntervalId) {
    clearInterval(syncIntervalId);
    syncIntervalId = null;
  }
}

// 5.6) Restart (stop + start) — used when re‐configuring interval
function restartSyncInterval() {
  stopActivitySync();
  startActivitySync();
}

// 5.7) Flush queue once (useful on page unload)
async function flushOnUnload() {
  if (activityQueue.length === 0 || !state.token) return;
  // Use navigator.sendBeacon if available for a best‐effort, non‐blocking send
  const url = `${API_BASE_URL}${SYNC_PATH}`;
  const headers = { type: "application/json", Authorization: `Bearer ${state.token}` };
  const data = JSON.stringify(activityQueue);

  if (navigator.sendBeacon) {
    const blob = new Blob([data], { type: "application/json" });
    navigator.sendBeacon(url, blob);
    activityQueue = [];
    persistQueue();
  } else {
    // Fallback to synchronous XHR (not ideal, but better than losing data)
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url, false); // false = synchronous
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Authorization", `Bearer ${state.token}`);
    try {
      xhr.send(data);
    } catch (e) {
      console.warn("Synchronous flush failed:", e);
    }
    activityQueue = [];
    persistQueue();
  }
}

// Ensure we attempt a final flush when the user closes or reloads the page
window.addEventListener("beforeunload", flushOnUnload);

// ───────────────────────────────────────────────────────────────────────────────
// 6) Higher‐level trackers (auto‐track common events)
// ───────────────────────────────────────────────────────────────────────────────
function trackPageView() {
  queueActivity("page_view", { page: window.location.pathname });
}

function trackButtonClick(buttonName) {
  queueActivity("button_click", { button: buttonName });
}

function trackPurchase(itemId, price) {
  queueActivity("purchase", { itemId, price });
}

// Auto‐track page views on load
window.addEventListener("load", trackPageView);

// Start the sync loop immediately
startActivitySync();

// ───────────────────────────────────────────────────────────────────────────────
// 7) Fetch wrappers: activity feed and trending
// ───────────────────────────────────────────────────────────────────────────────
async function getActivityFeed() {
  if (!state.token) return [];

  const url = `${API_BASE_URL}${DEFAULT_FEED_PATH}`;
  try {
    const resp = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${state.token}`,
      },
    });
    if (!resp.ok) throw new Error("Failed to fetch activities");
    return await resp.json();
  } catch (err) {
    console.error("Error fetching activity feed:", err);
    return [];
  }
}

async function getTrendingActivities() {
  if (!state.token) return [];

  const url = `${API_BASE_URL}${DEFAULT_TRENDING_PATH}`;
  try {
    const resp = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${state.token}`,
      },
    });
    if (!resp.ok) throw new Error("Failed to fetch trending activities");
    return await resp.json();
  } catch (err) {
    console.error("Error fetching trending activities:", err);
    return [];
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// 8) Export everything
// ───────────────────────────────────────────────────────────────────────────────
export {
  configure,
  logActivity,
  queueActivity,
  syncActivities,
  startActivitySync,
  stopActivitySync,
  trackPageView,
  trackButtonClick,
  trackPurchase,
  getActivityFeed,
  getTrendingActivities,
};




/******HOW TO USE *************/
/*
import {
    logActivity,
    queueActivity,
    trackButtonClick,
    trackPurchase,
    getActivityFeed,
    getTrendingActivities,
    configure,
  } from "./utils/activityLogger.js";
  
  // Example: log one‐off event immediately
  document
    .getElementById("create-event-btn")
    .addEventListener("click", () => {
      logActivity("event_created", { eventId: "evt_12345" });
    });
  
  // Example: batch multiple clicks
  document
    .getElementById("like-post-btn")
    .addEventListener("click", () => {
      queueActivity("liked_post", { postId: "post_6789" });
    });
  
  // You can customize endpoints or interval if desired:
  configure({
    apiBaseUrl: "/api/custom_activity",
    syncIntervalMs: 5000,
  });
*/  