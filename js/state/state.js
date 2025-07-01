// import { renderPage } from "../routes/index.js";

/******* */

// const API_URL = "http://localhost:4000/api";
// const SRC_URL = "http://localhost:4000/static";
// const SEARCH_URL = "http://localhost:4000/api";
// const AGI_URL = "http://localhost:4000/agi";
// const FORUM_URL = "http://localhost:4000/api/forum";
// const CHAT_URL = "http://localhost:4000/api/chats";

const SRC_URL       = "https://farmium.onrender.com/static";
const API_URL       = "https://farmium.onrender.com/api";
const SEARCH_URL    = "https://farmium.onrender.com/api";
const CHAT_URL       = "https://farmium.onrender.com/api/chats";


/*********** */

// State management
const state = {
    token: sessionStorage.getItem("token") || localStorage.getItem("token") || null,
    userProfile: JSON.parse(sessionStorage.getItem("userProfile") || localStorage.getItem("userProfile")) || null,
    user: JSON.parse(sessionStorage.getItem("user") || localStorage.getItem("user")) || null,
    lastPath: window.location.pathname // Store last visited path to prevent redundant re-renders
};

function getState(key) {
    return state[key];
}

// Inside state.js
const listeners = new Set();

/**
 * Subscribe to state changes.
 * @param {Function} callback - A function to call on state updates.
 */
function subscribe(callback) {
    listeners.add(callback);
    return () => listeners.delete(callback); // Return unsubscribe function
}

/**
 * Notify all subscribers of the latest state.
 */
function notify() {
    for (const callback of listeners) {
        callback({ ...state });
    }
}

// Modify setState to trigger notify
function setState(newState, persist = false) {
    Object.assign(state, newState);

    if (persist) {
        if (newState.token) localStorage.setItem("token", newState.token);
        if (newState.userProfile) localStorage.setItem("userProfile", JSON.stringify(newState.userProfile));
        if (newState.user) localStorage.setItem("user", JSON.stringify(newState.user));
    } else {
        if (newState.token) sessionStorage.setItem("token", newState.token);
        if (newState.userProfile) sessionStorage.setItem("userProfile", JSON.stringify(newState.userProfile));
        if (newState.user) sessionStorage.setItem("user", JSON.stringify(newState.user));
    }

    notify(); // <-- Notify listeners after state update
}

// export { API_URL, AGI_URL, SRC_URL, CHAT_URL, FORUM_URL, SEARCH_URL, DEFAULT_IMAGE, state, setState, clearState, getState, isAdmin, subscribe };

// /**
//  * Updates the application state and persists changes to storage.
//  * @param {Object} newState - The new state properties to merge.
//  * @param {boolean} persist - Whether to store the state in localStorage (default: false).
//  */
// function setState(newState, persist = false) {
//     Object.assign(state, newState);

//     // Store in sessionStorage or localStorage if needed
//     if (persist) {
//         if (newState.token) localStorage.setItem("token", newState.token);
//         if (newState.userProfile) localStorage.setItem("userProfile", JSON.stringify(newState.userProfile));
//         if (newState.user) localStorage.setItem("user", JSON.stringify(newState.user));
//     } else {
//         if (newState.token) sessionStorage.setItem("token", newState.token);
//         if (newState.userProfile) sessionStorage.setItem("userProfile", JSON.stringify(newState.userProfile));
//         if (newState.user) sessionStorage.setItem("user", JSON.stringify(newState.user));
//     }
// }

/**
 * Clears the state and removes stored user data.
 */
function clearState() {
    sessionStorage.clear();
    localStorage.removeItem("token");
    localStorage.removeItem("userProfile");
    localStorage.removeItem("user");

    state.token = null;
    state.userProfile = null;
    state.user = null;

    // renderPage(); // Ensure the UI updates after logout
}

/**
 * Prevents redundant re-renders on back/forward navigation.
 */
window.addEventListener("popstate", () => {
    if (window.location.pathname !== state.lastPath) {
        console.log("🔄 Back/Forward navigation detected, updating content...");
        state.lastPath = window.location.pathname;
        // renderPage(); // Load the new content only if the path changes
    }
});

/**
 * Restores session state when returning from bfcache.
 */
window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
        console.log("Restoring session state from bfcache...");
        state.token = sessionStorage.getItem("token") || localStorage.getItem("token");
        state.userProfile = JSON.parse(sessionStorage.getItem("userProfile") || localStorage.getItem("userProfile"));
        state.user = JSON.parse(sessionStorage.getItem("user") || localStorage.getItem("user"));

        if (window.location.pathname !== state.lastPath) {
            state.lastPath = window.location.pathname;
            // renderPage(); // Ensure content updates properly
        }
    }
});

const DEFAULT_IMAGE = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/hsbRWkAAAAASUVORK5CYII=`;

function isAdmin() {
    return false;
}

// export { API_URL, AGI_URL, SRC_URL, CHAT_URL, FORUM_URL, SEARCH_URL, DEFAULT_IMAGE, state, setState, clearState, getState, isAdmin };

export { API_URL, AGI_URL, SRC_URL, CHAT_URL, FORUM_URL, SEARCH_URL, DEFAULT_IMAGE, state, setState, clearState, getState, isAdmin, subscribe };


/**
 * Usage of pub sub
 */
/*

import { subscribe } from '../state/state.js';

const unsubscribe = subscribe((newState) => {
    console.log("🔔 State changed:", newState);
    // Update UI or re-render if needed
});


*/