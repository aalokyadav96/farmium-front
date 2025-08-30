import { createElement } from "../../components/createElement.js";
import { navigate } from "../../routes/index.js";
import { clearElement, createTabBar, createCardSection, setupCategoryTabs } from "./listingcon.js";

// 🗓️ Helpers
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
    createElement("div", { class: "weather", "aria-label": "Weather" }, ["🌤️ 28.6°C"]),
    createElement("div", { class: "location", "aria-label": "Location" }, ["Mahendragarh Central"]),
    createElement("div", { class: "date", "aria-label": "Date" }, [formatDate()]),
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
    const icon = createElement("div", { class: "nav-icon", role: "button", tabindex: "0", "aria-label": label }, [
      createElement("span", {}, [emoji]),
      createElement("span", {}, [label]),
    ]);
    icon.addEventListener("click", () => navigate(href));
    icon.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); navigate(href); }
    });
    return icon;
  };

  navItems.forEach(([emoji, label, href], index) => {
    const icon = createNavIcon(emoji, label, href);
    (index < maxVisible ? collapsedGrid : expandedGrid).appendChild(icon);
  });

  let isExpanded = false;
  const toggleNav = createElement("div", { class: "toggle-nav", style: "text-align:center; cursor:pointer; font-weight:600; padding:10px;", role: "button", tabindex: "0", "aria-expanded": "false", "aria-controls": "expanded-nav" }, ["More"]);

  const setToggleLabel = label => { clearElement(toggleNav); toggleNav.appendChild(document.createTextNode(label)); };
  const toggleExpanded = () => {
    isExpanded = !isExpanded;
    expandedGrid.style.display = isExpanded ? "grid" : "none";
    toggleNav.setAttribute("aria-expanded", isExpanded ? "true" : "false");
    setToggleLabel(isExpanded ? "Less" : "More");
  };
  toggleNav.addEventListener("click", toggleExpanded);
  toggleNav.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleExpanded(); } });

  return createElement("section", {}, [collapsedGrid, expandedGrid, toggleNav]);
}

// 🚀 Main entry
export function YoHome(isLoggedIn, container) {
  const infoWidget = createInfoWidget();
  const searchBar = createSearchBar();
  const navWrapper = createNavWrapper();

  const { tabBar } = createTabBar();
  const cardSection = createCardSection();

  const homepageContent = createElement("div", { class: "hyperlocal-home" }, [
    infoWidget,
    searchBar,
    createElement("h2", {}, ["Discover Locally"]),
    navWrapper,
    tabBar,
    cardSection.cardGrid,
    cardSection.loadMoreWrapper,
  ]);

  container.appendChild(homepageContent);

  setupCategoryTabs(tabBar, cardSection);

  const installer = createElement("div", {}, [
    createElement("button", { id: "install-pwa", style: "display:none;" }, ["Install App"]),
  ]);
  container.appendChild(installer);
}
