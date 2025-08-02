// --- API URLs ---
// const API_URL = "http://localhost:4000/api/v1";
// const AGI_URL = "http://localhost:4000/api/v1";
// const SRC_URL = "http://localhost:4000/static";
// const SEARCH_URL = "http://localhost:4000/api/search";
const API_URL = "https://gallium.onrender.com/api/v1";
const AGI_URL = "https://gallium.onrender.com/api/v1";
const SRC_URL = "https://gallium.onrender.com/static";
const SEARCH_URL = "https://gallium.onrender.com/api/search";

const DEFAULT_IMAGE = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/hsbRWkAAAAASUVORK5CYII=`;
const USER_PH = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMu...`;

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
function login(user) {
  setState("user", true, user);
  localStorage.setItem("user", JSON.stringify(user));
}

function logout() {
  setState("user", true, null);
  localStorage.removeItem("user");
}

function setLoading(val) {
  setState("isLoading", val);
}

// --- Exports ---
export {
  state,
  API_URL,
  AGI_URL,
  SRC_URL,
  SEARCH_URL,
  DEFAULT_IMAGE,
  USER_PH,

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
  login,
  logout,
  setLoading
};


// const API_URL = "http://localhost:4000/api/v1";
// const AGI_URL = "http://localhost:4000/api/v1";
// const SRC_URL = "http://localhost:4000/static";
// const SEARCH_URL = "http://localhost:4000/api/search";

// // const API_URL = "https://gallium.onrender.com/api/v1";
// // const AGI_URL = "https://gallium.onrender.com/api/v1";
// // const SRC_URL = "https://gallium.onrender.com/static";
// // const SEARCH_URL = "https://gallium.onrender.com/api/search";

// const DEFAULT_IMAGE = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/hsbRWkAAAAASUVORK5CYII=`;

// const USER_PH = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMu
// b3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIzMiIgY3k9IjIwIiByPSIxMiIgZmlsbD0iI0NDQyIvPjxwYXRoIGQ9IkMyMC4yOSAzNC44MUMxNi43MSAz
// OC43MiAxNSA0My44NiAxNSA0OS41VjUyQzE1IDU3LjUyIDIwLjQ4IDYyIDI3LjUgNjJIMzYuNUM0My41MiA2MiA0OSA1Ny41MiA0OSA1MlY0OS41QzQ5
// IDQzLjg2IDQ3LjI5IDM4LjcyIDQzLjcxIDM0LjgxQzQwLjEzIDMwLjg5IDM0LjIzIDI4IDMwIDI4QzI1Ljc3IDI4IDE5Ljg3IDMwLjg5IDE2LjI5IDM0
// LjgxWiIgZmlsbD0iI0NDQyIvPjwvc3ZnPg==`;

// // --- Allowed and persisted keys ---
// const allowedKeys = new Set([
//   "token",
//   "user",
//   "username",
//   "userProfile",
//   "refreshToken",
//   "socket",
//   "role",
//   "lang",
//   "lastPath",
//   "currentRoute",
//   "routeCache",
//   "routeState",
//   "currentChatId",
// ]);

// const PERSISTED_KEYS = ["token", "userProfile", "refreshToken", "user"];

// // --- Internal listeners for reactivity ---
// const listeners = new Map(); // key => Set of callback functions

// // --- Safe JSON parse ---
// function safeParse(key) {
//   try {
//     return JSON.parse(sessionStorage.getItem(key) || localStorage.getItem(key)) || null;
//   } catch {
//     return null;
//   }
// }

// // --- Core state object ---
// const state = {
//   token: sessionStorage.getItem("token") || localStorage.getItem("token") || null,
//   userProfile: safeParse("userProfile"),
//   user: safeParse("user"),
//   refreshToken: sessionStorage.getItem("refreshToken") || localStorage.getItem("refreshToken") || null,
//   lastPath: window.location.pathname,
//   lang: "en",
//   currentRoute: null,
//   routeCache: new Map(),
//   routeState: new Map(),

//   // role is derived from userProfile if possible
//   get role() {
//     const raw = safeParse("userProfile");
//     if (!raw || !raw.role) return [];
//     return Array.isArray(raw.role) ? raw.role : [raw.role];
//   }
// };

// // --- Get a state value ---
// function getState(key) {
//   if (!allowedKeys.has(key)) throw new Error(`Invalid state key: ${key}`);
//   return state[key];
// }

// // --- Set a state value (supports object form) ---
// function setState(keyOrObj, persist = false, value = undefined) {
//   if (typeof keyOrObj === "object" && keyOrObj !== null) {
//     for (const [key, val] of Object.entries(keyOrObj)) {
//       if (!allowedKeys.has(key)) throw new Error(`Invalid state key: ${key}`);
//       state[key] = val;

//       if (persist && PERSISTED_KEYS.includes(key)) {
//         const str = typeof val === "string" ? val : JSON.stringify(val);
//         sessionStorage.setItem(key, str);
//         localStorage.setItem(key, str);
//       }

//       notify(key, val);
//     }
//     return;
//   }

//   const key = keyOrObj;
//   if (!allowedKeys.has(key)) throw new Error(`Invalid state key: ${key}`);
//   state[key] = value;

//   if (persist && PERSISTED_KEYS.includes(key)) {
//     const str = typeof value === "string" ? value : JSON.stringify(value);
//     sessionStorage.setItem(key, str);
//     localStorage.setItem(key, str);
//   }

//   notify(key, value);
//   return value;
// }

// // --- Clear all state and subscriptions ---
// function clearState(preserveKeys = []) {
//   const preserved = {};

//   for (const key of preserveKeys) {
//     if (PERSISTED_KEYS.includes(key)) {
//       preserved[key] = sessionStorage.getItem(key);
//     }
//   }

//   sessionStorage.clear();
//   localStorage.clear();

//   for (const key of allowedKeys) {
//     if (preserveKeys.includes(key) || key === "role") continue;
//     if (key === "routeCache" || key === "routeState") {
//       state[key].clear?.();
//     } else {
//       state[key] = null;
//     }
//   }

//   for (const [key, value] of Object.entries(preserved)) {
//     sessionStorage.setItem(key, value);
//     localStorage.setItem(key, value);
//   }

//   // listeners.clear(); // remove all subscriptions
//   for (const key of allowedKeys) {
//     if (preserveKeys.includes(key) || key === "role") continue;
//     if (key === "routeCache" || key === "routeState") {
//       state[key].clear?.();
//     } else {
//       state[key] = null;
//       notify(key, null); // 🔑 notify subscribers of the null state
//     }
//   }
  
// }

// // --- Route Cache ---
// function getRouteModule(path) {
//   return state.routeCache.get(path);
// }

// function setRouteModule(path, module) {
//   state.routeCache.set(path, module);
// }

// function hasRouteModule(path) {
//   return state.routeCache.has(path);
// }

// function clearRouteCache() {
//   state.routeCache.clear();
//   state.routeState.clear();
// }

// // --- Per-Route State ---
// function getRouteState(path) {
//   let route = state.routeState.get(path);
//   if (!route) {
//     route = Object.create(null);
//     state.routeState.set(path, route);
//   }
//   return route;
// }

// function setRouteState(path, value) {
//   state.routeState.set(path, value);
// }

// // --- Reactivity ---
// function subscribe(key, fn) {
//   if (!allowedKeys.has(key)) throw new Error(`Cannot subscribe to invalid key: ${key}`);
//   if (!listeners.has(key)) listeners.set(key, new Set());
//   listeners.get(key).add(fn); // Set prevents duplicates
// }

// function unsubscribe(key, fn) {
//   listeners.get(key)?.delete(fn);
// }

// function notify(key, value) {
//   const fns = listeners.get(key);
//   if (!fns) return;
//   for (const fn of fns) fn(value);
// }

// // --- Helpers ---
// function getGlobalSnapshot() {
//   return Object.freeze({ ...state });
// }

// function hasRole(...roles) {
//   const current = state.role;
//   if (!Array.isArray(current)) return false;
//   return roles.some(r => current.includes(r));
// }

// function isAdmin() {
//   return hasRole("admin");
// }

// // --- Exports ---
// export {
//   state,
//   API_URL,
//   AGI_URL,
//   SRC_URL,
//   SEARCH_URL,
//   DEFAULT_IMAGE,
//   USER_PH,
//   isAdmin,
//   hasRole,

//   // global state
//   getState,
//   setState,
//   clearState,
//   getGlobalSnapshot,

//   // subscriptions
//   subscribe,
//   unsubscribe,

//   // route cache
//   getRouteModule,
//   setRouteModule,
//   hasRouteModule,
//   clearRouteCache,

//   // per-route state
//   getRouteState,
//   setRouteState
// };
