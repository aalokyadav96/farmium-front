import { SEARCH_URL } from "../../state/state.js";
import Notify from "../../components/ui/Notify.mjs";
import { createTabs } from "../../components/ui/createTabs.js";
import { createElement } from "../../components/createElement.js";
import { resolveImagePath, EntityType, PictureType } from "../../utils/imagePaths.js";

let currentTab = "all"; // Tracks active tab

export async function displaySearchForm(container) {
  while (container.firstChild) container.removeChild(container.firstChild);

  const searchContainer = createElement("div", { class: "search-container" });

  // --- Search Bar
  const searchBar = createElement("div", { class: "d3" });

  const searchInput = createElement("input", {
    id: "search-query",
    placeholder: "Search anything...",
    required: true,
    class: "search-field",
  });

  const searchButton = createElement("button", {
    id: "search-button",
    class: "search-btn",
  }, [
    createElement("svg", {
      class: "srchicon",
      viewBox: "0 0 24 24",
      width: "100%",
      height: "100%",
      role: "img",
      stroke: "#000000"
    }, [
      createElement("circle", { cx: "11", cy: "11", r: "8" }),
      createElement("line", { x1: "21", y1: "21", x2: "16.65", y2: "16.65" })
    ])
  ]);

  const autocompleteList = createElement("ul", {
    id: "autocomplete-list",
    class: "autocomplete-list"
  });

  searchBar.appendChild(searchInput);
  searchBar.appendChild(searchButton);

  // --- Tabs
  const tabs = [
    { id: "all", title: "All", render: () => { } },
    { id: "events", title: "Events", render: () => { } },
    { id: "places", title: "Places", render: () => { } },
    { id: "feedposts", title: "Social", render: () => { } },
    { id: "merch", title: "Merch", render: () => { } },
    { id: "blogposts", title: "Posts", render: () => { } },
    { id: "farms", title: "Farms", render: () => { } },
    { id: "songs", title: "Songs", render: () => { } },
    { id: "users", title: "Users", render: () => { } },
    { id: "recipes", title: "Recipes", render: () => { } },
    { id: "products", title: "Products", render: () => { } },
    { id: "menu", title: "Menu", render: () => { } },
    { id: "media", title: "Media", render: () => { } },
    { id: "crops", title: "Crops", render: () => { } },
    { id: "baitoworkers", title: "Workers", render: () => { } },
    { id: "baitos", title: "Baitos", render: () => { } },
    { id: "artists", title: "Artists", render: () => { } },
  ];

  const tabsUI = createTabs(tabs, "search-tabs", "all", (tabId) => {
    currentTab = tabId;
    const query = document.getElementById("search-query").value.trim();
    if (query) fetchSearchResults();
  });

  const tabContainer = createElement("div", { class: "R6-Wf" }, [tabsUI]);

  // --- Results container
  const resultsContainer = createElement("div", {
    id: "search-results",
    class: "hvflex"
  });

  // --- Append structure
  searchContainer.appendChild(searchBar);
  searchContainer.appendChild(autocompleteList);
  searchContainer.appendChild(tabContainer);
  searchContainer.appendChild(resultsContainer);
  container.appendChild(searchContainer);

  // --- Listeners
  searchButton.addEventListener("click", fetchSearchResults);
  searchInput.addEventListener("input", handleAutocomplete);
  searchInput.addEventListener("keydown", handleKeyboardNavigation);
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const query = searchInput.value.trim();
      if (query) fetchSearchResults();
      autocompleteList.textContent = ""; // clear suggestions
    }
  });

  document.addEventListener("click", (e) => {
    if (!searchContainer.contains(e.target)) {
      autocompleteList.textContent = "";
    }
  });
}

// --- Autocomplete logic
async function handleAutocomplete(event) {
  const query = event.target.value.trim();
  const autocompleteList = document.getElementById("autocomplete-list");

  autocompleteList.textContent = "";
  if (!query) return;

  try {
    const response = await fetch(`${SEARCH_URL}/ac?prefix=${encodeURIComponent(query)}`);
    const suggestions = await response.json();

    suggestions.forEach((suggestion) => {
      const li = createElement("li", { class: "autocomplete-item" }, [suggestion]);
      li.addEventListener("click", () => {
        document.getElementById("search-query").value = suggestion;
        autocompleteList.textContent = "";
        fetchSearchResults();
      });
      autocompleteList.appendChild(li);
    });
  } catch (err) {
    console.error("Autocomplete error:", err);
  }
}

function handleKeyboardNavigation(event) {
  const autocompleteList = document.getElementById("autocomplete-list");
  const items = autocompleteList.querySelectorAll(".autocomplete-item");
  if (!items.length) return;

  let index = Array.from(items).findIndex((item) => item.classList.contains("selected"));

  if (event.key === "ArrowDown") {
    index = (index + 1) % items.length;
  } else if (event.key === "ArrowUp") {
    index = (index - 1 + items.length) % items.length;
  } else if (event.key === "Enter") {
    if (index >= 0) {
      items[index].click();
      event.preventDefault();
    }
    return;
  } else {
    return;
  }

  items.forEach((item) => item.classList.remove("selected"));
  if (index >= 0) items[index].classList.add("selected");
}

// --- Fetch wrapper
async function apiFetch(endpoint) {
  try {
    const response = await fetch(endpoint);
    if (!response.ok) throw new Error("Failed to fetch");
    const text = await response.text();
    return text ? JSON.parse(text) : [];
  } catch (err) {
    Notify(`API Fetch Error: ${err}`, { type: "error", duration: 3000 });
    return [];
  }
}

// --- Search request
async function fetchSearchResults() {
  const query = document.getElementById("search-query").value.trim();
  if (!query) {
    Notify("Please enter a search query.", { type: "info", duration: 3000 });
    return;
  }

  try {
    const url = `${SEARCH_URL}/search/${currentTab}?query=${encodeURIComponent(query)}`;
    const results = await apiFetch(url);
    displaySearchResults(currentTab, results);
  } catch (err) {
    Notify("Error fetching search results.", { type: "error", duration: 3000 });
  }
}

// --- Render results
function displaySearchResults(entityType, data) {
  const container = document.getElementById("search-results");
  container.textContent = "";

  if (entityType === "all" && typeof data === "object" && !Array.isArray(data)) {
    const keys = Object.keys(data);
    let hasResults = false;

    keys.forEach((key) => {
      if (Array.isArray(data[key]) && data[key].length) {
        hasResults = true;
        container.appendChild(createElement("h2", {}, [capitalizeFirstLetter(key)]));
        data[key].forEach((item) => container.appendChild(createCard(key, item)));
      }
    });

    if (!hasResults) {
      container.appendChild(createElement("p", {}, ["No results found."]));
    }
  } else if (Array.isArray(data)) {
    if (!data.length) {
      container.appendChild(createElement("p", {}, ["No results found."]));
      return;
    }
    data.forEach((item) => container.appendChild(createCard(entityType, item)));
  } else {
    container.appendChild(createElement("p", {}, ["No results found."]));
  }
}

function createCard(entityType, item) {
  const card = createElement("div", { class: `result-card ${entityType}` });

  // Header with image and title
  const header = createElement("div", { class: "result-header" });

  if (item.image) {
    header.appendChild(
      createElement("img", {
        src: resolveImagePath(EntityType[entityType.toUpperCase()] || EntityType.EVENT, PictureType.THUMB, `${item.image}.jpg`),
        alt: item.title || entityType,
        loading: "lazy",
        class: "result-image"
      })
    );
  }

  const info = createElement("div", { class: "result-info" }, [
    createElement("h3", {}, [item.title || "No Title"])
  ]);
  header.appendChild(info);
  card.appendChild(header);

  // Details
  const details = createElement("div", { class: "result-details" }, [
    createElement("em", {}, [item.description || "No description available."])
  ]);
  card.appendChild(details);

  // Footer with link to detail page
  const footer = createElement("div", { class: "result-footer" });
  if (item.id) {
    footer.appendChild(
      createElement("a", {
        href: `/${entityType}/${item.id}`,
        class: "btn",
        target: "_blank"
      }, ["View Details"])
    );
  }
  if (footer.children.length) card.appendChild(footer);

  return card;
}

function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export { displaySearchForm as displaySearch };

// import { SEARCH_URL, API_URL } from "../../state/state.js";
// import Notify from "../../components/ui/Notify.mjs";
// import { createTabs } from "../../components/ui/createTabs.js";
// import { createElement } from "../../components/createElement.js";
// import { resolveImagePath, EntityType, PictureType } from "../../utils/imagePaths.js";

// let currentTab = "all"; // Tracks active tab

// export async function displaySearchForm(container) {
//   container.innerHTML = "";

//   const searchContainer = createElement("div", { class: "search-container" });

//   // --- Search Bar
//   const searchBar = createElement("div", { class: "d3" });

//   const searchInput = createElement("input", {
//     id: "search-query",
//     placeholder: "Search anything...",
//     required: true,
//     class: "search-field",
//   });

//   const searchButton = document.createElement("button");
//   searchButton.id = "search-button";
//   searchButton.classList.add("search-btn");
//   searchButton.innerHTML = `
//     <svg class="srchicon" viewBox="0 0 24 24" width="100%" height="100%" role="img" stroke="#000000">
//       <circle cx="11" cy="11" r="8"></circle>
//       <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
//     </svg>`;

//   const autocompleteList = createElement("ul", {
//     id: "autocomplete-list",
//     class: "autocomplete-list"
//   });

//   searchBar.appendChild(searchInput);
//   searchBar.appendChild(searchButton);

//   // --- Tabs
//   const tabs = [
//     { id: "all", title: "All", render: () => { } },
//     { id: "events", title: "Events", render: () => { } },
//     { id: "places", title: "Places", render: () => { } },
//     { id: "feedposts", title: "Social", render: () => { } },
//     { id: "merch", title: "Merch", render: () => { } },
//     { id: "blogposts", title: "Posts", render: () => { } },
//     { id: "farms", title: "Farms", render: () => { } },
//     { id: "songs", title: "Songs", render: () => { } },
//     { id: "users", title: "Users", render: () => { } },
//     { id: "recipes", title: "Recipes", render: () => { } },
//     { id: "products", title: "Products", render: () => { } },
//     { id: "menu", title: "Menu", render: () => { } },
//     { id: "media", title: "Media", render: () => { } },
//     { id: "crops", title: "Crops", render: () => { } },
//     { id: "baitoworkers", title: "Workers", render: () => { } },
//     { id: "baitos", title: "Baitos", render: () => { } },
//     { id: "artists", title: "Artists", render: () => { } },
//   ];


//   const tabsUI = createTabs(tabs, "search-tabs", "all", (tabId) => {
//     currentTab = tabId;
//     const query = document.getElementById("search-query").value.trim();
//     if (query) fetchSearchResults();
//   });

//   const tabContainer = createElement("div", { class: "R6-Wf" }, [tabsUI]);

//   // --- Results container
//   const resultsContainer = createElement("div", {
//     id: "search-results",
//     class: "hvflex"
//   });

//   // --- Append structure
//   searchContainer.appendChild(searchBar);
//   searchContainer.appendChild(autocompleteList);
//   searchContainer.appendChild(tabContainer);
//   searchContainer.appendChild(resultsContainer);
//   container.appendChild(searchContainer);

//   // --- Listeners
//   searchButton.addEventListener("click", fetchSearchResults);
//   searchInput.addEventListener("input", handleAutocomplete);
//   searchInput.addEventListener("keydown", handleKeyboardNavigation);
//   document.addEventListener("click", (e) => {
//     if (!searchContainer.contains(e.target)) {
//       autocompleteList.innerHTML = "";
//     }
//   });
// }

// // --- Autocomplete logic
// async function handleAutocomplete(event) {
//   const query = event.target.value.trim();
//   const autocompleteList = document.getElementById("autocomplete-list");

//   if (!query) {
//     autocompleteList.innerHTML = "";
//     return;
//   }

//   try {
//     const response = await fetch(`${SEARCH_URL}/ac?prefix=${encodeURIComponent(query)}`);
//     const suggestions = await response.json();

//     autocompleteList.innerHTML = "";
//     suggestions.forEach((suggestion) => {
//       const li = document.createElement("li");
//       li.classList.add("autocomplete-item");
//       li.textContent = suggestion;
//       li.addEventListener("click", () => {
//         document.getElementById("search-query").value = suggestion;
//         autocompleteList.innerHTML = "";
//         fetchSearchResults();
//       });
//       autocompleteList.appendChild(li);
//     });
//   } catch (err) {
//     console.error("Autocomplete error:", err);
//   }
// }

// function handleKeyboardNavigation(event) {
//   const autocompleteList = document.getElementById("autocomplete-list");
//   const items = autocompleteList.querySelectorAll(".autocomplete-item");

//   if (!items.length) return;

//   let index = Array.from(items).findIndex((item) => item.classList.contains("selected"));

//   if (event.key === "ArrowDown") {
//     index = (index + 1) % items.length;
//   } else if (event.key === "ArrowUp") {
//     index = (index - 1 + items.length) % items.length;
//   } else if (event.key === "Enter") {
//     if (index >= 0) {
//       items[index].click();
//       event.preventDefault();
//     }
//     return;
//   } else {
//     return;
//   }

//   items.forEach((item) => item.classList.remove("selected"));
//   if (index >= 0) items[index].classList.add("selected");
// }

// // --- Fetch wrapper
// async function apiFetch(endpoint) {
//   try {
//     const response = await fetch(endpoint);
//     if (!response.ok) throw new Error("Failed to fetch");
//     const text = await response.text();
//     return text ? JSON.parse(text) : [];
//   } catch (err) {
//     Notify(`API Fetch Error: ${err}`, { type: "error", duration: 3000 });
//     return [];
//   }
// }

// // --- Search request
// async function fetchSearchResults() {
//   const query = document.getElementById("search-query").value.trim();
//   if (!query) {
//     Notify("Please enter a search query.", { type: "info", duration: 3000 });
//     return;
//   }

//   try {
//     const url = `${SEARCH_URL}/search/${currentTab}?query=${encodeURIComponent(query)}`;
//     const results = await apiFetch(url);
//     displaySearchResults(currentTab, results);
//   } catch (err) {
//     Notify("Error fetching search results.", { type: "error", duration: 3000 });
//   }
// }

// // --- Render results
// function displaySearchResults(entityType, data) {
//   const container = document.getElementById("search-results");
//   container.innerHTML = "";

//   if (entityType === "all" && typeof data === "object" && !Array.isArray(data)) {
//     if (data.events?.length) {
//       container.appendChild(createElement("h2", {}, ["Events"]));
//       data.events.forEach((item) => container.appendChild(createCard("events", item)));
//     }
//     if (data.places?.length) {
//       container.appendChild(createElement("h2", {}, ["Places"]));
//       data.places.forEach((item) => container.appendChild(createCard("places", item)));
//     }
//     if ((!data.events?.length) && (!data.places?.length)) {
//       container.innerHTML = "<p>No results found.</p>";
//     }
//   } else if (Array.isArray(data)) {
//     if (!data.length) {
//       container.innerHTML = "<p>No results found.</p>";
//       return;
//     }
//     data.forEach((item) => container.appendChild(createCard(entityType, item)));
//   } else {
//     container.innerHTML = "<p>No results found.</p>";
//   }
// }

// function createCard(entityType, item) {
//   const card = createElement("div", { class: `result-card ${entityType}` });

//   // Header with image and title
//   const header = createElement("div", { class: "result-header" });

//   if (item.image) {
//     header.appendChild(
//       createElement("img", {
//         src: resolveImagePath(EntityType.EVENT, PictureType.THUMB, `${item.image}.jpg`),
//         alt: item.title || entityType,
//         loading: "lazy",
//         class: "result-image"
//       })
//     );
//   }

//   const info = createElement("div", { class: "result-info" }, [
//     createElement("h3", {}, [item.title || "No Title"])
//   ]);
//   header.appendChild(info);
//   card.appendChild(header);

//   // Details
//   const details = createElement("div", { class: "result-details" }, [
//     createElement("em", {}, [item.description || "No description available."])
//   ]);
//   card.appendChild(details);

//   // Footer with link to detail page
//   const footer = createElement("div", { class: "result-footer" });
//   if (item.id) {
//     footer.appendChild(
//       createElement("a", {
//         href: `/${entityType}/${item.id}`,
//         class: "btn",
//         target: "_blank"
//       }, ["View Details"])
//     );
//   }
//   if (footer.children.length) card.appendChild(footer);

//   return card;
// }

// export { displaySearchForm as displaySearch };