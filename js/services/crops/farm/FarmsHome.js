import Button from "../../../components/base/Button.js";
import { createElement } from "../../../components/createElement.js";
import { apiFetch } from "../../../api/api.js";
import {
  renderFarmCards,
  renderFeaturedFarm,
  renderCTAFarm,
  renderWeatherWidget,
  renderFarmStats,
} from "./farmListHelpers.js";
import {
  createFilterControls,
  applyFiltersAndSort
} from "./farmFilters.js";

// Config
const PAGE_SIZE = 10;

// State
const state = {
  farms: [],
  page: 1,
  isLoading: false,
  favorites: new Set(JSON.parse(localStorage.getItem("favFarms") || "[]")),
  searchKeyword: "",
  locationFilter: "",
  onlyAvailable: false,
  minRating: 0,
  maxRating: 5,
  sortBy: "",
  sortDir: ""
};

let currentSidebar, isLoggedIn;

async function fetchFarms(page) {
  const res = await apiFetch(`/farms?page=${page}&limit=${PAGE_SIZE}`);
  return res?.farms || [];
}

function Grid() {
  const container = createElement("div", { class: "farm__grid" });
  return {
    container,
    render(farms) {
      container.replaceChildren();
      if (!farms.length) {
        container.appendChild(createElement("p", {}, ["No farms found."]));
      } else {
        renderFarmCards(farms, container, isLoggedIn, toggleFavorite);
      }
    }
  };
}

function Sidebar() {
  const container = createElement("div", { class: "farm__sidebar" });
  return {
    container,
    render(allFarms) {
      container.replaceChildren();
      renderCTAFarm(container);
      renderWeatherWidget(container);
      renderFeaturedFarm(container, allFarms[0]);
      renderFarmStats(container, allFarms);
      renderFavorites(container);
      renderMap(container);
      renderRatings(container, allFarms);
    }
  };
}

function renderFavorites(container) {
  if (!isLoggedIn) return;
  const section = createElement("section", { class: "farm__favorites" }, [
    createElement("h3", {}, ["Favorites"])
  ]);

  if (state.favorites.size === 0) {
    section.appendChild(createElement("p", {}, ["None yet. Click ❤ on a card."]));
  } else {
    const list = createElement("ul");
    state.favorites.forEach(id => {
      const farm = state.farms.find(f => f.id === id);
      if (farm) list.appendChild(createElement("li", {}, [farm.name]));
    });
    section.appendChild(list);
  }

  container.appendChild(section);
}

function renderMap(container) {
  const section = createElement("section", { class: "farm__map" }, [
    createElement("h3", {}, ["Farm Map"]),
    createElement("div", { class: "farm__map-placeholder" }, ["Map integration point"])
  ]);
  container.appendChild(section);
}

function renderRatings(container, farms) {
  const section = createElement("section", { class: "farm__ratings" }, [
    createElement("h3", {}, ["Top Rated"])
  ]);

  const top = farms.filter(f => typeof f.rating === "number")
                   .sort((a, b) => b.rating - a.rating)
                   .slice(0, 3);

  if (!top.length) {
    section.appendChild(createElement("p", {}, ["No ratings yet."]));
  } else {
    top.forEach(f => {
      const stars = "★".repeat(Math.round(f.rating)) + "☆".repeat(5 - Math.round(f.rating));
      section.appendChild(createElement("div", { class: "rating" }, [
        createElement("strong", {}, [f.name]),
        createElement("span", {}, [stars])
      ]));
    });
  }

  container.appendChild(section);
}

function toggleFavorite(farmId) {
  if (state.favorites.has(farmId)) state.favorites.delete(farmId);
  else state.favorites.add(farmId);
  localStorage.setItem("favFarms", JSON.stringify([...state.favorites]));
  if (currentSidebar) currentSidebar.render(state.farms);
}


export async function displayFarms(content, loggedIn) {
  content.replaceChildren();
  let container = createElement("div", { class: "farmspage" });
  content.appendChild(container);
  isLoggedIn = loggedIn;

  const layout = createElement("div", { class: "farm-page" });
  const main = createElement("div", { class: "farm__main" });
  const side = createElement("aside", { class: "farm__side" });
  const layoutInner = createElement("div", { class: "farm__layout" }, [main, side]);
  layout.appendChild(layoutInner);
  container.appendChild(layout);

  const filters = createFilterControls(state, renderAll);
  const grid = Grid();
  const sidebar = Sidebar();
  const sentinel = createElement("div", { class: "farm__sentinel" });

  currentSidebar = sidebar;

  main.append(filters, grid.container, sentinel);
  side.appendChild(sidebar.container);

  const observer = new IntersectionObserver(onIntersect, { rootMargin: "200px" });
  observer.observe(sentinel);

  await loadNextPage();
  renderAll();

  async function loadNextPage() {
    if (state.isLoading) return;
    state.isLoading = true;
    const batch = await fetchFarms(state.page);
    if (batch.length) {
      state.farms.push(...batch);
      state.page++;
    } else {
      observer.disconnect();
    }
    state.isLoading = false;
  }

  function renderAll() {
    const visibleFarms = applyFiltersAndSort(state.farms, state);
    grid.render(visibleFarms);
    sidebar.render(visibleFarms);
  }

  async function onIntersect(entries) {
    if (entries.some(e => e.isIntersecting)) {
      await loadNextPage();
      renderAll();
    }
  }
}
