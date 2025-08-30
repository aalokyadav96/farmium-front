import { createElement } from "../../components/createElement.js";
import { apiFetch } from "../../api/api.js";
import { navigate } from "../../routes/index.js";
import Button from "../../components/base/Button.js";
import { resolveImagePath, EntityType, PictureType } from "../../utils/imagePaths.js";
import Imagex from "../../components/base/Imagex.js";
import {makeDraggableScroll} from "../../components/dragnav.js";

export const clearElement = (el) => {
  while (el.firstChild) el.removeChild(el.firstChild);
};

function getEntityByCategory(category) {
  switch (category) {
    case "Places": return EntityType.PLACE;
    case "Events": return EntityType.EVENT;
    case "Baitos": return EntityType.BAITO;
    case "Products": return EntityType.PRODUCT;
    case "Posts": return EntityType.POST;
  }
}

function createImageCard({ banner, title, description, href }, entitytype) {
  console.log(banner, title, description, href);
  const bannerURL = resolveImagePath(entitytype, PictureType.THUMB, banner);
  const card = createElement("div", { class: "image-card", role: "article", "aria-label": title || "Card" }, [
    Imagex({ src: bannerURL, alt: `${title}`}),
    createElement("div", { class: "card-info" }, [
      createElement("h4", {}, [title || "Untitled"]),
      createElement("p", {}, [description || ""]),
      createElement("button", { class: "card-link", "aria-label": `Open ${title || "item"}` }, ["Explore"]),
    ]),
  ]);
  const linkBtn = card.querySelector(".card-link");
  if (linkBtn) linkBtn.addEventListener("click", () => navigate(href));
  return card;
}

// 🧩 Tabs
// export function createTabBar(onSwitch) {
//   const categories = ["Places", "Events", "Baitos", "Products", "Posts"];
//   const tabBar = createElement("div", { class: "tab-bar", role: "tablist" }, categories.map(cat =>
//     createElement("button", { class: "tab-btn", "data-category": cat, role: "tab", "aria-selected": "false" }, [cat])
//   ));
//   return { tabBar, categories };
// }


export function createTabBar(onSwitch) {
  const categories = ["Places", "Events", "Baitos", "Products", "Posts"];
  const tabBar = createElement("div", { class: "tab-bar", role: "tablist" }, categories.map(cat =>
    createElement("button", { class: "tab-btn", "data-category": cat, role: "tab", "aria-selected": "false" }, [cat])
  ));

  makeDraggableScroll(tabBar);

  return { tabBar, categories };
}

// 🗂️ Cards + pagination
export function createCardSection() {
  const cardGrid = createElement("div", { class: "card-grid" });
  const loadMoreWrapper = createElement("div", { class: "load-more-wrap" });
  const pagingState = {};
  const DEFAULT_LIMIT = 20;

  const fetchPage = async (category, skip, limit) => {
    const url = `/homecards?category=${encodeURIComponent(category)}&skip=${skip}&limit=${limit}`;
    return apiFetch(url);
  };

  const makeLoadMoreButton = (category) => {
    return Button("Load more", "home-load-more", { click: () => renderCardsPage(category, false) }, "load-more-btn");
  };

  const renderCardsPage = async (category, initial = false) => {
    if (!pagingState[category]) pagingState[category] = { skip: 0, limit: DEFAULT_LIMIT, done: false, loading: false };
    const state = pagingState[category];
    if (state.loading || state.done) return;

    state.loading = true;
    if (initial) { clearElement(cardGrid); cardGrid.appendChild(createElement("p", {}, ["Loading..."])); }
    else loadMoreWrapper.setAttribute("data-loading", "true");

    try {
      const data = await fetchPage(category, state.skip, state.limit);

      if (initial) clearElement(cardGrid);
      loadMoreWrapper.removeAttribute("data-loading");

      if (!data || !data.length) {
        if (initial) cardGrid.appendChild(createElement("p", {}, ["No results found."]));
        state.done = true;
        clearElement(loadMoreWrapper);
        return;
      }

      data.forEach(c => cardGrid.appendChild(createImageCard(c, getEntityByCategory(category))));
      state.skip += data.length;

      clearElement(loadMoreWrapper);
      if (!state.done) loadMoreWrapper.appendChild(makeLoadMoreButton(category));
    } catch {
      if (initial) { clearElement(cardGrid); cardGrid.appendChild(createElement("p", {}, ["Failed to load cards."])); }
    } finally { state.loading = false; }
  };

  return { cardGrid, loadMoreWrapper, renderCardsPage, pagingState };
}

// 🔄 Category switcher
export function setupCategoryTabs(tabBar, cardSection) {
  const tabs = tabBar.querySelectorAll(".tab-btn");

  const switchCategory = (category) => {
    tabs.forEach(btn => {
      const isActive = btn.getAttribute("data-category") === category;
      btn.setAttribute("aria-selected", isActive ? "true" : "false");
      btn.classList.toggle("active", isActive);
    });

    if (!cardSection.pagingState[category]) cardSection.pagingState[category] = { skip: 0, limit: 20, done: false, loading: false };
    cardSection.renderCardsPage(category, true);
  };

  tabs.forEach(btn => {
    const category = btn.getAttribute("data-category");
    btn.addEventListener("click", () => switchCategory(category));
    btn.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); switchCategory(category); } });
  });

  // default tab
  switchCategory("Places");
}
