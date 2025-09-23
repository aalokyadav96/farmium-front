import { createElement } from "../components/createElement.js";
import { trackEvent } from "../services/activity/metrics.js";
import {
  getState,
  subscribe,
  subscribeDeep,
  setRouteModule,
  getRouteModule,
  hasRouteModule
} from "../state/state.js";
import {
  staticRoutes,
  dynamicRoutes
} from "./routes.js";
import { navigate } from "./index.js";

/** --- Reactive login state --- */
let isLoggedIn = false;

function recomputeAuthState() {
  const token = getState("token");
  // define what "logged in" means
  isLoggedIn = Boolean(token);
}

// initial compute
recomputeAuthState();

// keep updated
subscribeDeep("token", recomputeAuthState);

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
    throw new Error(
      `Export '${functionName}' not found in module. Available exports: ${Object.keys(mod).join(", ")}`
    );
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
    const target =
      redirect.startsWith("/") && redirect !== "/login"
        ? redirect
        : "/";
    navigate(target);
  }
});
