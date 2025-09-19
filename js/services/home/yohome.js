// YoHome.js (updated hero logic)
import { createElement } from "../../components/createElement.js";
import { navigate } from "../../routes/index.js";
import { clearElement, createTabBar, createCardSection, setupCategoryTabs } from "./listingcon.js";
import { login, signup } from "../auth/authService.js";
import { Onboarding } from "../onboarding/baitoOnboard.js";

// --- helpers ---
const formatDate = () => {
  const now = new Date();
  return now.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

function createInfoWidget() {
  return createElement("section", { class: "info-widget" }, [
    createElement("div", { class: "weather" }, ["🌤️ 28.6°C"]),
    createElement("div", { class: "location" }, ["Mahendragarh Central"]),
    createElement("div", { class: "date" }, [formatDate()]),
  ]);
}

function createSearchBar() {
  return createElement("div", { class: "search-bar" }, [
    createElement("input", {
      class: "search-input",
      type: "text",
      placeholder: "Search places, events, artists...",
      "aria-label": "Search",
    }),
  ]);
}

function createNavWrapper() {
  const navItems = [
    ["📍", "Places", "/places"],
    ["🌾", "Grocery", "/grocery"],
    ["🎫", "Events", "/events"],
    ["💼", "Baito", "/baito"],
    ["🧑‍💼", "Hire", "/baitos/hire"],
    ["📢", "Social", "/social"],
    ["📝", "Posts", "/posts"],
    ["🛍️", "Shop", "/products"],
    ["🍳", "Recipes", "/recipes"],
    ["🧭", "Itinerary", "/itinerary"],
    ["🎨", "Artists", "/artists"],
  ];

  const maxVisible = 6;
  const collapsedGrid = createElement("div", { class: "nav-grid" });
  const expandedGrid = createElement("div", { class: "nav-grid", style: "display:none;", id: "expanded-nav" });

  const createNavIcon = (emoji, label, href) => {
    const icon = createElement("div", { class: "nav-icon", role: "button", tabindex: "0" }, [
      createElement("span", {}, [emoji]),
      createElement("span", {}, [label]),
    ]);
    icon.addEventListener("click", () => navigate(href));
    return icon;
  };

  navItems.forEach(([emoji, label, href], index) => {
    const icon = createNavIcon(emoji, label, href);
    (index < maxVisible ? collapsedGrid : expandedGrid).appendChild(icon);
  });

  let isExpanded = false;
  const toggleNav = createElement("div", { class: "toggle-nav", style: "text-align:center; cursor:pointer; font-weight:600; padding:10px;" }, ["More"]);
  toggleNav.addEventListener("click", () => {
    isExpanded = !isExpanded;
    expandedGrid.style.display = isExpanded ? "grid" : "none";
    toggleNav.textContent = isExpanded ? "Less" : "More";
  });

  return createElement("section", { class: "navbox" }, [collapsedGrid, expandedGrid, toggleNav]);
}

// --- AUTH FORMS ---
function createAuthForms() {
  const loginForm = createElement("form", { id: "login-form", class: "create-section" }, [
    createElement("h3", {}, ["Login"]),
    createElement("input", { id: "login-username", type: "text", placeholder: "Username" }),
    createElement("input", { id: "login-password", type: "password", placeholder: "Password" }),
    createElement("button", { type: "submit" }, ["Login"]),
  ]);
  loginForm.addEventListener("submit", login);

  const signupForm = createElement("form", { id: "signup-form", class: "create-section" }, [
    createElement("h3", {}, ["Signup"]),
    createElement("input", { id: "signup-username", type: "text", placeholder: "Username" }),
    createElement("input", { id: "signup-email", type: "email", placeholder: "Email" }),
    createElement("input", { id: "signup-password", type: "password", placeholder: "Password" }),
    createElement("button", { type: "submit" }, ["Signup"]),
  ]);
  signupForm.addEventListener("submit", signup);

  return createElement("div", { class: "auth-forms" }, [loginForm, signupForm]);
}

// --- MAIN HOME ---
export function YoHome(isLoggedIn, container) {
  clearElement(container);

  // aside column
  const aside = createElement("aside", { class: "sidebar" }, [
    createInfoWidget(),
    createSearchBar(),
  ]);

  // --- HERO JUMBOTRON ---
  // Hide hero if onboarding already completed (localStorage key: baitoOnboarding)
  const alreadyOnboarded = !!localStorage.getItem("baitoOnboarding");

  const heroJumbotron = createElement("section", { class: "hero-jumbotron", style: alreadyOnboarded ? "display:none;" : "" }, [
    createElement("h1", {}, ["Welcome to Baito"]),
    createElement("p", {}, ["Find work or hire staff easily with just a few clicks."]),
    createElement("button", { class: "btn-primary", id: "btn-get-started", style: "margin-top:20px;" }, ["Get Started"]),
  ]);

  // main column
  const mainContentChildren = [
    heroJumbotron,
    createNavWrapper(),
  ];
  const mainContent = createElement("div", { class: "main-content" }, mainContentChildren);

  if (isLoggedIn) {
    const { tabBar } = createTabBar();
    const cardSection = createCardSection();
    mainContent.appendChild(tabBar);
    mainContent.appendChild(cardSection.cardGrid);
    mainContent.appendChild(cardSection.loadMoreWrapper);
    setupCategoryTabs(tabBar, cardSection);

    // attach click event for Get Started button
    const getStartedBtn = heroJumbotron.querySelector("#btn-get-started");
    if (getStartedBtn) {
      getStartedBtn.addEventListener("click", () => {
        // hide hero immediately
        heroJumbotron.style.display = "none";
        // open onboarding modal
        Onboarding();
      });
    }
  } else {
    mainContent.appendChild(createAuthForms());
  }

  // 2-column layout wrapper
  const homepageContent = createElement("div", { class: "hyperlocal-home two-column" }, [
    mainContent,
    aside,
  ]);

  container.appendChild(homepageContent);

  const installer = createElement("div", {}, [
    createElement("button", { id: "install-pwa", style: "display:none;" }, ["Install App"]),
  ]);
  container.appendChild(installer);
}

// import { createElement } from "../../components/createElement.js";
// import { navigate } from "../../routes/index.js";
// import { clearElement, createTabBar, createCardSection, setupCategoryTabs } from "./listingcon.js";
// import { login, signup } from "../auth/authService.js";
// import { Onboarding } from "../onboarding/baitoOnboard.js";

// // --- helpers ---
// const formatDate = () => {
//   const now = new Date();
//   return now.toLocaleDateString(undefined, {
//     weekday: "short",
//     month: "short",
//     day: "numeric",
//     year: "numeric",
//   });
// };

// function createInfoWidget() {
//   return createElement("section", { class: "info-widget" }, [
//     createElement("div", { class: "weather" }, ["🌤️ 28.6°C"]),
//     createElement("div", { class: "location" }, ["Mahendragarh Central"]),
//     createElement("div", { class: "date" }, [formatDate()]),
//   ]);
// }

// function createSearchBar() {
//   return createElement("div", { class: "search-bar" }, [
//     createElement("input", {
//       class: "search-input",
//       type: "text",
//       placeholder: "Search places, events, artists...",
//       "aria-label": "Search",
//     }),
//   ]);
// }

// function createNavWrapper() {
//   const navItems = [
//     ["📍", "Places", "/places"],
//     ["🌾", "Grocery", "/grocery"],
//     ["🎫", "Events", "/events"],
//     ["💼", "Baito", "/baito"],
//     ["🧑‍💼", "Hire", "/baitos/hire"],
//     ["📢", "Social", "/social"],
//     ["📝", "Posts", "/posts"],
//     ["🛍️", "Shop", "/products"],
//     ["🍳", "Recipes", "/recipes"],
//     ["🧭", "Itinerary", "/itinerary"],
//     ["🎨", "Artists", "/artists"],
//   ];

//   const maxVisible = 6;
//   const collapsedGrid = createElement("div", { class: "nav-grid" });
//   const expandedGrid = createElement("div", { class: "nav-grid", style: "display:none;", id: "expanded-nav" });

//   const createNavIcon = (emoji, label, href) => {
//     const icon = createElement("div", { class: "nav-icon", role: "button", tabindex: "0" }, [
//       createElement("span", {}, [emoji]),
//       createElement("span", {}, [label]),
//     ]);
//     icon.addEventListener("click", () => navigate(href));
//     return icon;
//   };

//   navItems.forEach(([emoji, label, href], index) => {
//     const icon = createNavIcon(emoji, label, href);
//     (index < maxVisible ? collapsedGrid : expandedGrid).appendChild(icon);
//   });

//   let isExpanded = false;
//   const toggleNav = createElement("div", { class: "toggle-nav", style: "text-align:center; cursor:pointer; font-weight:600; padding:10px;" }, ["More"]);
//   toggleNav.addEventListener("click", () => {
//     isExpanded = !isExpanded;
//     expandedGrid.style.display = isExpanded ? "grid" : "none";
//     toggleNav.textContent = isExpanded ? "Less" : "More";
//   });

//   return createElement("section", { class: "navbox" }, [collapsedGrid, expandedGrid, toggleNav]);
// }

// // --- 🔑 AUTH FORMS ---
// function createAuthForms() {
//   const loginForm = createElement("form", { id: "login-form", class: "create-section" }, [
//     createElement("h3", {}, ["Login"]),
//     createElement("input", { id: "login-username", type: "text", placeholder: "Username" }),
//     createElement("input", { id: "login-password", type: "password", placeholder: "Password" }),
//     createElement("button", { type: "submit" }, ["Login"]),
//   ]);
//   loginForm.addEventListener("submit", login);

//   const signupForm = createElement("form", { id: "signup-form", class: "create-section" }, [
//     createElement("h3", {}, ["Signup"]),
//     createElement("input", { id: "signup-username", type: "text", placeholder: "Username" }),
//     createElement("input", { id: "signup-email", type: "email", placeholder: "Email" }),
//     createElement("input", { id: "signup-password", type: "password", placeholder: "Password" }),
//     createElement("button", { type: "submit" }, ["Signup"]),
//   ]);
//   signupForm.addEventListener("submit", signup);

//   return createElement("div", { class: "auth-forms" }, [loginForm, signupForm]);
// }

// // --- 🚀 MAIN HOME ---
// export function YoHome(isLoggedIn, container) {
//   clearElement(container);

//   // aside column
//   const aside = createElement("aside", { class: "sidebar" }, [
//     createInfoWidget(),
//     createSearchBar(),
//   ]);

//   // --- HERO JUMBOTRON ---
//   const heroJumbotron = createElement("section", { class: "hero-jumbotron" }, [
//     createElement("h1", {}, ["Welcome to Baito"]),
//     createElement("p", {}, ["Find work or hire staff easily with just a few clicks."]),
//     createElement("button", { class: "btn-primary", style: "margin-top:20px;" }, ["Get Started"]),
//   ]);

//   // main column
//   const mainContent = createElement("div", { class: "main-content" }, [
//     heroJumbotron,
//     createNavWrapper(),
//     // createElement("div", { id: "onboarding-container", class: "onboarding-box" }, []),
//   ]);

//   if (isLoggedIn) {
//     const { tabBar } = createTabBar();
//     const cardSection = createCardSection();
//     mainContent.appendChild(tabBar);
//     mainContent.appendChild(cardSection.cardGrid);
//     mainContent.appendChild(cardSection.loadMoreWrapper);
//     setupCategoryTabs(tabBar, cardSection);

//     // attach click event for Get Started button
//     const getStartedBtn = heroJumbotron.querySelector("button");
//     getStartedBtn.addEventListener("click", () => {
//       heroJumbotron.style.display = "none"; // hide hero
//       Onboarding("onboarding-container");   // start onboarding
//     });
//   } else {
//     mainContent.appendChild(createAuthForms());
//   }

//   // 2-column layout wrapper
//   const homepageContent = createElement("div", { class: "hyperlocal-home two-column" }, [
//     mainContent,
//     aside,
//   ]);

//   container.appendChild(homepageContent);

//   const installer = createElement("div", {}, [
//     createElement("button", { id: "install-pwa", style: "display:none;" }, ["Install App"]),
//   ]);
//   container.appendChild(installer);
// }

// // import { createElement } from "../../components/createElement.js";
// // import { navigate } from "../../routes/index.js";
// // import { clearElement, createTabBar, createCardSection, setupCategoryTabs } from "./listingcon.js";
// // import { login, signup } from "../auth/authService.js";
// // import {Onboarding} from "../onboarding/baitoOnboard.js";

// // // --- helpers ---
// // const formatDate = () => {
// //   const now = new Date();
// //   return now.toLocaleDateString(undefined, {
// //     weekday: "short",
// //     month: "short",
// //     day: "numeric",
// //     year: "numeric",
// //   });
// // };

// // function createInfoWidget() {
// //   return createElement("section", { class: "info-widget" }, [
// //     createElement("div", { class: "weather" }, ["🌤️ 28.6°C"]),
// //     createElement("div", { class: "location" }, ["Mahendragarh Central"]),
// //     createElement("div", { class: "date" }, [formatDate()]),
// //   ]);
// // }

// // function createSearchBar() {
// //   return createElement("div", { class: "search-bar" }, [
// //     createElement("input", {
// //       class: "search-input",
// //       type: "text",
// //       placeholder: "Search places, events, artists...",
// //       "aria-label": "Search",
// //     }),
// //   ]);
// // }

// // function createNavWrapper() {
// //   const navItems = [
// //     ["📍", "Places", "/places"],
// //     ["🌾", "Grocery", "/grocery"],
// //     ["🎫", "Events", "/events"],
// //     ["💼", "Baito", "/baito"],
// //     ["🧑‍💼", "Hire", "/baitos/hire"],
// //     ["📢", "Social", "/social"],
// //     ["📝", "Posts", "/posts"],
// //     ["🛍️", "Shop", "/products"],
// //     ["🍳", "Recipes", "/recipes"],
// //     ["🧭", "Itinerary", "/itinerary"],
// //     ["🎨", "Artists", "/artists"],
// //   ];

// //   const maxVisible = 6;
// //   const collapsedGrid = createElement("div", { class: "nav-grid" });
// //   const expandedGrid = createElement("div", { class: "nav-grid", style: "display:none;", id: "expanded-nav" });

// //   const createNavIcon = (emoji, label, href) => {
// //     const icon = createElement("div", { class: "nav-icon", role: "button", tabindex: "0" }, [
// //       createElement("span", {}, [emoji]),
// //       createElement("span", {}, [label]),
// //     ]);
// //     icon.addEventListener("click", () => navigate(href));
// //     return icon;
// //   };

// //   navItems.forEach(([emoji, label, href], index) => {
// //     const icon = createNavIcon(emoji, label, href);
// //     (index < maxVisible ? collapsedGrid : expandedGrid).appendChild(icon);
// //   });

// //   let isExpanded = false;
// //   const toggleNav = createElement("div", { class: "toggle-nav", style: "text-align:center; cursor:pointer; font-weight:600; padding:10px;" }, ["More"]);
// //   toggleNav.addEventListener("click", () => {
// //     isExpanded = !isExpanded;
// //     expandedGrid.style.display = isExpanded ? "grid" : "none";
// //     toggleNav.textContent = isExpanded ? "Less" : "More";
// //   });

// //   return createElement("section", { class: "navbox" }, [collapsedGrid, expandedGrid, toggleNav]);
// // }

// // // --- 🔑 AUTH FORMS ---
// // function createAuthForms() {
// //   const loginForm = createElement("form", { id: "login-form", class: "create-section" }, [
// //     createElement("h3", {}, ["Login"]),
// //     createElement("input", { id: "login-username", type: "text", placeholder: "Username" }),
// //     createElement("input", { id: "login-password", type: "password", placeholder: "Password" }),
// //     createElement("button", { type: "submit" }, ["Login"]),
// //   ]);
// //   loginForm.addEventListener("submit", login);

// //   const signupForm = createElement("form", { id: "signup-form", class: "create-section" }, [
// //     createElement("h3", {}, ["Signup"]),
// //     createElement("input", { id: "signup-username", type: "text", placeholder: "Username" }),
// //     createElement("input", { id: "signup-email", type: "email", placeholder: "Email" }),
// //     createElement("input", { id: "signup-password", type: "password", placeholder: "Password" }),
// //     createElement("button", { type: "submit" }, ["Signup"]),
// //   ]);
// //   signupForm.addEventListener("submit", signup);

// //   return createElement("div", { class: "auth-forms" }, [loginForm, signupForm]);
// // }

// // // --- 🚀 MAIN HOME ---
// // export function YoHome(isLoggedIn, container) {
// //   clearElement(container);

// //   // aside column
// //   const aside = createElement("aside", { class: "sidebar" }, [
// //     createInfoWidget(),
// //     createSearchBar(),
// //   ]);

// //   // main column
// //   const mainContent = createElement("div", { class: "main-content" }, [
// //     createNavWrapper(),
// //   ]);

// //   if (isLoggedIn) {
// //     const { tabBar } = createTabBar();
// //     const cardSection = createCardSection();
// //     mainContent.appendChild(tabBar);
// //     mainContent.appendChild(cardSection.cardGrid);
// //     mainContent.appendChild(cardSection.loadMoreWrapper);
// //     setupCategoryTabs(tabBar, cardSection);
// //   } else {
// //     mainContent.appendChild(createAuthForms());
// //   }

// //   // 2-column layout wrapper
// //   const homepageContent = createElement("div", { class: "hyperlocal-home two-column" }, [
// //     mainContent,
// //     aside,
// //   ]);

// //   container.appendChild(homepageContent);

// //   const installer = createElement("div", {}, [
// //     createElement("button", { id: "install-pwa", style: "display:none;" }, ["Install App"]),
// //   ]);
// //   container.appendChild(installer);
// // }
