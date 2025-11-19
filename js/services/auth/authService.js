import { setState, clearState } from "../../state/state.js";
import { escapeHTML, validateInputs, isValidUsername, isValidEmail, isValidPassword } from "../../utils/utils.js";
import { navigate } from "../../routes/index.js";
import { fetchProfile } from "../profile/fetchProfile.js";
import Notify from "../../components/ui/Notify.mjs";
import { apiFetch, refreshToken } from "../../api/api.js";

const API_BASE = "/auth";
let loginLock = false;
let signupLock = false;

/* ----------------------------- JWT Decode ----------------------------- */
export function decodeJWT(token) {
    try {
        if (!token) return null;
        const parts = token.split(".");
        if (parts.length < 2) return null;
        const raw = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
        const bytes = new Uint8Array([...raw].map(c => c.charCodeAt(0)));
        const decoded = new TextDecoder().decode(bytes);
        return JSON.parse(decoded);
    } catch {
        return null;
    }
}

/* ----------------------------- SANITIZE ----------------------------- */
function sanitizeObject(obj) {
    if (!obj || typeof obj !== "object") return {};
    const out = Array.isArray(obj) ? [] : {};
    for (const k in obj) {
        const v = obj[k];
        if (typeof v === "string") out[k] = escapeHTML(v);
        else if (v && typeof v === "object") out[k] = sanitizeObject(v);
        else out[k] = v;
    }
    return out;
}

/* ----------------------------- SAFE API FETCH ----------------------------- */
async function safeApiFetch(endpoint, method = "GET", body = null, options = {}) {
    try {
        return await apiFetch(endpoint, method, body, options);
    } catch (err) {
        if (err.message === "Session expired.") {
            const ok = await refreshToken();
            if (ok) return await apiFetch(endpoint, method, body, options);
            clearState();
            throw new Error("Session expired. Please log in again.");
        }
        throw err;
    }
}

/* ----------------------------- SIGNUP ----------------------------- */
export async function signup(event) {
    event.preventDefault();
    if (signupLock) return;
    signupLock = true;

    try {
        const rawUsername = document.getElementById("signup-username").value.trim();
        const rawEmail = document.getElementById("signup-email").value.trim();
        const password = document.getElementById("signup-password").value;

        const errors = validateInputs([
            { value: rawUsername, validator: isValidUsername, message: "Username must be 3-20 characters." },
            { value: rawEmail, validator: isValidEmail, message: "Invalid email address." },
            { value: password, validator: isValidPassword, message: "Password must be at least 6 characters." }
        ]);

        if (errors) {
            Notify(errors, { type: "error", duration: 3000, dismissible: true });
            return;
        }

        const res = await safeApiFetch(`${API_BASE}/register`, "POST", { username: rawUsername, email: rawEmail, password });

        if (res?.status === 200 || res?.status === 201) {
            Notify("Signup successful. Verify your email if required.", { type: "success", duration: 3000, dismissible: true });
            localStorage.setItem("redirectAfterLogin", "/home");
            navigate("/login");
        } else {
            Notify(escapeHTML(res?.message || res?.error || "Error signing up."), { type: "error", duration: 3000, dismissible: true });
        }
    } catch {
        Notify("Error signing up. Please try again.", { type: "error", duration: 3000, dismissible: true });
    } finally {
        signupLock = false;
    }
}

/* ----------------------------- LOGIN ----------------------------- */
export async function login(event) {
    event.preventDefault();
    if (loginLock) return;
    loginLock = true;

    try {
        const currentPath = window.location.pathname;
        if (!/^\/login/.test(currentPath) && !/^\/logout/.test(currentPath)) {
            localStorage.setItem("redirectAfterLogin", currentPath);
        }

        const rawUsername = document.getElementById("login-username").value.trim();
        const password = document.getElementById("login-password").value;

        if (!rawUsername || !password) {
            Notify("Please enter username and password.", { type: "warning", duration: 2500, dismissible: true });
            return;
        }

        const res = await safeApiFetch(`${API_BASE}/login`, "POST", { username: rawUsername, password });

        if (res?.status === 200 && res?.data?.token) {
            const { token, userid } = res.data;
            setState({ token, user: userid }, true);

            const decoded = decodeJWT(token);
            if (decoded?.username) setState({ username: escapeHTML(decoded.username) }, true);

            try {
                const profile = await fetchProfile();
                setState({ userProfile: sanitizeObject(profile) }, true);
            } catch {
                Notify("Login succeeded but failed to load profile.", { type: "info", duration: 3000, dismissible: true });
            }

            let redirectUrl = localStorage.getItem("redirectAfterLogin");
            localStorage.removeItem("redirectAfterLogin");
            // if (!redirectUrl || /^\/login/.test(redirectUrl) || /^\/logout/.test(redirectUrl)) redirectUrl = "/home";
            navigate(redirectUrl);
            // window.location.reload();
        } else {
            Notify(escapeHTML(res?.message || res?.error || "Invalid credentials."), { type: "warning", duration: 3000, dismissible: true });
        }
    } catch {
        Notify("Error. Please try again.", { type: "error", duration: 3000, dismissible: true });
    } finally {
        loginLock = false;
    }
}

/* ----------------------------- LOGOUT ----------------------------- */
export async function logout() {
    Notify("Logging out...", { type: "info", duration: 1500 });
    try { await apiFetch(`${API_BASE}/logout`, "POST"); } catch {}
    clearState();
    window.location.reload();
}
