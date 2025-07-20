// router.js
import { createElement } from "../components/createElement.js";
import { trackEvent } from "../services/activity/metrics.js";
import {
  getState,
  subscribe,
  setRouteModule,
  getRouteModule,
  hasRouteModule
} from "../state/state.js";
import {
  staticRoutes,
  dynamicRoutes,
  protectedRoutes
} from "./routes.js";
import { navigate } from "./index.js";

/** Render a simple error message */
function renderError(container, message = "404 Not Found") {
  container.innerHTML = "";
  container.appendChild(createElement("h1", {}, [message]));
}

/**
 * Invokes and caches a page's render function.
 */
async function handleRoute({ path, moduleImport, functionName, args = [], contentContainer, cache }) {
  if (cache && hasRouteModule(path)) {
    return getRouteModule(path).render(contentContainer);
  }

  contentContainer.innerHTML = "";

  const mod = await moduleImport();
  const renderFn = mod[functionName];
  if (typeof renderFn !== "function") {
    throw new Error(`Export '${functionName}' not found in module`);
  }

  const fullArgs = [...args, contentContainer];
  await renderFn(...fullArgs);

  if (cache) {
    setRouteModule(path, {
      render: (container) => renderFn(...args, container)
    });
  }
}

/**
 * Resolves and renders the appropriate route.
 * @param {string} rawPath
 * @param {HTMLElement} contentContainer
 */
export async function render(rawPath, contentContainer) {
  const isLoggedIn = !!getState("user");
  trackEvent("page_view");

  // Clean path (remove query/hash, normalize)
  let cleanPath = decodeURIComponent(String(rawPath).split(/[?#]/)[0]);
  if (cleanPath.length > 1 && cleanPath.endsWith("/")) {
    cleanPath = cleanPath.slice(0, -1);
  }

  // 1) Guard protected static routes
  if (protectedRoutes.has(cleanPath) && !isLoggedIn) {
    sessionStorage.setItem("redirectAfterLogin", cleanPath);
    return navigate("/login");
  }

  // 2) Static routes
  if (staticRoutes[cleanPath]) {
    try {
      await handleRoute({
        path: cleanPath,
        moduleImport: staticRoutes[cleanPath].moduleImport,
        functionName: staticRoutes[cleanPath].functionName,
        args: [isLoggedIn],
        contentContainer,
        cache: true
      });
    } catch (err) {
      console.error("Error rendering static route:", cleanPath, err);
      renderError(contentContainer, "500 Internal Error");
    }
    return;
  }

  // 3) Dynamic routes
  for (const route of dynamicRoutes) {
    const match = cleanPath.match(route.pattern);
    if (!match) continue;
    
    const args = match.slice(1); // Only capture groups, skip match[0]
    
    if (route.protected && !isLoggedIn) {
      sessionStorage.setItem("redirectAfterLogin", cleanPath);
      return navigate("/login");
    }
    
    try {
      await handleRoute({
        path: cleanPath,
        moduleImport: route.moduleImport,
        functionName: route.functionName,
        args: [isLoggedIn, ...args],
        contentContainer,
        cache: true
      });
    } catch (err) {
      console.error("Error rendering dynamic route:", cleanPath, err);
      renderError(contentContainer, "500 Internal Error");
    }
    
    return;
  }

  // 4) No match
  renderError(contentContainer);
}

// Handle back/forward browser navigation
// window.addEventListener("popstate", () => {
//   const container = document.getElementById("content");
//   if (container) render(window.location.pathname, container);
// });

// // Redirect after login
subscribe("user", (user) => {
  const redirect = sessionStorage.getItem("redirectAfterLogin");

  if (user && redirect) {
    sessionStorage.removeItem("redirectAfterLogin");

    const target = (redirect.startsWith("/") && redirect !== "/login") ? redirect : "/";
    navigate(target);
  }
});

// subscribe("user", (user) => {
//   if (user) {
//     const redirect = sessionStorage.getItem("redirectAfterLogin") || "/";
//     sessionStorage.removeItem("redirectAfterLogin");

//     const target = (redirect.startsWith("/") && redirect !== "/login") ? redirect : "/";
//     navigate(target);
//   }
// });

// // router.js
// import { createElement } from "../components/createElement.js";
// import { trackEvent } from "../services/activity/metrics.js";
// import {
//   getState,
//   subscribe,
//   clearState,
//   setRouteModule,
//   getRouteModule,
//   hasRouteModule
// } from "../state/state.js";
// import {
//   staticRoutes,
//   dynamicRoutes,
//   protectedRoutes
// } from "./routes.js";
// import { navigate } from "./index.js";

// // let isNavigating = false;

// /** Renders a basic error message. */
// function renderError(container, message = "404 Not Found") {
//   container.innerHTML = "";
//   container.appendChild(createElement("h1", {}, [message]));
// }

// /** Actually invokes the page’s render function and caches it. */
// async function handleRoute({ path, moduleImport, functionName, args = [], contentContainer, cache }) {
//   // Cache hit
//   if (cache && hasRouteModule(path)) {
//     return getRouteModule(path).render(contentContainer);
//   }

//   contentContainer.innerHTML = "";

//   const mod = await moduleImport();
//   const renderFn = mod[functionName];
//   if (typeof renderFn !== "function") {
//     throw new Error(`Export '${functionName}' not found in module`);
//   }

//   const fullArgs = [...args, contentContainer];
//   await renderFn(...fullArgs);

//   if (cache) {
//     setRouteModule(path, {
//       render: (container) => renderFn(...args, container)
//     });
//   }
// }

// /**
//  * Main entrypoint: determines route, guards, and renders.
//  * @param {string} rawPath
//  * @param {HTMLElement} contentContainer
//  */
// export async function render(rawPath, contentContainer) {
//   const isLoggedIn = !!getState("user");
//   trackEvent("page_view");

//   // sanitize and strip query/hash
//   const cleanPath = decodeURIComponent(String(rawPath).split(/[?#]/)[0]);

//   // 1) Guard protected static routes
//   if (protectedRoutes.has(cleanPath) && !isLoggedIn) {
//     sessionStorage.setItem("redirectAfterLogin", cleanPath);
//     return navigate("/login");
//   }

//   // 2) Static routes
//   if (staticRoutes[cleanPath]) {
//     try {
//       await handleRoute({
//         path: cleanPath,
//         moduleImport: staticRoutes[cleanPath].moduleImport,
//         functionName: staticRoutes[cleanPath].functionName,
//         args: [isLoggedIn],
//         contentContainer,
//         cache: true
//       });
//     } catch (err) {
//       console.error("Error rendering static route:", cleanPath, err);
//       renderError(contentContainer, "500 Internal Error");
//     }
//     return;
//   }

//   // 3) Dynamic routes
//   for (const route of dynamicRoutes) {
//     const match = cleanPath.match(route.pattern);
//     if (!match) continue;

//     // Guard if flagged
//     if (route.protected && !isLoggedIn) {
//       sessionStorage.setItem("redirectAfterLogin", cleanPath);
//       return navigate("/login");
//     }

//     try {
//       await handleRoute({
//         path: cleanPath,
//         moduleImport: route.moduleImport,
//         functionName: route.functionName,
//         args: [isLoggedIn, match],
//         contentContainer,
//         cache: true
//       });
//     } catch (err) {
//       console.error("Error rendering dynamic route:", cleanPath, err);
//       renderError(contentContainer, "500 Internal Error");
//     }
//     return;
//   }

//   // 4) If nothing matched
//   renderError(contentContainer);
// }

// /** SPA navigation helper */
// // export function navigate(path) {
// //   if (!path || isNavigating || window.location.pathname === path) return;

// //   isNavigating = true;
// //   history.pushState(null, "", path);
// //   render(path, document.getElementById("content"))
// //     .catch(err => console.error("Navigation failed:", err))
// //     .finally(() => { isNavigating = false; });
// // }

// // Handle browser back/forward
// window.addEventListener("popstate", () => {
//   render(window.location.pathname, document.getElementById("content"));
// });

// // Redirect after login
// subscribe("user", (user) => {
//   if (user) {
//     const redirect = sessionStorage.getItem("redirectAfterLogin") || "/";
//     sessionStorage.removeItem("redirectAfterLogin");

//     const target = (redirect.startsWith("/") && redirect !== "/login") ? redirect : "/";
//     // window.location.href = target; // Use navigate(target) if SPA behavior desired
//     navigate(target); // Use navigate(target) if SPA behavior desired
//   }
// });

// // // router.js
// // import { createElement } from "../components/createElement.js";
// // import { navigate as navigateTo } from "./index.js";     // if you factored navigate out
// // import { trackEvent } from "../services/activity/metrics.js";
// // import {
// //   getState,
// //   subscribe,
// //   clearState,
// //   setRouteModule,
// //   getRouteModule,
// //   hasRouteModule
// // } from "../state/state.js";
// // import {
// //   staticRoutes,
// //   dynamicRoutes,
// //   protectedRoutes
// // } from "./routes.js";

// // let isNavigating = false;

// // /** Renders a basic error message. */
// // function renderError(container, message = "404 Not Found") {
// //   container.innerHTML = "";
// //   container.appendChild(createElement("h1", {}, [message]));
// // }

// // /** Actually invokes the page’s render function and caches. */
// // async function handleRoute({ path, moduleImport, functionName, args = [], contentContainer, cache }) {
// //   // Cache hit?
// //   if (cache && hasRouteModule(path)) {
// //     getRouteModule(path).render(contentContainer);
// //     return;
// //   }

// //   contentContainer.innerHTML = "";
// //   const mod = await moduleImport();
// //   const renderFn = mod[functionName];
// //   if (typeof renderFn !== "function") {
// //     throw new Error(`Export '${functionName}' not found in module`);
// //   }

// //   await renderFn(...args);

// //   if (cache) {
// //     setRouteModule(path, {
// //       render: () => renderFn(...args, contentContainer)
// //     });
// //   }
// // }

// // /**
// //  * Main entrypoint: determines route, guards, and renders.
// //  * @param {string} rawPath
// //  * @param {HTMLElement} contentContainer
// //  */
// // export async function render(rawPath, contentContainer) {
// //   const isLoggedIn = !!getState("user");
// //   trackEvent("page_view");

// //   // sanitize and strip query/hash
// //   const cleanPath = decodeURIComponent(rawPath.split(/[?#]/)[0]);

// //   // 1) Guard static protected routes
// //   if (protectedRoutes.has(cleanPath) && !isLoggedIn) {
// //     sessionStorage.setItem("redirectAfterLogin", cleanPath);
// //     return navigate("/login");
// //   }

// //   // 2) Static routes
// //   if (staticRoutes[cleanPath]) {
// //     try {
// //       await handleRoute({
// //         path: cleanPath,
// //         moduleImport: staticRoutes[cleanPath].moduleImport,
// //         functionName: staticRoutes[cleanPath].functionName,
// //         args: [isLoggedIn, contentContainer],
// //         contentContainer,
// //         cache: true
// //       });
// //     } catch (err) {
// //       console.error("Error rendering static route:", cleanPath, err);
// //       renderError(contentContainer, "500 Internal Error");
// //     }
// //     return;
// //   }

// //   // 3) Dynamic routes
// //   for (const route of dynamicRoutes) {
// //     const match = cleanPath.match(route.pattern);
// //     if (!match) continue;

// //     // protect if flagged
// //     if (route.protected && !isLoggedIn) {
// //       sessionStorage.setItem("redirectAfterLogin", cleanPath);
// //       return navigate("/login");
// //     }

// //     try {
// //       // const args = route.argBuilder(match);
// //       const args = [isLoggedIn, match[1], contentContainer];
// //       await handleRoute({
// //         path: cleanPath,
// //         moduleImport: route.moduleImport,
// //         functionName: route.functionName,
// //         args,
// //         contentContainer,
// //         cache: true
// //       });
// //     } catch (err) {
// //       console.error("Error rendering dynamic route:", cleanPath, err);
// //       renderError(contentContainer, "500 Internal Error");
// //     }
// //     return;
// //   }

// //   // 4) If nothing matched
// //   renderError(contentContainer);
// // }

// // /** SPA navigation helper */
// // export function navigate(path) {
// //   if (!path || isNavigating || window.location.pathname === path) return;
// //   isNavigating = true;
// //   history.pushState(null, "", path);
// //   render(path, document.getElementById("app-content"))
// //     .catch(err => console.error("Navigation failed:", err))
// //     .finally(() => { isNavigating = false; });
// // }

// // // handle browser back/forward
// // window.addEventListener("popstate", () => {
// //   render(window.location.pathname, document.getElementById("app-content"));
// // });

// // // redirect after login
// // subscribe("user", (user) => {
// //   if (user) {
// //     const redirect = sessionStorage.getItem("redirectAfterLogin") || "/";
// //     sessionStorage.removeItem("redirectAfterLogin");
// //     // sanitize
// //     const target = (redirect.startsWith("/") && redirect !== "/login") ? redirect : "/";
// //     window.location.href = target;
// //   }
// // });
