import { createheader } from "../components/header.js";
import { createNav, highlightActiveNav } from "../components/navigation.js";
import { render } from "./router.js";
import {
  setState,
  getRouteState,
  saveScroll,
  restoreScroll,
} from "../state/state.js";

let isNavigating = false;
let isHeaderRendered = false;
let isNavRendered = false;

/**
 * Loads layout and route content into static containers
 * @param {string} url
 */
async function loadContent(url) {
  const header = document.getElementById("pageheader");
  const nav = document.getElementById("primary-nav");
  const main = document.getElementById("content");
  const footer = document.getElementById("pagefooter");

  if (!header || !nav || !main || !footer) {
    console.error("❌ Missing static layout containers in HTML.");
    return;
  }

  // Hydrate persisted state only once
  const hydratedToken = localStorage.getItem("token");
  const hydratedUser = localStorage.getItem("user");
  const hydratedUsername = localStorage.getItem("username");

  if (hydratedToken && hydratedUser) {
    setState(
      { token: hydratedToken, user: hydratedUser, username: hydratedUsername },
      true
    );
  }

  // Clear only dynamic content
  main.replaceChildren();

  // Render header only once
  if (!isHeaderRendered) {
    const headerContent = createheader();
    if (headerContent) header.appendChild(headerContent);
    isHeaderRendered = true;
  }

  // Render nav only if not rendered and route allows it
  if (!isNavRendered && url !== "/home" && url !== "/merechats") {
    const navContent = createNav();
    if (navContent) {
      nav.appendChild(navContent);
      isNavRendered = true;
    }
  }

  // Update active nav link for current route
  highlightActiveNav(url);

  // Render main page module
  await render(url, main);

  // Restore scroll position
  restoreScroll(main, getRouteState(url));
}

/**
 * SPA PushState navigation
 * @param {string} path
 */
function navigate(path) {
  if (!path) {
    console.error("🚨 navigate called with null or undefined!", new Error().stack);
    return;
  }

  if (window.location.pathname === path || isNavigating) return;

  console.log("Navigating to:", path);
  isNavigating = true;

  saveScroll(document.getElementById("content"), getRouteState(window.location.pathname));
  history.pushState(null, "", path);

  loadContent(path)
    .catch((err) => console.error("Navigation failed:", err))
    .finally(() => {
      isNavigating = false;
    });
}

/**
 * Initial page render
 */
async function renderPage() {
  await loadContent(window.location.pathname);
}

export { navigate, renderPage, loadContent };
