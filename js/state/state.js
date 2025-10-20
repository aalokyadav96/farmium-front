const MAIN_URL = "http://localhost:4000";
// const MAIN_URL = "https://gallium.onrender.com";

// --- API URLs ---
const API_URL = `${MAIN_URL}/api/v1`;
const AD_URL = `${MAIN_URL}/api/sda`;
const SEARCH_URL = `${MAIN_URL}/api/v1`;
const SRC_URL = "http://localhost:4002/static";
const BANNERDROP_URL = `http://localhost:6925`;
const FILEDROP_URL = `${BANNERDROP_URL}/filedrop`;
const CHATDROP_URL = `${BANNERDROP_URL}/api/v1/filedrop`;
const LIVE_URL = "http://localhost:7143";
const CHAT_URL = "http://localhost:3810";


// --- Allowed and persisted keys ---
const allowedKeys = new Set([
  "token", "user", "username", "userProfile", "socket", "role", "environment",
  "lang", "lastPath", "currentRoute", "routeCache", "routeState", "currentChatId", "isLoading"
]);

const PERSISTED_KEYS = ["token", "userProfile", "user", "username"];

// --- Event system ---
const globalEvents = {};
function publish(eventName, data) {
  if (globalEvents[eventName]) globalEvents[eventName].forEach(cb => cb(data));
}
function globalSubscribe(eventName, callback) {
  if (!globalEvents[eventName]) globalEvents[eventName] = [];
  globalEvents[eventName].push(callback);
}

// --- Safe JSON parse ---
function safeParse(key) {
  try {
    return JSON.parse(sessionStorage.getItem(key) || localStorage.getItem(key)) || null;
  } catch {
    return null;
  }
}

// --- Listeners ---
const listeners = new Map(); // top-level key => Set<callback>
const deepListeners = new Map(); // deep path => Set<callback>

// --- Batched notifications ---
const notifyQueue = new Set();
let notifyPending = false;

function getValueByPath(path) {
  return path.split(".").reduce((acc, part) => acc?.[part], state);
}

function scheduleNotify(key, value) {
  notifyQueue.add({ key, value });
  if (!notifyPending) {
    notifyPending = true;
    requestAnimationFrame(() => {
      for (const { key, value } of notifyQueue) {
        // top-level notifications
        const fns = listeners.get(key);
        if (fns) for (const fn of fns) fn(value);
        publish(`${key}Changed`, value);
        publish("stateChange", { [key]: value });

        // deep path notifications
        for (const [path, fns] of deepListeners) {
          if (path === key || path.startsWith(key + ".")) {
            const val = getValueByPath(path);
            for (const fn of fns) fn(val);
          }
        }
      }
      notifyQueue.clear();
      notifyPending = false;
    });
  }
}

// --- Deep proxy for reactivity (skips Map/Set) ---
function reactive(obj, path = []) {
  // Don't proxy Maps or Sets
  if (obj instanceof Map || obj instanceof Set) {
    return obj;
  }

  return new Proxy(obj, {
    get(target, prop) {
      const val = target[prop];
      if (val && typeof val === "object" && !(val instanceof Map) && !(val instanceof Set)) {
        return reactive(val, path.concat(prop));
      }
      return val;
    },
    set(target, prop, value) {
      target[prop] = value;
      scheduleNotify(path.concat(prop).join("."), value); // deep path
      scheduleNotify(path[0], obj); // top-level key
      return true;
    },
    deleteProperty(target, prop) {
      delete target[prop];
      scheduleNotify(path.concat(prop).join("."));
      scheduleNotify(path[0], obj);
      return true;
    }
  });
}

// --- Initialize reactive state ---
const rawState = {
  token: sessionStorage.getItem("token") || localStorage.getItem("token") || null,
  userProfile: safeParse("userProfile") || {},
  user: safeParse("user") || {},
  lastPath: window.location.pathname,
  lang: "en",
  currentRoute: null,
  routeCache: new Map(),
  routeState: new Map(),
  isLoading: false
};
const state = reactive(rawState);

// --- Core state functions ---
function getState(key) {
  if (!allowedKeys.has(key)) throw new Error(`Invalid state key: ${key}`);
  return state[key];
}

// --- State manipulation ---
function setState(keyOrObj, persist = false, value = undefined) {
  if (typeof keyOrObj === "object" && keyOrObj !== null) {
    for (const [key, val] of Object.entries(keyOrObj)) {
      if (!allowedKeys.has(key)) throw new Error(`Invalid state key: ${key}`);
      if (key === "routeCache" || key === "routeState") {
        console.warn(`⚠️ Skipping overwrite of ${key}`);
        continue;
      }
      state[key] = val;

      if (persist && PERSISTED_KEYS.includes(key)) {
        const str = typeof val === "string" ? val : JSON.stringify(val);
        sessionStorage.setItem(key, str);
        localStorage.setItem(key, str);
      }

      scheduleNotify(key, val);
    }
    return;
  }

  const key = keyOrObj;
  if (!allowedKeys.has(key)) throw new Error(`Invalid state key: ${key}`);
  if (key === "routeCache" || key === "routeState") {
    console.warn(`⚠️ Skipping overwrite of ${key}`);
    return;
  }

  state[key] = value;

  if (persist && PERSISTED_KEYS.includes(key)) {
    const str = typeof value === "string" ? value : JSON.stringify(value);
    sessionStorage.setItem(key, str);
    localStorage.setItem(key, str);
  }

  scheduleNotify(key, value);
  return value;
}

// --- Subscriptions ---
function subscribe(key, fn) {
  if (!allowedKeys.has(key)) throw new Error(`Cannot subscribe to invalid key: ${key}`);
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key).add(fn);
}
function unsubscribe(key, fn) {
  listeners.get(key)?.delete(fn);
}

// --- Deep path subscriptions ---
function subscribeDeep(path, fn) {
  if (!deepListeners.has(path)) deepListeners.set(path, new Set());
  deepListeners.get(path).add(fn);
}
function unsubscribeDeep(path, fn) {
  deepListeners.get(path)?.delete(fn);
}

// --- Store initialization ---
function initStore() {
  const saved = localStorage.getItem("user");
  if (saved) {
    state.user = JSON.parse(saved);
    scheduleNotify("user", state.user);
  }
}

// --- Route Cache ---
function getRouteModule(path) { return state.routeCache.get(path); }
function setRouteModule(path, module) { state.routeCache.set(path, module); }
function hasRouteModule(path) { return state.routeCache.has(path); }
function clearRouteCache() { state.routeCache.clear(); state.routeState.clear(); }

// --- Per-Route State ---
function getRouteState(path) {
  let route = state.routeState.get(path);
  if (!route) {
    route = Object.create(null);
    state.routeState.set(path, route);
  }
  return route;
}
function setRouteState(path, value) { state.routeState.set(path, value); }

// --- Clear State ---
function clearState(preserveKeys = []) {
  const preserved = {};
  for (const key of preserveKeys) {
    if (PERSISTED_KEYS.includes(key)) {
      preserved[key] = sessionStorage.getItem(key);
    }
  }

  sessionStorage.clear();
  localStorage.clear();

  for (const key of allowedKeys) {
    if (preserveKeys.includes(key) || key === "role") continue;
    if (key === "routeCache" || key === "routeState") {
      state[key].clear?.();
    } else {
      state[key] = null;
      scheduleNotify(key, null);
    }
  }

  for (const [key, value] of Object.entries(preserved)) {
    sessionStorage.setItem(key, value);
    localStorage.setItem(key, value);
  }

  // ✅ Ensure Maps always reinitialized safely
  if (!(state.routeCache instanceof Map)) state.routeCache = new Map();
  if (!(state.routeState instanceof Map)) state.routeState = new Map();
}

// --- Scroll State ---
function saveScroll(container, scrollState) { scrollState.scrollY = container?.scrollTop || 0; }
function restoreScroll(container, scrollState) { if (scrollState?.scrollY) container.scrollTop = scrollState.scrollY; }

// --- Role helpers ---
function hasRole(...roles) {
  const current = state.userProfile?.role;
  if (!current) return false;
  return roles.some(r => (Array.isArray(current) ? current : [current]).includes(r));
}
function isAdmin() { return hasRole("admin"); }

// --- Snapshot & Actions ---
function getGlobalSnapshot() { return Object.freeze({ ...state }); }
function setLoading(val) { setState("isLoading", val); }

// --- Exports ---
export {
  state,
  API_URL, SRC_URL, SEARCH_URL, CHAT_URL, FILEDROP_URL, AD_URL, CHATDROP_URL, BANNERDROP_URL, LIVE_URL,

  // core
  getState, setState, clearState, getGlobalSnapshot,

  // subscriptions
  subscribe, unsubscribe, subscribeDeep, unsubscribeDeep,
  publish, globalSubscribe,

  // scroll
  saveScroll, restoreScroll,

  // routing
  getRouteModule, setRouteModule, hasRouteModule, clearRouteCache,
  getRouteState, setRouteState,

  // init/store
  initStore,

  // roles
  hasRole, isAdmin,

  // actions
  setLoading
};
