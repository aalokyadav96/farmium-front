import { getState, isAdmin, subscribeDeep } from "../state/state.js";
import { navigate } from "../routes/index.js";
import { logout } from "../services/auth/authService.js";
import { settingsSVG, moonSVG, menuSVG, profileSVG, shopBagSVG, logoutSVG, cardSVG } from "./svgs.js";
import { createElement } from "../components/createElement.js";
import { sticky } from "./sticky.js";
import { toggleSidebar } from "./sidebar.js";
import { resolveImagePath, EntityType, PictureType } from "../utils/imagePaths.js";
import Imagex from "./base/Imagex.js";
// import {decodeJWT} from "../services/auth/authService.js";

// Theme logic
const themes = ["light", "dark", "solarized", "dimmed"];
let currentThemeIndex = 0;

function loadTheme() {
  const saved = localStorage.getItem("theme");
  const index = themes.indexOf(saved);
  if (index >= 0) {
    document.documentElement.dataset.theme = saved;
    currentThemeIndex = index;
  }
}

function toggleTheme() {
  currentThemeIndex = (currentThemeIndex + 1) % themes.length;
  const theme = themes[currentThemeIndex];
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("theme", theme);
}

// --- DOM Utilities ---
function createIconButton(svg, href, onClick) {
  const icon = createElement("span", { class: "icon" });
  icon.innerHTML = svg;

  const anchor = createElement("div", { class: "iconic-button" }, [icon]);
  if (href) anchor.href = href;
  if (onClick) anchor.addEventListener("click", onClick);

  return anchor;
}

function createDropdownMenu(id, labelText, items) {
  const toggle = createElement("button", { id, class: "menu-toggle" }, [labelText]);
  const menu = createElement("div", { class: "menu-content", "aria-label": labelText });

  items.forEach(({ href, text }) => {
    const link = createElement("a", { class: "menu-item", href }, [text]);
    link.addEventListener("click", (e) => {
      e.preventDefault();
      navigate(href);
    });
    menu.appendChild(link);
  });

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    menu.classList.toggle("open");
  });

  return createElement("div", { class: "dropdown" }, [toggle, menu]);
}

// --- Profile Section ---
export function createProfileSection(userId, username) {
  const img = Imagex({
    src: resolveImagePath(EntityType.USER, PictureType.THUMB, `${userId}.jpg`),
    alt: "Profile",
    classes: "profile-pic"
  });

  // img.onerror = () => {
  //   img.src = resolveImagePath(EntityType.DEFAULT, PictureType.STATIC, "placeholder.png");
  // };

  const toggle = createElement("div", { class: "profile-toggle", tabIndex: 0 }, [img]);

  const links = [
    { href: "/profile", text: username, icon: profileSVG },
    { href: "/my-orders", text: "My Orders", icon: shopBagSVG },
    ...(isAdmin() ? [{ href: "/admin", text: "Admin" }] : []),
    { href: "/wallet", text: "Wallet", icon: cardSVG },
    { href: "/settings", text: "Settings", icon: settingsSVG }
  ];

  const menu = createElement("div", { class: "profile-menu" });

  links.forEach(({ href, text, icon }) => {
    const label = createElement("span", {}, [text]);
    const iconSpan = createElement("span", {});
    if (icon) iconSpan.innerHTML = icon;

    const link = createElement("a", { class: "menu-item", href }, [iconSpan, label]);
    link.addEventListener("click", (e) => {
      e.preventDefault();
      navigate(href);
    });

    menu.appendChild(link);
  });

  const logoutBtn = createElement("button", { class: "menu-item logout" }, []);
  logoutBtn.innerHTML = logoutSVG;
  logoutBtn.appendChild(createElement("span", {}, ["Logout"]));
  logoutBtn.addEventListener("click", logout);

  menu.appendChild(logoutBtn);

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    menu.classList.toggle("open");
  });

  toggle.addEventListener("keydown", (e) => {
    if (["Enter", " "].includes(e.key)) {
      e.preventDefault();
      menu.classList.toggle("open");
    }
  });

  document.addEventListener("click", () => menu.classList.remove("open"));

  return createElement("div", { class: "dropdown" }, [toggle, menu]);
}

// --- User Section ---
function renderUserSection() {
  const container = createElement("div", { class: "user-area" });

  function update() {
    container.innerHTML = "";
    const token = getState("token");
    const userId = getState("user");
    // const decoded = decodeJWT(token);
    // const username = decoded.username;
    const username = getState("username");

    if (token && userId) {
      container.appendChild(createProfileSection(userId, username));
    } else {
      const loginBtn = createElement("a", { href: "#", class: "login-btn" }, ["Login"]);
      loginBtn.addEventListener("click", () => navigate("/login"));
      container.appendChild(loginBtn);
    }
  }

  // --- Subscribe to deep state changes
  subscribeDeep("token", update);
  subscribeDeep("userProfile.role", update);

  update();

  return container;
}

// --- Header Builder ---
function createHeader() {
  const header = document.getElementById("pageheader");
  if (!header) return;

  header.className = "main-header";

  const logo = createElement("div", { class: "logo" }, [
    createIconButton(menuSVG, null, toggleSidebar),
    createElement("a", { href: "/home", class: "logo-link" }, ["Itanium"])
  ]);

  const sky = createElement("div", { class: "hflexcen" }, []);
  sky.appendChild(sticky({
    imglink: Imagex({
      src: resolveImagePath(EntityType.USER, PictureType.THUMB, `${getState("user")}.jpg`),
      alt: "Profile",
      classes: "profile-pic"
    })
  }));

  const nav = createElement("div", { class: "header-content" }, []);
  
  const token = getState("token");
  if (token) {
  const createLinks = [
    { href: "/create-event", text: "Event" },
    { href: "/create-place", text: "Place" },
    { href: "/create-artist", text: "Artist" },
    { href: "/create-post", text: "Post" },
    { href: "/create-baito", text: "Baito" },
    { href: "/create-farm", text: "Farm" },
    { href: "/create-itinerary", text: "Itinerary" }
  ];
  nav.appendChild(createDropdownMenu("create-menu", "Create", createLinks));
}

  nav.appendChild(createIconButton(moonSVG, null, toggleTheme));
  nav.appendChild(renderUserSection());

  header.replaceChildren(logo, sky, nav);
  loadTheme();
}

export { createHeader as createheader };
