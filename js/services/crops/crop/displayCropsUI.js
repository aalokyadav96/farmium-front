import { createElement } from "../../../components/createElement";
import { navigate } from "../../../routes";
import { SRC_URL } from "../../../api/api";
import { cropAside } from "./cropAside.js";

// --- Utility Functions ---

function debounce(fn, delay = 300) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
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
  const now = new Date().getMonth() + 1;
  return crop.seasonMonths.includes(now);
}

function renderCropCard(crop, mode) {
  const isList = mode === "list";
  const card = createElement("div", { class: `crop-card ${mode}` });

  const formattedName = crop.name.toLowerCase().replace(/\s+/g, "_");
  const img = createElement("img", {
    src: `${SRC_URL}/uploads/generic/${crop.category}/${formattedName}.png`,
    alt: crop.name,
    loading: "lazy"
  });

  const content = createElement("div", { class: "crop-content" }, [
    createElement("h4", {}, [crop.name]),
    createElement("p", { class: "crop-info" }, [
      `₹${crop.minPrice} - ₹${crop.maxPrice} per ${crop.unit} • ${crop.availableCount} listings`
    ]),
    createElement("p", {
      class: `season-indicator ${isSeasonal(crop) ? "in-season" : "off-season"}`
    }, [isSeasonal(crop) ? "🟢 In Season" : "🔴 Off Season"]),
    createElement("div", { class: "tag-wrap" }, crop.tags.map(tag =>
      createElement("span", { class: "tag-pill" }, [tag])
    ))
  ]);

  const btn = createElement("button", {}, ["View Farms"]);
  btn.onclick = () => navigate(`/crop/${formattedName}`);

  if (isList) {
    card.append(img, content, btn);
  } else {
    card.append(img, ...content.children, btn);
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

  const gridBtn = createElement("button", {}, ["🔲 Grid"]);
  const listBtn = createElement("button", {}, ["📃 List"]);
  gridBtn.classList.add("active");

  const viewToggle = createElement("div", { class: "view-toggle" }, [gridBtn, listBtn]);
  const controls = createElement("div", { class: "top-controls" }, [
    searchBox,
    sortSelect,
    viewToggle
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

  // Setup tabs and containers
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

  // Attach listeners
  gridBtn.onclick = () => {
    viewMode = "grid";
    state.viewMode = "grid";
    gridBtn.classList.add("active");
    listBtn.classList.remove("active");
    updateAllTabs(state);
  };

  listBtn.onclick = () => {
    viewMode = "list";
    state.viewMode = "list";
    listBtn.classList.add("active");
    gridBtn.classList.remove("active");
    updateAllTabs(state);
  };

  sortSelect.onchange = () => updateAllTabs(state);
  searchBox.addEventListener("input", debounce(() => updateAllTabs(state)));

  // Initial render
  updateAllTabs(state);

  // Aside panel
  aside.append(cropAside(cropData));
}

// --- Internal Update Functions ---

function updateTab(category, state) {
  const { cropData, tabs, viewMode, searchBox, sortSelect, activeTags } = state;

  const container = tabs[category];
  container.innerHTML = "";
  container.className = `tab-content ${viewMode}`;

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
    const matches = btn.textContent.toLowerCase().startsWith(currentTab);
    btn.classList.toggle("active", matches);
  });
}

// // displayCropsUI.js
// import { createElement } from "../../../components/createElement";
// import { navigate } from "../../../routes";
// import { SRC_URL } from "../../../api/api";
// import {cropAside} from "./cropAside.js";

// // export function renderCropInterface(container, cropData, tagFilters) {
// export function renderCropInterface(container, cropData) {
//   let activeTags = new Set();
//   let viewMode = "grid";

//   container.innerHTML = "";
//   const layout = createElement("div", { class: "catalogue-layout" });
//   const main = createElement("main", { class: "catalogue-main" });
//   const aside = createElement("aside", { class: "catalogue-aside" });
//   layout.append(main, aside);
//   container.appendChild(layout);

//   const searchBox = createElement("input", {
//     type: "text",
//     placeholder: "Search crops…",
//     class: "search-box"
//   });

//   const sortSelect = createElement("select", { class: "sort-box" }, [
//     createElement("option", { value: "az" }, ["A → Z"]),
//     createElement("option", { value: "za" }, ["Z → A"])
//   ]);

//   const viewToggle = createElement("div", { class: "view-toggle" });
//   const gridBtn = createElement("button", {}, ["🔲 Grid"]);
//   const listBtn = createElement("button", {}, ["📃 List"]);
//   viewToggle.append(gridBtn, listBtn);

//   gridBtn.onclick = () => {
//     viewMode = "grid";
//     gridBtn.classList.add("active");
//     listBtn.classList.remove("active");
//     updateAllTabs();
//   };

//   listBtn.onclick = () => {
//     viewMode = "list";
//     listBtn.classList.add("active");
//     gridBtn.classList.remove("active");
//     updateAllTabs();
//   };
//   gridBtn.classList.add("active"); // default

//   const controls = createElement("div", { class: "top-controls" }, [
//     searchBox,
//     sortSelect,
//     viewToggle
//   ]);

//   // const tagChips = createElement("div", { class: "tag-filters" });
//   // tagFilters.forEach(tag => {
//   //   const chip = createElement("button", { class: "tag-chip" }, [tag]);
//   //   chip.onclick = () => {
//   //     chip.classList.toggle("active");
//   //     chip.classList.contains("active")
//   //       ? activeTags.add(tag)
//   //       : activeTags.delete(tag);
//   //     updateAllTabs();
//   //   };
//   //   tagChips.appendChild(chip);
//   // });

//   // main.append(controls, tagChips);
//   main.append(controls);

//   const tabButtons = createElement("div", { class: "tabs" });
//   const tabsWrapper = createElement("div", { id: "catalogue-container" });
//   main.append(tabButtons, tabsWrapper);

//   const categories = Object.keys(cropData);
//   const tabs = {};
//   let currentTab = categories[0];

//   categories.forEach((cat, i) => {
//     const btn = createElement("button", {}, [
//       `${cat.charAt(0).toUpperCase() + cat.slice(1)} (${cropData[cat].length})`
//     ]);
//     btn.onclick = () => {
//       currentTab = cat;
//       showTab(cat);
//       updateTab(cat);
//     };
//     if (i === 0) btn.classList.add("active");
//     tabButtons.appendChild(btn);

//     const pane = createElement("div", {
//       class: `tab-content ${viewMode}`,
//       id: cat,
//       style: `display: ${i === 0 ? "grid" : "none"}`
//     });
//     tabs[cat] = pane;
//     tabsWrapper.appendChild(pane);
//   });

//   function updateTab(category) {
//     const crops = cropData[category] || [];
//     const term = searchBox.value.trim().toLowerCase();
//     const sortBy = sortSelect.value;
//     const container = tabs[category];
//     container.innerHTML = "";
//     container.className = `tab-content ${viewMode}`;

//     let visible = crops.filter(c =>
//       c.name.toLowerCase().includes(term) &&
//       [...activeTags].every(t => c.tags.includes(t))
//     );

//     visible.sort((a, b) =>
//       sortBy === "az"
//         ? a.name.localeCompare(b.name)
//         : b.name.localeCompare(a.name)
//     );

//     visible.forEach(c => container.appendChild(renderCropCard(c, viewMode)));
//   }

//   function updateAllTabs() {
//     categories.forEach(cat => {
//       updateTab(cat);
//       tabs[cat].style.display = cat === currentTab ? "grid" : "none";
//     });
//     Array.from(tabButtons.children).forEach(btn => {
//       btn.classList.toggle("active", btn.textContent.toLowerCase().startsWith(currentTab));
//     });
//   }

//   function showTab(cat) {
//     categories.forEach(c => {
//       tabs[c].style.display = c === cat ? "grid" : "none";
//     });
//     Array.from(tabButtons.children).forEach(btn =>
//       btn.classList.toggle("active", btn.textContent.toLowerCase().startsWith(cat))
//     );
//   }

//   function renderCropCard(crop, mode) {
//     const isList = mode === "list";
  
//     const card = createElement("div", {
//       class: `crop-card ${mode}` // assumes you have CSS for .grid and .list styles
//     });
  
//     // const img = createElement("img", {
//     //   src: `${SRC_URL}/uploads/generic/${crop.category}/${crop.name}.png`,
//     //   alt: crop.name,
//     //   loading: "lazy"
//     // });

//     const formattedName = crop.name.toLowerCase().replace(/\s+/g, "_");

//     const img = createElement("img", {
//       src: `${SRC_URL}/uploads/generic/${crop.category}/${formattedName}.png`,
//       alt: crop.name,
//       loading: "lazy"
//     });
    
//     const content = createElement("div", { class: "crop-content" });
  
//     const title = createElement("h4", {}, [crop.name]);
//     const info = createElement("p", { class: "crop-info" }, [
//       `₹${crop.minPrice} - ₹${crop.maxPrice} per ${crop.unit} • ${crop.availableCount} listings`
//     ]);
  
//     const seasonal = createElement(
//       "p",
//       {
//         class: `season-indicator ${isSeasonal(crop) ? "in-season" : "off-season"}`
//       },
//       [isSeasonal(crop) ? "🟢 In Season" : "🔴 Off Season"]
//     );
  
//     const tags = createElement("div", { class: "tag-wrap" });
//     crop.tags.forEach(t => {
//       tags.appendChild(createElement("span", { class: "tag-pill" }, [t]));
//     });
  
//     const btn = createElement("button", {}, ["View Farms"]);
//     // btn.onclick = () => navigate(`/crop/${crop.name.toLowerCase()}`);
//     btn.onclick = () => navigate(`/crop/${formattedName}`);
  
//     // content.append(title, info, seasonal, tags, btn);
//     content.append(title, info, seasonal, tags);
  
//     if (isList) {
//       card.append(img, content, btn); // image on the side
//     } else {
//       card.append(img, title, info, seasonal, tags, btn); // stacked layout
//     }
  
//     return card;
//   }
  
//   function isSeasonal(crop) {
//     const now = new Date().getMonth() + 1;
//     return crop.seasonMonths.includes(now);
//   }

//   // render initial state
//   updateAllTabs();

//   // sidebar content (unchanged)
//   aside.append(cropAside(cropData));
// }
