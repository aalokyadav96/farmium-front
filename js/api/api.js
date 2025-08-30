import { state, API_URL, APIG_URL, SRC_URL, setState } from "../state/state.js";
import { logout } from "../services/auth/authService.js";
import Notify from "../components/ui/Notify.mjs";

const MAX_CACHE_ENTRIES = 100;
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
const NO_CACHE_ENDPOINTS = ["/auth/login", "/auth/register", "/auth/logout"];

const apiCache = new Map(); // key -> { data, timestamp }

function shouldSkipCache(endpoint) {
    return NO_CACHE_ENDPOINTS.some(path => endpoint === path || endpoint.startsWith(path));
}

function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`)
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.warn("Failed to parse JWT", e);
        return null;
    }
}

let refreshInProgress = null;

async function refreshToken() {
    if (refreshInProgress) return refreshInProgress;

    const storedRefreshToken = state.refreshToken || localStorage.getItem("refreshToken");
    if (!storedRefreshToken) {
        logout(true);
        return false;
    }

    refreshInProgress = (async () => {
        try {
            const response = await fetch(`${API_URL}/auth/refresh`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken: storedRefreshToken }),
            });

            const data = await response.json();

            if (response.ok && data?.data?.token) {
                const parsed = parseJwt(data.data.token);
                setState(
                    {
                        token: data.data.token,
                        refreshToken: data.data.refreshToken,
                        role: parsed?.role || [],
                        userId: parsed?.userId || null,
                        username: parsed?.username || null,
                    },
                    true
                );
                return true;
            } else {
                Notify("Session expired. Please log in again.", {type:"success",duration:3000, dismissible:true});
                logout(true);
                return false;
            }
        } catch (err) {
            Notify("Error refreshing token.", {type:"success",duration:3000, dismissible:true});
            logout(true);
            return false;
        } finally {
            refreshInProgress = null;
        }
    })();

    return refreshInProgress;
}

function getCacheKey(url, token) {
    return `${token || ""}:${url}`;
}

function isTokenNearExpiry(token, bufferMs = 30 * 1000) {
    const payload = parseJwt(token);
    if (!payload?.exp) return false;
    const expiryMs = payload.exp * 1000;
    return Date.now() > (expiryMs - bufferMs);
}

async function apixFetch(endpoint, method = "GET", body = null, options = {}, isRetry = false) {
    if (state.token && isTokenNearExpiry(state.token) && !isRetry) {
        const refreshed = await refreshToken();
        if (!refreshed) throw new Error("Session expired. Please log in again.");
    }

    const fetchOptions = {
        method,
        headers: {
            ...(state.token && { Authorization: `Bearer ${state.token}` }),
        },
        signal: options.signal,
    };

    if (body) {
        if (body instanceof FormData) {
            fetchOptions.body = body;
        } else if (typeof body === "object") {
            fetchOptions.headers["Content-Type"] = "application/json";
            fetchOptions.body = JSON.stringify(body);
        } else if (typeof body === "string") {
            fetchOptions.body = body;
            if (!fetchOptions.headers["Content-Type"]) {
                fetchOptions.headers["Content-Type"] = "text/plain";
            }
        }
    }

    const isGet = method.toUpperCase() === "GET";
    const useCache = options.useCache !== false && isGet && !shouldSkipCache(endpoint);
    const cacheKey = getCacheKey(endpoint, state.token);

    if (useCache && apiCache.has(cacheKey)) {
        const { data, timestamp } = apiCache.get(cacheKey);
        if (Date.now() - timestamp < DEFAULT_TTL) {
            apiCache.set(cacheKey, { data, timestamp }); // Refresh LRU
            return data;
        } else {
            apiCache.delete(cacheKey);
        }
    }

    try {
        const response = await fetch(endpoint, fetchOptions);

        if (response.status === 409) {
            Notify("Already exists.", {type:"success",duration:3000, dismissible:true});
            return;
        }

        if (response.status === 401 && !isRetry && state.refreshToken) {
            const refreshed = await refreshToken();
            if (refreshed) {
                return apixFetch(endpoint, method, body, options, true);
            } else {
                throw new Error("Session expired. Please log in again.");
            }
        }

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `HTTP ${response.status}`);
        }

        if (options.responseType === "blob") return response;
        if (options.responseType === "arrayBuffer") return await response.arrayBuffer();

        const text = await response.text();
        let result = null;
        try {
            result = text ? JSON.parse(text) : null;
        } catch (err) {
            console.warn("Invalid JSON from", endpoint);
        }

        if (useCache) {
            safeSetCache(cacheKey, result);
        }

        return result;
    } catch (error) {
        if (error.name === "AbortError") return;
        console.error(`Error fetching ${endpoint}:`, error);
        Notify(error.message || "Network error", {type:"success",duration:3000, dismissible:true});
        throw error;
    }
}

async function apiFetch(endpoint, method = "GET", body = null, options = {}) {
    const controller = options.controller || new AbortController();
    const signal = controller.signal;
    const fullUrl = `${API_URL}${endpoint}`;
    return apixFetch(fullUrl, method, body, { ...options, signal });
}

export async function apigFetch(endpoint, method = "GET", body = null, options = {}) {
    const controller = options.controller || new AbortController();
    const signal = controller.signal;
    const fullUrl = `${APIG_URL}${endpoint}`;
    return apixFetch(fullUrl, method, body, { ...options, signal });
}

function clearApiCache() {
    apiCache.clear();
    sessionStorage.removeItem(PERSISTED_KEY);
}

// --- Session Cache Persistence ---

const PERSISTED_KEY = "__api_cache__";

function loadCacheFromSession() {
    try {
        const raw = sessionStorage.getItem(PERSISTED_KEY);
        if (raw) {
            const obj = JSON.parse(raw);
            Object.entries(obj).forEach(([key, value]) => {
                apiCache.set(key, value);
            });
        }
    } catch (e) {
        console.warn("Failed to load persisted API cache:", e);
    }
}

function persistCacheToSession() {
    try {
        const obj = Object.fromEntries(apiCache);
        sessionStorage.setItem(PERSISTED_KEY, JSON.stringify(obj));
    } catch (e) {
        console.warn("Failed to persist API cache:", e);
    }
}

function safeSetCache(key, data) {
    apiCache.set(key, { data, timestamp: Date.now() });

    if (apiCache.size > MAX_CACHE_ENTRIES) {
        const firstKey = apiCache.keys().next().value;
        apiCache.delete(firstKey);
    }

    persistCacheToSession();
}

// --- Clear persisted cache on full reload ---

const navEntry = performance.getEntriesByType("navigation")[0];
if (navEntry && navEntry.type === "reload") {
    sessionStorage.removeItem(PERSISTED_KEY);
}

loadCacheFromSession();

// --- Background Cache Cleanup (TTL Expiry) ---
setInterval(() => {
    const now = Date.now();
    for (const [key, { timestamp }] of apiCache.entries()) {
        if (now - timestamp >= DEFAULT_TTL) {
            apiCache.delete(key);
        }
    }
    persistCacheToSession();
}, 60 * 1000); // Every 1 minute

export { apiFetch, apixFetch, API_URL, SRC_URL, clearApiCache };

