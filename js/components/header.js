// // Imports
// import {
//   getState,
//   isAdmin,
//   subscribe,
//   unsubscribe
// } from "../state/state.js";
// import { navigate } from "../routes/index.js";
// import { logout } from "../services/auth/authService.js";
// import {
//   settingsSVG,
//   moonSVG,
//   profileSVG,
//   shopBagSVG,
//   logoutSVG
// } from "./svgs.js";
// import { createElement } from "../components/createElement.js";
// import { sticky } from "./sticky.js";
// import {
//   resolveImagePath,
//   EntityType,
//   PictureType
// } from "../utils/imagePaths.js";

// // Theme logic
// const themes = ["light", "dark", "solarized", "dimmed"];
// let currentThemeIndex = 0;

// function loadTheme() {
//   const saved = localStorage.getItem("theme");
//   const index = themes.indexOf(saved);
//   if (index >= 0) {
//     document.documentElement.dataset.theme = saved;
//     currentThemeIndex = index;
//   }
// }

// function toggleTheme() {
//   currentThemeIndex = (currentThemeIndex + 1) % themes.length;
//   const theme = themes[currentThemeIndex];
//   document.documentElement.dataset.theme = theme;
//   localStorage.setItem("theme", theme);
// }

// // Utility: Icon Button
// function createIconButton(svg, ariaLabel, onClick) {
//   const icon = createElement("span", { class: "icon" });
//   icon.innerHTML = svg;

//   const button = createElement("button", {
//     class: "iconic-button",
//     "aria-label": ariaLabel,
//     tabIndex: 0
//   }, [icon]);

//   if (onClick) button.addEventListener("click", onClick);
//   return button;
// }

// // Utility: Dropdown Menu
// function createDropdownMenu(id, labelText, items) {
//   const toggle = createElement("button", {
//     id,
//     class: "menu-toggle",
//     "aria-haspopup": "true",
//     "aria-expanded": "false"
//   }, [labelText]);

//   const menu = createElement("div", {
//     class: "menu-content",
//     role: "menu",
//     "aria-label": labelText
//   });

//   items.forEach(({ href, text }) => {
//     const link = createElement("a", {
//       class: "menu-item",
//       href,
//       role: "menuitem"
//     }, [text]);

//     link.addEventListener("click", (e) => {
//       e.preventDefault();
//       navigate(href);
//     });

//     menu.appendChild(link);
//   });

//   toggle.addEventListener("click", (e) => {
//     e.stopPropagation();
//     const isOpen = menu.classList.toggle("open");
//     toggle.setAttribute("aria-expanded", isOpen);
//   });

//   return createElement("div", { class: "dropdown" }, [toggle, menu]);
// }

// // Profile Section
// function createProfileSection(userId) {
//   const img = createElement("img", {
//     src: resolveImagePath(EntityType.USER, PictureType.THUMB, `${userId}.jpg`),
//     alt: "Profile Picture",
//     class: "profile-pic"
//   });

//   img.onerror = () => {
//     img.src = resolveImagePath(EntityType.DEFAULT, PictureType.STATIC, "placeholder.png");
//   };

//   const toggle = createElement("button", {
//     class: "profile-toggle",
//     "aria-haspopup": "true",
//     "aria-expanded": "false"
//   }, [img]);

//   const links = [
//     { href: "/profile", text: "Profile", icon: profileSVG },
//     { href: "/my-orders", text: "My Orders", icon: shopBagSVG },
//     ...(isAdmin() ? [{ href: "/admin", text: "Admin" }] : []),
//     { href: "/settings", text: "Settings", icon: settingsSVG }
//   ];

//   const menu = createElement("div", {
//     class: "profile-menu",
//     role: "menu"
//   });

//   links.forEach(({ href, text, icon }) => {
//     const label = createElement("span", {}, [text]);
//     const iconSpan = createElement("span", {});
//     if (icon) iconSpan.innerHTML = icon;

//     const link = createElement("a", {
//       class: "menu-item",
//       href,
//       role: "menuitem"
//     }, [iconSpan, label]);

//     link.addEventListener("click", (e) => {
//       e.preventDefault();
//       navigate(href);
//     });

//     menu.appendChild(link);
//   });

//   const logoutBtn = createElement("button", {
//     class: "menu-item logout",
//     role: "menuitem"
//   }, []);
//   logoutBtn.innerHTML = logoutSVG;
//   logoutBtn.appendChild(createElement("span", {}, ["Logout"]));
//   logoutBtn.addEventListener("click", () => logout());

//   menu.appendChild(logoutBtn);

//   toggle.addEventListener("click", (e) => {
//     e.stopPropagation();
//     const isOpen = menu.classList.toggle("open");
//     toggle.setAttribute("aria-expanded", isOpen);
//   });

//   document.addEventListener("click", () => {
//     menu.classList.remove("open");
//     toggle.setAttribute("aria-expanded", "false");
//   });

//   return createElement("div", { class: "dropdown" }, [toggle, menu]);
// }

// // User Section
// function renderUserSection() {
//   const container = createElement("div", { class: "user-area" });

//   function render() {
//     container.innerHTML = "";
//     const userId = getState("user") || localStorage.getItem("user");

//     if (!!getState("token")) {
//       container.appendChild(createProfileSection(userId));
//     } else {
//       const loginBtn = createElement("a", {
//         href: "#",
//         class: "login-btn",
//         "aria-label": "Login"
//       }, ["Login"]);

//       loginBtn.addEventListener("click", () => navigate("/login"));
//       container.appendChild(loginBtn);
//     }
//   }

//   render();
//   const userChangeHandler = () => render();
//   subscribe("user", userChangeHandler);

//   const observer = new MutationObserver(() => {
//     if (!document.body.contains(container)) {
//       unsubscribe("user", userChangeHandler);
//       observer.disconnect();
//     }
//   });

//   observer.observe(document.body, { childList: true, subtree: true });

//   return container;
// }

// // Header Builder
// function createHeader() {
//   const header = document.getElementById("pageheader");
//   if (!header) return;

//   header.className = "main-header";

//   const logo = createElement("div", { class: "logo" }, [
//     createElement("a", {
//       href: "/home",
//       class: "logo-link",
//       "aria-label": "Farmium Home"
//     }, ["Farmium"])
//   ]);

//   const sky = createElement("div", { class: "hflexcen" }, [sticky()]);

//   const nav = createElement("div", { class: "header-content" }, []);

//   const createLinks = [
//     { href: "/create-event", text: "Event" },
//     { href: "/create-place", text: "Place" },
//     { href: "/create-artist", text: "Artist" },
//     { href: "/create-post", text: "Post" },
//     { href: "/create-baito", text: "Baito" },
//     { href: "/create-farm", text: "Farm" },
//     { href: "/create-itinerary", text: "Itinerary" }
//   ];

//   nav.appendChild(createDropdownMenu("create-menu", "Create", createLinks));
//   nav.appendChild(createIconButton(moonSVG, "Toggle Theme", toggleTheme));
//   nav.appendChild(renderUserSection());

//   header.replaceChildren(logo, sky, nav);
//   loadTheme();
// }

// export { createHeader as createheader };

// Imports
import { getState, isAdmin, subscribe, unsubscribe } from "../state/state.js";
import { navigate } from "../routes/index.js";
import { logout } from "../services/auth/authService.js";
import { settingsSVG, moonSVG, profileSVG, shopBagSVG, logoutSVG } from "./svgs.js";
import { createElement } from "../components/createElement.js";
import {sticky} from "./sticky.js";
import { resolveImagePath, EntityType, PictureType } from "../utils/imagePaths.js";


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

// Utility: create icon anchor
function createIconButton(svg, href, onClick) {
  const icon = createElement("span", { class: "icon" });
  icon.innerHTML = svg;

  const anchor = createElement("div", { class: "iconic-button" }, [icon]);
  if (href) anchor.href = href;
  if (onClick) anchor.addEventListener("click", onClick);

  return anchor;
}

// Utility: create dropdown
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


function createProfileSection(userId) {
  const img = createElement("img", {
    src: resolveImagePath(EntityType.USER, PictureType.THUMB, `${userId}.jpg`),
    alt: "Profile",
    class: "profile-pic"
  });

  // fallback if image fails to load

  img.onerror = () => {
    img.src = resolveImagePath(EntityType.DEFAULT, PictureType.STATIC, "placeholder.png");
  };


  const toggle = createElement("div", {
    class: "profile-toggle",
    tabIndex: 0
  }, [img]);

  const links = [
    { href: "/profile", text: "Profile", icon: profileSVG },
    { href: "/my-orders", text: "My Orders", icon: shopBagSVG },
    ...(isAdmin() ? [{ href: "/admin", text: "Admin" }] : []),
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
  logoutBtn.addEventListener("click", () => logout());

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

// User Section
function renderUserSection() {
  const container = createElement("div", { class: "user-area" });

  function render() {
    container.innerHTML = "";
    const userId = getState("user") || localStorage.getItem("user");

    if (!!getState("token")) {
      container.appendChild(createProfileSection(userId));
    } else {
      const loginBtn = createElement("a", { href: "#", class: "login-btn" }, ["Login"]);
      loginBtn.addEventListener("click", () => navigate("/login"));
      container.appendChild(loginBtn);
    }
  }

  render();
  const userChangeHandler = () => render();
  subscribe("user", userChangeHandler);

  const observer = new MutationObserver(() => {
    if (!document.body.contains(container)) {
      unsubscribe("user", userChangeHandler);
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  return container;
}

// Header builder
function createHeader() {
  const header = document.getElementById("pageheader");
  if (!header) return;

  header.className = "main-header";

  const logo = createElement("div", { class: "logo" }, [
    createElement("a", { href: "/home", class: "logo-link" }, ["Farmium"])
  ]);

  let sky = createElement("div",{class:"hflexcen"},[]);
  // if (location.pathname != "/home") {
    sky.appendChild(sticky());
  // }

  const nav = createElement("div", { class: "header-content" }, []);

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

  nav.appendChild(createIconButton(moonSVG, null, toggleTheme));
  nav.appendChild(renderUserSection());

  header.replaceChildren(logo, sky, nav);
  loadTheme();
}


export { createHeader as createheader };
