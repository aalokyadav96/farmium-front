import { state, API_URL, setState, clearState, getState } from "../../state/state.js";
import {
  escapeHTML,
  validateInputs,
  isValidUsername,
  isValidEmail,
  isValidPassword,
} from "../../utils/utils.js";
import { loadContent, navigate } from "../../routes/index.js";
import Snackbar from "../../components/ui/Snackbar.mjs";
import { fetchProfile } from "../profile/fetchProfile.js";
import Notify from "../../components/ui/Notify.mjs";

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
    Snackbar(errors, 3000);
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
      Snackbar("Signup successful! You can now log in.", 3000);
      navigate("/login");
    } else {
      Snackbar(data.message || "Error signing up.", 3000);
    }
  } catch (error) {
    Snackbar("Error signing up. Please try again.", 3000);
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
        Snackbar("Login succeeded but failed to load profile.", 3000);
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
      Snackbar(res.message || "Invalid credentials.", 3000);
    }
  } catch (error) {
    Snackbar("Network error. Please try again.", 3000);
  }
}

function logout(skip = false) {
  if (!skip) {
    const confirmLogout = confirm("Page will reload. Are you sure you want to log out?");
    if (!confirmLogout) return;
  }

  const currentPath = window.location.pathname;

  // Avoid storing redirect to login or logout page
  if (currentPath !== "/login" && currentPath !== "/logout") {
    sessionStorage.setItem("redirectAfterLogin", currentPath);
  }

  clearState();
  navigate("/");
}


export { login, signup, logout };

// import { state, API_URL, setState, clearState } from "../../state/state.js";
// import { escapeHTML, validateInputs, isValidUsername, isValidEmail, isValidPassword } from "../../utils/utils.js";
// import { loadContent, navigate } from "../../routes/index.js";
// import Snackbar from "../../components/ui/Snackbar.mjs";
// import { fetchProfile } from "../profile/fetchProfile.js";

// async function signup(event) {
//     event.preventDefault();

//     const username = escapeHTML(document.getElementById("signup-username").value.trim());
//     const email = escapeHTML(document.getElementById("signup-email").value.trim());
//     const password = escapeHTML(document.getElementById("signup-password").value);

//     const errors = validateInputs([
//         { value: username, validator: isValidUsername, message: "Username must be between 3 and 20 characters." },
//         { value: email, validator: isValidEmail, message: "Please enter a valid email." },
//         { value: password, validator: isValidPassword, message: "Password must be at least 6 characters long." },
//     ]);

//     if (errors) {
//         Snackbar(errors, 3000);
//         return;
//     }

//     try {
//         const response = await fetch(`${API_URL}/auth/register`, {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ username, email, password }),
//         });

//         const data = await response.json();

//         if (response.ok) {
//             Snackbar("Signup successful! You can now log in.", 3000);
//             navigate("/login");
//         } else {
//             Snackbar(data.message || "Error signing up.", 3000);
//         }
//     } catch (error) {
//         Snackbar("Error signing up. Please try again.", 3000);
//     }
// }

// async function login(event) {
//     event.preventDefault();

//     const username = escapeHTML(document.getElementById("login-username").value.trim());
//     const password = escapeHTML(document.getElementById("login-password").value);

//     try {
//         const response = await fetch(`${API_URL}/auth/login`, {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ username, password }),
//         });

//         const res = await response.json();

//         if (response.ok) {
//             setState(
//                 {
//                     token: res.data.token,
//                     user: res.data.userid,
//                     refreshToken: res.data.refreshToken,
//                 },
//                 true
//             );

//             localStorage.setItem("token", res.data.token);
//             localStorage.setItem("user", res.data.userid);
//             localStorage.setItem("refreshToken", res.data.refreshToken);

//             const redirectUrl = sessionStorage.getItem("redirectAfterLogin") || "/";
//             sessionStorage.removeItem("redirectAfterLogin");

//             const profile = await fetchProfile();
//             setState({ userProfile: profile }, true);
//             window.location.href = redirectUrl === "/login" ? "/" : redirectUrl;

//             // navigate(redirectUrl === "/login" ? "/" : redirectUrl);
//             // loadContent();
//             // Snackbar("Login successful!", 2000);
//         } else {
//             Snackbar(res.message || "Invalid credentials.", 3000);
//         }
//     } catch (error) {
//         Snackbar("Network error. Please try again.", 3000);
//     }
// }

// async function logout(skip = false) {
//     if (!skip) {
//         const confirmLogout = confirm("Are you sure you want to log out?");
//         if (!confirmLogout) return;
//     }

//     clearState();
//     navigate("/");
// }

// export { login, signup, logout };

// // import { state, API_URL, setState, clearState } from "../../state/state.js";
// // import { escapeHTML, validateInputs, isValidUsername, isValidEmail, isValidPassword } from "../../utils/utils.js";
// // import { loadContent, navigate } from "../../routes/index.js";
// // import Snackbar from '../../components/ui/Snackbar.mjs';
// // import { fetchProfile } from '../profile/fetchProfile.js';

// // async function signup(event) {
// //     event.preventDefault(); // Prevent default form submission

// //     const username = escapeHTML(document.getElementById("signup-username").value.trim());
// //     const email = escapeHTML(document.getElementById("signup-email").value.trim());
// //     const password = escapeHTML(document.getElementById("signup-password").value);

// //     const errors = validateInputs([
// //         { value: username, validator: isValidUsername, message: "Username must be between 3 and 20 characters." },
// //         { value: email, validator: isValidEmail, message: "Please enter a valid email." },
// //         { value: password, validator: isValidPassword, message: "Password must be at least 6 characters long." },
// //     ]);

// //     if (errors) {
// //         Snackbar(errors, 3000);
// //         return;
// //     }

// //     try {
// //         const response = await fetch(`${API_URL}/auth/register`, {
// //             method: "POST",
// //             headers: { "Content-Type": "application/json" },
// //             body: JSON.stringify({ username, email, password }),
// //         });

// //         const data = await response.json();
// //         if (response.ok) {
// //             Snackbar("Signup successful! You can now log in.", 3000);
// //             navigate('/login');
// //             loadContent();
// //         } else {
// //             Snackbar(data.message || "Error signing up.", 3000);
// //         }
// //     } catch (error) {
// //         Snackbar("Error signing up. Please try again.", 3000);
// //     }
// // }


// // async function login(event) {
// //     event.preventDefault();

// //     const username = escapeHTML(document.getElementById("login-username").value.trim());
// //     const password = escapeHTML(document.getElementById("login-password").value);

// //     try {
// //         const response = await fetch(`${API_URL}/auth/login`, {
// //             method: "POST",
// //             headers: { "Content-Type": "application/json" },
// //             body: JSON.stringify({ username, password }),
// //         });

// //         const res = await response.json();

// //         if (response.ok) {
// //             // Store tokens & user data securely
// //             setState(
// //                 {
// //                     token: res.data.token,
// //                     user: res.data.userid,
// //                     refreshToken: res.data.refreshToken,
// //                 },
// //                 true // Persist in localStorage
// //             );

// //             // Get the URL the user should be redirected to after login
// //             const redirectUrl = sessionStorage.getItem("redirectAfterLogin") || "/";
// //             sessionStorage.removeItem("redirectAfterLogin");

// //             setState({ userProfile: fetchProfile(), }, true);

// //             if (redirectUrl == "/login") {
// //                 navigate("/");
// //             } else {
// //                 navigate(redirectUrl);
// //             }
// //             Snackbar("Login successful!", 2000);
// //         } else {
// //             Snackbar(res.message || "Invalid credentials.", 3000);
// //         }
// //     } catch (error) {
// //         Snackbar("Network error. Please try again.", 3000);
// //     }
// // }

// // async function logout(skip) {
// //     if (!skip) {
// //         const confirmLogout = confirm("Are you sure you want to log out?");
// //         if (!confirmLogout) return;
// //     }
// //     clearState();
// //     // state.token = null;
// //     // state.user = null;
// //     // state.userProfile = null;
// //     // localStorage.removeItem("token");
// //     // localStorage.removeItem("user");
// //     // localStorage.removeItem("userProfile");
// //     // localStorage.removeItem("refreshToken");
// //     loadContent();
// // }

// // export { login, signup, logout };