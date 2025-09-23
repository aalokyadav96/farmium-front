import { setState, clearState, subscribeDeep } from "../../state/state.js";
import { escapeHTML, validateInputs, isValidUsername, isValidEmail, isValidPassword } from "../../utils/utils.js";
import { navigate } from "../../routes/index.js";
import { fetchProfile } from "../profile/fetchProfile.js";
import Notify from "../../components/ui/Notify.mjs";
import { apiFetch } from "../../api/api.js";

// --- JWT decoding ---
export function decodeJWT(token) {
  try {
    const payload = token.split(".")[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

// --- Signup ---
async function signup(event) {
  event.preventDefault();

  const username = escapeHTML(document.getElementById("signup-username").value.trim());
  const email = escapeHTML(document.getElementById("signup-email").value.trim());
  const password = escapeHTML(document.getElementById("signup-password").value);

  const errors = validateInputs([
    { value: username, validator: isValidUsername, message: "Username must be between 3 and 20 characters." },
    { value: email, validator: isValidEmail, message: "Please enter a valid email." },
    { value: password, validator: isValidPassword, message: "Password must be at least 6 characters long." },
  ]);

  if (errors) {
    Notify(errors, { type: "error", duration: 3000, dismissible: true });
    return;
  }

  try {
    const res = await apiFetch("/auth/register", "POST", { username, email, password });
    if (res?.status === 200) {
      Notify("Signup successful! You can now log in.", { type: "success", duration: 3000, dismissible: true });
      // After signup, redirect user to login page
      localStorage.setItem("redirectAfterLogin", "/home");
      navigate("/login");
    } else {
      Notify(res?.message || "Error signing up.", { type: "error", duration: 3000, dismissible: true });
    }
  } catch {
    Notify("Error signing up. Please try again.", { type: "error", duration: 3000, dismissible: true });
  }
}

// --- Login ---
async function login(event) {
  event.preventDefault();

  const currentPath = window.location.pathname;
  if (currentPath !== "/logout" && currentPath !== "/login") {
    localStorage.setItem("redirectAfterLogin", currentPath);
  }

  const username = escapeHTML(document.getElementById("login-username").value.trim());
  const password = escapeHTML(document.getElementById("login-password").value);

  try {
    const res = await apiFetch("/auth/login", "POST", { username, password });

    if (res?.status === 200) {
      const { token, refreshToken, userid } = res.data;

      // Persist token and user
      setState({ token, refreshToken, user: userid }, true);

      const decoded = decodeJWT(token);
      if (decoded?.username) setState({ username: decoded.username }, true);

      try {
        const profile = await fetchProfile();
        setState({ userProfile: profile }, true);
      } catch {
        Notify("Login succeeded but failed to load profile.", { type: "info", duration: 3000, dismissible: true });
      }

      // Redirect after login
      const redirectUrl = localStorage.getItem("redirectAfterLogin") || "/home";
      localStorage.removeItem("redirectAfterLogin");

      if (!redirectUrl.startsWith("/home") || redirectUrl === "/login") {
        navigate("/home");
      } else {
        navigate(redirectUrl);
      }

    } else {
      Notify(res?.message || "Invalid credentials.", { type: "warning", duration: 3000, dismissible: true });
    }
  } catch {
    Notify("Error. Please try again.", { type: "error", duration: 3000, dismissible: true });
  }
}

// --- Logout ---
async function logout() {
  const confirmLogout = confirm("Are you sure you want to log out? The page will reload.");
  if (!confirmLogout) return;

  const currentPath = window.location.pathname;
  if (currentPath !== "/logout" && currentPath !== "/login") {
    localStorage.setItem("redirectAfterLogin", currentPath);
  }

  try {
    await apiFetch("/auth/logout", "POST");
  } catch (err) {
    console.error("Backend logout failed:", err);
  }

  clearState();
  window.location.reload();
}

// --- Example reactive subscriptions ---
subscribeDeep("token", (t) => {
  // if (t) console.log("User logged in:", t);
  // else console.log("User logged out");
});

subscribeDeep("userProfile.role", (role) => {
  document.body.dataset.isAdmin = Array.isArray(role) && role.includes("admin") ? "true" : "false";
});

export { signup, login, logout };
