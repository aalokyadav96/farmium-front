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
  dynamicRoutes
} from "./routes.js";
import { navigate } from "./index.js";

/** Render a simple error message */
function renderError(container, message = "404 Not Found") {
  container.replaceChildren(createElement("h1", {}, [message]));
}

/**
 * Invokes and caches a page's render function.
 */
async function handleRoute({ path, moduleImport, functionName, args = [], contentContainer, cache }) {
  if (cache && hasRouteModule(path)) {
    return getRouteModule(path).render(contentContainer);
  }

  contentContainer.replaceChildren();

  const mod = await moduleImport();
  const renderFn = mod[functionName];
  if (typeof renderFn !== "function") {
    throw new Error(`Export '${functionName}' not found in module. Available exports: ${Object.keys(mod).join(", ")}`);
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

  // Normalize path
  let cleanPath = decodeURIComponent(String(rawPath).split(/[?#]/)[0]);
  if (cleanPath.length > 1 && cleanPath.endsWith("/")) {
    cleanPath = cleanPath.slice(0, -1);
  }

  // 1) Static route check
  const staticRoute = staticRoutes[cleanPath];
  if (staticRoute) {
    if (staticRoute.protected && !isLoggedIn) {
      sessionStorage.setItem("redirectAfterLogin", cleanPath);
      return navigate("/login");
    }

    try {
      await handleRoute({
        path: cleanPath,
        moduleImport: staticRoute.moduleImport,
        functionName: staticRoute.functionName,
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

  // 2) Dynamic route match
  for (const route of dynamicRoutes) {
    const match = cleanPath.match(route.pattern);
    if (!match) continue;

    if (route.protected && !isLoggedIn) {
      sessionStorage.setItem("redirectAfterLogin", cleanPath);
      return navigate("/login");
    }

    const args = typeof route.argBuilder === "function"
      ? route.argBuilder(match)
      : [isLoggedIn, ...match.slice(1)];

    try {
      await handleRoute({
        path: cleanPath,
        moduleImport: route.moduleImport,
        functionName: route.functionName,
        args,
        contentContainer,
        cache: true
      });
    } catch (err) {
      console.error("Error rendering dynamic route:", cleanPath, err);
      renderError(contentContainer, "500 Internal Error");
    }
    return;
  }

  // 3) No match found
  renderError(contentContainer);
}

// Redirect after login
subscribe("user", (user) => {
  const redirect = sessionStorage.getItem("redirectAfterLogin");

  if (user && redirect) {
    sessionStorage.removeItem("redirectAfterLogin");
    const target = (redirect.startsWith("/") && redirect !== "/login") ? redirect : "/";
    navigate(target);
  }
});


// import { createElement } from "../components/createElement.js";
// import { trackEvent } from "../services/activity/metrics.js";
// import {
//   getState,
//   subscribe,
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

// /** Render a simple error message */
// function renderError(container, message = "404 Not Found") {
//   container.replaceChildren(createElement("h1", {}, [message]));
// }

// /**
//  * Invokes and caches a page's render function.
//  */
// async function handleRoute({ path, moduleImport, functionName, args = [], contentContainer, cache }) {
//   if (cache && hasRouteModule(path)) {
//     return getRouteModule(path).render(contentContainer);
//   }

//   contentContainer.replaceChildren(createElement("span", {}, []));

//   const mod = await moduleImport();
//   const renderFn = mod[functionName];
//   if (typeof renderFn !== "function") {
//     throw new Error(`Export '${functionName}' not found in module. Available exports: ${Object.keys(mod).join(", ")}`);
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
//  * Resolves and renders the appropriate route.
//  * @param {string} rawPath
//  * @param {HTMLElement} contentContainer
//  */
// export async function render(rawPath, contentContainer) {
//   const isLoggedIn = !!getState("user");
//   trackEvent("page_view");

//   // Clean path (remove query/hash, normalize)
//   let cleanPath = decodeURIComponent(String(rawPath).split(/[?#]/)[0]);
//   if (cleanPath.length > 1 && cleanPath.endsWith("/")) {
//     cleanPath = cleanPath.slice(0, -1);
//   }

//   // 1) Guard protected static routes
//   if (protectedRoutes.has(cleanPath) && !isLoggedIn) {
//     sessionStorage.setItem("redirectAfterLogin", cleanPath);
//     return navigate("/login");
//   }

//   // 2) Static routes
//   const staticRoute = staticRoutes[cleanPath];
//   if (staticRoute) {
//     try {
//       await handleRoute({
//         path: cleanPath,
//         moduleImport: staticRoute.moduleImport,
//         functionName: staticRoute.functionName,
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

//   // 3) Prioritized dynamic routes (most specific first)
//   const matchedRoute = dynamicRoutes.find(route => cleanPath.match(route.pattern));
//   if (matchedRoute) {
//     const match = cleanPath.match(matchedRoute.pattern);
//     const args = match.slice(1); // skip full match [0]

//     if (matchedRoute.protected && !isLoggedIn) {
//       sessionStorage.setItem("redirectAfterLogin", cleanPath);
//       return navigate("/login");
//     }

//     try {
//       await handleRoute({
//         path: cleanPath,
//         moduleImport: matchedRoute.moduleImport,
//         functionName: matchedRoute.functionName,
//         args: [isLoggedIn, ...args],
//         contentContainer,
//         cache: true
//       });
//     } catch (err) {
//       console.error("Error rendering dynamic route:", cleanPath, err);
//       renderError(contentContainer, "500 Internal Error");
//     }
//     return;
//   }

//   // 4) No match
//   renderError(contentContainer);
// }

// // Redirect after login
// subscribe("user", (user) => {
//   const redirect = sessionStorage.getItem("redirectAfterLogin");

//   if (user && redirect) {
//     sessionStorage.removeItem("redirectAfterLogin");
//     const target = (redirect.startsWith("/") && redirect !== "/login") ? redirect : "/";
//     navigate(target);
//   }
// });


// // // router.js
// // import { createElement } from "../components/createElement.js";
// // import { trackEvent } from "../services/activity/metrics.js";
// // import {
// //   getState,
// //   subscribe,
// //   setRouteModule,
// //   getRouteModule,
// //   hasRouteModule
// // } from "../state/state.js";
// // import {
// //   staticRoutes,
// //   dynamicRoutes,
// //   protectedRoutes
// // } from "./routes.js";
// // import { navigate } from "./index.js";

// // /** Render a simple error message */
// // function renderError(container, message = "404 Not Found") {
// //   container.replaceChildren(createElement("h1", {}, [message]));
// // }

// // /**
// //  * Invokes and caches a page's render function.
// //  */
// // async function handleRoute({ path, moduleImport, functionName, args = [], contentContainer, cache }) {
// //   if (cache && hasRouteModule(path)) {
// //     return getRouteModule(path).render(contentContainer);
// //   }

// //   container.replaceChildren(createElement("span", {}, []));

// //   const mod = await moduleImport();
// //   const renderFn = mod[functionName];
// //   if (typeof renderFn !== "function") {
// //     // throw new Error(`Export '${functionName}' not found in module`);
// //     throw new Error(`Export '${functionName}' not found in module. Available exports: ${Object.keys(mod).join(", ")}`);

// //   }

// //   const fullArgs = [...args, contentContainer];
// //   await renderFn(...fullArgs);

// //   if (cache) {
// //     setRouteModule(path, {
// //       render: (container) => renderFn(...args, container)
// //     });
// //   }
// // }

// // /**
// //  * Resolves and renders the appropriate route.
// //  * @param {string} rawPath
// //  * @param {HTMLElement} contentContainer
// //  */
// // export async function render(rawPath, contentContainer) {
// //   const isLoggedIn = !!getState("user");
// //   trackEvent("page_view");

// //   // Clean path (remove query/hash, normalize)
// //   let cleanPath = decodeURIComponent(String(rawPath).split(/[?#]/)[0]);
// //   if (cleanPath.length > 1 && cleanPath.endsWith("/")) {
// //     cleanPath = cleanPath.slice(0, -1);
// //   }

// //   // 1) Guard protected static routes
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
// //         args: [isLoggedIn],
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
    
// //     const args = match.slice(1); // Only capture groups, skip match[0]
    
// //     if (route.protected && !isLoggedIn) {
// //       sessionStorage.setItem("redirectAfterLogin", cleanPath);
// //       return navigate("/login");
// //     }
    
// //     try {
// //       await handleRoute({
// //         path: cleanPath,
// //         moduleImport: route.moduleImport,
// //         functionName: route.functionName,
// //         args: [isLoggedIn, ...args],
// //         contentContainer,
// //         cache: true
// //       });
// //     } catch (err) {
// //       console.error("Error rendering dynamic route:", cleanPath, err);
// //       renderError(contentContainer, "500 Internal Error");
// //     }
    
// //     return;
// //   }

// //   // 4) No match
// //   renderError(contentContainer);
// // }

// // // Redirect after login
// // subscribe("user", (user) => {
// //   const redirect = sessionStorage.getItem("redirectAfterLogin");

// //   if (user && redirect) {
// //     sessionStorage.removeItem("redirectAfterLogin");

// //     const target = (redirect.startsWith("/") && redirect !== "/login") ? redirect : "/";
// //     navigate(target);
// //   }
// // });
