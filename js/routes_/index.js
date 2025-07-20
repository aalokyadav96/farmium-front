import { attachNavEventListeners, createheader } from "../components/header.js";
import { createNav, highlightActiveNav } from "../components/navigation.js";
import { secnav } from "../components/secNav.js";
import { renderPageContent } from "./render.js";
import {sticky} from "../components/sticky.js";
import {
  getState,
  setState,
  getRouteState,
  hasRouteModule,
  getRouteModule,
  setRouteModule
} from "../state/state.js";

import {
  saveScroll,
  restoreScroll
} from "../state/scrollState.js";

let isNavigating = false;

/**
 * Loads layout and route content into static containers
 * @param {string} url
 */
async function loadContent(url) {
  const header = document.getElementById("pageheader");
  const nav = document.getElementById("primary-nav");
  const secNavElement = document.getElementById("secondary-nav");
  const main = document.getElementById("content");
  const footer = document.getElementById("pagefooter");

  if (!header || !nav || !main || !footer || !secNavElement) {
    console.error("❌ Missing static layout containers in HTML.");
    return;
  }

  // hydrate persisted state only once
  const hydratedToken = localStorage.getItem("token");
  const hydratedUser = localStorage.getItem("user");

  if (hydratedToken && hydratedUser) {
    // setState({ token: hydratedToken, user: JSON.parse(hydratedUser) }, true);
    setState({ token: hydratedToken, user: hydratedUser }, true);
  }

  // Clear dynamic DOM sections
  header.replaceChildren();
  nav.replaceChildren();
  secNavElement.replaceChildren();
  main.replaceChildren();

  // Render layout
  const headerContent = createheader();
  if (headerContent) header.appendChild(headerContent);

  // const navContent = createNav();
  // if (navContent) nav.appendChild(navContent);
  const navContent = createNav();
  if (navContent) {
    nav.appendChild(navContent);
    highlightActiveNav(url); // 🔥 This makes sure the active link reflects current URL
  }


  const secNav = secnav();
  if (secNav) secNavElement.appendChild(secNav);

  attachNavEventListeners();

  footer.appendChild(sticky());

  // Render page module
  const isLoggedIn = Boolean(getState("token"));
  await renderPageContent(isLoggedIn, url, main);

  // Restore scroll
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

  history.pushState(null, "", path);
  loadContent(path)
    .catch(err => console.error("Navigation failed:", err))
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

// Listen to popstate (back/forward)
window.addEventListener("popstate", () => {
  loadContent(window.location.pathname);
});

export { navigate, renderPage, loadContent };
