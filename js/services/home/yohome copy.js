// YoHome.js
import { createElement } from "../../components/createElement.js";
import { navigate } from "../../routes/index.js";
import { clearElement, createListingTabs } from "./listingcon.js";
import { login, signup } from "../auth/authService.js";
import { Onboarding } from "../onboarding/baitoOnboard.js";
import { advertEmbed } from "../ads/adspace.js";

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

function createWeatherInfoWidget() {
  return createElement("section", { class: "info-widget" }, [
    createElement("div", { class: "weather" }, ["🌤️ 28.6°C"]),
    createElement("div", { class: "location" }, ["NYC"]),
    createElement("div", { class: "date" }, [formatDate()]),
  ]);
}

function createSearchBar() {
  return createElement("section", { class: "search-bar" }, [
    createElement("input", {
      class: "search-input",
      type: "text",
      placeholder: "Search places, events, artists...",
      "aria-label": "Search",
      name: "search",
    }),
  ]);
}

// --- NAV WRAPPER ---
function createNavWrapper() {
  const navItems = [
    ["📍", "Places", "/places"],
    ["🌾", "Grocery", "/grocery"],
    ["🎫", "Events", "/events"],
    ["💼", "Baito", "/baitos"],
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
  const expandedGrid = createElement("div", {
    class: "nav-grid",
    style: "display:none;",
    id: "expanded-nav",
  });

  const createNavIcon = (emoji, label, href) => {
    const icon = createElement(
      "div",
      { class: "nav-icon", role: "button", tabindex: "0" },
      [createElement("span", {}, [emoji]), createElement("span", {}, [label])]
    );
    icon.addEventListener("click", () => navigate(href));
    return icon;
  };

  navItems.forEach(([emoji, label, href], index) => {
    const icon = createNavIcon(emoji, label, href);
    (index < maxVisible ? collapsedGrid : expandedGrid).appendChild(icon);
  });

  let isExpanded = false;
  const toggleNav = createElement(
    "div",
    {
      class: "toggle-nav",
      style: "text-align:center; cursor:pointer; font-weight:600; padding:10px;",
    },
    ["More"]
  );
  toggleNav.addEventListener("click", () => {
    isExpanded = !isExpanded;
    expandedGrid.style.display = isExpanded ? "flex" : "none";
    toggleNav.textContent = isExpanded ? "Less" : "More";
  });

  return createElement("section", { class: "navbox" }, [
    collapsedGrid,
    expandedGrid,
    toggleNav,
  ]);
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
  const aside = createElement("aside", { class: "homesidebar" }, [
    createWeatherInfoWidget(),
    createSearchBar(),
  ]);

  // // --- HERO JUMBOTRON ---
  // const alreadyOnboarded = !!localStorage.getItem("baitoOnboarding");

  const adspace = createElement("section", {class:"advert"}, [advertEmbed("home")]);

  // const heroJumbotron = createElement(
  //   "section",
  //   {
  //     class: "hero-jumbotron",
  //     style: alreadyOnboarded ? "display:none;" : "",
  //   },
  //   [
  //     createElement("h1", {}, ["Welcome to Baito"]),
  //     createElement("p", {}, [
  //       "Find work or hire staff easily with just a few clicks.",
  //     ]),
  //     createElement("button", { class: "btn-primary", id: "btn-get-started" }, [
  //       "Get Started",
  //     ]),
  //   ]
  // );

  // main column
  // const mainContentChildren = [heroJumbotron, createNavWrapper(), adspace];
  const mainContentChildren = [createNavWrapper(), adspace];
  const mainContent = createElement("div", { class: "main-content" }, mainContentChildren);

  if (isLoggedIn) {
    // ✅ Tabs for logged in users
    mainContent.appendChild(createListingTabs());

    // // attach click event for Get Started button
    // const getStartedBtn = heroJumbotron.querySelector("#btn-get-started");
    // if (getStartedBtn) {
    //   getStartedBtn.addEventListener("click", () => {
    //     heroJumbotron.style.display = "none"; // hide hero immediately
    //     Onboarding(); // open onboarding modal
    //   });
    // }
  } else {
    // show login/signup when not logged in
    mainContent.appendChild(createAuthForms());
  }

  // 2-column layout wrapper
  const homepageContent = createElement("div", { class: "hyperlocal-home two-column" }, [
    mainContent,
    aside,
  ]);

  container.appendChild(homepageContent);

  // optional PWA installer
  const installer = createElement("div", {}, [
    createElement("button", { id: "install-pwa", style: "display:none;" }, ["Install App"]),
  ]);
  container.appendChild(installer);
}
