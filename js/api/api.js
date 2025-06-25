// import { API_URL, SRC_URL, state, setState } from "../state/state.js";
// // // Replace this with your actual API base URL

// // // let state = {
// // //     token: "",           // Set on login
// // //     refreshToken: "",    // Set on login
// // // };

// // async function apiFetch(endpoint, method = "GET", body = null, options = {}) {
// //     const controller = options.controller || new AbortController();
// //     const signal = controller.signal;
// //     const fullUrl = `${API_URL}${endpoint}`;

// //     return apixFetch(fullUrl, method, body, { ...options, signal });
// // }

// // async function apixFetch(endpoint, method = "GET", body = null, options = {}) {
// //     const fetchOptions = {
// //         method,
// //         headers: {
// //             "Authorization": state.token ? `Bearer ${state.token}` : "",
// //         },
// //         signal: options.signal,
// //     };

// //     if (body) {
// //         if (body instanceof FormData) {
// //             fetchOptions.body = body;
// //         } else {
// //             fetchOptions.headers["Content-Type"] = "application/json";
// //             fetchOptions.body = JSON.stringify(body);
// //         }
// //     }

// //     try {
// //         const response = await fetch(endpoint, fetchOptions);

// //         if (response.status === 429) {
// //             console.warn("Too many requests");
// //             return;
// //         }

// //         if (response.status === 401 && state.refreshToken) {
// //             console.warn("Token expired, attempting to refresh...");
// //             const refreshed = await refreshToken();
// //             if (refreshed) {
// //                 return apixFetch(endpoint, method, body, options); // use apixFetch to avoid infinite loop
// //             } else {
// //                 throw new Error("Session expired. Please log in again.");
// //             }
// //         }

// //         if (!response.ok) {
// //             const errorText = await response.text();
// //             throw new Error(errorText || `HTTP ${response.status}`);
// //         }

// //         switch (options.responseType) {
// //             case "blob": return response;
// //             case "arrayBuffer": return await response.arrayBuffer();
// //             case "text": return await response.text();
// //             case "stream": return response.body;
// //             default:
// //                 const text = await response.text();
// //                 return text ? JSON.parse(text) : null;
// //         }

// //     } catch (error) {
// //         if (error.name === "AbortError") {
// //             console.warn("Fetch aborted:", endpoint);
// //             return;
// //         }
// //         console.error(`Error fetching ${endpoint}:`, error);
// //         throw error;
// //     }
// // }

// // // Dummy refresh function (replace with actual logic)
// // async function refreshToken() {
// //     // Perform refresh token request
// //     console.log("Refreshing token...");
// //     return false; // Simulate failed refresh
// // }


// // // async function apiFetch(endpoint, method = "GET", body = null, options = {}) {
// // //     const controller = options.controller || new AbortController();
// // //     const signal = controller.signal;

// // //     const fullUrl = `${API_URL}${endpoint}`;
// // //     return apixFetch(fullUrl, method, body, { ...options, signal });
// // // }

// // // async function apixFetch(endpoint, method = "GET", body = null, options = {}) {
// // //     const fetchOptions = {
// // //         method,
// // //         headers: {
// // //             "Authorization": state.token ? `Bearer ${state.token}` : "",
// // //         },
// // //         signal: options.signal,
// // //     };

// // //     if (body) {
// // //         if (body instanceof FormData) {
// // //             fetchOptions.body = body;
// // //         } else if (typeof body === "object") {
// // //             fetchOptions.headers["Content-Type"] = "application/json";
// // //             fetchOptions.body = JSON.stringify(body);
// // //         } else {
// // //             fetchOptions.headers["Content-Type"] = "application/json";
// // //             fetchOptions.body = body;
// // //         }
// // //     }

// // //     try {
// // //         const response = await fetch(endpoint, fetchOptions);

// // //         if (response.status === 429) {
// // //             console.warn("Too many requests");
// // //             return;
// // //         }

// // //         if (response.status === 401 && state.refreshToken) {
// // //             console.warn("Token expired, attempting to refresh...");
// // //             const refreshed = await refreshToken();
// // //             if (refreshed) {
// // //                 return apiFetch(endpoint, method, body, options);
// // //             } else {
// // //                 throw new Error("Session expired. Please log in again.");
// // //             }
// // //         }

// // //         if (!response.ok) {
// // //             const errorText = await response.text();
// // //             throw new Error(errorText || `HTTP ${response.status}`);
// // //         }

// // //         // Handle supported response types
// // //         switch (options.responseType) {
// // //             case 'blob':
// // //                 return response; // caller handles .blob()
// // //             case 'arrayBuffer':
// // //                 return await response.arrayBuffer();
// // //             case 'text':
// // //                 return await response.text();
// // //             case 'stream':
// // //                 return response.body; // caller must handle ReadableStream
// // //             default:
// // //                 // default to JSON
// // //                 const text = await response.text();
// // //                 return text ? JSON.parse(text) : null;
// // //         }

// // //     } catch (error) {
// // //         if (error.name === "AbortError") {
// // //             console.warn("Fetch aborted:", endpoint);
// // //             return;
// // //         }

// // //         console.error(`Error fetching ${endpoint}:`, error);
// // //         throw error;
// // //     }
// // // }


// /**********Usage Examples***********/
// // // Blob (PDF, image, etc.)
// // const blobResponse = await apiFetch('/file', 'GET', null, { responseType: 'blob' });
// // const blob = await blobResponse.blob();

// // // ArrayBuffer (binary processing)
// // const buffer = await apiFetch('/audio.raw', 'GET', null, { responseType: 'arrayBuffer' });

// // // Plain text
// // const text = await apiFetch('/textfile.txt', 'GET', null, { responseType: 'text' });

// // // Stream (advanced use)
// // const stream = await apiFetch('/bigdata', 'GET', null, { responseType: 'stream' });


// // import { API_URL, state } from "../state/state.js";

// async function apiFetch(endpoint, method = "GET", body = null, options = {}) {
//     const controller = options.controller || new AbortController();
//     const signal = controller.signal;

//     const fullUrl = `${API_URL}${endpoint}`;
//     return apixFetch(fullUrl, method, body, { ...options, signal });
// }

// async function apixFetch(endpoint, method = "GET", body = null, options = {}) {
//     const fetchOptions = {
//         method,
//         headers: {
//             "Authorization": state.token ? `Bearer ${state.token}` : "",
//         },
//         signal: options.signal,
//     };

//     // Handle request body
//     if (body) {
//         if (body instanceof FormData) {
//             fetchOptions.body = body;
//         } else if (typeof body === "object") {
//             fetchOptions.headers["Content-Type"] = "application/json";
//             fetchOptions.body = JSON.stringify(body);
//         } else {
//             fetchOptions.headers["Content-Type"] = "application/json";
//             fetchOptions.body = body;
//         }
//     }

//     try {
//         const response = await fetch(endpoint, fetchOptions);

//         // Handle rate limit
//         if (response.status === 429) {
//             console.warn("Too many requests");
//             return;
//         }

//         // Handle token refresh
//         if (response.status === 401 && state.refreshToken) {
//             console.warn("Token expired, attempting to refresh...");
//             const refreshed = await refreshToken();
//             if (refreshed) {
//                 return apiFetch(endpoint, method, body, options);
//             } else {
//                 throw new Error("Session expired. Please log in again.");
//             }
//         }

//         // Throw if response is not OK
//         if (!response.ok) {
//             const errorText = await response.text();
//             throw new Error(errorText || `HTTP ${response.status}`);
//         }

//         // --- Response type handling ---
//         if (options.responseType === 'blob') {
//             return response; // Caller must handle response.blob()
//         }

//         if (options.responseType === 'arrayBuffer') {
//             return await response.arrayBuffer();
//         }

//         // Default: assume JSON/text
//         const text = await response.text();
//         return text ? JSON.parse(text) : null;

//     } catch (error) {
//         if (error.name === "AbortError") {
//             console.warn("Fetch aborted:", endpoint);
//             return;
//         }

//         console.error(`Error fetching ${endpoint}:`, error);
//         throw error;
//     }
// }


// export { apiFetch, API_URL, SRC_URL, apixFetch };
import { state, API_URL, SRC_URL, setState } from "../state/state.js";
import { logout } from "../services/auth/authService.js";
import Snackbar from '../components/ui/Snackbar.mjs';

/**
 * Attempt to refresh the access token using the stored refreshToken.
 * On success, update state and localStorage with new tokens.
 * On failure, perform a silent logout.
 */
async function refreshToken() {
    const storedRefreshToken = state.refreshToken || localStorage.getItem("refreshToken");
    if (!storedRefreshToken) {
        logout(true);
        return false;
    }

    try {
        const response = await fetch(`${API_URL}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken: storedRefreshToken }),
        });

        const data = await response.json();

        if (response.ok) {
            setState(
                {
                    token: data.data.token,
                    refreshToken: data.data.refreshToken,
                },
                true
            );
            return true;
        } else {
            Snackbar("Session expired. Please log in again.", 3000);
            logout(true);
            return false;
        }
    } catch (err) {
        Snackbar("Error refreshing token.", 3000);
        logout(true);
        return false;
    }
}

/**
 * A wrapper around fetch that uses the stored JWT in Authorization header,
 * retries once if a 401 is encountered by attempting to refresh the token.
 *
 * @param {string} endpoint - Full URL to request
 * @param {string} method - HTTP method ("GET", "POST", etc.)
 * @param {object|FormData|null} body - Request body
 * @param {object} options - Additional options: { controller, responseType }
 */
async function apixFetch(endpoint, method = "GET", body = null, options = {}) {
    const fetchOptions = {
        method,
        headers: {},
        signal: options.signal,
    };

    if (state.token) {
        fetchOptions.headers["Authorization"] = `Bearer ${state.token}`;
    }

    if (body) {
        if (body instanceof FormData) {
            fetchOptions.body = body;
        } else if (typeof body === "object") {
            fetchOptions.headers["Content-Type"] = "application/json";
            fetchOptions.body = JSON.stringify(body);
        } else {
            fetchOptions.headers["Content-Type"] = "application/json";
            fetchOptions.body = body;
        }
    }

    try {
        let response = await fetch(endpoint, fetchOptions);

        // if (response.status === 429) {
        //     console.warn("Too many requests to", endpoint);
        //     alert("Too many requests");
        //     return;
        // }

        if (response.status === 409) {
            alert("Already Exists.");
            return;
        }

        if (response.status === 401 && state.refreshToken) {
            console.warn("Token expired, attempting to refresh...");
            const refreshed = await refreshToken();
            if (refreshed) {
                return apiFetch(endpoint.replace(API_URL, ""), method, body, options);
            } else {
                throw new Error("Session expired. Please log in again.");
            }
        }

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `HTTP ${response.status}`);
        }

        if (options.responseType === "blob") {
            return response;
        }

        if (options.responseType === "arrayBuffer") {
            return await response.arrayBuffer();
        }

        const text = await response.text();
        return text ? JSON.parse(text) : null;
    } catch (error) {
        if (error.name === "AbortError") {
            console.warn("Fetch aborted:", endpoint);
            return;
        }
        console.error(`Error fetching ${endpoint}:`, error);
        throw error;
    }
}

/**
 * High-level API fetcher that prepends API_URL and handles AbortController.
 *
 * @param {string} endpoint - The path (e.g. "/users") to append to API_URL
 * @param {string} method - HTTP method
 * @param {object|FormData|null} body - Request body
 * @param {object} options - { controller, responseType }
 */
async function apiFetch(endpoint, method = "GET", body = null, options = {}) {
    const controller = options.controller || new AbortController();
    const signal = controller.signal;

    const fullUrl = `${API_URL}${endpoint}`;
    return apixFetch(fullUrl, method, body, { ...options, signal });
}

export { apiFetch, API_URL, SRC_URL, apixFetch };
