// --- API URLs ---
export const webSiteName = "Farmium";

// const MAIN_URL = "https://gallium.onrender.com";
// const EMBED_URL = "https://gallium.onrender.com/embed";
// const BANNERDROP_URL = `https://bannerdrop.onrender.com`;
// const LIVE_URL = "https://vlive.onrender.com";
// const CHAT_URL = "https://newchat-4b20.onrender.com";
// const MERE_URL = "https://merechat.onrender.com";
// const MUSIC_URL = "https://musicon.onrender.com";

const MAIN_URL = "http://localhost:4000";
const EMBED_URL = "http://localhost:4000/embed";
const BANNERDROP_URL = `http://localhost:6925`;
const LIVE_URL = "http://localhost:7143";
const CHAT_URL = "http://localhost:3810";
const MERE_URL = "http://localhost:3343";
const MUSIC_URL = "http://localhost:3051/api/v1";

const API_URL = `${MAIN_URL}/api/v1`;
const STRIPE_URL = `${MAIN_URL}/api/v1/stripe`;
const AD_URL = `${MAIN_URL}/api/sda`;
const SEARCH_URL = `${MAIN_URL}/api/v1`;
const SRC_URL = `${BANNERDROP_URL}/static`;
const FILEDROP_URL = `${BANNERDROP_URL}/filedrop`;
const CHATDROP_URL = `${BANNERDROP_URL}/api/v1/filedrop`;

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

// --- Safe JSON parse (robust) ---
function safeParse(key) {
  try {
    const raw = sessionStorage.getItem(key) ?? localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// --- Listeners ---
const listeners = new Map(); // top-level key => Set<callback>
const deepListeners = new Map(); // deep path => Set<callback>

// --- Batched notifications (Map keyed by path for dedupe) ---
const notifyQueue = new Map(); // key -> value
let notifyPending = false;

function getValueByPath(path) {
  if (!path) return undefined;
  return path.split(".").reduce((acc, part) => acc?.[part], state);
}

function scheduleNotify(key, value) {
  if (!key) return;
  notifyQueue.set(key, value);
  if (!notifyPending) {
    notifyPending = true;
    requestAnimationFrame(() => {
      for (const [k, v] of notifyQueue.entries()) {
        // top-level notifications (if key is deep path, derive top)
        const top = k.includes(".") ? k.split(".")[0] : k;
        const fns = listeners.get(top);
        if (fns) for (const fn of fns) fn(getValueByPath(top));

        publish(`${top}Changed`, getValueByPath(top));
        publish("stateChange", { [top]: getValueByPath(top) });

        // deep path notifications
        for (const [path, fnsSet] of deepListeners) {
          if (path === k || path.startsWith(top + ".")) {
            const val = getValueByPath(path);
            for (const fn of fnsSet) fn(val);
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
  if (obj instanceof Map || obj instanceof Set) {
    return obj;
  }
  if (obj === null || typeof obj !== "object") return obj;

  return new Proxy(obj, {
    get(target, prop) {
      // skip symbol props and builtins
      if (typeof prop === "symbol") return target[prop];

      const val = target[prop];
      if (val && typeof val === "object" && !(val instanceof Map) && !(val instanceof Set)) {
        // ensure path component is string
        const propStr = String(prop);
        return reactive(val, path.concat(propStr));
      }
      return val;
    },
    set(target, prop, value) {
      const propStr = String(prop);
      target[prop] = value;

      const deepPath = path.concat(propStr).join(".");
      // determine top-level key for convenience (use existing path[0] or propStr)
      const topKey = path[0] ?? propStr;

      scheduleNotify(deepPath, value); // deep path
      scheduleNotify(topKey, target); // top-level key

      return true;
    },
    deleteProperty(target, prop) {
      const propStr = String(prop);
      delete target[propStr];

      const deepPath = path.concat(propStr).join(".");
      const topKey = path[0] ?? propStr;

      scheduleNotify(deepPath, undefined);
      scheduleNotify(topKey, target);

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
        try {
          const str = typeof val === "string" ? val : JSON.stringify(val);
          sessionStorage.setItem(key, str);
          localStorage.setItem(key, str);
        } catch {
          // skip persisting non-serializable
        }
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
    try {
      const str = typeof value === "string" ? value : JSON.stringify(value);
      sessionStorage.setItem(key, str);
      localStorage.setItem(key, str);
    } catch {
      // swallow
    }
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
    try {
      state.user = JSON.parse(saved);
      scheduleNotify("user", state.user);
    } catch {
      // ignore invalid JSON
    }
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
// safer clearing: only remove known persisted keys instead of wiping all browser storage
function clearState(preserveKeys = []) {
  const preserved = {};
  for (const key of preserveKeys) {
    if (PERSISTED_KEYS.includes(key)) {
      preserved[key] = sessionStorage.getItem(key) ?? localStorage.getItem(key);
    }
  }

  // Only remove persisted keys (avoid wiping unrelated storage)
  for (const k of PERSISTED_KEYS) {
    sessionStorage.removeItem(k);
    localStorage.removeItem(k);
  }

  // Reset in-memory state (skip routeCache/routeState or reinitialize them)
  for (const key of allowedKeys) {
    if (preserveKeys.includes(key) || key === "role") continue;

    if (key === "routeCache" || key === "routeState") {
      state[key].clear?.();
    } else {
      state[key] = null;
      scheduleNotify(key, null);
    }
  }

  // restore preserved items back into storage
  for (const [key, value] of Object.entries(preserved)) {
    if (value != null) {
      sessionStorage.setItem(key, value);
      localStorage.setItem(key, value);
    }
  }

  // Ensure Maps always reinitialized safely
  if (!(state.routeCache instanceof Map)) state.routeCache = new Map();
  if (!(state.routeState instanceof Map)) state.routeState = new Map();
}

// --- Scroll State ---
function saveScroll(container, scrollState) { if (container && scrollState) scrollState.scrollY = container?.scrollTop || 0; }
function restoreScroll(container, scrollState) { if (container && scrollState?.scrollY) container.scrollTop = scrollState.scrollY; }

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
  API_URL, SRC_URL, SEARCH_URL, CHAT_URL, FILEDROP_URL, AD_URL, CHATDROP_URL, BANNERDROP_URL, LIVE_URL, MERE_URL, MUSIC_URL, MAIN_URL, EMBED_URL, STRIPE_URL,

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
