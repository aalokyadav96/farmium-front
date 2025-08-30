import { state, API_URL, setState, clearState, getState } from "../../state/state.js";
import {
  escapeHTML,
  validateInputs,
  isValidUsername,
  isValidEmail,
  isValidPassword,
} from "../../utils/utils.js";
import { loadContent, navigate } from "../../routes/index.js";
import { fetchProfile } from "../profile/fetchProfile.js";
import Notify from "../../components/ui/Notify.mjs";
import { apiFetch } from "../../api/api.js";


function decodeJWT(token) {
  try {
    const payload = token.split(".")[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded);
  } catch (err) {
    return null;
  }
}

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
    Notify(errors, {type:"error",duration:3000, dismissible:true});
    return;
  }

  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      Notify("Signup successful! You can now log in.", {type:"success",duration:3000, dismissible:true});
      navigate("/login");
    } else {
      Notify(data.message || "Error signing up.", {type:"error",duration:3000, dismissible:true});
    }
  } catch (error) {
    Notify("Error signing up. Please try again.", {type:"error",duration:3000, dismissible:true});
  }
}

async function login(event) {
  event.preventDefault();

  const username = escapeHTML(document.getElementById("login-username").value.trim());
  const password = escapeHTML(document.getElementById("login-password").value);

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const res = await response.json();


    if (res.status == 200) {
      setState(
        {
          token: res.data.token,
          refreshToken: res.data.refreshToken,
          user: res.data.userid,
        },
        true
      );
    
      // localStorage.setItem("token", res.data.token);
      // localStorage.setItem("user", res.data.userid);
      // localStorage.setItem("refreshToken", res.data.refreshToken);

      const decoded = decodeJWT(res.data.token);
      if (decoded && decoded.username) {
        setState({ username: decoded.username }, true);
      }
    
      try {
        const profile = await fetchProfile();
        console.log(profile);
        setState({ userProfile: profile }, true);
      } catch (err) {
        Notify("Login succeeded but failed to load profile.", {type:"info",duration:3000, dismissible:true});
      }
    
      const redirectUrl = sessionStorage.getItem("redirectAfterLogin") || "/";
      sessionStorage.removeItem("redirectAfterLogin");
      
      // Make sure it's a same-origin path, not full URL
      if (!redirectUrl.startsWith("/") || redirectUrl === "/login") {
        window.location.href = "/";
      } else {
        window.location.href = redirectUrl;
      }
      
    }
     else {
      Notify(res.message || "Invalid credentials.", {type:"warning",duration:3000, dismissible:true});
    }
  } catch (error) {
    Notify("Error. Please try again.", {type:"error",duration:3000, dismissible:true});
  }
}

async function logout(skip = false) {
    if (!skip) {
        const confirmLogout = confirm("Page will reload. Are you sure you want to log out?");
        if (!confirmLogout) return;
    }

    const currentPath = window.location.pathname;

    // Avoid storing redirect to login or logout page
    if (currentPath !== "/login" && currentPath !== "/logout") {
        sessionStorage.setItem("redirectAfterLogin", currentPath);
    }

    try {
        // Notify backend about logout
        await apiFetch("/auth/logout", "POST");
    } catch (err) {
        console.error("Backend logout failed:", err);
        // Even if the request fails, we proceed to clear local state
    }

    // Clear client-side state and redirect
    clearState();
    navigate("/");
}

// function logout(skip = false) {
//   if (!skip) {
//     const confirmLogout = confirm("Page will reload. Are you sure you want to log out?");
//     if (!confirmLogout) return;
//   }

//   const currentPath = window.location.pathname;

//   // Avoid storing redirect to login or logout page
//   if (currentPath !== "/login" && currentPath !== "/logout") {
//     sessionStorage.setItem("redirectAfterLogin", currentPath);
//   }

//   clearState();
//   navigate("/");
// }


export { login, signup, logout };
