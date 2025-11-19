import {
    API_URL,
    SRC_URL,
    setState,
    getState,
    MERE_URL,
    CHAT_URL,
    BANNERDROP_URL,
    LIVE_URL,
    MUSIC_URL,
    STRIPE_URL
} from "../state/state.js";

import { logout } from "../services/auth/authService.js";
import Notify from "../components/ui/Notify.mjs";

/* ----------------------------- Cache Config ----------------------------- */
const MAX_CACHE_ENTRIES = 100;
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
const NO_CACHE_ENDPOINTS = [
    "/auth/login",
    "/auth/register",
    "/auth/logout",
    "/events/event",
];
const PERSISTED_KEY = "__api_cache__";

const apiCache = new Map();
let refreshInProgress = null;

/* ----------------------------- JWT Decode ----------------------------- */
function parseJwt(token = "") {
    try {
        const parts = token.split(".");
        if (parts.length < 2) return null;
        const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const json = decodeURIComponent(
            Array.prototype.map
                .call(atob(base64), c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                .join("")
        );
        return JSON.parse(json);
    } catch {
        return null;
    }
}

function isTokenNearExpiry(token, bufferMs = 2 * 60 * 1000) {
    const payload = parseJwt(token);
    return payload?.exp ? Date.now() > payload.exp * 1000 - bufferMs : false;
}

/* ----------------------------- Cache Helpers ----------------------------- */
function shouldSkipCache(endpoint) {
    return NO_CACHE_ENDPOINTS.some(p => endpoint === p || endpoint.startsWith(p));
}

function getCacheKey(url, token) {
    return `${token || ""}:${url}`;
}

function safeSetCache(key, data) {
    apiCache.set(key, { data, timestamp: Date.now() });
    if (apiCache.size > MAX_CACHE_ENTRIES) apiCache.delete(apiCache.keys().next().value);
    persistCacheToSession();
}

function clearApiCache() {
    apiCache.clear();
    sessionStorage.removeItem(PERSISTED_KEY);
}

function loadCacheFromSession() {
    try {
        const raw = sessionStorage.getItem(PERSISTED_KEY);
        if (raw) {
            const obj = JSON.parse(raw);
            Object.entries(obj).forEach(([key, val]) => apiCache.set(key, val));
        }
    } catch {
        console.warn("Failed to load persisted API cache.");
    }
}

function persistCacheToSession() {
    try {
        sessionStorage.setItem(PERSISTED_KEY, JSON.stringify(Object.fromEntries(apiCache)));
    } catch {
        console.warn("Failed to persist API cache.");
    }
}

/* ----------------------------- Token Handling ----------------------------- */
function setToken(token) {
    setState({ token }, true); // persist in state.js
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
}

/* ----------------------------- Token Refresh ----------------------------- */
export async function refreshToken() {
    if (refreshInProgress) return refreshInProgress;

    refreshInProgress = (async () => {
        try {
            const response = await fetch(`${API_URL}/auth/refresh`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
            });

            if (!response.ok) {
                if (response.status === 401) return false;
                return true;
            }

            const data = await response.json().catch(() => null);
            if (data?.token) {
                const newToken = data.token;
                const parsed = parseJwt(newToken);

                setToken(newToken);

                setState({
                    role: parsed?.role || [],
                    username: parsed?.username || "",
                    user: parsed?.userid || ""
                }, true);

                return true;
            }

            return false;
        } catch {
            return true;
        } finally {
            refreshInProgress = null;
        }
    })();

    const success = await refreshInProgress;
    if (!success) {
        Notify("Session expired. Please log in again.", { type: "warning", duration: 5000 });
        logout();
    }

    return success;
}

/* ----------------------------- Core Fetch ----------------------------- */
async function coreFetch(baseUrl, endpoint, method = "GET", body = null, options = {}, isRetry = false) {
    const token = getState("token");

    if (token && isTokenNearExpiry(token) && !isRetry) {
        const ok = await refreshToken();
        if (!ok) throw new Error("Session expired.");
    }

    const fetchOptions = {
        method,
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
        credentials: options.credentials ?? "include",
        signal: options.signal
    };

    if (body) {
        if (body instanceof FormData) fetchOptions.body = body;
        else if (typeof body === "object") {
            fetchOptions.headers["Content-Type"] = "application/json";
            fetchOptions.body = JSON.stringify(body);
        } else if (typeof body === "string") {
            fetchOptions.body = body;
            fetchOptions.headers["Content-Type"] ||= "text/plain";
        }
    }

    const isGet = method === "GET";
    const useCache = options.useCache !== false && isGet && !shouldSkipCache(endpoint);
    const cacheKey = getCacheKey(`${baseUrl}${endpoint}`, token);

    if (useCache && apiCache.has(cacheKey)) {
        const { data, timestamp } = apiCache.get(cacheKey);
        if (Date.now() - timestamp < DEFAULT_TTL) return data;
        apiCache.delete(cacheKey);
    }

    try {
        const response = await fetch(`${baseUrl}${endpoint}`, fetchOptions);

        if (response.status === 409) {
            Notify("Already exists.", { type: "warning", duration: 3000, dismissible: true });
            return;
        }

        if (response.status === 401 && !isRetry) {
            const ok = await refreshToken();
            if (ok) return coreFetch(baseUrl, endpoint, method, body, options, true);
            throw new Error("Session expired.");
        }

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `HTTP ${response.status}`);
        }

        if (options.responseType === "blob") return await response.blob();
        if (options.responseType === "arrayBuffer") return await response.arrayBuffer();

        const text = await response.text();
        let result = null;
        try { result = text ? JSON.parse(text) : null; } catch { console.warn("Invalid JSON:", endpoint); }

        if (useCache) safeSetCache(cacheKey, result);
        return result;
    } catch (err) {
        if (err.name === "AbortError") return;
        Notify(err.message || "Network error", { type: "error", duration: 3000, dismissible: true });
        throw err;
    }
}

/* ----------------------------- API Fetchers ----------------------------- */
function createFetcher(baseUrl, defaultOptions = {}) {
    return (endpoint, method = "GET", body = null, options = {}) => {
        const controller = options.controller || new AbortController();
        return coreFetch(baseUrl, endpoint, method, body, { ...defaultOptions, ...options, signal: controller.signal });
    };
}

export const apiFetch = createFetcher(API_URL);
export const liveFetch = createFetcher(LIVE_URL);
export const bannerFetch = createFetcher(BANNERDROP_URL, { credentials: "omit" });
export const chatFetch = createFetcher(CHAT_URL);
export const mereFetch = createFetcher(MERE_URL, { credentials: "omit" });
export const musicFetch = createFetcher(MUSIC_URL, { credentials: "omit" });
export const stripeFetch = createFetcher(STRIPE_URL, { credentials: "omit" });

/* ----------------------------- Startup & Cache Management ----------------------------- */
const nav = performance.getEntriesByType("navigation")[0];
if (nav && nav.type === "reload") sessionStorage.removeItem(PERSISTED_KEY);

loadCacheFromSession();

setInterval(() => {
    const now = Date.now();
    for (const [k, { timestamp }] of apiCache.entries()) {
        if (now - timestamp >= DEFAULT_TTL) apiCache.delete(k);
    }
    persistCacheToSession();
}, 60000);

/* ----------------------------- Auto-refresh token ----------------------------- */
function setupAutoRefresh(intervalMs = 60_000, bufferMs = 2 * 60_000) {
    setInterval(async () => {
        const token = getState("token");
        if (!token) return;
        if (isTokenNearExpiry(token, bufferMs)) {
            try { await refreshToken(); } catch {}
        }
    }, intervalMs);

    const initialToken = getState("token");
    if (initialToken && isTokenNearExpiry(initialToken, bufferMs)) refreshToken();
}

setupAutoRefresh();

export { API_URL, SRC_URL, clearApiCache, setToken };
