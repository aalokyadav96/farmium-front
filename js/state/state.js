// --- API URLs ---
const API_URL = "http://localhost:4000/api/v1";
// // const APIG_URL = "http://localhost:8370/api/g1";
const APIG_URL = API_URL;
const AGI_URL = "http://localhost:4000/agi/v1";
const SRC_URL = "http://localhost:4000/static";
// // const SEARCH_URL = "http://localhost:12000/api/v1";
const SEARCH_URL = "http://localhost:4000/api/v1";

// const API_URL = "https://gallium.onrender.com/api/v1";
// const APIG_URL = "https://gallium.onrender.com/api/g1";
// const AGI_URL = "https://gallium.onrender.com/api/v1";
// const SRC_URL = "https://gallium.onrender.com/static";
// const SEARCH_URL = "https://gallium.onrender.com/api/v1";

// --- Allowed and persisted keys ---
const allowedKeys = new Set([
  "token", "user", "username", "userProfile", "refreshToken", "socket", "role",
  "lang", "lastPath", "currentRoute", "routeCache", "routeState", "currentChatId", "isLoading"
]);

const PERSISTED_KEYS = ["token", "userProfile", "refreshToken", "user"];

// --- Event system ---
const globalEvents = {};

function publish(eventName, data) {
  if (globalEvents[eventName]) {
    globalEvents[eventName].forEach(cb => cb(data));
  }
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

// --- Core state object ---
const state = {
  token: sessionStorage.getItem("token") || localStorage.getItem("token") || null,
  userProfile: safeParse("userProfile"),
  user: safeParse("user"),
  refreshToken: sessionStorage.getItem("refreshToken") || localStorage.getItem("refreshToken") || null,
  lastPath: window.location.pathname,
  lang: "en",
  currentRoute: null,
  routeCache: new Map(),
  routeState: new Map(),

  get role() {
    const raw = safeParse("userProfile");
    if (!raw || !raw.role) return [];
    return Array.isArray(raw.role) ? raw.role : [raw.role];
  }
};

// --- Reactivity system ---
const listeners = new Map(); // key => Set<callback>

function notify(key, value) {
  const fns = listeners.get(key);
  if (fns) {
    for (const fn of fns) fn(value);
  }
  publish(`${key}Changed`, value);
  publish("stateChange", { [key]: value });
}

// --- State manipulation ---
function getState(key) {
  if (!allowedKeys.has(key)) throw new Error(`Invalid state key: ${key}`);
  return state[key];
}

function setState(keyOrObj, persist = false, value = undefined) {
  if (typeof keyOrObj === "object" && keyOrObj !== null) {
    for (const [key, val] of Object.entries(keyOrObj)) {
      if (!allowedKeys.has(key)) throw new Error(`Invalid state key: ${key}`);
      state[key] = val;

      if (persist && PERSISTED_KEYS.includes(key)) {
        const str = typeof val === "string" ? val : JSON.stringify(val);
        sessionStorage.setItem(key, str);
        localStorage.setItem(key, str);
      }

      notify(key, val);
    }
    return;
  }

  const key = keyOrObj;
  if (!allowedKeys.has(key)) throw new Error(`Invalid state key: ${key}`);
  state[key] = value;

  if (persist && PERSISTED_KEYS.includes(key)) {
    const str = typeof value === "string" ? value : JSON.stringify(value);
    sessionStorage.setItem(key, str);
    localStorage.setItem(key, str);
  }

  notify(key, value);
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

// --- Store initialization ---
function initStore() {
  const saved = localStorage.getItem("user");
  if (saved) {
    state.user = JSON.parse(saved);
    publish("userChanged", state.user);
    publish("stateChange", { user: state.user });
  }
}

// --- Route Cache ---
function getRouteModule(path) {
  return state.routeCache.get(path);
}

function setRouteModule(path, module) {
  state.routeCache.set(path, module);
}

function hasRouteModule(path) {
  return state.routeCache.has(path);
}

function clearRouteCache() {
  state.routeCache.clear();
  state.routeState.clear();
}

// --- Per-Route State ---
function getRouteState(path) {
  let route = state.routeState.get(path);
  if (!route) {
    route = Object.create(null);
    state.routeState.set(path, route);
  }
  return route;
}

function setRouteState(path, value) {
  state.routeState.set(path, value);
}

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
      notify(key, null);
    }
  }

  for (const [key, value] of Object.entries(preserved)) {
    sessionStorage.setItem(key, value);
    localStorage.setItem(key, value);
  }
}

// --- Scroll State ---
function saveScroll(container, scrollState) {
  scrollState.scrollY = container?.scrollTop || 0;
}

function restoreScroll(container, scrollState) {
  if (scrollState?.scrollY) container.scrollTop = scrollState.scrollY;
}

// --- Role helpers ---
function hasRole(...roles) {
  const current = state.role;
  if (!Array.isArray(current)) return false;
  return roles.some(r => current.includes(r));
}

function isAdmin() {
  return hasRole("admin");
}

function getGlobalSnapshot() {
  return Object.freeze({ ...state });
}

// --- High-level actions ---

function setLoading(val) {
  setState("isLoading", val);
}

// --- Exports ---
export {
  state,
  API_URL,
  APIG_URL,
  AGI_URL,
  SRC_URL,
  SEARCH_URL,
  // core
  getState,
  setState,
  clearState,
  getGlobalSnapshot,

  // subscriptions
  subscribe,
  unsubscribe,
  publish,
  globalSubscribe,

  // scroll
  saveScroll,
  restoreScroll,

  // routing
  getRouteModule,
  setRouteModule,
  hasRouteModule,
  clearRouteCache,
  getRouteState,
  setRouteState,

  // init/store
  initStore,

  // roles
  hasRole,
  isAdmin,

  // actions
  setLoading
};

