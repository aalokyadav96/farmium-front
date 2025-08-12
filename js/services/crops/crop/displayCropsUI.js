// displayCropsUI.js
import { createElement } from "../../../components/createElement";
import { navigate } from "../../../routes";
import { SRC_URL } from "../../../api/api";
import { cropAside } from "./cropAside.js";
import { resolveImagePath, PictureType, EntityType } from "../../../utils/imagePaths.js";

// --- Utility Functions ---
function debounce(fn, delay = 300) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), delay);
  };
}

function filterAndSortCrops(crops, { term, tags, sortBy }) {
  return crops
    .filter(crop =>
      crop.name.toLowerCase().includes(term) &&
      [...tags].every(tag => crop.tags.includes(tag))
    )
    .sort((a, b) =>
      sortBy === "az"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
    );
}

function isSeasonal(crop) {
  const nowMonth = new Date().getMonth() + 1;
  return (crop.seasonMonths || []).includes(nowMonth);
}

function renderCropCard(crop, mode) {
  const isList = mode === "list";
  const card = createElement("div", { class: `crop-card ${mode}` });

  const formattedName = crop.name.toLowerCase().replace(/\s+/g, "_");
  const img = createElement("img", {
    src: resolveImagePath(EntityType.CROP, PictureType.THUMB, crop.imageUrl),
    alt: crop.name,
    loading: "lazy"
  });

  const info = createElement("p", { class: "crop-info" }, [
    `₹${crop.minPrice} - ₹${crop.maxPrice} per ${crop.unit} • ${crop.availableCount} listings`
  ]);

  const seasonStatus = isSeasonal(crop)
    ? ["🟢 In Season", "in-season"]
    : ["🔴 Off Season", "off-season"];

  const season = createElement("p", {
    class: `season-indicator ${seasonStatus[1]}`
  }, [seasonStatus[0]]);

  const tags = createElement("div", { class: "tag-wrap" },
    crop.tags.map(tag =>
      createElement("span", { class: "tag-pill" }, [tag])
    )
  );

  const title = createElement("h4", {}, [crop.name]);
  const btn = createElement("button", {}, ["View Farms"]);
  btn.onclick = () => navigate(`/crop/${formattedName}`);

  if (isList) {
    const content = createElement("div", { class: "crop-content" }, [
      title, info, season, tags
    ]);
    card.append(img, content, btn);
  } else {
    card.append(img, title, info, season, tags, btn);
  }

  return card;
}

// --- Main Renderer ---
export function renderCropInterface(container, cropData) {
  container.replaceChildren();

  const layout = createElement("div", { class: "catalogue-layout" });
  const main = createElement("div", { class: "catalogue-main" });
  const aside = createElement("aside", { class: "catalogue-aside" });

  layout.append(main, aside);
  container.appendChild(layout);

  const searchBox = createElement("input", {
    type: "text",
    placeholder: "Search crops…",
    class: "search-box"
  });

  const sortSelect = createElement("select", { class: "sort-box" }, [
    createElement("option", { value: "az" }, ["A → Z"]),
    createElement("option", { value: "za" }, ["Z → A"])
  ]);

  const gridBtn = createElement("button", { class: "active" }, ["🔲 Grid"]);
  const listBtn = createElement("button", {}, ["📃 List"]);

  const viewToggle = createElement("div", { class: "view-toggle" }, [gridBtn, listBtn]);
  const controls = createElement("div", { class: "top-controls" }, [
    searchBox, sortSelect, viewToggle
  ]);
  main.append(controls);

  const tabButtons = createElement("div", { class: "tabs" });
  const tabsWrapper = createElement("div", { id: "catalogue-container" });
  main.append(tabButtons, tabsWrapper);

  const categories = Object.keys(cropData);
  const tabs = {};
  let currentTab = categories[0];
  let activeTags = new Set();
  let viewMode = "grid";

  const state = {
    cropData,
    categories,
    currentTab,
    viewMode,
    activeTags,
    searchBox,
    sortSelect,
    tabs,
    tabButtons
  };

  categories.forEach((cat, i) => {
    const btn = createElement("button", {}, [
      `${cat.charAt(0).toUpperCase() + cat.slice(1)} (${cropData[cat].length})`
    ]);

    btn.onclick = () => {
      state.currentTab = cat;
      updateAllTabs(state);
    };

    if (i === 0) btn.classList.add("active");
    tabButtons.appendChild(btn);

    const pane = createElement("div", {
      class: `tab-content ${viewMode}`,
      id: cat,
      style: `display: ${i === 0 ? "grid" : "none"}`
    });
    tabs[cat] = pane;
    tabsWrapper.appendChild(pane);
  });

  gridBtn.onclick = () => {
    state.viewMode = "grid";
    gridBtn.classList.add("active");
    listBtn.classList.remove("active");
    updateAllTabs(state);
  };

  listBtn.onclick = () => {
    state.viewMode = "list";
    listBtn.classList.add("active");
    gridBtn.classList.remove("active");
    updateAllTabs(state);
  };

  sortSelect.onchange = () => updateAllTabs(state);
  searchBox.addEventListener("input", debounce(() => updateAllTabs(state)));

  updateAllTabs(state);

  aside.append(cropAside(cropData));
}

// --- Internal Update Functions ---
function updateTab(category, state) {
  const { cropData, tabs, viewMode, searchBox, sortSelect, activeTags } = state;
  const container = tabs[category];
  container.replaceChildren();

  const filtered = filterAndSortCrops(cropData[category], {
    term: searchBox.value.trim().toLowerCase(),
    tags: activeTags,
    sortBy: sortSelect.value
  });

  filtered.forEach(c => container.appendChild(renderCropCard(c, viewMode)));
}

function updateAllTabs(state) {
  const { categories, currentTab, tabButtons, tabs } = state;

  categories.forEach(cat => {
    updateTab(cat, state);
    tabs[cat].style.display = cat === currentTab ? "grid" : "none";
  });

  Array.from(tabButtons.children).forEach(btn => {
    const btnCategory = btn.textContent.split(" (")[0].toLowerCase();
    btn.classList.toggle("active", btnCategory === currentTab.toLowerCase());
  });
}
