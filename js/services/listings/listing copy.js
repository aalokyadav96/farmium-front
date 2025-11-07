import { createElement } from "../../components/createElement.js";
import { apiFetch } from "../../api/api.js";
import { Button } from "../../components/base/Button.js";
import { adspace } from "../home/homeHelpers.js";

// ---- Centralized Type Configuration ----
const LIST_CONFIG = {
  events: {
    searchable: item =>
      [item.title, item.placename, ...(item.tags || [])].join(" ").toLowerCase(),
    categories: items => [...new Set(items.map(i => i.category).filter(Boolean))],
    sorters: {
      date: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      price: (a, b) => Math.min(...(a.prices || [0])) - Math.min(...(b.prices || [0])),
      title: (a, b) => (a.title || "").localeCompare(b.title || "")
    }
  },

  recipes: {
    searchable: item =>
      [item.title, ...(item.ingredients || []).map(i => i.name)].join(" ").toLowerCase(),
    categories: items => [...new Set(items.map(i => i.category).filter(Boolean))],
    sorters: {
      title: (a, b) => (a.title || "").localeCompare(b.title || ""),
      date: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      views: (a, b) => (b.views || 0) - (a.views || 0)
    }
  },

  places: {
    searchable: item => (item.name || "").toLowerCase(),
    categories: items => [...new Set(items.map(i => i.type || i.category).filter(Boolean))],
    sorters: {
      name: (a, b) => (a.name || "").localeCompare(b.name || ""),
      capacity: (a, b) => (a.capacity || 0) - (b.capacity || 0),
      recent: (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    }
  },

  posts: {
    searchable: item =>
      [item.title, item.category, item.subcategory, item.createdBy]
        .filter(Boolean)
        .join(" ")
        .toLowerCase(),
    categories: items => [...new Set(items.map(i => i.category).filter(Boolean))],
    sorters: {
      date: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      subcategory: (a, b) => (a.subcategory || "").localeCompare(b.subcategory || ""),
      title: (a, b) => (a.title || "").localeCompare(b.title || "")
    }
  },

  default: {
    searchable: item =>
      [item.title, item.name, item.description].filter(Boolean).join(" ").toLowerCase(),
    categories: items => [...new Set(items.map(i => i.category).filter(Boolean))],
    sorters: {
      date: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      title: (a, b) => (a.title || "").localeCompare(b.title || ""),
      views: (a, b) => (b.views || 0) - (a.views || 0)
    }
  }
};


// ---- Filtering & Sorting ----
function applyFilters({ items, keyword, category, sortBy, type }) {
  const cfg = LIST_CONFIG[type] || LIST_CONFIG.default;
  const kw = (keyword || "").toLowerCase();

  const filtered = items.filter(item => {
    const text = cfg.searchable(item);
    const matchesKeyword = kw ? text.includes(kw) : true;
    const matchesCategory = category ? item.category === category : true;
    return matchesKeyword && matchesCategory;
  });

  const sorter = cfg.sorters[sortBy] || cfg.sorters.date || (() => 0);
  return filtered.sort(sorter);
}


// ---- UI Filter Controls ----
function createFilterControls({ type, items, onRender }) {
  const cfg = LIST_CONFIG[type] || LIST_CONFIG.default;
  const wrapper = createElement("div", { class: `${type}-controls` });

  const searchInput = createElement("input", {
    type: "text",
    name: `search-${Date.now()}`,
    placeholder: `Search ${type}...`
  });

  const sortSelect = createElement(
    "select",
    { name: `sort-${Date.now()}` },
    Object.entries(cfg.sorters).map(([key]) =>
      createElement("option", { value: key }, [key[0].toUpperCase() + key.slice(1)])
    )
  );

  const categories = cfg.categories(items);
  const chipConContainer = createElement("div", { class: "chipscon" }, []);
  const chipContainer = createElement("div", { class: "category-chips" }, []);
  chipConContainer.appendChild(chipContainer);

  let selectedCategory = null;

  categories.forEach(cat => {
    const chipper = createElement("span", { class: "chipper" }, [cat]);
    const chip = createElement("div", { class: "category-chip" }, [chipper]);
    chip.addEventListener("click", () => {
      selectedCategory = selectedCategory === cat ? null : cat;
      renderFiltered();
    });
    chipContainer.appendChild(chip);
  });

  wrapper.append(searchInput, sortSelect);

  function renderFiltered() {
    const filtered = applyFilters({
      items,
      keyword: searchInput.value,
      category: selectedCategory,
      sortBy: sortSelect.value,
      type
    });
    onRender(filtered);
  }

  searchInput.addEventListener("input", renderFiltered);
  sortSelect.addEventListener("change", renderFiltered);

  renderFiltered();

  return {
    controls: wrapper,
    chipConContainer,
    reset: () => {
      searchInput.value = "";
      selectedCategory = null;
      renderFiltered();
    }
  };
}


// ---- Pagination ----
function paginate(items, page, size) {
  const start = (page - 1) * size;
  return items.slice(start, start + size);
}

// ---- Listing Page ----
export async function displayListingPage(container, {
  title = "",
  apiEndpoint,
  cardBuilder,
  type = "generic",
  pageSize = 10,
  sidebarActions
}) {
  container.replaceChildren();
  const layout = createElement("div", { class: `${type}-page` });
  const aside = createElement("aside", { class: `${type}-aside` });
  const main = createElement("div", { class: `${type}-main` });
  layout.append(main, aside);
  container.appendChild(layout);

  if (sidebarActions) sidebarActions(aside);
  if (title) main.appendChild(createElement("h1", {}, [title]));

  const listSection = createElement("div", { class: `${type}-list` });
  
  aside.appendChild(adspace("aside"));
  main.appendChild(adspace("inbody"));
  main.appendChild(listSection);

  let items = [];
  let currentPage = 1;

  // --- Fetch data from API ---
  const data = await apiFetch(apiEndpoint);

  if (Array.isArray(data)) {
    items = data;
  } else if (data?.data) {
    items = data.data;
  } else if (data?.[type]) {
    items = data[type];
  } else {
    items = [];
  }

  // --- Create filters and pagination ---
  const filterControls = createFilterControls({
    type,
    items,
    onRender: filtered => {
      currentPage = 1;
      renderPage(filtered);
    }
  });

  const filterToggle = createElement(
    "details",
    { open: true, class: `listing-filter-toggle ${type}-filter-toggle` },
    [createElement("summary", {}, ["🔍 Filters"]), filterControls.controls]
  );

  // Add shared class to controls container
  filterControls.controls.classList.add("listing-controls");
  filterControls.controls.classList.add(`${type}-controls`);

  main.insertBefore(filterToggle, listSection);
  main.insertBefore(filterControls.chipConContainer, listSection);
  function renderPage(filtered) {
    listSection.replaceChildren();
    const paged = paginate(filtered, currentPage, pageSize);

    if (!paged.length) {
      listSection.appendChild(
        createElement("div", { class: "empty-state" }, [
          createElement("p", {}, [`No ${type} found.`]),
          Button("Clear Filters", "", { click: () => filterControls.reset() }, "buttonx btn-secondary")
        ])
      );
      return;
    }

    paged.forEach(item => listSection.appendChild(cardBuilder(item)));
  }

  // --- Initial Render ---
  renderPage(items);
}



// // ---- Listing Page ----
// export async function displayListingPage(container, {
//   title = "",
//   apiEndpoint,
//   cardBuilder,
//   type = "generic",
//   pageSize = 10,
//   sidebarActions
// }) {
//   container.replaceChildren();
//   const layout = createElement("div", { class: `${type}-page` });
//   const aside = createElement("aside", { class: `${type}-aside` });
//   const main = createElement("div", { class: `${type}-main` });
//   layout.append(main, aside);
//   container.appendChild(layout);

//   if (sidebarActions) sidebarActions(aside);
//   if (title) main.appendChild(createElement("h1", {}, [title]));

//   const listSection = createElement("div", { class: `${type}-list` });
//   main.appendChild(listSection);

//   let items = [];
//   let currentPage = 1;

//   // --- Fetch data from API ---
//   const data = await apiFetch(apiEndpoint);

//   // handle different backend structures
//   if (Array.isArray(data)) {
//     items = data;
//   } else if (data?.data) {
//     items = data.data;
//   } else if (data?.[type]) {
//     // e.g. { posts: [...] }
//     items = data[type];
//   } else {
//     items = [];
//   }

//   // --- Create filters and pagination ---
//   const filterControls = createFilterControls({
//     type,
//     items,
//     onRender: filtered => {
//       currentPage = 1;
//       renderPage(filtered);
//     }
//   });

//   const filterToggle = createElement(
//     "details",
//     { open: true, class: `${type}-filter-toggle` },
//     [createElement("summary", {}, ["🔍 Filters"]), filterControls.controls]
//   );

//   main.insertBefore(filterToggle, listSection);
//   main.insertBefore(filterControls.chipConContainer, listSection);

//   function renderPage(filtered) {
//     listSection.replaceChildren();
//     const paged = paginate(filtered, currentPage, pageSize);

//     if (!paged.length) {
//       listSection.appendChild(
//         createElement("div", { class: "empty-state" }, [
//           createElement("p", {}, [`No ${type} found.`]),
//           Button("Clear Filters", "", { click: () => filterControls.reset() }, "buttonx btn-secondary")
//         ])
//       );
//       return;
//     }

//     paged.forEach(item => listSection.appendChild(cardBuilder(item)));
//   }

//   // --- Initial Render ---
//   renderPage(items);
// }
