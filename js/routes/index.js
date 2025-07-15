import { attachNavEventListeners, createheader } from "../components/header.js";
import { createNav } from "../components/navigation.js";
import { secnav } from "../components/secNav.js";
import { renderPageContent } from "./render.js";
import { getState } from "../state/state.js";

import {
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
 * Loads page layout and route content.
 * Handles login check, layout rendering, scroll state.
 * @param {string} url
 */
async function loadContent(url) {
  const app = document.getElementById("app");

  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");

  if (token && user) {
    setState({ token, user }, true);
  }

  let main = document.getElementById("content");

  if (main && hasRouteModule(url)) {
    const cached = getRouteModule(url);
    if (cached?.render) {
      cached.render(main);
      restoreScroll(main, getRouteState(url));
      return;
    }
  }

  app.innerHTML = "";

  main = document.createElement("main");
  main.id = "content";

  const header = createheader();
  header.id = "layout-rendered";
  app.appendChild(header);

  app.appendChild(createNav());
  const secNavElement = secnav();
  if (secNavElement) app.appendChild(secNavElement);

  app.appendChild(main);

  attachNavEventListeners();

  await renderPageContent(Boolean(getState("token")), url, main);
  restoreScroll(main, getRouteState(url));
}

/**
 * Navigate to a new path (SPA pushState).
 * Prevents spam clicks and redundant navigation.
 * @param {string} path
 */
function navigate(path) {
  if (!path) {
    console.error("🚨 navigate called with null or undefined!", new Error().stack);
    return;
  }

  // sessionStorage.setItem("redirectAfterLogin", window.location.pathname);

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
 * Initial render on first page load.
 */
async function renderPage() {
  await loadContent(window.location.pathname);
}

// Handle back/forward browser buttons
window.addEventListener("popstate", () => {
  loadContent(window.location.pathname);
});

export { navigate, renderPage, loadContent };
